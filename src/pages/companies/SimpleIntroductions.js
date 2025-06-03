import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { AgGridReact } from '../../ag-grid-setup';
import { FiEdit2, FiFileText, FiSearch, FiPlus, FiTrash2 } from 'react-icons/fi';
import { createGlobalStyle } from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-toastify';
import IntroductionAddModal from '../../components/modals/IntroductionAddModal';

// Custom toast styling and grid overrides - exact same as ContactsListTable
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

// Styled components - exact same as ContactsListTable
const Container = styled.div`
  height: calc(100vh - 60px);
  width: 100%;
  padding: 0 5px 0 0;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
  position: relative;
`;

// Search bar components - exact same as before
const SearchBarContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 20px;
  gap: 10px;
`;

const DealSearchInput = styled.input`
  background-color: #222;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 12px 8px 40px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  width: 300px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #666;
  }
  
  &::placeholder {
    color: #666;
    font-style: normal;
    text-transform: uppercase;
  }
`;

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIconInside = styled.div`
  position: absolute;
  left: 12px;
  color: #00ff00;
  display: flex;
  align-items: center;
  font-size: 16px;
  pointer-events: none;
  z-index: 1;
`;

// Table container to account for search bar and filter buttons
const TableContainer = styled.div`
  height: calc(100% - 140px);
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

