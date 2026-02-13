import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaChevronDown, FaRobot, FaStop } from 'react-icons/fa';

const AgentChatTab = ({
  theme,
  agentChatHook,
  // Context from right panel
  contextType,
  contextId,
  contactId,
  contactName,
  emailSubject,
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
  } = agentChatHook;

  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAgentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    const context = {
      type: contextType,
      id: contextId,
      contactId: contactId,
      metadata: {
        contactName: contactName || null,
        emailSubject: emailSubject || null,
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

  const isDark = theme === 'dark';
  const bg = isDark ? '#1a1a2e' : '#ffffff';
  const msgBg = isDark ? '#16213e' : '#f0f0f0';
  const userMsgBg = selectedAgent?.color || '#3B82F6';
  const textColor = isDark ? '#e0e0e0' : '#333';
  const mutedColor = isDark ? '#888' : '#999';
  const borderColor = isDark ? '#333' : '#e0e0e0';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: bg,
      overflow: 'hidden',
    }}>
      {/* Agent selector header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
      }}>
        {/* Connection status dot */}
        <span style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: connected ? '#00b894' : '#e17055',
          flexShrink: 0,
        }} />

        <div ref={dropdownRef} style={{ position: 'relative', flex: 1 }}>
          <button
            onClick={() => setShowAgentDropdown(!showAgentDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              color: textColor,
              fontSize: 14,
              fontWeight: 600,
              width: '100%',
            }}
          >
            <span style={{ fontSize: 18 }}>{selectedAgent?.emoji}</span>
            <span>{selectedAgent?.name}</span>
            <FaChevronDown size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
          </button>

          {showAgentDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: isDark ? '#1e1e3a' : '#fff',
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              marginTop: 4,
              zIndex: 100,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}>
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    setShowAgentDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 12px',
                    background: selectedAgent?.id === agent.id
                      ? (isDark ? '#2a2a4a' : '#f0f0ff')
                      : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: textColor,
                    fontSize: 14,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{agent.emoji}</span>
                  <span style={{ fontWeight: selectedAgent?.id === agent.id ? 600 : 400 }}>
                    {agent.name}
                  </span>
                  {selectedAgent?.id === agent.id && (
                    <span style={{ marginLeft: 'auto', color: agent.color, fontSize: 12 }}>●</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
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
              {connected ? 'Connected via OpenClaw — send a message' : 'Connecting to Gateway...'}
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
      {contactName && (
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
          Context: {contactName}{emailSubject ? ` • ${emailSubject}` : ''}
        </div>
      )}

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
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={connected ? `Message ${selectedAgent?.name}...` : 'Connecting...'}
          disabled={!connected}
          rows={1}
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
            maxHeight: 100,
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
              background: selectedAgent?.color || '#3B82F6',
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
