import React, { useEffect, useState, useCallback } from 'react';
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

const RecentContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 20;
  
  const getContactsCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .neq('contact_category', 'Skip');
        
      console.log('Total contacts count:', count);
      
      if (error) {
        console.error('Error getting count:', error);
      } else {
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Exception in getContactsCount:', err);
    }
  }, []);
  
  const fetchRecentContacts = useCallback(async () => {
    setLoading(true);
    
    console.log('Fetching page:', currentPage);
    console.log('Range:', currentPage * rowsPerPage, 'to', (currentPage + 1) * rowsPerPage - 1);
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .neq('contact_category', 'Skip')
        .order('created_at', { ascending: false })
        .range(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage - 1);
        
      if (error) {
        console.error('Error fetching recent contacts:', error);
      } else {
        console.log(`Retrieved ${data?.length || 0} contacts`);
        setContacts(data || []);
      }
    } catch (error) {
      console.error('Exception fetching recent contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage]);
  
  const handleSkipContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to mark this contact as Skip?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ contact_category: 'Skip' })
        .eq('id', contactId);
          
      if (error) {
        console.error('Error updating contact:', error);
        alert('Failed to mark contact as Skip');
      } else {
        // Remove the contact from the current view
        setContacts(contacts.filter(c => c.id !== contactId));
        // Update total count
        setTotalCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Exception skipping contact:', error);
      alert('Failed to mark contact as Skip');
    }
  };
  
  useEffect(() => {
    fetchRecentContacts();
    getContactsCount();
  }, [currentPage, fetchRecentContacts, getContactsCount]);
  
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  console.log('Total pages calculated:', totalPages);
  
  return (
    <Container>
      <Header>
        <h2>Recently Added Contacts</h2>
      </Header>
      
      {loading ? (
        <p>Loading recent contacts...</p>
      ) : contacts.length === 0 ? (
        <p>No contacts found.</p>
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
          
          {/* Always show pagination if there are any contacts */}
          <PaginationControls>
            <PageButton 
              onClick={() => setCurrentPage(0)} 
              disabled={currentPage === 0}
            >
              First
            </PageButton>
            <PageButton 
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
              disabled={currentPage === 0}
            >
              Previous
            </PageButton>
            
            <span style={{ padding: '0.5rem' }}>
              Page {currentPage + 1} of {totalPages > 0 ? totalPages : 1}
              {' '} (Total: {totalCount})
            </span>
            
            <PageButton 
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} 
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </PageButton>
            <PageButton 
              onClick={() => setCurrentPage(totalPages > 0 ? totalPages - 1 : 0)} 
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
