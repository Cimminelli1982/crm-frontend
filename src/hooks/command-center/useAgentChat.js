import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

const AGENTS = [
  { id: 'kevin', name: 'Kevin', emoji: '🏗️', color: '#F59E0B' },
  { id: 'clarissa', name: 'Clarissa', emoji: '📊', color: '#8B5CF6' },
  { id: 'jennifer', name: 'Jennifer', emoji: '💼', color: '#10B981' },
];

const useAgentChat = () => {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch messages for selected agent
  const fetchMessages = useCallback(async () => {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_chat_messages')
        .select('*')
        .eq('agent_id', selectedAgent.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAgent]);

  // Fetch on agent change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!selectedAgent) return;

    const channel = supabase
      .channel('agent-chat-' + selectedAgent.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_chat_messages',
          filter: `agent_id=eq.${selectedAgent.id}`,
        },
        (payload) => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedAgent]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = useCallback(async (content, context = {}) => {
    if (!content.trim() || !selectedAgent) return;
    setSending(true);

    try {
      const { error } = await supabase
        .from('agent_chat_messages')
        .insert({
          agent_id: selectedAgent.id,
          role: 'user',
          content: content.trim(),
          context_type: context.type || null,
          context_id: context.id || null,
          contact_id: context.contactId || null,
          metadata: context.metadata || {},
        });

      if (error) throw error;
      setInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  }, [selectedAgent]);

  return {
    agents: AGENTS,
    selectedAgent,
    setSelectedAgent,
    messages,
    loading,
    sending,
    input,
    setInput,
    sendMessage,
    messagesEndRef,
    fetchMessages,
  };
};

export default useAgentChat;
