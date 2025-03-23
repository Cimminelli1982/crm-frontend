import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table';
import ContactsModal from '../../components/modals/ContactsModal';
import CompanyModal from '../../components/modals/CompanyModal';
import TagsModal from '../../components/modals/TagsModal';
import CategoryModal from '../../components/modals/CategoryModal';
import LastInteractionModal from '../../components/modals/LastInteractionModal';
import Modal from 'react-modal';
import { FiFilter, FiX, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Set the app element for react-modal
Modal.setAppElement('#root');

// Define Contact Categories with emojis matching CategoryModal
const ContactCategories = [
  'Founder',
  'Professional Investor',
  'Advisor',
  'Team',
  'Friend and Family',
  'Manager',
  'Institution',
  'Media',
  'Student',
  'Supplier',
  'Skip',
  'Inbox',
  'WhatsApp Group Contact'
];

// Function to get emoji for category - copied from CategoryModal for consistency
const getCategoryEmoji = (category) => {
  switch (category) {
    case 'Professional Investor': return '💰 Investor';
    case 'Friend and Family': return '❤️ Loved one';
    case 'Client': return '🤝 Client';
    case 'Colleague': return '👥 Colleague';
    case 'Prospect': return '🎯 Prospect';
    case 'Advisor': return '🧠 Advisor';
    case 'Team': return '⚽ Team';
    case 'Manager': return '💼 Manager';
    case 'Founder': return '💻 Founder';
    case 'Supplier': return '📦 Supplier';
    case 'Skip': return '❌ Skip';
    case 'Inbox': return '📬 Inbox';
    case 'Other': return '📌 Other';
    case 'Institution': return '🏛️ Institution';
    case 'Media': return '📰 Media';
    case 'Student': return '🎓 Student';
    case 'WhatsApp Group Contact': return '🥶 WhatsApp Group Contact';
    default: return `⚪ ${category}`;
  }
};

// Styled components with black and white minimalist design
const PageContainer = styled.div`
  padding: 24px;
  background-color: white;
  border-radius: 8px;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  
  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }
  
  p {
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const FilterSection = styled.div`
  margin-bottom: 24px;
  border: 1px solid #000;
  border-radius: 0;
`;

const FilterSectionHeader = styled.div`
  padding: 12px 16px;
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: ${props => props.isOpen ? '1px solid #000' : 'none'};
  
  h3 {
    font-size: 0.875rem;
    font-weight: 500;
    color: #000;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const FilterContent = styled.div`
  padding: ${props => props.isOpen ? '16px' : '0'};
  max-height: ${props => props.isOpen ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
`;

const FilterGroup = styled.div`
  margin-bottom: 16px;
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const FilterModeSelector = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: ${props => props.checked ? '#000' : '#6b7280'};
  cursor: pointer;
  transition: color 0.2s;
  
  input {
    margin: 0;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 0;
  border: 1px solid #000;
  font-size: 0.875rem;
  width: 100%;
  background-color: white;
  height: 38px;

  &:focus {
    outline: none;
    border-color: #000;
  }
`;

const Button = styled.button`
  padding: 6px 12px;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #fff;
  color: #000;
  border: 1px solid #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #000;
  color: white;
  border-color: #000;

  &:hover {
    background-color: #333;
    border-color: #000;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ActiveFiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;

const ActiveFilterTag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: white;
  border: 1.5px solid black;
  border-radius: 0;
  font-size: 0.75rem;
  color: black;
`;

const RemoveFilterIcon = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  padding: 0;

  &:hover {
    color: #666;
  }
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
`;

const ActiveFiltersTitle = styled.div`
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
  font-size: 0.875rem;
`;

const FilterExplanation = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 12px;
  padding: 12px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 24px;
  background: #fff;
  border: none;
  border-radius: 0;
`;

const TableHead = styled.thead`
  background: white;
  th {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 500;
    color: black;
    border-bottom: 1px solid black;
  }
`;

const TableBody = styled.tbody`
  tr {
    &:hover {
      background-color: #f9fafb;
    }
  }
  td {
    padding: 12px 16px;
    font-size: 0.875rem;
    color: #1f2937;
    vertical-align: middle;
    border-bottom: none;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  margin-top: 24px;
`;

const PaginationInfo = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 0;
  border: 1px solid #000;
  background-color: ${props => props.active ? '#000' : 'white'};
  color: ${props => props.active ? 'white' : '#000'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover:not(:disabled) {
    background-color: ${props => props.active ? '#333' : '#f3f4f6'};
  }
`;

// Styling for the sortable column headers
const SortableHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  
  &:hover {
    color: #666;
  }
`;

const SortIcon = styled.span`
  display: inline-flex;
  font-size: 0.7rem;
  margin-top: 2px;
`;

// Define styled components with exact matching styling from RecentContactsList
const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  min-width: 0;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 1rem;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#4b5563'};
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  border: 1px solid black;
`;

const MoreTagsIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 1rem;
  background-color: #f3f4f6;
  color: #4b5563;
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
`;

const CompanyBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  background-color: white;
  color: black;
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  border: 1px solid black;
  text-transform: uppercase;
  
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
`;

const CompaniesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`;

const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.15rem 0.25rem;
  min-width: 80px;
  font-size: 0.7rem;
  border-radius: 0.375rem;
  background-color: ${props => {
    if (props.category === 'Inbox') return '#ffefef';
    if (props.category === 'Skip') return '#f3f4f6';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.category === 'Inbox') return '#ef4444';
    if (props.category === 'Skip') return '#4b5563';
    return '#4b5563';
  }};
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
`;

const CitiesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const City = styled.span`
  padding: 2px 8px;
  background-color: white;
  border: 1px solid black;
  border-radius: 0;
  font-size: 0.75rem;
  color: black;
  white-space: nowrap;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 32px;
  font-size: 0.875rem;
  color: #6b7280;
`;

// Main component
const Lists = () => {
  // State for contacts data
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for sorting
  const [sorting, setSorting] = useState({
    column: 'last_interaction',
    direction: 'desc'
  });
  
  // State for filtering
  const [allTags, setAllTags] = useState([]);
  const [allCities, setAllCities] = useState([]);
  
  // Filter visibility states
  const [showFilters, setShowFilters] = useState(true);
  const [showCategoriesFilter, setShowCategoriesFilter] = useState(true);
  const [showTagsFilter, setShowTagsFilter] = useState(false);
  const [showCitiesFilter, setShowCitiesFilter] = useState(false);
  
  // Filter modes for each filter type
  const [filterModes, setFilterModes] = useState({
    categories: 'OR',
    tags: 'AND',
    cities: 'OR'
  });
  
  // Active filters
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    tags: [],
    cities: []
  });
  
  // Form state for new filters
  const [newFilters, setNewFilters] = useState({
    category: '',
    tag: '',
    city: ''
  });
  
  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  
  // State for modals
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLastInteractionModal, setShowLastInteractionModal] = useState(false);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState(null);
  
  // Load tags and cities (for filter dropdown)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch all tags
        const { data: tagData, error: tagError } = await supabase
          .from('tags')
          .select('id, name')
          .order('name');
          
        if (tagError) throw tagError;
        setAllTags(tagData);
        
        // Fetch all cities
        const { data: cityData, error: cityError } = await supabase
          .from('cities')
          .select('id, name')
          .order('name');
          
        if (cityError) throw cityError;
        setAllCities(cityData);
        
      } catch (error) {
        console.error('Error fetching filter options:', error);
        setError('Failed to load filter options');
      }
    };
    
    fetchFilterOptions();
  }, []);
  
  // Handler for column sorting
  const handleSort = useCallback((column) => {
    setSorting(prev => {
      if (prev.column === column) {
        // If already sorting by this column, toggle direction
        return {
          column,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // If sorting by a new column, default to ascending for name, descending for dates
        return {
          column,
          direction: column === 'name' ? 'asc' : 'desc'
        };
      }
    });
  }, []);
  
  // Fetch contacts with filters
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Start building the query - without companies to query them separately
      let query = supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          email,
          mobile,
          contact_category,
          last_interaction,
          tags:contact_tags(
            tag_id,
            tags(id, name)
          ),
          cities:contact_cities(
            city_id,
            cities(id, name)
          )
        `, { count: 'exact' });
      
      // Apply category filters
      if (activeFilters.categories.length > 0) {
        // Always use OR for categories since they're mutually exclusive
        query = query.in('contact_category', activeFilters.categories);
      }

      // Apply tag filters
      if (activeFilters.tags.length > 0) {
        const tagFilterMode = filterModes.tags;
        if (tagFilterMode === 'AND') {
          // For AND mode, we need to ensure all selected tags are present
          const tagQueries = activeFilters.tags.map(tagId => 
            supabase
              .from('contact_tags')
              .select('contact_id')
              .eq('tag_id', tagId)
          );
          
          const tagResults = await Promise.all(tagQueries);
          const contactIdsWithAllTags = tagResults.reduce((acc, result) => {
            if (!acc) return result.data.map(row => row.contact_id);
            return acc.filter(id => 
              result.data.some(row => row.contact_id === id)
            );
          }, null);

          if (contactIdsWithAllTags && contactIdsWithAllTags.length > 0) {
            query = query.in('id', contactIdsWithAllTags);
          } else {
            // No contacts match all tags
            setContacts([]);
            setTotalCount(0);
            setLoading(false);
            return;
          }
        } else {
          // For OR mode, first get all contact IDs that have the selected tags
          const { data: contactsWithTags, error: tagsError } = await supabase
            .from('contact_tags')
            .select('contact_id')
            .in('tag_id', activeFilters.tags);
            
          if (tagsError) throw tagsError;
          
          if (contactsWithTags && contactsWithTags.length > 0) {
            // Deduplicate contact IDs
            const uniqueContactIds = [...new Set(contactsWithTags.map(row => row.contact_id))];
            query = query.in('id', uniqueContactIds);
          } else {
            // No contacts match any tags
            setContacts([]);
            setTotalCount(0);
            setLoading(false);
            return;
          }
        }
      }

      // Apply city filters
      if (activeFilters.cities.length > 0) {
        const cityFilterMode = filterModes.cities;
        if (cityFilterMode === 'AND') {
          // For AND mode, we need to ensure all selected cities are present
          const cityQueries = activeFilters.cities.map(cityId => 
            supabase
              .from('contact_cities')
              .select('contact_id')
              .eq('city_id', cityId)
          );
          
          const cityResults = await Promise.all(cityQueries);
          const contactIdsWithAllCities = cityResults.reduce((acc, result) => {
            if (!acc) return result.data.map(row => row.contact_id);
            return acc.filter(id => 
              result.data.some(row => row.contact_id === id)
            );
          }, null);

          if (contactIdsWithAllCities && contactIdsWithAllCities.length > 0) {
            query = query.in('id', contactIdsWithAllCities);
          } else {
            // No contacts match all cities
            setContacts([]);
            setTotalCount(0);
            setLoading(false);
            return;
          }
        } else {
          // For OR mode, first get all contact IDs that have the selected cities
          const { data: contactsWithCities, error: citiesError } = await supabase
            .from('contact_cities')
            .select('contact_id')
            .in('city_id', activeFilters.cities);
            
          if (citiesError) throw citiesError;
          
          if (contactsWithCities && contactsWithCities.length > 0) {
            // Deduplicate contact IDs
            const uniqueContactIds = [...new Set(contactsWithCities.map(row => row.contact_id))];
            query = query.in('id', uniqueContactIds);
          } else {
            // No contacts match any cities
            setContacts([]);
            setTotalCount(0);
            setLoading(false);
            return;
          }
        }
      }
      
      // Execute the query with pagination and sorting
      let queryWithPagination = query.range(
        (pageIndex * rowsPerPage), 
        (pageIndex * rowsPerPage) + rowsPerPage - 1
      );
      
      // Apply sorting based on sort state
      if (sorting.column === 'name') {
        // Sort by first_name for name column
        queryWithPagination = queryWithPagination.order('first_name', { 
          ascending: sorting.direction === 'asc',
          nullsLast: true 
        });
      } else if (sorting.column === 'last_interaction') {
        // For last_interaction sorting, we need to handle nulls always at the end
        if (sorting.direction === 'asc') {
          // For ascending order, nulls go last (default behavior with nullsLast: true)
          queryWithPagination = queryWithPagination.order('last_interaction', { 
            ascending: true,
            nullsLast: true
          });
        } else {
          // For descending order, we manually ensure nulls stay at the end
          // by first ordering by whether last_interaction is null
          queryWithPagination = queryWithPagination.order('last_interaction', {
            ascending: false,
            nullsLast: true
          });
        }
      }
      
      const { data, error, count } = await queryWithPagination;
        
      if (error) throw error;
      
      // Get all contact IDs to fetch companies separately
      const contactIds = data.map(contact => contact.id);
      
      // Fetch company data separately - THIS IS THE KEY DIFFERENCE!
      const { data: companiesData, error: companiesError } = await supabase
        .from('contact_companies')
        .select('contact_id, company_id, is_primary, companies:company_id(id, name, website)')
        .in('contact_id', contactIds);
        
      if (companiesError) throw companiesError;
      
      // Add logging to debug the issue
      console.log('Raw contact data:', data);
      console.log('Companies data:', companiesData);
      
      // Format the data for display with careful handling of potentially missing data
      const formattedData = data.map(contact => {
        // Make sure we have valid data structure before mapping
        const formattedTags = Array.isArray(contact.tags) 
          ? contact.tags.map(tag => tag?.tags).filter(Boolean)
          : [];
          
        const formattedCities = Array.isArray(contact.cities)
          ? contact.cities.map(city => city?.cities).filter(Boolean)
          : [];
          
        // Get companies for this contact - same approach as KeepInTouchTable
        const contactCompanies = companiesData ? companiesData.filter(cc => cc.contact_id === contact.id) : [];
        const companiesList = contactCompanies.map(cc => ({
          id: cc.company_id,
          name: cc.companies?.name || 'Unknown',
          website: cc.companies?.website
        }));
        
        return {
          ...contact,
          tags: formattedTags,
          cities: formattedCities,
          // Add these exactly like KeepInTouchTable
          contact_companies: contactCompanies,
          companiesList: companiesList,
          // Ensure required fields have defaults if missing
          mobile: contact.mobile || ''
        };
      });
      
      console.log('Formatted contact data:', formattedData);
      setContacts(formattedData);
      setTotalCount(count || 0);
      
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [activeFilters, filterModes, rowsPerPage, pageIndex, sorting]);
  
  // Handle page changes
  const handlePageChange = useCallback((newPageIndex) => {
    setPageIndex(newPageIndex);
  }, []);
  
  // Update the useEffect dependencies
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);
  
  // Handler for cell clicks to open the appropriate modal
  const handleCellClick = (contact, type) => {
    setSelectedContactForEdit(contact);
    switch (type) {
      case 'name':
        setShowContactsModal(true);
        break;
      case 'company':
        setShowCompanyModal(true);
        break;
      case 'tags':
        setShowTagsModal(true);
        break;
      case 'category':
        setShowCategoryModal(true);
        break;
      case 'lastInteraction':
        setShowLastInteractionModal(true);
        break;
      default:
        break;
    }
  };
  
  // Handler for modal close
  const handleModalClose = () => {
    setShowContactsModal(false);
    setShowCompanyModal(false);
    setShowTagsModal(false);
    setShowCategoryModal(false);
    setShowLastInteractionModal(false);
    setSelectedContactForEdit(null);
    fetchContacts(); // Refresh the list after modal closes
  };
  
  // Column definition using TanStack's columnHelper
  const columnHelper = createColumnHelper();
  
  const columns = useMemo(() => [
    // Name column (combines first_name and last_name) - Now with click handler and sorting
    columnHelper.accessor(row => {
      const firstName = row.first_name || '';
      const lastName = row.last_name || '';
      return `${firstName} ${lastName}`.trim();
    }, {
      id: 'name',
      header: () => (
        <SortableHeader onClick={() => handleSort('name')}>
          Name
          {sorting.column === 'name' && (
            <SortIcon>
              {sorting.direction === 'asc' ? '▲' : '▼'}
            </SortIcon>
          )}
        </SortableHeader>
      ),
      size: 220, // Make name column wider
      cell: info => {
        const contact = info.row.original;
        return (
          <div 
            style={{ 
              cursor: 'pointer', 
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '220px' 
            }}
            onClick={() => handleCellClick(contact, 'name')}
          >
            {info.getValue() || '-'}
          </div>
        );
      }
    }),
    // Company column with priority for primary company - now with click handler
    columnHelper.accessor('companiesList', {
      header: 'Company',
      size: 140, // Make company column narrower
      cell: info => {
        const contact = info.row.original;
        const companyList = info.getValue();
        if (!companyList || companyList.length === 0) {
          return (
            <div
              style={{ 
                cursor: 'pointer', 
                color: '#444444', 
                fontStyle: 'italic'
              }}
              onClick={() => handleCellClick(contact, 'company')}
            >
              No company
            </div>
          );
        }
        
        return (
          <div onClick={() => handleCellClick(contact, 'company')} style={{ cursor: 'pointer' }}>
            <CompaniesContainer>
              {companyList.map(company => (
                <CompanyBadge key={company.id}>
                  <span>{company.name}</span>
                </CompanyBadge>
              ))}
            </CompaniesContainer>
          </div>
        );
      }
    }),
    // Tags column with styled badges - now with click handler
    columnHelper.accessor('tags', {
      header: 'Tags',
      cell: info => {
        const contact = info.row.original;
        const tagList = info.getValue();
        
        if (!tagList || tagList.length === 0) {
          return (
            <div 
              style={{ cursor: 'pointer', color: '#444444', fontStyle: 'italic' }}
              onClick={() => handleCellClick(contact, 'tags')}
            >
              No tags
            </div>
          );
        }
        
        // Helper function to get tag colors - identical to RecentContactsList
        const getTagColor = (tagName) => {
          // Generate a consistent color based on the tag name
          const colors = [
            { bg: '#fee2e2', text: '#b91c1c' }, // Red
            { bg: '#fef3c7', text: '#92400e' }, // Amber
            { bg: '#ecfccb', text: '#3f6212' }, // Lime
            { bg: '#d1fae5', text: '#065f46' }, // Emerald
            { bg: '#e0f2fe', text: '#0369a1' }, // Sky
            { bg: '#ede9fe', text: '#5b21b6' }, // Violet
            { bg: '#fae8ff', text: '#86198f' }, // Fuchsia
            { bg: '#fce7f3', text: '#9d174d' }  // Pink
          ];
          
          // Use the sum of character codes to pick a color
          const sum = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const index = sum % colors.length;
          
          return colors[index];
        };
        
        // Limit to first 2 tags exactly like in RecentContactsList
        return (
          <div onClick={() => handleCellClick(contact, 'tags')} style={{ cursor: 'pointer' }}>
            <TagsContainer>
              {/* Show only first 2 tags */}
              {tagList.slice(0, 2).map((tag, index) => {
                const tagColor = getTagColor(tag.name);
                return (
                  <Tag 
                    key={tag.id || `tag-${index}`}
                    color={tagColor.bg}
                    textColor={tagColor.text}
                  >
                    {tag.name}
                  </Tag>
                );
              })}
              
              {/* Show "More Tags" indicator if there are more than 2 tags */}
              {tagList.length > 2 && (
                <MoreTagsIndicator>
                  +{tagList.length - 2} more
                </MoreTagsIndicator>
              )}
            </TagsContainer>
          </div>
        );
      }
    }),
    // Category column - now with click handler
    columnHelper.accessor('contact_category', {
      header: 'Category',
      cell: info => {
        const contact = info.row.original;
        const category = info.getValue();
        
        if (!category) {
          return (
            <div 
              style={{ cursor: 'pointer', color: '#444444', fontStyle: 'italic', textAlign: 'center', width: '100%' }}
              onClick={() => handleCellClick(contact, 'category')}
            >
              Not set
            </div>
          );
        }
        
        // Use the consistent getCategoryEmoji function we defined at the top
        
        return (
          <div 
            style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => handleCellClick(contact, 'category')}
          >
            <CategoryBadge category={category}>
              {getCategoryEmoji(category)}
            </CategoryBadge>
          </div>
        );
      }
    }),
    // Cities column with styled badges - no click handler
    columnHelper.accessor('cities', {
      header: 'Cities',
      cell: info => {
        const cityList = info.getValue();
        if (!cityList || cityList.length === 0) {
          return (
            <div style={{ color: '#444444', fontStyle: 'italic' }}>
              No cities
            </div>
          );
        }
        return (
          <CitiesContainer>
            {cityList.map(city => (
              <City key={city.id}>{city.name}</City>
            ))}
          </CitiesContainer>
        );
      }
    }),
    // Last Interaction column with relative time format - show "-" if null - now with sorting
    columnHelper.accessor('last_interaction', {
      header: () => (
        <SortableHeader onClick={() => handleSort('last_interaction')}>
          Last Interaction
          {sorting.column === 'last_interaction' && (
            <SortIcon>
              {sorting.direction === 'asc' ? '▲' : '▼'}
            </SortIcon>
          )}
        </SortableHeader>
      ),
      cell: info => {
        const contact = info.row.original;
        const date = info.getValue();
        if (!date) {
          return (
            <div 
              style={{ cursor: 'pointer', color: '#444444', fontStyle: 'italic', textAlign: 'center' }}
              onClick={() => handleCellClick(contact, 'lastInteraction')}
            >
              -
            </div>
          );
        }
        
        try {
          // Use relative time formatting
          const interactionDate = new Date(date);
          const now = new Date();
          const diffInMs = now - interactionDate;
          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          
          let displayText;
          if (diffInDays === 0) {
            displayText = 'Today';
          } else if (diffInDays === 1) {
            displayText = 'Yesterday';
          } else if (diffInDays < 7) {
            displayText = `${diffInDays} days ago`;
          } else {
            displayText = interactionDate.toLocaleDateString();
          }
          
          return (
            <div 
              style={{ cursor: 'pointer', textAlign: 'center' }}
              onClick={() => handleCellClick(contact, 'lastInteraction')}
            >
              {displayText}
            </div>
          );
        } catch (error) {
          return (
            <div 
              style={{ cursor: 'pointer', textAlign: 'center' }}
              onClick={() => handleCellClick(contact, 'lastInteraction')}
            >
              {new Date(date).toLocaleDateString()}
            </div>
          );
        }
      }
    }),
    // Email column - opens mail in Superhuman when clicked
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => {
        const contact = info.row.original;
        const email = info.getValue();
        if (!email) return '-';
        
        // Create Superhuman search URL with first_name and last_name
        const searchUrl = `https://mail.superhuman.com/search/${encodeURIComponent(contact.first_name || '')}%20${encodeURIComponent(contact.last_name || '')}`;
        
        return (
          <a 
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              cursor: 'pointer', 
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '150px',
              color: '#3b82f6',
              textDecoration: 'none'
            }}
          >
            {email}
          </a>
        );
      }
    }),
    // Mobile column - opens WhatsApp when clicked
    columnHelper.accessor('mobile', {
      header: 'Mobile',
      cell: info => {
        const mobile = info.getValue();
        if (!mobile) return '-';
        
        // Format the mobile number for WhatsApp (remove non-numeric characters)
        const whatsappNumber = mobile.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${whatsappNumber}`;
        
        return (
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              cursor: 'pointer',
              color: '#10b981', // WhatsApp green color
              textDecoration: 'none'
            }}
          >
            {mobile}
          </a>
        );
      }
    }),
  ], [columnHelper, sorting, handleSort]);
  
  // TanStack Table instance
  const table = useReactTable({
    data: contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex,
        pageSize: rowsPerPage,
      },
    },
    pageCount: Math.ceil(totalCount / rowsPerPage),
    manualPagination: true,
  });
  
  // Handlers for adding filters
  const handleAddCategoryFilter = () => {
    if (!newFilters.category) return;
    
    setActiveFilters(prev => ({
      ...prev,
      categories: [...prev.categories, newFilters.category]
    }));
    
    // Reset the form
    setNewFilters(prev => ({
      ...prev,
      category: ''
    }));
  };
  
  const handleAddTagFilter = () => {
    if (!newFilters.tag) return;
    
    setActiveFilters(prev => ({
      ...prev,
      tags: [...prev.tags, newFilters.tag]
    }));
    
    // Reset the form
    setNewFilters(prev => ({
      ...prev,
      tag: ''
    }));
  };
  
  const handleAddCityFilter = () => {
    if (!newFilters.city) return;
    
    setActiveFilters(prev => ({
      ...prev,
      cities: [...prev.cities, newFilters.city]
    }));
    
    // Reset the form
    setNewFilters(prev => ({
      ...prev,
      city: ''
    }));
  };
  
  // Handler for removing a filter
  const handleRemoveFilter = (type, value) => {
    setActiveFilters(prev => {
      switch(type) {
        case 'category':
          return { ...prev, categories: prev.categories.filter(c => c !== value) };
        case 'tag':
          return { ...prev, tags: prev.tags.filter(t => t !== value) };
        case 'city':
          return { ...prev, cities: prev.cities.filter(c => c !== value) };
        default:
          return prev;
      }
    });
  };
  
  // Handler for clearing all filters
  const handleClearFilters = () => {
    setActiveFilters({
      categories: [],
      tags: [],
      cities: []
    });
  };
  
  // Get total active filters count
  const getTotalActiveFilters = () => {
    return activeFilters.categories.length + activeFilters.tags.length + activeFilters.cities.length;
  };
  
  // Toggle all filters visibility
  const toggleAllFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Render summary of active filters
  const renderActiveFilters = () => {
    if (getTotalActiveFilters() === 0) return null;
    
    return (
      <>
        <ActiveFiltersTitle>Active Filters</ActiveFiltersTitle>
        <ActiveFiltersContainer>
          {activeFilters.categories.map((category, index) => (
            <ActiveFilterTag key={`category-${category}-${index}`}>
              {getCategoryEmoji(category)}
              <RemoveFilterIcon 
                onClick={() => handleRemoveFilter('category', category)}
                aria-label="Remove filter"
              >
                <FiX size={14} />
              </RemoveFilterIcon>
            </ActiveFilterTag>
          ))}
          
          {activeFilters.tags.map((tagId, index) => {
            const tag = allTags.find(t => t.id === parseInt(tagId));
            return (
              <ActiveFilterTag key={`tag-${tagId}-${index}`}>
                {tag ? tag.name : tagId}
                <RemoveFilterIcon 
                  onClick={() => handleRemoveFilter('tag', tagId)}
                  aria-label="Remove filter"
                >
                  <FiX size={14} />
                </RemoveFilterIcon>
              </ActiveFilterTag>
            );
          })}
          
          {activeFilters.cities.map((cityId, index) => {
            const city = allCities.find(c => c.id === cityId);
            return (
              <ActiveFilterTag key={`city-${cityId}-${index}`}>
                {city ? city.name : cityId}
                <RemoveFilterIcon 
                  onClick={() => handleRemoveFilter('city', cityId)}
                  aria-label="Remove filter"
                >
                  <FiX size={14} />
                </RemoveFilterIcon>
              </ActiveFilterTag>
            );
          })}
        </ActiveFiltersContainer>
      </>
    );
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <h1>Contact Lists</h1>
        <p>View and filter your contacts with advanced criteria</p>
      </PageHeader>
      
      <FilterSection>
        <FilterSectionHeader onClick={toggleAllFilters} isOpen={showFilters}>
          <h3>
            <FiFilter size={16} /> 
            Filter Contacts
            {getTotalActiveFilters() > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
                  ({getTotalActiveFilters()} active)
                </span>
                {/* Active filter bubbles in header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '300px' }}>
                  {activeFilters.categories.slice(0, 2).map((category, index) => (
                    <ActiveFilterTag key={`header-category-${category}-${index}`} style={{ margin: 0 }}>
                      {getCategoryEmoji(category)}
                    </ActiveFilterTag>
                  ))}
                  
                  {activeFilters.tags.slice(0, 2).map((tagId, index) => {
                    const tag = allTags.find(t => t.id === parseInt(tagId));
                    return tag && (
                      <ActiveFilterTag key={`header-tag-${tagId}-${index}`} style={{ margin: 0 }}>
                        {tag.name}
                      </ActiveFilterTag>
                    );
                  })}
                  
                  {activeFilters.cities.slice(0, 2).map((cityId, index) => {
                    const city = allCities.find(c => c.id === cityId);
                    return city && (
                      <ActiveFilterTag key={`header-city-${cityId}-${index}`} style={{ margin: 0 }}>
                        {city.name}
                      </ActiveFilterTag>
                    );
                  })}
                  
                  {/* Show +X more if there are more than 4 total active filters */}
                  {getTotalActiveFilters() > 4 && (
                    <ActiveFilterTag style={{ margin: 0, background: '#f3f4f6', color: '#4b5563' }}>
                      +{getTotalActiveFilters() - 4} more
                    </ActiveFilterTag>
                  )}
                </div>
              </div>
            )}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {getTotalActiveFilters() > 0 && (
              <div style={{ marginRight: '24px' }}>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    handleClearFilters();
                  }}
                  style={{ 
                    padding: '4px 8px',
                    fontSize: '0.75rem'
                  }}
                >
                  Clear All
                </Button>
              </div>
            )}
            {showFilters ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </div>
        </FilterSectionHeader>
        
        <FilterContent isOpen={showFilters}>
          {/* Categories Filter */}
          <FilterGroup>
            <FilterSectionHeader onClick={() => setShowCategoriesFilter(!showCategoriesFilter)} isOpen={showCategoriesFilter}>
              <h3>Categories</h3>
              {showCategoriesFilter ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
            </FilterSectionHeader>
            
            <FilterContent isOpen={showCategoriesFilter}>
              <FilterHeader>
                <FilterLabel htmlFor="category-filter">Select Category</FilterLabel>
                <FilterModeSelector>
                  <RadioLabel checked={filterModes.categories === 'OR'}>
                    <input
                      type="radio"
                      name="categoryFilterMode"
                      value="OR"
                      checked={filterModes.categories === 'OR'}
                      onChange={() => setFilterModes({...filterModes, categories: 'OR'})}
                    />
                    OR
                  </RadioLabel>
                  <RadioLabel checked={filterModes.categories === 'AND'}>
                    <input
                      type="radio"
                      name="categoryFilterMode"
                      value="AND"
                      checked={filterModes.categories === 'AND'}
                      onChange={() => setFilterModes({...filterModes, categories: 'AND'})}
                    />
                    AND
                  </RadioLabel>
                </FilterModeSelector>
              </FilterHeader>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <Select 
                    id="category-filter"
                    value={newFilters.category}
                    onChange={e => setNewFilters({...newFilters, category: e.target.value})}
                  >
                    <option value="">Choose a category...</option>
                    {ContactCategories.map(cat => (
                      <option key={cat} value={cat}>{getCategoryEmoji(cat)}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <PrimaryButton onClick={handleAddCategoryFilter}>Add</PrimaryButton>
                </div>
              </div>
              
              {activeFilters.categories.length > 0 && (
                <ActiveFiltersContainer>
                  {activeFilters.categories.map((category, index) => (
                    <ActiveFilterTag key={`category-${category}-${index}`}>
                      {getCategoryEmoji(category)}
                      <RemoveFilterIcon 
                        onClick={() => handleRemoveFilter('category', category)}
                        aria-label="Remove filter"
                      >
                        <FiX size={14} />
                      </RemoveFilterIcon>
                    </ActiveFilterTag>
                  ))}
                </ActiveFiltersContainer>
              )}
            </FilterContent>
          </FilterGroup>
          
          {/* Tags Filter */}
          <FilterGroup>
            <FilterSectionHeader onClick={() => setShowTagsFilter(!showTagsFilter)} isOpen={showTagsFilter}>
              <h3>Tags</h3>
              {showTagsFilter ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
            </FilterSectionHeader>
            
            <FilterContent isOpen={showTagsFilter}>
              <FilterHeader>
                <FilterLabel htmlFor="tag-filter">Select Tag</FilterLabel>
                <FilterModeSelector>
                  <RadioLabel checked={filterModes.tags === 'OR'}>
                    <input
                      type="radio"
                      name="tagFilterMode"
                      value="OR"
                      checked={filterModes.tags === 'OR'}
                      onChange={() => setFilterModes({...filterModes, tags: 'OR'})}
                    />
                    OR
                  </RadioLabel>
                  <RadioLabel checked={filterModes.tags === 'AND'}>
                    <input
                      type="radio"
                      name="tagFilterMode"
                      value="AND"
                      checked={filterModes.tags === 'AND'}
                      onChange={() => setFilterModes({...filterModes, tags: 'AND'})}
                    />
                    AND
                  </RadioLabel>
                </FilterModeSelector>
              </FilterHeader>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <Select 
                    id="tag-filter"
                    value={newFilters.tag}
                    onChange={e => setNewFilters({...newFilters, tag: e.target.value})}
                  >
                    <option value="">Choose a tag...</option>
                    {allTags.map(tag => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <PrimaryButton onClick={handleAddTagFilter}>Add</PrimaryButton>
                </div>
              </div>
              
              {activeFilters.tags.length > 0 && (
                <ActiveFiltersContainer>
                  {activeFilters.tags.map((tagId, index) => {
                    const tag = allTags.find(t => t.id === parseInt(tagId));
                    return (
                      <ActiveFilterTag key={`tag-${tagId}-${index}`}>
                        {tag ? tag.name : tagId}
                        <RemoveFilterIcon 
                          onClick={() => handleRemoveFilter('tag', tagId)}
                          aria-label="Remove filter"
                        >
                          <FiX size={14} />
                        </RemoveFilterIcon>
                      </ActiveFilterTag>
                    );
                  })}
                </ActiveFiltersContainer>
              )}
            </FilterContent>
          </FilterGroup>
          
          {/* Cities Filter */}
          <FilterGroup>
            <FilterSectionHeader onClick={() => setShowCitiesFilter(!showCitiesFilter)} isOpen={showCitiesFilter}>
              <h3>Cities</h3>
              {showCitiesFilter ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
            </FilterSectionHeader>
            
            <FilterContent isOpen={showCitiesFilter}>
              <FilterHeader>
                <FilterLabel htmlFor="city-filter">Select City</FilterLabel>
                <FilterModeSelector>
                  <RadioLabel checked={filterModes.cities === 'OR'}>
                    <input
                      type="radio"
                      name="cityFilterMode"
                      value="OR"
                      checked={filterModes.cities === 'OR'}
                      onChange={() => setFilterModes({...filterModes, cities: 'OR'})}
                    />
                    OR
                  </RadioLabel>
                  <RadioLabel checked={filterModes.cities === 'AND'}>
                    <input
                      type="radio"
                      name="cityFilterMode"
                      value="AND"
                      checked={filterModes.cities === 'AND'}
                      onChange={() => setFilterModes({...filterModes, cities: 'AND'})}
                    />
                    AND
                  </RadioLabel>
                </FilterModeSelector>
              </FilterHeader>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <Select 
                    id="city-filter"
                    value={newFilters.city}
                    onChange={e => setNewFilters({...newFilters, city: e.target.value})}
                  >
                    <option value="">Choose a city...</option>
                    {allCities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <PrimaryButton onClick={handleAddCityFilter}>Add</PrimaryButton>
                </div>
              </div>
              
              {activeFilters.cities.length > 0 && (
                <ActiveFiltersContainer>
                  {activeFilters.cities.map((cityId, index) => {
                    const city = allCities.find(c => c.id === cityId);
                    return (
                      <ActiveFilterTag key={`city-${cityId}-${index}`}>
                        {city ? city.name : cityId}
                        <RemoveFilterIcon 
                          onClick={() => handleRemoveFilter('city', cityId)}
                          aria-label="Remove filter"
                        >
                          <FiX size={14} />
                        </RemoveFilterIcon>
                      </ActiveFilterTag>
                    );
                  })}
                </ActiveFiltersContainer>
              )}
            </FilterContent>
          </FilterGroup>
          
          {/* Clear All Filters button moved to the header */}
        </FilterContent>
      </FilterSection>
      
      {loading ? (
        <LoadingContainer>Loading contacts...</LoadingContainer>
      ) : error ? (
        <LoadingContainer>{error}</LoadingContainer>
      ) : (
        <>
          <Table>
            <TableHead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </TableHead>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center' }}>
                    No contacts found
                  </td>
                </tr>
              )}
            </TableBody>
          </Table>
          
          <PaginationContainer>
            <PaginationInfo>
              Showing {table.getRowModel().rows.length} of {totalCount} results
            </PaginationInfo>
            
            <PaginationButtons>
              <PaginationButton
                onClick={() => handlePageChange(0)}
                disabled={pageIndex === 0}
                title="First page"
              >
                <FiChevronsLeft size={16} />
              </PaginationButton>
              
              <PaginationButton
                onClick={() => handlePageChange(pageIndex - 1)}
                disabled={pageIndex === 0}
                title="Previous page"
              >
                <FiChevronLeft size={16} />
              </PaginationButton>
              
              <PaginationButton
                onClick={() => handlePageChange(pageIndex + 1)}
                disabled={pageIndex >= Math.ceil(totalCount / rowsPerPage) - 1}
                title="Next page"
              >
                <FiChevronRight size={16} />
              </PaginationButton>
              
              <PaginationButton
                onClick={() => handlePageChange(Math.ceil(totalCount / rowsPerPage) - 1)}
                disabled={pageIndex >= Math.ceil(totalCount / rowsPerPage) - 1}
                title="Last page"
              >
                <FiChevronsRight size={16} />
              </PaginationButton>
            </PaginationButtons>
          </PaginationContainer>
        </>
      )}

      {/* Modals for editing contact information */}
      {showContactsModal && selectedContactForEdit && (
        <ContactsModal
          isOpen={showContactsModal}
          onRequestClose={handleModalClose}
          contact={selectedContactForEdit}
        />
      )}
      
      {showCompanyModal && selectedContactForEdit && (
        <CompanyModal
          isOpen={showCompanyModal}
          onRequestClose={handleModalClose}
          contact={selectedContactForEdit}
        />
      )}
      
      {showTagsModal && selectedContactForEdit && (
        <TagsModal
          isOpen={showTagsModal}
          onRequestClose={handleModalClose}
          contact={selectedContactForEdit}
        />
      )}
      
      {showCategoryModal && selectedContactForEdit && (
        <CategoryModal
          isOpen={showCategoryModal}
          onRequestClose={handleModalClose}
          contact={selectedContactForEdit}
        />
      )}
      
      {showLastInteractionModal && selectedContactForEdit && (
        <LastInteractionModal
          isOpen={showLastInteractionModal}
          onRequestClose={handleModalClose}
          contact={selectedContactForEdit}
        />
      )}
    </PageContainer>
  );
};

export default Lists;