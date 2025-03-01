import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';

const COMPANY_CATEGORIES = [
  'Tech',
  'Finance',
  'Consulting',
  'Startup',
  'Enterprise',
  'Non-Profit',
  'Education',
  'Healthcare'
];

const CONTACT_CATEGORIES = [
  'Professional Investor',
  'Founder',
  'Manager',
  'Team',
  'Advisor',
  'Friend or Family',
  'Media',
  'Institution'
];

const KEEP_IN_TOUCH_FREQUENCIES = [
  'Weekly',
  'Monthly',
  'Quarterly',
  'Twice a Year',
  'Once a Year',
  'Do not keep in touch'
];

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
  background-color: ${props => props.skip ? '#dc3545' : props.merge ? '#ffc107' : '#0070f3'};
  color: ${props => props.merge ? '#212529' : 'white'};
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  margin-right: 0.5rem;
  &:hover {
    background-color: ${props => props.skip ? '#c82333' : props.merge ? '#e0a800' : '#0060df'};
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

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  &:hover {
    color: #0070f3;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  font-size: 1rem;
`;

const SearchResults = styled.div`
  margin-top: 1rem;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const SearchResultItem = styled.div`
  padding: 0.75rem;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  &:hover {
    background-color: #f8f9fa;
  }
  &:last-child {
    border-bottom: none;
  }
`;

const MergeForm = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
`;

const MergeColumn = styled.div`
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const ColumnTitle = styled.h3`
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #ddd;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  background-color: ${props => props.primary ? '#0070f3' : '#f8f9fa'};
  color: ${props => props.primary ? 'white' : '#333'};
  &:hover {
    background-color: ${props => props.primary ? '#0060df' : '#e9ecef'};
  }
`;

const RecentContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [targetContact, setTargetContact] = useState(null);
  const [mergedData, setMergedData] = useState({});
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [companyData, setCompanyData] = useState({
    name: '',
    website: '',
    category: '',
    city: '',
    nation: ''
  });

  const getThirtyDaysAgoRange = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    return {
      start: thirtyDaysAgo.toISOString(),
      end: now.toISOString()
    };
  }, []);

  const rowsPerPage = useMemo(() => 50, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [countResponse, contactsResponse] = await Promise.all([
        supabase
          .from('contacts')
          .select('*, companies(*)', { count: 'exact', head: true })
          .gte('created_at', getThirtyDaysAgoRange.start)
          .lte('created_at', getThirtyDaysAgoRange.end)
          .or(`contact_category.neq.Skip,contact_category.is.null`),
        supabase
          .from('contacts')
          .select('*, companies(*)')
          .gte('created_at', getThirtyDaysAgoRange.start)
          .lte('created_at', getThirtyDaysAgoRange.end)
          .or(`contact_category.neq.Skip,contact_category.is.null`)
          .order('created_at', { ascending: false })
          .range(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage - 1)
      ]);
      if (countResponse.error) {
        setTotalCount(0);
      } else {
        setTotalCount(countResponse.count || 0);
      }
      if (contactsResponse.error) {
        setContacts([]);
      } else {
        setContacts(contactsResponse.data || []);
      }
    } catch (error) {
      setContacts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, getThirtyDaysAgoRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = useMemo(() => 
    Math.ceil(totalCount / rowsPerPage), 
    [totalCount, rowsPerPage]
  );

  const handleSkipContact = useCallback(async (contactId) => {
    if (!window.confirm('Are you sure you want to mark this contact as Skip?')) return;
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ contact_category: 'Skip' })
        .eq('id', contactId);
      if (error) throw error;
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      alert('Failed to mark contact as Skip');
    }
  }, []);

  const handleOpenMerge = useCallback((contact) => {
    setSelectedContact(contact);
    setShowMergeModal(true);
    setMergedData({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      email2: contact.email2 || '',
      email3: contact.email3 || '',
      mobile: contact.mobile || '',
      linkedin: contact.linkedin || '',
      contact_category: contact.contact_category || '',
      keep_in_touch_frequency: contact.keep_in_touch_frequency || ''
    });
  }, []);

  const handleSearch = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or(
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`,
        )
        .neq('id', selectedContact?.id)
        .limit(10);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      setSearchResults([]);
    }
  }, [selectedContact]);

  const handleSelectTarget = useCallback((contact) => {
    setTargetContact(contact);
    setSearchResults([]);
    setSearchTerm('');
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setMergedData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleMerge = useCallback(async () => {
    if (!selectedContact || !targetContact) return;
    const confirmMessage = `Are you sure you want to merge these contacts?\n\nThis will update ${selectedContact.first_name || ''} ${selectedContact.last_name || ''} with the merged data and delete ${targetContact.first_name || ''} ${targetContact.last_name || ''}.`;
    if (!window.confirm(confirmMessage)) return;
    try {
      const { error: updateError } = await supabase
        .from('contacts')
        .update(mergedData)
        .eq('id', selectedContact.id);
      if (updateError) throw updateError;
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', targetContact.id);
      if (deleteError) throw deleteError;
      await supabase
        .from('interactions')
        .update({ contact_id: selectedContact.id })
        .eq('contact_id', targetContact.id);
      setContacts(prev => prev.map(c => 
        c.id === selectedContact.id 
          ? { ...c, ...mergedData } 
          : c.id === targetContact.id 
            ? null 
            : c
      ).filter(Boolean));
      setShowMergeModal(false);
      setSelectedContact(null);
      setTargetContact(null);
      setMergedData({});
      alert('Contacts merged successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to merge contacts: ' + error.message);
    }
  }, [selectedContact, targetContact, mergedData, fetchData]);

  const handleOpenCompanyModal = useCallback(async (contact) => {
    setCurrentContact(contact);
    setCompanyData({
      name: '',
      website: '',
      category: '',
      city: '',
      nation: ''
    });
    if (contact.companies) {
      setCompanyData({
        name: contact.companies.name || '',
        website: contact.companies.website || '',
        category: contact.companies.category || '',
        city: contact.companies.city || '',
        nation: contact.companies.nation || ''
      });
    } else {
      const emailDomain = contact.email 
        ? contact.email.split('@')[1] 
        : '';
      if (emailDomain) {
        try {
          const { data: existingCompany } = await supabase
            .from('companies')
            .select('*')
            .eq('website', emailDomain)
            .single();
          if (existingCompany) {
            setCompanyData({
              name: existingCompany.name || '',
              website: existingCompany.website || '',
              category: existingCompany.category || '',
              city: existingCompany.city || '',
              nation: existingCompany.nation || ''
            });
          }
        } catch (error) {}
      }
    }
    setShowCompanyModal(true);
  }, []);

  const handleSaveCompany = useCallback(async () => {
    try {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('*')
        .eq('website', companyData.website)
        .single();
      let companyId;
      if (existingCompany) {
        await supabase
          .from('companies')
          .update(companyData)
          .eq('id', existingCompany.id);
        companyId = existingCompany.id;
      } else {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert(companyData)
          .select()
          .single();
        companyId = newCompany.id;
      }
      await supabase
        .from('contacts')
        .update({ company_id: companyId })
        .eq('id', currentContact.id);
      fetchData();
      setShowCompanyModal(false);
    } catch (error) {
      alert('Failed to save company');
    }
  }, [companyData, currentContact, fetchData]);

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
                <th>Company</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Category</th>
                <th>Keep in Touch</th>
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
                    {contact.companies ? (
                      <a 
                        href={contact.companies.website ? 
                          (contact.companies.website.startsWith('http') ? 
                            contact.companies.website : 
                            `https://${contact.companies.website}`) : 
                          '#'
                        } 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {contact.companies.name}
                      </a>
                    ) : (
                      <ActionButton onClick={() => handleOpenCompanyModal(contact)}>
                        Add Company
                      </ActionButton>
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
                      <a 
                        href={`https://app.timelines.ai/search/?s=${encodeURIComponent(`${contact.first_name || ''} ${contact.last_name || ''}`)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Search
                      </a>
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
                            setContacts(prev => prev.map(c => 
                              c.id === contact.id 
                                ? { ...c, contact_category: newCategory || null } 
                                : c
                            ));
                          } catch (error) {
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
                    <select
                      value={contact.keep_in_touch_frequency || ''}
                      onChange={(e) => {
                        const newFrequency = e.target.value;
                        const updateFrequency = async () => {
                          try {
                            const { error } = await supabase
                              .from('contacts')
                              .update({ keep_in_touch_frequency: newFrequency || null })
                              .eq('id', contact.id);
                            if (error) throw error;
                            setContacts(prev => prev.map(c => 
                              c.id === contact.id 
                                ? { ...c, keep_in_touch_frequency: newFrequency || null } 
                                : c
                            ));
                          } catch (error) {
                            alert('Failed to update keep in touch frequency');
                          }
                        };
                        updateFrequency();
                      }}
                      style={{ width: '100%' }}
                    >
                      <option value="">Select Frequency</option>
                      {KEEP_IN_TOUCH_FREQUENCIES.map(frequency => (
                        <option key={frequency} value={frequency}>
                          {frequency}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Link to={`/contacts/edit/${contact.id}`}>
                      <ActionButton>Edit</ActionButton>
                    </Link>
                    <ActionButton 
                      merge
                      onClick={() => handleOpenMerge(contact)}
                    >
                      Merge
                    </ActionButton>
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
      {showMergeModal && selectedContact && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Merge Contacts</h2>
              <CloseButton onClick={() => setShowMergeModal(false)}>×</CloseButton>
            </ModalHeader>
            <SearchContainer>
              <Label>Search for a contact to merge with:</Label>
              <SearchInput
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Type to search..."
              />
              {searchResults.length > 0 && (
                <SearchResults>
                  {searchResults.map(contact => (
                    <SearchResultItem 
                      key={contact.id}
                      onClick={() => handleSelectTarget(contact)}
                    >
                      {`${contact.first_name || ''} ${contact.last_name || ''}`} - {contact.email || 'No email'}
                    </SearchResultItem>
                  ))}
                </SearchResults>
              )}
            </SearchContainer>
            {targetContact && (
              <>
                <MergeForm>
                  <MergeColumn>
                    <ColumnTitle>Primary Contact</ColumnTitle>
                    <p>
                      <strong>Name:</strong> {selectedContact.first_name || ''} {selectedContact.last_name || ''}<br />
                      <strong>Email:</strong> {selectedContact.email || 'None'}<br />
                      <strong>Mobile:</strong> {selectedContact.mobile || 'None'}<br />
                      <strong>Category:</strong> {selectedContact.contact_category || 'None'}<br />
                      <strong>Keep in Touch:</strong> {selectedContact.keep_in_touch_frequency || 'None'}
                    </p>
                  </MergeColumn>
                  <MergeColumn>
                    <ColumnTitle>Secondary Contact (will be deleted)</ColumnTitle>
                    <p>
                      <strong>Name:</strong> {targetContact.first_name || ''} {targetContact.last_name || ''}<br />
                      <strong>Email:</strong> {targetContact.email || 'None'}<br />
                      <strong>Mobile:</strong> {targetContact.mobile || 'None'}<br />
                      <strong>Category:</strong> {targetContact.contact_category || 'None'}<br />
                      <strong>Keep in Touch:</strong> {targetContact.keep_in_touch_frequency || 'None'}
                    </p>
                  </MergeColumn>
                </MergeForm>
                <h3 style={{ margin: '1.5rem 0' }}>Merged Contact Information</h3>
                <MergeForm>
                  <FormGroup>
                    <Label>First Name</Label>
                    <Input
                      type="text"
                      value={mergedData.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Last Name</Label>
                    <Input
                      type="text"
                      value={mergedData.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Primary Email</Label>
                    <Input
                      type="email"
                      value={mergedData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Secondary Email</Label>
                    <Input
                      type="email"
                      value={mergedData.email2 || ''}
                      onChange={(e) => handleInputChange('email2', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Third Email</Label>
                    <Input
                      type="email"
                      value={mergedData.email3 || ''}
                      onChange={(e) => handleInputChange('email3', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Mobile</Label>
                    <Input
                      type="text"
                      value={mergedData.mobile || ''}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>LinkedIn</Label>
                    <Input
                      type="text"
                      value={mergedData.linkedin || ''}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Category</Label>
                    <select
                      value={mergedData.contact_category || ''}
                      onChange={(e) => handleInputChange('contact_category', e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="">Select Category</option>
                      {CONTACT_CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </FormGroup>
                  <FormGroup>
                    <Label>Keep in Touch</Label>
                    <select
                      value={mergedData.keep_in_touch_frequency || ''}
                      onChange={(e) => handleInputChange('keep_in_touch_frequency', e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="">Select Frequency</option>
                      {KEEP_IN_TOUCH_FREQUENCIES.map(frequency => (
                        <option key={frequency} value={frequency}>
                          {frequency}
                        </option>
                      ))}
                    </select>
                  </FormGroup>
                </MergeForm>
                <ButtonGroup>
                  <Button onClick={() => {
                    setTargetContact(null);
                    setMergedData({
                      first_name: selectedContact.first_name || '',
                      last_name: selectedContact.last_name || '',
                      email: selectedContact.email || '',
                      email2: selectedContact.email2 || '',
                      email3: selectedContact.email3 || '',
                      mobile: selectedContact.mobile || '',
                      linkedin: selectedContact.linkedin || '',
                      contact_category: selectedContact.contact_category || '',
                      keep_in_touch_frequency: selectedContact.keep_in_touch_frequency || ''
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button primary onClick={handleMerge}>
                    Merge Contacts
                  </Button>
                </ButtonGroup>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
      {showCompanyModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Add/Edit Company</h2>
              <CloseButton onClick={() => setShowCompanyModal(false)}>×</CloseButton>
            </ModalHeader>
            <h3>Contact Details</h3>
            <p>
              <strong>Name:</strong> {currentContact.first_name} {currentContact.last_name}<br />
              <strong>Email:</strong> {currentContact.email}
            </p>
            <h3>Company Information</h3>
            <MergeForm>
              <FormGroup>
                <Label>Company Name</Label>
                <Input
                  type="text"
                  value={companyData.name}
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev, 
                    name: e.target.value
                  }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Website</Label>
                <Input
                  type="text"
                  value={companyData.website}
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev, 
                    website: e.target.value
                  }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Category</Label>
                <select
                  value={companyData.category}
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev, 
                    category: e.target.value
                  }))}
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  <option value="">Select Category</option>
                  {COMPANY_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup>
                <Label>City</Label>
                <Input
                  type="text"
                  value={companyData.city}
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev, 
                    city: e.target.value
                  }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Nation</Label>
                <Input
                  type="text"
                  value={companyData.nation}
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev, 
                    nation: e.target.value
                  }))}
                />
              </FormGroup>
            </MergeForm>
            <ButtonGroup>
              <Button onClick={() => setShowCompanyModal(false)}>Cancel</Button>
              <Button primary onClick={handleSaveCompany}>Save Company</Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default RecentContactsList;
