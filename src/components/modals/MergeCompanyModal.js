import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiSearch, FiTrash2, FiArrowRight } from 'react-icons/fi';
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

const InfoText = styled.p`
  color: #4b5563;
  font-size: 0.875rem;
  margin-bottom: 16px;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  background-color: white;
  border: 1px solid black;
  border-radius: 0.375rem;
  overflow: visible;
  margin-bottom: 16px;
  box-shadow: none;
  position: relative;
  z-index: 1;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: black;
  border: none;
  outline: none;
  
  &::placeholder {
    color: #555555;
  }
`;

const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  color: black;
`;

const CompanyTable = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const CompanyTableHeader = styled.div`
  display: grid;
  grid-template-columns: 3fr 2fr 1fr;
  background-color: #f9fafb;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const CompanyTableRow = styled.div`
  display: grid;
  grid-template-columns: 3fr 2fr 1fr;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #4b5563;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f9fafb;
  }
`;

const CompanyName = styled.div`
  font-weight: 500;
  color: #111827;
`;

const CompanyContacts = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
`;

const ActionButton = styled.button`
  background: ${props => props.$primary ? 'black' : '#f3f4f6'};
  color: ${props => props.$primary ? 'white' : '#4b5563'};
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  
  &:hover {
    background-color: ${props => props.$primary ? '#333333' : '#e5e7eb'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.delete {
    background-color: white;
    color: #ef4444;
    border: 1px solid #ef4444;
    
    &:hover {
      background-color: #fee2e2;
    }
  }
`;

const MergeButton = styled(ActionButton)`
  margin-top: 10px;
  padding: 8px 16px;
  width: 100%;
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
    background-color: black;
    color: white;
    border: none;

    &:hover {
      background-color: #333333;
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

const NoResults = styled.div`
  text-align: center;
  padding: 20px;
  color: #6b7280;
  font-style: italic;
