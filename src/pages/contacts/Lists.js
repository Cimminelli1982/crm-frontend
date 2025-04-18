import React, { useState, lazy, Suspense } from 'react';
import styled from 'styled-components';
import { FiList, FiUsers, FiDollarSign, FiBriefcase, FiHeart } from 'react-icons/fi';

// Placeholder for future list components
const FoundersList = () => (
  <div style={{ textAlign: 'center', padding: '40px', color: '#00ff00' }}>
    Founders list will be implemented soon.
  </div>
);

const InvestorsList = () => (
  <div style={{ textAlign: 'center', padding: '40px', color: '#00ff00' }}>
    Professional Investors list will be implemented soon.
  </div>
);

const ManagersList = () => (
  <div style={{ textAlign: 'center', padding: '40px', color: '#00ff00' }}>
    Managers list will be implemented soon.
  </div>
);

const CareList = () => (
  <div style={{ textAlign: 'center', padding: '40px', color: '#00ff00' }}>
    People I Care list will be implemented soon.
  </div>
);

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
const ListsContent = styled.div`
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

const Lists = () => {
  const [activeTab, setActiveTab] = useState('founders');

  // Define menu items
  const menuItems = [
    { id: 'founders', name: 'Founders', icon: <FiList /> },
    { id: 'investors', name: 'Professional Investors', icon: <FiDollarSign /> },
    { id: 'managers', name: 'Managers', icon: <FiBriefcase /> },
    { id: 'care', name: 'People I Care', icon: <FiHeart /> }
  ];

  // Render the active component based on the selected tab
  const renderContent = () => {
    switch (activeTab) {
      case 'founders':
        return <FoundersList />;
      case 'investors':
        return <InvestorsList />;
      case 'managers':
        return <ManagersList />;
      case 'care':
        return <CareList />;
      default:
        return (
          <div style={{ color: '#00ff00', textAlign: 'center', paddingTop: '40px' }}>
            Select a list type from the menu above
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
      
      <ListsContent>
        <ContentArea>
          <Suspense fallback={<LoadingFallback>Loading...</LoadingFallback>}>
            {renderContent()}
          </Suspense>
        </ContentArea>
      </ListsContent>
    </Container>
  );
};

export default Lists;