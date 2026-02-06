import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { FaArrowLeft, FaEllipsisV, FaCheck, FaCheckDouble, FaPaperPlane, FaUsers, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { format } from 'date-fns';
import MobileContextPanel from './MobileContextPanel';

/**
 * MobileWhatsAppView - WhatsApp chat detail view for mobile
 * Shows messages with sent/received bubbles and reply input
 */
const MobileWhatsAppView = ({
  chat,
  onBack,
  onDone,
  onMoreActions,
  onSendMessage,
  theme = 'dark',
  // Context panel props
  contact,
  company,
  tasks = [],
  deals = [],
  notes = [],
  introductions = [],
  files = [],
  onSendEmail,
  onCreateTask,
  onCreateNote,
  onViewFiles,
  onViewContact,
  onViewCompany,
  onViewDeals,
  onViewIntroductions,
}) => {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [replyText]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages]);

  if (!chat) {
    return (
      <EmptyState theme={theme}>
        <p>Select a chat to view</p>
      </EmptyState>
    );
  }

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return '';
    }
  };

  const formatDateDivider = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'TODAY';
      if (diffDays === 1) return 'YESTERDAY';
      return format(date, 'MMMM d, yyyy').toUpperCase();
    } catch {
      return '';
    }
  };

  const getDisplayName = (chat) => {
    return chat.chat_name || chat.contact_number || 'Unknown';
  };

  const handleSend = async () => {
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage?.(replyText.trim());
      setReplyText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const messages = chat.messages || [];
  const messagesByDate = {};
  messages.forEach(msg => {
    const dateKey = new Date(msg.date).toDateString();
    if (!messagesByDate[dateKey]) {
      messagesByDate[dateKey] = [];
    }
    messagesByDate[dateKey].push(msg);
  });

  // Helper: check if previous message is same direction (for grouping bubbles)
  const isSameGroup = (msgs, idx) => {
    if (idx === 0) return false;
    return msgs[idx].direction === msgs[idx - 1].direction;
  };

  return (
    <Container theme={theme}>
      {/* WhatsApp Teal Header */}
      <Header theme={theme}>
        <BackButton onClick={onBack} theme={theme}>
          <FaArrowLeft size={18} />
        </BackButton>
        <Avatar theme={theme} $isGroup={chat.is_group_chat}>
          {chat.profile_image_url && !chat.is_group_chat ? (
            <AvatarImg src={chat.profile_image_url} alt={getDisplayName(chat)} />
          ) : chat.is_group_chat ? (
            <FaUsers size={16} />
          ) : (
            getDisplayName(chat).charAt(0).toUpperCase()
          )}
        </Avatar>
        <HeaderText>
          <ChatName theme={theme}>{getDisplayName(chat)}</ChatName>
          <ChatSubtitle theme={theme}>
            {chat.is_group_chat ? 'Group chat' : 'tap here for contact info'}
          </ChatSubtitle>
        </HeaderText>
        <HeaderActions>
          <HeaderIconButton onClick={onDone} theme={theme} title="Done">
            <FaCheck size={16} />
          </HeaderIconButton>
          <HeaderIconButton onClick={onMoreActions} theme={theme} title="More">
            <FaEllipsisV size={16} />
          </HeaderIconButton>
        </HeaderActions>
      </Header>

      {/* Messages with wallpaper background */}
      <MessagesContainer theme={theme}>
        {Object.entries(messagesByDate)
          .sort(([a], [b]) => new Date(a) - new Date(b))
          .map(([dateKey, msgs]) => (
            <div key={dateKey}>
              <DateDivider theme={theme}>
                <DatePill theme={theme}>
                  {formatDateDivider(msgs[0].date)}
                </DatePill>
              </DateDivider>
              {msgs.map((msg, idx) => {
                const isSent = msg.direction === 'sent';
                const grouped = isSameGroup(msgs, idx);
                return (
                  <BubbleRow key={msg.id || msg.message_uid || idx} $isSent={isSent} $grouped={grouped}>
                    <MessageBubble
                      theme={theme}
                      $isSent={isSent}
                      $grouped={grouped}
                    >
                      {chat.is_group_chat && !isSent && msg.first_name && !grouped && (
                        <SenderName $name={msg.first_name}>
                          {msg.first_name}
                        </SenderName>
                      )}
                      <MessageContent>
                        <MessageText>
                          {msg.body_text || msg.snippet || ''}
                        </MessageText>
                        <MessageMeta $isSent={isSent}>
                          <MessageTime theme={theme} $isSent={isSent}>
                            {formatMessageTime(msg.date)}
                          </MessageTime>
                          {isSent && (
                            msg.is_read ? (
                              <FaCheckDouble size={13} style={{ color: '#53BDEB' }} />
                            ) : (
                              <FaCheckDouble size={13} style={{ color: theme === 'light' ? '#8696A0' : '#8696A0' }} />
                            )
                          )}
                        </MessageMeta>
                      </MessageContent>
                    </MessageBubble>
                  </BubbleRow>
                );
              })}
            </div>
          ))
        }
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {/* Context Panel Toggle */}
      {(contact || company) && (
        <ContextToggle theme={theme} onClick={() => setShowContext(!showContext)}>
          <span>Context & Actions</span>
          {showContext ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </ContextToggle>
      )}

      {/* Context Panel */}
      {showContext && (contact || company) && (
        <MobileContextPanel
          theme={theme}
          contact={contact}
          company={company}
          tasks={tasks}
          deals={deals}
          notes={notes}
          introductions={introductions}
          files={files}
          onSendEmail={onSendEmail}
          onSendWhatsApp={null}
          onCreateTask={onCreateTask}
          onCreateNote={onCreateNote}
          onViewFiles={onViewFiles}
          onViewContact={onViewContact}
          onViewCompany={onViewCompany}
          onViewDeals={onViewDeals}
          onViewIntroductions={onViewIntroductions}
          defaultExpanded={['contact', 'quickActions']}
        />
      )}

      {/* WhatsApp-style Input Bar */}
      <InputBar theme={theme}>
        <InputField
          ref={textareaRef}
          theme={theme}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
        />
        <SendButton
          theme={theme}
          $hasText={replyText.trim().length > 0}
          onClick={handleSend}
          disabled={!replyText.trim() || sending}
        >
          {sending ? (
            <SendingIndicator />
          ) : (
            <FaPaperPlane size={18} />
          )}
        </SendButton>
      </InputBar>
    </Container>
  );
};

// ─── Styled Components ──────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${p => p.theme === 'light' ? '#ECE5DD' : '#0B141A'};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 6px;
  background: ${p => p.theme === 'light' ? '#008069' : '#1F2C34'};
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  z-index: 2;
  min-height: 56px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${p => p.theme === 'light' ? '#FFFFFF' : '#AEBAC1'};
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;

  &:active {
    background: rgba(255,255,255,0.1);
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${p => p.$isGroup
    ? (p.theme === 'light' ? '#00A884' : '#00A884')
    : (p.theme === 'light' ? '#DFE5E7' : '#6B7C85')};
  color: ${p => p.$isGroup
    ? '#FFFFFF'
    : (p.theme === 'light' ? '#FFFFFF' : '#CFD8DC')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 500;
  flex-shrink: 0;
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`;

const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${p => p.theme === 'light' ? '#FFFFFF' : '#E9EDEF'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatSubtitle = styled.div`
  font-size: 12px;
  color: ${p => p.theme === 'light' ? 'rgba(255,255,255,0.7)' : '#8696A0'};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const HeaderIconButton = styled.button`
  background: none;
  border: none;
  color: ${p => p.theme === 'light' ? '#FFFFFF' : '#AEBAC1'};
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;

  &:active {
    background: rgba(255,255,255,0.1);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 6px 12px 8px;
  background: ${p => p.theme === 'light' ? '#ECE5DD' : '#0B141A'};
  display: flex;
  flex-direction: column;
`;

const DateDivider = styled.div`
  display: flex;
  justify-content: center;
  padding: 8px 0 6px;
`;

const DatePill = styled.div`
  background: ${p => p.theme === 'light' ? '#E1F2FB' : '#182229'};
  color: ${p => p.theme === 'light' ? '#54656F' : '#8696A0'};
  font-size: 11.5px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  box-shadow: 0 1px 1px rgba(0,0,0,0.08);
`;

const BubbleRow = styled.div`
  display: flex;
  justify-content: ${p => p.$isSent ? 'flex-end' : 'flex-start'};
  margin-top: ${p => p.$grouped ? '2px' : '8px'};
  padding: 0 6px;
`;

const bubbleTailSent = css`
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: -8px;
    width: 0;
    height: 0;
    border-left: 8px solid ${p => p.theme === 'light' ? '#D9FDD3' : '#005C4B'};
    border-bottom: 8px solid transparent;
  }
`;

const bubbleTailReceived = css`
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -8px;
    width: 0;
    height: 0;
    border-right: 8px solid ${p => p.theme === 'light' ? '#FFFFFF' : '#202C33'};
    border-bottom: 8px solid transparent;
  }
`;

const MessageBubble = styled.div`
  position: relative;
  max-width: 80%;
  padding: 6px 8px 4px;
  border-radius: 8px;

  ${p => p.$isSent
    ? css`
      background: ${p.theme === 'light' ? '#D9FDD3' : '#005C4B'};
      border-top-right-radius: ${p.$grouped ? '8px' : '0'};
      color: ${p.theme === 'light' ? '#111B21' : '#E9EDEF'};
      ${!p.$grouped && bubbleTailSent}
    `
    : css`
      background: ${p.theme === 'light' ? '#FFFFFF' : '#202C33'};
      border-top-left-radius: ${p.$grouped ? '8px' : '0'};
      color: ${p.theme === 'light' ? '#111B21' : '#E9EDEF'};
      ${!p.$grouped && bubbleTailReceived}
    `
  }

  box-shadow: 0 1px 0.5px rgba(11,20,26,0.13);
`;

const SenderName = styled.div`
  font-size: 12.5px;
  font-weight: 600;
  margin-bottom: 2px;
  color: ${p => {
    const colors = ['#06CF9C', '#25D366', '#53BDEB', '#FFB74D', '#E57373', '#BA68C8', '#4FC3F7', '#FF8A65'];
    const hash = p.$name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  }};
`;

const MessageContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
`;

const MessageText = styled.span`
  font-size: 14.2px;
  line-height: 1.35;
  word-break: break-word;
  white-space: pre-wrap;
`;

const MessageMeta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 8px;
  flex-shrink: 0;
  float: right;
  padding-top: 4px;
`;

const MessageTime = styled.span`
  font-size: 11px;
  color: ${p => p.$isSent
    ? (p.theme === 'light' ? '#667781' : '#8696A0')
    : (p.theme === 'light' ? '#667781' : '#8696A0')};
`;

const ContextToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 16px;
  background: ${p => p.theme === 'light' ? '#F0F2F5' : '#1F2C34'};
  border: none;
  border-top: 1px solid ${p => p.theme === 'light' ? '#E9EDEF' : '#2A373F'};
  color: ${p => p.theme === 'light' ? '#54656F' : '#8696A0'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  min-height: 40px;
`;

const InputBar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 5px 6px;
  background: ${p => p.theme === 'light' ? '#F0F2F5' : '#1F2C34'};
`;

const InputField = styled.textarea`
  flex: 1;
  min-height: 42px;
  max-height: 120px;
  padding: 10px 14px;
  border-radius: 24px;
  border: none;
  background: ${p => p.theme === 'light' ? '#FFFFFF' : '#2A3942'};
  color: ${p => p.theme === 'light' ? '#111B21' : '#E9EDEF'};
  font-size: 15px;
  line-height: 1.35;
  resize: none;
  outline: none;
  font-family: inherit;
  box-shadow: 0 1px 1px rgba(0,0,0,0.06);

  &::placeholder {
    color: ${p => p.theme === 'light' ? '#8696A0' : '#8696A0'};
  }
`;

const SendButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: ${p => p.$hasText ? '#00A884' : '#00A884'};
  color: ${p => p.theme === 'light' ? '#FFFFFF' : '#E9EDEF'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
  flex-shrink: 0;

  &:active {
    background: #008069;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SendingIndicator = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${p => p.theme === 'light' ? '#667781' : '#8696A0'};
`;

export default MobileWhatsAppView;
