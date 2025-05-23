import React, { useState } from 'react';
import styled from 'styled-components';
import ContactsListTable from '../../components/contacts/ContactsListTable';

// Container for the page
const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #121212;
`;

// Filter buttons container
const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background-color: #1a1a1a;
  border-bottom: 1px solid #333;
`;

// Filter button style
const FilterButton = styled.button`
  padding: 8px 16px;
  background-color: ${props => props.$active ? '#00ff00' : '#222'};
  color: ${props => props.$active ? '#000' : '#00ff00'};
  border: 1px solid #00ff00;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$active ? '#00ff00' : '#333'};
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  }
`;

// Content area
const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
`;

const RecentInbox = () => {
  const [activeFilter, setActiveFilter] = useState('created'); // 'created' or 'edited'

  return (
    <Container>
      <FilterContainer>
        <FilterButton 
          $active={activeFilter === 'created'}
          onClick={() => setActiveFilter('created')}
        >
          Last Created
        </FilterButton>
        <FilterButton 
          $active={activeFilter === 'edited'}
          onClick={() => setActiveFilter('edited')}
        >
          Last Edited
        </FilterButton>
      </FilterContainer>
      
      <ContentArea>
        <ContactsListTable 
          category={activeFilter === 'created' ? 'recent-created' : 'recent-edited'} 
        />
      </ContentArea>
    </Container>
  );
};

export default RecentInbox; 