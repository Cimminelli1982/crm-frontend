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
import { FiFilter, FiX, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

// Define Contact Categories
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
  'Skip'
];

// Styled components
const PageContainer = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  min-height: calc(100vh - 4rem);
`;

const PageHeader = styled.div`
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
`;

const Description = styled.p`
  color: #6b7280;
  margin: 0;
`;

const FilterSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const FilterTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #374151;
`;

const Select = styled.select`
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  font-size: 0.875rem;
  width: 100%;
  background-color: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  background-color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background-color: #f9fafb;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;

  &:hover {
    background-color: #2563eb;
    border-color: #2563eb;
  }
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const ActiveFiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActiveFilterTag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background-color: #e0e7ff;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: #4338ca;
`;

const RemoveFilterIcon = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4338ca;
  padding: 0.125rem;
  border-radius: 0.25rem;

  &:hover {
    background-color: #c7d2fe;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
`;

const TableHead = styled.thead`
  background-color: #f9fafb;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #f9fafb;
  }
`;

const TableCell = styled.td`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #111827;
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  margin-top: 1rem;
`;

const PaginationInfo = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  background-color: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#374151'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover:not(:disabled) {
    background-color: ${props => props.active ? '#2563eb' : '#f9fafb'};
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const Tag = styled.span`
  padding: 0.125rem 0.375rem;
  background-color: #e0e7ff;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #4338ca;
  white-space: nowrap;
`;

const CitiesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const City = styled.span`
  padding: 0.125rem 0.375rem;
  background-color: #dcfce7;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #166534;
  white-space: nowrap;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

// Add these styled components near the other styled components
const FilterModeContainer = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const FilterModeTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
`;

const FilterModeDescription = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background-color: ${props => props.checked ? '#e0e7ff' : 'white'};
  border: 1px solid ${props => props.checked ? '#6366f1' : '#d1d5db'};
  color: ${props => props.checked ? '#4f46e5' : '#374151'};
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.checked ? '#e0e7ff' : '#f9fafb'};
  }

  input {
    width: 1rem;
    height: 1rem;
  }
`;

const ActiveFiltersTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
`;

const FilterExplanation = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  border: 1px dashed #e5e7eb;
`;

