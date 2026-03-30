import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

const GATEWAY_URL = 'wss://gw.angelinvesting.it';
const GATEWAY_TOKEN = '1f8ec4f3ea80632d483deab6d294ea8510684868affdea60';

const AGENTS = [
  { id: 'receptionist', name: 'Receptionist', emoji: '🛎️', color: '#10B981' },
];

// Slash command definitions — re-enable one at a time as we rethink each
const SLASH_COMMANDS = {
  '/reply-all-draft': 'reply-all-draft',
  '/reply-to-draft': 'reply-to-draft',
  '/reply-all-send': 'reply-all-send',
  '/reply-to-send': 'reply-to-send',
  '/what-in-calendar': 'what-in-calendar',
  '/create-event': 'create-event',
  '/create-event-invite': 'create-event-invite',
  '/create-task': 'create-task',
  '/associate-task': 'associate-task',
  '/list-tasks': 'list-tasks',
  '/complete-task': 'complete-task',
  '/register-decision': 'register-decision',
  '/accept-invitation': 'accept-invitation',
  '/track-intro-promised': 'track-intro-promised',
  '/list-related-deals': 'list-related-deals',
  '/change-deal-stage': 'change-deal-stage',
  '/create-deal-from-message': 'create-deal-from-message',
  '/create-deal-from-input': 'create-deal-from-input',
  '/create-contact': 'create-contact',
  '/pay': 'pay',
  '/search-flights': 'search-flights',
  '/search-amazon': 'search-amazon',
  '/search-web': 'search-web',
  '/search-news': 'search-news',
};

function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  a[6] = (a[6] & 0x0f) | 0x40;
  a[8] = (a[8] & 0x3f) | 0x80;
  const h = [...a].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function extractText(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('');
  }
  if (typeof content.text === 'string') return content.text;
  return '';
}

// Check if a message is internal/system noise that shouldn't be shown
function isVisibleMessage(msg) {
  const text = extractText(msg.content);
  if (!text || !text.trim()) return false;
  const trimmed = text.trim();
  // Skip internal markers
  if (trimmed === 'NO_REPLY' || trimmed === 'HEARTBEAT_OK') return false;
  // USER messages: only show those from CRM frontend (have [CRM Context:])
  if (msg.role === 'user') {
    // Show CRM user messages (strip the context prefix for display)
    if (trimmed.includes('[CRM Context:')) return true;
    // Hide everything else (Slack, system events, heartbeats, queued messages)
    return false;
  }
  // ASSISTANT messages: skip those that are only tool calls (no text)
  if (msg.role === 'assistant' && Array.isArray(msg.content)) {
    const hasText = msg.content.some(p => p.type === 'text' && p.text && p.text.trim() && p.text.trim() !== 'NO_REPLY' && p.text.trim() !== 'HEARTBEAT_OK');
    if (!hasText) return false;
  }
  return true;
}

// Extract only user-facing text from content (skip thinking, tool output)
function extractCleanText(content, role) {
  if (!content) return '';
  let text = '';
  if (typeof content === 'string') {
    text = content;
  } else if (Array.isArray(content)) {
    text = content
      .filter(p => p.type === 'text' && p.text && p.text.trim() !== 'NO_REPLY' && p.text.trim() !== 'HEARTBEAT_OK')
      .map(p => p.text)
      .join('\n')
      .trim();
  } else if (typeof content.text === 'string') {
    text = content.text;
  }
  // Strip [CRM Context: ...] prefix from user messages
  if (role === 'user') {
    text = text.replace(/^\[CRM Context:[^\]]*\]\s*/g, '').trim();
  }
  return text;
}

