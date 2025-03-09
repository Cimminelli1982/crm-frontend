import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';
import { FiEdit2, FiStar, FiTrash2, FiTag, FiPlus, FiCheck, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Container styling
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
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  
  p {
    background-color: white;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-weight: 500;
  }
`;

// Table styling
const ContactTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 1.5rem;
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
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #f3f4f6;
    }
    
    &.sortable {
      cursor: pointer;
      user-select: none;
    }
    
    .sort-icon {
      margin-left: 0.25rem;
      display: inline-flex;
      align-items: center;
    }
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.15s;
    
    &:hover {
      background-color: #f9fafb;
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  td {
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    color: #1f2937;
    vertical-align: middle;
    
    .cell-content {
      display: flex;
      align-items: center;
      position: relative;
      min-height: 24px;
    }
    
    .actions {
      display: none;
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background-color: white;
      padding-left: 0.5rem;
    }
    
    &:hover .actions {
      display: flex;
      gap: 0.25rem;
    }
    
    input, select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      background-color: white;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
      }
    }
  }
`;

const ActionButton = styled.button`
  background-color: transparent;
  border: none;
  color: #6b7280;
  width: 28px;
  height: 28px;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
  
  &.edit:hover {
    color: #3b82f6;
  }
  
  &.delete:hover {
    color: #ef4444;
  }
`;

// Star rating component
const StarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Star = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${props => props.filled ? '#f59e0b' : '#d1d5db'};
  font-size: 1.25rem;
  transition: transform 0.1s, color 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: scale(1.2);
    color: #f59e0b;
  }
`;

// Tag component
const Tag = styled.span`
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
  
  button {
    background: none;
    border: none;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.25rem;
    color: #6b7280;
    cursor: pointer;
    
    &:hover {
      color: #ef4444;
    }
  }
`;

// Pagination controls
const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 1rem 0;
`;

const PageButton = styled.button`
  background-color: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#4b5563'};
  border: 1px solid ${props => props.active ? '#3b82f6' : '#d1d5db'};
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  margin: 0 0.25rem;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.active ? '#2563eb' : '#f9fafb'};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  }
`;

const PageInfo = styled.div`
  margin: 0 0.75rem;
  font-size: 0.875rem;
  color: #4b5563;
`;

// Empty state component
const EmptyState = styled.div`
  padding: 3rem 0;
  text-align: center;
  
  h3 {
    font-size: 1.125rem;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }
`;

