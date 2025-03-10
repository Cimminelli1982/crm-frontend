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
    text-align: center;
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
    vertical-align: middle;
    
    &.centered {
      text-align: center;
    }

    &.tag-cell {
      text-align: center;
      > div {
        display: inline-flex;
        margin: 0 auto;
      }
    }
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

const Tag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#374151'};
  border-radius: 16px;
  font-size: 0.875rem;
  gap: 6px;
  max-width: 200px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
`;

const DirectionTag = styled(Tag)`
  background-color: ${props => props.direction === 'Received' ? '#d1fae5' : '#e0f2fe'};
  color: ${props => props.direction === 'Received' ? '#065f46' : '#0369a1'};
`;

const ActionButton = styled.button`
  font-size: 0.8em;
  padding: 5px 10px;
  background: ${props => props.variant === 'whatsapp' ? '#25D366' : props.variant === 'emergency' ? '#d32f2f' : '#006064'};
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  margin-right: 5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    opacity: 0.9;
  }
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
  const [queryDetails, setQueryDetails] = useState({});
  const [contactEmails, setContactEmails] = useState([]);
  const ITEMS_PER_PAGE = 15;
  
  // IMPORTANT: Corrected table name
  const WHATSAPP_TABLE = 'whatsapp'; // Changed from 'whatsapp_messages'
  const EMAILS_TABLE = 'emails';

  // Add a new debug mode state
  const [debugMode, setDebugMode] = useState(true);
  
  // Remove the debug function for supabase connection
  // Phone number normalization function
  const normalizePhoneNumber = (phone) => {
    if (!phone) return null;
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  };

  // Decide default tab on mount
  useEffect(() => {
    if (contact) {
      if (contact.mobile || contact.mobile2) setActiveTab('Whatsapp');
      else if (contact.email || contact.email2 || contact.email3) setActiveTab('Email');
      else setActiveTab('Meeting');
    }
  }, [contact]);

  // Update useEffect to ensure proper initialization
  useEffect(() => {
    if (isOpen && contact) {
      console.log('Modal opened or data changed - fetching data');
      // Reset to page 1 when the modal opens or contact changes
      if (!contact.lastFetchedId || contact.lastFetchedId !== contact.id) {
        setCurrentPage(1);
      }
      fetchInteractions();
    }
  }, [isOpen, contact]);
  
  // Separate effect just for page changes - use alternate approach for pagination
  useEffect(() => {
    if (isOpen && contact && currentPage > 0) {
      console.log(`[PAGE-CHANGE] Changing to page ${currentPage}`);
      
      // Set loading state and clear current data
      setLoading(true);
      setInteractions([]);
      
      // For all pages, use a completely new approach with limit/offset
      fetchPageWithLimitOffset(currentPage);
    }
  }, [currentPage]);

  // Separate effect for tab changes
  useEffect(() => {
    if (isOpen && contact) {
      console.log('Tab changed to', activeTab, '- fetching new data');
      setCurrentPage(1); // Reset to page 1 when changing tabs
      fetchInteractions();
    }
  }, [activeTab]);

  const countWhatsAppRecords = async () => {
    try {
      const { count, error } = await supabase
        .from('whatsapp')
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.error('Error counting records:', error);
        return 'Error: ' + error.message;
      }
      
      console.log('Total WhatsApp records:', count);
      return count || 0;
    } catch (error) {
      console.error('Exception counting records:', error);
      return 'Exception: ' + error.message;
    }
  };

  // Add new function to fetch with limit/offset instead of range
  const fetchPageWithLimitOffset = async (page) => {
    console.log(`[LIMIT-OFFSET] Fetching page ${page}`);
    
    try {
      // Get mobile numbers
      const mobilesArray = [];
      if (contact.mobile) mobilesArray.push(normalizePhoneNumber(contact.mobile));
      if (contact.mobile2) mobilesArray.push(normalizePhoneNumber(contact.mobile2));
      
      if (mobilesArray.length === 0) {
        console.log('No mobile numbers to search');
        setLoading(false);
        setInteractions([]);
        return;
      }
      
      // Calculate limit and offset
      const limit = ITEMS_PER_PAGE;
      const offset = (page - 1) * ITEMS_PER_PAGE;
      
      console.log(`[LIMIT-OFFSET] Using limit=${limit}, offset=${offset} for page ${page}`);
      
      // FIRST ATTEMPT: Try exact match with limit/offset
      let query = supabase
        .from(WHATSAPP_TABLE)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .in('contact_mobile', mobilesArray)
        .limit(limit)
        .offset(offset);
      
      console.log('[LIMIT-OFFSET] Executing query...');
      let { data, count, error } = await query;
      
      if (error) {
        console.error('[LIMIT-OFFSET] Error:', error);
        throw error;
      }
      
      console.log('[LIMIT-OFFSET] Query results:', {
        success: !error,
        recordsFound: data?.length || 0,
        totalCount: count,
        page
      });
      
      // SECOND ATTEMPT: If no data and page > 1, try a more brute force approach
      if ((!data || data.length === 0) && page > 1) {
        console.log(`[LIMIT-OFFSET] No data for page ${page}, trying alternative approach`);
        
        // Try fetching all data and slicing manually
        const allDataQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .in('contact_mobile', mobilesArray);
        
        const allDataResult = await allDataQuery;
        
        if (allDataResult.error) {
          console.error('Error fetching all data:', allDataResult.error);
        } else if (allDataResult.data && allDataResult.data.length > 0) {
          const totalRecords = allDataResult.data.length;
          console.log(`[LIMIT-OFFSET] Got ${totalRecords} total records, manual pagination`);
          
          // Calculate slices
          const startIndex = offset;
          const endIndex = startIndex + limit;
          
          // Slice the data
          const pageData = allDataResult.data.slice(startIndex, endIndex);
          
          if (pageData.length > 0) {
            console.log(`[LIMIT-OFFSET] Manual pagination success: ${pageData.length} records for page ${page}`);
            data = pageData;
            count = allDataResult.data.length;
          } else {
            console.log(`[LIMIT-OFFSET] Manual pagination: No data for page ${page}`);
          }
        }
      }
      
      // THIRD ATTEMPT: If still no data, try flexible search
      if (!data || data.length === 0) {
        console.log('[LIMIT-OFFSET] Trying flexible search');
        
        // Create conditions for matching last digits
        const orConditions = mobilesArray
          .filter(mobile => mobile && mobile.length > 7)
          .map(mobile => `contact_mobile.ilike.%${mobile.slice(-8)}`);
        
        if (orConditions.length > 0) {
          // Try flexible search with limit/offset
          const flexQuery = supabase
            .from(WHATSAPP_TABLE)
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .or(orConditions.join(','))
            .limit(limit)
            .offset(offset);
          
          console.log('[LIMIT-OFFSET] Executing flexible query...');
          const flexResult = await flexQuery;
          
          if (flexResult.error) {
            console.error('[LIMIT-OFFSET] Flex error:', flexResult.error);
          } else {
            data = flexResult.data;
            count = flexResult.count;
            
            console.log('[LIMIT-OFFSET] Flex results:', {
              recordsFound: data?.length || 0,
              totalCount: count,
              page
            });
            
            // If flexible search with limit/offset fails and page > 1, try manual pagination
            if ((!data || data.length === 0) && page > 1) {
              console.log('[LIMIT-OFFSET] No flex data for page ${page}, trying manual flex pagination');
              
              // Try getting all flex data and slicing
              const allFlexQuery = supabase
                .from(WHATSAPP_TABLE)
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .or(orConditions.join(','));
              
              const allFlexResult = await allFlexQuery;
              
              if (allFlexResult.error) {
                console.error('Error fetching all flex data:', allFlexResult.error);
              } else if (allFlexResult.data && allFlexResult.data.length > 0) {
                // Calculate slices for flex data
                const startIndex = offset;
                const endIndex = startIndex + limit;
                
                // Slice the flex data
                const pageFlexData = allFlexResult.data.slice(startIndex, endIndex);
                
                if (pageFlexData.length > 0) {
                  console.log(`[LIMIT-OFFSET] Manual flex pagination success: ${pageFlexData.length} records`);
                  data = pageFlexData;
                  count = allFlexResult.data.length;
                }
              }
            }
          }
        }
      }
      
      // Process and update data if we found any
      if (data && data.length > 0) {
        // Add debug info to records
        const dataWithDebug = data.map((record, index) => ({
          ...record,
          _debugInfo: {
            page,
            index,
            position: offset + index,
            queryType: 'limit',
            timestamp: new Date().toISOString()
          },
          debugId: `limit-p${page}-idx${index}-pos${offset + index}`
        }));
        
        console.log(`[LIMIT-OFFSET] Setting ${dataWithDebug.length} records in state for page ${page}`);
        
        // Update state
        setInteractions(dataWithDebug);
        setTotalRecords(count || 0);
        setTotalPages(Math.max(Math.ceil((count || 0) / ITEMS_PER_PAGE), 1));
      } else {
        console.log(`[LIMIT-OFFSET] No data found after all attempts for page ${page}`);
        setInteractions([]);
      }
    } catch (err) {
      console.error('[LIMIT-OFFSET] Error:', err);
      setInteractions([]);
    } finally {
      setLoading(false);
      console.log(`[LIMIT-OFFSET] Page ${page} fetch completed`);
    }
  };

  const fetchInteractions = async () => {
    // Initial fetch when modal opens - always start with page 1
    setLoading(true);
    console.log('FETCH STARTED for initial load');
    
    // Simple safety check
    if (!contact || !contact.id) {
      console.error('No contact data available');
      setLoading(false);
      return;
    }

    try {
      let data = [];
      let count = 0;

      // ============= WHATSAPP TAB =============
      if (activeTab === 'Whatsapp') {
        console.log('Fetching WhatsApp data for contact:', contact.id);
        
        // Combine mobile & mobile2 into an array with normalized format
        const mobilesArray = [];
        
        if (contact.mobile) {
          mobilesArray.push(normalizePhoneNumber(contact.mobile));
        }
        
        if (contact.mobile2) {
          mobilesArray.push(normalizePhoneNumber(contact.mobile2));
        }

        if (mobilesArray.length === 0) {
          console.log('No mobile numbers found for contact');
          setInteractions([]);
          setTotalRecords(0);
          setTotalPages(1);
          setLoading(false);
          return;
        }

        console.log('Mobile numbers to search:', mobilesArray);
        
        // Always use page 1 for initial fetch
        const from = 0;  
        const to = ITEMS_PER_PAGE - 1;
        
        // Basic query construction
        let query = supabase
          .from(WHATSAPP_TABLE)
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .in('contact_mobile', mobilesArray)
          .range(from, to);
        
        console.log('Executing initial query...');
        
        // Execute the query
        const { data: responseData, error, count: totalCount } = await query;
        
        if (error) {
          console.error('Query error:', error);
          throw error;
        }
        
        console.log(`Query returned ${responseData ? responseData.length : 0} records out of ${totalCount} total`);
        
        // Update state with the results
        data = responseData || [];
        count = totalCount || 0;
        
        // Calculate total pages
        const totalPagesCount = Math.max(Math.ceil(count / ITEMS_PER_PAGE), 1);
        console.log(`Total pages: ${totalPagesCount} (${count} records / ${ITEMS_PER_PAGE} per page)`);
        
        // If no results with exact match, try flexible matching
        if (data.length === 0 && mobilesArray.length > 0) {
          await tryFlexibleSearch(mobilesArray, from, to, 1);
          return; // tryFlexibleSearch updates the state directly
        }
      }
      // Handle other tabs here
      
      // Update state with final results
      console.log(`Final data: ${data.length} records, total: ${count}`);
      setInteractions(data);
      setTotalRecords(count);
      setTotalPages(Math.max(Math.ceil(count / ITEMS_PER_PAGE), 1));
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setInteractions([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      console.log('INITIAL FETCH COMPLETED');
    }
  };

  const fetchTotalWhatsAppRecords = async () => {
    try {
      // Remove all the extra debug logging
      const { count, error } = await supabase
        .from(WHATSAPP_TABLE)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching total WhatsApp records:', error);
        setQueryDetails(prevDetails => ({
          ...prevDetails,
          totalCountError: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          }
        }));
      } else {
        setTotalWhatsAppRecords(count || 0);
      }
    } catch (error) {
      console.error('Exception fetching total WhatsApp records:', error);
      setQueryDetails(prevDetails => ({
        ...prevDetails,
        totalCountError: {
          catchBlock: true,
          message: error.message || String(error)
        }
      }));
      // In case of exception, set count to 0
      setTotalWhatsAppRecords(0);
    }
  };

  // Update the date formatting function to show only DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  // Update the renderWhatsAppTable function to make the button properly clickable
  const renderWhatsAppTable = () => {
    if (loading) {
      return (
        <>
          <NoInteractions>Loading page {currentPage}...</NoInteractions>
        </>
      );
    }
    
    if (!interactions.length) {
      return (
        <>
          <NoInteractions>
            No WhatsApp messages found for page {currentPage}
            <div style={{ fontSize: '0.85em', marginTop: '15px', color: '#333' }}>
              <button 
                type="button"
                onClick={() => {
                  console.log("Emergency fetch button clicked");
                  emergencyFetchPage(currentPage);
                }} 
                style={{ 
                  marginTop: '15px',
                  padding: '8px 12px', 
                  background: '#d32f2f', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                EMERGENCY PAGE {currentPage} FETCH
              </button>
            </div>
          </NoInteractions>
        </>
      );
    }

    // Calculate record ranges for display
    const startRecord = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endRecord = Math.min(startRecord + interactions.length - 1, totalRecords);

    const handleWhatsAppClick = (mobile) => {
      const formattedNumber = mobile.startsWith('+') ? mobile.substring(1) : mobile;
      window.open(`https://wa.me/${formattedNumber}`, '_blank');
    };

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '10px' }}>
          <ActionButton 
            type="button"
            onClick={() => handleWhatsAppClick(contact.mobile)}
            variant="whatsapp"
          >
            WhatsApp
          </ActionButton>
        </div>
        
        <Table>
          <thead>
            <tr>
              <th style={{ width: '10%' }}>Date</th>
              <th style={{ width: '10%' }}>Mobile</th>
              <th style={{ width: '10%' }}>Direction</th>
              <th style={{ width: '70%' }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {interactions.map((interaction, index) => {
              const isIncoming = 
                interaction.direction?.toLowerCase() === 'inbound' || 
                interaction.direction?.toLowerCase() === 'incoming' ||
                interaction.direction?.toLowerCase() === 'received' || 
                interaction.direction?.toLowerCase() === 'in';
              
              const direction = isIncoming ? 'Received' : 'Sent';
              
              return (
                <tr key={interaction.id || index}>
                  <td className="centered">
                    {formatDate(interaction.whatsapp_date || interaction.created_at)}
                  </td>
                  <td className="tag-cell">
                    <Tag color="#f3f4f6" textColor="#374151">
                      <span>{interaction.contact_mobile}</span>
                    </Tag>
                  </td>
                  <td className="tag-cell">
                    <DirectionTag direction={direction}>
                      <span>{direction}</span>
                    </DirectionTag>
                  </td>
                  <td>
                    {interaction.message}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        
        <PaginationContainer>
          <PageInfo>
            Page {currentPage} of {totalPages}
          </PageInfo>
          <div>
            <PaginationButton
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              First
            </PaginationButton>
            <PaginationButton
              type="button"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </PaginationButton>
            <PaginationButton
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </PaginationButton>
            <PaginationButton
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </PaginationButton>
          </div>
        </PaginationContainer>
      </>
    );
  };

  // Render for Email or Meeting (simple example)
  const renderGenericInteractions = () => {
    if (loading) {
      return <NoInteractions>Loading...</NoInteractions>;
    }
    
    if (!interactions.length) {
      return (
        <NoInteractions>
          {activeTab === 'Email' 
            ? 'No emails found' 
            : activeTab === 'Meeting' 
              ? 'No meetings found' 
              : 'No interactions found'}
        </NoInteractions>
      );
    }

    return (
      <InteractionList>
        {interactions.map((item) => (
          <InteractionItem key={item.id} type={item.type}>
            <div className="type">{item.type}</div>
            <div className="date">{formatDate(item.interaction_date)}</div>
            <div className="content">{item.content}</div>
          </InteractionItem>
        ))}
      </InteractionList>
    );
  };

  // Update the pagination handler with better logging
  const handlePageChange = (newPage) => {
    console.log(`[NAV] Requested page change from ${currentPage} to ${newPage} (total: ${totalPages})`);
    
    // Validate the requested page number
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      console.log(`[NAV] Changing to page ${newPage}`);
      // Set loading first to avoid flickering
      setLoading(true);
      // Clear current interactions to ensure we don't show stale data
      setInteractions([]);
      // Change the page - this will trigger the useEffect that calls fetchPageData
      setCurrentPage(newPage);
    } else {
      console.log(`[NAV] Invalid page ${newPage} or already on this page`);
    }
  };

  // Helper function for flexible search (enhanced)
  const tryFlexibleSearch = async (mobilesArray, from, to, page) => {
    try {
      console.log(`[FLEX ${page}] Starting flexible search for range ${from}-${to}`);
      
      // Create conditions for matching last digits
      const orConditions = mobilesArray
        .filter(mobile => mobile && mobile.length > 7)
        .map(mobile => `contact_mobile.ilike.%${mobile.slice(-8)}`);
      
      if (orConditions.length === 0) {
        console.log(`[FLEX ${page}] No valid conditions for flexible search`);
        setInteractions([]);
        return;
      }
      
      // Build the flexible query
      const flexQuery = supabase
        .from(WHATSAPP_TABLE)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .or(orConditions.join(','))
        .range(from, to);
      
      // Log query details
      console.log(`[FLEX ${page}] Conditions:`, orConditions);
      
      if (typeof flexQuery.toSQL === 'function') {
        const sql = flexQuery.toSQL();
        console.log(`[FLEX ${page}] SQL: ${sql}`);
      }
      
      // Execute flexible query
      console.log(`[FLEX ${page}] Executing query...`);
      const { data, count, error } = await flexQuery;
      
      if (error) {
        console.error(`[FLEX ${page}] Error:`, error);
        setInteractions([]);
        return;
      }
      
      // Log results
      if (data && data.length > 0) {
        console.log(`[FLEX ${page}] Found ${data.length} records:`);
        data.forEach((record, idx) => {
          console.log(`Flex Record ${idx}:`, {
            id: record.id,
            date: record.created_at, 
            message: record.message?.substring(0, 30) + '...',
            from: from + idx
          });
        });
      } else {
        console.log(`[FLEX ${page}] No records found with flexible search`);
      }
      
      // Update state with flexible search results
      if (data && data.length > 0) {
        // Add comprehensive debug info
        const dataWithDebug = data.map((record, index) => ({
          ...record,
          _debugInfo: {
            page,
            index,
            position: from + index,
            queryType: 'flexible',
            timestamp: new Date().toISOString(),
            range: `${from}-${to}`
          },
          debugId: `flex${page}-idx${index}-pos${from + index}`
        }));
        
        console.log(`[FLEX ${page}] Setting ${dataWithDebug.length} flex records in state`);
        
        setInteractions(dataWithDebug);
        setTotalRecords(count || 0);
        setTotalPages(Math.max(Math.ceil((count || 0) / ITEMS_PER_PAGE), 1));
      } else {
        console.log(`[FLEX ${page}] No data found, setting empty state`);
        setInteractions([]);
      }
    } catch (err) {
      console.error(`[FLEX ${page}] Error:`, err);
      setInteractions([]);
    } finally {
      console.log(`[FLEX ${page}] Flexible search completed`);
    }
  };

  // Add a new emergency fetch function that uses a completely different approach
  const emergencyFetchPage = async (page) => {
    console.log(`[EMERGENCY] FETCH FOR PAGE ${page} STARTED`);
    
    try {
      setLoading(true);
      setInteractions([]);
      
      // Calculate the offset for this page
      const offset = (page - 1) * ITEMS_PER_PAGE;
      
      // Get mobile numbers
      const mobilesArray = [];
      if (contact.mobile) mobilesArray.push(normalizePhoneNumber(contact.mobile));
      if (contact.mobile2) mobilesArray.push(normalizePhoneNumber(contact.mobile2));
      
      if (mobilesArray.length === 0) {
        console.log(`[EMERGENCY] No mobile numbers!`);
        setLoading(false);
        return;
      }
      
      console.log(`[EMERGENCY] Mobile numbers:`, mobilesArray);
      
      // BRUTE FORCE: Get ALL records first
      console.log(`[EMERGENCY] Fetching ALL records...`);
      
      const allRecordsQuery = supabase
        .from(WHATSAPP_TABLE)
        .select('*')
        .in('contact_mobile', mobilesArray)
        .order('created_at', { ascending: false });
      
      const { data: allData, error: allError } = await allRecordsQuery;
      
      if (allError) {
        console.error(`[EMERGENCY] Error fetching all records:`, allError);
        
        // Try the flexible approach
        await emergencyFlexibleFetch(page, mobilesArray);
        return;
      }
      
      console.log(`[EMERGENCY] Total records found: ${allData?.length || 0}`);
      
      if (allData && allData.length > 0) {
        // Manually calculate data for this page
        const pageData = allData.slice(offset, offset + ITEMS_PER_PAGE);
        
        if (pageData.length > 0) {
          console.log(`[EMERGENCY] Found ${pageData.length} records for page ${page}`);
          
          // Add debug info
          const dataWithDebug = pageData.map((record, index) => ({
            ...record,
            _debugInfo: {
              queryType: 'emergency',
              timestamp: new Date().toISOString()
            },
            debugId: `emrg-p${page}-idx${index}-pos${offset + index}`
          }));
          
          setInteractions(dataWithDebug);
          setTotalRecords(allData.length);
          setTotalPages(Math.max(Math.ceil(allData.length / ITEMS_PER_PAGE), 1));
        } else {
          console.log(`[EMERGENCY] No records for page ${page} (out of bounds)`);
          
          // Try flexible search as last resort
          await emergencyFlexibleFetch(page, mobilesArray);
        }
      } else {
        console.log(`[EMERGENCY] No records found!`);
        
        // Try flexible search as last resort
        await emergencyFlexibleFetch(page, mobilesArray);
      }
    } catch (err) {
      console.error(`[EMERGENCY] Critical error:`, err);
      setInteractions([]);
    } finally {
      setLoading(false);
      console.log(`[EMERGENCY] FETCH COMPLETED`);
    }
  };
  
  // Emergency flexible fetch as last resort
  const emergencyFlexibleFetch = async (page, mobilesArray) => {
    console.log(`[EMERGENCY-FLEX] Last resort flexible search`);
    
    try {
      // Calculate offset
      const offset = (page - 1) * ITEMS_PER_PAGE;
      
      // Create or conditions for last digits
      const orConditions = mobilesArray
        .filter(mobile => mobile && mobile.length > 7)
        .map(mobile => `contact_mobile.ilike.%${mobile.slice(-8)}`);
      
      if (orConditions.length === 0) {
        console.log(`[EMERGENCY-FLEX] No valid conditions!`);
        return;
      }
      
      // Fetch ALL flexible matches
      const flexQuery = supabase
        .from(WHATSAPP_TABLE)
        .select('*')
        .or(orConditions.join(','))
        .order('created_at', { ascending: false });
      
      const { data: flexData, error: flexError } = await flexQuery;
      
      if (flexError) {
        console.error(`[EMERGENCY-FLEX] Error:`, flexError);
        return;
      }
      
      console.log(`[EMERGENCY-FLEX] Total flex matches: ${flexData?.length || 0}`);
      
      if (flexData && flexData.length > 0) {
        // Manual pagination for flex data
        const pageFlexData = flexData.slice(offset, offset + ITEMS_PER_PAGE);
        
        if (pageFlexData.length > 0) {
          console.log(`[EMERGENCY-FLEX] Found ${pageFlexData.length} flex records for page ${page}`);
          
          // Add debug info
          const dataWithDebug = pageFlexData.map((record, index) => ({
            ...record,
            _debugInfo: {
              queryType: 'emergency-flex',
              timestamp: new Date().toISOString()
            },
            debugId: `emflex-p${page}-idx${index}-pos${offset + index}`
          }));
          
          setInteractions(dataWithDebug);
          setTotalRecords(flexData.length);
          setTotalPages(Math.max(Math.ceil(flexData.length / ITEMS_PER_PAGE), 1));
        } else {
          console.log(`[EMERGENCY-FLEX] No flex records for page ${page} (out of bounds)`);
          setInteractions([]);
        }
      } else {
        console.log(`[EMERGENCY-FLEX] No flex records found at all!`);
        setInteractions([]);
      }
    } catch (err) {
      console.error(`[EMERGENCY-FLEX] Critical error:`, err);
      setInteractions([]);
    }
  };

  // Fetch emails data from Supabase based on contact's email addresses
  const fetchEmails = async () => {
    setLoading(true);
    console.log('FETCH EMAILS STARTED');
    
    // Simple safety check
    if (!contact || !contact.id) {
      console.error('No contact data available');
      setLoading(false);
      return;
    }

    try {
      // Get all email addresses for this contact
      const emailsArray = [
        contact.email,
        contact.email2,
        contact.email3
      ].filter(email => email && email.trim() !== '');
      
      // Store the contact emails in state for reference in the render function
      setContactEmails(emailsArray);
      
      // Log all the email addresses we found for debugging
      console.log('Contact ID:', contact.id);
      console.log('Contact name:', contact.first_name, contact.last_name);
      console.log('All email addresses found:', emailsArray);
      
      if (emailsArray.length === 0) {
        console.log('No email addresses found for contact');
        setLoading(false);
        setInteractions([]);
        return;
      }
      
      // Instead of using the complex query, use the simpler approach that's working
      console.log('Using simple query approach for emails...');
      
      // Get all emails first for all email addresses, then filter/paginate manually
      let allEmails = [];
      
      // Process each email address
      for (const email of emailsArray) {
        console.log(`Fetching emails for: ${email}`);
        
        const query = supabase
          .from(EMAILS_TABLE)
          .select('*')
          .or(`from_email.eq."${email}",to_email.eq."${email}"`)
          .order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
          console.error(`Error fetching emails for ${email}:`, error);
          continue;
        }
        
        console.log(`Found ${data?.length || 0} emails for ${email}`);
        
        // Add emails to the collection
        if (data && data.length > 0) {
          allEmails = [...allEmails, ...data];
        }
      }
      
      // Remove duplicate emails (in case same email appears in multiple fields)
      const uniqueEmails = allEmails.filter((email, index, self) =>
        index === self.findIndex(e => e.id === email.id)
      );
      
      // Sort by date descending
      uniqueEmails.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      console.log(`Total unique emails found: ${uniqueEmails.length}`);
      
      // Now handle pagination manually
      const limit = ITEMS_PER_PAGE;
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const pageEmails = uniqueEmails.slice(offset, offset + limit);
      
      console.log(`Showing ${pageEmails.length} emails for page ${currentPage}`);
      
      if (pageEmails.length > 0) {
        // Add debug info to each record
        const dataWithDebug = pageEmails.map((record, index) => ({
          ...record,
          _debug: {
            queryType: 'email-simple',
            timestamp: new Date().toISOString()
          },
          debugId: `email-p${currentPage}-idx${index}-pos${offset + index}`
        }));
        
        // Update state
        setInteractions(dataWithDebug);
        setTotalRecords(uniqueEmails.length);
        setTotalPages(Math.max(Math.ceil(uniqueEmails.length / ITEMS_PER_PAGE), 1));
      } else {
        // No emails found for this page
        setInteractions([]);
        
        if (currentPage > 1 && uniqueEmails.length > 0) {
          // We have emails but are on a page with no data, go back to page 1
          console.log('No emails for this page, returning to page 1');
          setCurrentPage(1);
        }
      }
    } catch (err) {
      console.error('Error in fetchEmails:', err);
      setInteractions([]);
    } finally {
      setLoading(false);
      console.log('FETCH EMAILS COMPLETED');
    }
  };

  // Add useEffect to trigger email fetching when on Email tab
  useEffect(() => {
    if (isOpen && contact && activeTab === 'Email' && currentPage > 0) {
      console.log(`Fetching emails for page ${currentPage}`);
      // No need to check table existence first since we know it works
      fetchEmails();
    }
  }, [isOpen, contact, activeTab, currentPage]);

  // Function to check if the emails table exists and has data
  const checkEmailsTable = async () => {
    try {
      console.log('Checking if emails table exists and has data...');
      
      // Try to get just one record to verify the table exists
      const { data, error } = await supabase
        .from(EMAILS_TABLE)
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Error checking emails table:', error);
        console.log('The emails table might not exist or there might be permission issues.');
        return false;
      }
      
      console.log(`Table check: Found ${data?.length || 0} records in the emails table`);
      
      return data && data.length > 0;
    } catch (err) {
      console.error('Error in checkEmailsTable:', err);
      return false;
    }
  };

  const renderEmailsTable = () => {
    if (loading) {
      return (
        <>
          <NoInteractions>Loading emails...</NoInteractions>
        </>
      );
    }
    
    if (!interactions.length) {
      return (
        <>
          <NoInteractions>
            No emails found for this contact
            
            <div style={{ fontSize: '0.85em', marginTop: '15px', color: '#333' }}>
              <p>Please make sure the contact has valid email addresses and the emails table exists in the database.</p>
              
              <div style={{ marginTop: '10px' }}>
                <button 
                  type="button"
                  onClick={() => {
                    console.log("Debug email fetch button clicked");
                    fetchEmails();
                  }} 
                  style={{ 
                    marginTop: '15px',
                    padding: '8px 12px', 
                    background: '#0056b3', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  REFRESH EMAILS
                </button>
              </div>
            </div>
          </NoInteractions>
        </>
      );
    }

    // Just get the most recent email (should be the first one in the array since we're sorting by date descending)
    const latestEmail = interactions[0];
    
    // Determine direction
    const direction = contactEmails.includes(latestEmail.from_email) ? 'Sent' : 'Received';
    
    // Create email-like display styles
    const emailContainer = {
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '20px',
      marginBottom: '20px',
      marginTop: '20px',
      maxWidth: '100%',
      overflowWrap: 'break-word'
    };
    
    const emailHeader = {
      borderBottom: '1px solid #eee',
      paddingBottom: '15px',
      marginBottom: '15px'
    };
    
    const emailSubject = {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: '#333'
    };
    
    const emailMeta = {
      display: 'flex',
      justifyContent: 'space-between',
      color: '#666',
      fontSize: '0.9rem',
      marginBottom: '8px'
    };
    
    const emailMetaLabel = {
      fontWeight: 'bold',
      marginRight: '10px',
      color: '#444'
    };
    
    const emailBody = {
      padding: '10px 0',
      fontSize: '0.95rem',
      lineHeight: '1.6',
      color: '#333',
      whiteSpace: 'pre-wrap'  // Preserves line breaks in the email body
    };
    
    const directionButtonStyle = {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      marginLeft: '10px',
      color: direction === 'Received' ? '#065f46' : '#0369a1',
      backgroundColor: direction === 'Received' ? '#d1fae5' : '#e0f2fe',
    };

    // Button container style
    const buttonContainer = {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      marginTop: '20px'
    };
    
    // Button styles
    const buttonBaseStyle = {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      fontSize: '0.95rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '120px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };
    
    const inboxButtonStyle = {
      ...buttonBaseStyle,
      backgroundColor: '#1a73e8',
      color: 'white'
    };
    
    const skipButtonStyle = {
      ...buttonBaseStyle,
      backgroundColor: '#dc3545',
      color: 'white'
    };
    
    // Handler for the Skip button
    const handleSkip = async () => {
      try {
        // Update the contact_category in the database
        const { error } = await supabase
          .from('contacts')
          .update({ contact_category: 'Skip' })
          .eq('id', contact.id);
          
        if (error) {
          console.error('Error updating contact category:', error);
          alert('Failed to update contact category');
          return;
        }
        
        // Close the modal
        onRequestClose();
      } catch (err) {
        console.error('Error in handleSkip:', err);
        alert('An error occurred');
      }
    };
    
    // Extract thread_id from the email or use email id as fallback
    const getThreadUrl = () => {
      // If thread_id exists in the email data, use it
      const threadId = latestEmail.thread_id || latestEmail.id;
      return `https://mail.superhuman.com/thread/${threadId}`;
    };

    return (
      <>
        <MessageCounter>
          Latest email ({totalRecords} total emails)
        </MessageCounter>
        
        <div style={emailContainer}>
          <div style={emailHeader}>
            <div style={emailSubject}>
              {latestEmail.subject || '(No Subject)'}
              <span style={directionButtonStyle}>{direction}</span>
            </div>
            
            <div style={emailMeta}>
              <div>
                <span style={emailMetaLabel}>From:</span>
                {latestEmail.from_name || 'Unknown'} &lt;{latestEmail.from_email || 'No Email'}&gt;
              </div>
              <div>
                {formatDate(latestEmail.created_at)}
              </div>
            </div>
            
            <div style={emailMeta}>
              <div>
                <span style={emailMetaLabel}>To:</span>
                {latestEmail.to_name || 'Unknown'} &lt;{latestEmail.to_email || 'No Email'}&gt;
              </div>
            </div>
          </div>
          
          <div style={emailBody}>
            {latestEmail.body_plain || '(No content)'}
          </div>
          
          <div style={buttonContainer}>
            <button
              onClick={() => window.open(getThreadUrl(), '_blank')}
              style={inboxButtonStyle}
            >
              Inbox
            </button>
            <button
              onClick={handleSkip}
              style={skipButtonStyle}
            >
              Skip
            </button>
          </div>
        </div>
      </>
    );
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
          maxHeight: '80vh',     // Changed from minHeight to maxHeight
          overflow: 'auto'       // Ensure content is scrollable
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

        {/* Tabs */}
        <TabContainer>
          {(contact.mobile || contact.mobile2) && (
            <TabButton
              active={activeTab === 'Whatsapp'}
              onClick={() => {
                setActiveTab('Whatsapp');
                setCurrentPage(1);
              }}
            >
              WhatsApp
            </TabButton>
          )}
          {(contact.email || contact.email2 || contact.email3) && (
            <TabButton
              active={activeTab === 'Email'}
              onClick={() => {
                setActiveTab('Email');
                setCurrentPage(1);
              }}
            >
              Emails
            </TabButton>
          )}
          <TabButton
            active={activeTab === 'Meeting'}
            onClick={() => {
              setActiveTab('Meeting');
              setCurrentPage(1);
            }}
          >
            Meetings (Coming soon)
          </TabButton>
        </TabContainer>

        {/* Render content based on active tab */}
        {activeTab === 'Whatsapp' ? (
          renderWhatsAppTable()
        ) : activeTab === 'Email' ? (
          renderEmailsTable()
        ) : (
          <TabContent>{renderGenericInteractions()}</TabContent>
        )}
      </div>
    </Modal>
  );
};

export default LastInteractionModal;