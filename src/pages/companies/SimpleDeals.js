import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import Modal from 'react-modal';
import { FiGrid, FiCpu, FiDollarSign, FiHome, FiPackage, FiBriefcase, FiInbox, FiEdit, FiTrash2 } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Custom styles for neon green toast notifications and dropdown filter
const toastStyles = `
  .green-toast {
    border-color: #00ff00 !important;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.7) !important;
  }
  .green-progress {
    background-color: #00ff00 !important;
    box-shadow: 0 0 8px #00ff00 !important;
  }
  .Toastify__progress-bar {
    background-color: #00ff00 !important;
    box-shadow: 0 0 8px #00ff00, 0 0 16px #00ff00 !important;
    height: 4px !important;
    opacity: 0.9 !important;
  }
  .Toastify__toast {
    background-color: rgba(18, 18, 18, 0.95) !important;
    border: 1px solid #00ff00 !important;
  }
  .Toastify__close-button {
    color: #00ff00 !important;
  }
  
  /* Custom styles for stage filter dropdown */
  .stage-filter-dropdown {
    background-color: #1a1a1a !important;
    color: #00ff00 !important;
    border: 2px solid #00ff00 !important;
    border-radius: 4px !important;
    padding: 5px !important;
    width: 95% !important;
    font-family: 'Courier New', monospace !important;
    font-size: 0.85rem !important;
    cursor: pointer !important;
    text-shadow: 0 0 5px rgba(0, 255, 0, 0.5) !important;
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.5) !important;
    outline: none !important;
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    z-index: 100 !important;
  }
  
  .stage-filter-dropdown option {
    background-color: #1a1a1a !important;
    color: #00ff00 !important;
    font-family: 'Courier New', monospace !important;
  }
  
  /* Target the specific filter cell */
  .ag-header-cell.ag-floating-filter[aria-colindex="5"] {
    position: relative !important;
    background-color: rgba(0, 255, 0, 0.05) !important;
  }
`;

// Styled components
const Container = styled.div`
  padding: 0;
  height: calc(100vh - 120px);
  width: 100%;
`;

const Title = styled.h1`
  color: #00ff00;
  margin: 20px;
  font-family: 'Courier New', monospace;
`;

// Style for the top menu (matches sc-gudXTU cYeCyJ)
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

// Style for the menu items (matches sc-cPeZqW koIfrV/gKtlSx)
const MenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  color: ${props => props.$active ? '#00ff00' : '#ccc'};
  text-decoration: none;
  border-bottom: ${props => props.$active ? '2px solid #00ff00' : 'none'};
  margin-right: 10px;
  font-family: 'Courier New', monospace;
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  
  &:hover {
    color: #00ff00;
    background-color: rgba(0, 255, 0, 0.05);
  }
  
  &:first-child {
    margin-left: 10px;
  }
  
  svg {
    margin-right: 8px;
    font-size: 1rem;
  }
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
    content: "01001100 01101111 01100001 01100100 01101001 01101110 01100111 00100000 01000100 01100101 01100001 01101100 01110011 00101110 00101110 00101110";
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

const Badge = styled.span`
  display: inline-block;
  background-color: ${props => props.bg || '#222'};
  color: ${props => props.color || '#00ff00'};
  border: 1px solid ${props => props.borderColor || '#00ff00'};
  padding: 2px 6px;
  margin-right: 3px;
  border-radius: 4px;
  font-size: 11px;
`;

// Modal styles
const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#121212',
    color: '#00ff00',
    border: '1px solid #00ff00',
    borderRadius: '4px',
    padding: '20px',
    maxWidth: '80%',
    maxHeight: '80%',
    overflow: 'auto'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};

// Set the app element for react-modal
if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

// Attachments modal content
const AttachmentsModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
  
  h2 {
    margin: 0;
    color: #00ff00;
    font-family: 'Courier New', monospace;
  }
  
  button {
    background: none;
    border: none;
    color: #00ff00;
    font-size: 18px;
    cursor: pointer;
    
    &:hover {
      color: #fff;
    }
  }
`;

const AttachmentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #222;
  border-radius: 4px;
  border: 1px solid #333;
  
  &:hover {
    background-color: #333;
  }
`;

const AttachmentIcon = styled.div`
  margin-right: 10px;
  font-size: 20px;
`;

const AttachmentDetails = styled.div`
  flex: 1;
  
  .filename {
    font-weight: bold;
    margin-bottom: 4px;
  }
  
  .fileinfo {
    font-size: 12px;
    color: #aaa;
  }
`;

const AttachmentLink = styled.a`
  color: #00ff00;
  text-decoration: none;
  padding: 6px 12px;
  border: 1px solid #00ff00;
  border-radius: 4px;
  font-size: 12px;
  
  &:hover {
    background-color: #00ff00;
    color: #000;
  }
`;

const AttachmentButton = styled.button`
  color: #00ff00;
  background: transparent;
  padding: 6px 12px;
  border: 1px solid #00ff00;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #00ff00;
    color: #000;
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
  }
`;

// Tags modal styled components
const TagsModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 600px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
`;

const TagItem = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.$selected ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 255, 0, 0.1)'};
  border: 1px solid #00ff00;
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.2);
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  }
`;

const TagAddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: #00ff00;
  border: 1px dashed #00ff00;
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.1);
  }
`;

const TagsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
  padding-top: 15px;
  border-top: 1px solid #333;
`;

const TagsInputContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const TagsInput = styled.input`
  flex: 1;
  background-color: #222;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
    box-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
  }
`;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
`;

const SearchInput = styled.input`
  background-color: #222;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
    box-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
  }
  
  &::placeholder {
    color: #666;
  }
`;

const TagsTitle = styled.h3`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    stroke: #00ff00;
  }
