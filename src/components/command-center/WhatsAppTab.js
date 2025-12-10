import React, { useState, useEffect } from 'react';
import { FaUsers, FaArchive, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

// Styled components for WhatsApp chat view
const WhatsAppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const ChatHeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ChatAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$isGroup
    ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')
    : (props.theme === 'light' ? '#D1FAE5' : '#064E3B')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$isGroup
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#10B981' : '#34D399')};
  font-weight: 600;
  font-size: 16px;
`;

const ChatName = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ChatNumber = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#111827'};
`;

const MessageDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 12px;
  font-weight: 500;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  }
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
  align-self: ${props => props.$isSent ? 'flex-end' : 'flex-start'};
  background: ${props => props.$isSent
    ? (props.theme === 'light' ? '#DCF8C6' : '#054640')
    : (props.theme === 'light' ? '#FFFFFF' : '#1F2937')};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;

  ${props => props.$isArchived && `
    opacity: 0.7;
    border: 1px dashed ${props.theme === 'light' ? '#9CA3AF' : '#4B5563'};
  `}
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: ${props => props.$isSent ? 'flex-end' : 'flex-start'};
`;

const MessageSender = styled.div`
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: ${props => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const hash = props.$name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  }};
`;

const DoneButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: ${props => props.theme === 'light' ? '#10B981' : '#059669'};
  color: white;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#059669' : '#047857'};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-size: 14px;
  gap: 12px;
`;

// Chat List Item styled components
const ChatListContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChatListItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#EBF5FF' : '#1E3A5F')
    : 'transparent'};

  &:hover {
    background: ${props => props.$selected
      ? (props.theme === 'light' ? '#EBF5FF' : '#1E3A5F')
      : (props.theme === 'light' ? '#F9FAFB' : '#374151')};
  }
`;

const ChatListAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.$isGroup
    ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')
    : (props.theme === 'light' ? '#D1FAE5' : '#064E3B')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$isGroup
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#10B981' : '#34D399')};
  font-weight: 600;
  font-size: 18px;
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
  font-size: 10px;
  border: 2px solid ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const ChatListInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ChatListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatListName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatListTime = styled.div`
  font-size: 12px;
  color: ${props => props.$hasUnread
    ? (props.theme === 'light' ? '#10B981' : '#34D399')
    : (props.theme === 'light' ? '#9CA3AF' : '#6B7280')};
  flex-shrink: 0;
`;

const ChatListPreview = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatListNumber = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
`;

