import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaWhatsapp, FaPaperPlane, FaClock, FaCheckDouble, FaMagic } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const WhatsAppChatTab = ({
  theme,
  contact,
  mobiles = [],
  onMessageSent,
  hidePhoneSelector = false,
}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [bestPhone, setBestPhone] = useState(null);
  const [proofreading, setProofreading] = useState(false);
  const textareaRef = useRef(null);

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
        // Extract text from Claude response
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

  // Fetch WhatsApp messages
  const fetchMessages = useCallback(async () => {
    if (!contact || mobiles.length === 0) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      // Normalize phone numbers for matching
      const getLast9Digits = (phone) => phone.replace(/\D/g, '').slice(-9);

      // Count messages per phone number to find the best one
      const phoneMessageCount = {};
      mobiles.forEach(m => {
        phoneMessageCount[m.mobile] = 0;
      });

      // Fetch messages from command_center_inbox matching any of the contact's phone numbers
      const { data: inboxMessages, error: inboxError } = await supabase
        .from('command_center_inbox')
        .select('*')
        .eq('type', 'whatsapp')
        .order('date', { ascending: false });

      if (inboxError) {
        console.error('Error fetching inbox messages:', inboxError);
      }

      // Filter messages by matching phone numbers (compare last 9 digits for accuracy)
      const matchingMessages = (inboxMessages || []).filter(msg => {
        const msgPhoneSuffix = getLast9Digits(msg.contact_number || '');
        if (msgPhoneSuffix.length < 9) return false;

        // Find which contact phone matches
        const matchingMobile = mobiles.find(m =>
          getLast9Digits(m.mobile) === msgPhoneSuffix
        );

        if (matchingMobile) {
          // Only count RECEIVED messages to determine the best phone
          if (msg.direction === 'received') {
            phoneMessageCount[matchingMobile.mobile]++;
          }
          return true;
        }
        return false;
      });

      // Find phone with most RECEIVED messages (if any)
      let foundBestPhone = null;
      let maxMessages = 0;
      Object.entries(phoneMessageCount).forEach(([phone, count]) => {
        if (count > maxMessages) {
          maxMessages = count;
          foundBestPhone = phone;
        }
      });
      setBestPhone(foundBestPhone);

      // Also fetch archived messages from interactions
      const { data: archivedData } = await supabase
        .from('interactions')
        .select('interaction_id, interaction_type, direction, interaction_date, summary, external_interaction_id')
        .eq('contact_id', contact.contact_id)
        .eq('interaction_type', 'whatsapp')
        .order('interaction_date', { ascending: false });

      // Combine and format messages
      const inboxFormatted = matchingMessages.map(m => ({
        id: m.id || m.message_uid,
        text: m.body_text || m.snippet || '',
        direction: m.direction,
        date: m.date,
        source: 'inbox'
      }));

      const archivedFormatted = (archivedData || []).map(m => ({
        id: m.interaction_id,
        text: m.summary || '',
        direction: m.direction,
        date: m.interaction_date,
        source: 'archived'
      }));

      // Combine and sort by date descending
      const allMessages = [...inboxFormatted, ...archivedFormatted];
      allMessages.sort((a, b) => new Date(b.date) - new Date(a.date));

      setMessages(allMessages);
    } catch (err) {
      console.error('Error fetching WhatsApp messages:', err);
      setMessages([]);
    }
    setLoading(false);
  }, [contact, mobiles]);

  // Fetch messages when contact or mobiles change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Send WhatsApp message
  const handleSend = async () => {
    if (!input.trim() || sending) return;
    if (mobiles.length === 0) {
      toast.error('No phone number available for this contact');
      return;
    }

    // Use the phone with received messages if available
    // Otherwise prefer mobile numbers (Italian mobiles start with +393)
    // Fall back to first number as last resort
    let phoneNumber = bestPhone;
    if (!phoneNumber) {
      // Try to find a mobile number (not a landline)
      const mobileNumber = mobiles.find(m =>
        m.mobile.startsWith('+393') || // Italian mobile
        m.mobile.startsWith('+44') ||  // UK
        m.mobile.startsWith('+1') ||   // US/Canada
        !m.mobile.match(/^\+39\s?0/)   // Not Italian landline (06, 02, etc.)
      );
      phoneNumber = mobileNumber?.mobile || mobiles[0].mobile;
    }
    const messageText = input.trim();

    setSending(true);
    try {
      // Send via Baileys
      const response = await fetch(`${BACKEND_URL}/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          message: messageText
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Update last_interaction_at
      const now = new Date();
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          last_interaction_at: now.toISOString(),
          last_whatsapp_sent: now.toISOString().split('T')[0] // date only
        })
        .eq('contact_id', contact.contact_id);

      if (updateError) {
        console.error('Failed to update last_interaction_at:', updateError);
      }

      // Add optimistic message
      const newMessage = {
        id: `sent_${Date.now()}`,
        text: messageText,
        direction: 'sent',
        date: new Date().toISOString(),
        source: 'local'
      };
      setMessages(prev => [newMessage, ...prev]);
      setInput('');
      toast.success('Message sent!');

      // Callback to parent
      if (onMessageSent) {
        onMessageSent(contact.contact_id);
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            {mobiles.length === 0 ? (
              <div>
                <FaWhatsapp size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div>No phone number available</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Add a phone number to view WhatsApp messages</div>
              </div>
            ) : (
              <div>
                <FaWhatsapp size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div>No messages yet</div>
              </div>
            )}
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
      {mobiles.length > 0 && (
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
      )}
    </div>
  );
};

export default WhatsAppChatTab;
