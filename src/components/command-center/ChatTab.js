import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaImage, FaPaperPlane, FaCheck, FaPlus, FaCalendarAlt, FaStickyNote, FaTasks, FaDollarSign, FaHandshake, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import {
  ChatContainer,
  QuickActionsContainer,
  QuickActionChip,
  ChatMessages,
  ChatMessage,
  ChatMessageImages,
  TypingIndicator,
  ChatImagePreviewContainer,
  ChatImagePreview,
  ChatImageRemoveButton,
  ChatInputContainer,
  ChatInput,
  ChatSendButton,
  ChatAttachButton,
  AcceptDraftButton,
} from '../../pages/CommandCenterPage.styles';
import { supabase } from '../../lib/supabaseClient';

const ChatTab = ({
  theme,
  activeTab,
  chatMessagesRef,
  chatFileInputRef,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  chatImages,
  pendingCalendarEvent,
  setPendingCalendarEvent,
  calendarEventEdits,
  setCalendarEventEdits,
  updateCalendarEventField,
  calendarLoading,
  handleQuickAction,
  handleCalendarExtract,
  handleCreateCalendarEvent,
  sendMessageToClaude,
  handleChatImageSelect,
  removeChatImage,
  openReplyWithDraft,
  extractDraftFromMessage,
  // Keep in Touch specific props
  keepInTouchMode = false,
  onKitQuickAction,
}) => {
  // Context-aware placeholder and messages
  const getContextLabel = () => {
    switch (activeTab) {
      case 'whatsapp': return 'message';
      case 'deals': return 'deal';
      case 'calendar': return 'event';
      default: return 'email';
    }
  };
  const contextLabel = getContextLabel();
  // Attendee autocomplete state
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [attendeeSuggestions, setAttendeeSuggestions] = useState([]);
  const [showAttendeeSuggestions, setShowAttendeeSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const attendeeInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Search contacts when typing in attendee input
  useEffect(() => {
    const searchContacts = async () => {
      if (attendeeSearch.length < 2) {
        setAttendeeSuggestions([]);
        setShowAttendeeSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      try {
        // Search contacts by first_name or last_name, join with contact_emails
        const { data, error } = await supabase
          .from('contacts')
          .select(`
            contact_id,
            first_name,
            last_name,
            contact_emails (
              email,
              is_primary
            )
          `)
          .or(`first_name.ilike.%${attendeeSearch}%,last_name.ilike.%${attendeeSearch}%`)
          .limit(10);

        if (error) throw error;

        // Flatten to show each email as a separate suggestion
        const suggestions = [];
        data?.forEach(contact => {
          const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
          if (contact.contact_emails && contact.contact_emails.length > 0) {
            contact.contact_emails.forEach(emailObj => {
              suggestions.push({
                contact_id: contact.contact_id,
                name: fullName,
                email: emailObj.email,
                is_primary: emailObj.is_primary
              });
            });
          }
        });

        setAttendeeSuggestions(suggestions);
        setShowAttendeeSuggestions(suggestions.length > 0);
      } catch (err) {
        console.error('Error searching contacts:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(searchContacts, 300);
    return () => clearTimeout(timeoutId);
  }, [attendeeSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        attendeeInputRef.current &&
        !attendeeInputRef.current.contains(event.target)
      ) {
        setShowAttendeeSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add attendee from suggestion
  const addAttendeeFromSuggestion = (suggestion) => {
    const currentAttendees = calendarEventEdits.attendees ?? pendingCalendarEvent?.attendees ?? [];
    // Check if already exists
    if (!currentAttendees.some(a => a.email === suggestion.email)) {
      updateCalendarEventField('attendees', [...currentAttendees, { email: suggestion.email, name: suggestion.name }]);
    }
    setAttendeeSearch('');
    setShowAttendeeSuggestions(false);
  };

  // Add attendee from manual email input
  const addAttendeeFromEmail = (email) => {
    if (!email.trim()) return;
    const currentAttendees = calendarEventEdits.attendees ?? pendingCalendarEvent?.attendees ?? [];
    if (!currentAttendees.some(a => a.email === email)) {
      updateCalendarEventField('attendees', [...currentAttendees, { email, name: email.split('@')[0] }]);
    }
    setAttendeeSearch('');
    setShowAttendeeSuggestions(false);
  };

  return (
    <ChatContainer>
      {/* Quick Actions */}
      <QuickActionsContainer theme={theme}>
        {keepInTouchMode ? (
          <>
            <QuickActionChip theme={theme} onClick={() => onKitQuickAction?.('calendar')}>
              <FaCalendarAlt size={12} style={{ color: '#3B82F6' }} /> Calendar
            </QuickActionChip>
            <QuickActionChip theme={theme} onClick={() => onKitQuickAction?.('note')}>
              <FaStickyNote size={12} style={{ color: '#F59E0B' }} /> Note
            </QuickActionChip>
            <QuickActionChip theme={theme} onClick={() => onKitQuickAction?.('task')}>
              <FaTasks size={12} style={{ color: '#8B5CF6' }} /> Task
            </QuickActionChip>
            <QuickActionChip theme={theme} onClick={() => onKitQuickAction?.('deal')}>
              <FaDollarSign size={12} style={{ color: '#10B981' }} /> Deal
            </QuickActionChip>
            <QuickActionChip theme={theme} onClick={() => onKitQuickAction?.('introduction')}>
              <FaHandshake size={12} style={{ color: '#EF4444' }} /> Intro
            </QuickActionChip>
            <QuickActionChip theme={theme} onClick={() => onKitQuickAction?.('whatsapp')}>
              <FaWhatsapp size={12} style={{ color: '#25D366' }} /> WhatsApp
            </QuickActionChip>
            <QuickActionChip theme={theme} onClick={() => onKitQuickAction?.('email')}>
              <FaEnvelope size={12} style={{ color: '#3B82F6' }} /> Email
            </QuickActionChip>
          </>
        ) : (
          <>
            <QuickActionChip theme={theme} onClick={() => handleQuickAction('TL;DR. 2-3 bullet points. Zero filler.')}>
              TL;DR
            </QuickActionChip>
            <QuickActionChip theme={theme} onClick={() => handleQuickAction('Sì breve. Diretto, caldo ma non sdolcinato. Mai "Certamente!" o "Con piacere!". Se scrivono in italiano, rispondi italiano. Se inglese, inglese. Tono informale sempre.')}>
              👍 Yes
            </QuickActionChip>
            <QuickActionChip theme={theme} onClick={() => handleQuickAction(`SAYING NO - Use this exact structure:
Ciao <nome>,

<NO FIRST - pick one>
<Soft compliment 1>
<Soft compliment 2>

Simone

NO PHRASES (5-6 words max) - pick one:
- "Purtroppo non fa per me"
- "Not my cup of tea"
- "Not for me right now"
- "Not looking in this vertical"
- "Non è per me"
- "Doesn't fit my focus"
- "Not interested right now"
- "Non sono interessato"
- "Not a good fit"
- "Passo, grazie"

SOFT COMPLIMENTS - pick 2, rotate them:
English: "Thanks for sharing", "Appreciated you shared", "Best of luck", "Hope it goes well", "You seem to know what you do", "Thanks for thinking of me", "Good luck with it"
Italian: "Grazie di aver condiviso", "Apprezzo la condivisione", "In bocca al lupo", "Buona fortuna", "Spero vada bene", "Sembrate sapere il fatto vostro", "Grazie di aver pensato a me"

LANGUAGE RULE: Use same language as original message

NEVER: Add explanations, say "maybe later", leave doors open, use corporate speak, apologize with "sorry" or "mi dispiace"`)}>
              👎 No
            </QuickActionChip>
            <QuickActionChip theme={theme} onClick={() => handleQuickAction('Una riga. "Ricevuto, grazie" o "Got it, thanks". Basta.')}>
              ✓ Ricevuto
            </QuickActionChip>
            <QuickActionChip
              theme={theme}
              onClick={handleCalendarExtract}
              disabled={calendarLoading}
              style={{ background: theme === 'light' ? '#EBF5FF' : '#1E3A5F', color: theme === 'light' ? '#3B82F6' : '#60A5FA' }}
            >
              {calendarLoading ? '...' : '📅 Calendar'}
            </QuickActionChip>
          </>
        )}
      </QuickActionsContainer>

      {/* Pending Calendar Event UI */}
      {pendingCalendarEvent && (
        <div style={{
          margin: '12px',
          padding: '12px',
          borderRadius: '8px',
          background: theme === 'light' ? '#F0F9FF' : '#1E3A5F',
          border: `1px solid ${theme === 'light' ? '#BFDBFE' : '#3B82F6'}`,
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: theme === 'light' ? '#1E40AF' : '#93C5FD' }}>
            📅 Create Event
          </div>
          <input
            type="text"
            placeholder="Title"
            value={calendarEventEdits.title ?? pendingCalendarEvent.title ?? ''}
            onChange={(e) => updateCalendarEventField('title', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
              background: theme === 'light' ? '#FFFFFF' : '#374151',
              color: theme === 'light' ? '#111827' : '#F9FAFB',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="datetime-local"
            value={(() => {
              const dt = calendarEventEdits.datetime || pendingCalendarEvent.datetime;
              if (!dt) return '';
              try { return new Date(dt).toISOString().slice(0, 16); } catch { return ''; }
            })()}
            onChange={(e) => updateCalendarEventField('datetime', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
              background: theme === 'light' ? '#FFFFFF' : '#374151',
              color: theme === 'light' ? '#111827' : '#F9FAFB',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
          {/* Timezone selector */}
          <select
            value={calendarEventEdits.timezone ?? 'Europe/Rome'}
            onChange={(e) => updateCalendarEventField('timezone', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
              background: theme === 'light' ? '#FFFFFF' : '#374151',
              color: theme === 'light' ? '#111827' : '#F9FAFB',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          >
            <option value="Europe/Rome">Europe/Rome (CET)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Europe/Paris">Europe/Paris (CET)</option>
            <option value="Europe/Berlin">Europe/Berlin (CET)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Asia/Seoul">Asia/Seoul (KST)</option>
            <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
            <option value="UTC">UTC</option>
          </select>
          {/* Location suggestions */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                updateCalendarEventField('location', 'Fora Notting Hill, 9 Pembridge Rd, London W11 3JY');
                updateCalendarEventField('useGoogleMeet', false);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: 'none',
                background: (calendarEventEdits.location ?? '').includes('Fora') ? '#3B82F6' : (theme === 'light' ? '#E5E7EB' : '#4B5563'),
                color: (calendarEventEdits.location ?? '').includes('Fora') ? 'white' : (theme === 'light' ? '#374151' : '#E5E7EB'),
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              🏢 Office
            </button>
            <button
              type="button"
              onClick={() => {
                updateCalendarEventField('location', 'The Roof Gardens, 99 Kensington High St, London W8 5SA');
                updateCalendarEventField('useGoogleMeet', false);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: 'none',
                background: (calendarEventEdits.location ?? '').includes('Roof Gardens') ? '#3B82F6' : (theme === 'light' ? '#E5E7EB' : '#4B5563'),
                color: (calendarEventEdits.location ?? '').includes('Roof Gardens') ? 'white' : (theme === 'light' ? '#374151' : '#E5E7EB'),
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              🍸 Club
            </button>
            <button
              type="button"
              onClick={() => {
                updateCalendarEventField('location', 'Google Meet');
                updateCalendarEventField('useGoogleMeet', true);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: 'none',
                background: calendarEventEdits.useGoogleMeet ? '#3B82F6' : (theme === 'light' ? '#E5E7EB' : '#4B5563'),
                color: calendarEventEdits.useGoogleMeet ? 'white' : (theme === 'light' ? '#374151' : '#E5E7EB'),
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              📹 Google Meet
            </button>
          </div>
          <input
            type="text"
            placeholder="Location"
            value={calendarEventEdits.location ?? pendingCalendarEvent.location ?? ''}
            onChange={(e) => {
              updateCalendarEventField('location', e.target.value);
              if (!e.target.value.includes('Google Meet')) {
                updateCalendarEventField('useGoogleMeet', false);
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
              background: theme === 'light' ? '#FFFFFF' : '#374151',
              color: theme === 'light' ? '#111827' : '#F9FAFB',
              fontSize: '13px',
              boxSizing: 'border-box',
            }}
          />
          {/* Attendees - editable list */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '4px' }}>
              👥 Attendees
            </div>
            {/* List of attendees with remove button */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
              {(calendarEventEdits.attendees ?? pendingCalendarEvent.attendees ?? []).map((attendee, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: theme === 'light' ? '#E0F2FE' : '#1E3A5F',
                    color: theme === 'light' ? '#0369A1' : '#7DD3FC',
                    fontSize: '11px',
                  }}
                >
                  <span>{attendee.name && attendee.email ? `${attendee.name} (${attendee.email})` : (attendee.email || attendee.name)}</span>
                  <button
                    onClick={() => {
                      const currentAttendees = calendarEventEdits.attendees ?? pendingCalendarEvent.attendees ?? [];
                      const newAttendees = currentAttendees.filter((_, i) => i !== idx);
                      updateCalendarEventField('attendees', newAttendees);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0',
                      cursor: 'pointer',
                      color: theme === 'light' ? '#0369A1' : '#7DD3FC',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              ))}
            </div>
            {/* Add new attendee input with autocomplete */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  ref={attendeeInputRef}
                  type="text"
                  placeholder="Search contact name or enter email..."
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  onFocus={() => {
                    if (attendeeSuggestions.length > 0) setShowAttendeeSuggestions(true);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // If email-like, add directly
                      if (attendeeSearch.includes('@')) {
                        addAttendeeFromEmail(attendeeSearch);
                      } else if (attendeeSuggestions.length > 0) {
                        // Select first suggestion
                        addAttendeeFromSuggestion(attendeeSuggestions[0]);
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    background: theme === 'light' ? '#FFFFFF' : '#374151',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => {
                    if (attendeeSearch.includes('@')) {
                      addAttendeeFromEmail(attendeeSearch);
                    } else if (attendeeSuggestions.length > 0) {
                      addAttendeeFromSuggestion(attendeeSuggestions[0]);
                    }
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: theme === 'light' ? '#E5E7EB' : '#4B5563',
                    color: theme === 'light' ? '#374151' : '#E5E7EB',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <FaPlus size={10} />
                </button>
              </div>
              {/* Suggestions dropdown */}
              {showAttendeeSuggestions && (
                <div
                  ref={suggestionsRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: theme === 'light' ? '#FFFFFF' : '#374151',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 100,
                  }}
                >
                  {loadingSuggestions ? (
                    <div style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                      fontSize: '12px',
                    }}>
                      Searching...
                    </div>
                  ) : attendeeSuggestions.length === 0 ? (
                    <div style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                      fontSize: '12px',
                    }}>
                      No contacts found
                    </div>
                  ) : (
                    attendeeSuggestions.map((suggestion, idx) => (
                      <div
                        key={`${suggestion.contact_id}-${suggestion.email}`}
                        onClick={() => addAttendeeFromSuggestion(suggestion)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: idx < attendeeSuggestions.length - 1
                            ? `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}`
                            : 'none',
                          background: theme === 'light' ? '#FFFFFF' : '#374151',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme === 'light' ? '#F3F4F6' : '#4B5563';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme === 'light' ? '#FFFFFF' : '#374151';
                        }}
                      >
                        <div style={{
                          fontWeight: 500,
                          fontSize: '13px',
                          color: theme === 'light' ? '#111827' : '#F9FAFB',
                          marginBottom: '2px',
                        }}>
                          {suggestion.name}
                          {suggestion.is_primary && (
                            <span style={{
                              marginLeft: '6px',
                              fontSize: '10px',
                              color: '#10B981',
                              fontWeight: 400,
                            }}>
                              (primary)
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                        }}>
                          {suggestion.email}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCreateCalendarEvent}
              disabled={calendarLoading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: '#3B82F6',
                color: 'white',
                fontWeight: 500,
                fontSize: '13px',
                cursor: calendarLoading ? 'not-allowed' : 'pointer',
                opacity: calendarLoading ? 0.7 : 1,
              }}
            >
              {calendarLoading ? 'Creating...' : '✓ Create & Send Invites'}
            </button>
            <button
              onClick={() => { setPendingCalendarEvent(null); setCalendarEventEdits({}); }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                background: 'transparent',
                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <ChatMessages ref={chatMessagesRef} theme={theme}>
        {chatMessages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: theme === 'light' ? '#9CA3AF' : '#6B7280',
            padding: '24px',
            fontSize: '14px'
          }}>
            <FaRobot size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div>Ask Claude about this {contextLabel}</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              Try the quick actions above or type your question
            </div>
          </div>
        )}
        {chatMessages.map((msg, idx) => {
          const draftText = msg.role === 'assistant' ? extractDraftFromMessage(msg.content) : null;
          return (
            <ChatMessage key={idx} theme={theme} $isUser={msg.role === 'user'}>
              {msg.images && msg.images.length > 0 && (
                <ChatMessageImages>
                  {msg.images.map((imgSrc, imgIdx) => (
                    <img key={imgIdx} src={imgSrc} alt={`Attached ${imgIdx + 1}`} />
                  ))}
                </ChatMessageImages>
              )}
              {msg.content}
              {draftText && (
                <AcceptDraftButton onClick={() => openReplyWithDraft(draftText)}>
                  <FaCheck size={12} /> Accept & Edit
                </AcceptDraftButton>
              )}
            </ChatMessage>
          );
        })}
        {chatLoading && (
          <TypingIndicator theme={theme}>
            <span></span>
            <span></span>
            <span></span>
          </TypingIndicator>
        )}
      </ChatMessages>

      {/* Image Preview Area */}
      {chatImages.length > 0 && (
        <ChatImagePreviewContainer theme={theme}>
          {chatImages.map((img, idx) => (
            <ChatImagePreview key={idx} theme={theme}>
              <img src={img.preview} alt={`Attachment ${idx + 1}`} />
              <ChatImageRemoveButton onClick={() => removeChatImage(idx)}>
                <FaTimes />
              </ChatImageRemoveButton>
            </ChatImagePreview>
          ))}
        </ChatImagePreviewContainer>
      )}

      {/* Chat Input */}
      <ChatInputContainer theme={theme}>
        <input
          type="file"
          accept="image/*"
          multiple
          ref={chatFileInputRef}
          onChange={handleChatImageSelect}
          style={{ display: 'none' }}
        />
        <ChatAttachButton
          theme={theme}
          onClick={() => chatFileInputRef.current?.click()}
          title="Attach images"
        >
          <FaImage size={16} />
        </ChatAttachButton>
        <ChatInput
          theme={theme}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !chatLoading && sendMessageToClaude(chatInput)}
          placeholder={`Ask Claude about this ${contextLabel}...`}
          disabled={chatLoading}
        />
        <ChatSendButton
          onClick={() => sendMessageToClaude(chatInput)}
          disabled={chatLoading || (!chatInput.trim() && chatImages.length === 0)}
        >
          <FaPaperPlane size={14} />
        </ChatSendButton>
      </ChatInputContainer>
    </ChatContainer>
  );
};

export default ChatTab;
