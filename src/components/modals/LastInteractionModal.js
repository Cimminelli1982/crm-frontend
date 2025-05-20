import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiMail, FiClock } from 'react-icons/fi';
import { RiWhatsappFill, RiLinkedinBoxFill } from 'react-icons/ri';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';
import { addDays } from 'date-fns';

// ==================== Styled Components ====================
const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;

  .header-left {
    h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #000000;
      font-weight: 600;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    
    button {
      background: none;
      border: none;
      cursor: pointer;
      color: #4b5563;
      padding: 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        color: #000000;
        background-color: #f3f4f6;
      }
    }
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: 24px;
`;

const TabButton = styled.button`
  background-color: transparent;
  color: ${props => (props.active ? '#000000' : '#6b7280')};
  padding: 12px 20px;
  border: none;
  border-bottom: 2px solid ${props => (props.active ? '#000000' : 'transparent')};
  cursor: pointer;
  font-weight: ${props => (props.active ? '600' : '500')};
  transition: all 0.2s ease;

  &:hover {
    color: #000000;
    border-bottom-color: ${props => (props.active ? '#000000' : '#d1d5db')};
  }
`;

const TabContent = styled.div`
  margin-bottom: 24px;
`;

const SnoozeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const SnoozeTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: #111827;
  font-weight: 600;
`;

const SnoozeOptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`;

const SnoozeButton = styled.button`
  padding: 16px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    border-color: #000000;
    background-color: #f3f4f6;
  }
  
  .button-icon {
    font-size: 24px;
    margin-bottom: 8px;
    color: #4b5563;
  }
  
  .button-text {
    font-size: 1rem;
    font-weight: 500;
    color: #111827;
  }
  
  .button-subtext {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 4px;
  }
`;

const ContentSection = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100% - 110px); // Accounting for header and tabs
`;

const InteractionList = styled.div`
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const InteractionItem = styled.div`
  background-color: #ffffff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:last-child {
    margin-bottom: 0;
  }

  .date {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 8px;
  }

  .content {
    color: #111827;
    font-size: 0.9375rem;
  }

  .type {
    font-size: 0.75rem;
    color: #ffffff;
    background-color: #000000;
    padding: 3px 8px;
    border-radius: 12px;
    display: inline-block;
    margin-bottom: 8px;
    font-weight: 500;
  }
`;

const NoInteractions = styled.div`
  text-align: center;
  padding: 32px;
  color: #6b7280;
  font-style: italic;
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const TableHeader = styled.thead`
  background-color: #f9fafb;
  
  th {
    padding: 14px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: #111827;
    border-bottom: 1px solid #e5e7eb;
    
    &.centered {
      text-align: center;
    }
  }
`;

const TableBody = styled.tbody`
  tr {
    &:hover {
      background-color: #f3f4f6;
    }
    
    &:not(:last-child) {
      border-bottom: 1px solid #e5e7eb;
    }
  }
  
  td {
    padding: 14px 16px;
    font-size: 0.875rem;
    color: #1f2937;
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
  margin-top: 16px;
  padding: 12px 0;
`;

const PageInfo = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

const PaginationButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #ffffff;
  font-size: 0.875rem;
  color: #111827;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    color: #9ca3af;
  }
  
  margin: 0 4px;
`;

const Tag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#111827'};
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
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
  background-color: ${props => props.direction === 'Received' ? '#f3f4f6' : '#4b5563'};
  color: ${props => props.direction === 'Received' ? '#111827' : '#ffffff'};
`;

const ActionButton = styled.button`
  font-size: 0.8125rem;
  padding: 8px 12px;
  background: #000000;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #1f2937;
  }
  
  /* Header button styles */
  .header-right & {
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 6px;
  }
`;

