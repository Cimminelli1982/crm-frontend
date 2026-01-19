import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { FaTimes, FaPaperPlane, FaPaperclip, FaRobot, FaCheck, FaImage, FaFileAlt, FaPlus, FaSearch, FaTasks, FaDollarSign, FaExchangeAlt } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import {
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  CloseButton,
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  SendButton,
  CancelButton,
  EmailBubbleContainer,
  EmailBubble,
  EmailBubbleRemove,
  EmailBubbleInput,
  AutocompleteDropdown,
  AutocompleteItem,
  AutocompleteAvatar,
  AutocompleteInfo,
  AutocompleteName,
  AutocompleteEmail,
} from '../../pages/CommandCenterPage.styles';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

// Wide modal content for 2-column layout
const WideModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  width: 95%;
  max-width: 1100px;
  height: 85vh;
  max-height: 850px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ModalBody = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
`;

const ComposeColumn = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  border-right: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  min-width: 0;
`;

const ChatColumn = styled.div`
  width: 380px;
  min-width: 380px;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const ChatHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#374151' : '#E5E7EB'};
`;

const QuickActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const QuickActionBtn = styled.button`
  padding: 6px 10px;
  border-radius: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    border-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  }
`;

const ChatMessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ChatMessageBubble = styled.div`
  max-width: 90%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;

  ${props => props.$isUser ? `
    align-self: flex-end;
    background: #3B82F6;
    color: white;
    border-bottom-right-radius: 4px;
  ` : `
    align-self: flex-start;
    background: ${props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props.theme === 'light' ? '#111827' : '#F9FAFB'};
    border: 1px solid ${props.theme === 'light' ? '#E5E7EB' : '#374151'};
    border-bottom-left-radius: 4px;
  `}
`;

const UseDraftButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: #10B981;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #059669;
  }
`;

const TypingDots = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  align-self: flex-start;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
    animation: typing 1.4s infinite ease-in-out;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }

  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
  }
`;

const ChatInputArea = styled.div`
  padding: 12px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  gap: 8px;
  align-items: flex-end;
`;

const ChatTextarea = styled.textarea`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  outline: none;
  resize: none;
  min-height: 40px;
  max-height: 100px;

  &:focus {
    border-color: #3B82F6;
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const ChatSendBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: #3B82F6;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: #2563EB;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  text-align: center;
  padding: 24px;
  gap: 12px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const FooterLeft = styled.div`
  display: flex;
  gap: 12px;
`;

const FooterRight = styled.div`
  display: flex;
  gap: 12px;
`;

const SendAIDraftButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: #10B981;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Template dropdown styles
const TemplateDropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TemplateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const TemplateDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  width: 320px;
  max-height: 350px;
  overflow-y: auto;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 100;
`;

const TemplateSearchInput = styled.input`
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: none;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: transparent;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const TemplateSearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 12px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
`;

const TemplateItem = styled.div`
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  transition: background 0.15s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TemplateName = styled.div`
  font-weight: 500;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const TemplateDescription = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 2px;
`;

const AddTemplateItem = styled.div`
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  font-size: 13px;
  font-weight: 500;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A5F'};
  }
`;

const NoTemplatesMessage = styled.div`
  padding: 16px 12px;
  text-align: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 13px;
`;

// Add Template Modal styles
const AddTemplateModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`;

const AddTemplateModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  width: 500px;
  max-width: 95vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const AddTemplateHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AddTemplateTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const AddTemplateBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
`;

const AddTemplateField = styled.div`
  margin-bottom: 16px;
`;

const AddTemplateLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin-bottom: 6px;
`;

const AddTemplateInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const AddTemplateTextarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  font-family: inherit;
  min-height: 150px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const AddTemplateFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const AddTemplateButton = styled.button`
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &.primary {
    background: #3B82F6;
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: #2563EB;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: transparent;
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
    border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};

    &:hover {
      background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    }
  }
`;

// Deals section styles
const DealsSection = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const DealsSectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DealCard = styled.div`
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DealCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const DealName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DealBadge = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  background: ${props => props.$type === 'category'
    ? (props.theme === 'light' ? '#F3F4F6' : '#374151')
    : props.$type === 'intro' ? '#FEE2E2' : '#DBEAFE'};
  color: ${props => props.$type === 'category'
    ? (props.theme === 'light' ? '#374151' : '#D1D5DB')
    : props.$type === 'intro' ? '#DC2626' : '#1D4ED8'};
`;

const DealInfo = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const StageBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;

  &.lead {
    background: #DBEAFE;
    color: #1D4ED8;
  }
  &.evaluating {
    background: #FEF3C7;
    color: #D97706;
  }
  &.closing {
    background: #E9D5FF;
    color: #7C3AED;
  }
  &.invested {
    background: #D1FAE5;
    color: #059669;
  }
  &.monitoring {
    background: #CFFAFE;
    color: #0891B2;
  }
  &.passed {
    background: #FEE2E2;
    color: #DC2626;
  }
`;

const DealAmount = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #10B981;
  margin-top: 4px;
`;

const DealActionsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const DealActionBtn = styled.button`
  flex: 1;
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &.invested {
    background: #D1FAE5;
    color: #059669;
    &:hover {
      background: #A7F3D0;
    }
  }

  &.passed {
    background: #FEE2E2;
    color: #DC2626;
    &:hover {
      background: #FECACA;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Tasks section styles (similar to deals)
const TasksSection = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const TasksSectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TaskCard = styled.div`
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TaskCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
`;

const TaskContent = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  flex: 1;
  line-height: 1.4;
`;

const TaskMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
`;

const TaskDueBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  background: ${props => props.$overdue
    ? '#FEE2E2'
    : (props.theme === 'light' ? '#F3F4F6' : '#374151')};
  color: ${props => props.$overdue
    ? '#DC2626'
    : (props.theme === 'light' ? '#374151' : '#D1D5DB')};
`;

const TaskProjectBadge = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A5F'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
`;

const TaskCompleteBtn = styled.button`
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  background: #D1FAE5;
  color: #059669;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #A7F3D0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Helper to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const ComposeEmailModal = ({
  theme,
  composeModal,
  closeCompose,
  // To field
  composeTo,
  composeToInput,
  setComposeToInput,
  // Cc field
  composeCc,
  composeCcInput,
  setComposeCcInput,
  // Subject and Body
  composeSubject,
  setComposeSubject,
  composeBody,
  setComposeBody,
  // Autocomplete
  contactSuggestions,
  activeField,
  setActiveField,
  searchContacts,
  addEmailToField,
  removeEmailFromField,
  handleEmailInputKeyDown,
  // Attachments
  composeAttachments,
  composeFileInputRef,
  handleComposeFileSelect,
  removeComposeAttachment,
  // Send
  sending,
  handleSend,
  // Swap To <-> CC
  swapToCc,
  // Chat props for AI assistant
  chatMessages = [],
  chatInput = '',
  setChatInput = () => {},
  chatLoading = false,
  sendMessageToClaude = () => {},
  extractDraftFromMessage = () => null,
  // Deals props
  contactDeals = [],
  onUpdateDealStage = async () => {},
  // Tasks props
  contactTasks = [],
  onCompleteTask = async () => {},
  // Task modal
  setTaskModalOpen = () => {},
  // Create Deal AI modal
  setCreateDealAIOpen = () => {},
  setCreateDealModalOpen = () => {},
}) => {
  const chatMessagesRef = useRef(null);
  const hasAutoGeneratedRef = useRef(false);
  const waitingForProofreadRef = useRef(false);
  const lastMessageCountRef = useRef(0);

  // Track which deals are being updated
  const [updatingDeals, setUpdatingDeals] = useState({});
  // Track which tasks are being completed
  const [completingTasks, setCompletingTasks] = useState({});

  // Status checkbox state (mutually exclusive: null, 'need_actions', 'waiting_input')
  // Using both state (for visual) and ref (for reliable access in callbacks)
  const [sendWithStatus, setSendWithStatus] = useState(null);
  const sendWithStatusRef = useRef(null);

  // Helper to update both state and ref synchronously
  const updateSendWithStatus = useCallback((newValue) => {
    sendWithStatusRef.current = newValue;
    setSendWithStatus(newValue);
  }, []);

  // Template state
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [addTemplateModalOpen, setAddTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const templateDropdownRef = useRef(null);

  // Task association modal state
  const [taskAssociateModalOpen, setTaskAssociateModalOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTaskToAssociate, setSelectedTaskToAssociate] = useState(null);
  const [associatingTask, setAssociatingTask] = useState(false);
  const [createTaskMode, setCreateTaskMode] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskDueString, setNewTaskDueString] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // Fetch templates from Supabase
  const fetchTemplates = useCallback(async (searchTerm = '') => {
    setTemplatesLoading(true);
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .order('name');

      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    }
    setTemplatesLoading(false);
  }, []);

  // Search templates with debounce
  useEffect(() => {
    if (templateDropdownOpen) {
      const debounce = setTimeout(() => {
        fetchTemplates(templateSearch);
      }, 200);
      return () => clearTimeout(debounce);
    }
  }, [templateSearch, templateDropdownOpen, fetchTemplates]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target)) {
        setTemplateDropdownOpen(false);
      }
    };

    if (templateDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [templateDropdownOpen]);

  // Apply template to body
  const applyTemplate = (template) => {
    const signatureSeparator = '─'.repeat(40);
    const parts = composeBody.split(signatureSeparator);

    if (parts.length > 1) {
      // Keep quoted text, replace reply part
      setComposeBody(template.template_text + '\n\n' + signatureSeparator + parts.slice(1).join(signatureSeparator));
    } else {
      setComposeBody(template.template_text);
    }

    setTemplateDropdownOpen(false);
    setTemplateSearch('');
    toast.success(`Template "${template.name}" applied`);
  };

  // Save new template
  const handleSaveNewTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateText.trim()) {
      toast.error('Name and text are required');
      return;
    }

    setSavingTemplate(true);
    try {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          name: newTemplateName.trim(),
          short_description: newTemplateDescription.trim() || null,
          template_text: newTemplateText.trim()
        });

      if (error) throw error;

      toast.success('Template saved!');
      setAddTemplateModalOpen(false);
      setNewTemplateName('');
      setNewTemplateDescription('');
      setNewTemplateText('');
      fetchTemplates(templateSearch);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
    setSavingTemplate(false);
  };

  // Open add template modal with current body as text
  const openAddTemplateModal = () => {
    const signatureSeparator = '─'.repeat(40);
    const draftPart = composeBody.split(signatureSeparator)[0].trim();
    setNewTemplateText(draftPart || '');
    setAddTemplateModalOpen(true);
    setTemplateDropdownOpen(false);
  };

  // === Task Association Modal Functions ===

  // Get contact IDs from composeTo
  const getToContactIds = useCallback(() => {
    return composeTo
      .filter(recipient => recipient.contact_id)
      .map(recipient => recipient.contact_id);
  }, [composeTo]);

  // Fetch available tasks (open tasks, excluding Birthdays)
  const fetchAvailableTasks = useCallback(async (searchTerm = '') => {
    setTasksLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select('task_id, content, description, due_date, due_string, priority, todoist_project_name, todoist_id')
        .eq('status', 'open')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (searchTerm.trim()) {
        query = query.or(`content.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Filter out Birthdays tasks
      const filtered = (data || []).filter(t => !t.todoist_project_name?.includes('Birthdays'));
      setAvailableTasks(filtered);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    }
    setTasksLoading(false);
  }, []);

  // Search tasks with debounce
  useEffect(() => {
    if (taskAssociateModalOpen) {
      const debounce = setTimeout(() => {
        fetchAvailableTasks(taskSearch);
      }, 200);
      return () => clearTimeout(debounce);
    }
  }, [taskSearch, taskAssociateModalOpen, fetchAvailableTasks]);

  // Open task association modal
  const openTaskAssociateModal = () => {
    setTaskAssociateModalOpen(true);
    setTaskSearch('');
    setSelectedTaskToAssociate(null);
    setCreateTaskMode(false);
    setNewTaskContent('');
    setNewTaskDueString('');
    fetchAvailableTasks();
  };

  // Associate selected task with TO contacts
  const handleAssociateTaskWithContacts = async () => {
    if (!selectedTaskToAssociate) {
      toast.error('Please select a task');
      return;
    }

    const contactIds = getToContactIds();
    if (contactIds.length === 0) {
      toast.error('No contacts with CRM records in TO field');
      return;
    }

    setAssociatingTask(true);
    try {
      // Get existing links
      const { data: existingLinks } = await supabase
        .from('task_contacts')
        .select('contact_id')
        .eq('task_id', selectedTaskToAssociate.task_id);

      const existingContactIds = existingLinks?.map(l => l.contact_id) || [];

      // Only insert new links
      const newContactIds = contactIds.filter(id => !existingContactIds.includes(id));

      if (newContactIds.length === 0) {
        toast.success('Contacts already linked to this task');
        setTaskAssociateModalOpen(false);
        return;
      }

      const links = newContactIds.map(contactId => ({
        task_id: selectedTaskToAssociate.task_id,
        contact_id: contactId
      }));

      const { error } = await supabase
        .from('task_contacts')
        .insert(links);

      if (error) throw error;

      toast.success(`${newContactIds.length} contact(s) linked to task`);
      setTaskAssociateModalOpen(false);
    } catch (error) {
      console.error('Error associating task:', error);
      toast.error('Failed to associate task');
    }
    setAssociatingTask(false);
  };

  // Create new task and associate with TO contacts
  const handleCreateAndAssociateTask = async () => {
    if (!newTaskContent.trim()) {
      toast.error('Task content is required');
      return;
    }

    const contactIds = getToContactIds();
    if (contactIds.length === 0) {
      toast.error('No contacts with CRM records in TO field');
      return;
    }

    setCreatingTask(true);
    try {
      // 1. Create in Todoist FIRST
      const todoistPayload = {
        content: newTaskContent.trim(),
        due_string: newTaskDueString || undefined,
        priority: 1,
      };

      const todoistResponse = await fetch(`${BACKEND_URL}/todoist/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoistPayload),
      });

      if (!todoistResponse.ok) {
        const errText = await todoistResponse.text();
        console.error('Todoist create failed:', errText);
        toast.error('Failed to create in Todoist');
        setCreatingTask(false);
        return; // Don't create orphan task in Supabase
      }

      const todoistTask = await todoistResponse.json();
      const todoistId = todoistTask.task?.id || todoistTask.id;
      const todoistUrl = todoistTask.task?.url || todoistTask.url;
      const todoistProjectId = todoistTask.task?.project_id || todoistTask.project_id;

      // 2. Then create in Supabase with todoist_id
      const taskData = {
        content: newTaskContent.trim(),
        due_string: newTaskDueString || null,
        status: 'open',
        priority: 1,
        todoist_id: todoistId,
        todoist_url: todoistUrl,
        todoist_project_id: todoistProjectId,
        created_at: new Date().toISOString()
      };

      // Parse due_string to due_date if it looks like a date
      if (newTaskDueString) {
        const dateMatch = newTaskDueString.match(/^\d{4}-\d{2}-\d{2}$/);
        if (dateMatch) {
          taskData.due_date = newTaskDueString;
        }
      }

      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (taskError) throw taskError;

      // Link to contacts
      const links = contactIds.map(contactId => ({
        task_id: newTask.task_id,
        contact_id: contactId
      }));

      const { error: linkError } = await supabase
        .from('task_contacts')
        .insert(links);

      if (linkError) throw linkError;

      toast.success(`Task created and linked to ${contactIds.length} contact(s)`);
      setTaskAssociateModalOpen(false);
      setCreateTaskMode(false);
      setNewTaskContent('');
      setNewTaskDueString('');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
    setCreatingTask(false);
  };

  // Get priority color
  const getPriorityColor = (p) => {
    switch (p) {
      case 4: return '#dc3545';
      case 3: return '#fd7e14';
      case 2: return '#ffc107';
      default: return '#6c757d';
    }
  };

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Reset auto-generated flag when modal closes (no auto-draft on open)
  useEffect(() => {
    if (!composeModal.open) {
      hasAutoGeneratedRef.current = false;
    }
  }, [composeModal.open]);

  // Auto-apply proofread result when it arrives
  useEffect(() => {
    if (waitingForProofreadRef.current && chatMessages.length > lastMessageCountRef.current) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage?.role === 'assistant') {
        const draftText = extractDraftFromMessage(lastMessage.content);
        if (draftText) {
          // Apply the proofread result to the compose body
          const signatureSeparator = '─'.repeat(40);
          const parts = composeBody.split(signatureSeparator);

          let finalBody;
          if (parts.length > 1) {
            finalBody = draftText + '\n\n' + signatureSeparator + parts.slice(1).join(signatureSeparator);
          } else {
            finalBody = draftText;
          }
          setComposeBody(finalBody);
          waitingForProofreadRef.current = false;
        }
      }
    }
  }, [chatMessages, composeBody, extractDraftFromMessage, setComposeBody]);

  if (!composeModal.open) return null;

  // Extract draft from AI message and insert into compose body
  const handleUseDraft = (draftText) => {
    // Get the part before the signature separator (if any)
    const signatureSeparator = '─'.repeat(40);
    const parts = composeBody.split(signatureSeparator);

    if (parts.length > 1) {
      // Keep the quoted text, replace the reply part with draft
      setComposeBody(draftText + '\n\n' + signatureSeparator + parts.slice(1).join(signatureSeparator));
    } else {
      // No quoted text, just set the draft
      setComposeBody(draftText);
    }
  };

  // Enhanced send that includes current draft context
  const sendWithDraftContext = (message, options = {}) => {
    // Prepend draft context if there's text in the compose body
    const draftPart = composeBody.split('─'.repeat(40))[0].trim();
    const contextPrefix = draftPart
      ? `[MY CURRENT DRAFT]\n${draftPart}\n[END DRAFT]\n\n`
      : '';

    const enhancedMessage = contextPrefix + message;
    sendMessageToClaude(enhancedMessage, options);
  };

  // Quick action handlers
  const handleQuickAction = (prompt) => {
    sendWithDraftContext(prompt, { hideUserMessage: true });
  };

  // Proofread handler - sends current draft for polishing
  const handleProofread = () => {
    const draftPart = composeBody.split('─'.repeat(40))[0].trim();
    if (!draftPart) {
      return; // No draft to proofread
    }
    waitingForProofreadRef.current = true;
    lastMessageCountRef.current = chatMessages.length;
    const proofreadPrompt = `Proofread and polish my draft below. Fix any grammar, spelling, or awkward phrasing. Keep the same tone and intent. Make it sound natural and professional but not stiff. Return ONLY the improved version wrapped in --- markers, nothing else.

My draft:
${draftPart}`;
    sendMessageToClaude(proofreadPrompt, { hideUserMessage: true });
  };

  // Check if there's draft content to proofread
  const hasDraftContent = () => {
    const draftPart = composeBody.split('─'.repeat(40))[0].trim();
    return draftPart.length > 0;
  };

  // Get the last AI draft from chat messages
  const getLastAIDraft = () => {
    const assistantMessages = chatMessages.filter(msg => msg.role === 'assistant');
    for (let i = assistantMessages.length - 1; i >= 0; i--) {
      const draftText = extractDraftFromMessage(assistantMessages[i].content);
      if (draftText) return draftText;
    }
    return null;
  };

  // Send with AI draft - applies the last draft and sends directly
  const handleSendAIDraft = () => {
    const draftText = getLastAIDraft();
    if (!draftText) return;

    // Apply the draft to the body
    const signatureSeparator = '─'.repeat(40);
    const parts = composeBody.split(signatureSeparator);

    let finalBody;
    if (parts.length > 1) {
      // Keep the quoted text, replace the reply part with draft
      finalBody = draftText + '\n\n' + signatureSeparator + parts.slice(1).join(signatureSeparator);
    } else {
      finalBody = draftText;
    }

    // Send directly with the body override
    handleSend(finalBody);
  };

  const hasAIDraft = getLastAIDraft() !== null;

  return (
    <ModalOverlay onClick={closeCompose}>
      <WideModalContent theme={theme} onClick={e => e.stopPropagation()}>
        <ModalHeader theme={theme}>
          <ModalTitle theme={theme}>
            {composeModal.mode === 'new' ? 'New Email' : composeModal.mode === 'forward' ? 'Forward' : composeModal.mode === 'replyAll' ? 'Reply All' : 'Reply'}
          </ModalTitle>
          <CloseButton theme={theme} onClick={closeCompose}>
            <FaTimes size={18} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {/* Left Column - Compose Form */}
          <ComposeColumn theme={theme}>
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
                  onBlur={() => setTimeout(() => { setActiveField(null); }, 200)}
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

            {/* Swap To <-> CC button */}
            {swapToCc && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '-8px 0' }}>
                <button
                  type="button"
                  onClick={swapToCc}
                  title="Swap To ↔ CC"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    background: theme === 'light' ? '#F3F4F6' : '#374151',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '12px',
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                    cursor: 'pointer',
                    fontSize: '11px',
                    transition: 'all 0.15s',
                  }}
                >
                  <FaExchangeAlt size={10} style={{ transform: 'rotate(90deg)' }} />
                  Swap
                </button>
              </div>
            )}

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
                  onBlur={() => setTimeout(() => { setActiveField(null); }, 200)}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <FormLabel theme={theme} style={{ marginBottom: 0 }}>Message</FormLabel>
                <button
                  onClick={handleProofread}
                  disabled={chatLoading || !hasDraftContent()}
                  title="Proofread draft"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: theme === 'light' ? '#8B5CF6' : '#7C3AED',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: chatLoading || !hasDraftContent() ? 'not-allowed' : 'pointer',
                    opacity: chatLoading || !hasDraftContent() ? 0.5 : 1,
                  }}
                >
                  {chatLoading ? '...' : 'Proofread'}
                </button>
              </div>
              <FormTextarea
                theme={theme}
                value={composeBody}
                onChange={e => setComposeBody(e.target.value)}
                placeholder="Write your message..."
                style={{ minHeight: '270px', flex: 1 }}
              />
            </FormField>

            {/* Attachments Section */}
            <FormField>
              <input
                type="file"
                multiple
                ref={composeFileInputRef}
                onChange={handleComposeFileSelect}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: composeAttachments.length > 0 ? '8px' : 0 }}>
                <button
                  type="button"
                  onClick={() => composeFileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: theme === 'light' ? '#F3F4F6' : '#374151',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    color: theme === 'light' ? '#374151' : '#D1D5DB',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <FaPaperclip size={12} />
                  Attach Files
                </button>

                {/* Template Dropdown */}
                <TemplateDropdownContainer ref={templateDropdownRef}>
                  <TemplateButton
                    theme={theme}
                    type="button"
                    onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                  >
                    <FaFileAlt size={12} />
                    Templates
                  </TemplateButton>

                  {templateDropdownOpen && (
                    <TemplateDropdown theme={theme}>
                      <div style={{ position: 'relative' }}>
                        <TemplateSearchIcon theme={theme}>
                          <FaSearch size={12} />
                        </TemplateSearchIcon>
                        <TemplateSearchInput
                          theme={theme}
                          placeholder="Search templates..."
                          value={templateSearch}
                          onChange={(e) => setTemplateSearch(e.target.value)}
                          autoFocus
                        />
                      </div>

                      {templatesLoading ? (
                        <NoTemplatesMessage theme={theme}>Loading...</NoTemplatesMessage>
                      ) : templates.length === 0 ? (
                        <NoTemplatesMessage theme={theme}>
                          {templateSearch ? 'No templates found' : 'No templates yet'}
                        </NoTemplatesMessage>
                      ) : (
                        templates.map((template) => (
                          <TemplateItem
                            key={template.template_id}
                            theme={theme}
                            onClick={() => applyTemplate(template)}
                          >
                            <TemplateName theme={theme}>{template.name}</TemplateName>
                            {template.short_description && (
                              <TemplateDescription theme={theme}>
                                {template.short_description}
                              </TemplateDescription>
                            )}
                          </TemplateItem>
                        ))
                      )}

                      <AddTemplateItem theme={theme} onClick={openAddTemplateModal}>
                        <FaPlus size={10} />
                        Add New Template
                      </AddTemplateItem>
                    </TemplateDropdown>
                  )}
                </TemplateDropdownContainer>

                {/* Tasks Button */}
                <button
                  type="button"
                  onClick={openTaskAssociateModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: theme === 'light' ? '#F3F4F6' : '#374151',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    color: theme === 'light' ? '#374151' : '#D1D5DB',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.15s',
                  }}
                >
                  <FaTasks size={12} />
                  Tasks
                </button>

                {/* New Deal Button */}
                <button
                  type="button"
                  onClick={() => setCreateDealModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: theme === 'light' ? '#F3F4F6' : '#374151',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    color: theme === 'light' ? '#374151' : '#D1D5DB',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.15s',
                  }}
                >
                  <FaDollarSign size={12} />
                  New Deal
                </button>

                {composeAttachments.length > 0 && (
                  <span style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    {composeAttachments.length} file{composeAttachments.length > 1 ? 's' : ''} attached
                  </span>
                )}
              </div>
              {composeAttachments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {composeAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        background: theme === 'light' ? '#EFF6FF' : '#1E3A5F',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    >
                      <FaPaperclip size={10} style={{ color: theme === 'light' ? '#3B82F6' : '#60A5FA' }} />
                      <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {att.name}
                      </span>
                      <span style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                        ({formatFileSize(att.size)})
                      </span>
                      <button
                        type="button"
                        onClick={() => removeComposeAttachment(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                        }}
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Related Active Deals Section */}
              {contactDeals.length > 0 && (() => {
                // Filter for active deals (not completed/dead stages like Invested, Passed, Monitoring)
                const activeStages = ['Lead', 'Evaluating', 'Closing'];
                const activeDeals = contactDeals.filter(deal =>
                  !deal.stage || activeStages.includes(deal.stage)
                );

                if (activeDeals.length === 0) return null;

                return (
                  <DealsSection theme={theme}>
                    <DealsSectionTitle theme={theme}>
                      <FaDollarSign size={12} style={{ color: '#10B981' }} />
                      Related Active Deals ({activeDeals.length})
                    </DealsSectionTitle>
                    {activeDeals.map(deal => (
                      <DealCard key={deal.deal_id} theme={theme}>
                        <DealCardHeader>
                          <DealName theme={theme}>
                            <FaDollarSign size={11} style={{ color: '#10B981' }} />
                            {deal.opportunity || 'Untitled Deal'}
                          </DealName>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {deal.category && (
                              <DealBadge theme={theme} $type="category">{deal.category}</DealBadge>
                            )}
                            {deal.source_category && (
                              <DealBadge theme={theme} $type={deal.source_category === 'Introduction' ? 'intro' : 'cold'}>
                                {deal.source_category === 'Introduction' ? 'Intro' : 'Cold'}
                              </DealBadge>
                            )}
                          </div>
                        </DealCardHeader>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <StageBadge className={deal.stage?.toLowerCase() || 'lead'}>
                            {deal.stage || 'Lead'}
                          </StageBadge>
                          {(deal.proposed_at || deal.created_at) && (
                            <DealInfo theme={theme}>
                              {new Date(deal.proposed_at || deal.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </DealInfo>
                          )}
                        </div>
                        {deal.total_investment && (
                          <DealAmount>
                            {deal.deal_currency === 'EUR' ? '€' : deal.deal_currency === 'GBP' ? '£' : deal.deal_currency === 'PLN' ? 'zł' : '$'}
                            {deal.total_investment.toLocaleString()}
                          </DealAmount>
                        )}
                        <DealActionsRow>
                          <DealActionBtn
                            className="invested"
                            disabled={updatingDeals[deal.deal_id]}
                            onClick={async () => {
                              setUpdatingDeals(prev => ({ ...prev, [deal.deal_id]: true }));
                              await onUpdateDealStage(deal.deal_id, 'Invested');
                              setUpdatingDeals(prev => ({ ...prev, [deal.deal_id]: false }));
                            }}
                          >
                            {updatingDeals[deal.deal_id] ? '...' : '✓ Invested'}
                          </DealActionBtn>
                          <DealActionBtn
                            className="passed"
                            disabled={updatingDeals[deal.deal_id]}
                            onClick={async () => {
                              setUpdatingDeals(prev => ({ ...prev, [deal.deal_id]: true }));
                              await onUpdateDealStage(deal.deal_id, 'Passed');
                              setUpdatingDeals(prev => ({ ...prev, [deal.deal_id]: false }));
                            }}
                          >
                            {updatingDeals[deal.deal_id] ? '...' : '✗ Passed'}
                          </DealActionBtn>
                        </DealActionsRow>
                      </DealCard>
                    ))}
                  </DealsSection>
                );
              })()}

              {/* Related Open Tasks Section */}
              {contactTasks.length > 0 && (
                <TasksSection theme={theme}>
                  <TasksSectionTitle theme={theme}>
                    <FaTasks size={12} style={{ color: '#3B82F6' }} />
                    Related Open Tasks ({contactTasks.length})
                  </TasksSectionTitle>
                  {contactTasks.map(task => {
                    // Check if task is overdue
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                    // Format due date
                    const formatDueDate = (dateStr) => {
                      if (!dateStr) return null;
                      const date = new Date(dateStr);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const taskDate = new Date(date);
                      taskDate.setHours(0, 0, 0, 0);

                      if (taskDate.getTime() === today.getTime()) return 'Today';
                      if (taskDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
                      return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
                    };

                    return (
                      <TaskCard key={task.task_id} theme={theme}>
                        <TaskCardHeader>
                          <TaskContent theme={theme}>
                            {task.content}
                          </TaskContent>
                          <TaskCompleteBtn
                            disabled={completingTasks[task.task_id]}
                            onClick={async () => {
                              setCompletingTasks(prev => ({ ...prev, [task.task_id]: true }));
                              await onCompleteTask(task.task_id, task.todoist_id);
                              setCompletingTasks(prev => ({ ...prev, [task.task_id]: false }));
                            }}
                          >
                            {completingTasks[task.task_id] ? '...' : 'Mark as Done'}
                          </TaskCompleteBtn>
                        </TaskCardHeader>
                        <TaskMeta>
                          {(task.due_date || task.due_string) && (
                            <TaskDueBadge theme={theme} $overdue={isOverdue}>
                              {task.due_string || formatDueDate(task.due_date)}
                            </TaskDueBadge>
                          )}
                          {task.todoist_project_name && (
                            <TaskProjectBadge theme={theme}>
                              {task.todoist_project_name}
                            </TaskProjectBadge>
                          )}
                        </TaskMeta>
                      </TaskCard>
                    );
                  })}
                </TasksSection>
              )}
            </FormField>
          </ComposeColumn>

          {/* Right Column - AI Chat Assistant */}
          <ChatColumn theme={theme}>
            <ChatHeader theme={theme}>
              <FaRobot size={16} />
              AI Assistant
            </ChatHeader>

            {/* Quick Actions */}
            <QuickActionsRow theme={theme}>
              <QuickActionBtn theme={theme} onClick={() => sendMessageToClaude('TL;DR this email', { hideUserMessage: true, mode: 'tldr' })}>
                📋 TL;DR
              </QuickActionBtn>
              <QuickActionBtn theme={theme} onClick={() => sendMessageToClaude('Draft a YES response', { hideUserMessage: true, mode: 'yes' })}>
                👍 Yes
              </QuickActionBtn>
              <QuickActionBtn theme={theme} onClick={() => sendMessageToClaude('Draft a NO response', { hideUserMessage: true, mode: 'no' })}>
                👎 No
              </QuickActionBtn>
              <QuickActionBtn theme={theme} onClick={() => sendWithDraftContext('Make this shorter', { hideUserMessage: true, mode: 'shorter' })}>
                Shorter
              </QuickActionBtn>
            </QuickActionsRow>

            {/* Chat Messages */}
            <ChatMessagesArea ref={chatMessagesRef} theme={theme}>
              {chatMessages.length === 0 ? (
                <EmptyChat theme={theme}>
                  <FaRobot size={28} style={{ opacity: 0.5 }} />
                  <div style={{ fontSize: '14px' }}>Ask me to help with your reply</div>
                  <div style={{ fontSize: '12px' }}>Use the quick actions above or type below</div>
                </EmptyChat>
              ) : (
                chatMessages
                  .filter(msg => msg.role === 'assistant')
                  .map((msg, idx) => {
                    const draftText = extractDraftFromMessage(msg.content);

                    // If there's a draft, show it with "Use this draft" button
                    if (draftText) {
                      // Strip signature for display (keeps it when using draft)
                      const signaturePattern = /\n--\n[\s\S]*$/;
                      const displayText = draftText.replace(signaturePattern, '').trim();
                      return (
                        <ChatMessageBubble key={idx} theme={theme} $isUser={false}>
                          {displayText}
                          <UseDraftButton onClick={() => handleUseDraft(draftText)}>
                            <FaCheck size={10} /> Use this draft
                          </UseDraftButton>
                        </ChatMessageBubble>
                      );
                    }

                    // No draft (e.g., TL;DR summary) - show the full message without button
                    return (
                      <ChatMessageBubble key={idx} theme={theme} $isUser={false}>
                        {msg.content}
                      </ChatMessageBubble>
                    );
                  })
              )}
              {chatLoading && (
                <TypingDots theme={theme}>
                  <span></span>
                  <span></span>
                  <span></span>
                </TypingDots>
              )}
            </ChatMessagesArea>

            {/* Chat Input */}
            <ChatInputArea theme={theme}>
              <ChatTextarea
                theme={theme}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !chatLoading) {
                    e.preventDefault();
                    if (chatInput.trim()) {
                      sendWithDraftContext(chatInput, { hideUserMessage: true });
                    }
                  }
                }}
                placeholder="Ask for help drafting..."
                rows={1}
              />
              <ChatSendBtn
                onClick={() => chatInput.trim() && sendWithDraftContext(chatInput, { hideUserMessage: true })}
                disabled={chatLoading || !chatInput.trim()}
              >
                <FaPaperPlane size={14} />
              </ChatSendBtn>
            </ChatInputArea>
          </ChatColumn>
        </ModalBody>

        <ModalFooter theme={theme}>
          <SendAIDraftButton
            onClick={handleSendAIDraft}
            disabled={sending || chatLoading || !hasAIDraft}
            title={!hasAIDraft ? 'Wait for AI suggestion' : 'Send email with AI draft'}
          >
            <FaRobot size={14} />
            {sending ? 'Sending...' : 'Send AI Draft'}
          </SendAIDraftButton>
          <CancelButton theme={theme} onClick={closeCompose}>
            Cancel
          </CancelButton>

          {/* Status checkboxes - mutually exclusive */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={() => updateSendWithStatus(sendWithStatus === 'need_actions' ? null : 'need_actions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `2px solid ${sendWithStatus === 'need_actions' ? '#D97706' : (theme === 'light' ? '#E5E7EB' : '#374151')}`,
                background: sendWithStatus === 'need_actions' ? '#FEF3C7' : 'transparent',
                color: sendWithStatus === 'need_actions' ? '#D97706' : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
              title="Keep in inbox with 'Need Actions' status after sending"
            >
              ❗
            </button>
            <button
              type="button"
              onClick={() => updateSendWithStatus(sendWithStatus === 'waiting_input' ? null : 'waiting_input')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `2px solid ${sendWithStatus === 'waiting_input' ? '#2563EB' : (theme === 'light' ? '#E5E7EB' : '#374151')}`,
                background: sendWithStatus === 'waiting_input' ? '#DBEAFE' : 'transparent',
                color: sendWithStatus === 'waiting_input' ? '#2563EB' : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
              title="Keep in inbox with 'Waiting Input' status after sending"
            >
              👀
            </button>
          </div>

          <SendButton onClick={() => handleSend(null, sendWithStatusRef.current)} disabled={sending}>
            <FaPaperPlane />
            {sending ? 'Sending...' : 'Send'}
          </SendButton>
        </ModalFooter>
      </WideModalContent>

      {/* Add Template Modal */}
      {addTemplateModalOpen && (
        <AddTemplateModalOverlay onClick={() => setAddTemplateModalOpen(false)}>
          <AddTemplateModalContent theme={theme} onClick={e => e.stopPropagation()}>
            <AddTemplateHeader theme={theme}>
              <AddTemplateTitle theme={theme}>Add New Template</AddTemplateTitle>
              <CloseButton theme={theme} onClick={() => setAddTemplateModalOpen(false)}>
                <FaTimes size={16} />
              </CloseButton>
            </AddTemplateHeader>

            <AddTemplateBody>
              <AddTemplateField>
                <AddTemplateLabel theme={theme}>Template Name *</AddTemplateLabel>
                <AddTemplateInput
                  theme={theme}
                  placeholder="e.g., Intro Request, Follow Up..."
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
              </AddTemplateField>

              <AddTemplateField>
                <AddTemplateLabel theme={theme}>Short Description</AddTemplateLabel>
                <AddTemplateInput
                  theme={theme}
                  placeholder="Brief description of when to use this template"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                />
              </AddTemplateField>

              <AddTemplateField>
                <AddTemplateLabel theme={theme}>Template Text *</AddTemplateLabel>
                <AddTemplateTextarea
                  theme={theme}
                  placeholder="The email template text..."
                  value={newTemplateText}
                  onChange={(e) => setNewTemplateText(e.target.value)}
                />
              </AddTemplateField>
            </AddTemplateBody>

            <AddTemplateFooter theme={theme}>
              <AddTemplateButton
                className="secondary"
                theme={theme}
                onClick={() => setAddTemplateModalOpen(false)}
              >
                Cancel
              </AddTemplateButton>
              <AddTemplateButton
                className="primary"
                theme={theme}
                onClick={handleSaveNewTemplate}
                disabled={savingTemplate || !newTemplateName.trim() || !newTemplateText.trim()}
              >
                {savingTemplate ? 'Saving...' : 'Save Template'}
              </AddTemplateButton>
            </AddTemplateFooter>
          </AddTemplateModalContent>
        </AddTemplateModalOverlay>
      )}

      {/* Task Association Modal */}
      {taskAssociateModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
          onClick={() => setTaskAssociateModalOpen(false)}
        >
          <div
            style={{
              background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              borderRadius: '12px',
              width: '550px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  }}>
                    {createTaskMode ? 'Create New Task' : 'Link Task to Contacts'}
                  </h3>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  }}>
                    {createTaskMode
                      ? `Task will be linked to: ${composeTo.map(r => r.name || r.email).join(', ')}`
                      : `Select a task to link with: ${composeTo.map(r => r.name || r.email).join(', ')}`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setTaskAssociateModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  ×
                </button>
              </div>

              {!createTaskMode && (
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Search tasks..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#FFFFFF',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>

            {/* Modal Body */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '12px 20px',
              minHeight: '200px',
              maxHeight: '400px',
            }}>
              {createTaskMode ? (
                /* Create Task Form */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      marginBottom: '6px',
                    }}>
                      Task Content *
                    </label>
                    <input
                      type="text"
                      value={newTaskContent}
                      onChange={(e) => setNewTaskContent(e.target.value)}
                      placeholder="What needs to be done?"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        background: theme === 'dark' ? '#374151' : '#FFFFFF',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      marginBottom: '6px',
                    }}>
                      Due Date
                    </label>
                    <input
                      type="text"
                      value={newTaskDueString}
                      onChange={(e) => setNewTaskDueString(e.target.value)}
                      placeholder="e.g., tomorrow, next monday, 2024-12-31"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        background: theme === 'dark' ? '#374151' : '#FFFFFF',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {['today', 'tomorrow', 'friday', 'next week'].map(date => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setNewTaskDueString(date)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: `1px solid ${newTaskDueString === date ? '#3B82F6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                            background: newTaskDueString === date
                              ? (theme === 'dark' ? '#1E3A5F' : '#DBEAFE')
                              : (theme === 'dark' ? '#374151' : '#F9FAFB'),
                            color: newTaskDueString === date
                              ? '#3B82F6'
                              : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                            fontSize: '11px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          {date}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : tasksLoading ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                }}>
                  Loading tasks...
                </div>
              ) : availableTasks.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                }}>
                  {taskSearch ? `No tasks match "${taskSearch}"` : 'No open tasks available'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableTasks.map(task => (
                    <div
                      key={task.task_id}
                      onClick={() => setSelectedTaskToAssociate(task)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: `2px solid ${selectedTaskToAssociate?.task_id === task.task_id ? '#10B981' : (theme === 'dark' ? '#374151' : '#E5E7EB')}`,
                        background: selectedTaskToAssociate?.task_id === task.task_id
                          ? (theme === 'dark' ? '#064E3B' : '#D1FAE5')
                          : (theme === 'dark' ? '#374151' : '#F9FAFB'),
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        fontWeight: 500,
                        fontSize: '13px',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      }}>
                        {task.content}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '6px',
                        flexWrap: 'wrap',
                      }}>
                        {task.due_string && (
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: task.due_date && new Date(task.due_date) < new Date()
                              ? '#FEE2E2'
                              : (theme === 'dark' ? '#1F2937' : '#E5E7EB'),
                            color: task.due_date && new Date(task.due_date) < new Date()
                              ? '#DC2626'
                              : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                          }}>
                            {task.due_string}
                          </span>
                        )}
                        {task.todoist_project_name && (
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: theme === 'dark' ? '#1F2937' : '#E5E7EB',
                            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                          }}>
                            {task.todoist_project_name}
                          </span>
                        )}
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: `${getPriorityColor(task.priority)}20`,
                          color: getPriorityColor(task.priority),
                        }}>
                          P{task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                {!createTaskMode && (
                  <button
                    onClick={() => setCreateTaskMode(true)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: 'transparent',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <FaPlus size={10} />
                    Create New Task
                  </button>
                )}
                {createTaskMode && (
                  <button
                    onClick={() => setCreateTaskMode(false)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: 'transparent',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    ← Back to Search
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setTaskAssociateModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: 'transparent',
                    color: theme === 'dark' ? '#D1D5DB' : '#374151',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                {createTaskMode ? (
                  <button
                    onClick={handleCreateAndAssociateTask}
                    disabled={creatingTask || !newTaskContent.trim()}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: (creatingTask || !newTaskContent.trim()) ? (theme === 'dark' ? '#374151' : '#E5E7EB') : '#10B981',
                      color: (creatingTask || !newTaskContent.trim()) ? (theme === 'dark' ? '#6B7280' : '#9CA3AF') : '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: (creatingTask || !newTaskContent.trim()) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {creatingTask ? 'Creating...' : 'Create & Link'}
                  </button>
                ) : (
                  <button
                    onClick={handleAssociateTaskWithContacts}
                    disabled={associatingTask || !selectedTaskToAssociate}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: (associatingTask || !selectedTaskToAssociate) ? (theme === 'dark' ? '#374151' : '#E5E7EB') : '#10B981',
                      color: (associatingTask || !selectedTaskToAssociate) ? (theme === 'dark' ? '#6B7280' : '#9CA3AF') : '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: (associatingTask || !selectedTaskToAssociate) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {associatingTask ? 'Linking...' : 'Link Task'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
};

export default ComposeEmailModal;