// Status renderer with color-coded dropdowns
const StatusRenderer = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedValue, setSelectedValue] = useState(props.value || 'Requested');

  const statusOptions = [
    'Promised',
    'Requested',
    'Done & Dust',
    'Aborted',
    'Done, but need to monitor'
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'aborted': return '#ff0000';
      default: return '#00ff00';
    }
  };

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
      // Update the database
      const { error } = await supabase
        .from('introductions')
        .update({ status: newValue })
        .eq('introduction_id', props.data.id);
        
      if (error) throw error;
      
      // Update local state
      setSelectedValue(newValue);
      props.setValue(newValue);
      
      // Update the data object
      props.data.status = newValue;
      
      // Refresh the grid
      if (props.api) {
        props.api.refreshCells({
          force: true,
          rowNodes: [props.node],
          columns: ['status']
        });
      }
      
      setIsEditing(false);
      toast.success(`Status updated to "${newValue}"`);
      
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update status: ${error.message}`);
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
        {statusOptions.map(option => (
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
        color: getStatusColor(selectedValue),
        justifyContent: 'center'
      }}
      title="Click to edit status"
    >
      {selectedValue || 'Select status'}
    </div>
  );
};

// Simple display-only renderer for People Introduced column
const PeopleIntroducedRenderer = (props) => {
  const displayValue = props.value || '';
  const isEmpty = !displayValue.trim();

  return (
    <div
      style={{
        padding: '2px 6px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        color: isEmpty ? '#666' : '#e0e0e0',
        fontStyle: isEmpty ? 'italic' : 'normal',
        textAlign: 'left',
        fontSize: '16px',
        fontWeight: '500'
      }}
      title={displayValue || 'People introduced'}
    >
      {isEmpty ? 'No people' : displayValue}
    </div>
  );
};

// Simple display-only renderer for Notes column
const NotesRenderer = (props) => {
  const displayValue = props.value || '';
  const isEmpty = !displayValue.trim();

  return (
    <div
      style={{
        padding: '2px 6px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        color: isEmpty ? '#666' : '#e0e0e0',
        fontStyle: isEmpty ? 'italic' : 'normal'
      }}
      title={displayValue || 'Notes'}
    >
      {isEmpty ? 'No notes' : displayValue}
    </div>
  );
};

// Enhanced general text renderer with improved styling
const EditableTextRenderer = (props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(props.value || '');

  const handleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleChange = (e) => {
    setCurrentValue(e.target.value);
  };

  const handleBlur = async () => {
    setIsEditing(false);
    
    if (currentValue !== (props.value || '')) {
      const contactId = props.data?.id;
      const fieldName = props.colDef.field;
      
      if (!contactId || !fieldName) return;
      
      try {
        // Map frontend field names to database field names
        const fieldMapping = {
          'peopleIntroduced': null, // Contact IDs - will need special handling
          'relatedCompanies': null, // Not available in schema
          'notes': null, // Not available as direct field
          'intro': 'text',
          'rationale': 'category'
        };
        
        const dbFieldName = fieldMapping[fieldName];
        
        // Skip fields that don't have direct database mapping
        if (!dbFieldName) {
          console.log(`Field ${fieldName} cannot be directly updated - no database mapping`);
          return;
        }
        
        // Update the database
        const { error } = await supabase
          .from('introductions')
          .update({ [dbFieldName]: currentValue })
          .eq('introduction_id', contactId);
          
        if (error) throw error;
        
        toast.success('Updated successfully');
        props.setValue(currentValue);
        
      } catch (err) {
        console.error('Error updating field:', err);
        toast.error('Failed to update field');
        // Reset to original value on error
        setCurrentValue(props.value || '');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setCurrentValue(props.value || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '2px'
      }}>
        <input
          type="text"
          value={currentValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyPress}
          autoFocus
          style={{
            width: '100%',
            height: '28px',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            color: '#ffffff',
            border: '2px solid #00ff00',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '12px',
            fontFamily: 'Courier New, monospace',
            outline: 'none',
            boxShadow: '0 0 8px rgba(0, 255, 0, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(5px)'
          }}
          placeholder="Enter text..."
        />
      </div>
    );
  }

  const displayValue = currentValue || props.value || '';
  const isEmpty = !displayValue.trim();

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        padding: '2px 6px',
        margin: '2px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: 'calc(100% - 4px)',
        height: 'calc(100% - 4px)',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '3px',
        background: isEmpty ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
        border: '1px solid transparent',
        transition: 'all 0.2s ease',
        color: isEmpty ? '#666' : '#e0e0e0',
        fontStyle: isEmpty ? 'italic' : 'normal',
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(0, 255, 0, 0.08)';
        e.target.style.border = '1px solid rgba(0, 255, 0, 0.4)';
        e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 255, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = isEmpty ? 'rgba(255, 255, 255, 0.02)' : 'transparent';
        e.target.style.border = '1px solid transparent';
        e.target.style.boxShadow = 'none';
      }}
      title={displayValue || 'Click to edit'}
    >
      {isEmpty ? 'Click to add' : displayValue}
    </div>
  );
};

// Add New Button - exact same styling as AddDealButton
const AddNewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #00ff00;
  color: #000000;
  border: 1px solid #00ff00;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Courier New', monospace;
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  margin-left: auto; /* Push to the right */
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.9);
    box-shadow: 0 0 12px rgba(0, 255, 0, 0.5);
    text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  }
  
  svg {
    font-size: 16px;
  }
`;

// Category dropdown renderer for editing introduction categories
const CategoryDropdownRenderer = (props) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(props.value || '');
  
  // Available category options for introductions
  const categoryOptions = [
    'Dealflow',
    'Portfolio Company', 
    'Karma Points'
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
      // Update the database
      const { error } = await supabase
        .from('introductions')
        .update({ category: newValue })
        .eq('introduction_id', props.data.id);
        
      if (error) throw error;
      
      // Update local state
      setSelectedValue(newValue);
      props.setValue(newValue);
      
      // Update the data object
      props.data.rationale = newValue;
      
      // Refresh the grid
      if (props.api) {
        props.api.refreshCells({
          force: true,
          rowNodes: [props.node],
          columns: ['rationale']
        });
      }
      
      setIsEditing(false);
      toast.success(`Category updated to "${newValue}"`);
      
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
        color: selectedValue ? '#e0e0e0' : '#888'
      }}
      title="Click to edit category"
    >
      {selectedValue || 'Select category'}
    </div>
  );
};

