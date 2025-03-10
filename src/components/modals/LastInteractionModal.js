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
  const [queryDetails, setQueryDetails] = useState({});
  const ITEMS_PER_PAGE = 15;
  
  // IMPORTANT: Corrected table name
  const WHATSAPP_TABLE = 'whatsapp'; // Changed from 'whatsapp_messages'

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
      console.log(`%c[PAGE-CHANGE] Changing to page ${currentPage}`, 'background: #e65100; color: white; padding: 2px 5px;');
      
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
    console.log(`%c[LIMIT-OFFSET] Fetching page ${page}`, 'background: #006064; color: white; padding: 2px 5px;');
    
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
      
      console.log(`%c[LIMIT-OFFSET] Using limit=${limit}, offset=${offset} for page ${page}`, 'color: #006064; font-weight: bold;');
      
      // FIRST ATTEMPT: Try exact match with limit/offset
      let query = supabase
        .from(WHATSAPP_TABLE)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .in('contact_mobile', mobilesArray)
        .limit(limit)
        .offset(offset);
      
      console.log(`%c[LIMIT-OFFSET] Executing query...`, 'color: #006064;');
      let { data, count, error } = await query;
      
      if (error) {
        console.error(`%c[LIMIT-OFFSET] Error:`, 'color: red;', error);
        throw error;
      }
      
      console.log(`%c[LIMIT-OFFSET] Query results:`, 'color: #006064;', {
        success: !error,
        recordsFound: data?.length || 0,
        totalCount: count,
        page
      });
      
      // SECOND ATTEMPT: If no data and page > 1, try a more brute force approach
      if ((!data || data.length === 0) && page > 1) {
        console.log(`%c[LIMIT-OFFSET] No data for page ${page}, trying alternative approach`, 'color: #006064; font-weight: bold;');
        
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
          console.log(`%c[LIMIT-OFFSET] Got ${totalRecords} total records, manual pagination`, 'color: #006064;');
          
          // Calculate slices
          const startIndex = offset;
          const endIndex = startIndex + limit;
          
          // Slice the data
          const pageData = allDataResult.data.slice(startIndex, endIndex);
          
          if (pageData.length > 0) {
            console.log(`%c[LIMIT-OFFSET] Manual pagination success: ${pageData.length} records for page ${page}`, 'color: #006064; font-weight: bold;');
            data = pageData;
            count = allDataResult.data.length;
          } else {
            console.log(`%c[LIMIT-OFFSET] Manual pagination: No data for page ${page}`, 'color: #006064;');
          }
        }
      }
      
      // THIRD ATTEMPT: If still no data, try flexible search
      if (!data || data.length === 0) {
        console.log(`%c[LIMIT-OFFSET] Trying flexible search`, 'color: #006064;');
        
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
          
          console.log(`%c[LIMIT-OFFSET] Executing flexible query...`, 'color: #006064;');
          const flexResult = await flexQuery;
          
          if (flexResult.error) {
            console.error(`%c[LIMIT-OFFSET] Flex error:`, 'color: red;', flexResult.error);
          } else {
            data = flexResult.data;
            count = flexResult.count;
            
            console.log(`%c[LIMIT-OFFSET] Flex results:`, 'color: #006064;', {
              recordsFound: data?.length || 0,
              totalCount: count,
              page
            });
            
            // If flexible search with limit/offset fails and page > 1, try manual pagination
            if ((!data || data.length === 0) && page > 1) {
              console.log(`%c[LIMIT-OFFSET] No flex data for page ${page}, trying manual flex pagination`, 'color: #006064;');
              
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
                  console.log(`%c[LIMIT-OFFSET] Manual flex pagination success: ${pageFlexData.length} records`, 'color: #006064; font-weight: bold;');
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
            queryType: 'limit-offset',
            timestamp: new Date().toISOString()
          },
          debugId: `limit-p${page}-idx${index}-pos${offset + index}`
        }));
        
        console.log(`%c[LIMIT-OFFSET] Setting ${dataWithDebug.length} records in state for page ${page}`, 'color: #006064; font-weight: bold;');
        
        // Update state
        setInteractions(dataWithDebug);
        setTotalRecords(count || 0);
        setTotalPages(Math.max(Math.ceil((count || 0) / ITEMS_PER_PAGE), 1));
      } else {
        console.log(`%c[LIMIT-OFFSET] No data found after all attempts for page ${page}`, 'color: orange;');
        setInteractions([]);
      }
    } catch (err) {
      console.error(`%c[LIMIT-OFFSET] Error:`, 'color: red;', err);
      setInteractions([]);
    } finally {
      setLoading(false);
      console.log(`%c[LIMIT-OFFSET] Page ${page} fetch completed`, 'background: #006064; color: white; padding: 2px 5px;');
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
            {debugMode && (
              <div style={{ fontSize: '0.85em', marginTop: '15px', color: '#333' }}>
                <div>Try page 1 to refresh data</div>
                <button 
                  type="button"
                  onClick={() => {
                    console.log("Emergency fetch button clicked");
                    // Force a direct emergency fetch for this page
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
            )}
          </NoInteractions>
        </>
      );
    }

    // Calculate record ranges for display
    const startRecord = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endRecord = Math.min(startRecord + interactions.length - 1, totalRecords);

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <MessageCounter>
            Showing records {startRecord} - {endRecord} of {totalRecords} total
            {totalWhatsAppRecords > 0 && ` (out of ${totalWhatsAppRecords} in database)`}
            <span style={{ marginLeft: '10px', fontSize: '0.8em', color: '#888' }}>
              (Page {currentPage} of {totalPages})
            </span>
          </MessageCounter>
          
          {debugMode && (
            <div>
              <button 
                type="button"
                onClick={() => fetchPageWithLimitOffset(currentPage)} 
                style={{ 
                  fontSize: '0.8em', 
                  padding: '5px 10px', 
                  background: '#006064', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  marginRight: '5px'
                }}
              >
                Refresh
              </button>
              <button 
                type="button"
                onClick={() => emergencyFetchPage(currentPage)} 
                style={{ 
                  fontSize: '0.8em', 
                  padding: '5px 10px', 
                  background: '#d32f2f', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Emergency
              </button>
            </div>
          )}
        </div>
        
        <Table>
          <thead>
            <tr>
              <th style={{ width: '12%' }}>Date</th>
              <th style={{ width: '12%' }}>Mobile</th>
              <th style={{ width: '12%' }}>Direction</th>
              <th style={{ width: '64%' }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {interactions.map((interaction, index) => {
              // Handle different possible values for the direction field
              const isIncoming = 
                interaction.direction?.toLowerCase() === 'inbound' || 
                interaction.direction?.toLowerCase() === 'incoming' ||
                interaction.direction?.toLowerCase() === 'received' || 
                interaction.direction?.toLowerCase() === 'in';
              
              // Get debug info
              const debugInfo = interaction._debugInfo || {};
              const isFlexResult = debugInfo.queryType === 'flexible';
              
              return (
                <tr key={interaction.id || interaction.debugId || index}>
                  <td>{formatDate(interaction.whatsapp_date || interaction.created_at)}</td>
                  <td>{interaction.contact_mobile}</td>
                  <td>{isIncoming ? 'Received' : 'Sent'}</td>
                  <td className="message-cell">
                    {interaction.message}
                    {debugMode && (
                      <div style={{ 
                        fontSize: '0.7em', 
                        color: isFlexResult ? '#800080' : '#666', 
                        display: 'block', 
                        marginTop: '3px',
                        padding: '2px',
                        background: isFlexResult ? '#f8f0ff' : '#f8f8f8',
                        borderRadius: '2px'
                      }}>
                        {interaction.debugId}
                        {debugInfo.position !== undefined && ` (pos: ${debugInfo.position})`}
                        {isFlexResult && ' [FLEX]'}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        
        {debugMode && (
          <div style={{ 
            margin: '10px 0', 
            padding: '5px', 
            background: '#f8f8f8', 
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '0.8em'
          }}>
            <div><strong>Debug Info:</strong></div>
            <div>Current Page: {currentPage}</div>
            <div>Items Per Page: {ITEMS_PER_PAGE}</div>
            <div>Expected Range: {(currentPage - 1) * ITEMS_PER_PAGE} - {(currentPage * ITEMS_PER_PAGE) - 1}</div>
            <div>Record Count: {interactions.length}</div>
            <div>Total Records: {totalRecords}</div>
            <div>Query Type: {interactions[0]?._debugInfo?.queryType || 'unknown'}</div>
          </div>
        )}
        
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
    console.log(`%c[NAV] Requested page change from ${currentPage} to ${newPage} (total: ${totalPages})`, 'background: #333; color: white; padding: 2px 5px;');
    
    // Validate the requested page number
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      console.log(`%c[NAV] Changing to page ${newPage}`, 'color: green;');
      // Set loading first to avoid flickering
      setLoading(true);
      // Clear current interactions to ensure we don't show stale data
      setInteractions([]);
      // Change the page - this will trigger the useEffect that calls fetchPageData
      setCurrentPage(newPage);
    } else {
      console.log(`%c[NAV] Invalid page ${newPage} or already on this page`, 'color: orange;');
    }
  };

  // Helper function for flexible search (enhanced)
  const tryFlexibleSearch = async (mobilesArray, from, to, page) => {
    try {
      console.log(`%c[FLEX ${page}] Starting flexible search for range ${from}-${to}`, 'background: #800080; color: white; padding: 2px 5px;');
      
      // Create conditions for matching last digits
      const orConditions = mobilesArray
        .filter(mobile => mobile && mobile.length > 7)
        .map(mobile => `contact_mobile.ilike.%${mobile.slice(-8)}`);
      
      if (orConditions.length === 0) {
        console.log(`%c[FLEX ${page}] No valid conditions for flexible search`, 'color: orange;');
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
      console.log(`%c[FLEX ${page}] Conditions:`, 'color: purple;', orConditions);
      
      if (typeof flexQuery.toSQL === 'function') {
        const sql = flexQuery.toSQL();
        console.log(`%c[FLEX ${page}] SQL: ${sql}`, 'color: purple;');
      }
      
      // Execute flexible query
      console.log(`%c[FLEX ${page}] Executing query...`, 'color: purple;');
      const { data, count, error } = await flexQuery;
      
      if (error) {
        console.error(`%c[FLEX ${page}] Error:`, 'color: red;', error);
        setInteractions([]);
        return;
      }
      
      // Log results
      if (data && data.length > 0) {
        console.log(`%c[FLEX ${page}] Found ${data.length} records:`, 'color: green; font-weight: bold;');
        data.forEach((record, idx) => {
          console.log(`Flex Record ${idx}:`, {
            id: record.id,
            date: record.created_at, 
            message: record.message?.substring(0, 30) + '...',
            from: from + idx
          });
        });
      } else {
        console.log(`%c[FLEX ${page}] No records found with flexible search`, 'color: orange;');
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
        
        console.log(`%c[FLEX ${page}] Setting ${dataWithDebug.length} flex records in state`, 'color: purple; font-weight: bold;');
        
        setInteractions(dataWithDebug);
        setTotalRecords(count || 0);
        setTotalPages(Math.max(Math.ceil((count || 0) / ITEMS_PER_PAGE), 1));
      } else {
        console.log(`%c[FLEX ${page}] No data found, setting empty state`, 'color: orange;');
        setInteractions([]);
      }
    } catch (err) {
      console.error(`%c[FLEX ${page}] Error:`, 'color: red;', err);
      setInteractions([]);
    } finally {
      console.log(`%c[FLEX ${page}] Flexible search completed`, 'background: #800080; color: white; padding: 2px 5px;');
    }
  };

  // Add a new emergency fetch function that uses a completely different approach
  const emergencyFetchPage = async (page) => {
    console.log(`%c[EMERGENCY] FETCH FOR PAGE ${page} STARTED`, 'background: #d32f2f; color: white; font-weight: bold; padding: 3px 6px;');
    
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
        console.log(`%c[EMERGENCY] No mobile numbers!`, 'color: #d32f2f;');
        setLoading(false);
        return;
      }
      
      console.log(`%c[EMERGENCY] Mobile numbers:`, 'color: #d32f2f;', mobilesArray);
      
      // BRUTE FORCE: Get ALL records first
      console.log(`%c[EMERGENCY] Fetching ALL records...`, 'color: #d32f2f;');
      
      const allRecordsQuery = supabase
        .from(WHATSAPP_TABLE)
        .select('*')
        .in('contact_mobile', mobilesArray)
        .order('created_at', { ascending: false });
      
      const { data: allData, error: allError } = await allRecordsQuery;
      
      if (allError) {
        console.error(`%c[EMERGENCY] Error fetching all records:`, 'color: #d32f2f;', allError);
        
        // Try the flexible approach
        await emergencyFlexibleFetch(page, mobilesArray);
        return;
      }
      
      console.log(`%c[EMERGENCY] Total records found: ${allData?.length || 0}`, 'color: #d32f2f; font-weight: bold;');
      
      if (allData && allData.length > 0) {
        // Manually calculate data for this page
        const pageData = allData.slice(offset, offset + ITEMS_PER_PAGE);
        
        if (pageData.length > 0) {
          console.log(`%c[EMERGENCY] Found ${pageData.length} records for page ${page}`, 'color: #d32f2f; font-weight: bold;');
          
          // Add debug info
          const dataWithDebug = pageData.map((record, index) => ({
            ...record,
            _debugInfo: {
              page,
              index,
              position: offset + index,
              queryType: 'emergency',
              timestamp: new Date().toISOString()
            },
            debugId: `emrg-p${page}-idx${index}-pos${offset + index}`
          }));
          
          setInteractions(dataWithDebug);
          setTotalRecords(allData.length);
          setTotalPages(Math.max(Math.ceil(allData.length / ITEMS_PER_PAGE), 1));
        } else {
          console.log(`%c[EMERGENCY] No records for page ${page} (out of bounds)`, 'color: #d32f2f;');
          
          // Try flexible search as last resort
          await emergencyFlexibleFetch(page, mobilesArray);
        }
      } else {
        console.log(`%c[EMERGENCY] No records found!`, 'color: #d32f2f;');
        
        // Try flexible search as last resort
        await emergencyFlexibleFetch(page, mobilesArray);
      }
    } catch (err) {
      console.error(`%c[EMERGENCY] Critical error:`, 'color: #d32f2f; font-weight: bold;', err);
      setInteractions([]);
    } finally {
      setLoading(false);
      console.log(`%c[EMERGENCY] FETCH COMPLETED`, 'background: #d32f2f; color: white; font-weight: bold; padding: 3px 6px;');
    }
  };
  
  // Emergency flexible fetch as last resort
  const emergencyFlexibleFetch = async (page, mobilesArray) => {
    console.log(`%c[EMERGENCY-FLEX] Last resort flexible search`, 'color: #d32f2f;');
    
    try {
      // Calculate offset
      const offset = (page - 1) * ITEMS_PER_PAGE;
      
      // Create or conditions for last digits
      const orConditions = mobilesArray
        .filter(mobile => mobile && mobile.length > 7)
        .map(mobile => `contact_mobile.ilike.%${mobile.slice(-8)}`);
      
      if (orConditions.length === 0) {
        console.log(`%c[EMERGENCY-FLEX] No valid conditions!`, 'color: #d32f2f;');
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
        console.error(`%c[EMERGENCY-FLEX] Error:`, 'color: #d32f2f;', flexError);
        return;
      }
      
      console.log(`%c[EMERGENCY-FLEX] Total flex matches: ${flexData?.length || 0}`, 'color: #d32f2f;');
      
      if (flexData && flexData.length > 0) {
        // Manual pagination for flex data
        const pageFlexData = flexData.slice(offset, offset + ITEMS_PER_PAGE);
        
        if (pageFlexData.length > 0) {
          console.log(`%c[EMERGENCY-FLEX] Found ${pageFlexData.length} flex records for page ${page}`, 'color: #d32f2f; font-weight: bold;');
          
          // Add debug info
          const dataWithDebug = pageFlexData.map((record, index) => ({
            ...record,
            _debugInfo: {
              page,
              index,
              position: offset + index,
              queryType: 'emergency-flex',
              timestamp: new Date().toISOString()
            },
            debugId: `emflex-p${page}-idx${index}-pos${offset + index}`
          }));
          
          setInteractions(dataWithDebug);
          setTotalRecords(flexData.length);
          setTotalPages(Math.max(Math.ceil(flexData.length / ITEMS_PER_PAGE), 1));
        } else {
          console.log(`%c[EMERGENCY-FLEX] No flex records for page ${page} (out of bounds)`, 'color: #d32f2f;');
          setInteractions([]);
        }
      } else {
        console.log(`%c[EMERGENCY-FLEX] No flex records found at all!`, 'color: #d32f2f;');
        setInteractions([]);
      }
    } catch (err) {
      console.error(`%c[EMERGENCY-FLEX] Critical error:`, 'color: #d32f2f;', err);
      setInteractions([]);
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
        ) : (
          <TabContent>{renderGenericInteractions()}</TabContent>
        )}
      </div>
    </Modal>
  );
};

export default LastInteractionModal;