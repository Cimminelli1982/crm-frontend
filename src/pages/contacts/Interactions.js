import React, { useState, lazy, Suspense } from 'react';
import styled from 'styled-components';
import { FiClock, FiUserCheck, FiUsers } from 'react-icons/fi';

// Lazy load the components
const RecentInteractions = lazy(() => import('./SimpleContacts')); // This is the existing page for recent interactions
const KeepInTouch = lazy(() => import('./SimpleKeepInTouch')); // This is the existing keep in touch page
const IntroductionsComponent = lazy(() => import('./Introductions')); // This is the existing introductions page

// Style for the main content
const Container = styled.div`
  padding: 0;
  margin-top: -45px; /* Move content up to make room for the menu */
  height: 100%;
  width: 100%;
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
  position: sticky;
  top: 0;
  z-index: 100;
  
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

// Style for the content
const InteractionsContent = styled.div`
  padding: 0;
  width: 100%;
`;

// Style for the menu items
const MenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 20px;
  color: ${props => props.$active ? '#00ff00' : '#ccc'};
  text-decoration: none;
  border-bottom: 2px solid ${props => props.$active ? '#00ff00' : 'transparent'};
  margin-right: 20px;
  font-family: 'Courier New', monospace;
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: pointer;
  font-size: 0.95rem;
  
  &:hover {
    color: #00ff00;
    background-color: rgba(0, 255, 0, 0.05);
  }
  
  &:first-child {
    margin-left: 10px;
  }
  
  svg {
    margin-right: 8px;
  }
`;

// Style for the content area
const ContentArea = styled.div`
  width: 100%;
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

const Interactions = () => {
  const [activeTab, setActiveTab] = useState('recent');

  // Define menu items
  const menuItems = [
    { id: 'recent', name: 'Recent', icon: <FiUserCheck /> },
    { id: 'keepintouch', name: 'Keep in Touch', icon: <FiClock /> },
    { id: 'introductions', name: 'Introductions', icon: <FiUsers /> }
  ];

  // Render the active component based on the selected tab
  const renderContent = () => {
    switch (activeTab) {
      case 'recent':
        return <RecentInteractions />;
      case 'keepintouch':
        return <KeepInTouch />;
      case 'introductions':
        return <IntroductionsComponent />;
      default:
        return (
          <div style={{ color: '#00ff00', textAlign: 'center', paddingTop: '40px' }}>
            Select an interaction type from the menu above
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
      
      <InteractionsContent>
        <ContentArea>
          <Suspense fallback={<LoadingFallback>Loading...</LoadingFallback>}>
            {renderContent()}
          </Suspense>
        </ContentArea>
      </InteractionsContent>
    </Container>
  );
};

export default Interactions;