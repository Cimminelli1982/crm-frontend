import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaPaperPlane, FaRobot, FaStop } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
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
  onDraftSent,
  onUpdateItemStatus,
  onAddToCrm,
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
    markDraftSent,
    markPostSendAction,
  } = agentChatHook;

  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const dropdownRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const inputRef = useRef(null);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [draftEditText, setDraftEditText] = useState('');
  const [addToCrmMessageId, setAddToCrmMessageId] = useState(null);

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

  // Number keys shortcut when category dropdown is open
  useEffect(() => {
    if (!openCategory) return;
    const cat = COMMAND_CATEGORIES.find(c => c.id === openCategory);
    if (!cat) return;
    const handleKey = (e) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= cat.actions.length) {
        e.preventDefault();
        handleCommandSelect(cat.actions[num - 1]);
      } else if (e.key === 'Escape') {
        setOpenCategory(null);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [openCategory]);

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
        emailInboxId: emailInboxId || null,
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

  const handleSendDraft = (messageId, text, draftType) => {
    markDraftSent(messageId);
    const context = {
      type: contextType,
      id: contextId,
      contactId: contactId,
      metadata: {
        contactName: contactName || null,
        emailSubject: emailSubject || null,
        emailInboxId: emailInboxId || null,
        whatsappChat: whatsappChat || null,
        calendarEvent: calendarEvent || null,
        dealName: dealName || null,
      },
    };
    const sendCmd = draftType === 'reply-to' ? '/reply-to-send' : '/reply-all-send';
    sendMessage(`${sendCmd} ${text}`, context, `📧 Sending ${draftType === 'reply-to' ? 'reply' : 'reply all'}...`);
    setEditingDraftId(null);
  };

  // Post-send action handlers
  const handlePostSendAction = async (messageId, action) => {
    // Mark the post-send bubble as actioned
    markPostSendAction(messageId, action);

    if (action === 'archive' && onDraftSent) {
      // Insert thread_id into auto_archive_threads to catch the reply when it arrives
      if (emailInboxId) {
        try {
          const { data: inboxEmail } = await supabase
            .from('command_center_inbox')
            .select('thread_id')
            .eq('id', emailInboxId)
            .single();
          if (inboxEmail?.thread_id) {
            await supabase.from('auto_archive_threads').insert({
              thread_id: inboxEmail.thread_id,
              sender_email: 'simone@cimminelli.com',
              expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            });
          }
        } catch (err) {
          console.error('[AgentChat] Failed to set auto-archive for thread:', err);
        }
      }
      // Archive the original email
      onDraftSent();
    }
    if (action === 'waiting' && onUpdateItemStatus) {
      onUpdateItemStatus('waiting_input');
    } else if (action === 'actions' && onUpdateItemStatus) {
      onUpdateItemStatus('need_actions');
    }

    // If no CRM contact selected, prompt to add
    if (!contactId && onAddToCrm) {
      setAddToCrmMessageId(messageId);
    }
  };

  // Handle "Add to CRM" - fetch sender info from inbox email
  const handleAddToCrm = async () => {
    setAddToCrmMessageId(null);
    if (!emailInboxId) return;
    try {
      const { data: inboxEmail } = await supabase
        .from('command_center_inbox')
        .select('from_email, from_name')
        .eq('id', emailInboxId)
        .single();
      if (inboxEmail) {
        onAddToCrm({
          email: inboxEmail.from_email || '',
          name: inboxEmail.from_name || '',
        });
      }
    } catch (err) {
      console.error('[AgentChat] Failed to fetch sender for Add to CRM:', err);
    }
  };

  // Direct email actions from command palette (no agent involved)
  const handleDirectEmailAction = async (action) => {
    if (action === 'waiting' && onUpdateItemStatus) {
      onUpdateItemStatus('waiting_input');
      return;
    }
    if (action === 'actions' && onUpdateItemStatus) {
      onUpdateItemStatus('need_actions');
      return;
    }
    if (action === 'archive' && onDraftSent) {
      // Auto-archive thread for sent reply
      if (emailInboxId) {
        try {
          const { data: inboxEmail } = await supabase
            .from('command_center_inbox')
            .select('thread_id')
            .eq('id', emailInboxId)
            .single();
          if (inboxEmail?.thread_id) {
            await supabase.from('auto_archive_threads').insert({
              thread_id: inboxEmail.thread_id,
              sender_email: 'simone@cimminelli.com',
              expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            });
          }
        } catch (err) {
          console.error('[AgentChat] Failed to set auto-archive for thread:', err);
        }
      }
      onDraftSent();
    }
    // For waiting/actions — just log for now, email stays in inbox
  };

  const handleCommandSelect = (action) => {
    setOpenCategory(null);

    // Direct actions (archive, waiting, need actions) — execute immediately
    if (action.directAction) {
      handleDirectEmailAction(action.directAction);
      return;
    }

    const prompt = action.buildPrompt(commandContext);
    setInput(prompt);
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
            {messages.map(msg => {
              const isEditing = msg.isDraft && editingDraftId === msg.id;
              return (
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
                    ...(msg.isDraft ? { border: `1px dashed ${selectedAgent?.color || '#10B981'}` } : {}),
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={{
                        fontSize: 11,
                        fontWeight: 600,
                        marginBottom: 2,
                        color: selectedAgent?.color,
                      }}>
                        {selectedAgent?.emoji} {msg.isDraft ? 'Draft Reply' : msg.draftSent ? 'Reply Sent' : selectedAgent?.name}
                      </div>
                    )}

                    {isEditing ? (
                      <textarea
                        value={draftEditText}
                        onChange={(e) => {
                          setDraftEditText(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        autoFocus
                        style={{
                          width: '100%',
                          background: isDark ? '#1a1a3e' : '#fff',
                          border: `1px solid ${borderColor}`,
                          borderRadius: 4,
                          padding: 6,
                          color: textColor,
                          fontSize: 13,
                          resize: 'none',
                          outline: 'none',
                          fontFamily: 'inherit',
                          lineHeight: 1.5,
                          minHeight: 60,
                        }}
                      />
                    ) : (
                      msg.content
                    )}

                    {msg.isDraft && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => setEditingDraftId(null)}
                              style={{
                                background: 'transparent',
                                border: `1px solid ${borderColor}`,
                                borderRadius: 4,
                                padding: '3px 10px',
                                fontSize: 11,
                                color: mutedColor,
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSendDraft(msg.id, draftEditText, msg.draftType)}
                              style={{
                                background: selectedAgent?.color || '#10B981',
                                border: 'none',
                                borderRadius: 4,
                                padding: '3px 10px',
                                fontSize: 11,
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              Send <FaPaperPlane size={9} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingDraftId(msg.id); setDraftEditText(msg.content); }}
                              style={{
                                background: 'transparent',
                                border: `1px solid ${borderColor}`,
                                borderRadius: 4,
                                padding: '3px 10px',
                                fontSize: 11,
                                color: mutedColor,
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleSendDraft(msg.id, msg.content, msg.draftType)}
                              style={{
                                background: selectedAgent?.color || '#10B981',
                                border: 'none',
                                borderRadius: 4,
                                padding: '3px 10px',
                                fontSize: 11,
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              Send <FaPaperPlane size={9} />
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {msg.draftSent && (
                      <div style={{ fontSize: 10, color: '#00b894', marginTop: 4, textAlign: 'right' }}>
                        ✓ Sent
                      </div>
                    )}

                    {msg.isPostSend && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center' }}>
                        <button
                          onClick={() => handlePostSendAction(msg.id, 'archive')}
                          title="Archive"
                          style={{
                            width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: isDark ? '#2a3a2a' : '#E8F5E9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, transition: 'transform 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          ✅
                        </button>
                        <button
                          onClick={() => handlePostSendAction(msg.id, 'waiting')}
                          title="Waiting Input"
                          style={{
                            width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: isDark ? '#2a2a3a' : '#E3F2FD',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, transition: 'transform 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          👀
                        </button>
                        <button
                          onClick={() => handlePostSendAction(msg.id, 'actions')}
                          title="Need Actions"
                          style={{
                            width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: isDark ? '#3a2a2a' : '#FFF3E0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, transition: 'transform 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          ❗
                        </button>
                      </div>
                    )}

                    {msg.postSendAction && (
                      <div style={{ fontSize: 10, color: msg.postSendAction === 'archive' ? '#00b894' : mutedColor, marginTop: 4, textAlign: 'right' }}>
                        {msg.postSendAction === 'archive' ? '✓ Archived' : msg.postSendAction === 'waiting' ? '👀 Waiting' : '❗ Actions needed'}
                      </div>
                    )}

                    {addToCrmMessageId === msg.id && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, justifyContent: 'center' }}>
                        <span style={{ fontSize: 11, color: mutedColor }}>Add to CRM?</span>
                        <button
                          onClick={handleAddToCrm}
                          style={{
                            padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: isDark ? '#2a3a2a' : '#E8F5E9', color: isDark ? '#81c784' : '#2e7d32',
                            fontSize: 11, fontWeight: 600,
                          }}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setAddToCrmMessageId(null)}
                          style={{
                            padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: isDark ? '#3a2a2a' : '#FFEBEE', color: isDark ? '#e57373' : '#c62828',
                            fontSize: 11, fontWeight: 600,
                          }}
                        >
                          No
                        </button>
                      </div>
                    )}

                    {msg.created_at && !msg.isDraft && !msg.isPostSend && (
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
              );
            })}

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
                display: 'none',
              }}>
                {cat.label}
              </div>
              {cat.actions.map((action, idx) => (
                <div
                  key={action.id}
                  onClick={() => handleCommandSelect(action)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    color: textColor,
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? '#2a2a4a' : '#f0f0ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 10, color: mutedColor, fontWeight: 600, minWidth: 12 }}>{idx + 1}</span>
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
