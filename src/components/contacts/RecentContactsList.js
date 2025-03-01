import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';

const Container = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-top: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ContactTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const TableHead = styled.thead`
  background-color: #f8f9fa;
  
  th {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 2px solid #dee2e6;
  }
`;

const TableBody = styled.tbody`
  tr {
    &:hover {
      background-color: #f8f9fa;
    }
  }
  
  td {
    padding: 0.75rem;
    border-bottom: 1px solid #dee2e6;
  }
`;

const ActionButton = styled.button`
  background-color: ${props => props.skip ? '#dc3545' : '#0070f3'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  margin-right: 0.5rem;
  
  &:hover {
    background-color: ${props => props.skip ? '#c82333' : '#0060df'};
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const PageButton = styled.button`
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  background: ${props => props.active ? '#0070f3' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  
  &:hover:not(:disabled) {
    background: ${props => props.active ? '#0060df' : '#f8f9fa'};
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
`;

const RecentContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Memoize static values
  const rowsPerPage = useMemo(() => 10, []); // Increased for better UX
  
  // Memoize date calculation
  const thirtyDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  }, []);
  
  // Centralized fetch logic with error handling
  const fetchData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Fetch count and contacts in parallel
      const [countResponse, contactsResponse] = await Promise.all([
        supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .neq('contact_category', 'Skip')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('contacts')
          .select('*')
          .neq('contact_category', 'Skip')
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false })
          .range(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage - 1)
      ]);
      
      // Handle count
      if (countResponse.error) {
        console.error('Error getting count:', countResponse.error);
        setTotalCount(0);
      } else {
        setTotalCount(countResponse.count || 0);
      }
      
      // Handle contacts
      if (contactsResponse.error) {
        console.error('Error fetching contacts:', contactsResponse.error);
        setContacts([]);
      } else {
        setContacts(contactsResponse.data || []);
      }
    } catch (error) {
      console.error('Exception in fetchData:', error);
      setContacts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, thirtyDaysAgo]);
  
  // Optimize useEffect to minimize unnecessary calls
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Memoize pagination calculation
  const totalPages = useMemo(() => 
    Math.ceil(totalCount / rowsPerPage), 
    [totalCount, rowsPerPage]
  );
  
  // Optimized skip contact handler
  const handleSkipContact = useCallback(async (contactId) => {
    if (!window.confirm('Are you sure you want to mark this contact as Skip?')) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ contact_category: 'Skip' })
        .eq('id', contactId);
      
      if (error) throw error;
      
      // Update state optimistically
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      console.error('Failed to skip contact:', error);
      alert('Failed to mark contact as Skip');
    }
  }, []);
  
  // Pagination handlers
  const goToFirstPage = useCallback(() => setCurrentPage(0), []);
  const goToPreviousPage = useCallback(() => 
    setCurrentPage(prev => Math.max(0, prev - 1)), []);
  const goToNextPage = useCallback(() => 
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1)), [totalPages]);
  const goToLastPage = useCallback(() => 
    setCurrentPage(totalPages > 0 ? totalPages - 1 : 0), [totalPages]);
  
  return (
    <Container style={{ position: 'relative' }}>
      {loading && (
        <LoadingOverlay>
          <p>Loading contacts...</p>
        </LoadingOverlay>
      )}
      
      <Header>
        <h2>Contacts Added in Last 30 Days</h2>
      </Header>
      
      {!loading && contacts.length === 0 ? (
        <p>No contacts found in the last 30 days.</p>
      ) : (
        <>
          <ContactTable>
            <TableHead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </TableHead>
            <TableBody>
              {contacts.map(contact => (
                <tr key={contact.id}>
                  <td>{`${contact.first_name || ''} ${contact.last_name || ''}`}</td>
                  <td>{contact.email || '-'}</td>
                  <td>{contact.mobile || '-'}</td>
                  <td>{contact.contact_category || '-'}</td>
                  <td>
                    <Link to={`/contacts/edit/${contact.id}`}>
                      <ActionButton>Edit</ActionButton>
                    </Link>
                    <ActionButton 
                      skip 
                      onClick={() => handleSkipContact(contact.id)}
                    >
                      Skip
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </TableBody>
          </ContactTable>
          
          <PaginationControls>
            <PageButton 
              onClick={goToFirstPage} 
              disabled={currentPage === 0}
            >
              First
            </PageButton>
            <PageButton 
              onClick={goToPreviousPage} 
              disabled={currentPage === 0}
            >
              Previous
            </PageButton>
            
            <span style={{ padding: '0.5rem' }}>
              Page {currentPage + 1} of {totalPages > 0 ? totalPages : 1}
              {' '} (Total: {totalCount})
            </span>
            
            <PageButton 
              onClick={goToNextPage} 
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </PageButton>
            <PageButton 
              onClick={goToLastPage} 
              disabled={currentPage >= totalPages - 1}
            >
              Last
            </PageButton>
          </PaginationControls>
        </>
      )}
    </Container>
  );
};

export default RecentContactsList;
