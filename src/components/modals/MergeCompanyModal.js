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
const MergeCompanyModal = ({ isOpen, onRequestClose, company }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [similarCompanies, setSimilarCompanies] = useState([]);
  const [selectedMergeId, setSelectedMergeId] = useState(null);
  const [mergeInProgress, setMergeInProgress] = useState(false);

  // Fetch similar companies based on name and shared contacts
  useEffect(() => {
    if (isOpen && company) {
      fetchSimilarCompanies();
    }
  }, [isOpen, company]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setMessage({ type: '', text: '' });
      setSimilarCompanies([]);
      setSelectedMergeId(null);
      setMergeInProgress(false);
    }
  }, [isOpen]);

  // Fetch similar companies
  const fetchSimilarCompanies = async () => {
    try {
      setLoading(true);

      if (!company) return;

      console.log('Fetching similar companies for:', company.name, 'ID:', company.company_id);

      // Debug: Let's see what companies are actually in the database
      const { data: sampleCompanies, error: sampleError } = await supabase
        .from('companies')
        .select('company_id, name, category')
        .neq('company_id', company.company_id)
        .limit(10);

      console.log('Sample companies in database:', sampleCompanies?.map(c => `${c.name} (${c.category})`));
      
      // First, get companies with similar names
      let similarNameCompanies = [];
      
      try {
        // Extract words from company name
        const nameWords = company.name.split(/\s+/).filter(word => word.length > 2);
        console.log("Company name words:", nameWords);
        console.log("Current company ID to exclude:", company.company_id);
        
        // If we have words to search for
        if (nameWords.length > 0) {
          // Create search conditions for each word
          const promises = nameWords.map(word => 
            supabase
              .from('companies')
              .select('*')
              .neq('company_id', company.company_id) // Exclude current company
              .neq('category', 'Skip') // Exclude companies with Skip category
              .ilike('name', `%${word}%`) // Match any word in the name
          );
          
          // Execute all searches
          const results = await Promise.all(promises);

          // Combine results from all searches
          const allResults = [];
          results.forEach((result, i) => {
            if (!result.error && result.data) {
              console.log(`Results for '${nameWords[i]}':`, result.data.length, result.data.map(c => c.name));
              allResults.push(...result.data);
            } else if (result.error) {
              console.error(`Error searching for '${nameWords[i]}':`, result.error);
            }
          });
          
          // Deduplicate
          const uniqueIds = new Set();
          similarNameCompanies = allResults.filter(company => {
            if (!uniqueIds.has(company.id)) {
              uniqueIds.add(company.id);
              return true;
            }
            return false;
          });
          
          console.log("Total unique similar companies found:", similarNameCompanies.length);
        } else {
          // Fallback if we can't extract words
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .neq('company_id', company.company_id) // Exclude current company
            .neq('category', 'Skip'); // Exclude companies with Skip category
          
          if (!error && data) {
            similarNameCompanies = data;
          }
        }
      } catch (error) {
        console.error('Error fetching similar name companies:', error);
      }
      
      // Next, get companies with shared contacts
      let sharedContactCompanies = [];
      
      if (company.contacts && company.contacts.length > 0) {
        try {
          // Get contact IDs from current company
          const contactIds = company.contacts.map(contact => contact.contact_id || contact.id);
          
          // Find companies that share these contacts
          const { data: contactCompanyData, error: contactCompanyError } = await supabase
            .from('contact_companies')
            .select(`
              company_id,
              companies:company_id (*)
            `)
            .in('contact_id', contactIds)
            .neq('company_id', company.company_id);
            
          if (!contactCompanyError && contactCompanyData) {
            // Extract unique companies
            const companiesMap = {};
            contactCompanyData.forEach(item => {
              if (item.companies && item.companies.category !== 'Skip') {
                companiesMap[item.companies.company_id] = item.companies;
              }
            });
            
            sharedContactCompanies = Object.values(companiesMap);
          }
        } catch (error) {
          console.error('Error fetching companies with shared contacts:', error);
        }
      }
      
      // Combine and deduplicate results
      const allCompanies = [...similarNameCompanies, ...sharedContactCompanies];
      const uniqueCompanies = {};
      
      allCompanies.forEach(comp => {
        uniqueCompanies[comp.company_id] = comp;
      });
      
      // Convert back to array and include contact data
      const uniqueCompaniesArray = Object.values(uniqueCompanies);
      
      // For each company, fetch associated contacts
      for (const comp of uniqueCompaniesArray) {
        try {
          const { data: contactsData, error: contactsError } = await supabase
            .from('contact_companies')
            .select(`
              contact_id,
              contacts:contact_id (contact_id, first_name, last_name)
            `)
            .eq('company_id', comp.company_id);
            
          if (!contactsError && contactsData) {
            comp.contacts = contactsData.map(item => item.contacts).filter(Boolean);
            console.log(`Contacts for company ${comp.name}:`, comp.contacts);
          } else {
            comp.contacts = [];
          }
        } catch (error) {
          console.error('Error fetching contacts for company:', error);
          comp.contacts = [];
        }
      }
      
      setSimilarCompanies(uniqueCompaniesArray);
      
    } catch (error) {
      console.error('Error fetching similar companies:', error);
      setMessage({ type: 'error', text: 'Failed to load similar companies' });
    } finally {
      setLoading(false);
    }
  };

  // Filter companies based on search term
  const getFilteredCompanies = () => {
    // If no search term, return all companies
    if (!searchTerm || searchTerm.trim() === '') {
      return similarCompanies;
    }
    
    console.log("Filtering companies with term:", searchTerm);
    console.log("Total companies before filter:", similarCompanies.length);
    
    const term = searchTerm.toLowerCase().trim();
    
    // Filter the companies
    const filtered = similarCompanies.filter(company => {
      // If we don't have a company object or it doesn't have a name property
      if (!company || !company.name) return false;
      
      // Check name
      if (company.name.toLowerCase().includes(term)) {
        return true;
      }
      
      // Check contacts
      if (company.contacts && Array.isArray(company.contacts)) {
        for (const contact of company.contacts) {
          if (!contact) continue;
          
          const firstName = (contact.first_name || '').toLowerCase();
          const lastName = (contact.last_name || '').toLowerCase();
          const fullName = `${firstName} ${lastName}`;
          
          if (firstName.includes(term) || lastName.includes(term) || fullName.includes(term)) {
            return true;
          }
        }
      }
      
      return false;
    });
    
    console.log("Filtered companies:", filtered.length);
    return filtered;
  };

  // Handle delete company (mark as Skip)
  const handleDeleteDuplicate = async (duplicateId) => {
    try {
      setLoading(true);
      
      // Update company category to "Skip"
      const { error } = await supabase
        .from('companies')
        .update({ category: 'Skip', modified_at: new Date() })
        .eq('company_id', duplicateId);
        
      if (error) throw error;
      
      // Remove from local state
      setSimilarCompanies(similarCompanies.filter(comp => comp.company_id !== duplicateId));
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

  // Perform the merge operation
  const handleMergeCompanies = async () => {
    if (!selectedMergeId || !company) return;
    
    try {
      setMergeInProgress(true);
      
      // Find the company to merge with
      const targetCompany = similarCompanies.find(comp => comp.company_id === selectedMergeId);
      if (!targetCompany) throw new Error('Target company not found');
      
      // 1. Transfer all tags from target to source
      try {
        // Get all tags from target company
        const { data: tagData, error: tagError } = await supabase
          .from('companies_tags')
          .select('tag_id')
          .eq('company_id', targetCompany.company_id);
          
        if (!tagError && tagData) {
          // Get existing tags for source company to avoid duplicates
          const { data: existingTags } = await supabase
            .from('companies_tags')
            .select('tag_id')
            .eq('company_id', company.company_id);
            
          const existingTagIds = new Set(existingTags?.map(t => t.tag_id) || []);
          
          // Find tags to transfer (those not already on source company)
          const tagsToTransfer = tagData
            .filter(tag => !existingTagIds.has(tag.tag_id))
            .map(tag => ({
              company_id: company.company_id,
              tag_id: tag.tag_id
            }));
            
          // Insert new tag associations if any
          if (tagsToTransfer.length > 0) {
            await supabase
              .from('companies_tags')
              .insert(tagsToTransfer);
          }
        }
      } catch (error) {
        console.error('Error transferring tags:', error);
      }
      
      // 2. Transfer all cities from target to source
      try {
        // Get all cities from target company
        const { data: cityData, error: cityError } = await supabase
          .from('companies_cities')
          .select('city_id')
          .eq('company_id', targetCompany.company_id);
          
        if (!cityError && cityData) {
          // Get existing cities for source company to avoid duplicates
          const { data: existingCities } = await supabase
            .from('companies_cities')
            .select('city_id')
            .eq('company_id', company.company_id);
            
          const existingCityIds = new Set(existingCities?.map(c => c.city_id) || []);
          
          // Find cities to transfer (those not already on source company)
          const citiesToTransfer = cityData
            .filter(city => !existingCityIds.has(city.city_id))
            .map(city => ({
              company_id: company.company_id,
              city_id: city.city_id
            }));
            
          // Insert new city associations if any
          if (citiesToTransfer.length > 0) {
            await supabase
              .from('companies_cities')
              .insert(citiesToTransfer);
          }
        }
      } catch (error) {
        console.error('Error transferring cities:', error);
      }
      
      // 3. Transfer all contacts from target to source
      try {
        // Get all contacts from target company
        const { data: contactData, error: contactError } = await supabase
          .from('contact_companies')
          .select('contact_id')
          .eq('company_id', targetCompany.company_id);
          
        if (!contactError && contactData) {
          // Get existing contacts for source company to avoid duplicates
          const { data: existingContacts } = await supabase
            .from('contact_companies')
            .select('contact_id')
            .eq('company_id', company.company_id);
            
          const existingContactIds = new Set(existingContacts?.map(c => c.contact_id) || []);
          
          // Find contacts to transfer (those not already on source company)
          const contactsToTransfer = contactData
            .filter(contact => !existingContactIds.has(contact.contact_id))
            .map(contact => ({
              company_id: company.company_id,
              contact_id: contact.contact_id
            }));
            
          // Insert new contact associations if any
          if (contactsToTransfer.length > 0) {
            await supabase
              .from('contact_companies')
              .insert(contactsToTransfer);
          }
        }
      } catch (error) {
        console.error('Error transferring contacts:', error);
      }
      
      // 4. Mark the target company as Skip (effectively deleting it from view)
      await supabase
        .from('companies')
        .update({ 
          category: 'Skip', 
          modified_at: new Date(),
          description: `${targetCompany.description || ''}\n\nMerged into ${company.name} (ID: ${company.company_id})`
        })
        .eq('company_id', targetCompany.company_id);
        
      // Remove from local state
      setSimilarCompanies(similarCompanies.filter(comp => comp.company_id !== targetCompany.company_id));
      
      setMessage({ 
        type: 'success', 
        text: `Successfully merged "${targetCompany.name}" into "${company.name}". All relationships have been transferred.` 
      });
      
      setSelectedMergeId(null);
      
      // Reset after a delay
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
  console.log("Filtered companies rendered:", filteredCompanies.length);

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
              onChange={(e) => {
                console.log("Search input changed:", e.target.value);
                setSearchTerm(e.target.value);
              }}
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

        <Section>
          <SectionTitle>Similar Companies</SectionTitle>
          
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Spinner />
              <p style={{ marginTop: '10px', color: '#6b7280' }}>Loading similar companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <NoResults>
              {searchTerm.trim() !== '' ? 
                `No companies found matching "${searchTerm}". Try a different search term.` : 
                `No similar companies found. Try searching for a specific name.`}
            </NoResults>
          ) : (
            <CompanyTable>
              <CompanyTableHeader>
                <div>Company Name</div>
                <div>Associated Contacts</div>
                <div>Actions</div>
              </CompanyTableHeader>
              
              {filteredCompanies.map(similarCompany => (
                <CompanyTableRow key={similarCompany.company_id}>
                  <CompanyName>{similarCompany.name}</CompanyName>
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
          )}
          
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