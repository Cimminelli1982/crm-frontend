import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import RecentContactsList from '../components/contacts/RecentContactsList';
import { FiFilter, FiSearch, FiPlus } from 'react-icons/fi';

const PageContainer = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const PageHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const HeaderTitle = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ContactCount = styled.span`
  font-size: 1rem;
  font-weight: 400;
  color: #6b7280;
`;

const Description = styled.p`
  color: #6b7280;
  margin: 0;
  max-width: 600px;
  line-height: 1.5;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const PrimaryButton = styled(ActionButton)`
  background-color: #3b82f6;
  color: white;
  border: none;
  
  &:hover {
    background-color: #2563eb;
  }
`;

const SecondaryButton = styled(ActionButton)`
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  max-width: 400px;
  width: 100%;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1rem;
  display: flex;
  align-items: center;
`;

const ContentSection = styled.div`
  padding: 0;
`;

const Contacts = () => {
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCount();
  }, []);

  const fetchCount = async () => {
    try {
      setIsLoading(true);
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .neq('email', 'simone@cimminelli.com');
      
      if (error) throw error;
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching contact count:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddContact = () => {
    // Implement add contact functionality
    console.log('Add contact clicked');
  };

  const handleFilter = () => {
    // Implement filter functionality
    console.log('Filter clicked');
  };

  return (
    <PageContainer>
      <PageHeader>
        <HeaderContent>
          <HeaderTitle>
            <Title>
              All Contacts
              {!isLoading && <ContactCount>({totalCount})</ContactCount>}
            </Title>
            <Description>
              View and manage all your contacts in one place. Use the sidebar for more specific contact views.
            </Description>
          </HeaderTitle>
          
          <HeaderActions>
            <SecondaryButton onClick={handleFilter}>
              <FiFilter />
              Filter
            </SecondaryButton>
            <PrimaryButton onClick={handleAddContact}>
              <FiPlus />
              Add Contact
            </PrimaryButton>
          </HeaderActions>
        </HeaderContent>
        
        <SearchContainer>
          <SearchIcon>
            <FiSearch />
          </SearchIcon>
          <SearchInput 
            type="text" 
            placeholder="Search contacts..." 
            value={searchTerm}
            onChange={handleSearch}
          />
        </SearchContainer>
      </PageHeader>
      
      <ContentSection>
        <RecentContactsList defaultShowAll={true} />
      </ContentSection>
    </PageContainer>
  );
};

export default Contacts;