const MessageCounter = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 8px;
  text-align: right;
  padding-right: 8px;
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
  const [meetings, setMeetings] = useState([]);
  const ITEMS_PER_PAGE = 15;
  
  // IMPORTANT: Corrected table name
  const WHATSAPP_TABLE = 'whatsapp'; // Changed from 'whatsapp_messages'
  const EMAILS_TABLE = 'emails';
  const MEETINGS_TABLE = 'meetings';
  const CHATS_TABLE = 'chats';
  const CONTACT_CHATS_TABLE = 'contact_chats';

  // Debug states
  const [debugMode, setDebugMode] = useState(false);
  const [debugFilter, setDebugFilter] = useState('original');
  
  // Add state for group chat data
  const [groupChats, setGroupChats] = useState([]);
  
  // Add state for snooze success
  const [snoozeSuccess, setSnoozeSuccess] = useState(false);
  
  // Remove the debug function for supabase connection
  // Phone number normalization function
  const normalizePhoneNumber = (phone) => {
    if (!phone) return null;
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  };
  
  // Debug function to test mobile number formats vs database
  const checkMobileFormats = async (mobile) => {
    if (!mobile) return [];
    
    console.log('DEBUG: Analyzing mobile', mobile);
    
    const variations = [
      mobile,                                    // Original format
      mobile.replace(/\D/g, ''),                 // Remove all non-digits
      mobile.startsWith('+') ? mobile.substring(1) : mobile, // Without leading +
      mobile.startsWith('+') ? mobile.substring(1) : `+${mobile}`, // Toggle leading +
      mobile.startsWith('+') ? mobile : `+${mobile}`, // With leading +
      mobile.replace(/\D/g, '').slice(-10),      // Last 10 digits only
      mobile.replace(/\D/g, '').slice(-8),       // Last 8 digits only
    ];
    
    console.log('DEBUG: Testing variations:', variations);
    
    const results = [];
    
    for (const variant of variations) {
      // Skip empty variants
      if (!variant) continue;
      
      // Direct match
      const { data: exactMatches } = await supabase
        .from(WHATSAPP_TABLE)
        .select('id, contact_mobile, message')
        .eq('contact_mobile', variant)
        .limit(3);
        
      if (exactMatches && exactMatches.length > 0) {
        results.push({
          variant,
          type: 'exact-match',
          count: exactMatches.length,
          examples: exactMatches.map(m => m.contact_mobile)
        });
      }
      
      // Partial match with ILIKE
      const { data: partialMatches } = await supabase
        .from(WHATSAPP_TABLE)
        .select('id, contact_mobile, message')
        .ilike('contact_mobile', `%${variant.slice(-8)}%`)
        .limit(3);
        
      if (partialMatches && partialMatches.length > 0) {
        results.push({
          variant,
          type: 'contains-last-8',
          count: partialMatches.length,
          examples: partialMatches.map(m => m.contact_mobile)
        });
      }
    }
    
    console.log('DEBUG: Mobile format matches:', results);
    return results;
  };

  // Decide default tab on mount
  useEffect(() => {
    if (contact) {
      if (contact.mobile || contact.mobile2) setActiveTab('Whatsapp');
      else if (contact.email || contact.email2 || contact.email3) setActiveTab('Email');
      else setActiveTab('Meeting');
    }
  }, [contact]);
  
  // Effect to check if contact has any meetings when in Meeting tab
  useEffect(() => {
    if (isOpen && contact && contact.id && activeTab === 'Meeting') {
      // Directly call fetchMeetings to load meeting data
      fetchMeetings();
    }
  }, [isOpen, contact?.id, activeTab]);

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
      
      if (activeTab === 'Meeting') {
        // For meetings tab, re-fetch meetings with pagination
        fetchMeetings();
      } else {
        // For WhatsApp and other tabs, use the existing approach
        setInteractions([]);
        fetchPageWithLimitOffset(currentPage);
      }
    }
  }, [currentPage]);

  // Separate effect for tab changes
  useEffect(() => {
    if (isOpen && contact) {
      console.log('Tab changed to', activeTab, '- fetching new data');
      setCurrentPage(1); // Reset to page 1 when changing tabs
      
      if (activeTab === 'Meeting') {
        fetchMeetings();
      } else if (activeTab === 'WhatsappChat') {
        fetchWhatsAppChats();
      } else {
        fetchInteractions();
      }
    }
  }, [activeTab]);
  
  // Function to fetch WhatsApp group chats only
  const fetchWhatsAppChats = async () => {
    setLoading(true);
    console.log('FETCH WHATSAPP GROUP CHATS STARTED');
    
    try {
      if (!contact || !contact.id) {
        console.error('No contact data available');
        setLoading(false);
        setGroupChats([]);
        return;
      }
      
      console.log(`Fetching WhatsApp group chats for contact ID: ${contact.id}`);
      
      // Step 1: Get all chats this contact is a part of from contact_chats
      const { data: contactChatsData, error: contactChatsError } = await supabase
        .from(CONTACT_CHATS_TABLE)
        .select('chat_id')
        .eq('contact_id', contact.id);
      
      if (contactChatsError) {
        console.error('Error fetching contact_chats:', contactChatsError);
        setLoading(false);
        setGroupChats([]);
        return;
      }
      
      if (!contactChatsData || contactChatsData.length === 0) {
        console.log('No chats found for this contact');
        setLoading(false);
        setGroupChats([]);
        return;
      }
      
      // Extract chat IDs
      const chatIds = contactChatsData.map(item => item.chat_id);
      console.log(`Found ${chatIds.length} chat IDs for this contact`);
      
      // Step 2: Get details of GROUP chats only from the chats table
      const { data: chatsData, error: chatsError } = await supabase
        .from(CHATS_TABLE)
        .select('*')
        .in('id', chatIds)
        .eq('chat_type', 'group')  // Only get group chats
        .order('last_message_at', { ascending: false });
      
      if (chatsError) {
        console.error('Error fetching group chats data:', chatsError);
        setLoading(false);
        setGroupChats([]);
        return;
      }
      
      console.log(`Fetched ${chatsData?.length || 0} group chats`);
      
      // Step 3: For each group chat, fetch the most recent messages
      const chatsWithMessages = await Promise.all(
        (chatsData || []).map(async (chat) => {
          // Fetch most recent messages for this chat
          const { data: messagesData, error: messagesError } = await supabase
            .from(WHATSAPP_TABLE)
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(20); // Get last 20 messages
          
          if (messagesError) {
            console.error(`Error fetching messages for chat ${chat.id}:`, messagesError);
            return { ...chat, messages: [] };
          }
          
          return { ...chat, messages: messagesData || [] };
        })
      );
      
      console.log(`Processed ${chatsWithMessages.length} group chats with messages`);
      
      // Update state with the fetched group chats
      setGroupChats(chatsWithMessages);
      setTotalRecords(chatsWithMessages.length);
      setTotalPages(Math.max(Math.ceil(chatsWithMessages.length / ITEMS_PER_PAGE), 1));
      
    } catch (err) {
      console.error('Error in fetchWhatsAppChats:', err);
      setGroupChats([]);
    } finally {
      setLoading(false);
      console.log('FETCH WHATSAPP GROUP CHATS COMPLETED');
    }
  };

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
      
      // FIRST ATTEMPT: Try exact match with limit/offset - show individual and null chat_id messages
      let query = supabase
        .from(WHATSAPP_TABLE)
        .select('*, chats:chat_id(chat_type)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .in('contact_mobile', mobilesArray)
        .limit(limit)
        .offset(offset);
        
      // Exclude only messages associated with group chats
      query = query.not('chats.chat_type', 'eq', 'group');
      
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
          // Try flexible search with limit/offset - show individual and null chat_id messages
          const flexQuery = supabase
            .from(WHATSAPP_TABLE)
            .select('*, chats:chat_id(chat_type)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .or(orConditions.join(','))
            .not('chats.chat_type', 'eq', 'group')
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
        
        // Basic query construction - show individual and null chat_id messages
        console.log('DEBUG: WhatsApp Filtering - Mobile numbers:', mobilesArray);
        
        // ORIGINAL WORKING QUERY - For comparison purposes
        const originalQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*, chats:chat_id(chat_type)', { count: 'exact' })
          .in('contact_mobile', mobilesArray)
          .not('chats.chat_type', 'eq', 'group');
        
        // DEBUG: Print original query SQL
        if (typeof originalQuery.toSQL === 'function') {
          console.log('DEBUG: Original query SQL:', originalQuery.toSQL());
        }
        
        // DEBUG: Test simple query to see if ANY data exists
        const simpleQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*', { count: 'exact' })
          .in('contact_mobile', mobilesArray);
        
        // Execute debug simple query to check for data
        simpleQuery.then(({data: simpleData, count: simpleCount}) => {
          console.log(`DEBUG: Simple query found ${simpleCount || 0} messages`); 
          if (simpleData && simpleData.length > 0) {
            console.log('DEBUG: Sample record:', simpleData[0]);
          }
        });
        
        // Query with filter based on debug mode
        console.log('DEBUG: Raw mobile numbers:', contact.mobile, contact.mobile2);

        // First, let's run a direct database check on WhatsApp table
        console.log('DEBUG: Running direct table check...');
        
        // Check the entire table size
        supabase
          .from(WHATSAPP_TABLE)
          .select('*', { count: 'exact', head: true })
          .then(({count, error}) => {
            console.log(`DEBUG: Table ${WHATSAPP_TABLE} has ${count || 0} total records. Error:`, error);
          });
          
        // Double check normalized numbers
        const rawMobileNumbers = [];
        if (contact.mobile) rawMobileNumbers.push(contact.mobile);
        if (contact.mobile2) rawMobileNumbers.push(contact.mobile2);
        
        console.log('DEBUG: Raw mobile formats:', rawMobileNumbers);
        
        // Check for any messages with the last 4 digits
        const lastDigitsChecks = rawMobileNumbers
          .filter(num => num && num.length > 4)
          .map(num => num.slice(-4));
          
        if (lastDigitsChecks.length > 0) {
          console.log('DEBUG: Checking by last 4 digits:', lastDigitsChecks);
          lastDigitsChecks.forEach(digits => {
            supabase
              .from(WHATSAPP_TABLE)
              .select('*')
              .ilike('contact_mobile', `%${digits}`)
              .limit(5)
              .then(({data, error}) => {
                console.log(`DEBUG: Last 4 digits check '${digits}' found:`, 
                  data ? `${data.length} records` : 'none', 
                  error ? `Error: ${error.message}` : '');
                if (data && data.length > 0) {
                  console.log('DEBUG: Sample record with matching digits:', data[0]);
                }
              });
          });
        }
        
        // DIRECT APPROACH: First get all messages, then filter in JavaScript
        console.log('DEBUG: Using most direct approach possible');
        
        // Create conditions for last 8 digits of phone numbers - don't normalize
        const rawMobiles = [];
        if (contact.mobile) rawMobiles.push(contact.mobile);
        if (contact.mobile2) rawMobiles.push(contact.mobile2);
        console.log('DEBUG: Raw mobile numbers:', rawMobiles);
        
        // Use the raw mobile numbers directly
        const lastDigitsConditions = rawMobiles
          .filter(mobile => mobile && mobile.length > 4)
          .map(mobile => {
            // Get last 8 digits for partial matching
            const last8 = mobile.slice(-8);
            return `contact_mobile.ilike.%${last8}`;
          });
        
        console.log('DEBUG: Using conditions:', lastDigitsConditions);
        
        // Now proceed with a simple query WITHOUT any group filtering
        let query = supabase
          .from(WHATSAPP_TABLE)
          .select('*, chats:chat_id(chat_type)', { count: 'exact' })
          .order('created_at', { ascending: false })
          .or(lastDigitsConditions.join(','));
          
        // IMPORTANT: We will filter in JavaScript instead of SQL
        console.log('DEBUG: Will apply group filtering in JavaScript after query');
        
        // Apply filter based on current debug setting
        if (debugMode && debugFilter === 'or-null-nongroup') {
          query = query.or('chat_id.is.null,not.chats.chat_type.eq.group');
          console.log('DEBUG: Using OR filter (NULL OR NOT GROUP)');
        } else if (debugMode && debugFilter === 'null-only') {
          query = query.is('chat_id', null);
          console.log('DEBUG: Using NULL chat_id filter');
        } else if (debugMode && debugFilter === 'all-messages') {
          // Remove any chat filters
          console.log('DEBUG: Showing ALL messages');
        } else {
          // Default/original filter: not group chats
          query = query.not('chats.chat_type', 'eq', 'group');
          console.log('DEBUG: Using original NOT GROUP filter');
        }
        
        query = query.range(from, to);
          
        // DEBUG: Print query SQL
        if (typeof query.toSQL === 'function') {
          console.log('DEBUG: New query SQL:', query.toSQL());
        }
        
        console.log('Executing initial query...');
        
        // Execute the query
        const { data: responseData, error, count: totalCount } = await query;
        
        // DEBUG: Log query results
        console.log(`DEBUG: Query returned ${responseData ? responseData.length : 0} results out of ${totalCount || 0} total`);
        if (error) {
          console.error('DEBUG: Query error:', error);
        }
        if (responseData && responseData.length > 0) {
          console.log('DEBUG: First result:', responseData[0]);
          // Check if any results have chat_id
          const withChatId = responseData.filter(r => r.chat_id);
          const withoutChatId = responseData.filter(r => !r.chat_id);
          console.log(`DEBUG: Results with chat_id: ${withChatId.length}, without chat_id: ${withoutChatId.length}`);
        }
        
        if (error) {
          console.error('Query error:', error);
          throw error;
        }
        
        console.log(`Query returned ${responseData ? responseData.length : 0} records out of ${totalCount} total`);
        
        // Always print what we received
        if (responseData && responseData.length > 0) {
          console.log('DEBUG: FILTERING CHECK - responseData before filtering:', responseData.map(m => ({
            id: m.id,
            chatId: m.chat_id,
            chatType: m.chats?.chat_type,
            isGroup: m.chats?.chat_type === 'group'
          })));
        }
        
        // Filter out group chats in JavaScript (even in debug mode now)
        const filteredData = (responseData || []).filter(message => {
          // Log chat details for debugging
          if (message.chat_id) {
            console.log(`DEBUG: Message ${message.id} has chat_id ${message.chat_id}`);
          }
          
          // We need to exclude any messages that:
          // 1. Have chats.chat_type === 'group'
          // 2. OR have a chat_id but no chats data (could be a group chat not properly joined)
          
          // Check if message is linked to a chat but doesn't have the chat details
          const hasChatIdOnly = message.chat_id && !message.chats;
          
          // Check if message is explicitly linked to a group chat
          const isGroupChat = message.chats && message.chats.chat_type === 'group';
          
          // Only keep messages that are either:
          // - Not linked to any chat (chat_id is null)
          // - OR properly linked to a non-group chat
          return !hasChatIdOnly && !isGroupChat;
        });
        
        console.log(`FILTERING: ${responseData ? responseData.length - filteredData.length : 0} group messages removed`);
        console.log('DEBUG: Filtered data:', filteredData?.map(m => ({
          id: m.id,
          chatId: m.chat_id,
          chatType: m.chats?.chat_type
        })));
        
        // Update state with filtered results
        data = filteredData || [];
        count = filteredData.length; // Update count to filtered length
        
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

  // Define the WhatsApp click handler at component level
  const handleWhatsAppClick = (mobile) => {
    if (!mobile) return;
    const formattedNumber = mobile.startsWith('+') ? mobile.substring(1) : mobile;
    window.open(`https://wa.me/${formattedNumber}`, '_blank');
  };
  
  // Debug function to test different filter strategies
  const testDebugFilter = async () => {
    setLoading(true);
    console.log(`DEBUG: Testing filter strategy: ${debugFilter}`);
    
    // First, let's directly check the WhatsApp table to see if there's any data
    console.log('DEBUG: Checking WhatsApp table overall data');
    
    try {
      const { count: totalCount, error: totalError } = await supabase
        .from(WHATSAPP_TABLE)
        .select('*', { count: 'exact', head: true });
      
      console.log(`DEBUG: WhatsApp table has ${totalCount || 0} total records`);
      if (totalError) console.error('DEBUG: Error querying table:', totalError);
      
      // Get a sample of records to verify the schema
      const { data: sampleData, error: sampleError } = await supabase
        .from(WHATSAPP_TABLE)
        .select('*')
        .limit(3);
        
      if (sampleData && sampleData.length > 0) {
        console.log('DEBUG: Sample record structure:', sampleData[0]);
        
        // Check field names, especially contact_mobile
        console.log('DEBUG: Field names:', Object.keys(sampleData[0]));
        
        // Check a few contact_mobile values
        const mobileExamples = sampleData.map(d => d.contact_mobile);
        console.log('DEBUG: Example contact_mobile values:', mobileExamples);
      } else {
        console.error('DEBUG: Could not get sample data. Error:', sampleError);
      }
    } catch (err) {
      console.error('DEBUG: Error checking table:', err);
    }
    
    const mobilesArray = [];
    if (contact.mobile) mobilesArray.push(normalizePhoneNumber(contact.mobile));
    if (contact.mobile2) mobilesArray.push(normalizePhoneNumber(contact.mobile2));
    
    // Log raw and normalized numbers
    console.log('DEBUG: Raw mobile numbers:', contact.mobile, contact.mobile2);
    console.log('DEBUG: Normalized mobile numbers:', mobilesArray);
    
    if (mobilesArray.length === 0) {
      console.log('DEBUG: No mobile numbers to search with');
      setLoading(false);
      return;
    }
    
    // For simple search, try to match just the last 4 digits
    const lastDigits = [];
    if (contact.mobile && contact.mobile.length > 4) lastDigits.push(contact.mobile.slice(-4));
    if (contact.mobile2 && contact.mobile2.length > 4) lastDigits.push(contact.mobile2.slice(-4));
    
    let testQuery;
    
    switch(debugFilter) {
      case 'original':
        // Original filter that worked
        testQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*, chats:chat_id(chat_type)', { count: 'exact' })
          .in('contact_mobile', mobilesArray)
          .not('chats.chat_type', 'eq', 'group');
        break;
        
      case 'or-null-nongroup':
        // Test OR with both conditions
        testQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*, chats:chat_id(chat_type)', { count: 'exact' })
          .in('contact_mobile', mobilesArray)
          .or('chat_id.is.null,not.chats.chat_type.eq.group');
        break;
        
      case 'null-only':
        // Only null chat_id
        testQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*, chats:chat_id(chat_type)', { count: 'exact' })
          .in('contact_mobile', mobilesArray)
          .is('chat_id', null);
        break;
        
      case 'direct-messages':
        // Messages with contact_mobile but no query on chat
        // Get phone variations just like the main query
        console.log('DEBUG: Checking for direct messages only');
        const phoneVars = [];
        
        // For each mobile number, create variations
        mobilesArray.forEach(mobile => {
          if (!mobile) return;
          
          // Add variations
          phoneVars.push(
            mobile,
            mobile.replace(/\D/g, ''),
            mobile.startsWith('+') ? mobile.substring(1) : mobile,
            mobile.startsWith('+') ? mobile : `+${mobile}`,
            mobile.replace(/\D/g, '').slice(-10)
          );
        });
        
        // Filter out duplicates and empty values
        const uniqueVars = [...new Set(phoneVars)].filter(Boolean);
        console.log('DEBUG: Trying with phone variations:', uniqueVars);
        
        // Create OR conditions for partial matching
        const lastDigitsConditions = uniqueVars.map(phone => {
          const last8 = phone.slice(-8);
          return `contact_mobile.ilike.%${last8}`;
        });
        
        // Look for direct messages without filtering by chat
        testQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .or(lastDigitsConditions.join(','))
          .limit(50);
        break;
        
      case 'analyze-messages':
        // This option is specifically designed to analyze what's happening
        console.log('DEBUG: Starting comprehensive message analysis');
        
        // First, get raw mobile numbers
        const rawNumbers = [];
        if (contact.mobile) rawNumbers.push(contact.mobile);
        if (contact.mobile2) rawNumbers.push(contact.mobile2);
        
        // Create last 8 digits conditions
        const last8Conditions = rawNumbers
          .filter(mobile => mobile && mobile.length > 4)
          .map(mobile => `contact_mobile.ilike.%${mobile.slice(-8)}`);
          
        console.log('DEBUG: Using last 8 digits conditions:', last8Conditions);
        
        // Get all messages that match by mobile number - no filtering by chat
        const { data: allMatchingMessages } = await supabase
          .from(WHATSAPP_TABLE)
          .select('*, chats:chat_id(chat_type)')
          .or(last8Conditions.join(','))
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (allMatchingMessages && allMatchingMessages.length > 0) {
          console.log(`DEBUG: Found ${allMatchingMessages.length} total messages`);
          
          // Categorize messages
          const groupMessages = allMatchingMessages.filter(m => m.chats?.chat_type === 'group');
          const nullChatMessages = allMatchingMessages.filter(m => m.chat_id === null);
          const nonGroupChatMessages = allMatchingMessages.filter(m => 
            m.chat_id !== null && m.chats?.chat_type !== 'group'
          );
          
          console.log('DEBUG: Message breakdown:', {
            total: allMatchingMessages.length,
            group: groupMessages.length,
            nullChat: nullChatMessages.length,
            nonGroup: nonGroupChatMessages.length
          });
          
          // Show some examples
          if (groupMessages.length > 0) {
            console.log('DEBUG: Example group message:', {
              id: groupMessages[0].id,
              chatId: groupMessages[0].chat_id,
              chatType: groupMessages[0].chats?.chat_type,
              mobile: groupMessages[0].contact_mobile
            });
          }
          
          // Show non-group example
          if (nonGroupChatMessages.length > 0) {
            console.log('DEBUG: Example non-group message:', {
              id: nonGroupChatMessages[0].id,
              chatId: nonGroupChatMessages[0].chat_id,
              chatType: nonGroupChatMessages[0].chats?.chat_type,
              mobile: nonGroupChatMessages[0].contact_mobile
            });
          }
          
          // Try building query with simplified filtering
          testQuery = supabase
            .from(WHATSAPP_TABLE)
            .select('*, chats:chat_id(chat_type)', { count: 'exact' })
            .or(last8Conditions.join(','))
            .is('chats.chat_type', null)
            .order('created_at', { ascending: false })
            .limit(50);
            
          console.log('DEBUG: Using IS NULL on chats.chat_type as test filter');
        } else {
          console.log('DEBUG: No messages found with mobile match');
          // Get some examples from the database
          testQuery = supabase
            .from(WHATSAPP_TABLE)
            .select('*', { count: 'exact' })
            .limit(20);
        }
        break;
        
      case 'nongroup-only':
        // Only non-group chats
        testQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*, chats:chat_id(chat_type)', { count: 'exact' })
          .in('contact_mobile', mobilesArray)
          .not('chats.chat_type', 'eq', 'group');
        break;
        
      case 'all-messages':
        // All messages regardless of chat
        testQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*, chats:chat_id(chat_type)', { count: 'exact' })
          .in('contact_mobile', mobilesArray);
        break;
        
      case 'last-4-digits':
        // Try matching by last 4 digits instead of exact match
        if (lastDigits.length > 0) {
          console.log('DEBUG: Searching by last 4 digits:', lastDigits);
          const orConditions = lastDigits.map(digits => 
            `contact_mobile.ilike.%${digits}`
          );
          testQuery = supabase
            .from(WHATSAPP_TABLE)
            .select('*', { count: 'exact' })
            .or(orConditions.join(','));
        } else {
          testQuery = supabase
            .from(WHATSAPP_TABLE)
            .select('*', { count: 'exact' })
            .in('contact_mobile', mobilesArray);
        }
        break;
        
      case 'table-scan':
        // List most recent messages from the table
        testQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(20);
        break;
        
      case 'mobile-formats':
        // Special case: check mobile number formats in table directly
        console.log('DEBUG: Running advanced mobile formats diagnostic');
        try {
          let matchesFound = false;
          
          if (contact.mobile) {
            console.log('MOBILE 1 ANALYSIS:');
            const mobile1Matches = await checkMobileFormats(contact.mobile);
            
            if (mobile1Matches.length > 0) {
              // We found some matching mobile format - let's use that format
              const bestMatch = mobile1Matches.find(m => m.type === 'exact-match') || mobile1Matches[0];
              console.log('DEBUG: Best match found:', bestMatch);
              
              // Use this format in a real query
              if (bestMatch.examples && bestMatch.examples.length > 0) {
                const format = bestMatch.examples[0];
                console.log(`DEBUG: Using format '${format}' to fetch messages`);
                
                const { data: messages } = await supabase
                  .from(WHATSAPP_TABLE)
                  .select('*, chats:chat_id(chat_type)')
                  .eq('contact_mobile', format)
                  .not('chats.chat_type', 'eq', 'group')
                  .order('created_at', { ascending: false })
                  .limit(20);
                  
                if (messages && messages.length > 0) {
                  console.log(`DEBUG: Found ${messages.length} messages using format '${format}'`);
                  setInteractions(messages);
                  setTotalRecords(messages.length);
                  setTotalPages(1);
                  setLoading(false);
                  matchesFound = true;
                  return;
                }
              }
              
              // Try a partial match
              if (bestMatch.variant) {
                const { data: messages } = await supabase
                  .from(WHATSAPP_TABLE)
                  .select('*, chats:chat_id(chat_type)')
                  .ilike('contact_mobile', `%${bestMatch.variant.slice(-8)}`)
                  .not('chats.chat_type', 'eq', 'group')
                  .order('created_at', { ascending: false })
                  .limit(20);
                  
                if (messages && messages.length > 0) {
                  console.log(`DEBUG: Found ${messages.length} messages using last 8 digits`);
                  setInteractions(messages);
                  setTotalRecords(messages.length);
                  setTotalPages(1);
                  setLoading(false);
                  matchesFound = true;
                  return;
                }
              }
            }
          }
          
          if (!matchesFound && contact.mobile2) {
            console.log('MOBILE 2 ANALYSIS:');
            const mobile2Matches = await checkMobileFormats(contact.mobile2);
            
            if (mobile2Matches.length > 0) {
              const bestMatch = mobile2Matches.find(m => m.type === 'exact-match') || mobile2Matches[0];
              console.log('DEBUG: Best match found for mobile2:', bestMatch);
              
              // Try using this format
              if (bestMatch.examples && bestMatch.examples.length > 0) {
                const format = bestMatch.examples[0];
                const { data: messages } = await supabase
                  .from(WHATSAPP_TABLE)
                  .select('*, chats:chat_id(chat_type)')
                  .eq('contact_mobile', format)
                  .not('chats.chat_type', 'eq', 'group')
                  .order('created_at', { ascending: false })
                  .limit(20);
                  
                if (messages && messages.length > 0) {
                  console.log(`DEBUG: Found ${messages.length} messages using format '${format}'`);
                  setInteractions(messages);
                  setTotalRecords(messages.length);
                  setTotalPages(1);
                  setLoading(false);
                  matchesFound = true;
                  return;
                }
              }
            }
          }
          
          if (!matchesFound) {
            console.log('DEBUG: No matching mobile formats found, falling back to table scan');
            const { data: latestMessages } = await supabase
              .from(WHATSAPP_TABLE)
              .select('*, chats:chat_id(chat_type)')
              .order('created_at', { ascending: false })
              .limit(20);
              
            if (latestMessages && latestMessages.length > 0) {
              console.log('DEBUG: Latest messages from table:', latestMessages.map(m => ({
                id: m.id,
                mobile: m.contact_mobile,
                date: m.created_at
              })));
              setInteractions(latestMessages);
              setTotalRecords(latestMessages.length);
              setTotalPages(1);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error('DEBUG: Error in mobile formats analysis:', err);
        }
        
        // Continue with a simple table scan if all else fails
        testQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*', { count: 'exact' })
          .limit(20);
        break;
        
      default:
        testQuery = supabase
          .from(WHATSAPP_TABLE)
          .select('*, chats:chat_id(chat_type)', { count: 'exact' })
          .in('contact_mobile', mobilesArray);
    }
    
    // Log the SQL query if available
    if (typeof testQuery.toSQL === 'function') {
      console.log(`DEBUG: ${debugFilter} SQL:`, testQuery.toSQL());
    }
    
    // Execute test query
    try {
      const {data, count, error} = await testQuery;
      
      console.log(`DEBUG: Test query "${debugFilter}" returned:`, { 
        count: count || 0, 
        results: data?.length || 0,
        error
      });
      
      if (data && data.length > 0) {
        console.log('DEBUG: First result:', data[0]);
        // Check chat_id distribution
        const withChatId = data.filter(r => r.chat_id);
        const withoutChatId = data.filter(r => !r.chat_id);
        console.log(`DEBUG: Results with chat_id: ${withChatId.length}, without chat_id: ${withoutChatId.length}`);
        
        // Update state with filtered results
        setInteractions(data);
        setTotalRecords(count || 0);
        setTotalPages(Math.max(Math.ceil((count || 0) / ITEMS_PER_PAGE), 1));
      } else {
        console.log('DEBUG: No results found');
        setInteractions([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('DEBUG: Error executing test query:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update the renderWhatsAppTable function to make the button properly clickable
  const renderWhatsAppTable = () => {
    // DEBUG: Log what's being rendered
    console.log(`DEBUG: Rendering WhatsApp table with ${interactions.length} messages`);
    if (interactions.length > 0) {
      console.log('DEBUG: First interaction to render:', interactions[0]);
    }
    
    // FINAL FILTER: Filter interactions right at render time to guarantee no group messages
    // This will ensure the messages displayed don't include group chats regardless of earlier failures
    const finalFilteredMessages = interactions.filter(message => {
      // Log each message's chat properties for debugging
      if (message.chat_id) {
        console.log(`DEBUG: Message ${message.id} has chat_id ${message.chat_id}`);
      }
      
      // We need to exclude any messages that:
      // 1. Have chats.chat_type === 'group'
      // 2. OR have a chat_id but no chats data (could be a group chat not properly joined)
      
      // Check if message is linked to a chat but doesn't have the chat details
      const hasChatIdOnly = message.chat_id && !message.chats;
      
      // Check if message is explicitly linked to a group chat
      const isGroupChat = message.chats && message.chats.chat_type === 'group';
      
      // Only keep messages that are either:
      // - Not linked to any chat (chat_id is null)
      // - OR properly linked to a non-group chat
      return !hasChatIdOnly && !isGroupChat;
    });
    
    console.log(`FINAL FILTER: Removed ${interactions.length - finalFilteredMessages.length} group messages at render time`);
    console.log('DEBUG: Final filtered messages:', finalFilteredMessages);
    
    // Use the filtered messages for rendering instead of original interactions
    if (loading) {
      return (
        <>
          <NoInteractions>Loading page {currentPage}...</NoInteractions>
        </>
      );
    }
    
    // If there are no filtered messages but we had interactions, that means all were group chats
    if (!finalFilteredMessages.length) {
      return (
        <>
          <NoInteractions>
            {interactions.length > 0 
              ? "All messages are group chats - check the 'WhatsApp Group Chat' tab" 
              : "No WhatsApp messages found for page " + currentPage}
            <div style={{ fontSize: '0.85em', marginTop: '16px', color: '#4b5563' }}>
              <button 
                type="button"
                onClick={() => {
                  console.log("Emergency fetch button clicked");
                  emergencyFetchPage(currentPage);
                }} 
                style={{ 
                  marginTop: '16px',
                  padding: '8px 16px', 
                  background: '#000000', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}
              >
                Retry Fetch
              </button>
            </div>
          </NoInteractions>
        </>
      );
    }

    // Calculate record ranges for display
    const startRecord = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endRecord = Math.min(startRecord + finalFilteredMessages.length - 1, totalRecords);

    // New styled components for WhatsApp chat interface
    const ChatContainer = styled.div`
      height: 400px;
      overflow-y: auto;
      margin-bottom: 15px;
      background-color: #f0f0f0;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;
    
    const MessageBubble = styled.div`
      max-width: 80%;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 0.85rem;
      line-height: 1.3;
      position: relative;
      word-break: break-word;
      
      ${props => props.direction === 'Sent' ? `
        align-self: flex-end;
        background-color: #000000;
        color: white;
        border-bottom-right-radius: 2px;
        
        &:after {
          content: '';
          position: absolute;
          bottom: 0;
          right: -8px;
          width: 0;
          height: 0;
          border: 8px solid transparent;
          border-left-color: #000000;
          border-right: 0;
          border-bottom: 0;
        }
      ` : `
        align-self: flex-start;
        background-color: #ffffff;
        border-bottom-left-radius: 2px;
        
        &:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: -8px;
          width: 0;
          height: 0;
          border: 8px solid transparent;
          border-right-color: #ffffff;
          border-left: 0;
          border-bottom: 0;
        }
      `}
    `;
    
    const MessageMeta = styled.div`
      font-size: 0.65rem;
      color: ${props => props.direction === 'Sent' ? '#cccccc' : '#8696a0'};
      margin-top: 2px;
      display: flex;
      align-items: center;
      justify-content: ${props => props.direction === 'Sent' ? 'flex-end' : 'flex-start'};
      gap: 4px;
    `;
    
    const MessageDate = styled.span`
      font-size: 0.65rem;
    `;
    
    const MessagePhone = styled.span`
      font-size: 0.65rem;
      color: #374151;
      font-weight: 500;
    `;

    return (
      <>
        <MessageCounter>
          Individual WhatsApp Messages - Page {currentPage} of {totalPages}
        </MessageCounter>
        
        <ChatContainer>
          {finalFilteredMessages.map((interaction, index) => {
            const isIncoming = 
              interaction.direction?.toLowerCase() === 'inbound' || 
              interaction.direction?.toLowerCase() === 'incoming' ||
              interaction.direction?.toLowerCase() === 'received' || 
              interaction.direction?.toLowerCase() === 'in';
            
            const direction = isIncoming ? 'Received' : 'Sent';
            const formattedDate = formatDate(interaction.whatsapp_date || interaction.created_at);
            const messageTxt = interaction.message?.replace(/<a href=".*?">.*?<\/a>/g, "LINK") || "";
            
            return (
              <MessageBubble 
                key={interaction.id || index} 
                direction={direction}
              >
                {messageTxt}
                <MessageMeta direction={direction}>
                  <MessageDate>{formattedDate}</MessageDate>
                  {direction === 'Received' && 
                    <MessagePhone>• {interaction.contact_mobile}</MessagePhone>
                  }
                </MessageMeta>
              </MessageBubble>
            );
          })}
        </ChatContainer>
        
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

  // Render for meetings tab
  const renderMeetingsTable = () => {
    if (loading) {
      return <NoInteractions>Loading meetings...</NoInteractions>;
    }
    
    if (!meetings.length) {
      return (
        <NoInteractions>
          No meetings found for this contact
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => window.open('/planner', '_blank')}
              style={{ 
                padding: '8px 16px', 
                background: '#000000', 
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Schedule a Meeting
            </button>
          </div>
        </NoInteractions>
      );
    }

    // Calculate record ranges for display
    const startRecord = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endRecord = Math.min(startRecord + meetings.length - 1, totalRecords);

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', color: '#374151' }}>
            {startRecord}-{endRecord} of {totalRecords} meetings
          </div>
          <button 
            onClick={() => window.open('/planner', '_blank')}
            style={{ 
              padding: '8px 16px', 
              background: '#000000', 
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            View All Meetings
          </button>
        </div>
        <div style={{ height: '400px', overflowY: 'auto', marginBottom: '15px' }}>
        <Table>
          <TableHeader>
            <tr>
              <th style={{ width: '15%' }}>Date</th>
              <th style={{ width: '30%' }}>Meeting Name</th>
              <th style={{ width: '15%' }}>Category</th>
              <th style={{ width: '40%' }}>Notes</th>
            </tr>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting, index) => {
              // Determine category style
              const getCategoryColor = (category) => {
                switch (category?.toLowerCase()) {
                  case 'inbox': return '#f3f4f6';
                  case 'karma_points': return '#f3f4f6';
                  case 'dealflow': return '#4b5563';
                  case 'portfolio': return '#4b5563';
                  default: return '#f3f4f6';
                }
              };
              
              const getCategoryTextColor = (category) => {
                switch (category?.toLowerCase()) {
                  case 'inbox': return '#111827';
                  case 'karma_points': return '#111827';
                  case 'dealflow': return '#ffffff';
                  case 'portfolio': return '#ffffff';
                  default: return '#111827';
                }
              };

              return (
                <tr key={meeting.id || index}>
                  <td className="centered">
                    {formatDate(meeting.meeting_date)}
                  </td>
                  <td>
                    {meeting.meeting_name}
                  </td>
                  <td className="tag-cell">
                    <Tag 
                      color={getCategoryColor(meeting.meeting_category)}
                      textColor={getCategoryTextColor(meeting.meeting_category)}
                    >
                      <span>{meeting.meeting_category || 'None'}</span>
                    </Tag>
                  </td>
                  <td>
                    {meeting.meeting_note ? (
                      <div style={{ 
                        maxHeight: '80px', 
                        overflow: 'auto',
                        fontSize: '0.85rem',
                        lineHeight: '1.5'
                      }}>
                        {meeting.meeting_note}
                      </div>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: '#6b7280' }}>No notes</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </TableBody>
        </Table>
        </div>
        
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

  // Render for Email or other generic tabs
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
      
      // IMPORTANT: We need the RAW mobile numbers, NOT the normalized ones
      // Get the raw mobile numbers from contact
      const rawMobiles = [];
      if (contact.mobile) rawMobiles.push(contact.mobile);
      if (contact.mobile2) rawMobiles.push(contact.mobile2);
      console.log(`[FLEX ${page}] Raw mobile numbers:`, rawMobiles);
      
      // Create conditions for matching last digits using raw mobile numbers
      const orConditions = rawMobiles
        .filter(mobile => mobile && mobile.length > 4)
        .map(mobile => `contact_mobile.ilike.%${mobile.slice(-8)}`);
      
      if (orConditions.length === 0) {
        console.log(`[FLEX ${page}] No valid conditions for flexible search`);
        setInteractions([]);
        return;
      }
      
      // Build the flexible query without filtering - we'll filter in JavaScript
      const flexQuery = supabase
        .from(WHATSAPP_TABLE)
        .select('*, chats:chat_id(chat_type)', { count: 'exact' })
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
        // Filter out group chats in JavaScript
        const filteredData = data.filter(message => {
          // Log chat details for debugging
          if (message.chat_id) {
            console.log(`DEBUG FLEX: Message ${message.id} has chat_id ${message.chat_id}`);
          }
          
          // We need to exclude any messages that:
          // 1. Have chats.chat_type === 'group'
          // 2. OR have a chat_id but no chats data (could be a group chat not properly joined)
          
          // Check if message is linked to a chat but doesn't have the chat details
          const hasChatIdOnly = message.chat_id && !message.chats;
          
          // Check if message is explicitly linked to a group chat
          const isGroupChat = message.chats && message.chats.chat_type === 'group';
          
          // Only keep messages that are either:
          // - Not linked to any chat (chat_id is null)
          // - OR properly linked to a non-group chat
          return !hasChatIdOnly && !isGroupChat;
        });
        
        console.log(`[FLEX ${page}] Filtered out ${data.length - filteredData.length} group messages in JavaScript`);
        
        // Add comprehensive debug info to filtered data
        const dataWithDebug = filteredData.map((record, index) => ({
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
        
        console.log(`[FLEX ${page}] Setting ${dataWithDebug.length} filtered flex records in state`);
        
        setInteractions(dataWithDebug);
        setTotalRecords(filteredData.length);
        setTotalPages(Math.max(Math.ceil(filteredData.length / ITEMS_PER_PAGE), 1));
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
        .select('*, chats:chat_id(chat_type)')
        .in('contact_mobile', mobilesArray)
        .or('chat_id.is.null,not.chats.chat_type.eq.group')
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
        // EXTRA FILTERING: Filter out any messages with chat_id that might be group chats
        const filteredAllData = allData.filter(message => {
          // Log each message's chat properties for debugging
          if (message.chat_id) {
            console.log(`[EMERGENCY] Message ${message.id} has chat_id ${message.chat_id}`);
          }
          
          // We need to exclude any messages that:
          // 1. Have chats.chat_type === 'group'
          // 2. OR have a chat_id but no chats data (could be a group chat not properly joined)
          
          // Check if message is linked to a chat but doesn't have the chat details
          const hasChatIdOnly = message.chat_id && !message.chats;
          
          // Check if message is explicitly linked to a group chat
          const isGroupChat = message.chats && message.chats.chat_type === 'group';
          
          // Only keep messages that are either:
          // - Not linked to any chat (chat_id is null)
          // - OR properly linked to a non-group chat
          return !hasChatIdOnly && !isGroupChat;
        });
        
        console.log(`[EMERGENCY] Filtered out ${allData.length - filteredAllData.length} potential group messages`);
        
        // Manually calculate data for this page
        const pageData = filteredAllData.slice(offset, offset + ITEMS_PER_PAGE);
        
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
          setTotalRecords(filteredAllData.length);
          setTotalPages(Math.max(Math.ceil(filteredAllData.length / ITEMS_PER_PAGE), 1));
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
      
      // Fetch ALL flexible matches - show individual and null chat_id messages
      const flexQuery = supabase
        .from(WHATSAPP_TABLE)
        .select('*, chats:chat_id(chat_type)')
        .or(orConditions.join(','))
        .or('chat_id.is.null,not.chats.chat_type.eq.group')
        .order('created_at', { ascending: false });
      
      const { data: flexData, error: flexError } = await flexQuery;
      
      if (flexError) {
        console.error(`[EMERGENCY-FLEX] Error:`, flexError);
        return;
      }
      
      console.log(`[EMERGENCY-FLEX] Total flex matches: ${flexData?.length || 0}`);
      
      if (flexData && flexData.length > 0) {
        // EXTRA FILTERING: Filter out any messages with chat_id that might be group chats
        const filteredFlexData = flexData.filter(message => {
          // Log each message's chat properties for debugging
          if (message.chat_id) {
            console.log(`[EMERGENCY-FLEX] Message ${message.id} has chat_id ${message.chat_id}`);
          }
          
          // We need to exclude any messages that:
          // 1. Have chats.chat_type === 'group'
          // 2. OR have a chat_id but no chats data (could be a group chat not properly joined)
          
          // Check if message is linked to a chat but doesn't have the chat details
          const hasChatIdOnly = message.chat_id && !message.chats;
          
          // Check if message is explicitly linked to a group chat
          const isGroupChat = message.chats && message.chats.chat_type === 'group';
          
          // Only keep messages that are either:
          // - Not linked to any chat (chat_id is null)
          // - OR properly linked to a non-group chat
          return !hasChatIdOnly && !isGroupChat;
        });
        
        console.log(`[EMERGENCY-FLEX] Filtered out ${flexData.length - filteredFlexData.length} potential group messages`);
        
        // Manual pagination for flex data
        const pageFlexData = filteredFlexData.slice(offset, offset + ITEMS_PER_PAGE);
        
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
          setTotalRecords(filteredFlexData.length);
          setTotalPages(Math.max(Math.ceil(filteredFlexData.length / ITEMS_PER_PAGE), 1));
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

  // Fetch meetings data from Supabase for the contact
  const fetchMeetings = async () => {
    setLoading(true);
    console.log('FETCH MEETINGS STARTED');
    
    try {
      if (!contact || !contact.id) {
        console.error('No contact data available for fetching meetings');
        setLoading(false);
        setMeetings([]);
        return;
      }
      
      console.log(`Fetching meetings for contact ID: ${contact.id}`);
      
      // Query the meetings_contacts junction table to find meetings where this contact is an attendee
      const { data: meetingContactsData, error: meetingContactsError } = await supabase
        .from('meetings_contacts')
        .select('meeting_id')
        .eq('contact_id', contact.id);
      
      if (meetingContactsError) {
        console.error('Error fetching meetings_contacts:', meetingContactsError);
        setLoading(false);
        setMeetings([]);
        return;
      }
      
      if (!meetingContactsData || meetingContactsData.length === 0) {
        console.log('No meetings found for this contact');
        setLoading(false);
        setMeetings([]);
        return;
      }
      
      // Extract meeting IDs
      const meetingIds = meetingContactsData.map(item => item.meeting_id);
      console.log(`Found ${meetingIds.length} meeting IDs for this contact`);
      
      // Fetch the actual meetings data
      const { data: meetingsData, error: meetingsError } = await supabase
        .from(MEETINGS_TABLE)
        .select('*')
        .in('id', meetingIds)
        .order('meeting_date', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);
      
      if (meetingsError) {
        console.error('Error fetching meetings data:', meetingsError);
        setLoading(false);
        setMeetings([]);
        return;
      }
      
      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from(MEETINGS_TABLE)
        .select('*', { count: 'exact', head: true })
        .in('id', meetingIds);
      
      if (countError) {
        console.error('Error counting meetings:', countError);
      }
      
      console.log(`Fetched ${meetingsData?.length || 0} meetings out of ${count || 0} total`);
      
      // Update state with the fetched meetings
      setMeetings(meetingsData || []);
      setTotalRecords(count || 0);
      setTotalPages(Math.max(Math.ceil((count || 0) / ITEMS_PER_PAGE), 1));
      
    } catch (err) {
      console.error('Error in fetchMeetings:', err);
      setMeetings([]);
    } finally {
      setLoading(false);
      console.log('FETCH MEETINGS COMPLETED');
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
            
            <div style={{ fontSize: '0.85em', marginTop: '16px', color: '#6b7280' }}>
              <p>Please make sure the contact has valid email addresses and the emails table exists in the database.</p>
              
              <div style={{ marginTop: '16px' }}>
                <button 
                  type="button"
                  onClick={() => {
                    console.log("Debug email fetch button clicked");
                    fetchEmails();
                  }} 
                  style={{ 
                    marginTop: '16px',
                    padding: '8px 16px', 
                    background: '#000000', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                  }}
                >
                  Refresh Emails
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
    
    // Create email-like display styles using our color palette
    const emailContainer = {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      padding: '20px',
      marginBottom: '20px',
      marginTop: '0',
      maxWidth: '100%',
      overflowWrap: 'break-word',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column'
    };
    
    const emailHeader = {
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '16px',
      marginBottom: '16px'
    };
    
    const emailSubject = {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      marginBottom: '12px',
      color: '#111827'
    };
    
    const emailMeta = {
      display: 'flex',
      justifyContent: 'space-between',
      color: '#6b7280',
      fontSize: '0.9rem',
      marginBottom: '8px'
    };
    
    const emailMetaLabel = {
      fontWeight: 'bold',
      marginRight: '10px',
      color: '#111827'
    };
    
    const emailBody = {
      padding: '15px',
      fontSize: '0.95rem',
      lineHeight: '1.6',
      color: '#1f2937',
      whiteSpace: 'pre-wrap',  // Preserves line breaks in the email body
      display: 'block',
      textOverflow: 'initial',
      overflow: 'visible',
      wordBreak: 'break-word'
    };
    
    const directionButtonStyle = {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      marginLeft: '10px',
      color: direction === 'Received' ? '#111827' : '#ffffff',
      backgroundColor: direction === 'Received' ? '#f3f4f6' : '#4b5563',
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
      borderRadius: '6px',
      fontSize: '0.95rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      minWidth: '120px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease'
    };
    
    const inboxButtonStyle = {
      ...buttonBaseStyle,
      backgroundColor: '#000000',
      color: '#ffffff',
      '&:hover': {
        backgroundColor: '#333333'
      }
    };
    
    const skipButtonStyle = {
      ...buttonBaseStyle,
      backgroundColor: '#4b5563',
      color: '#ffffff',
      '&:hover': {
        backgroundColor: '#374151'
      }
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
    
    // Generate a search URL for Superhuman to find this email thread
    const getThreadUrl = () => {
      // If we have a thread_id, use that for precision
      if (latestEmail.thread_id) {
        return `https://mail.superhuman.com/thread/${latestEmail.thread_id}`;
      }
      
      // Otherwise, create a search based on the subject and contact name
      const searchTerms = [];
      
      // Add the subject (if it exists and isn't empty)
      if (latestEmail.subject && latestEmail.subject.trim() !== '' && latestEmail.subject.toLowerCase() !== 'no subject') {
        // Use the first few words of the subject to avoid overly specific searches
        const subjectWords = latestEmail.subject.split(' ').slice(0, 4).join(' ');
        searchTerms.push(encodeURIComponent(subjectWords));
      }
      
      // Add the contact name
      if (contact.first_name || contact.last_name) {
        searchTerms.push(encodeURIComponent(`${contact.first_name || ''} ${contact.last_name || ''}`));
      }
      
      // If no good search terms, fall back to email address
      if (searchTerms.length === 0 && contact.email) {
        searchTerms.push(encodeURIComponent(contact.email));
      }
      
      // Join terms with URL-encoded spaces
      return `https://mail.superhuman.com/search/${searchTerms.join('%20')}`;
    };

    return (
      <>
        <MessageCounter>
          Latest email ({totalRecords} total emails)
        </MessageCounter>
        
        <div style={{ overflowY: 'auto' }}>
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
          
          <div style={{
            minHeight: '120px',
            maxHeight: '180px',
            overflowY: 'auto',
            border: '1px solid #f0f0f0',
            borderRadius: '4px',
            backgroundColor: '#fafafa',
            margin: '10px 0',
            padding: '15px'
          }}>
            <div 
              style={{
                margin: 0,
                fontFamily: 'inherit',
                fontSize: '1rem',
                lineHeight: '1.7',
                color: '#1f2937',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                fontWeight: '400',
                letterSpacing: '0.01em'
              }}
              dangerouslySetInnerHTML={{ 
                __html: latestEmail.body_plain ? 
                  latestEmail.body_plain.replace(/\n/g, '<br>') : 
                  '(No content)' 
              }}
            />
          </div>
          
          <div style={buttonContainer}>
            <button
              onClick={() => window.open(getThreadUrl(), '_blank')}
              style={inboxButtonStyle}
              title="View in Superhuman"
            >
              Open in Superhuman
            </button>
            <button
              onClick={handleSkip}
              style={skipButtonStyle}
              title="Mark contact as Skip"
            >
              Skip Contact
            </button>
          </div>
        </div>
        </div>
      </>
    );
  };

  // Render WhatsApp chats (groups and individuals)
  const renderWhatsAppChatsTable = () => {
    if (loading) {
      return (
        <>
          <NoInteractions>Loading WhatsApp chats...</NoInteractions>
        </>
      );
    }
    
    if (!groupChats.length) {
      return (
        <>
          <NoInteractions>
            No WhatsApp chats found for this contact
            <div style={{ fontSize: '0.85em', marginTop: '16px', color: '#4b5563' }}>
              <p>This contact may not be a part of any WhatsApp groups or chats.</p>
              
              <button 
                type="button"
                onClick={() => {
                  console.log("Retry chats fetch button clicked");
                  fetchWhatsAppChats();
                }} 
                style={{ 
                  marginTop: '16px',
                  padding: '8px 16px', 
                  background: '#000000', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}
              >
                Retry Fetch
              </button>
            </div>
          </NoInteractions>
        </>
      );
    }
    
    // Pagination for chats list
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedChats = groupChats.slice(startIndex, endIndex);
    
    return (
      <>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
            WhatsApp Chats ({groupChats.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {paginatedChats.map((chat) => {
              // Determine if this is a group or individual chat
              const isGroup = chat.chat_type === 'group' || chat.is_group_chat;
              
              return (
                <div 
                  key={chat.id} 
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    padding: '16px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '10px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                        {chat.chat_name || (isGroup ? 'Group Chat' : 'Individual Chat')}
                      </h4>
                      
                      <Tag 
                        color={isGroup ? '#4b5563' : '#f3f4f6'}
                        textColor={isGroup ? '#ffffff' : '#111827'}
                      >
                        <span>{isGroup ? 'Group Chat' : 'Individual Chat'}</span>
                      </Tag>
                    </div>
                    
                    <div>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        color: '#6b7280' 
                      }}>
                        {chat.last_message_at 
                          ? formatDate(chat.last_message_at) 
                          : (chat.messages && chat.messages[0]?.created_at)
                            ? formatDate(chat.messages[0].created_at)
                            : formatDate(chat.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Show the last few messages if available */}
                  {chat.messages && chat.messages.length > 0 ? (
                    <div style={{ 
                      backgroundColor: '#f9fafb', 
                      borderRadius: '6px',
                      padding: '12px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid #f3f4f6'
                    }}>
                      {/* Display 3 most recent messages */}
                      {chat.messages.slice(0, 3).map((message, idx) => {
                        const isIncoming = 
                          message.direction?.toLowerCase() === 'inbound' || 
                          message.direction?.toLowerCase() === 'incoming' ||
                          message.direction?.toLowerCase() === 'received' || 
                          message.direction?.toLowerCase() === 'in';
                        
                        const direction = isIncoming ? 'Received' : 'Sent';
                        
                        return (
                          <div 
                            key={message.id || idx}
                            style={{
                              padding: '8px',
                              borderBottom: idx < 2 ? '1px solid #eaeaea' : 'none',
                              marginBottom: idx < 2 ? '8px' : 0
                            }}
                          >
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                              color: '#6b7280',
                              marginBottom: '4px'
                            }}>
                              <DirectionTag direction={direction}>
                                <span>{direction}</span>
                              </DirectionTag>
                              <span>{formatDate(message.created_at)}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>
                              {message.message && 
                                (message.message.length > 100 
                                  ? `${message.message.substring(0, 100)}...` 
                                  : message.message)
                              }
                            </div>
                          </div>
                        );
                      })}
                      
                      {chat.messages.length > 3 && (
                        <div style={{ 
                          textAlign: 'center', 
                          fontSize: '0.85rem', 
                          color: '#6b7280',
                          marginTop: '8px',
                          padding: '4px'
                        }}>
                          + {chat.messages.length - 3} more messages
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '16px', 
                      textAlign: 'center',
                      color: '#6b7280',
                      fontStyle: 'italic',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #f3f4f6'
                    }}>
                      No messages found for this chat
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Pagination controls */}
        {groupChats.length > ITEMS_PER_PAGE && (
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
        )}
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
          padding: '24px',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          maxWidth: '1250px',
          width: '90%',
          height: 'auto',       // Auto height instead of fixed
          maxHeight: '80vh',    // Maximum height as percentage of viewport
          backgroundColor: '#ffffff'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000
        }
      }}
    >
      <ModalContainer>
        <ModalHeader style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="header-left">
              <h2>Last Interactions</h2>
            </div>
            <div className="header-right">
              <button 
                onClick={() => setDebugMode(!debugMode)}
                style={{ 
                  padding: '4px 8px', 
                  background: debugMode ? '#ff5722' : '#4a90e2', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  marginRight: '10px'
                }}
              >
                {debugMode ? 'Hide Debug' : 'Debug Mode'}
              </button>
              <ActionButton 
                onClick={() => contact?.mobile && handleWhatsAppClick(contact.mobile)}
                aria-label="WhatsApp"
                title="Open WhatsApp"
                style={{ color: '#25D366' }} // Neon green for WhatsApp
              >
                <RiWhatsappFill size={24} />
              </ActionButton>
              <ActionButton 
                onClick={() => window.open(`https://mail.superhuman.com/search/${encodeURIComponent(contact?.first_name || '')}%20${encodeURIComponent(contact?.last_name || '')}`, '_blank')}
                aria-label="Email"
                title="Search in Superhuman"
                style={{ color: '#25D366' }} // Neon green for Email
              >
                <FiMail size={24} />
              </ActionButton>
              {contact?.linkedin_url ? (
                <ActionButton 
                  onClick={() => window.open(contact.linkedin_url, '_blank')}
                  aria-label="LinkedIn"
                  title="Open LinkedIn"
                >
                  <RiLinkedinBoxFill size={20} />
                </ActionButton>
              ) : contact?.full_name && (
                <ActionButton 
                  onClick={() => window.open(`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(contact.full_name || '')}`, '_blank')}
                  aria-label="LinkedIn Search"
                  title="Search on LinkedIn"
                >
                  <RiLinkedinBoxFill size={20} />
                </ActionButton>
              )}
              <button onClick={onRequestClose} aria-label="Close modal">
                <FiX size={20} />
              </button>
            </div>
          </div>
        </ModalHeader>

        {/* Debug Controls */}
        {debugMode && (
          <div style={{ 
            margin: '10px 0', 
            padding: '8px', 
            background: '#f0f0f0', 
            borderRadius: '4px', 
            border: '1px solid #ddd'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ marginRight: '10px' }}>Debug Filters:</strong>
              <select 
                value={debugFilter} 
                onChange={(e) => setDebugFilter(e.target.value)}
                style={{ padding: '4px', marginRight: '10px' }}
              >
                <option value="original">Original (Not Group)</option>
                <option value="or-null-nongroup">OR (Null OR Not Group)</option>
                <option value="null-only">Null chat_id Only</option>
                <option value="nongroup-only">Non-Group Only</option>
                <option value="all-messages">All Messages</option>
                <option value="last-4-digits">Last 4 Digits</option>
                <option value="table-scan">Recent Messages Scan</option>
                <option value="mobile-formats">Check Mobile Formats</option>
                <option value="direct-messages">Direct Messages Only</option>
                <option value="analyze-messages">Analyze All Messages</option>
              </select>
              <button 
                onClick={testDebugFilter}
                style={{ padding: '4px 8px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Test Filter
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#555' }}>
              <div>Current filter: <code>{debugFilter}</code></div>
              <div>Results: {interactions?.length || 0} messages</div>
              {debugFilter === 'mobile-formats' && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={async () => {
                      console.log('Applying format fix to main query');
                      
                      // Get the contact's mobile numbers
                      const mobile1 = contact?.mobile;
                      const mobile2 = contact?.mobile2;
                      
                      // Check for mobile number format matches
                      let formatMatches = [];
                      if (mobile1) {
                        formatMatches = await checkMobileFormats(mobile1);
                      }
                      if (formatMatches.length === 0 && mobile2) {
                        formatMatches = await checkMobileFormats(mobile2);
                      }
                      
                      if (formatMatches.length > 0) {
                        // We found a format match, use it for the main query
                        const bestMatch = formatMatches.find(m => m.type === 'exact-match') || formatMatches[0];
                        console.log('Using best match format:', bestMatch);
                        
                        // Get example mobile formats from the database
                        if (bestMatch.examples && bestMatch.examples.length > 0) {
                          // Store the information in a session/debug variable
                          window.whatsAppFormats = {
                            originalMobile: mobile1 || mobile2,
                            foundFormat: bestMatch.examples[0],
                            matchType: bestMatch.type,
                            variant: bestMatch.variant
                          };
                          alert('Successfully identified number format. Check console for details.');
                        } else {
                          alert('Found match but no examples to use. Check console for details.');
                        }
                      } else {
                        alert('Could not identify matching mobile format. See console logs.');
                      }
                    }}
                    style={{ 
                      backgroundColor: '#4CAF50', 
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Apply Format Fix
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
          {(contact.mobile || contact.mobile2) && (
            <TabButton
              active={activeTab === 'WhatsappChat'}
              onClick={() => {
                setActiveTab('WhatsappChat');
                setCurrentPage(1);
              }}
            >
              WhatsApp Group Chat
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
            Meetings
          </TabButton>
          <TabButton
            active={activeTab === 'Snooze'}
            onClick={() => {
              setActiveTab('Snooze');
            }}
          >
            Snooze
          </TabButton>
        </TabContainer>

        <ContentSection>
          {/* Render content based on active tab */}
          {activeTab === 'Whatsapp' ? (
            renderWhatsAppTable()
          ) : activeTab === 'WhatsappChat' ? (
            renderWhatsAppChatsTable()
          ) : activeTab === 'Email' ? (
            renderEmailsTable()
          ) : activeTab === 'Meeting' ? (
            renderMeetingsTable()
          ) : activeTab === 'Snooze' ? (
            renderSnoozeTab()
          ) : (
            <TabContent>{renderGenericInteractions()}</TabContent>
          )}
        </ContentSection>
      </ModalContainer>
    </Modal>
  );
  // Add snooze tab rendering function
  const renderSnoozeTab = () => {
    if (loading) {
      return <NoInteractions>Processing...</NoInteractions>;
    }
    
    if (snoozeSuccess) {
      return (
        <NoInteractions>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>✅</div>
          Contact snoozed successfully!
          <div style={{ marginTop: '16px', fontSize: '0.875rem', color: '#4b5563' }}>
            This modal will close automatically.
          </div>
        </NoInteractions>
      );
    }
    
    return (
      <SnoozeContainer>
        <SnoozeTitle>Snooze this contact</SnoozeTitle>
        <p style={{ margin: '0 0 24px 0', color: '#4b5563' }}>
          Postpone the next due date for this contact by selecting one of the options below:
        </p>
        
        <SnoozeOptionsGrid>
          <SnoozeButton onClick={() => snoozeContact(10)}>
            <div className="button-icon"><FiClock /></div>
            <div className="button-text">10 Days</div>
            <div className="button-subtext">Snooze for 10 days</div>
          </SnoozeButton>
          
          <SnoozeButton onClick={() => snoozeContact(30)}>
            <div className="button-icon"><FiClock /></div>
            <div className="button-text">30 Days</div>
            <div className="button-subtext">Snooze for 30 days</div>
          </SnoozeButton>
          
          <SnoozeButton onClick={() => snoozeContact(100)}>
            <div className="button-icon"><FiClock /></div>
            <div className="button-text">100 Days</div>
            <div className="button-subtext">Snooze for 100 days</div>
          </SnoozeButton>
        </SnoozeOptionsGrid>
        
        {/* Show current due date info */}
        <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: '500', marginBottom: '8px' }}>Current information:</div>
          <div>Last interaction: {contact.last_interaction ? new Date(contact.last_interaction).toLocaleDateString() : 'None'}</div>
          <div>Keep in touch frequency: {contact.keep_in_touch_frequency || 'Not set'}</div>
        </div>
      </SnoozeContainer>
    );
  };

  // Function to handle snoozing a contact's next due date
  const snoozeContact = async (days) => {
    try {
      setLoading(true);
      
      // Make sure we have a contact
      if (!contact || !contact.id) {
        console.error('No contact data available');
        return;
      }
      
      // Calculate the new due date by adding days to the current date
      const today = new Date();
      const newDueDate = addDays(today, days);
      
      // Format for database
      const formattedDate = newDueDate.toISOString();
      
      // Update last_interaction to the new date
      const { error } = await supabase
        .from('contacts')
        .update({ last_interaction: formattedDate })
        .eq('id', contact.id);
      
      if (error) {
        console.error('Error updating contact:', error);
        alert('Failed to snooze contact');
        setLoading(false);
        return;
      }
      
      // Show success message
      setSnoozeSuccess(true);
      
      // Reset after a delay
      setTimeout(() => {
        setSnoozeSuccess(false);
        onRequestClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error in snoozeContact:', err);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };
};

export default LastInteractionModal;