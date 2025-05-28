import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { AgGridReact } from '../../ag-grid-setup';
import { FiEdit2, FiFileText, FiSearch, FiPlus } from 'react-icons/fi';
import { createGlobalStyle } from 'styled-components';

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
  const [currentStatus, setCurrentStatus] = useState(props.value || 'Pending');

  const statusOptions = [
    'Pending',
    'Scheduled', 
    'Completed',
    'Cancelled',
    'Follow-up Required'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#00ff00';
      case 'Scheduled': return '#00bfff';
      case 'Pending': return '#ffaa00';
      case 'Follow-up Required': return '#ff6600';
      case 'Cancelled': return '#ff3333';
      default: return '#666';
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setCurrentStatus(newStatus);
    setIsEditing(false);
    // TODO: Update database
    console.log('Status changed to:', newStatus);
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

  const handleBlur = () => {
    setIsEditing(false);
    // TODO: Update database
    console.log('Field updated:', props.colDef.field, currentValue);
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

  // Sample data for introductions
  const sampleData = [
    {
      id: 1,
      date: '2024-01-15',
      peopleIntroduced: 'John Smith → Sarah Johnson',
      relatedCompanies: 'TechCorp, InnovateLabs',
      notes: 'Both interested in AI collaboration',
      intro: 'Connecting two AI experts for potential partnership',
      rationale: 'Complementary expertise in ML and data science',
      status: 'Completed'
    },
    {
      id: 2,
      date: '2024-01-20',
      peopleIntroduced: 'Mike Chen → Lisa Rodriguez',
      relatedCompanies: 'StartupX, VentureCapital Inc',
      notes: '',
      intro: 'Investor meeting for Series A funding',
      rationale: 'Perfect match for startup funding needs',
      status: 'Scheduled'
    },
    {
      id: 3,
      date: '2024-01-22',
      peopleIntroduced: 'David Wilson → Emma Thompson',
      relatedCompanies: 'DesignStudio, TechFlow',
      notes: 'Follow up needed on design requirements',
      intro: 'UX designer for mobile app project',
      rationale: 'Emma has experience with similar projects',
      status: 'Follow-up Required'
    },
    {
      id: 4,
      date: '2024-01-25',
      peopleIntroduced: 'Alex Kumar → Rachel Green',
      relatedCompanies: 'CloudTech, DataSystems',
      notes: 'Meeting scheduled for next week',
      intro: 'Cloud infrastructure consultation',
      rationale: 'Rachel is expert in cloud migration',
      status: 'Pending'
    },
    {
      id: 5,
      date: '2024-01-28',
      peopleIntroduced: 'Tom Anderson → Maria Garcia',
      relatedCompanies: 'FinanceFlow, CryptoVentures',
      notes: 'Project cancelled due to budget constraints',
      intro: 'Blockchain development partnership',
      rationale: 'Both companies working on similar blockchain solutions',
      status: 'Cancelled'
    }
  ];

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
      cellRenderer: EditableTextRenderer,
      minWidth: 180,
      flex: 2,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
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
      headerName: 'Rationale', 
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
      borderRight: 'none',
      '&:hover': {
        background: params.node.rowIndex % 2 === 0 ? '#121212' : '#1a1a1a',
      },
      '&.ag-row-selected': {
        background: params.node.rowIndex % 2 === 0 ? '#121212' : '#1a1a1a',
      }
    };
  }, []);

  // Load sample data
  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      setTimeout(() => {
        setIntroductions(sampleData);
        setFilteredIntroductions(sampleData);
        setLoading(false);
      }, 500);
    };

    loadData();
  }, []);

  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredIntroductions(introductions);
    } else {
      const filtered = introductions.filter(intro => 
        Object.values(intro).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredIntroductions(filtered);
    }
  }, [searchTerm, introductions]);

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
          {/* First Filter Button */}
          <button
            onClick={() => console.log('Filter per category 1 clicked')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(0, 255, 0, 0.2)',
              color: '#00ff00',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Courier New, monospace',
              boxShadow: '0 0 8px rgba(0, 255, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 0, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 255, 0, 0.3)';
            }}
          >
            Filter per category
          </button>

          {/* Second Filter Button */}
          <button
            onClick={() => console.log('Filter per category 2 clicked')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(0, 255, 0, 0.2)',
              color: '#00ff00',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Courier New, monospace',
              boxShadow: '0 0 8px rgba(0, 255, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 0, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 255, 0, 0.3)';
            }}
          >
            Filter per category
          </button>

          {/* Third Filter Button */}
          <button
            onClick={() => console.log('Filter per category 3 clicked')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(0, 255, 0, 0.2)',
              color: '#00ff00',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Courier New, monospace',
              boxShadow: '0 0 8px rgba(0, 255, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 0, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 255, 0, 0.3)';
            }}
          >
            Filter per category
          </button>
        </div>
        <AddNewButton onClick={() => {
          console.log('Add new introduction clicked');
        }}>
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