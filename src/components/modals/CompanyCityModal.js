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

const CitiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 5px 0;
  min-height: 32px;
`;

const CityTag = styled.div`
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

const NewCityButton = styled.button`
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
  
  &.info {
    background-color: #e0f2fe;
    color: #0369a1;
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
    background-color: black;
    color: white;
    border: none;

    &:hover {
      background-color: #333;
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

// Helper function to get city colors
const getCityColor = () => {
  return { bg: '#e0f2fe', text: '#0369a1' }; // Sky blue
};

// Get flag emoji from city name (reused from Companies.js)
const getFlagEmoji = (cityName) => {
  // Map of some cities to their country codes
  const cityCountryMap = {
    'New York': 'US',
    'San Francisco': 'US',
    'Los Angeles': 'US',
    'Chicago': 'US',
    'London': 'GB',
    'Berlin': 'DE',
    'Paris': 'FR',
    'Rome': 'IT',
    'Madrid': 'ES',
    'Amsterdam': 'NL',
    'Tokyo': 'JP',
    'Sydney': 'AU',
    'Singapore': 'SG',
    'Hong Kong': 'HK',
    'Dubai': 'AE',
    'Mumbai': 'IN',
    'Toronto': 'CA',
    'Zurich': 'CH',
    'Milan': 'IT',
    'Barcelona': 'ES',
    'Stockholm': 'SE',
  };
  
  // Extract country code or default to question mark
  const countryCode = cityCountryMap[cityName] || 'unknown';
  
  // If unknown, return the city name without a flag
  if (countryCode === 'unknown') {
    return null;
  }
  
  // Convert country code to flag emoji
  return countryCode
    .toUpperCase()
    .replace(/./g, char => 
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    );
};

const CompanyCityModal = ({ isOpen, onRequestClose, company }) => {
  const [relatedCities, setRelatedCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch related cities for the company
  const fetchRelatedCities = async () => {
    try {
      console.log('Fetching related cities for company ID:', company.id);
      
      const { data, error } = await supabase
        .from('companies_cities')
        .select(`
          city_id,
          cities:city_id(id, name)
        `)
        .eq('company_id', company.id);

      if (error) throw error;

      const cities = data.map(item => ({
        id: item.city_id,
        name: item.cities.name
      }));

      console.log('Fetched cities:', cities);
      setRelatedCities(cities);
    } catch (error) {
      console.error('Error fetching related cities:', error);
      setMessage({ type: 'error', text: 'Failed to load cities' });
    }
  };

  // Fetch city suggestions based on search term
  const fetchCitySuggestions = async (search) => {
    try {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out cities that are already connected
      const filteredSuggestions = data.filter(city => 
        !relatedCities.some(related => related.id === city.id)
      );

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
    }
  };

  useEffect(() => {
    if (isOpen && company) {
      fetchRelatedCities();
    }
  }, [isOpen, company]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetchCitySuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleUnlinkCity = async (cityToRemove) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('companies_cities')
        .delete()
        .eq('company_id', company.id)
        .eq('city_id', cityToRemove.id);

      if (error) throw error;
      
      setRelatedCities(relatedCities.filter(city => city.id !== cityToRemove.id));
      setMessage({ type: 'success', text: 'City unlinked successfully' });
    } catch (error) {
      console.error('Error unlinking city:', error);
      setMessage({ type: 'error', text: 'Failed to unlink city' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = async (cityToAdd) => {
    try {
      setLoading(true);
      console.log('Adding city:', cityToAdd);
      console.log('Company:', company);
      
      // Ensure company.id is treated as an integer if needed
      const companyId = parseInt(company.id, 10);
      if (isNaN(companyId)) {
        throw new Error('Invalid company ID');
      }
      
      // Check if already associated
      const { data: existingCheck, error: checkError } = await supabase
        .from('companies_cities')
        .select('company_id, city_id')
        .eq('company_id', companyId)
        .eq('city_id', cityToAdd.id);
        
      if (checkError) {
        console.error('Error checking existing city:', checkError);
        throw checkError;
      }
      
      console.log('Existing check result:', existingCheck);
      
      if (existingCheck && existingCheck.length > 0) {
        console.log('City already linked:', existingCheck);
        setMessage({ type: 'info', text: 'This city is already linked to the company' });
        return;
      }
      
      const newAssociation = {
        company_id: companyId,
        city_id: cityToAdd.id,
        created_at: new Date().toISOString()
      };
      console.log('Creating new association:', newAssociation);
      
      const { data, error } = await supabase
        .from('companies_cities')
        .insert(newAssociation)
        .select();

      if (error) {
        console.error('Error inserting city:', error);
        throw error;
      }

      console.log('Successfully added city:', data);
      await fetchRelatedCities();
      setSearchTerm('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: 'City linked successfully' });
    } catch (error) {
      console.error('Error linking city:', error);
      setMessage({ type: 'error', text: `Failed to link city: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async () => {
    try {
      setLoading(true);
      
      // Create new city
      const { data, error } = await supabase
        .from('cities')
        .insert({ 
          name: searchTerm.trim(),
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      // Add the new city to the company
      if (data && data[0]) {
        await handleAddCity(data[0]);
      }
    } catch (error) {
      console.error('Error creating city:', error);
      setMessage({ type: 'error', text: 'Failed to create city' });
    } finally {
      setLoading(false);
    }
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
          <h2>Manage Company Cities</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>

        <Section>
          <SectionTitle>Company Cities</SectionTitle>
          <CitiesList>
            {relatedCities.map(city => {
              const color = getCityColor();
              const flag = getFlagEmoji(city.name);
              return (
                <CityTag 
                  key={city.id} 
                  color={color.bg}
                  textColor={color.text}
                >
                  {flag && <span className="flag" style={{ marginRight: '4px' }}>{flag}</span>}
                  <span title={city.name}>{city.name}</span>
                  <button 
                    onClick={() => handleUnlinkCity(city)}
                    disabled={loading}
                    title="Unlink city"
                  >
                    <FiX size={14} />
                  </button>
                </CityTag>
              );
            })}
            {relatedCities.length === 0 && (
              <span style={{ color: '#6c757d', fontStyle: 'italic', padding: '4px' }}>
                No cities linked
              </span>
            )}
          </CitiesList>
        </Section>

        <Section>
          <SectionTitle>Add Cities</SectionTitle>
          <SearchContainer>
            <SearchIcon>
              <FiSearch size={16} />
            </SearchIcon>
            <SearchInput
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a city (type at least 2 letters)..."
            />
          </SearchContainer>

          {showSuggestions && (
            <SuggestionsContainer>
              {suggestions.map(suggestion => (
                <SuggestionItem
                  key={suggestion.id}
                  onClick={() => handleAddCity(suggestion)}
                  disabled={loading}
                >
                  {suggestion.name}
                </SuggestionItem>
              ))}
              {suggestions.length === 0 && searchTerm.length >= 2 && (
                <div style={{ padding: '8px 12px', color: '#6c757d', fontSize: '0.875rem' }}>
                  No cities found
                </div>
              )}
              {searchTerm.length >= 2 && (
                <NewCityButton
                  onClick={handleCreateCity}
                  disabled={loading}
                >
                  <FiPlus size={14} />
                  Create "{searchTerm}" as new city
                </NewCityButton>
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
              borderTop: '3px solid #000000', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CompanyCityModal;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);