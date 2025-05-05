import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
// Airtable integration will be implemented later
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import LinkedInPreviewModal from '../../components/modals/LinkedInPreviewModal';
import CompanyTagsModal from '../../components/modals/CompanyTagsModal';
import NewEditCompanyModal from '../../components/modals/NewEditCompanyModal';
import AssociateCompanyModal from '../../components/modals/AssociateCompanyModal';
import CreateCompanyModal from '../../components/modals/CreateCompanyModal';
import ManageContactEmails from '../../components/modals/ManageContactEmails';
import ManageContactMobiles from '../../components/modals/ManageContactMobiles';
import CityModal from '../../components/modals/CityModal';
import TagsModal from '../../components/modals/TagsModal';
import CompanyContactsModal from '../../components/modals/CompanyContactsModal';
import { 
  FiX, 
  FiCheck, 
  FiTrash2, 
  FiArrowRight,
  FiArrowLeft, 
  FiAlertTriangle, 
  FiAlertCircle,
  FiMessageSquare, 
  FiMail, 
  FiPhone, 
  FiTag, 
  FiMapPin, 
  FiBriefcase, 
  FiLink,
  FiLink2,
  FiCalendar,
  FiGitMerge,
  FiInfo,
  FiHome,
  FiChevronRight,
  FiSearch,
  FiUser,
  FiEdit,
  FiUsers,
  FiFile,
  FiPlus,
  FiDatabase,
  FiDollarSign,
  FiAward,
  FiRefreshCw
} from 'react-icons/fi';

// Configure Modal for React
Modal.setAppElement('#root');

// Styled components
const Container = styled.div`
  padding: 0 0 0 20px;
  max-width: 1200px;
  margin: 0;
`;

const Header = styled.div`
  display: none;
`;

const Title = styled.h1`
  display: none;
`;

const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 0.9rem;
  color: #999;
`;

const Crumb = styled.div`
  display: flex;
  align-items: center;
  margin-right: 5px;
  
  a {
    color: ${props => props.active ? '#00ff00' : '#999'};
    text-decoration: none;
    padding: 5px 8px;
    border-radius: 4px;
    cursor: ${props => props.active ? 'default' : 'pointer'};
    font-weight: ${props => props.active ? 'bold' : 'normal'};
    
    &:hover {
      color: ${props => props.active ? '#00ff00' : '#ccc'};
      background-color: ${props => props.active ? 'transparent' : '#333'};
    }
  }
`;

const ProgressBar = styled.div`
  display: flex;
  margin: 10px 0;
  border-radius: 4px;
  overflow: hidden;
  background-color: #1a1a1a;
  height: 4px;
`;

const ProgressStep = styled.div`
  flex: 1;
  height: 100%;
  background-color: ${props => props.$active ? '#00ff00' : (props.$completed ? '#00aa00' : '#333')};
  transition: background-color 0.3s ease;
`;

const StepIndicator = styled.div`
  display: flex;
  margin-bottom: 15px;
  justify-content: space-between;
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  padding: 0 5px;
  
  &:hover .step-number {
    background-color: ${props => props.$clickable && !props.$active ? '#444' : props.$active ? '#00ff00' : (props.$completed ? '#00aa00' : '#333')};
  }
  
  &:hover .step-label {
    color: ${props => props.$clickable && !props.$active ? '#ccc' : props.$active ? '#00ff00' : (props.$completed ? '#00aa00' : '#999')};
  }
  
  .step-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: ${props => props.$active ? '#00ff00' : (props.$completed ? '#00aa00' : '#333')};
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 12px;
    margin-right: 8px;
    transition: background-color 0.3s ease;
    flex-shrink: 0;
  }
  
  .step-label {
    font-size: 0.8rem;
    color: ${props => props.$active ? '#00ff00' : (props.$completed ? '#00aa00' : '#999')};
    transition: color 0.3s ease;
    white-space: nowrap;
  }
`;

const Card = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  padding: 20px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #00ff00;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
`;

const ActionButton = styled.button`
  background-color: ${props => {
    if (props.variant === 'primary') return '#00ff00';
    if (props.variant === 'danger') return '#ff5555';
    if (props.variant === 'warning') return '#ff9900';
    return 'transparent';
  }};
  color: ${props => {
    if (props.variant === 'primary' || props.variant === 'warning') return '#000';
    if (props.variant === 'danger') return '#fff';
    return '#ccc';
  }};
  border: ${props => props.variant ? 'none' : '1px solid #555'};
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  
  &:hover {
    background-color: ${props => {
      if (props.variant === 'primary') return '#00dd00';
      if (props.variant === 'danger') return '#ff3333';
      if (props.variant === 'warning') return '#ff8800';
      return '#333';
    }};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const InteractionsLayout = styled.div`
  display: flex;
  height: 525px; /* Added 5% more (500px to 525px) */
  border: 1px solid #333;
  border-radius: 6px;
  overflow: hidden;
  background-color: #1a1a1a;
`;

const ChannelsMenu = styled.div`
  flex: 0 0 15%;
  border-right: 1px solid #333;
  background-color: #111;
  overflow-y: auto;
`;

const ChannelItem = styled.div`
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid #222;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.active ? '#222' : 'transparent'};
  
  .channel-name {
    font-weight: ${props => props.active ? 'bold' : 'normal'};
    color: ${props => {
      if (!props.active) return '#aaa';
      switch(props.channel) {
        case 'Email': return '#4a9eff';
        case 'Meeting': return '#ff9900';
        case 'Phone': return '#00ff00';
        case 'Slack': return '#9000ff';
        case 'WhatsApp': return '#25d366';
        default: return '#ccc';
      }
    }};
  }
  
  .channel-count {
    background-color: ${props => props.active ? '#333' : '#222'};
    color: ${props => props.active ? '#fff' : '#888'};
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 0.7rem;
    margin-left: auto;
  }
  
  
  &:hover {
    background-color: #1e1e1e;
  }
`;

const InteractionsContainer = styled.div`
  flex: 0 0 90%;
  padding: 0 0 0 0;
  overflow-y: auto;
  background-color: #1a1a1a;
`;

const InteractionItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InteractionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  align-items: center;
  
  .interaction-direction {
    font-size: 0.75rem;
    background-color: ${props => props.direction === 'Outbound' ? '#2d562d' : '#333'};
    color: ${props => props.direction === 'Outbound' ? '#8aff8a' : '#ccc'};
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .interaction-date {
    color: #888;
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    
    .date {
      color: #999;
    }
    
    .time {
      color: #777;
      font-size: 0.7rem;
    }
  }
`;

const InteractionSummary = styled.div`
  color: #eee;
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.5;
  background-color: ${props => props.type === 'whatsapp' ? 'transparent' : '#222'};
  padding: ${props => props.type === 'whatsapp' ? '0' : '12px'};
  border-radius: 4px;
  
  .summary-title {
    font-weight: bold;
    color: #ccc;
    margin-bottom: 5px;
    font-size: 0.8rem;
  }
`;

const WhatsAppMessage = styled.div`
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  position: relative;
  font-size: 0.9rem;
  line-height: 1.4;
  word-break: break-word;
  
  /* Messages colors */
  background-color: ${props => props.direction === 'Outbound' ? '#056162' : '#262d31'};
  color: #e5e5e5;
  
  .time {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    text-align: right;
    margin-top: 4px;
  }
`;

// Old container component kept for compatibility
const WhatsAppBubbleContainer = styled.div`
  display: flex;
  width: 100%;
  padding: 4px 0;
  justify-content: ${props => props.direction === 'Outbound' ? 'flex-end' : 'flex-start'};
`;

// Email Thread UI Components
const EmailThreadContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
`;

const EmailHeader = styled.div`
  background-color: #2a2a2a;
  color: white;
  padding: 16px;
  border-bottom: 1px solid #444;
`;

const EmailSubject = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: #e0e0e0;
`;

const EmailCount = styled.div`
  font-size: 0.8rem;
  color: #aaa;
`;

const EmailList = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 280px);
`;

const EmailItem = styled.div`
  border-bottom: 1px solid #333;
  padding: 6px 64px 16px 0px;
  background-color: #1a1a1a;
  transition: background-color 0.2s;

  &:hover {
    background-color: #222;
  }
  
  ${props => props.$expanded && `
    background-color: #222;
  `}
`;

const EmailHeader2 = styled.div`
  padding: 16px;
  cursor: pointer;
`;

const EmailMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const EmailSender = styled.div`
  font-weight: bold;
  color: #e0e0e0;
`;

const EmailDate = styled.div`
  color: #999;
  font-size: 0.8rem;
`;

const EmailPreview = styled.div`
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
`;

const EmailBody = styled.div`
  padding: 0 0 16px 16px;
  color: #e0e0e0;
  font-size: 0.9rem;
  line-height: 1.5;
  
  p {
    margin-bottom: 8px;
  }
  
  a {
    color: #4a9eff;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const EmailAttachments = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #333;
`;

const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: #252525;
  border-radius: 4px;
  margin-top: 8px;
  
  svg {
    margin-right: 8px;
    color: #999;
  }
`;

// New WhatsApp chat UI components
const WhatsAppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #0b1a1a; /* Dark WhatsApp background */
  position: relative;
  border-radius: 4px;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  background-color: #075e54; /* WhatsApp green */
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ChatAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #128c7e; /* WhatsApp secondary green */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
`;

const ChatInfo = styled.div`
  flex: 1;
`;

const ChatName = styled.div`
  font-weight: bold;
  font-size: 1rem;
`;

const ChatStatus = styled.div`
  font-size: 0.75rem;
`;

const ArrowButton = styled.button`
  background: none;
  border: none;
  color: white;
  opacity: 0.8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  margin-left: 8px;
  
  &:hover {
    opacity: 1;
  }
`;

const ChatNameContainer = styled.div`
  display: flex;
  align-items: center;
`;

const InlineEditContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

const InlineEditInput = styled.input`
  background-color: #128c7e;
  border: none;
  border-bottom: 1px solid #fff;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  padding: 4px;
  outline: none;
  flex: 1;
`;

const InlineEditButtons = styled.div`
  display: flex;
  align-items: center;
`;

const SaveButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #4CAF50;
  }
`;

const CancelButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #F44336;
  }
  opacity: 0.8;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  /* Try generous right padding, e.g., 32px or more */
  padding: 16px 64px 16px 16px; /* (top, right, bottom, left) */
  box-sizing: border-box; /* Explicitly add this just in case */
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 280px);
  background-image: url("..."); // Keep background
`;

const MessageBubble = styled.div`
  max-width: 50%;
  padding: 10px 14px;
  border-radius: 12px;
  position: relative;
  word-wrap: break-word;
  line-height: 1.4;
  font-size: 0.95rem;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  align-self: ${props => props.$direction === 'sent' ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.$direction === 'sent' ? '#055e54' : '#202c33'};
  color: ${props => props.$direction === 'sent' ? '#e9e9e9' : '#e9e9e9'};
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    ${props => props.$direction === 'sent' ? 'right: -8px;' : 'left: -8px;'}
    width: 0;
    height: 0;
    border-top: 8px solid ${props => props.$direction === 'sent' ? '#055e54' : '#202c33'};
    border-right: ${props => props.$direction === 'sent' ? '8px solid transparent' : 'none'};
    border-left: ${props => props.$direction !== 'sent' ? '8px solid transparent' : 'none'};
  }
`;

const MessageTime = styled.div`
  font-size: 0.65rem;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
  padding-right: 4px;
`;

const EmptyChatState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #777;
  text-align: center;
  padding: 20px;
  
  svg {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h3 {
    font-weight: normal;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 0.9rem;
    max-width: 300px;
  }
`;

// Modal styled components for delete confirmation
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;

  h2 {
    color: #00ff00;
    margin: 0;
    font-size: 1.2rem;
    font-family: 'Courier New', monospace;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ff5555;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #ff0000;
  }
`;
const ModalContent = styled.div`
  margin-bottom: 20px;
  color: #cccccc;
  font-size: 0.9rem;
`;

const CheckboxContainer = styled.div`
  margin-bottom: 25px;
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  color: #cccccc;
`;

const Checkbox = styled.input`
  margin-right: 8px;
  cursor: pointer;
  width: 16px;
  height: 16px;
  appearance: none;
  border: 1px solid #00ff00;
  background: #222;
  border-radius: 3px;
  position: relative;
  
  &:checked {
    background: #00ff00;
    
    &:after {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid #000;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }
`;

const ContactDetail = styled.div`
  background-color: #1a1a1a;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #333;
`;

const DetailItem = styled.div`
  margin-bottom: 10px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  color: #999;
  margin-right: 10px;
  font-size: 0.8rem;
`;

const DetailValue = styled.span`
  color: #cccccc;
  font-weight: normal;
`;

const ConfirmButton = styled.button`
  background-color: #ff5555;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #ff3333;
  }
  
  &:disabled {
    background-color: #772727;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const CancelModalButton = styled.button`
  background-color: transparent;
  color: #cccccc;
  border: 1px solid #555;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #333;
  }
`;

const DuplicatesList = styled.div`
  max-height: 500px;
  overflow-y: auto;
  margin-top: 15px;
`;

const DuplicateItem = styled.div`
  border: 1px solid ${props => props.selected ? '#00ff00' : '#333'};
  border-radius: 8px;
  padding: 15px;
  background-color: ${props => props.selected ? 'rgba(0, 255, 0, 0.1)' : '#222'};
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.selected ? 'rgba(0, 255, 0, 0.15)' : '#333'};
  }
`;

const DuplicateName = styled.h4`
  margin: 0 0 8px 0;
  color: #00ff00;
  font-size: 1rem;
`;

const DuplicateDetails = styled.div`
  font-size: 0.9rem;
  color: #ccc;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ComparisonTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  
  th, td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #333;
  }
  
  th {
    color: #00ff00;
    font-weight: bold;
    font-size: 0.9rem;
  }
  
  td {
    color: #ccc;
    font-size: 0.9rem;
  }
`;

const MergeOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 0;
  
  &:hover {
    color: #00ff00;
  }
`;

const MergeRadio = styled.input`
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid #555;
  border-radius: 50%;
  margin: 0;
  cursor: pointer;
  
  &:checked {
    border-color: #00ff00;
    background-color: #00ff00;
    box-shadow: inset 0 0 0 3px #222;
  }
  
  &:hover {
    border-color: #00ff00;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// New styling components for improved form organization
const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
  color: #00ff00;
`;

const SectionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(0, 255, 0, 0.1);
  border-radius: 50%;
  padding: 5px;
`;

const SectionLabel = styled.span`
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 0.5px;
`;

const FormFieldLabel = styled.div`
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 5px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InputLabel = styled.label`
  color: #999;
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const Input = styled.input`
  background-color: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
  padding: 10px 12px;
  width: calc(100% - 30px);
  height: calc(100% + 2px);
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const Select = styled.select`
  background-color: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
  padding: 10px 12px;
  width: 100%;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const TextArea = styled.textarea`
  background-color: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
  padding: 10px 12px;
  width: 100%;
  min-height: 120px;
  font-size: 0.9rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const ExternalSourceInfo = styled.div`
  margin-top: 10px;
  padding: 10px;
  background-color: #222;
  border-radius: 4px;
  border-left: 3px solid ${props => props.color || '#666'};
  font-size: 0.85rem;
  color: #ccc;
  
  .source-label {
    font-size: 0.75rem;
    color: ${props => props.color || '#999'};
    text-transform: uppercase;
    margin-bottom: 3px;
    font-weight: bold;
  }
  
  .source-value {
    word-break: break-word;
  }
`;

const SourceToggles = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
`;

const SourceToggle = styled.button`
  background-color: ${props => props.active ? 'rgba(0, 255, 0, 0.2)' : '#222'};
  border: 1px solid ${props => props.active ? '#00ff00' : '#444'};
  color: ${props => props.active ? '#00ff00' : '#999'};
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.active ? 'rgba(0, 255, 0, 0.3)' : '#333'};
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const Tag = styled.div`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 5px;
  
  .remove {
    cursor: pointer;
    &:hover {
      color: #ff5555;
    }
  }
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 30px;
  color: #999;
  font-style: italic;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #00ff00;
`;

const Badge = styled.span`
  display: inline-block;
  background-color: ${props => props.bg || '#222'};
  color: ${props => props.color || '#00ff00'};
  border: 1px solid ${props => props.borderColor || '#00ff00'};
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

const InlineEditInputField = styled.input`
  background-color: transparent;
  border: none;
  border-bottom: 1px dashed #00ff00;
  color: #fff;
  font-size: 1.5rem;
  font-weight: bold;
  padding: 2px 4px;
  margin: 0 5px 0 0;
  outline: none;
  width: ${props => props.width || '150px'};
  
  &:focus {
    background-color: #111;
    border-bottom: 1px solid #00ff00;
  }
`;

const EditIconWrapper = styled.span`
  opacity: 0;
  margin-left: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
`;

const ContactHeader = styled.div`
  margin-bottom: 20px;
  
  h2 {
    color: #fff;
    margin: 0 0 5px 0;
    display: flex;
    align-items: center;
    
    &:hover ${EditIconWrapper} {
      opacity: 0.8;
    }
    font-size: 1.5rem;
  }
  
  .contact-details {
    color: #aaa;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    font-size: 0.9rem;
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 70, 70, 0.2);
  border: 1px solid #ff4646;
  color: #ff9999;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #eee;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
