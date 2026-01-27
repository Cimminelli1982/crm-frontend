import React, { useState } from 'react';
import styled from 'styled-components';
import { FaChevronDown, FaChevronRight, FaInbox, FaBolt, FaClock, FaEnvelope } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

/**
 * MobileEmailList - Email list optimized for mobile
 * Shows threads grouped by status: Inbox, Need Actions, Waiting Input
 */
const MobileEmailList = ({
  threads = [],
  selectedThread,
  onSelectThread,
  onArchive,
  onReply,
  theme = 'dark',
}) => {
  // Section expansion state
  const [expandedSections, setExpandedSections] = useState({
    inbox: true,
    need_actions: true,
    waiting_input: false,
  });

  // Filter threads by status
  const filterByStatus = (items, status) => {
    if (status === 'inbox') return items.filter(item => !item.status);
    return items.filter(item => item.status === status);
  };

  const inboxThreads = filterByStatus(threads, 'inbox');
  const needActionsThreads = filterByStatus(threads, 'need_actions');
  const waitingInputThreads = filterByStatus(threads, 'waiting_input');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getRelevantPerson = (email) => {
    if (!email) return 'Unknown';
    // If sent by me, show recipient; otherwise show sender
    if (email.direction === 'sent') {
      return email.to_name || email.to_email || 'Unknown';
    }
    return email.from_name || email.from_email || 'Unknown';
  };

  const renderEmailItem = (thread) => {
    const email = thread.latestEmail || thread;
    const isSelected = selectedThread?.threadId === thread.threadId;

    return (
      <EmailItem
        key={thread.threadId || thread.id}
        theme={theme}
        $selected={isSelected}
        onClick={() => onSelectThread(thread)}
      >
        <EmailAvatar theme={theme}>
          {(getRelevantPerson(email)?.charAt(0) || '?').toUpperCase()}
        </EmailAvatar>
        <EmailContent>
          <EmailHeader>
            <EmailSender theme={theme} $unread={!email.is_read}>
              {getRelevantPerson(email)}
            </EmailSender>
            <EmailDate theme={theme}>
              {formatDate(email.date || email.received_at)}
            </EmailDate>
          </EmailHeader>
          <EmailSubject theme={theme} $unread={!email.is_read}>
            {email.subject || '(No subject)'}
          </EmailSubject>
          <EmailSnippet theme={theme}>
            {email.snippet || email.body_text?.substring(0, 80) || ''}
          </EmailSnippet>
        </EmailContent>
        {thread.count > 1 && (
          <ThreadCount theme={theme}>{thread.count}</ThreadCount>
        )}
      </EmailItem>
    );
  };

  const renderSection = (title, icon, threads, sectionKey, color) => {
    const isExpanded = expandedSections[sectionKey];
    const count = threads.length;

    if (count === 0) return null;

    return (
      <Section key={sectionKey}>
        <SectionHeader
          theme={theme}
          onClick={() => toggleSection(sectionKey)}
        >
          <SectionLeft>
            <SectionIcon style={{ color }}>{icon}</SectionIcon>
            <SectionTitle theme={theme}>{title}</SectionTitle>
            <SectionCount theme={theme}>{count}</SectionCount>
          </SectionLeft>
          <ChevronIcon theme={theme}>
            {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
          </ChevronIcon>
        </SectionHeader>
        {isExpanded && (
          <SectionContent>
            {threads.map(renderEmailItem)}
          </SectionContent>
        )}
      </Section>
    );
  };

  if (threads.length === 0) {
    return (
      <EmptyState theme={theme}>
        <FaEnvelope size={48} style={{ opacity: 0.3 }} />
        <EmptyTitle theme={theme}>No emails</EmptyTitle>
        <EmptyText theme={theme}>Your inbox is empty</EmptyText>
      </EmptyState>
    );
  }

  return (
    <Container>
      {renderSection('Inbox', <FaInbox />, inboxThreads, 'inbox', '#3B82F6')}
      {renderSection('Need Actions', <FaBolt />, needActionsThreads, 'need_actions', '#F59E0B')}
      {renderSection('Waiting Input', <FaClock />, waitingInputThreads, 'waiting_input', '#8B5CF6')}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 8px 0;
`;

const Section = styled.div`
  margin-bottom: 8px;
`;

const SectionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  border: none;
  cursor: pointer;
`;

const SectionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionIcon = styled.span`
  display: flex;
  align-items: center;
  font-size: 14px;
`;

const SectionTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const SectionCount = styled.span`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 2px 8px;
  border-radius: 10px;
`;

const ChevronIcon = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const SectionContent = styled.div``;

const EmailItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#EBF5FF' : '#1E3A5F')
    : (props.theme === 'light' ? '#FFFFFF' : '#111827')
  };
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
  cursor: pointer;
  min-height: 72px;

  &:active {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  }
`;

const EmailAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
`;

const EmailContent = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const EmailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
`;

const EmailSender = styled.span`
  font-size: 15px;
  font-weight: ${props => props.$unread ? '600' : '400'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const EmailDate = styled.span`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  white-space: nowrap;
  flex-shrink: 0;
`;

const EmailSubject = styled.div`
  font-size: 14px;
  font-weight: ${props => props.$unread ? '500' : '400'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
`;

const EmailSnippet = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ThreadCount = styled.span`
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
  flex-shrink: 0;
  align-self: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 16px 0 8px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
`;

export default MobileEmailList;