// Main component
const Lists = () => {
  // State for contacts data
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filtering
  const [allTags, setAllTags] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [filterMode, setFilterMode] = useState('AND'); // 'AND' or 'OR'
  
  // Active filters
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    tags: [],
    cities: []
  });
  
  // Form state for new filters
  const [newFilter, setNewFilter] = useState({
    type: 'category',
    value: ''
  });
  
  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  
  // Column definition using TanStack's columnHelper
  const columnHelper = createColumnHelper();
  
  const columns = useMemo(() => [
    columnHelper.accessor('first_name', {
      header: 'First Name',
      cell: info => info.getValue()
    }),
    columnHelper.accessor('last_name', {
      header: 'Last Name',
      cell: info => info.getValue()
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => info.getValue() || '-'
    }),
    columnHelper.accessor('contact_category', {
      header: 'Category',
      cell: info => info.getValue() || '-'
    }),
    columnHelper.accessor('tags', {
      header: 'Tags',
      cell: info => {
        const tagList = info.getValue();
        if (!tagList || tagList.length === 0) return '-';
        return (
          <TagsContainer>
            {tagList.map(tag => (
              <Tag key={tag.id}>{tag.name}</Tag>
            ))}
          </TagsContainer>
        );
      }
    }),
    columnHelper.accessor('cities', {
      header: 'Cities',
      cell: info => {
        const cityList = info.getValue();
        if (!cityList || cityList.length === 0) return '-';
        return (
          <CitiesContainer>
            {cityList.map(city => (
              <City key={city.id}>{city.name}</City>
            ))}
          </CitiesContainer>
        );
      }
    }),
    columnHelper.accessor('last_interaction', {
      header: 'Last Interaction',
      cell: info => {
        const date = info.getValue();
        if (!date) return '-';
        return new Date(date).toLocaleDateString();
      }
    }),
  ], [columnHelper]);
  
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
  
  // Fetch contacts with filters
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Start building the query
      let query = supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          email,
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
        query = query.in('contact_category', activeFilters.categories);
      }

      // Apply tag filters
      if (activeFilters.tags.length > 0) {
        if (filterMode === 'AND') {
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
          // For OR mode, we can use a simple in clause
          query = query.in('contact_tags.tag_id', activeFilters.tags);
        }
      }

      // Apply city filters
      if (activeFilters.cities.length > 0) {
        if (filterMode === 'AND') {
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
          // For OR mode, we can use a simple in clause
          query = query.in('contact_cities.city_id', activeFilters.cities);
        }
      }
      
      // Execute the query with pagination
      const { data, error, count } = await query
        .range((pageIndex * rowsPerPage), 
               (pageIndex * rowsPerPage) + rowsPerPage - 1)
        .order('last_interaction', { ascending: false });
        
      if (error) throw error;
      
      // Format the data for display
      const formattedData = data.map(contact => ({
        ...contact,
        tags: contact.tags.map(tag => tag.tags).filter(Boolean),
        cities: contact.cities.map(city => city.cities).filter(Boolean)
      }));
      
      setContacts(formattedData);
      setTotalCount(count || 0);
      
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [activeFilters, filterMode, rowsPerPage, pageIndex]);
  
  // Handle page changes
  const handlePageChange = useCallback((newPageIndex) => {
    setPageIndex(newPageIndex);
  }, []);
  
  // Update the useEffect dependencies
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts, activeFilters, filterMode, pageIndex]);
  
  // Handler for adding a filter
  const handleAddFilter = () => {
    if (!newFilter.value) return;
    
    setActiveFilters(prev => {
      switch(newFilter.type) {
        case 'category':
          return { ...prev, categories: [...prev.categories, newFilter.value] };
        case 'tag':
          return { ...prev, tags: [...prev.tags, newFilter.value] };
        case 'city':
          return { ...prev, cities: [...prev.cities, newFilter.value] };
        default:
          return prev;
      }
    });
    
    // Reset the form
    setNewFilter({
      type: newFilter.type,
      value: ''
    });
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
  
  // Render active filters
  const renderActiveFilters = () => {
    const filters = [
      ...activeFilters.categories.map(cat => ({
        type: 'category',
        label: `Category: ${cat}`,
        value: cat
      })),
      ...activeFilters.tags.map(tagId => {
        const tag = allTags.find(t => t.id === parseInt(tagId));
        return {
          type: 'tag',
          label: `Tag: ${tag ? tag.name : tagId}`,
          value: tagId
        };
      }),
      ...activeFilters.cities.map(cityId => {
        const city = allCities.find(c => c.id === cityId);
        return {
          type: 'city',
          label: `City: ${city ? city.name : cityId}`,
          value: cityId
        };
      })
    ];
    
    if (filters.length === 0) return null;
    
    return (
      <ActiveFiltersContainer>
        {filters.map((filter, index) => (
          <ActiveFilterTag key={`${filter.type}-${filter.value}-${index}`}>
            {filter.label}
            <RemoveFilterIcon 
              onClick={() => handleRemoveFilter(filter.type, filter.value)}
              aria-label="Remove filter"
            >
              <FiX size={14} />
            </RemoveFilterIcon>
          </ActiveFilterTag>
        ))}
      </ActiveFiltersContainer>
    );
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <Title>Contact Lists</Title>
        <Description>View and filter your contacts with advanced criteria</Description>
      </PageHeader>
      
      <FilterSection>
        <FilterTitle>
          <FiFilter size={16} />
          Filter Contacts
        </FilterTitle>

        <FilterModeContainer>
          <FilterModeTitle>How should multiple filters work together?</FilterModeTitle>
          <FilterModeDescription>
            Choose how you want to combine different types of filters (categories, tags, and cities).
          </FilterModeDescription>
          <RadioGroup>
            <RadioLabel checked={filterMode === 'AND'}>
              <input
                type="radio"
                name="filterMode"
                value="AND"
                checked={filterMode === 'AND'}
                onChange={e => setFilterMode(e.target.value)}
              />
              Match ALL filters (AND)
            </RadioLabel>
            <RadioLabel checked={filterMode === 'OR'}>
              <input
                type="radio"
                name="filterMode"
                value="OR"
                checked={filterMode === 'OR'}
                onChange={e => setFilterMode(e.target.value)}
              />
              Match ANY filter (OR)
            </RadioLabel>
          </RadioGroup>
          <FilterExplanation>
            {filterMode === 'AND' 
              ? "Contacts must match all selected filters to appear in the results. For example, if you select 'Founder' and 'Milan', only founders in Milan will be shown."
              : "Contacts matching any of the selected filters will appear in the results. For example, if you select 'Founder' and 'Milan', you'll see all founders and all contacts in Milan."}
          </FilterExplanation>
        </FilterModeContainer>
        
        <FilterGrid>
          <FilterGroup>
            <FilterLabel htmlFor="filter-type">What do you want to filter by?</FilterLabel>
            <Select 
              id="filter-type"
              value={newFilter.type}
              onChange={e => setNewFilter({...newFilter, type: e.target.value, value: ''})}
            >
              <option value="category">Contact Category</option>
              <option value="tag">Tag</option>
              <option value="city">City</option>
            </Select>
          </FilterGroup>
          
          <FilterGroup>
            <FilterLabel htmlFor="filter-value">Select a value to filter</FilterLabel>
            {newFilter.type === 'category' && (
              <Select 
                id="filter-value"
                value={newFilter.value}
                onChange={e => setNewFilter({...newFilter, value: e.target.value})}
              >
                <option value="">Choose a category...</option>
                {ContactCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            )}
            
            {newFilter.type === 'tag' && (
              <Select 
                id="filter-value"
                value={newFilter.value}
                onChange={e => setNewFilter({...newFilter, value: e.target.value})}
              >
                <option value="">Choose a tag...</option>
                {allTags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </Select>
            )}
            
            {newFilter.type === 'city' && (
              <Select 
                id="filter-value"
                value={newFilter.value}
                onChange={e => setNewFilter({...newFilter, value: e.target.value})}
              >
                <option value="">Choose a city...</option>
                {allCities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </Select>
            )}
          </FilterGroup>
        </FilterGrid>
        
        <FilterActions>
          <Button onClick={handleClearFilters}>Clear All Filters</Button>
          <PrimaryButton onClick={handleAddFilter}>Add Filter</PrimaryButton>
        </FilterActions>

        {activeFilters.categories.length > 0 || activeFilters.tags.length > 0 || activeFilters.cities.length > 0 ? (
          <>
            <ActiveFiltersTitle>Active Filters:</ActiveFiltersTitle>
            {renderActiveFilters()}
          </>
        ) : (
          <FilterExplanation>
            No filters applied. Add filters above to refine the contact list.
          </FilterExplanation>
        )}
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
                    <TableHeader key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHeader>
                  ))}
                </tr>
              ))}
            </TableHead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <tr>
                  <TableCell colSpan={columns.length} style={{ textAlign: 'center' }}>
                    No contacts found
                  </TableCell>
                </tr>
              )}
            </tbody>
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
    </PageContainer>
  );
};

export default Lists; 