`;

// Helper function for string similarity
const stringSimilarity = (str1, str2) => {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Early return for empty strings
  if (len1 === 0 || len2 === 0) return 0.0;
  
  // Return simple partial match if strings are very short
  if (len1 < 3 || len2 < 3) {
    return str1.includes(str2) || str2.includes(str1) ? 0.9 : 0.0;
  }
  
  let len = Math.max(len1, len2);
  let distance = 0;
  
  // Simple comparison for web performance
  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (str1[i] !== str2[i]) distance++;
  }
  
  // Add remaining length difference to distance
  distance += Math.abs(len1 - len2);
  
  return 1.0 - (distance / len);
};

// Function to save basic contact information
const saveContactBasicInfo = async (contactId, basicInfo) => {
  try {
    const { first_name, last_name, email, mobile, linkedin, notes } = basicInfo;
    
    // Validate required fields
    if (!contactId) {
      throw new Error('Contact ID is required');
    }
    
    // Prepare update data object with only provided fields
    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (notes !== undefined) updateData.notes = notes;
    
    // Skip update if no fields to update
    if (Object.keys(updateData).length === 0) {
      return { success: true, message: 'No changes to update' };
    }
    
    // Update the contact in Supabase
    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactId);
      
    if (error) {
      console.error('Error updating contact basic info:', error);
      throw new Error(`Failed to update contact information: ${error.message}`);
    }
    
    // Success response
    toast.success('Contact information updated successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Exception updating contact basic info:', error);
    toast.error(error.message || 'Failed to update contact information');
    return { success: false, error };
  }
};

const ContactCrmWorkflow = () => {
  const { id: contactId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const stepParam = searchParams.get('step');
  
  // State
  const [contact, setContact] = useState(null);
  const [airtableContact, setAirtableContact] = useState(null);
  const [airtableSearchInput, setAirtableSearchInput] = useState('');
  const [airtableSearchResults, setAirtableSearchResults] = useState([]);
  const [currentStep, setCurrentStep] = useState(parseInt(stepParam) || 1);
  const [loading, setLoading] = useState(true);
  
  // State for inline editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editingCompanyIndex, setEditingCompanyIndex] = useState(null);
  const [editingCompanyData, setEditingCompanyData] = useState(null);
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [showLinkedInPreviewModal, setShowLinkedInPreviewModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState(null);
  
  // State for associate company modal
  const [showAssociateCompanyModal, setShowAssociateCompanyModal] = useState(false);
  
  // State for create company modal
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showManageContactEmailsModal, setShowManageContactEmailsModal] = useState(false);
  const [showManageContactMobilesModal, setShowManageContactMobilesModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCompanyContactsModal, setShowCompanyContactsModal] = useState(false);
  const [newCompanyInitialName, setNewCompanyInitialName] = useState('');
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    category: '',
    website: '',
    description: '',
    linkedin: '',
    tags: []
  });
  const [error, setError] = useState(null);
  
  // Step 1: Interactions confirmation
  const [interactions, setInteractions] = useState({
    whatsapp: [],
    email: [],
    other: []
  });
  // Step 2: Duplicate check
  const [duplicates, setDuplicates] = useState([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState(null);
  const [deletingContact, setDeletingContact] = useState(false);
  const [mergeSelections, setMergeSelections] = useState({
    first_name: 'current',
    last_name: 'current',
    category: 'current',
    job_role: 'current', 
    emails: 'current',
    mobiles: 'current',
    tags: 'current',
    cities: 'current',
    companies: 'current',
    linkedin: 'current',
    score: 'current',
    keep_in_touch_frequency: 'current'
  });
  
  // Step 3 & 4: Contact enrichment
  const [formData, setFormData] = useState({
    keepInTouch: null,
    category: null,
    notes: '',
    city: null,
    tags: [],
    mobiles: [], // Array of mobile objects with mobile_id, mobile, type, is_primary
    emails: [], // Array of email objects with email_id, email, type, is_primary
    linkedIn: '',
    company: null,
    dealInfo: '',
    selectedTag: '', // For tag selection dropdown
    newCustomTag: '', // For tag input field
    tagSuggestions: [] // For autocomplete suggestions
  });
  
  // Mock data for external source information
  const [externalSources, setExternalSources] = useState({
    hubspot: {
      email: '',
      mobile: '',
      company: null,
      tags: [],
      notes: '',
      keepInTouch: null,
      category: null
    },
    supabase: {
      email: '',
      mobile: '',
      company: null,
      tags: [],
      notes: '',
      keepInTouch: null,
      category: null
    },
    airtable: {
      email: '',
      mobile: '',
      company: null,
      tags: [],
      notes: '',
      keepInTouch: null,
      category: null
    }
  });
  
  const [showSources, setShowSources] = useState({
    hubspot: false,
    supabase: false,
    airtable: false
  });
  
  // State for WhatsApp chats and email threads
  const [whatsappChats, setWhatsappChats] = useState([]);
  const [emailThreads, setEmailThreads] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // State for email threads
  const [selectedEmailThread, setSelectedEmailThread] = useState(null);
  const [emailMessages, setEmailMessages] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState({});
  
  // State for companies
  const [contactCompanies, setContactCompanies] = useState([]); // Initialize with empty array for consistent rendering
  
  // For debugging - add this effect to track company state changes
  useEffect(() => {
    console.log('contactCompanies state changed:', contactCompanies);
  }, [contactCompanies]);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false); // Will be used with a dedicated modal later
  const [selectedCompanyForTags, setSelectedCompanyForTags] = useState(null);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [companiesLoaded, setCompaniesLoaded] = useState(false); // Track if companies were loaded successfully
  const [editingCompanyId, setEditingCompanyId] = useState(null); // Track which company name is being edited
  const [editCompanyName, setEditCompanyName] = useState(''); // Store the company name being edited
  
  // Handler functions for the companies table
  const loadContactCompanies = async () => {
    try {
      console.log('Loading contact companies for contact ID:', contactId, 'Type:', typeof contactId);
      
      if (!contactId) {
        console.warn('Cannot load companies: Missing contact ID');
        setContactCompanies([]);
        setCompaniesLoaded(true);
        return;
      }
      
      // Make the query directly without any loading indicators to avoid UI flicker
      const { data, error } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          company_id,
          relationship,
          is_primary,
          companies:company_id(
            company_id,
            name,
            website,
            category,
            description,
            linkedin
          )
        `)
        .eq('contact_id', contactId);
      
      if (error) {
        console.error('Supabase error when loading companies:', error);
        return;
      }
      
      console.log('Contact companies data from Supabase:', data);
      
      if (data && data.length > 0) {
        const formattedCompanies = data.map(cc => ({
          contact_companies_id: cc.contact_companies_id,
          company_id: cc.company_id,
          relationship: cc.relationship,
          is_primary: cc.is_primary,
          name: cc.companies?.name || 'Unknown Company',
          website: cc.companies?.website || '',
          category: cc.companies?.category || 'Inbox',
          description: cc.companies?.description || '',
          linkedin: cc.companies?.linkedin || '',
          tags: [] // Initialize with empty tags array
        }));
        
        console.log('Formatted companies:', formattedCompanies);
        
        // Update state in one go
        setContactCompanies(formattedCompanies);
        setCompaniesLoaded(true);
        
        // Load tags after a delay
        setTimeout(() => loadCompanyTags(), 100);
      } else {
        console.log('No companies found for this contact');
        setContactCompanies([]);
        setCompaniesLoaded(true);
      }
    } catch (err) {
      console.error('Error in loadContactCompanies:', err);
    }
  };
  
  // Handle changes to company fields in the table
  const handleCompanyChange = async (contactCompaniesId, field, value) => {
    try {
      console.log(`Handling change for ${field}:`, { contactCompaniesId, value });
      
      // Update the state first for a responsive UI
      setContactCompanies(prevCompanies => 
        prevCompanies.map(company => 
          company.contact_companies_id === contactCompaniesId 
            ? { ...company, [field]: value } 
            : company
        )
      );
      
      // Determine which table needs to be updated
      if (['relationship', 'is_primary'].includes(field)) {
        console.log(`Updating ${field} in contact_companies table to:`, value);
        
        // Update the contact_companies table - remove last_modified_at as it doesn't exist in this table
        const { data, error } = await supabase
          .from('contact_companies')
          .update({ [field]: value })
          .eq('contact_companies_id', contactCompaniesId)
          .select();
          
        if (error) {
          console.error('Error updating contact_companies:', error);
          throw error;
        }
        
        console.log('Update successful:', data);
      } else {
        // For other fields, we need to find the company_id first
        const company = contactCompanies.find(c => c.contact_companies_id === contactCompaniesId);
        if (!company || !company.company_id) {
          throw new Error('Company ID not found');
        }
        
        console.log(`Updating ${field} in companies table for company_id:`, company.company_id);
        
        // Update the companies table
        const { data, error } = await supabase
          .from('companies')
          .update({ 
            [field]: value, 
            last_modified_at: new Date(),
            last_modified_by: 'User'
          })
          .eq('company_id', company.company_id)
          .select();
          
        if (error) {
          console.error('Error updating companies:', error);
          throw error;
        }
        
        console.log('Update successful:', data);
      }
      
      toast.success(`Company ${field} updated successfully`);
    } catch (err) {
      console.error(`Error updating company ${field}:`, err);
      toast.error(`Failed to update company ${field}`);
      
      // Revert state change on error
      loadContactCompanies();
    }
  };
  
  // Handle removing a company association
  const handleRemoveCompanyAssociation = async (contactCompaniesId) => {
    try {
      if (!contactCompaniesId) {
        throw new Error('Contact company ID is required');
      }
      
      // Show loading toast
      toast.loading('Removing company association...', { id: 'remove-company' });
      
      // Simply delete the association record from contact_companies
      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_companies_id', contactCompaniesId);
        
      if (error) {
        console.error('Error deleting company association:', error);
        throw error;
      }
      
      // Update the UI immediately without waiting for the reload
      setContactCompanies(prevCompanies => 
        prevCompanies.filter(company => company.contact_companies_id !== contactCompaniesId)
      );
      
      // No need to reload companies - we've already updated the UI
      // This prevents any race conditions or flicker
      
      // Show success toast
      toast.dismiss('remove-company');
      toast.success('Company association removed successfully');
    } catch (err) {
      console.error('Error removing company association:', err);
      toast.dismiss('remove-company');
      toast.error('Failed to remove company association');
      
      // Reload data to ensure UI is in sync
      loadContactCompanies();
    }
  };
  
  // Handle enriching a company with Apollo data
  const handleEnrichCompany = async (companyId) => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      toast.loading('Enriching company data with Apollo...', { id: 'apollo-enrich' });
      
      // Get the company's website
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('website')
        .eq('company_id', companyId)
        .single();
        
      if (companyError) throw companyError;
      
      if (!companyData.website) {
        toast.error('Company has no website to enrich', { id: 'apollo-enrich' });
        return;
      }
      
      // Call the Apollo enrich function
      const response = await fetch('/.netlify/functions/apollo-enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: companyData.website }),
      });
      
      const enrichData = await response.json();
      
      if (!response.ok) {
        throw new Error(enrichData.message || 'Failed to enrich company data');
      }
      
      // Update the company with the enriched data
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          description: enrichData.description || '',
          linkedin: enrichData.linkedin || '',
          last_modified_at: new Date(),
          last_modified_by: 'Apollo'
        })
        .eq('company_id', companyId);
        
      if (updateError) throw updateError;
      
      toast.success('Company data enriched successfully', { id: 'apollo-enrich' });
      
      // Reload the companies data
      loadContactCompanies();
    } catch (err) {
      console.error('Error enriching company:', err);
      toast.error('Failed to enrich company data', { id: 'apollo-enrich' });
    }
  };
  
  // Handle navigating to a company page
  const navigateToCompany = (companyId) => {
    if (!companyId) return;
    navigate(`/companies/${companyId}`);
  };
  
  // Start editing company name
  const startEditingCompany = (company) => {
    setEditingCompanyId(company.contact_companies_id);
    setEditCompanyName(company.name || '');
  };
  
  // Open the new edit company modal
  const openEditCompanyModal = (company) => {
    setSelectedCompanyForEdit(company);
    setShowEditCompanyModal(true);
  };
  
  // Save company name changes
  const saveCompanyName = async () => {
    if (!editingCompanyId) return;
    
    try {
      const company = contactCompanies.find(c => c.contact_companies_id === editingCompanyId);
      if (!company) return;
      
      await handleCompanyChange(editingCompanyId, 'name', editCompanyName);
      
      // Reset editing state
      setEditingCompanyId(null);
      setEditCompanyName('');
    } catch (err) {
      console.error('Error saving company name:', err);
      toast.error('Failed to save company name');
    }
  };
  
  // Cancel editing company name
  const cancelEditingCompany = () => {
    setEditingCompanyId(null);
    setEditCompanyName('');
  };
  
  // Handle key presses when editing company name
  const handleCompanyNameKeyDown = (e, company) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveCompanyName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingCompany();
    }
  };
  
  
  // Function to load tags for all companies
  const loadCompanyTags = async () => {
    try {
      // Make sure we still have companies before trying to load tags
      if (!contactCompanies || contactCompanies.length === 0) {
        console.warn('No companies available when trying to load company tags');
        return;
      }
      
      // Load tags for each company in parallel
      const updatedCompanies = [...contactCompanies];
      
      await Promise.all(
        updatedCompanies.map(async (company, index) => {
          if (company.company_id) {
            const tags = await fetchCompanyTags(company.company_id);
            updatedCompanies[index].tags = tags;
          }
        })
      );
      
      // Check again to make sure companies weren't cleared during tags loading
      if (contactCompanies && contactCompanies.length > 0) {
        // Update state with companies that now have tags
        setContactCompanies(updatedCompanies);
      } else {
        console.warn('Companies were cleared during tag loading - not updating tags');
      }
    } catch (err) {
      console.error('Error loading company tags:', err);
    }
  };
  
  // Refresh company data and tags - implemented with direct query to bypass any state issues
  const refreshCompanyData = async () => {
    try {
      toast.loading('Refreshing company data...', { id: 'refresh-companies' });
      
      console.log('Directly querying company data for contact ID:', contactId);
      
      if (!contactId) {
        console.warn('Cannot refresh companies: Missing contact ID');
        toast.error('Cannot refresh: Missing contact ID', { id: 'refresh-companies' });
        return;
      }
      
      // Direct query - bypass all the complex loading logic that might be causing issues
      const { data, error } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          company_id,
          relationship,
          is_primary,
          companies:company_id(
            company_id,
            name,
            website,
            category,
            description,
            linkedin
          )
        `)
        .eq('contact_id', contactId);
      
      if (error) {
        console.error('Supabase error when refreshing companies:', error);
        toast.error('Database error when refreshing', { id: 'refresh-companies' });
        return;
      }
      
      console.log('Refreshed contact companies data from Supabase:', data);
      
      if (data && data.length > 0) {
        const formattedCompanies = data.map(cc => ({
          contact_companies_id: cc.contact_companies_id,
          company_id: cc.company_id,
          relationship: cc.relationship,
          is_primary: cc.is_primary,
          name: cc.companies?.name || 'Unknown Company',
          website: cc.companies?.website || '',
          category: cc.companies?.category || 'Inbox',
          description: cc.companies?.description || '',
          linkedin: cc.companies?.linkedin || '',
          tags: [] // Initialize with empty tags array
        }));
        
        console.log('Formatted companies from refresh:', formattedCompanies);
        
        // Set the companies directly
        setContactCompanies(formattedCompanies);
        setCompaniesLoaded(true);
        
        // Don't load tags with a delay since that might be part of the issue
        toast.success('Company data refreshed successfully', { id: 'refresh-companies' });
      } else {
        console.log('No companies found for this contact during refresh');
        toast.success('No companies found for this contact', { id: 'refresh-companies' });
      }
    } catch (err) {
      console.error('Error refreshing company data:', err);
      toast.error('Failed to refresh company data: ' + err.message, { id: 'refresh-companies' });
    }
  };
  
  // Show add tag modal for a company
  const handleShowAddTagModal = (companyId) => {
    setSelectedCompanyForTags(companyId);
    setShowAddTagModal(true);
  };
  
  // Remove tag from company
  const handleRemoveCompanyTag = async (companyId, tagId) => {
    try {
      if (!companyId || !tagId) return;
      
      // Delete the tag association
      const { error } = await supabase
        .from('company_tags')
        .delete()
        .eq('company_id', companyId)
        .eq('tag_id', tagId);
        
      if (error) throw error;
      
      // Update the UI by removing the tag from the company
      setContactCompanies(prevCompanies => 
        prevCompanies.map(company => {
          if (company.company_id === companyId) {
            return {
              ...company,
              tags: company.tags?.filter(tag => tag.tag_id !== tagId) || []
            };
          }
          return company;
        })
      );
      
      toast.success('Tag removed');
    } catch (err) {
      console.error('Error removing company tag:', err);
      toast.error('Failed to remove tag');
    }
  };
  
  // State for tracking selected enrichment section
  const [activeEnrichmentSection, setActiveEnrichmentSection] = useState(() => {
    // Try to get the saved section from sessionStorage
    const savedSection = sessionStorage.getItem(`enrichment_section_${contactId}`);
    return savedSection || "basics";
  });

  // Save activeEnrichmentSection to sessionStorage when it changes
  useEffect(() => {
    if (activeEnrichmentSection) {
      sessionStorage.setItem(`enrichment_section_${contactId}`, activeEnrichmentSection);
    }
  }, [activeEnrichmentSection, contactId]);
  
  // State for delete modal (same as in ContactsInbox)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [associatedData, setAssociatedData] = useState({
    chatCount: 0,
    contactChatsCount: 0,
    interactionsCount: 0,
    emailsCount: 0,
    emailParticipantsCount: 0,
    emailThreadsCount: 0,
    tagsCount: 0,
    citiesCount: 0,
    companiesCount: 0,
    notesCount: 0,
    attachmentsCount: 0,
    contactEmailsCount: 0,
    contactMobilesCount: 0,
    dealsCount: 0,
    meetingsCount: 0,
    investmentsCount: 0,
    kitCount: 0,
    lastInteraction: null
  });
  const [selectedItems, setSelectedItems] = useState({
    deleteChat: true,
    deleteContactChats: true,
    deleteInteractions: true,
    deleteEmails: true,
    deleteEmailParticipants: true,
    deleteEmailThreads: true,
    deleteTags: true,
    deleteCities: true, 
    deleteCompanies: true,
    deleteNotes: true,
    deleteAttachments: true,
    deleteContactEmails: true,
    deleteContactMobiles: true,
    deleteDeals: true,
    deleteMeetings: true,
    deleteInvestments: true,
    deleteKit: true,
    addToSpam: true,
    addMobileToSpam: true
  });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Handle selecting a chat
  const handleSelectChat = async (chatId) => {
    setSelectedChat(chatId);
    setSelectedEmailThread(null); // Clear selected email thread
    setLoadingMessages(true);
    setChatMessages([]); // Clear previous messages
    
    try {
      console.log('Loading messages for chat ID:', chatId);
      
      // Load interactions for this chat
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          interaction_id,
          contact_id,
          interaction_type,
          direction,
          interaction_date,
          chat_id,
          summary,
          created_at,
          external_interaction_id,
          special_case_tag
        `)
        .eq('chat_id', chatId)
        .eq('interaction_type', 'whatsapp')
        .order('interaction_date', { ascending: false });
      
      if (error) {
        console.error('Error loading chat messages:', error);
        return;
      }
      
      console.log('Loaded chat messages:', data);
      
      if (data && data.length > 0) {
        // Format the messages for display
        const formattedMessages = data.map(message => ({
          id: message.interaction_id,
          content: message.summary || 'No content',
          direction: message.direction === 'sent' ? 'sent' : 'received',
          timestamp: message.interaction_date,
          formattedTime: new Date(message.interaction_date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        }));
        
        setChatMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Error in handleSelectChat:', err);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  // Handle selecting an email thread
const handleSelectEmailThread = async (threadId) => {
  setSelectedEmailThread(threadId);
  setSelectedChat(null); // Clear selected chat
  setLoadingEmails(true);
  setEmailMessages([]); // Clear previous emails
  setExpandedEmails({}); // Reset expanded state
  
  try {
    console.log('Loading emails for thread ID:', threadId);
    
    // APPROACH 1: Primary approach - Get emails with complete participant information
    const { data: emailsWithParticipants, error: participantsError } = await supabase
      .from('emails')
      .select(`
        email_id,
        thread_id,
        email_thread_id,
        subject,
        body_plain,
        body_html,
        message_timestamp,
        is_read,
        direction,
        has_attachments,
        attachment_count,
        email_participants!inner (
          participant_id,
          participant_type,
          contacts:contact_id (
            contact_id,
            first_name,
            last_name,
            contact_emails (
              email
            )
          )
        )
      `)
      .eq('email_thread_id', threadId)
      .order('message_timestamp', { ascending: false });
    
    if (participantsError) {
      console.error('Error loading emails with participants:', participantsError);
    } else if (emailsWithParticipants && emailsWithParticipants.length > 0) {
      console.log('Found emails with participants:', emailsWithParticipants);
      
      // Format emails with organized participant information
      const formattedEmails = emailsWithParticipants.map(email => {
        // Organize participants by type
        const sender = email.email_participants.find(p => p.participant_type === 'sender');
        const toRecipients = email.email_participants.filter(p => p.participant_type === 'to');
        const ccRecipients = email.email_participants.filter(p => p.participant_type === 'cc');
        const bccRecipients = email.email_participants.filter(p => p.participant_type === 'bcc');
        
        return {
          email_id: email.email_id,
          thread_id: email.thread_id,
          email_thread_id: email.email_thread_id,
          subject: email.subject,
          body_plain: email.body_plain,
          body_html: email.body_html,
          message_timestamp: email.message_timestamp,
          is_read: email.is_read,
          direction: email.direction,
          has_attachments: email.has_attachments,
          attachment_count: email.attachment_count,
          sender: sender ? {
            contact_id: sender.contacts.contact_id,
            name: `${sender.contacts.first_name} ${sender.contacts.last_name}`.trim(),
            email: sender.contacts.contact_emails?.[0]?.email || ''
          } : null,
          to: toRecipients.map(p => ({
            contact_id: p.contacts.contact_id,
            name: `${p.contacts.first_name} ${p.contacts.last_name}`.trim(),
            email: p.contacts.contact_emails?.[0]?.email || ''
          })),
          cc: ccRecipients.map(p => ({
            contact_id: p.contacts.contact_id,
            name: `${p.contacts.first_name} ${p.contacts.last_name}`.trim(),
            email: p.contacts.contact_emails?.[0]?.email || ''
          })),
          bcc: bccRecipients.map(p => ({
            contact_id: p.contacts.contact_id,
            name: `${p.contacts.first_name} ${p.contacts.last_name}`.trim(),
            email: p.contacts.contact_emails?.[0]?.email || ''
          }))
        };
      });
      
      setEmailMessages(formattedEmails);
      
      // Auto-expand the first email
      if (formattedEmails.length > 0) {
        setExpandedEmails({ [formattedEmails[0].email_id]: true });
      }
      
      setLoadingEmails(false);
      return;
    } else {
      console.log('No emails with participants found for thread ID:', threadId);
    }
    
    // APPROACH 2: Fallback - Get emails by email_thread_id without participants
    const { data: basicEmails, error: basicError } = await supabase
      .from('emails')
      .select(`
        email_id,
        thread_id,
        email_thread_id,
        sender_contact_id,
        subject,
        body_plain,
        body_html,
        message_timestamp,
        is_read,
        direction,
        has_attachments,
        attachment_count,
        contacts:sender_contact_id (
          contact_id,
          first_name,
          last_name,
          contact_emails (
            email
          )
        )
      `)
      .eq('email_thread_id', threadId)
      .order('message_timestamp', { ascending: false });
    
    if (basicError) {
      console.error('Error loading basic emails:', basicError);
    } else if (basicEmails && basicEmails.length > 0) {
      console.log('Found basic emails:', basicEmails);
      
      // Format emails with basic sender information
      const formattedEmails = basicEmails.map(email => {
        return {
          email_id: email.email_id,
          thread_id: email.thread_id,
          email_thread_id: email.email_thread_id,
          subject: email.subject,
          body_plain: email.body_plain,
          body_html: email.body_html,
          message_timestamp: email.message_timestamp,
          is_read: email.is_read,
          direction: email.direction,
          has_attachments: email.has_attachments,
          attachment_count: email.attachment_count,
          sender: email.contacts ? {
            contact_id: email.contacts.contact_id,
            name: `${email.contacts.first_name} ${email.contacts.last_name}`.trim(),
            email: email.contacts.contact_emails?.[0]?.email || ''
          } : null,
          to: [],
          cc: [],
          bcc: []
        };
      });
      
      setEmailMessages(formattedEmails);
      
      // Auto-expand the first email
      if (formattedEmails.length > 0) {
        setExpandedEmails({ [formattedEmails[0].email_id]: true });
      }
      
      setLoadingEmails(false);
      return;
    } else {
      console.log('No basic emails found for thread ID:', threadId);
    }
    
    // APPROACH 3: Try a subject-based search
    // First, get the thread details to find the subject
    const { data: threadDetails, error: threadError } = await supabase
      .from('email_threads')
      .select('subject')
      .eq('email_thread_id', threadId)
      .single();
    
    if (threadError) {
      console.error('Error getting thread details:', threadError);
    } else if (threadDetails && threadDetails.subject) {
      const threadSubject = threadDetails.subject;
      console.log('Trying to find emails by subject:', threadSubject);
      
      // Search by subject
      const { data: subjectEmails, error: subjectError } = await supabase
        .from('emails')
        .select(`
          email_id,
          thread_id,
          email_thread_id,
          sender_contact_id,
          subject,
          body_plain,
          body_html,
          message_timestamp,
          is_read,
          direction,
          has_attachments,
          attachment_count,
          contacts:sender_contact_id (
            contact_id,
            first_name,
            last_name,
            contact_emails (
              email
            )
          )
        `)
        .or(`subject.eq.${threadSubject},subject.ilike.%${threadSubject}%,subject.ilike.%Re: ${threadSubject}%`)
        .order('message_timestamp', { ascending: false });
      
      if (subjectError) {
        console.error('Error in subject search:', subjectError);
      } else if (subjectEmails && subjectEmails.length > 0) {
        console.log('Found emails by subject:', subjectEmails);
        
        // Format emails with basic sender information
        const formattedEmails = subjectEmails.map(email => {
          return {
            email_id: email.email_id,
            thread_id: email.thread_id,
            email_thread_id: email.email_thread_id,
            subject: email.subject,
            body_plain: email.body_plain,
            body_html: email.body_html,
            message_timestamp: email.message_timestamp,
            is_read: email.is_read,
            direction: email.direction,
            has_attachments: email.has_attachments,
            attachment_count: email.attachment_count,
            sender: email.contacts ? {
              contact_id: email.contacts.contact_id,
              name: `${email.contacts.first_name} ${email.contacts.last_name}`.trim(),
              email: email.contacts.contact_emails?.[0]?.email || ''
            } : null,
            to: [],
            cc: [],
            bcc: []
          };
        });
        
        setEmailMessages(formattedEmails);
        
        // Auto-expand the first email
        if (formattedEmails.length > 0) {
          setExpandedEmails({ [formattedEmails[0].email_id]: true });
        }
        
        setLoadingEmails(false);
        return;
      } else {
        console.log('No emails found with subject:', threadSubject);
      }
    }
    
    // If all approaches failed, let the user know
    console.log('No emails found for this thread with any method');
    
  } catch (err) {
    console.error('Error in handleSelectEmailThread:', err);
  } finally {
    setLoadingEmails(false);
  }
};
  
  // Toggle email expanded state
  const toggleEmailExpanded = (emailId) => {
    setExpandedEmails(prev => ({
      ...prev,
      [emailId]: !prev[emailId]
    }));
  };

  // Load WhatsApp chats for a contact based on interactions
  const loadWhatsappChats = async (contactId) => {
    try {
      console.log('Loading WhatsApp chats for contact ID:', contactId);
      
      // 1. First get interactions with type 'whatsapp' for this contact
      const { data: interactionData, error: interactionError } = await supabase
        .from('interactions')
        .select(`
          interaction_id,
          chat_id,
          interaction_date
        `)
        .eq('contact_id', contactId)
        .eq('interaction_type', 'whatsapp')
        .order('interaction_date', { ascending: false });
      
      if (interactionError) {
        console.error('Error loading WhatsApp interactions:', interactionError);
        return;
      }
      
      console.log('Found WhatsApp interactions:', interactionData);
      
      if (!interactionData || interactionData.length === 0) {
        return; // No WhatsApp interactions found
      }
      
      // Extract unique chat_ids from the interactions
      const chatIds = [...new Set(interactionData.map(item => item.chat_id))].filter(Boolean);
      
      if (chatIds.length === 0) {
        return; // No valid chat IDs found
      }
      
      // 2. Get chat details for each unique chat_id
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          id,
          chat_name,
          is_group_chat,
          external_chat_id
        `)
        .in('id', chatIds);
      
      if (chatError) {
        console.error('Error loading chats:', chatError);
        return;
      }
      
      console.log('Found chats:', chatData);
      
      if (chatData && chatData.length > 0) {
        // Format the chats data
        const formattedChats = chatData.map(chat => ({
          chat_id: chat.id,
          chat_name: chat.chat_name || 'Unnamed Chat',
          is_group_chat: chat.is_group_chat || false,
          external_chat_id: chat.external_chat_id,
          unread_count: 0
        }));
        
        console.log('Setting WhatsApp chats:', formattedChats);
        setWhatsappChats(formattedChats);
      }
    } catch (err) {
      console.error('Error loading WhatsApp chats:', err);
    }
  };

  // Get email threads using the contact_email_threads table
  const loadEmailThreads = async (contactId) => {
    try {
      console.log('Loading email threads from contact_email_threads for contact ID:', contactId);
      
      // Query the contact_email_threads table directly to get all email threads for this contact
      const { data, error } = await supabase
        .from('contact_email_threads')
        .select(`
          email_thread_id,
          email_threads:email_thread_id (
            email_thread_id, 
            subject,
            thread_id,
            last_message_timestamp,
            updated_at
          )
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading email threads from contact_email_threads:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No email threads found for contact ID:', contactId);
        setEmailThreads([]);
        return;
      }
      
      console.log('Found email threads:', data);
      
      // Format the threads - no need for deduplication since contact_email_threads has unique constraints
      const formattedThreads = data
        .filter(item => item.email_threads) // Filter out any null references
        .map(item => ({
          thread_id: item.email_thread_id,
          title: item.email_threads.subject || 'No Subject',
          date: item.email_threads.last_message_timestamp,
          updated_at: item.email_threads.updated_at,
          gmail_thread_id: item.email_threads.thread_id // Include this for email fetching
        }))
        // Sort by date (newest first)
        .sort((a, b) => new Date(b.date || b.updated_at) - new Date(a.date || a.updated_at));
      
      console.log('Setting email threads:', formattedThreads);
      setEmailThreads(formattedThreads);
      
      // Alternate method - get all threads that the contact participates in
      if (formattedThreads.length === 0) {
        console.log('Trying alternate method to find email threads...');
        
        // First get all interactions with type 'email' for this contact
        const { data: interactionData, error: interactionError } = await supabase
          .from('interactions')
          .select(`
            interaction_id,
            email_thread_id,
            summary
          `)
          .eq('contact_id', contactId)
          .eq('interaction_type', 'email')
          .order('interaction_date', { ascending: false });
        
        if (interactionError) {
          console.error('Error loading email interactions:', interactionError);
          return;
        }
        
        if (interactionData && interactionData.length > 0) {
          console.log('Found email interactions:', interactionData);
          
          // Extract unique email_thread_ids
          const threadIds = [...new Set(interactionData.map(item => item.email_thread_id))].filter(Boolean);
          
          if (threadIds.length > 0) {
            // Get thread details
            const { data: threadsData, error: threadsError } = await supabase
              .from('email_threads')
              .select('*')
              .in('email_thread_id', threadIds);
            
            if (threadsError) {
              console.error('Error loading email threads details:', threadsError);
              return;
            }
            
            if (threadsData && threadsData.length > 0) {
              const alternateThreads = threadsData.map(thread => ({
                thread_id: thread.email_thread_id,
                title: thread.subject || 'No Subject',
                date: thread.last_message_timestamp,
                updated_at: thread.updated_at,
                gmail_thread_id: thread.thread_id
              }));
              
              console.log('Setting alternate email threads:', alternateThreads);
              setEmailThreads(alternateThreads);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading email threads:', err);
    }
  };

  // Load contact data and initialize workflow
  useEffect(() => {
    if (contactId) {
      console.log('Loading data for contact ID:', contactId);
      
      // Load companies first, then load other data
      // This ensures the companies are loaded before other actions that might overwrite them
      const loadAllData = async () => {
        try {
          console.log('Loading contact companies first to prevent race conditions');
          await loadContactCompanies();
          
          // Load other data after companies
          loadContactData();
          loadWhatsappChats(contactId);
          loadEmailThreads(contactId);
          
          // Enable all legacy data sources by default
          setShowSources({
            hubspot: true,
            supabase: true,
            airtable: true
          });
        } catch (err) {
          console.error('Error in initial data loading:', err);
        }
      };
      
      loadAllData();
    }
  }, [contactId]); // Only depend on contactId to prevent reloading cycle
  
  // Start editing name
  const startEditingName = () => {
    setEditFirstName(contact?.first_name || '');
    setEditLastName(contact?.last_name || '');
    setIsEditingName(true);
  };
  
  // Save name changes
  const saveNameChanges = async () => {
    try {
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          first_name: editFirstName,
          last_name: editLastName
        })
        .eq('contact_id', contactId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setContact({
        ...contact,
        first_name: editFirstName,
        last_name: editLastName
      });
      
      setIsEditingName(false);
      toast.success('Name updated successfully');
    } catch (err) {
      console.error('Error updating name:', err);
      toast.error('Failed to update name');
    }
  };
  
  // Cancel editing
  const cancelNameEditing = () => {
    setIsEditingName(false);
  };
  
  // Update URL when step changes and scroll to top left
  useEffect(() => {
    const newSearch = new URLSearchParams(location.search);
    newSearch.set('step', currentStep);
    navigate(`/contacts/workflow/${contactId}?${newSearch.toString()}`, { replace: true });
    
    // Scroll to top left of the page
    window.scrollTo(0, 0);
  }, [currentStep, contactId, navigate, location.search]);
  
  // Load contact data
  const loadContactData = async () => {
    // IMPORTANT: Never wipe out existing companies data - this was causing the bug
    // where companies would disappear after being loaded
    console.log('Loading contact data, preserving existing company data if available', 
                contactCompanies.length > 0 ? `(${contactCompanies.length} companies)` : '');
    
    setLoading(true);
    setError(null);
    
    try {
      // Load contact details - using the correct column names from schema
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          category,
          score,
          description,
          birthday,
          last_interaction_at,
          linkedin,
          job_role,
          keep_in_touch_frequency,
          airtable_id
        `)
        .eq('contact_id', contactId)
        .single();
      
      if (contactError) throw contactError;
      if (!contactData) throw new Error('Contact not found');
      
      setContact(contactData);
      
      // Load corresponding Airtable contact data if airtable_id exists
      if (contactData.airtable_id) {
        loadAirtableContact(contactData.airtable_id);
      }
      
      // Initialize form data with existing contact data and empty collections
      setFormData({
        firstName: contactData.first_name,
        lastName: contactData.last_name,
        keepInTouch: contactData.keep_in_touch_frequency,
        category: contactData.category,
        score: contactData.score,
        description: contactData.description || '',
        editingDescription: false, // For description edit toggle
        birthday: contactData.birthday || '',
        notes: '',
        city: null,
        tags: [],
        mobiles: [], // Will be populated by loadEmailAndMobile
        emails: [], // Will be populated by loadEmailAndMobile
        linkedIn: contactData.linkedin || '',
        jobRole: contactData.job_role || '',
        company: null,
        dealInfo: '',
        newEmail: '',
        newEmailType: 'personal',
        newMobile: '',
        newMobileType: 'personal',
        newCustomTag: ''
      });
      
      // Load related data in parallel
      // Note: We skip loadContactCompanies here to avoid race conditions
      // with the conditional loading in the useEffect
      await Promise.all([
        loadInteractions(contactData.contact_id),
        loadContactDetails(contactData.contact_id),
        loadEmailAndMobile(contactData.contact_id),
        // loadContactCompanies() - Removed to avoid race condition
        fetchExternalData(contactData)
      ]);
      
      // Look for companies matching the contact's email domains
      await findCompaniesByEmailDomains();
      
      // After loading email and mobile, search for duplicates
      if (currentStep === 2 || !currentStep) {
        console.log("Automatically searching for duplicates");
        const nameDuplicates = await searchNameDuplicates();
        const emailDuplicates = contact.email ? await searchEmailDuplicates() : [];
        const mobileDuplicates = contact.mobile ? await searchMobileDuplicates() : [];
        
        // Combine all duplicates and remove duplicates
        const allDuplicates = [...nameDuplicates, ...emailDuplicates, ...mobileDuplicates];
        
        // Remove duplicates by contact_id
        const uniqueDuplicates = allDuplicates.filter((duplicate, index, self) =>
          index === self.findIndex((d) => d.contact_id === duplicate.contact_id)
        );
        
        setDuplicates(uniqueDuplicates);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading contact data:', err);
      setError(`Failed to load contact data: ${err.message}`);
      setLoading(false);
    }
  };
  
  // Load all interactions for the contact
  const loadInteractions = async (contactId) => {
    try {
      // First get all email threads this contact participated in
      const { data: threadData, error: threadError } = await supabase
        .from('contact_email_threads')
        .select(`
          email_thread_id,
          email_threads!inner (
            email_thread_id,
            thread_id,
            subject,
            last_message_timestamp
          )
        `)
        .eq('contact_id', contactId);

      if (threadError) throw threadError;

      // For each thread, get all emails and their participants
      const emailThreads = [];
      
      for (const thread of threadData || []) {
        const { data: emailsData, error: emailsError } = await supabase
          .from('emails')
          .select(`
            email_id,
            subject,
            body_plain,
            body_html,
            message_timestamp,
            direction,
            sender_contact_id,
            email_participants!inner (
              participant_id,
              contact_id,
              participant_type,
              contacts!inner (
                first_name,
                last_name,
                contact_emails!inner (
                  email
                )
              )
            )
          `)
          .eq('email_thread_id', thread.email_thread_id)
          .order('message_timestamp', { ascending: false });

        if (emailsError) throw emailsError;

        if (emailsData && emailsData.length > 0) {
          const threadEmails = emailsData.map(email => {
            // Get sender info
            const sender = email.email_participants.find(p => p.participant_type === 'sender');
            
            // Get other participants
            const toParticipants = email.email_participants
              .filter(p => p.participant_type === 'to')
              .map(p => `${p.contacts.first_name} ${p.contacts.last_name} <${p.contacts.contact_emails[0]?.email}>`);
            
            const ccParticipants = email.email_participants
              .filter(p => p.participant_type === 'cc')
              .map(p => `${p.contacts.first_name} ${p.contacts.last_name} <${p.contacts.contact_emails[0]?.email}>`);

            return {
              email_id: email.email_id,
              subject: email.subject,
              content: email.body_html || email.body_plain,
              interaction_date: email.message_timestamp,
              direction: email.direction,
              sender_name: sender ? `${sender.contacts.first_name} ${sender.contacts.last_name}` : 'Unknown',
              sender_email: sender?.contacts.contact_emails[0]?.email || '',
              to_participants: toParticipants,
              cc_participants: ccParticipants
            };
          });

          emailThreads.push({
            thread_id: thread.email_threads.thread_id,
            subject: thread.email_threads.subject || 'No Subject',
            last_message_timestamp: thread.email_threads.last_message_timestamp,
            emails: threadEmails
          });
        }
      }

      // Set organized interactions in state
      setInteractions({
        whatsapp: [], // We'll handle WhatsApp separately
        email: emailThreads,
        other: [] // We'll handle other interactions separately
      });

    } catch (err) {
      console.error('Error loading interactions:', err);
      setError('Failed to load interactions');
    }
  };
  
  // Load email and mobile data for the contact
  const loadEmailAndMobile = async (contactId) => {
    try {
      // Load all emails for this contact
      const { data: emailsData, error: emailsError } = await supabase
        .from('contact_emails')
        .select('email_id, email, type, is_primary')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false });
      
      if (!emailsError && emailsData) {
        // Update formData with all emails
        setFormData(prev => ({
          ...prev,
          emails: emailsData.map(item => ({
            email_id: item.email_id,
            email: item.email,
            type: item.type || 'personal',
            is_primary: item.is_primary
          })),
          // Keep the old email field for backward compatibility
          email: emailsData.length > 0 ? emailsData[0].email : ''
        }));
        
        // Update contact object to include primary email for display
        const primaryEmail = emailsData.find(e => e.is_primary) || emailsData[0];
        if (primaryEmail) {
          setContact(prev => ({
            ...prev,
            email: primaryEmail.email
          }));
        }
      } else if (emailsError) {
        console.error('Error loading emails:', emailsError);
      }
      
      // Load all mobiles for this contact
      const { data: mobilesData, error: mobilesError } = await supabase
        .from('contact_mobiles')
        .select('mobile_id, mobile, type, is_primary')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false });
      
      if (!mobilesError && mobilesData) {
        // Update formData with all mobiles
        setFormData(prev => ({
          ...prev,
          mobiles: mobilesData.map(item => ({
            mobile_id: item.mobile_id,
            mobile: item.mobile,
            type: item.type || 'personal',
            is_primary: item.is_primary
          })),
          // Keep the old mobile field for backward compatibility
          mobile: mobilesData.length > 0 ? mobilesData[0].mobile : ''
        }));
        
        // Update contact object to include primary mobile for display
        const primaryMobile = mobilesData.find(m => m.is_primary) || mobilesData[0];
        if (primaryMobile) {
          setContact(prev => ({
            ...prev,
            mobile: primaryMobile.mobile
          }));
        }
      } else if (mobilesError) {
        console.error('Error loading mobiles:', mobilesError);
      }
    } catch (err) {
      console.error('Error loading email and mobile data:', err);
    }
  };
  
  // Search for Airtable contacts
  const searchAirtableContacts = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setAirtableSearchResults([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('airtable_contacts')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,primary_email.ilike.%${searchTerm}%,phone_number_1.ilike.%${searchTerm}%`)
        .limit(10);
      
      if (error) {
        console.error('Error searching Airtable contacts:', error);
        return;
      }
      
      // Filter out the currently associated contact if exists
      const filteredResults = data.filter(item => item.airtable_id !== contact?.airtable_id);
      setAirtableSearchResults(filteredResults);
    } catch (err) {
      console.error('Error in searchAirtableContacts:', err);
    }
  };
  
  // Associate an Airtable contact with the current contact
  const associateAirtableContact = async (airtableId) => {
    if (!contact) return;
    
    try {
      // Update the contact's airtable_id
      const { error } = await supabase
        .from('contacts')
        .update({ airtable_id: airtableId })
        .eq('contact_id', contact.contact_id);
      
      if (error) {
        console.error('Error associating Airtable contact:', error);
        return false;
      }
      
      // Update contact in state
      setContact(prev => ({
        ...prev,
        airtable_id: airtableId
      }));
      
      // Load the new Airtable contact data
      loadAirtableContact(airtableId);
      
      // Clear search results
      setAirtableSearchInput('');
      setAirtableSearchResults([]);
      
      return true;
    } catch (err) {
      console.error('Error in associateAirtableContact:', err);
      return false;
    }
  };
  
  // Disassociate the Airtable contact from the current contact
  const disassociateAirtableContact = async () => {
    if (!contact || !contact.airtable_id) return;
    
    try {
      // Remove the airtable_id from contact
      const { error } = await supabase
        .from('contacts')
        .update({ airtable_id: null })
        .eq('contact_id', contact.contact_id);
      
      if (error) {
        console.error('Error disassociating Airtable contact:', error);
        return false;
      }
      
      // Update contact in state
      setContact(prev => ({
        ...prev,
        airtable_id: null
      }));
      
      // Clear the airtable contact data
      setAirtableContact(null);
      
      return true;
    } catch (err) {
      console.error('Error in disassociateAirtableContact:', err);
      return false;
    }
  };
  
  // Load Airtable contact data based on airtable_id
  const loadAirtableContact = async (airtableId) => {
    if (!airtableId) return;
    
    try {
      const { data, error } = await supabase
        .from('airtable_contacts')
        .select('*')
        .eq('airtable_id', airtableId)
        .single();
      
      if (error) {
        console.error('Error loading Airtable contact:', error);
        return;
      }
      
      if (data) {
        setAirtableContact(data);
      }
    } catch (err) {
      console.error('Error in loadAirtableContact:', err);
    }
  };

  // Load contact details (tags, companies, cities)
  const loadContactDetails = async (contactId) => {
    try {
      // Load tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('contact_tags')
        .select(`
          entry_id,
          tag_id,
          tags:tag_id(tag_id, name)
        `)
        .eq('contact_id', contactId);
      
      if (!tagsError && tagsData) {
        const tags = tagsData.map(t => ({
          tag_id: t.tags.tag_id,
          name: t.tags.name,
          entry_id: t.entry_id
        })).filter(t => t.tag_id && t.name);
        
        setFormData(prev => ({
          ...prev,
          tags
        }));
      }
      
      // Load cities
      const { data: citiesData, error: citiesError } = await supabase
        .from('contact_cities')
        .select(`
          entry_id,
          city_id,
          cities:city_id(city_id, name, country)
        `)
        .eq('contact_id', contactId);
      
      if (!citiesError && citiesData && citiesData.length > 0) {
        // Store all cities data
        const cities = citiesData.map(c => ({
          city_id: c.cities.city_id,
          name: c.cities.name,
          country: c.cities.country,
          entry_id: c.entry_id
        })).filter(c => c.city_id && c.name);
        
        // Set the first city as the primary city for compatibility
        const city = {
          id: citiesData[0].cities.city_id,
          name: citiesData[0].cities.name,
          country: citiesData[0].cities.country
        };
        
        setFormData(prev => ({
          ...prev,
          city,
          cities // Add all cities data
        }));
      }
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          company_id,
          relationship,
          is_primary,
          companies:company_id(
            company_id,
            name,
            website,
            category,
            description,
            linkedin
          )
        `)
        .eq('contact_id', contactId);
      
      if (!companiesError && companiesData && companiesData.length > 0) {
        // Format all associated companies with their relationship information
        const associatedCompanies = companiesData.map(cc => ({
          contact_companies_id: cc.contact_companies_id,
          company_id: cc.company_id,
          relationship: cc.relationship,
          is_primary: cc.is_primary,
          name: cc.companies.name,
          website: cc.companies.website,
          category: cc.companies.category,
          description: cc.companies.description,
          linkedin: cc.companies.linkedin,
          tags: [], // Initialize empty tags array for each company
          newTag: '', // Field for adding new tags
          tagSuggestions: [] // Field for tag suggestions
        })).filter(c => c.company_id); // Filter out any without valid company_id
        
        // Set the first company as the primary company for compatibility
        const company = {
          id: companiesData[0].companies.company_id,
          name: companiesData[0].companies.name,
          website: companiesData[0].companies.website
        };
        
        setFormData(prev => ({
          ...prev,
          company,
          associatedCompanies  // Add all associated companies data
        }));
        
        // Fetch tags for each company and update formData
        const fetchTagsForCompanies = async () => {
          try {
            const updatedCompanies = [...associatedCompanies];
            
            // Fetch tags for each company in parallel
            const tagsPromises = updatedCompanies.map(async (company, index) => {
              if (company.company_id) {
                const companyTags = await fetchCompanyTags(company.company_id);
                return { index, tags: companyTags };
              }
              return { index, tags: [] };
            });
            
            const tagsResults = await Promise.all(tagsPromises);
            
            // Update each company with its tags
            tagsResults.forEach(result => {
              updatedCompanies[result.index].tags = result.tags;
            });
            
            // Update formData with companies that now have tags
            setFormData(prev => ({
              ...prev,
              associatedCompanies: updatedCompanies
            }));
          } catch (err) {
            console.error('Error fetching company tags:', err);
          }
        };
        
        fetchTagsForCompanies();
      } else {
        // Ensure we have an empty array for associatedCompanies
        setFormData(prev => ({
          ...prev,
          associatedCompanies: []
        }));
      }
    } catch (err) {
      console.error('Error loading contact details:', err);
    }
  };
  
  // Fetch data from external sources
  const fetchExternalData = async (contactData) => {
    try {
      console.log('Contact data in fetchExternalData:', contactData);
      
      // Initialize with empty data
      const externalData = {
        hubspot: {
          email: '',
          mobile: '',
          company: null,
          tags: [],
          notes: '',
          keepInTouch: null,
          category: null
        },
        supabase: {
          email: contactData.email || '',
          mobile: contactData.mobile || '',
          company: null,
          tags: [],
          notes: '',
          keepInTouch: contactData.keep_in_touch_frequency || null,
          category: contactData.category || null
        },
        airtable: {
          email: '',
          mobile: '',
          company: null,
          tags: [],
          notes: '',
          keepInTouch: null,
          category: null,
          firstName: '',
          lastName: ''
        }
      };
      
      // Add mock data temporarily for testing
      externalData.airtable = {
        email: 'test@airtable.com',
        mobile: '+1234567890',
        company: { id: 'at1', name: 'Test Airtable Company' },
        tags: ['Tag1', 'Tag2'],
        notes: 'Test notes from Airtable',
        keepInTouch: 'weekly',
        category: 'VIP',
        firstName: 'Test',
        lastName: 'User'
      };
      
      // We'll implement proper Airtable data fetching later
      
      // TODO: Add HubSpot data fetching if needed
      
      // Update the external sources state
      setExternalSources(externalData);
      
      // Force show Airtable source for debugging
      setShowSources(prev => ({
        ...prev,
        airtable: true
      }));
      
      console.log('Updated externalSources with:', externalData);
    } catch (error) {
      console.error('Error in fetchExternalData:', error);
    }
  };
  
  // Toggle showing external source data
  const toggleSource = (source) => {
    setShowSources(prev => ({
      ...prev,
      [source]: !prev[source]
    }));
  };
  
  // Handle navigating to a specific step
  const goToStep = (step) => {
    // When leaving the enrichment step (3), clear the saved section state
    if (currentStep === 3 && step !== 3) {
      sessionStorage.removeItem(`enrichment_section_${contactId}`);
      setActiveEnrichmentSection("basics"); // Reset to basics tab for next time
    }
    
    if (step < currentStep || step === currentStep) {
      setCurrentStep(step);
    } else if (step === 2 && currentStep === 1) {
      // Going from Interactions to duplicates
      setCurrentStep(2);
      searchForDuplicates();
    } else if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  };
  
  // Handle form input changes
  // Function to save basic contact information
const saveContactBasicInfo = async (contactId, basicInfo) => {
  if (!contactId) {
    console.error('No contact ID provided');
    toast.error('Cannot update contact: Missing ID');
    return { success: false, error: 'No contact ID provided' };
  }

  // Extract fields from basicInfo object
  const { 
    first_name, 
    last_name, 
    email, 
    mobile, 
    linkedin, 
    notes 
  } = basicInfo || {};

  // Create update object with only provided fields
  const updateData = {};
  if (first_name !== undefined) updateData.first_name = first_name;
  if (last_name !== undefined) updateData.last_name = last_name;
  if (email !== undefined) updateData.email = email;
  if (mobile !== undefined) updateData.mobile = mobile;
  if (linkedin !== undefined) updateData.linkedin = linkedin;
  if (notes !== undefined) updateData.notes = notes;

  // Skip update if no fields provided
  if (Object.keys(updateData).length === 0) {
    console.warn('No fields to update');
    return { success: true, data: null };
  }

  try {
    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('contact_id', contactId);

    if (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact information');
      return { success: false, error };
    }

    toast.success('Contact information updated');
    return { success: true, data };
  } catch (err) {
    console.error('Error in saveContactBasicInfo:', err);
    toast.error('An unexpected error occurred');
    return { success: false, error: err };
  }
};

const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Search for tag suggestions from the tags table
  const searchTagSuggestions = async (query) => {
    if (!query || query.length < 2) return;
    
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);
        
      if (error) {
        console.error('Error searching for tag suggestions:', error);
        return;
      }
      
      // Filter out tags that are already selected
      const filteredSuggestions = data.filter(tag => 
        !formData.tags?.some(t => t.tag_id === tag.tag_id)
      );
      
      handleInputChange('tagSuggestions', filteredSuggestions);
    } catch (err) {
      console.error('Error in searchTagSuggestions:', err);
    }
  };
  
  // Search for tag suggestions for a company
  const searchCompanyTagSuggestions = async (query, companyId, existingTags = []) => {
    if (!query || query.length < 2) return [];
    
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);
        
      if (error) {
        console.error('Error searching for company tag suggestions:', error);
        return [];
      }
      
      // Filter out tags that are already selected for this company
      const filteredSuggestions = data.filter(tag => 
        !existingTags.some(t => t.tag_id === tag.tag_id)
      );
      
      return filteredSuggestions;
    } catch (err) {
      console.error('Error in searchCompanyTagSuggestions:', err);
      return [];
    }
  };
  
  // Fetch tags for a company
  const fetchCompanyTags = async (companyId) => {
    if (!companyId) return [];
    
    try {
      const { data, error } = await supabase
        .from('company_tags')
        .select(`
          entry_id,
          tag_id,
          tags (
            tag_id,
            name
          )
        `)
        .eq('company_id', companyId);
        
      if (error) {
        console.error('Error fetching company tags:', error);
        return [];
      }
      
      // Format the data to be more usable
      return (data || []).map(item => ({
        entry_id: item.entry_id,
        tag_id: item.tag_id,
        name: item.tags?.name || 'Unknown'
      }));
      
      console.log('Fetched company tags:', data);
    } catch (err) {
      console.error('Error in fetchCompanyTags:', err);
      return [];
    }
  };
  
  // Add tag to a company
  const addTagToCompany = async (companyId, tagData) => {
    try {
      // Check if tag exists or needs to be created
      let tagId = tagData.tag_id;
      
      if (tagData.tag_id?.toString().startsWith('temp-')) {
        // First check if tag with this name already exists
        const { data: existingTag, error: existingError } = await supabase
          .from('tags')
          .select('tag_id')
          .eq('name', tagData.name)
          .maybeSingle();
          
        if (existingError) throw existingError;
        
        if (existingTag) {
          // Use existing tag
          tagId = existingTag.tag_id;
        } else {
          // Create new tag
          const { data: newTag, error: createError } = await supabase
            .from('tags')
            .insert({ name: tagData.name })
            .select('tag_id')
            .single();
            
          if (createError) throw createError;
          tagId = newTag.tag_id;
        }
      }
      
      // Check if association already exists
      const { data: existingAssociation, error: checkError } = await supabase
        .from('company_tags')
        .select('entry_id')
        .eq('company_id', companyId)
        .eq('tag_id', tagId)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      // Only create if it doesn't already exist
      if (!existingAssociation) {
        // Create association between company and tag
        const { error: linkError } = await supabase
          .from('company_tags')
          .insert({
            company_id: companyId,
            tag_id: tagId
          });
          
        if (linkError) throw linkError;
      }
      
      return true;
    } catch (err) {
      console.error('Error adding tag to company:', err);
      return false;
    }
  };
  
  // Remove tag from a company
  const removeTagFromCompany = async (entryId) => {
    try {
      const { error } = await supabase
        .from('company_tags')
        .delete()
        .eq('entry_id', entryId);
        
      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error('Error removing tag from company:', err);
      return false;
    }
  };
  
  // Search for city suggestions from the cities table
  const searchCities = async (query) => {
    if (!query || query.length < 2) return;
    
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('city_id, name, country')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);
        
      if (error) {
        console.error('Error searching for city suggestions:', error);
        return;
      }
      
      // Filter out cities that are already selected
      const filteredSuggestions = data.filter(city => 
        !formData.cities?.some(c => c.city_id === city.city_id)
      );
      
      handleInputChange('citySuggestions', filteredSuggestions);
    } catch (err) {
      console.error('Error in searchCities:', err);
    }
  };
  
  // Search for company suggestions from the companies table
  const searchCompanies = async (query) => {
    if (!query || query.length < 2) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, website, category')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);
        
      if (error) {
        console.error('Error searching for company suggestions:', error);
        return;
      }
      
      // Filter out companies that are already associated with this contact
      const filteredSuggestions = data.filter(company => 
        !formData.associatedCompanies?.some(c => c.company_id === company.company_id)
      );
      
      handleInputChange('companySuggestions', filteredSuggestions);
    } catch (err) {
      console.error('Error in searchCompanies:', err);
    }
  };
  
  // Find companies that match the contact's email domains
  const findCompaniesByEmailDomains = async () => {
    try {
      // Only proceed if we have emails in formData
      if (!formData.emails || formData.emails.length === 0) return;
      
      // Extract domains from the contact's email addresses
      const emailDomains = formData.emails
        .map(emailItem => {
          const email = emailItem.email || '';
          const match = email.match(/@([^@]+)$/);
          return match ? match[1] : null;
        })
        .filter(domain => domain)
        .filter((domain, index, self) => self.indexOf(domain) === index); // Remove duplicates
      
      if (emailDomains.length === 0) return;
      
      // Look for companies with matching website domains
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, website, category')
        .order('name');
        
      if (error) {
        console.error('Error searching for companies by domain:', error);
        return;
      }
      
      // Filter companies that match the email domains
      // and are not already associated with this contact
      const domainMatchedCompanies = data.filter(company => {
        if (!company.website) return false;
        
        // Clean up website URL to extract domain
        let websiteDomain = company.website;
        websiteDomain = websiteDomain.replace(/^https?:\/\//, '');
        websiteDomain = websiteDomain.replace(/^www\./, '');
        websiteDomain = websiteDomain.split('/')[0];
        
        return emailDomains.some(emailDomain => 
          websiteDomain.includes(emailDomain) || 
          emailDomain.includes(websiteDomain)
        ) && !formData.associatedCompanies?.some(c => 
          c.company_id === company.company_id
        );
      });
      
      // For email domains that don't have matching companies, suggest creating new ones
      const domainsWithNoMatch = emailDomains.filter(emailDomain => {
        // If no company website contains this email domain
        return !data.some(company => {
          if (!company.website) return false;
          
          let websiteDomain = company.website;
          websiteDomain = websiteDomain.replace(/^https?:\/\//, '');
          websiteDomain = websiteDomain.replace(/^www\./, '');
          websiteDomain = websiteDomain.split('/')[0];
          
          return websiteDomain.includes(emailDomain) || emailDomain.includes(websiteDomain);
        });
      });
      
      // Filter out common email providers where we wouldn't create a company
      const commonEmailProviders = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
        'aol.com', 'protonmail.com', 'mail.com', 'zoho.com', 'yandex.com',
        'gmx.com', 'live.com', 'me.com', 'inbox.com', 'fastmail.com'
      ];
      
      const newCompanySuggestions = domainsWithNoMatch
        .filter(domain => !commonEmailProviders.includes(domain))
        .map(domain => ({
          domain,
          suggestedName: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
          suggestedWebsite: `https://www.${domain}`
        }));
      
      handleInputChange('domainMatchedCompanies', domainMatchedCompanies);
      handleInputChange('newCompanySuggestions', newCompanySuggestions);
    } catch (err) {
      console.error('Error finding companies by email domains:', err);
    }
  };
  
  // Save contact enrichment changes
  const saveContactEnrichment = async () => {
    try {
      setLoading(true);
      
      // 1. Update base contact information
      const { error: contactError } = await supabase
        .from('contacts')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          keep_in_touch_frequency: formData.keepInTouch,
          category: formData.category,
          linkedin: formData.linkedIn,
          job_role: formData.jobRole || null,
          description: formData.description || null,
          score: formData.score || null,
          birthday: formData.birthday || null,
          last_modified_at: new Date()
        })
        .eq('contact_id', contactId);
      
      if (contactError) throw contactError;
      
      // 2. Handle email addresses - update, add, delete as needed
      // First get existing emails to compare
      const { data: existingEmails, error: emailsError } = await supabase
        .from('contact_emails')
        .select('*')
        .eq('contact_id', contactId);
      
      if (emailsError) throw emailsError;
      
      // Create tracking sets for operations
      const emailsToCreate = formData.emails.filter(e => e.email_id?.toString().startsWith('temp-'));
      const emailsToUpdate = formData.emails.filter(e => !e.email_id?.toString().startsWith('temp-'));
      const emailIdsToKeep = emailsToUpdate.map(e => e.email_id);
      const emailsToDelete = existingEmails?.filter(e => !emailIdsToKeep.includes(e.email_id)) || [];
      
      // Process each operation type
      for (const email of emailsToCreate) {
        await supabase
          .from('contact_emails')
          .insert({
            contact_id: contactId,
            email: email.email,
            type: email.type,
            is_primary: email.is_primary
          });
      }
      
      for (const email of emailsToUpdate) {
        await supabase
          .from('contact_emails')
          .update({
            email: email.email,
            type: email.type,
            is_primary: email.is_primary
          })
          .eq('email_id', email.email_id);
      }
      
      for (const email of emailsToDelete) {
        await supabase
          .from('contact_emails')
          .delete()
          .eq('email_id', email.email_id);
      }
      
      // 3. Handle mobile numbers - update, add, delete as needed
      // First get existing mobiles to compare
      const { data: existingMobiles, error: mobilesError } = await supabase
        .from('contact_mobiles')
        .select('*')
        .eq('contact_id', contactId);
      
      if (mobilesError) throw mobilesError;
      
      // Create tracking sets for operations
      const mobilesToCreate = formData.mobiles.filter(m => m.mobile_id?.toString().startsWith('temp-'));
      const mobilesToUpdate = formData.mobiles.filter(m => !m.mobile_id?.toString().startsWith('temp-'));
      const mobileIdsToKeep = mobilesToUpdate.map(m => m.mobile_id);
      const mobilesToDelete = existingMobiles?.filter(m => !mobileIdsToKeep.includes(m.mobile_id)) || [];
      
      // Process each operation type
      for (const mobile of mobilesToCreate) {
        await supabase
          .from('contact_mobiles')
          .insert({
            contact_id: contactId,
            mobile: mobile.mobile,
            type: mobile.type,
            is_primary: mobile.is_primary
          });
      }
      
      for (const mobile of mobilesToUpdate) {
        await supabase
          .from('contact_mobiles')
          .update({
            mobile: mobile.mobile,
            type: mobile.type,
            is_primary: mobile.is_primary
          })
          .eq('mobile_id', mobile.mobile_id);
      }
      
      for (const mobile of mobilesToDelete) {
        await supabase
          .from('contact_mobiles')
          .delete()
          .eq('mobile_id', mobile.mobile_id);
      }
      
      // 4. Handle tags - we need to first get existing tags
      const { data: existingContactTags, error: tagsError } = await supabase
        .from('contact_tags')
        .select('entry_id, tag_id')
        .eq('contact_id', contactId);
      
      if (tagsError) throw tagsError;
      
      // Find which tags are new (need to be added)
      const existingTagIds = existingContactTags?.map(t => t.tag_id) || [];
      const newTags = formData.tags.filter(t => 
        !existingTagIds.includes(t.tag_id) && !t.tag_id?.toString().startsWith('temp-')
      );
      
      // Find which tags need to be created in the tags table and then linked
      const tagsToCreate = formData.tags.filter(t => t.tag_id?.toString().startsWith('temp-'));
      
      // Find which existing tags need to be removed
      const tagsToKeep = formData.tags
        .filter(t => !t.tag_id?.toString().startsWith('temp-'))
        .map(t => t.tag_id);
      const tagsToRemove = existingContactTags?.filter(t => !tagsToKeep.includes(t.tag_id)) || [];
      
      // Process tag operations
      // First create any new tags
      for (const tag of tagsToCreate) {
        // First create the tag if it doesn't exist
        const { data: newTag, error: newTagError } = await supabase
          .from('tags')
          .select('tag_id')
          .eq('name', tag.name)
          .maybeSingle();
        
        let tagId;
        
        if (newTagError) throw newTagError;
        
        // If tag doesn't exist, create it
        if (!newTag) {
          const { data: insertedTag, error: insertTagError } = await supabase
            .from('tags')
            .insert({ name: tag.name })
            .select('tag_id')
            .single();
          
          if (insertTagError) throw insertTagError;
          tagId = insertedTag.tag_id;
        } else {
          tagId = newTag.tag_id;
        }
        
        // Now link it to the contact
        const { error: linkError } = await supabase
          .from('contact_tags')
          .insert({
            contact_id: contactId,
            tag_id: tagId
          });
        
        if (linkError) throw linkError;
      }
      
      // Add new existing tags
      for (const tag of newTags) {
        const { error: linkError } = await supabase
          .from('contact_tags')
          .insert({
            contact_id: contactId,
            tag_id: tag.tag_id
          });
        
        if (linkError) throw linkError;
      }
      
      // Remove tags that are no longer associated
      for (const tag of tagsToRemove) {
        const { error: removeError } = await supabase
          .from('contact_tags')
          .delete()
          .eq('entry_id', tag.entry_id);
        
        if (removeError) throw removeError;
      }
      
      // 5. Handle cities - similar to tags
      // First get existing city relations
      const { data: existingContactCities, error: citiesError } = await supabase
        .from('contact_cities')
        .select('entry_id, city_id')
        .eq('contact_id', contactId);
      
      if (citiesError) throw citiesError;
      
      if (formData.cities && formData.cities.length > 0) {
        // Find which cities are new (need to be added)
        const existingCityIds = existingContactCities?.map(c => c.city_id) || [];
        const newCities = formData.cities.filter(c => 
          !existingCityIds.includes(c.city_id) && !c.city_id?.toString().startsWith('temp-')
        );
        
        // Find which cities need to be created in the cities table and then linked
        const citiesToCreate = formData.cities.filter(c => c.city_id?.toString().startsWith('temp-'));
        
        // Find which existing cities need to be removed
        const citiesToKeep = formData.cities
          .filter(c => !c.city_id?.toString().startsWith('temp-'))
          .map(c => c.city_id);
        const citiesToRemove = existingContactCities?.filter(c => !citiesToKeep.includes(c.city_id)) || [];
        
        // Process city operations
        // First create any new cities
        for (const city of citiesToCreate) {
          // First create the city if it doesn't exist
          const { data: newCity, error: newCityError } = await supabase
            .from('cities')
            .select('city_id')
            .eq('name', city.name)
            .maybeSingle();
          
          let cityId;
          
          if (newCityError) throw newCityError;
          
          // If city doesn't exist, create it
          if (!newCity) {
            const { data: insertedCity, error: insertCityError } = await supabase
              .from('cities')
              .insert({ 
                name: city.name,
                country: city.country || 'Unknown' 
              })
              .select('city_id')
              .single();
            
            if (insertCityError) throw insertCityError;
            cityId = insertedCity.city_id;
          } else {
            cityId = newCity.city_id;
          }
          
          // Now link it to the contact
          const { error: linkError } = await supabase
            .from('contact_cities')
            .insert({
              contact_id: contactId,
              city_id: cityId
            });
          
          if (linkError) throw linkError;
        }
        
        // Add new existing cities
        for (const city of newCities) {
          const { error: linkError } = await supabase
            .from('contact_cities')
            .insert({
              contact_id: contactId,
              city_id: city.city_id
            });
          
          if (linkError) throw linkError;
        }
        
        // Remove cities that are no longer associated
        for (const city of citiesToRemove) {
          const { error: removeError } = await supabase
            .from('contact_cities')
            .delete()
            .eq('entry_id', city.entry_id);
          
          if (removeError) throw removeError;
        }
      } else {
        // If no cities in formData, remove all existing city associations
        for (const city of existingContactCities || []) {
          const { error: removeError } = await supabase
            .from('contact_cities')
            .delete()
            .eq('entry_id', city.entry_id);
            
          if (removeError) throw removeError;
        }
      }
      
      // 5.5 Handle company associations - similar to tags and cities
      // First get existing company relations
      const { data: existingContactCompanies, error: companiesError } = await supabase
        .from('contact_companies')
        .select('contact_companies_id, company_id, relationship, is_primary')
        .eq('contact_id', contactId);
      
      if (companiesError) throw companiesError;
      
      if (formData.associatedCompanies && formData.associatedCompanies.length > 0) {
        // Find which company associations are new (need to be added)
        const existingCompanyIds = existingContactCompanies?.map(c => c.company_id) || [];
        const newCompanies = formData.associatedCompanies.filter(c => 
          !existingCompanyIds.includes(c.company_id) && c.company_id
        );
        
        // Find which existing company associations need to be updated (relationship or is_primary changed)
        const companiesToUpdate = formData.associatedCompanies.filter(c => 
          existingCompanyIds.includes(c.company_id) &&
          existingContactCompanies.some(ec => 
            ec.company_id === c.company_id && 
            (ec.relationship !== c.relationship || ec.is_primary !== c.is_primary)
          )
        );
        
        // Find which existing company associations need to be removed
        const companyIdsToKeep = formData.associatedCompanies
          .filter(c => c.company_id)
          .map(c => c.company_id);
        const companiesToRemove = existingContactCompanies?.filter(c => !companyIdsToKeep.includes(c.company_id)) || [];
        
        // Process company operations
        // Add new company associations
        for (const company of newCompanies) {
          // Ensure relationship is one of the valid enum values
          const validRelationships = ['employee', 'founder', 'advisor', 'manager', 'investor', 'other', 'not_set'];
          const relationship = validRelationships.includes(company.relationship) 
            ? company.relationship 
            : 'not_set';
            
          const { error: linkError } = await supabase
            .from('contact_companies')
            .insert({
              contact_id: contactId,
              company_id: company.company_id,
              relationship: relationship,
              is_primary: company.is_primary || false
            });
          
          if (linkError) throw linkError;
        }
        
        // Update existing company associations
        for (const company of companiesToUpdate) {
          const existingCompany = existingContactCompanies.find(ec => ec.company_id === company.company_id);
          if (existingCompany) {
            // Ensure relationship is one of the valid enum values
            const validRelationships = ['employee', 'founder', 'advisor', 'manager', 'investor', 'other', 'not_set'];
            const relationship = validRelationships.includes(company.relationship) 
              ? company.relationship 
              : 'not_set';
              
            const { error: updateError } = await supabase
              .from('contact_companies')
              .update({
                relationship: relationship,
                is_primary: company.is_primary || false
              })
              .eq('contact_companies_id', existingCompany.contact_companies_id);
            
            if (updateError) throw updateError;
          }
        }
        
        // Remove company associations that are no longer needed
        for (const company of companiesToRemove) {
          const { error: removeError } = await supabase
            .from('contact_companies')
            .delete()
            .eq('contact_companies_id', company.contact_companies_id);
          
          if (removeError) throw removeError;
        }
      } else {
        // If no companies in formData, remove all existing company associations
        for (const company of existingContactCompanies || []) {
          const { error: removeError } = await supabase
            .from('contact_companies')
            .delete()
            .eq('contact_companies_id', company.contact_companies_id);
            
          if (removeError) throw removeError;
        }
      }
      
      // 6. Reload contact data
      await loadContactData();
      toast.success('Contact information saved successfully');
      setLoading(false);
      
      return true;
    } catch (err) {
      console.error('Error saving contact enrichment:', err);
      toast.error('Failed to save contact information');
      setLoading(false);
      return false;
    }
  };
  
  // Calculate string similarity between two strings (from ContactIntegrity)
  const calculateStringSimilarity = (str1, str2) => {
    // Return perfect match for identical strings
    if (str1 === str2) return 1.0;
    
    // Return no match for empty strings
    if (!str1 || !str2) return 0.0;
    
    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Early return for matching strings after normalization
    if (s1 === s2) return 1.0;
    
    // For short strings, use basic matching
    if (s1.length < 3 || s2.length < 3) {
      return s1.includes(s2) || s2.includes(s1) ? 0.9 : 0;
    }
    
    // For longer strings, use Levenshtein distance calculation via stringSimilarity
    return stringSimilarity(s1, s2);
  };
  
  // Search for duplicates by name (dedicated search function)
  const searchNameDuplicates = async () => {
    if (!contact || (!contact.first_name && !contact.last_name)) {
      return [];
    }
    
    try {
      // Search by name with a broader initial filter
      let potentialMatches = [];
      
      // Build a query based on available names
      let nameQuery = supabase
        .from('contacts')
        .select('*');
      
      if (contact.first_name && contact.last_name) {
        // Get contacts with similar first OR last name for initial filtering
        nameQuery = nameQuery.or(
          `first_name.ilike.%${contact.first_name}%,last_name.ilike.%${contact.last_name}%`
        );
      } else if (contact.first_name) {
        nameQuery = nameQuery.ilike('first_name', `%${contact.first_name}%`);
      } else if (contact.last_name) {
        nameQuery = nameQuery.ilike('last_name', `%${contact.last_name}%`);
      }
      
      // Exclude the current contact
      nameQuery = nameQuery.neq('contact_id', contact.contact_id);
      
      const { data: nameData, error } = await nameQuery;
      
      if (error) throw error;
      potentialMatches = nameData || [];
      
      // Apply more precise similarity matching (80% threshold)
      const similarMatches = potentialMatches.filter(match => {
        const firstNameSimilarity = calculateStringSimilarity(
          contact.first_name || '', 
          match.first_name || ''
        );
        
        const lastNameSimilarity = calculateStringSimilarity(
          contact.last_name || '', 
          match.last_name || ''
        );
        
        // High threshold for similarity (0.8 = 80%)
        const SIMILARITY_THRESHOLD = 0.8;
        
        // Match if both names are highly similar
        if (contact.first_name && contact.last_name && match.first_name && match.last_name) {
          return firstNameSimilarity >= SIMILARITY_THRESHOLD && lastNameSimilarity >= SIMILARITY_THRESHOLD;
        }
        
        // Match if one name is very highly similar (when only one name is available)
        if ((contact.first_name && match.first_name && !contact.last_name) || 
            (!contact.first_name && contact.last_name && match.last_name)) {
          return firstNameSimilarity >= SIMILARITY_THRESHOLD || lastNameSimilarity >= SIMILARITY_THRESHOLD;
        }
        
        // If comparing mixed patterns (one has first name only, other has last name only)
        // Check if either combination has high similarity
        return firstNameSimilarity >= SIMILARITY_THRESHOLD || lastNameSimilarity >= SIMILARITY_THRESHOLD;
      });
      
      // Add a "matched on" property for display
      let matches = similarMatches.map(match => ({
        ...match,
        matched_on: 'Name similarity'
      }));
      
      // For each match, check if we need to load email and mobile fields
      for (const match of matches) {
        // Load email if not present
        if (!match.email) {
          const { data: emailData } = await supabase
            .from('contact_emails')
            .select('email')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (emailData && emailData.length > 0) {
            match.email = emailData[0].email;
          }
        }
        
        // Load mobile if not present
        if (!match.mobile) {
          const { data: mobileData } = await supabase
            .from('contact_mobiles')
            .select('mobile')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (mobileData && mobileData.length > 0) {
            match.mobile = mobileData[0].mobile;
          }
        }
      }
      
      return matches;
      
    } catch (err) {
      console.error('Error searching by name:', err);
      return [];
    }
  };
  
  // Search for duplicates by email (dedicated search function)
  const searchEmailDuplicates = async () => {
    if (!contact || !contact.email) {
      return [];
    }
    
    try {
      // Search for contacts with matching email
      const { data, error } = await supabase
        .from('contact_emails')
        .select(`
          email,
          contact_id,
          contacts (*)
        `)
        .eq('email', contact.email)
        .neq('contact_id', contact.contact_id);
      
      if (error) throw error;
      
      // Format the results
      const matches = [];
      const seenIds = new Set();
      
      if (data) {
        data.forEach(match => {
          if (match.contacts && match.contact_id && !seenIds.has(match.contact_id)) {
            seenIds.add(match.contact_id);
            matches.push({
              ...match.contacts,
              matched_on: `Email: ${match.email}`
            });
          }
        });
      }
      
      // For each match, check if we need to load email and mobile fields
      for (const match of matches) {
        // Load email if not present
        if (!match.email) {
          match.email = contact.email; // Using the matching email
        }
        
        // Load mobile if not present
        if (!match.mobile) {
          const { data: mobileData } = await supabase
            .from('contact_mobiles')
            .select('mobile')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (mobileData && mobileData.length > 0) {
            match.mobile = mobileData[0].mobile;
          }
        }
      }
      
      return matches;
      
    } catch (err) {
      console.error('Error searching by email:', err);
      return [];
    }
  };
  
  // Search for duplicates by mobile (dedicated search function)
  const searchMobileDuplicates = async () => {
    if (!contact || !contact.mobile) {
      return [];
    }
    
    try {
      // Search for contacts with matching mobile
      const { data, error } = await supabase
        .from('contact_mobiles')
        .select(`
          mobile,
          contact_id,
          contacts (*)
        `)
        .eq('mobile', contact.mobile)
        .neq('contact_id', contact.contact_id);
      
      if (error) throw error;
      
      // Format the results
      const matches = [];
      const seenIds = new Set();
      
      if (data) {
        data.forEach(match => {
          if (match.contacts && match.contact_id && !seenIds.has(match.contact_id)) {
            seenIds.add(match.contact_id);
            matches.push({
              ...match.contacts,
              matched_on: `Mobile: ${match.mobile}`
            });
          }
        });
      }
      
      // For each match, check if we need to load email and mobile fields
      for (const match of matches) {
        // Load mobile if not present
        if (!match.mobile) {
          match.mobile = contact.mobile; // Using the matching mobile
        }
        
        // Load email if not present
        if (!match.email) {
          const { data: emailData } = await supabase
            .from('contact_emails')
            .select('email')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (emailData && emailData.length > 0) {
            match.email = emailData[0].email;
          }
        }
      }
      
      return matches;
      
    } catch (err) {
      console.error('Error searching by mobile:', err);
      return [];
    }
  };

  // Search for potential duplicates - comprehensive approach from ContactIntegrity
  const searchForDuplicates = async () => {
    if (!contact) return;
    
    setDuplicates([]);
    setSelectedDuplicate(null);
    setLoading(true);
    
    try {
      // 1. Search for email matches (more exact)
      let emailMatches = [];
      if (contact.email) {
        const { data, error } = await supabase
          .from('contact_emails')
          .select(`
            email,
            contact_id,
            contacts (*)
          `)
          .eq('email', contact.email)
          .neq('contact_id', contact.contact_id);
          
        if (!error && data) {
          // Format the results
          const seenIds = new Set();
          data.forEach(match => {
            if (match.contacts && match.contact_id && !seenIds.has(match.contact_id)) {
              seenIds.add(match.contact_id);
              emailMatches.push({
                ...match.contacts,
                matched_on: `Email: ${match.email}`
              });
            }
          });
        }
      }
      
      // 2. Search for mobile matches (more exact)
      let mobileMatches = [];
      if (contact.mobile) {
        const { data, error } = await supabase
          .from('contact_mobiles')
          .select(`
            mobile,
            contact_id,
            contacts (*)
          `)
          .eq('mobile', contact.mobile)
          .neq('contact_id', contact.contact_id);
          
        if (!error && data) {
          // Format the results
          const seenIds = new Set();
          data.forEach(match => {
            if (match.contacts && match.contact_id && !seenIds.has(match.contact_id)) {
              seenIds.add(match.contact_id);
              mobileMatches.push({
                ...match.contacts,
                matched_on: `Mobile: ${match.mobile}`
              });
            }
          });
        }
      }
      
      // 3. Search by name with similarity matching
      let nameMatches = [];
      if (contact.first_name || contact.last_name) {
        // Get potential matches by name (broad search first)
        let nameQuery = supabase
          .from('contacts')
          .select('*');
        
        if (contact.first_name && contact.last_name) {
          // Search for either first or last name match
          nameQuery = nameQuery.or(
            `first_name.ilike.%${contact.first_name}%,last_name.ilike.%${contact.last_name}%`
          );
        } else if (contact.first_name) {
          nameQuery = nameQuery.ilike('first_name', `%${contact.first_name}%`);
        } else if (contact.last_name) {
          nameQuery = nameQuery.ilike('last_name', `%${contact.last_name}%`);
        }
        
        // Exclude current contact
        nameQuery = nameQuery.neq('contact_id', contact.contact_id);
        
        const { data: potentialMatches, error } = await nameQuery;
        
        if (!error && potentialMatches) {
          // Apply more precise similarity matching (80% threshold)
          const SIMILARITY_THRESHOLD = 0.8;
          
          nameMatches = potentialMatches.filter(match => {
            const firstNameSimilarity = calculateStringSimilarity(
              contact.first_name || '', 
              match.first_name || ''
            );
            
            const lastNameSimilarity = calculateStringSimilarity(
              contact.last_name || '', 
              match.last_name || ''
            );
            
            // Match if both names are similar
            if (contact.first_name && contact.last_name && match.first_name && match.last_name) {
              return firstNameSimilarity >= SIMILARITY_THRESHOLD && lastNameSimilarity >= SIMILARITY_THRESHOLD;
            }
            
            // For partial name matching
            return firstNameSimilarity >= SIMILARITY_THRESHOLD || lastNameSimilarity >= SIMILARITY_THRESHOLD;
          }).map(match => ({
            ...match,
            matched_on: 'Name similarity'
          }));
        }
      }
      
      // Combine all matches, preserving the 'matched_on' property
      const allMatches = [...emailMatches, ...mobileMatches, ...nameMatches];
      
      // Remove duplicates while preserving the original object properties
      const uniqueMatches = [];
      const seenIds = new Set();
      
      allMatches.forEach(match => {
        if (!seenIds.has(match.contact_id)) {
          seenIds.add(match.contact_id);
          uniqueMatches.push(match);
        }
      });
      
      // For each match, check if we need to load email and mobile fields
      for (const match of uniqueMatches) {
        // Load email if not present
        if (!match.email) {
          const { data: emailData } = await supabase
            .from('contact_emails')
            .select('email')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (emailData && emailData.length > 0) {
            match.email = emailData[0].email;
          }
        }
        
        // Load mobile if not present
        if (!match.mobile) {
          const { data: mobileData } = await supabase
            .from('contact_mobiles')
            .select('mobile')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (mobileData && mobileData.length > 0) {
            match.mobile = mobileData[0].mobile;
          }
        }
      }
      
      // Set the final list of duplicates
      setDuplicates(uniqueMatches);
      
    } catch (err) {
      console.error('Error searching for duplicates:', err);
      setError('Failed to search for duplicates. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle selecting a duplicate contact
  const handleSelectDuplicate = (duplicate) => {
    // Clear any active enrichment section when selecting a duplicate
    if (activeEnrichmentSection === "airtable" || activeEnrichmentSection === "airtable_combining") {
      setActiveEnrichmentSection(null);
      // Also remove from sessionStorage to avoid persisting null value
      sessionStorage.removeItem(`enrichment_section_${contactId}`);
    }
    setSelectedDuplicate(selectedDuplicate?.contact_id === duplicate.contact_id ? null : duplicate);
  };
  
  // Handle deleting a duplicate contact
  const handleDeleteDuplicate = async (duplicateId, event) => {
    event.stopPropagation(); // Prevent triggering the parent click event
    
    if (!duplicateId) return;
    
    setDeletingContact(true);
    try {
      // Show a confirmation dialog using toast
      if (!window.confirm(`Are you sure you want to completely delete this contact? This action cannot be undone.`)) {
        setDeletingContact(false);
        return;
      }
      
      // Delete all related records in junction tables first
      const junctionTables = [
        'contact_emails', 
        'contact_mobiles', 
        'contact_tags', 
        'contact_cities',
        'contact_companies',
        'notes_contacts'
      ];
      
      // Delete from all junction tables first
      for (const table of junctionTables) {
        await supabase
          .from(table)
          .delete()
          .eq('contact_id', duplicateId);
      }
      
      // Delete the actual contact
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', duplicateId);
      
      if (error) throw error;
      
      // Remove the contact from the duplicates list
      setDuplicates(prev => prev.filter(d => d.contact_id !== duplicateId));
      
      // If the deleted contact was selected, clear the selection
      if (selectedDuplicate?.contact_id === duplicateId) {
        setSelectedDuplicate(null);
      }
      
      toast.success('Contact deleted successfully');
    } catch (err) {
      console.error('Error deleting contact:', err);
      toast.error(`Failed to delete contact: ${err.message || 'Unknown error'}`);
    } finally {
      setDeletingContact(false);
    }
  };
  
  // Handle merge selection changes
  const handleMergeSelectionChange = (field, value) => {
    setMergeSelections(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Initialize merge selections for contact merging
  const initializeMergeSelections = (duplicate) => {
    if (!duplicate) return;
    
    // Create initial merge selections with current contact as default
    const initialSelections = {
      first_name: 'current',
      last_name: 'current',
      category: 'current',
      job_role: 'current',
      linkedin: 'current',
      description: 'current',
      score: 'current',
      keep_in_touch_frequency: 'current',
      // For collections, we'll use combine by default
      emails: 'combine',
      mobiles: 'combine',
      tags: 'combine',
      cities: 'combine',
      companies: 'combine'
    };
    
    // Check if duplicate has better/more data for fields
    if (!contact.first_name && duplicate.first_name) initialSelections.first_name = 'duplicate';
    if (!contact.last_name && duplicate.last_name) initialSelections.last_name = 'duplicate';
    if (contact.category === 'Inbox' && duplicate.category !== 'Inbox') initialSelections.category = 'duplicate';
    if (!contact.job_role && duplicate.job_role) initialSelections.job_role = 'duplicate';
    if (!contact.linkedin && duplicate.linkedin) initialSelections.linkedin = 'duplicate';
    if (!contact.description && duplicate.description) initialSelections.description = 'duplicate';
    if ((contact.score === null || contact.score === undefined) && duplicate.score !== null) initialSelections.score = 'duplicate';
    if (!contact.keep_in_touch_frequency && duplicate.keep_in_touch_frequency) initialSelections.keep_in_touch_frequency = 'duplicate';
    
    return initialSelections;
  };
  
  // Handle merging with selected duplicate
  const handleMergeWithDuplicate = async () => {
    if (!contact || !selectedDuplicate) return;
    
    setLoading(true);
    try {
      // Create a complete snapshot of the duplicate contact and its related data
      const duplicateSnapshot = {
        contact: selectedDuplicate,
        // Include related data if available, use empty arrays as fallbacks
        emails: [],
        mobiles: [],
        tags: [],
        cities: [],
        companies: []
      };
      
      // First check if we need to get emails for the duplicate
      if (!selectedDuplicate.email) {
        const { data: emailData } = await supabase
          .from('contact_emails')
          .select('email_id, email, is_primary, type')
          .eq('contact_id', selectedDuplicate.contact_id);
          
        if (emailData && emailData.length > 0) {
          duplicateSnapshot.emails = emailData;
        }
      } else {
        // Create a simple entry from the existing email
        duplicateSnapshot.emails = [{
          email: selectedDuplicate.email,
          is_primary: true,
          type: 'personal'
        }];
      }
      
      // Get mobiles if needed
      if (!selectedDuplicate.mobile) {
        const { data: mobileData } = await supabase
          .from('contact_mobiles')
          .select('mobile_id, mobile, is_primary, type')
          .eq('contact_id', selectedDuplicate.contact_id);
          
        if (mobileData && mobileData.length > 0) {
          duplicateSnapshot.mobiles = mobileData;
        }
      } else {
        // Create a simple entry from the existing mobile
        duplicateSnapshot.mobiles = [{
          mobile: selectedDuplicate.mobile,
          is_primary: true,
          type: 'personal'
        }];
      }
      
      // Get tags, cities, and companies for the duplicate
      const [tagsResult, citiesResult, companiesResult] = await Promise.all([
        // Get tags
        supabase
          .from('contact_tags')
          .select('tags:tag_id(tag_id, name)')
          .eq('contact_id', selectedDuplicate.contact_id),
          
        // Get cities
        supabase
          .from('contact_cities')
          .select('cities:city_id(city_id, name, country)')
          .eq('contact_id', selectedDuplicate.contact_id),
          
        // Get companies
        supabase
          .from('contact_companies')
          .select('companies:company_id(company_id, name, website), relationship, is_primary')
          .eq('contact_id', selectedDuplicate.contact_id)
      ]);
      
      // Process results into the snapshot
      if (tagsResult.data) {
        duplicateSnapshot.tags = tagsResult.data.map(t => t.tags).filter(Boolean);
      }
      
      if (citiesResult.data) {
        duplicateSnapshot.cities = citiesResult.data.map(c => c.cities).filter(Boolean);
      }
      
      if (companiesResult.data) {
        duplicateSnapshot.companies = companiesResult.data;
      }
      
      // Initialize merge selections
      const mergeSelections = initializeMergeSelections(selectedDuplicate);
      
      // Get primary email/mobile for display
      const primaryEmail = duplicateSnapshot.emails.find(e => e.is_primary)?.email || 
                         duplicateSnapshot.emails[0]?.email ||
                         selectedDuplicate.email || '';
                         
      const primaryMobile = duplicateSnapshot.mobiles.find(m => m.is_primary)?.mobile || 
                          duplicateSnapshot.mobiles[0]?.mobile || 
                          selectedDuplicate.mobile || '';
      
      // Create a record in the contact_duplicates table to trigger the merge
      const { data: duplicateRecord, error: duplicateError } = await supabase
        .from('contact_duplicates')
        .insert({
          primary_contact_id: selectedDuplicate.contact_id,
          duplicate_contact_id: contact.contact_id,
          mobile_number: primaryMobile,
          email: primaryEmail,
          detected_at: new Date().toISOString(),
          status: 'pending',
          notes: 'Manually merged via Contact CRM workflow',
          merge_selections: mergeSelections,
          duplicate_data: duplicateSnapshot,
          start_trigger: true // Set trigger to start the merge process
        })
        .select()
        .single();
      
      if (duplicateError) throw duplicateError;
      
      if (!duplicateRecord) throw new Error('Failed to create merge record');
      
      // Show success message
      toast.success('Merge request submitted. The system will process it shortly.');
      
      // Check the status of the merge periodically
      const checkMergeStatus = async (duplicateId) => {
        // Wait a moment to let the database process the merge
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: statusData, error: statusError } = await supabase
          .from('contact_duplicates')
          .select('status, error_message')
          .eq('duplicate_id', duplicateId)
          .single();
          
        if (statusError) {
          console.error('Error checking merge status:', statusError);
          return;
        }
        
        if (statusData.status === 'completed') {
          toast.success('Contacts successfully merged!');
        } else if (statusData.status === 'failed') {
          toast.error(`Merge failed: ${statusData.error_message || 'Unknown error'}`);
        } else if (['pending', 'processing'].includes(statusData.status)) {
          // Still processing, check again in a few seconds (up to 5 attempts)
          setTimeout(() => checkMergeStatus(duplicateId), 2000);
        }
      };
      
      // Mark original contact as "Merged" since it will be kept as a record
      await supabase
        .from('contacts')
        .update({ category: 'Merged' })
        .eq('contact_id', contact.contact_id);
      
      // Start checking for the merge status
      checkMergeStatus(duplicateRecord.duplicate_id);
      
      // Return to inbox
      navigate('/contacts/inbox');
    } catch (err) {
      console.error('Error merging contacts:', err);
      setError(`Failed to merge contacts: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // Handler for checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSelectedItems(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle confirm delete (same as in ContactsInbox)
  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Add email to emails_spam table if selected and email exists
      if (selectedItems.addToSpam && contactToDelete.email) {
        const { error: spamError } = await supabase
          .from('emails_spam')
          .insert([{ 
            email: contactToDelete.email,
            counter: 1
          }]);
        
        if (spamError) {
          console.error('Error adding to spam list:', spamError);
        }
      }
      
      // Add mobile to whatsapp_spam table if selected and mobile exists
      if (selectedItems.addMobileToSpam && contactToDelete.mobile) {
        const { error: whatsappSpamError } = await supabase
          .from('whatsapp_spam')
          .insert([{ 
            mobile_number: contactToDelete.mobile,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString()
          }]);
        
        if (whatsappSpamError) {
          console.error('Error adding to WhatsApp spam list:', whatsappSpamError);
        }
      }
      
      // Delete associated records based on selections
      const promises = [];
      
      // 1. Delete chat records if selected
      if (selectedItems.deleteChat && associatedData.chatCount > 0) {
        promises.push(
          supabase
            .from('chat')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 2. Delete interaction records if selected
      if (selectedItems.deleteInteractions && associatedData.interactionsCount > 0) {
        promises.push(
          supabase
            .from('interactions')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 3. Delete emails and associated records if selected
      if (selectedItems.deleteEmails && associatedData.emailsCount > 0) {
        // First get all email IDs
        const { data: emailsData } = await supabase
          .from('emails')
          .select('email_id')
          .eq('sender_contact_id', contactToDelete.contact_id);
        
        if (emailsData && emailsData.length > 0) {
          const emailIds = emailsData.map(e => e.email_id);
          
          // Delete email participants
          promises.push(
            supabase
              .from('email_participants')
              .delete()
              .in('email_id', emailIds)
          );
          
          // Delete emails
          promises.push(
            supabase
              .from('emails')
              .delete()
              .eq('sender_contact_id', contactToDelete.contact_id)
          );
        }
      }

      // 4. Delete email threads if selected
      if (selectedItems.deleteEmailThreads && associatedData.emailThreadsCount > 0) {
        promises.push(
          supabase
            .from('contact_email_threads')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 5. Delete contact emails if selected
      if (selectedItems.deleteContactEmails && associatedData.contactEmailsCount > 0) {
        promises.push(
          supabase
            .from('contact_emails')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 6. Delete contact mobiles if selected
      if (selectedItems.deleteContactMobiles && associatedData.contactMobilesCount > 0) {
        promises.push(
          supabase
            .from('contact_mobiles')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 7. Delete note relationships if selected
      if (selectedItems.deleteNotes && associatedData.notesCount > 0) {
        promises.push(
          supabase
            .from('notes_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 8. Delete attachments if selected
      if (selectedItems.deleteAttachments && associatedData.attachmentsCount > 0) {
        promises.push(
          supabase
            .from('attachments')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 9. Delete tags if selected
      if (selectedItems.deleteTags && associatedData.tagsCount > 0) {
        promises.push(
          supabase
            .from('contact_tags')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 10. Delete cities if selected
      if (selectedItems.deleteCities && associatedData.citiesCount > 0) {
        promises.push(
          supabase
            .from('contact_cities')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 11. Delete companies if selected
      if (selectedItems.deleteCompanies && associatedData.companiesCount > 0) {
        promises.push(
          supabase
            .from('contact_companies')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 12. Delete contact chats if selected
      if (selectedItems.deleteContactChats && associatedData.contactChatsCount > 0) {
        promises.push(
          supabase
            .from('contact_chats')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 13. Delete deals if selected
      if (selectedItems.deleteDeals && associatedData.dealsCount > 0) {
        promises.push(
          supabase
            .from('deals_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 14. Delete meetings if selected
      if (selectedItems.deleteMeetings && associatedData.meetingsCount > 0) {
        promises.push(
          supabase
            .from('meeting_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 15. Delete investments if selected
      if (selectedItems.deleteInvestments && associatedData.investmentsCount > 0) {
        promises.push(
          supabase
            .from('investments_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // 16. Delete keep in touch if selected
      if (selectedItems.deleteKit && associatedData.kitCount > 0) {
        promises.push(
          supabase
            .from('keep_in_touch')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }
      
      // Execute all delete operations in parallel
      await Promise.all(promises);
      
      // Finally, delete the contact
      const { error: contactError } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactToDelete.contact_id);
      
      if (contactError) throw contactError;
      
      // Reset and close modal
      setDeleteModalOpen(false);
      setContactToDelete(null);
      setIsDeleting(false);
      
      // Return to inbox
      toast.success('Contact successfully deleted');
      navigate('/contacts/inbox');
      
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(`Failed to delete contact: ${err.message || 'Unknown error'}`);
      setIsDeleting(false);
    }
  };
  
  // Handle marking as spam or skip
  const handleCategorize = async (category) => {
    if (!contact) return;
    
    if (category === 'Spam') {
      // For Spam, open the same deletion modal as in ContactsInbox
      setContactToDelete(contact);
      
      try {
        // Get counts of associated records and last interaction details
        const [
          chatResult,
          contactChatsResult,
          interactionsResult, 
          emailsResult,
          emailParticipantsResult,
          emailThreadsResult,
          tagsResult,
          citiesResult,
          companiesResult,
          notesResult,
          attachmentsResult,
          contactEmailsResult,
          contactMobilesResult,
          dealsResult,
          meetingsResult,
          investmentsResult,
          kitResult,
          lastInteractionResult
        ] = await Promise.all([
          // Get chat count
          supabase
            .from('chat')
            .select('id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
          
          // Get contact_chats count
          supabase
            .from('contact_chats')
            .select('id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
          
          // Get interactions count
          supabase
            .from('interactions')
            .select('interaction_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
          
          // Get emails count (where contact is sender)
          supabase
            .from('emails')
            .select('email_id', { count: 'exact', head: true })
            .eq('sender_contact_id', contact.contact_id),
          
          // Get email_participants count
          supabase
            .from('email_participants')
            .select('participant_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
          
          // Get contact_email_threads count
          supabase
            .from('contact_email_threads')
            .select('email_thread_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
          
          // Get tags count
          supabase
            .from('contact_tags')
            .select('entry_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
          
          // Get cities count
          supabase
            .from('contact_cities')
            .select('entry_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
          
          // Get companies count
          supabase
            .from('contact_companies')
            .select('contact_companies_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
            
          // Get notes count
          supabase
            .from('notes_contacts')
            .select('note_contact_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
            
          // Get attachments count
          supabase
            .from('attachments')
            .select('attachment_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
            
          // Get contact emails count
          supabase
            .from('contact_emails')
            .select('email_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
            
          // Get contact mobiles count
          supabase
            .from('contact_mobiles')
            .select('mobile_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
            
          // Get deals count
          supabase
            .from('deals_contacts')
            .select('deals_contacts_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
            
          // Get meetings count
          supabase
            .from('meeting_contacts')
            .select('meeting_contact_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
            
          // Get investments count
          supabase
            .from('investments_contacts')
            .select('investments_contacts_id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
            
          // Get keep in touch count
          supabase
            .from('keep_in_touch')
            .select('id', { count: 'exact', head: true })
            .eq('contact_id', contact.contact_id),
            
          // Get the last interaction for this contact
          supabase
            .from('interactions')
            .select('interaction_id, interaction_type, direction, interaction_date, summary')
            .eq('contact_id', contact.contact_id)
            .order('interaction_date', { ascending: false })
            .limit(1)
        ]);
        
        // Update the counts and last interaction
        setAssociatedData({
          chatCount: chatResult.count || 0,
          contactChatsCount: contactChatsResult.count || 0,
          interactionsCount: interactionsResult.count || 0,
          emailsCount: emailsResult.count || 0,
          emailParticipantsCount: emailParticipantsResult.count || 0,
          emailThreadsCount: emailThreadsResult.count || 0,
          tagsCount: tagsResult.count || 0,
          citiesCount: citiesResult.count || 0,
          companiesCount: companiesResult.count || 0,
          notesCount: notesResult.count || 0,
          attachmentsCount: attachmentsResult.count || 0,
          contactEmailsCount: contactEmailsResult.count || 0,
          contactMobilesCount: contactMobilesResult.count || 0,
          dealsCount: dealsResult.count || 0,
          meetingsCount: meetingsResult.count || 0,
          investmentsCount: investmentsResult.count || 0,
          kitCount: kitResult.count || 0,
          lastInteraction: lastInteractionResult.data && lastInteractionResult.data.length > 0 ? 
            lastInteractionResult.data[0] : null
        });
        
        // Open the modal
        setDeleteModalOpen(true);
      } catch (err) {
        console.error('Error fetching associated data counts:', err);
        setError(`Failed to get related record counts: ${err.message || 'Unknown error'}`);
      }
    } else if (category === 'Skip') {
      // For Skip, just update the category
      setLoading(true);
      try {
        const { error } = await supabase
          .from('contacts')
          .update({ category: category })
          .eq('contact_id', contact.contact_id);
          
        if (error) throw error;
        
        // Show success message
        toast.success(`Contact marked as ${category}`);
        
        // Return to inbox
        navigate('/contacts/inbox');
      } catch (err) {
        console.error(`Error marking contact as ${category}:`, err);
        setError(`Failed to mark contact as ${category}: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    }
  };
  
  // Save contact to CRM
  const saveToCRM = async () => {
    if (!contact) return;
    
    setLoading(true);
    try {
      // 1. Update contact basic info
      const { error: contactError } = await supabase
        .from('contacts')
        .update({ 
          category: formData.category || null,
          linkedin: formData.linkedIn || null,
          description: formData.notes || null, // Using description field for notes
          keep_in_touch_frequency: formData.keepInTouch || null
        })
        .eq('contact_id', contact.contact_id);
        
      if (contactError) throw contactError;
      
      // 2. Update mobile if changed
      if (formData.mobile && formData.mobile !== contact.mobile) {
        // Check if mobile exists
        const { data: existingMobile } = await supabase
          .from('contact_mobiles')
          .select('mobile_id')
          .eq('contact_id', contact.contact_id)
          .eq('is_primary', true);
          
        if (existingMobile && existingMobile.length > 0) {
          // Update existing primary mobile
          await supabase
            .from('contact_mobiles')
            .update({ mobile: formData.mobile })
            .eq('mobile_id', existingMobile[0].mobile_id);
        } else {
          // Insert new primary mobile
          await supabase
            .from('contact_mobiles')
            .insert([{
              contact_id: contact.contact_id,
              mobile: formData.mobile,
              is_primary: true
            }]);
        }
      }
      
      // 3. Update email if changed
      if (formData.email && formData.email !== contact.email) {
        // Check if email exists
        const { data: existingEmail } = await supabase
          .from('contact_emails')
          .select('email_id')
          .eq('contact_id', contact.contact_id)
          .eq('is_primary', true);
          
        if (existingEmail && existingEmail.length > 0) {
          // Update existing primary email
          await supabase
            .from('contact_emails')
            .update({ email: formData.email })
            .eq('email_id', existingEmail[0].email_id);
        } else {
          // Insert new primary email
          await supabase
            .from('contact_emails')
            .insert([{
              contact_id: contact.contact_id,
              email: formData.email,
              is_primary: true
            }]);
        }
      }
      
      // 4. Update city if selected
      if (formData.city && formData.city.id) {
        // First check if relation already exists
        const { data: existingCity } = await supabase
          .from('contact_cities')
          .select('entry_id')
          .eq('contact_id', contact.contact_id)
          .eq('city_id', formData.city.id);
          
        if (!existingCity || existingCity.length === 0) {
          // Add city relation
          await supabase
            .from('contact_cities')
            .insert([{
              contact_id: contact.contact_id,
              city_id: formData.city.id
            }]);
        }
      }
      
      // 5. Update tags
      if (formData.tags && formData.tags.length > 0) {
        // Get current tags
        const { data: currentTags } = await supabase
          .from('contact_tags')
          .select('entry_id, tag_id')
          .eq('contact_id', contact.contact_id);
          
        // Find tags to add
        const currentTagIds = (currentTags || []).map(t => t.tag_id);
        const tagsToAdd = formData.tags
          .filter(t => !currentTagIds.includes(t.id))
          .map(t => ({
            contact_id: contact.contact_id,
            tag_id: t.id
          }));
          
        // Add new tags
        if (tagsToAdd.length > 0) {
          await supabase
            .from('contact_tags')
            .insert(tagsToAdd);
        }
      }
      
      // 6. Update company if selected
      if (formData.company && formData.company.id) {
        // First check if relation already exists
        const { data: existingCompany } = await supabase
          .from('contact_companies')
          .select('contact_companies_id')
          .eq('contact_id', contact.contact_id)
          .eq('company_id', formData.company.id);
          
        if (!existingCompany || existingCompany.length === 0) {
          // Add company relation
          await supabase
            .from('contact_companies')
            .insert([{
              contact_id: contact.contact_id,
              company_id: formData.company.id
            }]);
        }
      }
      
      // 7. Add note if provided
      if (formData.notes && formData.notes.trim() !== '') {
        // Create a new note
        const { data: noteData, error: noteError } = await supabase
          .from('notes')
          .insert([{
            note_text: formData.notes,
            created_at: new Date().toISOString()
          }])
          .select('note_id');
          
        if (noteError) throw noteError;
        
        if (noteData && noteData.length > 0) {
          // Link note to contact
          await supabase
            .from('notes_contacts')
            .insert([{
              note_id: noteData[0].note_id,
              contact_id: contact.contact_id
            }]);
        }
      }
      
      // Finally, update category to null (remove from inbox)
      const { error: categoryError } = await supabase
        .from('contacts')
        .update({ category: null })
        .eq('contact_id', contact.contact_id);
        
      if (categoryError) throw categoryError;
      
      // Show success message
      toast.success('Contact successfully added to CRM');
      
      // Return to inbox
      navigate('/contacts/inbox');
    } catch (err) {
      console.error('Error saving contact to CRM:', err);
      setError(`Failed to save contact to CRM: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // Handle cancel and return to inbox
  const handleCancel = () => {
    navigate('/inbox?source=category');
  };
  
  // Render loading state
  if (loading && !contact) {
    return (
      <Container>
        <LoadingContainer>
          <div>Loading contact data...</div>
        </LoadingContainer>
      </Container>
    );
  }
  
  // Render error state
  if (error && !contact) {
    return (
      <Container>
        <ErrorMessage>
          <FiAlertTriangle size={20} />
          <div>{error}</div>
        </ErrorMessage>
        <ActionButton onClick={handleCancel}>
          Return to Inbox
        </ActionButton>
      </Container>
    );
  }
  
  return (
    <Container>
      {/* Breadcrumbs */}
      <Breadcrumbs>
        <Crumb>
          <a onClick={() => navigate('/inbox')}>
            <FiHome />
          </a>
        </Crumb>
        <Crumb>
          <FiChevronRight />
        </Crumb>
        <Crumb>
          <a onClick={() => navigate('/inbox?source=category')}>
            Processing
          </a>
        </Crumb>
        <Crumb>
          <FiChevronRight />
        </Crumb>
        <Crumb active>
          <a>
            Edit: {contact?.first_name} {contact?.last_name}
          </a>
        </Crumb>
      </Breadcrumbs>
      
      {/* Header removed */}
      
      {/* Contact info */}
      {contact && (
        <ContactHeader>
          <h2>
            {isEditingName ? (
              <>
                <InlineEditInput 
                  type="text" 
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  width="120px"
                  placeholder="First name"
                  autoFocus
                />
                <InlineEditInput 
                  type="text" 
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  width="120px"
                  placeholder="Last name"
                />
                <ActionButton 
                  variant="primary" 
                  onClick={saveNameChanges}
                  style={{ padding: '0px 8px', margin: '0 4px', fontSize: '0.8rem', height: '26px' }}
                >
                  <FiCheck size={14} />
                </ActionButton>
                <ActionButton 
                  onClick={cancelNameEditing}
                  style={{ padding: '0px 8px', margin: '0', fontSize: '0.8rem', height: '26px' }}
                >
                  <FiX size={14} />
                </ActionButton>
              </>
            ) : (
              <>
                {contact.first_name} {contact.last_name}
                <EditIconWrapper onClick={startEditingName}>
                  <FiEdit size={16} color="#00ff00" />
                </EditIconWrapper>
              </>
            )}
          </h2>
          <div className="contact-details">
            {contact.email && (
              <div className="detail-item">
                <FiMail /> {contact.email}
              </div>
            )}
            {contact.mobile && (
              <div className="detail-item">
                <FiPhone /> {contact.mobile}
              </div>
            )}
            {contact.category && (
              <Badge>{contact.category}</Badge>
            )}
            {contact.last_interaction_at && (
              <div className="detail-item">
                Last interaction: {new Date(contact.last_interaction_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </ContactHeader>
      )}
      
      {/* Progress indicator */}
      <StepIndicator>
        <Step 
          $active={currentStep === 1} 
          $completed={currentStep > 1}
          $clickable={true}
          onClick={() => goToStep(1)}
        >
          <div className="step-number">1</div>
          <div className="step-label">Interactions</div>
        </Step>
        <Step 
          $active={currentStep === 2} 
          $completed={currentStep > 2}
          $clickable={currentStep >= 2 || currentStep === 1}
          onClick={() => currentStep >= 2 || currentStep === 1 ? goToStep(2) : null}
        >
          <div className="step-number">2</div>
          <div className="step-label">Duplicates</div>
        </Step>
        <Step 
          $active={currentStep === 3} 
          $completed={currentStep > 3}
          $clickable={currentStep >= 3 || currentStep === 2}
          onClick={() => currentStep >= 3 || currentStep === 2 ? goToStep(3) : null}
        >
          <div className="step-number">3</div>
          <div className="step-label">Enrichment</div>
        </Step>
        <Step 
          $active={currentStep === 4} 
          $completed={currentStep > 4}
          $clickable={currentStep >= 4 || currentStep === 3}
          onClick={() => currentStep >= 4 || currentStep === 3 ? goToStep(4) : null}
        >
          <div className="step-number">4</div>
          <div className="step-label">Recap</div>
        </Step>
      </StepIndicator>
      
      <ProgressBar>
        <ProgressStep $active={currentStep === 1} $completed={currentStep > 1} />
        <ProgressStep $active={currentStep === 2} $completed={currentStep > 2} />
        <ProgressStep $active={currentStep === 3} $completed={currentStep > 3} />
        <ProgressStep $active={currentStep === 4} $completed={currentStep > 4} />
      </ProgressBar>
      
      {error && (
        <ErrorMessage>
          <FiAlertTriangle size={20} />
          <div>{error}</div>
        </ErrorMessage>
      )}
      
      {/* Step 1: Interactions Confirmation */}
      {currentStep === 1 && (
        <>
          <Card>
            <SectionTitle>
              <FiMessageSquare /> Recent Interactions
            </SectionTitle>
            
            {loading ? (
              <LoadingContainer style={{ minHeight: '200px' }}>
                Loading interactions...
              </LoadingContainer>
            ) : false ? ( /* Always show the interactions layout by setting this condition to false */
              <NoDataMessage>
                No recent interactions found for this contact
              </NoDataMessage>
            ) : (
              <InteractionsLayout>
                {/* Channel headers in left sidebar */}
                <ChannelsMenu>
                  <div style={{ padding: '10px 15px', color: '#999', fontSize: '0.8rem', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
                    WHATSAPP
                  </div>
                  {/* WhatsApp chat items - dynamic from state */}
                  {whatsappChats.map((chat, index) => (
                    <div 
                      key={chat.chat_id || index}
                      style={{ 
                        padding: '12px 15px', 
                        cursor: 'pointer', 
                        borderBottom: '1px solid #222',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onClick={() => handleSelectChat(chat.chat_id)}
                    >
                      {chat.is_group_chat ? (
                        <FiUsers size={16} color="#25d366" />
                      ) : (
                        <FiMessageSquare size={16} color="#25d366" />
                      )}
                      <span style={{ color: '#25d366' }}>
                        {chat.chat_name}
                      </span>
                      {chat.unread_count > 0 && (
                        <span style={{ 
                          backgroundColor: '#222',
                          color: '#888', 
                          padding: '1px 6px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          marginLeft: 'auto'
                        }}>{chat.unread_count}</span>
                      )}
                    </div>
                  ))}
                  
                  <div style={{ padding: '10px 15px', color: '#999', fontSize: '0.8rem', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
                    EMAIL
                  </div>
                  {emailThreads.map((thread) => (
                    <div 
                      key={thread.thread_id}
                      style={{ 
                        padding: '12px 15px', 
                        cursor: 'pointer', 
                        borderBottom: '1px solid #222',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: selectedEmailThread === thread.thread_id ? '#2a2a2a' : 'transparent'
                      }}
                      onClick={() => handleSelectEmailThread(thread.thread_id)}
                    >
                      <FiMail size={16} color="#4a9eff" />
                      <span style={{ color: '#4a9eff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {thread.title}
                      </span>
                    </div>
                  ))}
                  
                  <div style={{ padding: '10px 15px', color: '#999', fontSize: '0.8rem', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
                    MEETINGS
                  </div>
                </ChannelsMenu>
                
                {/* Interactions list */}
                <InteractionsContainer>
                  {selectedChat ? (
                    <WhatsAppContainer>
                      <ChatHeader>
                        <ChatAvatar>
                          {(whatsappChats.find(chat => chat.chat_id === selectedChat)?.chat_name || '').charAt(0).toUpperCase()}
                        </ChatAvatar>
                        <ChatInfo>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ChatName>
                              {whatsappChats.find(chat => chat.chat_id === selectedChat)?.chat_name || 'Chat'}
                            </ChatName>
                            <div 
                              style={{ 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                color: '#00ff00',
                                opacity: '0.7',
                                marginLeft: '5px'
                              }}
                              onClick={() => {
                                if (contact) {
                                  const chatName = whatsappChats.find(chat => chat.chat_id === selectedChat)?.chat_name || '';
                                  const nameParts = chatName.split(' ');
                                  const firstName = nameParts[0] || '';
                                  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                                  
                                  // Set the editing values
                                  setEditFirstName(firstName);
                                  setEditLastName(lastName);
                                  
                                  // Update contact with new name parts via Supabase
                                  try {
                                    // Save directly to the database
                                    supabase
                                      .from('contacts')
                                      .update({
                                        first_name: firstName,
                                        last_name: lastName
                                      })
                                      .eq('contact_id', contactId)
                                      .then(({ error }) => {
                                        if (error) {
                                          console.error('Error updating name:', error);
                                          toast.error('Failed to update name');
                                        } else {
                                          // Update local state
                                          setContact({
                                            ...contact,
                                            first_name: firstName,
                                            last_name: lastName
                                          });
                                          toast.success('Contact name updated from chat');
                                        }
                                      });
                                  } catch (err) {
                                    console.error('Error updating name:', err);
                                    toast.error('Failed to update name');
                                  }
                                }
                              }}
                            >
                              <FiArrowRight size={16} />
                            </div>
                          </div>
                          <ChatStatus>
                            {chatMessages.length} messages
                          </ChatStatus>
                        </ChatInfo>
                      </ChatHeader>
                      
                      <MessagesContainer>
                        {loadingMessages ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            Loading messages...
                          </div>
                        ) : chatMessages.length === 0 ? (
                          <EmptyChatState>
                            <FiMessageSquare size={40} />
                            <h3>No Messages</h3>
                            <p>There are no messages in this conversation yet.</p>
                          </EmptyChatState>
                        ) : (
                          chatMessages.map((message) => (
                            <MessageBubble
                              key={message.id}
                              $direction={message.direction}
                            >
                              {message.content}
                              <MessageTime>{message.formattedTime}</MessageTime>
                            </MessageBubble>
                          ))
                        )}
                      </MessagesContainer>
                    </WhatsAppContainer>
                  ) : selectedEmailThread ? (
                    <EmailThreadContainer>
                      <EmailHeader>
                        <EmailSubject>
                          {emailThreads.find(thread => thread.thread_id === selectedEmailThread)?.title || 'No Subject'}
                        </EmailSubject>
                        <EmailCount>
                          {emailMessages.length} emails in conversation
                        </EmailCount>
                      </EmailHeader>
                      
                      <EmailList>
                        {loadingEmails ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            Loading emails...
                          </div>
                        ) : emailMessages.length === 0 ? (
                          <EmptyChatState>
                            <FiMail size={40} />
                            <h3>No Emails</h3>
                            <p>There are no emails in this thread.</p>
                          </EmptyChatState>
                        ) : (
                          emailMessages.map((email) => (
                            <EmailItem key={email.email_id} $expanded={expandedEmails[email.email_id]}>
                              <EmailHeader2 onClick={() => toggleEmailExpanded(email.email_id)}>
                                <EmailMeta>
                                  <EmailSender>
                                    {email.sender ? email.sender.name : (email.contacts?.first_name && email.contacts?.last_name ? `${email.contacts.first_name} ${email.contacts.last_name}` : 'Unknown Sender')}
                                  </EmailSender>
                                  <EmailDate>
                                    {new Date(email.message_timestamp).toLocaleString()}
                                  </EmailDate>
                                </EmailMeta>
                                <EmailPreview>
                                  {email.body_plain ? email.body_plain.substring(0, 100) : 'No content'}
                                </EmailPreview>
                              </EmailHeader2>
                              
                              {expandedEmails[email.email_id] && (
                                <EmailBody>
                                  <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
                                    <div style={{ display: 'flex', marginBottom: '6px' }}>
                                      <strong style={{ minWidth: '60px', color: '#999' }}>From:</strong> 
                                      <span style={{ color: '#ccc' }}>
                                        {email.sender ? `${email.sender.name} ${email.sender.email ? `<${email.sender.email}>` : ''}` : 'Unknown Sender'}
                                      </span>
                                    </div>
                                    
                                    {email.to && email.to.length > 0 && (
                                      <div style={{ display: 'flex', marginBottom: '6px' }}>
                                        <strong style={{ minWidth: '60px', color: '#999' }}>To:</strong> 
                                        <span style={{ color: '#ccc' }}>
                                          {email.to.map(recipient => `${recipient.name}${recipient.email ? ` <${recipient.email}>` : ''}`).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {email.cc && email.cc.length > 0 && (
                                      <div style={{ display: 'flex', marginBottom: '6px' }}>
                                        <strong style={{ minWidth: '60px', color: '#999' }}>CC:</strong> 
                                        <span style={{ color: '#ccc' }}>
                                          {email.cc.map(recipient => `${recipient.name}${recipient.email ? ` <${recipient.email}>` : ''}`).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    
                                    <div style={{ display: 'flex', marginBottom: '6px' }}>
                                      <strong style={{ minWidth: '60px', color: '#999' }}>Subject:</strong> 
                                      <span style={{ color: '#ccc' }}>{email.subject || 'No Subject'}</span>
                                    </div>
                                  </div>

                                  <div style={{ marginBottom: '15px', color: '#ddd' }}>
                                    {email.body_html ? (
                                      <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
                                    ) : (
                                      email.body_plain.split('\n').map((line, i) => (
                                        <p key={i}>{line}</p>
                                      ))
                                    )}
                                  </div>
                                  
                                  {email.has_attachments && email.attachment_count > 0 && (
                                    <EmailAttachments>
                                      <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '8px' }}>
                                        {email.attachment_count} attachment{email.attachment_count !== 1 ? 's' : ''}
                                      </div>
                                      <AttachmentItem>
                                        <FiFile size={20} />
                                        <span>Attachment</span>
                                      </AttachmentItem>
                                    </EmailAttachments>
                                  )}
                                </EmailBody>
                              )}
                            </EmailItem>
                          ))
                        )}
                      </EmailList>
                    </EmailThreadContainer>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%', 
                      color: '#666',
                      flexDirection: 'column',
                      gap: '15px'
                    }}>
                      <FiMessageSquare size={40} color="#333" />
                      <div>Select a conversation to view messages</div>
                    </div>
                  )}
                </InteractionsContainer>
              </InteractionsLayout>
            )}
          </Card>
          
          <ButtonGroup>
            <div>
              <ActionButton 
                variant="danger" 
                onClick={() => handleCategorize('Spam')} 
                disabled={loading}
              >
                <FiTrash2 /> Mark as Spam
              </ActionButton>
              <ActionButton 
                variant="warning" 
                onClick={() => handleCategorize('Skip')} 
                disabled={loading}
                style={{ marginLeft: '10px' }}
              >
                <FiX /> Skip Contact
              </ActionButton>
            </div>
            <ActionButton 
              variant="primary" 
              onClick={() => goToStep(2)} 
              disabled={loading}
            >
              Continue <FiArrowRight />
            </ActionButton>
          </ButtonGroup>
        </>
      )}
      
      {/* Step 2: Duplicate Check */}
      {currentStep === 2 && (
        <>
          <Card>
            <SectionTitle>
              <FiSearch /> Check for Duplicate Contacts
            </SectionTitle>
            
            {loading ? (
              <LoadingContainer style={{ minHeight: '200px' }}>
                Searching for duplicates...
              </LoadingContainer>
            ) : (
              <InteractionsLayout>
                {/* Duplicates menu - left side (1/3) */}
                <ChannelsMenu>
                  {/* Group by match type - Only show when duplicates exist */}
                  {duplicates.length > 0 && (
                    <>
                      {/* Matches by Name */}
                      {duplicates.some(d => d.matched_on && d.matched_on.includes('Name')) && (
                        <>
                          <div style={{ padding: '10px 15px', color: '#999', fontSize: '0.8rem', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
                            MATCHES BY NAME
                          </div>
                          {duplicates
                            .filter(d => d.matched_on && d.matched_on.includes('Name'))
                            .map(duplicate => (
                              <ChannelItem 
                                key={duplicate.contact_id}
                                active={selectedDuplicate?.contact_id === duplicate.contact_id}
                                onClick={() => handleSelectDuplicate(duplicate)}
                              >
                                <FiUser size={16} />
                                <span className="channel-name">
                                  {duplicate.first_name} {duplicate.last_name}
                                </span>
                              </ChannelItem>
                            ))}
                        </>
                      )}
                      
                      {/* Matches by Email */}
                      {duplicates.some(d => d.matched_on && d.matched_on.includes('Email')) && (
                        <>
                          <div style={{ padding: '10px 15px', color: '#999', fontSize: '0.8rem', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
                            MATCHES BY EMAIL
                          </div>
                          {duplicates
                            .filter(d => d.matched_on && d.matched_on.includes('Email'))
                            .map(duplicate => (
                              <ChannelItem 
                                key={duplicate.contact_id}
                                active={selectedDuplicate?.contact_id === duplicate.contact_id}
                                onClick={() => handleSelectDuplicate(duplicate)}
                              >
                                <FiUser size={16} />
                                <span className="channel-name">
                                  {duplicate.first_name} {duplicate.last_name}
                                </span>
                              </ChannelItem>
                            ))}
                        </>
                      )}
                      
                      {/* Matches by Mobile */}
                      {duplicates.some(d => d.matched_on && d.matched_on.includes('Mobile')) && (
                        <>
                          <div style={{ padding: '10px 15px', color: '#999', fontSize: '0.8rem', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
                            MATCHES BY MOBILE
                          </div>
                          {duplicates
                            .filter(d => d.matched_on && d.matched_on.includes('Mobile'))
                            .map(duplicate => (
                              <ChannelItem 
                                key={duplicate.contact_id}
                                active={selectedDuplicate?.contact_id === duplicate.contact_id}
                                onClick={() => handleSelectDuplicate(duplicate)}
                              >
                                <FiUser size={16} />
                                <span className="channel-name">
                                  {duplicate.first_name} {duplicate.last_name}
                                </span>
                              </ChannelItem>
                            ))}
                        </>
                      )}
                      
                      {/* Fallback for duplicates without a specified match type */}
                      {duplicates.some(d => !d.matched_on) && (
                        <>
                          <div style={{ padding: '10px 15px', color: '#999', fontSize: '0.8rem', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
                            OTHER MATCHES
                          </div>
                          {duplicates
                            .filter(d => !d.matched_on)
                            .map(duplicate => (
                              <ChannelItem 
                                key={duplicate.contact_id}
                                active={selectedDuplicate?.contact_id === duplicate.contact_id}
                                onClick={() => handleSelectDuplicate(duplicate)}
                              >
                                <FiUser size={16} />
                                <span className="channel-name">
                                  {duplicate.first_name} {duplicate.last_name}
                                </span>
                              </ChannelItem>
                            ))}
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Show message when no duplicates found */}
                  {duplicates.length === 0 && (
                    <div style={{ padding: '15px', color: '#999', fontSize: '0.9rem', borderBottom: '1px solid #333' }}>
                      No potential duplicates found
                    </div>
                  )}
                  
                  {/* Airtable Section - Always show regardless of duplicates */}
                  <div style={{ padding: '10px 15px', color: '#999', fontSize: '0.8rem', borderBottom: '1px solid #333', fontWeight: 'bold', marginTop: '10px' }}>
                    AIRTABLE
                  </div>
                  <div 
                    onClick={() => {
                      setActiveEnrichmentSection("airtable");
                      setSelectedDuplicate(null); // Clear selected duplicate
                    }}
                    style={{ 
                      padding: '12px 15px', 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #222',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: activeEnrichmentSection === "airtable" ? '#222' : 'transparent'
                    }}
                  >
                    <FiDatabase size={16} />
                    <span>Matching</span>
                  </div>
                  <div 
                    onClick={() => {
                      setActiveEnrichmentSection("airtable_combining");
                      setSelectedDuplicate(null); // Clear selected duplicate
                    }}
                    style={{ 
                      padding: '12px 15px', 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #222',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: activeEnrichmentSection === "airtable_combining" ? '#222' : 'transparent'
                    }}
                  >
                    <FiGitMerge size={16} />
                    <span>Combining</span>
                  </div>
                </ChannelsMenu>
                
                {/* Duplicate details - right side (2/3) */}
                <InteractionsContainer style={{ paddingRight: activeEnrichmentSection === "airtable" || activeEnrichmentSection === "airtable_combining" ? '20px' : '0' }}>
                  {activeEnrichmentSection === "airtable" ? (
                    <div style={{ padding: '20px 0 20px 20px', width: '90%' }}>
                      <FormGroup>
                        <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Airtable Integration</h3>
                        <FormFieldLabel>Search & Link Airtable Contact</FormFieldLabel>
                        <div style={{ position: 'relative', marginBottom: '15px' }}>
                          <div style={{ 
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '10px'
                          }}>
                            <Input
                              type="text"
                              value={airtableSearchInput}
                              onChange={(e) => {
                                setAirtableSearchInput(e.target.value);
                                if (e.target.value.trim().length >= 2) {
                                  searchAirtableContacts(e.target.value);
                                } else {
                                  setAirtableSearchResults([]);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setAirtableSearchInput('');
                                  setAirtableSearchResults([]);
                                }
                              }}
                              placeholder="Search by name, email or phone number... (ESC to clear)"
                              style={{ flex: 1 }}
                            />
                            <button
                              onClick={() => searchAirtableContacts(airtableSearchInput)}
                              disabled={airtableSearchInput.trim().length < 2}
                              style={{
                                background: airtableSearchInput.trim().length >= 2 ? '#00ff00' : '#444',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0 15px',
                                color: airtableSearchInput.trim().length >= 2 ? 'black' : '#999',
                                cursor: airtableSearchInput.trim().length >= 2 ? 'pointer' : 'not-allowed'
                              }}
                            >
                              Search
                            </button>
                          </div>
                          
                          {/* Search results */}
                          {airtableSearchResults.length > 0 && (
                            <div style={{ 
                              position: 'absolute', 
                              zIndex: 10, 
                              background: '#333', 
                              width: '100%', 
                              maxHeight: '250px', 
                              overflowY: 'auto',
                              borderRadius: '4px',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                            }}>
                              {airtableSearchResults.map((result) => (
                                <div 
                                  key={result.airtable_id}
                                  onClick={() => associateAirtableContact(result.airtable_id)}
                                  style={{ 
                                    padding: '10px 15px',
                                    borderBottom: '1px solid #444',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = '#444'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{result.full_name}</div>
                                  <div style={{ fontSize: '12px', color: '#ccc' }}>
                                    {result.primary_email && (
                                      <div style={{ marginBottom: '3px' }}>
                                        <FiMail size={12} style={{ marginRight: '5px' }} />
                                        {result.primary_email}
                                      </div>
                                    )}
                                    {result.phone_number_1 && (
                                      <div>
                                        <FiPhone size={12} style={{ marginRight: '5px' }} />
                                        {result.phone_number_1}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Current Airtable association */}
                        <div style={{ 
                          background: '#222', 
                          padding: '15px', 
                          borderRadius: '4px',
                          marginBottom: '15px',
                          maxWidth: '100%',
                          boxSizing: 'border-box'
                        }}>
                          {contact?.airtable_id ? (
                            <>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                marginBottom: '15px',
                                alignItems: 'center'
                              }}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                  Linked Airtable Contact
                                </div>
                                <button
                                  onClick={disassociateAirtableContact}
                                  style={{
                                    background: '#ff4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '5px 10px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                  }}
                                >
                                  <FiLink2 size={14} /> Unlink
                                </button>
                              </div>
                              
                              {airtableContact ? (
                                <div style={{ 
                                  background: '#333', 
                                  padding: '12px', 
                                  borderRadius: '4px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                  maxWidth: '100%',
                                  boxSizing: 'border-box',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ color: '#999' }}>Airtable ID:</div>
                                    <div style={{ color: '#4a9eff', fontWeight: 'bold' }}>{contact.airtable_id}</div>
                                  </div>
                                  
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ color: '#999' }}>Name:</div>
                                    <div>{airtableContact.full_name}</div>
                                  </div>
                                  
                                  {airtableContact.primary_email && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <div style={{ color: '#999' }}>Email:</div>
                                      <div>{airtableContact.primary_email}</div>
                                    </div>
                                  )}
                                  
                                  {airtableContact.phone_number_1 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <div style={{ color: '#999' }}>Phone 1:</div>
                                      <div>{airtableContact.phone_number_1}</div>
                                    </div>
                                  )}
                                  
                                  {airtableContact.phone_number_2 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <div style={{ color: '#999' }}>Phone 2:</div>
                                      <div>{airtableContact.phone_number_2}</div>
                                    </div>
                                  )}
                                  
                                  {airtableContact.company && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <div style={{ color: '#999' }}>Company:</div>
                                      <div>{airtableContact.company}</div>
                                    </div>
                                  )}
                                  
                                  {airtableContact.linkedin && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <div style={{ color: '#999' }}>LinkedIn:</div>
                                      <div>
                                        <a 
                                          href={airtableContact.linkedin} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          style={{ color: '#4a9eff' }}
                                        >
                                          {airtableContact.linkedin}
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{ 
                                  textAlign: 'center', 
                                  color: '#999', 
                                  padding: '10px',
                                  background: '#333',
                                  borderRadius: '4px' 
                                }}>
                                  Loading Airtable data...
                                </div>
                              )}
                            </>
                          ) : (
                            <div style={{ color: '#999', textAlign: 'center', padding: '15px 0' }}>
                              No Airtable record associated with this contact. Use the search above to link one.
                            </div>
                          )}
                        </div>
                      </FormGroup>
                      
                      {/* Save and Continue Button */}
                      <ButtonGroup style={{ 
                        marginTop: '30px', 
                        marginBottom: '20px', 
                        width: 'calc(100% - 20px)', 
                        justifyContent: 'flex-end' 
                      }}>
                        <ActionButton 
                          variant="success" 
                          onClick={() => setActiveEnrichmentSection("airtable_combining")}
                        >
                          <FiCheck /> Save & Continue
                        </ActionButton>
                      </ButtonGroup>
                    </div>
                  ) : activeEnrichmentSection === "airtable_combining" ? (
                    <div style={{ padding: '0', width: '95%' }}>
                      {!contact?.airtable_id || !airtableContact ? (
                        <div style={{ 
                          color: '#999', 
                          textAlign: 'center', 
                          padding: '20px',
                          background: '#222',
                          borderRadius: '4px',
                          marginBottom: '20px' 
                        }}>
                          <FiAlertCircle size={24} style={{ marginBottom: '10px' }} />
                          <div>{!contact?.airtable_id ? 
                            'No Airtable record linked to this contact. Please go to the Matching tab first to link an Airtable contact.' : 
                            'Loading Airtable data...'}
                          </div>
                        </div>
                      ) : (
                        <FormGroup style={{ width: '100%', padding: 0, margin: 0 }}>
                          <div style={{ width: '100%' }}>
                          <table style={{ 
                            width: '100%', 
                            borderCollapse: 'collapse',
                            overflow: 'hidden',
                            marginTop: 0
                          }}>
                            <thead>
                                <tr style={{ background: '#333' }}>
                                  <th style={{ padding: '9px 15px', textAlign: 'left', borderBottom: '1px solid #444', width: '15%' }}>
                                    Field Name
                                  </th>
                                  <th style={{ padding: '9px 15px', textAlign: 'left', borderBottom: '1px solid #444', width: '28%' }}>
                                    Supabase Now
                                  </th>
                                  <th style={{ padding: '9px 15px', textAlign: 'left', borderBottom: '1px solid #444', width: '25%' }}>
                                    Airtable
                                  </th>
                                  <th style={{ padding: '9px 15px', textAlign: 'left', borderBottom: '1px solid #444', width: '32%' }}>
                                    Supabase Final
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* First Name Row */}
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  <td style={{ padding: '12px 15px', color: '#999' }}>Name</td>
                                  <td style={{ padding: '12px 15px' }}>
                                    {contact.isEditingFirstName ? (
                                      <Input 
                                        type="text"
                                        value={contact.first_name || ''}
                                        onChange={(e) => {
                                          // Update the contact display value
                                          const updatedContact = {...contact, first_name: e.target.value};
                                          setContact(updatedContact);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            // Confirm edit on Enter
                                            const updatedContact = {...contact, isEditingFirstName: false};
                                            setContact(updatedContact);
                                          }
                                        }}
                                        onBlur={() => {
                                          // Confirm edit on blur
                                          const updatedContact = {...contact, isEditingFirstName: false};
                                          setContact(updatedContact);
                                        }}
                                        autoFocus
                                        style={{ 
                                          width: '100%',
                                          background: 'transparent',
                                          border: 'none',
                                          padding: '8px 12px',
                                          color: '#fff'
                                        }}
                                      />
                                    ) : (
                                      <div 
                                        onClick={() => {
                                          // Only start editing
                                          const updatedContact = {...contact, isEditingFirstName: true};
                                          setContact(updatedContact);
                                        }}
                                        style={{ 
                                          cursor: 'pointer',
                                          padding: '8px 12px',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <span>{contact.first_name || '-'}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div 
                                      onClick={async () => {
                                        if (airtableContact && airtableContact.full_name) {
                                          const nameParts = airtableContact.full_name.split(' ');
                                          const firstName = nameParts[0] || '';
                                          // Update formData with the Airtable first name
                                          handleInputChange('firstName', firstName);
                                          
                                          // Save to database
                                          try {
                                            const { error } = await supabase
                                              .from('contacts')
                                              .update({ first_name: firstName })
                                              .eq('contact_id', contact.contact_id);
                                              
                                            if (error) {
                                              console.error('Error updating contact first name:', error);
                                              toast.error('Failed to update first name');
                                            } else {
                                              toast.success('First name updated');
                                              // Update the contact with the new first name
                                              setContact({...contact, first_name: firstName});
                                            }
                                          } catch (err) {
                                            console.error('Exception updating contact first name:', err);
                                            toast.error('Failed to update first name');
                                          }
                                        }
                                      }}
                                      style={{ 
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      <span>
                                        {airtableContact && airtableContact.full_name ? 
                                          airtableContact.full_name.split(' ')[0] || '-' : 
                                          '-'}
                                      </span>
                                      <span style={{ color: '#00ff00', fontSize: '12px', marginLeft: '10px' }}>
                                        → 
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    {formData.isEditingFirstName ? (
                                      <Input 
                                        type="text"
                                        value={formData.firstName !== undefined ? formData.firstName : (contact.first_name || '')}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        onKeyDown={async (e) => {
                                          if (e.key === 'Enter') {
                                            // Confirm edit on Enter and save to contact.first_name immediately
                                            const updatedFormData = {...formData, isEditingFirstName: false};
                                            setFormData(updatedFormData);
                                            
                                            const newFirstName = formData.firstName || contact.first_name || '';
                                            
                                            // Update the contact with the new first name
                                            const updatedContact = {...contact, first_name: newFirstName};
                                            setContact(updatedContact);
                                            
                                            // Save to database
                                            try {
                                              const { error } = await supabase
                                                .from('contacts')
                                                .update({ first_name: newFirstName })
                                                .eq('contact_id', contact.contact_id);
                                                
                                              if (error) {
                                                console.error('Error updating contact first name:', error);
                                                toast.error('Failed to update first name');
                                              } else {
                                                toast.success('First name updated');
                                              }
                                            } catch (err) {
                                              console.error('Exception updating contact first name:', err);
                                              toast.error('Failed to update first name');
                                            }
                                          }
                                        }}
                                        onBlur={() => {
                                          // Confirm edit on blur
                                          const updatedFormData = {...formData, isEditingFirstName: false};
                                          setFormData(updatedFormData);
                                        }}
                                        autoFocus
                                        style={{ 
                                          width: '100%',
                                          background: 'transparent',
                                          border: 'none',
                                          padding: '8px 12px',
                                          color: '#fff'
                                        }}
                                      />
                                    ) : (
                                      <div 
                                        onClick={() => {
                                          const updatedFormData = {...formData, isEditingFirstName: true};
                                          setFormData(updatedFormData);
                                        }}
                                        style={{ 
                                          cursor: 'pointer',
                                          padding: '8px 12px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <span>{formData.firstName !== undefined ? formData.firstName : (contact.first_name || '-')}</span>
                                        {formData.firstName === undefined && (
                                          <span style={{ fontSize: '0.7rem', color: '#999', fontStyle: 'italic', marginLeft: 'auto' }}>
                                            Same as Supabase Now
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                                
                                {/* Last Name Row */}
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  <td style={{ padding: '12px 15px', color: '#999' }}>Surname</td>
                                  <td style={{ padding: '12px 15px' }}>
                                    {contact.isEditingLastName ? (
                                      <Input 
                                        type="text"
                                        value={contact.last_name || ''}
                                        onChange={(e) => {
                                          // Update the contact display value
                                          const updatedContact = {...contact, last_name: e.target.value};
                                          setContact(updatedContact);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            // Confirm edit on Enter
                                            const updatedContact = {...contact, isEditingLastName: false};
                                            setContact(updatedContact);
                                          }
                                        }}
                                        onBlur={() => {
                                          // Confirm edit on blur
                                          const updatedContact = {...contact, isEditingLastName: false};
                                          setContact(updatedContact);
                                        }}
                                        autoFocus
                                        style={{ 
                                          width: '100%',
                                          background: 'transparent',
                                          border: 'none',
                                          padding: '8px 12px',
                                          color: '#fff'
                                        }}
                                      />
                                    ) : (
                                      <div 
                                        onClick={() => {
                                          // Only start editing
                                          const updatedContact = {...contact, isEditingLastName: true};
                                          setContact(updatedContact);
                                        }}
                                        style={{ 
                                          cursor: 'pointer',
                                          padding: '8px 12px',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <span>{contact.last_name || '-'}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div 
                                      onClick={async () => {
                                        if (airtableContact && airtableContact.full_name) {
                                          const nameParts = airtableContact.full_name.split(' ');
                                          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                                          // Update formData with the Airtable last name
                                          handleInputChange('lastName', lastName);
                                          
                                          // Save to database
                                          try {
                                            const { error } = await supabase
                                              .from('contacts')
                                              .update({ last_name: lastName })
                                              .eq('contact_id', contact.contact_id);
                                              
                                            if (error) {
                                              console.error('Error updating contact last name:', error);
                                              toast.error('Failed to update last name');
                                            } else {
                                              toast.success('Last name updated');
                                              // Update the contact with the new last name
                                              setContact({...contact, last_name: lastName});
                                            }
                                          } catch (err) {
                                            console.error('Exception updating contact last name:', err);
                                            toast.error('Failed to update last name');
                                          }
                                        }
                                      }}
                                      style={{ 
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      <span>
                                        {airtableContact && airtableContact.full_name && airtableContact.full_name.split(' ').length > 1 ? 
                                          airtableContact.full_name.split(' ').slice(1).join(' ') || '-' : 
                                          '-'}
                                      </span>
                                      <span style={{ color: '#00ff00', fontSize: '12px', marginLeft: '10px' }}>
                                        → 
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    {formData.isEditingLastName ? (
                                      <Input 
                                        type="text"
                                        value={formData.lastName !== undefined ? formData.lastName : (contact.last_name || '')}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        onKeyDown={async (e) => {
                                          if (e.key === 'Enter') {
                                            // Confirm edit on Enter and save to contact.last_name immediately
                                            const updatedFormData = {...formData, isEditingLastName: false};
                                            setFormData(updatedFormData);
                                            
                                            const newLastName = formData.lastName || contact.last_name || '';
                                            
                                            // Update the contact with the new last name
                                            const updatedContact = {...contact, last_name: newLastName};
                                            setContact(updatedContact);
                                            
                                            // Save to database
                                            try {
                                              const { error } = await supabase
                                                .from('contacts')
                                                .update({ last_name: newLastName })
                                                .eq('contact_id', contact.contact_id);
                                                
                                              if (error) {
                                                console.error('Error updating contact last name:', error);
                                                toast.error('Failed to update last name');
                                              } else {
                                                toast.success('Last name updated');
                                              }
                                            } catch (err) {
                                              console.error('Exception updating contact last name:', err);
                                              toast.error('Failed to update last name');
                                            }
                                          }
                                        }}
                                        onBlur={() => {
                                          // Confirm edit on blur
                                          const updatedFormData = {...formData, isEditingLastName: false};
                                          setFormData(updatedFormData);
                                        }}
                                        autoFocus
                                        style={{ 
                                          width: '100%',
                                          background: 'transparent',
                                          border: 'none',
                                          padding: '8px 12px',
                                          color: '#fff'
                                        }}
                                      />
                                    ) : (
                                      <div 
                                        onClick={() => {
                                          const updatedFormData = {...formData, isEditingLastName: true};
                                          setFormData(updatedFormData);
                                        }}
                                        style={{ 
                                          cursor: 'pointer',
                                          padding: '8px 12px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <span>{formData.lastName !== undefined ? formData.lastName : (contact.last_name || '-')}</span>
                                        {formData.lastName === undefined && (
                                          <span style={{ fontSize: '0.7rem', color: '#999', fontStyle: 'italic', marginLeft: 'auto' }}>
                                            Same as Supabase Now
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>

                                {/* Email Addresses Row */}
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  <td style={{ padding: '12px 15px', color: '#999' }}>
                                    <a 
                                      href={`https://mail.superhuman.com/search/${contact.first_name || ''}%20${contact.last_name || ''}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#999', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                                    >
                                      <span>Email</span>
                                      <span style={{ marginLeft: '5px', fontSize: '10px' }}>↗</span>
                                    </a>
                                  </td>
                                  <td style={{ padding: '12px 15px', minHeight: '50px', verticalAlign: 'top' }}>
                                    <TagsContainer>
                                      {contact.emails && contact.emails.length > 0 ? (
                                        contact.emails.map((emailObj, idx) => (
                                          <Tag 
                                            key={idx}
                                            style={{ 
                                              cursor: 'default', 
                                              background: 'transparent',
                                              display: 'block',
                                              marginBottom: '8px'
                                            }}
                                          >
                                            {emailObj.email && (
                                              <>
                                                <span>{emailObj.email}</span>
                                                {emailObj.is_primary && (
                                                  <span title="Primary Email" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                                )}
                                                {emailObj.type && (
                                                  <span style={{ fontSize: '0.8em', opacity: 0.8, marginLeft: '3px' }}>
                                                    ({emailObj.type})
                                                  </span>
                                                )}
                                              </>
                                            )}
                                          </Tag>
                                        ))
                                      ) : contact.email ? (
                                        <Tag style={{ background: 'transparent', cursor: 'default' }}>
                                          {contact.email}
                                        </Tag>
                                      ) : (
                                        '-'
                                      )}
                                    </TagsContainer>
                                  </td>
                                  <td style={{ padding: '12px 15px', minHeight: '50px', verticalAlign: 'top' }}>
                                    <TagsContainer>
                                      {airtableContact?.emails && airtableContact.emails.length > 0 ? (
                                        airtableContact.emails.map((emailObj, idx) => {
                                          // Check if emailObj is not null and has email property
                                          const emailStr = typeof emailObj === 'string' 
                                            ? emailObj 
                                            : (emailObj && typeof emailObj === 'object' && emailObj.email) 
                                              ? emailObj.email 
                                              : null;
                                          
                                          if (!emailStr) return null;
                                          
                                          return (
                                            <Tag 
                                              key={idx}
                                              style={{ 
                                                cursor: 'default',
                                                background: 'transparent',
                                                display: 'block',
                                                marginBottom: '8px'
                                              }}
                                              // Click functionality disabled for future modal implementation
                                            >
                                              <span>{emailStr}</span>
                                              {emailObj && typeof emailObj === 'object' && emailObj.is_primary && (
                                                <span title="Primary Email" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                              )}
                                            </Tag>
                                          );
                                        })
                                      ) : airtableContact?.primary_email ? (
                                        <Tag 
                                          style={{ background: 'transparent', cursor: 'default' }}
                                          // Click functionality disabled for future modal implementation
                                        >
                                          {airtableContact.primary_email}
                                        </Tag>
                                      ) : (
                                        '-'
                                      )}
                                    </TagsContainer>
                                  </td>
                                  <td style={{ padding: '12px 15px', minHeight: '50px', verticalAlign: 'top' }}>
                                    <TagsContainer>
                                      {/* Show emails from contact.emails */}
                                      {contact.emails && contact.emails.length > 0 ? (
                                        contact.emails.map((emailObj, idx) => (
                                          <Tag 
                                            key={`contact-${idx}`}
                                            style={{ 
                                              background: 'transparent', 
                                              cursor: 'default',
                                              display: 'block',
                                              marginBottom: '8px'
                                            }}
                                          >
                                            <span>{emailObj.email}</span>
                                            {emailObj.is_primary && (
                                              <span title="Primary Email" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                            )}
                                            {emailObj.type && (
                                              <span style={{ fontSize: '0.8em', opacity: 0.8, marginLeft: '3px' }}>
                                                ({emailObj.type})
                                              </span>
                                            )}
                                          </Tag>
                                        ))
                                      ) : contact.email ? (
                                        <Tag style={{ 
                                          background: 'transparent', 
                                          cursor: 'default',
                                          display: 'block',
                                          marginBottom: '8px'
                                        }}>
                                          <span>{contact.email}</span>
                                          <span title="Primary Email" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                        </Tag>
                                      ) : null}
                                      
                                      {/* Show new emails added from contactEmails */}
                                      {formData.contactEmails && formData.contactEmails.length > 0 && 
                                        formData.contactEmails.map((emailObj, idx) => {
                                          // Check if this email already exists in contact.emails
                                          const existsInContact = contact.emails?.some(e => e.email === emailObj.email);
                                          
                                          // Only show if it doesn't exist in contact.emails
                                          if (!existsInContact) {
                                            return (
                                              <Tag 
                                                key={`new-${idx}`}
                                                style={{ 
                                                  background: 'transparent', 
                                                  cursor: 'default',
                                                  display: 'block',
                                                  marginBottom: '8px'
                                                }}
                                              >
                                                <span>{emailObj.email}</span>
                                                {emailObj.is_primary && (
                                                  <span title="Primary Email" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                                )}
                                                {emailObj.type && (
                                                  <span style={{ fontSize: '0.8em', opacity: 0.8, marginLeft: '3px' }}>
                                                    ({emailObj.type})
                                                  </span>
                                                )}
                                                <span 
                                                  onClick={() => {
                                                    // Remove this email from contactEmails
                                                    const updatedEmails = [...formData.contactEmails];
                                                    updatedEmails.splice(idx, 1);
                                                    handleInputChange('contactEmails', updatedEmails);
                                                  }}
                                                  title="Remove email" 
                                                  style={{ 
                                                    fontSize: '12px', 
                                                    marginLeft: '5px', 
                                                    color: '#00ff00',
                                                    cursor: 'pointer'
                                                  }}
                                                >
                                                  ✕
                                                </span>
                                              </Tag>
                                            );
                                          }
                                          return null;
                                        })
                                      }
                                      
                                      {/* For backward compatibility */}
                                      {!contact.emails && formData.primaryEmail && !contact.email && (
                                        <Tag style={{ 
                                          background: 'transparent', 
                                          cursor: 'default',
                                          display: 'block',
                                          marginBottom: '8px' 
                                        }}>
                                          <span>{formData.primaryEmail}</span>
                                          <span title="Primary Email" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                          <span 
                                            onClick={() => handleInputChange('primaryEmail', null)}
                                            title="Remove email" 
                                            style={{ 
                                              fontSize: '12px', 
                                              marginLeft: '5px', 
                                              color: '#00ff00',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            ✕
                                          </span>
                                        </Tag>
                                      )}

                                      {/* For backward compatibility */}
                                      {formData.additionalEmails && formData.additionalEmails.length > 0 && (
                                        formData.additionalEmails.map((email, idx) => (
                                          <Tag 
                                            key={`additional-${idx}`}
                                            style={{ 
                                              background: 'transparent', 
                                              cursor: 'default',
                                              display: 'block',
                                              marginBottom: '8px'
                                            }}
                                          >
                                            <span>{email}</span>
                                            <span 
                                              onClick={() => {
                                                // Remove this email from additionalEmails
                                                const updatedEmails = [...formData.additionalEmails];
                                                updatedEmails.splice(idx, 1);
                                                handleInputChange('additionalEmails', updatedEmails);
                                              }}
                                              title="Remove email" 
                                              style={{ 
                                                fontSize: '12px', 
                                                marginLeft: '5px', 
                                                color: '#00ff00',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              ✕
                                            </span>
                                          </Tag>
                                        ))
                                      )}
                                      <Tag 
                                        onClick={() => setShowManageContactEmailsModal(true)}
                                        style={{ 
                                          background: 'transparent', 
                                          color: '#00ff00', 
                                          cursor: 'pointer',
                                          border: 'none'
                                        }}
                                      >
                                        <span style={{ fontSize: '14px' }}>+ Add Email</span>
                                      </Tag>
                                    </TagsContainer>
                                  </td>
                                </tr>

                                {/* Mobile Numbers Row */}
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  <td style={{ padding: '12px 15px', color: '#999' }}>
                                    <a 
                                      href={`https://app.timelines.ai/?q=${contact.last_name || ''}%20${contact.first_name || ''}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#999', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                                    >
                                      <span>Mobiles</span>
                                      <span style={{ marginLeft: '5px', fontSize: '10px' }}>↗</span>
                                    </a>
                                  </td>
                                  <td style={{ padding: '12px 15px', minHeight: '50px', verticalAlign: 'top' }}>
                                    <TagsContainer>
                                      {contact.mobiles && contact.mobiles.length > 0 ? (
                                        contact.mobiles.map((mobileObj, idx) => (
                                          <Tag 
                                            key={mobileObj.mobile_id || idx}
                                            style={{ 
                                              cursor: 'default',
                                              background: 'transparent',
                                              display: 'block',
                                              marginBottom: '4px'
                                            }}
                                          >
                                            <span>{mobileObj.mobile}</span>
                                            {mobileObj.is_primary && (
                                              <span title="Primary Mobile" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                            )}
                                            {mobileObj.type && (
                                              <span style={{ fontSize: '0.8em', opacity: 0.8, marginLeft: '3px' }}>
                                                ({mobileObj.type})
                                              </span>
                                            )}
                                          </Tag>
                                        ))
                                      ) : contact.mobile ? (
                                        <Tag style={{ background: 'transparent', cursor: 'default', display: 'block' }}>
                                          {contact.mobile}
                                        </Tag>
                                      ) : (
                                        '-'
                                      )}
                                    </TagsContainer>
                                  </td>
                                  <td style={{ padding: '12px 15px', minHeight: '50px', verticalAlign: 'top' }}>
                                    <TagsContainer>
                                      {airtableContact?.phone_numbers && airtableContact.phone_numbers.length > 0 ? (
                                        airtableContact.phone_numbers.map((phoneObj, idx) => {
                                          // Check if phoneObj is not null and has number property
                                          const phoneStr = typeof phoneObj === 'string' 
                                            ? phoneObj 
                                            : (phoneObj && typeof phoneObj === 'object' && phoneObj.number) 
                                              ? phoneObj.number 
                                              : null;
                                          
                                          if (!phoneStr) return null;
                                          
                                          return (
                                            <Tag 
                                              key={idx}
                                              style={{ 
                                                cursor: 'default',
                                                background: 'transparent',
                                                display: 'block',
                                                marginBottom: '4px'
                                              }}
                                              // Click functionality disabled for future modal implementation
                                            >
                                              <span>{phoneStr}</span>
                                              {phoneObj && typeof phoneObj === 'object' && phoneObj.is_primary && (
                                                <span title="Primary Phone" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                              )}
                                            </Tag>
                                          );
                                        })
                                      ) : airtableContact?.phone_number_1 ? (
                                        <Tag 
                                          style={{ 
                                            background: 'transparent', 
                                            cursor: 'default',
                                            display: 'block',
                                            marginBottom: '4px'
                                          }}
                                          // Click functionality disabled for future modal implementation
                                        >
                                          <span>{airtableContact.phone_number_1}</span>
                                        </Tag>
                                      ) : (
                                        '-'
                                      )}
                                    </TagsContainer>
                                  </td>
                                  <td style={{ padding: '12px 15px', minHeight: '50px', verticalAlign: 'top' }}>
                                    <TagsContainer>
                                      {/* Show mobiles from contact.mobiles */}
                                      {contact.mobiles && contact.mobiles.length > 0 ? (
                                        contact.mobiles.map((mobileObj, idx) => (
                                          <Tag 
                                            key={`contact-${idx}`}
                                            style={{ 
                                              background: 'transparent', 
                                              cursor: 'default',
                                              display: 'block',
                                              marginBottom: '4px'
                                            }}
                                          >
                                            <span>{mobileObj.mobile}</span>
                                            {mobileObj.is_primary && (
                                              <span title="Primary Mobile" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                            )}
                                            {mobileObj.type && (
                                              <span style={{ fontSize: '0.8em', opacity: 0.8, marginLeft: '3px' }}>
                                                ({mobileObj.type})
                                              </span>
                                            )}
                                          </Tag>
                                        ))
                                      ) : contact.mobile ? (
                                        <Tag style={{ background: 'transparent', cursor: 'default', display: 'block' }}>
                                          <span>{contact.mobile}</span>
                                          <span title="Primary Mobile" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                        </Tag>
                                      ) : null}
                                      
                                      {/* Show new mobiles added from contactMobiles */}
                                      {formData.contactMobiles && formData.contactMobiles.length > 0 && 
                                        formData.contactMobiles.map((mobileObj, idx) => {
                                          // Check if this mobile already exists in contact.mobiles
                                          const existsInContact = contact.mobiles?.some(m => m.mobile === mobileObj.mobile);
                                          
                                          // Only show if it doesn't exist in contact.mobiles
                                          if (!existsInContact) {
                                            return (
                                              <Tag 
                                                key={`new-${idx}`}
                                                style={{ 
                                                  background: 'transparent', 
                                                  cursor: 'default',
                                                  display: 'block',
                                                  marginBottom: '4px'
                                                }}
                                              >
                                                <span>{mobileObj.mobile}</span>
                                                {mobileObj.is_primary && (
                                                  <span title="Primary Mobile" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                                )}
                                                {mobileObj.type && (
                                                  <span style={{ fontSize: '0.8em', opacity: 0.8, marginLeft: '3px' }}>
                                                    ({mobileObj.type})
                                                  </span>
                                                )}
                                                <span 
                                                  onClick={() => {
                                                    // Remove this mobile from contactMobiles
                                                    const updatedMobiles = [...formData.contactMobiles];
                                                    updatedMobiles.splice(idx, 1);
                                                    handleInputChange('contactMobiles', updatedMobiles);
                                                  }}
                                                  title="Remove mobile" 
                                                  style={{ 
                                                    fontSize: '12px', 
                                                    marginLeft: '5px', 
                                                    color: '#00ff00',
                                                    cursor: 'pointer'
                                                  }}
                                                >
                                                  ✕
                                                </span>
                                              </Tag>
                                            );
                                          }
                                          return null;
                                        })
                                      }
                                      
                                      {/* For backward compatibility */}
                                      {!contact.mobiles && formData.primaryPhone && !contact.mobile && (
                                        <Tag style={{ 
                                          background: 'transparent', 
                                          cursor: 'default',
                                          display: 'block',
                                          marginBottom: '4px'
                                        }}>
                                          <span>{formData.primaryPhone}</span>
                                          <span title="Primary Mobile" style={{ fontSize: '10px', marginLeft: '3px' }}>★</span>
                                          <span 
                                            onClick={() => handleInputChange('primaryPhone', null)}
                                            title="Remove mobile" 
                                            style={{ 
                                              fontSize: '12px', 
                                              marginLeft: '5px', 
                                              color: '#00ff00',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            ✕
                                          </span>
                                        </Tag>
                                      )}
                                      
                                      {/* Add new mobile button */}
                                      <Tag 
                                        onClick={() => setShowManageContactMobilesModal(true)}
                                        style={{ 
                                          background: 'transparent', 
                                          color: '#00ff00', 
                                          cursor: 'pointer',
                                          border: 'none'
                                        }}
                                      >
                                        <span style={{ fontSize: '14px' }}>+ Add Mobile</span>
                                      </Tag>
                                    </TagsContainer>
                                  </td>
                                </tr>

                                {/* Keep in Touch Row */}
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  <td style={{ padding: '12px 15px', color: '#999' }}>Keep in Touch</td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div style={{ 
                                      cursor: 'default',
                                      padding: '8px 12px'
                                    }}>
                                      {contact.keep_in_touch_frequency || '-'}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div 
                                      onClick={async () => {
                                        if (airtableContact && airtableContact.keep_in_touch) {
                                          const newValue = airtableContact.keep_in_touch;
                                          
                                          // Update formData
                                          handleInputChange('keepInTouch', newValue);
                                          
                                          // Update contact object
                                          const updatedContact = {...contact, keep_in_touch_frequency: newValue};
                                          setContact(updatedContact);
                                          
                                          // Save to database
                                          try {
                                            const { error } = await supabase
                                              .from('contacts')
                                              .update({ keep_in_touch_frequency: newValue })
                                              .eq('contact_id', contact.contact_id);
                                              
                                            if (error) {
                                              console.error('Error updating keep_in_touch_frequency:', error);
                                              toast.error('Failed to update keep in touch frequency');
                                            } else {
                                              toast.success('Keep in touch frequency updated');
                                            }
                                          } catch (err) {
                                            console.error('Exception updating keep_in_touch_frequency:', err);
                                            toast.error('Failed to update keep in touch frequency');
                                          }
                                        }
                                      }}
                                      style={{ 
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      <span>{airtableContact?.keep_in_touch || '-'}</span>
                                      <span style={{ color: '#00ff00', fontSize: '12px', marginLeft: '10px' }}>
                                        → 
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div style={{ padding: '8px 12px' }}>
                                      <Select 
                                        value={formData.keepInTouch || contact.keep_in_touch_frequency || 'Not Set'}
                                        onChange={async (e) => {
                                          const newValue = e.target.value === 'Not Set' ? null : e.target.value;
                                          
                                          // Update formData
                                          handleInputChange('keepInTouch', newValue);
                                          
                                          // Update contact object
                                          const updatedContact = {...contact, keep_in_touch_frequency: newValue};
                                          setContact(updatedContact);
                                          
                                          // Save to database immediately
                                          try {
                                            console.log('Updating keep_in_touch_frequency to:', newValue);
                                            
                                            // Get current contact ID for debugging
                                            console.log('Contact ID:', contact.contact_id);
                                            
                                            // Print all contact data for debugging
                                            console.log('Current contact data:', contact);
                                            
                                            const { data, error } = await supabase
                                              .from('contacts')
                                              .update({ keep_in_touch_frequency: newValue })
                                              .eq('contact_id', contact.contact_id)
                                              .select();
                                              
                                            if (error) {
                                              console.error('Error updating keep_in_touch_frequency:', error);
                                              toast.error('Failed to update keep in touch frequency');
                                            } else {
                                              console.log('Successfully updated keep_in_touch_frequency, response:', data);
                                              toast.success('Keep in touch frequency updated');
                                            }
                                          } catch (err) {
                                            console.error('Exception updating keep_in_touch_frequency:', err);
                                            toast.error('Failed to update keep in touch frequency');
                                          }
                                        }}
                                        style={{ 
                                          background: 'transparent',
                                          border: 'none',
                                          color: '#fff',
                                          cursor: 'pointer',
                                          width: '100%',
                                          padding: '0',
                                          fontSize: '14px'
                                        }}
                                      >
                                        <option value="Not Set">Not Set</option>
                                        <option value="Monthly">Monthly</option>
                                        <option value="Quarterly">Quarterly</option>
                                        <option value="Twice per Year">Twice per Year</option>
                                        <option value="Once per Year">Once per Year</option>
                                        <option value="Weekly">Weekly</option>
                                        <option value="Do not keep in touch">Do not keep in touch</option>
                                      </Select>
                                    </div>
                                  </td>
                                </tr>

                                {/* Category Row */}
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  <td style={{ padding: '12px 15px', color: '#999' }}>Category</td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div style={{ 
                                      cursor: 'default',
                                      padding: '8px 12px'
                                    }}>
                                      {contact.category || '-'}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div 
                                      onClick={async () => {
                                        if (airtableContact && airtableContact.category) {
                                          const newValue = airtableContact.category;
                                          
                                          // Update formData
                                          handleInputChange('category', newValue);
                                          
                                          // Update contact object
                                          const updatedContact = {...contact, category: newValue};
                                          setContact(updatedContact);
                                          
                                          // Save to database
                                          try {
                                            const { error } = await supabase
                                              .from('contacts')
                                              .update({ category: newValue })
                                              .eq('contact_id', contact.contact_id);
                                              
                                            if (error) {
                                              console.error('Error updating category:', error);
                                              toast.error('Failed to update category');
                                            } else {
                                              toast.success('Category updated');
                                            }
                                          } catch (err) {
                                            console.error('Exception updating category:', err);
                                            toast.error('Failed to update category');
                                          }
                                        }
                                      }}
                                      style={{ 
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      <span>{airtableContact?.category || '-'}</span>
                                      <span style={{ color: '#00ff00', fontSize: '12px', marginLeft: '10px' }}>
                                        → 
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div style={{ padding: '8px 12px' }}>
                                      <Select 
                                        value={formData.category || contact.category || ''}
                                        onChange={async (e) => {
                                          const newValue = e.target.value === '' ? null : e.target.value;
                                          
                                          // Update formData
                                          handleInputChange('category', newValue);
                                          
                                          // Update contact object
                                          const updatedContact = {...contact, category: newValue};
                                          setContact(updatedContact);
                                          
                                          // Save to database immediately
                                          try {
                                            console.log('Updating category to:', newValue);
                                            console.log('Contact ID:', contact.contact_id);
                                            
                                            const { data, error } = await supabase
                                              .from('contacts')
                                              .update({ category: newValue })
                                              .eq('contact_id', contact.contact_id)
                                              .select();
                                              
                                            if (error) {
                                              console.error('Error updating category:', error);
                                              toast.error('Failed to update category');
                                            } else {
                                              console.log('Successfully updated category, response:', data);
                                              toast.success('Category updated');
                                            }
                                          } catch (err) {
                                            console.error('Exception updating category:', err);
                                            toast.error('Failed to update category');
                                          }
                                        }}
                                        style={{ 
                                          background: 'transparent',
                                          border: 'none',
                                          color: '#fff',
                                          cursor: 'pointer',
                                          width: '100%',
                                          padding: '0',
                                          fontSize: '14px'
                                        }}
                                      >
                                        <option value="Inbox">Inbox</option>
                                        <option value="Professional Investor">Professional Investor</option>
                                        <option value="Team">Team</option>
                                        <option value="Advisor">Advisor</option>
                                        <option value="Supplier">Supplier</option>
                                        <option value="System">System</option>
                                        <option value="Founder">Founder</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Friend and Family">Friend and Family</option>
                                        <option value="Other">Other</option>
                                        <option value="Student">Student</option>
                                        <option value="Media">Media</option>
                                        <option value="Institution">Institution</option>
                                      </Select>
                                    </div>
                                  </td>
                                </tr>
{/* ─────────── Cities Row (specular to Tags) ─────────── */}
<tr style={{ borderBottom: '1px solid #333' }}>
  <td style={{ padding: '12px 15px', color: '#999' }}>Cities</td>

  {/* 1. Current Cities (formData first, then contact) */}
  <td style={{ padding: '12px 15px' }}>
    <TagsContainer>
      {formData.cities && formData.cities.length > 0 ? (
        formData.cities.map((city, idx) => (
          <Tag
            key={`formdata-city-${idx}`}
            style={{
              background: 'transparent',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '4px 8px',
              margin: '2px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span>{city.name}</span>
          </Tag>
        ))
      ) : contact.cities && contact.cities.length > 0 ? (
        contact.cities.map((city, idx) => (
          <Tag
            key={`contact-city-${idx}`}
            style={{
              background: 'transparent',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '4px 8px',
              margin: '2px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span>{city.name}</span>
          </Tag>
        ))
      ) : (
        '-'
      )}
    </TagsContainer>
  </td>

  {/* 2. Suggestions from Airtable */}
  <td style={{ padding: '12px 15px' }}>
    <TagsContainer>
      {airtableContact?.city ? (
        airtableContact.city.split(',').map((raw, idx) => {
          const trimmedCity = raw.trim();
          if (!trimmedCity) return null;

          return (
            <Tag
              key={`airtable-city-${idx}`}
              style={{
                background: 'transparent',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                padding: '4px 8px',
                margin: '2px',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={async () => {
                try {
                  /* Check if city exists */
                  const { data: existingCity, error: searchError } = await supabase
                    .from('cities')
                    .select('city_id')
                    .ilike('name', trimmedCity)
                    .maybeSingle();

                  if (searchError) {
                    console.error('Error searching for city:', searchError);
                    toast.error('Failed to search for city');
                    return;
                  }

                  let cityId;

                  /* Create city if needed */
                  if (!existingCity) {
                    const { data: newCity, error: createError } = await supabase
                      .from('cities')
                      .insert({ name: trimmedCity })
                      .select('city_id')
                      .single();

                    if (createError) {
                      console.error('Error creating city:', createError);
                      toast.error('Failed to create city');
                      return;
                    }

                    cityId = newCity.city_id;
                  } else {
                    cityId = existingCity.city_id;
                  }

                  /* Link city to contact if not linked */
                  const { data: existingContactCity, error: checkError } = await supabase
                    .from('contact_cities')
                    .select('entry_id')
                    .eq('contact_id', contact.contact_id)
                    .eq('city_id', cityId)
                    .maybeSingle();

                  if (checkError) {
                    console.error('Error checking contact city:', checkError);
                    toast.error('Failed to check city link');
                    return;
                  }

                  if (!existingContactCity) {
                    const { error: linkError } = await supabase
                      .from('contact_cities')
                      .insert({ contact_id: contact.contact_id, city_id: cityId });

                    if (linkError) {
                      console.error('Error linking city to contact:', linkError);
                      toast.error('Failed to add city');
                      return;
                    }

                    /* Update state */
                    const updatedContact = { ...contact };
                    if (!updatedContact.cities) updatedContact.cities = [];
                    updatedContact.cities.push({ city_id: cityId, name: trimmedCity });
                    setContact(updatedContact);

                    if (formData.cities) {
                      setFormData({
                        ...formData,
                        cities: [...formData.cities, { city_id: cityId, name: trimmedCity }],
                      });
                    }

                    toast.success(`City "${trimmedCity}" added`);
                  } else {
                    toast.info(`City "${trimmedCity}" already exists on contact`);
                  }
                } catch (err) {
                  console.error('Exception handling city:', err);
                  toast.error('Failed to process city');
                }
              }}
            >
              <span>{trimmedCity}</span>
              <span
                style={{
                  color: '#00ff00',
                  fontSize: '12px',
                  marginLeft: '5px',
                }}
              >
                →
              </span>
            </Tag>
          );
        }).filter(Boolean)
      ) : (
        '-'
      )}
    </TagsContainer>
  </td>

  {/* 3. Editable list with remove + Add City */}
  <td style={{ padding: '12px 15px' }}>
    <TagsContainer>
      {formData.cities && formData.cities.length > 0 ? (
        formData.cities.map((city, idx) => (
          <Tag
            key={`formdata-city-edit-${idx}`}
            style={{
              background: 'transparent',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '4px 8px',
              margin: '2px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span>{city.name}</span>
            <span
              onClick={async () => {
                try {
                  /* Remove from formData */
                  const updatedCities = formData.cities.filter((_, i) => i !== idx);
                  handleInputChange('cities', updatedCities);

                  /* Remove link in DB */
                  const { error } = await supabase
                    .from('contact_cities')
                    .delete()
                    .eq('contact_id', contact.contact_id)
                    .eq('city_id', city.city_id);

                  if (error) {
                    console.error('Error removing city from contact:', error);
                    toast.error('Failed to remove city');
                  } else {
                    /* Update contact state */
                    const updatedContact = { ...contact };
                    if (updatedContact.cities) {
                      updatedContact.cities = updatedContact.cities.filter(
                        c => c.city_id !== city.city_id
                      );
                      setContact(updatedContact);
                    }

                    toast.success(`City "${city.name}" removed`);
                  }
                } catch (err) {
                  console.error('Exception removing city:', err);
                  toast.error('Failed to remove city');
                }
              }}
              title="Remove city"
              style={{
                fontSize: '12px',
                marginLeft: '5px',
                color: '#00ff00',
                cursor: 'pointer',
              }}
            >
              ✕
            </span>
          </Tag>
        ))
      ) : contact.cities && contact.cities.length > 0 ? (
        contact.cities.map((city, idx) => (
          <Tag
            key={`contact-city-edit-${idx}`}
            style={{
              background: 'transparent',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '4px 8px',
              margin: '2px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span>{city.name}</span>
            <span
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('contact_cities')
                    .delete()
                    .eq('contact_id', contact.contact_id)
                    .eq('city_id', city.city_id);

                  if (error) {
                    console.error('Error removing city from contact:', error);
                    toast.error('Failed to remove city');
                  } else {
                    const updatedContact = { ...contact };
                    updatedContact.cities = updatedContact.cities.filter(
                      c => c.city_id !== city.city_id
                    );
                    setContact(updatedContact);
                    toast.success(`City "${city.name}" removed`);
                  }
                } catch (err) {
                  console.error('Exception removing city:', err);
                  toast.error('Failed to remove city');
                }
              }}
              title="Remove city"
              style={{
                fontSize: '12px',
                marginLeft: '5px',
                color: '#00ff00',
                cursor: 'pointer',
              }}
            >
              ✕
            </span>
          </Tag>
        ))
      ) : (
        '-'
      )}

      {/* Add new city */}
      <Tag
        style={{
          background: 'transparent',
          color: '#00ff00',
          cursor: 'pointer',
          border: 'none',
          padding: '4px 8px',
        }}
        onClick={async () => {
          const cityName = prompt('Enter new city:');
          if (!cityName || !cityName.trim()) return;

          const trimmedCityName = cityName.trim();

          try {
            /* Check if city exists */
            const { data: existingCity, error: searchError } = await supabase
              .from('cities')
              .select('city_id')
              .ilike('name', trimmedCityName)
              .maybeSingle();

            if (searchError) {
              console.error('Error searching for city:', searchError);
              toast.error('Failed to search for city');
              return;
            }

            let cityId;

            if (!existingCity) {
              const { data: newCity, error: createError } = await supabase
                .from('cities')
                .insert({ name: trimmedCityName })
                .select('city_id')
                .single();

              if (createError) {
                console.error('Error creating city:', createError);
                toast.error('Failed to create city');
                return;
              }

              cityId = newCity.city_id;
            } else {
              cityId = existingCity.city_id;
            }

            /* Link city */
            const { data: existingContactCity, error: checkError } = await supabase
              .from('contact_cities')
              .select('entry_id')
              .eq('contact_id', contact.contact_id)
              .eq('city_id', cityId)
              .maybeSingle();

            if (checkError) {
              console.error('Error checking contact city:', checkError);
              toast.error('Failed to check city link');
              return;
            }

            if (!existingContactCity) {
              const { error: linkError } = await supabase
                .from('contact_cities')
                .insert({ contact_id: contact.contact_id, city_id: cityId });

              if (linkError) {
                console.error('Error linking city to contact:', linkError);
                toast.error('Failed to add city');
                return;
              }

              const updatedContact = { ...contact };
              if (!updatedContact.cities) updatedContact.cities = [];
              updatedContact.cities.push({ city_id: cityId, name: trimmedCityName });
              setContact(updatedContact);

              toast.success(`City "${trimmedCityName}" added`);
            } else {
              toast.info(`City "${trimmedCityName}" already exists on contact`);
            }
          } catch (err) {
            console.error('Exception handling city:', err);
            toast.error('Failed to process city');
          }
        }}
        onClick={() => setShowCityModal(true)}
      >
        <span style={{ fontSize: '16px' }}>+</span> Add City
      </Tag>
    </TagsContainer>
  </td>
</tr>

                                                                {/* Tags Row */}
                                                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  {console.log('FULL CONTACT OBJECT:', contact)}
                                  <td style={{ padding: '12px 15px', color: '#999' }}>Tags</td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <TagsContainer>
                                      {formData.tags && formData.tags.length > 0 ? (
                                        formData.tags.map((tag, idx) => (
                                          <Tag 
                                            key={`formdata-tag-${idx}`}
                                            style={{ 
                                              background: 'transparent', 
                                              border: '1px solid #00ff00',
                                              borderRadius: '4px',
                                              padding: '4px 8px',
                                              margin: '2px',
                                              display: 'inline-flex',
                                              alignItems: 'center'
                                            }}
                                          >
                                            <span>{tag.name}</span>
                                          </Tag>
                                        ))
                                      ) : contact.tags && contact.tags.length > 0 ? (
                                        contact.tags.map((tag, idx) => (
                                          <Tag 
                                            key={`contact-tag-${idx}`}
                                            style={{ 
                                              background: 'transparent', 
                                              border: '1px solid #00ff00',
                                              borderRadius: '4px',
                                              padding: '4px 8px',
                                              margin: '2px',
                                              display: 'inline-flex',
                                              alignItems: 'center'
                                            }}
                                          >
                                            <span>{tag.name}</span>
                                          </Tag>
                                        ))
                                      ) : (
                                        '-'
                                      )}
                                    </TagsContainer>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <TagsContainer>
                                      {airtableContact?.keywords ? (
                                        airtableContact.keywords.split(',').map((tag, idx) => {
                                          const trimmedTag = tag.trim();
                                          if (!trimmedTag) return null;
                                          
                                          return (
                                            <Tag 
                                              key={`airtable-tag-${idx}`}
                                              style={{ 
                                                background: 'transparent', 
                                                border: '1px solid #00ff00',
                                                borderRadius: '4px',
                                                padding: '4px 8px',
                                                margin: '2px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                cursor: 'pointer'
                                              }}
                                              onClick={async () => {
                                                try {
                                                  // First check if tag already exists in tags table
                                                  const { data: existingTag, error: searchError } = await supabase
                                                    .from('tags')
                                                    .select('tag_id')
                                                    .eq('name', trimmedTag)
                                                    .maybeSingle();
                                                  
                                                  if (searchError) {
                                                    console.error('Error searching for tag:', searchError);
                                                    toast.error('Failed to search for tag');
                                                    return;
                                                  }
                                                  
                                                  let tagId;
                                                  
                                                  // If tag doesn't exist, create it
                                                  if (!existingTag) {
                                                    const { data: newTag, error: createError } = await supabase
                                                      .from('tags')
                                                      .insert({ name: trimmedTag })
                                                      .select('tag_id')
                                                      .single();
                                                    
                                                    if (createError) {
                                                      console.error('Error creating tag:', createError);
                                                      toast.error('Failed to create tag');
                                                      return;
                                                    }
                                                    
                                                    tagId = newTag.tag_id;
                                                  } else {
                                                    tagId = existingTag.tag_id;
                                                  }
                                                  
                                                  // Check if tag is already associated with contact
                                                  const { data: existingContactTag, error: checkError } = await supabase
                                                    .from('contact_tags')
                                                    .select('entry_id')
                                                    .eq('contact_id', contact.contact_id)
                                                    .eq('tag_id', tagId)
                                                    .maybeSingle();
                                                  
                                                  if (checkError) {
                                                    console.error('Error checking contact tag:', checkError);
                                                    toast.error('Failed to check if tag exists');
                                                    return;
                                                  }
                                                  
                                                  // If tag is not already associated, create the association
                                                  if (!existingContactTag) {
                                                    const { error: linkError } = await supabase
                                                      .from('contact_tags')
                                                      .insert({
                                                        contact_id: contact.contact_id,
                                                        tag_id: tagId
                                                      });
                                                    
                                                    if (linkError) {
                                                      console.error('Error linking tag to contact:', linkError);
                                                      toast.error('Failed to add tag to contact');
                                                      return;
                                                    }
                                                    
                                                    // Add the tag to the contact's tags array in state
                                                    const updatedContact = { ...contact };
                                                    if (!updatedContact.tags) updatedContact.tags = [];
                                                    
                                                    // Add the new tag to the contact's tags array
                                                    updatedContact.tags.push({ tag_id: tagId, name: trimmedTag });
                                                    
                                                    // Update the contact state to refresh the UI
                                                    setContact(updatedContact);
                                                    
                                                    // Also update the formData if it has tags
                                                    if (formData.tags) {
                                                      const updatedFormData = { ...formData };
                                                      updatedFormData.tags = [...formData.tags, { tag_id: tagId, name: trimmedTag }];
                                                      setFormData(updatedFormData);
                                                    }
                                                    
                                                    toast.success(`Tag "${trimmedTag}" added to contact`);
                                                    
                                                    // Refresh the tags display by triggering a re-render
                                                    setTimeout(() => {
                                                      const refreshedContact = { ...updatedContact };
                                                      setContact(refreshedContact);
                                                    }, 100);
                                                  } else {
                                                    toast.info(`Tag "${trimmedTag}" already exists on contact`);
                                                  }
                                                } catch (err) {
                                                  console.error('Exception handling tag:', err);
                                                  toast.error('Failed to process tag');
                                                }
                                              }}
                                            >
                                              <span>{trimmedTag}</span>
                                              <span style={{ color: '#00ff00', fontSize: '12px', marginLeft: '5px' }}>→</span>
                                            </Tag>
                                          );
                                        }).filter(Boolean)
                                      ) : (
                                        '-'
                                      )}
                                    </TagsContainer>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <TagsContainer>
                                      {formData.tags && formData.tags.length > 0 ? (
                                        formData.tags.map((tag, idx) => (
                                          <Tag 
                                            key={`formdata-tag-${idx}`}
                                            style={{ 
                                              background: 'transparent', 
                                              border: '1px solid #00ff00',
                                              borderRadius: '4px',
                                              padding: '4px 8px',
                                              margin: '2px',
                                              display: 'inline-flex',
                                              alignItems: 'center'
                                            }}
                                          >
                                            <span>{tag.name}</span>
                                            <span 
                                              onClick={async () => {
                                                try {
                                                  // Remove from formData
                                                  const updatedTags = formData.tags.filter((_, i) => i !== idx);
                                                  handleInputChange('tags', updatedTags);
                                                  
                                                  // Remove from contact_tags in the database
                                                  const { error } = await supabase
                                                    .from('contact_tags')
                                                    .delete()
                                                    .eq('contact_id', contact.contact_id)
                                                    .eq('tag_id', tag.tag_id);
                                                  
                                                  if (error) {
                                                    console.error('Error removing tag from contact:', error);
                                                    toast.error('Failed to remove tag');
                                                  } else {
                                                    // Update the contact's tags array in state
                                                    const updatedContact = { ...contact };
                                                    if (updatedContact.tags) {
                                                      updatedContact.tags = updatedContact.tags.filter(t => t.tag_id !== tag.tag_id);
                                                      setContact(updatedContact);
                                                    }
                                                    
                                                    toast.success(`Tag "${tag.name}" removed`);
                                                  }
                                                } catch (err) {
                                                  console.error('Exception removing tag:', err);
                                                  toast.error('Failed to remove tag');
                                                }
                                              }}
                                              title="Remove tag" 
                                              style={{ 
                                                fontSize: '12px', 
                                                marginLeft: '5px', 
                                                color: '#00ff00',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              ✕
                                            </span>
                                          </Tag>
                                        ))
                                      ) : contact.tags && contact.tags.length > 0 ? (
                                        contact.tags.map((tag, idx) => (
                                          <Tag 
                                            key={`contact-tag-${idx}`}
                                            style={{ 
                                              background: 'transparent', 
                                              border: '1px solid #00ff00',
                                              borderRadius: '4px',
                                              padding: '4px 8px',
                                              margin: '2px',
                                              display: 'inline-flex',
                                              alignItems: 'center'
                                            }}
                                          >
                                            <span>{tag.name}</span>
                                            <span 
                                              onClick={async () => {
                                                try {
                                                  // Remove from contact_tags in the database
                                                  const { error } = await supabase
                                                    .from('contact_tags')
                                                    .delete()
                                                    .eq('contact_id', contact.contact_id)
                                                    .eq('tag_id', tag.tag_id);
                                                  
                                                  if (error) {
                                                    console.error('Error removing tag from contact:', error);
                                                    toast.error('Failed to remove tag');
                                                  } else {
                                                    // Update the contact's tags array in state
                                                    const updatedContact = { ...contact };
                                                    updatedContact.tags = updatedContact.tags.filter(t => t.tag_id !== tag.tag_id);
                                                    setContact(updatedContact);
                                                    
                                                    toast.success(`Tag "${tag.name}" removed`);
                                                  }
                                                } catch (err) {
                                                  console.error('Exception removing tag:', err);
                                                  toast.error('Failed to remove tag');
                                                }
                                              }}
                                              title="Remove tag" 
                                              style={{ 
                                                fontSize: '12px', 
                                                marginLeft: '5px', 
                                                color: '#00ff00',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              ✕
                                            </span>
                                          </Tag>
                                        ))
                                      ) : (
                                        '-'
                                      )}
                                      {/* Add new tag button */}
                                      <Tag 
                                        style={{ 
                                          background: 'transparent', 
                                          color: '#00ff00', 
                                          cursor: 'pointer',
                                          border: 'none',
                                          padding: '4px 8px'
                                        }}
                                        onClick={async () => {
                                          const tagName = prompt('Enter new tag:');
                                          if (!tagName || !tagName.trim()) return;
                                          
                                          const trimmedTagName = tagName.trim();
                                          
                                          try {
                                            // First check if tag already exists in tags table
                                            const { data: existingTag, error: searchError } = await supabase
                                              .from('tags')
                                              .select('tag_id')
                                              .eq('name', trimmedTagName)
                                              .maybeSingle();
                                            
                                            if (searchError) {
                                              console.error('Error searching for tag:', searchError);
                                              toast.error('Failed to search for tag');
                                              return;
                                            }
                                            
                                            let tagId;
                                            
                                            // If tag doesn't exist, create it
                                            if (!existingTag) {
                                              const { data: newTag, error: createError } = await supabase
                                                .from('tags')
                                                .insert({ name: trimmedTagName })
                                                .select('tag_id')
                                                .single();
                                              
                                              if (createError) {
                                                console.error('Error creating tag:', createError);
                                                toast.error('Failed to create tag');
                                                return;
                                              }
                                              
                                              tagId = newTag.tag_id;
                                            } else {
                                              tagId = existingTag.tag_id;
                                            }
                                            
                                            // Check if tag is already associated with contact
                                            const { data: existingContactTag, error: checkError } = await supabase
                                              .from('contact_tags')
                                              .select('entry_id')
                                              .eq('contact_id', contact.contact_id)
                                              .eq('tag_id', tagId)
                                              .maybeSingle();
                                            
                                            if (checkError) {
                                              console.error('Error checking contact tag:', checkError);
                                              toast.error('Failed to check if tag exists');
                                              return;
                                            }
                                            
                                            // If tag is not already associated, create the association
                                            if (!existingContactTag) {
                                              const { error: linkError } = await supabase
                                                .from('contact_tags')
                                                .insert({
                                                  contact_id: contact.contact_id,
                                                  tag_id: tagId
                                                });
                                              
                                              if (linkError) {
                                                console.error('Error linking tag to contact:', linkError);
                                                toast.error('Failed to add tag to contact');
                                                return;
                                              }
                                              
                                              // Add the tag to the contact's tags array in state
                                              const updatedContact = { ...contact };
                                              if (!updatedContact.tags) updatedContact.tags = [];
                                              
                                              updatedContact.tags.push({ tag_id: tagId, name: trimmedTagName });
                                              setContact(updatedContact);
                                              
                                              toast.success(`Tag "${trimmedTagName}" added to contact`);
                                            } else {
                                              toast.info(`Tag "${trimmedTagName}" already exists on contact`);
                                            }
                                          } catch (err) {
                                            console.error('Exception handling tag:', err);
                                            toast.error('Failed to process tag');
                                          }
                                        }}
                                        onClick={() => setShowTagsModal(true)}
                                      >
                                        <span style={{ fontSize: '16px' }}>+</span> Add Tag
                                      </Tag>
                                    </TagsContainer>
                                  </td>
                                </tr>


                                {/* Rating Row */}
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  <td style={{ padding: '12px 15px', color: '#999' }}>Rating</td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <span 
                                          key={star}
                                          style={{ 
                                            color: (contact.score || 0) >= star ? '#00ff00' : '#333',
                                            fontSize: '16px',
                                            marginRight: '3px',
                                            cursor: 'default',
                                            WebkitTextStroke: (contact.score || 0) >= star ? 'none' : '1px #555',
                                            textShadow: 'none'
                                          }}
                                        >
                                          ★
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div 
                                      onClick={async () => {
                                        if (airtableContact && airtableContact.rating) {
                                          const newRating = airtableContact.rating;
                                          
                                          // Update formData with the Airtable rating
                                          handleInputChange('score', newRating);
                                          
                                          // Save to database
                                          try {
                                            const { error } = await supabase
                                              .from('contacts')
                                              .update({ score: newRating })
                                              .eq('contact_id', contact.contact_id);
                                              
                                            if (error) {
                                              console.error('Error updating rating:', error);
                                              toast.error('Failed to update rating');
                                            } else {
                                              toast.success('Rating updated');
                                              // Update the contact with the new rating
                                              setContact({...contact, score: newRating});
                                            }
                                          } catch (err) {
                                            console.error('Exception updating rating:', err);
                                            toast.error('Failed to update rating');
                                          }
                                        }
                                      }}
                                      style={{ 
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <span 
                                            key={star}
                                            style={{ 
                                              color: (airtableContact?.rating || 0) >= star ? '#00ff00' : '#333',
                                              fontSize: '16px',
                                              marginRight: '3px',
                                              WebkitTextStroke: (airtableContact?.rating || 0) >= star ? 'none' : '1px #555',
                                              textShadow: 'none'
                                            }}
                                          >
                                            ★
                                          </span>
                                        ))}
                                      </div>
                                      {airtableContact?.rating && (
                                        <span style={{ color: '#00ff00', fontSize: '12px', marginLeft: '10px' }}>
                                          → 
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <span 
                                          key={star}
                                          onClick={async () => {
                                            // Determine the new rating value
                                            let newRating;
                                            if (star === (formData.score || contact.score)) {
                                              // If clicking on the current star value, clear it
                                              newRating = null;
                                            } else {
                                              // Otherwise set to the clicked star value
                                              newRating = star;
                                            }
                                            
                                            // Update local state first for immediate UI feedback
                                            handleInputChange('score', newRating);
                                            
                                            // Save to Supabase immediately
                                            try {
                                              const { data, error } = await supabase
                                                .from('contacts')
                                                .update({ score: newRating })
                                                .eq('contact_id', contact.contact_id);
                                                
                                              if (error) {
                                                console.error('Error saving rating:', error);
                                                toast.error('Failed to save rating');
                                                // Revert to previous value on error
                                                handleInputChange('score', contact.score);
                                              } else {
                                                // Update was successful
                                                toast.success(`Rating ${newRating ? `set to ${newRating}` : 'cleared'}`);
                                                // Update the contact object with new rating
                                                setContact(prev => ({
                                                  ...prev,
                                                  score: newRating
                                                }));
                                              }
                                            } catch (err) {
                                              console.error('Exception saving rating:', err);
                                              toast.error('Failed to save rating');
                                              // Revert to previous value
                                              handleInputChange('score', contact.score);
                                            }
                                          }}
                                          style={{ 
                                            color: (formData.score !== undefined ? formData.score : contact.score || 0) >= star ? '#00ff00' : '#333',
                                            fontSize: '16px',
                                            marginRight: '3px',
                                            cursor: 'pointer',
                                            WebkitTextStroke: (formData.score !== undefined ? formData.score : contact.score || 0) >= star ? 'none' : '1px #555',
                                            textShadow: 'none'
                                          }}
                                        >
                                          ★
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                </tr>

                                {/* Description Row */}
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  <td style={{ padding: '12px 15px', color: '#999' }}>Description</td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div style={{ 
                                      padding: '8px 12px',
                                      display: 'flex',
                                      alignItems: 'flex-start'
                                    }}>
                                      <div>
                                        {contact.description ? 
                                          (contact.isDescriptionExpanded ? 
                                            contact.description : 
                                            `${contact.description.substring(0, 50)}${contact.description.length > 50 ? '...' : ''}`) 
                                          : '-'}
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div 
                                      onClick={async () => {
                                        if (airtableContact && airtableContact.description) {
                                          const newDescription = airtableContact.description;
                                          
                                          // Update formData with the Airtable description
                                          handleInputChange('description', newDescription);
                                          
                                          // Save to database
                                          try {
                                            const { error } = await supabase
                                              .from('contacts')
                                              .update({ description: newDescription })
                                              .eq('contact_id', contact.contact_id);
                                              
                                            if (error) {
                                              console.error('Error updating description:', error);
                                              toast.error('Failed to update description');
                                            } else {
                                              toast.success('Description updated');
                                              // Update the contact with the new description
                                              setContact({...contact, description: newDescription});
                                            }
                                          } catch (err) {
                                            console.error('Exception updating description:', err);
                                            toast.error('Failed to update description');
                                          }
                                        }
                                      }}
                                      style={{ 
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      <div>
                                        {airtableContact?.description ? 
                                          (airtableContact.isDescriptionExpanded ? 
                                            airtableContact.description : 
                                            `${airtableContact.description.substring(0, 50)}${airtableContact.description.length > 50 ? '...' : ''}`) 
                                          : '-'}
                                      </div>
                                      <span style={{ color: '#00ff00', fontSize: '12px', marginLeft: '10px' }}>
                                        → 
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    {formData.isEditingDescription ? (
                                      <textarea 
                                        value={formData.description !== undefined ? formData.description : (contact.description || '')}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        onKeyDown={async (e) => {
                                          if (e.key === 'Enter' && e.ctrlKey) {
                                            // Confirm edit on Ctrl+Enter
                                            const updatedFormData = {...formData, isEditingDescription: false};
                                            setFormData(updatedFormData);
                                            
                                            // Save to Supabase immediately
                                            try {
                                              const descriptionValue = formData.description !== undefined ? formData.description : (contact.description || '');
                                              const { data, error } = await supabase
                                                .from('contacts')
                                                .update({ description: descriptionValue })
                                                .eq('contact_id', contact.contact_id);
                                                
                                              if (error) {
                                                console.error('Error saving description (final):', error);
                                                toast.error('Failed to save description');
                                              } else {
                                                toast.success('Description saved successfully');
                                                // Update the contact object as well
                                                setContact(prev => ({
                                                  ...prev,
                                                  description: descriptionValue
                                                }));
                                              }
                                            } catch (err) {
                                              console.error('Exception saving description (final):', err);
                                              toast.error('Failed to save description');
                                            }
                                          }
                                        }}
                                        onBlur={async () => {
                                          // Confirm edit on blur
                                          const updatedFormData = {...formData, isEditingDescription: false};
                                          setFormData(updatedFormData);
                                          
                                          // Save to Supabase immediately
                                          try {
                                            const descriptionValue = formData.description !== undefined ? formData.description : (contact.description || '');
                                            const { data, error } = await supabase
                                              .from('contacts')
                                              .update({ description: descriptionValue })
                                              .eq('contact_id', contact.contact_id);
                                              
                                            if (error) {
                                              console.error('Error saving description (final):', error);
                                              toast.error('Failed to save description');
                                            } else {
                                              toast.success('Description saved successfully');
                                              // Update the contact object as well
                                              setContact(prev => ({
                                                ...prev,
                                                description: descriptionValue
                                              }));
                                            }
                                          } catch (err) {
                                            console.error('Exception saving description (final):', err);
                                            toast.error('Failed to save description');
                                          }
                                        }}
                                        autoFocus
                                        style={{ 
                                          width: '100%',
                                          background: 'transparent',
                                          border: 'none',
                                          padding: '8px 12px',
                                          color: '#fff',
                                          minHeight: '80px',
                                          resize: 'vertical'
                                        }}
                                      />
                                    ) : (
                                      <div 
                                        onClick={() => {
                                          const updatedFormData = {...formData, isEditingDescription: true};
                                          setFormData(updatedFormData);
                                        }}
                                        style={{ 
                                          cursor: 'pointer',
                                          padding: '8px 12px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'flex-start'
                                        }}
                                      >
                                        <div>
                                          {formData.description !== undefined || contact.description ? 
                                            (formData.isDescriptionExpanded ? 
                                              (formData.description || contact.description) : 
                                              `${(formData.description || contact.description || '').substring(0, 50)}${(formData.description || contact.description || '').length > 50 ? '...' : ''}`) 
                                            : '-'}
                                        </div>
                                        {formData.description === undefined && (
                                          <span style={{ fontSize: '0.7rem', color: '#999', fontStyle: 'italic', marginLeft: 'auto' }}>
                                            Same as Supabase Now
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>


                                {/* Birthday Row */}
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  <td style={{ padding: '12px 15px', color: '#999' }}>Birthday</td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div style={{ padding: '8px 12px' }}>
                                      {contact.birthday || '-'}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div 
                                      onClick={() => {
                                        if (airtableContact && airtableContact.next_birthday) {
                                          handleInputChange('birthday', airtableContact.next_birthday);
                                        }
                                      }}
                                      style={{ 
                                        cursor: airtableContact?.next_birthday ? 'pointer' : 'default',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      <div>{airtableContact?.next_birthday || '-'}</div>
                                      {airtableContact?.next_birthday && (
                                        <span 
                                          style={{ color: '#00ff00', fontSize: '12px', marginLeft: '10px' }}
                                          title="Transfer to Supabase Final"
                                        >
                                          → 
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      {formData.isEditingBirthday ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          <input 
                                            type="date"
                                            value={formData.birthday || ''}
                                            onChange={async (e) => {
                                              const newBirthday = e.target.value;
                                              
                                              // Update form data first for immediate UI feedback
                                              handleInputChange('birthday', newBirthday);
                                              
                                              // Save to Supabase immediately
                                              try {
                                                const { data, error } = await supabase
                                                  .from('contacts')
                                                  .update({ birthday: newBirthday })
                                                  .eq('contact_id', contact.contact_id);
                                                  
                                                if (error) {
                                                  console.error('Error saving birthday:', error);
                                                  toast.error('Failed to save birthday');
                                                } else {
                                                  toast.success('Birthday saved successfully');
                                                  // Update the contact object with new birthday
                                                  setContact(prev => ({
                                                    ...prev,
                                                    birthday: newBirthday
                                                  }));
                                                }
                                              } catch (err) {
                                                console.error('Exception saving birthday:', err);
                                                toast.error('Failed to save birthday');
                                              }
                                            }}
                                            style={{ 
                                              padding: '4px 8px', 
                                              background: '#222',
                                              border: '1px solid #444',
                                              borderRadius: '4px',
                                              color: '#fff',
                                              fontSize: '14px'
                                            }}
                                          />
                                          
                                          <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                              onClick={() => {
                                                setFormData(prev => ({...prev, isEditingBirthday: false}));
                                              }}
                                              style={{
                                                padding: '4px 8px',
                                                background: 'transparent',
                                                border: '1px solid #444',
                                                borderRadius: '4px',
                                                color: '#ccc',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                              }}
                                            >
                                              Done
                                            </button>
                                            
                                            <button
                                              onClick={async () => {
                                                // Clear birthday value
                                                handleInputChange('birthday', null);
                                                
                                                // Save to Supabase immediately
                                                try {
                                                  const { data, error } = await supabase
                                                    .from('contacts')
                                                    .update({ birthday: null })
                                                    .eq('contact_id', contact.contact_id);
                                                    
                                                  if (error) {
                                                    console.error('Error clearing birthday:', error);
                                                    toast.error('Failed to clear birthday');
                                                  } else {
                                                    toast.success('Birthday cleared successfully');
                                                    // Update the contact object
                                                    setContact(prev => ({
                                                      ...prev,
                                                      birthday: null
                                                    }));
                                                    
                                                    // Close the date editor
                                                    setFormData(prev => ({...prev, isEditingBirthday: false}));
                                                  }
                                                } catch (err) {
                                                  console.error('Exception clearing birthday:', err);
                                                  toast.error('Failed to clear birthday');
                                                }
                                              }}
                                              style={{
                                                padding: '4px 8px',
                                                background: 'rgba(255, 50, 50, 0.2)',
                                                border: '1px solid #933',
                                                borderRadius: '4px',
                                                color: '#f99',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                              }}
                                            >
                                              Clear
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div 
                                            onClick={() => {
                                              setFormData(prev => ({...prev, isEditingBirthday: true}));
                                            }}
                                            style={{ 
                                              cursor: 'pointer',
                                              flex: 1
                                            }}
                                          >
                                            {formData.birthday || contact.birthday || '-'}
                                          </div>
                                          
                                          {(formData.birthday || contact.birthday) && (
                                            <button
                                              onClick={async () => {
                                                // Clear birthday value
                                                handleInputChange('birthday', null);
                                                
                                                // Save to Supabase immediately
                                                try {
                                                  const { data, error } = await supabase
                                                    .from('contacts')
                                                    .update({ birthday: null })
                                                    .eq('contact_id', contact.contact_id);
                                                    
                                                  if (error) {
                                                    console.error('Error clearing birthday:', error);
                                                    toast.error('Failed to clear birthday');
                                                  } else {
                                                    toast.success('Birthday cleared successfully');
                                                    // Update the contact object
                                                    setContact(prev => ({
                                                      ...prev,
                                                      birthday: null
                                                    }));
                                                  }
                                                } catch (err) {
                                                  console.error('Exception clearing birthday:', err);
                                                  toast.error('Failed to clear birthday');
                                                }
                                              }}
                                              style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#f77',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                padding: '2px 6px'
                                              }}
                                              title="Clear birthday"
                                            >
                                              ×
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>


                                {/* LinkedIn Profile Row */}
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  <td style={{ padding: '12px 15px', color: '#999' }}>
                                    <a 
                                      href={`https://www.linkedin.com/search/results/people/?keywords=${contact.first_name || ''}%20${contact.last_name || ''}&sid=Avh`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#999', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                                    >
                                      <span>LinkedIn</span>
                                      <span style={{ marginLeft: '5px', fontSize: '10px' }}>↗</span>
                                    </a>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div style={{ padding: '8px 12px' }}>
                                      {contact.linkedin ? (
                                        <a 
                                          href={contact.linkedin}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ 
                                            color: '#00a3ff', 
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                        >
                                          Link
                                          <span style={{ marginLeft: '5px', fontSize: '10px' }}>↗</span>
                                        </a>
                                      ) : (
                                        '-'
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div 
                                      style={{ 
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      {airtableContact?.linkedin || airtableContact?.linkedin_normalised ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                          <div>
                                            {airtableContact?.linkedin ? (
                                              <a 
                                                href={airtableContact.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ 
                                                  color: '#00a3ff', 
                                                  textDecoration: 'none',
                                                  display: 'flex',
                                                  alignItems: 'center'
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                Link
                                                <span style={{ marginLeft: '5px', fontSize: '10px' }}>↗</span>
                                              </a>
                                            ) : '-'}
                                            
                                            {airtableContact?.linkedin_normalised && (
                                              <div style={{ color: '#777', fontSize: '11px', marginTop: '4px' }}>
                                                Normalized: {airtableContact.linkedin_normalised}
                                              </div>
                                            )}
                                          </div>
                                          <span 
                                            style={{ color: '#00ff00', fontSize: '12px', marginLeft: '10px', cursor: 'pointer' }}
                                            onClick={async () => {
                                              const newLinkedIn = airtableContact.linkedin || airtableContact.linkedin_normalised || '';
                                              
                                              // Update formData with the Airtable LinkedIn
                                              handleInputChange('linkedin', newLinkedIn);
                                              
                                              // Save to database
                                              try {
                                                const { error } = await supabase
                                                  .from('contacts')
                                                  .update({ linkedin: newLinkedIn })
                                                  .eq('contact_id', contact.contact_id);
                                                  
                                                if (error) {
                                                  console.error('Error updating LinkedIn:', error);
                                                  toast.error('Failed to update LinkedIn');
                                                } else {
                                                  toast.success('LinkedIn updated');
                                                  // Update the contact with the new LinkedIn
                                                  setContact({...contact, linkedin: newLinkedIn});
                                                }
                                              } catch (err) {
                                                console.error('Exception updating LinkedIn:', err);
                                                toast.error('Failed to update LinkedIn');
                                              }
                                            }}
                                          >
                                            → 
                                          </span>
                                        </div>
                                      ) : (
                                        '-'
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    {formData.isEditingLinkedin ? (
                                      <div style={{ padding: '8px 12px' }}>
                                        <Input 
                                          type="text"
                                          value={formData.linkedin !== undefined ? formData.linkedin : (contact.linkedin || '')}
                                          onChange={(e) => handleInputChange('linkedin', e.target.value)}
                                          onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                              const newLinkedIn = formData.linkedin !== undefined ? formData.linkedin : contact.linkedin || '';
                                              const updatedFormData = {...formData, isEditingLinkedin: false};
                                              setFormData(updatedFormData);
                                              
                                              // Save to database
                                              try {
                                                const { error } = await supabase
                                                  .from('contacts')
                                                  .update({ linkedin: newLinkedIn })
                                                  .eq('contact_id', contact.contact_id);
                                                  
                                                if (error) {
                                                  console.error('Error updating LinkedIn:', error);
                                                  toast.error('Failed to update LinkedIn');
                                                } else {
                                                  toast.success('LinkedIn updated');
                                                  // Update the contact with the new LinkedIn
                                                  setContact({...contact, linkedin: newLinkedIn});
                                                }
                                              } catch (err) {
                                                console.error('Exception updating LinkedIn:', err);
                                                toast.error('Failed to update LinkedIn');
                                              }
                                            }
                                          }}
                                          onBlur={async () => {
                                            const newLinkedIn = formData.linkedin !== undefined ? formData.linkedin : contact.linkedin || '';
                                            const updatedFormData = {...formData, isEditingLinkedin: false};
                                            setFormData(updatedFormData);
                                            
                                            // Save to database
                                            try {
                                              const { error } = await supabase
                                                .from('contacts')
                                                .update({ linkedin: newLinkedIn })
                                                .eq('contact_id', contact.contact_id);
                                                
                                              if (error) {
                                                console.error('Error updating LinkedIn:', error);
                                                toast.error('Failed to update LinkedIn');
                                              } else {
                                                toast.success('LinkedIn updated');
                                                // Update the contact with the new LinkedIn
                                                setContact({...contact, linkedin: newLinkedIn});
                                              }
                                            } catch (err) {
                                              console.error('Exception updating LinkedIn:', err);
                                              toast.error('Failed to update LinkedIn');
                                            }
                                          }}
                                          autoFocus
                                          style={{ 
                                            width: '100%',
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#fff',
                                            padding: '0'
                                          }}
                                          placeholder="Enter LinkedIn URL"
                                        />
                                      </div>
                                    ) : (
                                      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        {(formData.linkedin || contact.linkedin) ? (
                                          <>
                                            <a 
                                              href={formData.linkedin || contact.linkedin}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{ 
                                                color: '#00a3ff', 
                                                textDecoration: 'none',
                                                display: 'flex',
                                                alignItems: 'center'
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              Link
                                              <span style={{ marginLeft: '5px', fontSize: '10px' }}>↗</span>
                                            </a>
                                            <span 
                                              style={{ 
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                color: '#999',
                                                marginLeft: '10px'
                                              }}
                                              onClick={() => {
                                                const updatedFormData = {...formData, isEditingLinkedin: true};
                                                setFormData(updatedFormData);
                                              }}
                                              title="Edit"
                                            >
                                              ✎
                                            </span>
                                          </>
                                        ) : (
                                          <span 
                                            style={{ cursor: 'pointer', color: '#999' }}
                                            onClick={() => {
                                              const updatedFormData = {...formData, isEditingLinkedin: true};
                                              setFormData(updatedFormData);
                                            }}
                                          >
                                            Click to add LinkedIn URL
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>

                                {/* Job Role Row */}
                                <tr style={{ borderBottom: '1px solid #333' }}>
                                  <td style={{ padding: '12px 15px', color: '#999' }}>
                                    <a 
                                      onClick={() => setShowLinkedInPreviewModal(true)}
                                      style={{ 
                                        color: '#999', 
                                        textDecoration: 'none', 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        cursor: 'pointer' 
                                      }}
                                    >
                                      <span>Job Role</span>
                                      <span style={{ marginLeft: '5px', fontSize: '10px' }}>↗</span>
                                    </a>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    {contact.isEditingJobRole ? (
                                      <Input 
                                        type="text"
                                        value={contact.job_role || ''}
                                        onChange={(e) => {
                                          // Update the contact display value
                                          const updatedContact = {...contact, job_role: e.target.value};
                                          setContact(updatedContact);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            // Confirm edit on Enter
                                            const updatedContact = {...contact, isEditingJobRole: false};
                                            setContact(updatedContact);
                                          }
                                        }}
                                        onBlur={() => {
                                          // Confirm edit on blur
                                          const updatedContact = {...contact, isEditingJobRole: false};
                                          setContact(updatedContact);
                                        }}
                                        autoFocus
                                        style={{ 
                                          width: '100%',
                                          background: 'transparent',
                                          border: 'none',
                                          padding: '8px 12px',
                                          color: '#fff'
                                        }}
                                      />
                                    ) : (
                                      <div 
                                        onClick={(e) => {
                                          // If they click the arrow, set the value in Supabase Final
                                          if (e.target.tagName === 'SPAN' && e.target.dataset.action === 'transfer') {
                                            handleInputChange('jobRole', contact.job_role || '');
                                          } else {
                                            // Otherwise, start editing
                                            const updatedContact = {...contact, isEditingJobRole: true};
                                            setContact(updatedContact);
                                          }
                                        }}
                                        style={{ 
                                          cursor: 'pointer',
                                          padding: '8px 12px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between'
                                        }}
                                      >
                                        <span>{contact.job_role || '-'}</span>
                                        <span 
                                          data-action="transfer"
                                          style={{ 
                                            color: '#00ff00', 
                                            fontSize: '12px', 
                                            marginLeft: '10px',
                                            cursor: 'pointer'
                                          }}
                                          title="Transfer to Supabase Final"
                                        >
                                          → 
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    <div 
                                      onClick={() => {
                                        if (airtableContact && airtableContact.job_role) {
                                          handleInputChange('jobRole', airtableContact.job_role);
                                        }
                                      }}
                                      style={{ 
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                      }}
                                    >
                                      <span>
                                        {airtableContact?.job_role || '-'}
                                      </span>
                                      <span style={{ color: '#00ff00', fontSize: '12px', marginLeft: '10px' }}>
                                        → 
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 15px' }}>
                                    {formData.isEditingJobRole ? (
                                      <Input 
                                        type="text"
                                        value={formData.jobRole !== undefined ? formData.jobRole : (contact.job_role || '')}
                                        onChange={(e) => handleInputChange('jobRole', e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            // Confirm edit on Enter
                                            const updatedFormData = {...formData, isEditingJobRole: false};
                                            setFormData(updatedFormData);
                                          }
                                        }}
                                        onBlur={() => {
                                          // Confirm edit on blur
                                          const updatedFormData = {...formData, isEditingJobRole: false};
                                          setFormData(updatedFormData);
                                        }}
                                        autoFocus
                                        style={{ 
                                          width: '100%',
                                          background: 'transparent',
                                          border: 'none',
                                          padding: '8px 12px',
                                          color: '#fff'
                                        }}
                                      />
                                    ) : (
                                      <div 
                                        onClick={() => {
                                          const updatedFormData = {...formData, isEditingJobRole: true};
                                          setFormData(updatedFormData);
                                        }}
                                        style={{ 
                                          cursor: 'pointer',
                                          padding: '8px 12px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <span>{formData.jobRole !== undefined ? formData.jobRole : (contact.job_role || '-')}</span>
                                      </div>
                                    )}
                                  </td>
                                </tr>




{/* ─────────── Companies Row (mirrors Tags) ─────────── */}
<tr style={{ borderBottom: '1px solid #333' }}>
  <td style={{ padding: '12px 15px', color: '#999' }}>Companies</td>

  {/* 1. Current companies (formData first, then contact) */}
  <td style={{ padding: '12px 15px' }}>
    <TagsContainer>
      {formData.companies && formData.companies.length > 0 ? (
        formData.companies.map((comp, idx) => (
          <Tag
            key={`formdata-company-${idx}`}
            style={{
              background: 'transparent',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '4px 8px',
              margin: '2px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span>{comp.name}</span>
          </Tag>
        ))
      ) : contact.companies && contact.companies.length > 0 ? (
        contact.companies.map((comp, idx) => (
          <Tag
            key={`contact-company-${idx}`}
            style={{
              background: 'transparent',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '4px 8px',
              margin: '2px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span>{comp.name}</span>
          </Tag>
        ))
      ) : (
        '-'
      )}
    </TagsContainer>
  </td>

  {/* 2. Suggestions from Airtable */}
  <td style={{ padding: '12px 15px' }}>
    <TagsContainer>
      {airtableContact?.company ? (
        airtableContact.company.split(',').map((raw, idx) => {
          const trimmedCompany = raw.trim();
          if (!trimmedCompany) return null;

          return (
            <Tag
              key={`airtable-company-${idx}`}
              style={{
                background: 'transparent',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                padding: '4px 8px',
                margin: '2px',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={async () => {
                try {
                  /* Check if company exists */
                  const { data: existingCompany, error: searchError } = await supabase
                    .from('companies')
                    .select('company_id')
                    .ilike('name', trimmedCompany)
                    .maybeSingle();

                  if (searchError) {
                    console.error('Error searching for company:', searchError);
                    toast.error('Failed to search for company');
                    return;
                  }

                  let companyId;

                  /* Create company if needed */
                  if (!existingCompany) {
                    const { data: newCompany, error: createError } = await supabase
                      .from('companies')
                      .insert({ name: trimmedCompany })
                      .select('company_id')
                      .single();

                    if (createError) {
                      console.error('Error creating company:', createError);
                      toast.error('Failed to create company');
                      return;
                    }

                    companyId = newCompany.company_id;
                  } else {
                    companyId = existingCompany.company_id;
                  }

                  /* Link company to contact if not linked */
                  const { data: existingContactCompany, error: checkError } = await supabase
                    .from('contact_companies')
                    .select('contact_companies_id')
                    .eq('contact_id', contact.contact_id)
                    .eq('company_id', companyId)
                    .maybeSingle();

                  if (checkError) {
                    console.error('Error checking contact company:', checkError);
                    toast.error('Failed to check company link');
                    return;
                  }

                  if (!existingContactCompany) {
                    const { error: linkError } = await supabase
                      .from('contact_companies')
                      .insert({ contact_id: contact.contact_id, company_id: companyId });

                    if (linkError) {
                      console.error('Error linking company to contact:', linkError);
                      toast.error('Failed to add company');
                      return;
                    }

                    /* Update state */
                    const updatedContact = { ...contact };
                    if (!updatedContact.companies) updatedContact.companies = [];
                    updatedContact.companies.push({ company_id: companyId, name: trimmedCompany });
                    setContact(updatedContact);

                    if (formData.companies) {
                      setFormData({
                        ...formData,
                        companies: [...formData.companies, { company_id: companyId, name: trimmedCompany }],
                      });
                    }

                    toast.success(`Company "${trimmedCompany}" added`);
                  } else {
                    toast.info(`Company "${trimmedCompany}" already linked`);
                  }
                } catch (err) {
                  console.error('Exception handling company:', err);
                  toast.error('Failed to process company');
                }
              }}
            >
              <span>{trimmedCompany}</span>
              <span
                style={{
                  color: '#00ff00',
                  fontSize: '12px',
                  marginLeft: '5px',
                }}
              >
                →
              </span>
            </Tag>
          );
        }).filter(Boolean)
      ) : (
        '-'
      )}
    </TagsContainer>
  </td>

  {/* 3. Editable list with remove + Add Company */}
  <td style={{ padding: '12px 15px' }}>
    <TagsContainer>
      {formData.companies && formData.companies.length > 0 ? (
        formData.companies.map((comp, idx) => (
          <Tag
            key={`formdata-company-edit-${idx}`}
            style={{
              background: 'transparent',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '4px 8px',
              margin: '2px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span>{comp.name}</span>
            <span
              onClick={async () => {
                try {
                  /* Remove from formData */
                  const updatedCompanies = formData.companies.filter((_, i) => i !== idx);
                  handleInputChange('companies', updatedCompanies);

                  /* Remove link in DB */
                  const { error } = await supabase
                    .from('contact_companies')
                    .delete()
                    .eq('contact_id', contact.contact_id)
                    .eq('company_id', comp.company_id);

                  if (error) {
                    console.error('Error removing company from contact:', error);
                    toast.error('Failed to remove company');
                  } else {
                    /* Update contact state */
                    const updatedContact = { ...contact };
                    if (updatedContact.companies) {
                      updatedContact.companies = updatedContact.companies.filter(
                        c => c.company_id !== comp.company_id
                      );
                      setContact(updatedContact);
                    }

                    toast.success(`Company "${comp.name}" removed`);
                  }
                } catch (err) {
                  console.error('Exception removing company:', err);
                  toast.error('Failed to remove company');
                }
              }}
              title="Remove company"
              style={{
                fontSize: '12px',
                marginLeft: '5px',
                color: '#00ff00',
                cursor: 'pointer',
              }}
            >
              ✕
            </span>
          </Tag>
        ))
      ) : contact.companies && contact.companies.length > 0 ? (
        contact.companies.map((comp, idx) => (
          <Tag
            key={`contact-company-edit-${idx}`}
            style={{
              background: 'transparent',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '4px 8px',
              margin: '2px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span>{comp.name}</span>
            <span
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('contact_companies')
                    .delete()
                    .eq('contact_id', contact.contact_id)
                    .eq('company_id', comp.company_id);

                  if (error) {
                    console.error('Error removing company from contact:', error);
                    toast.error('Failed to remove company');
                  } else {
                    const updatedContact = { ...contact };
                    updatedContact.companies = updatedContact.companies.filter(
                      c => c.company_id !== comp.company_id
                    );
                    setContact(updatedContact);
                    toast.success(`Company "${comp.name}" removed`);
                  }
                } catch (err) {
                  console.error('Exception removing company:', err);
                  toast.error('Failed to remove company');
                }
              }}
              title="Remove company"
              style={{
                fontSize: '12px',
                marginLeft: '5px',
                color: '#00ff00',
                cursor: 'pointer',
              }}
            >
              ✕
            </span>
          </Tag>
        ))
      ) : (
        '-'
      )}

      {/* Add new company */}
      <Tag
        style={{
          background: 'transparent',
          color: '#00ff00',
          cursor: 'pointer',
          border: 'none',
          padding: '4px 8px',
        }}
        onClick={async () => {
          const companyName = prompt('Enter new company:');
          if (!companyName || !companyName.trim()) return;

          const trimmedCompanyName = companyName.trim();

          try {
            /* Check if company exists */
            const { data: existingCompany, error: searchError } = await supabase
              .from('companies')
              .select('company_id')
              .ilike('name', trimmedCompanyName)
              .maybeSingle();

            if (searchError) {
              console.error('Error searching for company:', searchError);
              toast.error('Failed to search for company');
              return;
            }

            let companyId;

            if (!existingCompany) {
              const { data: newCompany, error: createError } = await supabase
                .from('companies')
                .insert({ name: trimmedCompanyName })
                .select('company_id')
                .single();

              if (createError) {
                console.error('Error creating company:', createError);
                toast.error('Failed to create company');
                return;
              }

              companyId = newCompany.company_id;
            } else {
              companyId = existingCompany.company_id;
            }

            /* Link company */
            const { data: existingContactCompany, error: checkError } = await supabase
              .from('contact_companies')
              .select('contact_companies_id')
              .eq('contact_id', contact.contact_id)
              .eq('company_id', companyId)
              .maybeSingle();

            if (checkError) {
              console.error('Error checking contact company:', checkError);
              toast.error('Failed to check company link');
              return;
            }

            if (!existingContactCompany) {
              const { error: linkError } = await supabase
                .from('contact_companies')
                .insert({ contact_id: contact.contact_id, company_id: companyId });

              if (linkError) {
                console.error('Error linking company to contact:', linkError);
                toast.error('Failed to add company');
                return;
              }

              const updatedContact = { ...contact };
              if (!updatedContact.companies) updatedContact.companies = [];
              updatedContact.companies.push({ company_id: companyId, name: trimmedCompanyName });
              setContact(updatedContact);

              toast.success(`Company "${trimmedCompanyName}" added`);
            } else {
              toast.info(`Company "${trimmedCompanyName}" already linked`);
            }
          } catch (err) {
            console.error('Exception handling company:', err);
            toast.error('Failed to process company');
          }
        }}
      onClick={() => setShowCompanyContactsModal(true)}>
        <span style={{ fontSize: '16px' }}>+</span> Add Company
      </Tag>
    </TagsContainer>
  </td>
</tr>

                              </tbody>
                            </table>
                          </div>

                          {/* Navigation Buttons */}
                          <ButtonGroup style={{ 
                            marginTop: '30px', 
                            marginBottom: '20px', 
                            width: 'calc(100% - 20px)', 
                            justifyContent: 'flex-end' 
                          }}>
                            <ActionButton
                              onClick={() => setActiveEnrichmentSection("airtable")}
                              style={{ marginRight: '10px' }}
                            >
                              <FiArrowLeft /> Back to Matching
                            </ActionButton>
                            
                            <ActionButton
                              variant="primary"
                              onClick={() => {
                                // Save combined data
                                goToStep(3);
                              }}
                            >
                              Save & Continue <FiCheck />
                            </ActionButton>
                          </ButtonGroup>
                        </FormGroup>
                      )}
                    </div>
                  ) : selectedDuplicate ? (
                    <div style={{ padding: '0 20px 20px 20px', height: '100%', overflowY: 'auto' }}>

                      <ComparisonTable>
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Current Contact</th>
                            <th>Duplicate Contact</th>
                            <th>Selection</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Name</td>
                            <td>{contact.first_name} {contact.last_name}</td>
                            <td>{selectedDuplicate.first_name} {selectedDuplicate.last_name}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_name"
                                    value="current"
                                    checked={mergeSelections.first_name === 'current'}
                                    onChange={() => {
                                      handleMergeSelectionChange('first_name', 'current');
                                      handleMergeSelectionChange('last_name', 'current');
                                    }}
                                  />
                                  <span>Current</span>
                                </MergeOption>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_name"
                                    value="duplicate"
                                    checked={mergeSelections.first_name === 'duplicate'}
                                    onChange={() => {
                                      handleMergeSelectionChange('first_name', 'duplicate');
                                      handleMergeSelectionChange('last_name', 'duplicate');
                                    }}
                                  />
                                  <span>Duplicate</span>
                                </MergeOption>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Category</td>
                            <td>{contact.category || '-'}</td>
                            <td>{selectedDuplicate.category || '-'}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_category"
                                    value="current"
                                    checked={mergeSelections.category === 'current'}
                                    onChange={() => handleMergeSelectionChange('category', 'current')}
                                  />
                                  <span>Current</span>
                                </MergeOption>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_category"
                                    value="duplicate"
                                    checked={mergeSelections.category === 'duplicate'}
                                    onChange={() => handleMergeSelectionChange('category', 'duplicate')}
                                  />
                                  <span>Duplicate</span>
                                </MergeOption>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Job Role</td>
                            <td>{contact.job_role || '-'}</td>
                            <td>{selectedDuplicate.job_role || '-'}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_job_role"
                                    value="current"
                                    checked={mergeSelections.job_role === 'current'}
                                    onChange={() => handleMergeSelectionChange('job_role', 'current')}
                                  />
                                  <span>Current</span>
                                </MergeOption>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_job_role"
                                    value="duplicate"
                                    checked={mergeSelections.job_role === 'duplicate'}
                                    onChange={() => handleMergeSelectionChange('job_role', 'duplicate')}
                                  />
                                  <span>Duplicate</span>
                                </MergeOption>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Email</td>
                            <td>
                              {contact.email ? (
                                <div style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  background: '#333', 
                                  borderRadius: '4px', 
                                  padding: '4px 8px', 
                                  margin: '2px',
                                  fontSize: '13px' 
                                }}>
                                  {contact.email}
                                </div>
                              ) : '-'}
                            </td>
                            <td>{selectedDuplicate.email || '-'}</td>
                            <td>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                {mergeSelections.emails === 'current' && contact.email && (
                                  <div style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    background: '#333', 
                                    borderRadius: '4px', 
                                    padding: '4px 8px', 
                                    fontSize: '13px',
                                    marginBottom: '5px' 
                                  }}>
                                    {contact.email}
                                    <button style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ff5555',
                                      cursor: 'pointer',
                                      marginLeft: '5px',
                                      padding: '0 5px',
                                      fontSize: '14px'
                                    }} 
                                    onClick={() => {
                                      // Handle removing email
                                      console.log('Remove email:', contact.email);
                                    }}
                                    >
                                      <FiX size={14} />
                                    </button>
                                  </div>
                                )}
                                
                                {mergeSelections.emails === 'duplicate' && selectedDuplicate.email && (
                                  <div style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    background: '#333', 
                                    borderRadius: '4px', 
                                    padding: '4px 8px', 
                                    fontSize: '13px',
                                    marginBottom: '5px' 
                                  }}>
                                    {selectedDuplicate.email}
                                    <button style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ff5555',
                                      cursor: 'pointer',
                                      marginLeft: '5px',
                                      padding: '0 5px',
                                      fontSize: '14px'
                                    }} 
                                    onClick={() => {
                                      // Handle removing email
                                      console.log('Remove email:', selectedDuplicate.email);
                                    }}
                                    >
                                      <FiX size={14} />
                                    </button>
                                  </div>
                                )}
                                
                                {mergeSelections.emails === 'combine' && (
                                  <>
                                    {contact.email && (
                                      <div style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        background: '#333', 
                                        borderRadius: '4px', 
                                        padding: '4px 8px', 
                                        fontSize: '13px',
                                        marginBottom: '5px' 
                                      }}>
                                        {contact.email}
                                        <button style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#ff5555',
                                          cursor: 'pointer',
                                          marginLeft: '5px',
                                          padding: '0 5px',
                                          fontSize: '14px'
                                        }} 
                                        onClick={() => {
                                          // Handle removing email
                                          console.log('Remove email:', contact.email);
                                        }}
                                        >
                                          <FiX size={14} />
                                        </button>
                                      </div>
                                    )}
                                    
                                    {selectedDuplicate.email && contact.email !== selectedDuplicate.email && (
                                      <div style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        background: '#333', 
                                        borderRadius: '4px', 
                                        padding: '4px 8px', 
                                        fontSize: '13px',
                                        marginBottom: '5px' 
                                      }}>
                                        {selectedDuplicate.email}
                                        <button style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#ff5555',
                                          cursor: 'pointer',
                                          marginLeft: '5px',
                                          padding: '0 5px',
                                          fontSize: '14px'
                                        }} 
                                        onClick={() => {
                                          // Handle removing email
                                          console.log('Remove email:', selectedDuplicate.email);
                                        }}
                                        >
                                          <FiX size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {/* Add New Email Button */}
                                <button style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: '#222',
                                  border: '1px dashed #555',
                                  borderRadius: '4px',
                                  color: '#00ff00',
                                  cursor: 'pointer',
                                  padding: '3px 8px',
                                  fontSize: '13px'
                                }} 
                                onClick={() => {
                                  // Handle adding new email
                                  console.log('Add new email');
                                }}
                                >
                                  <FiPlus size={14} style={{ marginRight: '5px' }} />
                                  Add Email
                                </button>
                                
                                {/* Radio buttons for selection */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px', width: '100%' }}>
                                  <MergeOption>
                                    <MergeRadio
                                      type="radio"
                                      name="merge_emails"
                                      value="current"
                                      checked={mergeSelections.emails === 'current'}
                                      onChange={() => handleMergeSelectionChange('emails', 'current')}
                                    />
                                    <span>Current</span>
                                  </MergeOption>
                                  <MergeOption>
                                    <MergeRadio
                                      type="radio"
                                      name="merge_emails"
                                      value="duplicate"
                                      checked={mergeSelections.emails === 'duplicate'}
                                      onChange={() => handleMergeSelectionChange('emails', 'duplicate')}
                                    />
                                    <span>Duplicate</span>
                                  </MergeOption>
                                  <MergeOption>
                                    <MergeRadio
                                      type="radio"
                                      name="merge_emails"
                                      value="combine"
                                      checked={mergeSelections.emails === 'combine'}
                                      onChange={() => handleMergeSelectionChange('emails', 'combine')}
                                    />
                                    <span>Combine</span>
                                  </MergeOption>
                                </div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Mobile</td>
                            <td>{contact.mobile || '-'}</td>
                            <td>{selectedDuplicate.mobile || '-'}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_mobiles"
                                    value="current"
                                    checked={mergeSelections.mobiles === 'current'}
                                    onChange={() => handleMergeSelectionChange('mobiles', 'current')}
                                  />
                                  <span>Current</span>
                                </MergeOption>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_mobiles"
                                    value="duplicate"
                                    checked={mergeSelections.mobiles === 'duplicate'}
                                    onChange={() => handleMergeSelectionChange('mobiles', 'duplicate')}
                                  />
                                  <span>Duplicate</span>
                                </MergeOption>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_mobiles"
                                    value="combine"
                                    checked={mergeSelections.mobiles === 'combine'}
                                    onChange={() => handleMergeSelectionChange('mobiles', 'combine')}
                                  />
                                  <span>Combine</span>
                                </MergeOption>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>LinkedIn</td>
                            <td>{contact.linkedin || '-'}</td>
                            <td>{selectedDuplicate.linkedin || '-'}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_linkedin"
                                    value="current"
                                    checked={mergeSelections.linkedin === 'current'}
                                    onChange={() => handleMergeSelectionChange('linkedin', 'current')}
                                  />
                                  <span>Current</span>
                                </MergeOption>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_linkedin"
                                    value="duplicate"
                                    checked={mergeSelections.linkedin === 'duplicate'}
                                    onChange={() => handleMergeSelectionChange('linkedin', 'duplicate')}
                                  />
                                  <span>Duplicate</span>
                                </MergeOption>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>Keep In Touch</td>
                            <td>{contact.keep_in_touch_frequency || 'Not Set'}</td>
                            <td>{selectedDuplicate.keep_in_touch_frequency || 'Not Set'}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_keep_in_touch"
                                    value="current"
                                    checked={mergeSelections.keep_in_touch_frequency === 'current'}
                                    onChange={() => handleMergeSelectionChange('keep_in_touch_frequency', 'current')}
                                  />
                                  <span>Current</span>
                                </MergeOption>
                                <MergeOption>
                                  <MergeRadio
                                    type="radio"
                                    name="merge_keep_in_touch"
                                    value="duplicate"
                                    checked={mergeSelections.keep_in_touch_frequency === 'duplicate'}
                                    onChange={() => handleMergeSelectionChange('keep_in_touch_frequency', 'duplicate')}
                                  />
                                  <span>Duplicate</span>
                                </MergeOption>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </ComparisonTable>
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <ActionButton 
                          onClick={() => setSelectedDuplicate(null)} 
                          style={{ marginRight: '10px' }}
                        >
                          Cancel
                        </ActionButton>
                        <ActionButton 
                          variant="primary"
                          onClick={() => handleMergeWithDuplicate()}
                          style={{ marginRight: '32px' }}
                          disabled={loading}
                        >
                          <FiGitMerge /> Merge Contacts
                        </ActionButton>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      padding: '40px 0',
                      textAlign: 'center',
                      color: '#666'
                    }}>
                      <FiGitMerge size={40} style={{ marginBottom: '15px', opacity: 0.5 }} />
                      <h4 style={{ margin: '0 0 10px 0', color: '#999' }}>Select a Duplicate</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Select a potential match from the list to view details
                      </p>
                    </div>
                  )}
                </InteractionsContainer>
              </InteractionsLayout>
            )}
          </Card>
          
          <ButtonGroup>
            <ActionButton onClick={() => goToStep(1)} disabled={loading}>
              <FiArrowLeft /> Back
            </ActionButton>
            
            <div>
              <ActionButton 
                variant="primary" 
                onClick={() => goToStep(3)} 
                disabled={loading}
              >
                Continue as New <FiArrowRight />
              </ActionButton>
            </div>
          </ButtonGroup>
        </>
      )}
      
      {/* Step 3: Contact Enrichment */}
      {currentStep === 3 && (
        <>
          <Card>
            <SectionTitle>
              <FiInfo /> Contact Enrichment
            </SectionTitle>
            
            <InteractionsLayout style={{ paddingRight: 0 }}>
              {/* Left navigation menu */}
              <ChannelsMenu style={{ flex: '0 0 17%' }}>
                <div style={{ padding: '10px 15px', color: '#999', fontSize: '0.8rem', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
                  INFORMATION
                </div>
                <div 
                  onClick={() => setActiveEnrichmentSection("basics")}
                  style={{ 
                    padding: '12px 15px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #222',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: activeEnrichmentSection === "basics" ? '#222' : 'transparent'
                  }}
                >
                  <FiUser size={16} />
                  <span>Basics</span>
                </div>
                <div 
                  onClick={() => setActiveEnrichmentSection("tags")}
                  style={{ 
                    padding: '12px 15px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #222',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: activeEnrichmentSection === "tags" ? '#222' : 'transparent'
                  }}
                >
                  <FiTag size={16} />
                  <span>Tags</span>
                </div>
                
                <div 
                  onClick={() => {
                    setActiveEnrichmentSection("notes");
                    // Initialize editingDescription to true when there's no description
                    if (!formData.description) {
                      handleInputChange('editingDescription', true);
                    }
                  }}
                  style={{ 
                    padding: '12px 15px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #222',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: activeEnrichmentSection === "notes" ? '#222' : 'transparent'
                  }}
                >
                  <FiMessageSquare size={16} />
                  <span>Notes</span>
                </div>
                
                <div style={{ padding: '10px 15px', color: '#999', fontSize: '0.8rem', borderBottom: '1px solid #333', fontWeight: 'bold', marginTop: '10px' }}>
                  RELATIONS
                </div>
                <div 
                  onClick={() => setActiveEnrichmentSection("companies")}
                  style={{ 
                    padding: '12px 15px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #222',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: activeEnrichmentSection === "companies" ? '#222' : 'transparent'
                  }}
                >
                  <FiBriefcase size={16} />
                  <span>Companies</span>
                </div>
                <div 
                  onClick={() => setActiveEnrichmentSection("deals")}
                  style={{ 
                    padding: '12px 15px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #222',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: activeEnrichmentSection === "deals" ? '#222' : 'transparent'
                  }}
                >
                  <FiDollarSign size={16} />
                  <span>Deals</span>
                </div>
                
              </ChannelsMenu>
              
              {/* Main content area */}
              <InteractionsContainer style={{ flex: '0 0 83%' }}>
                <div style={{ padding: '20px 15px 0 20px' }}>
                  {/* BASICS SECTION */}
                  {activeEnrichmentSection === "basics" && (
                    <>
                      <FormGroup>
                        <FormFieldLabel>Name {airtableContact && `- Airtable: ${airtableContact.full_name}`}</FormFieldLabel>
                        <div style={{ 
                          display: 'flex', 
                          gap: '10px', 
                          marginBottom: '15px',
                          background: '#222',
                          padding: '12px',
                          borderRadius: '4px'
                        }}>
                          <Input 
                            type="text"
                            value={formData.firstName || contact?.first_name || ''}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            placeholder="First Name"
                            style={{ flex: 1 }}
                          />
                          <Input 
                            type="text"
                            value={formData.lastName || contact?.last_name || ''}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            placeholder="Last Name"
                            style={{ flex: 1 }}
                          />
                        </div>
                      </FormGroup>
                      
                      <FormGroup>
                        <FormFieldLabel>
                          <a 
                            href={`https://mail.superhuman.com/search/${contact.first_name || ''}%20${contact.last_name || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          >
                            <span>Email Addresses</span>
                            <span style={{ marginLeft: '5px', fontSize: '10px' }}>↗</span>
                          </a>
                          {airtableContact && airtableContact.primary_email && `- Airtable: ${airtableContact.primary_email}`}
                        </FormFieldLabel>
                        
                        <div style={{ 
                          border: '1px solid #333', 
                          borderRadius: '4px', 
                          padding: '12px', 
                          marginBottom: '15px',
                          background: '#1e1e1e'
                        }}>
                          {/* Existing emails list */}
                          {formData.emails && formData.emails.length > 0 ? (
                            formData.emails.map((emailItem, index) => (
                              <div key={emailItem.email_id || index} style={{ 
                                display: 'flex', 
                                gap: '10px', 
                                marginBottom: index < formData.emails.length - 1 ? '15px' : '0',
                                alignItems: 'center',
                                padding: '8px',
                                background: '#222',
                                borderRadius: '4px'
                              }}>
                                <div style={{ flex: 2 }}>
                                  <Input 
                                    type="email"
                                    value={emailItem.email || ''}
                                    onChange={(e) => {
                                      const updatedEmails = [...formData.emails];
                                      updatedEmails[index].email = e.target.value;
                                      handleInputChange('emails', updatedEmails);
                                    }}
                                    placeholder="Email address"
                                  />
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                  <Select
                                    value={emailItem.type || 'personal'}
                                    onChange={(e) => {
                                      const updatedEmails = [...formData.emails];
                                      updatedEmails[index].type = e.target.value;
                                      handleInputChange('emails', updatedEmails);
                                    }}
                                  >
                                    <option value="personal">Personal</option>
                                    <option value="work">Work</option>
                                    <option value="other">Other</option>
                                  </Select>
                                </div>
                                
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '0.85rem',
                                  padding: '0 5px',
                                  borderRadius: '4px',
                                  background: emailItem.is_primary ? '#444444' : 'transparent',
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  const updatedEmails = formData.emails.map((item, i) => ({
                                    ...item,
                                    is_primary: i === index // Make this one primary, all others not primary
                                  }));
                                  handleInputChange('emails', updatedEmails);
                                }}
                                >
                                  {emailItem.is_primary ? (
                                    <><FiCheck size={14} /> Primary</>
                                  ) : (
                                    'Set Primary'
                                  )}
                                </div>
                                
                                <button 
                                  onClick={() => {
                                    // If deleting primary, make the first remaining email primary
                                    let updatedEmails = formData.emails.filter((_, i) => i !== index);
                                    if (emailItem.is_primary && updatedEmails.length > 0) {
                                      updatedEmails[0].is_primary = true;
                                    }
                                    handleInputChange('emails', updatedEmails);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ff6b6b',
                                    cursor: 'pointer',
                                    padding: '5px'
                                  }}
                                  title="Remove email"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div style={{ color: '#999', textAlign: 'center', padding: '10px 0' }}>
                              No email addresses added
                            </div>
                          )}
                          
                          {/* Add new email form */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '10px', 
                            marginTop: '15px'
                          }}>
                            <Input 
                              type="email"
                              placeholder="Add new email address"
                              value={formData.newEmail || ''}
                              onChange={(e) => handleInputChange('newEmail', e.target.value)}
                              style={{ flex: 2 }}
                            />
                            <Select
                              value={formData.newEmailType || 'personal'}
                              onChange={(e) => handleInputChange('newEmailType', e.target.value)}
                              style={{ flex: 1 }}
                            >
                              <option value="personal">Personal</option>
                              <option value="work">Work</option>
                              <option value="other">Other</option>
                            </Select>
                            <button 
                              onClick={() => {
                                if (!formData.newEmail) return;
                                
                                const newEmail = { 
                                  email_id: `temp-${Date.now()}`, // Temporary ID until saved
                                  email: formData.newEmail,
                                  type: formData.newEmailType || 'personal',
                                  is_primary: formData.emails.length === 0 // First one is primary by default
                                };
                                
                                handleInputChange('emails', [...(formData.emails || []), newEmail]);
                                handleInputChange('newEmail', ''); // Clear the input
                              }}
                              disabled={!formData.newEmail}
                              style={{
                                background: formData.newEmail ? '#00ff00' : '#444',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0 15px',
                                minWidth: '60px',
                                color: formData.newEmail ? 'black' : '#999',
                                cursor: formData.newEmail ? 'pointer' : 'not-allowed'
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </FormGroup>
                      
                      <FormGroup>
                        <FormFieldLabel>
                          <a 
                            href={`https://app.timelines.ai/search/?s=${contact.first_name || ''}%20${contact.last_name || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          >
                            <span>Mobile Numbers</span>
                            <span style={{ marginLeft: '5px', fontSize: '10px' }}>↗</span>
                          </a>
                          {airtableContact && `- Airtable: ${airtableContact.phone_number_1 || ''}${airtableContact.phone_number_1 && airtableContact.phone_number_2 ? ' - ' : ''}${airtableContact.phone_number_2 || ''}`}
                        </FormFieldLabel>
                        
                        <div style={{ 
                          border: '1px solid #333', 
                          borderRadius: '4px', 
                          padding: '12px', 
                          marginBottom: '15px',
                          background: '#1e1e1e'
                        }}>
                          {/* Existing mobiles list */}
                          {formData.mobiles && formData.mobiles.length > 0 ? (
                            formData.mobiles.map((mobileItem, index) => (
                              <div key={mobileItem.mobile_id || index} style={{ 
                                display: 'flex', 
                                gap: '10px', 
                                marginBottom: index < formData.mobiles.length - 1 ? '15px' : '0',
                                alignItems: 'center',
                                padding: '8px',
                                background: '#222',
                                borderRadius: '4px'
                              }}>
                                <div style={{ flex: 2 }}>
                                  <Input 
                                    type="text"
                                    value={mobileItem.mobile || ''}
                                    onChange={(e) => {
                                      const updatedMobiles = [...formData.mobiles];
                                      updatedMobiles[index].mobile = e.target.value;
                                      handleInputChange('mobiles', updatedMobiles);
                                    }}
                                    placeholder="Phone number"
                                  />
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                  <Select
                                    value={mobileItem.type || 'personal'}
                                    onChange={(e) => {
                                      const updatedMobiles = [...formData.mobiles];
                                      updatedMobiles[index].type = e.target.value;
                                      handleInputChange('mobiles', updatedMobiles);
                                    }}
                                  >
                                    <option value="personal">Personal</option>
                                    <option value="work">Work</option>
                                    <option value="other">Other</option>
                                  </Select>
                                </div>
                                
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '0.85rem',
                                  padding: '0 5px',
                                  borderRadius: '4px',
                                  background: mobileItem.is_primary ? '#444444' : 'transparent',
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  const updatedMobiles = formData.mobiles.map((item, i) => ({
                                    ...item,
                                    is_primary: i === index // Make this one primary, all others not primary
                                  }));
                                  handleInputChange('mobiles', updatedMobiles);
                                }}
                                >
                                  {mobileItem.is_primary ? (
                                    <><FiCheck size={14} /> Primary</>
                                  ) : (
                                    'Set Primary'
                                  )}
                                </div>
                                
                                <button 
                                  onClick={() => {
                                    // If deleting primary, make the first remaining mobile primary
                                    let updatedMobiles = formData.mobiles.filter((_, i) => i !== index);
                                    if (mobileItem.is_primary && updatedMobiles.length > 0) {
                                      updatedMobiles[0].is_primary = true;
                                    }
                                    handleInputChange('mobiles', updatedMobiles);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ff6b6b',
                                    cursor: 'pointer',
                                    padding: '5px'
                                  }}
                                  title="Remove mobile"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div style={{ color: '#999', textAlign: 'center', padding: '10px 0' }}>
                              No mobile numbers added
                            </div>
                          )}
                          
                          {/* Add new mobile form */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '10px', 
                            marginTop: '15px'
                          }}>
                            <Input 
                              type="text"
                              placeholder="Add new mobile number"
                              value={formData.newMobile || ''}
                              onChange={(e) => handleInputChange('newMobile', e.target.value)}
                              style={{ flex: 2 }}
                            />
                            <Select
                              value={formData.newMobileType || 'personal'}
                              onChange={(e) => handleInputChange('newMobileType', e.target.value)}
                              style={{ flex: 1 }}
                            >
                              <option value="personal">Personal</option>
                              <option value="work">Work</option>
                              <option value="other">Other</option>
                            </Select>
                            <button 
                              onClick={() => {
                                if (!formData.newMobile) return;
                                
                                const newMobile = { 
                                  mobile_id: `temp-${Date.now()}`, // Temporary ID until saved
                                  mobile: formData.newMobile,
                                  type: formData.newMobileType || 'personal',
                                  is_primary: formData.mobiles.length === 0 // First one is primary by default
                                };
                                
                                handleInputChange('mobiles', [...(formData.mobiles || []), newMobile]);
                                handleInputChange('newMobile', ''); // Clear the input
                              }}
                              disabled={!formData.newMobile}
                              style={{
                                background: formData.newMobile ? '#00ff00' : '#444',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0 15px',
                                minWidth: '60px',
                                color: formData.newMobile ? 'black' : '#999',
                                cursor: formData.newMobile ? 'pointer' : 'not-allowed'
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </FormGroup>
                    </>
                  )}
                  
                  {/* TAGS SECTION */}
                  {activeEnrichmentSection === "tags" && (
                    <>
                      <FormGroup style={{ marginBottom: '15px' }}>
                        <FormFieldLabel>
                          Keep in Touch & Category 
                          {airtableContact && (
                            <span>
                              {airtableContact.keep_in_touch && ` - Airtable Keep in Touch: ${airtableContact.keep_in_touch}`}
                              {airtableContact.category && ` - Airtable Category: ${airtableContact.category}`}
                            </span>
                          )}
                        </FormFieldLabel>
                        <div style={{ 
                          display: 'flex', 
                          gap: '15px',
                          background: '#222', 
                          padding: '12px', 
                          borderRadius: '4px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <Select 
                              value={formData.keepInTouch || ''}
                              onChange={(e) => handleInputChange('keepInTouch', e.target.value === '' ? null : e.target.value)}
                            >
                              <option value="Not Set">Not Set</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Quarterly">Quarterly</option>
                              <option value="Twice per Year">Twice per Year</option>
                              <option value="Once per Year">Once per Year</option>
                              <option value="Weekly">Weekly</option>
                              <option value="Do not keep in touch">Do not keep in touch</option>
                            </Select>
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <Select 
                              value={formData.category || ''}
                              onChange={(e) => handleInputChange('category', e.target.value === '' ? null : e.target.value)}
                            >
                              <option value="Inbox">Inbox</option>
                              <option value="Professional Investor">Professional Investor</option>
                              <option value="Team">Team</option>
                              <option value="Advisor">Advisor</option>
                              <option value="Supplier">Supplier</option>
                              <option value="Founder">Founder</option>
                              <option value="Manager">Manager</option>
                              <option value="Friend and Family">Friend and Family</option>
                              <option value="Other">Other</option>
                              <option value="Student">Student</option>
                              <option value="Media">Media</option>
                              <option value="Institution">Institution</option>
                            </Select>
                          </div>
                        </div>
                      </FormGroup>
                      
                      <FormGroup>
                        <FormFieldLabel>
                          Cities
                          {airtableContact && airtableContact.city && ` - Airtable: ${airtableContact.city}`}
                        </FormFieldLabel>
                        <div style={{ 
                          background: '#222', 
                          padding: '12px', 
                          borderRadius: '4px', 
                          marginBottom: '15px'
                        }}>
                          <TagsContainer style={{ marginBottom: formData.cities && formData.cities.length > 0 ? '8px' : '0' }}>
                            {formData.cities && formData.cities.length > 0 ? formData.cities.map(city => (
                              <Tag key={city.city_id || city.entry_id}>
                                {city.name}
                                <FiX 
                                  className="remove" 
                                  size={14} 
                                  onClick={() => handleInputChange('cities', formData.cities.filter(c => (c.city_id || c.entry_id) !== (city.city_id || city.entry_id)))}
                                />
                              </Tag>
                            )) : (
                              <div style={{ 
                                color: '#999', 
                                textAlign: 'center',
                                padding: '8px 0'
                              }}>
                                No cities added
                              </div>
                            )}
                          </TagsContainer>
                        </div>
                        
                        {/* Add new city form */}
                        <div style={{ 
                          position: 'relative',
                          marginBottom: '15px'
                        }}>
                          <div style={{ 
                            background: '#222', 
                            padding: '12px', 
                            borderRadius: '4px' 
                          }}>
                            <Input 
                              type="text"
                              placeholder="Type to add a new city (min 2 characters)"
                              value={formData.newCity || ''}
                              style={{ boxSizing: 'border-box', width: '100%' }}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleInputChange('newCity', value);
                                
                                // Search for city suggestions if at least 2 characters
                                if (value && value.length >= 2) {
                                  searchCities(value);
                                } else {
                                  // Clear suggestions if input is too short
                                  handleInputChange('citySuggestions', []);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && formData.newCity?.trim()) {
                                  // Add city
                                  const newCity = { 
                                    city_id: `temp-${Date.now()}`, 
                                    name: formData.newCity.trim() 
                                  };
                                  handleInputChange('cities', [...(formData.cities || []), newCity]);
                                  handleInputChange('newCity', '');
                                  handleInputChange('citySuggestions', []);
                                } else if (e.key === 'Escape') {
                                  // Clear input and suggestions on ESC
                                  handleInputChange('newCity', '');
                                  handleInputChange('citySuggestions', []);
                                }
                              }}
                            />
                          </div>
                          
                          {/* City suggestions dropdown */}
                          {formData.citySuggestions && formData.citySuggestions.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              width: '100%',
                              zIndex: 10,
                              background: '#222',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                              border: '1px solid #444',
                              borderRadius: '4px',
                              maxHeight: '200px',
                              overflowY: 'auto'
                            }}>
                              {formData.citySuggestions.map((suggestion) => (
                                <div 
                                  key={suggestion.city_id}
                                  onClick={() => {
                                    // Only add if not already exists
                                    if (!formData.cities?.some(c => 
                                      c.city_id === suggestion.city_id || 
                                      c.name.toLowerCase() === suggestion.name.toLowerCase()
                                    )) {
                                      handleInputChange('cities', [...(formData.cities || []), suggestion]);
                                      handleInputChange('newCity', '');
                                      handleInputChange('citySuggestions', []);
                                    }
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #444'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  {suggestion.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormGroup>
                      
                      <FormGroup>
                        <FormFieldLabel>
                          Tags
                          {airtableContact && airtableContact.keywords && ` - Airtable Keywords: ${airtableContact.keywords}`}
                        </FormFieldLabel>
                        <div style={{ 
                          background: '#222', 
                          padding: '12px', 
                          borderRadius: '4px', 
                          marginBottom: '15px'
                        }}>
                          <TagsContainer style={{ marginBottom: formData.tags && formData.tags.length > 0 ? '8px' : '0' }}>
                            {formData.tags && formData.tags.length > 0 ? formData.tags.map(tag => (
                              <Tag key={tag.tag_id || tag.entry_id}>
                                {tag.name}
                                <FiX 
                                  className="remove" 
                                  size={14} 
                                  onClick={() => handleInputChange('tags', formData.tags.filter(t => (t.tag_id || t.entry_id) !== (tag.tag_id || tag.entry_id)))}
                                />
                              </Tag>
                            )) : (
                              <div style={{ 
                                color: '#999', 
                                textAlign: 'center',
                                padding: '8px 0'
                              }}>
                                No tags added
                              </div>
                            )}
                          </TagsContainer>
                        </div>
                        
                        {/* Add new tag form */}
                        <div style={{ 
                          position: 'relative',
                          marginBottom: '15px'
                        }}>
                          <div style={{ 
                            background: '#222', 
                            padding: '12px', 
                            borderRadius: '4px' 
                          }}>
                            <Input 
                              type="text"
                              placeholder="Type to add a new tag (min 2 characters)"
                              value={formData.newCustomTag || ''}
                              style={{ boxSizing: 'border-box', width: '100%' }}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleInputChange('newCustomTag', value);
                                
                                // Search for tag suggestions if at least 2 characters
                                if (value && value.length >= 2) {
                                  // Search function
                                  searchTagSuggestions(value);
                                } else {
                                  // Clear suggestions if input is too short
                                  handleInputChange('tagSuggestions', []);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && formData.newCustomTag?.trim()) {
                                  // Add tag
                                  const newTag = { 
                                    tag_id: `temp-${Date.now()}`, 
                                    name: formData.newCustomTag.trim() 
                                  };
                                  handleInputChange('tags', [...(formData.tags || []), newTag]);
                                  handleInputChange('newCustomTag', '');
                                  handleInputChange('tagSuggestions', []);
                                } else if (e.key === 'Escape') {
                                  // Clear input and suggestions on ESC
                                  handleInputChange('newCustomTag', '');
                                  handleInputChange('tagSuggestions', []);
                                }
                              }}
                            />
                          </div>
                          
                          {/* Tag suggestions dropdown */}
                          {formData.tagSuggestions && formData.tagSuggestions.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              width: '100%',
                              zIndex: 10,
                              background: '#222',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                              border: '1px solid #444',
                              borderRadius: '4px',
                              maxHeight: '200px',
                              overflowY: 'auto'
                            }}>
                              {formData.tagSuggestions.map((suggestion) => (
                                <div 
                                  key={suggestion.tag_id}
                                  onClick={() => {
                                    // Only add if not already exists
                                    if (!formData.tags?.some(t => 
                                      t.tag_id === suggestion.tag_id || 
                                      t.name.toLowerCase() === suggestion.name.toLowerCase()
                                    )) {
                                      handleInputChange('tags', [...(formData.tags || []), suggestion]);
                                      handleInputChange('newCustomTag', '');
                                      handleInputChange('tagSuggestions', []);
                                    }
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #444'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#444'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  {suggestion.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormGroup>
                    </>
                  )}
                  
                  {/* COMPANIES SECTION */}
                  {activeEnrichmentSection === "companies" && (
                    <>
                      <FormGroup>
                        <FormFieldLabel>
                          <a 
                            href={
                              formData.linkedIn ? 
                              (formData.linkedIn.startsWith('http') ? formData.linkedIn : `https://${formData.linkedIn}`) : 
                              `https://www.linkedin.com/search/results/people/?keywords=${contact.first_name || ''}%20${contact.last_name || ''}&sid=Avh`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          >
                            <span>LinkedIn Profile</span>
                          </a>
                          {airtableContact && airtableContact.linkedin_normalised && ` - Airtable: ${airtableContact.linkedin_normalised}`}
                        </FormFieldLabel>
                        <div style={{ 
                          background: '#222', 
                          padding: '12px', 
                          borderRadius: '4px',
                          marginBottom: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <Input 
                            type="text"
                            value={formData.linkedIn || ''}
                            onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                            placeholder="LinkedIn URL"
                            style={{ flex: 1 }}
                          />
                          
                          {/* Save LinkedIn URL button - hidden if LinkedIn profile already exists */}
                          {!contact.linkedin && (
                            <button
                              onClick={async () => {
                                try {
                                  setLoading(true);
                                  
                                  // Update LinkedIn field in contacts table
                                  const { error } = await supabase
                                    .from('contacts')
                                    .update({
                                      linkedin: formData.linkedIn, // Database column is 'linkedin', form field is 'linkedIn'
                                      last_modified_at: new Date()
                                    })
                                    .eq('contact_id', contactId);
                                  
                                  if (error) throw error;
                                  
                                  toast.success('LinkedIn profile saved');
                                  setLoading(false);
                                } catch (err) {
                                  console.error('Error saving LinkedIn:', err);
                                  toast.error('Failed to save LinkedIn profile');
                                  setLoading(false);
                                }
                              }}
                              style={{
                                background: '#00ff00',
                                color: '#000',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <FiCheck size={14} /> Save
                            </button>
                          )}
                          
                          {/* LinkedIn preview button */}
                          <button
                              onClick={() => setShowLinkedInPreviewModal(true)}
                              style={{
                                background: '#00ff00',
                                color: '#000',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '8px 12px',
                                cursor: 'pointer'
                              }}
                            >
                              Preview
                            </button>
                        </div>
                      </FormGroup>
                      
                      <FormGroup>
                        <FormFieldLabel>
                          Job Role
                          {airtableContact && airtableContact.job_title && ` - Airtable: ${airtableContact.job_title}`}
                        </FormFieldLabel>
                        <div style={{ 
                          background: '#222', 
                          padding: '15px', 
                          borderRadius: '4px',
                          marginBottom: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <Input 
                            type="text"
                            value={formData.jobRole || ''}
                            onChange={(e) => handleInputChange('jobRole', e.target.value)}
                            placeholder="Job Role"
                            style={{ flex: 1 }}
                          />
                          
                          {/* Save Job Role button */}
                          <button
                            onClick={async () => {
                              try {
                                setLoading(true);
                                
                                // Update job_role field in contacts table
                                const { error } = await supabase
                                  .from('contacts')
                                  .update({
                                    job_role: formData.jobRole,
                                    last_modified_at: new Date()
                                  })
                                  .eq('contact_id', contactId);
                                
                                if (error) throw error;
                                
                                toast.success('Job role saved');
                                setLoading(false);
                              } catch (err) {
                                console.error('Error saving job role:', err);
                                toast.error('Failed to save job role');
                                setLoading(false);
                              }
                            }}
                            style={{
                              background: '#00ff00',
                              color: '#000',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <FiCheck size={14} /> Save
                          </button>
                        </div>
                      </FormGroup>

                      <div style={{ marginTop: '20px', paddingRight: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                          <FormFieldLabel>Associated Companies</FormFieldLabel>
                          <button 
                            onClick={refreshCompanyData}
                            style={{
                              background: 'transparent',
                              color: '#00ff00',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.7rem',
                              marginLeft: '10px',
                              height: '20px'
                            }}
                            title="Refresh Company Data"
                          >
                            <FiRefreshCw size={14} />
                          </button>
                          <button 
                            onClick={() => setShowAssociateCompanyModal(true)}
                            style={{
                              background: 'transparent',
                              color: '#00ff00',
                              border: '1px solid #00ff00',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.7rem',
                              marginLeft: '10px',
                              height: '20px'
                            }}
                            title="Associate Company"
                          >
                            <FiPlus size={10} />
                          </button>
                        </div>
                        <div style={{ 
                          background: '#222', 
                          padding: '12px', 
                          borderRadius: '4px',
                          minHeight: '100px',
                          width: '100%'
                        }}>
                          <div style={{ width: '100%' }}>
                            {console.log('Current enrichment section:', activeEnrichmentSection)}
                            <table style={{ 
                              width: '100%', 
                              borderCollapse: 'collapse',
                              overflow: 'hidden',
                              marginTop: 0
                            }}>
                              <thead>
                                <tr style={{ background: '#333' }}>
                                  <th style={{ padding: '10px 15px', textAlign: 'left', borderBottom: '1px solid #444', width: '20%' }}>Company</th>
                                  <th style={{ padding: '10px 15px', textAlign: 'left', borderBottom: '1px solid #444', width: '30%' }}>Tags</th>
                                  <th style={{ padding: '10px 15px', textAlign: 'left', borderBottom: '1px solid #444', width: '25%' }}>Category</th>
                                  <th style={{ padding: '10px 15px', textAlign: 'left', borderBottom: '1px solid #444', width: '15%' }}>Relationship</th>
                                  <th style={{ padding: '10px 15px', textAlign: 'center', borderBottom: '1px solid #444', width: '10%' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {console.log('Rendering companies table. contactCompanies:', contactCompanies, 'Loaded:', companiesLoaded)}
                                {companiesLoaded && contactCompanies && contactCompanies.length > 0 ? (
                                  contactCompanies.map((company) => (
                                    <tr key={company.contact_companies_id} style={{ borderBottom: '1px solid #333' }}>
                                      <td style={{ padding: '12px 15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                          {editingCompanyId === company.contact_companies_id ? (
                                            <input
                                              type="text"
                                              value={editCompanyName}
                                              onChange={(e) => setEditCompanyName(e.target.value)}
                                              onKeyDown={(e) => handleCompanyNameKeyDown(e, company)}
                                              onBlur={saveCompanyName}
                                              autoFocus
                                              style={{
                                                background: 'transparent',
                                                border: 'none',
                                                borderBottom: '1px solid #00ff00',
                                                color: '#fff',
                                                width: '100%',
                                                padding: '8px 0',
                                                outline: 'none'
                                              }}
                                            />
                                          ) : (
                                            <div 
                                              onClick={() => startEditingCompany(company)}
                                              style={{
                                                width: '100%',
                                                padding: '8px 0',
                                                cursor: 'pointer',
                                                color: '#fff',
                                              }}
                                            >
                                              {company.name || 'Unnamed Company'}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td style={{ padding: '12px 15px' }}>
                                        <div style={{ 
                                          display: 'flex', 
                                          flexWrap: 'wrap', 
                                          gap: '5px',
                                          minHeight: '32px'
                                        }}>
                                          {company.tags && company.tags.length > 0 ? (
                                            <>
                                              {company.tags.map(tag => (
                                                <div 
                                                  key={tag.tag_id || tag.entry_id} 
                                                  style={{
                                                    background: '#333',
                                                    color: '#00ff00',
                                                    border: '1px solid #00ff00',
                                                    borderRadius: '3px',
                                                    padding: '2px 5px',
                                                    fontSize: '0.7rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
                                                  }}
                                                >
                                                  {tag.name}
                                                  <span 
                                                    onClick={() => handleRemoveCompanyTag(company.company_id, tag.tag_id)}
                                                    style={{ 
                                                      cursor: 'pointer',
                                                      display: 'flex',
                                                      alignItems: 'center'
                                                    }}
                                                  >
                                                    <FiX size={10} />
                                                  </span>
                                                </div>
                                              ))}
                                              <button
                                                onClick={() => handleShowAddTagModal(company.company_id)}
                                                style={{
                                                  background: 'transparent',
                                                  color: '#00ff00',
                                                  border: 'none',
                                                  borderRadius: '3px',
                                                  padding: '2px 4px',
                                                  fontSize: '0.7rem',
                                                  cursor: 'pointer',
                                                  display: 'flex',
                                                  alignItems: 'center'
                                                }}
                                              >
                                                <FiPlus size={10} />
                                              </button>
                                            </>
                                          ) : (
                                            <button
                                              onClick={() => handleShowAddTagModal(company.company_id)}
                                              style={{
                                                background: '#333',
                                                color: '#00ff00',
                                                border: '1px solid #00ff00',
                                                borderRadius: '3px',
                                                padding: '0px 5px',
                                                fontSize: '0.7rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '3px'
                                              }}
                                            >
                                              <FiPlus size={10} /> Add
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                      <td style={{ padding: '12px 15px' }}>
                                        <select
                                          value={company.category || ''}
                                          onChange={(e) => handleCompanyChange(company.contact_companies_id, 'category', e.target.value)}
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#fff',
                                            padding: '8px 0',
                                            width: '100%',
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'none',
                                            appearance: 'none',
                                            backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' fill=\'none\' stroke=\'%23aaa\' stroke-width=\'1.5\' viewBox=\'0 0 10 6\'><polyline points=\'1,1 5,5 9,1\'/></svg>")',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right center',
                                            paddingRight: '20px'
                                          }}
                                        >
                                          <option value="Not Set">Not Set</option>
                                          <option value="Inbox">Inbox</option>
                                          <option value="Professional Investor">Professional Investor</option>
                                          <option value="Startup">Startup</option>
                                          <option value="Corporate">Corporate</option>
                                          <option value="Corporation">Corporation</option>
                                          <option value="Advisory">Advisory</option>
                                          <option value="SME">SME</option>
                                          <option value="Institution">Institution</option>
                                          <option value="Media">Media</option>
                                          <option value="Skip">Skip</option>
                                        </select>
                                      </td>
                                      <td style={{ padding: '12px 15px' }}>
                                        <select
                                          value={company.relationship || 'not_set'}
                                          onChange={(e) => handleCompanyChange(company.contact_companies_id, 'relationship', e.target.value)}
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#fff',
                                            padding: '8px 0',
                                            width: '100%',
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'none',
                                            appearance: 'none',
                                            backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' fill=\'none\' stroke=\'%23aaa\' stroke-width=\'1.5\' viewBox=\'0 0 10 6\'><polyline points=\'1,1 5,5 9,1\'/></svg>")',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right center',
                                            paddingRight: '20px'
                                          }}
                                        >
                                          <option value="not_set">Not Set</option>
                                          <option value="employee">Employee</option>
                                          <option value="founder">Founder</option>
                                          <option value="advisor">Advisor</option>
                                          <option value="manager">Manager</option>
                                          <option value="investor">Investor</option>
                                          <option value="other">Other</option>
                                        </select>
                                      </td>
                                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                          <button
                                            onClick={() => openEditCompanyModal(company)}
                                            title="Edit company"
                                            style={{
                                              background: 'transparent',
                                              color: '#00ff00',
                                              border: 'none',
                                              padding: '4px',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center'
                                            }}
                                          >
                                            <FiEdit size={16} />
                                          </button>
                                          <button
                                            onClick={() => handleRemoveCompanyAssociation(company.contact_companies_id)}
                                            title="Remove association"
                                            style={{
                                              background: 'transparent',
                                              color: '#00ff00',
                                              border: 'none',
                                              padding: '4px',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center'
                                            }}
                                          >
                                            <FiX size={16} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : !companiesLoaded ? (
                                  <tr>
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999', height: '80px' }}>
                                      Loading companies...
                                    </td>
                                  </tr>
                                ) : (
                                  <tr>
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999', height: '80px' }}>
                                      No companies associated with this contact.{' '}
                                      <span 
                                        onClick={() => setShowAssociateCompanyModal(true)}
                                        style={{ 
                                          color: '#00ff00', 
                                          cursor: 'pointer', 
                                          textDecoration: 'underline'
                                        }}
                                      >
                                        Associate a company
                                      </span>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      
                    </>
                  )}
                  
                  {/* DEALS SECTION */}
                  {activeEnrichmentSection === "deals" && (
                    <>
                      <div style={{ color: '#999', textAlign: 'center', padding: '30px 0' }}>
                        Deal management will appear here
                      </div>
                    </>
                  )}
                  
                  {/* NOTES SECTION */}
                  {activeEnrichmentSection === "notes" && (
                    <>
                      <FormGroup>
                        <FormFieldLabel>
                          Rating
                          {airtableContact && airtableContact.rating && ` - Airtable Rating: ${airtableContact.rating}`}
                        </FormFieldLabel>
                        <div style={{ 
                          background: '#222', 
                          padding: '12px', 
                          borderRadius: '4px',
                          marginBottom: '20px'
                        }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <div 
                                key={star}
                                onClick={() => handleInputChange('score', star === formData.score ? null : star)}
                                style={{ 
                                  cursor: 'pointer',
                                  color: formData.score >= star ? '#ffbb00' : '#555',
                                  fontSize: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '30px',
                                  height: '30px'
                                }}
                              >
                                ★
                              </div>
                            ))}
                            <div style={{ marginLeft: '10px', color: '#999', fontSize: '14px', alignSelf: 'center' }}>
                              {formData.score ? `${formData.score} of 5` : 'Not rated'} 
                              {formData.score && <span style={{ marginLeft: '5px', cursor: 'pointer', color: '#777' }} onClick={() => handleInputChange('score', null)}>(clear)</span>}
                            </div>
                          </div>
                        </div>
                      </FormGroup>
                      
                      <FormGroup>
                        <FormFieldLabel>
                          Description
                          {airtableContact && airtableContact.description && ` - Airtable: ${airtableContact.description}`}
                        </FormFieldLabel>
                        <div style={{ 
                          background: '#222', 
                          padding: '12px', 
                          borderRadius: '4px',
                          marginBottom: '20px'
                        }}>
                          {/* Description content display with edit toggle */}
                          {formData.description && formData.editingDescription === false ? (
                            <>
                              <div 
                                style={{ 
                                  whiteSpace: 'pre-wrap',
                                  marginBottom: '10px',
                                  minHeight: '50px'
                                }}
                              >
                                {formData.description}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <div 
                                  onClick={() => handleInputChange('editingDescription', true)}
                                  style={{ cursor: 'pointer', color: '#00ff00', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <FiEdit size={14} /> Edit
                                </div>
                                <div 
                                  onClick={() => handleInputChange('description', '')}
                                  style={{ cursor: 'pointer', color: '#777', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <FiX size={14} /> Clear
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <TextArea 
                                value={formData.description || ''}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Add notes or description about this contact..."
                                style={{ minHeight: '120px', boxSizing: 'border-box', width: '100%' }}
                              />
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#999', 
                                marginTop: '8px',
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}>
                                <div>
                                  {formData.description ? 
                                    `${formData.description.length} characters` : 
                                    'No description added'}
                                </div>
                                {formData.editingDescription && (
                                  <div 
                                    onClick={() => handleInputChange('editingDescription', false)}
                                    style={{ cursor: 'pointer', color: '#00ff00' }}
                                  >
                                    Done editing
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </FormGroup>
                      
                      <FormGroup>
                        <FormFieldLabel>
                          Birthday
                          {airtableContact && airtableContact.next_birthday && ` - Airtable Next Birthday: ${airtableContact.next_birthday}`}
                        </FormFieldLabel>
                        <div style={{ 
                          background: '#222', 
                          padding: '12px', 
                          borderRadius: '4px',
                          marginBottom: '20px'
                        }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <Input 
                              type="date"
                              value={formData.birthday || ''}
                              onChange={(e) => handleInputChange('birthday', e.target.value)}
                              style={{ flex: 1 }}
                            />
                            {formData.birthday && (
                              <div 
                                onClick={() => handleInputChange('birthday', null)}
                                style={{ cursor: 'pointer', color: '#777', fontSize: '14px' }}
                              >
                                Clear
                              </div>
                            )}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#999', 
                            marginTop: '8px',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}>
                            <div>
                              {formData.birthday 
                                ? `Birthday: ${new Date(formData.birthday).toLocaleDateString()}` 
                                : 'No birthday set'}
                            </div>
                            {formData.birthday && (
                              <div>
                                {(() => {
                                  const today = new Date();
                                  const birthDate = new Date(formData.birthday);
                                  const age = today.getFullYear() - birthDate.getFullYear();
                                  return `Age: ~${age} years`;
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </FormGroup>
                    </>
                  )}
                  
                </div>
                
                <ButtonGroup style={{ marginTop: '20px', marginBottom: '20px', width: 'calc(100% - 40px)', padding: '0 0 0 20px', justifyContent: 'space-between' }}>
                  <ActionButton onClick={() => goToStep(2)} disabled={loading}>
                    <FiArrowLeft /> Back
                  </ActionButton>
                  
                  <div>
                    <ActionButton 
                      onClick={() => goToStep(4)} 
                      disabled={loading}
                      style={{ marginRight: '10px' }}
                    >
                      Recap <FiArrowRight />
                    </ActionButton>
                  
                    <ActionButton 
                      variant="success" 
                      onClick={async () => {
                        const success = await saveContactEnrichment();
                        if (success) {
                          // Move to the next section vertically based on active section
                          const sections = ["basics", "tags", "notes", "companies", "deals", "airtable"];
                          const currentIndex = sections.indexOf(activeEnrichmentSection);
                          if (currentIndex < sections.length - 1) {
                            // Move to next section
                            setActiveEnrichmentSection(sections[currentIndex + 1]);
                          } else {
                            // After going through all sections, move to recap
                            goToStep(4);
                          }
                        }
                      }} 
                      disabled={loading}
                    >
                      <FiCheck /> Save & Continue
                    </ActionButton>
                  </div>
                </ButtonGroup>
              </InteractionsContainer>
            </InteractionsLayout>
          </Card>
        </>
      )}      {/* Step 4: Recap */}
      {currentStep === 4 && (
        <>
          <Card>
            <SectionTitle>
              <FiBriefcase /> Professional Information
            </SectionTitle>
            
            <FormGrid>
              <div>
                <FormGroup>
                  <InputLabel>LinkedIn Profile</InputLabel>
                  <Input 
                    type="text"
                    value={formData.linkedIn || ''}
                    onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                    placeholder="Enter LinkedIn URL"
                  />
                </FormGroup>
                
                <FormGroup>
                  <InputLabel>Company</InputLabel>
                  <Select 
                    value={formData.company?.id || ''}
                    onChange={(e) => {
                      const companyId = e.target.value;
                      // This would typically fetch the company details from a list of companies
                      handleInputChange('company', companyId ? { 
                        id: companyId, 
                        name: e.target.options[e.target.selectedIndex].text 
                      } : null);
                    }}
                  >
                    <option value="">Select a company</option>
                    <option value="1">Acme Corp</option>
                    <option value="2">Stark Industries</option>
                    <option value="3">Wayne Enterprises</option>
                    <option value="4">Hooli</option>
                    <option value="5">Pied Piper</option>
                  </Select>
                  
                  {showSources.hubspot && externalSources.hubspot.company && (
                    <ExternalSourceInfo color="#ff7a59">
                      <div className="source-label">HubSpot</div>
                      <div className="source-value">{externalSources.hubspot.company.name}</div>
                    </ExternalSourceInfo>
                  )}
                  
                  {showSources.airtable && externalSources.airtable.company && (
                    <ExternalSourceInfo color="#2d7ff9">
                      <div className="source-label">Airtable</div>
                      <div className="source-value">{externalSources.airtable.company.name}</div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
              </div>
              
              <div>
                <FormGroup>
                  <InputLabel>Notes</InputLabel>
                  <TextArea 
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter notes about this contact"
                  />
                  
                  {showSources.hubspot && externalSources.hubspot.notes && (
                    <ExternalSourceInfo color="#ff7a59">
                      <div className="source-label">HubSpot Notes</div>
                      <div className="source-value">{externalSources.hubspot.notes}</div>
                    </ExternalSourceInfo>
                  )}
                  
                  {showSources.supabase && externalSources.supabase.notes && (
                    <ExternalSourceInfo color="#3ecf8e">
                      <div className="source-label">Old Supabase Notes</div>
                      <div className="source-value">{externalSources.supabase.notes}</div>
                    </ExternalSourceInfo>
                  )}
                  
                  {showSources.airtable && externalSources.airtable.notes && (
                    <ExternalSourceInfo color="#2d7ff9">
                      <div className="source-label">Airtable Notes</div>
                      <div className="source-value">{externalSources.airtable.notes}</div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
                
                <FormGroup>
                  <InputLabel>Deal Information</InputLabel>
                  <TextArea 
                    value={formData.dealInfo || ''}
                    onChange={(e) => handleInputChange('dealInfo', e.target.value)}
                    placeholder="Enter any deal-related information"
                  />
                </FormGroup>
              </div>
            </FormGrid>
          </Card>
          
          <ButtonGroup>
            <ActionButton onClick={() => goToStep(3)} disabled={loading}>
              <FiArrowLeft /> Back
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={saveToCRM} 
              disabled={loading}
            >
              <FiCheck /> Add to CRM
            </ActionButton>
          </ButtonGroup>
        </>
      )}
      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModalOpen}
        onRequestClose={() => setDeleteModalOpen(false)}
        shouldCloseOnOverlayClick={false}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '25px',
            maxWidth: '600px',
            width: '90%',
            backgroundColor: '#121212',
            border: '1px solid #333',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
            color: '#e0e0e0',
            zIndex: 1001
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
          }
        }}
      >
        <ModalHeader>
          <h2>Delete Contact and Associated Data</h2>
          <CloseButton onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
            <FiX />
          </CloseButton>
        </ModalHeader>
        
        {contactToDelete && (
          <>
            <ContactDetail>
              <DetailItem>
                <DetailValue>
                  {contactToDelete.first_name} {contactToDelete.last_name}
                  {contactToDelete.email ? ` (${contactToDelete.email})` : 
                   contactToDelete.mobile ? ` (${contactToDelete.mobile})` : ''}
                </DetailValue>
              </DetailItem>
            </ContactDetail>
            
            <DetailItem style={{ marginTop: '15px', marginBottom: '15px' }}>
              <DetailLabel>Last Interaction:</DetailLabel>
              <DetailValue>
                {associatedData.lastInteraction ? 
                  associatedData.lastInteraction.summary : 
                  'None'}
              </DetailValue>
            </DetailItem>
            
            <ModalContent>
              Select which items to delete:
            </ModalContent>
            
            <CheckboxContainer>
              <CheckboxGroup>
                {/* Only show checkboxes for items that exist */}
                {associatedData.interactionsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteInteractions" 
                      name="deleteInteractions"
                      checked={selectedItems.deleteInteractions}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteInteractions">Interactions ({associatedData.interactionsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.emailsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteEmails" 
                      name="deleteEmails"
                      checked={selectedItems.deleteEmails}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteEmails">Emails ({associatedData.emailsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.emailParticipantsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteEmailParticipants" 
                      name="deleteEmailParticipants"
                      checked={selectedItems.deleteEmailParticipants}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteEmailParticipants">Email Participants ({associatedData.emailParticipantsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.emailThreadsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteEmailThreads" 
                      name="deleteEmailThreads"
                      checked={selectedItems.deleteEmailThreads}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteEmailThreads">Email Threads ({associatedData.emailThreadsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.contactEmailsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteContactEmails" 
                      name="deleteContactEmails"
                      checked={selectedItems.deleteContactEmails}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteContactEmails">Email Addresses ({associatedData.contactEmailsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.contactMobilesCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteContactMobiles" 
                      name="deleteContactMobiles"
                      checked={selectedItems.deleteContactMobiles}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteContactMobiles">Mobile Numbers ({associatedData.contactMobilesCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.chatCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteChat" 
                      name="deleteChat"
                      checked={selectedItems.deleteChat}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteChat">Chat messages ({associatedData.chatCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.contactChatsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteContactChats" 
                      name="deleteContactChats"
                      checked={selectedItems.deleteContactChats}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteContactChats">Chat Links ({associatedData.contactChatsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.notesCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteNotes" 
                      name="deleteNotes"
                      checked={selectedItems.deleteNotes}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteNotes">Notes ({associatedData.notesCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.attachmentsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteAttachments" 
                      name="deleteAttachments"
                      checked={selectedItems.deleteAttachments}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteAttachments">Attachments ({associatedData.attachmentsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.tagsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteTags" 
                      name="deleteTags"
                      checked={selectedItems.deleteTags}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteTags">Tags ({associatedData.tagsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.citiesCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteCities" 
                      name="deleteCities"
                      checked={selectedItems.deleteCities}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteCities">Cities ({associatedData.citiesCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.companiesCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteCompanies" 
                      name="deleteCompanies"
                      checked={selectedItems.deleteCompanies}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteCompanies">Companies ({associatedData.companiesCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.dealsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteDeals" 
                      name="deleteDeals"
                      checked={selectedItems.deleteDeals}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteDeals">Deals ({associatedData.dealsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.meetingsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteMeetings" 
                      name="deleteMeetings"
                      checked={selectedItems.deleteMeetings}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteMeetings">Meetings ({associatedData.meetingsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.investmentsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteInvestments" 
                      name="deleteInvestments"
                      checked={selectedItems.deleteInvestments}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteInvestments">Investments ({associatedData.investmentsCount})</label>
                  </CheckboxItem>
                )}
                
                {associatedData.kitCount > 0 && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="deleteKit" 
                      name="deleteKit"
                      checked={selectedItems.deleteKit}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteKit">Keep In Touch ({associatedData.kitCount})</label>
                  </CheckboxItem>
                )}
                
                {contactToDelete.email && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="addToSpam" 
                      name="addToSpam"
                      checked={selectedItems.addToSpam}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="addToSpam">Add email to spam list</label>
                  </CheckboxItem>
                )}
                
                {contactToDelete.mobile && (
                  <CheckboxItem>
                    <Checkbox 
                      type="checkbox" 
                      id="addMobileToSpam" 
                      name="addMobileToSpam"
                      checked={selectedItems.addMobileToSpam}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="addMobileToSpam">Add mobile to WhatsApp spam list</label>
                  </CheckboxItem>
                )}
              </CheckboxGroup>
            </CheckboxContainer>
            
            <ButtonGroup>
              <CancelButton 
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                <FiX /> Cancel
              </CancelButton>
              <ConfirmButton 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : (
                  <>
                    <FiTrash2 /> Delete Contact
                  </>
                )}
              </ConfirmButton>
            </ButtonGroup>
          </>
        )}
      </Modal>

      {/* New Company Modal */}
      <Modal
        isOpen={showNewCompanyModal}
        onRequestClose={() => {
          setShowNewCompanyModal(false);
          setNewCompanyData({
            name: '',
            category: '',
            website: '',
            description: '',
            linkedin: ''
          });
        }}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '25px',
            maxWidth: '500px',
            width: '90%',
            backgroundColor: '#121212',
            border: '1px solid #333',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
            color: '#e0e0e0',
            zIndex: 1001
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
          }
        }}
      >
        <ModalHeader>
          <h2>Add New Company</h2>
          <CloseButton 
            onClick={() => {
              setShowNewCompanyModal(false);
              setNewCompanyData({
                name: '',
                category: '',
                website: '',
                description: '',
                linkedin: ''
              });
            }}
          >
            <FiX />
          </CloseButton>
        </ModalHeader>

        <div style={{ marginBottom: '20px' }}>
          <FormGroup>
            <FormFieldLabel>Company Name*</FormFieldLabel>
            <Input 
              type="text"
              value={newCompanyData.name}
              onChange={(e) => setNewCompanyData({...newCompanyData, name: e.target.value})}
              placeholder="Enter company name"
              style={{ width: '100%' }}
            />
          </FormGroup>

          <FormGroup>
            <FormFieldLabel>Category*</FormFieldLabel>
            <Select
              value={newCompanyData.category}
              onChange={(e) => setNewCompanyData({...newCompanyData, category: e.target.value})}
              style={{ 
                width: '100%',
                padding: '10px',
                backgroundColor: '#222',
                borderColor: '#444',
                color: '#eee'
              }}
            >
              <option value="">Select a category</option>
              <option value="Advisory">Advisory</option>
              <option value="Corporation">Corporation</option>
              <option value="Institution">Institution</option>
              <option value="Media">Media</option>
              <option value="Professional Investor">Professional Investor</option>
              <option value="Skip">Skip</option>
              <option value="SME">SME</option>
              <option value="Startup">Startup</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <FormFieldLabel>Website</FormFieldLabel>
            <Input 
              type="text"
              value={newCompanyData.website}
              onChange={(e) => setNewCompanyData({...newCompanyData, website: e.target.value})}
              placeholder="Enter company website"
              style={{ width: '100%' }}
            />
          </FormGroup>

          <FormGroup>
            <FormFieldLabel>LinkedIn</FormFieldLabel>
            <Input 
              type="text"
              value={newCompanyData.linkedin}
              onChange={(e) => setNewCompanyData({...newCompanyData, linkedin: e.target.value})}
              placeholder="Enter company LinkedIn URL"
              style={{ width: '100%' }}
            />
          </FormGroup>

          <FormGroup>
            <FormFieldLabel>Description</FormFieldLabel>
            <TextArea 
              value={newCompanyData.description}
              onChange={(e) => setNewCompanyData({...newCompanyData, description: e.target.value})}
              placeholder="Enter company description"
              style={{ width: '100%', minHeight: '100px' }}
            />
          </FormGroup>
        </div>

        <ButtonGroup style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
          <ActionButton 
            variant="secondary" 
            onClick={() => {
              setShowNewCompanyModal(false);
              setNewCompanyData({
                name: '',
                category: '',
                website: '',
                description: '',
                linkedin: ''
              });
            }}
            style={{ marginRight: '10px' }}
          >
            Cancel
          </ActionButton>
          <ActionButton 
            variant="success" 
            onClick={async () => {
              // Validate
              if (!newCompanyData.name) {
                toast.error('Company name is required');
                return;
              }
              if (!newCompanyData.category) {
                toast.error('Category is required');
                return;
              }
              
              try {
                setLoading(true);
                
                // Create the new company
                const { data: newCompany, error } = await supabase
                  .from('companies')
                  .insert({
                    name: newCompanyData.name,
                    category: newCompanyData.category,
                    website: newCompanyData.website || null,
                    linkedin: newCompanyData.linkedin || null,
                    description: newCompanyData.description || null
                  })
                  .select('*')
                  .single();
                
                if (error) throw error;
                
                // Associate the new company with the contact
                const { error: associationError } = await supabase
                  .from('contact_companies')
                  .insert({
                    contact_id: contactId,
                    company_id: newCompany.company_id,
                    relationship: 'not_set',
                    is_primary: formData.associatedCompanies?.length === 0
                  });
                
                if (associationError) throw associationError;
                
                // Update the local state
                const newCompanyAssociation = {
                  company_id: newCompany.company_id,
                  name: newCompany.name,
                  website: newCompany.website,
                  category: newCompany.category,
                  description: newCompany.description,
                  linkedin: newCompany.linkedin,
                  relationship: 'not_set',
                  is_primary: formData.associatedCompanies?.length === 0
                };
                
                handleInputChange('associatedCompanies', [
                  ...(formData.associatedCompanies || []), 
                  newCompanyAssociation
                ]);
                
                // Reset and close modal
                setNewCompanyData({
                  name: '',
                  category: '',
                  website: '',
                  description: '',
                  linkedin: ''
                });
                setShowNewCompanyModal(false);
                
                toast.success(`Company ${newCompany.name} created and added`);
                setLoading(false);
              } catch (err) {
                console.error('Error creating company:', err);
                toast.error('Failed to create company');
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Company'}
          </ActionButton>
        </ButtonGroup>
      </Modal>

      {/* LinkedIn Preview Modal */}
      <LinkedInPreviewModal
        isOpen={showLinkedInPreviewModal}
        onClose={() => setShowLinkedInPreviewModal(false)}
        linkedInUrl={formData.linkedIn || contact?.linkedin}
        contactName={`${contact?.first_name || ''} ${contact?.last_name || ''}`.trim()}
        firstName={contact?.first_name}
        lastName={contact?.last_name}
        email={contact?.email}
        jobRole={formData.jobRole || contact?.job_role}
        onSaveData={async (data) => {
          // Update form data with all the extracted information
          if (data.jobRole) {
            handleInputChange('jobRole', data.jobRole);
          }
          
          try {
            // Step 1: Update job title in contacts database
            const contactUpdateData = {
              job_role: data.jobRole || null,
              city: data.city || null
            };
            
            const { error: contactUpdateError } = await supabase
              .from('contacts')
              .update(contactUpdateData)
              .eq('contact_id', contact.contact_id);
              
            if (contactUpdateError) {
              console.error('Error updating contact data:', contactUpdateError);
              toast.error('Failed to update contact information');
              return;
            }
            
            // Update the local contact object
            setContact(prev => ({
              ...prev,
              job_role: data.jobRole || prev.job_role,
              city: data.city || prev.city
            }));
            
            // Step 2: Create or update company if company data is provided
            if (data.company) {
              // Extract domain from website if available
              let companyDomain = null;
              if (data.companyWebsite) {
                try {
                  const url = new URL(data.companyWebsite);
                  companyDomain = url.hostname.replace('www.', '');
                } catch (e) {
                  console.log('Invalid URL format, using raw website value');
                  companyDomain = data.companyWebsite;
                }
              }
              
              // Search for existing company by domain if available, otherwise by name
              const searchQuery = companyDomain 
                ? supabase.from('companies').select('*').ilike('website', `%${companyDomain}%`)
                : supabase.from('companies').select('*').ilike('name', data.company);
              
              const { data: existingCompanies, error: companySearchError } = await searchQuery;
              
              if (companySearchError) {
                console.error('Error searching for company:', companySearchError);
                toast.error('Error checking for existing company');
                return;
              }
              
              let companyId;
              
              // If company exists, update it
              if (existingCompanies && existingCompanies.length > 0) {
                const existingCompany = existingCompanies[0];
                companyId = existingCompany.company_id;
                
                // Only update if new data is provided
                const companyUpdateData = {};
                if (data.companyDescription && !existingCompany.description) {
                  companyUpdateData.description = data.companyDescription;
                }
                
                if (data.companyWebsite && !existingCompany.website) {
                  companyUpdateData.website = data.companyWebsite;
                }
                
                // Only update if we have new data
                if (Object.keys(companyUpdateData).length > 0) {
                  const { error: companyUpdateError } = await supabase
                    .from('companies')
                    .update(companyUpdateData)
                    .eq('company_id', companyId);
                    
                  if (companyUpdateError) {
                    console.error('Error updating company:', companyUpdateError);
                    toast.error('Failed to update company information');
                    return;
                  }
                }
                
                console.log('Updated existing company:', existingCompany.name);
              } 
              // Create new company if it doesn't exist
              else {
                const newCompany = {
                  name: data.company,
                  website: data.companyWebsite || null,
                  description: data.companyDescription || null,
                  created_by: 'API',
                  last_modified_by: 'API'
                };
                
                const { data: insertedCompany, error: companyInsertError } = await supabase
                  .from('companies')
                  .insert(newCompany)
                  .select();
                  
                if (companyInsertError) {
                  console.error('Error creating company:', companyInsertError);
                  toast.error('Failed to create company');
                  return;
                }
                
                if (insertedCompany && insertedCompany.length > 0) {
                  companyId = insertedCompany[0].company_id;
                  console.log('Created new company:', data.company);
                } else {
                  console.error('Failed to get company ID after creation');
                  return;
                }
              }
              
              // Step 3: Create city record if needed and link to company
              if (data.city && companyId) {
                // Check if city already exists
                const { data: existingCities, error: citySearchError } = await supabase
                  .from('cities')
                  .select('*')
                  .ilike('name', data.city);
                  
                if (citySearchError) {
                  console.error('Error searching for city:', citySearchError);
                  // Non-critical error, continue with the process
                }
                
                let cityId;
                
                // Use existing city if available
                if (existingCities && existingCities.length > 0) {
                  cityId = existingCities[0].id;
                } 
                // Create new city if it doesn't exist
                else {
                  const { data: insertedCity, error: cityInsertError } = await supabase
                    .from('cities')
                    .insert({ name: data.city })
                    .select();
                    
                  if (cityInsertError) {
                    console.error('Error creating city:', cityInsertError);
                    // Non-critical error, continue with the process
                  } else if (insertedCity && insertedCity.length > 0) {
                    cityId = insertedCity[0].id;
                  }
                }
                
                // Link company to city if both IDs are available
                if (cityId && companyId) {
                  // Check if the link already exists
                  const { data: existingLinks, error: linkSearchError } = await supabase
                    .from('company_cities')
                    .select('*')
                    .eq('company_id', companyId)
                    .eq('city_id', cityId);
                    
                  if (linkSearchError) {
                    console.error('Error checking company-city link:', linkSearchError);
                  }
                  
                  // Create the link if it doesn't exist
                  if (!existingLinks || existingLinks.length === 0) {
                    const { error: linkInsertError } = await supabase
                      .from('company_cities')
                      .insert({
                        company_id: companyId,
                        city_id: cityId
                      });
                      
                    if (linkInsertError) {
                      console.error('Error linking company to city:', linkInsertError);
                    }
                  }
                }
              }
              
              // Step 4: Create contact-company relationship if not exists
              if (companyId) {
                // Check if relationship already exists
                const { data: existingRelationships, error: relationshipSearchError } = await supabase
                  .from('contact_companies')
                  .select('*')
                  .eq('contact_id', contact.contact_id)
                  .eq('company_id', companyId);
                  
                if (relationshipSearchError) {
                  console.error('Error checking contact-company relationship:', relationshipSearchError);
                }
                
                // Create the relationship if it doesn't exist
                if (!existingRelationships || existingRelationships.length === 0) {
                  const { error: relationshipInsertError } = await supabase
                    .from('contact_companies')
                    .insert({
                      contact_id: contact.contact_id,
                      company_id: companyId,
                      relationship: 'not_set',
                      is_primary: true
                    });
                    
                  if (relationshipInsertError) {
                    console.error('Error creating contact-company relationship:', relationshipInsertError);
                    toast.error('Failed to link contact to company');
                  } else {
                    console.log('Successfully linked contact to company');
                  }
                }
              }
              
              toast.success(`Job information updated: ${data.jobRole} at ${data.company}`);
            } else {
              toast.success('Contact information updated');
            }
            
            // Handle keywords/tags if provided
            if (data.keywords && data.keywords.length > 0) {
              console.log('Tags available for adding:', data.keywords);
              // Implementation for adding tags would go here
            }
          } catch (err) {
            console.error('Exception processing LinkedIn data:', err);
            toast.error('An error occurred while processing the data');
          }
        }}
      />

      {/* Company Tags Modal */}
      <CompanyTagsModal
        isOpen={showAddTagModal}
        onRequestClose={() => {
          setShowAddTagModal(false);
          // Refresh company data after closing the modal to show new tags
          setTimeout(() => loadCompanyTags(), 500);
        }}
        company={{ id: selectedCompanyForTags }}
      />
      
      <NewEditCompanyModal
        isOpen={showEditCompanyModal}
        onRequestClose={() => {
          setShowEditCompanyModal(false);
          // Refresh company data after closing
          loadContactCompanies();
          loadCompanyTags();
        }}
        company={selectedCompanyForEdit}
        contactId={contactId}
        onCompanyUpdated={() => {
          // Refresh data
          loadContactCompanies();
          loadCompanyTags();
        }}
      />
      
      {/* Associate Company Modal */}
      <AssociateCompanyModal
        isOpen={showAssociateCompanyModal}
        onRequestClose={() => setShowAssociateCompanyModal(false)}
        contactId={contactId}
        onCompanyAssociated={(result) => {
          if (result.action === 'create_new') {
            // Open create company modal with the name
            setNewCompanyInitialName(result.name);
            setShowCreateCompanyModal(true);
          } else if (result.action === 'associated') {
            console.log('Company successfully associated, reloading data from Supabase');
            
            // Get the latest data from Supabase instead of managing it locally
            // This ensures we always have the correct state
            setTimeout(() => {
              loadContactCompanies();
            }, 500);
          }
        }}
      />
      
      {/* Create Company Modal */}
      <CreateCompanyModal
        isOpen={showCreateCompanyModal}
        onRequestClose={() => {
          setShowCreateCompanyModal(false);
          setNewCompanyInitialName('');
        }}
        initialName={newCompanyInitialName}
        contactId={contactId}
        onCompanyCreated={(result) => {
          // Similar to onCompanyAssociated, add directly to state
          const newCompany = {
            contact_companies_id: result.data?.contact_companies_id,
            company_id: result.company.company_id,
            relationship: result.relationship || 'not_set',
            is_primary: result.isPrimary || false,
            name: result.company.name || 'Unknown Company',
            website: result.company.website || '',
            category: result.company.category || 'Inbox',
            description: result.company.description || '',
            linkedin: result.company.linkedin || '',
            tags: result.tags || [] // Use provided tags or empty array
          };
          
          console.log('Adding newly created company to state:', newCompany);
          
          // Add the new company to the state
          setContactCompanies(prevCompanies => [...prevCompanies, newCompany]);
          setCompaniesLoaded(true);
          
          // Load tags after a short delay
          setTimeout(() => loadCompanyTags(), 300);
        }}
      />
      
      {/* ManageContactEmails Modal */}
      <ManageContactEmails
        isOpen={showManageContactEmailsModal}
        onRequestClose={() => setShowManageContactEmailsModal(false)}
        contact={contact}
        onUpdateEmails={(updatedEmails) => {
          // Update emails in the contact object
          const updatedContact = { ...contact, emails: updatedEmails };
          setContact(updatedContact);
          
          // Update form data if needed
          if (formData) {
            setFormData(prev => ({ ...prev, emails: updatedEmails }));
          }
          
          // You might want to add code here to save to Supabase
          // This would depend on your backend structure
        }}
      />
      
      {/* ManageContactMobiles Modal */}
      <ManageContactMobiles
        isOpen={showManageContactMobilesModal}
        onRequestClose={() => setShowManageContactMobilesModal(false)}
        contact={contact}
        onUpdateMobiles={(updatedMobiles) => {
          // Update mobiles in the contact object
          const updatedContact = { ...contact, mobiles: updatedMobiles };
          setContact(updatedContact);
          
          // Update form data if needed
          if (formData) {
            setFormData(prev => ({ ...prev, mobiles: updatedMobiles }));
          }
          
          // You might want to add code here to save to Supabase
          // This would depend on your backend structure
        }}
      />
      
      {/* City Modal */}
      <CityModal
        isOpen={showCityModal}
        onRequestClose={() => setShowCityModal(false)}
        contact={contact}
        onCityAdded={(newCity) => {
          console.log('City added from modal:', newCity);
          
          // Update the formData with the new city
          const updatedFormData = { ...formData };
          if (!updatedFormData.cities) {
            updatedFormData.cities = [];
          }
          // Add the new city only if it doesn't already exist
          if (!updatedFormData.cities.some(city => city.city_id === newCity.city_id)) {
            updatedFormData.cities.push(newCity);
            setFormData(updatedFormData);
          }
          
          // Also update the contact object to ensure consistency
          const updatedContact = { ...contact };
          if (!updatedContact.cities) {
            updatedContact.cities = [];
          }
          // Add to contact if it doesn't already exist
          if (!updatedContact.cities.some(city => city.city_id === newCity.city_id)) {
            updatedContact.cities.push(newCity);
            setContact(updatedContact);
          }
          
          // Show success toast
          toast.success(`City "${newCity.name}" added`);
        }}
        onCityRemoved={(removedCity) => {
          console.log('City removed from modal:', removedCity);
          
          // Update formData by filtering out the removed city
          const updatedFormData = { ...formData };
          if (updatedFormData.cities && updatedFormData.cities.length > 0) {
            updatedFormData.cities = updatedFormData.cities.filter(city => 
              city.city_id !== removedCity.id && city.id !== removedCity.id
            );
            setFormData(updatedFormData);
          }
          
          // Also update the contact object to ensure consistency
          const updatedContact = { ...contact };
          if (updatedContact.cities && updatedContact.cities.length > 0) {
            updatedContact.cities = updatedContact.cities.filter(city => 
              city.city_id !== removedCity.id && city.id !== removedCity.id
            );
            setContact(updatedContact);
          }
          
          // Show success toast
          toast.success(`City "${removedCity.name}" removed`);
        }}
      />
      
      {/* Tags Modal */}
      <TagsModal
        isOpen={showTagsModal}
        onRequestClose={() => setShowTagsModal(false)}
        contact={contact}
        onTagAdded={(newTag) => {
          console.log('Tag added from modal:', newTag);
          
          // Update the formData with the new tag
          const updatedFormData = { ...formData };
          if (!updatedFormData.tags) {
            updatedFormData.tags = [];
          }
          // Add the new tag only if it doesn't already exist
          if (!updatedFormData.tags.some(tag => tag.tag_id === newTag.tag_id || tag.id === newTag.tag_id)) {
            updatedFormData.tags.push({
              id: newTag.tag_id,
              tag_id: newTag.tag_id,
              name: newTag.name
            });
            setFormData(updatedFormData);
          }
          
          // Also update the contact object to ensure consistency
          const updatedContact = { ...contact };
          if (!updatedContact.tags) {
            updatedContact.tags = [];
          }
          // Add to contact if it doesn't already exist
          if (!updatedContact.tags.some(tag => tag.tag_id === newTag.tag_id || tag.id === newTag.tag_id)) {
            updatedContact.tags.push({
              id: newTag.tag_id,
              tag_id: newTag.tag_id,
              name: newTag.name
            });
            setContact(updatedContact);
          }
          
          // Show success toast
          toast.success(`Tag "${newTag.name}" added`);
        }}
        onTagRemoved={(removedTag) => {
          console.log('Tag removed from modal:', removedTag);
          
          // Update formData by filtering out the removed tag
          const updatedFormData = { ...formData };
          if (updatedFormData.tags && updatedFormData.tags.length > 0) {
            updatedFormData.tags = updatedFormData.tags.filter(tag => 
              tag.tag_id !== removedTag.tag_id && tag.id !== removedTag.tag_id
            );
            setFormData(updatedFormData);
          }
          
          // Also update the contact object to ensure consistency
          const updatedContact = { ...contact };
          if (updatedContact.tags && updatedContact.tags.length > 0) {
            updatedContact.tags = updatedContact.tags.filter(tag => 
              tag.tag_id !== removedTag.tag_id && tag.id !== removedTag.tag_id
            );
            setContact(updatedContact);
          }
          
          // Show success toast
          toast.success(`Tag "${removedTag.name}" removed`);
        }}
      />
      
      {/* Company Contacts Modal */}
      <CompanyContactsModal
        isOpen={showCompanyContactsModal}
        onRequestClose={() => setShowCompanyContactsModal(false)}
        contact={contact}
      />
    </Container>
  );
};

export default ContactCrmWorkflow;