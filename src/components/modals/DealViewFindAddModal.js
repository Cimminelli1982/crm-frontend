import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { FiX, FiSearch, FiFilter, FiPlus, FiLink, FiCheck, FiCalendar, FiDollarSign, FiInfo, FiTag, FiPaperclip, FiDownload, FiEdit } from 'react-icons/fi';
import EditDealFinalModal from './EditDealFinalModal';
import toast from 'react-hot-toast';

// Setup Modal for React
Modal.setAppElement('#root');

// Styled components
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

const SectionTitle = styled.div`
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
  contactData 
}) => {
  const [activeTab, setActiveTab] = useState('addFromList');
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
      if (!contactData?.contact_id) return;
      
      try {
        const { supabase } = await import('../../lib/supabaseClient');
        
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
          
        if (dealsError) {
          console.error('Error fetching deals:', dealsError);
          return;
        }
        
        // Fetch existing deal-contact associations with relationship info
        const { data: associationsData, error: associationsError } = await supabase
          .from('deals_contacts')
          .select('deal_id, relationship')
          .eq('contact_id', contactData.contact_id);
          
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

  const renderCreateNewDealTab = () => (
    <ModalContent>
      <ComingSoonMessage>
        <div className="emoji">🚧</div>
        <p>Create New Deal Feature</p>
        <p>Coming Soon</p>
      </ComingSoonMessage>
    </ModalContent>
  );

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
                <SectionTitle>
                  <FiTag size={14} /> Tags {dealTagsList.length === 0 && "(None)"}
                </SectionTitle>
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
                <SectionTitle>
                  <FiPaperclip size={14} /> Attachments {dealAttachmentsList.length === 0 && "(None)"}
                </SectionTitle>
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
            padding: '25px',
            width: '65%',
            height: '661px', /* 575px increased by another 15% */
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
        </h2>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      <ContentContainer>
        <TabContainer>
          <Tab 
            $isActive={activeTab === 'addFromList'} 
            onClick={() => setActiveTab('addFromList')}
          >
            Add from List
          </Tab>
          <Tab 
            $isActive={activeTab === 'createNewDeal'} 
            onClick={() => setActiveTab('createNewDeal')}
          >
            Create New Deal
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
        </TabContainer>
        
        <ContentArea>
          {activeTab === 'addFromList' && renderAddFromListTab()}
          {activeTab === 'createNewDeal' && renderCreateNewDealTab()}
          {activeTab === 'associatedDeals' && renderAssociatedDealsTab()}
        </ContentArea>
      </ContentContainer>
      
      <ButtonGroup>
        <CancelButton onClick={onClose}>
          <FiX /> Close
        </CancelButton>
      </ButtonGroup>
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