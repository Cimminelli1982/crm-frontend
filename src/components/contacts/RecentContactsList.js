const RecentContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 5; // Changed to 5 to enable pagination with fewer contacts
  
  // Calculate the date 30 days ago
  const getThirtyDaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString();
  };
  
  const thirtyDaysAgo = getThirtyDaysAgo();
  
  const getContactsCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .neq('contact_category', 'Skip')
        .gte('created_at', thirtyDaysAgo); // Only count contacts from last 30 days
        
      console.log('Total contacts count in last 30 days:', count);
      
      if (error) {
        console.error('Error getting count:', error);
      } else {
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Exception in getContactsCount:', err);
    }
  }, [thirtyDaysAgo]);
  
  const fetchRecentContacts = useCallback(async () => {
    setLoading(true);
    
    console.log('Fetching page:', currentPage);
    console.log('Range:', currentPage * rowsPerPage, 'to', (currentPage + 1) * rowsPerPage - 1);
    console.log('Date filter:', thirtyDaysAgo);
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .neq('contact_category', 'Skip')
        .gte('created_at', thirtyDaysAgo) // Only get contacts from last 30 days
        .order('created_at', { ascending: false })
        .range(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage - 1);
        
      if (error) {
        console.error('Error fetching recent contacts:', error);
      } else {
        console.log(`Retrieved ${data?.length || 0} contacts from the last 30 days`);
        setContacts(data || []);
      }
    } catch (error) {
      console.error('Exception fetching recent contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, thirtyDaysAgo]);
  
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
        <h2>Contacts Added in Last 30 Days</h2>
      </Header>
      
      {loading ? (
        <p>Loading recent contacts...</p>
      ) : contacts.length === 0 ? (
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
