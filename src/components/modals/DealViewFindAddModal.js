import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { 
  FiX, 
  FiSearch, 
  FiFilter, 
  FiPlus, 
  FiLink, 
  FiCheck, 
  FiCalendar, 
  FiDollarSign, 
  FiInfo, 
  FiTag, 
  FiPaperclip, 
  FiDownload, 
  FiEdit,
  FiList,
  FiActivity,
  FiAlertTriangle,
  FiSave
} from 'react-icons/fi';
import EditDealFinalModal from './EditDealFinalModal';
import toast from 'react-hot-toast';

// Setup Modal for React
Modal.setAppElement('#root');

// Form container for the Create New Deal tab
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  color: #00ff00;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  
  svg {
    opacity: 0.8;
  }
`;

// Base styles for all form controls to ensure consistent sizing
const formControlStyles = `
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #ccc;
  padding: 10px 12px;
  font-size: 14px;
  width: 100%;
  height: 42px; /* Fixed height for consistent appearance */
  box-sizing: border-box;
  
  &:focus {
    border-color: #00ff00;
    outline: none;
    box-shadow: 0 0 0 1px rgba(0, 255, 0, 0.3);
  }
  
  &::placeholder {
    color: #555;
  }
`;

const FormInput = styled.input`
  ${formControlStyles}
  
  &:disabled {
    background-color: #222;
    color: #666;
    cursor: not-allowed;
  }
`;

const FormSelect = styled.select`
  ${formControlStyles}
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2300ff00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px; /* Make room for the dropdown arrow */
  
  option {
    background-color: #1a1a1a;
    color: #ccc;
  }
`;

const FormTextarea = styled.textarea`
  ${formControlStyles}
  min-height: 100px;
  height: auto;
  resize: vertical;
`;

const ErrorMessage = styled.div`
  color: #ff5555;
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  svg {
    flex-shrink: 0;
  }
`;

const FormRow = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
  
  > div {
    flex: 1;
    min-width: 0; /* Prevents flex children from overflowing */
  }
`;

const SectionTitle = styled.div`
  font-size: 15px;
  color: #00ff00;
  margin: 25px 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
  }
`;

const HelpText = styled.div`
  color: #888;
  font-size: 12px;
  margin-top: 4px;
  font-style: italic;
`;

const SaveButton = styled.button`
  background-color: rgba(0, 255, 0, 0.1);
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.2);
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: rgba(0, 255, 0, 0.05);
    &:hover {
      box-shadow: none;
    }
  }
`;

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 10px;
  border-bottom: 1px solid #333;

  h2 {
    color: #00ff00;
    margin: 0;
    font-size: 1.2rem;
    font-family: 'Courier New', monospace;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  height: calc(100% - 70px); /* Account for header */
  width: 100%;
`;

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 15%;
  border-right: 1px solid #333;
  min-height: 100%;
  background-color: #0a0a0a;
`;

const ContentArea = styled.div`
  width: 85%;
  padding: 0 20px;
  overflow-y: auto;
`;

const Tab = styled.div`
  padding: 15px 15px;
  cursor: pointer;
  color: ${props => props.$isActive ? '#00ff00' : '#ccc'};
  border-left: 3px solid ${props => props.$isActive ? '#00ff00' : 'transparent'};
  font-weight: ${props => props.$isActive ? 'bold' : 'normal'};
  background-color: ${props => props.$isActive ? '#121212' : 'transparent'};
  
  &:hover {
    color: #00ff00;
    background-color: rgba(0, 255, 0, 0.05);
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
  color: #cccccc;
  font-size: 0.9rem;
  min-height: 300px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 20px;
`;

// Coming soon message for tabs not yet implemented
const ComingSoonMessage = styled.div`
  font-size: 1.2rem;
  color: #00ff00;
  text-align: center;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  
  p {
    margin: 10px 0;
  }
  
  .emoji {
    font-size: 2rem;
    margin: 20px 0;
  }
`;

// Empty state message for when no deals are associated
const EmptyStateMessage = styled.div`
  color: #888;
  text-align: center;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  
  h3 {
    color: #00ff00;
    margin-bottom: 15px;
    font-size: 1.1rem;
    font-family: 'Courier New', monospace;
  }
  
  p {
    font-size: 0.9rem;
    margin-bottom: 25px;
    max-width: 400px;
  }
  
  svg {
    margin-bottom: 20px;
    color: #00ff00;
    opacity: 0.6;
  }
`;

// Add Deal button for empty state
const AddDealButton = styled.button`
  background-color: rgba(0, 255, 0, 0.1);
  color: #00ff00;
  border: 1px solid #00ff00;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.2);
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  }
`;

// Styled components for Associated Deals tab
const AssociatedDealsList = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 10px 15px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const AssociatedDealItem = styled.div`
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-left: 3px solid #00ff00;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  transition: all 0.2s;
  
  &:hover {
    border-color: #00ff00;
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
  }
`;

const RelationshipBadge = styled.div`
  background-color: rgba(0, 255, 0, 0.15);
  color: #00ff00;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 3px;
  display: inline-block;
  margin-left: 10px;
  font-weight: bold;
  text-transform: capitalize;
`;

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
`;

const DetailLabel = styled.div`
  width: 120px;
  color: #888;
  padding-right: 10px;
`;

const DetailValue = styled.div`
  color: #ccc;
  flex: 1;
`;

const Description = styled.div`
  margin-top: 15px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 13px;
  color: #aaa;
  
  .label {
    color: #888;
    margin-bottom: 5px;
    font-size: 12px;
  }
`;

const SectionDetailTitle = styled.div`
  font-size: 13px;
  color: #888;
  margin: 15px 0 5px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 5px;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
`;

const Tag = styled.div`
  background-color: rgba(0, 255, 0, 0.1);
  color: #00ff00;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  
  svg {
    margin-right: 4px;
    font-size: 10px;
  }
`;

// SuggestionsContainer component for tag suggestions
const SuggestionsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 150px;
  overflow-y: auto;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  color: #ccc;
  
  &:hover {
    background-color: #333;
    color: #00ff00;
  }
  
  &.highlight {
    background-color: #333;
    color: #00ff00;
  }
`;

const AttachmentsContainer = styled.div`
  margin-top: 5px;
`;

const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1f1f1f;
  padding: 8px 10px;
  border-radius: 4px;
  margin-bottom: 5px;
  font-size: 12px;
  
  .attachment-name {
    display: flex;
    align-items: center;
    color: #ccc;
    
    svg {
      margin-right: 5px;
      color: #00ff00;
    }
  }
`;

const DownloadButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 11px;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
  
  svg {
    margin-right: 3px;
  }
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
  gap: 10px;
`;

// Styled components for deal navigation
const DealNavContainer = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 10px 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid #333;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const DealNavPill = styled.button`
  background-color: ${props => props.$isActive ? 'rgba(0, 255, 0, 0.15)' : '#1a1a1a'};
  color: ${props => props.$isActive ? '#00ff00' : '#ccc'};
  border: 1px solid ${props => props.$isActive ? '#00ff00' : '#333'};
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.$isActive ? 'rgba(0, 255, 0, 0.15)' : 'rgba(0, 255, 0, 0.05)'};
    border-color: #00ff00;
    color: #00ff00;
  }
  
  .badge {
    background-color: ${props => props.$isActive ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.$isActive ? '#00ff00' : '#aaa'};
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 10px;
    margin-left: 5px;
  }