`;

// Loading Spinner
const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #000000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Main component
const MergeCompanyModal = ({ isOpen, onRequestClose, company, preSelectedCompany = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedMergeId, setSelectedMergeId] = useState(null);
  const [mergeInProgress, setMergeInProgress] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Pre-select company if provided
  useEffect(() => {
    if (isOpen && preSelectedCompany?.company_id) {
      setSelectedMergeId(preSelectedCompany.company_id);
    }
  }, [isOpen, preSelectedCompany]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setMessage({ type: '', text: '' });
      setSearchResults([]);
      setSelectedMergeId(null);
      setMergeInProgress(false);
    }
  }, [isOpen]);

  // Search companies in database when search term changes
  useEffect(() => {
    const searchCompanies = async () => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('company_id, name, category, website')
          .neq('company_id', company?.company_id)
          .neq('category', 'Skip')
          .ilike('name', `%${searchTerm.trim()}%`)
          .order('name')
          .limit(20);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching companies:', error);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchCompanies, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, company?.company_id]);

  // Get companies to display
  const getFilteredCompanies = () => searchResults;

  // Handle delete company (mark as Skip)
  const handleDeleteDuplicate = async (duplicateId) => {
    try {
      setLoading(true);
      
      // Update company category to "Skip"
      const { error } = await supabase
        .from('companies')
        .update({ category: 'Skip' })
        .eq('company_id', duplicateId);
        
      if (error) throw error;
      
      // Remove from local state
      setSearchResults(searchResults.filter(comp => comp.company_id !== duplicateId));
      setMessage({ type: 'success', text: 'Company marked as duplicate and hidden' });
      
    } catch (error) {
      console.error('Error marking company as duplicate:', error);
      setMessage({ type: 'error', text: 'Failed to mark company as duplicate' });
    } finally {
      setLoading(false);
    }
  };

  // Select company for merging
  const handleSelectMerge = (companyId) => {
    setSelectedMergeId(companyId === selectedMergeId ? null : companyId);
  };

  // Perform the merge operation using company_duplicates trigger
  const handleMergeCompanies = async () => {
    if (!selectedMergeId || !company) return;

    try {
      setMergeInProgress(true);

      const targetCompany = searchResults.find(comp => comp.company_id === selectedMergeId);
      if (!targetCompany) throw new Error('Target company not found');

      // Insert into company_duplicates - the database trigger does the actual merge
      const { error } = await supabase
        .from('company_duplicates')
        .upsert({
          primary_company_id: company.company_id,
          duplicate_company_id: targetCompany.company_id,
          start_trigger: true,
          status: 'pending',
          merge_selections: {
            domains: 'combine',
            tags: 'combine',
            cities: 'combine',
            contacts: 'combine'
          },
          notes: `Manual merge from MergeCompanyModal`
        }, {
          onConflict: 'primary_company_id,duplicate_company_id'
        });

      if (error) throw error;

      setSearchResults(searchResults.filter(comp => comp.company_id !== targetCompany.company_id));

      setMessage({
        type: 'success',
        text: `Merged "${targetCompany.name}" into "${company.name}"`
      });

      setSelectedMergeId(null);

      setTimeout(() => {
        onRequestClose(); // Close the modal after successful merge
      }, 2000);
      
    } catch (error) {
      console.error('Error merging companies:', error);
      setMessage({ type: 'error', text: 'Failed to merge companies: ' + error.message });
    } finally {
      setMergeInProgress(false);
    }
  };

  // Format contact names for display
  const formatContactList = (contacts) => {
    if (!contacts || contacts.length === 0) return 'No contacts';
    
    const formatted = contacts.map(contact => 
      `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    );
    
    if (formatted.length <= 2) {
      return formatted.join(', ');
    }
    
    return `${formatted.slice(0, 2).join(', ')} +${formatted.length - 2} more`;
  };

  // Clear message after a delay
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  const filteredCompanies = getFilteredCompanies();

  return (
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
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <h2>Merge Company: {company?.name}</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>

        <InfoText>
          Find and merge duplicate companies. Merging will transfer all tags, cities, and contacts 
          from the selected company to {company?.name}, then hide the duplicate.
        </InfoText>

        <Section>
          <SearchContainer>
            <SearchInput
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company name or contact..."
              autoFocus
            />
            <SearchIcon>
              <FiSearch size={16} />
            </SearchIcon>
          </SearchContainer>
        </Section>

        {message.text && (
          <Message className={message.type}>
            {message.text}
          </Message>
        )}

        {searching && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            Searching...
          </div>
        )}

        {!searching && filteredCompanies.length === 0 && searchTerm.trim().length >= 2 && (
          <NoResults>
            No companies found matching "{searchTerm}"
          </NoResults>
        )}

        {!searching && filteredCompanies.length > 0 && (
          <Section>
            <CompanyTable>
              <CompanyTableHeader>
                <div>Company Name</div>
                <div>Associated Contacts</div>
                <div>Actions</div>
              </CompanyTableHeader>
              
              {filteredCompanies.map(similarCompany => (
                <CompanyTableRow
                  key={similarCompany.company_id}
                  style={{
                    backgroundColor: preSelectedCompany?.company_id === similarCompany.company_id ? '#eff6ff' : undefined,
                    borderLeft: preSelectedCompany?.company_id === similarCompany.company_id ? '3px solid #3b82f6' : undefined
                  }}
                >
                  <CompanyName>
                    {similarCompany.name}
                    {preSelectedCompany?.company_id === similarCompany.company_id && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '0.7rem',
                        background: '#3b82f6',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        Matched
                      </span>
                    )}
                  </CompanyName>
                  <CompanyContacts>
                    {formatContactList(similarCompany.contacts)}
                  </CompanyContacts>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <ActionButton 
                      className="delete"
                      onClick={() => handleDeleteDuplicate(similarCompany.company_id)}
                      disabled={loading || mergeInProgress}
                      title="Mark as duplicate (sets category to Skip)"
                    >
                      <FiTrash2 size={12} />
                    </ActionButton>
                    <ActionButton
                      $primary={selectedMergeId === similarCompany.company_id}
                      onClick={() => handleSelectMerge(similarCompany.company_id)}
                      disabled={loading || mergeInProgress}
                      title="Select for merge"
                    >
                      {selectedMergeId === similarCompany.company_id ? 'Selected' : 'Select'}
                    </ActionButton>
                  </div>
                </CompanyTableRow>
              ))}
            </CompanyTable>

            {selectedMergeId && (
              <MergeButton
                $primary
                onClick={handleMergeCompanies}
                disabled={loading || mergeInProgress}
              >
                {mergeInProgress ? (
                  <>
                    <Spinner style={{ width: '14px', height: '14px', marginRight: '8px' }} />
                    Merging...
                  </>
                ) : (
                  <>
                    <FiArrowRight size={14} />
                    Merge Selected Company
                  </>
                )}
              </MergeButton>
            )}
          </Section>
        )}

        <ButtonGroup>
          <Button className="secondary" onClick={onRequestClose} disabled={mergeInProgress}>
            Close
          </Button>
        </ButtonGroup>
      </div>
    </Modal>
  );
};

export default MergeCompanyModal;