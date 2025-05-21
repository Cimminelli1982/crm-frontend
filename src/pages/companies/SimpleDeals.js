import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import Modal from 'react-modal';
import { FiGrid, FiCpu, FiDollarSign, FiHome, FiPackage, FiBriefcase } from 'react-icons/fi';

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

const SimpleDeals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [dealName, setDealName] = useState('');
  const [activeTab, setActiveTab] = useState('all');
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
      headerName: 'Description', 
      field: 'description',
      valueGetter: (params) => {
        return params.data?.description || '-';
      },
      minWidth: 300,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      editable: true,
    },
    { 
      headerName: 'Category', 
      field: 'category',
      cellRenderer: CategoryRenderer,
      minWidth: 140,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: [
          'Startup',
          'Investment',
          'Fund',
          'Partnership',
          'Real Estate',
          'Private Debt',
          'Private Equity',
          'Other',
          'Inbox'
        ],
        cellRenderer: params => params.value || '(Empty)',
        cellHeight: 30,
        sortButtons: true
      },
      floatingFilter: true,
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
      minWidth: 130,
      filter: 'agSetColumnFilter',
      filterParams: {
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
        ],
        cellRenderer: params => params.value || '(Empty)',
        cellHeight: 30,
        sortButtons: true
      },
      floatingFilter: true,
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
      valueFormatter: (params) => params.value || '-',
      minWidth: 120,
      filter: 'agSetColumnFilter',
      filterParams: {
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
        ],
        cellRenderer: params => params.value || '(Empty)',
        cellHeight: 30,
        sortButtons: true
      },
      floatingFilter: true,
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
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 120,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    {
      headerName: 'Attachments',
      field: 'attachments',
      cellRenderer: AttachmentRenderer,
      width: 120,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
    }
  ], []);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
  }), []);
  
  // Context to pass to the grid
  const gridContext = useMemo(() => ({
    setSelectedAttachments,
    setDealName,
    setShowAttachmentsModal,
    categoryColors
  }), [categoryColors]);

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
        alert(`Error updating deal: ${error.message}`);
      } else {
        console.log(`Successfully updated ${colDef.field} for deal ${data.deal_id}`);
      }
    } catch (err) {
      console.error('Error in update operation:', err);
      alert(`Error updating deal: ${err.message}`);
    }
  }, []);

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
      
      // Fetch attachments for each deal
      const dealsWithAttachments = await Promise.all(data.map(async (deal) => {
        try {
          // Get attachment references
          const { data: attachmentRefs, error: refsError } = await supabase
            .from('deal_attachments')
            .select('attachment_id')
            .eq('deal_id', deal.deal_id);
            
          if (refsError) {
            console.error(`Error fetching attachment refs for deal ${deal.deal_id}:`, refsError);
            return { ...deal, attachments: [] };
          }
          
          if (!attachmentRefs || attachmentRefs.length === 0) {
            return { ...deal, attachments: [] };
          }
          
          // Get actual attachment details
          const attachmentIds = attachmentRefs.map(ref => ref.attachment_id);
          const { data: attachmentDetails, error: detailsError } = await supabase
            .from('attachments')
            .select('attachment_id, file_name, file_url, file_type, file_size, permanent_url')
            .in('attachment_id', attachmentIds);
            
          if (detailsError) {
            console.error(`Error fetching attachment details for deal ${deal.deal_id}:`, detailsError);
            return { ...deal, attachments: [] };
          }
          
          return { ...deal, attachments: attachmentDetails || [] };
        } catch (err) {
          console.error(`Error processing attachments for deal ${deal.deal_id}:`, err);
          return { ...deal, attachments: [] };
        }
      }));
      
      setDeals(dealsWithAttachments);
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

  // Define menu items with icons
  const menuItems = [
    { id: 'all', name: 'Full List', icon: <FiGrid /> },
    { id: 'startup', name: 'Startup', icon: <FiCpu /> },
    { id: 'fund', name: 'Fund', icon: <FiDollarSign /> },
    { id: 'real_estate', name: 'Real Estate', icon: <FiHome /> },
    { id: 'private_equity', name: 'Private Equity', icon: <FiBriefcase /> },
    { id: 'private_debt', name: 'Private Debt', icon: <FiBriefcase /> },
    { id: 'other', name: 'Other', icon: <FiPackage /> }
  ];
  
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
      
      <Title>Deals ({deals.length})</Title>
      <div style={{ margin: '0 20px 20px', color: '#00ff00' }}>
        Double-click on any Deal name, Description, Category, Stage, Source, or Investment Amount to edit it directly.
      </div>
      
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
            rowData={deals}
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
                  <AttachmentLink 
                    href={attachment.permanent_url || attachment.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Open
                  </AttachmentLink>
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
    </Container>
  );
};

export default SimpleDeals;