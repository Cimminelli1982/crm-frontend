import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import { FiMail, FiLinkedin, FiPlus, FiX, FiTrash2, FiMessageSquare } from 'react-icons/fi';
import { FaWhatsapp, FaStar, FaRegStar, FaDollarSign, FaHandshake } from 'react-icons/fa';
import { MdClear } from 'react-icons/md';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createGlobalStyle } from 'styled-components';
import TagsModalComponent from '../modals/TagsModal';
import CityModal from '../modals/CityModal';
import LinkedInPreviewModal from '../modals/LinkedInPreviewModal';
import LinkedinSearchOpenEnrich from '../modals/Linkedin-Search-Open-Enrich';
import AddCompanyModal from '../modals/AddCompanyModal';
import AssociateCompanyModal from '../modals/AssociateCompanyModal';
import NewEditCompanyModal from '../modals/NewEditCompanyModal';
import DeleteOrSkipModal from '../modals/DeleteOrSkipModal';
import ContactsInteractionModal from '../modals/ContactsInteractionModal';
import DealViewFindAddModal from '../modals/DealViewFindAddModal';

// Custom toast styling and grid overrides
const ToastStyle = createGlobalStyle`
  .Toastify__toast {
    background-color: #121212;
    color: #00ff00;
    border: 1px solid #00ff00;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  }
  
  .Toastify__toast-body {
    font-family: 'Courier New', monospace;
    font-size: 14px;
  }

  .Toastify__progress-bar {
    background: #00ff00;
  }

  .Toastify__close-button {
    color: #00ff00;
  }
  
  .Toastify__toast--success {
    background-color: #121212;
    border: 1px solid #00ff00;
  }
  
  .Toastify__toast--error {
    background-color: #121212;
    border: 1px solid #ff3333;
    color: #ff3333;
  }
  
  /* AG Grid hover and selection overrides */
  .ag-theme-alpine .ag-row:hover {
    background-color: inherit !important;
  }
  .ag-theme-alpine .ag-row-odd:hover {
    background-color: #1a1a1a !important;
  }
  .ag-theme-alpine .ag-row-even:hover {
    background-color: #121212 !important;
  }
  .ag-theme-alpine .ag-row-selected {
    background-color: inherit !important;
  }
  .ag-theme-alpine .ag-row-odd.ag-row-selected {
    background-color: #1a1a1a !important;
  }
  .ag-theme-alpine .ag-row-even.ag-row-selected {
    background-color: #121212 !important;
  }
`;

// Styled components
const Container = styled.div`
  height: calc(100vh - 60px);
  width: 100%;
  padding: 0 5px 0 0;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
  position: relative;
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

const ActionsContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  padding: 0 8px;
  width: 100%;
  height: 100%;
  background-color: #111;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: #00ff00;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  transition: all 0.2s;
  padding: 0;
  margin: 0 1px;
  
  &:hover {
    transform: scale(1.1);
  }

  &.linkedin {
    color: #00ff00;
  }
  
  &.email {
    color: #00ff00;
  }
  
  &.whatsapp {
    color: #00ff00;
  }
`;

// We're using the imported TagsModalComponent instead of these styled components

