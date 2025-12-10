import React from 'react';
import { FaRobot, FaTimes, FaImage, FaPaperPlane, FaCheck } from 'react-icons/fa';
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

const ChatTab = ({
  theme,
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
}) => {
  return (
    <ChatContainer>
      {/* Quick Actions */}
      <QuickActionsContainer theme={theme}>
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
          <input
            type="text"
            placeholder="Location"
            value={calendarEventEdits.location ?? pendingCalendarEvent.location ?? ''}
            onChange={(e) => updateCalendarEventField('location', e.target.value)}
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
          {pendingCalendarEvent.attendees?.length > 0 && (
            <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '8px' }}>
              👥 {pendingCalendarEvent.attendees.map(a => a.name || a.email).join(', ')}
            </div>
          )}
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
            <div>Ask Claude about this email</div>
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
          placeholder="Ask Claude about this email..."
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
