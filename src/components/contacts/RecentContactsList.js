// src/components/contacts/RecentContactsList.js
import React, { useEffect, useState } from 'react';
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
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  margin-right: 0.5rem;
  
  &:hover {
    background-color: #0060df;
  }
`;

const RecentContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchRecentContacts();
  }, []);
  
  async function fetchRecentContacts() {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('Error fetching recent contacts:', error);
      } else {
        setContacts(data || []);
      }
    } catch (error) {
      console.error('Exception fetching recent contacts:', error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Container>
      <h2>Recently Added Contacts</h2>
      
      {loading ? (
        <p>Loading recent contacts...</p>
      ) : contacts.length === 0 ? (
        <p>No contacts found.</p>
      ) : (
        <ContactTable>
          <TableHead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </TableHead>
          <TableBody>
            {contacts.map(contact => (
              <tr key={contact.id}>
                <td>{`${contact.first_name || ''} ${contact.last_name || ''}`}</td>
                <td>{contact.email}</td>
                <td>{contact.contact_category || '-'}</td>
                <td>
                  <Link to={`/contacts/edit/${contact.id}`}>
                    <ActionButton>Edit</ActionButton>
                  </Link>
                </td>
              </tr>
            ))}
          </TableBody>
        </ContactTable>
      )}
    </Container>
  );
};

export default RecentContactsList;