// Parse slash command or structured prompt from message text
function parseSlashCommand(text) {
  const trimmed = text.trim();

  // Detect structured prompts (from command palette)
  const requestMatch = trimmed.match(/Richiesta:\s*(.+)/m);
  if (requestMatch) {
    const req = requestMatch[1].toLowerCase();
    if (req.includes('contatto') || req.includes('scheda')) return { type: 'crm', description: trimmed };
    if (req.includes('intro')) return { type: 'intro', description: trimmed };
    if (req.includes('deal')) return { type: 'deal', description: trimmed };
    if (req.includes('evento') || req.includes('calendario')) return { type: 'calendar', description: trimmed };
    if (req.includes('task')) return { type: 'task', description: trimmed };
    if (req.includes('nota')) return { type: 'note', description: trimmed };
    if (req.includes('email') || req.includes('bozza')) return { type: 'email', description: trimmed };
    if (req.includes('whatsapp') || req.includes('telefono') || req.includes('numero')) return { type: 'whatsapp', description: trimmed };
    if (req.includes('decisione')) return { type: 'decision', description: trimmed };
  }

  // Standard slash commands
  for (const [prefix, type] of Object.entries(SLASH_COMMANDS)) {
    if (trimmed.startsWith(prefix + ' ') || trimmed === prefix) {
      return { type, description: trimmed.slice(prefix.length).trim() || trimmed };
    }
  }
  return { type: 'freeform', description: trimmed };
}

// Build dynamic session key based on active tab + context item
function buildSessionKey(activeTab, contextId) {
  const tab = activeTab || 'general';
  if (contextId) return `agent:receptionist:${tab}:${contextId}`;
  return `agent:receptionist:${tab}`;
}

const MAX_RECENT_SESSIONS = 3;

