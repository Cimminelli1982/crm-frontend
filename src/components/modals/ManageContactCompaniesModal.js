import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { FaBuilding, FaPlus } from 'react-icons/fa';

// Styled Components
const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const ModalTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const Section = styled.div`
  margin-bottom: 24px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  min-height: 32px;
`;

const CompanyItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
`;

const CompanyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

const CompanyIcon = styled.div`
  color: #3B82F6;
  display: flex;
  align-items: center;
`;

const CompanyName = styled.span`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CompanyCategory = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.75rem;
  margin-left: 8px;
`;

const PrimaryBadge = styled.span`
  background: #10B981;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  margin-left: 8px;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#FEE2E2' : '#7F1D1D'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyMessage = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  padding: 8px;
`;

const SearchContainer = styled.div`
  margin-bottom: 12px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const SuggestionsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  transition: background-color 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NoResults = styled.div`
  padding: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.875rem;
  text-align: center;
`;

const CreateButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px;
  border: none;
  background: ${props => props.theme === 'light' ? '#F0FDF4' : '#064E3B'};
  cursor: pointer;
  font-size: 0.875rem;
  color: ${props => props.theme === 'light' ? '#059669' : '#10B981'};
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#DCFCE7' : '#065F46'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 0.875rem;

  ${props => {
    if (props.type === 'success') {
      return `
        background: ${props.theme === 'light' ? '#D1FAE5' : '#064E3B'};
        color: ${props.theme === 'light' ? '#065F46' : '#6EE7B7'};
      `;
    } else if (props.type === 'error') {
      return `
        background: ${props.theme === 'light' ? '#FEE2E2' : '#7F1D1D'};
        color: ${props.theme === 'light' ? '#B91C1C' : '#FCA5A5'};
      `;
    } else if (props.type === 'info') {
      return `
        background: ${props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
        color: ${props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
      `;
    }
  }}
`;

const ModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const DoneButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
  }
`;

