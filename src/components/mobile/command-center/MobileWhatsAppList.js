import React, { useState } from 'react';
import styled from 'styled-components';
import { FaChevronDown, FaChevronRight, FaInbox, FaBolt, FaClock, FaWhatsapp, FaUsers, FaSpinner } from 'react-icons/fa';
import { format, isToday, isYesterday } from 'date-fns';

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
    archiving: false,
  });

  // Filter chats by status
  const filterByStatus = (items, status) => {
    if (status === 'inbox') return items.filter(item => !item.status);
    return items.filter(item => item.status === status);
  };

  const inboxChats = filterByStatus(chats, 'inbox');
  const needActionsChats = filterByStatus(chats, 'need_actions');
  const waitingInputChats = filterByStatus(chats, 'waiting_input');
  const archivingChats = filterByStatus(chats, 'archiving');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isToday(date)) return format(date, 'HH:mm');
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'dd/MM/yy');
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
    const unreadCount = chat.messages?.filter(m => !m.is_read).length || 0;
    const hasUnread = unreadCount > 0;

    return (
      <ChatItem
        key={chat.chat_id}
        theme={theme}
        $selected={isSelected}
        onClick={() => onSelectChat(chat)}
      >
        <ChatAvatar theme={theme} $isGroup={chat.is_group_chat}>
          {chat.profile_image_url && !chat.is_group_chat ? (
            <AvatarImg src={chat.profile_image_url} alt={getDisplayName(chat)} />
          ) : chat.is_group_chat ? (
            <FaUsers size={20} />
          ) : (
            getInitials(chat)
          )}
        </ChatAvatar>
        <ChatBody>
          <ChatTopRow>
            <ChatName theme={theme} $unread={hasUnread}>
              {getDisplayName(chat)}
            </ChatName>
            <ChatTime theme={theme} $unread={hasUnread}>
              {formatDate(latestMsg?.date)}
            </ChatTime>
          </ChatTopRow>
          <ChatBottomRow>
            <ChatPreview theme={theme} $unread={hasUnread}>
              {getLatestMessage(chat)}
            </ChatPreview>
            {hasUnread && (
              <UnreadBadge>{unreadCount}</UnreadBadge>
            )}
          </ChatBottomRow>
        </ChatBody>
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
            {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
            <SectionLabel theme={theme}>{title.toUpperCase()}</SectionLabel>
            <SectionCount theme={theme}>{count}</SectionCount>
          </SectionLeft>
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
    <Container theme={theme}>
      {renderSection('Inbox', <FaInbox />, inboxChats, 'inbox', '#25D366')}
      {renderSection('Need Actions', <FaBolt />, needActionsChats, 'need_actions', '#F59E0B')}
      {renderSection('Waiting Input', <FaClock />, waitingInputChats, 'waiting_input', '#8B5CF6')}
      {archivingChats.length > 0 && renderSection('Archiving', <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />, archivingChats, 'archiving', '#10b981')}
    </Container>
  );
};

// ─── Styled Components ──────────────────────────────────────────────

const Container = styled.div`
  padding: 0;
`;

const Section = styled.div``;

const SectionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 20px 10px 16px;
  background: ${p => p.theme === 'light' ? '#F0F2F5' : '#111B21'};
  border: none;
  cursor: pointer;
`;

const SectionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
`;

const SectionLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  color: ${p => p.theme === 'light' ? '#008069' : '#00A884'};
`;

const SectionCount = styled.span`
  font-size: 11px;
  color: ${p => p.theme === 'light' ? '#667781' : '#8696A0'};
`;

const SectionContent = styled.div``;

const ChatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  background: ${p => p.$selected
    ? (p.theme === 'light' ? '#F0F2F5' : '#2A3942')
    : (p.theme === 'light' ? '#FFFFFF' : '#111B21')
  };
  cursor: pointer;
  position: relative;

  &:active {
    background: ${p => p.theme === 'light' ? '#F5F6F6' : '#1F2C34'};
  }

  /* Inset divider (past avatar) */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 80px;
    right: 0;
    height: 1px;
    background: ${p => p.theme === 'light' ? '#E9EDEF' : '#222D34'};
  }
`;

const ChatAvatar = styled.div`
  width: 50px;
  height: 50px;
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
  font-size: 20px;
  font-weight: 500;
  flex-shrink: 0;
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`;

const ChatBody = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const ChatTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 3px;
`;

const ChatName = styled.span`
  font-size: 16px;
  font-weight: ${p => p.$unread ? '500' : '400'};
  color: ${p => p.theme === 'light' ? '#111B21' : '#E9EDEF'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const ChatTime = styled.span`
  font-size: 12px;
  color: ${p => p.$unread
    ? '#00A884'
    : (p.theme === 'light' ? '#667781' : '#8696A0')};
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 6px;
`;

const ChatBottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ChatPreview = styled.div`
  font-size: 14px;
  font-weight: ${p => p.$unread ? '400' : '400'};
  color: ${p => p.theme === 'light' ? '#667781' : '#8696A0'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const UnreadBadge = styled.div`
  background: #00A884;
  color: #111B21;
  font-size: 11px;
  font-weight: 600;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: ${p => p.theme === 'light' ? '#667781' : '#8696A0'};
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${p => p.theme === 'light' ? '#111B21' : '#E9EDEF'};
  margin: 16px 0 8px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: ${p => p.theme === 'light' ? '#667781' : '#8696A0'};
  margin: 0;
`;

export default MobileWhatsAppList;
