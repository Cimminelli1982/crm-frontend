import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiSearch } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

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

const SearchBox = styled.div`
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
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
`;

const CompanyItem = styled.div`
  padding: 15px;
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
  margin-bottom: 4px;
`;

const CompanyDetails = styled.div`
  color: #6b7280;
  font-size: 14px;
`;

const MergeButton = styled.button`
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background-color: #dc2626;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
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

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
`;

const SimpleCompanyMergeModal = ({ isOpen, onRequestClose, company }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [merging, setMerging] = useState(false);

  // Load all companies when modal opens
  useEffect(() => {
    if (isOpen && company) {
      loadAllCompanies();
    }
  }, [isOpen, company]);

  const loadAllCompanies = async () => {
    setLoading(true);
    try {
      console.log('Loading all companies except:', company.name);

      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, category, website, description')
        .neq('company_id', company.company_id)
        .not('category', 'eq', 'Skip')
        .order('name');

      if (error) throw error;

      console.log('Found companies:', data?.length || 0);
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      setMessage({ type: 'error', text: 'Failed to load companies' });
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMerge = async (targetCompany) => {
    if (!confirm(`Merge "${targetCompany.name}" into "${company.name}"? This will transfer all data and cannot be undone.`)) {
      return;
    }

    setMerging(true);
    try {
      console.log('Merging companies:', targetCompany.name, '->', company.name);

      // 1. Transfer tags
      const { data: targetTags } = await supabase
        .from('companies_tags')
        .select('tag_id')
        .eq('company_id', targetCompany.company_id);

      if (targetTags && targetTags.length > 0) {
        // Get existing tags to avoid duplicates
        const { data: existingTags } = await supabase
          .from('companies_tags')
          .select('tag_id')
          .eq('company_id', company.company_id);

        const existingTagIds = new Set(existingTags?.map(t => t.tag_id) || []);
        const newTags = targetTags
          .filter(tag => !existingTagIds.has(tag.tag_id))
          .map(tag => ({
            company_id: company.company_id,
            tag_id: tag.tag_id
          }));

        if (newTags.length > 0) {
          await supabase.from('companies_tags').insert(newTags);
        }
      }

      // 2. Transfer cities
      const { data: targetCities } = await supabase
        .from('companies_cities')
        .select('city_id')
        .eq('company_id', targetCompany.company_id);

      if (targetCities && targetCities.length > 0) {
        const { data: existingCities } = await supabase
          .from('companies_cities')
          .select('city_id')
          .eq('company_id', company.company_id);

        const existingCityIds = new Set(existingCities?.map(c => c.city_id) || []);
        const newCities = targetCities
          .filter(city => !existingCityIds.has(city.city_id))
          .map(city => ({
            company_id: company.company_id,
            city_id: city.city_id
          }));

        if (newCities.length > 0) {
          await supabase.from('companies_cities').insert(newCities);
        }
      }

      // 3. Transfer contacts
      const { data: targetContacts } = await supabase
        .from('contact_companies')
        .select('contact_id')
        .eq('company_id', targetCompany.company_id);

      if (targetContacts && targetContacts.length > 0) {
        const { data: existingContacts } = await supabase
          .from('contact_companies')
          .select('contact_id')
          .eq('company_id', company.company_id);

        const existingContactIds = new Set(existingContacts?.map(c => c.contact_id) || []);
        const newContacts = targetContacts
          .filter(contact => !existingContactIds.has(contact.contact_id))
          .map(contact => ({
            company_id: company.company_id,
            contact_id: contact.contact_id
          }));

        if (newContacts.length > 0) {
          await supabase.from('contact_companies').insert(newContacts);
        }
      }

      // 4. Mark target company as Skip
      await supabase
        .from('companies')
        .update({
          category: 'Skip',
          description: (targetCompany.description || '') + `\n\nMerged into ${company.name} (${company.company_id})`
        })
        .eq('company_id', targetCompany.company_id);

      setMessage({ type: 'success', text: `Successfully merged "${targetCompany.name}" into "${company.name}"` });

      // Remove merged company from list
      setCompanies(companies.filter(c => c.company_id !== targetCompany.company_id));

      // Close modal after 2 seconds
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
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
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

      <SearchBox>
        <SearchInput
          type="text"
          placeholder="Search companies to merge..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchBox>

      {loading ? (
        <LoadingText>Loading companies...</LoadingText>
      ) : (
        <CompanyList>
          {filteredCompanies.length === 0 ? (
            <CompanyItem>
              <CompanyInfo>
                <CompanyName>No companies found</CompanyName>
                <CompanyDetails>Try adjusting your search</CompanyDetails>
              </CompanyInfo>
            </CompanyItem>
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
                <MergeButton
                  onClick={() => handleMerge(comp)}
                  disabled={merging}
                >
                  {merging ? 'Merging...' : 'Merge'}
                </MergeButton>
              </CompanyItem>
            ))
          )}
        </CompanyList>
      )}
    </Modal>
  );
};

export default SimpleCompanyMergeModal;