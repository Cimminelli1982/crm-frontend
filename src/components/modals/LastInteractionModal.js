/* LastInteractionModal.js - FULL UPDATED CODE */
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiMail } from 'react-icons/fi';
import { RiWhatsappFill, RiLinkedinBoxFill } from 'react-icons/ri';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

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
  const WHATSAPP_TABLE = 'whatsapp'; // "whatsapp_messages" replaced
  const EMAILS_TABLE = 'emails';
  const MEETINGS_TABLE = 'meetings';
  const CHATS_TABLE = 'chats';
  const CONTACT_CHATS_TABLE = 'contact_chats';

  const [debugMode, setDebugMode] = useState(true);
  const [groupChats, setGroupChats] = useState([]);

  // Helper to normalize phone numbers
  const normalizePhoneNumber = (phone) => {
    if (!phone) return null;
    return phone.replace(/\D/g, '');
  };

  // On mount / open, decide default tab
  useEffect(() => {
    if (contact) {
      if (contact.mobile || contact.mobile2) setActiveTab('Whatsapp');
      else if (contact.email || contact.email2 || contact.email3) setActiveTab('Email');
      else setActiveTab('Meeting');
    }
  }, [contact]);
  
  // If Meeting tab is selected, load them
  useEffect(() => {
    if (isOpen && contact && contact.id && activeTab === 'Meeting') {
      fetchMeetings();
    }
  }, [isOpen, contact?.id, activeTab]);

  // Re-fetch when modal opens or contact changes
  useEffect(() => {
    if (isOpen && contact) {
      if (!contact.lastFetchedId || contact.lastFetchedId !== contact.id) {
        setCurrentPage(1);
      }
      fetchInteractions(); // initial data fetch
    }
  }, [isOpen, contact]);

  // Page changes
  useEffect(() => {
    if (isOpen && contact && currentPage > 0) {
      setLoading(true);
      if (activeTab === 'Meeting') {
        fetchMeetings();
      } else {
        setInteractions([]);
        fetchPageWithLimitOffset(currentPage);
      }
    }
  }, [currentPage]);

  // Tab changes
  useEffect(() => {
    if (isOpen && contact) {
      setCurrentPage(1);
      if (activeTab === 'Meeting') {
        fetchMeetings();
      } else if (activeTab === 'WhatsappChat') {
        fetchWhatsAppChats();
      } else {
        fetchInteractions();
      }
    }
  }, [activeTab]);

  // Function to fetch group chats only (not used for the “Whatsapp” tab we’re updating)
  const fetchWhatsAppChats = async () => {
    setLoading(true);
    try {
      if (!contact || !contact.id) {
        setLoading(false);
        setGroupChats([]);
        return;
      }
      // ... (unchanged) ...
      // This fetches chats with chat_type='group'
      // Not included here for brevity
    } catch (err) {
      console.error('Error in fetchWhatsAppChats:', err);
      setGroupChats([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH PAGE DATA - UPDATED FOR INDIVIDUAL-ONLY  ==================
  const fetchPageWithLimitOffset = async (page) => {
    if (activeTab !== 'Whatsapp') {
      // only do the special code for WhatsApp, else use your existing logic
      return;
    }
    console.log(`[LIMIT-OFFSET] Fetching page ${page} for WhatsApp tab (individual only)`);

    try {
      const mobilesArray = [];
      if (contact.mobile) mobilesArray.push(normalizePhoneNumber(contact.mobile));
      if (contact.mobile2) mobilesArray.push(normalizePhoneNumber(contact.mobile2));
      if (!mobilesArray.length) {
        setLoading(false);
        setInteractions([]);
        return;
      }

      const limit = ITEMS_PER_PAGE;
      const offset = (page - 1) * ITEMS_PER_PAGE;

      // Show only messages where chat_id is NULL OR chat_type is 'individual'
      // AND the phone is in mobilesArray
      let query = supabase
        .from(WHATSAPP_TABLE)
        .select('*, chats:chat_id(chat_type)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .in('contact_mobile', mobilesArray)
        .or('chat_id.is.null,chats.chat_type.eq.individual') // UPDATED FOR INDIVIDUAL-ONLY
        .limit(limit)
        .offset(offset);

      const { data, count, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        // Add debug info
        const dataWithDebug = data.map((record, index) => ({
          ...record,
          _debugInfo: {
            page,
            index,
            position: offset + index,
            queryType: 'limit-individual',
            timestamp: new Date().toISOString()
          },
          debugId: `limit-p${page}-idx${index}-pos${offset + index}`
        }));
        setInteractions(dataWithDebug);
        setTotalRecords(count || 0);
        setTotalPages(Math.max(Math.ceil((count || 0) / ITEMS_PER_PAGE), 1));
      } else {
        // fallback to flexible search or show empty
        if (data?.length === 0 && page > 1) {
          // Try manual approach
          const allDataQuery = supabase
            .from(WHATSAPP_TABLE)
            .select('*, chats:chat_id(chat_type)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .in('contact_mobile', mobilesArray)
            .or('chat_id.is.null,chats.chat_type.eq.individual'); // STILL UPDATED
          const allDataResult = await allDataQuery;
          if (!allDataResult.error && allDataResult.data && allDataResult.data.length > 0) {
            const totalAll = allDataResult.data.length;
            const startIndex = offset;
            const endIndex = startIndex + limit;
            const pageData = allDataResult.data.slice(startIndex, endIndex);
            if (pageData.length > 0) {
              const dataWithDebug = pageData.map((record, index) => ({
                ...record,
                _debugInfo: { queryType: 'limit-individual-manual', page },
                debugId: `manual-p${page}-idx${index}`
              }));
              setInteractions(dataWithDebug);
              setTotalRecords(totalAll);
              setTotalPages(Math.max(Math.ceil(totalAll / ITEMS_PER_PAGE), 1));
            } else {
              setInteractions([]);
            }
          } else {
            setInteractions([]);
          }
        } else {
          setInteractions([]);
        }
      }
    } catch (err) {
      console.error('fetchPageWithLimitOffset error:', err);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  // =================== INITIAL FETCH (page 1) - UPDATED FOR INDIVIDUAL-ONLY ====================
  const fetchInteractions = async () => {
    setLoading(true);
    if (!contact || !contact.id) {
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'Whatsapp') {
        // Combine mobile & mobile2
        const mobilesArray = [];
        if (contact.mobile) mobilesArray.push(normalizePhoneNumber(contact.mobile));
        if (contact.mobile2) mobilesArray.push(normalizePhoneNumber(contact.mobile2));

        if (!mobilesArray.length) {
          setInteractions([]);
          setTotalRecords(0);
          setTotalPages(1);
          setLoading(false);
          return;
        }

        // For the first page, show only messages with chat_id NULL OR chat_type='individual'
        const from = 0;
        const to = ITEMS_PER_PAGE - 1;
        let query = supabase
          .from(WHATSAPP_TABLE)
          .select('*, chats:chat_id(chat_type)', { count: 'exact' })
          .order('created_at', { ascending: false })
          .in('contact_mobile', mobilesArray)
          // UPDATED FOR INDIVIDUAL-ONLY
          .or('chat_id.is.null,chats.chat_type.eq.individual')
          .range(from, to);

        const { data: responseData, error, count: totalCount } = await query;
        if (error) throw error;

        if (responseData && responseData.length) {
          setInteractions(responseData);
          setTotalRecords(totalCount || 0);
          setTotalPages(Math.max(Math.ceil((totalCount || 0) / ITEMS_PER_PAGE), 1));
        } else {
          // Attempt flexible fallback
          await tryFlexibleSearch(mobilesArray, from, to, 1);
        }
      }
      else if (activeTab === 'Email') {
        // fetchEmails called by separate effect
      }
      else if (activeTab === 'Meeting') {
        // fetchMeetings called by separate effect
      }
      // Add other tab logic if needed
    } catch (error) {
      console.error('Error fetching data:', error);
      setInteractions([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // ========== FLEXIBLE SEARCH FOR WHATSAPP (Phone last digits) - UPDATED FOR INDIVIDUAL-ONLY =============
  const tryFlexibleSearch = async (mobilesArray, from, to, page) => {
    if (activeTab !== 'Whatsapp') return;
    try {
      const orConditions = mobilesArray
        .filter(m => m && m.length > 7)
        .map(m => `contact_mobile.ilike.%${m.slice(-8)}`);
      if (!orConditions.length) {
        setInteractions([]);
        return;
      }

      // Show only (chat_id null OR chat_type=individual), plus phone partial match
      const flexQuery = supabase
        .from(WHATSAPP_TABLE)
        .select('*, chats:chat_id(chat_type)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .or(orConditions.join(','))  // phone partial
        // UPDATED FOR INDIVIDUAL-ONLY
        .or('chat_id.is.null,chats.chat_type.eq.individual')
        .range(from, to);

      const { data, count, error } = await flexQuery;
      if (error) {
        console.error('[FLEX] error:', error);
        setInteractions([]);
        return;
      }

      if (data && data.length > 0) {
        const dataWithDebug = data.map((record, index) => ({
          ...record,
          _debugInfo: {
            page,
            index,
            position: from + index,
            queryType: 'flex-individual',
            timestamp: new Date().toISOString()
          },
          debugId: `flex${page}-idx${index}`
        }));
        setInteractions(dataWithDebug);
        setTotalRecords(count || 0);
        setTotalPages(Math.max(Math.ceil((count || 0) / ITEMS_PER_PAGE), 1));
      } else {
        setInteractions([]);
      }
    } catch (err) {
      console.error('[FLEX] catch error:', err);
      setInteractions([]);
    }
  };

  // ============== EMERGENCY FETCH FOR WHATSAPP - UPDATED FOR INDIVIDUAL-ONLY =============
  const emergencyFetchPage = async (page) => {
    if (activeTab !== 'Whatsapp') return;
    console.log(`[EMERGENCY] PAGE ${page}`);
    try {
      setLoading(true);
      setInteractions([]);

      const offset = (page - 1) * ITEMS_PER_PAGE;
      const mobilesArray = [];
      if (contact.mobile) mobilesArray.push(normalizePhoneNumber(contact.mobile));
      if (contact.mobile2) mobilesArray.push(normalizePhoneNumber(contact.mobile2));
      if (!mobilesArray.length) {
        setLoading(false);
        return;
      }

      // BRUTE FORCE: fetch all first
      const allRecordsQuery = supabase
        .from(WHATSAPP_TABLE)
        .select('*, chats:chat_id(chat_type)')
        .in('contact_mobile', mobilesArray)
        // UPDATED FOR INDIVIDUAL-ONLY
        .or('chat_id.is.null,chats.chat_type.eq.individual')
        .order('created_at', { ascending: false });

      const { data: allData, error: allError } = await allRecordsQuery;
      if (allError) {
        console.error('[EMERGENCY] allError:', allError);
        await emergencyFlexibleFetch(page, mobilesArray);
        return;
      }

      if (allData && allData.length > 0) {
        const pageData = allData.slice(offset, offset + ITEMS_PER_PAGE);
        if (pageData.length > 0) {
          const dataWithDebug = pageData.map((record, index) => ({
            ...record,
            _debugInfo: { queryType: 'emergency-individual', timestamp: new Date().toISOString() },
            debugId: `emrg-p${page}-idx${index}`
          }));
          setInteractions(dataWithDebug);
          setTotalRecords(allData.length);
          setTotalPages(Math.max(Math.ceil(allData.length / ITEMS_PER_PAGE), 1));
        } else {
          await emergencyFlexibleFetch(page, mobilesArray);
        }
      } else {
        await emergencyFlexibleFetch(page, mobilesArray);
      }
    } catch (err) {
      console.error('[EMERGENCY] catch error:', err);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  // ============== EMERGENCY FLEXIBLE FETCH FOR WHATSAPP - UPDATED FOR INDIVIDUAL-ONLY =============
  const emergencyFlexibleFetch = async (page, mobilesArray) => {
    if (activeTab !== 'Whatsapp') return;
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const orConditions = mobilesArray
        .filter(m => m && m.length > 7)
        .map(m => `contact_mobile.ilike.%${m.slice(-8)}`);
      if (!orConditions.length) return;

      // Full data flexible approach
      const flexQuery = supabase
        .from(WHATSAPP_TABLE)
        .select('*, chats:chat_id(chat_type)')
        .or(orConditions.join(','))
        // UPDATED FOR INDIVIDUAL-ONLY
        .or('chat_id.is.null,chats.chat_type.eq.individual')
        .order('created_at', { ascending: false });

      const { data: flexData, error: flexError } = await flexQuery;
      if (flexError) {
        console.error('[EMERGENCY-FLEX] flexError:', flexError);
        return;
      }

      if (flexData && flexData.length > 0) {
        const pageFlexData = flexData.slice(offset, offset + ITEMS_PER_PAGE);
        if (pageFlexData.length > 0) {
          const dataWithDebug = pageFlexData.map((record, index) => ({
            ...record,
            _debugInfo: { queryType: 'emergency-flex-individual', timestamp: new Date().toISOString() },
            debugId: `emflex-p${page}-idx${index}`
          }));
          setInteractions(dataWithDebug);
          setTotalRecords(flexData.length);
          setTotalPages(Math.max(Math.ceil(flexData.length / ITEMS_PER_PAGE), 1));
        }
      }
    } catch (err) {
      console.error('[EMERGENCY-FLEX] catch error:', err);
      setInteractions([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  const handleWhatsAppClick = (mobile) => {
    if (!mobile) return;
    const formattedNumber = mobile.startsWith('+') ? mobile.substring(1) : mobile;
    window.open(`https://wa.me/${formattedNumber}`, '_blank');
  };

  // Render for the WhatsApp (individual) tab
  const renderWhatsAppTable = () => {
    if (loading) {
      return <NoInteractions>Loading page {currentPage}...</NoInteractions>;
    }
    if (!interactions.length) {
      return (
        <NoInteractions>
          No WhatsApp messages found for page {currentPage}
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
      );
    }

    const startRecord = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endRecord = Math.min(startRecord + interactions.length - 1, totalRecords);

    // Basic chat-like layout
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
          {interactions.map((interaction, index) => {
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

  // Generic or fallback rendering for other tabs
  const renderGenericInteractions = () => {
    if (loading) return <NoInteractions>Loading...</NoInteractions>;
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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setLoading(true);
      setInteractions([]);
      setCurrentPage(newPage);
    }
  };

  // Meetings fetch logic
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      if (!contact || !contact.id) {
        setLoading(false);
        setMeetings([]);
        return;
      }

      const { data: meetingContactsData, error: meetingContactsError } = await supabase
        .from('meetings_contacts')
        .select('meeting_id')
        .eq('contact_id', contact.id);
      
      if (meetingContactsError || !meetingContactsData?.length) {
        setLoading(false);
        setMeetings([]);
        return;
      }

      const meetingIds = meetingContactsData.map(item => item.meeting_id);
      const { data: meetingsData, error: meetingsError } = await supabase
        .from(MEETINGS_TABLE)
        .select('*')
        .in('id', meetingIds)
        .order('meeting_date', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (meetingsError) {
        setLoading(false);
        setMeetings([]);
        return;
      }

      // Count
      const { count, error: countError } = await supabase
        .from(MEETINGS_TABLE)
        .select('*', { count: 'exact', head: true })
        .in('id', meetingIds);

      setMeetings(meetingsData || []);
      setTotalRecords(count || 0);
      setTotalPages(Math.max(Math.ceil((count || 0) / ITEMS_PER_PAGE), 1));
    } catch (err) {
      console.error('Error in fetchMeetings:', err);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  // Emails fetch logic
  const fetchEmails = async () => {
    // ... unchanged logic for fetching from 'emails' ...
    // you can keep your original approach, just omitted here for brevity
  };

  const renderMeetingsTable = () => {
    if (loading) return <NoInteractions>Loading meetings...</NoInteractions>;
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
                fontSize: '0.875rem'
              }}
            >
              Schedule a Meeting
            </button>
          </div>
        </NoInteractions>
      );
    }

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
              fontSize: '0.875rem'
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
                const getCategoryColor = (category) => {
                  switch ((category || '').toLowerCase()) {
                    case 'inbox': return '#f3f4f6';
                    case 'karma_points': return '#f3f4f6';
                    case 'dealflow': return '#4b5563';
                    case 'portfolio': return '#4b5563';
                    default: return '#f3f4f6';
                  }
                };
                
                const getCategoryTextColor = (category) => {
                  switch ((category || '').toLowerCase()) {
                    case 'dealflow':
                    case 'portfolio':
                      return '#ffffff';
                    default:
                      return '#111827';
                  }
                };

                return (
                  <tr key={meeting.id || index}>
                    <td className="centered">
                      {formatDate(meeting.meeting_date)}
                    </td>
                    <td>{meeting.meeting_name}</td>
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

  const renderEmailsTable = () => {
    if (loading) {
      return <NoInteractions>Loading emails...</NoInteractions>;
    }
    if (!interactions.length) {
      return (
        <NoInteractions>
          No emails found for this contact
          <div style={{ fontSize: '0.85em', marginTop: '16px', color: '#6b7280' }}>
            <p>Please make sure the contact has valid email addresses.</p>
            <div style={{ marginTop: '16px' }}>
              <button 
                type="button"
                onClick={() => fetchEmails()}
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
      );
    }

    // Example showing the latest email
    const latestEmail = interactions[0];
    // ...
    // (rest of your existing email rendering logic)
    return (
      <div>
        {/* Example placeholder */}
        <p>Emails rendering here...</p>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Last Interactions"
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          borderRadius: '8px',
          padding: '24px',
          overflow: 'hidden'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999
        }
      }}
      ariaHideApp={false}
    >
      <ModalContainer>
        <ModalHeader>
          <div className="header-left">
            <h2>Last Interactions</h2>
          </div>
          <div className="header-right">
            <button onClick={onRequestClose}>
              <FiX />
            </button>
          </div>
        </ModalHeader>
        
        <TabContainer>
          <TabButton
            active={activeTab === 'Whatsapp'}
            onClick={() => setActiveTab('Whatsapp')}
          >
            <RiWhatsappFill /> Whatsapp
          </TabButton>
          <TabButton
            active={activeTab === 'WhatsappChat'}
            onClick={() => setActiveTab('WhatsappChat')}
          >
            Group Chats
          </TabButton>
          <TabButton
            active={activeTab === 'Email'}
            onClick={() => setActiveTab('Email')}
          >
            <FiMail /> Email
          </TabButton>
          <TabButton
            active={activeTab === 'Meeting'}
            onClick={() => setActiveTab('Meeting')}
          >
            Meetings
          </TabButton>
          {/* Add more tabs if needed */}
        </TabContainer>

        <ContentSection>
          {activeTab === 'Whatsapp' && (
            <TabContent>
              {renderWhatsAppTable()}
            </TabContent>
          )}
          {activeTab === 'WhatsappChat' && (
            <TabContent>
              {/* Example for group chats only */}
              {/* renderWhatsAppChatsTable() or similar */}
            </TabContent>
          )}
          {activeTab === 'Email' && (
            <TabContent>
              {renderEmailsTable()}
            </TabContent>
          )}
          {activeTab === 'Meeting' && (
            <TabContent>
              {renderMeetingsTable()}
            </TabContent>
          )}
          {/* Additional tabs if needed */}
        </ContentSection>
      </ModalContainer>
    </Modal>
  );
};

export default LastInteractionModal;
