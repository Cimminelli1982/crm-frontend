import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiSearch } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  gap: 10px;
`;

const Step = styled.div`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  ${props => props.$active ? `
    background-color: #3b82f6;
    color: white;
  ` : `
    background-color: #f3f4f6;
    color: #6b7280;
  `}
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const CompanyList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
`;

const CompanyItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #f3f4f6;
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
  margin-bottom: 4px;
`;

const CompanyDetails = styled.div`
  color: #6b7280;
  font-size: 14px;
`;

const SelectButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background-color: #2563eb;
  }
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CompanyCard = styled.div`
  background-color: ${props => props.$isPrimary ? '#dbeafe' : '#fef3c7'};
  border-radius: 8px;
  padding: 20px;
`;

const CardHeader = styled.h3`
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.$isPrimary ? '#1e40af' : '#92400e'};
  text-align: center;
`;

const Field = styled.div`
  margin-bottom: 12px;
`;

const FieldLabel = styled.div`
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  margin-bottom: 4px;
`;

const FieldValue = styled.div`
  background-color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 13px;
  color: #4b5563;
  min-height: 20px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const Tag = styled.span`
  background-color: #e0f2fe;
  color: #0369a1;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
`;

const ChoicesSection = styled.div`
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  margin-bottom: 20px;
`;

const ChoicesTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  text-align: center;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 10px;
`;

const ChoicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ChoiceCard = styled.div`
  background-color: white;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #e5e7eb;
`;

const ChoiceLabel = styled.div`
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  font-size: 14px;
  text-transform: capitalize;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 5px;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
  font-size: 13px;
  padding: 4px;
  border-radius: 3px;

  &:hover {
    background-color: #f1f5f9;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const RadioInput = styled.input`
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

