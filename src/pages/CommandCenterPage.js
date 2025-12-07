import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaWhatsapp, FaCalendar, FaChevronLeft, FaChevronRight, FaUser, FaBuilding, FaDollarSign, FaStickyNote, FaTimes, FaPaperPlane, FaTrash, FaLightbulb, FaHandshake, FaTasks, FaSave, FaArchive, FaCrown, FaPaperclip, FaRobot, FaCheck } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import QuickEditModal from '../components/QuickEditModalRefactored';
import { useQuickEditModal } from '../hooks/useQuickEditModal';
import { getVisibleTabs, shouldShowField } from '../helpers/contactListHelpers';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

// Main container
const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

// Header with tabs
const Header = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 16px 24px;
`;

const HeaderTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 16px 0;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#F3F4F6' : '#374151')
  };
  color: ${props => props.$active
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };

  &:hover {
    background: ${props => props.$active
      ? (props.theme === 'light' ? '#2563EB' : '#3B82F6')
      : (props.theme === 'light' ? '#E5E7EB' : '#4B5563')
    };
  }
`;

const Badge = styled.span`
  background: ${props => props.$active ? 'rgba(255,255,255,0.2)' : (props.theme === 'light' ? '#E5E7EB' : '#4B5563')};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
`;

// Main content area with 3 panels
const MainContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

// Email List Panel (left)
const EmailListPanel = styled.div`
  width: ${props => props.$collapsed ? '60px' : '20%'};
  min-width: ${props => props.$collapsed ? '60px' : '250px'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-right: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
`;

const ListHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CollapseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const EmailList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const EmailItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  cursor: pointer;
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#EBF5FF' : '#1E3A5F')
    : 'transparent'
  };

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const EmailSender = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmailSubject = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmailSnippet = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Email Content Panel (center)
const EmailContentPanel = styled.div`
  flex: 1;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EmailHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const EmailFrom = styled.div`
  font-size: 16px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 8px;
`;

const EmailSubjectFull = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
`;

const EmailDate = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmailTo = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin-bottom: 4px;
`;

const EmailCc = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 8px;
`;

const EmailBody = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  line-height: 1.6;
  white-space: pre-wrap;
`;

const EmailActions = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  gap: 12px;
`;

const ActionBtn = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

// Actions Panel (right)
const ActionsPanel = styled.div`
  width: 25%;
  min-width: 280px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border-left: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const ActionsPanelTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  justify-content: center;
`;

const ActionTabIcon = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : 'transparent'};
  color: ${props => props.$active
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active
      ? (props.theme === 'light' ? '#2563EB' : '#3B82F6')
      : (props.theme === 'light' ? '#E5E7EB' : '#374151')};
  }

  svg {
    font-size: 14px;
  }
`;

const ActionsPanelHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ActionCard = styled.div`
  margin: 12px;
  padding: 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const ActionCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
`;

const ActionCardContent = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
  margin-bottom: 12px;
`;

const ActionCardButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const SmallBtn = styled.button`
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  background: ${props => props.$variant === 'success'
    ? '#10B981'
    : props.$variant === 'danger'
      ? '#EF4444'
      : (props.theme === 'light' ? '#E5E7EB' : '#374151')
  };
  color: ${props => (props.$variant === 'success' || props.$variant === 'danger') ? '#FFFFFF' : (props.theme === 'light' ? '#374151' : '#D1D5DB')};

  &:hover {
    opacity: 0.9;
  }
`;

const ConfirmAllButton = styled.button`
  margin: 12px;
  padding: 12px;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #059669;
  }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-size: 16px;
`;

const PendingCount = styled.div`
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#78350F'};
  color: ${props => props.theme === 'light' ? '#92400E' : '#FCD34D'};
  font-size: 14px;
`;

