import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import ReactModal from 'react-modal';
import { supabase } from '../../lib/supabaseClient';
import { findContactDuplicates } from '../../utils/duplicateDetection';
import toast from 'react-hot-toast';
import {
  FaTimes, FaLinkedin, FaPhone, FaBuilding, FaMapMarkerAlt, FaTag,
  FaEnvelope, FaBriefcase, FaCheck, FaExclamationTriangle,
  FaCrown, FaUsers, FaSave, FaPlus, FaEdit, FaSearch, FaTrash,
  FaCodeBranch, FaMagic
} from 'react-icons/fa';
import { FiRefreshCw, FiX, FiCamera } from 'react-icons/fi';
import ManageContactEmailsModal from './ManageContactEmailsModal';
import ManageContactMobilesModal from './ManageContactMobilesModal';
import ProfileImageModal from './ProfileImageModal';
import ContactEnrichmentModal from './ContactEnrichmentModal';
import { useProfileImageModal } from '../../hooks/useProfileImageModal';

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const AvatarContainer = styled.div`
  position: relative;
  width: 48px;
  height: 48px;
  cursor: pointer;

  &:hover .camera-overlay {
    opacity: 1;
  }
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  overflow: hidden;
`;

const CameraOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;
`;

const HeaderText = styled.div``;

const ContactName = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ContactSubtitle = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 2px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ScoreCircle = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
`;

const ScoreText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
`;

const MissingFieldsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MissingFieldChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#FEF2F2' : '#7F1D1D'};
  border: 1px solid ${props => props.theme === 'light' ? '#FECACA' : '#DC2626'};
  border-radius: 20px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#DC2626' : '#FCA5A5'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#FEE2E2' : '#991B1B'};
  }
`;

const CompleteFieldChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#F0FDF4' : '#064E3B'};
  border: 1px solid ${props => props.theme === 'light' ? '#BBF7D0' : '#10B981'};
  border-radius: 20px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#16A34A' : '#6EE7B7'};
`;

const ApplyButton = styled.button`
  padding: 4px 10px;
  border-radius: 4px;
  border: none;
  background: #10B981;
  color: white;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #059669;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const DuplicateCard = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFBEB' : '#78350F'};
  border: 1px solid ${props => props.theme === 'light' ? '#FDE68A' : '#F59E0B'};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DuplicateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DuplicateName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#92400E' : '#FDE68A'};
`;

const DuplicateMatch = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#B45309' : '#FCD34D'};
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SaveButton = styled(Button)`
  background: #3B82F6;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: #2563EB;
  }
`;

const CompleteButton = styled(Button)`
  background: #10B981;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: #059669;
  }
`;

const CancelButton = styled(Button)`
  background: transparent;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const ItemList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const ItemChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 16px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;

  &:hover {
    color: #EF4444;
  }
`;

const AddButton = styled.button`
  padding: 4px 10px;
  border-radius: 16px;
  border: 1px dashed ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  background: transparent;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    border-color: #3B82F6;
    color: #3B82F6;
  }
`;

const SearchInput = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

// Sub-modal styled components
const SubModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const SubModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const SubModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 24px;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const SubModalBody = styled.div`
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
`;

const SubModalSection = styled.div`
  margin-bottom: 20px;
`;

const SubModalSectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin: 0 0 12px 0;
`;

const ItemsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
`;

const ItemTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 20px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
`;

const ItemRemoveBtn = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 14px;

  &:hover {
    color: #EF4444;
  }
`;

const SearchBox = styled.div`
  position: relative;
  margin-bottom: 8px;
`;

const SearchInputField = styled.input`
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
`;

const SuggestionsBox = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const SuggestionRow = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CreateNewRow = styled(SuggestionRow)`
  color: #3B82F6;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmptyMessage = styled.div`
  padding: 12px;
  text-align: center;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-size: 14px;
  font-style: italic;
`;

const SubModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
`;

const SubModalDoneBtn = styled.button`
  padding: 10px 20px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #2563EB;
  }
`;

const EditFieldButton = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    border-color: #3B82F6;
    color: #3B82F6;
    background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A5F'};
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
`;

const ToggleLabel = styled.span`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const ToggleSwitch = styled.button`
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: ${props => props.isOn ? '#3B82F6' : (props.theme === 'light' ? '#D1D5DB' : '#4B5563')};
  cursor: pointer;
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.isOn ? '22px' : '2px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s;
  }
`;

const MatchTypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  background: ${props => {
    switch(props.type) {
      case 'email': return '#DBEAFE';
      case 'mobile': return '#D1FAE5';
      case 'linkedin': return '#E0E7FF';
      case 'name': return '#FEF3C7';
      default: return '#F3F4F6';
    }
  }};
  color: ${props => {
    switch(props.type) {
      case 'email': return '#1D4ED8';
      case 'mobile': return '#047857';
      case 'linkedin': return '#4338CA';
      case 'name': return '#B45309';
      default: return '#374151';
    }
  }};
`;

const MergeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: #8B5CF6;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #7C3AED;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EnrichButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  background: ${props => props.theme === 'light' ? '#8B5CF6' : '#7C3AED'};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#7C3AED' : '#6D28D9'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SuggestionCard = styled.div`
  padding: 12px 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  margin-bottom: 12px;
`;

const SuggestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SuggestionLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const ConfidenceBadge = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  background: ${props => {
    if (props.level === 'high') return '#10B981';
    if (props.level === 'medium') return '#F59E0B';
    return '#EF4444';
  }};
  color: white;
`;

const SuggestionValue = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
`;

const SuggestionActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const AcceptButton = styled.button`
  padding: 4px 12px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #10B981;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: #059669;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AcceptedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11px;
  background: #10B981;
  color: white;
  border-radius: 12px;
  font-weight: 600;