`;

// Attachment renderer
const AttachmentRenderer = (props) => {
  const attachments = props.value;
  if (!attachments || attachments.length === 0) return '-';
  
  const openAttachmentsModal = () => {
    if (props.context && props.context.setSelectedAttachments) {
      props.context.setSelectedAttachments(attachments);
      props.context.setDealName(props.data.opportunity);
      props.context.setShowAttachmentsModal(true);
    }
  };
  
  return (
    <div 
      onClick={openAttachmentsModal}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '4px',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '4px',
        transition: 'background-color 0.2s'
      }}
    >
      <span role="img" aria-label="Attachment">📎</span>
      <span>{attachments.length}</span>
    </div>
  );
};

// Cell renderer for investment amount
const InvestmentAmountRenderer = (props) => {
  const amount = props.value;
  if (!amount) return '-';
  
  // Format as currency with commas for thousands
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Define category colors outside the component to avoid initialization issues
const categoryColorMap = {
  'Startup': { bg: '#2d4b8e', color: '#fff' },
  'Investment': { bg: '#3a7ca5', color: '#fff' },
  'Fund': { bg: '#4a6c6f', color: '#fff' },
  'Partnership': { bg: '#528f65', color: '#fff' },
  'Real Estate': { bg: '#5d5d8c', color: '#fff' },
  'Private Debt': { bg: '#8c5d5d', color: '#fff' },
  'Private Equity': { bg: '#8c7a5d', color: '#fff' },
  'Other': { bg: '#6b6b6b', color: '#fff' },
  'Inbox': { bg: '#6a5acd', color: '#fff' },
  'All': { bg: '#00ff00', color: '#000' }
};

// Cell renderer for category
const CategoryRenderer = (props) => {
  const category = props.value;
  if (!category) return <span style={{ color: '#aaa', fontStyle: 'italic' }}>-</span>;
  
  // Return simple text without styling
  return <span>{category}</span>;
};

// Cell renderer for tags
const TagsRenderer = (props) => {
  const tags = props.value;
  
  // Quick action buttons style
  const actionButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    border: '1px solid #00ff00',
    color: '#00ff00',
    cursor: 'pointer',
    fontSize: '16px',
    marginLeft: '8px',
    transition: 'all 0.2s ease',
  };
  
  // Handle add button click (opens modal)
  const handleAddClick = (e) => {
    e.stopPropagation(); // Prevent cell click from triggering
    if (props.context && props.context.setSelectedDeal && props.context.setShowTagsModal) {
      props.context.setSelectedDeal(props.data);
      props.context.setShowTagsModal(true);
    }
  };
  
  // Handle remove button click (opens modal with focus on current tags)
  const handleRemoveClick = (e) => {
    e.stopPropagation(); // Prevent cell click from triggering
    if (props.context && props.context.setSelectedDeal && props.context.setShowTagsModal) {
      props.context.setSelectedDeal(props.data);
      props.context.setShowTagsModal(true);
    }
  };
  
  // If no tags, show placeholder with add button
  if (!tags || tags.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#aaa', fontStyle: 'italic' }}>No tags</span>
        <div 
          style={actionButtonStyle}
          onClick={handleAddClick}
          title="Add tags"
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 5px rgba(0, 255, 0, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          +
        </div>
      </div>
    );
  }
  
  // Display tags with styling and action buttons
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', flex: 1 }}>
        {tags.map((tag, index) => (
          <span 
            key={tag.tag_id || index} 
            style={{ 
              backgroundColor: 'rgba(0, 255, 0, 0.1)', 
              border: '1px solid #00ff00',
              color: '#00ff00',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.85rem'
            }}
          >
            {tag.name}
          </span>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
        {/* Add tag button */}
        <div 
          style={actionButtonStyle}
          onClick={handleAddClick}
          title="Add tags"
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 5px rgba(0, 255, 0, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          +
        </div>
        
        {/* Remove tag button */}
        <div 
          style={actionButtonStyle}
          onClick={handleRemoveClick}
          title="Remove tags"
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 5px rgba(0, 255, 0, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ×
        </div>
      </div>
    </div>
  );
};



// Custom filter component for Stage column using the AG Grid API
class StageFloatingFilter {
  init(params) {
    this.params = params;
    this.eGui = document.createElement('div');
    this.eGui.style.width = '100%';
    this.eGui.style.height = '100%';
    
    // Create select element
    this.eSelect = document.createElement('select');
    this.eSelect.style.backgroundColor = '#1a1a1a';
    this.eSelect.style.color = '#00ff00';
    this.eSelect.style.border = '1px solid #333';
    this.eSelect.style.borderRadius = '4px';
    this.eSelect.style.padding = '4px 8px';
    this.eSelect.style.width = '100%';
    this.eSelect.style.height = '100%';
    this.eSelect.style.fontFamily = 'Courier New, monospace';
    this.eSelect.style.fontSize = '0.85rem';
    this.eSelect.style.cursor = 'pointer';
    this.eSelect.style.outline = 'none';
    
    // Add options
    const stageOptions = [
      { value: '', label: 'All Stages' },
      { value: 'Lead', label: 'Lead' },
      { value: 'Qualified', label: 'Qualified' },
      { value: 'Evaluating', label: 'Evaluating' },
      { value: 'Closing', label: 'Closing' },
      { value: 'Negotiation', label: 'Negotiation' },
      { value: 'Closed Won', label: 'Closed Won' },
      { value: 'Invested', label: 'Invested' },
      { value: 'Closed Lost', label: 'Closed Lost' },
      { value: 'Monitoring', label: 'Monitoring' },
      { value: 'Passed', label: 'Passed' }
    ];
    
    stageOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      this.eSelect.appendChild(optionElement);
    });
    
    // Add change handler
    this.eSelect.addEventListener('change', () => {
      const stageFilterValue = this.eSelect.value;
      
      // Get the callback function from the context
      if (this.params.context && this.params.context.setStageFilter) {
        this.params.context.setStageFilter(stageFilterValue);
      }
    });
    
    // Add to DOM
    this.eGui.appendChild(this.eSelect);
  }
  
  onParentModelChanged() {
    // Not needed for our implementation
  }
  
  getGui() {
    return this.eGui;
  }
}

// Filter component for Stage column
class StageFilterComponent {
  init(params) {
    this.params = params;
    this.filterActive = false;
    this.value = '';
    
    this.eGui = document.createElement('div');
    this.eGui.innerHTML = `
      <select
        style="
          background-color: #1a1a1a;
          color: #00ff00;
          border: 1px solid #00ff00;
          border-radius: 4px;
          padding: 5px;
          width: 100%;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;"
      >
        <option value="">All Stages</option>
        <option value="Lead">Lead</option>
        <option value="Qualified">Qualified</option>
        <option value="Evaluating">Evaluating</option>
        <option value="Closing">Closing</option>
        <option value="Negotiation">Negotiation</option>
        <option value="Closed Won">Closed Won</option>
        <option value="Invested">Invested</option>
        <option value="Closed Lost">Closed Lost</option>
        <option value="Monitoring">Monitoring</option>
        <option value="Passed">Passed</option>
      </select>
    `;
    
    this.eSelect = this.eGui.querySelector('select');
    this.eSelect.addEventListener('change', this.onChange.bind(this));
  }

  onChange() {
    this.value = this.eSelect.value;
    this.filterActive = this.value !== '';
    this.params.filterChangedCallback();
  }

  getGui() {
    return this.eGui;
  }

  isFilterActive() {
    return this.filterActive;
  }

  doesFilterPass(params) {
    return params.data.stage === this.value;
  }

  getModel() {
    return this.filterActive ? { value: this.value } : null;
  }

  setModel(model) {
    this.value = model ? model.value : '';
    this.filterActive = this.value !== '';
    this.eSelect.value = this.value;
  }
}

// Custom floating filter component for Stage column - Final Implementation
class StageFloatingFilterFinal {
  init(params) {
    this.params = params;
    
    // Create main container
    this.eGui = document.createElement('div');
    this.eGui.style.width = '100%';
    this.eGui.style.height = '100%';
    this.eGui.style.display = 'flex';
    this.eGui.style.alignItems = 'center';
    this.eGui.style.justifyContent = 'center';
    
    // Create the select element
    this.eSelect = document.createElement('select');
    this.eSelect.className = 'stage-filter-dropdown';
    
    // Style the select element to match AG Grid's theme but with custom colors
    this.eSelect.style.backgroundColor = '#1a1a1a';
    this.eSelect.style.color = '#00ff00';
    this.eSelect.style.border = '1px solid #00ff00';
    this.eSelect.style.borderRadius = '4px';
    this.eSelect.style.padding = '5px';
    this.eSelect.style.width = '95%'; // Leave a bit of space for better visual integration
    this.eSelect.style.fontFamily = 'Courier New, monospace';
    this.eSelect.style.fontSize = '0.85rem';
    this.eSelect.style.cursor = 'pointer';
    this.eSelect.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.5)';
    this.eSelect.style.boxShadow = '0 0 5px rgba(0, 255, 0, 0.3)';
    this.eSelect.style.outline = 'none';
    
    // Add options
    const options = [
      { value: '', text: 'All Stages' },
      { value: 'Lead', text: 'Lead' },
      { value: 'Qualified', text: 'Qualified' },
      { value: 'Evaluating', text: 'Evaluating' },
      { value: 'Closing', text: 'Closing' },
      { value: 'Negotiation', text: 'Negotiation' },
      { value: 'Closed Won', text: 'Closed Won' },
      { value: 'Invested', text: 'Invested' },
      { value: 'Closed Lost', text: 'Closed Lost' },
      { value: 'Monitoring', text: 'Monitoring' },
      { value: 'Passed', text: 'Passed' }
    ];
    
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.text = opt.text;
      option.style.backgroundColor = '#1a1a1a';
      option.style.color = '#00ff00';
      this.eSelect.appendChild(option);
    });
    
    // Set the current filter value (if available in the context)
    if (params.context && typeof params.context.stageFilter !== 'undefined') {
      this.eSelect.value = params.context.stageFilter;
    }
    
    // Add change listener
    this.eSelect.addEventListener('change', () => {
      const value = this.eSelect.value;
      
      // Directly update the external filter state via context
      if (params.context && typeof params.context.setStageFilter === 'function') {
        params.context.setStageFilter(value);
        
        // Manually refresh the grid to apply the filter
        if (params.api) {
          params.api.onFilterChanged();
        }
      }
    });
    
    // DOM injection approach with robust fallbacks and debugging
    const injectDropdownIntoHeaderCell = () => {
      try {
        // Try different selectors to find the Stage column's filter cell
        let targetCell = document.querySelector('.ag-header-cell.ag-floating-filter[aria-colindex="5"]');
        
        // Alternative selectors if the first one fails
        if (!targetCell) {
          // Try finding by column position (5th visible column)
          const filterCells = document.querySelectorAll('.ag-header-cell.ag-floating-filter');
          if (filterCells && filterCells.length >= 5) {
            targetCell = filterCells[4]; // 0-indexed, so 4 is the 5th cell
          }
        }
        
        // Try one more approach - find by column label
        if (!targetCell) {
          const stageHeader = document.querySelector('.ag-header-cell[col-id="stage"]');
          if (stageHeader) {
            const colIndex = stageHeader.getAttribute('aria-colindex');
            if (colIndex) {
              targetCell = document.querySelector(`.ag-header-cell.ag-floating-filter[aria-colindex="${colIndex}"]`);
            }
          }
        }
        
        console.log('Target cell found:', !!targetCell);
        
        if (targetCell) {
          // Try to find the correct container within the cell
          let container = targetCell.querySelector('div[role="presentation"]');
          
          // If that doesn't work, try other common container elements
          if (!container) {
            container = targetCell.querySelector('.ag-floating-filter-body');
          }
          
          if (!container) {
            container = targetCell.querySelector('.ag-floating-filter-full-body');
          }
          
          // Last resort: use the cell itself
          if (!container) {
            container = targetCell;
          }
          
          console.log('Container found:', !!container);
          
          if (container) {
            // Clear existing content
            container.innerHTML = '';
            
            // Move our select element into the target container
            container.appendChild(this.eSelect);
            
            console.log('Successfully injected filter dropdown');
            return true;
          }
        }
        
        return false;
      } catch (err) {
        console.error('Error injecting dropdown:', err);
        return false;
      }
    };
    
    // Retry mechanism with increasing delays
    const attemptInjection = (attempt = 1, maxAttempts = 5) => {
      if (attempt > maxAttempts) {
        console.log('Max injection attempts reached, using default placement');
        return;
      }
      
      setTimeout(() => {
        const success = injectDropdownIntoHeaderCell();
        if (!success) {
          console.log(`Attempt ${attempt} failed, trying again...`);
          attemptInjection(attempt + 1, maxAttempts);
        }
      }, 300 * attempt); // Increasing delay with each attempt
    };
    
    // Start the injection attempts
    attemptInjection();
    
    // Add select to our container as well (fallback)
    this.eGui.appendChild(this.eSelect);
  }
  
  // We're handling the change event directly in the init method
  
  getGui() {
    return this.eGui;
  }
  
  // Required method - called when filter model changes elsewhere
  onParentModelChanged(parentModel) {
    // We're not using this in our implementation but the method must exist
  }
  
  // AG Grid will call this when the filter is destroyed
  destroy() {
    // Clean up any event listeners if needed
    if (this.eSelect) {
      this.eSelect.removeEventListener('change');
    }
  }
}

// Cell renderer for source with custom icons
const SourceRenderer = (props) => {
  const source = props.value;
  if (!source) return <span style={{ color: '#aaa', fontStyle: 'italic' }}>-</span>;
  
  // Return source with appropriate icon
  if (source === 'Cold Contacting') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#00ff00" 
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0 0 2px #00ff00)' }}
        >
          {/* Snowflake icon */}
          <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07M7 12l5-5 5 5-5 5-5-5z" />
        </svg>
        <span>{source}</span>
      </div>
    );
  }
  
  return <span>{source}</span>;
};

// Cell renderer for Actions column
const ActionsRenderer = (props) => {
  const { data } = props;
  
  // Handle edit button click
  const handleEdit = (e) => {
    e.stopPropagation();
    // Here you would typically show an edit form or modal
    // For now, we'll just show a toast notification
    toast.info(`Editing deal: ${data.opportunity}`, {
      icon: <FiEdit style={{ color: '#00ff00' }} />
    });
  };
  
  // Handle delete button click
  const handleDelete = (e) => {
    e.stopPropagation();
    
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to delete deal: ${data.opportunity}?`)) {
      // Delete the deal from Supabase
      supabase
        .from('deals')
        .delete()
        .eq('deal_id', data.deal_id)
        .then(({ error }) => {
          if (error) {
            toast.error(`Error deleting deal: ${error.message}`);
            console.error('Error deleting deal:', error);
          } else {
            toast.success(`Deal "${data.opportunity}" deleted successfully`, {
              icon: <FiTrash2 style={{ color: '#00ff00' }} />
            });
            
            // Refresh data or remove from grid using context
            if (props.context && props.context.removeDeal) {
              props.context.removeDeal(data.deal_id);
            }
          }
        });
    }
  };
  
  // Handle attachments button click - reused from AttachmentRenderer
  const handleAttachments = (e) => {
    e.stopPropagation();
    
    const attachments = data.attachments;
    if (!attachments || attachments.length === 0) {
      // Use custom toast with neon green styling
      toast(`No attachments for deal: ${data.opportunity}`, {
        style: {
          borderLeft: '5px solid #00ff00',
          color: '#ffffff',
          textShadow: '0 0 5px rgba(255, 255, 255, 0.5)',
        },
        progressClassName: 'green-progress',
        className: 'green-toast',
        icon: () => (
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#00ff00" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
          </svg>
        )
      });
      return;
    }
    
    // Open attachments modal using context
    if (props.context && props.context.setSelectedAttachments) {
      props.context.setSelectedAttachments(attachments);
      props.context.setDealName(data.opportunity);
      props.context.setCurrentDealId(data.deal_id);
      props.context.setShowAttachmentsModal(true);
    }
  };
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
      {/* Attachments Button - Icon only */}
      <button
        onClick={handleAttachments}
        title={`Attachments (${data.attachments?.length || 0})`}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '5px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background-color 0.2s',
          position: 'relative'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.1)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#00ff00" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
        </svg>
        {data.attachments && data.attachments.length > 0 && (
          <span style={{
            position: 'absolute',
            top: -3,
            right: -3,
            backgroundColor: '#00ff00',
            color: '#000',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {data.attachments.length}
          </span>
        )}
      </button>
      
      {/* Edit Button - Icon only */}
      <button
        onClick={handleEdit}
        title="Edit"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '5px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.1)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <FiEdit size={18} style={{ color: '#00ff00' }} />
      </button>
      
      {/* Delete Button - Icon only */}
      <button
        onClick={handleDelete}
        title="Delete"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '5px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.1)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <FiTrash2 size={18} style={{ color: '#00ff00' }} />
      </button>
    </div>
  );
};

