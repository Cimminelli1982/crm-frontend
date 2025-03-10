import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

// Styled components
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

const FilterContainer = styled.div`
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FilterLabel = styled.span`
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 500;
`;

const FilterSelect = styled.select`
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: white;
  cursor: pointer;
  
  &:hover {
    border-color: #9ca3af;
  }
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px solid rgba(59, 130, 246, 0.5);
  }
`;

const TabButton = styled.button`
  background-color: ${props => props.active ? '#007BFF' : '#E9ECEF'};
  color: ${props => props.active ? '#fff' : '#000'};
  padding: 8px;
  border: none;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  margin-right: 5px;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.active ? '#0056b3' : '#dee2e6'};
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
        case 'whatsapp': return '#25D366';
        case 'email': return '#4285F4';
        case 'meeting': return '#9C27B0';
        default: return '#6b7280';
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
  background-color: ${props => props.direction === 'incoming' ? '#dcfce7' : '#dbeafe'};
  color: ${props => props.direction === 'incoming' ? '#166534' : '#1e40af'};
`;

const LastInteractionModal = ({ isOpen, onRequestClose, contact }) => {
  // Add WhatsApp filter state
  const [whatsappFilter, setWhatsappFilter] = useState('both');
  
  // Determine initial active tab based on available data
  const getInitialActiveTab = () => {
    if (contact.mobile || contact.mobile2) return 'Whatsapp';
    if (contact.email || contact.email2 || contact.email3) return 'Email';
    return 'Meeting';
  };

  // Set initial WhatsApp filter based on available numbers
  useEffect(() => {
    if (contact.mobile && contact.mobile2) {
      if (contact.mobile === contact.mobile2) {
        setWhatsappFilter('primary');
      } else {
        setWhatsappFilter('both');
      }
    } else if (contact.mobile) {
      setWhatsappFilter('primary');
    } else if (contact.mobile2) {
      setWhatsappFilter('secondary');
    }
  }, [contact]);

  const [activeTab, setActiveTab] = useState(getInitialActiveTab());
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    if (isOpen && contact) {
      fetchInteractions();
    }
  }, [isOpen, contact, activeTab, whatsappFilter, currentPage]);

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact' });

      // Format mobile numbers to ensure they have + prefix
      const formatMobileNumber = (number) => {
        if (!number) return null;
        return number.startsWith('+') ? number : `+${number}`;
      };

      const formattedMobile = formatMobileNumber(contact.mobile);
      const formattedMobile2 = formatMobileNumber(contact.mobile2);

// Apply WhatsApp filter
if (activeTab === 'Whatsapp') {
    switch (whatsappFilter) {
      case 'primary':
        query = query.eq('contact_mobile', formattedMobile);
        break;
      case 'secondary':
        query = query.eq('contact_mobile', formattedMobile2);
        break;
      case 'both':
        query = query.or(
          `contact_mobile.eq.'${formattedMobile}'${
            formattedMobile2 ? `,contact_mobile.eq.'${formattedMobile2}'` : ''
          }`
        );
        break;
    }
  }

      // Add pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      query = query
        .order('whatsapp_date', { ascending: false })
        .range(from, to);

      console.log('Query parameters:', { 
        mobile: formattedMobile, 
        mobile2: formattedMobile2, 
        filter: whatsappFilter 
      });

      const { data, error, count } = await query;

      if (error) throw error;

      console.log('Fetched data:', data);

      setInteractions(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderWhatsAppTable = () => {
    if (loading) {
      return <NoInteractions>Loading...</NoInteractions>;
    }

    if (!interactions.length) {
      return <NoInteractions>No WhatsApp messages found</NoInteractions>;
    }

    return (
      <>
        <Table>
          <TableHeader>
            <tr>
              <th>Direction</th>
              <th>Message</th>
              <th>Date</th>
              <th>Phone Number</th>
            </tr>
          </TableHeader>
          <TableBody>
            {interactions.map(message => (
              <tr key={message.id}>
                <td>
                  <DirectionBadge direction={message.direction}>
                    {message.direction === 'incoming' ? 'Received' : 'Sent'}
                  </DirectionBadge>
                </td>
                <td>{message.message}</td>
                <td>{formatDate(message.whatsapp_date)}</td>
                <td>{message.contact_mobile}</td>
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
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </PaginationButton>
            <PaginationButton
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </PaginationButton>
            <PaginationButton
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </PaginationButton>
            <PaginationButton
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </PaginationButton>
          </div>
        </PaginationContainer>
      </>
    );
  };

  const renderInteractions = () => {
    if (loading) {
      return <NoInteractions>Loading...</NoInteractions>;
    }

    if (!interactions.length) {
      return <NoInteractions>No {activeTab} interactions found</NoInteractions>;
    }

    return interactions.map(interaction => (
      <InteractionItem key={interaction.id} type={interaction.type}>
        <div className="type">{interaction.type}</div>
        <div className="date">{formatDate(interaction.interaction_date)}</div>
        <div className="content">{interaction.content}</div>
      </InteractionItem>
    ));
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
          padding: '20px',
          border: 'none',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '1250px',
          width: '90%',
          minHeight: '900px'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <h2>Last Interactions</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>

        <TabContainer>
          {(contact.mobile || contact.mobile2) && (
            <TabButton 
              active={activeTab === 'Whatsapp'} 
              onClick={() => setActiveTab('Whatsapp')}
            >
              Whatsapp
            </TabButton>
          )}
          {(contact.email || contact.email2 || contact.email3) && (
            <TabButton 
              active={activeTab === 'Email'} 
              onClick={() => setActiveTab('Email')}
            >
              Emails
            </TabButton>
          )}
          <TabButton 
            active={activeTab === 'Meeting'} 
            onClick={() => setActiveTab('Meeting')}
          >
            Meetings (Coming soon)
          </TabButton>
        </TabContainer>

        {activeTab === 'Whatsapp' && (
          <>
            <FilterContainer>
              <FilterLabel>Show messages from:</FilterLabel>
              <FilterSelect 
                value={whatsappFilter}
                onChange={(e) => {
                  setWhatsappFilter(e.target.value);
                  setCurrentPage(1); // Reset to first page when filter changes
                }}
              >
                {(!contact.mobile2 || contact.mobile === contact.mobile2) ? (
                  <option value="primary">Mobile: {contact.mobile}</option>
                ) : (
                  <>
                    <option value="primary">Mobile: {contact.mobile}</option>
                    <option value="secondary">Second number: {contact.mobile2}</option>
                    <option value="both">Both numbers messages</option>
                  </>
                )}
              </FilterSelect>
            </FilterContainer>
            {renderWhatsAppTable()}
          </>
        )}

        {activeTab !== 'Whatsapp' && (
          <TabContent>
            <InteractionList>
              {renderInteractions()}
            </InteractionList>
          </TabContent>
        )}
      </div>
    </Modal>
  );
};

export default LastInteractionModal; 