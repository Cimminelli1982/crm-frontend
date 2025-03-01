import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';

// ... (keep all the previous styled components)

const CONTACT_CATEGORIES = [
  'Professional Investor',
  'Founder',
  'Manager',
  'Team',
  'Friend or Family',
  'Media',
  'Institution'
];

const RecentContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  // ... (keep previous code for date range, fetch data, etc.)

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
                  <td>
                    {contact.first_name || contact.last_name ? (
                      contact.linkedin ? (
                        <a 
                          href={contact.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {`${contact.first_name || ''} ${contact.last_name || ''}`}
                        </a>
                      ) : (
                        <a 
                          href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${contact.first_name || ''} ${contact.last_name || ''}`)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {`${contact.first_name || ''} ${contact.last_name || ''}`}
                        </a>
                      )
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {contact.email ? (
                      <a 
                        href={`https://mail.superhuman.com/search/${encodeURIComponent(`${contact.first_name || ''} ${contact.last_name || ''}`)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {contact.email}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {contact.mobile ? (
                      <a 
                        href={`https://wa.me/${contact.mobile.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {contact.mobile}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <select
                      value={contact.contact_category || ''}
                      onChange={(e) => {
                        const newCategory = e.target.value;
                        
                        const updateCategory = async () => {
                          try {
                            const { error } = await supabase
                              .from('contacts')
                              .update({ contact_category: newCategory || null })
                              .eq('id', contact.id);
                            
                            if (error) throw error;
                            
                            // Optimistically update local state
                            setContacts(prev => prev.map(c => 
                              c.id === contact.id 
                                ? { ...c, contact_category: newCategory || null } 
                                : c
                            ));
                          } catch (error) {
                            console.error('Error updating category:', error);
                            alert('Failed to update category');
                          }
                        };
                        
                        updateCategory();
                      }}
                      style={{ width: '100%' }}
                    >
                      <option value="">Select Category</option>
                      {CONTACT_CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </td>
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