`;

const AcceptAllButton = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  background: #10B981;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 16px;

  &:hover {
    background: #059669;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CATEGORY_OPTIONS = [
  'Professional Investor', 'Founder', 'Manager', 'Advisor', 'Friend and Family',
  'Team', 'Supplier', 'Media', 'Student', 'Institution', 'Other'
];

const KEEP_IN_TOUCH_OPTIONS = [
  { value: 'Not Set', label: 'Not Set' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Twice per Year', label: 'Twice per Year' },
  { value: 'Once per Year', label: 'Once per Year' },
  { value: 'Do not keep in touch', label: 'Do not keep in touch' }
];

const WISHES_OPTIONS = [
  { value: 'no wishes set', label: 'No wishes set' },
  { value: 'no wishes', label: 'No wishes' },
  { value: 'whatsapp standard', label: 'WhatsApp Standard' },
  { value: 'whatsapp custom', label: 'WhatsApp Custom' },
  { value: 'email standard', label: 'Email Standard' },
  { value: 'email custom', label: 'Email Custom' },
  { value: 'call', label: 'Call' },
  { value: 'present', label: 'Present' }
];

const DataIntegrityModal = ({
  isOpen,
  onClose,
  contactId,
  theme = 'light',
  onRefresh
}) => {
  // Contact data state
  const [contact, setContact] = useState(null);
  const [completenessData, setCompletenessData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [category, setCategory] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [description, setDescription] = useState('');
  const [keepInTouchFrequency, setKeepInTouchFrequency] = useState('Not Set');
  const [christmas, setChristmas] = useState('no wishes set');
  const [easter, setEaster] = useState('no wishes set');

  // Related data
  const [emails, setEmails] = useState([]);
  const [mobiles, setMobiles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [tags, setTags] = useState([]);
  const [contactScore, setContactScore] = useState(null);

  // New item inputs
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showMobileInput, setShowMobileInput] = useState(false);

  // City search
  const [citySearch, setCitySearch] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [showCityInput, setShowCityInput] = useState(false);

  // Tag search
  const [tagSearch, setTagSearch] = useState('');
  const [tagResults, setTagResults] = useState([]);
  const [showTagInput, setShowTagInput] = useState(false);

  // Company search
  const [companySearch, setCompanySearch] = useState('');
  const [companyResults, setCompanyResults] = useState([]);
  const [showCompanyInput, setShowCompanyInput] = useState(false);

  // Duplicates
  const [duplicates, setDuplicates] = useState([]);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Show all fields toggle
  const [showAllFields, setShowAllFields] = useState(false);

  // Enrichment state
  const [enriching, setEnriching] = useState(false);
  const [enrichmentSuggestions, setEnrichmentSuggestions] = useState(null);
  const [acceptedFields, setAcceptedFields] = useState({});

  // Track initially missing fields (so they don't disappear when user starts typing)
  const [initialMissingFieldKeys, setInitialMissingFieldKeys] = useState(new Set());

  // Sub-modal states
  const [emailsModalOpen, setEmailsModalOpen] = useState(false);
  const [mobilesModalOpen, setMobilesModalOpen] = useState(false);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [citiesModalOpen, setCitiesModalOpen] = useState(false);
  const [companiesModalOpen, setCompaniesModalOpen] = useState(false);
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);

  // Sub-modal search states
  const [subTagSearch, setSubTagSearch] = useState('');
  const [subTagSuggestions, setSubTagSuggestions] = useState([]);
  const [subCitySearch, setSubCitySearch] = useState('');
  const [subCitySuggestions, setSubCitySuggestions] = useState([]);
  const [subCompanySearch, setSubCompanySearch] = useState('');
  const [subCompanySuggestions, setSubCompanySuggestions] = useState([]);

  // Profile image modal hook - initialized with a placeholder callback
  // We'll call loadContactData manually after image update
  const profileImageModal = useProfileImageModal((contactIdUpdated, newImageUrl) => {
    // Update local contact state with new image
    if (contact && contactIdUpdated === contactId) {
      setContact(prev => ({ ...prev, profile_image_url: newImageUrl }));
      if (onRefresh) onRefresh();
    }
  });

  // Load contact data
  const loadContactData = useCallback(async () => {
    if (!contactId) return;

    setLoading(true);
    try {
      // Load completeness data
      const { data: completeness, error: completenessError } = await supabase
        .from('contact_completeness')
        .select('*')
        .eq('contact_id', contactId)
        .single();

      if (completenessError) throw completenessError;
      setCompletenessData(completeness);

      // Load full contact
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_id', contactId)
        .single();

      if (contactError) throw contactError;
      setContact(contactData);

      // Set editable fields
      setFirstName(contactData.first_name || '');
      setLastName(contactData.last_name || '');
      setCategory(contactData.category || '');
      setJobRole(contactData.job_role || '');
      setLinkedin(contactData.linkedin || '');
      setDescription(contactData.description || '');
      setKeepInTouchFrequency(contactData.keep_in_touch_frequency || 'Not Set');
      setContactScore(contactData.score || null);

      // Load related data in parallel
      const [emailsRes, mobilesRes, companiesRes, citiesRes, tagsRes, duplicatesRes, kitRes] = await Promise.all([
        supabase.from('contact_emails').select('*').eq('contact_id', contactId),
        supabase.from('contact_mobiles').select('*').eq('contact_id', contactId),
        supabase.from('contact_companies').select('*, companies(company_id, name)').eq('contact_id', contactId),
        supabase.from('contact_cities').select('*, cities(city_id, name)').eq('contact_id', contactId),
        supabase.from('contact_tags').select('*, tags(tag_id, name)').eq('contact_id', contactId),
        supabase.from('duplicates_inbox').select('*').eq('source_id', contactId).eq('status', 'pending'),
        supabase.from('keep_in_touch').select('*').eq('contact_id', contactId).maybeSingle()
      ]);

      // Set christmas/easter from keep_in_touch table
      if (kitRes.data) {
        setChristmas(kitRes.data.christmas || 'no wishes set');
        setEaster(kitRes.data.easter || 'no wishes set');
      } else {
        setChristmas('no wishes set');
        setEaster('no wishes set');
      }

      setEmails(emailsRes.data || []);
      setMobiles(mobilesRes.data || []);
      setCompanies(companiesRes.data || []);
      setCities(citiesRes.data || []);
      setTags(tagsRes.data || []);

      // Fetch duplicate contact names if any
      const duplicatesData = duplicatesRes.data || [];
      if (duplicatesData.length > 0) {
        const duplicateIds = duplicatesData.map(d => d.duplicate_id).filter(Boolean);
        if (duplicateIds.length > 0) {
          const { data: duplicateContacts } = await supabase
            .from('contacts')
            .select('contact_id, first_name, last_name')
            .in('contact_id', duplicateIds);

          // Merge contact info into duplicates
          const contactsMap = {};
          (duplicateContacts || []).forEach(c => { contactsMap[c.contact_id] = c; });
          const enrichedDuplicates = duplicatesData.map(d => ({
            ...d,
            duplicate: contactsMap[d.duplicate_id] || null
          }));
          setDuplicates(enrichedDuplicates);
        } else {
          setDuplicates(duplicatesData);
        }
      } else {
        setDuplicates([]);
      }

    } catch (error) {
      console.error('Error loading contact data:', error);
      toast.error('Failed to load contact data');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  // Enrich with Apollo
  const enrichWithApollo = async () => {
    if (emails.length === 0) {
      toast.error('No email to enrich from');
      return;
    }

    setEnriching(true);
    setEnrichmentSuggestions(null);
    setAcceptedFields({});

    try {
      const response = await fetch('https://crm-agent-api-production.up.railway.app/suggest-contact-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_email: emails[0]?.email,
          from_name: `${firstName} ${lastName}`.trim(),
          manual_first_name: firstName,
          manual_last_name: lastName
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.suggestions) {
          setEnrichmentSuggestions(result.suggestions);
          toast.success('Enrichment data found!');
        } else {
          toast.error('No enrichment data found');
        }
      } else {
        toast.error('Enrichment service unavailable');
      }
    } catch (error) {
      console.error('Enrichment error:', error);
      toast.error('Enrichment failed');
    }

    setEnriching(false);
  };

  // Accept individual enrichment field
  const acceptEnrichmentField = (field, value) => {
    setAcceptedFields(prev => ({ ...prev, [field]: true }));

    switch (field) {
      case 'first_name':
        setFirstName(value);
        break;
      case 'last_name':
        setLastName(value);
        break;
      case 'job_title':
        setJobRole(value);
        break;
      case 'linkedin_url':
        setLinkedin(value);
        break;
      case 'description':
        setDescription(value);
        break;
      default:
        break;
    }

    toast.success(`${field.replace('_', ' ')} accepted`);
  };

  // Accept all enrichment suggestions
  const acceptAllEnrichmentSuggestions = async () => {
    if (!enrichmentSuggestions) return;

    const s = enrichmentSuggestions;

    // Names
    if (s.first_name?.value && !firstName) {
      setFirstName(s.first_name.value);
      setAcceptedFields(prev => ({ ...prev, first_name: true }));
    }
    if (s.last_name?.value && !lastName) {
      setLastName(s.last_name.value);
      setAcceptedFields(prev => ({ ...prev, last_name: true }));
    }

    // Job title
    if (s.job_title?.value && !jobRole) {
      setJobRole(s.job_title.value);
      setAcceptedFields(prev => ({ ...prev, job_title: true }));
    }

    // LinkedIn URL
    if (s.linkedin_url?.value && !linkedin) {
      setLinkedin(s.linkedin_url.value);
      setAcceptedFields(prev => ({ ...prev, linkedin_url: true }));
    }

    // Description
    if (s.description?.value && !description) {
      setDescription(s.description.value);
      setAcceptedFields(prev => ({ ...prev, description: true }));
    }

    // City
    if (s.city?.value && cities.length === 0) {
      await handleAcceptCity(s.city.value);
      setAcceptedFields(prev => ({ ...prev, city: true }));
    }

    // Phones
    if (s.phones && s.phones.length > 0 && mobiles.length === 0) {
      await handleAcceptPhones(s.phones);
      setAcceptedFields(prev => ({ ...prev, phones: true }));
    }

    // Company
    if (s.apollo_company?.name && companies.length === 0) {
      await handleAcceptCompany(s.apollo_company);
      setAcceptedFields(prev => ({ ...prev, company: true }));
    }

    // Tags
    if (s.suggested_tags && s.suggested_tags.length > 0 && tags.length === 0) {
      await handleAcceptTags(s.suggested_tags);
      setAcceptedFields(prev => ({ ...prev, tags: true }));
    }

    toast.success('All suggestions accepted!');
  };

  // Helper to accept city from enrichment
  const handleAcceptCity = async (cityName) => {
    try {
      // Search for existing city
      const { data: existingCities } = await supabase
        .from('cities')
        .select('*')
        .ilike('name', cityName)
        .limit(1);

      let cityToAdd;
      if (existingCities && existingCities.length > 0) {
        cityToAdd = existingCities[0];
      } else {
        // Create new city
        const { data: newCity, error } = await supabase
          .from('cities')
          .insert({ name: cityName, country: 'Unknown' })
          .select()
          .single();

        if (error) throw error;
        cityToAdd = newCity;
      }

      // Link to contact
      await handleAddCity(cityToAdd);
    } catch (error) {
      console.error('Error accepting city:', error);
      toast.error('Failed to add city');
    }
  };

  // Helper to accept phones from enrichment
  const handleAcceptPhones = async (phones) => {
    try {
      for (const phone of phones) {
        await supabase
          .from('contact_mobiles')
          .insert({
            contact_id: contactId,
            number: phone.number,
            is_primary: mobiles.length === 0
          });
      }
      loadContactData();
      toast.success(`${phones.length} phone(s) added`);
    } catch (error) {
      console.error('Error accepting phones:', error);
      toast.error('Failed to add phones');
    }
  };

  // Helper to accept company from enrichment
  const handleAcceptCompany = async (companyData) => {
    try {
      if (companyData.exists_in_db && companyData.company_id) {
        // Link to existing company
        await supabase
          .from('contact_companies')
          .insert({
            contact_id: contactId,
            company_id: companyData.company_id,
            is_primary: companies.length === 0
          });
      } else {
        // Create new company
        const { data: newCompany, error } = await supabase
          .from('companies')
          .insert({
            name: companyData.name,
            category: 'Inbox',
            website: companyData.website
          })
          .select()
          .single();

        if (error) throw error;

        // Add domain if available
        if (companyData.domain) {
          await supabase
            .from('company_domains')
            .insert({
              company_id: newCompany.company_id,
              domain: companyData.domain.toLowerCase(),
              is_primary: true
            });
        }

        // Link to contact
        await supabase
          .from('contact_companies')
          .insert({
            contact_id: contactId,
            company_id: newCompany.company_id,
            is_primary: companies.length === 0
          });
      }

      loadContactData();
      toast.success('Company added');
    } catch (error) {
      console.error('Error accepting company:', error);
      toast.error('Failed to add company');
    }
  };

  // Helper to accept tags from enrichment
  const handleAcceptTags = async (tagNames) => {
    try {
      for (const tagName of tagNames) {
        // Search for existing tag
        const { data: existingTags } = await supabase
          .from('tags')
          .select('*')
          .ilike('name', tagName)
          .limit(1);

        let tagToAdd;
        if (existingTags && existingTags.length > 0) {
          tagToAdd = existingTags[0];
        } else {
          // Create new tag
          const { data: newTag, error } = await supabase
            .from('tags')
            .insert({ name: tagName })
            .select()
            .single();

          if (error) throw error;
          tagToAdd = newTag;
        }

        // Link to contact
        await supabase
          .from('contact_tags')
          .insert({ contact_id: contactId, tag_id: tagToAdd.tag_id });
      }

      loadContactData();
      toast.success(`${tagNames.length} tag(s) added`);
    } catch (error) {
      console.error('Error accepting tags:', error);
      toast.error('Failed to add tags');
    }
  };

  // Real-time duplicate detection using shared helper
  const findDuplicates = useCallback(async () => {
    if (!contactId || !contact) return;

    try {
      const foundDuplicates = await findContactDuplicates(
        contactId,
        emails,
        mobiles,
        linkedin,
        firstName,
        lastName
      );

      // Merge with existing duplicates from inbox (avoid duplicates)
      setDuplicates(prev => {
        const existingIds = new Set(prev.map(d => d.duplicate_id));
        const newDuplicates = foundDuplicates.filter(d => !existingIds.has(d.duplicate_id));
        return [...prev, ...newDuplicates];
      });

    } catch (error) {
      console.error('Error finding duplicates:', error);
    }
  }, [contactId, contact, emails, mobiles, linkedin, firstName, lastName]);

  useEffect(() => {
    if (isOpen && contactId) {
      loadContactData();
    }
    // Reset state when modal closes
    if (!isOpen) {
      setInitialMissingFieldKeys(new Set());
      setShowAllFields(false);
    }
  }, [isOpen, contactId, loadContactData]);

  // Capture initially missing fields after data loads (so fields don't disappear when typing)
  // Also set showAllFields to true when contact is 100% complete
  useEffect(() => {
    if (isOpen && completenessData && !loading && initialMissingFieldKeys.size === 0) {
      const missing = getMissingFields();
      setInitialMissingFieldKeys(new Set(missing.map(f => f.key)));
      // If no missing fields (100% complete), show all fields by default
      if (missing.length === 0) {
        setShowAllFields(true);
      }
    }
  }, [isOpen, completenessData, loading]);

  // Run duplicate detection after contact data is loaded
  useEffect(() => {
    if (isOpen && contact && !loading) {
      findDuplicates();
    }
  }, [isOpen, contact, loading, findDuplicates]);

  // Calculate missing fields - matches contact_completeness view logic
  const getMissingFields = () => {
    const missing = [];
    if (!completenessData) return missing;

    // Basic info (4 pts)
    if (!firstName?.trim()) missing.push({ key: 'firstName', label: 'First Name', icon: FaUsers });
    if (!lastName?.trim()) missing.push({ key: 'lastName', label: 'Last Name', icon: FaUsers });

    // Category (1 pt)
    if (!category || category === 'Inbox') missing.push({ key: 'category', label: 'Category', icon: FaTag });

    // Description (1 pt)
    if (!description?.trim()) missing.push({ key: 'description', label: 'Description', icon: FaUsers });

    // Contact info - track both separately
    if (Number(completenessData.email_count) === 0) {
      missing.push({ key: 'email', label: 'Email', icon: FaEnvelope });
    }
    if (Number(completenessData.mobile_count) === 0) {
      missing.push({ key: 'mobile', label: 'Mobile', icon: FaPhone });
    }

    // Company (1 pt)
    if (Number(completenessData.company_count) === 0) missing.push({ key: 'company', label: 'Company', icon: FaBuilding });

    // City (1 pt)
    if (Number(completenessData.city_count) === 0) missing.push({ key: 'city', label: 'City', icon: FaMapMarkerAlt });

    // Tags (1 pt)
    if (Number(completenessData.tag_count) === 0) missing.push({ key: 'tags', label: 'Tags', icon: FaTag });

    // Professional (2 pts)
    if (!jobRole?.trim()) missing.push({ key: 'jobRole', label: 'Job Title', icon: FaBriefcase });
    if (!linkedin?.trim()) missing.push({ key: 'linkedin', label: 'LinkedIn', icon: FaLinkedin });

    // Score (1 pt) - use local state for real-time updates
    if (!contactScore || contactScore === 0) missing.push({ key: 'score', label: 'Score (1-5)', icon: FaCrown });

    // Keep in touch (3 pts) - use local state for real-time updates
    // "Not Set" is the default enum value, treat as missing. "Do not keep in touch" is a valid choice.
    const kitEmpty = !keepInTouchFrequency || keepInTouchFrequency === 'Not Set';
    if (kitEmpty) {
      missing.push({ key: 'kit_frequency', label: 'Keep in Touch', icon: FaUsers });
    }
    // "no wishes set" is the default enum value, treat as missing - use local state
    const christmasEmpty = !christmas || christmas === 'no wishes set';
    const easterEmpty = !easter || easter === 'no wishes set';
    if (christmasEmpty) missing.push({ key: 'christmas', label: 'Christmas', icon: FaTag });
    if (easterEmpty) missing.push({ key: 'easter', label: 'Easter', icon: FaTag });

    return missing;
  };

  // Add email
  const handleAddEmail = async () => {
    if (!newEmail.trim()) return;

    try {
      const { data, error } = await supabase
        .from('contact_emails')
        .insert({
          contact_id: contactId,
          email: newEmail.toLowerCase().trim(),
          is_primary: emails.length === 0
        })
        .select()
        .single();

      if (error) throw error;

      setEmails([...emails, data]);
      setNewEmail('');
      setShowEmailInput(false);
      toast.success('Email added');
    } catch (error) {
      toast.error('Failed to add email');
    }
  };

  // Add mobile
  const handleAddMobile = async () => {
    if (!newMobile.trim()) return;

    try {
      const { data, error } = await supabase
        .from('contact_mobiles')
        .insert({
          contact_id: contactId,
          number: newMobile.trim(),
          is_primary: mobiles.length === 0
        })
        .select()
        .single();

      if (error) throw error;

      setMobiles([...mobiles, data]);
      setNewMobile('');
      setShowMobileInput(false);
      toast.success('Mobile added');
    } catch (error) {
      toast.error('Failed to add mobile');
    }
  };

  // Remove email
  const handleRemoveEmail = async (emailId) => {
    try {
      await supabase.from('contact_emails').delete().eq('id', emailId);
      setEmails(emails.filter(e => e.id !== emailId));
      toast.success('Email removed');
    } catch (error) {
      toast.error('Failed to remove email');
    }
  };

  // Remove mobile
  const handleRemoveMobile = async (mobileId) => {
    try {
      await supabase.from('contact_mobiles').delete().eq('id', mobileId);
      setMobiles(mobiles.filter(m => m.id !== mobileId));
      toast.success('Mobile removed');
    } catch (error) {
      toast.error('Failed to remove mobile');
    }
  };

  // Save changes
  const handleSave = async (markComplete = false) => {
    setSaving(true);
    try {
      const updates = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        category: category || null,
        job_role: jobRole.trim() || null,
        linkedin: linkedin.trim() || null,
        description: description.trim() || null,
        last_modified_at: new Date().toISOString()
      };

      if (markComplete) {
        updates.show_missing = false;
      }

      const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('contact_id', contactId);

      if (error) throw error;

      toast.success(markComplete ? 'Contact marked as complete!' : 'Changes saved!');

      if (onRefresh) onRefresh();
      onClose();

    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Keep in Touch frequency handler (updates contacts table)
  const handleUpdateKeepInTouch = async (value) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ keep_in_touch_frequency: value, last_modified_at: new Date().toISOString() })
        .eq('contact_id', contactId);
      if (error) throw error;
      setKeepInTouchFrequency(value);
      toast.success('Keep in Touch updated');
    } catch (error) {
      console.error('Error updating keep in touch:', error);
      toast.error('Failed to update');
    }
  };

  // Merge duplicate handler - inserts into contact_duplicates with start_trigger to kick off automation
  const handleMergeDuplicate = async (duplicateContactId) => {
    try {
      // Fetch duplicate contact data to compare
      const { data: duplicateContact, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_id', duplicateContactId)
        .single();

      if (fetchError) throw fetchError;

      // Smart merge selections - pick the better value for each field
      const currentContact = contact;
      const dup = duplicateContact;

      // Helper to pick better value: prefer non-empty, longer, or higher
      const pickBetter = (currentVal, dupVal, type = 'string') => {
        if (type === 'score') {
          // Prefer higher score
          const cScore = currentVal || 0;
          const dScore = dupVal || 0;
          return dScore > cScore ? 'duplicate' : 'current';
        }
        if (type === 'frequency') {
          // Prefer more frequent (Monthly > Quarterly > Twice per Year > Once per Year > Not Set)
          const freqOrder = ['Monthly', 'Quarterly', 'Twice per Year', 'Once per Year', 'Do not keep in touch', 'Not Set'];
          const cIdx = freqOrder.indexOf(currentVal || 'Not Set');
          const dIdx = freqOrder.indexOf(dupVal || 'Not Set');
          return dIdx < cIdx ? 'duplicate' : 'current';
        }
        if (type === 'category') {
          // Prefer more specific category (not Inbox)
          if ((!currentVal || currentVal === 'Inbox') && dupVal && dupVal !== 'Inbox') return 'duplicate';
          return 'current';
        }
        // For strings: prefer non-empty, then longer
        if (!currentVal && dupVal) return 'duplicate';
        if (currentVal && !dupVal) return 'current';
        if (currentVal && dupVal && dupVal.length > currentVal.length) return 'duplicate';
        return 'current';
      };

      const mergeSelections = {
        first_name: pickBetter(currentContact?.first_name, dup?.first_name),
        last_name: pickBetter(currentContact?.last_name, dup?.last_name),
        category: pickBetter(currentContact?.category, dup?.category, 'category'),
        description: pickBetter(currentContact?.description, dup?.description),
        job_role: pickBetter(currentContact?.job_role, dup?.job_role),
        linkedin: pickBetter(currentContact?.linkedin, dup?.linkedin),
        birthday: pickBetter(currentContact?.birthday, dup?.birthday),
        score: pickBetter(currentContact?.score, dup?.score, 'score'),
        keep_in_touch_frequency: pickBetter(currentContact?.keep_in_touch_frequency, dup?.keep_in_touch_frequency, 'frequency'),
        emails: 'combine',
        mobiles: 'combine',
        companies: 'combine',
        cities: 'combine',
        tags: 'combine'
      };

      const { error } = await supabase
        .from('contact_duplicates')
        .insert({
          primary_contact_id: contactId,
          duplicate_contact_id: duplicateContactId,
          status: 'pending',
          merge_selections: mergeSelections,
          start_trigger: true,
          notes: 'Merged from Data Integrity Modal',
          detected_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Merge triggered! The duplicate will be merged shortly.');

      // Remove from local duplicates list
      setDuplicates(prev => prev.filter(d => d.duplicate_id !== duplicateContactId));

      // Refresh data after a short delay
      setTimeout(() => {
        loadContactData();
        if (onRefresh) onRefresh();
      }, 2000);

    } catch (error) {
      console.error('Error triggering merge:', error);
      toast.error('Failed to trigger merge');
    }
  };

  // Christmas/Easter handler (updates keep_in_touch table, creates record if needed)
  const handleUpdateWishes = async (field, value) => {
    try {
      // Check if keep_in_touch record exists
      const { data: existing } = await supabase
        .from('keep_in_touch')
        .select('id')
        .eq('contact_id', contactId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('keep_in_touch')
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq('contact_id', contactId);
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('keep_in_touch')
          .insert({
            contact_id: contactId,
            [field]: value,
            frequency: 'Not Set'
          });
        if (error) throw error;
      }

      if (field === 'christmas') {
        setChristmas(value);
      } else {
        setEaster(value);
      }
      toast.success(`${field === 'christmas' ? 'Christmas' : 'Easter'} preference updated`);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error('Failed to update');
    }
  };

  // Tag management functions
  const searchTags = async (search) => {
    if (search.length < 2) {
      setSubTagSuggestions([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);
      if (error) throw error;
      const filtered = data.filter(tag => !tags.some(t => t.tag_id === tag.tag_id));
      setSubTagSuggestions(filtered);
    } catch (error) {
      console.error('Error searching tags:', error);
    }
  };

  const handleAddTag = async (tag) => {
    try {
      const { error } = await supabase
        .from('contact_tags')
        .insert({ contact_id: contactId, tag_id: tag.tag_id });
      if (error) throw error;
      setTags([...tags, { tag_id: tag.tag_id, tags: tag }]);
      setSubTagSearch('');
      setSubTagSuggestions([]);
      toast.success('Tag added');
      // Note: Not calling loadContactData() here to avoid refreshing form while user is editing
    } catch (error) {
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await supabase.from('contact_tags').delete().eq('contact_id', contactId).eq('tag_id', tagId);
      setTags(tags.filter(t => t.tag_id !== tagId));
      toast.success('Tag removed');
      // Note: Not calling loadContactData() here to avoid refreshing form while user is editing
    } catch (error) {
      toast.error('Failed to remove tag');
    }
  };

  const handleCreateTag = async (name) => {
    try {
      const { data, error } = await supabase.from('tags').insert({ name: name.trim() }).select().single();
      if (error) throw error;
      await handleAddTag(data);
    } catch (error) {
      toast.error('Failed to create tag');
    }
  };

  // City management functions
  const searchCities = async (search) => {
    if (search.length < 2) {
      setSubCitySuggestions([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);
      if (error) throw error;
      const filtered = data.filter(city => !cities.some(c => c.city_id === city.city_id));
      setSubCitySuggestions(filtered);
    } catch (error) {
      console.error('Error searching cities:', error);
    }
  };

  const handleAddCity = async (city) => {
    try {
      const { error } = await supabase
        .from('contact_cities')
        .insert({ contact_id: contactId, city_id: city.city_id });
      if (error) throw error;
      setCities([...cities, { city_id: city.city_id, cities: city }]);
      setSubCitySearch('');
      setSubCitySuggestions([]);
      toast.success('City added');
      // Note: Not calling loadContactData() here to avoid refreshing form while user is editing
    } catch (error) {
      toast.error('Failed to add city');
    }
  };

  const handleRemoveCity = async (cityId) => {
    try {
      await supabase.from('contact_cities').delete().eq('contact_id', contactId).eq('city_id', cityId);
      setCities(cities.filter(c => c.city_id !== cityId));
      toast.success('City removed');
      // Note: Not calling loadContactData() here to avoid refreshing form while user is editing
    } catch (error) {
      toast.error('Failed to remove city');
    }
  };

  const handleCreateCity = async (name) => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .insert({ name: name.trim(), country: 'Unknown' })
        .select()
        .single();
      if (error) throw error;
      await handleAddCity(data);
    } catch (error) {
      toast.error('Failed to create city');
    }
  };

  // Company management functions
  const searchCompanies = async (search) => {
    if (search.length < 2) {
      setSubCompanySuggestions([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);
      if (error) throw error;
      const filtered = data.filter(company => !companies.some(c => c.company_id === company.company_id));
      setSubCompanySuggestions(filtered);
    } catch (error) {
      console.error('Error searching companies:', error);
    }
  };

  const handleAddCompany = async (company) => {
    try {
      const { error } = await supabase
        .from('contact_companies')
        .insert({ contact_id: contactId, company_id: company.company_id, is_primary: companies.length === 0 });
      if (error) throw error;
      setCompanies([...companies, { company_id: company.company_id, companies: company }]);
      setSubCompanySearch('');
      setSubCompanySuggestions([]);
      toast.success('Company added');
      // Note: Not calling loadContactData() here to avoid refreshing form while user is editing
    } catch (error) {
      toast.error('Failed to add company');
    }
  };

  const handleRemoveCompany = async (companyId) => {
    try {
      await supabase.from('contact_companies').delete().eq('contact_id', contactId).eq('company_id', companyId);
      setCompanies(companies.filter(c => c.company_id !== companyId));
      toast.success('Company removed');
      // Note: Not calling loadContactData() here to avoid refreshing form while user is editing
    } catch (error) {
      toast.error('Failed to remove company');
    }
  };

  // Sub-modal close handlers (refresh data when closing)
  const handleCloseEmailsModal = () => {
    setEmailsModalOpen(false);
    loadContactData();
  };

  const handleCloseMobilesModal = () => {
    setMobilesModalOpen(false);
    loadContactData();
  };

  const handleCloseTagsModal = () => {
    setTagsModalOpen(false);
    setSubTagSearch('');
    setSubTagSuggestions([]);
  };

  const handleCloseCitiesModal = () => {
    setCitiesModalOpen(false);
    setSubCitySearch('');
    setSubCitySuggestions([]);
  };

  const handleCloseCompaniesModal = () => {
    setCompaniesModalOpen(false);
    setSubCompanySearch('');
    setSubCompanySuggestions([]);
  };

  // Sub-modal style
  const subModalStyle = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      padding: 0,
      border: 'none',
      borderRadius: '12px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'hidden',
      background: theme === 'light' ? '#FFFFFF' : '#1F2937',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1100
    }
  };

  if (!isOpen) return null;

  const missingFields = getMissingFields();
  const score = completenessData?.completeness_score || 0;
  const isMarkedComplete = contact?.show_missing === false;
  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = isMarkedComplete ? 0 : circumference - (score / 100) * circumference;
  const scoreColor = isMarkedComplete ? '#F59E0B' : (score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444');

  return (
    <>
    <Overlay onClick={onClose}>
      <ModalContainer theme={theme} onClick={e => e.stopPropagation()}>
        <Header theme={theme}>
          <HeaderInfo>
            <AvatarContainer
              onClick={() => contact && profileImageModal.openModal(contact)}
              title="Click to change profile image"
            >
              <Avatar theme={theme}>
                {contact?.profile_image_url ? (
                  <img src={contact.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  `${firstName?.[0] || ''}${lastName?.[0] || ''}`
                )}
              </Avatar>
              <CameraOverlay className="camera-overlay">
                <FiCamera size={18} />
              </CameraOverlay>
            </AvatarContainer>
            <HeaderText>
              <ContactName theme={theme}>
                {firstName} {lastName}
                {isMarkedComplete && <FaCrown style={{ marginLeft: 8, color: '#F59E0B' }} />}
              </ContactName>
              <ContactSubtitle theme={theme}>
                {category && category !== 'Inbox' ? category : 'No category'}
                {companies[0]?.companies?.name && ` @ ${companies[0].companies.name}`}
              </ContactSubtitle>
            </HeaderText>
          </HeaderInfo>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ScoreCircle>
              <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="30" cy="30" r="24" fill="none" stroke={theme === 'light' ? '#E5E7EB' : '#374151'} strokeWidth="6" />
                <circle cx="30" cy="30" r="24" fill="none" stroke={scoreColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
              </svg>
              <ScoreText theme={theme}>
                {isMarkedComplete ? <FaCrown color="#F59E0B" /> : `${Math.round(score)}%`}
              </ScoreText>
            </ScoreCircle>
            <CloseButton theme={theme} onClick={onClose}>
              <FaTimes size={20} />
            </CloseButton>
          </div>
        </Header>

        <Content>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              <FiRefreshCw className="spin" size={24} />
              <div style={{ marginTop: 12 }}>Loading contact data...</div>
            </div>
          ) : (
            <>
              {/* Missing Fields Section */}
              <Section>
                <SectionTitle theme={theme}>
                  {missingFields.length > 0 ? (
                    <>
                      <FaExclamationTriangle color="#F59E0B" />
                      Missing Fields ({missingFields.length})
                    </>
                  ) : (
                    <>
                      <FaCheck color="#10B981" />
                      All Fields Complete
                    </>
                  )}
                </SectionTitle>
                <MissingFieldsContainer>
                  {missingFields.map(field => (
                    <MissingFieldChip key={field.key} theme={theme}>
                      <field.icon size={12} />
                      {field.label}
                    </MissingFieldChip>
                  ))}
                  {missingFields.length === 0 && (
                    <CompleteFieldChip theme={theme}>
                      <FaCheck size={12} />
                      All required fields are filled
                    </CompleteFieldChip>
                  )}
                </MissingFieldsContainer>
              </Section>

              {/* Apollo Enrichment Section */}
              <Section>
                <EnrichButton
                  theme={theme}
                  onClick={() => setEnrichmentModalOpen(true)}
                  disabled={emails.length === 0}
                >
                  <FaMagic />
                  Enrich with Apollo
                </EnrichButton>

                {/* Enrichment Suggestions */}
                {enrichmentSuggestions && (
                  <div style={{ marginTop: 16 }}>
                    {/* Accept All Button */}
                    <AcceptAllButton onClick={acceptAllEnrichmentSuggestions}>
                      <FaCheck />
                      Accept All Suggestions
                    </AcceptAllButton>

                    {/* First Name */}
                    {enrichmentSuggestions.first_name?.value && (
                      <SuggestionCard theme={theme}>
                        <SuggestionHeader>
                          <SuggestionLabel theme={theme}>First Name</SuggestionLabel>
                          {enrichmentSuggestions.first_name.confidence && (
                            <ConfidenceBadge level={enrichmentSuggestions.first_name.confidence}>
                              {enrichmentSuggestions.first_name.confidence}
                            </ConfidenceBadge>
                          )}
                        </SuggestionHeader>
                        <SuggestionValue theme={theme}>{enrichmentSuggestions.first_name.value}</SuggestionValue>
                        <SuggestionActions>
                          {acceptedFields.first_name ? (
                            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                          ) : (
                            <AcceptButton onClick={() => acceptEnrichmentField('first_name', enrichmentSuggestions.first_name.value)}>
                              <FaCheck size={10} /> Accept
                            </AcceptButton>
                          )}
                        </SuggestionActions>
                      </SuggestionCard>
                    )}

                    {/* Last Name */}
                    {enrichmentSuggestions.last_name?.value && (
                      <SuggestionCard theme={theme}>
                        <SuggestionHeader>
                          <SuggestionLabel theme={theme}>Last Name</SuggestionLabel>
                          {enrichmentSuggestions.last_name.confidence && (
                            <ConfidenceBadge level={enrichmentSuggestions.last_name.confidence}>
                              {enrichmentSuggestions.last_name.confidence}
                            </ConfidenceBadge>
                          )}
                        </SuggestionHeader>
                        <SuggestionValue theme={theme}>{enrichmentSuggestions.last_name.value}</SuggestionValue>
                        <SuggestionActions>
                          {acceptedFields.last_name ? (
                            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                          ) : (
                            <AcceptButton onClick={() => acceptEnrichmentField('last_name', enrichmentSuggestions.last_name.value)}>
                              <FaCheck size={10} /> Accept
                            </AcceptButton>
                          )}
                        </SuggestionActions>
                      </SuggestionCard>
                    )}

                    {/* Job Title */}
                    {enrichmentSuggestions.job_title?.value && (
                      <SuggestionCard theme={theme}>
                        <SuggestionHeader>
                          <SuggestionLabel theme={theme}>Job Title</SuggestionLabel>
                          {enrichmentSuggestions.job_title.confidence && (
                            <ConfidenceBadge level={enrichmentSuggestions.job_title.confidence}>
                              {enrichmentSuggestions.job_title.confidence}
                            </ConfidenceBadge>
                          )}
                        </SuggestionHeader>
                        <SuggestionValue theme={theme}>{enrichmentSuggestions.job_title.value}</SuggestionValue>
                        <SuggestionActions>
                          {acceptedFields.job_title ? (
                            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                          ) : (
                            <AcceptButton onClick={() => acceptEnrichmentField('job_title', enrichmentSuggestions.job_title.value)}>
                              <FaCheck size={10} /> Accept
                            </AcceptButton>
                          )}
                        </SuggestionActions>
                      </SuggestionCard>
                    )}

                    {/* LinkedIn URL */}
                    {enrichmentSuggestions.linkedin_url?.value && (
                      <SuggestionCard theme={theme}>
                        <SuggestionHeader>
                          <SuggestionLabel theme={theme}>LinkedIn URL</SuggestionLabel>
                          {enrichmentSuggestions.linkedin_url.confidence && (
                            <ConfidenceBadge level={enrichmentSuggestions.linkedin_url.confidence}>
                              {enrichmentSuggestions.linkedin_url.confidence}
                            </ConfidenceBadge>
                          )}
                        </SuggestionHeader>
                        <SuggestionValue theme={theme}>
                          <a href={enrichmentSuggestions.linkedin_url.value} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>
                            {enrichmentSuggestions.linkedin_url.value}
                          </a>
                        </SuggestionValue>
                        <SuggestionActions>
                          {acceptedFields.linkedin_url ? (
                            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                          ) : (
                            <AcceptButton onClick={() => acceptEnrichmentField('linkedin_url', enrichmentSuggestions.linkedin_url.value)}>
                              <FaCheck size={10} /> Accept
                            </AcceptButton>
                          )}
                        </SuggestionActions>
                      </SuggestionCard>
                    )}

                    {/* Description */}
                    {enrichmentSuggestions.description?.value && (
                      <SuggestionCard theme={theme}>
                        <SuggestionHeader>
                          <SuggestionLabel theme={theme}>Description</SuggestionLabel>
                          {enrichmentSuggestions.description.confidence && (
                            <ConfidenceBadge level={enrichmentSuggestions.description.confidence}>
                              {enrichmentSuggestions.description.confidence}
                            </ConfidenceBadge>
                          )}
                        </SuggestionHeader>
                        <SuggestionValue theme={theme}>{enrichmentSuggestions.description.value}</SuggestionValue>
                        <SuggestionActions>
                          {acceptedFields.description ? (
                            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                          ) : (
                            <AcceptButton onClick={() => acceptEnrichmentField('description', enrichmentSuggestions.description.value)}>
                              <FaCheck size={10} /> Accept
                            </AcceptButton>
                          )}
                        </SuggestionActions>
                      </SuggestionCard>
                    )}

                    {/* City */}
                    {enrichmentSuggestions.city?.value && (
                      <SuggestionCard theme={theme}>
                        <SuggestionHeader>
                          <SuggestionLabel theme={theme}>City</SuggestionLabel>
                          {enrichmentSuggestions.city.confidence && (
                            <ConfidenceBadge level={enrichmentSuggestions.city.confidence}>
                              {enrichmentSuggestions.city.confidence}
                            </ConfidenceBadge>
                          )}
                        </SuggestionHeader>
                        <SuggestionValue theme={theme}>{enrichmentSuggestions.city.value}</SuggestionValue>
                        <SuggestionActions>
                          {acceptedFields.city ? (
                            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                          ) : (
                            <AcceptButton onClick={() => handleAcceptCity(enrichmentSuggestions.city.value)}>
                              <FaCheck size={10} /> Accept
                            </AcceptButton>
                          )}
                        </SuggestionActions>
                      </SuggestionCard>
                    )}

                    {/* Phones */}
                    {enrichmentSuggestions.phones && enrichmentSuggestions.phones.length > 0 && (
                      <SuggestionCard theme={theme}>
                        <SuggestionHeader>
                          <SuggestionLabel theme={theme}>Phone Numbers ({enrichmentSuggestions.phones.length})</SuggestionLabel>
                        </SuggestionHeader>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {enrichmentSuggestions.phones.map((phone, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <SuggestionValue theme={theme}>{phone.number}</SuggestionValue>
                              {phone.confidence && (
                                <ConfidenceBadge level={phone.confidence}>{phone.confidence}</ConfidenceBadge>
                              )}
                            </div>
                          ))}
                        </div>
                        <SuggestionActions>
                          {acceptedFields.phones ? (
                            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                          ) : (
                            <AcceptButton onClick={() => handleAcceptPhones(enrichmentSuggestions.phones)}>
                              <FaCheck size={10} /> Accept All Phones
                            </AcceptButton>
                          )}
                        </SuggestionActions>
                      </SuggestionCard>
                    )}

                    {/* Company */}
                    {enrichmentSuggestions.apollo_company?.name && (
                      <SuggestionCard theme={theme}>
                        <SuggestionHeader>
                          <SuggestionLabel theme={theme}>Company</SuggestionLabel>
                          {enrichmentSuggestions.apollo_company.confidence && (
                            <ConfidenceBadge level={enrichmentSuggestions.apollo_company.confidence}>
                              {enrichmentSuggestions.apollo_company.confidence}
                            </ConfidenceBadge>
                          )}
                        </SuggestionHeader>
                        <SuggestionValue theme={theme}>
                          {enrichmentSuggestions.apollo_company.name}
                          {enrichmentSuggestions.apollo_company.exists_in_db && (
                            <span style={{ fontSize: 11, color: '#10B981', marginLeft: 8 }}>(Exists in DB)</span>
                          )}
                        </SuggestionValue>
                        {enrichmentSuggestions.apollo_company.website && (
                          <div style={{ fontSize: 12, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginTop: 4 }}>
                            {enrichmentSuggestions.apollo_company.website}
                          </div>
                        )}
                        <SuggestionActions>
                          {acceptedFields.company ? (
                            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                          ) : (
                            <AcceptButton onClick={() => handleAcceptCompany(enrichmentSuggestions.apollo_company)}>
                              <FaCheck size={10} /> {enrichmentSuggestions.apollo_company.exists_in_db ? 'Link Company' : 'Create Company'}
                            </AcceptButton>
                          )}
                        </SuggestionActions>
                      </SuggestionCard>
                    )}

                    {/* Tags */}
                    {enrichmentSuggestions.suggested_tags && enrichmentSuggestions.suggested_tags.length > 0 && (
                      <SuggestionCard theme={theme}>
                        <SuggestionHeader>
                          <SuggestionLabel theme={theme}>Suggested Tags ({enrichmentSuggestions.suggested_tags.length})</SuggestionLabel>
                        </SuggestionHeader>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {enrichmentSuggestions.suggested_tags.map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '4px 10px',
                                background: theme === 'light' ? '#E5E7EB' : '#374151',
                                borderRadius: 16,
                                fontSize: 12,
                                color: theme === 'light' ? '#374151' : '#D1D5DB'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <SuggestionActions>
                          {acceptedFields.tags ? (
                            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                          ) : (
                            <AcceptButton onClick={() => handleAcceptTags(enrichmentSuggestions.suggested_tags)}>
                              <FaCheck size={10} /> Accept All Tags
                            </AcceptButton>
                          )}
                        </SuggestionActions>
                      </SuggestionCard>
                    )}

                    {/* Photo URL */}
                    {enrichmentSuggestions.photo_url?.value && (
                      <SuggestionCard theme={theme}>
                        <SuggestionHeader>
                          <SuggestionLabel theme={theme}>Profile Photo</SuggestionLabel>
                          {enrichmentSuggestions.photo_url.confidence && (
                            <ConfidenceBadge level={enrichmentSuggestions.photo_url.confidence}>
                              {enrichmentSuggestions.photo_url.confidence}
                            </ConfidenceBadge>
                          )}
                        </SuggestionHeader>
                        <div style={{ marginTop: 8 }}>
                          <img
                            src={enrichmentSuggestions.photo_url.value}
                            alt="Profile"
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: `2px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
                            }}
                          />
                        </div>
                        <SuggestionActions>
                          {acceptedFields.photo_url ? (
                            <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
                          ) : (
                            <AcceptButton onClick={async () => {
                              try {
                                await supabase
                                  .from('contacts')
                                  .update({ profile_image_url: enrichmentSuggestions.photo_url.value })
                                  .eq('contact_id', contactId);
                                setAcceptedFields(prev => ({ ...prev, photo_url: true }));
                                loadContactData();
                                toast.success('Profile photo updated');
                              } catch (error) {
                                toast.error('Failed to update photo');
                              }
                            }}>
                              <FaCheck size={10} /> Use This Photo
                            </AcceptButton>
                          )}
                        </SuggestionActions>
                      </SuggestionCard>
                    )}
                  </div>
                )}
              </Section>

              {/* Edit Fields - Always show this section */}
              <Section>
                <SectionTitle theme={theme}>
                  <FaEdit />
                  {showAllFields ? 'Edit All Fields' : (initialMissingFieldKeys.size > 0 ? 'Fill Missing Fields' : 'Edit Fields')}
                </SectionTitle>

                <ToggleContainer>
                  <ToggleSwitch
                    theme={theme}
                    isOn={showAllFields}
                    onClick={() => setShowAllFields(!showAllFields)}
                  />
                  <ToggleLabel theme={theme}>Show all fields</ToggleLabel>
                </ToggleContainer>

                  {/* First Name */}
                  {(showAllFields || initialMissingFieldKeys.has('firstName')) && (
                    <FormGroup>
                      <Label theme={theme}>First Name</Label>
                      <Input
                        theme={theme}
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="First name"
                      />
                    </FormGroup>
                  )}

                  {/* Last Name */}
                  {(showAllFields || initialMissingFieldKeys.has('lastName')) && (
                    <FormGroup>
                      <Label theme={theme}>Last Name</Label>
                      <Input
                        theme={theme}
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Last name"
                      />
                    </FormGroup>
                  )}

                  {/* Category */}
                  {(showAllFields || initialMissingFieldKeys.has('category')) && (
                    <FormGroup>
                      <Label theme={theme}>Category</Label>
                      <Select theme={theme} value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="">Select category...</option>
                        {CATEGORY_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </Select>
                    </FormGroup>
                  )}

                  {/* Description */}
                  {(showAllFields || initialMissingFieldKeys.has('description')) && (
                    <FormGroup>
                      <Label theme={theme}>Description</Label>
                      <TextArea
                        theme={theme}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Brief description of this contact..."
                      />
                    </FormGroup>
                  )}

                  {/* Job Title */}
                  {(showAllFields || initialMissingFieldKeys.has('jobRole')) && (
                    <FormGroup>
                      <Label theme={theme}>Job Title</Label>
                      <Input
                        theme={theme}
                        value={jobRole}
                        onChange={e => setJobRole(e.target.value)}
                        placeholder="Job title"
                      />
                    </FormGroup>
                  )}

                  {/* LinkedIn */}
                  {(showAllFields || initialMissingFieldKeys.has('linkedin')) && (
                    <FormGroup>
                      <Label theme={theme}>LinkedIn</Label>
                      <Input
                        theme={theme}
                        value={linkedin}
                        onChange={e => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </FormGroup>
                  )}

                  {/* Email */}
                  {(showAllFields || initialMissingFieldKeys.has('email')) && (
                    <FormGroup>
                      <Label theme={theme}>
                        Email {missingFields.some(f => f.key === 'email') && <span style={{ color: '#EF4444', fontWeight: 400 }}>(missing)</span>}
                        {emails.length > 0 && <span style={{ color: '#10B981', fontWeight: 400, marginLeft: 4 }}>({emails.length})</span>}
                      </Label>
                      <EditFieldButton theme={theme} onClick={() => setEmailsModalOpen(true)}>
                        <FaEnvelope size={12} /> Manage Emails
                      </EditFieldButton>
                    </FormGroup>
                  )}

                  {/* Mobile */}
                  {(showAllFields || initialMissingFieldKeys.has('mobile')) && (
                    <FormGroup>
                      <Label theme={theme}>
                        Mobile {missingFields.some(f => f.key === 'mobile') && <span style={{ color: '#EF4444', fontWeight: 400 }}>(missing)</span>}
                        {mobiles.length > 0 && <span style={{ color: '#10B981', fontWeight: 400, marginLeft: 4 }}>({mobiles.length})</span>}
                      </Label>
                      <EditFieldButton theme={theme} onClick={() => setMobilesModalOpen(true)}>
                        <FaPhone size={12} /> Manage Mobiles
                      </EditFieldButton>
                    </FormGroup>
                  )}

                  {/* Company */}
                  {(showAllFields || initialMissingFieldKeys.has('company')) && (
                    <FormGroup>
                      <Label theme={theme}>
                        Company {missingFields.some(f => f.key === 'company') && <span style={{ color: '#EF4444', fontWeight: 400 }}>(missing)</span>}
                        {companies.length > 0 && <span style={{ color: '#10B981', fontWeight: 400, marginLeft: 4 }}>({companies.length})</span>}
                      </Label>
                      <EditFieldButton theme={theme} onClick={() => setCompaniesModalOpen(true)}>
                        <FaBuilding size={12} /> Manage Companies
                      </EditFieldButton>
                    </FormGroup>
                  )}

                  {/* City */}
                  {(showAllFields || initialMissingFieldKeys.has('city')) && (
                    <FormGroup>
                      <Label theme={theme}>
                        City {missingFields.some(f => f.key === 'city') && <span style={{ color: '#EF4444', fontWeight: 400 }}>(missing)</span>}
                        {cities.length > 0 && <span style={{ color: '#10B981', fontWeight: 400, marginLeft: 4 }}>({cities.length})</span>}
                      </Label>
                      <EditFieldButton theme={theme} onClick={() => setCitiesModalOpen(true)}>
                        <FaMapMarkerAlt size={12} /> Manage Cities
                      </EditFieldButton>
                    </FormGroup>
                  )}

                  {/* Tags */}
                  {(showAllFields || initialMissingFieldKeys.has('tags')) && (
                    <FormGroup>
                      <Label theme={theme}>
                        Tags {missingFields.some(f => f.key === 'tags') && <span style={{ color: '#EF4444', fontWeight: 400 }}>(missing)</span>}
                        {tags.length > 0 && <span style={{ color: '#10B981', fontWeight: 400, marginLeft: 4 }}>({tags.length})</span>}
                      </Label>
                      <EditFieldButton theme={theme} onClick={() => setTagsModalOpen(true)}>
                        <FaTag size={12} /> Manage Tags
                      </EditFieldButton>
                    </FormGroup>
                  )}

                  {/* Score */}
                  {(showAllFields || initialMissingFieldKeys.has('score')) && (
                    <FormGroup>
                      <Label theme={theme}>
                        Score (1-5) {missingFields.some(f => f.key === 'score') && <span style={{ color: '#EF4444', fontWeight: 400 }}>(missing)</span>}
                        {contactScore > 0 && <span style={{ color: '#10B981', fontWeight: 400, marginLeft: 4 }}>Current: {contactScore}</span>}
                      </Label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            onClick={async () => {
                              // Toggle: if already selected, remove score; otherwise set it
                              const newScore = contactScore === s ? null : s;
                              await supabase.from('contacts').update({ score: newScore }).eq('contact_id', contactId);
                              setContactScore(newScore);
                              toast.success(newScore ? `Score set to ${newScore}` : 'Score removed');
                            }}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 6,
                              border: `1px solid ${contactScore === s ? '#3B82F6' : (theme === 'light' ? '#D1D5DB' : '#4B5563')}`,
                              background: contactScore === s ? '#3B82F6' : (theme === 'light' ? '#F9FAFB' : '#374151'),
                              color: contactScore === s ? 'white' : (theme === 'light' ? '#374151' : '#D1D5DB'),
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </FormGroup>
                  )}

                  {/* Keep in Touch */}
                  {(showAllFields || initialMissingFieldKeys.has('kit_frequency')) && (
                    <FormGroup>
                      <Label theme={theme}>
                        Keep in Touch Frequency {missingFields.some(f => f.key === 'kit_frequency') && <span style={{ color: '#EF4444', fontWeight: 400 }}>(missing)</span>}
                      </Label>
                      <Select
                        theme={theme}
                        value={keepInTouchFrequency}
                        onChange={(e) => handleUpdateKeepInTouch(e.target.value)}
                      >
                        {KEEP_IN_TOUCH_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Select>
                    </FormGroup>
                  )}

                  {/* Christmas */}
                  {(showAllFields || initialMissingFieldKeys.has('christmas')) && (
                    <FormGroup>
                      <Label theme={theme}>
                        Christmas Preference {missingFields.some(f => f.key === 'christmas') && <span style={{ color: '#EF4444', fontWeight: 400 }}>(missing)</span>}
                      </Label>
                      <Select
                        theme={theme}
                        value={christmas}
                        onChange={(e) => handleUpdateWishes('christmas', e.target.value)}
                      >
                        {WISHES_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Select>
                    </FormGroup>
                  )}

                  {/* Easter */}
                  {(showAllFields || initialMissingFieldKeys.has('easter')) && (
                    <FormGroup>
                      <Label theme={theme}>
                        Easter Preference {missingFields.some(f => f.key === 'easter') && <span style={{ color: '#EF4444', fontWeight: 400 }}>(missing)</span>}
                      </Label>
                      <Select
                        theme={theme}
                        value={easter}
                        onChange={(e) => handleUpdateWishes('easter', e.target.value)}
                      >
                        {WISHES_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Select>
                    </FormGroup>
                  )}
                </Section>

              {/* Duplicates Section */}
              {duplicates.length > 0 && (
                <Section>
                  <SectionTitle theme={theme}>
                    <FaExclamationTriangle color="#F59E0B" />
                    Potential Duplicates ({duplicates.length})
                  </SectionTitle>

                  {duplicates.map(dup => (
                    <DuplicateCard key={dup.id} theme={theme}>
                      <DuplicateInfo>
                        <FaUsers color={theme === 'light' ? '#92400E' : '#FDE68A'} />
                        <div>
                          <DuplicateName theme={theme}>
                            {dup.duplicate?.first_name} {dup.duplicate?.last_name}
                          </DuplicateName>
                          <DuplicateMatch theme={theme} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <MatchTypeBadge type={dup.match_type}>
                              {dup.match_type === 'email' && <FaEnvelope size={10} />}
                              {dup.match_type === 'mobile' && <FaPhone size={10} />}
                              {dup.match_type === 'linkedin' && <FaLinkedin size={10} />}
                              {dup.match_type === 'name' && <FaUsers size={10} />}
                              {dup.match_type}
                            </MatchTypeBadge>
                            {dup.match_details?.value && (
                              <span style={{ fontSize: 11 }}>{dup.match_details.value}</span>
                            )}
                            {dup.match_details?.similarity && (
                              <span style={{ fontSize: 11 }}>({Math.round(dup.match_details.similarity * 100)}% similar)</span>
                            )}
                          </DuplicateMatch>
                        </div>
                      </DuplicateInfo>
                      <MergeButton onClick={() => handleMergeDuplicate(dup.duplicate_id)}>
                        <FaCodeBranch size={12} />
                        Merge
                      </MergeButton>
                    </DuplicateCard>
                  ))}
                </Section>
              )}
            </>
          )}
        </Content>

        <Footer theme={theme}>
          <FooterLeft>
            {/* Mark Complete Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={isMarkedComplete}
                onChange={async (e) => {
                  const newValue = e.target.checked;
                  try {
                    await supabase
                      .from('contacts')
                      .update({ show_missing: !newValue, last_modified_at: new Date().toISOString() })
                      .eq('contact_id', contactId);
                    loadContactData();
                    toast.success(newValue ? 'Marked as complete' : 'Marked as incomplete');
                    if (onRefresh) onRefresh();
                  } catch (error) {
                    toast.error('Failed to update');
                  }
                }}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ color: theme === 'light' ? '#374151' : '#D1D5DB', fontWeight: 500 }}>
                <FaCrown style={{ marginRight: 6, color: isMarkedComplete ? '#F59E0B' : '#9CA3AF' }} />
                Mark Complete
              </span>
            </label>
          </FooterLeft>
          <FooterRight>
            <CancelButton theme={theme} onClick={onClose}>
              Cancel
            </CancelButton>
            <SaveButton onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <FiRefreshCw className="spin" /> : <FaSave />}
              Save
            </SaveButton>
          </FooterRight>
        </Footer>
      </ModalContainer>
    </Overlay>

      {/* Email Management Sub-Modal */}
      <ManageContactEmailsModal
        isOpen={emailsModalOpen}
        onClose={handleCloseEmailsModal}
        contact={contact}
        theme={theme}
        onEmailsUpdated={loadContactData}
      />

      {/* Mobile Management Sub-Modal */}
      <ManageContactMobilesModal
        isOpen={mobilesModalOpen}
        onClose={handleCloseMobilesModal}
        contact={contact}
        theme={theme}
        onMobilesUpdated={loadContactData}
      />

      {/* Tags Management Sub-Modal */}
      <ReactModal
        isOpen={tagsModalOpen}
        onRequestClose={handleCloseTagsModal}
        style={subModalStyle}
      >
        <SubModalHeader theme={theme}>
          <SubModalTitle theme={theme}>Manage Tags</SubModalTitle>
          <SubModalCloseButton theme={theme} onClick={handleCloseTagsModal}>×</SubModalCloseButton>
        </SubModalHeader>
        <SubModalBody theme={theme}>
          <SubModalSection>
            <SubModalSectionTitle theme={theme}>Current Tags</SubModalSectionTitle>
            <ItemsList>
              {tags.length > 0 ? tags.map((tagRel, idx) => (
                <ItemTag key={idx} theme={theme}>
                  <span>{tagRel.tags?.name || 'Unknown'}</span>
                  <ItemRemoveBtn theme={theme} onClick={() => handleRemoveTag(tagRel.tag_id)}>
                    <FaTimes size={12} />
                  </ItemRemoveBtn>
                </ItemTag>
              )) : (
                <EmptyMessage theme={theme}>No tags linked</EmptyMessage>
              )}
            </ItemsList>
          </SubModalSection>
          <SubModalSection>
            <SubModalSectionTitle theme={theme}>Add Tags</SubModalSectionTitle>
            <SearchBox>
              <SearchIconWrapper theme={theme}><FaSearch size={14} /></SearchIconWrapper>
              <SearchInputField
                theme={theme}
                value={subTagSearch}
                onChange={e => { setSubTagSearch(e.target.value); searchTags(e.target.value); }}
                placeholder="Search tags (min 2 chars)..."
              />
            </SearchBox>
            {subTagSearch.length >= 2 && (
              <SuggestionsBox theme={theme}>
                {subTagSuggestions.map(tag => (
                  <SuggestionRow key={tag.tag_id} theme={theme} onClick={() => handleAddTag(tag)}>
                    {tag.name}
                  </SuggestionRow>
                ))}
                {subTagSuggestions.length === 0 && (
                  <EmptyMessage theme={theme}>No tags found</EmptyMessage>
                )}
                <CreateNewRow theme={theme} onClick={() => handleCreateTag(subTagSearch)}>
                  <FaPlus size={12} /> Create "{subTagSearch}"
                </CreateNewRow>
              </SuggestionsBox>
            )}
          </SubModalSection>
        </SubModalBody>
        <SubModalFooter theme={theme}>
          <SubModalDoneBtn onClick={handleCloseTagsModal}>Done</SubModalDoneBtn>
        </SubModalFooter>
      </ReactModal>

      {/* Cities Management Sub-Modal */}
      <ReactModal
        isOpen={citiesModalOpen}
        onRequestClose={handleCloseCitiesModal}
        style={subModalStyle}
      >
        <SubModalHeader theme={theme}>
          <SubModalTitle theme={theme}>Manage Cities</SubModalTitle>
          <SubModalCloseButton theme={theme} onClick={handleCloseCitiesModal}>×</SubModalCloseButton>
        </SubModalHeader>
        <SubModalBody theme={theme}>
          <SubModalSection>
            <SubModalSectionTitle theme={theme}>Current Cities</SubModalSectionTitle>
            <ItemsList>
              {cities.length > 0 ? cities.map((cityRel, idx) => (
                <ItemTag key={idx} theme={theme}>
                  <span>{cityRel.cities?.name || 'Unknown'}</span>
                  <ItemRemoveBtn theme={theme} onClick={() => handleRemoveCity(cityRel.city_id)}>
                    <FaTimes size={12} />
                  </ItemRemoveBtn>
                </ItemTag>
              )) : (
                <EmptyMessage theme={theme}>No cities linked</EmptyMessage>
              )}
            </ItemsList>
          </SubModalSection>
          <SubModalSection>
            <SubModalSectionTitle theme={theme}>Add Cities</SubModalSectionTitle>
            <SearchBox>
              <SearchIconWrapper theme={theme}><FaSearch size={14} /></SearchIconWrapper>
              <SearchInputField
                theme={theme}
                value={subCitySearch}
                onChange={e => { setSubCitySearch(e.target.value); searchCities(e.target.value); }}
                placeholder="Search cities (min 2 chars)..."
              />
            </SearchBox>
            {subCitySearch.length >= 2 && (
              <SuggestionsBox theme={theme}>
                {subCitySuggestions.map(city => (
                  <SuggestionRow key={city.city_id} theme={theme} onClick={() => handleAddCity(city)}>
                    {city.name}{city.country && city.country !== 'Unknown' && ` • ${city.country}`}
                  </SuggestionRow>
                ))}
                {subCitySuggestions.length === 0 && (
                  <EmptyMessage theme={theme}>No cities found</EmptyMessage>
                )}
                <CreateNewRow theme={theme} onClick={() => handleCreateCity(subCitySearch)}>
                  <FaPlus size={12} /> Create "{subCitySearch}"
                </CreateNewRow>
              </SuggestionsBox>
            )}
          </SubModalSection>
        </SubModalBody>
        <SubModalFooter theme={theme}>
          <SubModalDoneBtn onClick={handleCloseCitiesModal}>Done</SubModalDoneBtn>
        </SubModalFooter>
      </ReactModal>

      {/* Companies Management Sub-Modal */}
      <ReactModal
        isOpen={companiesModalOpen}
        onRequestClose={handleCloseCompaniesModal}
        style={subModalStyle}
      >
        <SubModalHeader theme={theme}>
          <SubModalTitle theme={theme}>Manage Companies</SubModalTitle>
          <SubModalCloseButton theme={theme} onClick={handleCloseCompaniesModal}>×</SubModalCloseButton>
        </SubModalHeader>
        <SubModalBody theme={theme}>
          <SubModalSection>
            <SubModalSectionTitle theme={theme}>Current Companies</SubModalSectionTitle>
            <ItemsList>
              {companies.length > 0 ? companies.map((compRel, idx) => (
                <ItemTag key={idx} theme={theme}>
                  <span>{compRel.companies?.name || 'Unknown'}</span>
                  <ItemRemoveBtn theme={theme} onClick={() => handleRemoveCompany(compRel.company_id)}>
                    <FaTimes size={12} />
                  </ItemRemoveBtn>
                </ItemTag>
              )) : (
                <EmptyMessage theme={theme}>No companies linked</EmptyMessage>
              )}
            </ItemsList>
          </SubModalSection>
          <SubModalSection>
            <SubModalSectionTitle theme={theme}>Add Companies</SubModalSectionTitle>
            <SearchBox>
              <SearchIconWrapper theme={theme}><FaSearch size={14} /></SearchIconWrapper>
              <SearchInputField
                theme={theme}
                value={subCompanySearch}
                onChange={e => { setSubCompanySearch(e.target.value); searchCompanies(e.target.value); }}
                placeholder="Search companies (min 2 chars)..."
              />
            </SearchBox>
            {subCompanySearch.length >= 2 && (
              <SuggestionsBox theme={theme}>
                {subCompanySuggestions.map(company => (
                  <SuggestionRow key={company.company_id} theme={theme} onClick={() => handleAddCompany(company)}>
                    {company.name}{company.category && ` • ${company.category}`}
                  </SuggestionRow>
                ))}
                {subCompanySuggestions.length === 0 && (
                  <EmptyMessage theme={theme}>No companies found</EmptyMessage>
                )}
              </SuggestionsBox>
            )}
          </SubModalSection>
        </SubModalBody>
        <SubModalFooter theme={theme}>
          <SubModalDoneBtn onClick={handleCloseCompaniesModal}>Done</SubModalDoneBtn>
        </SubModalFooter>
      </ReactModal>

      {/* Profile Image Modal */}
      <ProfileImageModal
        isOpen={profileImageModal.isOpen}
        onClose={profileImageModal.closeModal}
        contact={profileImageModal.contact}
        uploading={profileImageModal.uploading}
        fetchingFromLinkedIn={profileImageModal.fetchingFromLinkedIn}
        fetchingFromWhatsApp={profileImageModal.fetchingFromWhatsApp}
        imagePreview={profileImageModal.imagePreview}
        selectedFile={profileImageModal.selectedFile}
        onFileSelect={profileImageModal.handleFileSelect}
        onSave={profileImageModal.saveProfileImage}
        onFetchFromLinkedIn={profileImageModal.fetchFromLinkedIn}
        onFetchFromWhatsApp={profileImageModal.fetchFromWhatsApp}
        onRemoveImage={() => {
          // Reset to original contact image
          if (profileImageModal.contact) {
            profileImageModal.closeModal();
            profileImageModal.openModal(profileImageModal.contact);
          }
        }}
        theme={theme}
      />

      {/* Contact Enrichment Modal */}
      <ContactEnrichmentModal
        isOpen={enrichmentModalOpen}
        onClose={() => setEnrichmentModalOpen(false)}
        contact={contact}
        contactEmails={emails}
        onEnrichComplete={() => {
          setEnrichmentModalOpen(false);
          loadContactData();
        }}
        theme={theme}
      />
    </>
  );
};

export default DataIntegrityModal;
