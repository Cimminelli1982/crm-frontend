import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { format, parseISO, addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';
import ContactsModal from '../modals/ContactsModal';
import CompanyModal from '../modals/CompanyModal';
import TagsModal from '../modals/TagsModal';
import KeepInTouchModal from '../modals/KeepInTouchModal';
import CategoryModal from '../modals/CategoryModal';
import LastInteractionModal from '../modals/LastInteractionModal';
import Modal from 'react-modal';

// Set the app element for react-modal
Modal.setAppElement('#root');

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: opacity 0.2s ease-in-out;
  
  p {
    background-color: white;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-weight: 500;
  }
`;

const ContactTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 1.5rem;
  table-layout: fixed;
  
  th:nth-child(1) { width: 20%; }  /* Name */
  th:nth-child(2) { width: 15%; }  /* Company */
  th:nth-child(3) { width: 15%; }  /* Category */
  th:nth-child(4) { width: 20%; }  /* Tags */
  th:nth-child(5) { width: 10%; }  /* Keep in Touch */
  th:nth-child(6) { width: 10%; }  /* Last Interaction */
  th:nth-child(7) { width: 10%; }  /* Next Due */
`;

const TableHead = styled.thead`
  background-color: #f9fafb;
  
  th {
    padding: 0.875rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    color: #4b5563;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 10;
    white-space: nowrap;
  }
`;

const TableBody = styled.tbody`
  tr {
    &:hover {
      background-color: #f9fafb;
    }
    
    td {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.875rem;
      color: #1f2937;
    }
  }
`;

const ClickableCell = styled.td`
  cursor: pointer;
  position: relative;
  
  &:hover {
    background-color: rgba(59, 130, 246, 0.05);
  }
  
  .cell-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  background-color: ${props => {
    switch (props.category) {
      case 'Client': return '#e0f2fe';
      case 'Lead': return '#fef3c7';
      case 'Partner': return '#f3e8ff';
      case 'Vendor': return '#dcfce7';
      case 'Skip': return '#f3f4f6';
      default: return '#e5e7eb';
    }
  }};
  color: ${props => {
    switch (props.category) {
      case 'Client': return '#0369a1';
      case 'Lead': return '#92400e';
      case 'Partner': return '#6b21a8';
      case 'Vendor': return '#15803d';
      case 'Skip': return '#4b5563';
      default: return '#374151';
    }
  }};
  font-weight: 500;
`;

const KeepInTouchBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  background-color: ${props => {
    switch (props.frequency) {
      case 'Weekly': return '#fee2e2';
      case 'Monthly': return '#fef3c7';
      case 'Quarterly': return '#e0f2fe';
      case 'Twice per Year': return '#dcfce7';
      case 'Once per Year': return '#f3e8ff';
      case 'Do not keep': return '#f3f4f6';
      default: return '#fecaca';
    }
  }};
  color: ${props => {
    switch (props.frequency) {
      case 'Weekly': return '#b91c1c';
      case 'Monthly': return '#92400e';
      case 'Quarterly': return '#0369a1';
      case 'Twice per Year': return '#15803d';
      case 'Once per Year': return '#6b21a8';
      case 'Do not keep': return '#4b5563';
      default: return '#b91c1c';
    }
  }};
  font-weight: 500;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  background-color: #e5e7eb;
  color: #374151;
  font-weight: 500;
`;

const DateCell = styled.td`
  color: ${props => props.isOverdue ? '#dc2626' : props.isUpcoming ? '#059669' : '#6b7280'};
  font-weight: ${props => (props.isOverdue || props.isUpcoming) ? '500' : 'normal'};
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => props.active ? `
    background-color: ${props.color};
    color: white;
    border: none;
  ` : `
    background-color: white;
    color: ${props.color};
    border: 1px solid ${props.color};
  `}
  
  &:hover {
    opacity: 0.9;
  }
  
  span.count {
    background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : props.color};
    color: ${props => props.active ? 'white' : 'white'};
    padding: 0.125rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.75rem;
  }
