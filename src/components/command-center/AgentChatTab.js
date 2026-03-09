import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaPaperPlane, FaRobot, FaStop } from 'react-icons/fa';
import COMMAND_CATEGORIES from './commandDefinitions';

// Build a context label for the badge
function getContextLabel(contextType, emailSubject, whatsappChat, calendarEvent, dealName, contactName) {
  const parts = [];
  if (contextType) {
    const tabLabels = {
      email: 'Email', whatsapp: 'WhatsApp', calendar: 'Calendar',
      deals: 'Deals', tasks: 'Tasks', notes: 'Notes',
      keepintouch: 'Keep in Touch', introductions: 'Introductions',
      lists: 'Lists',
    };
    parts.push(tabLabels[contextType] || contextType);
  }
  if (emailSubject) parts.push(emailSubject);
  else if (whatsappChat) parts.push(whatsappChat);
  else if (calendarEvent) parts.push(calendarEvent);
  else if (dealName) parts.push(dealName);
  else if (contactName) parts.push(contactName);
  return parts.join(': ');
}

const AgentChatTab = ({
  theme,
  agentChatHook,
  // Context from right panel
  contextType,
  contextId,
  contactId,
  contactName,
  emailSubject,
  emailInboxId,
  whatsappChat,
  calendarEvent,
  dealName,
  rightPanelContactDetails,
}) => {
  const {
    agents,
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
    activeTab,
  } = agentChatHook;

  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const dropdownRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const inputRef = useRef(null);

  // Close agent dropdown on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAgentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close category dropdown on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setOpenCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Build command context from props + rightPanelContactDetails
  const commandContext = useMemo(() => {
    const details = rightPanelContactDetails;
    const primaryEmail = details?.emails?.find(e => e.is_primary)?.email || details?.emails?.[0]?.email || null;
    const primaryPhone = details?.mobiles?.find(m => m.is_primary)?.mobile || details?.mobiles?.[0]?.mobile || null;
    const primaryCompany = details?.companies?.[0]?.name || null;
    const contact = details?.contact;
    return {
      contactName: contactName || null,
      contactId: contactId || contact?.contact_id || null,
      contextType: contextType || null,
      emailSubject: emailSubject || null,
      emailInboxId: emailInboxId || null,
      whatsappChat: whatsappChat || null,
      calendarEvent: calendarEvent || null,
      dealName: dealName || null,
      contactEmail: primaryEmail,
      contactPhone: primaryPhone,
      contactCompany: primaryCompany,
      contactCategory: contact?.category || null,
      contactJobRole: contact?.job_role || null,
    };
  }, [contactName, contactId, contextType, emailSubject, emailInboxId, whatsappChat, calendarEvent, dealName, rightPanelContactDetails]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    const context = {
      type: contextType,
      id: contextId,
      contactId: contactId,
      metadata: {
        contactName: contactName || null,
        emailSubject: emailSubject || null,
        whatsappChat: whatsappChat || null,
        calendarEvent: calendarEvent || null,
        dealName: dealName || null,
      },
    };
    sendMessage(input, context);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCommandSelect = (action) => {
    const prompt = action.buildPrompt(commandContext);
    setInput(prompt);
    setOpenCategory(null);
    // Focus and auto-resize textarea
    setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 300) + 'px';
      }
    }, 0);
  };

  const handleCategoryClick = (catId) => {
    setOpenCategory(prev => prev === catId ? null : catId);
  };

  const isDark = theme === 'dark';
  const bg = isDark ? '#1a1a2e' : '#ffffff';
  const msgBg = isDark ? '#16213e' : '#f0f0f0';
  const userMsgBg = selectedAgent?.color || '#8B5CF6';
  const textColor = isDark ? '#e0e0e0' : '#333';
  const mutedColor = isDark ? '#888' : '#999';
  const borderColor = isDark ? '#333' : '#e0e0e0';

  const contextLabel = getContextLabel(contextType, emailSubject, whatsappChat, calendarEvent, dealName, contactName);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: bg,
      overflow: 'hidden',
    }}>
      {/* Header — PA + connection status + context badge */}
      <div style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: connected ? '#00b894' : '#e17055',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 16 }}>{selectedAgent?.emoji}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{selectedAgent?.name}</span>
        {/* Context badge */}
        {contextLabel && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: isDark ? '#a78bfa' : '#7c3aed',
            background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
            padding: '2px 8px',
            borderRadius: 10,
            maxWidth: 180,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {contextLabel}
          </span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '6px 12px',
          background: '#e17055',
          color: '#fff',
          fontSize: 12,
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* Messages area */}
      <div ref={chatContainerRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: mutedColor, padding: 20 }}>
            Loading...
          </div>
        ) : messages.length === 0 && !streamText ? (
          <div style={{
            textAlign: 'center',
            color: mutedColor,
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 32 }}>{selectedAgent?.emoji}</span>
            <span style={{ fontSize: 14 }}>
              Chat with {selectedAgent?.name}
            </span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {connected ? 'Connected via OpenClaw — send a message or pick a command' : 'Connecting to Gateway...'}
            </span>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? userMsgBg : msgBg,
                  color: msg.role === 'user' ? '#fff' : textColor,
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{
                      fontSize: 11,
                      fontWeight: 600,
                      marginBottom: 2,
                      color: selectedAgent?.color,
                    }}>
                      {selectedAgent?.emoji} {selectedAgent?.name}
                    </div>
                  )}
                  {msg.content}
                  {msg.created_at && (
                    <div style={{
                      fontSize: 10,
                      opacity: 0.6,
                      marginTop: 4,
                      textAlign: 'right',
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming response */}
            {streamText !== null && streamText !== '' && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: '12px 12px 12px 2px',
                  background: msgBg,
                  color: textColor,
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    marginBottom: 2,
                    color: selectedAgent?.color,
                  }}>
                    {selectedAgent?.emoji} {selectedAgent?.name}
                  </div>
                  {streamText}
                  <span style={{ animation: 'blink 0.8s infinite', opacity: 0.6 }}>▊</span>
                </div>
              </div>
            )}

            {/* Thinking indicator */}
            {sending && (streamText === null || streamText === '') && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '12px 12px 12px 2px',
                  background: msgBg,
                  color: mutedColor,
                  fontSize: 13,
                }}>
                  {selectedAgent?.emoji} Thinking...
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context bar */}
      {(contactName || emailSubject || whatsappChat || calendarEvent || dealName) && (
        <div style={{
          padding: '4px 12px',
          borderTop: `1px solid ${borderColor}`,
          fontSize: 11,
          color: mutedColor,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <FaRobot size={10} />
          {[
            contactName,
            emailSubject && `📧 ${emailSubject}`,
            whatsappChat && `💬 ${whatsappChat}`,
            calendarEvent && `📅 ${calendarEvent}`,
            dealName && `💰 ${dealName}`,
          ].filter(Boolean).join(' • ')}
        </div>
      )}

      {/* Command category pills + dropdown */}
      <div ref={categoryMenuRef} style={{
        padding: '6px 12px',
        borderTop: `1px solid ${borderColor}`,
        position: 'relative',
      }}>
        {/* Category dropdown — opens upward */}
        {openCategory && (() => {
          const cat = COMMAND_CATEGORIES.find(c => c.id === openCategory);
          if (!cat) return null;
          return (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 12,
              right: 12,
              background: isDark ? '#1e1e3a' : '#ffffff',
              border: `1px solid ${isDark ? '#444' : '#ddd'}`,
              borderRadius: 8,
              boxShadow: isDark ? '0 -4px 16px rgba(0,0,0,0.4)' : '0 -4px 16px rgba(0,0,0,0.1)',
              zIndex: 10,
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              <div style={{
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: cat.color,
                borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`,
              }}>
                {cat.label}
              </div>
              {cat.actions.map(action => (
                <div
                  key={action.id}
                  onClick={() => handleCommandSelect(action)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    color: textColor,
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? '#2a2a4a' : '#f0f0ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {action.label}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Category pills */}
        <div style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
        }}>
          {COMMAND_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = openCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                disabled={!connected}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: `1px solid ${isActive ? cat.color : (isDark ? '#444' : '#ddd')}`,
                  background: isActive
                    ? (isDark ? `${cat.color}22` : `${cat.color}15`)
                    : (isDark ? '#1e1e3a' : '#f8f8ff'),
                  color: connected ? cat.color : mutedColor,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: connected ? 'pointer' : 'not-allowed',
                  opacity: connected ? 1 : 0.5,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (connected && !isActive) e.currentTarget.style.background = isDark ? '#2a2a4a' : '#efefff';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = isDark ? '#1e1e3a' : '#f8f8ff';
                }}
              >
                <Icon size={10} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input area */}
      <div style={{
        padding: '8px 12px',
        borderTop: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Auto-resize
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
          }}
          onKeyDown={handleKeyDown}
          placeholder={connected ? `Message ${selectedAgent?.name}... (or pick a command)` : 'Connecting...'}
          disabled={!connected}
          rows={3}
          style={{
            flex: 1,
            background: isDark ? '#16213e' : '#f5f5f5',
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            padding: '8px 12px',
            color: textColor,
            fontSize: 13,
            resize: 'none',
            outline: 'none',
            minHeight: 60,
            maxHeight: 300,
            fontFamily: 'inherit',
            opacity: connected ? 1 : 0.5,
          }}
        />
        {sending ? (
          <button
            onClick={abort}
            style={{
              background: '#e17055',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Stop"
          >
            <FaStop size={14} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            style={{
              background: selectedAgent?.color || '#8B5CF6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && connected ? 'pointer' : 'not-allowed',
              opacity: input.trim() && connected ? 1 : 0.5,
              flexShrink: 0,
            }}
          >
            <FaPaperPlane size={14} />
          </button>
        )}
      </div>

      {/* CSS animation for cursor blink */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AgentChatTab;
