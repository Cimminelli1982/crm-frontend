import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaReply, FaArchive, FaEllipsisV, FaCheck, FaCheckDouble, FaPaperPlane, FaUsers, FaChevronDown, FaChevronUp } from 'react-icons/fa';
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
  const [showContext, setShowContext] = useState(false); // Default collapsed for chat
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

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      return format(date, 'MMMM d, yyyy');
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

  return (
    <Container theme={theme}>
      {/* Header */}
      <Header theme={theme}>
        <HeaderInfo>
          <Avatar theme={theme} $isGroup={chat.is_group_chat}>
            {chat.is_group_chat ? (
              <FaUsers size={16} />
            ) : (
              getDisplayName(chat).charAt(0).toUpperCase()
            )}
          </Avatar>
          <HeaderText>
            <ChatName theme={theme}>{getDisplayName(chat)}</ChatName>
            <ChatInfo theme={theme}>
              {chat.is_group_chat ? 'Group' : chat.contact_number}
            </ChatInfo>
          </HeaderText>
        </HeaderInfo>
      </Header>

      {/* Messages */}
      <MessagesContainer theme={theme}>
        {Object.entries(messagesByDate)
          .sort(([a], [b]) => new Date(a) - new Date(b))
          .map(([dateKey, msgs]) => (
            <div key={dateKey}>
              <DateDivider theme={theme}>
                {formatDateDivider(msgs[0].date)}
              </DateDivider>
              {msgs.map((msg, idx) => (
                <MessageBubble
                  key={msg.id || msg.message_uid || idx}
                  theme={theme}
                  $isSent={msg.direction === 'sent'}
                >
                  {chat.is_group_chat && msg.direction !== 'sent' && msg.first_name && (
                    <SenderName $name={msg.first_name}>
                      {msg.first_name}
                    </SenderName>
                  )}
                  <MessageText>
                    {msg.body_text || msg.snippet || ''}
                  </MessageText>
                  <MessageMeta $isSent={msg.direction === 'sent'}>
                    <MessageTime theme={theme}>
                      {formatMessageTime(msg.date)}
                    </MessageTime>
                    {msg.direction === 'sent' && (
                      msg.is_read ? (
                        <FaCheckDouble size={12} style={{ color: '#60A5FA' }} />
                      ) : (
                        <FaCheck size={12} style={{ color: '#9CA3AF' }} />
                      )
                    )}
                  </MessageMeta>
                </MessageBubble>
              ))}
            </div>
          ))
        }
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {/* Reply Input */}
      <ReplyContainer theme={theme}>
        <ReplyInput
          ref={textareaRef}
          theme={theme}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
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
            <FaPaperPlane size={16} />
          )}
        </SendButton>
      </ReplyContainer>

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
          onSendWhatsApp={null} // Already in WhatsApp
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

      {/* Quick Actions */}
      <QuickActions theme={theme}>
        <QuickActionButton theme={theme} onClick={onDone}>
          <FaCheck />
          <span>Done</span>
        </QuickActionButton>
        <QuickActionButton theme={theme} onClick={onMoreActions}>
          <FaEllipsisV />
          <span>More</span>
        </QuickActionButton>
      </QuickActions>
    </Container>
  );
};

const ContextToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  border: none;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-height: 48px;
`;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
`;

const Header = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: ${props => props.$isGroup
    ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')
    : (props.theme === 'light' ? '#D1FAE5' : '#064E3B')};
  color: ${props => props.$isGroup
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : '#25D366'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
`;

const HeaderText = styled.div`
  flex: 1;
`;

const ChatName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ChatInfo = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#111827'};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DateDivider = styled.div`
  text-align: center;
  padding: 8px 0;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  }
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  align-self: ${props => props.$isSent ? 'flex-end' : 'flex-start'};
  background: ${props => props.$isSent
    ? (props.theme === 'light' ? '#DCF8C6' : '#054640')
    : (props.theme === 'light' ? '#FFFFFF' : '#1F2937')};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const SenderName = styled.div`
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: ${props => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const hash = props.$name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  }};
`;

const MessageText = styled.div`
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  color: inherit;
`;

const MessageMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isSent ? 'flex-end' : 'flex-start'};
  gap: 4px;
  margin-top: 4px;
`;

const MessageTime = styled.span`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
`;

const ReplyContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const ReplyInput = styled.textarea`
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 10px 14px;
  border-radius: 20px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  line-height: 1.4;
  resize: none;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: #25D366;
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const SendButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: ${props => props.$hasText
    ? '#25D366'
    : (props.theme === 'light' ? '#E5E7EB' : '#374151')};
  color: ${props => props.$hasText ? 'white' : (props.theme === 'light' ? '#9CA3AF' : '#6B7280')};
  cursor: ${props => props.$hasText ? 'pointer' : 'default'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:active {
    transform: ${props => props.$hasText ? 'scale(0.95)' : 'none'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SendingIndicator = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const QuickActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border: none;
  border-radius: 8px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;

  &:active {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

export default MobileWhatsAppView;