`;

const calculateNextDueDate = (lastInteraction, frequency) => {
  if (!lastInteraction || !frequency || frequency === 'Do not keep') return null;
  
  try {
    const lastDate = new Date(lastInteraction);
    if (isNaN(lastDate.getTime())) return null;
    
    switch (frequency) {
      case 'Weekly':
        return addWeeks(lastDate, 1);
      case 'Monthly':
        return addMonths(lastDate, 1);
      case 'Quarterly':
        return addMonths(lastDate, 3);
      case 'Twice per Year':
        return addMonths(lastDate, 6);
      case 'Once per Year':
        return addDays(lastDate, 365);
      default:
        return null;
    }
  } catch (error) {
    console.error('Error calculating next due date:', error);
    return null;
  }
};

const KeepInTouchTable = () => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showKeepInTouchModal, setShowKeepInTouchModal] = useState(false);
  const [showLastInteractionModal, setShowLastInteractionModal] = useState(false);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState(null);
  const [filterCounts, setFilterCounts] = useState({ overdue: 0, upcoming: 0, needFixing: 0 });
  
  useEffect(() => {
    fetchContacts();
  }, []);
  
  useEffect(() => {
    applyFilter(activeFilter);
    updateFilterCounts();
  }, [contacts, activeFilter]);
  
  // Calculate and update filter counts
  const updateFilterCounts = () => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    setFilterCounts({
      overdue: contacts.filter(c => c.nextDueDate && c.nextDueDate < today).length,
      upcoming: contacts.filter(c => 
        c.nextDueDate && 
        c.nextDueDate >= today && 
        c.nextDueDate <= nextWeek
      ).length,
      needFixing: contacts.filter(c => 
        !c.nextDueDate && 
        c.keep_in_touch_frequency
      ).length
    });
  };
  
  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          company_info:company_id(name),
          tags:contact_tags(tag_id, tags(name))
        `)
        .in('keep_in_touch_frequency', ['Weekly', 'Monthly', 'Quarterly', 'Twice per Year', 'Once per Year'])
        .neq('contact_category', 'Skip');
        
      if (error) throw error;
      
      // Process contacts data
      const processedContacts = data.map(contact => ({
        ...contact,
        company: contact.company_info?.name || contact.company,
        tags: contact.tags?.map(t => t.tags?.name).filter(Boolean) || [],
        nextDueDate: calculateNextDueDate(contact.last_interaction, contact.keep_in_touch_frequency)
      }));
      
      // Sort by next due date
      const sortedContacts = processedContacts.sort((a, b) => {
        if (!a.nextDueDate) return 1;
        if (!b.nextDueDate) return -1;
        return a.nextDueDate - b.nextDueDate;
      });
      
      setContacts(sortedContacts);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilter = (filter) => {
    if (!filter) {
      setFilteredContacts(contacts);
      return;
    }

    const today = new Date();
    const nextWeek = addDays(today, 7);

    switch (filter) {
      case 'overdue':
        setFilteredContacts(contacts.filter(contact => 
          contact.nextDueDate && contact.nextDueDate < today
        ));
        break;
      case 'upcoming':
        setFilteredContacts(contacts.filter(contact => 
          contact.nextDueDate && 
          contact.nextDueDate >= today && 
          contact.nextDueDate <= nextWeek
        ));
        break;
      case 'needFixing':
        setFilteredContacts(contacts.filter(contact => 
          !contact.nextDueDate && 
          contact.keep_in_touch_frequency
        ));
        break;
      default:
        setFilteredContacts(contacts);
    }
  };
  
  const handleFilterClick = (filter) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };
  
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
      case 'keepInTouch':
        setShowKeepInTouchModal(true);
        break;
      case 'lastInteraction':
        setShowLastInteractionModal(true);
        break;
      default:
        break;
    }
  };
  
  const handleModalClose = () => {
    setShowContactsModal(false);
    setShowCompanyModal(false);
    setShowTagsModal(false);
    setShowCategoryModal(false);
    setShowKeepInTouchModal(false);
    setShowLastInteractionModal(false);
    setSelectedContactForEdit(null);
    fetchContacts(); // Refresh the list after modal closes
  };
  
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return '-';
      return format(parsedDate, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };
  
  return (
    <Container>
      {isLoading && (
        <LoadingOverlay>
          <p>Loading contacts...</p>
        </LoadingOverlay>
      )}
      
      {error && (
        <div style={{ 
          background: '#FEF2F2', 
          color: '#B91C1C', 
          padding: '1rem', 
          borderRadius: '0.375rem',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <FiltersContainer>
        <FilterButton
          color="#DC2626"
          active={activeFilter === 'overdue'}
          onClick={() => handleFilterClick('overdue')}
        >
          Overdue
          <span className="count">{filterCounts.overdue}</span>
        </FilterButton>
        
        <FilterButton
          color="#059669"
          active={activeFilter === 'upcoming'}
          onClick={() => handleFilterClick('upcoming')}
        >
          Upcoming
          <span className="count">{filterCounts.upcoming}</span>
        </FilterButton>
        
        <FilterButton
          color="#6B7280"
          active={activeFilter === 'needFixing'}
          onClick={() => handleFilterClick('needFixing')}
        >
          Need Fixing
          <span className="count">{filterCounts.needFixing}</span>
        </FilterButton>
      </FiltersContainer>
      
      <ContactTable>
        <TableHead>
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>Category</th>
            <th>Tags</th>
            <th>Keep in Touch</th>
            <th>Last Interaction</th>
            <th>Next Due</th>
          </tr>
        </TableHead>
        <TableBody>
          {filteredContacts.map(contact => {
            const nextDueDate = contact.nextDueDate;
            const isOverdue = nextDueDate && nextDueDate < new Date();
            const isUpcoming = nextDueDate && !isOverdue && nextDueDate < addDays(new Date(), 7);
            
            return (
              <tr key={contact.id}>
                <ClickableCell onClick={() => handleCellClick(contact, 'name')}>
                  <div className="cell-content">
                    {contact.first_name} {contact.last_name}
                  </div>
                </ClickableCell>
                
                <ClickableCell onClick={() => handleCellClick(contact, 'company')}>
                  <div className="cell-content">
                    {contact.company || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>}
                  </div>
                </ClickableCell>
                
                <ClickableCell onClick={() => handleCellClick(contact, 'category')}>
                  <div className="cell-content">
                    {contact.contact_category ? (
                      <CategoryBadge category={contact.contact_category}>
                        {contact.contact_category}
                      </CategoryBadge>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>
                    )}
                  </div>
                </ClickableCell>
                
                <ClickableCell onClick={() => handleCellClick(contact, 'tags')}>
                  <TagsContainer>
                    {contact.tags && contact.tags.length > 0 ? (
                      contact.tags.map((tag, index) => (
                        <Tag key={index}>{tag}</Tag>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No tags</span>
                    )}
                  </TagsContainer>
                </ClickableCell>
                
                <ClickableCell onClick={() => handleCellClick(contact, 'keepInTouch')}>
                  <div className="cell-content">
                    <KeepInTouchBadge frequency={contact.keep_in_touch_frequency}>
                      {contact.keep_in_touch_frequency}
                    </KeepInTouchBadge>
                  </div>
                </ClickableCell>
                
                <ClickableCell onClick={() => handleCellClick(contact, 'lastInteraction')}>
                  {formatDate(contact.last_interaction)}
                </ClickableCell>
                
                <DateCell isOverdue={isOverdue} isUpcoming={isUpcoming}>
                  {nextDueDate ? formatDate(nextDueDate) : '-'}
                </DateCell>
              </tr>
            );
          })}
        </TableBody>
      </ContactTable>
      
      {/* Modals */}
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
      
      {showKeepInTouchModal && selectedContactForEdit && (
        <KeepInTouchModal
          isOpen={showKeepInTouchModal}
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
    </Container>
  );
};

export default KeepInTouchTable; 