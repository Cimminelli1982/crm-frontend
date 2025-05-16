import React, { useState, lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiMail, FiUsers, FiClock, FiCopy, FiSkipForward, FiPhone } from 'react-icons/fi';

// Lazy load the inbox components
const WhatsappInbox = lazy(() => import('./contacts/WhatsappInbox'));
const EmailInbox = lazy(() => import('./contacts/EmailInbox'));
const ContactsInbox = lazy(() => import('./contacts/ContactsInbox'));
const KeepInTouchInbox = lazy(() => import('./contacts/KeepInTouchInbox'));
const SkipInbox = lazy(() => import('./contacts/SkipInbox'));
const DuplicateManager = lazy(() => import('./contacts/DuplicateManager'));

// Style for the main content
const Container = styled.div`
  padding: 0;
  margin-top: 5px; /* Add margin at the top to avoid browser search bar */
  height: 100%;
  width: 100%;
  overflow-x: hidden; /* Prevent horizontal scrolling */
  background-color: #121212;
`;

// Style for the top menu
const TopMenuContainer = styled.div`
  display: flex;
  background-color: #111;
  border-bottom: 1px solid #333;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #00ff00 #222;
  padding: 0;
  margin-bottom: 0;
  margin-top: 5px;
  position: sticky;
  top: 40px; /* Place it below the browser's search bar */
  z-index: 100;
  border-top: 1px solid #333;
  border-radius: 4px 4px 0 0;
  
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
  padding: 0 3px;
  background-color: #121212;
  width: 100%;
  margin-top: 5px;
`;

// Style for the menu items
const MenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: ${props => props.$active ? '#00ff00' : '#ccc'};
  text-decoration: none;
  border-bottom: 2px solid ${props => props.$active ? '#00ff00' : 'transparent'};
  margin-right: 15px;
  font-family: 'Courier New', monospace;
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  
  &:hover {
    color: #00ff00;
    background-color: rgba(0, 255, 0, 0.05);
  }
  
  &:first-child {
    margin-left: 15px;
  }
  
  svg {
    margin-right: 8px;
    font-size: 1rem;
  }
`;

// Style for the title
const Title = styled.h1`
  color: #00ff00;
  margin-bottom: 30px;
  font-family: 'Courier New', monospace;
`;

// Style for the content area
const ContentArea = styled.div`
  width: 100%;
  background-color: #121212;
`;

// Loading indicator
const LoadingFallback = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  margin-top: 20px;
  background-color: #121212;
  border-radius: 4px;
`;

const Inbox = () => {
  // Check for URL parameters and stored workflow contact
  const urlParams = new URLSearchParams(window.location.search);
  const sourceTab = urlParams.get('source');
  const navigate = useNavigate();
  
  // Check session storage for workflow contact
  const workflowContactId = sessionStorage.getItem('workflow_contact_id');
  
  // Set initial active tab based on source parameter
  const [activeTab, setActiveTab] = useState(sourceTab === 'category' ? 'category' : 'whatsapp');
  
  // If we have a workflow contact, immediately redirect to workflow page
  useEffect(() => {
    if (workflowContactId) {
      // Clear the session storage first
      sessionStorage.removeItem('workflow_contact_id');
      // Redirect to workflow page
      navigate(`/contacts/workflow/${workflowContactId}`);
    }
  }, [workflowContactId, navigate]);

  // Define menu items
  const menuItems = [
    { id: 'whatsapp', name: 'WhatsApp', icon: <FiPhone /> },
    { id: 'email', name: 'Email', icon: <FiMail /> },
    { id: 'category', name: 'Categories', icon: <FiUsers /> },
    { id: 'kit', name: 'Keep in Touch', icon: <FiClock /> },
    { id: 'skip', name: 'Skip', icon: <FiSkipForward /> },
    { id: 'duplicates', name: 'Duplicates', icon: <FiCopy /> }
  ];

  // Render the active component based on the selected tab
  const renderContent = () => {
    switch (activeTab) {
      case 'whatsapp':
        return <WhatsappInbox />;
      case 'email':
        return <EmailInbox />;
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