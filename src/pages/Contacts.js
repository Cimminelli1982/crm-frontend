import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import RecentContactsList from '../components/contacts/RecentContactsList';
import { FiFilter, FiSearch, FiPlus, FiChevronDown, FiClock, FiMessageSquare, FiAlertCircle, FiRefreshCw, FiStar, FiMapPin, FiBook } from 'react-icons/fi';
import { FaTag } from 'react-icons/fa';

const PageContainer = styled.div`
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const PageHeader = styled.div`
  padding: 1.5rem 1.5rem 0.5rem 1.5rem; /* Reduced bottom padding */
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
  margin: 0;
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
  background-color: transparent;
  color: black;
  border: 1px solid black;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  background-color: white;
  border: 1px solid black;
  border-radius: 0.375rem;
  overflow: hidden;
  margin-top: 1rem;
  box-shadow: none;
`;

const SearchDropdown = styled.div`
  position: relative;
  min-width: 140px;
  border-right: 1px solid black;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: black;
  background: none;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid black;
  border-radius: 0.375rem;
  box-shadow: none;
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
  color: black;
  background: none;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  &.active {
    background-color: rgba(0, 0, 0, 0.1);
    font-weight: 500;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: black;
  border: none;
  outline: none;
  
  &::placeholder {
    color: #555555;
  }
`;

const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  color: black;
`;

const ContentSection = styled.div`
  padding: 0 1.5rem;
`;

// New styled components for filter buttons
const FilterButtonsContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 2rem 0 0.5rem 0;  /* Reduced bottom padding from 1rem to 0.5rem */
  margin: 0 1.5rem;
  overflow-x: auto;
  
  @media (max-width: 768px) {
    flex-wrap: nowrap;
    padding: 1.5rem 0 0.25rem 0;  /* Reduced bottom padding in mobile view */
    margin: 0 1rem;
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
  background-color: ${props => props.active ? 'black' : 'white'};
  color: ${props => props.active ? 'white' : 'black'};
  border: 1px solid black;
  position: relative;
  
  &:hover {
    background-color: ${props => props.active ? '#333333' : 'rgba(0, 0, 0, 0.05)'};
  }
  
  svg {
    font-size: 1rem;
  }
  
  .count {
    margin-left: 0.25rem;
    background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
    padding: 0.125rem 0.375rem;
    border-radius: 1rem;
    font-size: 0.75rem;
  }
`;

const NotificationDot = styled.div`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 0.5rem;
  height: 0.5rem;
  background-color: black;
  border-radius: 50%;
  border: 2px solid white;
`;

const Contacts = ({ defaultFilter = null }) => {
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(defaultFilter);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Filter counts for badges
  const [filterCounts, setFilterCounts] = useState({
    lastInteraction: 0,
    recentlyCreated: 0,
    missingKeepInTouch: 0,
    missingScore: 0,
    missingCities: 0,
    missingCompanies: 0,
    missingTags: 0
  });
  
  // Reference to the contact list component
  const contactListRef = useRef(null);
  
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
    fetchInboxCount();
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

  const fetchInboxCount = async () => {
    try {
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('contact_category', 'Inbox');
      
      if (error) throw error;
      setInboxCount(count || 0);
    } catch (error) {
      console.error('Error fetching inbox count:', error.message);
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
  
  const handleFilteredCountUpdate = (count, counts) => {
    setFilteredCount(count);
    
    // Update filter counts if provided
    if (counts) {
      setFilterCounts(counts);
    }
  };
  
  const handleRefresh = () => {
    // Increment refresh trigger to force the list to reload
    setRefreshTrigger(prev => prev + 1);
  };

  const getFilterTitle = () => {
    if (!activeFilter) return "All Contacts";
    
    switch (activeFilter) {
      case 'recentlyCreated': return "Missing Category";
      case 'lastInteraction': return "Recent Interactions";
      case 'missingKeepInTouch': return "Missing Keep in Touch";
      case 'missingScore': return "Missing Score";
      case 'missingCities': return "Missing Cities";
      case 'missingCompanies': return "Missing Companies";
      case 'missingTags': return "Missing Tags";
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
            </Title>
          </HeaderTitle>
          
          <HeaderActions>
            <SecondaryButton onClick={handleRefresh} title="Refresh contacts">
              <FiRefreshCw />
              Refresh
            </SecondaryButton>
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
            active={activeFilter === 'lastInteraction'} 
            onClick={() => handleFilterButtonClick('lastInteraction')}
          >
            <FiMessageSquare />
            Last Interaction
            <span className="count">{filterCounts.lastInteraction}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'recentlyCreated'} 
            onClick={() => handleFilterButtonClick('recentlyCreated')}
          >
            <FiClock />
            Inbox
            <span className="count">{filterCounts.recentlyCreated}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingKeepInTouch'} 
            onClick={() => handleFilterButtonClick('missingKeepInTouch')}
          >
            <FiAlertCircle />
            Missing Keep in Touch
            <span className="count">{filterCounts.missingKeepInTouch}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingScore'} 
            onClick={() => handleFilterButtonClick('missingScore')}
          >
            <FiStar />
            Missing Score
            <span className="count">{filterCounts.missingScore}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingCities'} 
            onClick={() => handleFilterButtonClick('missingCities')}
          >
            <FiMapPin />
            Missing Cities
            <span className="count">{filterCounts.missingCities}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingCompanies'} 
            onClick={() => handleFilterButtonClick('missingCompanies')}
          >
            <FiBook />
            Missing Companies
            <span className="count">{filterCounts.missingCompanies}</span>
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'missingTags'} 
            onClick={() => handleFilterButtonClick('missingTags')}
          >
            <FaTag />
            Missing Tags
            <span className="count">{filterCounts.missingTags}</span>
          </FilterButton>
        </FilterButtonsContainer>
      </PageHeader>
      
      <ContentSection>
        <RecentContactsList 
          ref={contactListRef}
          defaultShowAll={true} 
          searchTerm={searchTerm.length >= 3 ? searchTerm : ''}
          searchField={searchField}
          activeFilter={activeFilter}
          onCountUpdate={handleFilteredCountUpdate}
          refreshTrigger={refreshTrigger}
          showIconsOnly={true}
        />
      </ContentSection>
    </PageContainer>
  );
};

export default Contacts;
