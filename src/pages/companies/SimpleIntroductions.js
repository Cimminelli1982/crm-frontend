import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { AgGridReact } from '../../ag-grid-setup';
import { FiEdit2, FiFileText, FiSearch, FiPlus } from 'react-icons/fi';
import { createGlobalStyle } from 'styled-components';
import { supabase } from '../../lib/supabaseClient';

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
  const [currentStatus, setCurrentStatus] = useState(props.value || 'Requested');

  const statusOptions = [
    'Requested',
    'Pending',
    'Scheduled', 
    'Completed',
    'Cancelled',
    'Follow-up Required'
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#00ff00';
      case 'scheduled': return '#ffaa00';
      case 'pending': return '#ffff00';
      case 'follow-up required': return '#ff6600';
      case 'cancelled': return '#ff3333';
      default: return '#aaaaaa';
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const contactId = props.data?.id;
    
    if (!contactId) return;
    
    try {
      // Update local state first
      setCurrentStatus(newStatus);
      setIsEditing(false);
      
      // Update the database
      const { error } = await supabase
        .from('introductions')
        .update({ status: newStatus })
        .eq('introduction_id', contactId);
        
      if (error) throw error;
      
      // Refresh the data to show the update
      if (window.refreshIntroductionsData) {
        window.refreshIntroductionsData();
      }
      
      console.log(`Updated status for introduction ${contactId} to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
      // Reset to original value on error
      setCurrentStatus(props.value || 'Requested');
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        onBlur={handleBlur}
        autoFocus
        style={{
          background: '#222',
          color: getStatusColor(currentStatus),
          border: `1px solid ${getStatusColor(currentStatus)}`,
          borderRadius: '4px',
          padding: '2px 4px',
          fontSize: '12px',
          width: '100%',
          outline: 'none'
        }}
      >
        {statusOptions.map(option => (
          <option key={option} value={option} style={{ background: '#222', color: getStatusColor(option) }}>
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
        color: '#ffffff',
        cursor: 'pointer',
        padding: '2px 4px',
        fontSize: '12px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
    >
      {currentStatus}
    </div>
  );
};

// Notes renderer with icon that changes color based on content
const NotesRenderer = (props) => {
  const hasNotes = props.value && props.value.trim().length > 0;
  
  const handleClick = (e) => {
    e.stopPropagation();
    // TODO: Open notes modal
    console.log('Open notes for:', props.data);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <button
        onClick={handleClick}
        style={{
          background: 'none',
          border: 'none',
          color: hasNotes ? '#00ff00' : '#666',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s'
        }}
        title={hasNotes ? 'View notes' : 'Add notes'}
      >
        <FiFileText size={14} />
      </button>
    </div>
  );
};

// Simple text renderer for editable fields
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
        
        console.log(`Updated ${fieldName} (${dbFieldName}) for introduction ${contactId} to ${currentValue}`);
      } catch (err) {
        console.error('Error updating field:', err);
        alert('Failed to update field. Please try again.');
        // Reset to original value on error
        setCurrentValue(props.value || '');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
        autoFocus
        style={{
          background: '#222',
          color: '#fff',
          border: '1px solid #00ff00',
          borderRadius: '4px',
          padding: '2px 4px',
          fontSize: '12px',
          fontFamily: 'Courier New, monospace',
          width: '100%',
          outline: 'none'
        }}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        padding: '2px 4px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {currentValue || '-'}
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

// Main component
const SimpleIntroductions = () => {
  const [introductions, setIntroductions] = useState([]);
  const [filteredIntroductions, setFilteredIntroductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(null); // New state for category filter

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
          peopleIntroduced = contactNames.join(' → ');
        }
        
        return {
          id: item.introduction_id || index + 1,
          date: item.introduction_date || (item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : ''),
          peopleIntroduced: peopleIntroduced,
          relatedCompanies: '', // Not available in current schema, will be empty
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
      minWidth: 100,
      flex: 1,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
      sort: 'desc',
      initialSort: true,
    },
    { 
      headerName: 'People Introduced', 
      field: 'peopleIntroduced',
      cellRenderer: EditableTextRenderer,
      minWidth: 200,
      flex: 2.5,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Related Companies', 
      field: 'relatedCompanies',
      cellRenderer: (props) => (
        <div style={{
          padding: '2px 4px',
          color: '#666',
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center'
        }}>
          Not available
        </div>
      ),
      minWidth: 180,
      flex: 2,
      filter: false,
      floatingFilter: false,
      sortable: false,
    },
    { 
      headerName: 'Notes', 
      field: 'notes',
      cellRenderer: NotesRenderer,
      minWidth: 70,
      flex: 0.8,
      sortable: false,
      filter: false,
      cellStyle: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }
    },
    { 
      headerName: 'Intro', 
      field: 'intro',
      cellRenderer: EditableTextRenderer,
      minWidth: 200,
      flex: 2.5,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Category', 
      field: 'rationale',
      cellRenderer: EditableTextRenderer,
      minWidth: 200,
      flex: 2.5,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    {
      headerName: 'Status',
      field: 'status',
      cellRenderer: StatusRenderer,
      minWidth: 120,
      flex: 1.2,
      filter: true,
      floatingFilter: true,
      sortable: true,
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
    // TODO: Open modal or form for creating new introduction
    // For now, we'll just refresh to show any new data
    refreshData();
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
    </Container>
  );
};

export default SimpleIntroductions; 