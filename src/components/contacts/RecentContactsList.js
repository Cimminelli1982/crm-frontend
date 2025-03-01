import React, { useState, useMemo, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';

const COMPANY_CATEGORIES = [
  'Advisor', 'Corporate', 'Institution', 'Professional Investor', 'SKIP', 'SME',
  'Startup', 'Supplier', 'Media', 'Team', 'Angels Sharing Society'
];

const CONTACT_CATEGORIES = [
  'Professional Investor', 'Founder', 'Manager', 'Team', 'Advisor',
  'Friend or Family', 'Media', 'Institution'
];

const KEEP_IN_TOUCH_FREQUENCIES = [
  'Weekly', 'Monthly', 'Quarterly', 'Twice a Year', 'Once a Year', 'Do not keep in touch'
];

// Updated Styled Components
const Container = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin: 2rem 0;
  width: 100%;
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
  }
`;

const ContactTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 1rem;
`;

const TableHead = styled.thead`
  background: #f3f4f6;
  th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.8rem;
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    border-bottom: 2px solid #e5e7eb;
  }
`;

const TableBody = styled.tbody`
  tr {
    transition: background-color 0.2s ease;
    &:hover {
      background-color: #f9fafb;
    }
  }
  td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.9rem;
    color: #2d3748;
    vertical-align: middle;
  }
`;

const ActionButton = styled.button`
  background-color: ${props => props.skip ? '#ef4444' : props.merge ? '#facc15' : '#3b82f6'};
  color: ${props => props.merge ? '#1f2937' : 'white'};
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.875rem;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: background-color 0.2s ease, transform 0.1s ease;
  &:hover {
    background-color: ${props => props.skip ? '#dc2626' : props.merge ? '#e5a100' : '#2563eb'};
    transform: translateY(-2px);
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: #6b7280;
`;

const PageButton = styled.button`
  padding: 0.5rem 0.875rem;
  border: 1px solid #e5e7eb;
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#4a5568'};
  border-radius: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: background-color 0.2s ease, transform 0.1s ease;
  &:hover:not(:disabled) {
    background: ${props => props.active ? '#2563eb' : '#f9fafb'};
    transform: translateY(-2px);
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  font-size: 0.9rem;
  color: #6b7280;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: scaleIn 0.2s ease-out forwards;
  @keyframes scaleIn {
    from { transform: scale(0.95); }
    to { transform: scale(1); }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  h2 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s ease;
  &:hover { color: #3b82f6; }
`;

const SearchContainer = styled.div`
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  padding: 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: 100%;
  font-size: 0.875rem;
  color: #2d3748;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const SearchResults = styled.div`
  margin-top: 0.5rem;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SearchResultItem = styled.div`
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  font-size: 0.875rem;
  color: #2d3748;
  transition: background-color 0.2s ease, transform 0.1s ease;
  &:hover {
    background-color: #f9fafb;
    transform: translateX(2px);
  }
  &:last-child { border-bottom: none; }
`;

const MergeForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #4a5568;
`;

const Input = styled.input`
  padding: 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: 100%;
  font-size: 0.875rem;
  color: #2d3748;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const Select = styled.select`
  padding: 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: 100%;
  font-size: 0.875rem;
  color: #2d3748;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const MissingText = styled.span`
  color: #f87171; // Light red
  font-size: 0.9rem;
`;

const MergeColumn = styled.div`
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #2d3748;
`;

const ColumnTitle = styled.h3`
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #2d3748;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.25rem;
`;

const Button = styled.button`
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background-color: ${props => props.primary ? '#3b82f6' : '#e5e7eb'};
  color: ${props => props.primary ? 'white' : '#4a5568'};
  transition: background-color 0.2s ease, transform 0.1s ease;
  &:hover {
    background-color: ${props => props.primary ? '#2563eb' : '#d1d5db'};
    transform: translateY(-2px);
  }
`;

const CompanyInput = styled.input`
  padding: 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: 50%; // Halved width as requested
  font-size: 0.875rem;
  color: #2d3748;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const CompanyDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 150px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 50%; // Matches CompanyInput width