`;

const ActionButton = styled.button`
  background-color: transparent;
  color: #ccc;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.05);
    border-color: #00ff00;
    color: #00ff00;
  }
  
  &.danger {
    &:hover {
      background-color: rgba(255, 0, 0, 0.1);
      border-color: #ff5555;
      color: #ff5555;
    }
  }
`;

// Styled components for the Add from List tab
const SearchContainer = styled.div`
  margin-bottom: 20px;
  width: 100%;
  padding: 0 15px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 10px;
  width: 100%;
  
  svg {
    color: #666;
    margin-right: 8px;
  }
  
  input {
    background: none;
    border: none;
    color: #ccc;
    font-size: 14px;
    width: 100%;
    outline: none;
    
    &::placeholder {
      color: #666;
    }
  }
`;

const SuggestedSearch = styled.div`
  color: #00ff00;
  font-size: 12px;
  margin-top: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  span {
    margin-left: 5px;
    padding: 3px 8px;
    background-color: rgba(0, 255, 0, 0.1);
    border-radius: 4px;
    
    &:hover {
      background-color: rgba(0, 255, 0, 0.2);
    }
  }
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding: 0 15px 15px 15px;
  border-bottom: 1px solid #333;
  overflow-x: auto;
  width: 100%;
  scrollbar-width: thin;
  scrollbar-color: #00ff00 #222;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const FilterButton = styled.button`
  background-color: ${props => props.$active ? 'rgba(0, 255, 0, 0.15)' : '#1a1a1a'};
  color: ${props => props.$active ? '#00ff00' : '#ccc'};
  border: 1px solid ${props => props.$active ? '#00ff00' : '#333'};
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background-color: ${props => props.$active ? 'rgba(0, 255, 0, 0.15)' : 'rgba(0, 255, 0, 0.05)'};
    border-color: ${props => props.$active ? '#00ff00' : '#444'};
  }
`;

const DealsList = styled.div`
  height: calc(100% - 150px);
  overflow-y: auto;
  width: 100%;
  padding: 0 15px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const DealItem = styled.div`
  background-color: #1a1a1a;
  border: ${props => props.$isAssociated ? '2px solid #00ff00' : '1px solid #333'};
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    border-color: #00ff00;
    box-shadow: 0 0 5px rgba(0, 255, 0, 0.2);
  }
  
  ${props => props.$isAssociated && `
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
    
    &::after {
      content: '${props => props.$relationship ? `Associated (${props.$relationship})` : 'Associated'}';
      position: absolute;
      top: 8px;
      right: 8px;
      background-color: rgba(0, 255, 0, 0.2);
      color: #00ff00;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
    }
  `}
`;

const DealHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const DealTitle = styled.div`
  font-weight: bold;
  color: #00ff00;
  font-size: 14px;
`;

const DealCategory = styled.div`
  font-size: 11px;
  color: #ccc;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
`;

const DealInfo = styled.div`
  font-size: 12px;
  color: #aaa;
  margin-bottom: 8px;
`;

const DealDate = styled.div`
  font-size: 11px;
  color: #888;
  text-align: right;
`;

const DealFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
`;

const AssociateButton = styled.button`
  background-color: ${props => props.$isAssociated ? 'rgba(0, 255, 0, 0.15)' : 'transparent'};
  color: ${props => props.$isAssociated ? '#00ff00' : '#ccc'};
  border: 1px solid ${props => props.$isAssociated ? '#00ff00' : '#444'};
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.$isAssociated ? 'rgba(0, 255, 0, 0.15)' : 'rgba(0, 255, 0, 0.05)'};
    border-color: #00ff00;
    color: #00ff00;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NoDealsMessage = styled.div`
  color: #666;
  text-align: center;
  padding: 40px 0;
  font-style: italic;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  position: absolute;
  bottom: 25px;
  right: 25px;
  width: calc(100% - 50px);
  z-index: 10;
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

