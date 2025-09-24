import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiSearch } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 80vh;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #111827;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
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
`;

const SearchSection = styled.div`
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const CompanyList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 20px;
`;

const CompanyItem = styled.div`
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: #f9fafb;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const CompanyInfo = styled.div`
  flex: 1;
`;

const CompanyName = styled.div`
  font-weight: 600;
  color: #111827;
`;

const SelectButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background-color: #2563eb;
  }
`;

const ComparisonSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 150px;
  gap: 20px;
  flex: 1;
  min-height: 0;
`;

const CompanyColumn = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const ColumnHeader = styled.div`
  background-color: ${props => props.$isPrimary ? '#dbeafe' : '#f3f4f6'};
  color: ${props => props.$isPrimary ? '#1e40af' : '#374151'};
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 15px;
`;

const CompanyDetails = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
`;

const FieldGroup = styled.div`
  margin-bottom: 20px;
`;

const FieldLabel = styled.div`
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
`;

const FieldValue = styled.div`
  background-color: #f9fafb;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  min-height: 40px;
  font-size: 14px;
  color: #4b5563;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.span`
  background-color: #e0f2fe;
  color: #0369a1;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const ChoicesColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChoiceGroup = styled.div`
  margin-bottom: 20px;
`;

const ChoiceOption = styled.label`
  display: block;
  margin-bottom: 6px;
  cursor: pointer;
  font-size: 14px;
