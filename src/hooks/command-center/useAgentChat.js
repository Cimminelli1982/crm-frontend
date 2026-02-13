import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useAgentChat — Real-time chat with OpenClaw agents via Gateway WebSocket
 * Replaces the previous Supabase polling approach with direct WebSocket streaming
 */

const GATEWAY_URL = process.env.REACT_APP_OPENCLAW_GATEWAY_URL || 'ws://localhost:18789';
const GATEWAY_TOKEN = process.env.REACT_APP_OPENCLAW_GATEWAY_TOKEN || '';

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

// Extract display text from various message formats
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

  // WebSocket refs
  const wsRef = useRef(null);
  const pendingRef = useRef(new Map());
  const runIdRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const backoffRef = useRef(800);
  const closedRef = useRef(false);
  const connectSentRef = useRef(false);
  const selectedAgentRef = useRef(selectedAgent);

  // Keep ref in sync
  useEffect(() => {
    selectedAgentRef.current = selectedAgent;
  }, [selectedAgent]);

  // --- WS Protocol ---

  const flushPending = useCallback((err) => {
    for (const [, p] of pendingRef.current) p.reject(err);
    pendingRef.current.clear();
  }, []);

  const request = useCallback((method, params) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('Gateway not connected'));
    }
    const id = uuid();
    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });
      ws.send(JSON.stringify({ type: 'req', id, method, params }));
    });
  }, []);

  const doConnect = useCallback(async () => {
    if (connectSentRef.current) return;
    connectSentRef.current = true;

    try {
      await request('connect', {
        minProtocol: 3,
        maxProtocol: 3,
        client: { id: 'openclaw-control-ui', version: '1.0.0', platform: 'web', mode: 'webchat' },
        role: 'operator',
        scopes: ['operator.read', 'operator.write'],
        caps: [],
        auth: GATEWAY_TOKEN ? { token: GATEWAY_TOKEN } : {},
        userAgent: navigator.userAgent,
        locale: navigator.language,
      });
      backoffRef.current = 800;
      setConnected(true);
      setError(null);
    } catch (err) {
      console.error('[AgentChat] Connect failed:', err);
      setError('Connection failed');
      wsRef.current?.close(4008, 'connect failed');
    }
  }, [request]);

  // Load chat history from Gateway
  const fetchMessages = useCallback(async () => {
    if (!connected) return;
    const agent = selectedAgentRef.current;
    if (!agent?.sessionKey) return;
    setLoading(true);
    try {
      const result = await request('chat.history', {
        sessionKey: agent.sessionKey,
        limit: 100,
      });
      if (Array.isArray(result?.messages)) {
        // Normalize messages for display
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
    } catch (err) {
      console.error('[AgentChat] History fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [connected, request]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'event') {
      // Connect challenge
      if (msg.event === 'connect.challenge') {
        doConnect();
        return;
      }

      // Chat streaming
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
          // Reload history to get the final clean message
          fetchMessages();
        } else if (p.state === 'aborted' || p.state === 'error') {
          setStreamText(null);
          runIdRef.current = null;
          setSending(false);
          if (p.state === 'error') {
            setError(p.errorMessage || 'Chat error');
          }
        }
      }
      return;
    }

    // Response to request
    if (msg.type === 'res') {
      const p = pendingRef.current.get(msg.id);
      if (!p) return;
      pendingRef.current.delete(msg.id);
      if (msg.ok) p.resolve(msg.payload);
      else p.reject(new Error(msg.error?.message || 'Request failed'));
    }
  }, [doConnect, fetchMessages]);

  // WebSocket connect/reconnect
  const wsConnect = useCallback(() => {
    if (closedRef.current) return;

    const ws = new WebSocket(GATEWAY_URL);
    wsRef.current = ws;

    ws.addEventListener('open', () => {
      connectSentRef.current = false;
    });
    ws.addEventListener('message', (e) => handleMessage(String(e.data || '')));
    ws.addEventListener('close', (e) => {
      wsRef.current = null;
      setConnected(false);
      flushPending(new Error(`Disconnected (${e.code})`));
      if (!closedRef.current) {
        const delay = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 1.7, 15000);
        reconnectTimerRef.current = setTimeout(wsConnect, delay);
      }
    });
    ws.addEventListener('error', () => {});
  }, [handleMessage, flushPending]);

  // Mount: connect WebSocket
  useEffect(() => {
    closedRef.current = false;
    wsConnect();
    return () => {
      closedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [wsConnect]);

  // Load history when connected or agent changes
  useEffect(() => {
    if (connected) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [connected, selectedAgent, fetchMessages]);

  // Clear state when switching agent
  useEffect(() => {
    setMessages([]);
    setStreamText(null);
    setError(null);
    setInput('');
  }, [selectedAgent]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  // Send message
  const sendMessage = useCallback(async (content, context = {}) => {
    if (!content.trim() || !selectedAgentRef.current?.sessionKey) return;
    if (!connected) {
      setError('Not connected');
      return;
    }

    const agent = selectedAgentRef.current;
    const idempotencyKey = uuid();

    // Build message with context
    let fullMessage = content.trim();
    const ctxParts = [];
    if (context.type) ctxParts.push(`Tab: ${context.type}`);
    if (context.metadata?.contactName) ctxParts.push(`Contact: ${context.metadata.contactName}`);
    if (context.metadata?.emailSubject) ctxParts.push(`Email: "${context.metadata.emailSubject}"`);
    if (context.contactId) ctxParts.push(`Contact ID: ${context.contactId}`);
    if (ctxParts.length > 0) {
      fullMessage = `[CRM Context: ${ctxParts.join(' | ')}]\n\n${fullMessage}`;
    }

    // Add user message locally
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
      await request('chat.send', {
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
  }, [connected, request]);

  // Abort
  const abort = useCallback(async () => {
    if (!connected) return;
    const agent = selectedAgentRef.current;
    try {
      await request('chat.abort', runIdRef.current
        ? { sessionKey: agent.sessionKey, runId: runIdRef.current }
        : { sessionKey: agent.sessionKey }
      );
    } catch (err) {
      console.error('[AgentChat] Abort failed:', err);
    }
  }, [connected, request]);

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
    fetchMessages,
  };
};

export default useAgentChat;
