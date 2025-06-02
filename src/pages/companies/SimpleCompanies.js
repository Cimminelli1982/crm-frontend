import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { FiList, FiInbox, FiCpu, FiDollarSign, FiBriefcase, FiUser, FiPackage, FiEdit2, FiPlus, FiTrash2, FiPaperclip, FiLinkedin, FiFileText } from 'react-icons/fi';
import { MdClear } from 'react-icons/md';
import NewEditCompanyModal from '../../components/modals/NewEditCompanyModal';
import CompanyTagsModal from '../../components/modals/CompanyTagsModal';
import CompanyNotesModal from '../../components/modals/CompanyNotesModal';
import toast from 'react-hot-toast';
import AssociateContactModal from '../../components/modals/AssociateContactModal';

// Styled components
const Container = styled.div`
  padding: 0 20px 20px 20px;
  height: calc(100vh - 120px);
  width: 100%;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Title = styled.h1`
  color: #00ff00;
  margin-bottom: 20px;
  font-family: 'Courier New', monospace;
`;

const ErrorText = styled.div`
  color: #ff3333;
  background-color: #330000;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const LoadingContainer = styled.div`
  color: #00ff00;
  text-align: center;
  padding: 40px;
  font-family: monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
`;

const LoadingBar = styled.div`
  width: 300px;
  height: 8px;
  background-color: #111;
  margin: 20px 0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 30%;
    background-color: #00ff00;
    animation: pulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 20px #00ff00;
    border-radius: 4px;
  }
  
  @keyframes pulse {
    0% {
      left: -30%;
      opacity: 0.8;
    }
    100% {
      left: 100%;
      opacity: 0.2;
    }
  }
`;

const LoadingText = styled.div`
  margin-top: 15px;
  color: #00ff00;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  letter-spacing: 1px;
  font-size: 16px;
  opacity: 0.9;
  animation: blink 1.5s ease-in-out infinite alternate;
  
  @keyframes blink {
    from { opacity: 0.6; }
    to { opacity: 1; }
  }
`;

const LoadingMatrix = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #00ff00;
  text-align: center;
  margin-top: 30px;
  height: 100px;
  width: 300px;
  overflow: hidden;
  position: relative;
  
  &:after {
    content: "01001100 01101111 01100001 01100100 01101001 01101110 01100111 00100000 01000011 01101111 01101101 01110000 01100001 01101110 01101001 01100101 01110011 00101110 00101110 00101110";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(to bottom, transparent, #000 80%);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    opacity: 0.7;
    text-shadow: 0 0 5px #00ff00;
    animation: matrix 5s linear infinite;
  }
  
  @keyframes matrix {
    0% { transform: translateY(-60px); }
    100% { transform: translateY(60px); }
  }
`;

// Style for the top menu (matches SimpleDeals.js)
const TopMenuContainer = styled.div`
  display: flex;
  background-color: #111;
  border-bottom: 1px solid #333;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #00ff00 #222;
  padding: 8px 0;
  margin-bottom: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  height: 48px;
  align-items: center;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

// Style for the menu items (matches SimpleDeals.js)
const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: ${props => props.$active ? '#00ff00' : '#888'};
  background-color: ${props => props.$active ? '#1a1a1a' : 'transparent'};
  border: ${props => props.$active ? '1px solid #00ff00' : '1px solid transparent'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '400'};
  white-space: nowrap;
  margin: 0 4px;
  transition: all 0.2s ease;
  min-width: fit-content;
  
  &:hover {
    color: #00ff00;
    background-color: #1a1a1a;
    border-color: #00ff00;
  }
  
  svg {
    font-size: 16px;
    flex-shrink: 0;
  }
`;

// Tag styled components (matching ContactsListTable)
const TagContainer = styled.div`
  display: flex;
  gap: 1px;
  align-items: center;
  height: 100%;
`;

const TagItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
  color: #00ff00;
  padding: 0px 6px;
  border-radius: 4px;
  font-size: 11px;
  border: 1px solid #00ff00;
  box-shadow: 0 0 4px rgba(0, 255, 0, 0.4);
  white-space: nowrap;
  overflow: visible;
  line-height: 16px;
  max-width: fit-content;
  height: 18px;
  
  button {
    background: none;
    border: none;
    color: #00ff00;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      color: #33ff33;
      transform: scale(1.2);
    }
  }
`;

const AddTagButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  border-radius: 3px;
  width: 16px;
  height: 16px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.1);
  }
`;

