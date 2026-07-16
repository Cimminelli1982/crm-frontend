import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Receptionist now talks DIRECTLY to the Railway backend (SSE), not OpenClaw.
const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const AGENTS = [
  { id: 'receptionist', name: 'Receptionist', emoji: '🛎️', color: '#10B981' },
];

// Slash command definitions — used only to tag agent_requests by type.
const SLASH_COMMANDS = {
  '/reply-all-draft': 'reply-all-draft',
  '/reply-to-draft': 'reply-to-draft',
  '/reply-all-send': 'reply-all-send',
  '/reply-to-send': 'reply-to-send',
  '/reply-whatsapp-draft': 'reply-whatsapp-draft',
  '/send-whatsapp': 'send-whatsapp',
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

// Parse slash command or structured prompt from message text (for request typing)
function parseSlashCommand(text) {
  const trimmed = text.trim();

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

  // Refs to avoid re-render dependency loops
  const selectedAgentRef = useRef(selectedAgent);
  const activeTabRef = useRef(activeTab);
  const contextIdRef = useRef(contextId);
  const contextLabelRef = useRef(contextLabel);
  const messagesRef = useRef(messages);
  const abortRef = useRef(null);
  const currentRequestIdRef = useRef(null);
  const draftModeRef = useRef(false);

  // Navigator state: recent sessions and override
  const [recentSessions, setRecentSessions] = useState([]);
  const [navigatorOverride, setNavigatorOverride] = useState(null);
  const navigatorIndexRef = useRef(-1);
  const prevContextRef = useRef({ tab: activeTab, contextId, contextLabel });
  const navigatorOverrideRef = useRef(null);

  useEffect(() => { selectedAgentRef.current = selectedAgent; }, [selectedAgent]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { contextIdRef.current = contextId; }, [contextId]);
  useEffect(() => { contextLabelRef.current = contextLabel; }, [contextLabel]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { navigatorOverrideRef.current = navigatorOverride; }, [navigatorOverride]);

  // Effective values: override takes priority over props
  const effectiveContextId = navigatorOverride?.contextId ?? contextId;
  const effectiveTab = navigatorOverride?.tab ?? activeTab;
  const effectiveLabel = navigatorOverride?.label ?? contextLabel;

  // --- Connection = backend health (replaces WS handshake) ---
  useEffect(() => {
    let alive = true;
    const check = () => {
      fetch(`${BACKEND_URL}/health`)
        .then(r => { if (alive) setConnected(r.ok); })
        .catch(() => { if (alive) setConnected(false); });
    };
    check();
    const t = setInterval(check, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

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
    setRecentSessions(prev => {
      const sameTab = prev.filter(s => s.tab === tab && !(s.contextId === ctxId));
      const updated = [{ tab, contextId: ctxId, label: label || '', lastActive: now, sessionKey }, ...sameTab];
      return updated.slice(0, 3);
    });
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

  // --- Load history from agent_chat_messages (server-persisted turns) ---
  function loadHistory(overrideTab, overrideContextId) {
    const tab = overrideTab ?? activeTabRef.current;
    const ctxId = overrideContextId ?? contextIdRef.current;
    const sessionKey = buildSessionKey(tab, ctxId);
    setLoading(true);
    supabase
      .from('agent_chat_messages')
      .select('id, role, content, created_at, metadata')
      .eq('agent_id', 'receptionist')
      .filter('metadata->>sessionKey', 'eq', sessionKey)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        const normalized = (data || [])
          .filter(m => (m.role === 'user' || m.role === 'agent' || m.role === 'assistant') && m.content && m.content.trim())
          .map(m => ({
            id: m.id,
            role: m.role === 'agent' ? 'assistant' : m.role,
            content: m.content,
            created_at: m.created_at || new Date().toISOString(),
          }));
        setMessages(normalized);
      })
      .catch(err => console.error('[AgentChat] History fetch failed:', err))
      .finally(() => setLoading(false));
  }

  // --- Save request to Supabase agent_requests (audit log) ---
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

  // Reload history when agent changes
  useEffect(() => {
    setMessages([]);
    setStreamText(null);
    setError(null);
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent]);

  // Reload history when activeTab or contextId changes (contextual sessions)
  useEffect(() => {
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
    prevContextRef.current = { tab: activeTab, contextId, contextLabel };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, contextId]);

  // Scroll to bottom
  const chatContainerRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const container = chatContainerRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    }, 50);
    return () => clearTimeout(t);
  }, [messages, streamText]);

  // --- Commit the final assistant message (preserves draft/post-send UX) ---
  function commitFinal(finalText, requestId, effTab, effCtxId) {
    if (requestId) updateAgentRequest(requestId, 'completed', finalText || '');
    if (effCtxId) trackSession(effTab, effCtxId, navigatorOverrideRef.current?.label ?? contextLabelRef.current);

    const dm = draftModeRef.current;
    draftModeRef.current = false;
    const base = { id: uuid(), role: 'assistant', content: finalText, created_at: new Date().toISOString() };

    if (dm === 'post-accept') {
      setMessages(prev => [...prev, { ...base, isPostSend: true, postActionType: 'calendar-accept' }]);
    } else if (dm === 'post-send') {
      setMessages(prev => [...prev, { ...base, isPostSend: true }]);
    } else if (dm) {
      setMessages(prev => [...prev, { ...base, isDraft: true, draftType: dm }]);
    } else {
      setMessages(prev => [...prev, base]);
    }
  }

  // --- Send message (HTTP POST + SSE stream) ---
  const sendMessage = useCallback(async (content, context = {}, displayText = null) => {
    if (!content.trim()) return;
    const override = navigatorOverrideRef.current;
    const effTab = override?.tab ?? activeTabRef.current;
    const effCtxId = override?.contextId ?? contextIdRef.current;
    const sessionKey = buildSessionKey(effTab, effCtxId);

    const idempotencyKey = uuid();
    const { type: requestType } = parseSlashCommand(content);

    if (requestType === 'reply-all-draft') draftModeRef.current = 'reply-all';
    else if (requestType === 'reply-to-draft') draftModeRef.current = 'reply-to';
    else if (requestType === 'reply-whatsapp-draft') draftModeRef.current = 'whatsapp';
    else if (requestType === 'reply-all-send' || requestType === 'reply-to-send') draftModeRef.current = 'post-send';
    else if (requestType === 'accept-invitation') draftModeRef.current = 'post-accept';
    else draftModeRef.current = false;

    // Build message with [CRM Context: ...] prefix
    let fullMessage = content.trim();
    const ctxParts = [];
    if (context.type) ctxParts.push(`Tab: ${context.type}`);
    if (context.metadata?.contactName) ctxParts.push(`Contact: ${context.metadata.contactName}`);
    if (context.contactId) ctxParts.push(`Contact ID: ${context.contactId}`);
    if (context.metadata?.emailSubject) ctxParts.push(`Email: "${context.metadata.emailSubject}"`);
    if (context.metadata?.emailInboxId) ctxParts.push(`Email Inbox ID: ${context.metadata.emailInboxId}`);
    if (context.metadata?.whatsappChat) ctxParts.push(`WhatsApp: ${context.metadata.whatsappChat}`);
    if (context.type === 'whatsapp' && context.id) ctxParts.push(`WhatsApp chat id: ${context.id}`);
    if (context.metadata?.calendarEvent) ctxParts.push(`Event: "${context.metadata.calendarEvent}"`);
    if (context.metadata?.dealName) ctxParts.push(`Deal: "${context.metadata.dealName}"`);
    if (context.metadata?.dealId) ctxParts.push(`Deal ID: ${context.metadata.dealId}`);
    if (ctxParts.length > 0) {
      fullMessage = `[CRM Context: ${ctxParts.join(' | ')}]\n\n${fullMessage}`;
    }

    // Prior conversation as history (before this new user turn)
    const history = (messagesRef.current || [])
      .map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' }))
      .filter(m => m.content.trim());

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

    const requestId = await saveAgentRequest(content.trim(), context, requestType);
    currentRequestIdRef.current = requestId;
    if (requestId) updateAgentRequest(requestId, 'in_progress', null);

    const controller = new AbortController();
    abortRef.current = controller;
    let finalText = '';
    let streamed = '';

    try {
      const resp = await fetch(`${BACKEND_URL}/receptionist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey, message: fullMessage, history }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          const dataLine = part.split('\n').find(l => l.startsWith('data:'));
          if (!dataLine) continue;
          let evt;
          try { evt = JSON.parse(dataLine.slice(5).trim()); } catch { continue; }
          if (evt.type === 'delta') {
            streamed += evt.text || '';
            setStreamText(streamed);
          } else if (evt.type === 'tool') {
            // keep the thinking indicator; optionally could surface tool name
          } else if (evt.type === 'final') {
            finalText = (evt.text != null && evt.text !== '') ? evt.text : streamed;
          } else if (evt.type === 'error') {
            throw new Error(evt.message || 'Receptionist error');
          }
        }
      }

      commitFinal(finalText || streamed, requestId, effTab, effCtxId);
    } catch (err) {
      if (err.name === 'AbortError') {
        if (requestId) updateAgentRequest(requestId, 'failed', 'Aborted');
      } else {
        console.error('[AgentChat] Send failed:', err);
        setError(String(err.message || err));
        if (requestId) updateAgentRequest(requestId, 'failed', String(err.message || err));
        setMessages(prev => [...prev, {
          id: uuid(),
          role: 'assistant',
          content: 'Error: ' + String(err.message || err),
          created_at: new Date().toISOString(),
        }]);
      }
      draftModeRef.current = false;
    } finally {
      setSending(false);
      setStreamText(null);
      abortRef.current = null;
      currentRequestIdRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Abort in-flight request ---
  const abort = useCallback(() => {
    try { abortRef.current?.abort(); } catch { /* noop */ }
    setSending(false);
    setStreamText(null);
  }, []);

  // --- Navigate to a specific recent session by index ---
  const navigateToSession = useCallback((_, idx) => {
    setRecentSessions(prevSessions => {
      if (idx < 0 || idx >= prevSessions.length) return prevSessions;
      const session = prevSessions[idx];
      navigatorIndexRef.current = idx;
      setNavigatorOverride({ tab: session.tab, contextId: session.contextId, label: session.label });
      setMessages([]);
      setStreamText(null);
      loadHistory(session.tab, session.contextId);
      return prevSessions;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetNavigator = useCallback(() => {
    if (!navigatorOverrideRef.current) return;
    navigatorIndexRef.current = -1;
    setNavigatorOverride(null);
    setMessages([]);
    setStreamText(null);
    loadHistory(activeTabRef.current, contextIdRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
