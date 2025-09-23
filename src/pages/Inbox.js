import React, { useState, lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiMail, FiUsers, FiClock, FiCopy, FiSkipForward, FiPhone, FiActivity } from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';

// Lazy load the inbox components
const WhatsappInbox = lazy(() => import('./contacts/WhatsappInbox'));
const EmailInbox = lazy(() => import('./contacts/EmailInbox'));
const ContactsInbox = lazy(() => import('./contacts/ContactsInbox'));
const KeepInTouchInbox = lazy(() => import('./contacts/KeepInTouchInbox'));
const SkipInbox = lazy(() => import('./contacts/SkipInbox'));
const DuplicateManager = lazy(() => import('./contacts/DuplicateManager'));
const RecentInbox = lazy(() => import('./contacts/RecentInbox'));

// Style for the main content
const Container = styled.div`
  padding: 0;
  margin: 0;
  margin-top: -1px; /* Pull content to the very top */
  height: 100%;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
  position: relative;
`;

// Style for the top menu
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

// Style for the inbox content
const InboxContent = styled.div`
  padding: 0px 0px 0px 0px;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
`;

// Style for the menu items
const MenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 20px;
  color: ${props => props.$active ? '#00ff00' : '#ccc'};
  text-decoration: none;
  border-bottom: 3px solid ${props => props.$active ? '#00ff00' : 'transparent'};
  margin-right: 20px;
  font-family: 'Courier New', monospace;
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: pointer;
  font-size: 1rem;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  background-color: ${props => props.$active ? 'rgba(0, 255, 0, 0.05)' : 'transparent'};
  border-radius: 4px 4px 0 0;
  
  &:hover {
    color: #00ff00;
    background-color: rgba(0, 255, 0, 0.05);
  }
  
  &:first-child {
    margin-left: 10px;
  }
  
  svg {
    margin-right: 10px;
    font-size: 1.1rem;
  }
`;

// Style for the content area
const ContentArea = styled.div`
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
`;

// Loading indicator
const LoadingFallback = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #00ff00;
  font-family: 'Courier New', monospace;
`;

// Count badge for menu items
const CountBadge = styled.span`
  background-color: #00ff00;
  color: #000;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 0.75rem;
  margin-left: 8px;
  min-width: 20px;
  text-align: center;
  font-weight: bold;
`;

const Inbox = () => {
  // Check for URL parameters and stored workflow contact
  const urlParams = new URLSearchParams(window.location.search);
  const sourceTab = urlParams.get('source');
  const navigate = useNavigate();

  // Check session storage for workflow contact
  const workflowContactId = sessionStorage.getItem('workflow_contact_id');

  // Set initial active tab based on source parameter - default to 'recent'
  const [activeTab, setActiveTab] = useState(sourceTab === 'category' ? 'category' : 'recent');

  // State for record counts
  const [counts, setCounts] = useState({
    email: 0,
    category: 0,
    kit: 0
  });
  
  // If we have a workflow contact, immediately redirect to workflow page
  useEffect(() => {
    if (workflowContactId) {
      // Clear the session storage first
      sessionStorage.removeItem('workflow_contact_id');
      // Redirect to workflow page
      navigate(`/contacts/workflow/${workflowContactId}`);
    }
  }, [workflowContactId, navigate]);

  // Fetch counts for menu items
  const fetchCounts = async () => {
    try {
      // Email count - emails with special_case = 'pending_approval'
      const { count: emailCount } = await supabase
        .from('email_inbox')
        .select('*', { count: 'exact', head: true })
        .eq('special_case', 'pending_approval');

      // Category count - contacts with category = 'Inbox' and last_interaction_at after June 25, 2025
      const cutoffDate = new Date('2025-06-25');
      const formattedDate = cutoffDate.toISOString();

      const { count: categoryCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'Inbox')
        .gte('last_interaction_at', formattedDate);

      // Keep in Touch count - contacts with specific categories and keep_in_touch_frequency "Not Set" or NULL
      const allowedCategories = [
        'Professional Investor',
        'Team',
        'Advisor',
        'Supplier',
        'Founder',
        'Manager',
        'Institution',
        'Media',
        'Friend and Family'
      ];

      const { count: kitCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .in('category', allowedCategories)
        .or('keep_in_touch_frequency.is.null,keep_in_touch_frequency.eq.Not Set')
        .not('last_interaction_at', 'is', null);

      setCounts({
        email: emailCount || 0,
        category: categoryCount || 0,
        kit: kitCount || 0
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  // Fetch counts on component mount
  useEffect(() => {
    fetchCounts();
  }, []);

  // Refresh counts when activeTab changes (when user switches tabs)
  useEffect(() => {
    // Small delay to ensure any actions complete before refreshing counts
    const timer = setTimeout(() => {
      fetchCounts();
    }, 500);

    return () => clearTimeout(timer);
  }, [activeTab]);

  // Listen for custom events from child components to refresh counts
  useEffect(() => {
    const handleRefreshCounts = () => {
      // Small delay to ensure database changes are committed
      setTimeout(() => {
        fetchCounts();
      }, 500);
    };

    window.addEventListener('refreshInboxCounts', handleRefreshCounts);

    return () => {
      window.removeEventListener('refreshInboxCounts', handleRefreshCounts);
    };
  }, []);

  // Define menu items - reordered with Recent first, removed WhatsApp and Duplicates
  const menuItems = [
    { id: 'recent', name: 'Recent', icon: <FiActivity /> },
    { id: 'email', name: 'Email', icon: <FiMail />, count: counts.email },
    { id: 'category', name: 'Categories', icon: <FiUsers />, count: counts.category },
    { id: 'kit', name: 'Keep in Touch', icon: <FiClock />, count: counts.kit },
    { id: 'skip', name: 'Skip', icon: <FiSkipForward /> }
  ];

  // Render the active component based on the selected tab
  const renderContent = () => {
    switch (activeTab) {
      case 'whatsapp':
        return <WhatsappInbox />;
      case 'email':
        return <EmailInbox />;
      case 'recent':
        return <RecentInbox />;
      case 'category':
        return <ContactsInbox />;
      case 'kit':
        return <KeepInTouchInbox />;
      case 'skip':
        return <SkipInbox />;
      case 'duplicates':
        return <DuplicateManager />;
      default:
        return (
          <div style={{ color: '#00ff00', textAlign: 'center', paddingTop: '40px' }}>
            Select an inbox type from the menu above
          </div>
        );
    }
  };

  return (
    <Container>
      <TopMenuContainer>
        {menuItems.map(item => (
          <MenuItem
            key={item.id}
            $active={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon} {item.name}
            {item.count !== undefined && item.count > 0 && (
              <CountBadge>{item.count}</CountBadge>
            )}
          </MenuItem>
        ))}
      </TopMenuContainer>
      
      <InboxContent>
        <ContentArea>
          <Suspense fallback={<LoadingFallback>Loading...</LoadingFallback>}>
            {renderContent()}
          </Suspense>
        </ContentArea>
      </InboxContent>
    </Container>
  );
};

export default Inbox;