// Tags renderer (matching ContactsListTable UX/UI exactly)
const TagsRenderer = (props) => {
  const [showModal, setShowModal] = React.useState(false);
  const tags = props.value || [];
  const company = props.data;
  
  if (!tags.length && !company) return '';
  
  // Get first 2 tags to display
  const visibleTags = tags.slice(0, 2);
  const remainingCount = tags.length - 2;
  
  // If no tags, show "Add tags" text instead of the plus button
  const showAddTagsText = tags.length === 0;
  
  const handleRemoveTag = async (e, tagId) => {
    e.stopPropagation(); // Prevent row selection
    
    try {
      // Find the tag being removed for the notification
      const tagToRemove = tags.find(tag => tag.id === tagId);
      
      // Delete the tag relationship
      const { error } = await supabase
        .from('company_tags')
        .delete()
        .eq('company_id', company.company_id)
        .eq('tag_id', tagId);
        
      if (error) throw error;
      
      // Update the local data
      const updatedTags = tags.filter(tag => tag.id !== tagId);
      props.setValue(updatedTags);
      
      // Refresh the data in the grid
      if (props.api) {
        props.api.refreshCells({
          force: true,
          rowNodes: [props.node],
          columns: ['tags']
        });
      }
      
      // Show success toast notification
      toast.success(`Tag "${tagToRemove?.name || 'Unknown'}" removed from ${company.name}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (err) {
      console.error('Error removing tag:', err);
      toast.error(`Error removing tag: ${err.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
  };
  
  const handleAddTagClick = (e) => {
    e.stopPropagation(); // Prevent row selection
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    
    // After closing the modal, refresh the entire table to show the latest changes
    if (props.api) {
      // First refresh the specific cell for immediate visual feedback
      props.api.refreshCells({
        force: true,
        rowNodes: [props.node],
        columns: ['tags']
      });
      
      // Then initiate a full data refresh via the grid's parent component
      setTimeout(() => {
        if (props.context && props.context.refreshData) {
          props.context.refreshData();
        }
      }, 100);
    }
  };
  
  const handleTagAdded = (tag) => {
    // Refresh the cell data after tag is added
    if (props.api) {
      props.api.refreshCells({
        force: true,
        rowNodes: [props.node],
        columns: ['tags']
      });
    }
  };
  
  const handleTagRemoved = (tag) => {
    // Refresh the cell data after tag is removed
    if (props.api) {
      props.api.refreshCells({
        force: true,
        rowNodes: [props.node],
        columns: ['tags']
      });
    }
  };
  
  // We'll stop event propagation on the container to prevent row selection when clicking tags
  const handleContainerClick = (e) => {
    e.stopPropagation();
  };
  
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
    <TagContainer 
      onClick={handleContainerClick}
      style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        paddingRight: '0',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {visibleTags.map(tag => (
        <TagItem key={tag.id} title={tag.name}>
          {tag.name.length > 15 ? `${tag.name.substring(0, 15)}...` : tag.name}
          <button 
            onClick={(e) => handleRemoveTag(e, tag.id)} 
            title="Remove tag"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '5px',
              padding: '0',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <MdClear style={{ color: '#00ff00' }} size={14} />
          </button>
        </TagItem>
      ))}
      
      {remainingCount > 0 && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0px 3px',
            borderRadius: '3px',
            fontSize: '9px',
            color: '#999999',
            cursor: 'pointer',
            height: '16px',
            lineHeight: '16px',
            backgroundColor: '#333333',
            marginRight: '1px'
          }}
          onClick={handleAddTagClick}
        >
          +{remainingCount}
        </div>
      )}
      
      {showAddTagsText ? (
        <div
          onClick={handleAddTagClick}
          style={{
            color: '#00ff00',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            width: '100%',
            height: '100%'
          }}
          title="Add or edit tags"
        >
          Add tags
        </div>
      ) : (
        <AddTagButton 
          onClick={handleAddTagClick}
          title="Add or edit tags"
        >
          <FiPlus size={10} />
        </AddTagButton>
      )}
      
      {showModal && (
        <CompanyTagsModal
          isOpen={showModal}
          onRequestClose={handleCloseModal}
          company={{
            ...company,
            id: company.company_id // Map company_id to id for the modal
          }}
        />
      )}
    </TagContainer>
    </div>
  );
};

// Deals renderer - shows number of deals for the company
const DealsRenderer = (props) => {
  const deals = props.value || [];
  const dealCount = deals.length;
  
  if (dealCount === 0) {
    return (
      <div style={{ 
        color: '#888',
        fontSize: '13px'
      }}>
        0
      </div>
    );
  }
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#00ff00',
      fontSize: '13px',
      cursor: 'pointer',
      width: '100%',
      height: '100%'
    }}
    onClick={(e) => {
      e.stopPropagation();
      // TODO: Navigate to deals for this company
      console.log('View deals for company:', props.data?.name);
    }}
    title={`View ${dealCount} deal${dealCount !== 1 ? 's' : ''}`}
    >
      {dealCount}
    </div>
  );
};