const useAgentChat = (activeTab, contextId, contextLabel) => {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [streamText, setStreamText] = useState(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // All WS state in refs to avoid re-render dependency loops
  const wsRef = useRef(null);
  const pendingRef = useRef(new Map());
  const runIdRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const backoffRef = useRef(800);
  const closedRef = useRef(false);
  const connectedRef = useRef(false);
  const selectedAgentRef = useRef(selectedAgent);
  const mountedRef = useRef(false);
  const activeTabRef = useRef(activeTab);
  const contextIdRef = useRef(contextId);
  const contextLabelRef = useRef(contextLabel);
  const currentRequestIdRef = useRef(null);
  const draftModeRef = useRef(false);

  // Navigator state: recent sessions and override
  const [recentSessions, setRecentSessions] = useState([]);
  const [navigatorOverride, setNavigatorOverride] = useState(null);
  const navigatorIndexRef = useRef(-1); // -1 means "current item" (no override)
  const prevContextRef = useRef({ tab: activeTab, contextId, contextLabel });

  useEffect(() => { selectedAgentRef.current = selectedAgent; }, [selectedAgent]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { contextIdRef.current = contextId; }, [contextId]);
  useEffect(() => { contextLabelRef.current = contextLabel; }, [contextLabel]);

  // Effective values: override takes priority over props
  const effectiveTab = navigatorOverride?.tab ?? activeTab;
  const effectiveContextId = navigatorOverride?.contextId ?? contextId;
  const effectiveLabel = navigatorOverride?.label ?? contextLabel;

  // --- Load recent sessions from Supabase, filtered by current tab ---
  useEffect(() => {
    if (!activeTab) return;
    supabase
      .from('agent_chat_sessions')
      .select('*')
      .eq('tab', activeTab)
      .order('last_active', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setRecentSessions((data || []).map(r => ({
          tab: r.tab,
          contextId: r.context_id,
          label: r.label,
          lastActive: new Date(r.last_active).getTime(),
          sessionKey: r.session_key,
        })));
      });
  }, [activeTab]);

  // --- Helper: add/update a session in recentSessions + persist to Supabase ---
  function trackSession(tab, ctxId, label) {
    if (!ctxId) return;
    const sessionKey = buildSessionKey(tab, ctxId);
    const now = Date.now();
    // Update local state — only keep sessions for the same tab
    setRecentSessions(prev => {
      const sameTab = prev.filter(s => s.tab === tab && !(s.contextId === ctxId));
      const updated = [{ tab, contextId: ctxId, label: label || '', lastActive: now, sessionKey }, ...sameTab];
      return updated.slice(0, 3);
    });
    // Upsert to Supabase (fire-and-forget)
    supabase
      .from('agent_chat_sessions')
      .upsert({
        session_key: sessionKey,
        tab,
        context_id: ctxId,
        label: label || '',
        last_active: new Date(now).toISOString(),
      }, { onConflict: 'session_key' })
      .then(({ error: err }) => {
        if (err) console.error('[AgentChat] Failed to persist session:', err);
      });
  }

  // --- Low-level WS request ---
  function wsRequest(method, params) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Gateway not connected'));
    }
    const id = uuid();
    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });
      ws.send(JSON.stringify({ type: 'req', id, method, params }));
    });
  }

  // --- Load history ---
  function loadHistory(overrideTab, overrideContextId) {
    if (!connectedRef.current) return;
    const tab = overrideTab ?? activeTabRef.current;
    const ctxId = overrideContextId ?? contextIdRef.current;
    const sessionKey = buildSessionKey(tab, ctxId);
    setLoading(true);
    wsRequest('chat.history', { sessionKey, limit: 100 })
      .then(result => {
        if (Array.isArray(result?.messages)) {
          // Only show CRM conversations: CRM user messages + final assistant response
          const allMsgs = result.messages.filter(m => m.role === 'user' || m.role === 'assistant');
          const conversations = []; // [{user: msg, assistant: msg}]
          let currentCrmUser = null;
          let lastAssistantResponse = null;

          let crmBlockEnded = false; // true after a non-CRM user msg interrupts
          for (const m of allMsgs) {
            if (m.role === 'user') {
              const text = extractText(m.content);
              if (text && text.includes('[CRM Context:')) {
                // Save previous conversation pair if exists
                if (currentCrmUser && lastAssistantResponse) {
                  conversations.push({ user: currentCrmUser, assistant: lastAssistantResponse });
                } else if (currentCrmUser) {
                  conversations.push({ user: currentCrmUser });
                }
                currentCrmUser = m;
                lastAssistantResponse = null;
                crmBlockEnded = false;
              } else {
                // Non-CRM user message (Kevin/Slack/etc) — stop capturing assistant responses
                crmBlockEnded = true;
              }
            } else if (m.role === 'assistant' && currentCrmUser && !crmBlockEnded) {
              if (isVisibleMessage(m)) {
                lastAssistantResponse = m;
              }
            }
          }
          // Don't forget the last pair
          if (currentCrmUser) {
            if (lastAssistantResponse) {
              conversations.push({ user: currentCrmUser, assistant: lastAssistantResponse });
            } else {
              conversations.push({ user: currentCrmUser });
            }
          }

          const normalized = [];
          for (const conv of conversations) {
            const userText = extractCleanText(conv.user.content, 'user');
            if (userText) {
              normalized.push({
                id: conv.user.id || `hist-u-${normalized.length}`,
                role: 'user',
                content: userText,
                created_at: conv.user.timestamp ? new Date(conv.user.timestamp).toISOString() : new Date().toISOString(),
              });
            }
            if (conv.assistant) {
              const assistantText = extractCleanText(conv.assistant.content, 'assistant');
              if (assistantText) {
                normalized.push({
                  id: conv.assistant.id || `hist-a-${normalized.length}`,
                  role: 'assistant',
                  content: assistantText,
                  created_at: conv.assistant.timestamp ? new Date(conv.assistant.timestamp).toISOString() : new Date().toISOString(),
                });
              }
            }
          }
          setMessages(normalized);
        }
      })
      .catch(err => console.error('[AgentChat] History fetch failed:', err))
      .finally(() => setLoading(false));
  }

  // --- Save request to Supabase agent_requests ---
  async function saveAgentRequest(content, context, requestType) {
    try {
      const { data, error: insertError } = await supabase
        .from('agent_requests')
        .insert({
          requested_by: 'simone',
          request_type: requestType,
          description: content,
          context: {
            tab: context.type || activeTabRef.current,
            contactId: context.contactId || null,
            contextId: context.id || null,
            metadata: context.metadata || {},
          },
          assigned_to: 'receptionist',
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[AgentChat] Failed to save agent_request:', insertError);
        return null;
      }
      return data?.id || null;
    } catch (err) {
      console.error('[AgentChat] Failed to save agent_request:', err);
      return null;
    }
  }

  // --- Update agent_request with result ---
  async function updateAgentRequest(requestId, status, result) {
    if (!requestId) return;
    try {
      await supabase
        .from('agent_requests')
        .update({
          status,
          result,
          completed_at: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
        })
        .eq('id', requestId);
    } catch (err) {
      console.error('[AgentChat] Failed to update agent_request:', err);
    }
  }

  // --- Handle incoming WS message ---
  function handleWsMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'event') {
      if (msg.event === 'connect.challenge') {
        // Send connect
        wsRequest('connect', {
          minProtocol: 3,
          maxProtocol: 3,
          client: { id: 'openclaw-control-ui', version: '1.0.0', platform: 'web', mode: 'webchat' },
          role: 'operator',
          scopes: ['operator.read', 'operator.write'],
          caps: [],
          auth: { token: GATEWAY_TOKEN },
          userAgent: navigator.userAgent,
          locale: navigator.language,
        }).then(() => {
          backoffRef.current = 800;
          connectedRef.current = true;
          setConnected(true);
          setError(null);
          loadHistory();
        }).catch(err => {
          console.error('[AgentChat] Connect failed:', err);
          setError(String(err.message || err));
          wsRef.current?.close(4008, 'connect failed');
        });
        return;
      }

      if (msg.event === 'chat') {
        const p = msg.payload;
        if (!p) return;
        if (p.state === 'delta') {
          const text = extractText(p.message?.content || p.message);
          if (text != null) {
            setStreamText(prev => (!prev || text.length >= prev.length) ? text : prev);
          }
        } else if (p.state === 'final') {
          const finalText = extractText(p.message?.content || p.message);
          if (currentRequestIdRef.current) {
            updateAgentRequest(currentRequestIdRef.current, 'completed', finalText || '');
            currentRequestIdRef.current = null;
          }
          // Track session now — a real conversation happened
          const effCtxId = navigatorOverride?.contextId ?? contextIdRef.current;
          const effTab = navigatorOverride?.tab ?? activeTabRef.current;
          if (effCtxId) {
            trackSession(effTab, effCtxId, navigatorOverride?.label ?? contextLabelRef.current);
          }
          setStreamText(null);
          runIdRef.current = null;
          setSending(false);
          if (draftModeRef.current === 'post-accept') {
            draftModeRef.current = false;
            setMessages(prev => [...prev, {
              id: uuid(),
              role: 'assistant',
              content: finalText,
              created_at: new Date().toISOString(),
              isPostSend: true,
              postActionType: 'calendar-accept',
            }]);
          } else if (draftModeRef.current === 'post-send') {
            draftModeRef.current = false;
            setMessages(prev => [...prev, {
              id: uuid(),
              role: 'assistant',
              content: finalText,
              created_at: new Date().toISOString(),
              isPostSend: true,
            }]);
          } else if (draftModeRef.current) {
            const draftType = draftModeRef.current; // 'reply-all' or 'reply-to'
            draftModeRef.current = false;
            setMessages(prev => [...prev, {
              id: uuid(),
              role: 'assistant',
              content: finalText,
              created_at: new Date().toISOString(),
              isDraft: true,
              draftType,
            }]);
          } else {
            loadHistory();
          }
        } else if (p.state === 'aborted' || p.state === 'error') {
          // Update agent_request with failure
          if (currentRequestIdRef.current) {
            updateAgentRequest(currentRequestIdRef.current, 'failed', p.errorMessage || 'Aborted');
            currentRequestIdRef.current = null;
          }
          draftModeRef.current = false;
          setStreamText(null);
          runIdRef.current = null;
          setSending(false);
          if (p.state === 'error') setError(p.errorMessage || 'Chat error');
        }
      }
      return;
    }

    if (msg.type === 'res') {
      const p = pendingRef.current.get(msg.id);
      if (!p) return;
      pendingRef.current.delete(msg.id);
      if (msg.ok) p.resolve(msg.payload);
      else p.reject(new Error(msg.error?.message || 'Request failed'));
    }
  }

  // --- Single WebSocket lifecycle ---
  useEffect(() => {
    if (mountedRef.current) return; // Prevent double-mount in StrictMode
    mountedRef.current = true;
    closedRef.current = false;

    function doConnect() {
      if (closedRef.current) return;
      console.log('[AgentChat] Connecting to', GATEWAY_URL);

      const ws = new WebSocket(GATEWAY_URL);
      wsRef.current = ws;

      ws.onmessage = (e) => handleWsMessage(String(e.data || ''));

      ws.onclose = (e) => {
        wsRef.current = null;
        connectedRef.current = false;
        setConnected(false);
        // Reject pending requests
        for (const [, p] of pendingRef.current) p.reject(new Error('Disconnected'));
        pendingRef.current.clear();
        // Reconnect with backoff
        if (!closedRef.current) {
          const delay = backoffRef.current;
          backoffRef.current = Math.min(backoffRef.current * 1.7, 15000);
          reconnectTimerRef.current = setTimeout(doConnect, delay);
        }
      };

      ws.onerror = () => {};
    }

    doConnect();

    return () => {
      closedRef.current = true;
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on cleanup
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // Empty deps — runs once

  // Reload history when agent changes
  useEffect(() => {
    if (connectedRef.current) {
      setMessages([]);
      setStreamText(null);
      setError(null);
      loadHistory();
    }
  }, [selectedAgent]);

  // Reload history when activeTab or contextId changes (contextual sessions)
  useEffect(() => {
    if (connectedRef.current) {
      // Track the session we're LEAVING using prevContextRef (immune to effect ordering)
      const prev = prevContextRef.current;
      if (prev.contextId && (prev.tab !== activeTab || prev.contextId !== contextId)) {
        trackSession(prev.tab, prev.contextId, prev.contextLabel);
      }
      setNavigatorOverride(null);
      navigatorIndexRef.current = -1;
      setMessages([]);
      setStreamText(null);
      setError(null);
      loadHistory(activeTab, contextId);
    }
    prevContextRef.current = { tab: activeTab, contextId, contextLabel };
  }, [activeTab, contextId]);

  // Scroll to bottom — instant on load, smooth on new messages
  const chatContainerRef = useRef(null);
  useEffect(() => {
    // Small delay to ensure DOM has rendered
    const t = setTimeout(() => {
      const container = chatContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
    return () => clearTimeout(t);
  }, [messages]);

  // --- Send message ---
  const sendMessage = useCallback(async (content, context = {}, displayText = null) => {
    if (!content.trim()) return;
    // Use effective (override-aware) session key
    const effTab = navigatorOverride?.tab ?? activeTabRef.current;
    const effCtxId = navigatorOverride?.contextId ?? contextIdRef.current;
    const sessionKey = buildSessionKey(effTab, effCtxId);
    if (!connectedRef.current) {
      setError('Not connected');
      return;
    }

    const idempotencyKey = uuid();

    // Parse slash command for request type
    const { type: requestType } = parseSlashCommand(content);

    if (requestType === 'reply-all-draft') {
      draftModeRef.current = 'reply-all';
    } else if (requestType === 'reply-to-draft') {
      draftModeRef.current = 'reply-to';
    } else if (requestType === 'reply-all-send' || requestType === 'reply-to-send') {
      draftModeRef.current = 'post-send';
    } else if (requestType === 'accept-invitation') {
      draftModeRef.current = 'post-accept';
    }

    let fullMessage = content.trim();
    const ctxParts = [];
    if (context.type) ctxParts.push(`Tab: ${context.type}`);
    if (context.metadata?.contactName) ctxParts.push(`Contact: ${context.metadata.contactName}`);
    if (context.contactId) ctxParts.push(`Contact ID: ${context.contactId}`);
    // Tab-specific context
    if (context.metadata?.emailSubject) ctxParts.push(`Email: "${context.metadata.emailSubject}"`);
    if (context.metadata?.emailInboxId) ctxParts.push(`Email Inbox ID: ${context.metadata.emailInboxId}`);
    if (context.metadata?.whatsappChat) ctxParts.push(`WhatsApp: ${context.metadata.whatsappChat}`);
    if (context.metadata?.calendarEvent) ctxParts.push(`Event: "${context.metadata.calendarEvent}"`);
    if (context.metadata?.dealName) ctxParts.push(`Deal: "${context.metadata.dealName}"`);
    if (context.metadata?.dealId) ctxParts.push(`Deal ID: ${context.metadata.dealId}`);
    if (ctxParts.length > 0) {
      fullMessage = `[CRM Context: ${ctxParts.join(' | ')}]\n\n${fullMessage}`;
    }

    setMessages(prev => [...prev, {
      id: idempotencyKey,
      role: 'user',
      content: content.trim(),
      displayText: displayText || null,
      created_at: new Date().toISOString(),
    }]);
    setInput('');
    setSending(true);
    setError(null);
    setStreamText('');
    runIdRef.current = idempotencyKey;

    // Save to agent_requests
    const requestId = await saveAgentRequest(content.trim(), context, requestType);
    currentRequestIdRef.current = requestId;

    // Update status to in_progress
    if (requestId) {
      updateAgentRequest(requestId, 'in_progress', null);
    }

    try {
      await wsRequest('chat.send', {
        sessionKey,
        message: fullMessage,
        deliver: false,
        idempotencyKey,
      });
    } catch (err) {
      console.error('[AgentChat] Send failed:', err);
      setError(String(err));
      setSending(false);
      runIdRef.current = null;
      // Update request as failed
      if (requestId) {
        updateAgentRequest(requestId, 'failed', String(err));
        currentRequestIdRef.current = null;
      }
      setMessages(prev => [...prev, {
        id: uuid(),
        role: 'assistant',
        content: 'Error: ' + String(err),
        created_at: new Date().toISOString(),
      }]);
    }
  }, []);

  // --- Abort ---
  const abort = useCallback(async () => {
    if (!connectedRef.current) return;
    const effTab = navigatorOverride?.tab ?? activeTabRef.current;
    const effCtxId = navigatorOverride?.contextId ?? contextIdRef.current;
    const sessionKey = buildSessionKey(effTab, effCtxId);
    try {
      await wsRequest('chat.abort', runIdRef.current
        ? { sessionKey, runId: runIdRef.current }
        : { sessionKey }
      );
    } catch (err) {
      console.error('[AgentChat] Abort failed:', err);
    }
  }, []);

  // --- Navigate to a specific recent session by index ---
  const navigateToSession = useCallback((_, idx) => {
    if (idx < 0 || idx >= recentSessions.length) return;
    const session = recentSessions[idx];
    navigatorIndexRef.current = idx;
    setNavigatorOverride({ tab: session.tab, contextId: session.contextId, label: session.label });
    setMessages([]);
    setStreamText(null);
    loadHistory(session.tab, session.contextId);
  }, [recentSessions]);

  // Reset navigator back to current item
  const resetNavigator = useCallback(() => {
    if (!navigatorOverride) return;
    navigatorIndexRef.current = -1;
    setNavigatorOverride(null);
    setMessages([]);
    setStreamText(null);
    loadHistory(activeTabRef.current, contextIdRef.current);
  }, [navigatorOverride]);

  const markDraftSent = useCallback((messageId) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isDraft: false, draftSent: true } : m
    ));
  }, []);

  const markPostSendAction = useCallback((messageId, action) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isPostSend: false, postSendAction: action } : m
    ));
  }, []);

  return {
    agents: AGENTS,
    selectedAgent,
    setSelectedAgent,
    messages,
    loading,
    sending,
    connected,
    streamText,
    error,
    input,
    setInput,
    sendMessage,
    abort,
    messagesEndRef,
    chatContainerRef,
    fetchMessages: loadHistory,
    activeTab,
    markDraftSent,
    markPostSendAction,
    // Navigator
    recentSessions,
    navigatorOverride,
    navigateToSession,
    resetNavigator,
    effectiveContextId,
    effectiveTab,
    effectiveLabel,
  };
};

export default useAgentChat;