const SimpleDeals = () => {
  const [deals, setDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [dealName, setDealName] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [currentDealId, setCurrentDealId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  // Keep stageFilter state but don't use it - needed for the AG Grid filter
  const [stageFilter, setStageFilter] = useState('');
  const navigate = useNavigate();
  
  // Category colors for this component
  const categoryColors = categoryColorMap;
  
  // Column definitions for the deal grid
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Deal', 
      field: 'opportunity',
      minWidth: 200,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left',
      editable: true,
      cellStyle: { 
        cursor: 'pointer', 
        backgroundColor: 'rgba(0, 255, 0, 0.05)', 
        textDecoration: 'underline',
        color: '#00ff00'
      }
    },
    { 
      headerName: 'Contacts', 
      field: 'contacts',
      minWidth: 220,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const contacts = params.value;
        if (!contacts || contacts.length === 0) {
          return (
            <div style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic' }}>No contacts</div>
          );
        }
        
        // Format for preview of first contact
        const firstContact = contacts[0];
        const fullName = [firstContact.first_name || '', firstContact.last_name || ''].filter(Boolean).join(' ') || 'Unnamed';
        const jobRole = firstContact.job_role || '';
        const hasInteraction = firstContact.last_interaction_at ? true : false;
        const interactionDate = hasInteraction ? new Date(firstContact.last_interaction_at) : null;
        
        // Return formatted contacts display
        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            backgroundColor: 'rgba(0, 255, 0, 0.05)',
            border: '1px solid rgba(0, 255, 0, 0.1)',
          }}
          onClick={() => {
            if (params.context && params.context.showDealContacts) {
              params.context.showDealContacts(params.data);
            }
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(0, 255, 0, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(0, 255, 0, 0.1)';
          }}
          >
            {/* Header with contact count */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '4px',
              borderBottom: '1px dotted rgba(0, 255, 0, 0.2)',
              paddingBottom: '3px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span style={{ marginLeft: '6px', color: '#00ff00', fontWeight: 'bold' }}>
                  {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <span style={{ 
                fontSize: '11px', 
                color: '#00ff00', 
                backgroundColor: 'rgba(0, 255, 0, 0.1)', 
                padding: '2px 6px', 
                borderRadius: '10px' 
              }}>View all</span>
            </div>
            
            {/* First contact preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '50%', 
                backgroundColor: '#222', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                border: '1px solid rgba(0, 255, 0, 0.2)',
                overflow: 'hidden'
              }}>
                {firstContact.profile_image_url ? (
                  <img 
                    src={firstContact.profile_image_url} 
                    alt={fullName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </div>
              <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                <div style={{ 
                  color: '#00ff00', 
                  fontWeight: 'bold', 
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {fullName}
                </div>
                {jobRole && (
                  <div style={{ 
                    color: '#aaa', 
                    fontSize: '11px', 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {jobRole}
                  </div>
                )}
              </div>
              {contacts.length > 1 && (
                <div style={{ 
                  width: '22px', 
                  height: '22px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(0, 255, 0, 0.1)',
                  color: '#00ff00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  +{contacts.length - 1}
                </div>
              )}
            </div>
            
            {/* Last interaction indicator (if available) */}
            {hasInteraction && (
              <div style={{ 
                fontSize: '10px', 
                color: '#888', 
                marginTop: '4px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px'
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Last contact: {interactionDate.toLocaleDateString()}
              </div>
            )}
          </div>
        );
      }
    },
    { 
      headerName: 'Tags', 
      field: 'tags',
      cellRenderer: TagsRenderer,
      minWidth: 300,
      sortable: true,
      filter: false,
      resizable: true,
    },
    { 
      headerName: 'Category', 
      field: 'category',
      cellRenderer: CategoryRenderer,
      minWidth: 140,
      filter: false,
      sortable: true,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          'Inbox',
          'Startup',
          'Investment',
          'Fund',
          'Partnership',
          'Real Estate',
          'Private Debt',
          'Private Equity',
          'Other'
        ]
      }
    },
    { 
      headerName: 'Stage',
      field: 'stage',
      valueFormatter: (params) => params.value || '-',
      minWidth: 150,
      filter: false,
      floatingFilter: true,
      suppressMenu: true, // Suppress the default filter menu
      floatingFilterComponent: 'stageFloatingFilter',
      sortable: true,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          'Lead',
          'Qualified',
          'Evaluating',
          'Closing',
          'Negotiation',
          'Closed Won',
          'Invested',
          'Closed Lost',
          'Monitoring',
          'Passed'
        ]
      }
    },
    { 
      headerName: 'Source', 
      field: 'source_category',
      cellRenderer: SourceRenderer,
      minWidth: 140,
      // Use agSetColumnFilter to show a list of values
      filter: 'agSetColumnFilter',
      filterParams: {
        // Exact list of values for the filter
        values: [
          'Cold Contacting',
          'Introduction'
        ],
        // Show the values in the dropdown
        cellRenderer: params => params.value || '(Empty)',
        // Customize the filter appearance and behavior
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        // Height of each value row in the dropdown
        cellHeight: 30,
        // Enable sorting in the filter dropdown
        sortButtons: true
      },
      floatingFilter: true,
      sortable: true,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: [
          'Cold Contacting',
          'Introduction'
        ]
      }
    },
    { 
      headerName: 'Investment Amount', 
      field: 'total_investment',
      cellRenderer: InvestmentAmountRenderer,
      minWidth: 150,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
      editable: true,
      cellEditor: 'agNumberCellEditor',
    },
    { 
      headerName: 'Created', 
      field: 'created_at', 
      valueFormatter: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        // Format as MM/YY
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
      },
      minWidth: 100,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: ActionsRenderer,
      width: 150,
      sortable: false,
      filter: false,
      suppressSizeToFit: true
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
    // Default filter configuration
    filterParams: {
      buttons: ['apply', 'reset'],
      closeOnApply: true
    }
  }), []);
  
  // Function to remove a deal from the grid
  const removeDeal = useCallback((dealId) => {
    setDeals(prevDeals => prevDeals.filter(deal => deal.deal_id !== dealId));
  }, []);
  
  // Handle tag operations for a deal
  const handleTagOperation = useCallback(async (operation, tagId) => {
    if (!selectedDeal || !selectedDeal.deal_id) {
      toast.error('No deal selected for tag operation');
      return;
    }

    try {
      if (operation === 'add') {
        // Check if tag already exists for this deal
        const { data: existingTag, error: checkError } = await supabase
          .from('deal_tags')
          .select('*')
          .eq('deal_id', selectedDeal.deal_id)
          .eq('tag_id', tagId)
          .maybeSingle();
          
        if (checkError) {
          throw checkError;
        }
        
        // If tag already exists, don't add it again
        if (existingTag) {
          toast.info('This tag is already associated with the deal');
          return;
        }
        
        // Add tag to deal
        const { error } = await supabase
          .from('deal_tags')
          .insert({
            deal_id: selectedDeal.deal_id,
            tag_id: tagId
          });
          
        if (error) {
          throw error;
        }
        
        // Get the tag name
        const tagName = availableTags.find(tag => tag.tag_id === tagId)?.name || 'Unknown tag';
        
        toast.success(`Added tag "${tagName}" to deal`);
        
        // Update the selected deal's tags in the state
        const newTag = availableTags.find(tag => tag.tag_id === tagId);
        if (newTag) {
          setSelectedDeal(prev => ({
            ...prev,
            tags: [...(prev.tags || []), newTag]
          }));
          
          // Also update in the main deals array
          setDeals(prevDeals => prevDeals.map(deal => 
            deal.deal_id === selectedDeal.deal_id 
              ? { ...deal, tags: [...(deal.tags || []), newTag] }
              : deal
          ));
        }
      } else if (operation === 'remove') {
        // Remove tag from deal
        const { error } = await supabase
          .from('deal_tags')
          .delete()
          .eq('deal_id', selectedDeal.deal_id)
          .eq('tag_id', tagId);
          
        if (error) {
          throw error;
        }
        
        // Get the tag name
        const tagName = selectedDeal.tags?.find(tag => tag.tag_id === tagId)?.name || 'Unknown tag';
        
        toast.success(`Removed tag "${tagName}" from deal`);
        
        // Update the selected deal's tags in the state
        setSelectedDeal(prev => ({
          ...prev,
          tags: prev.tags?.filter(tag => tag.tag_id !== tagId) || []
        }));
        
        // Also update in the main deals array
        setDeals(prevDeals => prevDeals.map(deal => 
          deal.deal_id === selectedDeal.deal_id 
            ? { ...deal, tags: deal.tags?.filter(tag => tag.tag_id !== tagId) || [] }
            : deal
        ));
      }
      
      // Update filtered deals as well
      setFilteredDeals(prevDeals => prevDeals.map(deal => 
        deal.deal_id === selectedDeal.deal_id
          ? deals.find(d => d.deal_id === selectedDeal.deal_id) || deal
          : deal
      ));
      
      // Refresh the deal's tag data to ensure synchronization
      try {
        // Fetch updated tag data for the deal
        const { data: tagRefs, error: tagRefsError } = await supabase
          .from('deal_tags')
          .select('tag_id')
          .eq('deal_id', selectedDeal.deal_id);
          
        if (tagRefsError) {
          console.error(`Error refreshing tag refs:`, tagRefsError);
          return;
        }
        
        if (tagRefs && tagRefs.length > 0) {
          // Get actual tag details
          const tagIds = tagRefs.map(ref => ref.tag_id);
          const { data: tagDetails, error: tagDetailsError } = await supabase
            .from('tags')
            .select('tag_id, name')
            .in('tag_id', tagIds);
            
          if (tagDetailsError) {
            console.error(`Error refreshing tag details:`, tagDetailsError);
            return;
          }
          
          // Update the selected deal with fresh tag data
          setSelectedDeal(prev => ({
            ...prev,
            tags: tagDetails || []
          }));
          
          // Update in the main deals array
          setDeals(prevDeals => prevDeals.map(deal => 
            deal.deal_id === selectedDeal.deal_id 
              ? { ...deal, tags: tagDetails || [] }
              : deal
          ));
          
          // Update filtered deals as well
          setFilteredDeals(prevDeals => prevDeals.map(deal => 
            deal.deal_id === selectedDeal.deal_id
              ? { ...deal, tags: tagDetails || [] }
              : deal
          ));
        } else {
          // If no tags, set empty array
          setSelectedDeal(prev => ({
            ...prev,
            tags: []
          }));
          
          // Update in the deals arrays
          const updateDeals = deal => 
            deal.deal_id === selectedDeal.deal_id 
              ? { ...deal, tags: [] }
              : deal;
              
          setDeals(prevDeals => prevDeals.map(updateDeals));
          setFilteredDeals(prevDeals => prevDeals.map(updateDeals));
        }
      } catch (err) {
        console.error('Error refreshing tag data:', err);
      }
      
    } catch (err) {
      console.error(`Error in tag operation (${operation}):`, err);
      toast.error(`Error ${operation === 'add' ? 'adding' : 'removing'} tag: ${err.message}`);
    }
  }, [selectedDeal, availableTags, deals]);
  
  // Handle creating a new tag
  const handleCreateTag = useCallback(async (tagName) => {
    if (!tagName || tagName.trim() === '') {
      toast.error('Tag name cannot be empty');
      return;
    }
    
    try {
      // Check if tag already exists
      const { data: existingTags, error: checkError } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', tagName.trim());
        
      if (checkError) {
        throw checkError;
      }
      
      if (existingTags && existingTags.length > 0) {
        toast.info(`Tag "${tagName}" already exists`);
        return existingTags[0].tag_id; // Return existing tag ID
      }
      
      // Create new tag
      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: tagName.trim()
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Failed to create tag: No data returned');
      }
      
      const newTag = data[0];
      toast.success(`Created new tag "${newTag.name}"`);
      
      // Add to available tags
      setAvailableTags(prev => [...prev, newTag]);
      
      return newTag.tag_id;
    } catch (err) {
      console.error('Error creating tag:', err);
      toast.error(`Error creating tag: ${err.message}`);
      return null;
    }
  }, []);

  // Handle file upload to Supabase
  const handleFileUpload = useCallback(async (file) => {
    if (!file || !currentDealId) return;
    
    try {
      setUploading(true);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `deal-attachments/${fileName}`;
      
      // Upload file to Supabase Storage
      const { data: fileData, error: uploadError } = await supabase
        .storage
        .from('attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL for the file
      const { data: urlData } = await supabase
        .storage
        .from('attachments')
        .getPublicUrl(filePath);
      
      const fileUrl = urlData.publicUrl;
      
      // Create a new attachment record
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('attachments')
        .insert([
          {
            file_name: file.name,
            file_url: fileUrl,
            file_type: file.type,
            file_size: file.size,
            processing_status: 'completed',
            created_by: 'User'
          }
        ])
        .select();
      
      if (attachmentError) {
        throw attachmentError;
      }
      
      // Link the attachment to the deal
      const attachmentId = attachmentData[0].attachment_id;
      
      const { error: linkError } = await supabase
        .from('deal_attachments')
        .insert([
          {
            deal_id: currentDealId,
            attachment_id: attachmentId,
            created_by: 'User'
          }
        ]);
      
      if (linkError) {
        throw linkError;
      }
      
      // Update the attachments list
      setSelectedAttachments(prev => [...prev, attachmentData[0]]);
      
      toast.success(`File "${file.name}" uploaded successfully!`, {
        style: {
          borderLeft: '5px solid #00ff00',
          background: 'rgba(18, 18, 18, 0.95)',
          color: '#ffffff',
          boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
        },
        progressClassName: 'green-progress',
        className: 'green-toast',
        icon: () => (
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#00ff00" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )
      });
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Error uploading file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }, [currentDealId]);
  
  // Function to show deal contacts
  const showDealContacts = useCallback((deal) => {
    console.log('Showing contacts for deal:', deal);
    // You would typically implement this to show a modal or navigate to a contacts page
    toast.info(`Showing contacts for deal: ${deal.opportunity}`, {
      style: {
        borderLeft: '5px solid #00ff00',
        color: '#ffffff'
      }
    });
  }, []);

  // Context to pass to the grid
  const gridContext = useMemo(() => ({
    setSelectedAttachments,
    setDealName,
    setCurrentDealId,
    setShowAttachmentsModal,
    setShowTagsModal,
    setSelectedDeal,
    showDealContacts,
    categoryColors,
    removeDeal,
    stageFilter,
    setStageFilter
  }), [categoryColors, removeDeal, stageFilter, showDealContacts]);

  // Create a manual filter dropdown that's positioned outside AG Grid
  const [showManualStageFilter, setShowManualStageFilter] = useState(false);
  const [filterPosition, setFilterPosition] = useState({ top: 0, left: 0, width: 150, height: 30 });
  
  // Function to position the manual filter dropdown
  const positionManualFilter = useCallback(() => {
    try {
      // Find the target filter cell
      const targetCell = document.querySelector('.ag-header-cell.ag-floating-filter[aria-colindex="5"]');
      if (!targetCell) return;
      
      // Get the position and dimensions of the target cell
      const cellRect = targetCell.getBoundingClientRect();
      
      // Update position state for the manual filter
      setFilterPosition({
        top: cellRect.top + window.scrollY,
        left: cellRect.left + window.scrollX,
        width: cellRect.width,
        height: cellRect.height
      });
      
      // Make the filter visible
      setShowManualStageFilter(true);
    } catch (err) {
      console.error('Error positioning manual filter:', err);
    }
  }, []);
  
  // Grid ready event handler
  const onGridReady = React.useCallback((params) => {
    console.log('Grid is ready');
    setGridApi(params.api);
    
    // Wait for a tick to ensure grid is properly initialized
    setTimeout(() => {
      params.api.sizeColumnsToFit();
      
      // Debugging: log some info about the grid and the Stage column
      console.log('Grid API object:', params.api);
      
      const stageColumn = params.columnApi.getColumn('stage');
      if (stageColumn) {
        console.log('Stage column found, ID:', stageColumn.getId());
        console.log('Stage column props:', stageColumn.getColDef());
      } else {
        console.warn('Stage column not found in the grid');
      }
      
      // Force refresh of the grid
      params.api.refreshHeader();
      
      // Position the manual filter
      positionManualFilter();
    }, 300);
  }, [positionManualFilter]);

  // Row clicked handler
  const handleRowClicked = React.useCallback((params) => {
    console.log('Deal clicked:', params.data);
    // In the future, this could navigate to a deal detail page
    // navigate(`/deals/${params.data.deal_id}`);
  }, []);
  
  // Handle edit changes when a cell value changes
  const onCellValueChanged = React.useCallback(async (params) => {
    const { data, colDef, newValue, oldValue } = params;
    
    if (newValue === oldValue) return; // Skip if no change
    
    console.log(`Editing ${colDef.field} from "${oldValue}" to "${newValue}"`);
    
    try {
      // Create update object with only the changed field
      const updateData = { [colDef.field]: newValue };
      
      // Update in Supabase
      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('deal_id', data.deal_id);
      
      if (error) {
        console.error('Error updating deal:', error);
        toast.error(`Error updating deal: ${error.message}`);
      } else {
        console.log(`Successfully updated ${colDef.field} for deal ${data.deal_id}`);
        
        // Show toast notifications for dropdown fields
        if (colDef.field === 'category') {
          toast.success(`Deal category updated to "${newValue}"`, {
            icon: '🏷️'
          });
        } else if (colDef.field === 'stage') {
          toast.success(`Deal stage updated to "${newValue}"`, {
            icon: '📋'
          });
        } else if (colDef.field === 'source_category') {
          toast.success(`Deal source updated to "${newValue}"`, {
            icon: '📊'
          });
        } else if (colDef.field === 'total_investment') {
          const formattedValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(newValue);
          
          toast.success(`Investment amount updated to ${formattedValue}`, {
            icon: '💰'
          });
        } else if (colDef.field === 'opportunity') {
          toast.success(`Deal name updated to "${newValue}"`, {
            icon: '✏️'
          });
        } else if (colDef.field === 'tags') {
          toast.success(`Tags updated successfully`, {
            icon: '🏷️'
          });
        }
      }
    } catch (err) {
      console.error('Error in update operation:', err);
      toast.error(`Error updating deal: ${err.message}`);
    }
  }, []);

  // Fetch all available tags
  const fetchAllTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
        
      if (error) {
        console.error('Error fetching tags:', error);
        return;
      }
      
      setAvailableTags(data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  // Fetch deals data from Supabase
  const fetchDeals = async () => {
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
            console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, err);
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
      
      setLoading('Accessing Deals data...');
      
      // Fetch data from deals table
      const { data, error } = await retrySupabaseRequest(async () => {
        return supabase
          .from('deals')
          .select('*')
          .order('created_at', { ascending: false });
      });
      
      if (error) throw error;
      
      // Process the data
      console.log(`Fetched ${data.length} deals`);
      
      // Fetch attachments and tags for each deal
      const dealsWithData = await Promise.all(data.map(async (deal) => {
        try {
          // Get attachment references
          const { data: attachmentRefs, error: refsError } = await supabase
            .from('deal_attachments')
            .select('attachment_id')
            .eq('deal_id', deal.deal_id);
            
          if (refsError) {
            console.error(`Error fetching attachment refs for deal ${deal.deal_id}:`, refsError);
            return { ...deal, attachments: [], tags: [] };
          }
          
          let attachments = [];
          
          if (attachmentRefs && attachmentRefs.length > 0) {
            // Get actual attachment details
            const attachmentIds = attachmentRefs.map(ref => ref.attachment_id);
            const { data: attachmentDetails, error: detailsError } = await supabase
              .from('attachments')
              .select('attachment_id, file_name, file_url, file_type, file_size, permanent_url')
              .in('attachment_id', attachmentIds);
              
            if (detailsError) {
              console.error(`Error fetching attachment details for deal ${deal.deal_id}:`, detailsError);
            } else {
              attachments = attachmentDetails || [];
            }
          }
          
          // Get tags for the deal
          const { data: tagRefs, error: tagRefsError } = await supabase
            .from('deal_tags')
            .select('tag_id')
            .eq('deal_id', deal.deal_id);
            
          if (tagRefsError) {
            console.error(`Error fetching tag refs for deal ${deal.deal_id}:`, tagRefsError);
            return { ...deal, attachments, tags: [] };
          }
          
          let tags = [];
          
          if (tagRefs && tagRefs.length > 0) {
            // Get actual tag details
            const tagIds = tagRefs.map(ref => ref.tag_id);
            const { data: tagDetails, error: tagDetailsError } = await supabase
              .from('tags')
              .select('tag_id, name')
              .in('tag_id', tagIds);
              
            if (tagDetailsError) {
              console.error(`Error fetching tag details for deal ${deal.deal_id}:`, tagDetailsError);
            } else {
              tags = tagDetails || [];
            }
          }
          
          return { ...deal, attachments, tags };
        } catch (err) {
          console.error(`Error processing data for deal ${deal.deal_id}:`, err);
          return { ...deal, attachments: [], tags: [] };
        }
      }));
      
      setDeals(dealsWithData);
      setFilteredDeals(dealsWithData);
      setLoading(false);
      setDataLoaded(true);
      
      // Delay showing the grid to avoid abrupt transitions
      setTimeout(() => {
        setShowGrid(true);
      }, 800);
      
    } catch (err) {
      console.error('Error fetching deals data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (!dataLoaded) {
      console.log('Initiating deals data fetch');
      fetchDeals();
      fetchAllTags();
    }
  }, [dataLoaded]);
  
  // Effect to handle repositioning filter on scroll/resize
  useEffect(() => {
    if (showManualStageFilter) {
      const handleWindowEvents = () => {
        positionManualFilter();
      };
      
      // Add event listeners
      window.addEventListener('scroll', handleWindowEvents);
      window.addEventListener('resize', handleWindowEvents);
      
      // Set up interval to reposition (helps with dynamic grid changes)
      const repositionInterval = setInterval(handleWindowEvents, 1000);
      
      // Cleanup
      return () => {
        window.removeEventListener('scroll', handleWindowEvents);
        window.removeEventListener('resize', handleWindowEvents);
        clearInterval(repositionInterval);
      };
    }
  }, [showManualStageFilter, positionManualFilter]);
  
  // Filter deals based on active tab and stage filter
  useEffect(() => {
    console.log('Filtering deals. Active tab:', activeTab);
    console.log('Stage filter:', stageFilter);
    console.log('Total deals:', deals.length);
    
    if (deals.length > 0) {
      // Define the category name mapping (from tab ID to category name)
      const categoryMap = {
        'inbox': 'Inbox',
        'startup': 'Startup',
        'fund': 'Fund',
        'real_estate': 'Real Estate',
        'private_equity': 'Private Equity',
        'private_debt': 'Private Debt',
        'other': 'Other'
      };
      
      // Get the expected category name for the active tab
      const expectedCategory = categoryMap[activeTab];
      
      // First filter by category
      let filtered = deals;
      
      if (expectedCategory) {
        console.log(`Filtering for category: ${expectedCategory}`);
        
        // Filter deals with matching category (case-insensitive)
        filtered = deals.filter(deal => {
          const dealCategory = deal.category || '';
          // Handle case and spacing differences
          return dealCategory.toLowerCase() === expectedCategory.toLowerCase();
        });
      }
      
      // Then filter by stage if a stage filter is selected
      if (stageFilter) {
        filtered = filtered.filter(deal => deal.stage === stageFilter);
      }
      
      console.log(`Found ${filtered.length} deals after filtering`);
      setFilteredDeals(filtered);
    }
  }, [activeTab, deals, stageFilter]);
  
  // Separate effect for window resize and grid updates
  useEffect(() => {
    if (!gridApi) return;
    
    const handleResize = () => {
      gridApi.sizeColumnsToFit();
      
      // Reposition our custom filter dropdown after grid resize
      setTimeout(positionManualFilter, 100);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Set a timeout to position the filter after grid has fully initialized
    const initialPositionTimeout = setTimeout(() => {
      positionManualFilter();
    }, 500);
    
    return () => {
      window.removeEventListener('resize', handleResize, { passive: true });
      clearTimeout(initialPositionTimeout);
    };
  }, [gridApi, positionManualFilter]);

  // Define menu items with icons
  const menuItems = [
    { id: 'inbox', name: 'Inbox', icon: <FiInbox /> },
    { id: 'startup', name: 'Startup', icon: <FiCpu /> },
    { id: 'fund', name: 'Fund', icon: <FiDollarSign /> },
    { id: 'real_estate', name: 'Real Estate', icon: <FiHome /> },
    { id: 'private_equity', name: 'Private Equity', icon: <FiBriefcase /> },
    { id: 'private_debt', name: 'Private Debt', icon: <FiBriefcase /> },
    { id: 'other', name: 'Other', icon: <FiPackage /> }
  ];
  
  return (
    <Container>
      {/* Inject custom styles for toasts */}
      <style>{toastStyles}</style>
      
      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      {/* Manual Filter Dropdown positioned over the AG Grid filter cell */}
      {showManualStageFilter && (
        <div 
          className="manual-stage-filter-container"
          style={{
            position: 'absolute', 
            top: filterPosition.top + 'px',
            left: filterPosition.left + 'px',
            width: filterPosition.width + 'px',
            height: filterPosition.height + 'px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'all'
          }}
        >
          <select 
            value={stageFilter} 
            onChange={e => setStageFilter(e.target.value)}
            className="stage-filter-dropdown"
            style={{
              width: '95%',
              height: '75%',
              backgroundColor: '#1a1a1a',
              color: '#00ff00',
              border: '2px solid #00ff00',
              borderRadius: '4px',
              padding: '5px',
              fontFamily: 'Courier New, monospace',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textShadow: '0 0 5px rgba(0, 255, 0, 0.5)',
              boxShadow: '0 0 8px rgba(0, 255, 0, 0.5)',
              outline: 'none'
            }}
          >
            <option value="">All Stages</option>
            <option value="Lead">Lead</option>
            <option value="Qualified">Qualified</option>
            <option value="Evaluating">Evaluating</option>
            <option value="Closing">Closing</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Invested">Invested</option>
            <option value="Closed Lost">Closed Lost</option>
            <option value="Monitoring">Monitoring</option>
            <option value="Passed">Passed</option>
          </select>
        </div>
      )}
      
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
      
      <Title>Deals ({filteredDeals.length})</Title>
      
      
      {error && <ErrorText>Error: {error}</ErrorText>}
      
      {loading !== false ? (
        <LoadingContainer>
          <LoadingText>
            {typeof loading === 'string' 
              ? loading.replace(/Loading .+ \d+\/\d+/, 'Initializing Matrix') 
              : 'Accessing Deal Pipeline...'}
          </LoadingText>
          <LoadingBar />
          <LoadingMatrix />
        </LoadingContainer>
      ) : !showGrid && !error ? (
        <LoadingContainer>
          <LoadingText>Preparing deal grid...</LoadingText>
          <LoadingBar />
          <LoadingMatrix />
        </LoadingContainer>
      ) : deals.length === 0 && !error ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#00ff00',
          background: '#121212',
          borderRadius: '8px'
        }}>
          No deals found. Try refreshing the page or check database connection.
        </div>
      ) : (
        <div 
          className="ag-theme-alpine" 
          style={{ 
            height: 'calc(100% - 100px)', 
            width: '100%',
            margin: '0 20px',
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
            rowData={filteredDeals}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onRowClicked={handleRowClicked}
            onCellValueChanged={onCellValueChanged}
            rowSelection="single"
            animateRows={true}
            pagination={true}
            paginationPageSize={50}
            suppressCellFocus={false}
            enableCellTextSelection={true}
            context={gridContext}
            editType="cell"
            stopEditingWhenCellsLoseFocus={true}
            components={{
              stageFloatingFilter: StageFloatingFilterFinal,
              agFloatingFilterCellRenderer: StageFloatingFilterFinal // Alternative registration
            }}
          />
        </div>
      )}
      
      {/* Attachments Modal */}
      <Modal
        isOpen={showAttachmentsModal}
        onRequestClose={() => setShowAttachmentsModal(false)}
        style={modalStyles}
        contentLabel="Attachments"
      >
        <AttachmentsModalContent>
          <ModalHeader>
            <h2>Attachments for {dealName}</h2>
            <button onClick={() => setShowAttachmentsModal(false)}>✕</button>
          </ModalHeader>
          
          {/* File Upload Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '20px', 
            borderBottom: '1px solid #333',
            paddingBottom: '20px'
          }}>
            <input 
              type="file" 
              id="file-upload" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <AttachmentButton 
              style={{ 
                padding: '8px 16px', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: uploading ? 0.7 : 1,
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
              onClick={() => !uploading && document.getElementById('file-upload').click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#00ff00" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ animation: 'spin 1s linear infinite' }}
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="#00ff00" strokeDasharray="32" strokeDashoffset="32">
                      <animateTransform 
                        attributeName="transform" 
                        type="rotate" 
                        from="0 12 12" 
                        to="360 12 12" 
                        dur="1s" 
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#00ff00" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload New Attachment
                </>
              )}
            </AttachmentButton>
          </div>
          
          <AttachmentList>
            {selectedAttachments.length > 0 ? (
              selectedAttachments.map((attachment) => (
                <AttachmentItem key={attachment.attachment_id}>
                  <AttachmentIcon>
                    {attachment.file_type?.includes('image') ? '🖼️' : 
                     attachment.file_type?.includes('pdf') ? '📄' : 
                     attachment.file_type?.includes('spreadsheet') || attachment.file_type?.includes('excel') ? '📊' : 
                     attachment.file_type?.includes('word') || attachment.file_type?.includes('document') ? '📝' : 
                     attachment.file_type?.includes('presentation') ? '📊' : '📎'}
                  </AttachmentIcon>
                  <AttachmentDetails>
                    <div className="filename">{attachment.file_name}</div>
                    <div className="fileinfo">
                      {attachment.file_type} • {(attachment.file_size / 1024).toFixed(0)} KB
                    </div>
                  </AttachmentDetails>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <AttachmentLink 
                      href={attachment.permanent_url || attachment.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Open
                    </AttachmentLink>
                    <AttachmentButton
                      onClick={() => {
                        document.getElementById('file-upload').click();
                      }}
                    >
                      Upload
                    </AttachmentButton>
                  </div>
                </AttachmentItem>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>
                No attachments available
              </div>
            )}
          </AttachmentList>
        </AttachmentsModalContent>
      </Modal>

      {/* Tags Modal */}
      <Modal
        isOpen={showTagsModal}
        onRequestClose={() => {
          setShowTagsModal(false);
          setTagSearchTerm(''); // Clear search term when modal is closed
        }}
        style={modalStyles}
        contentLabel="Manage Tags"
      >
        <TagsModalContent>
          <ModalHeader>
            <h2>Manage Tags for {selectedDeal?.opportunity || 'Deal'}</h2>
            <button onClick={() => {
              setShowTagsModal(false);
              setTagSearchTerm(''); // Clear search term when modal is closed
            }}>✕</button>
          </ModalHeader>

          {/* Current deal tags */}
          <TagsSection style={{ paddingTop: 0, borderTop: 'none' }}>
            <TagsTitle>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              CURRENT TAGS
            </TagsTitle>
            <TagsContainer>
              {selectedDeal?.tags && selectedDeal.tags.length > 0 ? (
                selectedDeal.tags.map(tag => (
                  <TagItem 
                    key={tag.tag_id} 
                    $selected={true}
                    onClick={() => handleTagOperation('remove', tag.tag_id)}
                  >
                    {tag.name}
                    <span style={{ marginLeft: '6px', fontSize: '12px' }}>✕</span>
                  </TagItem>
                ))
              ) : (
                <div style={{ color: '#aaa', fontStyle: 'italic', padding: '10px 0' }}>No tags assigned to this deal</div>
              )}
            </TagsContainer>
          </TagsSection>

          {/* Add Tags section with search and create functionality */}
          <TagsSection>
            <TagsTitle>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              ADD TAGS
            </TagsTitle>
            
            <SearchContainer>
              <SearchInput
                type="text"
                placeholder="Search for tags..."
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  // If Enter is pressed and there are no matching tags, create a new one
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const searchTerm = e.target.value.trim().toLowerCase();
                    const hasMatch = availableTags.some(tag => 
                      !selectedDeal?.tags?.some(t => t.tag_id === tag.tag_id) &&
                      tag.name.toLowerCase() === searchTerm
                    );
                    
                    if (!hasMatch) {
                      handleCreateTag(searchTerm).then(tagId => {
                        if (tagId) {
                          handleTagOperation('add', tagId);
                          setTagSearchTerm(''); // Clear search after creating
                        }
                      });
                    }
                  }
                }}
                autoFocus
              />
            </SearchContainer>
            
            <TagsContainer>
              {/* Only show tags if there's a search term */}
              {tagSearchTerm !== '' ? (
                <>
                  {availableTags
                    .filter(tag => 
                      // Don't show tags already assigned to the deal
                      !selectedDeal?.tags?.some(t => t.tag_id === tag.tag_id) &&
                      // Filter by search term
                      tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
                    )
                    .map(tag => (
                      <TagItem 
                        key={tag.tag_id}
                        onClick={() => handleTagOperation('add', tag.tag_id)}
                      >
                        {tag.name}
                        <span style={{ marginLeft: '6px', fontSize: '12px' }}>+</span>
                      </TagItem>
                    ))
                  }
                  
                  {/* Show create new tag option when no exact match found */}
                  {tagSearchTerm.trim() !== '' && 
                   !availableTags.some(tag => 
                    !selectedDeal?.tags?.some(t => t.tag_id === tag.tag_id) &&
                    tag.name.toLowerCase() === tagSearchTerm.trim().toLowerCase()
                   ) && (
                    <TagItem 
                      $selected={true}
                      style={{ 
                        backgroundColor: 'rgba(0, 255, 0, 0.15)',
                        cursor: 'pointer',
                        border: '1px dashed #00ff00'
                      }}
                      onClick={() => {
                        handleCreateTag(tagSearchTerm).then(tagId => {
                          if (tagId) {
                            handleTagOperation('add', tagId);
                            setTagSearchTerm(''); // Clear search after creating
                          }
                        });
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Create "{tagSearchTerm}"
                    </TagItem>
                  )}
                  
                  {/* Show a message when no matching tags are found and search is empty */}
                  {availableTags.filter(tag => 
                    !selectedDeal?.tags?.some(t => t.tag_id === tag.tag_id) &&
                    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
                  ).length === 0 && tagSearchTerm.trim() === '' && (
                    <div style={{ width: '100%', textAlign: 'center', padding: '10px', color: '#aaa' }}>
                      No matching tags found.
                    </div>
                  )}
                </>
              ) : null}
            </TagsContainer>
          </TagsSection>
        </TagsModalContent>
      </Modal>
    </Container>
  );
};

// Reference to the StageFloatingFilterFinal for component registration
// This is needed for the AG Grid components registration

export default SimpleDeals;