import React, { useState } from 'react';
import styled from 'styled-components';
import { FaChevronDown, FaChevronRight, FaInbox, FaBolt, FaClock, FaWhatsapp, FaUsers } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

/**
 * MobileWhatsAppList - WhatsApp chat list optimized for mobile
 * Shows chats grouped by status: Inbox, Need Actions, Waiting Input
 */
const MobileWhatsAppList = ({
  chats = [],
  selectedChat,
  onSelectChat,
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

  // Filter chats by status
  const filterByStatus = (items, status) => {
    if (status === 'inbox') return items.filter(item => !item.status);
    return items.filter(item => item.status === status);
  };

  const inboxChats = filterByStatus(chats, 'inbox');
  const needActionsChats = filterByStatus(chats, 'need_actions');
  const waitingInputChats = filterByStatus(chats, 'waiting_input');

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

  const getDisplayName = (chat) => {
    return chat.chat_name || chat.contact_number || 'Unknown';
  };

  const getInitials = (chat) => {
    const name = getDisplayName(chat);
    if (chat.is_group_chat) {
      return name.substring(0, 2).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getLatestMessage = (chat) => {
    const msg = chat.latestMessage || chat.messages?.[0];
    if (!msg) return 'No messages';
    return msg.body_text || msg.snippet || (msg.has_attachments ? '📎 Attachment' : 'No message');
  };

  const renderChatItem = (chat) => {
    const isSelected = selectedChat?.chat_id === chat.chat_id;
    const latestMsg = chat.latestMessage || chat.messages?.[0];
    const hasUnread = chat.messages?.some(m => m.is_read === false);

    return (
      <ChatItem
        key={chat.chat_id}
        theme={theme}
        $selected={isSelected}
        onClick={() => onSelectChat(chat)}
      >
        <ChatAvatar theme={theme} $isGroup={chat.is_group_chat}>
          {getInitials(chat)}
          {chat.is_group_chat && (
            <GroupBadge theme={theme}>
              <FaUsers size={8} />
            </GroupBadge>
          )}
        </ChatAvatar>
        <ChatContent>
          <ChatHeader>
            <ChatName theme={theme} $unread={hasUnread}>
              {getDisplayName(chat)}
            </ChatName>
            <ChatDate theme={theme}>
              {formatDate(latestMsg?.date)}
            </ChatDate>
          </ChatHeader>
          <ChatPreview theme={theme} $unread={hasUnread}>
            {getLatestMessage(chat)}
          </ChatPreview>
          {chat.contact_number && !chat.is_group_chat && (
            <ChatNumber theme={theme}>
              {chat.contact_number}
            </ChatNumber>
          )}
        </ChatContent>
        {hasUnread && (
          <UnreadBadge>{chat.messages?.filter(m => !m.is_read).length || ''}</UnreadBadge>
        )}
      </ChatItem>
    );
  };

  const renderSection = (title, icon, chats, sectionKey, color) => {
    const isExpanded = expandedSections[sectionKey];
    const count = chats.length;

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
            {chats.map(renderChatItem)}
          </SectionContent>
        )}
      </Section>
    );
  };

  if (chats.length === 0) {
    return (
      <EmptyState theme={theme}>
        <FaWhatsapp size={48} style={{ opacity: 0.3, color: '#25D366' }} />
        <EmptyTitle theme={theme}>No WhatsApp chats</EmptyTitle>
        <EmptyText theme={theme}>Your inbox is empty</EmptyText>
      </EmptyState>
    );
  }

  return (
    <Container>
      {renderSection('Inbox', <FaInbox />, inboxChats, 'inbox', '#25D366')}
      {renderSection('Need Actions', <FaBolt />, needActionsChats, 'need_actions', '#F59E0B')}
      {renderSection('Waiting Input', <FaClock />, waitingInputChats, 'waiting_input', '#8B5CF6')}
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

const ChatItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#D1FAE5' : '#064E3B')
    : (props.theme === 'light' ? '#FFFFFF' : '#111827')
  };
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
  cursor: pointer;
  min-height: 72px;

  &:active {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  }
`;

const ChatAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: ${props => props.$isGroup
    ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')
    : (props.theme === 'light' ? '#D1FAE5' : '#064E3B')};
  color: ${props => props.$isGroup
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : '#25D366'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
  position: relative;
`;

const GroupBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
`;

const ChatContent = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
`;

const ChatName = styled.span`
  font-size: 15px;
  font-weight: ${props => props.$unread ? '600' : '400'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const ChatDate = styled.span`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  white-space: nowrap;
  flex-shrink: 0;
`;

const ChatPreview = styled.div`
  font-size: 14px;
  font-weight: ${props => props.$unread ? '500' : '400'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
`;

const ChatNumber = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
`;

const UnreadBadge = styled.div`
  background: #25D366;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
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

export default MobileWhatsAppList;