const DealViewFindAddModal = ({ 
  isOpen, 
  onClose, 
  contactData,
  showOnlyCreateTab = false,
  onSave,
  inline = false
}) => {
  const [activeTab, setActiveTab] = useState(showOnlyCreateTab ? 'createNewDeal' : 'addFromList');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [deals, setDeals] = useState([]);
  const [associatedDealIds, setAssociatedDealIds] = useState([]);
  const [relationshipMap, setRelationshipMap] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [dealTags, setDealTags] = useState({});
  const [dealAttachments, setDealAttachments] = useState({});
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  const [editDealModalOpen, setEditDealModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState(null);
  
  // Fetch real deal data and existing associations from the database
  useEffect(() => {
    const fetchData = async () => {
      console.log('=== DealViewFindAddModal fetchData DEBUG ===');
      console.log('contactData:', contactData);
      console.log('contactData.contact_id:', contactData?.contact_id);
      
      if (!contactData?.contact_id) {
        console.log('❌ No contactData.contact_id - exiting fetchData');
        return;
      }
      
      console.log('✅ Proceeding with data fetch...');
      
      try {
        const { supabase } = await import('../../lib/supabaseClient');
        
        console.log('🔍 Fetching all deals...');
        // Fetch all deals
        const { data: dealsData, error: dealsError } = await supabase
          .from('deals')
          .select(`
            deal_id,
            opportunity,
            source_category,
            introducer,
            category,
            stage,
            description,
            total_investment,
            created_by,
            created_at,
            last_modified_by,
            last_modified_at
          `)
          .order('created_at', { ascending: false });
          
        console.log('Deals query result:', { dealsData, dealsError });
          
        if (dealsError) {
          console.error('Error fetching deals:', dealsError);
          return;
        }
        
        console.log('🔍 Fetching deal associations for contact:', contactData.contact_id);
        // Fetch existing deal-contact associations with relationship info
        const { data: associationsData, error: associationsError } = await supabase
          .from('deals_contacts')
          .select('deal_id, relationship')
          .eq('contact_id', contactData.contact_id);
          
        console.log('Associations query result:', { associationsData, associationsError });
          
        if (associationsError) {
          console.error('Error fetching deal associations:', associationsError);
          return;
        }
        
        // Extract deal IDs that are already associated with this contact
        const associatedIds = associationsData?.map(assoc => assoc.deal_id) || [];
        
        // Create a map of deal IDs to their relationship type
        const relationshipMap = {};
        associationsData?.forEach(assoc => {
          relationshipMap[assoc.deal_id] = assoc.relationship;
        });
        
        console.log('📝 Setting deals state:', {
          dealsCount: dealsData?.length || 0,
          associatedIdsCount: associatedIds.length,
          associatedIds,
          relationshipMap
        });
        
        // Set deals and associations data
        setDeals(dealsData || []);
        setAssociatedDealIds(associatedIds);
        setRelationshipMap(relationshipMap);
        
        // If there are associated deals, fetch their tags and attachments
        if (associatedIds.length > 0) {
          try {
            // First fetch just the deal-tag relationships
            const { data: tagsData, error: tagsError } = await supabase
              .from('deal_tags')
              .select(`
                entry_id,
                deal_id,
                tag_id,
                created_at
              `)
              .in('deal_id', associatedIds);
              
            if (tagsError) {
              console.error('Error fetching deal tags:', tagsError);
            } else if (tagsData && tagsData.length > 0) {
              // If we have tags, fetch the tag details separately for safer joining
              const tagIds = tagsData.map(tag => tag.tag_id);
              
              const { data: tagDetails, error: tagDetailsError } = await supabase
                .from('tags')
                .select('tag_id, name')
                .in('tag_id', tagIds);
                
              if (tagDetailsError) {
                console.error('Error fetching tag details:', tagDetailsError);
              } else {
                // Create a map of tag IDs to tag details for quick lookup
                const tagMap = {};
                tagDetails?.forEach(tag => {
                  tagMap[tag.tag_id] = tag;
                });
                
                // Organize tags by deal_id
                const tagsByDeal = {};
                
                tagsData.forEach(tagEntry => {
                  if (!tagsByDeal[tagEntry.deal_id]) {
                    tagsByDeal[tagEntry.deal_id] = [];
                  }
                  
                  const tagDetail = tagMap[tagEntry.tag_id];
                  if (tagDetail) {
                    tagsByDeal[tagEntry.deal_id].push({
                      entry_id: tagEntry.entry_id,
                      tag_id: tagEntry.tag_id,
                      name: tagDetail.name,
                      created_at: tagEntry.created_at
                    });
                  }
                });
                
                console.log('Tag data:', { tagsByDeal, tagsData, tagDetails });
                setDealTags(tagsByDeal);
              }
            }
          } catch (err) {
            console.error('Error fetching deal tags:', err);
          }
          
          try {
            // First fetch just the deal-attachment relationships
            const { data: attachmentsData, error: attachmentsError } = await supabase
              .from('deal_attachments')
              .select(`
                deal_attachment_id,
                deal_id,
                attachment_id,
                created_at,
                created_by
              `)
              .in('deal_id', associatedIds);
              
            if (attachmentsError) {
              console.error('Error fetching deal attachments:', attachmentsError);
            } else if (attachmentsData && attachmentsData.length > 0) {
              // If we have attachments, fetch the attachment details separately
              const attachmentIds = attachmentsData.map(att => att.attachment_id);
              
              const { data: attachmentDetails, error: attachmentDetailsError } = await supabase
                .from('attachments')
                .select('attachment_id, file_name, file_url, file_type, file_size')
                .in('attachment_id', attachmentIds);
                
              if (attachmentDetailsError) {
                console.error('Error fetching attachment details:', attachmentDetailsError);
              } else {
                // Create a map of attachment IDs to attachment details for quick lookup
                const attachmentMap = {};
                attachmentDetails?.forEach(att => {
                  attachmentMap[att.attachment_id] = att;
                });
                
                // Organize attachments by deal_id
                const attachmentsByDeal = {};
                
                attachmentsData.forEach(attachment => {
                  if (!attachmentsByDeal[attachment.deal_id]) {
                    attachmentsByDeal[attachment.deal_id] = [];
                  }
                  
                  const attachmentDetail = attachmentMap[attachment.attachment_id];
                  if (attachmentDetail) {
                    attachmentsByDeal[attachment.deal_id].push({
                      deal_attachment_id: attachment.deal_attachment_id,
                      attachment_id: attachment.attachment_id,
                      filename: attachmentDetail.file_name,
                      file_url: attachmentDetail.file_url,
                      file_type: attachmentDetail.file_type,
                      file_size: attachmentDetail.file_size,
                      created_at: attachment.created_at,
                      created_by: attachment.created_by
                    });
                  }
                });
                
                setDealAttachments(attachmentsByDeal);
              }
            }
          } catch (err) {
            console.error('Error fetching deal attachments:', err);
          }
        }
      } catch (err) {
        console.error('Error in data fetch operation:', err);
      }
    };
    
    fetchData();
  }, [contactData?.contact_id]);
  
  // Filter the deals based on search term and category filter
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = searchTerm === '' || 
      deal.opportunity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.description && deal.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = activeFilter === 'All' || deal.category === activeFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Sort deals by most recent date
  const sortedDeals = [...filteredDeals].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
  
  // Get companies for suggested search
  const suggestedCompanies = contactData?.companies?.map(company => company.name) || [];
  
  // Handle search term change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle filter button click
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };
  
  // Handle suggested search click
  const handleSuggestedSearch = (company) => {
    setSearchTerm(company);
  };
  
  // Format currency for total investment
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Handle association/disassociation of deals with contact
  const handleAssociateToggle = async (dealId) => {
    if (!contactData?.contact_id || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const isCurrentlyAssociated = associatedDealIds.includes(dealId);
      
      if (isCurrentlyAssociated) {
        // Remove the association
        const { error } = await supabase
          .from('deals_contacts')
          .delete()
          .eq('contact_id', contactData.contact_id)
          .eq('deal_id', dealId);
          
        if (error) throw error;
        
        // Update state
        setAssociatedDealIds(prev => prev.filter(id => id !== dealId));
        setRelationshipMap(prev => {
          const updated = {...prev};
          delete updated[dealId];
          return updated;
        });
        
        // Show success notification
        toast.success('Deal disassociated from contact');
      } else {
        // Create a new association with relationship set to 'proposer'
        const { error } = await supabase
          .from('deals_contacts')
          .insert({
            contact_id: contactData.contact_id,
            deal_id: dealId,
            relationship: 'proposer', // Set relationship to proposer
            created_at: new Date().toISOString()
          });
          
        if (error) throw error;
        
        // Update state
        setAssociatedDealIds(prev => [...prev, dealId]);
        setRelationshipMap(prev => ({
          ...prev,
          [dealId]: 'proposer'
        }));
        
        // Show success notification
        toast.success('Deal associated with contact as proposer');
      }
    } catch (err) {
      console.error('Error toggling deal association:', err);
      toast.error(`Failed to update association: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle creating a new deal
  const handleCreateDeal = async (dealFormData) => {
    console.log('=== DEAL CREATION DEBUG START ===');
    console.log('Form data received:', dealFormData);
    
    // For showOnlyCreateTab mode, we don't need a contact
    if (!showOnlyCreateTab && (!contactData?.contact_id || isProcessing)) {
      return;
    }
    
    // For showOnlyCreateTab mode, just check if we're already processing
    if (showOnlyCreateTab && isProcessing) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      
      // Validate required fields
      if (!dealFormData.opportunity?.trim()) {
        toast.error('Deal name is required');
        setIsProcessing(false); // Reset processing state
        return;
      }
      
      // Show loading state
      toast.loading('Creating deal...', { id: 'create-deal' });
      
      // Prepare deal data for database
      const dealData = {
        opportunity: dealFormData.opportunity.trim(),
        category: dealFormData.category || 'Inbox',
        stage: dealFormData.stage || 'Lead',
        source_category: dealFormData.source_category || 'Not Set',
        description: dealFormData.description?.trim() || null,
        total_investment: dealFormData.total_investment ? parseFloat(dealFormData.total_investment) : null,
        created_at: new Date().toISOString(),
        last_modified_at: new Date().toISOString(),
        created_by: 'User',
        last_modified_by: 'User'
      };
      
      console.log('Creating deal with data:', dealData);
      
      // Create the deal in the database
      const { data: newDeal, error: dealError } = await supabase
        .from('deals')
        .insert(dealData)
        .select()
        .single();
        
      if (dealError) {
        console.error('Error creating deal:', dealError);
        throw dealError;
      }
      
      console.log('✅ Deal created successfully:', newDeal);
      
      // Only associate with contact if we have contact data (not in showOnlyCreateTab mode)
      if (!showOnlyCreateTab && contactData?.contact_id) {
        console.log('Associating deal with contact:', contactData.contact_id);
        // Associate the contact with the new deal
        const { error: associationError } = await supabase
          .from('deals_contacts')
          .insert({
            deal_id: newDeal.deal_id,
            contact_id: contactData.contact_id,
            relationship: 'proposer',
            created_at: new Date().toISOString()
          });
          
        if (associationError) {
          console.error('Error creating deal association:', associationError);
          throw associationError;
        }
        console.log('✅ Deal-contact association created');
      }
      
      // Handle attachment if provided (file upload)
      if (dealFormData.attachment && dealFormData.attachment instanceof File) {
        console.log('🔗 ATTACHMENT UPLOAD DEBUG START');
        console.log('📁 File details:', {
          name: dealFormData.attachment.name,
          size: dealFormData.attachment.size,
          type: dealFormData.attachment.type
        });
        
        try {
          // Create a unique file name
          const fileExt = dealFormData.attachment.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `deal-attachments/${fileName}`;
          
          console.log('📂 Upload path:', filePath);
          
          // Upload file to Supabase Storage
          console.log('⬆️ Starting file upload to Supabase Storage...');
          const { data: fileData, error: uploadError } = await supabase
            .storage
            .from('attachments')
            .upload(filePath, dealFormData.attachment, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.error('❌ Error uploading file to storage:', uploadError);
            console.error('Upload error details:', {
              message: uploadError.message,
              statusCode: uploadError.statusCode,
              error: uploadError.error
            });
            // Don't throw - attachment failure shouldn't fail the whole deal creation
          } else {
            console.log('✅ File uploaded to storage successfully:', fileData);
            
            // Get the public URL for the file
            console.log('🔗 Getting public URL...');
            const { data: urlData } = await supabase
              .storage
              .from('attachments')
              .getPublicUrl(filePath);
            
            const fileUrl = urlData.publicUrl;
            console.log('📎 Public URL:', fileUrl);
            
            // Create a new attachment record
            console.log('💾 Creating attachment record in database...');
            const attachmentRecord = {
              file_name: dealFormData.attachment.name,
              file_url: fileUrl,
              file_type: dealFormData.attachment.type,
              file_size: dealFormData.attachment.size,
              processing_status: 'completed',
              created_by: 'User'
            };
            console.log('📋 Attachment record data:', attachmentRecord);
            
            const { data: attachmentData, error: attachmentError } = await supabase
              .from('attachments')
              .insert(attachmentRecord)
              .select()
              .single();
            
            if (attachmentError) {
              console.error('❌ Error creating attachment record:', attachmentError);
              console.error('Attachment error details:', {
                message: attachmentError.message,
                code: attachmentError.code,
                details: attachmentError.details
              });
              // Don't throw - attachment failure shouldn't fail the whole deal creation
            } else {
              console.log('✅ Attachment record created successfully:', attachmentData);
              
              // Link the attachment to the deal
              console.log('🔗 Linking attachment to deal...');
              const linkRecord = {
                deal_id: newDeal.deal_id,
                attachment_id: attachmentData.attachment_id,
                created_by: 'User'
              };
              console.log('🔗 Link record data:', linkRecord);
              
              const { error: linkError } = await supabase
                .from('deal_attachments')
                .insert(linkRecord);
                
              if (linkError) {
                console.error('❌ Error linking attachment to deal:', linkError);
                console.error('Link error details:', {
                  message: linkError.message,
                  code: linkError.code,
                  details: linkError.details
                });
                // Don't throw - attachment linking failure shouldn't fail the deal creation
              } else {
                console.log('✅ Attachment linked to deal successfully');
                console.log('🎉 ATTACHMENT UPLOAD COMPLETE');
              }
            }
          }
        } catch (attachmentErr) {
          console.error('❌ Error processing attachment:', attachmentErr);
          console.error('Attachment processing error details:', attachmentErr);
          // Continue with deal creation even if attachment fails
        }
      } else if (dealFormData.attachment) {
        console.log('⚠️ Attachment field is not empty but not a File object:', typeof dealFormData.attachment, dealFormData.attachment);
      } else {
        console.log('ℹ️ No attachment provided');
      }
      
      // Handle tags if any (non-blocking)
      if (dealFormData.tags && dealFormData.tags.length > 0) {
        console.log('Processing tags:', dealFormData.tags);
        console.log('⚠️  NOTE: Using tables "tags" and "deal_tags" - please verify these are correct!');
        
        for (const tagName of dealFormData.tags) {
          try {
            console.log(`Processing tag: "${tagName}"`);
            
            // First, ensure the tag exists in the tags table
            let { data: existingTag, error: tagSearchError } = await supabase
              .from('tags')
              .select('tag_id')
              .eq('name', tagName)
              .single();
              
            if (tagSearchError && tagSearchError.code !== 'PGRST116') {
              console.error(`❌ Error searching for tag "${tagName}":`, tagSearchError);
              continue;
            }
            
            let tagId;
            if (!existingTag) {
              console.log(`Tag "${tagName}" doesn't exist, creating it...`);
              // Create the tag if it doesn't exist
              const { data: newTag, error: tagCreateError } = await supabase
                .from('tags')
                .insert({ name: tagName })
                .select('tag_id')
                .single();
                
              if (tagCreateError) {
                console.error(`❌ Error creating tag "${tagName}":`, tagCreateError);
                continue;
              }
              tagId = newTag.tag_id;
              console.log(`✅ Created new tag "${tagName}" with ID:`, tagId);
            } else {
              tagId = existingTag.tag_id;
              console.log(`✅ Found existing tag "${tagName}" with ID:`, tagId);
            }
            
            // Associate the tag with the deal
            const { error: tagLinkError } = await supabase
              .from('deal_tags')
              .insert({
                deal_id: newDeal.deal_id,
                tag_id: tagId
              });
              
            if (tagLinkError) {
              console.error(`❌ Error linking tag "${tagName}" to deal:`, tagLinkError);
            } else {
              console.log(`✅ Linked tag "${tagName}" to deal`);
            }
              
          } catch (tagError) {
            console.error(`❌ Error processing tag "${tagName}":`, tagError);
            // Continue processing other tags even if one fails
          }
        }
      }
      
      // Update local state
      setDeals(prev => [newDeal, ...prev]);
      
      // Only update contact-related state if we have contact data
      if (!showOnlyCreateTab && contactData?.contact_id) {
        setAssociatedDealIds(prev => [...prev, newDeal.deal_id]);
        setRelationshipMap(prev => ({
          ...prev,
          [newDeal.deal_id]: 'proposer'
        }));
      }
      
      // Dismiss loading toast and show success
      toast.dismiss('create-deal');
      
      if (showOnlyCreateTab) {
        // Fetch the complete deal data with all related information before notifying parent
        let completeNewDeal = { ...newDeal };
        
        try {
          // Fetch attachments
          const { data: attachmentRefs } = await supabase
            .from('deal_attachments')
            .select('attachment_id')
            .eq('deal_id', newDeal.deal_id);
            
          let attachments = [];
          if (attachmentRefs && attachmentRefs.length > 0) {
            const attachmentIds = attachmentRefs.map(ref => ref.attachment_id);
            const { data: attachmentDetails } = await supabase
              .from('attachments')
              .select('attachment_id, file_name, file_url, file_type, file_size, permanent_url')
              .in('attachment_id', attachmentIds);
            attachments = attachmentDetails || [];
          }
          
          // Fetch tags
          const { data: tagRefs } = await supabase
            .from('deal_tags')
            .select('tag_id')
            .eq('deal_id', newDeal.deal_id);
            
          let tags = [];
          if (tagRefs && tagRefs.length > 0) {
            const tagIds = tagRefs.map(ref => ref.tag_id);
            const { data: tagDetails } = await supabase
              .from('tags')
              .select('tag_id, name')
              .in('tag_id', tagIds);
            tags = tagDetails || [];
          }
          
          // Fetch contacts (will be empty for showOnlyCreateTab but needed for table structure)
          const { data: contactRefs } = await supabase
            .from('deals_contacts')
            .select('contact_id, relationship')
            .eq('deal_id', newDeal.deal_id);
            
          let contacts = [];
          if (contactRefs && contactRefs.length > 0) {
            const contactIds = contactRefs.map(ref => ref.contact_id);
            const { data: contactDetails } = await supabase
              .from('contacts')
              .select('contact_id, first_name, last_name, job_role, profile_image_url, last_interaction_at')
              .in('contact_id', contactIds);
            
            if (contactDetails) {
              contacts = contactDetails.map(contact => {
                const contactRef = contactRefs.find(ref => ref.contact_id === contact.contact_id);
                return {
                  ...contact,
                  relationship: contactRef?.relationship || 'Unknown'
                };
              });
            }
          }
          
          // Create complete deal object with all related data
          completeNewDeal = {
            ...newDeal,
            attachments,
            tags,
            contacts
          };
          
        } catch (fetchError) {
          console.error('Error fetching complete deal data:', fetchError);
          // Fall back to basic deal object with empty arrays
          completeNewDeal = {
            ...newDeal,
            attachments: [],
            tags: [],
            contacts: []
          };
        }
        
        toast.success(`Deal "${newDeal.opportunity}" created successfully`);
        
        // Notify parent component about the complete new deal
        if (onSave) {
          onSave(completeNewDeal);
        }
        
        // Close the modal after successful creation
        onClose();
      } else {
        toast.success(`Deal "${newDeal.opportunity}" created and associated successfully`);
        // Switch to associated deals tab to show the new deal
        setActiveTab('associatedDeals');
      }
      
    } catch (err) {
      console.error('Error creating deal:', err);
      toast.dismiss('create-deal');
      toast.error(`Failed to create deal: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Define the tab content components
  const renderAddFromListTab = () => (
    <ModalContent style={{ alignItems: 'flex-start', padding: '0 10px' }}>
      <SearchContainer>
        <SearchBar>
          <FiSearch size={16} />
          <input 
            type="text"
            placeholder="Search deals by name or description..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </SearchBar>
        
        {suggestedCompanies.length > 0 && (
          <SuggestedSearch>
            Search for company:
            {suggestedCompanies.map((company, index) => (
              <span 
                key={index} 
                onClick={() => handleSuggestedSearch(company)}
              >
                {company}
              </span>
            ))}
          </SuggestedSearch>
        )}
      </SearchContainer>
      
      <FilterContainer>
        <FilterButton 
          $active={activeFilter === 'All'} 
          onClick={() => handleFilterClick('All')}
        >
          All Deals
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Startup'} 
          onClick={() => handleFilterClick('Startup')}
        >
          Startup
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Fund'} 
          onClick={() => handleFilterClick('Fund')}
        >
          Fund
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Real Estate'} 
          onClick={() => handleFilterClick('Real Estate')}
        >
          Real Estate
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Private Debt'} 
          onClick={() => handleFilterClick('Private Debt')}
        >
          Private Debt
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Private Equity'} 
          onClick={() => handleFilterClick('Private Equity')}
        >
          Private Equity
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Others'} 
          onClick={() => handleFilterClick('Others')}
        >
          Others
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'Inbox'} 
          onClick={() => handleFilterClick('Inbox')}
        >
          Inbox
        </FilterButton>
      </FilterContainer>
      
      <DealsList>
        {sortedDeals.length === 0 ? (
          <NoDealsMessage>No deals found matching your criteria</NoDealsMessage>
        ) : (
          sortedDeals.map(deal => {
            const isAssociated = associatedDealIds.includes(deal.deal_id);
            const relationship = relationshipMap[deal.deal_id];
            
            return (
              <DealItem 
                key={deal.deal_id} 
                $isAssociated={isAssociated}
                $relationship={relationship}>
                <DealHeader>
                  <DealTitle>{deal.opportunity}</DealTitle>
                  <DealCategory>{deal.category}</DealCategory>
                </DealHeader>
                <DealInfo>
                  <div>Stage: {deal.stage}</div>
                  <div>Investment: {formatCurrency(deal.total_investment)}</div>
                  {deal.description && <div>{deal.description}</div>}
                  {deal.source_category !== 'Not Set' && <div>Source: {deal.source_category}</div>}
                </DealInfo>
                <DealFooter>
                  <DealDate>Added: {formatDate(deal.created_at)}</DealDate>
                  <AssociateButton
                    $isAssociated={isAssociated}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssociateToggle(deal.deal_id);
                    }}
                    disabled={isProcessing}
                  >
                    {isAssociated ? (
                      <>
                        <FiCheck size={12} /> Associated
                      </>
                    ) : (
                      <>
                        <FiLink size={12} /> Associate
                      </>
                    )}
                  </AssociateButton>
                </DealFooter>
              </DealItem>
            );
          })
        )}
      </DealsList>
    </ModalContent>
  );

  
  // Create New Deal component to avoid hooks rules issues
  const CreateNewDealForm = () => {
    const [dealFormData, setDealFormData] = useState({
      opportunity: '',
      source_category: 'Not Set',
      category: 'Inbox',
      stage: 'Lead',
      description: '',
      total_investment: '',
      attachment: 'None',
      tags: [],
    });
    
    const [dealErrors, setDealErrors] = useState({});
    const [newDealTag, setNewDealTag] = useState('');
    const [showDealTagSuggestions, setShowDealTagSuggestions] = useState(false);
    const [availableTags, setAvailableTags] = useState([]);
    
    // Deal category options
    const categoryOptions = [
      'Inbox', 
      'Startup', 
      'Fund', 
      'Real Estate', 
      'Private Debt', 
      'Private Equity', 
      'Other'
    ];
    
    // Deal stage options
    const stageOptions = [
      'Lead', 
      'Evaluating', 
      'Closing', 
      'Invested', 
      'Monitoring', 
      'Passed'
    ];
    
    // Deal source category options
    const sourceOptions = [
      'Not Set',
      'Cold Contacting',
      'Introduction'
    ];
    
    // Handle input change for the create deal form
    const handleDealInputChange = (e) => {
      const { name, value, type, files } = e.target;
      
      // Handle file inputs differently
      if (type === 'file') {
        setDealFormData(prev => ({
          ...prev,
          [name]: files && files.length > 0 ? files[0] : null
        }));
      } else {
        setDealFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
      
      // Clear errors for this field
      if (dealErrors[name]) {
        setDealErrors(prev => ({
          ...prev,
          [name]: null
        }));
      }
    };
    
    // Handle tag input change
    const handleDealTagInputChange = (e) => {
      const value = e.target.value;
      setNewDealTag(value);
      
      // Filter suggestions based on input
      if (value) {
        const filtered = availableTags.filter(tag => 
          tag.toLowerCase().includes(value.toLowerCase()) && 
          !dealFormData.tags.includes(tag)
        );
        setShowDealTagSuggestions(filtered.length > 0);
      } else {
        setShowDealTagSuggestions(false);
      }
    };
    
    // Handle tag suggestion click
    const handleDealSuggestionClick = (tag) => {
      if (!dealFormData.tags.includes(tag)) {
        setDealFormData({
          ...dealFormData,
          tags: [...dealFormData.tags, tag]
        });
      }
      setNewDealTag('');
      setShowDealTagSuggestions(false);
    };
    
    // Handle adding a tag
    const handleAddDealTag = () => {
      if (newDealTag.trim() && !dealFormData.tags.includes(newDealTag.trim())) {
        setDealFormData({
          ...dealFormData,
          tags: [...dealFormData.tags, newDealTag.trim()]
        });
        setNewDealTag('');
        setShowDealTagSuggestions(false);
      }
    };
    
    // Handle removing a tag
    const handleRemoveDealTag = (tagToRemove) => {
      setDealFormData({
        ...dealFormData,
        tags: dealFormData.tags.filter(tag => tag !== tagToRemove)
      });
    };
    
    // Handle key press in tag input
    const handleDealTagKeyPress = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddDealTag();
      }
    };
    
    // Fetch available tags when the component loads
    useEffect(() => {
      const fetchTags = async () => {
        try {
          const { supabase } = await import('../../lib/supabaseClient');
          // Get all available tags for suggestions
          const { data: allTagsData, error: allTagsError } = await supabase
            .from('tags')
            .select('name')
            .order('name');
            
          if (allTagsError) throw allTagsError;
          
          // Set available tags for suggestions
          setAvailableTags(allTagsData.map(tag => tag.name));
        } catch (error) {
          console.error('Error fetching tags:', error);
        }
      };
      
      fetchTags();
    }, []);
    
    return (
      <ModalContent style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '5px 20px' }}>
        <FormContainer>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleCreateDeal(dealFormData);
          }}>
          
          <FormGroup>
            <FormLabel htmlFor="opportunity">
              <FiInfo size={14} /> Deal Name
            </FormLabel>
            <FormInput
              id="opportunity"
              name="opportunity"
              value={dealFormData.opportunity}
              onChange={handleDealInputChange}
              placeholder="Enter deal name"
                required
            />
            {dealErrors.opportunity && (
              <ErrorMessage>
                <FiAlertTriangle size={12} /> {dealErrors.opportunity}
              </ErrorMessage>
            )}
          </FormGroup>
          
          <FormRow style={{ marginTop: '35px' }}>
            <FormGroup>
              <FormLabel htmlFor="category">
                <FiList size={14} /> Category
              </FormLabel>
              <FormSelect
                id="category"
                name="category"
                value={dealFormData.category}
                onChange={handleDealInputChange}
              >
                {categoryOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </FormSelect>
            </FormGroup>
            
            <FormGroup>
              <FormLabel htmlFor="stage">
                <FiActivity size={14} /> Stage
              </FormLabel>
              <FormSelect
                id="stage"
                name="stage"
                value={dealFormData.stage}
                onChange={handleDealInputChange}
              >
                {stageOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </FormSelect>
            </FormGroup>
          </FormRow>
          
          <FormRow style={{ marginTop: '35px' }}>
            <FormGroup>
              <FormLabel htmlFor="source_category">
                  <FiSearch size={14} /> Source
              </FormLabel>
              <FormSelect
                id="source_category"
                name="source_category"
                value={dealFormData.source_category}
                onChange={handleDealInputChange}
              >
                {sourceOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </FormSelect>
            </FormGroup>
            
            <FormGroup>
              <FormLabel htmlFor="total_investment">
                <FiDollarSign size={14} /> Investment Amount
              </FormLabel>
              <FormInput
                id="total_investment"
                name="total_investment"
                  type="number"
                  step="0.01"
                  min="0"
                value={dealFormData.total_investment}
                onChange={handleDealInputChange}
                placeholder="Enter investment amount"
              />
              {dealErrors.total_investment && (
                <ErrorMessage>
                  <FiAlertTriangle size={12} /> {dealErrors.total_investment}
                </ErrorMessage>
              )}
              <HelpText>Enter numeric value only (no currency symbols)</HelpText>
            </FormGroup>
          </FormRow>
          
          <FormRow style={{ marginTop: '35px' }}>
            <FormGroup>
              <FormLabel htmlFor="attachment">
                <FiPaperclip size={14} /> Attachment
              </FormLabel>
              <FormInput
                id="attachment"
                name="attachment"
                type="file"
                onChange={handleDealInputChange}
                accept="*/*"
              />
              <HelpText>Upload a file to attach to this deal</HelpText>
            </FormGroup>
            
            <FormGroup>
              <FormLabel htmlFor="deal_tags">
                <FiTag size={14} /> Tags
              </FormLabel>
              <div style={{ display: 'flex', gap: '10px', width: '100%', position: 'relative' }}>
                <FormInput
                  id="deal_tags"
                  placeholder="Search or add tag and press Enter"
                  value={newDealTag}
                  onChange={handleDealTagInputChange}
                  onKeyPress={handleDealTagKeyPress}
                  autoComplete="off"
                />
                {showDealTagSuggestions && newDealTag.trim() && (
                  <SuggestionsContainer>
                    {availableTags
                      .filter(tag => 
                        tag.toLowerCase().includes(newDealTag.toLowerCase()) && 
                        !dealFormData.tags.includes(tag)
                      )
                      .slice(0, 8) // Limit to 8 suggestions
                      .map((tag, index) => (
                        <SuggestionItem 
                          key={index} 
                          onClick={() => handleDealSuggestionClick(tag)}
                        >
                          {tag}
                        </SuggestionItem>
                      ))
                    }
                  </SuggestionsContainer>
                )}
              </div>
              <HelpText>Press Enter to add multiple tags</HelpText>
              
              {/* Display tags directly under the search bar */}
              {dealFormData.tags.length > 0 && (
                <TagsContainer style={{ marginTop: '10px' }}>
                  {dealFormData.tags.map(tag => (
                    <Tag key={tag}>
                      {tag}
                        <button type="button" onClick={() => handleRemoveDealTag(tag)}>
                        <FiX size={12} />
                      </button>
                    </Tag>
                  ))}
                </TagsContainer>
              )}
            </FormGroup>
          </FormRow>
          
          <FormGroup style={{ marginTop: '40px' }}>
            <FormLabel htmlFor="description">
              <FiInfo size={14} /> Description
            </FormLabel>
            <FormTextarea
              id="description"
              name="description"
              value={dealFormData.description}
              onChange={handleDealInputChange}
              placeholder="Enter description"
            />
          </FormGroup>
          
          <ButtonGroup style={{ marginTop: '20px', justifyContent: 'flex-end', gap: '15px' }}>
              <SaveButton 
                type="submit" 
                disabled={isProcessing}
              >
              <FiPlus /> Create Deal
            </SaveButton>
          </ButtonGroup>
          </form>
        </FormContainer>
      </ModalContent>
    );
  };
  
  const renderCreateNewDealTab = () => <CreateNewDealForm />;

  // Get associated deals in chronological order (newest first)
  const associatedDeals = deals
    .filter(deal => associatedDealIds.includes(deal.deal_id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Handle attachment download
  const handleDownloadAttachment = (fileUrl, filename) => {
    // Create temporary link
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

  // Handle deal navigation
  const handleDealChange = (index) => {
    setActiveDealIndex(index);
    
    // Scroll to the selected deal item with smooth animation
    const dealItems = document.querySelectorAll('.associated-deal-item');
    if (dealItems && dealItems[index]) {
      dealItems[index].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  };
  
  // Handle opening the edit deal modal
  const handleEditDeal = (deal) => {
    setDealToEdit(deal);
    setEditDealModalOpen(true);
  };
  
  // Handle saving updated deal
  const handleSaveDeal = (updatedDeal) => {
    // Update the deal in the local state
    const updatedDeals = deals.map(deal => 
      deal.deal_id === updatedDeal.deal_id ? updatedDeal : deal
    );
    setDeals(updatedDeals);
  };

  const renderAssociatedDealsTab = () => {
    // If no associated deals, show empty state
    if (associatedDealIds.length === 0) {
      return (
        <ModalContent>
          <EmptyStateMessage>
            <FiLink size={40} />
            <h3>No Deals Associated</h3>
            <p>
              This contact is not yet associated with any deals. 
              Associate existing deals or create a new one.
            </p>
            <AddDealButton onClick={() => setActiveTab('createNewDeal')}>
              <FiPlus size={16} /> Create New Deal
            </AddDealButton>
          </EmptyStateMessage>
        </ModalContent>
      );
    }
    
    // Reset active deal index if it's out of bounds
    if (activeDealIndex >= associatedDeals.length) {
      setActiveDealIndex(0);
    }
    
    // Show list of associated deals
    return (
      <ModalContent style={{ alignItems: 'flex-start', padding: '0' }}>
        {/* Deal navigation pills */}
        {associatedDeals.length > 1 && (
          <DealNavContainer>
            {associatedDeals.map((deal, index) => (
              <DealNavPill 
                key={deal.deal_id}
                $isActive={index === activeDealIndex}
                onClick={() => handleDealChange(index)}
              >
                {deal.opportunity}
                <span className="badge">{relationshipMap[deal.deal_id] || 'Unknown'}</span>
              </DealNavPill>
            ))}
          </DealNavContainer>
        )}
        
        <AssociatedDealsList>
          {associatedDeals.map((deal, index) => {
            const relationship = relationshipMap[deal.deal_id] || 'Unknown';
            const dealTagsList = dealTags[deal.deal_id] || [];
            const dealAttachmentsList = dealAttachments[deal.deal_id] || [];
            
            // Only render the active deal when we have multiple deals
            if (associatedDeals.length > 1 && index !== activeDealIndex) {
              return null;
            }
            
            return (
              <AssociatedDealItem 
                key={deal.deal_id} 
                className="associated-deal-item"
              >
                <DealHeader>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DealTitle>{deal.opportunity}</DealTitle>
                    <RelationshipBadge>{relationship}</RelationshipBadge>
                  </div>
                  <DealCategory>{deal.category}</DealCategory>
                </DealHeader>
                
                <DetailRow>
                  <DetailLabel>Stage:</DetailLabel>
                  <DetailValue>{deal.stage}</DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Investment:</DetailLabel>
                  <DetailValue>{formatCurrency(deal.total_investment)}</DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Source:</DetailLabel>
                  <DetailValue>{deal.source_category || 'Not Set'}</DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Created:</DetailLabel>
                  <DetailValue>{formatDate(deal.created_at)}</DetailValue>
                </DetailRow>
                
                <DetailRow>
                  <DetailLabel>Last Modified:</DetailLabel>
                  <DetailValue>{formatDate(deal.last_modified_at)}</DetailValue>
                </DetailRow>
                
                {deal.description && (
                  <Description>
                    <div className="label">Description</div>
                    {deal.description}
                  </Description>
                )}
                
                {/* Tags section - always show the section title */}
                <SectionDetailTitle>
                  <FiTag size={14} /> Tags {dealTagsList.length === 0 && "(None)"}
                </SectionDetailTitle>
                {dealTagsList.length > 0 ? (
                  <TagsContainer>
                    {dealTagsList.map(tag => (
                      <Tag key={tag.entry_id || tag.tag_id}>
                        <FiTag size={10} /> {tag.name}
                      </Tag>
                    ))}
                  </TagsContainer>
                ) : (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#777', 
                    fontStyle: 'italic',
                    margin: '5px 0 15px 5px'
                  }}>
                    No tags associated with this deal
                  </div>
                )}
                
                {/* Attachments section - always show the section title */}
                <SectionDetailTitle>
                  <FiPaperclip size={14} /> Attachments {dealAttachmentsList.length === 0 && "(None)"}
                </SectionDetailTitle>
                {dealAttachmentsList.length > 0 ? (
                  <AttachmentsContainer>
                    {dealAttachmentsList.map(attachment => (
                      <AttachmentItem key={attachment.deal_attachment_id}>
                        <div className="attachment-name">
                          <FiPaperclip size={14} />
                          {attachment.filename} ({formatFileSize(attachment.file_size)})
                        </div>
                        <DownloadButton 
                          onClick={() => handleDownloadAttachment(attachment.file_url, attachment.filename)}
                        >
                          <FiDownload size={12} /> Download
                        </DownloadButton>
                      </AttachmentItem>
                    ))}
                  </AttachmentsContainer>
                ) : (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#777', 
                    fontStyle: 'italic',
                    margin: '5px 0 15px 5px'
                  }}>
                    No attachments associated with this deal
                  </div>
                )}
                
                <ActionRow>
                  <ActionButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDeal(deal);
                    }}
                  >
                    <FiEdit size={12} /> Edit Deal
                  </ActionButton>
                  <ActionButton 
                    className="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssociateToggle(deal.deal_id);
                    }}
                    disabled={isProcessing}
                  >
                    <FiX size={12} /> Remove Association
                  </ActionButton>
                </ActionRow>
              </AssociatedDealItem>
            );
          })}
        </AssociatedDealsList>
      </ModalContent>
    );
  };

  // If inline mode, render content directly without Modal wrapper
  if (inline) {
    return (
      <div style={{
        padding: '20px',
        width: '100%',
        height: '580px',
        maxHeight: '80vh',
        overflowY: 'auto',
        backgroundColor: '#121212',
        border: '1px solid #333',
        borderRadius: '8px',
        color: '#e0e0e0',
        position: 'relative',
        paddingBottom: '80px'
      }}>
        <ModalHeader>
          <h2>
            {showOnlyCreateTab ? 'Create New Deal' : (
              <>
                Deal - {contactData ? `${contactData.first_name} ${contactData.last_name}` : 'Contact'}
                {contactData && contactData.companies && contactData.companies.length > 0 && 
                  ` (${contactData.companies.map(company => company.name).join(', ')})`
                }
                {associatedDealIds.length > 0 && 
                  <span style={{ 
                    fontSize: '0.7rem', 
                    backgroundColor: 'rgba(0, 255, 0, 0.2)', 
                    color: '#00ff00',
                    marginLeft: '10px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    verticalAlign: 'middle'
                  }}>
                    {associatedDealIds.length} {associatedDealIds.length === 1 ? 'deal' : 'deals'}
                  </span>
                }
              </>
            )}
          </h2>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>
        
        <ContentContainer>
          <TabContainer style={showOnlyCreateTab ? { display: 'none' } : {}}>
            {!showOnlyCreateTab && (
              <>
                <Tab 
                  $isActive={activeTab === 'addFromList'} 
                  onClick={() => setActiveTab('addFromList')}
                >
                  Add from List
                </Tab>
                <Tab 
                  $isActive={activeTab === 'associatedDeals'} 
                  onClick={() => setActiveTab('associatedDeals')}
                >
                  Associated Deals
                  {associatedDealIds.length > 0 && (
                    <span style={{
                      marginLeft: '5px',
                      backgroundColor: 'rgba(0, 255, 0, 0.2)',
                      color: '#00ff00',
                      fontSize: '0.7rem',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      fontWeight: 'normal'
                    }}>
                      {associatedDealIds.length}
                    </span>
                  )}
                </Tab>
              </>
            )}
            <Tab 
              $isActive={activeTab === 'createNewDeal'} 
              onClick={() => setActiveTab('createNewDeal')}
            >
              Create New Deal
            </Tab>
          </TabContainer>
          
          <ContentArea style={showOnlyCreateTab ? { width: '100%' } : {}}>
            {!showOnlyCreateTab && activeTab === 'addFromList' && renderAddFromListTab()}
            {activeTab === 'createNewDeal' && renderCreateNewDealTab()}
            {!showOnlyCreateTab && activeTab === 'associatedDeals' && renderAssociatedDealsTab()}
          </ContentArea>
        </ContentContainer>
        
        {/* Edit Deal Modal */}
        {dealToEdit && (
          <EditDealFinalModal
            isOpen={editDealModalOpen}
            onClose={() => setEditDealModalOpen(false)}
            dealData={dealToEdit}
            onSave={handleSaveDeal}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            width: '55%',
            height: '580px',
            maxHeight: '80vh',
            overflowY: 'auto',
            backgroundColor: '#121212',
            border: '1px solid #333',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
            color: '#e0e0e0',
            zIndex: 1001,
            position: 'relative',
            paddingBottom: '80px'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
          }
        }}
      >
      <ModalHeader>
        <h2>
          {showOnlyCreateTab ? 'Create New Deal' : (
            <>
              Deal - {contactData ? `${contactData.first_name} ${contactData.last_name}` : 'Contact'}
              {contactData && contactData.companies && contactData.companies.length > 0 && 
                ` (${contactData.companies.map(company => company.name).join(', ')})`
              }
              {associatedDealIds.length > 0 && 
                <span style={{ 
                  fontSize: '0.7rem', 
                  backgroundColor: 'rgba(0, 255, 0, 0.2)', 
                  color: '#00ff00',
                  marginLeft: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  verticalAlign: 'middle'
                }}>
                  {associatedDealIds.length} {associatedDealIds.length === 1 ? 'deal' : 'deals'}
                </span>
              }
            </>
          )}
        </h2>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      <ContentContainer>
        <TabContainer style={showOnlyCreateTab ? { display: 'none' } : {}}>
          {!showOnlyCreateTab && (
            <>
              <Tab 
                $isActive={activeTab === 'addFromList'} 
                onClick={() => setActiveTab('addFromList')}
              >
                Add from List
              </Tab>
              <Tab 
                $isActive={activeTab === 'associatedDeals'} 
                onClick={() => setActiveTab('associatedDeals')}
              >
                Associated Deals
                {associatedDealIds.length > 0 && (
                  <span style={{
                    marginLeft: '5px',
                    backgroundColor: 'rgba(0, 255, 0, 0.2)',
                    color: '#00ff00',
                    fontSize: '0.7rem',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    fontWeight: 'normal'
                  }}>
                    {associatedDealIds.length}
                  </span>
                )}
              </Tab>
            </>
          )}
          <Tab 
            $isActive={activeTab === 'createNewDeal'} 
            onClick={() => setActiveTab('createNewDeal')}
          >
            Create New Deal
          </Tab>
        </TabContainer>
        
        <ContentArea style={showOnlyCreateTab ? { width: '100%' } : {}}>
          {!showOnlyCreateTab && activeTab === 'addFromList' && renderAddFromListTab()}
          {activeTab === 'createNewDeal' && renderCreateNewDealTab()}
          {!showOnlyCreateTab && activeTab === 'associatedDeals' && renderAssociatedDealsTab()}
        </ContentArea>
      </ContentContainer>
      
      {/* Bottom buttons removed */}
    </Modal>
      
      {/* Edit Deal Modal */}
      {dealToEdit && (
        <EditDealFinalModal
          isOpen={editDealModalOpen}
          onClose={() => setEditDealModalOpen(false)}
          dealData={dealToEdit}
          onSave={handleSaveDeal}
        />
      )}
    </>
  );
};

export default DealViewFindAddModal;