`;

const CompanyOption = styled.div`
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #2d3748;
  transition: background-color 0.2s ease, transform 0.1s ease;
  &:hover {
    background-color: #f9fafb;
    transform: translateX(2px);
  }
`;

const UnlinkButton = styled.button`
  margin-left: 0.625rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  color: #ef4444;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.1s ease;
  &:hover {
    color: #dc2626;
    transform: translateY(-2px);
  }
`;

const EditButton = styled.span`
  margin-left: 0.625rem;
  cursor: pointer;
  color: #3b82f6;
  font-size: 0.875rem;
  transition: color 0.2s ease, transform 0.1s ease;
  &:hover {
    color: #2563eb;
    transform: translateY(-2px);
  }
`;

const EmailButton = styled.span`
  margin-left: 0.625rem;
  cursor: pointer;
  color: #3b82f6;
  font-size: 0.875rem;
  transition: color 0.2s ease, transform 0.1s ease;
  &:hover {
    color: #2563eb;
    transform: translateY(-2px);
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
    nation: '',
    description: ''
  });
  const [companySearchTerm, setCompanySearchTerm] = useState({});
  const [companySuggestions, setCompanySuggestions] = useState({});
  const [showContactEditModal, setShowContactEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactEditData, setContactEditData] = useState({});

  const getThirtyDaysAgoRange = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    return { start: thirtyDaysAgo.toISOString(), end: now.toISOString() };
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

  const totalPages = useMemo(() => Math.ceil(totalCount / rowsPerPage), [totalCount, rowsPerPage]);

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
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
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
    setMergedData(prev => ({ ...prev, [field]: value }));
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
      name: companySearchTerm[contact.id] || '',
      website: '',
      category: '',
      city: '',
      nation: '',
      description: ''
    });
    if (contact.companies) {
      setCompanyData({
        name: contact.companies.name || '',
        website: contact.companies.website || '',
        category: contact.companies.category || '',
        city: contact.companies.city || '',
        nation: contact.companies.nation || '',
        description: contact.companies.description || ''
      });
    } else if (contact.email) {
      const emailDomain = contact.email.split('@')[1];
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
            nation: existingCompany.nation || '',
            description: existingCompany.description || ''
          });
        }
      } catch (error) {}
    }
    setCompanySearchTerm(prev => ({ ...prev, [contact.id]: '' }));
    setCompanySuggestions(prev => ({ ...prev, [contact.id]: [] }));
    setShowCompanyModal(true);
  }, [companySearchTerm]);

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

  const handleCompanySearch = useCallback(async (contactId, term) => {
    setCompanySearchTerm(prev => ({ ...prev, [contactId]: term }));
    if (term.length < 4) {
      setCompanySuggestions(prev => ({ ...prev, [contactId]: [] }));
      return;
    }
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${term}%`)
        .limit(5);
      if (error) throw error;
      setCompanySuggestions(prev => ({
        ...prev,
        [contactId]: data.length > 0 ? data : [{ name: 'Add a company', isAddOption: true }]
      }));
    } catch (error) {
      setCompanySuggestions(prev => ({ ...prev, [contactId]: [{ name: 'Add a company', isAddOption: true }] }));
    }
  }, []);

  const handleCompanySelect = useCallback(async (contactId, company) => {
    if (company.isAddOption) {
      handleOpenCompanyModal(contacts.find(c => c.id === contactId));
      return;
    }
    try {
      await supabase
        .from('contacts')
        .update({ company_id: company.id })
        .eq('id', contactId);
      fetchData();
      setCompanySearchTerm(prev => ({ ...prev, [contactId]: '' }));
      setCompanySuggestions(prev => ({ ...prev, [contactId]: [] }));
    } catch (error) {
      alert('Failed to assign company');
    }
  }, [contacts, handleOpenCompanyModal, fetchData]);

  const handleUnlinkCompany = useCallback(async (contactId) => {
    if (!window.confirm('Are you sure you want to unlink this company from the contact?')) return;
    try {
      await supabase
        .from('contacts')
        .update({ company_id: null })
        .eq('id', contactId);
      fetchData();
    } catch (error) {
      alert('Failed to unlink company');
    }
  }, [fetchData]);

  const goToFirstPage = useCallback(() => setCurrentPage(0), []);
  const goToPreviousPage = useCallback(() => setCurrentPage(prev => Math.max(0, prev - 1)), []);
  const goToNextPage = useCallback(() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1)), [totalPages]);
  const goToLastPage = useCallback(() => setCurrentPage(totalPages > 0 ? totalPages - 1 : 0), [totalPages]);

  const handleOpenContactEdit = useCallback((contact) => {
    setEditingContact(contact);
    setContactEditData({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      contact_category: contact.contact_category || '',
      mobile: contact.mobile || '',
      mobile2: contact.mobile2 || '',
      email: contact.email || '',
      email2: contact.email2 || '',
      email3: contact.email3 || '',
      linkedin: contact.linkedin || '',
      keep_in_touch_frequency: contact.keep_in_touch_frequency || ''
    });
    setShowContactEditModal(true);
  }, []);

  const handleContactInputChange = useCallback((field, value) => {
    setContactEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveContactEdit = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update(contactEditData)
        .eq('id', editingContact.id);
      if (error) throw error;
      setContacts(prev => prev.map(c =>
        c.id === editingContact.id ? { ...c, ...contactEditData } : c
      ));
      setShowContactEditModal(false);
      setEditingContact(null);
      setContactEditData({});
    } catch (error) {
      alert('Failed to update contact: ' + error.message);
    }
  }, [editingContact, contactEditData]);

  const handleEditCompany = useCallback((contact) => {
    setCurrentContact(contact);
    setCompanyData({
      name: contact.companies?.name || '',
      website: contact.companies?.website || '',
      category: contact.companies?.category || '',
      city: contact.companies?.city || '',
      nation: contact.companies?.nation || '',
      description: contact.companies?.description || ''
    });
    setShowCompanyModal(true);
  }, []);

  // Handle ESC key to close company input
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setCompanySearchTerm(prev => {
          const newTerm = { ...prev };
          Object.keys(newTerm).forEach(key => newTerm[key] = '');
          return newTerm;
        });
        setCompanySuggestions(prev => {
          const newSuggestions = { ...prev };
          Object.keys(newSuggestions).forEach(key => newSuggestions[key] = []);
          return newSuggestions;
        });
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <Container>
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
                        <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#9333ea', textDecoration: 'underline' }}>
                          {`${contact.first_name || ''} ${contact.last_name || ''}`}
                        </a>
                      ) : (
                        <a
                          href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${contact.first_name || ''} ${contact.last_name || ''}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#9333ea', textDecoration: 'underline' }}
                        >
                          {`${contact.first_name || ''} ${contact.last_name || ''}`}
                        </a>
                      )
                    ) : (
                      '-'
                    )}
                    <EditButton onClick={() => handleOpenContactEdit(contact)}>✎</EditButton>
                  </td>
                  <td>
                    {contact.companies ? (
                      <div>
                        <a
                          href={
                            contact.companies.website
                              ? contact.companies.website.startsWith('http')
                                ? contact.companies.website
                                : `https://${contact.companies.website}`
                              : '#'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#3b82f6', textDecoration: 'underline' }}
                        >
                          {contact.companies.name}
                        </a>
                        <EditButton onClick={() => handleEditCompany(contact)}>✎</EditButton>
                        <UnlinkButton onClick={() => handleUnlinkCompany(contact.id)}>✕</UnlinkButton>
                      </div>
                    ) : (
                      <div>
                        <CompanyInput
                          value={companySearchTerm[contact.id] || ''}
                          onChange={(e) => handleCompanySearch(contact.id, e.target.value)}
                          placeholder="Add a company"
                        />
                        {companySuggestions[contact.id]?.length > 0 && (
                          <CompanyDropdown>
                            {companySuggestions[contact.id].map((company, index) => (
                              <CompanyOption
                                key={index}
                                onClick={() => handleCompanySelect(contact.id, company)}
                              >
                                {company.name}
                              </CompanyOption>
                            ))}
                          </CompanyDropdown>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {contact.email ? (
                      <>
                        <a
                          href={`https://mail.superhuman.com/search/${encodeURIComponent(`${contact.first_name || ''} ${contact.last_name || ''}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#3b82f6', textDecoration: 'underline' }}
                        >
                          {contact.email}
                        </a>
                        <EmailButton>
                          <a href={`mailto:${contact.email}`} target="_blank" rel="noopener noreferrer">✉</a>
                        </EmailButton>
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {contact.mobile ? (
                      <a href={`https://wa.me/${contact.mobile.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                        {contact.mobile}
                      </a>
                    ) : (
                      <a
                        href={`https://app.timelines.ai/search/?s=${encodeURIComponent(`${contact.first_name || ''} ${contact.last_name || ''}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#3b82f6', textDecoration: 'underline' }}
                      >
                        Search
                      </a>
                    )}
                  </td>
                  <td>
                    {contact.contact_category ? (
                      <Select
                        value={contact.contact_category}
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
                                c.id === contact.id ? { ...c, contact_category: newCategory || null } : c
                              ));
                            } catch (error) {
                              alert('Failed to update category');
                            }
                          };
                          updateCategory();
                        }}
                      >
                        <option value="">Select Category</option>
                        {CONTACT_CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </Select>
                    ) : (
                      <MissingText>Missing</MissingText>
                    )}
                  </td>
                  <td>
                    {contact.keep_in_touch_frequency ? (
                      <Select
                        value={contact.keep_in_touch_frequency}
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
                                c.id === contact.id ? { ...c, keep_in_touch_frequency: newFrequency || null } : c
                              ));
                            } catch (error) {
                              alert('Failed to update keep in touch frequency');
                            }
                          };
                          updateFrequency();
                        }}
                      >
                        <option value="">Select Frequency</option>
                        {KEEP_IN_TOUCH_FREQUENCIES.map(frequency => (
                          <option key={frequency} value={frequency}>{frequency}</option>
                        ))}
                      </Select>
                    ) : (
                      <MissingText>Missing</MissingText>
                    )}
                  </td>
                  <td>
                    <ActionButton merge onClick={() => handleOpenMerge(contact)}>Merge</ActionButton>
                    {!contact.keep_in_touch_frequency && (
                      <ActionButton skip onClick={() => handleSkipContact(contact.id)}>Skip</ActionButton>
                    )}
                  </td>
                </tr>
              ))}
            </TableBody>
          </ContactTable>
          <PaginationControls>
            <PageButton onClick={goToFirstPage} disabled={currentPage === 0}>First</PageButton>
            <PageButton onClick={goToPreviousPage} disabled={currentPage === 0}>Previous</PageButton>
            <span>
              Page {currentPage + 1} of {totalPages > 0 ? totalPages : 1} (Total: {totalCount})
            </span>
            <PageButton onClick={goToNextPage} disabled={currentPage >= totalPages - 1}>Next</PageButton>
            <PageButton onClick={goToLastPage} disabled={currentPage >= totalPages - 1}>Last</PageButton>
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
                    <SearchResultItem key={contact.id} onClick={() => handleSelectTarget(contact)}>
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
                    <p style={{ fontSize: '0.875rem', color: '#2d3748' }}>
                      <strong>Name:</strong> {selectedContact.first_name || ''} {selectedContact.last_name || ''}<br />
                      <strong>Email:</strong> {selectedContact.email || 'None'}<br />
                      <strong>Mobile:</strong> {selectedContact.mobile || 'None'}<br />
                      <strong>Category:</strong> {selectedContact.contact_category || 'None'}<br />
                      <strong>Keep in Touch:</strong> {selectedContact.keep_in_touch_frequency || 'None'}
                    </p>
                  </MergeColumn>
                  <MergeColumn>
                    <ColumnTitle>Secondary Contact (will be deleted)</ColumnTitle>
                    <p style={{ fontSize: '0.875rem', color: '#2d3748' }}>
                      <strong>Name:</strong> {targetContact.first_name || ''} {targetContact.last_name || ''}<br />
                      <strong>Email:</strong> {targetContact.email || 'None'}<br />
                      <strong>Mobile:</strong> {targetContact.mobile || 'None'}<br />
                      <strong>Category:</strong> {targetContact.contact_category || 'None'}<br />
                      <strong>Keep in Touch:</strong> {targetContact.keep_in_touch_frequency || 'None'}
                    </p>
                  </MergeColumn>
                </MergeForm>
                <h3 style={{ margin: '1rem 0', fontSize: '1rem', fontWeight: 600, color: '#2d3748' }}>
                  Merged Contact Information
                </h3>
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
                    <Select
                      value={mergedData.contact_category || ''}
                      onChange={(e) => handleInputChange('contact_category', e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {CONTACT_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>Keep in Touch</Label>
                    <Select
                      value={mergedData.keep_in_touch_frequency || ''}
                      onChange={(e) => handleInputChange('keep_in_touch_frequency', e.target.value)}
                    >
                      <option value="">Select Frequency</option>
                      {KEEP_IN_TOUCH_FREQUENCIES.map(frequency => (
                        <option key={frequency} value={frequency}>{frequency}</option>
                      ))}
                    </Select>
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
                  <Button primary onClick={handleMerge}>Merge Contacts</Button>
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
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#2d3748', marginBottom: '0.75rem' }}>
              Contact Details
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#2d3748', marginBottom: '1rem' }}>
              <strong>Name:</strong> {currentContact?.first_name} {currentContact?.last_name}<br />
              <strong>Email:</strong> {currentContact?.email}
            </p>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#2d3748', marginBottom: '0.75rem' }}>
              Company Information
            </h3>
            <MergeForm>
              <FormGroup>
                <Label>Company Name</Label>
                <Input
                  type="text"
                  value={companyData.name}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Website</Label>
                <Input
                  type="text"
                  value={companyData.website}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Category</Label>
                <Select
                  value={companyData.category}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select Category</option>
                  {COMPANY_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>City</Label>
                <Input
                  type="text"
                  value={companyData.city}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Nation</Label>
                <Input
                  type="text"
                  value={companyData.nation}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, nation: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Description</Label>
                <Input
                  type="text"
                  value={companyData.description}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
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

      {showContactEditModal && editingContact && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>Edit Contact</h2>
              <CloseButton onClick={() => setShowContactEditModal(false)}>×</CloseButton>
            </ModalHeader>
            <MergeForm>
              <FormGroup>
                <Label>First Name</Label>
                <Input
                  type="text"
                  value={contactEditData.first_name}
                  onChange={(e) => handleContactInputChange('first_name', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  value={contactEditData.last_name}
                  onChange={(e) => handleContactInputChange('last_name', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Contact Category</Label>
                <Select
                  value={contactEditData.contact_category}
                  onChange={(e) => handleContactInputChange('contact_category', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {CONTACT_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Mobile</Label>
                <Input
                  type="text"
                  value={contactEditData.mobile}
                  onChange={(e) => handleContactInputChange('mobile', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Mobile 2</Label>
                <Input
                  type="text"
                  value={contactEditData.mobile2}
                  onChange={(e) => handleContactInputChange('mobile2', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={contactEditData.email}
                  onChange={(e) => handleContactInputChange('email', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Email 2</Label>
                <Input
                  type="email"
                  value={contactEditData.email2}
                  onChange={(e) => handleContactInputChange('email2', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Email 3</Label>
                <Input
                  type="email"
                  value={contactEditData.email3}
                  onChange={(e) => handleContactInputChange('email3', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>LinkedIn</Label>
                <Input
                  type="text"
                  value={contactEditData.linkedin}
                  onChange={(e) => handleContactInputChange('linkedin', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Keep in Touch Frequency</Label>
                <Select
                  value={contactEditData.keep_in_touch_frequency}
                  onChange={(e) => handleContactInputChange('keep_in_touch_frequency', e.target.value)}
                >
                  <option value="">Select Frequency</option>
                  {KEEP_IN_TOUCH_FREQUENCIES.map(frequency => (
                    <option key={frequency} value={frequency}>{frequency}</option>
                  ))}
                </Select>
              </FormGroup>
            </MergeForm>
            <ButtonGroup>
              <Button onClick={() => setShowContactEditModal(false)}>Cancel</Button>
              <Button primary onClick={handleSaveContactEdit}>Save</Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default RecentContactsList;
