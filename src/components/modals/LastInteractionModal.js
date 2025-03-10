import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

// ==================== Styled Components ====================
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #111827;
    font-weight: 600;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      color: #1f2937;
      background-color: #f3f4f6;
    }
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 15px;
`;

const TabButton = styled.button`
  background-color: ${props => (props.active ? '#007BFF' : '#E9ECEF')};
  color: ${props => (props.active ? '#fff' : '#000')};
  padding: 8px;
  border: none;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  margin-right: 5px;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => (props.active ? '#0056b3' : '#dee2e6')};
  }
`;

const TabContent = styled.div`
  margin-bottom: 15px;
`;

const InteractionList = styled.div`
  background-color: #E9ECEF;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  max-height: 300px;
  overflow-y: auto;
`;

const InteractionItem = styled.div`
  background-color: white;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 8px;
  border: 1px solid #dee2e6;

  &:last-child {
    margin-bottom: 0;
  }

  .date {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .content {
    color: #374151;
  }

  .type {
    font-size: 0.75rem;
    color: #fff;
    background-color: ${props => {
      switch (props.type) {
        case 'whatsapp':
          return '#25D366';
        case 'email':
          return '#4285F4';
        case 'meeting':
          return '#9C27B0';
        default:
          return '#6b7280';
      }
    }};
    padding: 2px 6px;
    border-radius: 12px;
    display: inline-block;
    margin-bottom: 4px;
  }
`;

const NoInteractions = styled.div`
  text-align: center;
  padding: 20px;
  color: #6b7280;
  font-style: italic;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.thead`
  background-color: #f3f4f6;
  
  th {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
  }
`;

const TableBody = styled.tbody`
  tr {
    &:hover {
      background-color: #f9fafb;
    }
    
    &:not(:last-child) {
      border-bottom: 1px solid #e5e7eb;
    }
  }
  
  td {
    padding: 12px 16px;
    font-size: 0.875rem;
    color: #111827;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding: 0.5rem 0;
`;

const PageInfo = styled.span`
  font-size: 0.875rem;
  color: #4b5563;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: #f3f4f6;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  margin: 0 0.25rem;
`;

const DirectionBadge = styled.span`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => (props.direction === 'incoming' ? '#dcfce7' : '#dbeafe')};
  color: ${props => (props.direction === 'incoming' ? '#166534' : '#1e40af')};
`;

const MessageCounter = styled.div`
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 10px;
  text-align: right;
  padding-right: 5px;
`;

// ==================== Modal Component ====================
const LastInteractionModal = ({ isOpen, onRequestClose, contact }) => {
  const [activeTab, setActiveTab] = useState('Whatsapp');
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalWhatsAppRecords, setTotalWhatsAppRecords] = useState(0);
  const ITEMS_PER_PAGE = 15;
  const WHATSAPP_TABLE = 'whatsapp';

  const normalizePhoneNumber = (phone) => {
    if (!phone) return null;
    return phone.replace(/\D/g, '');
  };

  useEffect(() => {
    if (contact) {
      if (contact.mobile || contact.mobile2) setActiveTab('Whatsapp');
      else if (contact.email || contact.email2 || contact.email3) setActiveTab('Email');
      else setActiveTab('Meeting');
    }
  }, [contact]);

  useEffect(() => {
    if (isOpen && contact) {
      fetchPageData(currentPage);
    }
  }, [isOpen, contact, currentPage, activeTab]);

  const fetchPageData = async (page) => {
    try {
      setLoading(true);
      
      if (activeTab === 'Whatsapp') {
        const normalizedMobile = normalizePhoneNumber(contact.mobile);
        const normalizedMobile2 = normalizePhoneNumber(contact.mobile2);
        
        let { data: allMessages, error } = await supabase
          .from(WHATSAPP_TABLE)
          .select('*')
          .or(`phone.eq.${normalizedMobile}${normalizedMobile2 ? `,phone.eq.${normalizedMobile2}` : ''}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculate total records and pages
        const total = allMessages ? allMessages.length : 0;
        setTotalWhatsAppRecords(total);
        setTotalRecords(total);
        setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));

        // Slice the data for the current page
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageData = allMessages.slice(startIndex, endIndex);

        setInteractions(pageData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderWhatsAppTable = () => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (!interactions || interactions.length === 0) {
      return <NoInteractions>No WhatsApp messages found.</NoInteractions>;
    }

    return (
      <>
        <MessageCounter>
          Total messages: {totalWhatsAppRecords}
        </MessageCounter>
        <Table>
          <TableHeader>
            <tr>
              <th>Date</th>
              <th>Direction</th>
              <th>Message</th>
            </tr>
          </TableHeader>
          <TableBody>
            {interactions.map((interaction) => (
              <tr key={interaction.id}>
                <td>{new Date(interaction.created_at).toLocaleString()}</td>
                <td>
                  <DirectionBadge direction={interaction.direction}>
                    {interaction.direction}
                  </DirectionBadge>
                </td>
                <td>{interaction.message}</td>
              </tr>
            ))}
          </TableBody>
        </Table>
        <PaginationContainer>
          <PageInfo>
            Page {currentPage} of {totalPages}
          </PageInfo>
          <div>
            <PaginationButton
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </PaginationButton>
            <PaginationButton
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </PaginationButton>
          </div>
        </PaginationContainer>
      </>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Whatsapp':
        return renderWhatsAppTable();
      case 'Email':
        return <div>Email interactions coming soon...</div>;
      case 'Meeting':
        return <div>Meeting interactions coming soon...</div>;
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: '1000px',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '20px',
          borderRadius: '8px',
        },
      }}
    >
      <ModalHeader>
        <h2>Last Interactions</h2>
        <button type="button" onClick={onRequestClose}>
          <FiX size={24} />
        </button>
      </ModalHeader>

      <TabContainer>
        <TabButton
          type="button"
          active={activeTab === 'Whatsapp'}
          onClick={() => setActiveTab('Whatsapp')}
        >
          WhatsApp
        </TabButton>
        <TabButton
          type="button"
          active={activeTab === 'Email'}
          onClick={() => setActiveTab('Email')}
        >
          Email
        </TabButton>
        <TabButton
          type="button"
          active={activeTab === 'Meeting'}
          onClick={() => setActiveTab('Meeting')}
        >
          Meeting
        </TabButton>
      </TabContainer>

      <TabContent>
        {renderContent()}
      </TabContent>
    </Modal>
  );
};

export default LastInteractionModal;