const CompanyDuplicateModal = ({ isOpen, onRequestClose, company }) => {
  const [currentStep, setCurrentStep] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState([]);
  const [primaryCompany, setPrimaryCompany] = useState(null);
  const [duplicateCompany, setDuplicateCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [mergeChoices, setMergeChoices] = useState({
    name: 'primary',
    category: 'primary',
    website: 'primary',
    description: 'primary',
    tags: 'combine',
    cities: 'combine',
    contacts: 'combine'
  });

  useEffect(() => {
    if (isOpen && company && currentStep === 'search') {
      loadCompanies();
    }
  }, [isOpen, company, currentStep]);

  useEffect(() => {
    if (currentStep === 'compare' && primaryCompany && duplicateCompany) {
      loadDetailedData();
    }
  }, [currentStep, primaryCompany, duplicateCompany]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, category, website, description')
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

  const loadDetailedData = async () => {
    setLoading(true);
    try {
      const [primaryData, duplicateData] = await Promise.all([
        loadCompanyDetails(primaryCompany.company_id),
        loadCompanyDetails(duplicateCompany.company_id)
      ]);

      setPrimaryCompany({ ...primaryCompany, ...primaryData });
      setDuplicateCompany({ ...duplicateCompany, ...duplicateData });
    } catch (error) {
      console.error('Error loading detailed data:', error);
      setMessage({ type: 'error', text: 'Failed to load company details' });
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyDetails = async (companyId) => {
    try {
      const [tagsResult, citiesResult, contactsResult] = await Promise.all([
        supabase
          .from('company_tags')
          .select('tags(name)')
          .eq('company_id', companyId),
        supabase
          .from('company_cities')
          .select('cities(name, country)')
          .eq('company_id', companyId),
        supabase
          .from('contact_companies')
          .select('contacts(contact_id, first_name, last_name)')
          .eq('company_id', companyId)
      ]);

      return {
        tags: tagsResult.data?.map(t => t.tags).filter(Boolean) || [],
        cities: citiesResult.data?.map(c => c.cities).filter(Boolean) || [],
        contacts: contactsResult.data?.map(c => c.contacts).filter(Boolean) || []
      };
    } catch (error) {
      console.error('Error loading company details:', error);
      return { tags: [], cities: [], contacts: [] };
    }
  };

  const handleSelectCompany = (selectedComp) => {
    const isPrimary = confirm(`Make "${selectedComp.name}" the PRIMARY company?\n\nClick OK for PRIMARY\nClick Cancel to make "${company.name}" PRIMARY`);

    if (isPrimary) {
      setPrimaryCompany(selectedComp);
      setDuplicateCompany(company);
    } else {
      setPrimaryCompany(company);
      setDuplicateCompany(selectedComp);
    }

    setCurrentStep('compare');
  };

  const handleChoiceChange = (field, choice) => {
    setMergeChoices(prev => ({
      ...prev,
      [field]: choice
    }));
  };

  const handleMerge = async () => {
    if (!confirm('Execute merge according to your selections? This cannot be undone.')) {
      return;
    }

    setMerging(true);
    try {
      // Update basic fields
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

      // Handle tags
      await handleRelationMerge('company_tags', 'tag_id', mergeChoices.tags);

      // Handle cities
      await handleRelationMerge('company_cities', 'city_id', mergeChoices.cities);

      // Handle contacts FIRST - this will transfer the selected contacts to primary
      await handleRelationMerge('contact_companies', 'contact_id', mergeChoices.contacts);

      // Delete ALL remaining references to the duplicate company from ALL tables
      // Note: contact_companies for duplicate are deleted in handleRelationMerge or need to be cleaned up
      console.log('Cleaning up all remaining references to duplicate company:', duplicateCompany.company_id);

      await Promise.all([
        // All tables that have foreign keys to companies table
        supabase.from('company_attachments').delete().eq('company_id', duplicateCompany.company_id),
        // company_cities and company_tags are handled by handleRelationMerge above
        // contact_companies are handled by handleRelationMerge above
        supabase.from('investments').delete().eq('related_company', duplicateCompany.company_id),
        supabase.from('notes_companies').delete().eq('company_id', duplicateCompany.company_id),

        // Clean up any remaining relations that weren't handled by handleRelationMerge
        // This ensures ALL references are gone before deletion
        supabase.from('contact_companies').delete().eq('company_id', duplicateCompany.company_id),
        supabase.from('company_cities').delete().eq('company_id', duplicateCompany.company_id),
        supabase.from('company_tags').delete().eq('company_id', duplicateCompany.company_id)
      ]);

      console.log('All references cleaned up, now deleting duplicate company');

      // Now delete the duplicate company - this should work since all references are gone
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('company_id', duplicateCompany.company_id);

      if (deleteError) {
        console.error('Failed to delete company even after cleanup:', deleteError);
        throw new Error('Could not delete duplicate company: ' + deleteError.message);
      }

      console.log('Successfully deleted duplicate company');
      setMessage({ type: 'success', text: 'Companies merged and duplicate deleted successfully!' });

      setTimeout(() => {
        // If we're currently viewing the duplicate company that was deleted, redirect to primary
        if (window.location.pathname.includes(duplicateCompany.company_id)) {
          window.location.href = `/companies/${primaryCompany.company_id}`;
        } else {
          onRequestClose();
        }
      }, 2000);

    } catch (error) {
      console.error('Error merging companies:', error);
      setMessage({ type: 'error', text: 'Failed to merge companies: ' + error.message });
    } finally {
      setMerging(false);
    }
  };

  const handleRelationMerge = async (table, idField, choice) => {
    if (choice === 'duplicate') {
      await supabase.from(table).delete().eq('company_id', primaryCompany.company_id);

      const { data: dupRelations } = await supabase
        .from(table)
        .select(idField)
        .eq('company_id', duplicateCompany.company_id);

      if (dupRelations?.length > 0) {
        await supabase.from(table).insert(
          dupRelations.map(rel => ({
            company_id: primaryCompany.company_id,
            [idField]: rel[idField]
          }))
        );
      }
    } else if (choice === 'combine') {
      const [primaryResult, duplicateResult] = await Promise.all([
        supabase.from(table).select(idField).eq('company_id', primaryCompany.company_id),
        supabase.from(table).select(idField).eq('company_id', duplicateCompany.company_id)
      ]);

      const primaryIds = new Set(primaryResult.data?.map(r => r[idField]) || []);
      const newRelations = duplicateResult.data?.filter(rel => !primaryIds.has(rel[idField])) || [];

      if (newRelations.length > 0) {
        await supabase.from(table).insert(
          newRelations.map(rel => ({
            company_id: primaryCompany.company_id,
            [idField]: rel[idField]
          }))
        );
      }
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
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '95%',
          maxWidth: '1200px',
          height: '90vh',
          padding: '20px',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'white',
          overflow: 'auto'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827', fontWeight: 600 }}>
          Merge Company Duplicates: {company?.name}
        </h2>
        <button onClick={onRequestClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '4px' }}>
          <FiX size={20} />
        </button>
      </div>

      <StepIndicator>
        <Step $active={currentStep === 'search'}>1. Search Duplicates</Step>
        <Step $active={currentStep === 'compare'}>2. Compare & Merge</Step>
      </StepIndicator>

      {message.text && (
        <Message className={message.type}>
          {message.text}
        </Message>
      )}

      {currentStep === 'search' && (
        <>
          <SearchInput
            type="text"
            placeholder="Search for potential duplicates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

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
                    <CompanyDetails>
                      {comp.category && `${comp.category} • `}
                      {comp.website || 'No website'}
                    </CompanyDetails>
                  </CompanyInfo>
                  <SelectButton onClick={() => handleSelectCompany(comp)}>
                    Select for Comparison
                  </SelectButton>
                </CompanyItem>
              ))
            )}
          </CompanyList>
        </>
      )}

      {currentStep === 'compare' && primaryCompany && duplicateCompany && (
        <>
          <ComparisonGrid>
            <CompanyCard $isPrimary={true}>
              <CardHeader $isPrimary={true}>PRIMARY: {primaryCompany.name}</CardHeader>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <FieldValue>{primaryCompany.name}</FieldValue>
              </Field>
              <Field>
                <FieldLabel>Category</FieldLabel>
                <FieldValue>{primaryCompany.category || 'None'}</FieldValue>
              </Field>
              <Field>
                <FieldLabel>Website</FieldLabel>
                <FieldValue>{primaryCompany.website || 'None'}</FieldValue>
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <FieldValue>{primaryCompany.description || 'None'}</FieldValue>
              </Field>
              <Field>
                <FieldLabel>Tags ({primaryCompany.tags?.length || 0})</FieldLabel>
                <FieldValue>
                  <TagsContainer>
                    {primaryCompany.tags?.map((tag, i) => (
                      <Tag key={i}>{tag.name}</Tag>
                    ))}
                  </TagsContainer>
                </FieldValue>
              </Field>
              <Field>
                <FieldLabel>Cities ({primaryCompany.cities?.length || 0})</FieldLabel>
                <FieldValue>
                  {primaryCompany.cities?.map(city => `${city.name}, ${city.country}`).join('; ') || 'None'}
                </FieldValue>
              </Field>
              <Field>
                <FieldLabel>Contacts ({primaryCompany.contacts?.length || 0})</FieldLabel>
                <FieldValue>
                  {primaryCompany.contacts?.map(contact => `${contact.first_name} ${contact.last_name}`).join(', ') || 'None'}
                </FieldValue>
              </Field>
            </CompanyCard>

            <CompanyCard $isPrimary={false}>
              <CardHeader $isPrimary={false}>DUPLICATE: {duplicateCompany.name}</CardHeader>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <FieldValue>{duplicateCompany.name}</FieldValue>
              </Field>
              <Field>
                <FieldLabel>Category</FieldLabel>
                <FieldValue>{duplicateCompany.category || 'None'}</FieldValue>
              </Field>
              <Field>
                <FieldLabel>Website</FieldLabel>
                <FieldValue>{duplicateCompany.website || 'None'}</FieldValue>
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <FieldValue>{duplicateCompany.description || 'None'}</FieldValue>
              </Field>
              <Field>
                <FieldLabel>Tags ({duplicateCompany.tags?.length || 0})</FieldLabel>
                <FieldValue>
                  <TagsContainer>
                    {duplicateCompany.tags?.map((tag, i) => (
                      <Tag key={i}>{tag.name}</Tag>
                    ))}
                  </TagsContainer>
                </FieldValue>
              </Field>
              <Field>
                <FieldLabel>Cities ({duplicateCompany.cities?.length || 0})</FieldLabel>
                <FieldValue>
                  {duplicateCompany.cities?.map(city => `${city.name}, ${city.country}`).join('; ') || 'None'}
                </FieldValue>
              </Field>
              <Field>
                <FieldLabel>Contacts ({duplicateCompany.contacts?.length || 0})</FieldLabel>
                <FieldValue>
                  {duplicateCompany.contacts?.map(contact => `${contact.first_name} ${contact.last_name}`).join(', ') || 'None'}
                </FieldValue>
              </Field>
            </CompanyCard>
          </ComparisonGrid>

          <ChoicesSection>
            <ChoicesTitle>MERGE CHOICES</ChoicesTitle>
            <ChoicesGrid>
              {['name', 'category', 'website', 'description'].map(field => (
                <ChoiceCard key={field}>
                  <ChoiceLabel>{field}</ChoiceLabel>
                  <RadioOption>
                    <RadioInput
                      type="radio"
                      name={field}
                      checked={mergeChoices[field] === 'primary'}
                      onChange={() => handleChoiceChange(field, 'primary')}
                    />
                    Primary
                  </RadioOption>
                  <RadioOption>
                    <RadioInput
                      type="radio"
                      name={field}
                      checked={mergeChoices[field] === 'duplicate'}
                      onChange={() => handleChoiceChange(field, 'duplicate')}
                    />
                    Duplicate
                  </RadioOption>
                </ChoiceCard>
              ))}

              {['tags', 'cities', 'contacts'].map(field => (
                <ChoiceCard key={field}>
                  <ChoiceLabel>{field}</ChoiceLabel>
                  <RadioOption>
                    <RadioInput
                      type="radio"
                      name={field}
                      checked={mergeChoices[field] === 'primary'}
                      onChange={() => handleChoiceChange(field, 'primary')}
                    />
                    Primary Only
                  </RadioOption>
                  <RadioOption>
                    <RadioInput
                      type="radio"
                      name={field}
                      checked={mergeChoices[field] === 'duplicate'}
                      onChange={() => handleChoiceChange(field, 'duplicate')}
                    />
                    Duplicate Only
                  </RadioOption>
                  <RadioOption>
                    <RadioInput
                      type="radio"
                      name={field}
                      checked={mergeChoices[field] === 'combine'}
                      onChange={() => handleChoiceChange(field, 'combine')}
                    />
                    Combine Both
                  </RadioOption>
                </ChoiceCard>
              ))}
            </ChoicesGrid>
          </ChoicesSection>
        </>
      )}

      <ActionButtons>
        <Button className="secondary" onClick={onRequestClose}>
          Cancel
        </Button>

        {currentStep === 'compare' && (
          <Button className="secondary" onClick={() => setCurrentStep('search')}>
            Back to Search
          </Button>
        )}

        {currentStep === 'compare' && (
          <Button
            className="primary"
            onClick={handleMerge}
            disabled={merging}
          >
            {merging ? 'Merging...' : 'Execute Merge'}
          </Button>
        )}
      </ActionButtons>
    </Modal>
  );
};

export default CompanyDuplicateModal;