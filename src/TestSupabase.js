import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

const TestSupabase = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        console.log('Testing direct Supabase connection...');
        
        // Simple direct query
        const { data, error, count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact' })
          .limit(10);
        
        if (error) throw error;
        
        console.log(`Successfully retrieved ${data.length} contacts`);
        console.log('Sample contact:', data[0]);
        
        setContacts(data || []);
      } catch (err) {
        console.error('Supabase test error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Supabase Connection Test</h1>
      
      {loading && <p>Loading contacts from Supabase...</p>}
      
      {error && (
        <div style={{ color: 'red', marginBottom: '2rem' }}>
          <h2>Error:</h2>
          <p>{error}</p>
        </div>
      )}
      
      <h2>First 10 Contacts</h2>
      {contacts.length > 0 ? (
        <ul>
          {contacts.map(contact => (
            <li key={contact.id}>
              {contact.first_name} {contact.last_name} - {contact.email}
            </li>
          ))}
        </ul>
      ) : (
        <p>No contacts found in database.</p>
      )}
    </div>
  );
};

export default TestSupabase; 