// Actions renderer - shows delete button for each introduction
const ActionsRenderer = (props) => {
  const handleDelete = async (e) => {
    e?.stopPropagation(); // Prevent row selection
    
    if (!props.data || !props.data.id) {
      console.error('No introduction ID found');
      return;
    }

    const introductionId = props.data.id;
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this introduction?\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const { error } = await supabase
        .from('introductions')
        .delete()
        .eq('introduction_id', introductionId);

      if (error) throw error;

      toast.success('Introduction deleted successfully!');
      
      // Refresh the data
      if (props.context && props.context.refreshData) {
        props.context.refreshData();
      }
    } catch (error) {
      console.error('Error deleting introduction:', error);
      toast.error(`Failed to delete introduction: ${error.message}`);
    }
  };

  return (
    <div 
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
      }}
    >
      <button
        onClick={handleDelete}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#ff6b6b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '3px',
          transition: 'all 0.2s',
          padding: '0',
          margin: '0'
        }}
        title="Delete Introduction"
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.color = '#ff5555';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.color = '#ff6b6b';
        }}
      >
        <FiTrash2 size={14} />
      </button>
    </div>
  );
};

// RelatedCompaniesRenderer - styled similar to CompanyRenderer but without X and plus buttons
const RelatedCompaniesRenderer = (props) => {
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0);
  
  // Parse companies from the relatedCompanies string (comma-separated)
  const companiesString = props.value || '';
  const companies = companiesString ? companiesString.split(', ').filter(name => name.trim()) : [];
  const hasMultipleCompanies = companies.length > 1;
  
  // Navigation functions for company carousel
  const goToNextCompany = (e) => {
    e?.stopPropagation();
    setCurrentCompanyIndex((prevIndex) => (prevIndex + 1) % companies.length);
  };
  
  // Prevent event propagation
  const handleContainerClick = (e) => {
    e.stopPropagation();
  };

  if (!companies.length) {
    return (
      <div style={{
        padding: '2px 4px',
        color: '#666',
        fontStyle: 'italic',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        No companies
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
  
  // Ensure consistent row height
  const rowHeight = 36;
  
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
        gap: '4px'
      }}>
        {/* Company display with white outline box - tight around content */}
        <div 
          style={{ 
            display: 'inline-flex', 
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
            height: '18px',
            position: 'relative',
            maxWidth: '200px' // Prevent extremely long names from breaking layout
          }}
        >
          <span 
            style={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              maxWidth: hasMultipleCompanies ? '120px' : '160px'
            }}
            title={currentCompany}
          >
            {currentCompany}
          </span>
          
          {/* Counter indicator for multiple companies */}
          {hasMultipleCompanies && (
            <div style={{
              fontSize: '9px',
              color: '#cccccc',
              marginLeft: '4px',
              padding: '0 2px',
              borderRadius: '3px',
              backgroundColor: '#333333',
              flexShrink: 0
            }}>
              {currentCompanyIndex + 1}/{companies.length}
            </div>
          )}
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
      </div>
    </div>
  );
};