const UnreadBadge = styled.div`
  background: #10B981;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

// Chat List Component (for left column)
export const WhatsAppChatList = ({
  theme,
  chats,
  selectedChat,
  onSelectChat,
  loading
}) => {
  if (loading) {
    return <EmptyState theme={theme}>Loading...</EmptyState>;
  }

  if (chats.length === 0) {
    return <EmptyState theme={theme}>No WhatsApp messages</EmptyState>;
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-GB', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    }
  };

  const getInitials = (name, number) => {
    if (name && name !== number) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return number?.slice(-2) || '??';
  };

  return (
    <ChatListContainer>
      {chats.map(chat => {
        const hasUnread = chat.messages?.some(m => m.is_read === false);
        const unreadCount = chat.messages?.filter(m => m.is_read === false).length || 0;

        return (
          <ChatListItem
            key={chat.chat_id}
            theme={theme}
            $selected={selectedChat?.chat_id === chat.chat_id}
            onClick={() => onSelectChat(chat)}
          >
            <ChatListAvatar theme={theme} $isGroup={chat.is_group_chat}>
              {getInitials(chat.chat_name, chat.contact_number)}
              {chat.is_group_chat && (
                <GroupBadge theme={theme}>
                  <FaUsers size={8} />
                </GroupBadge>
              )}
            </ChatListAvatar>
            <ChatListInfo>
              <ChatListHeader>
                <ChatListName theme={theme}>
                  {chat.chat_name || chat.contact_number}
                </ChatListName>
                <ChatListTime theme={theme} $hasUnread={hasUnread}>
                  {formatTime(chat.latestMessage?.date)}
                </ChatListTime>
              </ChatListHeader>
              <ChatListNumber theme={theme}>
                {chat.contact_number}
              </ChatListNumber>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ChatListPreview theme={theme}>
                  {chat.latestMessage?.body_text || chat.latestMessage?.snippet || 'No message'}
                </ChatListPreview>
                {unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
              </div>
            </ChatListInfo>
          </ChatListItem>
        );
      })}
    </ChatListContainer>
  );
};

// Main WhatsApp Tab Component (for center column)
const WhatsAppTab = ({
  theme,
  selectedChat,
  onDone,
  saving
}) => {
  const [archivedMessages, setArchivedMessages] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  // Fetch archived messages when chat changes
  useEffect(() => {
    const fetchArchivedMessages = async () => {
      if (!selectedChat?.chat_id) {
        setArchivedMessages([]);
        return;
      }

      setLoadingArchived(true);
      try {
        // First find the chat in the chats table by external_chat_id
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('id')
          .eq('external_chat_id', selectedChat.chat_id)
          .maybeSingle();

        if (chatError) {
          console.error('Error finding chat:', chatError);
          setArchivedMessages([]);
          setLoadingArchived(false);
          return;
        }

        if (!chatData) {
          // No archived chat found - this is normal for new chats
          setArchivedMessages([]);
          setLoadingArchived(false);
          return;
        }

        // Then fetch interactions for this chat
        const { data: interactions, error: interactionsError } = await supabase
          .from('interactions')
          .select('*')
          .eq('chat_id', chatData.id)
          .eq('interaction_type', 'whatsapp')
          .order('interaction_date', { ascending: true });

        if (interactionsError) {
          console.error('Error fetching archived messages:', interactionsError);
          setArchivedMessages([]);
        } else {
          setArchivedMessages(interactions || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setArchivedMessages([]);
      }
      setLoadingArchived(false);
    };

    fetchArchivedMessages();
  }, [selectedChat?.chat_id]);

  if (!selectedChat) {
    return (
      <EmptyState theme={theme}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>💬</div>
        <div>Select a chat to view messages</div>
      </EmptyState>
    );
  }

  const formatMessageTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDivider = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getInitials = (name, number) => {
    if (name && name !== number) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return number?.slice(-2) || '??';
  };

  // Combine and sort messages: most recent first (descending)
  const stagingMessages = (selectedChat.messages || []).map(m => ({
    id: m.id || m.message_uid,
    text: m.body_text || m.snippet,
    direction: m.direction,
    date: m.date,
    sender: m.first_name || m.contact_number,
    isArchived: false
  }));

  const archivedMsgs = archivedMessages.map(m => ({
    id: m.interaction_id,
    text: m.summary,
    direction: m.direction,
    date: m.interaction_date,
    sender: null, // Could fetch from contact if needed
    isArchived: true
  }));

  // Combine all messages and sort by date descending (most recent first)
  const allMessages = [...stagingMessages, ...archivedMsgs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const messagesByDate = {};

  allMessages.forEach(msg => {
    const dateKey = new Date(msg.date).toDateString();
    if (!messagesByDate[dateKey]) {
      messagesByDate[dateKey] = [];
    }
    messagesByDate[dateKey].push(msg);
  });

  return (
    <WhatsAppContainer>
      <ChatHeader theme={theme}>
        <ChatHeaderInfo>
          <ChatAvatar theme={theme} $isGroup={selectedChat.is_group_chat}>
            {getInitials(selectedChat.chat_name, selectedChat.contact_number)}
          </ChatAvatar>
          <div>
            <ChatName theme={theme}>
              {selectedChat.chat_name || selectedChat.contact_number}
              {selectedChat.is_group_chat && (
                <FaUsers
                  size={12}
                  style={{ marginLeft: '8px', opacity: 0.6 }}
                />
              )}
            </ChatName>
            <ChatNumber theme={theme}>{selectedChat.contact_number}</ChatNumber>
          </div>
        </ChatHeaderInfo>
        <DoneButton theme={theme} onClick={onDone} disabled={saving}>
          {saving ? 'Saving...' : (
            <>
              <FaArchive size={14} />
              Done
            </>
          )}
        </DoneButton>
      </ChatHeader>

      <MessagesContainer theme={theme}>
        {loadingArchived ? (
          <EmptyState theme={theme}>Loading messages...</EmptyState>
        ) : allMessages.length === 0 ? (
          <EmptyState theme={theme}>No messages in this chat</EmptyState>
        ) : (
          <>
            {/* New messages indicator at the top */}
            {stagingMessages.length > 0 && (
              <MessageDivider theme={theme} style={{ color: '#10B981' }}>
                ✨ New Messages ({stagingMessages.length})
              </MessageDivider>
            )}

            {Object.entries(messagesByDate)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([dateKey, messages]) => (
              <React.Fragment key={dateKey}>
                <MessageDivider theme={theme}>
                  {formatDateDivider(messages[0].date)}
                </MessageDivider>

                {messages.map((msg, idx) => {
                  // Show divider when transitioning from new to archived (since most recent is first)
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showArchivedDivider = prevMsg && !prevMsg.isArchived && msg.isArchived;

                  return (
                    <React.Fragment key={msg.id}>
                      {showArchivedDivider && (
                        <MessageDivider theme={theme} style={{ opacity: 0.6 }}>
                          <FaArchive size={10} /> Older Messages
                        </MessageDivider>
                      )}
                      <MessageBubble
                        theme={theme}
                        $isSent={msg.direction === 'sent'}
                        $isArchived={msg.isArchived}
                      >
                        {selectedChat.is_group_chat && msg.direction !== 'sent' && msg.sender && (
                          <MessageSender $name={msg.sender}>{msg.sender}</MessageSender>
                        )}
                        {msg.text}
                        <MessageTime theme={theme} $isSent={msg.direction === 'sent'}>
                          {formatMessageTime(msg.date)}
                          {msg.direction === 'sent' && (
                            <FaCheckDouble size={12} style={{ color: '#34D399' }} />
                          )}
                          {msg.isArchived && (
                            <FaArchive size={10} style={{ opacity: 0.5 }} />
                          )}
                        </MessageTime>
                      </MessageBubble>
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </>
        )}
      </MessagesContainer>
    </WhatsAppContainer>
  );
};

export default WhatsAppTab;
