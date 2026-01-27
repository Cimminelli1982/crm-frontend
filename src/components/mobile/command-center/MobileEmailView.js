import React from 'react';
import styled from 'styled-components';
import { FaReply, FaArchive, FaEllipsisV, FaPaperclip } from 'react-icons/fa';
import { format } from 'date-fns';

/**
 * MobileEmailView - Email detail view for mobile
 * Shows full email thread with action buttons
 */
const MobileEmailView = ({
  thread,
  selectedEmail,
  onBack,
  onReply,
  onArchive,
  onMoreActions,
  theme = 'dark',
}) => {
  if (!thread) {
    return (
      <EmptyState theme={theme}>
        <p>Select an email to view</p>
      </EmptyState>
    );
  }

  // Get emails in thread (or just the single email)
  const emails = thread.emails || [thread.latestEmail || thread];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return '';
    }
  };

  const getRelevantPerson = (email) => {
    if (!email) return 'Unknown';
    if (email.direction === 'sent') {
      return email.to_name || email.to_email || 'Unknown';
    }
    return email.from_name || email.from_email || 'Unknown';
  };

  // Sanitize HTML content
  const sanitizeHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<img[^>]*src=["']cid:[^"']*["'][^>]*>/gi, '')
      .replace(/src=["']cid:[^"']*["']/gi, 'src=""')
      .replace(/<a\s+(?![^>]*target=)/gi, '<a target="_blank" rel="noopener noreferrer" ');
  };

  const latestEmail = emails[0] || thread.latestEmail;

  return (
    <Container theme={theme}>
      {/* Header with subject */}
      <Header theme={theme}>
        <Subject theme={theme}>
          {latestEmail?.subject || '(No subject)'}
        </Subject>
        <ThreadInfo theme={theme}>
          {emails.length > 1 && `${emails.length} messages`}
        </ThreadInfo>
      </Header>

      {/* Email messages */}
      <MessagesContainer>
        {emails.map((email, index) => (
          <EmailMessage key={email.id || index} theme={theme}>
            <MessageHeader>
              <Avatar theme={theme}>
                {(getRelevantPerson(email)?.charAt(0) || '?').toUpperCase()}
              </Avatar>
              <MessageInfo>
                <SenderName theme={theme}>
                  {email.from_name || email.from_email || 'Unknown'}
                </SenderName>
                <MessageMeta theme={theme}>
                  to {email.to_name || email.to_email || 'me'}
                  {email.cc_recipients?.length > 0 && (
                    <span>, +{email.cc_recipients.length} cc</span>
                  )}
                </MessageMeta>
              </MessageInfo>
              <MessageDate theme={theme}>
                {formatDate(email.date || email.received_at)}
              </MessageDate>
            </MessageHeader>

            {/* Attachments */}
            {email.has_attachments && email.attachments?.length > 0 && (
              <AttachmentsBar theme={theme}>
                <FaPaperclip size={12} />
                <span>{email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}</span>
              </AttachmentsBar>
            )}

            {/* Email body */}
            <MessageBody
              theme={theme}
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(email.body_html || email.body_text || '')
              }}
            />
          </EmailMessage>
        ))}
      </MessagesContainer>

      {/* Quick Actions */}
      <QuickActions theme={theme}>
        <QuickActionButton theme={theme} onClick={onReply}>
          <FaReply />
          <span>Reply</span>
        </QuickActionButton>
        <QuickActionButton theme={theme} onClick={onArchive}>
          <FaArchive />
          <span>Archive</span>
        </QuickActionButton>
        <QuickActionButton theme={theme} onClick={onMoreActions}>
          <FaEllipsisV />
          <span>More</span>
        </QuickActionButton>
      </QuickActions>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Subject = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 4px 0;
  line-height: 1.3;
`;

const ThreadInfo = styled.span`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const EmailMessage = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
`;

const MessageInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SenderName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const MessageMeta = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const MessageDate = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  white-space: nowrap;
  flex-shrink: 0;
`;

const AttachmentsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  border-radius: 8px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 12px;
`;

const MessageBody = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  word-wrap: break-word;
  overflow-wrap: break-word;

  a {
    color: #3B82F6;
    text-decoration: none;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  blockquote {
    border-left: 3px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
    padding-left: 12px;
    margin-left: 0;
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  }

  pre, code {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
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

export default MobileEmailView;