// Actions renderer - shows action buttons for each company
const ActionsRenderer = (props) => {
  const handleEdit = (e) => {
    e.stopPropagation();
    if (props.data && props.data.company_id) {
      props.context.setSelectedCompany(props.data);
      props.context.setShowEditModal(true);
    }
  };
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (props.data && props.data.company_id) {
      const companyName = props.data.name || 'this company';
      if (window.confirm(`Are you sure you want to delete ${companyName}? This action cannot be undone.`)) {
        // Disable the button during deletion
        const button = e.currentTarget;
        const originalContent = button.innerHTML;
        button.disabled = true;
        button.style.opacity = '0.5';
        button.innerHTML = '<div style="width: 14px; height: 14px; border: 2px solid #00ff00; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
        
        try {
          const companyId = props.data.company_id;
          console.log(`Starting deletion process for company ${companyId}`);
          
          // STEP 1: Delete company-tag relationships (junction table)
          console.log(`Deleting company tags for company ${companyId}`);
          const { error: tagsError } = await supabase
            .from('company_tags')
            .delete()
            .eq('company_id', companyId);
            
          if (tagsError) {
            console.error('Error deleting company tags:', tagsError);
            throw new Error(`Failed to delete company tags: ${tagsError.message}`);
          }
          
          // STEP 2: Delete company-city relationships (junction table)
          console.log(`Deleting company cities for company ${companyId}`);
          const { error: citiesError } = await supabase
            .from('company_cities')
            .delete()
            .eq('company_id', companyId);
            
          if (citiesError) {
            console.error('Error deleting company cities:', citiesError);
            throw new Error(`Failed to delete company cities: ${citiesError.message}`);
          }
          
          // STEP 3: Delete company-contact relationships (junction table)
          console.log(`Deleting company-contact relationships for company ${companyId}`);
          const { error: contactsError } = await supabase
            .from('contact_companies')
            .delete()
            .eq('company_id', companyId);
            
          if (contactsError) {
            console.error('Error deleting company contacts:', contactsError);
            throw new Error(`Failed to delete company contacts: ${contactsError.message}`);
          }
          
          // STEP 4: Finally, delete the company record itself
          console.log(`Deleting company ${companyId}`);
          const { error: companyError } = await supabase
            .from('companies')
            .delete()
            .eq('company_id', companyId);
            
          if (companyError) {
            console.error('Error deleting company record:', companyError);
            throw new Error(`Failed to delete company: ${companyError.message}`);
          }
          
          console.log(`Company ${companyId} successfully deleted`);
          
          // Refresh the grid to remove the deleted company
          if (props.context && props.context.refreshData) {
            props.context.refreshData();
          } else if (props.api) {
            props.api.refreshInfiniteCache();
          }
          
          // Show success message
          alert(`Company "${companyName}" has been successfully deleted.`);
          
        } catch (error) {
          console.error('Error deleting company:', error);
          alert(`Failed to delete company: ${error.message}`);
          
          // Restore button state on error
          button.disabled = false;
          button.style.opacity = '0.7';
          button.innerHTML = originalContent;
        }
      }
    }
  };
  
  const handleLinkedIn = (e) => {
    e.stopPropagation();
    const company = props.data;
    
    if (company.linkedin) {
      // Case 1: LinkedIn URL exists - open it directly
      const linkedinUrl = company.linkedin.startsWith('http') 
        ? company.linkedin 
        : `https://${company.linkedin}`;
      window.open(linkedinUrl, '_blank');
    } else {
      // Case 2: No LinkedIn URL - search for company on LinkedIn
      const companyName = company.name || '';
      const encodedCompanyName = encodeURIComponent(companyName);
      const linkedinSearchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodedCompanyName}`;
      window.open(linkedinSearchUrl, '_blank');
    }
  };
  
  const handleNotes = (e) => {
    e.stopPropagation();
    const company = props.data;
    
    if (company && company.company_id) {
      // Set the selected company and open the notes modal
      props.context.setSelectedCompany(company);
      props.context.setShowNotesModal(true);
    }
  };
  
  // Check if company has notes (either in description field or notes_companies table)
  const hasNotes = () => {
    const company = props.data;
    if (!company) return false;
    
    // Only check if description field has content
    // The modal will handle checking for actual notes existence
    const hasDescription = company.description && company.description.trim().length > 0;
    
    // Exclude placeholder/empty descriptions that don't contain real information
    if (hasDescription) {
      const description = company.description.trim().toLowerCase();
      const placeholderTexts = [
        'no specific information found',
        'no information found',
        'no description available',
        'description not available',
        'no details available',
        'information not available',
        'no data available',
        'not specified',
        'n/a',
        'tbd',
        'to be determined',
        'unknown',
        'no description',
        'no info'
      ];
      
      // Check if description is just a placeholder
      const isPlaceholder = placeholderTexts.some(placeholder => 
        description === placeholder || 
        description.includes(placeholder)
      );
      
      if (isPlaceholder) {
        return false;
      }
    }
    
    return hasDescription;
  };
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      height: '100%'
    }}>
      <button
        onClick={handleEdit}
        style={{
          background: 'none',
          border: 'none',
          color: '#00ff00',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: '0.7',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        title="Edit Company"
      >
        <FiEdit2 size={14} />
      </button>
      
      <button
        onClick={handleLinkedIn}
        style={{
          background: 'none',
          border: 'none',
          color: props.data?.linkedin ? '#00ff00' : '#888888',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: '0.7',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        title={props.data?.linkedin ? "Open LinkedIn page" : "Search on LinkedIn"}
      >
        <FiLinkedin size={14} />
      </button>
      
      <button
        onClick={handleNotes}
        style={{
          background: 'none',
          border: 'none',
          color: hasNotes() ? '#00ff00' : '#888888',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: '0.7',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        title={hasNotes() ? "View Company Description & Notes" : "Add Notes"}
      >
        <FiFileText size={14} />
      </button>
      
      <button
        onClick={handleDelete}
        style={{
          background: 'none',
          border: 'none',
          color: '#00ff00',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: '0.7',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        title="Delete Company"
      >
        <FiTrash2 size={14} />
      </button>
    </div>
  );
};

// Simple contacts renderer
const ContactsRenderer = (props) => {
  const [currentContactIndex, setCurrentContactIndex] = React.useState(0);
  const [showAssociateModal, setShowAssociateModal] = React.useState(false);
  
  const contacts = props.value || [];
  const companyId = props.data?.company_id;
  const hasMultipleContacts = contacts.length > 1;
  
  // Debug logging for multiple contacts
  if (contacts.length > 0) {
    console.log(`Company ${props.data?.name}: ${contacts.length} contacts, hasMultipleContacts: ${hasMultipleContacts}`);
  }
  
  // Handle associating a contact
  const handleAssociateContact = (e) => {
    e?.stopPropagation(); // Prevent row selection
    setShowAssociateModal(true);
  };
  
  // Navigation function for contact carousel
  const goToNextContact = (e) => {
    e?.stopPropagation();
    setCurrentContactIndex((prevIndex) => (prevIndex + 1) % contacts.length);
  };
  
  // Handle removing a contact association
  const handleRemoveContact = async (contactId, e) => {
    e?.stopPropagation(); // Prevent row selection
    
    if (!companyId || !contactId) return;
    
    try {
      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('company_id', companyId)
        .eq('contact_id', contactId);
        
      if (error) throw error;
      
      // Success message
      toast.success('Contact association removed');
      
      // Refresh the grid
      if (props.api) {
        props.api.refreshCells({ force: true });
      }
      
      // Initiate a full data refresh
      setTimeout(() => {
        if (props.context && props.context.refreshData) {
          props.context.refreshData();
        }
      }, 100);
    } catch (error) {
      console.error('Error removing contact association:', error);
      toast.error('Failed to remove contact association');
    }
  };
  
  // Handle contact association completion
  const handleContactAssociated = (result) => {
    console.log('handleContactAssociated called with result:', result);
    setShowAssociateModal(false);
    
    // Immediate grid refresh
    if (props.api) {
      console.log('Refreshing grid cells immediately');
      props.api.refreshCells({ force: true });
    }
    
    // Full data refresh
    if (props.context && props.context.refreshData) {
      console.log('Calling refreshData after contact association');
      setTimeout(() => {
        props.context.refreshData();
      }, 500); // Increased delay to allow for database propagation
    } else {
      console.error('refreshData not available in context:', props.context);
    }
  };
  
  // Prevent event propagation
  const handleContainerClick = (e) => {
    e.stopPropagation();
  };

  if (!contacts.length) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%'
      }}
      onClick={handleContainerClick}
      >
        <div
          onClick={handleAssociateContact}
          style={{
            color: '#ffffff',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Associate Contact"
        >
          Add contacts
        </div>
        
        {showAssociateModal && (
          <AssociateContactModal 
            isOpen={showAssociateModal}
            onRequestClose={() => setShowAssociateModal(false)}
            companyId={companyId}
            onContactAssociated={handleContactAssociated}
          />
        )}
      </div>
    );
  }
  
  // Current contact to display
  const currentContact = contacts[currentContactIndex];
  const fullName = [currentContact.first_name || '', currentContact.last_name || ''].filter(Boolean).join(' ') || 'Unnamed';
  
  // Navigation button styles
  const navButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '14px',
    height: '14px',
    fontSize: '10px',
    opacity: '0.8'
  };
  
  // Fixed row height
  const rowHeight = 36;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: rowHeight + 'px',
      minHeight: rowHeight + 'px',
      width: '100%',
      position: 'relative'
    }}
    onClick={handleContainerClick}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        gap: '2px'
      }}>
        {/* Contact display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          padding: '0px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          border: '1px solid #ffffff',
          boxShadow: '0 0 4px rgba(255, 255, 255, 0.2)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          lineHeight: '16px',
          width: 'fit-content',
          maxWidth: hasMultipleContacts ? '140px' : '160px',
          height: '18px',
          position: 'relative'
        }}>
          <span style={{
            cursor: 'pointer',
            maxWidth: hasMultipleContacts ? '120px' : '160px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'inline-block'
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Could add navigation to contact details here
            console.log('Contact clicked:', currentContact);
          }}
          title={`${fullName}${currentContact.job_role ? ` - ${currentContact.job_role}` : ''}`}
          >
            {fullName}
          </span>
          
          {/* Counter indicator for multiple contacts */}
          {hasMultipleContacts && (
            <div style={{
              fontSize: '9px',
              color: '#cccccc',
              marginLeft: '4px',
              padding: '0 2px',
              borderRadius: '3px',
              backgroundColor: '#333333'
            }}>
              {currentContactIndex + 1}/{contacts.length}
            </div>
          )}
          
          <button
            onClick={(e) => handleRemoveContact(currentContact.contact_id, e)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '4px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Remove Contact Association"
          >
            <MdClear size={14} />
          </button>
        </div>
        
        {/* Right navigation arrow (only visible for multiple contacts) */}
        {hasMultipleContacts && (
          <button
            onClick={goToNextContact}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '14px',
              height: '14px',
              fontSize: '10px',
              opacity: '0.8'
            }}
            title="Next contact"
          >
            &#9654;
          </button>
        )}
        
        {/* Add contact button */}
        <button 
          onClick={handleAssociateContact}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            borderRadius: '4px',
            width: '20px',
            height: '20px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          title="Associate Contact"
        >
          <FiPlus size={14} />
        </button>
      </div>
      
      {showAssociateModal && (
        <AssociateContactModal 
          isOpen={showAssociateModal}
          onRequestClose={() => setShowAssociateModal(false)}
          companyId={companyId}
          onContactAssociated={handleContactAssociated}
        />
      )}
    </div>
  );
};

// Category dropdown renderer for editing company categories
const CategoryRenderer = (props) => {
  // Get the actual category value from the correct field
  const actualValue = props.value || props.data?.category || 'Not Set';
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(actualValue);
  
  // Available category options from the database
  const categoryOptions = [
    'Inbox', 
    'Professional Investor', 
    'Institution', 
    'Advisory', 
    'Startup', 
    'SME', 
    'Corporation', 
    'Media', 
    'Corporate', 
    'Not Set'
  ];
  
  const handleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  const handleSave = async (newValue) => {
    if (newValue === selectedValue) {
      setIsEditing(false);
      return;
    }
    
    try {
      // Update the database - use 'category' field
      const { error } = await supabase
        .from('companies')
        .update({ category: newValue })
        .eq('company_id', props.data.company_id);
        
      if (error) throw error;
      
      // Update local state
      setSelectedValue(newValue);
      props.setValue(newValue);
      
      // Update the data object
      props.data.category = newValue;
      
      // Refresh the grid
      if (props.api) {
        props.api.refreshCells({
          force: true,
          rowNodes: [props.node],
          columns: ['category']
        });
      }
      
      setIsEditing(false);
      
      // Show success message
      toast.success(`Category updated to "${newValue}" for ${props.data.name}`);
      
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(`Failed to update category: ${error.message}`);
      setIsEditing(false);
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <select
        value={selectedValue}
        onChange={(e) => handleSave(e.target.value)}
        onBlur={handleCancel}
        autoFocus
        style={{
          background: '#1a1a1a',
          color: '#00ff00',
          border: '1px solid #00ff00',
          borderRadius: '4px',
          padding: '4px',
          fontSize: '13px',
          width: '100%',
          height: '100%'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {categoryOptions.map(option => (
          <option key={option} value={option} style={{ background: '#1a1a1a', color: '#00ff00' }}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  
  return (
    <div
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        padding: '4px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        color: selectedValue === 'Not Set' ? '#888' : '#e0e0e0'
      }}
      title="Click to edit category"
    >
      {selectedValue || 'Not Set'}
    </div>
  );
};

// Website link renderer
const WebsiteRenderer = (props) => {
  const website = props.value;
  if (!website) return '-';
  
  // Extract domain name for display
  let displayUrl = website;
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    displayUrl = url.hostname.replace('www.', '');
  } catch (e) {
    // If URL parsing fails, just display as is
  }
  
  return (
    <a 
      href={website.startsWith('http') ? website : `https://${website}`} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{
        color: '#00ff00',
        textDecoration: 'none',
        fontSize: '13px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {displayUrl}
    </a>
  );
};

