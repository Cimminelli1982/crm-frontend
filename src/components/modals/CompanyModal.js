import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiPlus, FiSearch, FiEdit } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #111827;
    font-weight: 600;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      color: #1f2937;
      background-color: #f3f4f6;
    }
  }
`;

const Section = styled.div`
  margin-bottom: 15px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #374151;
  margin-bottom: 12px;
`;

const CompaniesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 5px 0;
  min-height: 32px;
`;

const CompanyTag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: ${props => props.color || '#e0f2fe'};
  color: ${props => props.textColor || '#0369a1'};
  border-radius: 16px;
  font-size: 0.875rem;
  gap: 6px;
  max-width: 200px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  button {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      opacity: 1;
    }
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
  width: 90%;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 10px 10px 35px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SuggestionsContainer = styled.div`
  position: relative;
  margin-top: 5px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const SuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background-color: #f3f4f6;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
  }
`;

const NewCompanyButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background-color: #f3f4f6;
  cursor: pointer;
  font-size: 0.875rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e5e7eb;
  }
`;

const Message = styled.div`
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.875rem;

  &.success {
    background-color: #d1fae5;
    color: #065f46;
  }

  &.error {
    background-color: #fee2e2;
    color: #b91c1c;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: #3b82f6;
    color: white;
    border: none;

    &:hover {
      background-color: #2563eb;
    }
  }

  &.secondary {
    background-color: white;
    color: #4b5563;
    border: 1px solid #d1d5db;

    &:hover {
      background-color: #f9fafb;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// New Company Modal for creating new companies
const NewCompanyModal = ({ isOpen, onClose, onSave }) => {
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data, error: createError } = await supabase
        .from('companies')
        .insert({
          name: companyName.trim(),
          website: companyWebsite.trim()
        })
        .select()
        .single();

      if (createError) throw createError;

      setCompanyName('');
      setCompanyWebsite('');
      onSave(data);
      onClose();
    } catch (err) {
      console.error('Error creating company:', err);
      setError('Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          padding: '20px',
          border: 'none',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '90%'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1100
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <h2>Create New Company</h2>
          <button onClick={onClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label 
              htmlFor="companyName" 
              style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}
            >
              Company Name *
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label 
              htmlFor="companyWebsite" 
              style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}
            >
              Website (optional)
            </label>
            <input
              id="companyWebsite"
              type="url"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="https://example.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {error && (
            <Message className="error">
              {error}
            </Message>
          )}

          <ButtonGroup>
            <Button 
              type="button" 
              className="secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Company'}
            </Button>
          </ButtonGroup>
        </form>
      </div>
    </Modal>
  );
};

// Helper function to get company colors - using a consistent blue palette for companies
const getCompanyColor = () => {
  return { bg: '#e0f2fe', text: '#0369a1' }; // Sky blue
};

