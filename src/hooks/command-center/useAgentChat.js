import { useState, useEffect, useCallback, useRef } from 'react';

const GATEWAY_URL = 'ws://localhost:18789';
const GATEWAY_TOKEN = '7715c0390967f22d6262c93f067b06a84228d174cea01a2c';

const AGENTS = [
  { id: 'kevin', name: 'Kevin', emoji: '🏗️', color: '#F59E0B', sessionKey: 'agent:main:main' },
  { id: 'clarissa', name: 'Clarissa', emoji: '📊', color: '#8B5CF6', sessionKey: 'agent:clarissa:main' },
];

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
    return content.filter(p => p.type === 'text').map(p => p.text).join('');
  }
  if (typeof content.text === 'string') return content.text;
  return '';
}

const useAgentChat = () => {
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

  useEffect(() => { selectedAgentRef.current = selectedAgent; }, [selectedAgent]);

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
  function loadHistory() {
    if (!connectedRef.current) return;
    const agent = selectedAgentRef.current;
    if (!agent?.sessionKey) return;
    setLoading(true);
    wsRequest('chat.history', { sessionKey: agent.sessionKey, limit: 100 })
      .then(result => {
        if (Array.isArray(result?.messages)) {
          const normalized = result.messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map((m, i) => ({
              id: m.id || `hist-${i}`,
              role: m.role,
              content: extractText(m.content),
              created_at: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
            }));
          setMessages(normalized);
        }
      })
      .catch(err => console.error('[AgentChat] History fetch failed:', err))
      .finally(() => setLoading(false));
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
          setStreamText(null);
          runIdRef.current = null;
          setSending(false);
          loadHistory();
        } else if (p.state === 'aborted' || p.state === 'error') {
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
  const sendMessage = useCallback(async (content, context = {}) => {
    if (!content.trim() || !selectedAgentRef.current?.sessionKey) return;
    if (!connectedRef.current) {
      setError('Not connected');
      return;
    }

    const agent = selectedAgentRef.current;
    const idempotencyKey = uuid();

    let fullMessage = content.trim();
    const ctxParts = [];
    if (context.type) ctxParts.push(`Tab: ${context.type}`);
    if (context.metadata?.contactName) ctxParts.push(`Contact: ${context.metadata.contactName}`);
    if (context.metadata?.emailSubject) ctxParts.push(`Email: "${context.metadata.emailSubject}"`);
    if (context.contactId) ctxParts.push(`Contact ID: ${context.contactId}`);
    if (ctxParts.length > 0) {
      fullMessage = `[CRM Context: ${ctxParts.join(' | ')}]\n\n${fullMessage}`;
    }

    setMessages(prev => [...prev, {
      id: idempotencyKey,
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    }]);
    setInput('');
    setSending(true);
    setError(null);
    setStreamText('');
    runIdRef.current = idempotencyKey;

    try {
      await wsRequest('chat.send', {
        sessionKey: agent.sessionKey,
        message: fullMessage,
        deliver: false,
        idempotencyKey,
      });
    } catch (err) {
      console.error('[AgentChat] Send failed:', err);
      setError(String(err));
      setSending(false);
      runIdRef.current = null;
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
    const agent = selectedAgentRef.current;
    try {
      await wsRequest('chat.abort', runIdRef.current
        ? { sessionKey: agent.sessionKey, runId: runIdRef.current }
        : { sessionKey: agent.sessionKey }
      );
    } catch (err) {
      console.error('[AgentChat] Abort failed:', err);
    }
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
  };
};

export default useAgentChat;