`;

const ChoiceRadio = styled.input`
  margin-right: 8px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;

  &.primary {
    background-color: #ef4444;
    color: white;

    &:hover {
      background-color: #dc2626;
    }
  }

  &.secondary {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover {
      background-color: #e5e7eb;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;

  &.success {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  &.error {
    background-color: #fee2e2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }
`;

const CompanyMergeModal = ({ isOpen, onRequestClose, company }) => {
  const [step, setStep] = useState('search'); // 'search' or 'compare'
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [primaryCompany, setPrimaryCompany] = useState(null);
  const [duplicateCompany, setDuplicateCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Merge choices
  const [mergeChoices, setMergeChoices] = useState({
    name: 'primary',
    category: 'primary',
    website: 'primary',
    description: 'primary',
    tags: 'combine',
    cities: 'combine',
    contacts: 'combine'
  });

  // Load companies for search
  useEffect(() => {
    if (isOpen && company && step === 'search') {
      loadCompanies();
    }
  }, [isOpen, company, step]);

  // Load detailed data for comparison
  useEffect(() => {
    if (step === 'compare' && primaryCompany && duplicateCompany) {
      loadDetailedCompanyData();
    }
  }, [step, primaryCompany, duplicateCompany]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, category, website')
        .neq('company_id', company.company_id)
        .not('category', 'eq', 'Skip')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      setMessage({ type: 'error', text: 'Failed to load companies' });
    } finally {
      setLoading(false);
    }
  };

  const loadDetailedCompanyData = async () => {
    setLoading(true);
    try {
      // Load detailed data for both companies
      const [primaryData, duplicateData] = await Promise.all([
        loadCompanyDetails(primaryCompany.company_id),
        loadCompanyDetails(duplicateCompany.company_id)
      ]);

      setPrimaryCompany({ ...primaryCompany, ...primaryData });
      setDuplicateCompany({ ...duplicateCompany, ...duplicateData });
    } catch (error) {
      console.error('Error loading company details:', error);
      setMessage({ type: 'error', text: 'Failed to load company details' });
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyDetails = async (companyId) => {
    // Get tags
    const { data: tagsData } = await supabase
      .from('companies_tags')
      .select('tags(name)')
      .eq('company_id', companyId);

    // Get cities
    const { data: citiesData } = await supabase
      .from('companies_cities')
      .select('cities(name, country)')
      .eq('company_id', companyId);

    // Get contacts
    const { data: contactsData } = await supabase
      .from('contact_companies')
      .select('contacts(contact_id, first_name, last_name)')
      .eq('company_id', companyId);

    return {
      tags: tagsData?.map(t => t.tags) || [],
      cities: citiesData?.map(c => c.cities) || [],
      contacts: contactsData?.map(c => c.contacts) || []
    };
  };

  const handleSelectCompany = (selectedComp) => {
    // Ask user which should be primary
    const isPrimary = confirm(`Make "${selectedComp.name}" the PRIMARY company?\n\nClick OK to make it PRIMARY\nClick Cancel to make "${company.name}" PRIMARY`);

    if (isPrimary) {
      setPrimaryCompany(selectedComp);
      setDuplicateCompany(company);
    } else {
      setPrimaryCompany(company);
      setDuplicateCompany(selectedComp);
    }

    setStep('compare');
  };

  const handleMergeChoiceChange = (field, choice) => {
    setMergeChoices(prev => ({
      ...prev,
      [field]: choice
    }));
  };

  const handleMerge = async () => {
    if (!confirm(`Merge these companies according to your selections? This cannot be undone.`)) {
      return;
    }

    setMerging(true);
    try {
      // 1. Update basic company fields
      const updates = {};
      if (mergeChoices.name === 'duplicate') updates.name = duplicateCompany.name;
      if (mergeChoices.category === 'duplicate') updates.category = duplicateCompany.category;
      if (mergeChoices.website === 'duplicate') updates.website = duplicateCompany.website;
      if (mergeChoices.description === 'duplicate') updates.description = duplicateCompany.description;

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('companies')
          .update(updates)
          .eq('company_id', primaryCompany.company_id);
      }

      // 2. Handle tags
      if (mergeChoices.tags === 'duplicate') {
        // Remove all primary tags, add all duplicate tags
        await supabase.from('companies_tags').delete().eq('company_id', primaryCompany.company_id);

        const { data: dupTags } = await supabase
          .from('companies_tags')
          .select('tag_id')
          .eq('company_id', duplicateCompany.company_id);

        if (dupTags?.length > 0) {
          await supabase.from('companies_tags').insert(
            dupTags.map(tag => ({
              company_id: primaryCompany.company_id,
              tag_id: tag.tag_id
            }))
          );
        }
      } else if (mergeChoices.tags === 'combine') {
        // Add duplicate tags that don't exist in primary
        const { data: primaryTags } = await supabase
          .from('companies_tags')
          .select('tag_id')
          .eq('company_id', primaryCompany.company_id);

        const { data: dupTags } = await supabase
          .from('companies_tags')
          .select('tag_id')
          .eq('company_id', duplicateCompany.company_id);

        const primaryTagIds = new Set(primaryTags?.map(t => t.tag_id) || []);
        const newTags = dupTags?.filter(tag => !primaryTagIds.has(tag.tag_id)) || [];

        if (newTags.length > 0) {
          await supabase.from('companies_tags').insert(
            newTags.map(tag => ({
              company_id: primaryCompany.company_id,
              tag_id: tag.tag_id
            }))
          );
        }
      }

      // 3. Handle cities (same logic as tags)
      if (mergeChoices.cities === 'duplicate') {
        await supabase.from('companies_cities').delete().eq('company_id', primaryCompany.company_id);

        const { data: dupCities } = await supabase
          .from('companies_cities')
          .select('city_id')
          .eq('company_id', duplicateCompany.company_id);

        if (dupCities?.length > 0) {
          await supabase.from('companies_cities').insert(
            dupCities.map(city => ({
              company_id: primaryCompany.company_id,
              city_id: city.city_id
            }))
          );
        }
      } else if (mergeChoices.cities === 'combine') {
        const { data: primaryCities } = await supabase
          .from('companies_cities')
          .select('city_id')
          .eq('company_id', primaryCompany.company_id);

        const { data: dupCities } = await supabase
          .from('companies_cities')
          .select('city_id')
          .eq('company_id', duplicateCompany.company_id);

        const primaryCityIds = new Set(primaryCities?.map(c => c.city_id) || []);
        const newCities = dupCities?.filter(city => !primaryCityIds.has(city.city_id)) || [];

        if (newCities.length > 0) {
          await supabase.from('companies_cities').insert(
            newCities.map(city => ({
              company_id: primaryCompany.company_id,
              city_id: city.city_id
            }))
          );
        }
      }

      // 4. Handle contacts (same logic)
      if (mergeChoices.contacts === 'duplicate') {
        await supabase.from('contact_companies').delete().eq('company_id', primaryCompany.company_id);

        const { data: dupContacts } = await supabase
          .from('contact_companies')
          .select('contact_id')
          .eq('company_id', duplicateCompany.company_id);

        if (dupContacts?.length > 0) {
          await supabase.from('contact_companies').insert(
            dupContacts.map(contact => ({
              company_id: primaryCompany.company_id,
              contact_id: contact.contact_id
            }))
          );
        }
      } else if (mergeChoices.contacts === 'combine') {
        const { data: primaryContacts } = await supabase
          .from('contact_companies')
          .select('contact_id')
          .eq('company_id', primaryCompany.company_id);

        const { data: dupContacts } = await supabase
          .from('contact_companies')
          .select('contact_id')
          .eq('company_id', duplicateCompany.company_id);

        const primaryContactIds = new Set(primaryContacts?.map(c => c.contact_id) || []);
        const newContacts = dupContacts?.filter(contact => !primaryContactIds.has(contact.contact_id)) || [];

        if (newContacts.length > 0) {
          await supabase.from('contact_companies').insert(
            newContacts.map(contact => ({
              company_id: primaryCompany.company_id,
              contact_id: contact.contact_id
            }))
          );
        }
      }

      // 5. Mark duplicate company as Skip
      await supabase
        .from('companies')
        .update({
          category: 'Skip',
          description: (duplicateCompany.description || '') + `\n\nMerged into ${primaryCompany.name} (${primaryCompany.company_id})`
        })
        .eq('company_id', duplicateCompany.company_id);

      setMessage({ type: 'success', text: 'Companies successfully merged!' });

      setTimeout(() => {
        onRequestClose();
      }, 2000);

    } catch (error) {
      console.error('Error merging companies:', error);
      setMessage({ type: 'error', text: 'Failed to merge companies: ' + error.message });
    } finally {
      setMerging(false);
    }
  };

  const filteredCompanies = companies.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        content: {
          top: '5%',
          left: '5%',
          right: '5%',
          bottom: '5%',
          padding: '20px',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <ModalContent>
        <ModalHeader>
          <h2>Merge Company: {company?.name}</h2>
          <CloseButton onClick={onRequestClose}>
            <FiX size={20} />
          </CloseButton>
        </ModalHeader>

        {message.text && (
          <Message className={message.type}>
            {message.text}
          </Message>
        )}

        {step === 'search' && (
          <>
            <SearchSection>
              <SearchInput
                type="text"
                placeholder="Search companies to merge with..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchSection>

            <CompanyList>
              {loading ? (
                <CompanyItem>Loading companies...</CompanyItem>
              ) : filteredCompanies.length === 0 ? (
                <CompanyItem>No companies found</CompanyItem>
              ) : (
                filteredCompanies.map(comp => (
                  <CompanyItem key={comp.company_id}>
                    <CompanyInfo>
                      <CompanyName>{comp.name}</CompanyName>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {comp.category} • {comp.website || 'No website'}
                      </div>
                    </CompanyInfo>
                    <SelectButton onClick={() => handleSelectCompany(comp)}>
                      Select
                    </SelectButton>
                  </CompanyItem>
                ))
              )}
            </CompanyList>
          </>
        )}

        {step === 'compare' && primaryCompany && duplicateCompany && (
          <ComparisonSection>
            <ComparisonGrid>
              <CompanyColumn>
                <ColumnHeader $isPrimary={true}>
                  PRIMARY: {primaryCompany.name}
                </ColumnHeader>
                <CompanyDetails>
                  <FieldGroup>
                    <FieldLabel>Name</FieldLabel>
                    <FieldValue>{primaryCompany.name}</FieldValue>
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Category</FieldLabel>
                    <FieldValue>{primaryCompany.category || 'None'}</FieldValue>
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Website</FieldLabel>
                    <FieldValue>{primaryCompany.website || 'None'}</FieldValue>
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Tags ({primaryCompany.tags?.length || 0})</FieldLabel>
                    <FieldValue>
                      <TagList>
                        {primaryCompany.tags?.map((tag, i) => (
                          <Tag key={i}>{tag.name}</Tag>
                        ))}
                      </TagList>
                    </FieldValue>
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Cities ({primaryCompany.cities?.length || 0})</FieldLabel>
                    <FieldValue>
                      {primaryCompany.cities?.map(city => `${city.name}, ${city.country}`).join('; ') || 'None'}
                    </FieldValue>
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Contacts ({primaryCompany.contacts?.length || 0})</FieldLabel>
                    <FieldValue>
                      {primaryCompany.contacts?.map(contact => `${contact.first_name} ${contact.last_name}`).join(', ') || 'None'}
                    </FieldValue>
                  </FieldGroup>
                </CompanyDetails>
              </CompanyColumn>

              <CompanyColumn>
                <ColumnHeader $isPrimary={false}>
                  DUPLICATE: {duplicateCompany.name}
                </ColumnHeader>
                <CompanyDetails>
                  <FieldGroup>
                    <FieldLabel>Name</FieldLabel>
                    <FieldValue>{duplicateCompany.name}</FieldValue>
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Category</FieldLabel>
                    <FieldValue>{duplicateCompany.category || 'None'}</FieldValue>
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Website</FieldLabel>
                    <FieldValue>{duplicateCompany.website || 'None'}</FieldValue>
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Tags ({duplicateCompany.tags?.length || 0})</FieldLabel>
                    <FieldValue>
                      <TagList>
                        {duplicateCompany.tags?.map((tag, i) => (
                          <Tag key={i}>{tag.name}</Tag>
                        ))}
                      </TagList>
                    </FieldValue>
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Cities ({duplicateCompany.cities?.length || 0})</FieldLabel>
                    <FieldValue>
                      {duplicateCompany.cities?.map(city => `${city.name}, ${city.country}`).join('; ') || 'None'}
                    </FieldValue>
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Contacts ({duplicateCompany.contacts?.length || 0})</FieldLabel>
                    <FieldValue>
                      {duplicateCompany.contacts?.map(contact => `${contact.first_name} ${contact.last_name}`).join(', ') || 'None'}
                    </FieldValue>
                  </FieldGroup>
                </CompanyDetails>
              </CompanyColumn>

              <ChoicesColumn>
                <ColumnHeader>MERGE CHOICES</ColumnHeader>
                {['name', 'category', 'website'].map(field => (
                  <ChoiceGroup key={field}>
                    <FieldLabel style={{ textTransform: 'capitalize' }}>{field}</FieldLabel>
                    <ChoiceOption>
                      <ChoiceRadio
                        type="radio"
                        name={field}
                        checked={mergeChoices[field] === 'primary'}
                        onChange={() => handleMergeChoiceChange(field, 'primary')}
                      />
                      Primary
                    </ChoiceOption>
                    <ChoiceOption>
                      <ChoiceRadio
                        type="radio"
                        name={field}
                        checked={mergeChoices[field] === 'duplicate'}
                        onChange={() => handleMergeChoiceChange(field, 'duplicate')}
                      />
                      Duplicate
                    </ChoiceOption>
                  </ChoiceGroup>
                ))}

                {['tags', 'cities', 'contacts'].map(field => (
                  <ChoiceGroup key={field}>
                    <FieldLabel style={{ textTransform: 'capitalize' }}>{field}</FieldLabel>
                    <ChoiceOption>
                      <ChoiceRadio
                        type="radio"
                        name={field}
                        checked={mergeChoices[field] === 'primary'}
                        onChange={() => handleMergeChoiceChange(field, 'primary')}
                      />
                      Primary Only
                    </ChoiceOption>
                    <ChoiceOption>
                      <ChoiceRadio
                        type="radio"
                        name={field}
                        checked={mergeChoices[field] === 'duplicate'}
                        onChange={() => handleMergeChoiceChange(field, 'duplicate')}
                      />
                      Duplicate Only
                    </ChoiceOption>
                    <ChoiceOption>
                      <ChoiceRadio
                        type="radio"
                        name={field}
                        checked={mergeChoices[field] === 'combine'}
                        onChange={() => handleMergeChoiceChange(field, 'combine')}
                      />
                      Combine Both
                    </ChoiceOption>
                  </ChoiceGroup>
                ))}
              </ChoicesColumn>
            </ComparisonGrid>
          </ComparisonSection>
        )}

        <ActionButtons>
          <Button className="secondary" onClick={onRequestClose}>
            Cancel
          </Button>

          {step === 'compare' && (
            <Button className="secondary" onClick={() => setStep('search')}>
              Back to Search
            </Button>
          )}

          {step === 'compare' && (
            <Button
              className="primary"
              onClick={handleMerge}
              disabled={merging}
            >
              {merging ? 'Merging...' : 'Execute Merge'}
            </Button>
          )}
        </ActionButtons>
      </ModalContent>
    </Modal>
  );
};

export default CompanyMergeModal;