const RecentContactsList = ({ 
  defaultShowAll = false,
  defaultFilter = 'all'
}) => {
  // ... existing state variables
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Editing state
  const [editingContact, setEditingContact] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editData, setEditData] = useState({});
  
  // Sorting state
  const [sortField, setSortField] = useState('last_interaction');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Tags state
  const [contactTags, setContactTags] = useState({});
  
  // Fetch contacts
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query
      let query = supabase
        .from('contacts')
        .select('*, companies:company_id(*)')
        .neq('email', 'simone@cimminelli.com');
      
      // Apply sorting
      query = query.order(sortField, { 
        ascending: sortDirection === 'asc',
        nullsFirst: false
      });
      
      // Apply pagination
      const from = currentPage * 10;
      const to = from + 9;
      query = query.range(from, to);
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Fetch total count for pagination
      const { count: totalCount, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .neq('email', 'simone@cimminelli.com');
      
      if (countError) throw countError;
      
      setContacts(data || []);
      setTotalCount(totalCount || 0);
      setTotalPages(Math.ceil((totalCount || 0) / 10));
      
      // Fetch tags for each contact
      const contactIds = data?.map(contact => contact.id) || [];
      await fetchTagsForContacts(contactIds);
      
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortField, sortDirection]);
  
  // Fetch tags for contacts
  const fetchTagsForContacts = useCallback(async (contactIds) => {
    if (!contactIds || contactIds.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*, tag_id(*)')
        .in('contact_id', contactIds);
      
      if (error) throw error;
      
      // Group tags by contact ID
      const tagsMap = {};
      
      data?.forEach(tagRel => {
        if (!tagsMap[tagRel.contact_id]) {
          tagsMap[tagRel.contact_id] = [];
        }
        
        tagsMap[tagRel.contact_id].push({
          id: tagRel.id,
          name: tagRel.tag_id.name,
          tag_id: tagRel.tag_id.id
        });
      });
      
      setContactTags(tagsMap);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, []);
  
  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handle sort change
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set default direction
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle edit start
  const handleEditStart = (contact, field) => {
    setEditingContact(contact);
    setEditingField(field);
    setEditData({
      ...contact,
      [field]: contact[field] || ''
    });
  };
  
  // Handle field change
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle save
  const handleSave = async () => {
    if (!editingContact || !editingField) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('contacts')
        .update({ [editingField]: editData[editingField] })
        .eq('id', editingContact.id);
      
      if (error) throw error;
      
      // Update local state
      setContacts(contacts.map(c => 
        c.id === editingContact.id ? { ...c, [editingField]: editData[editingField] } : c
      ));
      
      // Reset editing state
      setEditingContact(null);
      setEditingField(null);
      setEditData({});
      
    } catch (err) {
      console.error('Error saving contact:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancel edit
  const handleCancel = () => {
    setEditingContact(null);
    setEditingField(null);
    setEditData({});
  };
  
  // Handle key events for editing
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  // Handle star rating click
  const handleStarClick = async (contactId, score) => {
    try {
      // Update in Supabase
      await supabase
        .from('contacts')
        .update({ score })
        .eq('id', contactId);
      
      // Update local state
      setContacts(contacts.map(c => 
        c.id === contactId ? { ...c, score } : c
      ));
    } catch (error) {
      console.error('Error updating contact score:', error);
      setError(error.message);
    }
  };
  
  // Pagination handlers
  const goToFirstPage = () => {
    setCurrentPage(0);
  };
  
  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };
  
  const goToLastPage = () => {
    setCurrentPage(totalPages - 1);
  };
  
  // Render the table
  return (
    <Container>
      {loading && (
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
      
      {!loading && contacts.length === 0 ? (
        <EmptyState>
          <h3>No contacts found</h3>
          <p>Try adjusting your filters or adding new contacts.</p>
        </EmptyState>
      ) : (
        <>
          <ContactTable>
            <TableHead>
              <tr>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('last_name')}
                >
                  Name
                  {sortField === 'last_name' && (
                    <span className="sort-icon">
                      {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('companies')}
                >
                  Company
                  {sortField === 'companies' && (
                    <span className="sort-icon">
                      {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Tags</th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('contact_category')}
                >
                  Category
                  {sortField === 'contact_category' && (
                    <span className="sort-icon">
                      {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('keep_in_touch_frequency')}
                >
                  Keep in Touch
                  {sortField === 'keep_in_touch_frequency' && (
                    <span className="sort-icon">
                      {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('score')}
                >
                  Score
                  {sortField === 'score' && (
                    <span className="sort-icon">
                      {sortDirection === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  )}
                </th>
              </tr>
            </TableHead>
            <TableBody>
              {contacts.map(contact => (
                <tr key={contact.id}>
                  <td>
                    <div className="cell-content">
                      {editingContact?.id === contact.id && editingField === 'name' ? (
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                          <input
                            name="first_name"
                            value={editData.first_name || ''}
                            onChange={handleFieldChange}
                            onKeyDown={handleKeyDown}
                            placeholder="First name"
                            autoFocus
                          />
                          <input
                            name="last_name"
                            value={editData.last_name || ''}
                            onChange={handleFieldChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Last name"
                          />
                          <ActionButton onClick={handleSave}>
                            <FiCheck />
                          </ActionButton>
                          <ActionButton onClick={handleCancel}>
                            <FiX />
                          </ActionButton>
                        </div>
                      ) : (
                        <>
                          {contact.first_name || contact.last_name ? (
                            <span style={{ fontWeight: '500' }}>
                              {`${contact.first_name || ''} ${contact.last_name || ''}`}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No name</span>
                          )}
                          
                          <div className="actions">
                            <ActionButton className="edit" onClick={() => handleEditStart(contact, 'name')}>
                              <FiEdit2 size={16} />
                            </ActionButton>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="cell-content">
                      {contact.companies ? (
                        <span>{contact.companies.name}</span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No company</span>
                      )}
                      
                      <div className="actions">
                        <ActionButton className="edit">
                          <FiEdit2 size={16} />
                        </ActionButton>
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="cell-content">
                      {editingContact?.id === contact.id && editingField === 'email' ? (
                        <div style={{ display: 'flex', width: '100%' }}>
                          <input
                            name="email"
                            type="email"
                            value={editData.email || ''}
                            onChange={handleFieldChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Email"
                            autoFocus
                            style={{ flex: 1 }}
                          />
                          <ActionButton onClick={handleSave}>
                            <FiCheck />
                          </ActionButton>
                          <ActionButton onClick={handleCancel}>
                            <FiX />
                          </ActionButton>
                        </div>
                      ) : (
                        <>
                          {contact.email ? (
                            <span>{contact.email}</span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No email</span>
                          )}
                          
                          <div className="actions">
                            <ActionButton className="edit" onClick={() => handleEditStart(contact, 'email')}>
                              <FiEdit2 size={16} />
                            </ActionButton>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="cell-content">
                      {editingContact?.id === contact.id && editingField === 'mobile' ? (
                        <div style={{ display: 'flex', width: '100%' }}>
                          <input
                            name="mobile"
                            value={editData.mobile || ''}
                            onChange={handleFieldChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Mobile"
                            autoFocus
                            style={{ flex: 1 }}
                          />
                          <ActionButton onClick={handleSave}>
                            <FiCheck />
                          </ActionButton>
                          <ActionButton onClick={handleCancel}>
                            <FiX />
                          </ActionButton>
                        </div>
                      ) : (
                        <>
                          {contact.mobile ? (
                            <span>{contact.mobile}</span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No mobile</span>
                          )}
                          
                          <div className="actions">
                            <ActionButton className="edit" onClick={() => handleEditStart(contact, 'mobile')}>
                              <FiEdit2 size={16} />
                            </ActionButton>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="cell-content">
                      {contactTags[contact.id]?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                          {contactTags[contact.id].map(tag => (
                            <Tag key={tag.id}>
                              {tag.name}
                              <button>
                                <FiX size={12} />
                              </button>
                            </Tag>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No tags</span>
                      )}
                      
                      <div className="actions">
                        <ActionButton className="edit">
                          <FiTag size={16} />
                        </ActionButton>
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="cell-content">
                      {editingContact?.id === contact.id && editingField === 'contact_category' ? (
                        <div style={{ display: 'flex', width: '100%' }}>
                          <select
                            name="contact_category"
                            value={editData.contact_category || ''}
                            onChange={handleFieldChange}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            style={{ flex: 1 }}
                          >
                            <option value="">Select category</option>
                            <option value="Team">Team</option>
                            <option value="Manager">Manager</option>
                            <option value="Professional Investor">Professional Investor</option>
                            <option value="Advisor">Advisor</option>
                          </select>
                          <ActionButton onClick={handleSave}>
                            <FiCheck />
                          </ActionButton>
                          <ActionButton onClick={handleCancel}>
                            <FiX />
                          </ActionButton>
                        </div>
                      ) : (
                        <>
                          {contact.contact_category ? (
                            <span>{contact.contact_category}</span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>
                          )}
                          
                          <div className="actions">
                            <ActionButton className="edit" onClick={() => handleEditStart(contact, 'contact_category')}>
                              <FiEdit2 size={16} />
                            </ActionButton>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="cell-content">
                      {editingContact?.id === contact.id && editingField === 'keep_in_touch_frequency' ? (
                        <div style={{ display: 'flex', width: '100%' }}>
                          <select
                            name="keep_in_touch_frequency"
                            value={editData.keep_in_touch_frequency || ''}
                            onChange={handleFieldChange}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            style={{ flex: 1 }}
                          >
                            <option value="">Select frequency</option>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Do not keep">Do not keep</option>
                          </select>
                          <ActionButton onClick={handleSave}>
                            <FiCheck />
                          </ActionButton>
                          <ActionButton onClick={handleCancel}>
                            <FiX />
                          </ActionButton>
                        </div>
                      ) : (
                        <>
                          {contact.keep_in_touch_frequency ? (
                            <span>{contact.keep_in_touch_frequency}</span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not set</span>
                          )}
                          
                          <div className="actions">
                            <ActionButton className="edit" onClick={() => handleEditStart(contact, 'keep_in_touch_frequency')}>
                              <FiEdit2 size={16} />
                            </ActionButton>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <StarContainer>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          filled={star <= (contact.score || 0)}
                          onClick={() => handleStarClick(contact.id, star)}
                        >
                          <FiStar />
                        </Star>
                      ))}
                    </StarContainer>
                  </td>
                </tr>
              ))}
            </TableBody>
          </ContactTable>
          
          {totalPages > 1 && (
            <PaginationControls>
              <PageButton onClick={goToFirstPage} disabled={currentPage === 0}>
                First
              </PageButton>
              <PageButton onClick={goToPrevPage} disabled={currentPage === 0}>
                Previous
              </PageButton>
              
              <PageInfo>
                Page {currentPage + 1} of {totalPages}
              </PageInfo>
              
              <PageButton onClick={goToNextPage} disabled={currentPage === totalPages - 1}>
                Next
              </PageButton>
              <PageButton onClick={goToLastPage} disabled={currentPage === totalPages - 1}>
                Last
              </PageButton>
            </PaginationControls>
          )}
        </>
      )}
    </Container>
  );
};

export default RecentContactsList;
  