const ManageContactCompaniesModal = ({
  isOpen,
  onClose,
  contact,
  theme = 'dark',
  onCompaniesUpdated
}) => {
  const [contactCompanies, setContactCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch contact's companies
  const fetchContactCompanies = async () => {
    if (!contact?.contact_id) return;

    try {
      const { data, error } = await supabase
        .from('contact_companies')
        .select('contact_companies_id, company_id, is_primary, relationship')
        .eq('contact_id', contact.contact_id)
        .order('is_primary', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const companyIds = data.map(c => c.company_id);
        const { data: companyDetails } = await supabase
          .from('companies')
          .select('company_id, name, category')
          .in('company_id', companyIds);

        const companiesWithDetails = data.map(cc => ({
          ...cc,
          company: companyDetails?.find(c => c.company_id === cc.company_id)
        }));
        setContactCompanies(companiesWithDetails);
      } else {
        setContactCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching contact companies:', error);
    }
  };

  useEffect(() => {
    if (isOpen && contact?.contact_id) {
      fetchContactCompanies();
    }
  }, [isOpen, contact?.contact_id]);

  // Fetch company suggestions
  const fetchCompanySuggestions = async (search) => {
    try {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, category')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out companies already connected
      const filteredSuggestions = data.filter(company =>
        !contactCompanies.some(cc => cc.company_id === company.company_id)
      );

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching company suggestions:', error);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchCompanySuggestions(searchTerm);
        setShowSuggestions(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, contactCompanies]);

  const handleAddCompany = async (companyToAdd) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.contact_id,
          company_id: companyToAdd.company_id,
          is_primary: contactCompanies.length === 0
        });

      if (error) throw error;

      await fetchContactCompanies();
      if (onCompaniesUpdated) onCompaniesUpdated();
      setSearchTerm('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: `Linked to ${companyToAdd.name}` });
    } catch (error) {
      console.error('Error linking company:', error);
      setMessage({ type: 'error', text: `Failed to link company: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCompany = async (companyRelation) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_companies_id', companyRelation.contact_companies_id);

      if (error) throw error;

      await fetchContactCompanies();
      if (onCompaniesUpdated) onCompaniesUpdated();
      setMessage({ type: 'success', text: 'Company unlinked successfully' });
    } catch (error) {
      console.error('Error unlinking company:', error);
      setMessage({ type: 'error', text: 'Failed to unlink company' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    try {
      setLoading(true);

      // Create the new company
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          name: searchTerm.trim(),
          category: 'Other'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Link it to the contact
      if (newCompany) {
        await handleAddCompany(newCompany);
        setMessage({ type: 'success', text: `Created and linked "${searchTerm.trim()}"` });
      }
    } catch (error) {
      console.error('Error creating company:', error);
      setMessage({ type: 'error', text: 'Failed to create company' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (companyRelation) => {
    try {
      setLoading(true);

      // First, set all to non-primary
      await supabase
        .from('contact_companies')
        .update({ is_primary: false })
        .eq('contact_id', contact.contact_id);

      // Then set the selected one as primary
      const { error } = await supabase
        .from('contact_companies')
        .update({ is_primary: true })
        .eq('contact_companies_id', companyRelation.contact_companies_id);

      if (error) throw error;

      await fetchContactCompanies();
      if (onCompaniesUpdated) onCompaniesUpdated();
      setMessage({ type: 'success', text: 'Primary company updated' });
    } catch (error) {
      console.error('Error setting primary company:', error);
      setMessage({ type: 'error', text: 'Failed to update primary company' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '0',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999
        }
      }}
    >
      <ModalHeader theme={theme}>
        <ModalTitle theme={theme}>Manage Companies</ModalTitle>
        <CloseButton theme={theme} onClick={onClose}>×</CloseButton>
      </ModalHeader>

      <ModalBody theme={theme}>
        <Section>
          <SectionTitle theme={theme}>Linked Companies</SectionTitle>
          <ItemsList>
            {contactCompanies.map((companyRelation) => (
              <CompanyItem key={companyRelation.contact_companies_id} theme={theme}>
                <CompanyInfo>
                  <CompanyIcon>
                    <FaBuilding size={14} />
                  </CompanyIcon>
                  <CompanyName theme={theme}>
                    {companyRelation.company?.name || 'Unknown Company'}
                  </CompanyName>
                  {companyRelation.company?.category && (
                    <CompanyCategory theme={theme}>
                      {companyRelation.company.category}
                    </CompanyCategory>
                  )}
                  {companyRelation.is_primary && <PrimaryBadge>PRIMARY</PrimaryBadge>}
                </CompanyInfo>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {!companyRelation.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(companyRelation)}
                      disabled={loading}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: theme === 'light' ? '#F3F4F6' : '#374151',
                        color: theme === 'light' ? '#374151' : '#D1D5DB',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Set Primary
                    </button>
                  )}
                  <RemoveButton
                    theme={theme}
                    onClick={() => handleRemoveCompany(companyRelation)}
                    disabled={loading}
                  >
                    ×
                  </RemoveButton>
                </div>
              </CompanyItem>
            ))}
            {contactCompanies.length === 0 && (
              <EmptyMessage theme={theme}>No companies linked</EmptyMessage>
            )}
          </ItemsList>
        </Section>

        <Section>
          <SectionTitle theme={theme}>Add Company</SectionTitle>
          <SearchContainer>
            <SearchInput
              theme={theme}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a company..."
            />
          </SearchContainer>

          {showSuggestions && (
            <SuggestionsContainer theme={theme}>
              {suggestions.map(suggestion => (
                <SuggestionItem
                  key={suggestion.company_id}
                  theme={theme}
                  onClick={() => handleAddCompany(suggestion)}
                  disabled={loading}
                >
                  <div style={{ fontWeight: 500 }}>{suggestion.name}</div>
                  {suggestion.category && (
                    <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>
                      {suggestion.category}
                    </div>
                  )}
                </SuggestionItem>
              ))}
              {suggestions.length === 0 && searchTerm.length >= 2 && (
                <NoResults theme={theme}>No companies found</NoResults>
              )}
              {searchTerm.length >= 2 && (
                <CreateButton
                  theme={theme}
                  onClick={handleCreateCompany}
                  disabled={loading}
                >
                  <FaPlus size={12} />
                  Create "{searchTerm}" as new company
                </CreateButton>
              )}
            </SuggestionsContainer>
          )}
        </Section>

        {message.text && (
          <Message theme={theme} type={message.type}>
            {message.text}
          </Message>
        )}
      </ModalBody>

      <ModalFooter theme={theme}>
        <DoneButton theme={theme} onClick={onClose}>Done</DoneButton>
      </ModalFooter>
    </Modal>
  );
};

export default ManageContactCompaniesModal;