// Company name renderer (matches Name column UX from ContactsListTable)
// Updated: 2024-12-19 - Force cache refresh
const CompanyRenderer = (props) => {
  const companyName = props.value;
  if (!companyName) return '-';
  
  // Make company name clickable (placeholder for future navigation)
  const handleClick = () => {
    if (props.data && props.data.company_id) {
      // navigate(`/companies/${props.data.company_id}`);
      console.log('Company clicked:', props.data);
    }
  };
  
  return (
    <div 
      style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'pointer',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center'
      }}
      onClick={handleClick}
    >
      {companyName}
    </div>
  );
};

const SimpleCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const navigate = useNavigate();
  
  // Menu tab state
  const [activeTab, setActiveTab] = useState('full_list');
  
  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Define menu items with icons
  const menuItems = [
    { id: 'full_list', name: 'Full List', icon: <FiList /> },
    { id: 'inbox', name: 'Inbox', icon: <FiInbox /> },
    { id: 'startup', name: 'Startup', icon: <FiCpu /> },
    { id: 'investors', name: 'Investors', icon: <FiDollarSign /> },
    { id: 'institutions', name: 'Institutions', icon: <FiBriefcase /> },
    { id: 'advisor', name: 'Advisor', icon: <FiUser /> },
    { id: 'others', name: 'Others', icon: <FiPackage /> }
  ];
  
  // Function to get filtered companies based on active tab
  const getFilteredCompanies = useMemo(() => {
    if (activeTab === 'full_list') {
      return companies;
    }
    
    // Map filter tabs to database category values
    const categoryMapping = {
      'investors': 'Professional Investor',
      'advisor': 'Advisory', 
      'inbox': 'Inbox',
      'startup': 'Startup',
      'institutions': 'Institution'
    };
    
    if (activeTab === 'others') {
      // Show companies that don't match any of the defined categories
      const definedCategories = Object.values(categoryMapping);
      const filtered = companies.filter(company => {
        const category = company.category;
        return !definedCategories.includes(category);
      });
      return filtered;
    }
    
    // Filter by specific category
    const targetCategory = categoryMapping[activeTab];
    if (targetCategory) {
      const filtered = companies.filter(company => {
        const category = company.category;
        return category === targetCategory;
      });
      return filtered;
    }
    
    return companies;
  }, [companies, activeTab]);

  // Column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Company', 
      field: 'name',
      cellRenderer: CompanyRenderer,
      minWidth: 150,
      flex: 2,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left'
    },
    { 
      headerName: 'Associated Contacts', 
      field: 'contacts',
      cellRenderer: ContactsRenderer,
      minWidth: 180,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: false,
    },
    { 
      headerName: 'Tags', 
      field: 'tags',
      cellRenderer: TagsRenderer,
      minWidth: 220,
      width: 250,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: false,
      cellStyle: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '0'
      }
    },
    { 
      headerName: 'Deals', 
      field: 'deals',
      cellRenderer: DealsRenderer,
      minWidth: 80,
      width: 100,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: false,
      cellStyle: { textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }
    },
    { 
      headerName: 'Category', 
      field: 'category',
      cellRenderer: CategoryRenderer,
      minWidth: 120,
      width: 140,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Actions', 
      field: 'actions',
      cellRenderer: ActionsRenderer,
      minWidth: 120,
      width: 120,
      sortable: false,
      filter: false,
      pinned: 'right'
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
  }), []);

  // Grid ready event handler
  const onGridReady = React.useCallback((params) => {
    console.log('Grid is ready');
    setGridApi(params.api);
    
    // Wait for a tick to ensure grid is properly initialized
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 0);
  }, []);

  // Row clicked handler
  const handleRowClicked = React.useCallback((params) => {
    // Navigate to company details page
    if (params.data && params.data.company_id) {
      // navigate(`/companies/${params.data.company_id}`);
      console.log('Company clicked:', params.data);
    }
  }, [navigate]);

  // Fetch companies data
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Helper function to retry failed Supabase requests
      const retrySupabaseRequest = async (request, maxRetries = 3, delay = 1000) => {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await request();
          } catch (err) {
            lastError = err;
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            // Increase delay for next attempt (exponential backoff)
            delay *= 1.5;
          }
        }
        // If we get here, all retries failed
        throw lastError;
      };
      
      setLoading('Accessing Companies data...');
      
      // First, fetch all companies (excluding "Skip" category) using pagination to get more than default 1000 limit
      let allCompanies = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: pageData, error: pageError } = await retrySupabaseRequest(async () => {
          setLoading(`Loading companies page ${page + 1}...`);
          return supabase
            .from('companies')
            .select('*')
            .not('category', 'eq', 'Skip')
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);
        });
        
        if (pageError) throw pageError;
        
        if (pageData && pageData.length > 0) {
          allCompanies = [...allCompanies, ...pageData];
          page++;
          
          // If we got fewer results than the page size, we've reached the end
          if (pageData.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
      
      const companiesData = allCompanies;
      
      // Check which ID field to use
      const idField = companiesData[0]?.company_id ? 'company_id' : 'id';
      
      // Get all company IDs
      const companyIds = companiesData.map(company => company[idField]);
      
      // We'll fetch contact associations in batches during company processing
      // to avoid overwhelming the database with a single large query
      
      // Batch processing for performance
      const batchSize = 50;
      const processedCompanies = [];
      for (let i = 0; i < companyIds.length; i += batchSize) {
        setLoading(`Loading companies data... ${Math.min(i + batchSize, companyIds.length)}/${companyIds.length}`);
        
        // Get current batch of IDs
        const batchIds = companyIds.slice(i, i + batchSize);
        
        // Fetch tags and contact associations for each company
        const [tagsResult, contactsResult, notesResult] = await Promise.all([
          // Get tags
          supabase
            .from('company_tags')
            .select('company_id, tag_id, tags:tag_id(name)')
            .in('company_id', batchIds),
            
          // Get contact associations
          supabase
            .from('contact_companies')
            .select('company_id, contact_id')
            .in('company_id', batchIds),
            
          // Get notes count for each company
          supabase
            .from('notes_companies')
            .select('company_id, note_id')
            .in('company_id', batchIds)
        ]);
        
        // Get deals for companies through the contact relationship chain
        let dealsResult = { data: [], error: null };
        
        // Get all unique contact IDs for this batch to find their deals
        const batchContactIds = [...new Set(contactsResult.data?.map(item => item.contact_id) || [])];
        
        if (batchContactIds.length > 0) {
          // Fetch deals associated with these contacts
          const { data: dealsData, error: dealsError } = await supabase
            .from('deals_contacts')
            .select('contact_id, deal_id')
            .in('contact_id', batchContactIds);
            
          if (dealsError) {
            console.error('Error fetching deals through contacts:', dealsError);
          } else {
            dealsResult = { data: dealsData || [], error: null };
          }
        }
        
        // Log any errors but continue processing
        if (tagsResult.error) console.error('Error fetching tags:', tagsResult.error);
        if (contactsResult.error) console.error('Error fetching contacts:', contactsResult.error);
        if (notesResult.error) console.error('Error fetching notes:', notesResult.error);
        
        // Fetch contact details for this batch
        let batchContactsData = [];
        if (batchContactIds.length > 0) {
          const { data: contactDetails, error: contactDetailsError } = await retrySupabaseRequest(async () => {
            return supabase
              .from('contacts')
              .select('contact_id, first_name, last_name, job_role, category, linkedin, description, score')
              .in('contact_id', batchContactIds);
          });
          
          if (contactDetailsError) {
            console.error('Error fetching contact details:', contactDetailsError);
          } else {
            batchContactsData = contactDetails || [];
          }
        }
        
        // Create a lookup map for this batch's contacts
        const batchContactsMap = {};
        batchContactsData.forEach(contact => {
          batchContactsMap[contact.contact_id] = contact;
        });
        
        // Map data to companies
        const batchCompanies = companiesData.filter(company => batchIds.includes(company[idField])).map(company => {
          // Get tags for this company - create objects with id and name like ContactsListTable
          const companyTags = (tagsResult.data || [])
            .filter(tag => tag.company_id === company.company_id)
            .map(tag => ({
              id: tag.tag_id,
              name: tag.tags?.name
            }))
            .filter(tag => tag.name); // Filter out tags without names
            
          // Get contacts for this company
          const contactIds = (contactsResult.data || [])
            .filter(relation => relation.company_id === company.company_id)
            .map(relation => relation.contact_id);
          
          // Get contact details for this company
          const companyContacts = contactIds
            .map(id => batchContactsMap[id])
            .filter(Boolean);
            
          // Count deals for this company through its contacts
          const companyDealIds = new Set();
          contactIds.forEach(contactId => {
            (dealsResult.data || [])
              .filter(dealContact => dealContact.contact_id === contactId)
              .forEach(dealContact => companyDealIds.add(dealContact.deal_id));
          });
          
          // Create deals array with count information
          const companyDeals = Array.from(companyDealIds).map(dealId => ({ deal_id: dealId }));
          
          // Count notes for this company
          const companyNotesCount = (notesResult.data || [])
            .filter(note => note.company_id === company.company_id)
            .length;
            
          return {
            ...company,
            tags: companyTags,
            deals: companyDeals,
            contacts: companyContacts,
            notes_count: companyNotesCount
          };
        });
        
        // Add processed companies to the result array
        processedCompanies.push(...batchCompanies);
      }
      
      setCompanies(processedCompanies);
      
      setLoading(false);
      setDataLoaded(true);
      
      // Delay showing the grid to avoid abrupt transitions
      setTimeout(() => {
        setShowGrid(true);
      }, 800);
      
    } catch (err) {
      console.error('Error fetching companies data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (!dataLoaded) {
      fetchCompanies();
    }
  }, [dataLoaded]);
  
  // Separate effect for window resize
  useEffect(() => {
    if (!gridApi) return;
    
    const handleResize = () => {
      gridApi.sizeColumnsToFit();
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize, { passive: true });
    };
  }, [gridApi]);

  // Handle company update completion
  const handleCompanyUpdated = () => {
    setShowEditModal(false);
    setSelectedCompany(null);
    
    // Refresh the grid data
    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }
    
    // Optionally refresh the entire data
    setTimeout(() => {
      fetchCompanies();
    }, 100);
  };

  // Function to refresh data
  const refreshData = () => {
    setDataLoaded(false); // Force a complete refresh
    fetchCompanies();
  };

  return (
    <Container>
      <TopMenuContainer>
        {menuItems.map(item => (
          <MenuItem 
            key={item.id}
            $active={item.id === activeTab}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon} {item.name}
          </MenuItem>
        ))}
      </TopMenuContainer>
      
      {error && <ErrorText>Error: {error}</ErrorText>}
      
      {loading !== false ? (
        <LoadingContainer>
          <LoadingText>
            {typeof loading === 'string' 
              ? loading.replace(/Loading .+ \d+\/\d+/, 'Initializing Matrix') 
              : 'Accessing Companies Database...'}
          </LoadingText>
          <LoadingBar />
          <LoadingMatrix />
        </LoadingContainer>
      ) : !showGrid && !error ? (
        <LoadingContainer>
          <LoadingText>Preparing companies grid...</LoadingText>
          <LoadingBar />
          <LoadingMatrix />
        </LoadingContainer>
      ) : getFilteredCompanies.length === 0 && !error ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#00ff00',
          background: '#121212',
          borderRadius: '8px'
        }}>
          {activeTab === 'full_list' 
            ? 'No companies found. Try refreshing the page or check database connection.'
            : `No companies found in "${menuItems.find(item => item.id === activeTab)?.name}" category.`
          }
        </div>
      ) : (
        <div 
          className="ag-theme-alpine" 
          style={{ 
            height: 'calc(100% - 10px)', 
            width: '100%',
            opacity: showGrid ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            '--ag-background-color': '#121212',
            '--ag-odd-row-background-color': '#1a1a1a',
            '--ag-header-background-color': '#222222',
            '--ag-header-foreground-color': '#00ff00',
            '--ag-foreground-color': '#e0e0e0', 
            '--ag-row-hover-color': '#2a2a2a',
            '--ag-border-color': '#333333'
          }}
        >
          <AgGridReact
            rowData={getFilteredCompanies}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onRowClicked={handleRowClicked}
            context={{
              setSelectedCompany,
              setShowEditModal,
              setShowNotesModal,
              refreshData
            }}
            rowSelection="single"
            animateRows={true}
            pagination={true}
            paginationPageSize={50}
            suppressCellFocus={true}
            enableCellTextSelection={true}
          />
        </div>
      )}
      
      {/* Edit Company Modal */}
      {showEditModal && selectedCompany && (
        <NewEditCompanyModal 
          isOpen={showEditModal}
          onRequestClose={() => {
            setShowEditModal(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
          onCompanyUpdated={handleCompanyUpdated}
        />
      )}
      
      {/* Company Notes Modal */}
      {showNotesModal && selectedCompany && (
        <CompanyNotesModal 
          isOpen={showNotesModal}
          onRequestClose={() => {
            setShowNotesModal(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
        />
      )}
    </Container>
  );
};

export default SimpleCompanies;