// AI Chat Styled Components
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(100vh - 200px);
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ChatMessage = styled.div`
  padding: 10px 14px;
  border-radius: 12px;
  max-width: 90%;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;

  ${props => props.$isUser ? `
    align-self: flex-end;
    background: ${props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    color: white;
    border-bottom-right-radius: 4px;
  ` : `
    align-self: flex-start;
    background: ${props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props.theme === 'light' ? '#111827' : '#F9FAFB'};
    border-bottom-left-radius: 4px;
  `}
`;

const ChatInputContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 10px 14px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  font-size: 14px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const ChatSendButton = styled.button`
  padding: 10px 14px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #2563EB;
  }

  &:disabled {
    background: #9CA3AF;
    cursor: not-allowed;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  align-self: flex-start;

  span {
    width: 8px;
    height: 8px;
    background: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }

  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
  }
`;

const QuickActionChip = styled.button`
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#EBF5FF' : '#1E3A5F'};
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  border: 1px solid ${props => props.theme === 'light' ? '#BFDBFE' : '#3B82F6'};
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#DBEAFE' : '#2563EB'};
  }
`;

const QuickActionsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const AcceptDraftButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Email Bubble Input Components
const EmailBubbleContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  min-height: 42px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  cursor: text;
  position: relative;

  &:focus-within {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 2px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(96, 165, 250, 0.2)'};
  }
`;

const EmailBubble = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: ${props => props.theme === 'light' ? '#EBF5FF' : '#1E3A5F'};
  color: ${props => props.theme === 'light' ? '#1E40AF' : '#93C5FD'};
  border-radius: 16px;
  font-size: 13px;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmailBubbleRemove = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  display: flex;
  align-items: center;
  font-size: 14px;

  &:hover {
    color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  }
`;

const EmailBubbleInput = styled.input`
  flex: 1;
  min-width: 150px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const AutocompleteDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1001;
  margin-top: 4px;
`;

const AutocompleteItem = styled.div`
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const AutocompleteAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  flex-shrink: 0;
`;

const AutocompleteInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AutocompleteName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AutocompleteEmail = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Compose Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  flex: 1;
  overflow-y: auto;
`;

const FormField = styled.div`
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin-bottom: 6px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  font-size: 14px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  font-size: 14px;
  min-height: 200px;
  resize: vertical;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-family: inherit;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ModalFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #2563EB;
  }

  &:disabled {
    background: #9CA3AF;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

// Main Component
const CommandCenterPage = ({ theme }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('email');
  const [emails, setEmails] = useState([]);
  const [threads, setThreads] = useState([]); // Grouped by thread_id
  const [selectedThread, setSelectedThread] = useState(null); // Array of emails in thread
  const [listCollapsed, setListCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Compose modal state
  const [composeModal, setComposeModal] = useState({ open: false, mode: null }); // mode: 'reply', 'replyAll', 'forward'
  const [composeTo, setComposeTo] = useState([]); // Array of { email, name }
  const [composeCc, setComposeCc] = useState([]); // Array of { email, name }
  const [composeToInput, setComposeToInput] = useState('');
  const [composeCcInput, setComposeCcInput] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null); // 'to' or 'cc'
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  // Spam menu state
  const [spamMenuOpen, setSpamMenuOpen] = useState(false);
  const [activeActionTab, setActiveActionTab] = useState('suggestions');

  // Contacts from email (for Contacts tab)
  const [emailContacts, setEmailContacts] = useState([]);

  // Companies from email domains (for Companies tab)
  const [emailCompanies, setEmailCompanies] = useState([]);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatMessagesRef = React.useRef(null);

  // Quick Edit Modal - use the custom hook
  const quickEditModal = useQuickEditModal(() => {});
  const {
    quickEditContactModalOpen,
    contactForQuickEdit,
    showMissingFieldsOnly,
    quickEditActiveTab,
    setQuickEditActiveTab,
    quickEditDescriptionText,
    setQuickEditDescriptionText,
    quickEditJobRoleText,
    setQuickEditJobRoleText,
    quickEditContactCategory,
    setQuickEditContactCategory,
    quickEditContactScore,
    setQuickEditContactScore,
    quickEditFirstName,
    setQuickEditFirstName,
    quickEditLastName,
    setQuickEditLastName,
    quickEditLinkedin,
    setQuickEditLinkedin,
    quickEditKeepInTouchFrequency,
    setQuickEditKeepInTouchFrequency,
    quickEditBirthdayDay,
    setQuickEditBirthdayDay,
    quickEditBirthdayMonth,
    setQuickEditBirthdayMonth,
    quickEditAgeEstimate,
    setQuickEditAgeEstimate,
    quickEditChristmasWishes,
    setQuickEditChristmasWishes,
    quickEditEasterWishes,
    setQuickEditEasterWishes,
    quickEditShowMissing,
    setQuickEditShowMissing,
    quickEditContactEmails,
    setQuickEditContactEmails,
    quickEditContactMobiles,
    setQuickEditContactMobiles,
    newEmailText,
    setNewEmailText,
    newEmailType,
    setNewEmailType,
    newMobileText,
    setNewMobileText,
    newMobileType,
    setNewMobileType,
    quickEditContactCities,
    setQuickEditContactCities,
    quickEditContactTags,
    setQuickEditContactTags,
    quickEditCityModalOpen,
    setQuickEditCityModalOpen,
    quickEditTagModalOpen,
    setQuickEditTagModalOpen,
    quickEditAssociateCompanyModalOpen,
    setQuickEditAssociateCompanyModalOpen,
    quickEditContactCompanies,
    setQuickEditContactCompanies,
    openModal: handleOpenQuickEditModal,
    closeModal: handleCloseQuickEditModal,
    handleSaveQuickEditContact,
    handleSilentSave,
    handleAddEmail,
    handleRemoveEmail,
    handleUpdateEmailType,
    handleSetEmailPrimary,
    handleAddMobile,
    handleRemoveMobile,
    handleUpdateMobileType,
    handleSetMobilePrimary,
    handleRemoveCity,
    handleRemoveTag,
    handleUpdateCompanyRelationship,
    handleUpdateCompanyCategory,
    handleSaveQuickEditFrequency,
    handleSaveQuickEditBirthday,
    handleSaveQuickEditChristmasWishes,
    handleSaveQuickEditEasterWishes,
    handleMarkCompleteWithCategory,
    handleAutomation,
  } = quickEditModal;

  // Group emails by thread_id
  const groupByThread = (emailList) => {
    const threadMap = new Map();

    for (const email of emailList) {
      const threadId = email.thread_id || email.id; // fallback to id if no thread_id
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, []);
      }
      threadMap.get(threadId).push(email);
    }

    // Sort each thread by date ascending (oldest first)
    const result = [];
    for (const [threadId, threadEmails] of threadMap) {
      threadEmails.sort((a, b) => new Date(a.date) - new Date(b.date));
      result.push({
        threadId,
        emails: threadEmails,
        latestEmail: threadEmails[threadEmails.length - 1],
        count: threadEmails.length
      });
    }

    // Sort threads by latest email date descending
    result.sort((a, b) => new Date(b.latestEmail.date) - new Date(a.latestEmail.date));
    return result;
  };

  // Fetch emails from Supabase
  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('command_center_inbox')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching emails:', error);
      } else {
        setEmails(data || []);
        const grouped = groupByThread(data || []);
        setThreads(grouped);
        if (grouped.length > 0) {
          setSelectedThread(grouped[0].emails);
        }
      }
      setLoading(false);
    };

    if (activeTab === 'email') {
      fetchEmails();
    }
  }, [activeTab]);

  // Fetch contacts when selected thread changes
  useEffect(() => {
    const fetchEmailContacts = async () => {
      if (!selectedThread || selectedThread.length === 0) {
        setEmailContacts([]);
        return;
      }

      // Collect all participants from the thread (from, to, cc) with their role
      const participantsMap = new Map(); // email -> { email, name, roles: Set }

      for (const email of selectedThread) {
        // From
        if (email.from_email) {
          const key = email.from_email.toLowerCase();
          if (!participantsMap.has(key)) {
            participantsMap.set(key, {
              email: email.from_email,
              name: email.from_name || email.from_email,
              roles: new Set()
            });
          }
          participantsMap.get(key).roles.add('from');
        }

        // To
        if (email.to_recipients) {
          email.to_recipients.forEach(r => {
            if (r.email) {
              const key = r.email.toLowerCase();
              if (!participantsMap.has(key)) {
                participantsMap.set(key, {
                  email: r.email,
                  name: r.name || r.email,
                  roles: new Set()
                });
              }
              participantsMap.get(key).roles.add('to');
            }
          });
        }

        // CC
        if (email.cc_recipients) {
          email.cc_recipients.forEach(r => {
            if (r.email) {
              const key = r.email.toLowerCase();
              if (!participantsMap.has(key)) {
                participantsMap.set(key, {
                  email: r.email,
                  name: r.name || r.email,
                  roles: new Set()
                });
              }
              participantsMap.get(key).roles.add('cc');
            }
          });
        }
      }

      const allEmails = Array.from(participantsMap.keys());

      if (allEmails.length === 0) {
        setEmailContacts([]);
        return;
      }

      // Query contact_emails to find matching contacts
      const { data: emailMatches } = await supabase
        .from('contact_emails')
        .select('email, contact_id')
        .in('email', allEmails);

      // Get contact details if we have matches
      let contactsById = {};
      if (emailMatches && emailMatches.length > 0) {
        const contactIds = [...new Set(emailMatches.map(e => e.contact_id))];
        const { data: contacts } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name, category, job_role, profile_image_url, description, linkedin, score, birthday, show_missing')
          .in('contact_id', contactIds);

        // Fetch completeness scores for these contacts
        const { data: completenessData } = await supabase
          .from('contact_completeness')
          .select('contact_id, completeness_score')
          .in('contact_id', contactIds);

        const completenessById = {};
        if (completenessData) {
          completenessData.forEach(c => {
            completenessById[c.contact_id] = c.completeness_score;
          });
        }

        // Get companies for these contacts (with domains)
        const { data: contactCompanies } = await supabase
          .from('contact_companies')
          .select('contact_id, company_id, is_primary, companies(company_id, name)')
          .in('contact_id', contactIds);

        // Get company IDs to fetch their domains
        const companyIds = [...new Set((contactCompanies || []).map(cc => cc.company_id).filter(Boolean))];

        // Fetch domains for these companies
        let companyDomains = {};
        if (companyIds.length > 0) {
          const { data: domainsData } = await supabase
            .from('company_domains')
            .select('company_id, domain')
            .in('company_id', companyIds);

          if (domainsData) {
            domainsData.forEach(d => {
              if (!companyDomains[d.company_id]) {
                companyDomains[d.company_id] = [];
              }
              companyDomains[d.company_id].push(d.domain);
            });
          }
        }

        // Map contact to primary company with domains
        const contactToCompany = {};
        if (contactCompanies) {
          contactCompanies.forEach(cc => {
            // Prefer primary, otherwise take first
            if (!contactToCompany[cc.contact_id] || cc.is_primary) {
              contactToCompany[cc.contact_id] = {
                name: cc.companies?.name,
                domains: companyDomains[cc.company_id] || []
              };
            }
          });
        }

        if (contacts) {
          contacts.forEach(c => {
            const companyData = contactToCompany[c.contact_id];
            contactsById[c.contact_id] = {
              ...c,
              company_name: companyData?.name || null,
              company_domains: companyData?.domains || [],
              completeness_score: completenessById[c.contact_id] || 0
            };
          });
        }
      }

      // Build email to contact mapping
      const emailToContact = {};
      if (emailMatches) {
        emailMatches.forEach(em => {
          emailToContact[em.email.toLowerCase()] = contactsById[em.contact_id];
        });
      }

      // Build final list of all participants with contact data if available
      // Exclude my own email
      const myEmail = 'simone@cimminelli.com';
      const allParticipants = Array.from(participantsMap.values())
        .filter(p => p.email.toLowerCase() !== myEmail.toLowerCase())
        .map(p => {
          const contact = emailToContact[p.email.toLowerCase()];
          return {
            email: p.email,
            name: p.name,
            roles: Array.from(p.roles),
            // Contact data if found
            contact: contact || null,
            hasContact: !!contact
          };
        });

      setEmailContacts(allParticipants);
    };

    fetchEmailContacts();
  }, [selectedThread]);

  // Fetch companies from email domains
  useEffect(() => {
    const fetchEmailCompanies = async () => {
      if (!selectedThread || selectedThread.length === 0) {
        setEmailCompanies([]);
        return;
      }

      // Collect all unique domains from emails (excluding my domain)
      const myDomain = 'cimminelli.com';
      const domainsSet = new Set();

      for (const email of selectedThread) {
        // From domain
        if (email.from_email) {
          const domain = email.from_email.split('@')[1]?.toLowerCase();
          if (domain && domain !== myDomain) {
            domainsSet.add(domain);
          }
        }
        // To domains
        if (email.to_recipients) {
          email.to_recipients.forEach(r => {
            if (r.email) {
              const domain = r.email.split('@')[1]?.toLowerCase();
              if (domain && domain !== myDomain) {
                domainsSet.add(domain);
              }
            }
          });
        }
        // CC domains
        if (email.cc_recipients) {
          email.cc_recipients.forEach(r => {
            if (r.email) {
              const domain = r.email.split('@')[1]?.toLowerCase();
              if (domain && domain !== myDomain) {
                domainsSet.add(domain);
              }
            }
          });
        }
      }

      const allDomains = Array.from(domainsSet);
      if (allDomains.length === 0) {
        setEmailCompanies([]);
        return;
      }

      // Query company_domains to find matching companies
      const { data: domainMatches, error: domainError } = await supabase
        .from('company_domains')
        .select('domain, company_id, companies(company_id, name, website, category)')
        .in('domain', allDomains);

      if (domainError) console.error('domainMatches error:', domainError);

      // Build domain to company mapping
      const domainToCompany = {};
      if (domainMatches) {
        domainMatches.forEach(dm => {
          if (dm.companies) {
            domainToCompany[dm.domain.toLowerCase()] = dm.companies;
          }
        });
      }

      // Get contact IDs from email thread
      const contactIds = emailContacts
        .filter(p => p.contact?.contact_id)
        .map(p => p.contact.contact_id);

      // Get all contact_companies associations for contacts in this thread
      let companyToContacts = {};
      let contactCompaniesData = [];
      if (contactIds.length > 0) {
        const { data, error: ccError } = await supabase
          .from('contact_companies')
          .select('contact_id, company_id, companies(company_id, name, website, category)')
          .in('contact_id', contactIds);
        if (ccError) console.error('contact_companies error:', ccError);
        contactCompaniesData = data || [];

        // Build company to contacts mapping
        contactCompaniesData.forEach(cc => {
          if (!companyToContacts[cc.company_id]) {
            companyToContacts[cc.company_id] = [];
          }
          const contact = emailContacts.find(p => p.contact?.contact_id === cc.contact_id);
          if (contact) {
            companyToContacts[cc.company_id].push({
              name: contact.contact?.first_name + ' ' + contact.contact?.last_name,
              email: contact.email
            });
          }
        });
      }

      // Get all company IDs (from domains + from contact associations)
      const companyIdsFromDomains = Object.values(domainToCompany).map(c => c.company_id).filter(Boolean);
      const companyIdsFromContacts = contactCompaniesData.map(cc => cc.company_id).filter(Boolean);
      const allCompanyIds = [...new Set([...companyIdsFromDomains, ...companyIdsFromContacts])];

      // Get domains for all companies
      let companyDomainsMap = {};
      if (allCompanyIds.length > 0) {
        const { data: domainsData } = await supabase
          .from('company_domains')
          .select('company_id, domain')
          .in('company_id', allCompanyIds);

        if (domainsData) {
          domainsData.forEach(d => {
            if (!companyDomainsMap[d.company_id]) {
              companyDomainsMap[d.company_id] = [];
            }
            companyDomainsMap[d.company_id].push(d.domain);
          });
        }
      }

      // Build final companies list
      const seenCompanyIds = new Set();
      const companiesResult = [];

      // First add companies from domains
      // Collect all domains that belong to known companies
      const domainsWithCompanies = new Set();
      Object.values(companyDomainsMap).forEach(domainsList => {
        domainsList.forEach(d => domainsWithCompanies.add(d));
      });

      // Common email providers to hide
      const hiddenDomains = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com', 'aol.com']);

      allDomains.forEach(domain => {
        // Skip common email providers
        if (hiddenDomains.has(domain.toLowerCase())) return;

        const company = domainToCompany[domain];
        if (company && !seenCompanyIds.has(company.company_id)) {
          seenCompanyIds.add(company.company_id);
          companiesResult.push({
            domain,
            domains: companyDomainsMap[company.company_id] || [domain],
            company,
            hasCompany: true,
            contacts: companyToContacts[company.company_id] || []
          });
        } else if (!company && !domainsWithCompanies.has(domain)) {
          // Domain not in CRM and not belonging to any known company - skip showing "+ Add"
          // Only show if we want to suggest creating a new company for unknown domains
          // For now, skip these to avoid showing domains that belong to already-shown companies
        }
      });

      // Then add companies from contact associations (not already added)
      contactCompaniesData.forEach(cc => {
        if (cc.companies && !seenCompanyIds.has(cc.companies.company_id)) {
          seenCompanyIds.add(cc.companies.company_id);
          companiesResult.push({
            domain: companyDomainsMap[cc.company_id]?.[0] || null,
            domains: companyDomainsMap[cc.company_id] || [],
            company: cc.companies,
            hasCompany: true,
            contacts: companyToContacts[cc.company_id] || []
          });
        }
      });

      setEmailCompanies(companiesResult);
    };

    fetchEmailCompanies();
  }, [selectedThread, emailContacts]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Clear chat when thread changes
  useEffect(() => {
    setChatMessages([]);
    setChatInput('');
  }, [selectedThread]);

  // Build email context for Claude
  const buildEmailContext = () => {
    if (!selectedThread || selectedThread.length === 0) return '';

    const threadSubject = selectedThread[0].subject?.replace(/^(Re: |Fwd: )+/i, '');
    const participants = emailContacts.map(p => {
      const name = p.contact ? `${p.contact.first_name} ${p.contact.last_name}` : p.name;
      const role = p.contact?.job_role ? ` (${p.contact.job_role})` : '';
      const company = p.contact?.company_name ? ` at ${p.contact.company_name}` : '';
      return `- ${name}${role}${company}: ${p.email}`;
    }).join('\n');

    const emailsText = selectedThread.map(email => {
      const sender = email.from_email?.toLowerCase() === MY_EMAIL ? 'Me' : (email.from_name || email.from_email);
      const date = new Date(email.date).toLocaleString();
      const body = email.body_text || email.snippet || '';
      return `[${date}] From ${sender}:\n${body}`;
    }).join('\n\n---\n\n');

    return `
EMAIL THREAD CONTEXT:
Subject: ${threadSubject}

Participants:
${participants}

Email Thread (${selectedThread.length} messages):
${emailsText}
`;
  };

  // Send message to Claude
  const sendMessageToClaude = async (message) => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const emailContext = buildEmailContext();
      const systemPrompt = `You are Simone Cimminelli's AI assistant for email management.

TONE & STYLE:
- Be direct and concise. No fluff, no corporate speak.
- Friendly but professional. Like talking to a smart colleague.
- Use short sentences. Get to the point fast.
- When drafting replies: warm, personal, efficient. Never robotic.
- Italian-style warmth when appropriate (natural, not forced).

RESPONSE FORMAT:
- Summaries: Max 2-3 bullet points. Just the essentials.
- Actions: One clear recommendation. Maybe a second option.
- Drafts: Keep them short. Real humans don't write essays in emails.
- Key points: List format, 3-5 items max.

CONTEXT - Simone runs a newsletter business and is an investor. He values:
- Building genuine relationships
- Clear communication
- Getting things done efficiently
- Personal touch over corporate formality

${emailContext}`;

      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Claude');
      }

      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.response };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get AI response');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle quick action clicks
  const handleQuickAction = (action) => {
    sendMessageToClaude(action);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format recipients array to string
  const formatRecipients = (recipients) => {
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) return null;
    return recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(', ');
  };

  // Get the relevant person for email list (not me)
  const MY_EMAIL = 'simone@cimminelli.com';
  const getRelevantPerson = (email) => {
    const fromEmail = email.from_email?.toLowerCase();

    // If I sent it, show the first recipient
    if (fromEmail === MY_EMAIL) {
      const to = email.to_recipients;
      if (to && Array.isArray(to) && to.length > 0) {
        return to[0].name || to[0].email;
      }
      return email.from_email;
    }

    // If someone sent it to me, show the sender
    return email.from_name || email.from_email;
  };

  // Get the latest email in selected thread
  const getLatestEmail = () => {
    if (!selectedThread || selectedThread.length === 0) return null;
    return selectedThread[selectedThread.length - 1];
  };

  // Email signature
  const EMAIL_SIGNATURE = `

--
SIMONE CIMMINELLI
Newsletter: https://www.angelinvesting.it/
Website: https://www.cimminelli.com/
LinkedIn: https://www.linkedin.com/in/cimminelli/

Build / Buy / Invest in
internet businesses.`;

  // Open compose modal for reply
  const openReply = (replyAll = false) => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const mode = replyAll ? 'replyAll' : 'reply';
    const myEmail = 'simone@cimminelli.com';
    const isSentByMe = latestEmail.from_email?.toLowerCase() === myEmail.toLowerCase();

    // Determine To recipients as array
    let toRecipients = [];
    if (isSentByMe && latestEmail.to_recipients?.length > 0) {
      // If I sent it, reply to original recipients
      toRecipients = latestEmail.to_recipients.map(r => ({ email: r.email, name: r.name || '' }));
    } else {
      toRecipients = [{ email: latestEmail.from_email, name: latestEmail.from_name || '' }];
    }

    // Get CC from original email (excluding myself) as array
    let ccRecipients = [];
    if (replyAll && latestEmail.cc_recipients?.length > 0) {
      ccRecipients = latestEmail.cc_recipients
        .filter(r => r.email?.toLowerCase() !== myEmail.toLowerCase())
        .map(r => ({ email: r.email, name: r.name || '' }));
    }

    const subject = latestEmail.subject?.startsWith('Re:')
      ? latestEmail.subject
      : `Re: ${latestEmail.subject}`;

    setComposeTo(toRecipients);
    setComposeCc(ccRecipients);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject(subject);
    setComposeBody('\n\n' + EMAIL_SIGNATURE + '\n\n' + '─'.repeat(40) + '\n' +
      `On ${new Date(latestEmail.date).toLocaleString()}, ${latestEmail.from_name || latestEmail.from_email} wrote:\n\n` +
      (latestEmail.body_text || latestEmail.snippet || ''));
    setComposeModal({ open: true, mode });
  };

  // Open reply modal with AI-drafted text
  const openReplyWithDraft = (draftText) => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const myEmail = 'simone@cimminelli.com';
    const isSentByMe = latestEmail.from_email?.toLowerCase() === myEmail.toLowerCase();

    // Determine To recipients as array
    let toRecipients = [];
    if (isSentByMe && latestEmail.to_recipients?.length > 0) {
      toRecipients = latestEmail.to_recipients.map(r => ({ email: r.email, name: r.name || '' }));
    } else {
      toRecipients = [{ email: latestEmail.from_email, name: latestEmail.from_name || '' }];
    }

    // Get CC from original email (excluding myself) as array
    let ccRecipients = [];
    if (latestEmail.cc_recipients?.length > 0) {
      ccRecipients = latestEmail.cc_recipients
        .filter(r => r.email?.toLowerCase() !== myEmail.toLowerCase())
        .map(r => ({ email: r.email, name: r.name || '' }));
    }

    const subject = latestEmail.subject?.startsWith('Re:')
      ? latestEmail.subject
      : `Re: ${latestEmail.subject}`;

    setComposeTo(toRecipients);
    setComposeCc(ccRecipients);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject(subject);
    setComposeBody(draftText + '\n\n' + EMAIL_SIGNATURE + '\n\n' + '─'.repeat(40) + '\n' +
      `On ${new Date(latestEmail.date).toLocaleString()}, ${latestEmail.from_name || latestEmail.from_email} wrote:\n\n` +
      (latestEmail.body_text || latestEmail.snippet || ''));
    setComposeModal({ open: true, mode: 'reply' });
  };

  // Extract draft text from Claude's response
  const extractDraftFromMessage = (content) => {
    // Look for text between --- markers (common draft format)
    const draftMatch = content.match(/---\n([\s\S]*?)\n---/);
    if (draftMatch) {
      return draftMatch[1].trim();
    }

    // Look for Subject: followed by content
    const subjectMatch = content.match(/\*\*Subject:\*\*.*?\n\n---\n([\s\S]*?)\n---/);
    if (subjectMatch) {
      return subjectMatch[1].trim();
    }

    return null;
  };

  // Check if message contains a draft reply
  const hasDraftReply = (content) => {
    return content.includes('---\n') &&
           (content.toLowerCase().includes('ciao') ||
            content.toLowerCase().includes('simone') ||
            content.toLowerCase().includes('thanks') ||
            content.toLowerCase().includes('send it?') ||
            content.toLowerCase().includes('draft'));
  };

  // Open compose modal for forward
  const openForward = () => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const subject = latestEmail.subject?.startsWith('Fwd:')
      ? latestEmail.subject
      : `Fwd: ${latestEmail.subject}`;

    setComposeTo([]);
    setComposeCc([]);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject(subject);
    setComposeBody('\n\n' + EMAIL_SIGNATURE + '\n\n' + '─'.repeat(40) + '\n' +
      `---------- Forwarded message ----------\n` +
      `From: ${latestEmail.from_name || ''} <${latestEmail.from_email}>\n` +
      `Date: ${new Date(latestEmail.date).toLocaleString()}\n` +
      `Subject: ${latestEmail.subject}\n` +
      `To: ${formatRecipients(latestEmail.to_recipients) || ''}\n\n` +
      (latestEmail.body_text || latestEmail.snippet || ''));
    setComposeModal({ open: true, mode: 'forward' });
  };

  // Close compose modal
  const closeCompose = () => {
    setComposeModal({ open: false, mode: null });
    setComposeTo([]);
    setComposeCc([]);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject('');
    setComposeBody('');
    setContactSuggestions([]);
    setActiveField(null);
  };

  // Search contacts in Supabase for autocomplete
  const searchContacts = async (query) => {
    if (!query || query.length < 2) {
      setContactSuggestions([]);
      return;
    }

    try {
      // Search by email directly in contact_emails table
      const { data: emailMatches, error: emailError } = await supabase
        .from('contact_emails')
        .select(`
          email,
          contacts (
            contact_id,
            first_name,
            last_name,
            profile_image_url
          )
        `)
        .ilike('email', `%${query}%`)
        .limit(8);

      if (emailError) throw emailError;

      // Also search by name in contacts and get their emails
      const { data: nameMatches, error: nameError } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          profile_image_url,
          contact_emails (email)
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(8);

      if (nameError) throw nameError;

      // Transform email matches to flat structure
      const emailSuggestions = (emailMatches || [])
        .filter(item => item.contacts)
        .map(item => ({
          id: item.contacts.contact_id,
          first_name: item.contacts.first_name,
          last_name: item.contacts.last_name,
          email: item.email,
          profile_image_url: item.contacts.profile_image_url
        }));

      // Transform name matches - expand to one entry per email
      const nameSuggestions = (nameMatches || []).flatMap(contact => {
        const emails = contact.contact_emails || [];
        if (emails.length === 0) return [];
        return emails.map(e => ({
          id: contact.contact_id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: e.email,
          profile_image_url: contact.profile_image_url
        }));
      });

      // Combine and deduplicate by email
      const allSuggestions = [...emailSuggestions, ...nameSuggestions];
      const uniqueByEmail = allSuggestions.filter((item, index, self) =>
        index === self.findIndex(t => t.email === item.email)
      );

      setContactSuggestions(uniqueByEmail.slice(0, 8));
    } catch (error) {
      console.error('Error searching contacts:', error);
      setContactSuggestions([]);
    }
  };

  // Add email to To or CC
  const addEmailToField = (field, contact) => {
    const email = typeof contact === 'string' ? contact : contact.email;
    const name = typeof contact === 'string' ? '' : `${contact.first_name || ''} ${contact.last_name || ''}`.trim();

    if (field === 'to') {
      if (!composeTo.find(r => r.email.toLowerCase() === email.toLowerCase())) {
        setComposeTo([...composeTo, { email, name }]);
      }
      setComposeToInput('');
    } else {
      if (!composeCc.find(r => r.email.toLowerCase() === email.toLowerCase())) {
        setComposeCc([...composeCc, { email, name }]);
      }
      setComposeCcInput('');
    }
    setContactSuggestions([]);
  };

  // Remove email from To or CC
  const removeEmailFromField = (field, email) => {
    if (field === 'to') {
      setComposeTo(composeTo.filter(r => r.email !== email));
    } else {
      setComposeCc(composeCc.filter(r => r.email !== email));
    }
  };

  // Handle input keydown for adding emails
  const handleEmailInputKeyDown = (e, field) => {
    const input = field === 'to' ? composeToInput : composeCcInput;

    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      const trimmed = input.trim().replace(/,$/, '');
      if (trimmed && trimmed.includes('@')) {
        addEmailToField(field, trimmed);
      }
    } else if (e.key === 'Backspace' && !input) {
      // Remove last email if backspace on empty input
      if (field === 'to' && composeTo.length > 0) {
        setComposeTo(composeTo.slice(0, -1));
      } else if (field === 'cc' && composeCc.length > 0) {
        setComposeCc(composeCc.slice(0, -1));
      }
    }
  };

  // Send email
  const handleSend = async () => {
    if (composeTo.length === 0 || !composeBody.trim()) {
      toast.error('Please fill in recipient and message');
      return;
    }

    const latestEmail = getLatestEmail();
    if (!latestEmail) {
      toast.error('No email selected');
      return;
    }

    setSending(true);

    try {
      // Get just the body text (before the quote separator)
      const bodyText = composeBody.split('─'.repeat(40))[0].trim();

      // Use /send endpoint directly for full control
      const response = await fetch(`${BACKEND_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          cc: composeCc.length > 0 ? composeCc : undefined,
          subject: composeSubject,
          textBody: bodyText,
          inReplyTo: composeModal.mode !== 'forward' ? latestEmail.fastmail_id : undefined,
          references: composeModal.mode !== 'forward' ? latestEmail.fastmail_id : undefined,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success('Email sent!');
      closeCompose();
    } catch (error) {
      console.error('Send error:', error);
      toast.error(`Failed to send: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  // Archive email in Fastmail
  const archiveInFastmail = async (fastmailId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fastmailId }),
      });
      const result = await response.json();
      if (!result.success) {
        console.error('Archive failed:', result.error);
      }
      return result.success;
    } catch (error) {
      console.error('Archive error:', error);
      return false;
    }
  };

  // Save & Archive - save email to CRM tables and archive in Fastmail
  const saveAndArchive = async () => {
    if (!selectedThread || selectedThread.length === 0) return;

    setSaving(true);
    const errors = [];
    const logs = [];

    const log = (step, message, data = null) => {
      const entry = { step, message, data, timestamp: new Date().toISOString() };
      logs.push(entry);
      console.log(`[SaveArchive] ${step}: ${message}`, data || '');
    };

    try {
      log('START', 'Beginning Save & Archive process');

      // Get all contacts from the email thread (excluding me)
      const contactsInThread = emailContacts.filter(p =>
        p.contact?.contact_id && p.email?.toLowerCase() !== MY_EMAIL
      );
      log('CONTACTS', `Found ${contactsInThread.length} contacts (excluding me)`,
        contactsInThread.map(c => ({ email: c.email, name: c.contact?.first_name })));

      // Track successfully saved emails for archive/cleanup
      const successfullySavedEmails = [];

      // Process each email in the thread
      for (const email of selectedThread) {
        log('EMAIL', `Processing email: ${email.subject}`, { id: email.id, fastmail_id: email.fastmail_id });

        // Track if CRM save was successful for this email
        let crmSaveSuccess = true;

        // 1. Create or get email_thread
        let emailThreadId = null;
        try {
          // Check if thread already exists
          const { data: existingThread, error: checkError } = await supabase
            .from('email_threads')
            .select('email_thread_id')
            .eq('thread_id', email.thread_id)
            .maybeSingle();

          if (checkError) {
            log('ERROR', 'Failed to check existing thread', checkError);
            errors.push({ step: 'check_thread', error: checkError });
            crmSaveSuccess = false;
          }

          if (existingThread) {
            emailThreadId = existingThread.email_thread_id;
            log('THREAD', 'Using existing thread', { emailThreadId });

            // Update last_message_timestamp if newer
            const { error: updateError } = await supabase
              .from('email_threads')
              .update({
                last_message_timestamp: email.date,
                updated_at: new Date().toISOString()
              })
              .eq('email_thread_id', emailThreadId)
              .lt('last_message_timestamp', email.date);

            if (updateError) {
              log('WARNING', 'Failed to update thread timestamp', updateError);
            }
          } else {
            // Create new thread
            const { data: newThread, error: insertError } = await supabase
              .from('email_threads')
              .insert({
                thread_id: email.thread_id,
                subject: email.subject?.replace(/^(Re: |Fwd: )+/i, ''),
                last_message_timestamp: email.date,
              })
              .select('email_thread_id')
              .single();

            if (insertError) {
              log('ERROR', 'Failed to create thread', insertError);
              errors.push({ step: 'create_thread', error: insertError });
              crmSaveSuccess = false;
            } else {
              emailThreadId = newThread.email_thread_id;
              log('THREAD', 'Created new thread', { emailThreadId });
            }
          }
        } catch (threadError) {
          log('ERROR', 'Thread operation failed', threadError.message);
          errors.push({ step: 'thread', error: threadError.message });
          crmSaveSuccess = false;
        }

        // 2. Get sender contact_id (if in CRM)
        const senderEmail = email.from_email?.toLowerCase();
        let senderContactId = null;

        // First check emailContacts (already loaded)
        const senderContact = emailContacts.find(p => p.email?.toLowerCase() === senderEmail);
        if (senderContact?.contact?.contact_id) {
          senderContactId = senderContact.contact.contact_id;
        } else {
          // If not found (e.g., I'm the sender), look up directly in DB
          try {
            const { data: contactEmail } = await supabase
              .from('contact_emails')
              .select('contact_id')
              .eq('email', senderEmail)
              .maybeSingle();
            senderContactId = contactEmail?.contact_id || null;
          } catch (e) {
            log('WARNING', 'Failed to look up sender contact_id', e.message);
          }
        }
        log('SENDER', `Sender: ${senderEmail}`, { contactId: senderContactId, inCRM: !!senderContactId });

        // 3. Create email record if not exists
        let emailId = null;
        try {
          // Check if email already exists
          const { data: existingEmail, error: checkEmailError } = await supabase
            .from('emails')
            .select('email_id')
            .eq('gmail_id', email.fastmail_id)
            .maybeSingle();

          if (checkEmailError) {
            log('ERROR', 'Failed to check existing email', checkEmailError);
            errors.push({ step: 'check_email', error: checkEmailError });
            crmSaveSuccess = false;
          }

          if (existingEmail) {
            emailId = existingEmail.email_id;
            log('EMAIL_RECORD', 'Email already exists', { emailId });
          } else {
            // Determine direction
            const isSentByMe = senderEmail === MY_EMAIL;
            const direction = isSentByMe ? 'sent' : 'received';

            // Build email record - only include sender_contact_id if we have one
            const emailRecord = {
              gmail_id: email.fastmail_id,
              thread_id: email.thread_id,
              email_thread_id: emailThreadId,
              subject: email.subject,
              body_plain: email.body_text,
              body_html: email.body_html,
              message_timestamp: email.date,
              direction: direction,
              has_attachments: email.has_attachments || false,
              attachment_count: email.attachments?.length || 0,
              is_read: email.is_read || false,
              is_starred: email.is_starred || false,
              created_by: 'Edge Function',
            };

            // Only add sender_contact_id if we have a contact for the sender
            if (senderContactId) {
              emailRecord.sender_contact_id = senderContactId;
            }

            const { data: newEmail, error: insertEmailError } = await supabase
              .from('emails')
              .insert(emailRecord)
              .select('email_id')
              .single();

            if (insertEmailError) {
              log('ERROR', 'Failed to create email record', insertEmailError);
              errors.push({ step: 'create_email', error: insertEmailError });
              crmSaveSuccess = false;
            } else {
              emailId = newEmail.email_id;
              log('EMAIL_RECORD', 'Created email record', { emailId, direction });
            }
          }
        } catch (emailError) {
          log('ERROR', 'Email operation failed', emailError.message);
          errors.push({ step: 'email', error: emailError.message });
          crmSaveSuccess = false;
        }

        // 4. Create email_participants for contacts in CRM
        if (emailId) {
          try {
            // Collect all participants with their roles
            const participants = [];

            // From (sender)
            if (senderContactId) {
              participants.push({ contact_id: senderContactId, participant_type: 'sender' });
            }

            // To recipients
            const toRecipients = email.to_recipients || [];
            for (const recipient of toRecipients) {
              const recipientContact = emailContacts.find(p =>
                p.email?.toLowerCase() === recipient.email?.toLowerCase()
              );
              if (recipientContact?.contact?.contact_id) {
                participants.push({
                  contact_id: recipientContact.contact.contact_id,
                  participant_type: 'to'
                });
              }
            }

            // CC recipients
            const ccRecipients = email.cc_recipients || [];
            for (const recipient of ccRecipients) {
              const recipientContact = emailContacts.find(p =>
                p.email?.toLowerCase() === recipient.email?.toLowerCase()
              );
              if (recipientContact?.contact?.contact_id) {
                participants.push({
                  contact_id: recipientContact.contact.contact_id,
                  participant_type: 'cc'
                });
              }
            }

            log('PARTICIPANTS', `Found ${participants.length} participants in CRM`, participants);

            // Insert participants (skip if already exists)
            for (const participant of participants) {
              const { data: existing } = await supabase
                .from('email_participants')
                .select('participant_id')
                .eq('email_id', emailId)
                .eq('contact_id', participant.contact_id)
                .maybeSingle();

              if (!existing) {
                const { error: insertParticipantError } = await supabase
                  .from('email_participants')
                  .insert({
                    email_id: emailId,
                    contact_id: participant.contact_id,
                    participant_type: participant.participant_type,
                  });

                if (insertParticipantError) {
                  log('WARNING', 'Failed to insert participant', { ...participant, error: insertParticipantError });
                }
              }
            }
            log('PARTICIPANTS', 'Participants processed');
          } catch (participantError) {
            log('ERROR', 'Participant operation failed', participantError.message);
            errors.push({ step: 'participants', error: participantError.message });
          }
        }

        // 5. Create interactions for contacts (not me)
        if (emailThreadId) {
          try {
            const isSentByMe = senderEmail === MY_EMAIL;

            for (const contactEntry of contactsInThread) {
              const contactId = contactEntry.contact?.contact_id;
              if (!contactId) continue;

              // Check if interaction already exists for this thread and contact
              const { data: existingInteraction } = await supabase
                .from('interactions')
                .select('interaction_id')
                .eq('contact_id', contactId)
                .eq('email_thread_id', emailThreadId)
                .maybeSingle();

              if (existingInteraction) {
                log('INTERACTION', `Interaction already exists for contact ${contactEntry.email}`,
                  { interactionId: existingInteraction.interaction_id });
                continue;
              }

              // Determine direction from contact's perspective
              // If I sent it → contact received it → direction is 'sent' (from me)
              // If contact sent it → I received it → direction is 'received' (from them)
              const direction = isSentByMe ? 'sent' : 'received';

              const { data: newInteraction, error: interactionError } = await supabase
                .from('interactions')
                .insert({
                  contact_id: contactId,
                  interaction_type: 'email',
                  direction: direction,
                  interaction_date: email.date,
                  email_thread_id: emailThreadId,
                  summary: email.subject || email.snippet?.substring(0, 100),
                })
                .select('interaction_id')
                .single();

              if (interactionError) {
                log('WARNING', `Failed to create interaction for ${contactEntry.email}`, interactionError);
              } else {
                log('INTERACTION', `Created interaction for ${contactEntry.email}`,
                  { interactionId: newInteraction.interaction_id, direction });
              }
            }
          } catch (interactionError) {
            log('ERROR', 'Interaction operation failed', interactionError.message);
            errors.push({ step: 'interactions', error: interactionError.message });
          }
        }

        // 6. Link thread to contacts via contact_email_threads
        if (emailThreadId) {
          try {
            for (const contactEntry of contactsInThread) {
              const contactId = contactEntry.contact?.contact_id;
              if (!contactId) continue;

              const { data: existing } = await supabase
                .from('contact_email_threads')
                .select('contact_id')
                .eq('contact_id', contactId)
                .eq('email_thread_id', emailThreadId)
                .maybeSingle();

              if (!existing) {
                const { error: linkError } = await supabase
                  .from('contact_email_threads')
                  .insert({ contact_id: contactId, email_thread_id: emailThreadId });

                if (linkError) {
                  log('WARNING', `Failed to link thread to contact ${contactEntry.email}`, linkError);
                }
              }
            }
            log('THREAD_LINKS', 'Thread linked to contacts');
          } catch (linkError) {
            log('ERROR', 'Thread link operation failed', linkError.message);
            errors.push({ step: 'thread_links', error: linkError.message });
          }
        }

        // 7. Update last_interaction_at on contacts
        try {
          for (const contactEntry of contactsInThread) {
            const contactId = contactEntry.contact?.contact_id;
            if (!contactId) continue;

            // Only update if this email is newer than current last_interaction_at
            const { error: updateError } = await supabase
              .from('contacts')
              .update({
                last_interaction_at: email.date,
                last_modified_at: new Date().toISOString(),
                last_modified_by: 'Edge Function'
              })
              .eq('contact_id', contactId)
              .or(`last_interaction_at.is.null,last_interaction_at.lt.${email.date}`);

            if (updateError) {
              log('WARNING', `Failed to update last_interaction_at for ${contactEntry.email}`, updateError);
            }
          }
          log('CONTACTS_UPDATE', 'Updated last_interaction_at for contacts');
        } catch (updateError) {
          log('ERROR', 'Contact update operation failed', updateError.message);
          errors.push({ step: 'contacts_update', error: updateError.message });
        }

        // Only proceed with archive and cleanup if CRM save was successful
        if (crmSaveSuccess) {
          // 8. Archive in Fastmail
          try {
            const archiveSuccess = await archiveInFastmail(email.fastmail_id);
            if (archiveSuccess) {
              log('FASTMAIL', 'Archived in Fastmail', { fastmail_id: email.fastmail_id });
            } else {
              log('WARNING', 'Failed to archive in Fastmail', { fastmail_id: email.fastmail_id });
            }
          } catch (archiveError) {
            log('ERROR', 'Fastmail archive failed', archiveError.message);
            errors.push({ step: 'fastmail_archive', error: archiveError.message });
          }

          // 9. Remove from command_center_inbox
          try {
            const { error: deleteError } = await supabase
              .from('command_center_inbox')
              .delete()
              .eq('id', email.id);

            if (deleteError) {
              log('ERROR', 'Failed to delete from command_center_inbox', deleteError);
              errors.push({ step: 'delete_inbox', error: deleteError });
            } else {
              log('CLEANUP', 'Removed from command_center_inbox', { id: email.id });
            }
          } catch (deleteError) {
            log('ERROR', 'Delete operation failed', deleteError.message);
            errors.push({ step: 'delete', error: deleteError.message });
          }

          // Track this email as successfully saved
          successfullySavedEmails.push(email.id);
        } else {
          log('SKIP_ARCHIVE', 'Skipping archive/cleanup due to CRM save failure', { emailId: email.id });
        }
      }

      // Update local state - only remove successfully saved emails
      if (successfullySavedEmails.length > 0) {
        const processedIds = new Set(successfullySavedEmails);
        setEmails(prev => prev.filter(e => !processedIds.has(e.id)));
        setThreads(prev => {
          const updated = prev.map(t => ({
            ...t,
            emails: t.emails.filter(e => !processedIds.has(e.id)),
            count: t.emails.filter(e => !processedIds.has(e.id)).length
          })).filter(t => t.emails.length > 0);
          return updated.map(t => ({
            ...t,
            latestEmail: t.emails[t.emails.length - 1]
          }));
        });
        setSelectedThread(null);
        log('STATE_UPDATE', `Removed ${successfullySavedEmails.length} emails from local state`);
      } else {
        log('STATE_UPDATE', 'No emails were successfully saved - keeping all in local state');
      }

      log('COMPLETE', `Finished with ${errors.length} errors, ${successfullySavedEmails.length} saved`);

      if (successfullySavedEmails.length === 0) {
        console.error('[SaveArchive] All saves failed:', errors);
        toast.error('Failed to save - emails not archived');
      } else if (errors.length > 0) {
        console.error('[SaveArchive] Errors:', errors);
        toast.success(`Saved & Archived ${successfullySavedEmails.length} emails (${errors.length} warnings)`);
      } else {
        toast.success('Saved & Archived successfully');
      }

    } catch (error) {
      log('FATAL', 'Unexpected error', error.message);
      errors.push({ step: 'fatal', error: error.message });
      console.error('[SaveArchive] Fatal error:', error);
      console.error('[SaveArchive] Logs:', logs);
      toast.error('Failed to Save & Archive');
    } finally {
      setSaving(false);
      // Log summary to console for debugging
      console.log('[SaveArchive] Complete log:', logs);
    }
  };

  // Mark as spam - block email or domain, archive in Fastmail, and delete from Supabase
  const markAsSpam = async (type) => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const emailAddr = latestEmail.from_email?.toLowerCase();
    const domain = emailAddr?.split('@')[1];

    try {
      let deletedCount = 0;

      if (type === 'email') {
        // Check if email already in spam list
        const { data: existingArr } = await supabase
          .from('emails_spam')
          .select('counter')
          .eq('email', emailAddr);

        const existing = existingArr?.[0];
        if (existing) {
          // Increment counter
          const { error: spamError } = await supabase
            .from('emails_spam')
            .update({
              counter: existing.counter + 1,
              last_modified_at: new Date().toISOString()
            })
            .eq('email', emailAddr);

          if (spamError) {
            console.error('Spam update error:', spamError);
            throw spamError;
          }
        } else {
          // Insert new
          const { error: spamError } = await supabase.from('emails_spam').insert({
            email: emailAddr,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString(),
          });

          if (spamError) {
            console.error('Spam insert error:', spamError);
            throw spamError;
          }
        }

        // Get all emails from this sender (need fastmail_id for archiving)
        const { data: emailsToDelete, error: fetchError } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', emailAddr);

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }

        // Archive each email in Fastmail
        for (const email of emailsToDelete || []) {
          if (email.fastmail_id) {
            await archiveInFastmail(email.fastmail_id);
          }
        }

        // Delete ALL emails from this sender in Supabase
        const { data: deleted, error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', emailAddr)
          .select('id');

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw deleteError;
        }

        deletedCount = deleted?.length || 0;
        console.log('Deleted emails:', deleted);

        // Update local state - remove all emails from this sender
        const idsToRemove = new Set(deleted?.map(e => e.id) || []);
        setEmails(prev => prev.filter(e => !idsToRemove.has(e.id)));
        setThreads(prev => {
          const updated = prev.map(t => ({
            ...t,
            emails: t.emails.filter(e => !idsToRemove.has(e.id)),
            count: t.emails.filter(e => !idsToRemove.has(e.id)).length
          })).filter(t => t.emails.length > 0);

          // Update latestEmail for remaining threads
          return updated.map(t => ({
            ...t,
            latestEmail: t.emails[t.emails.length - 1]
          }));
        });

        toast.success(`Blocked ${emailAddr} - archived & deleted ${deletedCount} emails`);
      } else {
        // Check if domain already in spam list
        const { data: existingDomainArr } = await supabase
          .from('domains_spam')
          .select('counter')
          .eq('domain', domain);

        const existing = existingDomainArr?.[0];
        if (existing) {
          // Increment counter
          const { error: spamError } = await supabase
            .from('domains_spam')
            .update({
              counter: existing.counter + 1,
              last_modified_at: new Date().toISOString()
            })
            .eq('domain', domain);

          if (spamError) {
            console.error('Domain spam update error:', spamError);
            throw spamError;
          }
        } else {
          // Insert new
          const { error: spamError } = await supabase.from('domains_spam').insert({
            domain: domain,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString(),
          });

          if (spamError) {
            console.error('Domain spam insert error:', spamError);
            throw spamError;
          }
        }

        // Get all emails from this domain (need fastmail_id for archiving)
        const { data: emailsToDelete, error: fetchError } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', `%@${domain}`);

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }

        // Archive each email in Fastmail
        for (const email of emailsToDelete || []) {
          if (email.fastmail_id) {
            await archiveInFastmail(email.fastmail_id);
          }
        }

        // Delete ALL emails from this domain in Supabase
        const { data: deleted, error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', `%@${domain}`)
          .select('id');

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw deleteError;
        }

        deletedCount = deleted?.length || 0;
        console.log('Deleted emails:', deleted);

        // Update local state - remove all emails from this domain
        const idsToRemove = new Set(deleted?.map(e => e.id) || []);
        setEmails(prev => prev.filter(e => !idsToRemove.has(e.id)));
        setThreads(prev => {
          const updated = prev.map(t => ({
            ...t,
            emails: t.emails.filter(e => !idsToRemove.has(e.id)),
            count: t.emails.filter(e => !idsToRemove.has(e.id)).length
          })).filter(t => t.emails.length > 0);

          return updated.map(t => ({
            ...t,
            latestEmail: t.emails[t.emails.length - 1]
          }));
        });

        toast.success(`Blocked @${domain} - archived & deleted ${deletedCount} emails`);
      }

      // Clear selection if current thread was deleted
      setSelectedThread(prev => {
        if (!prev) return null;
        const remaining = prev.filter(e =>
          type === 'email'
            ? e.from_email?.toLowerCase() !== emailAddr
            : !e.from_email?.toLowerCase().endsWith(`@${domain}`)
        );
        return remaining.length > 0 ? remaining : null;
      });

      setSpamMenuOpen(false);
    } catch (error) {
      console.error('Spam error:', error);
      toast.error('Failed to mark as spam');
    }
  };

  // Delete single email (without blocking)
  const deleteEmail = async () => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    try {
      const { error } = await supabase
        .from('command_center_inbox')
        .delete()
        .eq('id', latestEmail.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete email: ' + error.message);
        return;
      }

      // Update local state
      if (selectedThread.length === 1) {
        setThreads(prev => prev.filter(t => t.threadId !== (latestEmail.thread_id || latestEmail.id)));
        setSelectedThread(null);
      } else {
        const newThread = selectedThread.filter(e => e.id !== latestEmail.id);
        setSelectedThread(newThread);
        setThreads(prev => prev.map(t =>
          t.threadId === (latestEmail.thread_id || latestEmail.id)
            ? { ...t, emails: newThread, latestEmail: newThread[newThread.length - 1], count: newThread.length }
            : t
        ));
      }

      setEmails(prev => prev.filter(e => e.id !== latestEmail.id));
      toast.success('Email deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete email');
    }
  };

  const tabs = [
    { id: 'email', label: 'Email', icon: FaEnvelope, count: emails.length },
    { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, count: 0 },
    { id: 'calendar', label: 'Calendar', icon: FaCalendar, count: 0 },
  ];

  return (
    <PageContainer theme={theme}>
      {/* Header with Tabs */}
      <Header theme={theme}>
        <HeaderTitle theme={theme}>Command Center</HeaderTitle>
        <TabsContainer>
          {tabs.map(tab => (
            <Tab
              key={tab.id}
              theme={theme}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon />
              {tab.label}
              {tab.count > 0 && (
                <Badge theme={theme} $active={activeTab === tab.id}>
                  {tab.count}
                </Badge>
              )}
            </Tab>
          ))}
        </TabsContainer>
      </Header>

      {/* Main 3-panel layout */}
      <MainContent>
        {/* Left: Email List */}
        <EmailListPanel theme={theme} $collapsed={listCollapsed}>
          <ListHeader theme={theme}>
            {!listCollapsed && <span>Inbox</span>}
            <CollapseButton theme={theme} onClick={() => setListCollapsed(!listCollapsed)}>
              {listCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </CollapseButton>
          </ListHeader>

          {!listCollapsed && (
            <EmailList>
              {loading ? (
                <EmptyState theme={theme}>Loading...</EmptyState>
              ) : threads.length === 0 ? (
                <EmptyState theme={theme}>No emails</EmptyState>
              ) : (
                threads.map(thread => (
                  <EmailItem
                    key={thread.threadId}
                    theme={theme}
                    $selected={selectedThread?.[0]?.thread_id === thread.threadId || selectedThread?.[0]?.id === thread.threadId}
                    onClick={() => setSelectedThread(thread.emails)}
                  >
                    <EmailSender theme={theme}>
                      {getRelevantPerson(thread.latestEmail)}
                      {thread.count > 1 && <span style={{ marginLeft: '6px', opacity: 0.6 }}>({thread.count})</span>}
                    </EmailSender>
                    <EmailSubject theme={theme}>{thread.latestEmail.subject}</EmailSubject>
                    <EmailSnippet theme={theme}>{thread.latestEmail.snippet}</EmailSnippet>
                  </EmailItem>
                ))
              )}
            </EmailList>
          )}

          {!listCollapsed && threads.length > 0 && (
            <PendingCount theme={theme}>
              {threads.length} threads ({emails.length} emails)
            </PendingCount>
          )}
        </EmailListPanel>

        {/* Center: Email Content */}
        <EmailContentPanel theme={theme}>
          {selectedThread && selectedThread.length > 0 ? (
            <>
              {/* Thread subject */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
              }}>
                <EmailSubjectFull theme={theme} style={{ margin: 0 }}>
                  {selectedThread[0].subject?.replace(/^(Re: |Fwd: )+/i, '')}
                  {selectedThread.length > 1 && <span style={{ opacity: 0.6, marginLeft: '8px' }}>({selectedThread.length} messages)</span>}
                </EmailSubjectFull>
                <button
                  onClick={saveAndArchive}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: saving
                      ? (theme === 'light' ? '#9CA3AF' : '#6B7280')
                      : (theme === 'light' ? '#10B981' : '#059669'),
                    color: 'white',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    opacity: saving ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.target.style.background = theme === 'light' ? '#059669' : '#047857';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.target.style.background = theme === 'light' ? '#10B981' : '#059669';
                    }
                  }}
                >
                  {saving ? (
                    <>
                      <span style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave size={14} />
                      <FaArchive size={14} />
                      Save & Archive
                    </>
                  )}
                </button>
              </div>

              {/* All messages in thread */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {selectedThread.map((email, index) => (
                  <div key={email.id} style={{
                    padding: '16px 24px',
                    borderBottom: index < selectedThread.length - 1 ? `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}` : 'none',
                    background: email.from_email?.toLowerCase() === MY_EMAIL
                      ? (theme === 'light' ? '#F0F9FF' : '#1E3A5F')
                      : 'transparent'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      {email.from_email?.toLowerCase() === MY_EMAIL ? (
                        <span style={{ fontSize: '14px', fontWeight: 500, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                          To: {formatRecipients(email.to_recipients) || 'Unknown'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '14px', fontWeight: 500, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                          From: {email.from_name || email.from_email}
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                        {formatDate(email.date)}
                      </span>
                    </div>
                    {email.body_html ? (
                      <div
                        style={{
                          color: theme === 'light' ? '#374151' : '#D1D5DB',
                          fontSize: '14px',
                          lineHeight: '1.6',
                        }}
                        dangerouslySetInnerHTML={{ __html: email.body_html }}
                      />
                    ) : (
                      <div style={{
                        color: theme === 'light' ? '#374151' : '#D1D5DB',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {email.body_text || email.snippet || 'No content'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Reply actions - based on latest email */}
              {(() => {
                const latestEmail = selectedThread[selectedThread.length - 1];
                const isSentByMe = latestEmail.from_email?.toLowerCase() === MY_EMAIL;
                const toCount = latestEmail.to_recipients?.length || 0;
                const ccCount = latestEmail.cc_recipients?.length || 0;
                const showReplyAll = isSentByMe ? (toCount + ccCount > 1) : (ccCount > 0);

                return (
                  <EmailActions theme={theme}>
                    <ActionBtn theme={theme} onClick={() => openReply(false)}>Reply</ActionBtn>
                    {showReplyAll && (
                      <ActionBtn theme={theme} onClick={() => openReply(true)}>Reply All</ActionBtn>
                    )}
                    <ActionBtn theme={theme} onClick={openForward}>Forward</ActionBtn>

                    {/* Spam and Delete buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                      {/* Spam button with dropdown */}
                      {!isSentByMe && (
                        <div style={{ position: 'relative' }}>
                        <ActionBtn
                          theme={theme}
                          onClick={() => setSpamMenuOpen(!spamMenuOpen)}
                          style={{
                            background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                            color: theme === 'light' ? '#DC2626' : '#FCA5A5'
                          }}
                        >
                          Spam
                        </ActionBtn>
                        {spamMenuOpen && (
                          <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            right: 0,
                            marginBottom: '4px',
                            background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            overflow: 'hidden',
                            zIndex: 100
                          }}>
                            <button
                              onClick={() => markAsSpam('email')}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '10px 16px',
                                border: 'none',
                                background: 'transparent',
                                color: theme === 'light' ? '#111827' : '#F9FAFB',
                                fontSize: '14px',
                                textAlign: 'left',
                                cursor: 'pointer'
                              }}
                              onMouseOver={(e) => e.target.style.background = theme === 'light' ? '#F3F4F6' : '#374151'}
                              onMouseOut={(e) => e.target.style.background = 'transparent'}
                            >
                              Block Email: {latestEmail.from_email}
                            </button>
                            <button
                              onClick={() => markAsSpam('domain')}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '10px 16px',
                                border: 'none',
                                background: 'transparent',
                                color: theme === 'light' ? '#111827' : '#F9FAFB',
                                fontSize: '14px',
                                textAlign: 'left',
                                cursor: 'pointer'
                              }}
                              onMouseOver={(e) => e.target.style.background = theme === 'light' ? '#F3F4F6' : '#374151'}
                              onMouseOut={(e) => e.target.style.background = 'transparent'}
                            >
                              Block Domain: {latestEmail.from_email?.split('@')[1]}
                            </button>
                          </div>
                        )}
                        </div>
                      )}

                      <ActionBtn
                        theme={theme}
                        onClick={deleteEmail}
                        style={{
                          background: theme === 'light' ? '#F3F4F6' : '#374151',
                          color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                          padding: '8px 12px'
                        }}
                        title="Delete email"
                      >
                        <FaTrash />
                      </ActionBtn>
                    </div>
                  </EmailActions>
                );
              })()}
            </>
          ) : (
            <EmptyState theme={theme}>Select a thread to view</EmptyState>
          )}
        </EmailContentPanel>

        {/* Right: Actions Panel */}
        <ActionsPanel theme={theme}>
          <ActionsPanelTabs theme={theme}>
            <ActionTabIcon theme={theme} $active={activeActionTab === 'suggestions'} onClick={() => setActiveActionTab('suggestions')} title="Suggestions">
              <FaLightbulb />
            </ActionTabIcon>
            <ActionTabIcon theme={theme} $active={activeActionTab === 'contacts'} onClick={() => setActiveActionTab('contacts')} title="Contacts">
              <FaUser />
            </ActionTabIcon>
            <ActionTabIcon theme={theme} $active={activeActionTab === 'companies'} onClick={() => setActiveActionTab('companies')} title="Companies">
              <FaBuilding />
            </ActionTabIcon>
            <ActionTabIcon theme={theme} $active={activeActionTab === 'deals'} onClick={() => setActiveActionTab('deals')} title="Deals">
              <FaDollarSign />
            </ActionTabIcon>
            <ActionTabIcon theme={theme} $active={activeActionTab === 'introductions'} onClick={() => setActiveActionTab('introductions')} title="Introductions">
              <FaHandshake />
            </ActionTabIcon>
            <ActionTabIcon theme={theme} $active={activeActionTab === 'tasks'} onClick={() => setActiveActionTab('tasks')} title="Tasks">
              <FaTasks />
            </ActionTabIcon>
            <ActionTabIcon theme={theme} $active={activeActionTab === 'notes'} onClick={() => setActiveActionTab('notes')} title="Notes">
              <FaStickyNote />
            </ActionTabIcon>
            <ActionTabIcon theme={theme} $active={activeActionTab === 'attachments'} onClick={() => setActiveActionTab('attachments')} title="Attachments">
              <FaPaperclip />
            </ActionTabIcon>
          </ActionsPanelTabs>

          {selectedThread && selectedThread.length > 0 && (
            <>
              {activeActionTab === 'suggestions' && (
                <ChatContainer>
                  {/* Quick Actions */}
                  <QuickActionsContainer theme={theme}>
                    <QuickActionChip theme={theme} onClick={() => handleQuickAction('TL;DR - max 2-3 bullet points')}>
                      TL;DR
                    </QuickActionChip>
                    <QuickActionChip theme={theme} onClick={() => handleQuickAction('What should I do? One clear action.')}>
                      Next step
                    </QuickActionChip>
                    <QuickActionChip theme={theme} onClick={() => handleQuickAction('Draft a short, warm reply in my style')}>
                      Draft reply
                    </QuickActionChip>
                    <QuickActionChip theme={theme} onClick={() => handleQuickAction('Any deadlines or asks I need to note?')}>
                      Deadlines
                    </QuickActionChip>
                  </QuickActionsContainer>

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

                  {/* Chat Input */}
                  <ChatInputContainer theme={theme}>
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
                      disabled={chatLoading || !chatInput.trim()}
                    >
                      <FaPaperPlane size={14} />
                    </ChatSendButton>
                  </ChatInputContainer>
                </ChatContainer>
              )}

              {activeActionTab === 'contacts' && (
                <>
                  {emailContacts.length > 0 ? (
                    <>
                      {/* FROM section */}
                      {emailContacts.filter(p => p.roles.includes('from')).length > 0 && (
                        <>
                          <div style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            From
                          </div>
                          {emailContacts.filter(p => p.roles.includes('from')).map((participant, idx) => {
                            const score = participant.contact?.completeness_score || 0;
                            const circumference = 2 * Math.PI * 16;
                            const strokeDashoffset = circumference - (score / 100) * circumference;
                            const scoreColor = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
                            return (
                            <ActionCard key={'from-' + participant.email + idx} theme={theme}>
                              <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {participant.contact?.profile_image_url ? (
                                  <img src={participant.contact.profile_image_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme === 'light' ? '#E5E7EB' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                    {participant.contact ? `${participant.contact.first_name?.[0] || ''}${participant.contact.last_name?.[0] || ''}` : participant.name?.[0]?.toUpperCase() || '?'}
                                  </div>
                                )}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, fontSize: '15px' }}>
                                    {participant.contact ? `${participant.contact.first_name} ${participant.contact.last_name}` : participant.name}
                                  </div>
                                  {(participant.contact?.job_role || participant.contact?.company_name) && (
                                    <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>
                                      {participant.contact.job_role}{participant.contact.job_role && participant.contact.company_name && ' @ '}{participant.contact.company_name}
                                    </div>
                                  )}
                                </div>
                                {participant.contact && (
                                  <div style={{ position: 'relative', width: 40, height: 40, cursor: 'pointer' }} title={`${score}% complete`} onClick={() => handleOpenQuickEditModal(participant.contact, true)}>
                                    <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
                                      <circle cx="20" cy="20" r="16" fill="none" stroke={theme === 'light' ? '#E5E7EB' : '#374151'} strokeWidth="4" />
                                      <circle cx="20" cy="20" r="16" fill="none" stroke={scoreColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                                    </svg>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', fontWeight: 600, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                                      {score === 100 ? <FaCrown size={14} color="#F59E0B" /> : `${score}%`}
                                    </div>
                                  </div>
                                )}
                              </ActionCardHeader>
                              <ActionCardContent theme={theme}>
                                <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>{participant.email}</div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {participant.contact?.category && (
                                    <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#E5E7EB' : '#374151', color: theme === 'light' ? '#374151' : '#D1D5DB' }}>{participant.contact.category}</span>
                                  )}
                                  {!participant.hasContact && (
                                    <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#FEF3C7' : '#78350F', color: theme === 'light' ? '#92400E' : '#FDE68A', cursor: 'pointer' }}>+ Add</span>
                                  )}
                                </div>
                              </ActionCardContent>
                            </ActionCard>
                          )})}
                        </>
                      )}

                      {/* TO section */}
                      {emailContacts.filter(p => p.roles.includes('to')).length > 0 && (
                        <>
                          <div style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginTop: '8px'
                          }}>
                            To
                          </div>
                          {emailContacts.filter(p => p.roles.includes('to')).map((participant, idx) => {
                            const score = participant.contact?.completeness_score || 0;
                            const circumference = 2 * Math.PI * 16;
                            const strokeDashoffset = circumference - (score / 100) * circumference;
                            const scoreColor = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
                            return (
                            <ActionCard key={'to-' + participant.email + idx} theme={theme}>
                              <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {participant.contact?.profile_image_url ? (
                                  <img src={participant.contact.profile_image_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme === 'light' ? '#E5E7EB' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                    {participant.contact ? `${participant.contact.first_name?.[0] || ''}${participant.contact.last_name?.[0] || ''}` : participant.name?.[0]?.toUpperCase() || '?'}
                                  </div>
                                )}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, fontSize: '15px' }}>
                                    {participant.contact ? `${participant.contact.first_name} ${participant.contact.last_name}` : participant.name}
                                  </div>
                                  {(participant.contact?.job_role || participant.contact?.company_name) && (
                                    <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>
                                      {participant.contact.job_role}{participant.contact.job_role && participant.contact.company_name && ' @ '}{participant.contact.company_name}
                                    </div>
                                  )}
                                </div>
                                {participant.contact && (
                                  <div style={{ position: 'relative', width: 40, height: 40, cursor: 'pointer' }} title={`${score}% complete`} onClick={() => handleOpenQuickEditModal(participant.contact, true)}>
                                    <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
                                      <circle cx="20" cy="20" r="16" fill="none" stroke={theme === 'light' ? '#E5E7EB' : '#374151'} strokeWidth="4" />
                                      <circle cx="20" cy="20" r="16" fill="none" stroke={scoreColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                                    </svg>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', fontWeight: 600, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                                      {score === 100 ? <FaCrown size={14} color="#F59E0B" /> : `${score}%`}
                                    </div>
                                  </div>
                                )}
                              </ActionCardHeader>
                              <ActionCardContent theme={theme}>
                                <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>{participant.email}</div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {participant.contact?.category && (
                                    <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#E5E7EB' : '#374151', color: theme === 'light' ? '#374151' : '#D1D5DB' }}>{participant.contact.category}</span>
                                  )}
                                  {!participant.hasContact && (
                                    <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#FEF3C7' : '#78350F', color: theme === 'light' ? '#92400E' : '#FDE68A', cursor: 'pointer' }}>+ Add</span>
                                  )}
                                </div>
                              </ActionCardContent>
                            </ActionCard>
                          )})}
                        </>
                      )}

                      {/* CC section */}
                      {emailContacts.filter(p => p.roles.includes('cc')).length > 0 && (
                        <>
                          <div style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginTop: '8px'
                          }}>
                            CC
                          </div>
                          {emailContacts.filter(p => p.roles.includes('cc')).map((participant, idx) => {
                            const score = participant.contact?.completeness_score || 0;
                            const circumference = 2 * Math.PI * 16;
                            const strokeDashoffset = circumference - (score / 100) * circumference;
                            const scoreColor = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
                            return (
                            <ActionCard key={'cc-' + participant.email + idx} theme={theme}>
                              <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {participant.contact?.profile_image_url ? (
                                  <img src={participant.contact.profile_image_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme === 'light' ? '#E5E7EB' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                                    {participant.contact ? `${participant.contact.first_name?.[0] || ''}${participant.contact.last_name?.[0] || ''}` : participant.name?.[0]?.toUpperCase() || '?'}
                                  </div>
                                )}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, fontSize: '15px' }}>
                                    {participant.contact ? `${participant.contact.first_name} ${participant.contact.last_name}` : participant.name}
                                  </div>
                                  {(participant.contact?.job_role || participant.contact?.company_name) && (
                                    <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>
                                      {participant.contact.job_role}{participant.contact.job_role && participant.contact.company_name && ' @ '}{participant.contact.company_name}
                                    </div>
                                  )}
                                </div>
                                {participant.contact && (
                                  <div style={{ position: 'relative', width: 40, height: 40, cursor: 'pointer' }} title={`${score}% complete`} onClick={() => handleOpenQuickEditModal(participant.contact, true)}>
                                    <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
                                      <circle cx="20" cy="20" r="16" fill="none" stroke={theme === 'light' ? '#E5E7EB' : '#374151'} strokeWidth="4" />
                                      <circle cx="20" cy="20" r="16" fill="none" stroke={scoreColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                                    </svg>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', fontWeight: 600, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                                      {score === 100 ? <FaCrown size={14} color="#F59E0B" /> : `${score}%`}
                                    </div>
                                  </div>
                                )}
                              </ActionCardHeader>
                              <ActionCardContent theme={theme}>
                                <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>{participant.email}</div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {participant.contact?.category && (
                                    <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#E5E7EB' : '#374151', color: theme === 'light' ? '#374151' : '#D1D5DB' }}>{participant.contact.category}</span>
                                  )}
                                  {!participant.hasContact && (
                                    <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#FEF3C7' : '#78350F', color: theme === 'light' ? '#92400E' : '#FDE68A', cursor: 'pointer' }}>+ Add</span>
                                  )}
                                </div>
                              </ActionCardContent>
                            </ActionCard>
                          )})}
                        </>
                      )}
                    </>
                  ) : (
                    <ActionCard theme={theme}>
                      <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6 }}>
                        Select a thread to see participants
                      </ActionCardContent>
                    </ActionCard>
                  )}
                </>
              )}

              {activeActionTab === 'companies' && (
                <>
                  {emailCompanies.length > 0 ? (
                    <>
                      <div style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Related
                      </div>
                      {emailCompanies.map((item, idx) => (
                      <ActionCard
                        key={item.domain + idx}
                        theme={theme}
                        style={{ cursor: item.company?.company_id ? 'pointer' : 'default' }}
                        onClick={() => item.company?.company_id && navigate(`/company/${item.company.company_id}`)}
                      >
                        <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme === 'light' ? '#E5E7EB' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                            {item.company?.name ? item.company.name.substring(0, 2).toUpperCase() : item.domain?.substring(0, 2).toUpperCase() || '?'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '15px' }}>
                              {item.company?.name || item.domain}
                            </div>
                            {item.contacts?.length > 0 && (
                              <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>
                                {item.contacts.map(c => c.name).join(', ')}
                              </div>
                            )}
                          </div>
                        </ActionCardHeader>
                        <ActionCardContent theme={theme}>
                          <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>
                            {item.domains?.length > 0 ? item.domains.join(', ') : item.domain || 'No domain'}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {item.company?.category && (
                              <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#E5E7EB' : '#374151', color: theme === 'light' ? '#374151' : '#D1D5DB' }}>{item.company.category}</span>
                            )}
                            {!item.hasCompany && (
                              <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#FEF3C7' : '#78350F', color: theme === 'light' ? '#92400E' : '#FDE68A', cursor: 'pointer' }}>+ Add</span>
                            )}
                          </div>
                        </ActionCardContent>
                      </ActionCard>
                      ))}
                    </>
                  ) : (
                    <ActionCard theme={theme}>
                      <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6 }}>
                        Select a thread to see companies
                      </ActionCardContent>
                    </ActionCard>
                  )}
                </>
              )}

              {activeActionTab === 'deals' && (
                <ActionCard theme={theme}>
                  <ActionCardHeader theme={theme}>
                    <FaDollarSign /> Create Deal
                  </ActionCardHeader>
                  <ActionCardContent theme={theme}>
                    New opportunity
                  </ActionCardContent>
                  <ActionCardButtons>
                    <SmallBtn theme={theme}>Edit</SmallBtn>
                    <SmallBtn theme={theme} $variant="success">✓</SmallBtn>
                    <SmallBtn theme={theme} $variant="danger">✗</SmallBtn>
                  </ActionCardButtons>
                </ActionCard>
              )}

              {activeActionTab === 'introductions' && (
                <ActionCard theme={theme}>
                  <ActionCardHeader theme={theme}>
                    <FaHandshake /> Introduction
                  </ActionCardHeader>
                  <ActionCardContent theme={theme}>
                    Connect contacts
                  </ActionCardContent>
                  <ActionCardButtons>
                    <SmallBtn theme={theme}>Edit</SmallBtn>
                    <SmallBtn theme={theme} $variant="success">✓</SmallBtn>
                    <SmallBtn theme={theme} $variant="danger">✗</SmallBtn>
                  </ActionCardButtons>
                </ActionCard>
              )}

              {activeActionTab === 'tasks' && (
                <ActionCard theme={theme}>
                  <ActionCardHeader theme={theme}>
                    <FaTasks /> Create Task
                  </ActionCardHeader>
                  <ActionCardContent theme={theme}>
                    Add a follow-up task
                  </ActionCardContent>
                  <ActionCardButtons>
                    <SmallBtn theme={theme}>Edit</SmallBtn>
                    <SmallBtn theme={theme} $variant="success">✓</SmallBtn>
                    <SmallBtn theme={theme} $variant="danger">✗</SmallBtn>
                  </ActionCardButtons>
                </ActionCard>
              )}

              {activeActionTab === 'notes' && (
                <ActionCard theme={theme}>
                  <ActionCardHeader theme={theme}>
                    <FaStickyNote /> Add Note
                  </ActionCardHeader>
                  <ActionCardContent theme={theme}>
                    Create note in Obsidian
                  </ActionCardContent>
                  <ActionCardButtons>
                    <SmallBtn theme={theme}>Edit</SmallBtn>
                    <SmallBtn theme={theme} $variant="success">✓</SmallBtn>
                    <SmallBtn theme={theme} $variant="danger">✗</SmallBtn>
                  </ActionCardButtons>
                </ActionCard>
              )}

              {activeActionTab === 'attachments' && (
                <>
                  {(() => {
                    // Collect all attachments from all emails in thread
                    const allAttachments = selectedThread.flatMap(email =>
                      (email.attachments || []).map(att => ({
                        ...att,
                        emailSubject: email.subject,
                        emailDate: email.date,
                        fastmailId: email.fastmail_id
                      }))
                    );

                    if (allAttachments.length === 0) {
                      return (
                        <ActionCard theme={theme}>
                          <ActionCardHeader theme={theme}>
                            <FaPaperclip /> Attachments
                          </ActionCardHeader>
                          <ActionCardContent theme={theme} style={{ opacity: 0.6 }}>
                            No attachments in this thread
                          </ActionCardContent>
                        </ActionCard>
                      );
                    }

                    return (
                      <>
                        <div style={{
                          padding: '8px 16px',
                          fontSize: '12px',
                          color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                          borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
                        }}>
                          {allAttachments.length} attachment{allAttachments.length !== 1 ? 's' : ''} (stored in Fastmail)
                        </div>
                        {allAttachments.map((att, idx) => (
                          <ActionCard key={idx} theme={theme}>
                            <ActionCardHeader theme={theme}>
                              <FaPaperclip /> {att.name || 'Unnamed file'}
                            </ActionCardHeader>
                            <ActionCardContent theme={theme}>
                              <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                                {att.type || 'Unknown type'}
                              </div>
                              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                                {att.size ? `${(att.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                              </div>
                            </ActionCardContent>
                            <ActionCardButtons>
                              <SmallBtn
                                theme={theme}
                                onClick={() => window.open(`https://app.fastmail.com/mail/${att.fastmailId}`, '_blank')}
                              >
                                Open in Fastmail
                              </SmallBtn>
                            </ActionCardButtons>
                          </ActionCard>
                        ))}
                      </>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </ActionsPanel>
      </MainContent>

      {/* Compose Modal */}
      {composeModal.open && (
        <ModalOverlay onClick={closeCompose}>
          <ModalContent theme={theme} onClick={e => e.stopPropagation()}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>
                {composeModal.mode === 'forward' ? 'Forward' : composeModal.mode === 'replyAll' ? 'Reply All' : 'Reply'}
              </ModalTitle>
              <CloseButton theme={theme} onClick={closeCompose}>
                <FaTimes size={18} />
              </CloseButton>
            </ModalHeader>

            <ModalBody theme={theme}>
              <FormField>
                <FormLabel theme={theme}>To</FormLabel>
                <EmailBubbleContainer theme={theme} onClick={() => document.getElementById('to-input')?.focus()}>
                  {composeTo.map((recipient, idx) => (
                    <EmailBubble key={idx} theme={theme}>
                      {recipient.name || recipient.email}
                      <EmailBubbleRemove theme={theme} onClick={(e) => { e.stopPropagation(); removeEmailFromField('to', recipient.email); }}>
                        <FaTimes size={10} />
                      </EmailBubbleRemove>
                    </EmailBubble>
                  ))}
                  <EmailBubbleInput
                    id="to-input"
                    theme={theme}
                    value={composeToInput}
                    onChange={(e) => {
                      setComposeToInput(e.target.value);
                      setActiveField('to');
                      searchContacts(e.target.value);
                    }}
                    onKeyDown={(e) => handleEmailInputKeyDown(e, 'to')}
                    onFocus={() => setActiveField('to')}
                    onBlur={() => setTimeout(() => { setContactSuggestions([]); setActiveField(null); }, 200)}
                    placeholder={composeTo.length === 0 ? "Type name or email..." : ""}
                  />
                  {activeField === 'to' && contactSuggestions.length > 0 && (
                    <AutocompleteDropdown theme={theme}>
                      {contactSuggestions.map((contact) => (
                        <AutocompleteItem
                          key={`${contact.id}-${contact.email}`}
                          theme={theme}
                          onMouseDown={() => addEmailToField('to', contact)}
                        >
                          <AutocompleteAvatar theme={theme}>
                            {contact.profile_image_url ? (
                              <img src={contact.profile_image_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                            ) : (
                              `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`
                            )}
                          </AutocompleteAvatar>
                          <AutocompleteInfo>
                            <AutocompleteName theme={theme}>{contact.first_name} {contact.last_name}</AutocompleteName>
                            <AutocompleteEmail theme={theme}>{contact.email}</AutocompleteEmail>
                          </AutocompleteInfo>
                        </AutocompleteItem>
                      ))}
                    </AutocompleteDropdown>
                  )}
                </EmailBubbleContainer>
              </FormField>

              <FormField>
                <FormLabel theme={theme}>CC</FormLabel>
                <EmailBubbleContainer theme={theme} onClick={() => document.getElementById('cc-input')?.focus()}>
                  {composeCc.map((recipient, idx) => (
                    <EmailBubble key={idx} theme={theme}>
                      {recipient.name || recipient.email}
                      <EmailBubbleRemove theme={theme} onClick={(e) => { e.stopPropagation(); removeEmailFromField('cc', recipient.email); }}>
                        <FaTimes size={10} />
                      </EmailBubbleRemove>
                    </EmailBubble>
                  ))}
                  <EmailBubbleInput
                    id="cc-input"
                    theme={theme}
                    value={composeCcInput}
                    onChange={(e) => {
                      setComposeCcInput(e.target.value);
                      setActiveField('cc');
                      searchContacts(e.target.value);
                    }}
                    onKeyDown={(e) => handleEmailInputKeyDown(e, 'cc')}
                    onFocus={() => setActiveField('cc')}
                    onBlur={() => setTimeout(() => { setContactSuggestions([]); setActiveField(null); }, 200)}
                    placeholder={composeCc.length === 0 ? "Add CC (optional)..." : ""}
                  />
                  {activeField === 'cc' && contactSuggestions.length > 0 && (
                    <AutocompleteDropdown theme={theme}>
                      {contactSuggestions.map((contact) => (
                        <AutocompleteItem
                          key={`${contact.id}-${contact.email}`}
                          theme={theme}
                          onMouseDown={() => addEmailToField('cc', contact)}
                        >
                          <AutocompleteAvatar theme={theme}>
                            {contact.profile_image_url ? (
                              <img src={contact.profile_image_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                            ) : (
                              `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`
                            )}
                          </AutocompleteAvatar>
                          <AutocompleteInfo>
                            <AutocompleteName theme={theme}>{contact.first_name} {contact.last_name}</AutocompleteName>
                            <AutocompleteEmail theme={theme}>{contact.email}</AutocompleteEmail>
                          </AutocompleteInfo>
                        </AutocompleteItem>
                      ))}
                    </AutocompleteDropdown>
                  )}
                </EmailBubbleContainer>
              </FormField>

              <FormField>
                <FormLabel theme={theme}>Subject</FormLabel>
                <FormInput
                  theme={theme}
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                />
              </FormField>

              <FormField>
                <FormLabel theme={theme}>Message</FormLabel>
                <FormTextarea
                  theme={theme}
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Write your message..."
                />
              </FormField>
            </ModalBody>

            <ModalFooter theme={theme}>
              <CancelButton theme={theme} onClick={closeCompose}>
                Cancel
              </CancelButton>
              <SendButton onClick={handleSend} disabled={sending}>
                <FaPaperPlane />
                {sending ? 'Sending...' : 'Send'}
              </SendButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Quick Edit Modal */}
      <QuickEditModal
        isOpen={quickEditContactModalOpen}
        onClose={handleCloseQuickEditModal}
        contact={contactForQuickEdit}
        theme={theme}
        showMissingFieldsOnly={showMissingFieldsOnly}
        onRefresh={() => {}}
        quickEditActiveTab={quickEditActiveTab}
        setQuickEditActiveTab={setQuickEditActiveTab}
        quickEditDescriptionText={quickEditDescriptionText}
        setQuickEditDescriptionText={setQuickEditDescriptionText}
        quickEditJobRoleText={quickEditJobRoleText}
        setQuickEditJobRoleText={setQuickEditJobRoleText}
        quickEditContactCategory={quickEditContactCategory}
        setQuickEditContactCategory={setQuickEditContactCategory}
        quickEditContactScore={quickEditContactScore}
        setQuickEditContactScore={setQuickEditContactScore}
        quickEditFirstName={quickEditFirstName}
        setQuickEditFirstName={setQuickEditFirstName}
        quickEditLastName={quickEditLastName}
        setQuickEditLastName={setQuickEditLastName}
        quickEditLinkedin={quickEditLinkedin}
        setQuickEditLinkedin={setQuickEditLinkedin}
        quickEditKeepInTouchFrequency={quickEditKeepInTouchFrequency}
        setQuickEditKeepInTouchFrequency={setQuickEditKeepInTouchFrequency}
        quickEditBirthdayDay={quickEditBirthdayDay}
        setQuickEditBirthdayDay={setQuickEditBirthdayDay}
        quickEditBirthdayMonth={quickEditBirthdayMonth}
        setQuickEditBirthdayMonth={setQuickEditBirthdayMonth}
        quickEditAgeEstimate={quickEditAgeEstimate}
        setQuickEditAgeEstimate={setQuickEditAgeEstimate}
        quickEditChristmasWishes={quickEditChristmasWishes}
        setQuickEditChristmasWishes={setQuickEditChristmasWishes}
        quickEditEasterWishes={quickEditEasterWishes}
        setQuickEditEasterWishes={setQuickEditEasterWishes}
        quickEditShowMissing={quickEditShowMissing}
        setQuickEditShowMissing={setQuickEditShowMissing}
        quickEditContactEmails={quickEditContactEmails}
        setQuickEditContactEmails={setQuickEditContactEmails}
        quickEditContactMobiles={quickEditContactMobiles}
        setQuickEditContactMobiles={setQuickEditContactMobiles}
        quickEditContactCities={quickEditContactCities}
        setQuickEditContactCities={setQuickEditContactCities}
        quickEditContactTags={quickEditContactTags}
        setQuickEditContactTags={setQuickEditContactTags}
        quickEditContactCompanies={quickEditContactCompanies}
        setQuickEditContactCompanies={setQuickEditContactCompanies}
        newEmailText={newEmailText}
        setNewEmailText={setNewEmailText}
        newEmailType={newEmailType}
        setNewEmailType={setNewEmailType}
        newMobileText={newMobileText}
        setNewMobileText={setNewMobileText}
        newMobileType={newMobileType}
        setNewMobileType={setNewMobileType}
        quickEditCityModalOpen={quickEditCityModalOpen}
        setQuickEditCityModalOpen={setQuickEditCityModalOpen}
        quickEditTagModalOpen={quickEditTagModalOpen}
        setQuickEditTagModalOpen={setQuickEditTagModalOpen}
        quickEditAssociateCompanyModalOpen={quickEditAssociateCompanyModalOpen}
        setQuickEditAssociateCompanyModalOpen={setQuickEditAssociateCompanyModalOpen}
        onSave={handleSaveQuickEditContact}
        onDelete={() => {}}
        handleSilentSave={handleSilentSave}
        handleAddEmail={handleAddEmail}
        handleRemoveEmail={handleRemoveEmail}
        handleUpdateEmailType={handleUpdateEmailType}
        handleSetEmailPrimary={handleSetEmailPrimary}
        handleAddMobile={handleAddMobile}
        handleRemoveMobile={handleRemoveMobile}
        handleUpdateMobileType={handleUpdateMobileType}
        handleSetMobilePrimary={handleSetMobilePrimary}
        handleRemoveCity={handleRemoveCity}
        handleRemoveTag={handleRemoveTag}
        handleUpdateCompanyRelationship={handleUpdateCompanyRelationship}
        handleUpdateCompanyCategory={handleUpdateCompanyCategory}
        handleSaveQuickEditFrequency={handleSaveQuickEditFrequency}
        handleSaveQuickEditBirthday={handleSaveQuickEditBirthday}
        handleSaveQuickEditChristmasWishes={handleSaveQuickEditChristmasWishes}
        handleSaveQuickEditEasterWishes={handleSaveQuickEditEasterWishes}
        handleAutomation={handleAutomation}
        handleMarkCompleteWithCategory={handleMarkCompleteWithCategory}
        getVisibleTabs={getVisibleTabs}
        shouldShowField={shouldShowField}
      />
    </PageContainer>
  );
};

export default CommandCenterPage;
