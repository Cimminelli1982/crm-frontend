import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaWhatsapp, FaPaperPlane, FaClock, FaCheckDouble, FaMagic, FaUsers, FaUser } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

/**
 * RightPanelWhatsAppTab - WhatsApp chat for right panel with chat selector
 *
 * @param {Object} props
 * @param {string} props.theme - 'dark' or 'light'
 * @param {string} props.contactId - The contact ID to show chats for
 * @param {Array} props.mobiles - Contact's phone numbers (fallback for sending)
 * @param {Function} props.onMessageSent - Callback when a message is sent
 * @param {string} props.initialSelectedMobile - Pre-selected mobile number to find matching chat
 */
const RightPanelWhatsAppTab = ({
  theme,
  contactId,
  mobiles = [],
  onMessageSent,
  initialSelectedMobile,
}) => {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [proofreading, setProofreading] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-resize textarea based on content
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, []);

  // Resize when input changes
  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

  // Helper to get last 9 digits for phone matching
  const getLast9Digits = (phone) => (phone || '').replace(/\D/g, '').slice(-9);

  // Fetch contact's chats: COMBINE contact_chats + command_center_inbox by phone
  useEffect(() => {
    const fetchChats = async () => {
      if (!contactId) {
        setChats([]);
        setSelectedChatId(null);
        setSelectedChat(null);
        return;
      }

      setLoadingChats(true);
      try {
        const chatMap = new Map();

        // 1. Get linked chats from contact_chats (includes groups)
        const { data: linkedChats } = await supabase
          .from('contact_chats')
          .select('chat_id, chats(id, chat_name, is_group_chat, baileys_jid, external_chat_id)')
          .eq('contact_id', contactId);

        (linkedChats || []).forEach(cc => {
          if (cc.chats?.id) {
            chatMap.set(cc.chats.id, {
              id: cc.chats.id,
              chat_id: cc.chats.id,
              chat_name: cc.chats.chat_name || 'Unknown Chat',
              is_group_chat: cc.chats.is_group_chat || false,
              baileys_jid: cc.chats.baileys_jid,
              external_chat_id: cc.chats.external_chat_id,
              messages: [],
              latestDate: null,
              source: 'linked'
            });
          }
        });

        // 2. Get chats from command_center_inbox by phone number
        if (mobiles.length > 0) {
          const { data: inboxMessages } = await supabase
            .from('command_center_inbox')
            .select('*')
            .eq('type', 'whatsapp')
            .order('date', { ascending: false });

          const mobileSuffixes = mobiles.map(m => getLast9Digits(m.mobile));

          (inboxMessages || []).forEach(msg => {
            const msgPhoneSuffix = getLast9Digits(msg.contact_number || '');
            if (msgPhoneSuffix.length < 9) return;
            if (!mobileSuffixes.includes(msgPhoneSuffix)) return;

            const key = msg.chat_id || msg.contact_number;
            if (!chatMap.has(key)) {
              chatMap.set(key, {
                id: key,
                chat_id: msg.chat_id,
                chat_name: msg.chat_name || msg.contact_number,
                contact_number: msg.contact_number,
                is_group_chat: msg.is_group_chat || false,
                chat_jid: msg.chat_jid,
                messages: [],
                latestDate: msg.date,
                source: 'inbox'
              });
            }
            const chat = chatMap.get(key);
            chat.messages.push(msg);
            if (!chat.latestDate || new Date(msg.date) > new Date(chat.latestDate)) {
              chat.latestDate = msg.date;
            }
            // Update contact_number if not set
            if (!chat.contact_number) chat.contact_number = msg.contact_number;
          });
        }

        // Convert to array and sort: personal first, then by latest date
        const chatList = Array.from(chatMap.values()).sort((a, b) => {
          if (a.is_group_chat !== b.is_group_chat) {
            return a.is_group_chat ? 1 : -1;
          }
          return new Date(b.latestDate || 0) - new Date(a.latestDate || 0);
        });

        setChats(chatList);

        // Auto-select chat: prefer initialSelectedMobile match, otherwise first chat
        if (chatList.length > 0) {
          let chatToSelect = chatList[0];

          // If initialSelectedMobile is set, try to find a matching chat
          if (initialSelectedMobile) {
            const mobileSuffix = getLast9Digits(initialSelectedMobile);
            const matchingChat = chatList.find(c => {
              const chatPhoneSuffix = getLast9Digits(c.contact_number || '');
              return chatPhoneSuffix.length >= 9 && chatPhoneSuffix === mobileSuffix;
            });
            if (matchingChat) {
              chatToSelect = matchingChat;
            }
          }

          setSelectedChatId(chatToSelect.id);
          setSelectedChat(chatToSelect);
        } else {
          setSelectedChatId(null);
          setSelectedChat(null);
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
        setChats([]);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchChats();
  }, [contactId, mobiles, initialSelectedMobile]);

  // Show messages when chat is selected (from inbox + archived)
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat) {
        setMessages([]);
        return;
      }

      setLoading(true);
      try {
        // 1. Messages from inbox (already loaded in selectedChat.messages)
        const inboxMessages = (selectedChat.messages || []).map(m => ({
          id: m.id || m.message_uid,
          text: m.body_text || m.snippet || '',
          direction: m.direction,
          date: m.date,
          source: 'inbox'
        }));

        // 2. Archived messages from interactions (only for linked chats with real UUID)
        // Inbox chats have external IDs (not UUIDs), so skip interaction query for them
        let archivedMessages = [];
        const isValidUUID = selectedChat.chat_id &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedChat.chat_id);

        if (isValidUUID) {
          const { data } = await supabase
            .from('interactions')
            .select('interaction_id, direction, interaction_date, summary')
            .eq('chat_id', selectedChat.chat_id)
            .eq('interaction_type', 'whatsapp')
            .order('interaction_date', { ascending: false })
            .limit(100);

          archivedMessages = (data || []).map(m => ({
            id: m.interaction_id,
            text: m.summary || '',
            direction: m.direction,
            date: m.interaction_date,
            source: 'archived'
          }));
        }

        // Combine and sort by date (newest first)
        const allMessages = [...inboxMessages, ...archivedMessages];
        allMessages.sort((a, b) => new Date(b.date) - new Date(a.date));

        setMessages(allMessages);
      } catch (err) {
        console.error('Error loading messages:', err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [selectedChat]);

  // Handle chat selection
  const handleChatSelect = (chatId) => {
    const chat = chats.find(c => c.id === chatId);
    setSelectedChatId(chatId);
    setSelectedChat(chat || null);
  };

  // Proofread the current message
  const handleProofread = async () => {
    if (!input.trim() || proofreading) return;

    setProofreading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Proofread and polish this WhatsApp message. Fix grammar, spelling, and awkward phrasing. Keep the same tone - casual and friendly for WhatsApp. Return ONLY the improved message, nothing else. No quotes, no explanation.

Message:
${input.trim()}`
          }],
          systemPrompt: 'You are a helpful writing assistant. You improve messages while keeping their original intent and tone. For WhatsApp messages, keep them casual and natural.'
        })
      });

      const data = await response.json();

      if (data.content) {
        const textContent = data.content.find(c => c.type === 'text');
        if (textContent?.text) {
          setInput(textContent.text.trim());
          toast.success('Message polished!');
        }
      }
    } catch (error) {
      console.error('Proofread error:', error);
      toast.error('Failed to proofread');
    } finally {
      setProofreading(false);
    }
  };

  // Send WhatsApp message
  const handleSend = async () => {
    if (!input.trim() || sending) return;

    // Only use baileys_jid from linked chats (which have real WhatsApp JIDs)
    // chat_jid from inbox contains TimelinesAI external IDs, not real JIDs
    let jid = selectedChat?.baileys_jid;
    const isGroup = selectedChat?.is_group_chat;
    // For phone, prefer contact_number from chat, fallback to mobiles
    const phone = selectedChat?.contact_number || (mobiles.length > 0 ? mobiles[0].mobile : null);

    const messageText = input.trim();
    setSending(true);

    try {
      // For group chats without JID, search and link first
      if (isGroup && !jid) {
        toast.loading('Finding group...', { id: 'find-group' });

        const searchRes = await fetch(
          `${BACKEND_URL}/whatsapp/find-group?name=${encodeURIComponent(selectedChat.chat_name)}`
        );
        const searchData = await searchRes.json();

        toast.dismiss('find-group');

        if (searchData.success && searchData.jid) {
          jid = searchData.jid;
          // Update local state for future sends (only baileys_jid, not chat_jid)
          setSelectedChat(prev => ({ ...prev, baileys_jid: jid }));
          setChats(prev => prev.map(c =>
            c.id === selectedChat.id ? { ...c, baileys_jid: jid } : c
          ));
        } else {
          toast.error('Could not find group in WhatsApp');
          setSending(false);
          return;
        }
      }

      // For personal chats, we can use jid or phone
      if (!isGroup && !jid && !phone) {
        toast.error('No WhatsApp destination available');
        setSending(false);
        return;
      }

      // For groups: always use chat_id (JID)
      // For personal: prefer chat_id (JID), fallback to phone
      const destination = jid ? { chat_id: jid } : { phone };

      const response = await fetch(`${BACKEND_URL}/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...destination, message: messageText })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add optimistic message
      const newMessage = {
        id: `sent_${Date.now()}`,
        text: messageText,
        direction: 'sent',
        date: new Date().toISOString()
      };
      setMessages(prev => [newMessage, ...prev]);
      setInput('');
      toast.success('Message sent!');

      // Callback to parent
      if (onMessageSent) {
        onMessageSent(contactId);
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Styles
  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
    background: theme === 'dark' ? '#374151' : '#FFFFFF',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: '13px',
    cursor: 'pointer'
  };

  // No contact selected
  if (!contactId) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
        textAlign: 'center'
      }}>
        <FaWhatsapp size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <div style={{ fontSize: '14px', fontWeight: 500 }}>No contact selected</div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Select a contact to view WhatsApp chats</div>
      </div>
    );
  }

  // Loading chats
  if (loadingChats) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
      }}>
        Loading chats...
      </div>
    );
  }

  // No chats found
  if (chats.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
        textAlign: 'center'
      }}>
        <FaWhatsapp size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <div style={{ fontSize: '14px', fontWeight: 500 }}>No WhatsApp chats</div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          {mobiles.length > 0
            ? 'No chat history found for this contact'
            : 'Add a phone number to start chatting'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Chat Selector (if multiple chats) */}
      {chats.length > 1 && (
        <div style={{
          padding: '12px',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
          background: theme === 'dark' ? '#1F2937' : '#F9FAFB'
        }}>
          <select
            value={selectedChatId || ''}
            onChange={(e) => handleChatSelect(e.target.value)}
            style={selectStyle}
          >
            {chats.map(chat => (
              <option key={chat.id} value={chat.id}>
                {chat.is_group_chat ? '👥 ' : '👤 '}{chat.chat_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Single chat header (if only one chat) */}
      {chats.length === 1 && (
        <div style={{
          padding: '12px',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
          background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {selectedChat?.is_group_chat ? (
            <FaUsers size={14} color="#22C55E" />
          ) : (
            <FaUser size={14} color="#22C55E" />
          )}
          <span style={{
            fontSize: '13px',
            fontWeight: 500,
            color: theme === 'dark' ? '#F9FAFB' : '#111827'
          }}>
            {selectedChat?.chat_name}
          </span>
        </div>
      )}

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        background: theme === 'dark' ? '#111827' : '#F3F4F6'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
            <FaWhatsapp size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <div>No messages yet</div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: '12px',
                fontSize: '13px',
                lineHeight: '1.4',
                alignSelf: msg.direction === 'sent' ? 'flex-end' : 'flex-start',
                background: msg.direction === 'sent'
                  ? (theme === 'dark' ? '#054640' : '#DCF8C6')
                  : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
                border: msg.direction === 'sent'
                  ? 'none'
                  : `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
              }}
            >
              <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              <div style={{
                fontSize: '10px',
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginTop: '4px',
                textAlign: 'right',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '4px'
              }}>
                {new Date(msg.date).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {msg.direction === 'sent' && (
                  <FaCheckDouble size={10} style={{ color: '#34D399' }} />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div style={{
        borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
        background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
      }}>
        {/* Proofread Button Row */}
        {input.trim() && (
          <div style={{
            padding: '8px 12px 0 12px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleProofread}
              disabled={proofreading || !input.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                background: 'transparent',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                borderRadius: '6px',
                color: theme === 'dark' ? '#D1D5DB' : '#374151',
                fontSize: '12px',
                cursor: proofreading ? 'wait' : 'pointer',
                opacity: proofreading ? 0.6 : 1,
              }}
            >
              <FaMagic size={10} />
              {proofreading ? 'Polishing...' : 'Proofread'}
            </button>
          </div>
        )}

        {/* Message Input Row */}
        <div style={{
          padding: '12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end'
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '20px',
              border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
              background: theme === 'dark' ? '#374151' : '#F9FAFB',
              color: theme === 'dark' ? '#F9FAFB' : '#111827',
              fontSize: '13px',
              resize: 'none',
              outline: 'none',
              maxHeight: '120px',
              minHeight: '40px',
              fontFamily: 'inherit',
              overflow: 'hidden'
            }}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: input.trim() && !sending ? '#22C55E' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
              color: input.trim() && !sending ? 'white' : (theme === 'dark' ? '#6B7280' : '#9CA3AF'),
              cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {sending ? (
              <FaClock size={16} />
            ) : (
              <FaPaperPlane size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightPanelWhatsAppTab;
