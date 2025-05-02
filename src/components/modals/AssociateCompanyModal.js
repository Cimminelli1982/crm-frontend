import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { FiX, FiPlus, FiSearch, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Styled components
const ModalContainer = styled.div`
  width: 100%;
  max-width: 600px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
`;

const Title = styled.h2`
  color: #fff;
  font-size: 20px;
  font-weight: 500;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  color: #00ff00;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  padding: 5px;
  border-radius: 4px;

  &:hover {
    background: #333;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #00ff00;
  font-size: 14px;
  font-weight: 500;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 40px 10px 12px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
  height: 40px;

  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
`;

const ResultsContainer = styled.div`
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 10px;
`;

const ResultItem = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: #333;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ResultInfo = styled.div`
  flex: 1;
`;

const ResultCompanyName = styled.div`
  color: #fff;
  font-weight: 500;
  margin-bottom: 4px;
`;

const ResultCompanyDetail = styled.div`
  color: #999;
  font-size: 12px;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: #00ff00;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  margin-left: 5px;
  border-radius: 4px;

  &:hover {
    background: #444;
  }
`;

const EmptyMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #999;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background: #333;
    color: #00ff00;
    border: 1px solid #00ff00;
    
    &:hover {
      background: #444;
    }
  }
  
  &.cancel {
    background: transparent;
    color: #fff;
    border: 1px solid #555;
    
    &:hover {
      background: #333;
    }
  }
`;

const RelationshipSelect = styled.select`
  width: 100%;
  padding: 10px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' stroke='%23aaa' stroke-width='1.5' viewBox='0 0 10 6'><polyline points='1,1 5,5 9,1'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
  height: 40px;

  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

// Define relationship types
const RELATIONSHIP_TYPES = [
  "not_set",
  "employee",
  "founder",
  "advisor",
  "manager",
  "investor",
  "other"
];

const AssociateCompanyModal = ({ 
  isOpen, 
  onRequestClose, 
  contactId,
  onCompanyAssociated = () => {}
}) => {
  // State for the search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  
  // State for selected company and relationship
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [relationship, setRelationship] = useState('not_set');
  const [isPrimary, setIsPrimary] = useState(false);
  
  // Refs
  const searchInputRef = useRef(null);
  const searchTimeout = useRef(null);
  
  // Focus the search input when the modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
    
    // Clear state when modal opens
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedCompany(null);
      setRelationship('not_set');
      setIsPrimary(false);
      setNoResults(false);
    }
  }, [isOpen]);
  
  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (value.length < 2) {
      setSearchResults([]);
      setNoResults(false);
      return;
    }
    
    // Set a new timeout for search
    searchTimeout.current = setTimeout(() => {
      searchCompanies(value);
    }, 300);
  };
  
  // Handle search with Enter key
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (searchTerm.length < 2) return;
      
      // Clear previous timeout and search immediately
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchCompanies(searchTerm);
    }
  };
  
  // Search companies in Supabase
  const searchCompanies = async (term) => {
    setLoading(true);
    
    try {
      // Get existing associations to filter out already associated companies
      const { data: existingAssociations, error: associationsError } = await supabase
        .from('contact_companies')
        .select('company_id')
        .eq('contact_id', contactId);
        
      if (associationsError) throw associationsError;
      
      const existingCompanyIds = new Set(existingAssociations.map(a => a.company_id));
      
      // Search for companies by name
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${term}%`)
        .order('name', { ascending: true })
        .limit(20);
        
      if (error) throw error;
      
      // Filter out already associated companies
      const filteredResults = data.filter(company => !existingCompanyIds.has(company.company_id));
      
      setSearchResults(filteredResults);
      setNoResults(filteredResults.length === 0);
    } catch (error) {
      console.error('Error searching companies:', error);
      toast.error('Failed to search companies');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle selecting a company
  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setSearchResults([]);
    setSearchTerm(company.name);
  };
  
  // Handle creating a new company
  const handleCreateNewCompany = () => {
    // Close this modal and open the new company modal
    onRequestClose();
    // Signal to parent component to open new company modal with the search term
    onCompanyAssociated({ action: 'create_new', name: searchTerm });
  };
  
  // Handle associating the company
  const handleAssociateCompany = async () => {
    if (!selectedCompany) {
      toast.error('Please select a company to associate');
      return;
    }
    
    if (!contactId) {
      console.error('Missing contact ID when trying to associate company', { 
        contactId, 
        companyId: selectedCompany?.company_id 
      });
      toast.error('Cannot associate company: Missing contact ID');
      return;
    }
    
    try {
      // Show loading state
      toast.loading('Associating company...', { id: 'associate-company' });
      
      console.log('Associating company to contact', { 
        contactId: contactId,
        contactIdType: typeof contactId,
        companyId: selectedCompany.company_id,
        companyName: selectedCompany.name,
        relationship: relationship,
        isPrimary: isPrimary
      });
      
      // Associate the company with the contact
      const { data, error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contactId,
          company_id: selectedCompany.company_id,
          relationship: relationship,
          is_primary: isPrimary
        })
        .select();
        
      if (error) {
        console.error('Database error when associating company:', error);
        throw error;
      }
      
      console.log('Company association successful:', data);
      
      // Dismiss loading toast and show success
      toast.dismiss('associate-company');
      toast.success(`${selectedCompany.name} associated successfully`);
      
      // Call the callback with the response data
      onCompanyAssociated({ 
        action: 'associated',
        company: selectedCompany,
        relationship: relationship,
        is_primary: isPrimary,
        data: data?.[0] // Include the response data for the contact_companies entry
      });
      
      // Close the modal
      onRequestClose();
    } catch (error) {
      console.error('Error associating company:', error);
      toast.dismiss('associate-company');
      toast.error(`Failed to associate company: ${error.message || 'Unknown error'}`);
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
          padding: '25px',
          border: '1px solid #444',
          borderRadius: '8px',
          backgroundColor: '#111',
          color: '#fff',
          maxWidth: '600px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000
        }
      }}
    >
      <ModalContainer>
        <Header>
          <Title>Associate Company</Title>
          <CloseButton onClick={onRequestClose}>
            <FiX size={20} />
          </CloseButton>
        </Header>
        
        <SearchContainer>
          <SearchInput 
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search for a company by name..."
          />
          <SearchIcon>
            <FiSearch size={16} />
          </SearchIcon>
        </SearchContainer>
        
        {loading && (
          <EmptyMessage>Searching...</EmptyMessage>
        )}
        
        {!loading && searchTerm.length >= 2 && (
          <>
            {searchResults.length > 0 ? (
              <ResultsContainer>
                {searchResults.map(company => (
                  <ResultItem key={company.company_id} onClick={() => handleSelectCompany(company)}>
                    <ResultInfo>
                      <ResultCompanyName>{company.name}</ResultCompanyName>
                      <ResultCompanyDetail>
                        {company.category || 'No category'} • {company.website || 'No website'}
                      </ResultCompanyDetail>
                    </ResultInfo>
                    <ActionButton title="View details">
                      <FiExternalLink size={16} />
                    </ActionButton>
                  </ResultItem>
                ))}
              </ResultsContainer>
            ) : noResults ? (
              <ResultsContainer>
                <EmptyMessage>
                  No companies found with that name.
                  <div style={{ marginTop: '10px' }}>
                    <Button className="primary" onClick={handleCreateNewCompany}>
                      <FiPlus size={14} /> Create "{searchTerm}"
                    </Button>
                  </div>
                </EmptyMessage>
              </ResultsContainer>
            ) : null}
          </>
        )}
        
        {selectedCompany && (
          <>
            <FormGroup style={{ marginTop: '20px' }}>
              <FormLabel>Relationship</FormLabel>
              <RelationshipSelect
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              >
                {RELATIONSHIP_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type === 'not_set' ? 'Not Set' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </RelationshipSelect>
            </FormGroup>
            
            <FormGroup>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  style={{ marginRight: '10px' }}
                />
                <label htmlFor="isPrimary" style={{ color: '#fff' }}>
                  Set as primary company
                </label>
              </div>
            </FormGroup>
          </>
        )}
        
        <ButtonGroup>
          <Button className="cancel" onClick={onRequestClose}>
            Cancel
          </Button>
          <Button 
            className="primary" 
            onClick={handleAssociateCompany}
            disabled={!selectedCompany}
          >
            {selectedCompany ? `Associate with ${selectedCompany.name}` : 'Select a Company'}
          </Button>
        </ButtonGroup>
      </ModalContainer>
    </Modal>
  );
};

export default AssociateCompanyModal;