const TagContainer = styled.div`
  display: flex;
  gap: 1px;
  align-items: center;
  padding-top: 4px;
  padding-bottom: 1px;
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

const CityItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
  color: #cccccc;
  padding: 0px 6px;
  border-radius: 4px;
  font-size: 11px;
  border: none;
  white-space: nowrap;
  overflow: visible;
  line-height: 16px;
  max-width: fit-content;
  height: 18px;
  
  button {
    background: none;
    border: none;
    color: #cccccc;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      color: #ffffff;
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

// Custom renderers for the table cells
const TagsRenderer = (props) => {
  const [showModal, setShowModal] = React.useState(false);
  const tags = props.value || [];
  const contact = props.data;
  
  if (!tags.length && !contact) return '';
  
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
        .from('contact_tags')
        .delete()
        .eq('contact_id', contact.contact_id)
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
      toast.success(`Tag "${tagToRemove?.name || 'Unknown'}" removed from ${contact.first_name} ${contact.last_name}`, {
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
          {tag.name}
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
        <TagsModalComponent
          isOpen={showModal}
          onRequestClose={handleCloseModal}
          contact={contact}
          onTagAdded={handleTagAdded}
          onTagRemoved={handleTagRemoved}
        />
      )}
    </TagContainer>
    </div>
  );
};

const CompanyRenderer = (props) => {
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0);
  
  const companies = props.value || [];
  const contactId = props.data?.contact_id;
  const hasMultipleCompanies = companies.length > 1;
  
  // Handle associating a company
  const handleAssociateCompany = (e) => {
    e?.stopPropagation(); // Prevent row selection
    setShowAssociateModal(true);
  };
  
  // Handle editing a company
  const handleEditCompany = (company, e) => {
    e?.stopPropagation(); // Prevent row selection
    
    // Make sure we set the company_id property correctly to match what the modal expects
    const companyWithCorrectId = {
      ...company,
      company_id: company.id  // Ensure company_id is properly set from id
    };
    
    setSelectedCompany(companyWithCorrectId);
    setShowEditModal(true);
  };
  
  // Handle removing a company association
  const handleRemoveCompany = async (companyId, e) => {
    e?.stopPropagation(); // Prevent row selection
    
    if (!contactId || !companyId) return;
    
    try {
      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_id', contactId)
        .eq('company_id', companyId);
        
      if (error) throw error;
      
      // Success message
      toast.success('Company association removed');
      
      // Refresh the grid
      if (props.api) {
        props.api.refreshCells({ force: true });
      }
      
      // Initiate a full data refresh via the grid's parent component
      setTimeout(() => {
        if (props.context && props.context.refreshData) {
          props.context.refreshData();
        }
      }, 100);
    } catch (error) {
      console.error('Error removing company association:', error);
      toast.error('Failed to remove company association');
    }
  };
  
  // Handle company association completion
  const handleCompanyAssociated = (result) => {
    setShowAssociateModal(false);
    
    // Refresh the grid
    if (props.context && props.context.refreshData) {
      setTimeout(() => {
        props.context.refreshData();
      }, 100);
    }
  };
  
  // Handle company update completion
  const handleCompanyUpdated = () => {
    setShowEditModal(false);
    
    // Refresh the grid
    if (props.context && props.context.refreshData) {
      setTimeout(() => {
        props.context.refreshData();
      }, 100);
    }
  };
  
  // Navigation functions for company carousel
  const goToNextCompany = (e) => {
    e?.stopPropagation();
    setCurrentCompanyIndex((prevIndex) => (prevIndex + 1) % companies.length);
  };
  
  const goToPrevCompany = (e) => {
    e?.stopPropagation();
    setCurrentCompanyIndex((prevIndex) => (prevIndex - 1 + companies.length) % companies.length);
  };
  
  // Prevent event propagation
  const handleContainerClick = (e) => {
    e.stopPropagation();
  };

  if (!companies.length) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        }}
        onClick={handleContainerClick}
      >
        <div
          onClick={handleAssociateCompany}
          style={{
            color: '#ffffff',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Associate Company"
        >
          Add company
        </div>
        
        {showAssociateModal && (
          <AssociateCompanyModal 
            isOpen={showAssociateModal}
            onRequestClose={() => setShowAssociateModal(false)}
            contactId={contactId}
            onCompanyAssociated={handleCompanyAssociated}
          />
        )}
      </div>
    );
  }
  
  // Current company to display
  const currentCompany = companies[currentCompanyIndex];
  
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
  
  // Ensure consistent row height regardless of number of companies
  const rowHeight = 36; // Fixed row height matching the grid's default
  
  return (
    <div 
      style={{
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
        justifyContent: 'space-between',
        width: '100%',
        gap: '4px'
      }}>
        {/* Left navigation arrow (only visible for multiple companies) */}
        {hasMultipleCompanies && (
          <button
            onClick={goToPrevCompany}
            style={{
              ...navButtonStyle,
              marginRight: '2px'
            }}
            title="Previous company"
          >
            &#9664;
          </button>
        )}
        
        {/* Company display */}
        <div 
          style={{ 
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
            width: '100%',
            maxWidth: '190px',
            height: '18px',
            position: 'relative'
          }}
        >
          <span 
            style={{ 
              cursor: 'pointer',
              maxWidth: hasMultipleCompanies ? '140px' : '160px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block'
            }}
            onClick={(e) => handleEditCompany(currentCompany, e)}
            title={currentCompany.name}
          >
            {currentCompany.name}
          </span>
          
          {/* Counter indicator for multiple companies */}
          {hasMultipleCompanies && (
            <div style={{
              fontSize: '9px',
              color: '#cccccc',
              marginLeft: '4px',
              padding: '0 2px',
              borderRadius: '3px',
              backgroundColor: '#333333'
            }}>
              {currentCompanyIndex + 1}/{companies.length}
            </div>
          )}
          
          <button
            onClick={(e) => handleRemoveCompany(currentCompany.id, e)}
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
            title="Remove Company Association"
          >
            <MdClear size={14} />
          </button>
        </div>
        
        {/* Right navigation arrow (only visible for multiple companies) */}
        {hasMultipleCompanies && (
          <button
            onClick={goToNextCompany}
            style={{
              ...navButtonStyle,
              marginLeft: '2px'
            }}
            title="Next company"
          >
            &#9654;
          </button>
        )}
        
        {/* Add company button */}
        <button 
          onClick={handleAssociateCompany}
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
          title="Associate Company"
        >
          <FiPlus size={14} />
        </button>
      </div>
      
      {showAssociateModal && (
        <AssociateCompanyModal 
          isOpen={showAssociateModal}
          onRequestClose={() => setShowAssociateModal(false)}
          contactId={contactId}
          onCompanyAssociated={handleCompanyAssociated}
        />
      )}
      
      {showEditModal && selectedCompany && (
        <NewEditCompanyModal 
          isOpen={showEditModal}
          onRequestClose={() => setShowEditModal(false)}
          company={selectedCompany}
          contactId={contactId}
          onCompanyUpdated={handleCompanyUpdated}
        />
      )}
    </div>
  );
};

const CitiesRenderer = (props) => {
  const [showModal, setShowModal] = React.useState(false);
  const cities = props.value || [];
  const contact = props.data;
  
  if (!cities.length && !contact) return '';
  
  // Get only the first city to display
  const visibleCities = cities.slice(0, 1);
  const remainingCount = cities.length - 1;
  
  // If no cities, show "Add city" text instead of the plus button
  const showAddCityText = cities.length === 0;
  
  // Show counter and make it clickable if more than one city
  const showCounter = remainingCount > 0;
  
  const handleRemoveCity = async (e, cityId) => {
    e.stopPropagation(); // Prevent row selection
    
    try {
      // Find the city being removed for the notification
      const cityToRemove = cities.find(city => city.id === cityId);
      
      // Delete the city relationship
      const { error } = await supabase
        .from('contact_cities')
        .delete()
        .eq('contact_id', contact.contact_id)
        .eq('city_id', cityId);
        
      if (error) throw error;
      
      // Update the local data
      const updatedCities = cities.filter(city => city.id !== cityId);
      props.setValue(updatedCities);
      
      // Refresh the data in the grid
      if (props.api) {
        props.api.refreshCells({
          force: true,
          rowNodes: [props.node],
          columns: ['cities']
        });
      }
      
      // Show success toast notification
      toast.success(`City "${cityToRemove?.name || 'Unknown'}" removed from ${contact.first_name} ${contact.last_name}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (err) {
      console.error('Error removing city:', err);
      toast.error(`Error removing city: ${err.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
  };
  
  const handleAddCityClick = (e) => {
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
        columns: ['cities']
      });
      
      // Then initiate a full data refresh via the grid's parent component
      setTimeout(() => {
        if (props.context && props.context.refreshData) {
          props.context.refreshData();
        }
      }, 100);
    }
  };
  
  const handleCityAdded = (city) => {
    // Refresh the cell data after city is added
    if (props.api) {
      props.api.refreshCells({
        force: true,
        rowNodes: [props.node],
        columns: ['cities']
      });
    }
  };
  
  const handleCityRemoved = (city) => {
    // Refresh the cell data after city is removed
    if (props.api) {
      props.api.refreshCells({
        force: true,
        rowNodes: [props.node],
        columns: ['cities']
      });
    }
  };
  
  // We'll stop event propagation on the container to prevent row selection when clicking cities
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
        gap: '2px'
      }}
    >
      {visibleCities.map(city => (
        <CityItem key={city.id} title={city.name}>
          {city.name}
          <button 
            onClick={(e) => handleRemoveCity(e, city.id)} 
            title="Remove city"
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
        </CityItem>
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
          onClick={() => setShowModal(true)}
          title={`Show all ${cities.length} cities`}
        >
          +{remainingCount}
        </div>
      )}
      
      {showAddCityText ? (
        <CityItem
          onClick={handleAddCityClick}
          style={{
            color: '#cccccc',
            fontSize: '11px',
            cursor: 'pointer',
            border: 'none',
            boxShadow: 'none',
            backgroundColor: 'transparent',
            display: 'flex',
            justifyContent: 'center'
          }}
          title="Add or edit city"
        >
          Add city
        </CityItem>
      ) : (
        <AddTagButton 
          onClick={handleAddCityClick}
          title="Add or edit cities"
        >
          <FiPlus size={10} />
        </AddTagButton>
      )}
      
      {showModal && (
        <CityModal
          isOpen={showModal}
          onRequestClose={handleCloseModal}
          contact={contact}
          onCityAdded={handleCityAdded}
          onCityRemoved={handleCityRemoved}
        />
      )}
    </TagContainer>
    </div>
  );
};

const RatingRenderer = (props) => {
  const score = props.value;
  const [isEditing, setIsEditing] = useState(false);
  const [localScore, setLocalScore] = useState(score);
  
  useEffect(() => {
    setLocalScore(score);
  }, [score]);
  
  const getColor = (score) => {
    if (score === 5) return '#00ff00'; // Neon green for 5
    return '#aaaaaa'; // Grey for all other values
  };
  
  const handleScoreChange = async (e) => {
    e.stopPropagation();
    const newScore = parseInt(e.target.value, 10);
    setLocalScore(newScore);
    
    try {
      // Update the score in the database
      const { error } = await supabase
        .from('contacts')
        .update({ score: newScore })
        .eq('contact_id', props.data.contact_id);
        
      if (error) throw error;
      
      // Refresh the cell
      if (props.api) {
        props.api.refreshCells({
          force: true,
          rowNodes: [props.node],
          columns: ['score']
        });
      }
      
      // Show success notification
      toast.success(`Rating updated for ${props.data.first_name} ${props.data.last_name}`);
    } catch (err) {
      console.error('Error updating score:', err);
      toast.error(`Error updating rating: ${err.message}`);
      // Revert to original score on error
      setLocalScore(score);
    }
  };
  
  const handleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  const handleBlur = () => {
    setIsEditing(false);
  };
  
  // Prevent row selection when clicking on the dropdown
  const handleSelectClick = (e) => {
    e.stopPropagation();
  };
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      padding: '0',
      margin: '0'
    }} onClick={handleClick}>
      {isEditing ? (
        <select
          value={localScore || 0}
          onChange={handleScoreChange}
          onBlur={handleBlur}
          onClick={handleSelectClick}
          autoFocus
          style={{
            backgroundColor: '#222',
            color: getColor(localScore || 0),
            border: `1px solid ${getColor(localScore || 0)}`,
            borderRadius: '4px',
            padding: '2px',
            fontSize: '14px',
            width: '40px',
            textAlign: 'center',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {[0, 1, 2, 3, 4, 5].map(value => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      ) : (
        <span style={{ 
          color: getColor(localScore || 0),
          fontWeight: 'bold',
          fontSize: '14px',
          textAlign: 'center',
          cursor: 'pointer'
        }}>
          {localScore !== null && localScore !== undefined ? localScore : '-'}
        </span>
      )}
    </div>
  );
};

const LastInteractionRenderer = (props) => {
  const [showModal, setShowModal] = useState(false);
  
  if (!props.value) return '';
  
  const date = new Date(props.value);
  // Format as MM/YY
  const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
  
  const handleClick = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };
  
  return (
    <>
      <div 
        onClick={handleClick}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingRight: '0',
          width: '100%',
          fontSize: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          color: '#aaaaaa'
        }}
      >
        {formattedDate}
      </div>
      
      {showModal && (
        <ContactsInteractionModal
          isOpen={showModal}
          onRequestClose={() => setShowModal(false)}
          contact={props.data}
        />
      )}
    </>
  );
};

const ActionsRenderer = (props) => {
  const data = props.data;
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [showLinkedInSearchModal, setShowLinkedInSearchModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  
  // Get primary email or first available
  const email = data.email || '';
  
  // Get primary mobile (for WhatsApp) or first available
  const mobile = data.mobile || '';
  
  // No need for click outside handler
  
  const handleEmailClick = (e) => {
    e.stopPropagation();
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };
  
  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    if (mobile) {
      // Format phone number for WhatsApp (remove non-digits)
      const formattedNumber = mobile.replace(/\D/g, '');
      window.open(`https://wa.me/${formattedNumber}`, '_blank');
    }
  };
  
  // Direct handler functions for LinkedIn actions
  
  // Open LinkedIn search & enrich modal
  const handleLinkedInOpen = (e) => {
    e.stopPropagation();
    console.log("Opening LinkedIn search & enrich modal");
    setShowLinkedInSearchModal(true);
  };
  
  
  // Search for person on LinkedIn
  const handleLinkedInSearch = (e) => {
    e.stopPropagation();
    console.log("Searching LinkedIn");
    if (data.first_name && data.last_name) {
      const searchName = `${data.first_name} ${data.last_name}`;
      window.open(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchName)}`, '_blank');
    }
  };
  
  // Open LinkedIn enrichment modal
  const handleLinkedInEnrich = (e) => {
    e.stopPropagation();
    console.log("Opening LinkedIn enrich modal");
    setShowLinkedInModal(true);
  };
  
  const handleModalClose = () => {
    setShowLinkedInModal(false);
    setShowLinkedInSearchModal(false);
    setShowInteractionModal(false);
    setShowDealModal(false);
  };
  
  const handleSaveLinkedInData = async (linkedInData) => {
    try {
      // Update contact information
      const contactUpdates = {
        job_role: linkedInData.jobRole,
        linkedin: data.linkedin, // Keep existing LinkedIn URL
        last_modified_at: new Date().toISOString(),
        last_modified_by: 'User'
      };
      
      // Update the contact record
      const { error: contactError } = await supabase
        .from('contacts')
        .update(contactUpdates)
        .eq('contact_id', data.contact_id);
        
      if (contactError) throw contactError;
      
      // Check if we need to create or update a company
      if (linkedInData.company) {
        // First check if company already exists with this name
        const { data: existingCompanies, error: companySearchError } = await supabase
          .from('companies')
          .select('company_id, name')
          .ilike('name', linkedInData.company);
          
        if (companySearchError) throw companySearchError;
        
        let companyId;
        
        // If company exists, use it
        if (existingCompanies && existingCompanies.length > 0) {
          companyId = existingCompanies[0].company_id;
          
          // Update company information
          const { error: companyUpdateError } = await supabase
            .from('companies')
            .update({
              website: linkedInData.companyWebsite || null,
              description: linkedInData.companyDescription || null,
              last_modified_at: new Date().toISOString(),
              last_modified_by: 'User'
            })
            .eq('company_id', companyId);
            
          if (companyUpdateError) throw companyUpdateError;
        } 
        // If company doesn't exist, create it
        else {
          const { data: newCompany, error: companyCreateError } = await supabase
            .from('companies')
            .insert({
              name: linkedInData.company,
              website: linkedInData.companyWebsite || null,
              description: linkedInData.companyDescription || null,
              created_at: new Date().toISOString(),
              created_by: 'User',
              last_modified_at: new Date().toISOString(),
              last_modified_by: 'User'
            })
            .select();
            
          if (companyCreateError) throw companyCreateError;
          
          if (newCompany && newCompany.length > 0) {
            companyId = newCompany[0].company_id;
          }
        }
        
        // Associate contact with company if we have a company ID
        if (companyId) {
          // Check if relationship already exists
          const { data: existingRelation, error: relationCheckError } = await supabase
            .from('contact_companies')
            .select('contact_id, company_id')
            .eq('contact_id', data.contact_id)
            .eq('company_id', companyId);
            
          if (relationCheckError) throw relationCheckError;
          
          // Only create relationship if it doesn't exist
          if (!existingRelation || existingRelation.length === 0) {
            const { error: relationError } = await supabase
              .from('contact_companies')
              .insert({
                contact_id: data.contact_id,
                company_id: companyId
              });
              
            if (relationError) throw relationError;
          }
        }
      }
      
      // Add city if provided
      if (linkedInData.city) {
        // Check if city exists
        const { data: existingCities, error: citySearchError } = await supabase
          .from('cities')
          .select('city_id, name')
          .ilike('name', linkedInData.city);
          
        if (citySearchError) throw citySearchError;
        
        let cityId;
        
        // If city exists, use it
        if (existingCities && existingCities.length > 0) {
          cityId = existingCities[0].city_id;
        } 
        // If city doesn't exist, create it
        else {
          const { data: newCity, error: cityCreateError } = await supabase
            .from('cities')
            .insert({
              name: linkedInData.city
            })
            .select();
            
          if (cityCreateError) throw cityCreateError;
          
          if (newCity && newCity.length > 0) {
            cityId = newCity[0].city_id;
          }
        }
        
        // Associate contact with city if we have a city ID
        if (cityId) {
          // Check if relationship already exists
          const { data: existingRelation, error: relationCheckError } = await supabase
            .from('contact_cities')
            .select('contact_id, city_id')
            .eq('contact_id', data.contact_id)
            .eq('city_id', cityId);
            
          if (relationCheckError) throw relationCheckError;
          
          // Only create relationship if it doesn't exist
          if (!existingRelation || existingRelation.length === 0) {
            const { error: relationError } = await supabase
              .from('contact_cities')
              .insert({
                contact_id: data.contact_id,
                city_id: cityId
              });
              
            if (relationError) throw relationError;
          }
        }
      }
      
      // Show success notification
      toast.success(`Profile information updated for ${data.first_name} ${data.last_name}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // Refresh data in the grid
      if (props.context && props.context.refreshData) {
        setTimeout(() => {
          props.context.refreshData();
        }, 500);
      }
    } catch (err) {
      console.error('Error saving LinkedIn data:', err);
      toast.error(`Error saving profile data: ${err.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
    
    // Close the modal
    setShowLinkedInModal(false);
  };
  
  const handleOpportunitiesClick = (e) => {
    e.stopPropagation();
    // Open the Deal modal
    setShowDealModal(true);
  };

  const handleIntrosClick = (e) => {
    e.stopPropagation();
    // Add functionality for Intros button
    toast.info(`Intros feature for ${data.first_name} ${data.last_name} coming soon!`);
  };

  // Simple approach - no button position tracking

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#111',
      width: '100%',
      paddingRight: '10px'
    }}>
      <ActionsContainer>
        <ActionButton 
          className="linkedin" 
          onClick={handleLinkedInOpen}
          title={data.linkedin ? "Open LinkedIn" : "No LinkedIn profile"}
          style={{ color: data.linkedin ? '#00ff00' : '#888888' }}
        >
          <FiLinkedin size={14} />
        </ActionButton>
        
        <ActionButton 
          className="delete-contact" 
          onClick={(e) => {
            e.stopPropagation();
            setShowInteractionModal(true);
          }}
          title="Delete or Skip Contact"
          style={{ color: '#00ff00' }}
        >
          <FiTrash2 size={14} />
        </ActionButton>
        
        <ActionButton 
          className="opportunities" 
          onClick={handleOpportunitiesClick}
          title="Opportunities"
        >
          <FaDollarSign size={14} />
        </ActionButton>
        
        <ActionButton 
          className="intros" 
          onClick={handleIntrosClick}
          title="Introductions"
        >
          <FaHandshake size={14} />
        </ActionButton>
      </ActionsContainer>
      
      {showLinkedInModal && (
        <LinkedInPreviewModal
          isOpen={showLinkedInModal}
          onClose={handleModalClose}
          linkedInUrl={data.linkedin || ''}
          contactName={`${data.first_name || ''} ${data.last_name || ''}`.trim()}
          firstName={data.first_name || ''}
          lastName={data.last_name || ''}
          email={email}
          jobRole={data.job_role || ''}
          onSaveData={handleSaveLinkedInData}
        />
      )}
      
      {showLinkedInSearchModal && (
        <LinkedinSearchOpenEnrich
          isOpen={showLinkedInSearchModal}
          onClose={handleModalClose}
          linkedInUrl={data.linkedin || ''}
          contactName={`${data.first_name || ''} ${data.last_name || ''}`.trim()}
          firstName={data.first_name || ''}
          lastName={data.last_name || ''}
          email={email}
          jobRole={data.job_role || ''}
          contactId={data.contact_id}
          context={props.context}
          onSaveData={handleSaveLinkedInData}
        />
      )}
      
      {showInteractionModal && (
        <DeleteOrSkipModal
          isOpen={showInteractionModal}
          onClose={() => setShowInteractionModal(false)}
          contactData={data}
          onDeleteComplete={() => {
            if (props.context && props.context.refreshData) {
              props.context.refreshData();
            }
          }}
          onSkipComplete={() => {
            if (props.context && props.context.refreshData) {
              props.context.refreshData();
            }
          }}
        />
      )}
      
      {showDealModal && (
        <DealViewFindAddModal
          isOpen={showDealModal}
          onClose={() => setShowDealModal(false)}
          contactData={data}
        />
      )}
    </div>
  );
};

const ContactsListTable = ({ category }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const navigate = useNavigate();

  // Keep in Touch renderer
  const KeepInTouchRenderer = (params) => {
    // Ensure consistent handling of null values
    const frequency = params.value === null ? 'Not Set' : params.value;
    const [isEditing, setIsEditing] = useState(false);
    const [localFrequency, setLocalFrequency] = useState(frequency);
    
    useEffect(() => {
      // Update state when data changes with consistent null handling
      setLocalFrequency(params.value === null ? 'Not Set' : params.value);
    }, [params.value]);
    
    const frequencyOptions = [
      "Not Set",
      "Do not keep in touch",
      "Weekly",
      "Monthly",
      "Quarterly",
      "Twice per Year",
      "Once per Year"
    ];
    
    const getFrequencyColor = (freq) => {
      if (freq === 'Quarterly' || freq === 'Monthly') {
        return '#00ff00'; // Neon green for Quarterly and Monthly
      } else {
        return '#aaaaaa'; // Grey for all other options
      }
    };
    
    const handleFrequencyChange = async (e) => {
      e.stopPropagation();
      const newFrequency = e.target.value;
      
      // Set display value for UI
      setLocalFrequency(newFrequency);
      
      // Store null in database for "Not Set"
      const dbValue = newFrequency === "Not Set" ? null : newFrequency;
      
      try {
        // Update the frequency in the database
        const { error } = await supabase
          .from('contacts')
          .update({ keep_in_touch_frequency: dbValue })
          .eq('contact_id', params.data.contact_id);
          
        if (error) throw error;
        
        // Refresh both the cell and the grid to ensure filters work correctly
        if (params.api) {
          // Immediate refresh of the cell
          params.api.refreshCells({
            force: true,
            rowNodes: [params.node],
            columns: ['keep_in_touch_frequency']
          });
          
          // Also trigger full data refresh to ensure filters work
          if (params.context && params.context.refreshData) {
            setTimeout(() => {
              params.context.refreshData();
            }, 100);
          }
        }
        
        // Show success notification
        toast.success(`Keep in touch updated for ${params.data.first_name} ${params.data.last_name}`);
      } catch (err) {
        console.error('Error updating frequency:', err);
        toast.error(`Error updating keep in touch: ${err.message}`);
        // Revert to original frequency on error
        setLocalFrequency(frequency);
      }
      
      setIsEditing(false);
    };
    
    const handleClick = (e) => {
      e.stopPropagation();
      setIsEditing(true);
    };
    
    const handleBlur = () => {
      setIsEditing(false);
    };
    
    // Prevent row selection when clicking on the dropdown
    const handleSelectClick = (e) => {
      e.stopPropagation();
    };
    
    return (
      <div style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        paddingRight: '0',
        width: '100%',
        color: getFrequencyColor(localFrequency),
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        alignItems: 'center'
      }} 
      onClick={handleClick}
      data-frequency={localFrequency}
      >
        {isEditing ? (
          <select
            value={localFrequency}
            onChange={handleFrequencyChange}
            onBlur={handleBlur}
            onClick={handleSelectClick}
            autoFocus
            style={{
              backgroundColor: '#222',
              color: getFrequencyColor(localFrequency),
              border: `1px solid ${getFrequencyColor(localFrequency)}`,
              borderRadius: '4px',
              padding: '2px',
              fontSize: '14px',
              width: '100%',
              cursor: 'pointer'
            }}
          >
            {frequencyOptions.map(option => (
              <option key={option} value={option}>
                {option === 'Do not keep in touch' ? 'Skip' : option}
              </option>
            ))}
          </select>
        ) : (
          <span>
            {localFrequency === 'Do not keep in touch' ? 'Skip' : localFrequency}
          </span>
        )}
      </div>
    );
  };

  // Set auto-resize mode for the grid
  const onFirstDataRendered = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);

  // Column definitions with the requested fields
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Name', 
      field: 'name',
      valueGetter: (params) => {
        if (!params.data) return '';
        const firstName = params.data.first_name || '';
        const lastName = params.data.last_name || '';
        return `${firstName} ${lastName}`.trim() || '(No name)';
      },
      cellRenderer: (params) => {
        if (!params.value) return '-';
        
        // Make name column clickable
        const handleClick = () => {
          if (params.data && params.data.contact_id) {
            params.context.navigate(`/contacts/${params.data.contact_id}`);
          }
        };
        
        return (
          <div 
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              paddingRight: '0',
              width: '100%',
              cursor: 'pointer'
            }}
            onClick={handleClick}
          >
            {params.value}
          </div>
        );
      },
      minWidth: 150,
      flex: 2,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left',
    },
    { 
      headerName: 'Company', 
      field: 'companies', 
      cellRenderer: CompanyRenderer,
      minWidth: 180,
      flex: 2.5,
      filter: true,
      filterValueGetter: (params) => {
        if (!params.data || !params.data.companies || !params.data.companies.length) {
          return '';
        }
        // Convert company names to lowercase and join them for case-insensitive search
        return params.data.companies.map(company => company.name.toLowerCase()).join(' ');
      },
      floatingFilter: true,
      sortable: true,
      cellStyle: { display: 'flex', alignItems: 'center' }
    },
    { 
      headerName: 'Tags', 
      field: 'tags', 
      cellRenderer: TagsRenderer,
      minWidth: 160,
      flex: 2.3,
      filter: true,
      filterValueGetter: (params) => {
        if (!params.data || !params.data.tags || !params.data.tags.length) {
          return '';
        }
        // Convert tag names to lowercase and join them for case-insensitive search
        return params.data.tags.map(tag => tag.name.toLowerCase()).join(' ');
      },
      floatingFilter: true,
      // Add cell style for vertical alignment
      cellStyle: { display: 'flex', alignItems: 'center' }
    },
    { 
      headerName: 'Rating', 
      field: 'score', 
      cellRenderer: RatingRenderer,
      minWidth: 70,
      flex: 0.6,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      editable: false, // We're using a custom editor in the renderer
    },
    { 
      headerName: 'Keep in Touch', 
      field: 'keep_in_touch_frequency',
      cellRenderer: KeepInTouchRenderer,
      minWidth: 110,
      flex: 1.5,
      // Use true for the filter to enable text filtering
      filter: true,
      // Use the filterValueGetter approach for case-insensitive searching
      filterValueGetter: (params) => {
        if (!params.data) return '';
        
        // Get the value and convert to lowercase for case-insensitive comparison
        let value = params.data.keep_in_touch_frequency;
        
        // Handle null values
        if (value === null || value === undefined) {
          return 'not set';  // lowercase for case-insensitive matching
        }
        
        // Add "skip" for "Do not keep in touch" to make both searchable
        if (value === 'Do not keep in touch') {
          return value.toLowerCase() + ' skip';
        }
        
        // Return lowercase value for consistent case-insensitive matching
        return value.toLowerCase();
      },
      // Enable the floating filter for search bar
      floatingFilter: true,
      // Enable sorting
      sortable: true,
      // Format null values consistently for display
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return 'Not Set';
        if (params.value === 'Do not keep in touch') return 'Skip';
        return params.value;
      }
    },
    { 
      headerName: 'City', 
      field: 'cities', 
      cellRenderer: CitiesRenderer,
      minWidth: 110,
      flex: 1.3,
      filter: true,
      filterValueGetter: (params) => {
        if (!params.data || !params.data.cities || !params.data.cities.length) {
          return '';
        }
        // Convert city names to lowercase and join them for case-insensitive search
        return params.data.cities.map(city => city.name.toLowerCase()).join(' ');
      },
      floatingFilter: true,
      // Add cell style for vertical alignment
      cellStyle: { display: 'flex', alignItems: 'center' }
    },
    { 
      headerName: 'Last', 
      field: 'last_interaction_at',
      cellRenderer: LastInteractionRenderer,
      minWidth: 65,
      flex: 0.8,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
      sort: 'desc', // Set default sort to descending
      initialSort: true,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: ActionsRenderer,
      minWidth: 110,
      flex: 1,
      sortable: false,
      filter: false,
      pinned: 'right',
      cellStyle: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '0 12px 0 0',
        backgroundColor: '#111',
        margin: '0',
        borderRight: 'none'
      },
      // Set width to make sure it fits properly
      width: 140,
      maxWidth: 140,
      minWidth: 140
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
  }), []);

  // Grid ready event handler with improved initialization pattern
  const onGridReady = (params) => {
    setGridApi(params.api);
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Size columns to fit with a delay to ensure accurate sizing
      setTimeout(() => {
        try {
          params.api.sizeColumnsToFit();
          
          // Set initial sort after columns are sized
          setTimeout(() => {
            try {
              // Using the correct method for the AG Grid version being used
              if (params.api.applyColumnState) {
                // AG Grid version 25+
                params.api.applyColumnState({
                  state: [{ colId: 'last_interaction_at', sort: 'desc' }],
                  defaultState: { sort: null }
                });
              } else if (params.api.setColumnState) {
                // Older versions of AG Grid
                params.api.setColumnState([
                  { colId: 'last_interaction_at', sort: 'desc' }
                ]);
              }
            } catch (e) {
              console.warn("Error setting column state:", e);
            }
          }, 300);
        } catch (e) {
          console.warn("Error sizing columns:", e);
        }
      }, 200);
    });
  };
  
  // Custom row height function with fixed height now that we use a carousel
  const getRowHeight = useCallback((params) => {
    // Fixed row height of 36px for all rows regardless of number of companies
    return 36;
  }, []);
  
  // Custom row style to ensure consistent background colors and no hover effect
  const getRowStyle = useCallback((params) => {
    return { 
      background: params.node.rowIndex % 2 === 0 ? '#121212' : '#1a1a1a',
      borderRight: 'none',
      '&:hover': {
        background: params.node.rowIndex % 2 === 0 ? '#121212' : '#1a1a1a',
      },
      '&.ag-row-selected': {
        background: params.node.rowIndex % 2 === 0 ? '#121212' : '#1a1a1a',
      }
    };
  }, []);
  

  // We no longer need a row click handler since we're only making the name column clickable
  // The navigation will happen in the name column cell renderer
  
  // We've added the CSS overrides to the ToastStyle component above

  // The fetch function for getting contacts data
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Base query to get contacts
      let query = supabase
          .from('contacts')
          .select(`
            contact_id, 
            first_name, 
            last_name, 
            score,
            last_interaction_at,
            created_at,
            keep_in_touch_frequency,
            linkedin,
            job_role
          `)
          .order('first_name', { ascending: true });
        
        // Always filter for "Founder" category, ignoring any other category parameter
        query = query.eq('category', 'Founder');
        
        const { data: contactsData, error: contactsError } = await query;
        
        if (contactsError) throw contactsError;
        
        // Guard against empty results
        if (!contactsData || contactsData.length === 0) {
          setContacts([]);
          setLoading(false);
          return;
        }
        
        // Get all contact IDs to fetch related data
        const contactIds = contactsData.map(contact => contact.contact_id);
        
        // Fetch related data in parallel
        const [
          companyRelationsData,
          tagRelationsData,
          cityRelationsData,
          emailsData,
          mobilesData
        ] = await Promise.all([
          // Get company relations
          supabase
            .from('contact_companies')
            .select('contact_id, company_id')
            .in('contact_id', contactIds),
            
          // Get tag relations
          supabase
            .from('contact_tags')
            .select('contact_id, tag_id')
            .in('contact_id', contactIds),
            
          // Get city relations
          supabase
            .from('contact_cities')
            .select('contact_id, city_id')
            .in('contact_id', contactIds),
            
          // Get emails
          supabase
            .from('contact_emails')
            .select('contact_id, email, is_primary')
            .in('contact_id', contactIds),
            
          // Get mobile numbers
          supabase
            .from('contact_mobiles')
            .select('contact_id, mobile, is_primary')
            .in('contact_id', contactIds)
        ]);
        
        // Check for errors from all parallel requests
        if (companyRelationsData.error) throw companyRelationsData.error;
        if (tagRelationsData.error) throw tagRelationsData.error;
        if (cityRelationsData.error) throw cityRelationsData.error;
        if (emailsData.error) throw emailsData.error;
        if (mobilesData.error) throw mobilesData.error;
        
        // Extract unique IDs for companies, tags, and cities
        const companyIds = [...new Set(companyRelationsData.data.map(rel => rel.company_id))];
        const tagIds = [...new Set(tagRelationsData.data.map(rel => rel.tag_id))];
        const cityIds = [...new Set(cityRelationsData.data.map(rel => rel.city_id))];
        
        // Fetch details for companies, tags, and cities in parallel
        const [
          companiesData,
          tagsData,
          citiesData
        ] = await Promise.all([
          // Get company details
          supabase
            .from('companies')
            .select('company_id, name, website')
            .in('company_id', companyIds),
            
          // Get tag details
          supabase
            .from('tags')
            .select('tag_id, name')
            .in('tag_id', tagIds),
            
          // Get city details
          supabase
            .from('cities')
            .select('city_id, name')
            .in('city_id', cityIds)
        ]);
        
        // Check for errors from all parallel requests
        if (companiesData.error) throw companiesData.error;
        if (tagsData.error) throw tagsData.error;
        if (citiesData.error) throw citiesData.error;
        
        // Map related data to each contact
        const contactsWithRelations = contactsData.map(contact => {
          // Find relations for this contact
          const contactCompanyRelations = companyRelationsData.data.filter(rel => rel.contact_id === contact.contact_id);
          const contactTagRelations = tagRelationsData.data.filter(rel => rel.contact_id === contact.contact_id);
          const contactCityRelations = cityRelationsData.data.filter(rel => rel.contact_id === contact.contact_id);
          
          // Find emails for this contact
          const contactEmails = emailsData.data.filter(email => email.contact_id === contact.contact_id);
          const primaryEmail = contactEmails.find(email => email.is_primary);
          const email = primaryEmail?.email || (contactEmails.length > 0 ? contactEmails[0].email : null);
          
          // Find mobiles for this contact
          const contactMobiles = mobilesData.data.filter(mobile => mobile.contact_id === contact.contact_id);
          const primaryMobile = contactMobiles.find(mobile => mobile.is_primary);
          const mobile = primaryMobile?.mobile || (contactMobiles.length > 0 ? contactMobiles[0].mobile : null);
          
          // Map to full entities
          const companies = contactCompanyRelations.map(rel => {
            const company = companiesData.data.find(c => c.company_id === rel.company_id);
            return company ? {
              id: company.company_id,
              name: company.name || 'Unknown',
              website: company.website
            } : null;
          }).filter(Boolean);
          
          const tags = contactTagRelations.map(rel => {
            const tag = tagsData.data.find(t => t.tag_id === rel.tag_id);
            return tag ? {
              id: tag.tag_id,
              name: tag.name || 'Unknown Tag'
            } : null;
          }).filter(Boolean);
          
          const cities = contactCityRelations.map(rel => {
            const city = citiesData.data.find(c => c.city_id === rel.city_id);
            return city ? {
              id: city.city_id,
              name: city.name || 'Unknown Location'
            } : null;
          }).filter(Boolean);
          
          // Return the contact with all related data
          return {
            ...contact,
            email,
            mobile,
            companies,
            tags,
            cities
          };
        });
        
        setContacts(contactsWithRelations);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
  // Create a refreshData function for manually refreshing data
  const refreshData = () => {
    if (!loading) {
      fetchContacts();
    }
  };
  
  // Effect to fetch contacts when category changes
  useEffect(() => {
    fetchContacts();
  }, [category]);
  
  // Handle window resize with better debounce pattern to prevent ResizeObserver loop errors
  useEffect(() => {
    if (!gridApi) return;
    
    let resizeTimer;
    let animationFrameId;
    
    const handleResize = () => {
      // Cancel previous timeout and animation frame
      clearTimeout(resizeTimer);
      cancelAnimationFrame(animationFrameId);
      
      // Set a high delay to ensure we're not resizing too frequently
      resizeTimer = setTimeout(() => {
        // Use requestAnimationFrame to ensure we're in the right render cycle
        animationFrameId = requestAnimationFrame(() => {
          try {
            gridApi.sizeColumnsToFit();
          } catch (e) {
            console.warn("Error resizing grid:", e);
          }
        });
      }, 500);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize, { passive: true });
      clearTimeout(resizeTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gridApi]);

  return (
    <Container>
      {/* Apply custom toast styling */}
      <ToastStyle />
      
      {error && <ErrorText>Error: {error}</ErrorText>}
      
      {loading ? (
        <LoadingContainer>
          <LoadingText>Loading contacts...</LoadingText>
          <LoadingBar />
        </LoadingContainer>
      ) : contacts.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#00ff00',
          background: '#121212',
          borderRadius: '8px'
        }}>
          No contacts found for this category.
        </div>
      ) : (
        <div 
          className="ag-theme-alpine" 
          style={{ 
            height: 'calc(100% - 5px)', 
            width: '100%',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            marginRight: '5px',
            '--ag-background-color': '#121212',
            '--ag-odd-row-background-color': '#1a1a1a',
            '--ag-header-background-color': '#222222',
            '--ag-header-foreground-color': '#00ff00',
            '--ag-foreground-color': '#e0e0e0', 
            '--ag-row-hover-color': 'transparent',
            '--ag-border-color': '#333333',
            '--ag-cell-horizontal-padding': '8px',
            '--ag-borders': 'none',
            '--ag-header-height': '32px',
            '--ag-header-column-separator-display': 'none',
            '--ag-font-size': '12px',
            '--ag-paging-panel-height': '42px',
            '--ag-row-height': '36px'
          }}
        >
          <AgGridReact
            rowData={contacts}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            context={{ navigate, refreshData }}
            rowSelection="none"
            animateRows={false}
            pagination={true}
            paginationPageSize={100}
            suppressCellFocus={true}
            enableCellTextSelection={true}
            getRowHeight={getRowHeight}
            getRowStyle={getRowStyle}
            onFirstDataRendered={onFirstDataRendered}
            suppressHorizontalScroll={true}
            paginationNumberFormatter={(params) => {
              return `${params.value}`; 
            }}
            alwaysShowHorizontalScroll={false}
            alwaysShowVerticalScroll={false}
            overlayNoRowsTemplate='<span style="padding: 10px; border: 1px solid #00ff00; background: #121212; color: #00ff00;">No contacts found</span>'
          />
        </div>
      )}
    </Container>
  );
};

export default ContactsListTable;