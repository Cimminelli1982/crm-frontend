import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { FaHandshake, FaEdit, FaTrash, FaEnvelope, FaWhatsapp, FaList, FaPlus, FaUsers, FaLink, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import SendEmailTab from './SendEmailTab';
import WhatsAppChatTab from './WhatsAppChatTab';

/**
 * IntroductionsPanelTab - Pannello introduzioni per il shared right panel
 *
 * Features:
 * - Lista intro per il contatto selezionato
 * - Add new introduction
 * - Compose intro email (quando intro selezionata)
 * - Compose intro WhatsApp (quando intro selezionata)
 */

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const SubNav = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  padding: 0 8px;
  gap: 4px;
  flex-shrink: 0;
`;

const SubNavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: ${props => props.$active
    ? (props.theme === 'dark' ? '#fff' : '#111827')
    : (props.theme === 'dark' ? '#9CA3AF' : '#6B7280')};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? '#F59E0B' : 'transparent'};
  margin-bottom: -1px;
  transition: all 0.2s;

  &:hover {
    color: ${props => props.theme === 'dark' ? '#fff' : '#111827'};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`;

const AddButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px dashed ${props => props.theme === 'dark' ? '#4B5563' : '#D1D5DB'};
  background: transparent;
  color: ${props => props.theme === 'dark' ? '#F59E0B' : '#D97706'};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.1)'};
    border-color: #F59E0B;
  }
`;

const LinkButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  background: transparent;
  color: ${props => props.theme === 'dark' ? '#25D366' : '#128C7E'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'dark' ? 'rgba(37, 211, 102, 0.1)' : 'rgba(18, 140, 126, 0.1)'};
    border-color: #25D366;
  }
`;

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
  background: ${props => props.theme === 'dark' ? '#1F2937' : '#FFFFFF'};
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme === 'dark' ? '#9CA3AF' : '#6B7280'};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
  }
`;

const ModalBody = styled.div`
  padding: 16px;
  overflow-y: auto;
  flex: 1;
`;

const ModalFooter = styled.div`
  padding: 16px;
  border-top: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#9CA3AF' : '#6B7280'};
  margin-bottom: 6px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#D1D5DB'};
  background: ${props => props.theme === 'dark' ? '#111827' : '#F9FAFB'};
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
  font-size: 13px;

  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#6B7280' : '#9CA3AF'};
  }

  &:focus {
    outline: none;
    border-color: #25D366;
  }
`;

const ResultsList = styled.div`
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  border-radius: 8px;
  margin-top: 8px;
`;

const ResultItem = styled.div`
  padding: 10px 12px;
  cursor: pointer;
  background: ${props => props.$selected
    ? (props.theme === 'dark' ? '#374151' : '#E5E7EB')
    : 'transparent'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme === 'dark' ? '#374151' : '#F3F4F6'};
  }
`;

const ResultTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
`;

const ResultSubtitle = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'dark' ? '#9CA3AF' : '#6B7280'};
  margin-top: 2px;
`;

const SaveButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: #25D366;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #128C7E;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#D1D5DB'};
  background: transparent;
  color: ${props => props.theme === 'dark' ? '#D1D5DB' : '#374151'};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'dark' ? '#374151' : '#F3F4F6'};
  }
`;

const IntroCard = styled.div`
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px solid ${props => props.$selected
    ? '#F59E0B'
    : (props.theme === 'dark' ? '#374151' : '#E5E7EB')};
  background: ${props => props.$selected
    ? (props.theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.05)')
    : (props.theme === 'dark' ? '#1F2937' : '#fff')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.$selected ? '#F59E0B' : (props.theme === 'dark' ? '#4B5563' : '#D1D5DB')};
    background: ${props => props.$selected
      ? (props.theme === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.08)')
      : (props.theme === 'dark' ? '#374151' : '#F9FAFB')};
  }
`;

const IntroHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const IntroTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
`;

const IntroNames = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const IntroActions = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  padding: 4px 6px;
  font-size: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
  background: ${props => props.$danger
    ? (props.theme === 'dark' ? '#7F1D1D' : '#FEE2E2')
    : (props.theme === 'dark' ? '#374151' : '#E5E7EB')};
  color: ${props => props.$danger
    ? (props.theme === 'dark' ? '#FCA5A5' : '#DC2626')
    : (props.theme === 'dark' ? '#D1D5DB' : '#374151')};
  transition: all 0.15s;

  &:hover {
    opacity: 0.8;
  }
`;

const IntroMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  margin-left: 18px;
  font-size: 11px;
  color: ${props => props.theme === 'dark' ? '#9CA3AF' : '#6B7280'};
`;

const StatusBadge = styled.span`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  background: ${props => {
    switch(props.$status) {
      case 'Requested':
      case 'Promised':
        return '#FEE2E2';
      case 'Done & Dust':
        return '#D1FAE5';
      case 'Done, but need to monitor':
        return '#FEF3C7';
      case 'Aborted':
        return '#7F1D1D';
      default:
        return '#F3F4F6';
    }
  }};
  color: ${props => {
    switch(props.$status) {
      case 'Requested':
      case 'Promised':
        return '#DC2626';
      case 'Done & Dust':
        return '#065F46';
      case 'Done, but need to monitor':
        return '#92400E';
      case 'Aborted':
        return '#FCA5A5';
      default:
        return '#6B7280';
    }
  }};
`;

const IntroNotes = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'dark' ? '#6B7280' : '#9CA3AF'};
  margin-top: 4px;
  margin-left: 18px;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: ${props => props.theme === 'dark' ? '#6B7280' : '#9CA3AF'};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  margin-top: ${props => props.$first ? '0' : '16px'};
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${props => props.$color || (props.theme === 'dark' ? '#9CA3AF' : '#6B7280')};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
`;

const SectionCount = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  background: ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  color: ${props => props.theme === 'dark' ? '#D1D5DB' : '#374151'};
`;

const SelectedIntroInfo = styled.div`
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: ${props => props.theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.05)'};
  border: 1px solid rgba(245, 158, 11, 0.3);
`;

const BackToListButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  margin-bottom: 12px;
  border-radius: 6px;
  border: none;
  background: ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  color: ${props => props.theme === 'dark' ? '#D1D5DB' : '#374151'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${props => props.theme === 'dark' ? '#4B5563' : '#D1D5DB'};
  }
`;

const SelectedIntroTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const SelectedIntroNames = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #F59E0B;
`;

const EmailChipsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const EmailChipGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const EmailChipLabel = styled.span`
  font-size: 10px;
  color: ${props => props.theme === 'dark' ? '#6B7280' : '#9CA3AF'};
  font-weight: 500;
`;

const EmailChipsRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const EmailChip = styled.button`
  padding: 6px 12px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.$selected ? '#3B82F6' : (props.theme === 'dark' ? '#374151' : '#E5E7EB')};
  color: ${props => props.$selected ? '#FFFFFF' : (props.theme === 'dark' ? '#D1D5DB' : '#374151')};
  transition: all 0.15s;

  &:hover {
    opacity: 0.8;
  }
