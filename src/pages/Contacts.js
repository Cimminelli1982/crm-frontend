import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import RecentContactsList from '../components/contacts/RecentContactsList';
import { FiFilter, FiSearch, FiPlus, FiChevronDown, FiClock, FiMessageSquare, FiAlertCircle, FiCalendar } from 'react-icons/fi';

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
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  display: flex;
  align-items: center;
  width: 100%;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
  margin-top: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const SearchDropdown = styled.div`
  position: relative;
  min-width: 140px;
  border-right: 1px solid #e5e7eb;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: #4b5563;
  background: none;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-height: 250px;
  overflow-y: auto;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const DropdownItem = styled.button`
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  color: #1f2937;
  background: none;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &.active {
    background-color: #f3f4f6;
    font-weight: 500;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: #1f2937;
  border: none;
  outline: none;
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  color: #6b7280;
`;

const ContentSection = styled.div`
  padding: 0;
`;

// New styled components for filter buttons
const FilterButtonsContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  
  @media (max-width: 768px) {
    flex-wrap: nowrap;
    padding: 0.75rem 1rem;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#4b5563'};
  border: 1px solid ${props => props.active ? '#3b82f6' : '#d1d5db'};
  
  &:hover {
    background-color: ${props => props.active ? '#2563eb' : '#f9fafb'};
  }
  
  svg {
    font-size: 1rem;
  }
`;

const Contacts = () => {
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  
  // Search field options
  const searchFields = [
    { id: 'name', label: 'Name Surname' },
    { id: 'email', label: 'Email' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'city', label: 'City' },
    { id: 'company', label: 'Company' },
    { id: 'tags', label: 'Tags' }
  ];

  useEffect(() => {
    fetchCount();
  }, []);

  const fetchCount = async () => {
    try {
      setIsLoading(true);
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .not('contact_category', 'eq', 'Skip');
      
      if (error) throw error;
      setTotalCount(count || 0);
      setFilteredCount(count || 0);
    } catch (error) {
      console.error('Error fetching contact count:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setActiveFilter(null);
  };

  const handleSearchFieldChange = (field) => {
    setSearchField(field);
    setDropdownOpen(false);
    setSearchTerm('');
    setActiveFilter(null);
  };

  const handleAddContact = () => {
    console.log('Add contact clicked');
  };

  const handleFilter = () => {
    console.log('Filter clicked');
  };
  
  const handleFilterButtonClick = (filterType) => {
    setActiveFilter(activeFilter === filterType ? null : filterType);
    setSearchTerm('');
  };
  
  const handleFilteredCountUpdate = (count) => {
    setFilteredCount(count);
  };

  const getFilterTitle = () => {
    if (!activeFilter) return "All Contacts";
    
    switch (activeFilter) {
      case 'recentlyCreated': return "Recently Created";
      case 'lastInteraction': return "Recent Interactions";
      case 'keepInTouch': return "Keep in Touch";
      case 'missingInfos': return "Missing Information";
      default: return "All Contacts";
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <HeaderContent>
          <HeaderTitle>
            <Title>
              {getFilterTitle()}
              {!isLoading && <ContactCount>({filteredCount})</ContactCount>}
            </Title>
            <Description>
              {activeFilter 
                ? `Filtered view: ${getFilterTitle()}. ${filteredCount} contacts match your criteria.`
                : 'View and manage all your contacts in one place. Use the sidebar for more specific contact views.'}
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
          <SearchDropdown>
            <DropdownButton onClick={() => setDropdownOpen(!dropdownOpen)}>
              {searchFields.find(f => f.id === searchField)?.label}
              <FiChevronDown />
            </DropdownButton>
            <DropdownMenu isOpen={dropdownOpen}>
              {searchFields.map(field => (
                <DropdownItem 
                  key={field.id}
                  className={field.id === searchField ? 'active' : ''}
                  onClick={() => handleSearchFieldChange(field.id)}
                >
                  {field.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </SearchDropdown>
          <SearchInput 
            type="text" 
            placeholder={`Search by ${searchFields.find(f => f.id === searchField)?.label.toLowerCase()}...`} 
            value={searchTerm}
            onChange={handleSearch}
          />
          <SearchIcon>
            <FiSearch />
          </SearchIcon>
        </SearchContainer>
        
        <FilterButtonsContainer>
          <FilterButton 
            active={activeFilter === 'recentlyCreated'} 
            onClick={() => handleFilterButtonClick('recentlyCreated')}
          >
            <FiClock />
            Recently Created
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'lastInteraction'} 
            onClick={() => handleFilterButtonClick('lastInteraction')}
          >
            <FiMessageSquare />
            Last Interaction
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'keepInTouch'} 
            onClick={() => handleFilterButtonClick('keepInTouch')}
          >
            <FiCalendar />
            Keep in Touch
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingInfos'} 
            onClick={() => handleFilterButtonClick('missingInfos')}
          >
            <FiAlertCircle />
            Missing Infos
          </FilterButton>
        </FilterButtonsContainer>
      </PageHeader>
      
      <ContentSection>
        <RecentContactsList 
          defaultShowAll={true} 
          searchTerm={searchTerm.length >= 3 ? searchTerm : ''}
          searchField={searchField}
          activeFilter={activeFilter}
          onCountUpdate={handleFilteredCountUpdate}
        />
      </ContentSection>
    </PageContainer>
  );
};

export default Contacts;