// Main component
const SimpleIntroductions = () => {
  const [introductions, setIntroductions] = useState([]);
  const [filteredIntroductions, setFilteredIntroductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(null); // New state for category filter
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch data from Supabase introductions table
  const fetchIntroductions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('introductions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      // Debug: Log the raw data to see actual column names
      console.log('Raw introductions data from Supabase:', data);
      if (data && data.length > 0) {
        console.log('First row keys:', Object.keys(data[0]));
        console.log('First row sample:', data[0]);
      }
      
      // Get all unique contact IDs from the introductions
      const allContactIds = new Set();
      data?.forEach(intro => {
        if (intro.contact_ids && Array.isArray(intro.contact_ids)) {
          intro.contact_ids.forEach(id => allContactIds.add(id));
        }
      });
      
      // Fetch contact names for the contact IDs
      let contactsMap = {};
      let companiesMap = {};
      if (allContactIds.size > 0) {
        console.log('Fetching contacts for IDs:', Array.from(allContactIds));
        
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name')
          .in('contact_id', Array.from(allContactIds));
        
        if (contactsError) {
          console.error('Error fetching contacts:', contactsError);
        } else {
          console.log('Fetched contacts data:', contactsData);
          
          // Create a map of contact_id to full name
          contactsData?.forEach(contact => {
            const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
            console.log(`Contact ${contact.contact_id}: first_name="${contact.first_name}", last_name="${contact.last_name}", combined="${fullName}"`);
            contactsMap[contact.contact_id] = fullName || 'Unknown Contact';
          });
          
          console.log('Final contacts map:', contactsMap);
          
          // Check for missing contacts
          const fetchedIds = new Set(contactsData?.map(c => c.contact_id) || []);
          const missingIds = Array.from(allContactIds).filter(id => !fetchedIds.has(id));
          if (missingIds.length > 0) {
            console.warn('Contact IDs not found in database:', missingIds);
          }
        }
        
        // Fetch companies for the contacts
        console.log('Fetching companies for contact IDs:', Array.from(allContactIds));
        
        const { data: contactCompaniesData, error: contactCompaniesError } = await supabase
          .from('contact_companies')
          .select(`
            contact_id,
            company_id,
            companies!inner(
              company_id,
              name
            )
          `)
          .in('contact_id', Array.from(allContactIds));
          
        if (contactCompaniesError) {
          console.error('Error fetching contact companies:', contactCompaniesError);
        } else {
          console.log('Fetched contact companies data:', contactCompaniesData);
          
          // Create a map of contact_id to array of company names
          contactCompaniesData?.forEach(contactCompany => {
            const contactId = contactCompany.contact_id;
            const companyName = contactCompany.companies?.name;
            
            if (companyName) {
              if (!companiesMap[contactId]) {
                companiesMap[contactId] = [];
              }
              companiesMap[contactId].push(companyName);
            }
          });
          
          console.log('Final companies map:', companiesMap);
        }
      }
      
      // Transform the data to match the expected format
      const transformedData = data?.map((item, index) => {
        // Build people introduced string from contact_ids
        let peopleIntroduced = '';
        if (item.contact_ids && Array.isArray(item.contact_ids)) {
          const contactNames = item.contact_ids.map(id => {
            if (contactsMap[id]) {
              return contactsMap[id];
            } else {
              // Contact not found in database - likely deleted
              return `🚫 Deleted Contact`;
            }
          });
          peopleIntroduced = contactNames.join(' ↔ ');
        }
        
        // Build related companies string from contact_ids
        let relatedCompanies = '';
        if (item.contact_ids && Array.isArray(item.contact_ids)) {
          const allCompanies = new Set();
          item.contact_ids.forEach(contactId => {
            if (companiesMap[contactId]) {
              companiesMap[contactId].forEach(companyName => {
                allCompanies.add(companyName);
              });
            }
          });
          relatedCompanies = Array.from(allCompanies).join(', ');
        }
        
        return {
          id: item.introduction_id || index + 1,
          date: item.introduction_date || (item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : ''),
          peopleIntroduced: peopleIntroduced,
          relatedCompanies: relatedCompanies,
          notes: '', // Will use the notes field for additional info
          intro: item.text || '',
          rationale: item.category || '',
          status: item.status || 'Requested'
        };
      }) || [];
      
      console.log('Transformed data:', transformedData);
      
      setIntroductions(transformedData);
      setFilteredIntroductions(transformedData);
    } catch (err) {
      console.error('Error fetching introductions:', err);
      setError(`Failed to load introductions: ${err.message}`);
      setIntroductions([]);
      setFilteredIntroductions([]);
    } finally {
      setLoading(false);
    }
  };

  // Column definitions with the requested fields
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Date', 
      field: 'date',
      valueFormatter: (params) => {
        if (!params.value) return '';
        try {
          const date = new Date(params.value);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = String(date.getFullYear()).slice(-2);
          return `${day}/${month}/${year}`;
        } catch (error) {
          return params.value;
        }
      },
      minWidth: 80,
      flex: 0.7,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
      sort: 'desc',
      initialSort: true,
    },
    { 
      headerName: 'People Introduced', 
      field: 'peopleIntroduced',
      cellRenderer: PeopleIntroducedRenderer,
      minWidth: 250,
      flex: 4,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Related Companies', 
      field: 'relatedCompanies',
      cellRenderer: RelatedCompaniesRenderer,
      minWidth: 200,
      flex: 2.5,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Notes', 
      field: 'intro',
      cellRenderer: NotesRenderer,
      minWidth: 150,
      flex: 1.8,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Category', 
      field: 'rationale',
      cellRenderer: CategoryDropdownRenderer,
      minWidth: 150,
      flex: 1.8,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    {
      headerName: 'Status',
      field: 'status',
      cellRenderer: StatusRenderer,
      minWidth: 100,
      flex: 0.9,
      filter: true,
      floatingFilter: true,
      sortable: true,
      cellStyle: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: ActionsRenderer,
      minWidth: 70,
      flex: 0.4,
      filter: false,
      floatingFilter: false,
      sortable: false,
      cellStyle: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
  }), []);

  // Grid ready event handler
  const onGridReady = (params) => {
    setGridApi(params.api);
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          params.api.sizeColumnsToFit();
          
          setTimeout(() => {
            try {
              if (params.api.applyColumnState) {
                params.api.applyColumnState({
                  state: [{ colId: 'date', sort: 'desc' }],
                  defaultState: { sort: null }
                });
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
  
  // Custom row height function
  const getRowHeight = useCallback(() => {
    return 36;
  }, []);
  
  // Custom row style
  const getRowStyle = useCallback((params) => {
    return { 
      background: params.node.rowIndex % 2 === 0 ? '#121212' : '#1a1a1a',
      borderRight: 'none'
    };
  }, []);

  // Load data and expose refresh function
  useEffect(() => {
    fetchIntroductions();
    
    // Expose refresh function globally for status updates
    window.refreshIntroductionsData = refreshData;
    
    // Cleanup
    return () => {
      delete window.refreshIntroductionsData;
    };
  }, []);

  // Filter data based on search term and category
  useEffect(() => {
    let filtered = introductions;
    
    // Apply category filter first
    if (activeCategory !== null) {
      filtered = filtered.filter(intro => intro.rationale === activeCategory);
    }
    
    // Then apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(intro => 
        Object.values(intro).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    setFilteredIntroductions(filtered);
  }, [searchTerm, introductions, activeCategory]);

  // Handle window resize
  useEffect(() => {
    if (!gridApi) return;
    
    let resizeTimer;
    let animationFrameId;
    
    const handleResize = () => {
      clearTimeout(resizeTimer);
      cancelAnimationFrame(animationFrameId);
      
      resizeTimer = setTimeout(() => {
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

  // Refresh data function
  const refreshData = () => {
    fetchIntroductions();
  };

  // Handle adding new introduction
  const handleAddNew = () => {
    console.log('Add new introduction clicked');
    setShowAddModal(true);
  };

  // Handle category filter
  const handleCategoryFilter = (category) => {
    // Toggle: if the same category is clicked, deselect it (show all)
    if (activeCategory === category) {
      setActiveCategory(null);
      console.log('Deselecting category, showing all results');
    } else {
      setActiveCategory(category);
      console.log('Filtering by category:', category);
    }
  };

  return (
    <Container>
      <ToastStyle />
      
      {/* Search Bar - exact same as before */}
      <SearchBarContainer>
        <SearchInputContainer>
          <SearchIconInside>
            <FiSearch />
          </SearchIconInside>
          <DealSearchInput
            type="text"
            placeholder="SEARCH..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchInputContainer>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00ff00',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px'
            }}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </SearchBarContainer>
      
      {/* Filter Buttons - exact same styling as Invested/Monitoring buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
          {/* Dealflow Filter Button */}
          <button
            onClick={() => handleCategoryFilter('Dealflow')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeCategory === 'Dealflow' ? 'rgba(0, 255, 0, 0.4)' : 'rgba(0, 255, 0, 0.2)',
              color: '#00ff00',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Courier New, monospace',
              boxShadow: activeCategory === 'Dealflow' ? '0 0 12px rgba(0, 255, 0, 0.5)' : '0 0 8px rgba(0, 255, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              if (activeCategory !== 'Dealflow') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 0, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              if (activeCategory !== 'Dealflow') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 255, 0, 0.3)';
              }
            }}
          >
            Dealflow
          </button>

          {/* Portfolio Company Filter Button */}
          <button
            onClick={() => handleCategoryFilter('Portfolio Company')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeCategory === 'Portfolio Company' ? 'rgba(0, 255, 0, 0.4)' : 'rgba(0, 255, 0, 0.2)',
              color: '#00ff00',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Courier New, monospace',
              boxShadow: activeCategory === 'Portfolio Company' ? '0 0 12px rgba(0, 255, 0, 0.5)' : '0 0 8px rgba(0, 255, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              if (activeCategory !== 'Portfolio Company') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 0, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              if (activeCategory !== 'Portfolio Company') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 255, 0, 0.3)';
              }
            }}
          >
            Portfolio Company
          </button>

          {/* Karma Points Filter Button */}
          <button
            onClick={() => handleCategoryFilter('Karma Points')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeCategory === 'Karma Points' ? 'rgba(0, 255, 0, 0.4)' : 'rgba(0, 255, 0, 0.2)',
              color: '#00ff00',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Courier New, monospace',
              boxShadow: activeCategory === 'Karma Points' ? '0 0 12px rgba(0, 255, 0, 0.5)' : '0 0 8px rgba(0, 255, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              if (activeCategory !== 'Karma Points') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 0, 0.5)';
              }
            }}
            onMouseOut={(e) => {
              if (activeCategory !== 'Karma Points') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 255, 0, 0.3)';
              }
            }}
          >
            Karma Points
          </button>
        </div>
        <AddNewButton onClick={handleAddNew}>
          <FiPlus /> ADD NEW
        </AddNewButton>
      </div>
      
      <TableContainer>
        {error && <ErrorText>Error: {error}</ErrorText>}
        
        {loading ? (
          <LoadingContainer>
            <LoadingText>Loading introductions...</LoadingText>
            <LoadingBar />
          </LoadingContainer>
        ) : filteredIntroductions.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            color: '#00ff00',
            background: '#121212',
            borderRadius: '8px'
          }}>
            {searchTerm ? `No introductions found matching "${searchTerm}"` : 'No introductions found.'}
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
              rowData={filteredIntroductions}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              rowSelection="none"
              animateRows={false}
              pagination={true}
              paginationPageSize={100}
              suppressCellFocus={true}
              enableCellTextSelection={true}
              getRowHeight={getRowHeight}
              getRowStyle={getRowStyle}
              suppressHorizontalScroll={true}
              paginationNumberFormatter={(params) => {
                return `${params.value}`; 
              }}
              alwaysShowHorizontalScroll={false}
              alwaysShowVerticalScroll={false}
              overlayNoRowsTemplate='<span style="padding: 10px; border: 1px solid #00ff00; background: #121212; color: #00ff00;">No introductions found</span>'
            />
          </div>
        )}
      </TableContainer>

      {showAddModal && (
        <IntroductionAddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={refreshData}
        />
      )}
    </Container>
  );
};

export default SimpleIntroductions; 