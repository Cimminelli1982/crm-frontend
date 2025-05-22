import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import Modal from 'react-modal';
import { FiGrid, FiCpu, FiDollarSign, FiHome, FiPackage, FiBriefcase, FiInbox, FiEdit, FiTrash2 } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Custom styles for neon green toast notifications
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
      cellRenderer: SourceRenderer,
      minWidth: 140,
      filter: 'agSetColumnFilter',
      filterParams: {
        values: [
          'Cold Contacting',
          'Introduction'
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
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 120,
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
  }), []);
  
  // Function to remove a deal from the grid
  const removeDeal = useCallback((dealId) => {
    setDeals(prevDeals => prevDeals.filter(deal => deal.deal_id !== dealId));
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
  
  // Context to pass to the grid
  const gridContext = useMemo(() => ({
    setSelectedAttachments,
    setDealName,
    setCurrentDealId,
    setShowAttachmentsModal,
    categoryColors,
    removeDeal
  }), [categoryColors, removeDeal]);

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
        } else if (colDef.field === 'description') {
          toast.success(`Description updated successfully`, {
            icon: '📝'
          });
        }
      }
    } catch (err) {
      console.error('Error in update operation:', err);
      toast.error(`Error updating deal: ${err.message}`);
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
      setFilteredDeals(dealsWithAttachments);
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
  
  // Filter deals based on active tab
  useEffect(() => {
    console.log('Filtering deals. Active tab:', activeTab);
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
      
      if (!expectedCategory) {
        // If no mapping found, show all deals
        console.log('No category mapping for tab, showing all deals');
        setFilteredDeals(deals);
        return;
      }
      
      console.log(`Filtering for category: ${expectedCategory}`);
      
      // Filter deals with matching category (case-insensitive)
      const filtered = deals.filter(deal => {
        const dealCategory = deal.category || '';
        // Handle case and spacing differences
        return dealCategory.toLowerCase() === expectedCategory.toLowerCase();
      });
      
      console.log(`Found ${filtered.length} deals with category '${expectedCategory}'`);
      if (filtered.length === 0) {
        console.log('Sample categories from all deals:', 
          [...new Set(deals.map(d => d.category))].filter(Boolean)
        );
      }
      
      setFilteredDeals(filtered);
    }
  }, [activeTab, deals]);
  
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
    </Container>
  );
};

export default SimpleDeals;