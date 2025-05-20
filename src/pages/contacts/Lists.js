import React, { useState } from 'react';
import styled from 'styled-components';
import { FiList, FiUsers, FiDollarSign, FiBriefcase, FiHeart } from 'react-icons/fi';
import ContactsListTable from '../../components/contacts/ContactsListTable';

// Style for the main content
const Container = styled.div`
  padding: 0;
  margin-top: 0; /* Reset the negative margin */
  height: 100%;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
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
  margin-bottom: 10px;
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

// Style for the content
const ListsContent = styled.div`
  padding: 0px 16px 16px 16px;
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

// Title style for the list
const ListTitle = styled.h2`
  color: #00ff00;
  margin-top: 0;
  margin-bottom: 16px;
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
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
    { id: 'founders', name: 'Founders', icon: <FiList />, category: 'Founder' },
    { id: 'investors', name: 'Professional Investors', icon: <FiDollarSign />, category: 'Professional Investor' },
    { id: 'managers', name: 'Managers', icon: <FiBriefcase />, category: 'Manager' },
    { id: 'care', name: 'People I Care', icon: <FiHeart />, category: 'Friend and Family' }
  ];

  // Find the active menu item to get the category
  const activeMenuItem = menuItems.find(item => item.id === activeTab) || menuItems[0];

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
          <ContactsListTable category={activeMenuItem.category} />
        </ContentArea>
      </ListsContent>
    </Container>
  );
};

export default Lists;