const CompanyModal = ({ isOpen, onRequestClose, contact }) => {
  const [relatedCompanies, setRelatedCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);

  // Fetch related companies for the contact
  const fetchRelatedCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_companies')
        .select('*, company_id(*)')
        .eq('contact_id', contact.id);

      if (error) throw error;

      setRelatedCompanies(data.map(item => ({
        id: item.id,
        company_id: item.company_id.id,
        name: item.company_id.name,
        website: item.company_id.website
      })));
    } catch (error) {
      console.error('Error fetching related companies:', error);
      setMessage({ type: 'error', text: 'Failed to load companies' });
    }
  };

  // Fetch company suggestions based on search term
  const fetchCompanySuggestions = async (search) => {
    try {
      if (search.length < 3) {
        setSuggestions([]);
        return;
      }

      let query = supabase.from('companies').select('*');
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;

      // Filter out companies that are already connected
      const filteredSuggestions = data.filter(company => 
        !relatedCompanies.some(related => related.company_id === company.id)
      );

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching company suggestions:', error);
    }
  };

  useEffect(() => {
    if (isOpen && contact) {
      fetchRelatedCompanies();
    }
  }, [isOpen, contact]);

  useEffect(() => {
    // Only search when at least 3 characters are entered
    if (searchTerm.length >= 3) {
      fetchCompanySuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleUnlinkCompany = async (companyToRemove) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('id', companyToRemove.id);

      if (error) throw error;

      setRelatedCompanies(relatedCompanies.filter(company => company.id !== companyToRemove.id));
      setMessage({ type: 'success', text: 'Company unlinked successfully' });
    } catch (error) {
      console.error('Error unlinking company:', error);
      setMessage({ type: 'error', text: 'Failed to unlink company' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (companyToAdd) => {
    try {
      setLoading(true);
      
      // Add connection in contact_companies table
      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.id,
          company_id: companyToAdd.id
        });

      if (error) throw error;

      // Refresh related companies
      await fetchRelatedCompanies();
      
      setSearchTerm('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: 'Company linked successfully' });
    } catch (error) {
      console.error('Error linking company:', error);
      setMessage({ type: 'error', text: 'Failed to link company' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = (newCompany) => {
    // Add the newly created company to the contact
    handleAddCompany(newCompany);
  };

  const clearMessage = () => {
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  useEffect(() => {
    if (message.text) {
      clearMessage();
    }
  }, [message]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            border: 'none',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%',
            minHeight: '360px'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <div style={{ padding: '1rem' }}>
          <ModalHeader>
            <h2>Manage Companies</h2>
            <button onClick={onRequestClose} aria-label="Close modal">
              <FiX size={20} />
            </button>
          </ModalHeader>

          <Section>
            <SectionTitle>Related Companies</SectionTitle>
            <CompaniesList>
              {relatedCompanies.map(company => {
                const color = getCompanyColor();
                return (
                  <CompanyTag 
                    key={company.id} 
                    color={color.bg}
                    textColor={color.text}
                  >
                    <span title={company.name}>{company.name.length > 25 ? `${company.name.substring(0, 25)}...` : company.name}</span>
                    <button 
                      onClick={() => handleUnlinkCompany(company)}
                      disabled={loading}
                      title="Unlink company"
                    >
                      <FiX size={14} />
                    </button>
                  </CompanyTag>
                );
              })}
              {relatedCompanies.length === 0 && (
                <span style={{ color: '#6c757d', fontStyle: 'italic', padding: '4px' }}>
                  No companies linked
                </span>
              )}
            </CompaniesList>
          </Section>

          <Section>
            <SectionTitle>Add Companies</SectionTitle>
            <SearchContainer>
              <SearchIcon>
                <FiSearch size={16} />
              </SearchIcon>
              <SearchInput
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a company (type at least 3 letters)..."
              />
            </SearchContainer>

            {showSuggestions && (
              <SuggestionsContainer>
                {suggestions.map(suggestion => (
                  <SuggestionItem
                    key={suggestion.id}
                    onClick={() => handleAddCompany(suggestion)}
                    disabled={loading}
                  >
                    {suggestion.name}
                    {suggestion.website && (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {suggestion.website}
                      </span>
                    )}
                  </SuggestionItem>
                ))}
                {suggestions.length === 0 && searchTerm.length >= 3 && (
                  <div style={{ padding: '8px 12px', color: '#6c757d', fontSize: '0.875rem' }}>
                    No companies found
                  </div>
                )}
                {searchTerm.length >= 3 && (
                  <NewCompanyButton
                    onClick={() => setShowNewCompanyModal(true)}
                    disabled={loading}
                  >
                    <FiPlus size={14} />
                    Create new company
                  </NewCompanyButton>
                )}
              </SuggestionsContainer>
            )}
          </Section>

          {message.text && (
            <Message className={message.type}>
              {message.text}
            </Message>
          )}

          <ButtonGroup>
            <Button className="primary" onClick={onRequestClose}>
              Done
            </Button>
          </ButtonGroup>

          {loading && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <div className="spinner" style={{ 
                width: '20px', 
                height: '20px', 
                border: '3px solid #f3f3f3', 
                borderTop: '3px solid #007BFF', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
              }}></div>
            </div>
          )}
        </div>
      </Modal>

      {/* New Company Modal */}
      <NewCompanyModal 
        isOpen={showNewCompanyModal}
        onClose={() => setShowNewCompanyModal(false)}
        onSave={handleCreateCompany}
      />
    </>
  );
};

export default CompanyModal;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style); 