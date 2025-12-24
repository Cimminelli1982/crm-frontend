import React, { useState, useEffect, useRef } from 'react';
import { FaUsers, FaArchive, FaCheck, FaCheckDouble, FaPaperPlane, FaClock, FaPaperclip, FaTimes, FaFile, FaImage, FaBolt, FaMagic } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';
import toast from 'react-hot-toast';

// Use Node.js backend for sending (Baileys) - falls back to Python if not connected
// Always use Railway backend (Baileys session is there)
const BAILEYS_API = 'https://command-center-backend-production.up.railway.app';
const CRM_AGENT_API = 'https://crm-agent-api-production.up.railway.app';

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
  overflow: hidden;
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
  word-break: break-word;

  ${props => props.$isArchived && `
    opacity: 0.7;
    border: 1px dashed ${props.theme === 'light' ? '#9CA3AF' : '#4B5563'};
  `}
`;

const MessageLink = styled.a`
  color: ${props => props.$isSent
    ? (props.theme === 'light' ? '#0369A1' : '#7DD3FC')
    : (props.theme === 'light' ? '#2563EB' : '#60A5FA')};
  text-decoration: underline;
  word-break: break-all;

  &:hover {
    text-decoration: none;
  }
`;

// Helper function to render text with clickable links
const renderMessageText = (text, theme, isSent) => {
  if (!text) return null;

  // First, clean up any existing HTML anchor tags and extract just URLs
  let cleanText = text
    // Remove <a> tags but keep the URL
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>[^<]*<\/a>/gi, '$1')
    // Remove any remaining HTML tags
    .replace(/<[^>]+>/g, '');

  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s<>"]+)/g;

  const parts = cleanText.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Reset regex lastIndex
      urlRegex.lastIndex = 0;
      // Clean URL (remove trailing punctuation)
      const cleanUrl = part.replace(/[.,;:!?)]+$/, '');
      return (
        <MessageLink
          key={index}
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          theme={theme}
          $isSent={isSent}
          onClick={(e) => e.stopPropagation()}
        >
          {cleanUrl.length > 50 ? cleanUrl.substring(0, 50) + '...' : cleanUrl}
        </MessageLink>
      );
    }
    return part;
  });
};

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

// Reply input styled components
const ReplyContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const ReplyInputWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const ProofreadButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px 10px;
  border-radius: 12px;
  border: none;
  background: ${props => props.theme === 'light' ? '#8B5CF6' : '#7C3AED'};
  color: white;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  z-index: 1;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#7C3AED' : '#6D28D9'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ReplyInput = styled.textarea`
  width: 100%;
  min-height: 44px;
  max-height: 120px;
  padding: 12px 16px;
  border-radius: 22px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  line-height: 1.4;
  resize: none;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: ${props => props.theme === 'light' ? '#10B981' : '#34D399'};
    box-shadow: 0 0 0 2px ${props => props.theme === 'light' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(52, 211, 153, 0.1)'};
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: ${props => props.$hasText
    ? (props.theme === 'light' ? '#25D366' : '#128C7E')
    : (props.theme === 'light' ? '#E5E7EB' : '#374151')};
  color: ${props => props.$hasText ? 'white' : (props.theme === 'light' ? '#9CA3AF' : '#6B7280')};
  cursor: ${props => props.$hasText ? 'pointer' : 'default'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${props => props.$hasText
      ? (props.theme === 'light' ? '#22C55E' : '#0E7A6D')
      : (props.theme === 'light' ? '#E5E7EB' : '#374151')};
    transform: ${props => props.$hasText ? 'scale(1.05)' : 'none'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
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

const AttachButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
    color: ${props => props.theme === 'light' ? '#374151' : '#E5E7EB'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input[type="file"] {
    display: none;
  }
`;

const AttachmentPreviewContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const AttachmentPreviewContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const AttachmentPreviewImage = styled.img`
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
`;

const AttachmentPreviewIcon = styled.div`
  width: 48px;
  height: 48px;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  flex-shrink: 0;
`;

const AttachmentPreviewInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AttachmentPreviewName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AttachmentPreviewSize = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const AttachmentPreviewRemove = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: ${props => props.theme === 'light' ? '#FEE2E2' : '#7F1D1D'};
  color: ${props => props.theme === 'light' ? '#DC2626' : '#FCA5A5'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background: ${props => props.theme === 'light' ? '#FECACA' : '#991B1B'};
  }
`;

const UploadingOverlay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const UploadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-top-color: ${props => props.theme === 'light' ? '#10B981' : '#34D399'};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
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

const AttachmentImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-bottom: ${props => props.$hasText ? '8px' : '0'};
  cursor: pointer;
  display: block;

  &:hover {
    opacity: 0.9;
  }
`;

const AttachmentLink = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: ${props => props.theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'};
  border-radius: 8px;
  margin-bottom: ${props => props.$hasText ? '8px' : '0'};
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  text-decoration: none;

  &:hover {
    background: ${props => props.theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'};
  }
`;

const AttachmentAudio = styled.audio`
  width: 100%;
  max-width: 300px;
  height: 40px;
  margin-bottom: ${props => props.$hasText ? '8px' : '0'};
  border-radius: 20px;
`;

const AttachmentVideo = styled.video`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-bottom: ${props => props.$hasText ? '8px' : '0'};
`;

const DocumentLink = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 8px;
  margin-bottom: ${props => props.$hasText ? '8px' : '0'};
  text-decoration: none;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const DocumentIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${props => {
    if (props.$type === 'pdf') return '#EF4444';
    if (props.$type === 'doc') return '#3B82F6';
    if (props.$type === 'xls') return '#10B981';
    return '#6B7280';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 700;
`;

const DocumentInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const DocumentName = styled.div`
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DocumentSize = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

// Chat List Item styled components
const ChatListContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
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
  overflow: hidden;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
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

// Helper to normalize phone numbers for comparison
const normalizePhoneForComparison = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters except leading +
  return phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
};

// Helper to find CRM contact name by phone number
const getCrmContactName = (phoneNumber, contacts) => {
  if (!phoneNumber || !contacts || contacts.length === 0) return null;

  const normalizedPhone = normalizePhoneForComparison(phoneNumber);

  // Find contact by phone number - check both phone and allPhones
  const match = contacts.find(p => {
    // Check main phone
    if (p.phone && normalizePhoneForComparison(p.phone) === normalizedPhone) {
      return true;
    }
    // Check allPhones array
    if (p.allPhones && p.allPhones.length > 0) {
      return p.allPhones.some(ph => normalizePhoneForComparison(ph) === normalizedPhone);
    }
    return false;
  });

  if (match?.contact) {
    const firstName = match.contact.first_name || '';
    const lastName = match.contact.last_name || '';
    return `${firstName} ${lastName}`.trim() || null;
  }
  return null;
};

// Chat List Component (for left column)
export const WhatsAppChatList = ({
  theme,
  chats,
  selectedChat,
  onSelectChat,
  loading,
  contacts = [] // CRM contacts to look up names
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
        // Get CRM contact name if available
        const crmName = getCrmContactName(chat.contact_number, contacts);
        const displayName = crmName || chat.chat_name || chat.contact_number;

        return (
          <ChatListItem
            key={chat.chat_id}
            theme={theme}
            $selected={selectedChat?.chat_id === chat.chat_id}
            onClick={() => onSelectChat(chat)}
          >
            <ChatListAvatar theme={theme} $isGroup={chat.is_group_chat}>
              {chat.profile_image_url ? (
                <AvatarImage src={chat.profile_image_url} alt={displayName} />
              ) : (
                getInitials(displayName, chat.contact_number)
              )}
              {chat.is_group_chat && (
                <GroupBadge theme={theme}>
                  <FaUsers size={8} />
                </GroupBadge>
              )}
            </ChatListAvatar>
            <ChatListInfo>
              <ChatListHeader>
                <ChatListName theme={theme}>
                  {displayName}
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
                  {chat.latestMessage?.body_text || chat.latestMessage?.snippet || (chat.latestMessage?.has_attachments ? (() => {
                    const attType = chat.latestMessage?.attachments?.[0]?.type || chat.latestMessage?.attachments?.[0]?.mimetype || '';
                    if (attType.startsWith('image/')) return '📷 Photo';
                    if (attType.startsWith('video/')) return '🎥 Video';
                    if (attType.startsWith('audio/')) return '🎤 Voice message';
                    if (attType.includes('pdf')) return '📄 PDF';
                    return '📎 Attachment';
                  })() : 'No message')}
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
  onSpam,
  onStatusChange,
  saving,
  onMessageSent,
  contacts = [] // CRM contacts to look up names
}) => {
  const [archivedMessages, setArchivedMessages] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMessages, setSentMessages] = useState([]); // Local optimistic messages
  const [attachmentsMap, setAttachmentsMap] = useState({}); // Map of message_uid -> attachments[]
  const [selectedFile, setSelectedFile] = useState(null); // File to attach
  const [filePreview, setFilePreview] = useState(null); // Preview URL for images
  const [uploading, setUploading] = useState(false); // File upload in progress
  const [proofreading, setProofreading] = useState(false); // AI proofreading in progress
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch attachments for current chat messages (staging + archived)
  useEffect(() => {
    const fetchAttachments = async () => {
      // Collect message UIDs from both staging and archived messages
      const stagingUids = (selectedChat?.messages || [])
        .map(m => m.message_uid || m.id)
        .filter(Boolean);

      const archivedUids = (archivedMessages || [])
        .map(m => m.external_interaction_id)
        .filter(Boolean);

      const messageUids = [...stagingUids, ...archivedUids];

      if (messageUids.length === 0) {
        setAttachmentsMap({});
        return;
      }

      try {
        const { data, error } = await supabase
          .from('attachments')
          .select('external_reference, permanent_url, file_name, file_type')
          .in('external_reference', messageUids);

        if (error) {
          console.error('Error fetching attachments:', error);
          return;
        }

        if (data) {
          const map = {};
          data.forEach(att => {
            if (!map[att.external_reference]) {
              map[att.external_reference] = [];
            }
            map[att.external_reference].push(att);
          });
          setAttachmentsMap(map);
        }
      } catch (err) {
        console.error('Error fetching attachments:', err);
      }
    };

    fetchAttachments();
  }, [selectedChat?.messages, archivedMessages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [replyText]);

  // Clear reply text, sent messages, and file when chat changes
  useEffect(() => {
    setReplyText('');
    setSentMessages([]);
    setSelectedFile(null);
    setFilePreview(null);
  }, [selectedChat?.chat_id]);

  // File selection handler
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB for TimelinesAI)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 2MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    // Reset the input so same file can be selected again
    event.target.value = '';
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Proofread handler - uses AI to polish the message
  const handleProofread = async () => {
    const textToProofread = replyText.trim();
    if (!textToProofread || proofreading) return;

    setProofreading(true);
    try {
      const systemPrompt = `You are a proofreading assistant for WhatsApp messages.
Your ONLY job is to fix grammar, spelling, and awkward phrasing.
Keep the same tone, intent, and language (don't translate).
Make it sound natural and casual - this is WhatsApp, not a formal email.
Return ONLY the improved text, nothing else. No explanations, no quotes, no markers.`;

      const userMessage = `Proofread this WhatsApp message:\n\n${textToProofread}`;

      const response = await fetch(`${BAILEYS_API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          systemPrompt
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.response) {
          // Clean up any potential wrapper markers
          let proofreadText = result.response.trim();
          // Remove --- markers if present
          proofreadText = proofreadText.replace(/^---\n?/, '').replace(/\n?---$/, '').trim();
          setReplyText(proofreadText);
          toast.success('Message proofread!');
        } else {
          toast.error('Could not proofread message');
        }
      } else {
        toast.error('Proofread service unavailable');
      }
    } catch (error) {
      console.error('Error proofreading:', error);
      toast.error('Error proofreading message');
    } finally {
      setProofreading(false);
    }
  };

  // Send message handler - uses Baileys only (Node.js)
  const handleSendMessage = async () => {
    console.log('[WhatsApp Send] Button clicked');
    console.log('[WhatsApp Send] replyText:', replyText);
    console.log('[WhatsApp Send] selectedFile:', selectedFile);
    console.log('[WhatsApp Send] selectedChat:', selectedChat);
    console.log('[WhatsApp Send] sending:', sending, 'uploading:', uploading);

    const hasText = replyText.trim().length > 0;
    const hasFile = !!selectedFile;

    // For 1-to-1: require contact_number. For groups: require chat_name (we'll lookup JID)
    const hasTarget = selectedChat?.is_group_chat
      ? !!selectedChat?.chat_name
      : !!selectedChat?.contact_number;

    if ((!hasText && !hasFile) || !hasTarget || sending || uploading) {
      console.log('[WhatsApp Send] Early return - hasText:', hasText, 'hasFile:', hasFile, 'hasTarget:', hasTarget);
      return;
    }

    setSending(true);
    const messageToSend = replyText.trim();
    const fileToSend = selectedFile;

    try {
      // Check Baileys connection status first
      const statusRes = await fetch(`${BAILEYS_API}/whatsapp/status`);
      const statusData = await statusRes.json();

      if (statusData.status !== 'connected') {
        throw new Error('WhatsApp not connected. Please scan QR code first.');
      }

      // For groups: lookup the real JID first
      let targetJid = null;
      if (selectedChat.is_group_chat) {
        console.log('[WhatsApp] Group chat - looking up JID for:', selectedChat.chat_name);

        const findGroupRes = await fetch(
          `${BAILEYS_API}/whatsapp/find-group?name=${encodeURIComponent(selectedChat.chat_name)}`
        );
        const findGroupData = await findGroupRes.json();

        if (!findGroupRes.ok || !findGroupData.success) {
          throw new Error(`Group not found: ${selectedChat.chat_name}. Try syncing groups first.`);
        }

        targetJid = findGroupData.jid;
        console.log('[WhatsApp] Found group JID:', targetJid);
      }

      // === BAILEYS ONLY ===
      console.log('[WhatsApp] Sending via Baileys...');

      if (fileToSend) {
        // Send media via Baileys
        setUploading(true);
        try {
          const reader = new FileReader();
          const fileData = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(',')[1]); // base64
            reader.onerror = reject;
            reader.readAsDataURL(fileToSend);
          });

          const payload = {
            phone: selectedChat.is_group_chat ? undefined : selectedChat.contact_number,
            chat_id: selectedChat.is_group_chat ? targetJid : undefined,
            caption: messageToSend || '',
            file: {
              data: fileData,
              mimetype: fileToSend.type,
              filename: fileToSend.name
            }
          };

          const response = await fetch(`${BAILEYS_API}/whatsapp/send-media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to send media');
          }
        } finally {
          setUploading(false);
        }
      } else {
        // Send text via Baileys
        const payload = {
          phone: selectedChat.is_group_chat ? undefined : selectedChat.contact_number,
          chat_id: selectedChat.is_group_chat ? targetJid : undefined,
          message: messageToSend
        };

        const response = await fetch(`${BAILEYS_API}/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to send message');
        }
      }

      // Success - update UI
      setReplyText('');
      setSelectedFile(null);
      setFilePreview(null);

      // Refocus input for quick follow-up messages
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);

      // Add to local sent messages for immediate display
      const newMessage = {
        id: `sent_${Date.now()}`,
        text: messageToSend || (fileToSend ? `📎 ${fileToSend.name}` : ''),
        direction: 'sent',
        date: new Date().toISOString(),
        isLocal: true,
        hasAttachment: !!fileToSend
      };
      setSentMessages(prev => [...prev, newMessage]);

      // Notify parent to refresh messages if callback provided
      if (onMessageSent) {
        onMessageSent({
          chat_id: selectedChat.chat_id,
          text: messageToSend,
          direction: 'sent',
          timestamp: new Date().toISOString(),
          hasAttachment: !!fileToSend
        });
      }

      if (fileToSend) {
        toast.success('Message with attachment sent!');
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
    messageUid: m.message_uid || m.id, // For attachment lookup
    text: m.body_text || m.snippet,
    direction: m.direction,
    date: m.date,
    sender: m.first_name || m.contact_number,
    isArchived: false
  }));

  const archivedMsgs = archivedMessages.map(m => ({
    id: m.interaction_id,
    messageUid: m.external_interaction_id, // For attachment lookup in archived messages
    text: m.summary,
    direction: m.direction,
    date: m.interaction_date,
    sender: null, // Could fetch from contact if needed
    isArchived: true
  }));

  // Local sent messages (optimistic updates)
  const localSentMsgs = sentMessages.map(m => ({
    id: m.id,
    text: m.text,
    direction: 'sent',
    date: m.date,
    sender: null,
    isArchived: false,
    isLocal: true
  }));

  // Combine all messages and sort by date descending (most recent first)
  const allMessages = [...stagingMessages, ...archivedMsgs, ...localSentMsgs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const messagesByDate = {};

  allMessages.forEach(msg => {
    const dateKey = new Date(msg.date).toDateString();
    if (!messagesByDate[dateKey]) {
      messagesByDate[dateKey] = [];
    }
    messagesByDate[dateKey].push(msg);
  });

  // Get CRM contact name if available
  const crmName = getCrmContactName(selectedChat.contact_number, contacts);
  const displayName = crmName || selectedChat.chat_name || selectedChat.contact_number;

  return (
    <WhatsAppContainer>
      <ChatHeader theme={theme}>
        <ChatHeaderInfo>
          <ChatAvatar theme={theme} $isGroup={selectedChat.is_group_chat}>
            {selectedChat.profile_image_url ? (
              <AvatarImage src={selectedChat.profile_image_url} alt={displayName} />
            ) : (
              getInitials(displayName, selectedChat.contact_number)
            )}
          </ChatAvatar>
          <div>
            <ChatName theme={theme}>
              {displayName}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Skip / Spam */}
          <button
            onClick={onSpam}
            disabled={saving}
            title="Skip chat (add to spam list)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
              color: theme === 'light' ? '#DC2626' : '#FCA5A5',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: saving ? 0.5 : 1,
              fontSize: '16px',
            }}
          >
            🚫
          </button>

          {/* Need Actions */}
          <button
            onClick={() => onStatusChange?.('need_actions')}
            disabled={saving}
            title="Need Actions"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: theme === 'light' ? '#FEF3C7' : '#78350F',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: saving ? 0.5 : 1,
              fontSize: '16px',
            }}
          >
            ❗
          </button>

          {/* Waiting Input */}
          <button
            onClick={() => onStatusChange?.('waiting_input')}
            disabled={saving}
            title="Waiting Input"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: theme === 'light' ? '#DBEAFE' : '#1E3A8A',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: saving ? 0.5 : 1,
              fontSize: '16px',
            }}
          >
            👀
          </button>

          {/* Done */}
          <button
            onClick={onDone}
            disabled={saving}
            title="Done"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              background: saving
                ? (theme === 'light' ? '#9CA3AF' : '#6B7280')
                : (theme === 'light' ? '#D1FAE5' : '#065F46'),
              color: saving
                ? 'white'
                : (theme === 'light' ? '#059669' : '#6EE7B7'),
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <span style={{
                width: '14px',
                height: '14px',
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <FaCheck size={16} />
            )}
          </button>
        </div>
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
                        {/* Render attachments */}
                        {msg.messageUid && attachmentsMap[msg.messageUid]?.map((att, i) => {
                          const fileType = att.file_type?.toLowerCase() || '';
                          const fileName = att.file_name || 'attachment';
                          const fileExt = fileName.split('.').pop()?.toLowerCase();

                          // Image (including GIFs)
                          if (fileType.startsWith('image/') || ['gif', 'jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
                            return (
                              <AttachmentImage
                                key={i}
                                src={att.permanent_url}
                                alt={fileName}
                                theme={theme}
                                $hasText={!!msg.text}
                                onClick={() => window.open(att.permanent_url, '_blank')}
                              />
                            );
                          }

                          // Audio
                          if (fileType.startsWith('audio/') || ['ogg', 'opus', 'mp3', 'wav', 'm4a'].includes(fileExt)) {
                            return (
                              <AttachmentAudio
                                key={i}
                                controls
                                $hasText={!!msg.text}
                              >
                                <source src={att.permanent_url} type={fileType || 'audio/ogg'} />
                                Your browser does not support audio.
                              </AttachmentAudio>
                            );
                          }

                          // Video
                          if (fileType.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(fileExt)) {
                            return (
                              <AttachmentVideo
                                key={i}
                                controls
                                $hasText={!!msg.text}
                              >
                                <source src={att.permanent_url} type={fileType || 'video/mp4'} />
                                Your browser does not support video.
                              </AttachmentVideo>
                            );
                          }

                          // Documents (PDF, DOC, XLS, etc.)
                          const docType = fileExt === 'pdf' ? 'pdf'
                            : ['doc', 'docx'].includes(fileExt) ? 'doc'
                            : ['xls', 'xlsx'].includes(fileExt) ? 'xls'
                            : 'file';
                          const docLabel = fileExt?.toUpperCase() || 'FILE';

                          return (
                            <DocumentLink
                              key={i}
                              href={att.permanent_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={fileName}
                              theme={theme}
                              $hasText={!!msg.text}
                            >
                              <DocumentIcon $type={docType}>{docLabel}</DocumentIcon>
                              <DocumentInfo>
                                <DocumentName>{fileName}</DocumentName>
                                <DocumentSize theme={theme}>Tap to download</DocumentSize>
                              </DocumentInfo>
                            </DocumentLink>
                          );
                        })}
                        {renderMessageText(msg.text, theme, msg.direction === 'sent')}
                        <MessageTime theme={theme} $isSent={msg.direction === 'sent'}>
                          {formatMessageTime(msg.date)}
                          {msg.direction === 'sent' && !msg.isLocal && (
                            <FaCheckDouble size={12} style={{ color: '#34D399' }} />
                          )}
                          {msg.isLocal && (
                            <FaClock size={10} style={{ color: '#9CA3AF' }} title="Sending..." />
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

      {/* File Attachment Preview */}
      {selectedFile && (
        <AttachmentPreviewContainer theme={theme}>
          <AttachmentPreviewContent>
            {filePreview ? (
              <AttachmentPreviewImage src={filePreview} alt={selectedFile.name} />
            ) : (
              <AttachmentPreviewIcon theme={theme}>
                <FaFile size={20} />
              </AttachmentPreviewIcon>
            )}
            <AttachmentPreviewInfo>
              <AttachmentPreviewName theme={theme}>{selectedFile.name}</AttachmentPreviewName>
              <AttachmentPreviewSize theme={theme}>{formatFileSize(selectedFile.size)}</AttachmentPreviewSize>
            </AttachmentPreviewInfo>
          </AttachmentPreviewContent>
          {uploading ? (
            <UploadingOverlay theme={theme}>
              <UploadingSpinner theme={theme} />
              Uploading...
            </UploadingOverlay>
          ) : (
            <AttachmentPreviewRemove theme={theme} onClick={handleRemoveFile} title="Remove attachment">
              <FaTimes size={14} />
            </AttachmentPreviewRemove>
          )}
        </AttachmentPreviewContainer>
      )}

      {/* Inline Reply Input */}
      <ReplyContainer theme={theme}>
        <AttachButton
          theme={theme}
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || uploading}
          title="Attach file (max 2MB)"
        >
          <FaPaperclip size={16} />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
        </AttachButton>
        <ReplyInputWrapper>
          <ReplyInput
            ref={textareaRef}
            theme={theme}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedFile ? "Add a message (optional)..." : "Type a message..."}
            disabled={sending || uploading || proofreading}
            rows={1}
            style={{ paddingRight: replyText.trim().length > 0 ? '90px' : '16px' }}
          />
          {replyText.trim().length > 0 && (
            <ProofreadButton
              theme={theme}
              onClick={handleProofread}
              disabled={proofreading || sending || uploading}
              title="Proofread with AI"
            >
              {proofreading ? '...' : <><FaMagic size={10} /> Proofread</>}
            </ProofreadButton>
          )}
        </ReplyInputWrapper>
        <SendButton
          theme={theme}
          $hasText={replyText.trim().length > 0 || !!selectedFile}
          onClick={handleSendMessage}
          disabled={(!replyText.trim() && !selectedFile) || sending || uploading}
          title={replyText.trim() || selectedFile ? 'Send message' : 'Type a message or attach a file'}
        >
          {sending || uploading ? (
            <SendingIndicator />
          ) : (
            <FaPaperPlane size={16} />
          )}
        </SendButton>
      </ReplyContainer>
    </WhatsAppContainer>
  );
};

export default WhatsAppTab;
