import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { 
  FiX, 
  FiCheck, 
  FiTrash2, 
  FiArrowRight,
  FiArrowLeft, 
  FiAlertTriangle, 
  FiMessageSquare, 
  FiMail, 
  FiPhone, 
  FiTag, 
  FiMapPin, 
  FiBriefcase, 
  FiLink, 
  FiCalendar,
  FiGitMerge,
  FiInfo,
  FiHome,
  FiChevronRight,
  FiSearch,
  FiUser,
  FiEdit,
  FiUsers
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
  flex: 0 0 20%;
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
  flex: 0 0 80%;
  padding: 0;
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

const WhatsAppContainer = styled.div`
  display: flex;
  width: 100%;
  padding: 4px 0;
  justify-content: ${props => props.direction === 'Outbound' ? 'flex-end' : 'flex-start'};
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

const CancelButton = styled.button`
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
  width: 100%;
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

const InlineEditInput = styled.input`
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

const ContactCrmWorkflow = () => {
  const { id: contactId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const stepParam = searchParams.get('step');
  
  // State
  const [contact, setContact] = useState(null);
  const [currentStep, setCurrentStep] = useState(parseInt(stepParam) || 1);
  const [loading, setLoading] = useState(true);
  
  // State for inline editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [error, setError] = useState(null);
  
  // Step 1: Relevance confirmation
  const [interactions, setInteractions] = useState({
    whatsapp: [],
    email: [],
    other: []
  });
  // Step 2: Duplicate check
  const [duplicates, setDuplicates] = useState([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState(null);
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
    mobile: '',
    email: '',
    linkedIn: '',
    company: null,
    dealInfo: ''
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
  const handleSelectChat = (chatId) => {
    setSelectedChat(chatId);
    // You can add logic here to load chat messages or other related data
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
          updated_at: item.email_threads.updated_at
        }))
        // Sort by date (newest first)
        .sort((a, b) => new Date(b.date || b.updated_at) - new Date(a.date || a.updated_at));
      
      console.log('Setting email threads:', formattedThreads);
      setEmailThreads(formattedThreads);
    } catch (err) {
      console.error('Error loading email threads:', err);
    }
  };

  // Load contact data and initialize workflow
  useEffect(() => {
    if (contactId) {
      console.log('Loading data for contact ID:', contactId);
      loadContactData();
      loadWhatsappChats(contactId);
      loadEmailThreads(contactId);
    }
  }, [contactId]);
  
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
          last_interaction_at,
          linkedin,
          keep_in_touch_frequency
        `)
        .eq('contact_id', contactId)
        .single();
      
      if (contactError) throw contactError;
      if (!contactData) throw new Error('Contact not found');
      
      setContact(contactData);
      
      // Initialize form data with empty email/mobile (will be loaded below)
      setFormData({
        keepInTouch: contactData.keep_in_touch_frequency,
        category: contactData.category,
        notes: '',
        city: null,
        tags: [],
        mobile: '',
        email: '',
        linkedIn: contactData.linkedin || '',
        company: null,
        dealInfo: ''
      });
      
      // Load related data in parallel
      await Promise.all([
        loadInteractions(contactData.contact_id),
        loadContactDetails(contactData.contact_id),
        loadEmailAndMobile(contactData.contact_id),
        mockExternalData(contactData)
      ]);
      
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
      // Load primary email
      const { data: emailData, error: emailError } = await supabase
        .from('contact_emails')
        .select('email_id, email, is_primary')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false })
        .limit(1);
      
      if (!emailError && emailData && emailData.length > 0) {
        setFormData(prev => ({
          ...prev,
          email: emailData[0].email
        }));
        
        // Update contact object to include email for display
        setContact(prev => ({
          ...prev,
          email: emailData[0].email
        }));
      }
      
      // Load primary mobile
      const { data: mobileData, error: mobileError } = await supabase
        .from('contact_mobiles')
        .select('mobile_id, mobile, is_primary')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false })
        .limit(1);
      
      if (!mobileError && mobileData && mobileData.length > 0) {
        setFormData(prev => ({
          ...prev,
          mobile: mobileData[0].mobile
        }));
        
        // Update contact object to include mobile for display
        setContact(prev => ({
          ...prev,
          mobile: mobileData[0].mobile
        }));
      }
    } catch (err) {
      console.error('Error loading email and mobile data:', err);
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
          id: t.tags.tag_id,
          name: t.tags.name
        })).filter(t => t.id && t.name);
        
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
          cities:city_id(city_id, name)
        `)
        .eq('contact_id', contactId);
      
      if (!citiesError && citiesData && citiesData.length > 0) {
        const city = {
          id: citiesData[0].cities.city_id,
          name: citiesData[0].cities.name
        };
        
        setFormData(prev => ({
          ...prev,
          city
        }));
      }
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          company_id,
          companies:company_id(company_id, name, website)
        `)
        .eq('contact_id', contactId);
      
      if (!companiesError && companiesData && companiesData.length > 0) {
        const company = {
          id: companiesData[0].companies.company_id,
          name: companiesData[0].companies.name,
          website: companiesData[0].companies.website
        };
        
        setFormData(prev => ({
          ...prev,
          company
        }));
      }
    } catch (err) {
      console.error('Error loading contact details:', err);
    }
  };
  
  // Mock external data sources (in a real app, these would be API calls)
  const mockExternalData = async (contactData) => {
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setExternalSources({
      hubspot: {
        email: contactData.email || 'hubspot_email@example.com',
        mobile: contactData.mobile || '+1234567890',
        company: { id: 'hs1', name: 'HubSpot Company', website: 'https://example.com' },
        tags: ['HubSpot Tag 1', 'HubSpot Tag 2'],
        notes: 'Notes from HubSpot: This contact was last active 3 months ago.',
        keepInTouch: 'monthly',
        category: 'Client'
      },
      supabase: {
        email: contactData.email || 'supabase_email@example.com',
        mobile: contactData.mobile ? contactData.mobile.replace('123', '456') : '+9876543210',
        company: null,
        tags: ['Supabase Tag 1'],
        notes: 'Notes from old Supabase: Contact has been in database since 2021.',
        keepInTouch: 'quarterly',
        category: 'Lead'
      },
      airtable: {
        email: '',
        mobile: contactData.mobile ? contactData.mobile.replace('123', '789') : '+1122334455',
        company: { id: 'at1', name: 'Airtable Company', website: 'https://airtable-example.com' },
        tags: ['Airtable Tag 1', 'Airtable Tag 2', 'Airtable Tag 3'],
        notes: 'Notes from Airtable: Contact requested follow-up.',
        keepInTouch: 'weekly',
        category: 'Investor'
      }
    });
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
    if (step < currentStep || step === currentStep) {
      setCurrentStep(step);
    } else if (step === 2 && currentStep === 1) {
      // Going from relevance to duplicates
      setCurrentStep(2);
      searchForDuplicates();
    } else if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    setSelectedDuplicate(selectedDuplicate?.contact_id === duplicate.contact_id ? null : duplicate);
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
            Add to CRM: {contact?.first_name} {contact?.last_name}
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
          <div className="step-label">Relevance</div>
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
          <div className="step-label">Professional</div>
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
      
      {/* Step 1: Relevance Confirmation */}
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
                        gap: '8px'
                      }}
                      onClick={() => console.log("Email thread clicked:", thread.thread_id)}
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
                  {/* No interactions to display */}
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
            ) : duplicates.length === 0 ? (
              <NoDataMessage>
                No potential duplicates found for this contact
              </NoDataMessage>
            ) : (
              <InteractionsLayout>
                {/* Duplicates menu - left side (1/3) */}
                <ChannelsMenu>
                  {/* Group by match type */}
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
                </ChannelsMenu>
                
                {/* Duplicate details - right side (2/3) */}
                <InteractionsContainer>
                  {selectedDuplicate ? (
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
                            <td>{contact.email || '-'}</td>
                            <td>{selectedDuplicate.email || '-'}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                      padding: '40px 20px',
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
            
            <SourceToggles>
              <SourceToggle 
                active={showSources.hubspot} 
                onClick={() => toggleSource('hubspot')}
              >
                HubSpot
              </SourceToggle>
              <SourceToggle 
                active={showSources.supabase} 
                onClick={() => toggleSource('supabase')}
              >
                Old Supabase
              </SourceToggle>
              <SourceToggle 
                active={showSources.airtable} 
                onClick={() => toggleSource('airtable')}
              >
                Airtable
              </SourceToggle>
            </SourceToggles>
            
            <FormGrid>
              {/* Left column */}
              <div>
                <FormGroup>
                  <InputLabel>Keep in Touch Frequency</InputLabel>
                  <Select 
                    value={formData.keepInTouch || ''}
                    onChange={(e) => handleInputChange('keepInTouch', e.target.value === '' ? null : e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="biannually">Bi-Annually</option>
                    <option value="annually">Annually</option>
                  </Select>
                  
                  {showSources.hubspot && externalSources.hubspot.keepInTouch && (
                    <ExternalSourceInfo color="#ff7a59">
                      <div className="source-label">HubSpot</div>
                      <div className="source-value">{externalSources.hubspot.keepInTouch}</div>
                    </ExternalSourceInfo>
                  )}
                  
                  {showSources.airtable && externalSources.airtable.keepInTouch && (
                    <ExternalSourceInfo color="#2d7ff9">
                      <div className="source-label">Airtable</div>
                      <div className="source-value">{externalSources.airtable.keepInTouch}</div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
                
                <FormGroup>
                  <InputLabel>Category</InputLabel>
                  <Select 
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value === '' ? null : e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="Friend">Friend</option>
                    <option value="Family">Family</option>
                    <option value="Work">Work</option>
                    <option value="Business">Business</option>
                    <option value="Client">Client</option>
                    <option value="Founder">Founder</option>
                    <option value="Investor">Investor</option>
                    <option value="Portfolio">Portfolio</option>
                  </Select>
                  
                  {showSources.hubspot && externalSources.hubspot.category && (
                    <ExternalSourceInfo color="#ff7a59">
                      <div className="source-label">HubSpot</div>
                      <div className="source-value">{externalSources.hubspot.category}</div>
                    </ExternalSourceInfo>
                  )}
                  
                  {showSources.supabase && externalSources.supabase.category && (
                    <ExternalSourceInfo color="#3ecf8e">
                      <div className="source-label">Old Supabase</div>
                      <div className="source-value">{externalSources.supabase.category}</div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
                
                <FormGroup>
                  <InputLabel>Mobile Number</InputLabel>
                  <Input 
                    type="text"
                    value={formData.mobile || ''}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    placeholder="Enter mobile number"
                  />
                  
                  {showSources.hubspot && externalSources.hubspot.mobile && (
                    <ExternalSourceInfo color="#ff7a59">
                      <div className="source-label">HubSpot</div>
                      <div className="source-value">{externalSources.hubspot.mobile}</div>
                    </ExternalSourceInfo>
                  )}
                  
                  {showSources.supabase && externalSources.supabase.mobile && (
                    <ExternalSourceInfo color="#3ecf8e">
                      <div className="source-label">Old Supabase</div>
                      <div className="source-value">{externalSources.supabase.mobile}</div>
                    </ExternalSourceInfo>
                  )}
                  
                  {showSources.airtable && externalSources.airtable.mobile && (
                    <ExternalSourceInfo color="#2d7ff9">
                      <div className="source-label">Airtable</div>
                      <div className="source-value">{externalSources.airtable.mobile}</div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
              </div>
              
              {/* Right column */}
              <div>
                <FormGroup>
                  <InputLabel>Email Address</InputLabel>
                  <Input 
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                  
                  {showSources.hubspot && externalSources.hubspot.email && (
                    <ExternalSourceInfo color="#ff7a59">
                      <div className="source-label">HubSpot</div>
                      <div className="source-value">{externalSources.hubspot.email}</div>
                    </ExternalSourceInfo>
                  )}
                  
                  {showSources.supabase && externalSources.supabase.email && (
                    <ExternalSourceInfo color="#3ecf8e">
                      <div className="source-label">Old Supabase</div>
                      <div className="source-value">{externalSources.supabase.email}</div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
                
                <FormGroup>
                  <InputLabel>City</InputLabel>
                  <Select 
                    value={formData.city?.id || ''}
                    onChange={(e) => {
                      const cityId = e.target.value;
                      // This would typically fetch the city details from a list of cities
                      // Here we're just using a placeholder
                      handleInputChange('city', cityId ? { id: cityId, name: e.target.options[e.target.selectedIndex].text } : null);
                    }}
                  >
                    <option value="">Select a city</option>
                    <option value="1">New York</option>
                    <option value="2">San Francisco</option>
                    <option value="3">London</option>
                    <option value="4">Berlin</option>
                    <option value="5">Paris</option>
                    <option value="6">Tokyo</option>
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <InputLabel>Tags</InputLabel>
                  <Input 
                    type="text"
                    placeholder="Type a tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        // Add tag
                        const newTag = { id: Date.now().toString(), name: e.target.value.trim() };
                        handleInputChange('tags', [...formData.tags, newTag]);
                        e.target.value = '';
                      }
                    }}
                  />
                  
                  <TagsContainer>
                    {formData.tags.map(tag => (
                      <Tag key={tag.id}>
                        {tag.name}
                        <FiX 
                          className="remove" 
                          size={14} 
                          onClick={() => handleInputChange('tags', formData.tags.filter(t => t.id !== tag.id))}
                        />
                      </Tag>
                    ))}
                  </TagsContainer>
                  
                  {showSources.hubspot && externalSources.hubspot.tags?.length > 0 && (
                    <ExternalSourceInfo color="#ff7a59">
                      <div className="source-label">HubSpot Tags</div>
                      <div className="source-value">
                        {externalSources.hubspot.tags.join(', ')}
                      </div>
                    </ExternalSourceInfo>
                  )}
                  
                  {showSources.airtable && externalSources.airtable.tags?.length > 0 && (
                    <ExternalSourceInfo color="#2d7ff9">
                      <div className="source-label">Airtable Tags</div>
                      <div className="source-value">
                        {externalSources.airtable.tags.join(', ')}
                      </div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
              </div>
            </FormGrid>
          </Card>
          
          <ButtonGroup>
            <ActionButton onClick={() => goToStep(2)} disabled={loading}>
              <FiArrowLeft /> Back
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={() => goToStep(4)} 
              disabled={loading}
            >
              Next <FiArrowRight />
            </ActionButton>
          </ButtonGroup>
        </>
      )}
      
      {/* Step 4: Professional Information */}
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
    </Container>
  );
};

export default ContactCrmWorkflow;