`;

const MobileChipsRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const MobileChip = styled.button`
  padding: 6px 12px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.$selected ? '#25D366' : (props.theme === 'dark' ? '#374151' : '#E5E7EB')};
  color: ${props => props.$selected ? '#FFFFFF' : (props.theme === 'dark' ? '#D1D5DB' : '#374151')};
  transition: all 0.15s;

  &:hover {
    opacity: 0.8;
  }
`;

const ContactChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 2px solid #F59E0B;
  background: ${props => props.theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.05)'};
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
`;

const ContactChipRemove = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: ${props => props.theme === 'dark' ? '#9CA3AF' : '#6B7280'};
  cursor: pointer;
  font-size: 10px;

  &:hover {
    color: #EF4444;
  }
`;

const QuickPickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: ${props => props.theme === 'dark' ? '#111827' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
`;

const QuickPickerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QuickPickerLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#9CA3AF' : '#6B7280'};
  min-width: 70px;
  flex-shrink: 0;
`;

const CategorySelect = styled.select`
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#D1D5DB'};
  background: ${props => props.theme === 'dark' ? '#1F2937' : '#FFFFFF'};
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
  font-size: 12px;
  flex: 1;

  &:focus {
    outline: none;
    border-color: #F59E0B;
  }
`;

const IntroductionsPanelTab = ({
  theme,
  contactId,
  contactName,
  contactIntroductions, // Introductions from useContactDetails
  setIntroductionModalOpen,
  onEditIntroduction,
  onDeleteIntroduction,
  onIntroductionSelect, // Callback when intro is selected (for parent state)
  onRefresh, // Callback to refresh parent data after status changes
  currentChat, // Current WhatsApp chat being viewed (for linking)
}) => {
  const [activeSubTab, setActiveSubTab] = useState('list'); // 'list', 'email', 'whatsapp'
  const [selectedIntro, setSelectedIntro] = useState(null);
  const [fullIntroData, setFullIntroData] = useState(null); // Full intro with all contacts
  const [introEmails, setIntroEmails] = useState([]);
  const [introMobiles, setIntroMobiles] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [selectedMobile, setSelectedMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [otherContactNames, setOtherContactNames] = useState({}); // { intro_id: "Other Person Name" }

  // Quick intro mode state (compose without selecting an existing intro)
  const [quickMode, setQuickMode] = useState(false);
  const [quickContact1, setQuickContact1] = useState(null);
  const [quickContact2, setQuickContact2] = useState(null);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState([]);
  const [quickCategory, setQuickCategory] = useState('Karma Points');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Link Chat to Introduction modal state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [introSearchQuery, setIntroSearchQuery] = useState('');
  const [allIntroductions, setAllIntroductions] = useState([]);
  const [selectedLinkIntro, setSelectedLinkIntro] = useState(null);
  const [linkSaving, setLinkSaving] = useState(false);

  // Search for introductions by contact name (after 3 chars)
  useEffect(() => {
    const searchIntros = async () => {
      console.log('Search query:', introSearchQuery, 'Length:', introSearchQuery.trim().length);

      if (!introSearchQuery.trim() || introSearchQuery.trim().length < 3) {
        setAllIntroductions([]);
        return;
      }

      console.log('Searching for:', introSearchQuery);

      // Step 1: Find contacts matching the search
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name')
        .or(`first_name.ilike.%${introSearchQuery}%,last_name.ilike.%${introSearchQuery}%`)
        .limit(50);

      console.log('Step 1 - Contacts found:', contacts?.length, 'Error:', contactsError);

      if (!contacts?.length) {
        setAllIntroductions([]);
        return;
      }

      // Step 2: Get introduction_contacts for these contacts
      const contactIds = contacts.map(c => c.contact_id);
      const { data: introContacts } = await supabase
        .from('introduction_contacts')
        .select('introduction_id, contact_id')
        .in('contact_id', contactIds);

      if (!introContacts?.length) {
        setAllIntroductions([]);
        return;
      }

      // Step 3: Get unique introduction IDs and fetch full intro data
      const introIds = [...new Set(introContacts.map(ic => ic.introduction_id))];
      const { data: intros } = await supabase
        .from('introductions')
        .select('introduction_id, introduction_date, status, chat_id, whatsapp_group_name')
        .in('introduction_id', introIds);

      if (!intros?.length) {
        setAllIntroductions([]);
        return;
      }

      // Step 4: Get ALL contacts for these introductions (for display names)
      const { data: allIntroContacts } = await supabase
        .from('introduction_contacts')
        .select('introduction_id, contacts(first_name, last_name)')
        .in('introduction_id', introIds);

      // Build names map
      const namesMap = {};
      (allIntroContacts || []).forEach(ic => {
        if (!namesMap[ic.introduction_id]) namesMap[ic.introduction_id] = [];
        const name = `${ic.contacts?.first_name || ''} ${ic.contacts?.last_name || ''}`.trim();
        if (name && !namesMap[ic.introduction_id].includes(name)) {
          namesMap[ic.introduction_id].push(name);
        }
      });

      // Add names to intros
      const introsWithNames = intros.map(intro => ({
        ...intro,
        names: namesMap[intro.introduction_id] || ['Unknown']
      }));

      setAllIntroductions(introsWithNames);
    };

    const debounce = setTimeout(searchIntros, 300);
    return () => clearTimeout(debounce);
  }, [introSearchQuery]);

  // Handle linking current chat to introduction
  const handleLinkChatToIntro = async () => {
    if (!currentChat || !selectedLinkIntro) return;

    setLinkSaving(true);
    try {
      const { error } = await supabase
        .from('introductions')
        .update({
          chat_id: currentChat.id,
          whatsapp_group_jid: currentChat.baileys_jid || currentChat.chat_jid,
          whatsapp_group_name: currentChat.chat_name
        })
        .eq('introduction_id', selectedLinkIntro.introduction_id);

      if (error) throw error;

      toast.success(`"${currentChat.chat_name}" linked to introduction!`);
      setLinkModalOpen(false);
      setSelectedLinkIntro(null);
      setIntroSearchQuery('');
      onRefresh?.();
    } catch (err) {
      console.error('Error linking chat:', err);
      toast.error('Failed to link chat');
    } finally {
      setLinkSaving(false);
    }
  };

  // Quick mode: debounced contact search
  useEffect(() => {
    if (!quickMode || !quickSearchQuery.trim() || quickSearchQuery.trim().length < 2) {
      setQuickSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const parts = quickSearchQuery.trim().split(/\s+/).filter(p => p.length > 0);
      let query = supabase.from('contacts').select('contact_id, first_name, last_name');

      if (parts.length >= 2) {
        const [first, ...rest] = parts;
        const last = rest.join(' ');
        query = query.or(
          `and(first_name.ilike.%${first}%,last_name.ilike.%${last}%),and(first_name.ilike.%${last}%,last_name.ilike.%${first}%)`
        );
      } else {
        query = query.or(`first_name.ilike.%${quickSearchQuery}%,last_name.ilike.%${quickSearchQuery}%`);
      }

      const { data } = await query.limit(8);
      // Exclude already-picked contacts
      const excluded = [quickContact1?.contact_id, quickContact2?.contact_id].filter(Boolean);
      setQuickSearchResults((data || []).filter(c => !excluded.includes(c.contact_id)));
    }, 300);

    return () => clearTimeout(timer);
  }, [quickSearchQuery, quickMode, quickContact1?.contact_id, quickContact2?.contact_id]);

  // Quick mode: populate compose state when both contacts are picked
  useEffect(() => {
    const populateQuickCompose = async () => {
      if (!quickMode || !quickContact1 || !quickContact2) {
        // If in quick mode but missing a contact, clear compose state
        if (quickMode) {
          setFullIntroData(null);
          setIntroEmails([]);
          setIntroMobiles([]);
          setSelectedEmails([]);
          setSelectedMobile('');
        }
        return;
      }

      setLoading(true);
      try {
        const contacts = [
          {
            contact_id: quickContact1.contact_id,
            first_name: quickContact1.first_name || '',
            last_name: quickContact1.last_name || '',
            name: `${quickContact1.first_name || ''} ${quickContact1.last_name || ''}`.trim(),
            role: 'introducee',
          },
          {
            contact_id: quickContact2.contact_id,
            first_name: quickContact2.first_name || '',
            last_name: quickContact2.last_name || '',
            name: `${quickContact2.first_name || ''} ${quickContact2.last_name || ''}`.trim(),
            role: 'introducee',
          }
        ];

        setFullIntroData({ contacts });

        const contactIds = contacts.map(c => c.contact_id);
        const [emailsResult, mobilesResult] = await Promise.all([
          supabase.from('contact_emails').select('email, contact_id').in('contact_id', contactIds),
          supabase.from('contact_mobiles').select('mobile, type, is_primary, contact_id').in('contact_id', contactIds).order('is_primary', { ascending: false })
        ]);

        const allEmails = (emailsResult.data || []).map(e => {
          const contact = contacts.find(c => c.contact_id === e.contact_id);
          return { email: e.email, contactName: contact?.name || 'Unknown', contactId: e.contact_id };
        });

        const allMobiles = (mobilesResult.data || []).map(m => {
          const contact = contacts.find(c => c.contact_id === m.contact_id);
          return { mobile: m.mobile, contactName: contact?.name || 'Unknown', contactId: m.contact_id, type: m.type, isPrimary: m.is_primary };
        });

        setIntroEmails(allEmails);
        setIntroMobiles(allMobiles);
        setSelectedEmails(allEmails.map(e => e.email));
        if (allMobiles.length > 0) setSelectedMobile(allMobiles[0].mobile);
      } catch (err) {
        console.error('Error fetching quick intro data:', err);
        toast.error('Failed to load contact details');
      } finally {
        setLoading(false);
      }
    };

    populateQuickCompose();
  }, [quickMode, quickContact1?.contact_id, quickContact2?.contact_id]);

  // Reset quick mode state
  const resetQuickMode = useCallback(() => {
    setQuickMode(false);
    setQuickContact1(null);
    setQuickContact2(null);
    setQuickSearchQuery('');
    setQuickSearchResults([]);
    setQuickCategory('Karma Points');
    setFullIntroData(null);
    setIntroEmails([]);
    setIntroMobiles([]);
    setSelectedEmails([]);
    setSelectedMobile('');
  }, []);

  // Enter quick mode when clicking Email/WhatsApp tab without a selected intro
  const handleSubTabClick = useCallback((tab) => {
    if (tab === 'list') {
      if (quickMode) resetQuickMode();
      setActiveSubTab('list');
      return;
    }
    // email or whatsapp tab
    if (!selectedIntro && !quickMode) {
      // Enter quick mode
      setQuickMode(true);
      if (contactId && contactName) {
        const nameParts = contactName.split(' ');
        setQuickContact1({
          contact_id: contactId,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
        });
      }
    }
    setActiveSubTab(tab);
  }, [selectedIntro, quickMode, contactId, contactName, resetQuickMode]);

  // Auto-create introduction after quick mode send
  const handleQuickIntroSent = useCallback(async (tool) => {
    if (!quickContact1 || !quickContact2) return;

    try {
      // 1. Create introduction
      const { data: intro, error: introError } = await supabase
        .from('introductions')
        .insert({
          introduction_date: new Date().toISOString().split('T')[0],
          introduction_tool: tool,
          category: quickCategory,
          status: 'Done, but need to monitor',
        })
        .select('introduction_id')
        .single();

      if (introError) throw introError;

      // 2. Create introduction_contacts (both as introducee)
      const { error: contactsError } = await supabase
        .from('introduction_contacts')
        .insert([
          { introduction_id: intro.introduction_id, contact_id: quickContact1.contact_id, role: 'introducee' },
          { introduction_id: intro.introduction_id, contact_id: quickContact2.contact_id, role: 'introducee' },
        ]);

      if (contactsError) throw contactsError;

      toast.success('Introduction created!');
    } catch (err) {
      console.error('Error creating introduction:', err);
      toast.error('Email sent, but failed to create introduction record');
    }

    // Reset and go back to list
    resetQuickMode();
    setActiveSubTab('list');
    onRefresh?.();
  }, [quickContact1, quickContact2, quickCategory, resetQuickMode, onRefresh]);

  // Quick mode: Create WhatsApp group with both contacts
  const handleCreateQuickWhatsAppGroup = useCallback(async () => {
    if (!quickContact1 || !quickContact2 || introMobiles.length < 2) {
      toast.error('Need phone numbers for both contacts');
      return;
    }

    // Get best phone for each contact
    const phonesForGroup = [];
    const firstNames = [];
    const contactIds = [];

    for (const contact of [quickContact1, quickContact2]) {
      const contactMobs = introMobiles.filter(m => m.contactId === contact.contact_id);
      if (contactMobs.length === 0) {
        toast.error(`No phone number for ${contact.first_name}`);
        return;
      }
      const best = contactMobs.find(m => m.isPrimary) || contactMobs[0];
      phonesForGroup.push(best.mobile);
      firstNames.push(contact.first_name || 'Unknown');
      contactIds.push(contact.contact_id);
    }

    const groupName = firstNames.join(' <> ');

    setCreatingGroup(true);
    try {
      const response = await fetch('https://command-center-backend-production.up.railway.app/whatsapp/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName, phones: phonesForGroup, contactIds }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to create group');

      // Create introduction in DB
      const { data: intro, error: introError } = await supabase
        .from('introductions')
        .insert({
          introduction_date: new Date().toISOString().split('T')[0],
          introduction_tool: 'whatsapp',
          category: quickCategory,
          status: 'Done, but need to monitor',
          chat_id: data.chatId || null,
          whatsapp_group_jid: data.jid || null,
          whatsapp_group_name: groupName,
        })
        .select('introduction_id')
        .single();

      if (introError) throw introError;

      await supabase.from('introduction_contacts').insert([
        { introduction_id: intro.introduction_id, contact_id: quickContact1.contact_id, role: 'introducee' },
        { introduction_id: intro.introduction_id, contact_id: quickContact2.contact_id, role: 'introducee' },
      ]);

      toast.success(`WhatsApp group "${groupName}" created! Introduction saved.`);
      resetQuickMode();
      setActiveSubTab('list');
      onRefresh?.();
    } catch (err) {
      console.error('Error creating WhatsApp group:', err);
      toast.error(err.message || 'Failed to create WhatsApp group');
    } finally {
      setCreatingGroup(false);
    }
  }, [quickContact1, quickContact2, introMobiles, quickCategory, resetQuickMode, onRefresh]);

  // Fetch other contact names for all introductions in the list
  useEffect(() => {
    const fetchOtherContactNames = async () => {
      if (!contactIntroductions?.length || !contactId) {
        setOtherContactNames({});
        return;
      }

      const introIds = contactIntroductions.map(i => i.introduction_id);

      // Fetch all contacts for all introductions
      const { data: allIntroContacts, error } = await supabase
        .from('introduction_contacts')
        .select(`
          introduction_id,
          contact_id,
          role,
          contacts(first_name, last_name)
        `)
        .in('introduction_id', introIds);

      if (error) {
        console.error('Error fetching intro contacts:', error);
        return;
      }

      // Build map of intro_id -> other person's name
      const namesMap = {};
      introIds.forEach(introId => {
        const contacts = (allIntroContacts || []).filter(ic => ic.introduction_id === introId);
        // Find the other person (not the selected contact)
        const otherPerson = contacts.find(c => c.contact_id !== contactId);
        if (otherPerson?.contacts) {
          namesMap[introId] = `${otherPerson.contacts.first_name || ''} ${otherPerson.contacts.last_name || ''}`.trim();
        } else {
          // Fallback: show all introducees
          const introducees = contacts.filter(c => c.role === 'introducee');
          if (introducees.length > 0) {
            namesMap[introId] = introducees
              .map(c => `${c.contacts?.first_name || ''} ${c.contacts?.last_name || ''}`.trim())
              .filter(n => n)
              .join(' ↔ ');
          }
        }
      });

      setOtherContactNames(namesMap);
    };

    fetchOtherContactNames();
  }, [contactIntroductions, contactId]);

  // Fetch full introduction data with all contacts when one is selected
  useEffect(() => {
    const fetchFullIntroData = async () => {
      if (!selectedIntro?.introduction_id) {
        setFullIntroData(null);
        setIntroEmails([]);
        setIntroMobiles([]);
        return;
      }

      setLoading(true);
      try {
        // Fetch all contacts for this introduction
        const { data: introContacts, error } = await supabase
          .from('introduction_contacts')
          .select(`
            introduction_contact_id,
            contact_id,
            role,
            contacts(contact_id, first_name, last_name, profile_image_url)
          `)
          .eq('introduction_id', selectedIntro.introduction_id);

        if (error) throw error;

        // Build full intro data with contacts
        const contacts = (introContacts || []).map(ic => ({
          contact_id: ic.contact_id,
          first_name: ic.contacts?.first_name || '',
          last_name: ic.contacts?.last_name || '',
          name: `${ic.contacts?.first_name || ''} ${ic.contacts?.last_name || ''}`.trim(),
          role: ic.role,
          profile_image_url: ic.contacts?.profile_image_url,
        }));

        setFullIntroData({
          ...selectedIntro,
          contacts,
        });

        // Fetch emails and mobiles for all contacts in parallel
        const contactIds = contacts.map(c => c.contact_id).filter(id => id);

        const [emailsResult, mobilesResult] = await Promise.all([
          supabase
            .from('contact_emails')
            .select('email, contact_id')
            .in('contact_id', contactIds),
          supabase
            .from('contact_mobiles')
            .select('mobile, type, is_primary, contact_id')
            .in('contact_id', contactIds)
            .order('is_primary', { ascending: false })
        ]);

        // Build emails array with contact names
        const allEmails = (emailsResult.data || []).map(e => {
          const contact = contacts.find(c => c.contact_id === e.contact_id);
          return {
            email: e.email,
            contactName: contact?.name || 'Unknown',
            contactId: e.contact_id,
          };
        });

        // Build mobiles array with contact names
        const allMobiles = (mobilesResult.data || []).map(m => {
          const contact = contacts.find(c => c.contact_id === m.contact_id);
          return {
            mobile: m.mobile,
            contactName: contact?.name || 'Unknown',
            contactId: m.contact_id,
            type: m.type,
            isPrimary: m.is_primary,
          };
        });

        setIntroEmails(allEmails);
        setIntroMobiles(allMobiles);
        // Auto-select all emails and first mobile
        setSelectedEmails(allEmails.map(e => e.email));
        if (allMobiles.length > 0) setSelectedMobile(allMobiles[0].mobile);

      } catch (err) {
        console.error('Error fetching intro data:', err);
        toast.error('Failed to load introduction details');
      } finally {
        setLoading(false);
      }
    };

    fetchFullIntroData();
  }, [selectedIntro?.introduction_id]);

  // Get the other person's name for display (not the selected contact)
  const getIntroDisplayNames = (intro) => {
    // Use pre-fetched other contact name
    if (otherContactNames[intro.introduction_id]) {
      return otherContactNames[intro.introduction_id];
    }
    // Fallback to date if no name available yet
    return `Introduction ${new Date(intro.introduction_date || intro.created_at).toLocaleDateString()}`;
  };

  const handleSelectIntro = (intro) => {
    if (selectedIntro?.introduction_id === intro.introduction_id) {
      // Deselect - torna alla lista
      setSelectedIntro(null);
      onIntroductionSelect?.(null);
      setActiveSubTab('list');
    } else {
      // Seleziona e apri automaticamente il tab corretto basato sul tool
      setSelectedIntro(intro);
      onIntroductionSelect?.(intro);

      // Switch automatico al tab email o whatsapp basato su introduction_tool
      const tool = intro.introduction_tool?.toLowerCase();
      if (tool === 'whatsapp') {
        setActiveSubTab('whatsapp');
      } else if (tool === 'email') {
        setActiveSubTab('email');
      } else {
        // Per 'in person' o 'other', default a email
        setActiveSubTab('email');
      }
    }
  };

  const toggleEmail = (email) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(prev => prev.filter(e => e !== email));
    } else {
      setSelectedEmails(prev => [...prev, email]);
    }
  };

  const handleIntroEmailSent = async () => {
    // Update introduction status
    if (selectedIntro?.introduction_id) {
      const newStatus = 'Done, but need to monitor';
      await supabase
        .from('introductions')
        .update({ status: newStatus })
        .eq('introduction_id', selectedIntro.introduction_id);

      // Update local state
      setSelectedIntro(prev => prev ? { ...prev, status: newStatus } : prev);
      toast.success(`Introduction marked as "${newStatus}"`);
    }
  };

  // Group introductions by status
  const introsByStatus = useMemo(() => {
    const promised = []; // Promised + Requested
    const monitor = [];  // Done, but need to monitor
    const done = [];     // Done & Dust
    const aborted = [];  // Aborted

    (contactIntroductions || []).forEach(intro => {
      const status = intro.status || '';
      if (status === 'Promised' || status === 'Requested') {
        promised.push(intro);
      } else if (status === 'Done, but need to monitor') {
        monitor.push(intro);
      } else if (status === 'Done & Dust') {
        done.push(intro);
      } else if (status === 'Aborted') {
        aborted.push(intro);
      } else {
        // Unknown status goes to promised
        promised.push(intro);
      }
    });

    return { promised, monitor, done, aborted };
  }, [contactIntroductions]);

  // Group emails by contact name
  const emailsByContact = useMemo(() => {
    const grouped = {};
    introEmails.forEach(e => {
      if (!grouped[e.contactName]) grouped[e.contactName] = [];
      grouped[e.contactName].push(e);
    });
    return grouped;
  }, [introEmails]);

  return (
    <Container>
      {/* Sub-navigation */}
      <SubNav theme={theme}>
        <SubNavButton
          theme={theme}
          $active={activeSubTab === 'list'}
          onClick={() => handleSubTabClick('list')}
        >
          <FaList size={12} />
          List
        </SubNavButton>
        <SubNavButton
          theme={theme}
          $active={activeSubTab === 'email'}
          onClick={() => handleSubTabClick('email')}
        >
          <FaEnvelope size={12} />
          Email
        </SubNavButton>
        <SubNavButton
          theme={theme}
          $active={activeSubTab === 'whatsapp'}
          onClick={() => handleSubTabClick('whatsapp')}
        >
          <FaWhatsapp size={12} />
          WhatsApp
        </SubNavButton>
      </SubNav>

      <Content>
        {/* List Tab */}
        {activeSubTab === 'list' && (
          <>
            <AddButton theme={theme} onClick={() => setIntroductionModalOpen?.(true)}>
              <FaPlus size={12} />
              Add New Introduction
            </AddButton>

            {currentChat && (
              <LinkButton theme={theme} onClick={() => setLinkModalOpen(true)}>
                <FaLink size={11} />
                Link "{currentChat.chat_name}" to Introduction
              </LinkButton>
            )}

            {contactIntroductions?.length === 0 && (
              <EmptyState theme={theme}>
                <FaHandshake size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div>No introductions for this contact</div>
              </EmptyState>
            )}

            {/* Promised Section */}
            {introsByStatus.promised.length > 0 && (
              <>
                <SectionHeader theme={theme} $first $color="#F59E0B">
                  Promised
                  <SectionCount theme={theme}>{introsByStatus.promised.length}</SectionCount>
                </SectionHeader>
                {introsByStatus.promised.map(intro => (
                  <IntroCard
                    key={intro.introduction_id}
                    theme={theme}
                    $selected={selectedIntro?.introduction_id === intro.introduction_id}
                    onClick={() => handleSelectIntro(intro)}
                  >
                    <IntroHeader>
                      <IntroTitle>
                        <FaHandshake style={{ color: '#F59E0B', flexShrink: 0 }} size={12} />
                        <IntroNames theme={theme}>{getIntroDisplayNames(intro)}</IntroNames>
                      </IntroTitle>
                      <IntroActions>
                        <ActionButton theme={theme} onClick={(e) => { e.stopPropagation(); onEditIntroduction?.(intro); }}>
                          <FaEdit size={8} /> Edit
                        </ActionButton>
                        <ActionButton theme={theme} $danger onClick={(e) => { e.stopPropagation(); onDeleteIntroduction?.(intro.introduction_id); }}>
                          <FaTrash size={8} />
                        </ActionButton>
                      </IntroActions>
                    </IntroHeader>
                    <IntroMeta theme={theme}>
                      <span>{intro.introduction_tool || ''}</span>
                      {intro.introduction_date && <span>{new Date(intro.introduction_date).toLocaleDateString()}</span>}
                    </IntroMeta>
                    {intro.text && (
                      <IntroNotes theme={theme}>"{intro.text.substring(0, 50)}{intro.text.length > 50 ? '...' : ''}"</IntroNotes>
                    )}
                  </IntroCard>
                ))}
              </>
            )}

            {/* Monitor Section */}
            {introsByStatus.monitor.length > 0 && (
              <>
                <SectionHeader theme={theme} $first={introsByStatus.promised.length === 0} $color="#F97316">
                  Monitor
                  <SectionCount theme={theme}>{introsByStatus.monitor.length}</SectionCount>
                </SectionHeader>
                {introsByStatus.monitor.map(intro => (
                  <IntroCard
                    key={intro.introduction_id}
                    theme={theme}
                    $selected={selectedIntro?.introduction_id === intro.introduction_id}
                    onClick={() => handleSelectIntro(intro)}
                  >
                    <IntroHeader>
                      <IntroTitle>
                        <FaHandshake style={{ color: '#F59E0B', flexShrink: 0 }} size={12} />
                        <IntroNames theme={theme}>{getIntroDisplayNames(intro)}</IntroNames>
                      </IntroTitle>
                      <IntroActions>
                        <ActionButton theme={theme} onClick={(e) => { e.stopPropagation(); onEditIntroduction?.(intro); }}>
                          <FaEdit size={8} /> Edit
                        </ActionButton>
                        <ActionButton theme={theme} $danger onClick={(e) => { e.stopPropagation(); onDeleteIntroduction?.(intro.introduction_id); }}>
                          <FaTrash size={8} />
                        </ActionButton>
                      </IntroActions>
                    </IntroHeader>
                    <IntroMeta theme={theme}>
                      <span>{intro.introduction_tool || ''}</span>
                      {intro.introduction_date && <span>{new Date(intro.introduction_date).toLocaleDateString()}</span>}
                    </IntroMeta>
                    {intro.text && (
                      <IntroNotes theme={theme}>"{intro.text.substring(0, 50)}{intro.text.length > 50 ? '...' : ''}"</IntroNotes>
                    )}
                  </IntroCard>
                ))}
              </>
            )}

            {/* Done & Dust Section */}
            {introsByStatus.done.length > 0 && (
              <>
                <SectionHeader theme={theme} $first={introsByStatus.promised.length === 0 && introsByStatus.monitor.length === 0} $color="#22C55E">
                  Done & Dust
                  <SectionCount theme={theme}>{introsByStatus.done.length}</SectionCount>
                </SectionHeader>
                {introsByStatus.done.map(intro => (
                  <IntroCard
                    key={intro.introduction_id}
                    theme={theme}
                    $selected={selectedIntro?.introduction_id === intro.introduction_id}
                    onClick={() => handleSelectIntro(intro)}
                  >
                    <IntroHeader>
                      <IntroTitle>
                        <FaHandshake style={{ color: '#F59E0B', flexShrink: 0 }} size={12} />
                        <IntroNames theme={theme}>{getIntroDisplayNames(intro)}</IntroNames>
                      </IntroTitle>
                      <IntroActions>
                        <ActionButton theme={theme} onClick={(e) => { e.stopPropagation(); onEditIntroduction?.(intro); }}>
                          <FaEdit size={8} /> Edit
                        </ActionButton>
                        <ActionButton theme={theme} $danger onClick={(e) => { e.stopPropagation(); onDeleteIntroduction?.(intro.introduction_id); }}>
                          <FaTrash size={8} />
                        </ActionButton>
                      </IntroActions>
                    </IntroHeader>
                    <IntroMeta theme={theme}>
                      <span>{intro.introduction_tool || ''}</span>
                      {intro.introduction_date && <span>{new Date(intro.introduction_date).toLocaleDateString()}</span>}
                    </IntroMeta>
                    {intro.text && (
                      <IntroNotes theme={theme}>"{intro.text.substring(0, 50)}{intro.text.length > 50 ? '...' : ''}"</IntroNotes>
                    )}
                  </IntroCard>
                ))}
              </>
            )}

            {/* Aborted Section */}
            {introsByStatus.aborted.length > 0 && (
              <>
                <SectionHeader theme={theme} $first={introsByStatus.promised.length === 0 && introsByStatus.monitor.length === 0 && introsByStatus.done.length === 0} $color="#EF4444">
                  Aborted
                  <SectionCount theme={theme}>{introsByStatus.aborted.length}</SectionCount>
                </SectionHeader>
                {introsByStatus.aborted.map(intro => (
                  <IntroCard
                    key={intro.introduction_id}
                    theme={theme}
                    $selected={selectedIntro?.introduction_id === intro.introduction_id}
                    onClick={() => handleSelectIntro(intro)}
                  >
                    <IntroHeader>
                      <IntroTitle>
                        <FaHandshake style={{ color: '#F59E0B', flexShrink: 0 }} size={12} />
                        <IntroNames theme={theme}>{getIntroDisplayNames(intro)}</IntroNames>
                      </IntroTitle>
                      <IntroActions>
                        <ActionButton theme={theme} onClick={(e) => { e.stopPropagation(); onEditIntroduction?.(intro); }}>
                          <FaEdit size={8} /> Edit
                        </ActionButton>
                        <ActionButton theme={theme} $danger onClick={(e) => { e.stopPropagation(); onDeleteIntroduction?.(intro.introduction_id); }}>
                          <FaTrash size={8} />
                        </ActionButton>
                      </IntroActions>
                    </IntroHeader>
                    <IntroMeta theme={theme}>
                      <span>{intro.introduction_tool || ''}</span>
                      {intro.introduction_date && <span>{new Date(intro.introduction_date).toLocaleDateString()}</span>}
                    </IntroMeta>
                    {intro.text && (
                      <IntroNotes theme={theme}>"{intro.text.substring(0, 50)}{intro.text.length > 50 ? '...' : ''}"</IntroNotes>
                    )}
                  </IntroCard>
                ))}
              </>
            )}
          </>
        )}

        {/* Email Tab */}
        {activeSubTab === 'email' && (
          <>
            {!selectedIntro && !quickMode ? (
              <EmptyState theme={theme}>
                <FaEnvelope size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div>Select an introduction from the list, or click Email to start a quick intro</div>
              </EmptyState>
            ) : (
              <>
                <BackToListButton theme={theme} onClick={() => {
                  if (quickMode) resetQuickMode();
                  setSelectedIntro(null);
                  setActiveSubTab('list');
                }}>
                  <FaArrowLeft size={10} />
                  Back to list
                </BackToListButton>

                {/* Selected intro info (existing flow) */}
                {selectedIntro && (
                  <SelectedIntroInfo theme={theme}>
                    <SelectedIntroTitle>
                      <SelectedIntroNames>
                        <FaHandshake size={12} style={{ marginRight: '6px' }} />
                        {fullIntroData?.contacts?.filter(c => c.role === 'introducee').map(c => c.name).join(' ↔ ') || 'Loading...'}
                      </SelectedIntroNames>
                      <StatusBadge $status={selectedIntro.status}>{selectedIntro.status}</StatusBadge>
                    </SelectedIntroTitle>
                  </SelectedIntroInfo>
                )}

                {/* Quick mode contact picker */}
                {quickMode && !selectedIntro && (
                  <QuickPickerContainer theme={theme}>
                    {/* Contact 1 */}
                    <QuickPickerRow>
                      <QuickPickerLabel theme={theme}>Contact 1</QuickPickerLabel>
                      {quickContact1 ? (
                        <ContactChip theme={theme}>
                          {quickContact1.first_name} {quickContact1.last_name}
                          <ContactChipRemove theme={theme} onClick={() => setQuickContact1(null)}>
                            <FaTimes />
                          </ContactChipRemove>
                        </ContactChip>
                      ) : (
                        <div style={{ flex: 1 }}>
                          <SearchInput
                            theme={theme}
                            placeholder="Search contact..."
                            value={quickSearchQuery}
                            onChange={e => setQuickSearchQuery(e.target.value)}
                            autoFocus
                          />
                          {quickSearchResults.length > 0 && (
                            <ResultsList theme={theme}>
                              {quickSearchResults.map(c => (
                                <ResultItem
                                  key={c.contact_id}
                                  theme={theme}
                                  onClick={() => {
                                    setQuickContact1(c);
                                    setQuickSearchQuery('');
                                    setQuickSearchResults([]);
                                  }}
                                >
                                  <ResultTitle theme={theme}>{c.first_name} {c.last_name}</ResultTitle>
                                </ResultItem>
                              ))}
                            </ResultsList>
                          )}
                        </div>
                      )}
                    </QuickPickerRow>

                    {/* Contact 2 */}
                    <QuickPickerRow>
                      <QuickPickerLabel theme={theme}>Contact 2</QuickPickerLabel>
                      {quickContact2 ? (
                        <ContactChip theme={theme}>
                          {quickContact2.first_name} {quickContact2.last_name}
                          <ContactChipRemove theme={theme} onClick={() => setQuickContact2(null)}>
                            <FaTimes />
                          </ContactChipRemove>
                        </ContactChip>
                      ) : (
                        <div style={{ flex: 1 }}>
                          <SearchInput
                            theme={theme}
                            placeholder="Search second contact..."
                            value={!quickContact1 ? '' : quickSearchQuery}
                            onChange={e => quickContact1 && setQuickSearchQuery(e.target.value)}
                            disabled={!quickContact1}
                            autoFocus={!!quickContact1}
                          />
                          {quickContact1 && quickSearchResults.length > 0 && (
                            <ResultsList theme={theme}>
                              {quickSearchResults.map(c => (
                                <ResultItem
                                  key={c.contact_id}
                                  theme={theme}
                                  onClick={() => {
                                    setQuickContact2(c);
                                    setQuickSearchQuery('');
                                    setQuickSearchResults([]);
                                  }}
                                >
                                  <ResultTitle theme={theme}>{c.first_name} {c.last_name}</ResultTitle>
                                </ResultItem>
                              ))}
                            </ResultsList>
                          )}
                        </div>
                      )}
                    </QuickPickerRow>

                    {/* Category */}
                    <QuickPickerRow>
                      <QuickPickerLabel theme={theme}>Category</QuickPickerLabel>
                      <CategorySelect theme={theme} value={quickCategory} onChange={e => setQuickCategory(e.target.value)}>
                        <option value="Karma Points">Karma Points</option>
                        <option value="Dealflow">Dealflow</option>
                        <option value="Portfolio Company">Portfolio Company</option>
                      </CategorySelect>
                    </QuickPickerRow>
                  </QuickPickerContainer>
                )}

                {/* Email recipient selection */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '11px',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 600
                  }}>
                    To (click to select/deselect)
                  </label>

                  {introEmails.length === 0 ? (
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: theme === 'dark' ? '#374151' : '#F9FAFB',
                      color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                      fontSize: '13px',
                      fontStyle: 'italic'
                    }}>
                      {quickMode && (!quickContact1 || !quickContact2) ? 'Pick both contacts to see emails' : 'No email addresses found'}
                    </div>
                  ) : (
                    <EmailChipsContainer>
                      {Object.entries(emailsByContact).map(([contactName, emails]) => (
                        <EmailChipGroup key={contactName}>
                          <EmailChipLabel theme={theme}>{contactName}</EmailChipLabel>
                          <EmailChipsRow>
                            {emails.map((e, idx) => (
                              <EmailChip
                                key={idx}
                                theme={theme}
                                $selected={selectedEmails.includes(e.email)}
                                onClick={() => toggleEmail(e.email)}
                              >
                                {e.email}
                              </EmailChip>
                            ))}
                          </EmailChipsRow>
                        </EmailChipGroup>
                      ))}
                    </EmailChipsContainer>
                  )}
                </div>

                {/* Email compose */}
                {selectedEmails.length > 0 && (
                  <SendEmailTab
                    theme={theme}
                    contact={{}}
                    emails={selectedEmails.map(email => ({ email }))}
                    onEmailSent={quickMode ? () => handleQuickIntroSent('email') : handleIntroEmailSent}
                    hideToField={true}
                    multipleRecipients={selectedEmails}
                    defaultSubject={(() => {
                      const contacts = fullIntroData?.contacts || [];
                      const names = contacts.map(c => c.name).filter(n => n);
                      return names.length >= 2 ? `${names[0]} <> ${names[1]}` : names[0] || '';
                    })()}
                    introductionMode={true}
                    introContacts={(fullIntroData?.contacts || []).map(c => ({
                      firstName: c.first_name || '',
                      fullName: c.name
                    }))}
                    introNotes={selectedIntro?.text || ''}
                    introductionId={selectedIntro?.introduction_id || null}
                    onIntroductionStatusUpdate={selectedIntro ? (introId, newStatus) => {
                      setSelectedIntro(null);
                      setActiveSubTab('list');
                      toast.success(`Introduction marked as "${newStatus}"`);
                      onRefresh?.();
                    } : undefined}
                  />
                )}

                {selectedEmails.length === 0 && introEmails.length > 0 && (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    fontSize: '13px',
                    marginTop: '24px'
                  }}>
                    Select at least one email address
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* WhatsApp Tab */}
        {activeSubTab === 'whatsapp' && (
          <>
            {!selectedIntro && !quickMode ? (
              <EmptyState theme={theme}>
                <FaWhatsapp size={32} style={{ marginBottom: '12px', opacity: 0.5, color: '#25D366' }} />
                <div>Select an introduction from the list, or click WhatsApp to start a quick intro</div>
              </EmptyState>
            ) : (
              <>
                <BackToListButton theme={theme} onClick={() => {
                  if (quickMode) resetQuickMode();
                  setSelectedIntro(null);
                  setActiveSubTab('list');
                }}>
                  <FaArrowLeft size={10} />
                  Back to list
                </BackToListButton>

                {/* Selected intro info (existing flow) */}
                {selectedIntro && (
                  <SelectedIntroInfo theme={theme}>
                    <SelectedIntroTitle>
                      <SelectedIntroNames>
                        <FaHandshake size={12} style={{ marginRight: '6px' }} />
                        {fullIntroData?.contacts?.filter(c => c.role === 'introducee').map(c => c.name).join(' ↔ ') || 'Loading...'}
                      </SelectedIntroNames>
                      <StatusBadge $status={selectedIntro.status}>{selectedIntro.status}</StatusBadge>
                    </SelectedIntroTitle>
                  </SelectedIntroInfo>
                )}

                {/* Quick mode contact picker */}
                {quickMode && !selectedIntro && (
                  <QuickPickerContainer theme={theme}>
                    {/* Contact 1 */}
                    <QuickPickerRow>
                      <QuickPickerLabel theme={theme}>Contact 1</QuickPickerLabel>
                      {quickContact1 ? (
                        <ContactChip theme={theme}>
                          {quickContact1.first_name} {quickContact1.last_name}
                          <ContactChipRemove theme={theme} onClick={() => setQuickContact1(null)}>
                            <FaTimes />
                          </ContactChipRemove>
                        </ContactChip>
                      ) : (
                        <div style={{ flex: 1 }}>
                          <SearchInput
                            theme={theme}
                            placeholder="Search contact..."
                            value={quickSearchQuery}
                            onChange={e => setQuickSearchQuery(e.target.value)}
                            autoFocus
                          />
                          {quickSearchResults.length > 0 && (
                            <ResultsList theme={theme}>
                              {quickSearchResults.map(c => (
                                <ResultItem
                                  key={c.contact_id}
                                  theme={theme}
                                  onClick={() => {
                                    setQuickContact1(c);
                                    setQuickSearchQuery('');
                                    setQuickSearchResults([]);
                                  }}
                                >
                                  <ResultTitle theme={theme}>{c.first_name} {c.last_name}</ResultTitle>
                                </ResultItem>
                              ))}
                            </ResultsList>
                          )}
                        </div>
                      )}
                    </QuickPickerRow>

                    {/* Contact 2 */}
                    <QuickPickerRow>
                      <QuickPickerLabel theme={theme}>Contact 2</QuickPickerLabel>
                      {quickContact2 ? (
                        <ContactChip theme={theme}>
                          {quickContact2.first_name} {quickContact2.last_name}
                          <ContactChipRemove theme={theme} onClick={() => setQuickContact2(null)}>
                            <FaTimes />
                          </ContactChipRemove>
                        </ContactChip>
                      ) : (
                        <div style={{ flex: 1 }}>
                          <SearchInput
                            theme={theme}
                            placeholder="Search second contact..."
                            value={!quickContact1 ? '' : quickSearchQuery}
                            onChange={e => quickContact1 && setQuickSearchQuery(e.target.value)}
                            disabled={!quickContact1}
                            autoFocus={!!quickContact1}
                          />
                          {quickContact1 && quickSearchResults.length > 0 && (
                            <ResultsList theme={theme}>
                              {quickSearchResults.map(c => (
                                <ResultItem
                                  key={c.contact_id}
                                  theme={theme}
                                  onClick={() => {
                                    setQuickContact2(c);
                                    setQuickSearchQuery('');
                                    setQuickSearchResults([]);
                                  }}
                                >
                                  <ResultTitle theme={theme}>{c.first_name} {c.last_name}</ResultTitle>
                                </ResultItem>
                              ))}
                            </ResultsList>
                          )}
                        </div>
                      )}
                    </QuickPickerRow>

                    {/* Category */}
                    <QuickPickerRow>
                      <QuickPickerLabel theme={theme}>Category</QuickPickerLabel>
                      <CategorySelect theme={theme} value={quickCategory} onChange={e => setQuickCategory(e.target.value)}>
                        <option value="Karma Points">Karma Points</option>
                        <option value="Dealflow">Dealflow</option>
                        <option value="Portfolio Company">Portfolio Company</option>
                      </CategorySelect>
                    </QuickPickerRow>
                  </QuickPickerContainer>
                )}

                {/* Create WhatsApp Group button - quick mode with both contacts */}
                {quickMode && quickContact1 && quickContact2 && (
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      onClick={handleCreateQuickWhatsAppGroup}
                      disabled={creatingGroup || introMobiles.length < 2}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: creatingGroup
                          ? (theme === 'dark' ? '#374151' : '#E5E7EB')
                          : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                        color: creatingGroup ? (theme === 'dark' ? '#9CA3AF' : '#6B7280') : 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: creatingGroup || introMobiles.length < 2 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: creatingGroup ? 'none' : '0 2px 8px rgba(37, 211, 102, 0.3)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {creatingGroup ? (
                        <>
                          <span style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid currentColor',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Creating Group...
                        </>
                      ) : (
                        <>
                          <FaUsers size={16} />
                          Create WhatsApp Group
                        </>
                      )}
                    </button>
                    {introMobiles.length >= 2 && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '11px',
                        color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                        textAlign: 'center',
                      }}>
                        Group: {quickContact1.first_name} {'<>'} {quickContact2.first_name}
                      </div>
                    )}
                  </div>
                )}

                {/* Or send individual WhatsApp */}
                {(quickMode && quickContact1 && quickContact2) && (
                  <div style={{
                    fontSize: '11px',
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    textAlign: 'center',
                    marginBottom: '12px',
                    fontWeight: 500,
                  }}>
                    — or send individual message —
                  </div>
                )}

                {/* Mobile selection */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '11px',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 600
                  }}>
                    Send to (click to select)
                  </label>

                  {introMobiles.length === 0 ? (
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: theme === 'dark' ? '#374151' : '#F9FAFB',
                      color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                      fontSize: '13px',
                      fontStyle: 'italic'
                    }}>
                      {quickMode && (!quickContact1 || !quickContact2) ? 'Pick both contacts to see phone numbers' : 'No phone numbers found'}
                    </div>
                  ) : (
                    <MobileChipsRow>
                      {introMobiles.map((m, idx) => (
                        <MobileChip
                          key={idx}
                          theme={theme}
                          $selected={selectedMobile === m.mobile}
                          onClick={() => setSelectedMobile(m.mobile)}
                        >
                          {m.contactName}: {m.mobile}
                        </MobileChip>
                      ))}
                    </MobileChipsRow>
                  )}
                </div>

                {/* WhatsApp compose */}
                {selectedMobile && (
                  <WhatsAppChatTab
                    theme={theme}
                    contactId={introMobiles.find(m => m.mobile === selectedMobile)?.contactId}
                    contact={{
                      contact_id: introMobiles.find(m => m.mobile === selectedMobile)?.contactId,
                      first_name: fullIntroData?.contacts?.find(c =>
                        introMobiles.find(m => m.mobile === selectedMobile)?.contactId === c.contact_id
                      )?.first_name || '',
                      last_name: fullIntroData?.contacts?.find(c =>
                        introMobiles.find(m => m.mobile === selectedMobile)?.contactId === c.contact_id
                      )?.last_name || ''
                    }}
                    mobiles={[{ mobile: selectedMobile, is_primary: true }]}
                    onMessageSent={quickMode ? () => handleQuickIntroSent('whatsapp') : async () => {
                      if (selectedIntro?.introduction_id) {
                        const newStatus = 'Done, but need to monitor';
                        await supabase
                          .from('introductions')
                          .update({ status: newStatus })
                          .eq('introduction_id', selectedIntro.introduction_id);
                      }
                      setSelectedIntro(null);
                      setActiveSubTab('list');
                      toast.success('WhatsApp sent! Introduction marked as "Done, but need to monitor"');
                      onRefresh?.();
                    }}
                    defaultMessage={selectedIntro?.text || (() => {
                      const introducees = fullIntroData?.contacts?.filter(c => c.role === 'introducee') || [];
                      const names = introducees.map(c => c.first_name).filter(n => n);
                      return `Ciao! Vi presento: ${names.join(' e ')}.`;
                    })()}
                  />
                )}

                {!selectedMobile && introMobiles.length > 0 && !quickMode && (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    fontSize: '13px',
                    marginTop: '24px'
                  }}>
                    Select a phone number
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Content>

      {/* Link Chat to Introduction Modal */}
      {linkModalOpen && currentChat && (
        <ModalOverlay onClick={() => setLinkModalOpen(false)}>
          <ModalContent theme={theme} onClick={e => e.stopPropagation()}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>
                <FaLink size={16} style={{ color: '#25D366' }} />
                Link Chat to Introduction
              </ModalTitle>
              <CloseButton theme={theme} onClick={() => setLinkModalOpen(false)}>
                <FaTimes size={16} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              {/* Current Chat (read-only) */}
              <FormGroup>
                <Label theme={theme}>WhatsApp Chat</Label>
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: theme === 'dark' ? 'rgba(37, 211, 102, 0.1)' : 'rgba(18, 140, 126, 0.1)',
                  border: '1px solid #25D366',
                  fontSize: '13px',
                  color: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaWhatsapp size={14} />
                  <span style={{ fontWeight: 600 }}>{currentChat.chat_name}</span>
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>
                    ({currentChat.is_group_chat ? 'Group' : 'Direct'})
                  </span>
                </div>
              </FormGroup>

              {/* Introduction Search */}
              <FormGroup>
                <Label theme={theme}>Search Introduction (by contact name)</Label>
                <SearchInput
                  theme={theme}
                  placeholder="Type 3+ characters to search..."
                  value={introSearchQuery}
                  onChange={e => setIntroSearchQuery(e.target.value)}
                  autoFocus
                />
                {allIntroductions.length > 0 && (
                  <ResultsList theme={theme}>
                    {allIntroductions.map(intro => (
                      <ResultItem
                        key={intro.introduction_id}
                        theme={theme}
                        $selected={selectedLinkIntro?.introduction_id === intro.introduction_id}
                        onClick={() => setSelectedLinkIntro(intro)}
                      >
                        <ResultTitle theme={theme}>
                          <FaHandshake size={12} style={{ color: '#F59E0B', marginRight: '6px' }} />
                          {intro.names?.join(' ↔ ') || 'Unknown'}
                        </ResultTitle>
                        <ResultSubtitle theme={theme}>
                          {intro.status} • {intro.introduction_date ? new Date(intro.introduction_date).toLocaleDateString() : 'No date'}
                          {intro.chat_id && ' • Already linked'}
                        </ResultSubtitle>
                      </ResultItem>
                    ))}
                  </ResultsList>
                )}
                {selectedLinkIntro && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                    border: '1px solid #F59E0B',
                    fontSize: '12px',
                    color: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <FaHandshake size={12} />
                    Selected: {selectedLinkIntro.names?.join(' ↔ ') || 'Unknown'}
                  </div>
                )}
              </FormGroup>
            </ModalBody>

            <ModalFooter theme={theme}>
              <CancelButton theme={theme} onClick={() => setLinkModalOpen(false)}>
                Cancel
              </CancelButton>
              <SaveButton
                disabled={!selectedLinkIntro || linkSaving}
                onClick={handleLinkChatToIntro}
              >
                {linkSaving ? 'Linking...' : 'Link to Introduction'}
              </SaveButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default IntroductionsPanelTab;
