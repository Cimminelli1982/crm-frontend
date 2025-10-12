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
  border-bottom: 1px solid #333;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #00ff00;
    font-weight: 600;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #ffffff;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      color: #ff5555;
    }
  }
`;

const Section = styled.div`
  margin-bottom: 15px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
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
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  border-radius: 4px;
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
    color: #00ff00;
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      opacity: 1;
      color: #ff5555;
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
  color: #999;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 10px 10px 35px;
  border: 1px solid #444;
  background-color: #222;
  color: #eee;
  border-radius: 4px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #00ff00;
  }
`;

const SuggestionsContainer = styled.div`
  position: relative;
  margin-top: 5px;
  border: 1px solid #444;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  background-color: #222;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
  color: #eee;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background-color: #333;
    color: #00ff00;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #333;
  }
`;

const NewCityButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background-color: #333;
  cursor: pointer;
  font-size: 0.875rem;
  color: #00ff00;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #444;
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
  display: flex;
  align-items: center;
  gap: 8px;

  &.primary {
    background-color: #00ff00;
    color: black;
    border: none;

    &:hover {
      background-color: #00dd00;
    }
  }

  &.secondary {
    background-color: transparent;
    color: #ccc;
    border: 1px solid #555;

    &:hover {
      background-color: #333;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Helper function to get city colors
const getCityColor = () => {
  return { bg: '#222', text: '#00ff00', border: '#00ff00' }; // Black with fluorescent green
};

const CityModal = ({ isOpen, onRequestClose, contact, onCityAdded, onCityRemoved }) => {
  const [relatedCities, setRelatedCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedCities, setSuggestedCities] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch intelligent city suggestions based on contact's description
  const fetchIntelligentSuggestions = async () => {
    if (!contact?.description && !contact?.job_role) {
      setSuggestedCities([]);
      return;
    }

    try {
      setLoadingSuggestions(true);

      // Extract potential city names from description
      const text = `${contact.description || ''} ${contact.job_role || ''}`.toLowerCase();

      // Common city-related keywords to look for
      const cityPatterns = [
        /\b(new york|nyc|ny)\b/gi,
        /\b(los angeles|la|l\.a\.)\b/gi,
        /\b(san francisco|sf|bay area)\b/gi,
        /\b(chicago|chi-town)\b/gi,
        /\b(boston|bos)\b/gi,
        /\b(seattle|sea)\b/gi,
        /\b(austin|atx)\b/gi,
        /\b(denver|den)\b/gi,
        /\b(miami|mia)\b/gi,
        /\b(london|ldn)\b/gi,
        /\b(paris)\b/gi,
        /\b(berlin)\b/gi,
        /\b(tokyo)\b/gi,
        /\b(singapore|sgp)\b/gi,
        /\b(dubai)\b/gi,
        /\b(toronto|to)\b/gi,
        /\b(vancouver|van)\b/gi,
        /\b(sydney|syd)\b/gi,
        /\b(melbourne|mel)\b/gi,
        /\b(amsterdam|ams)\b/gi,
        /\b(barcelona|bcn)\b/gi,
        /\b(madrid)\b/gi,
        /\b(lisbon)\b/gi,
        /\b(tel aviv)\b/gi,
        /\b(bangalore|bengaluru)\b/gi,
        /\b(mumbai|bombay)\b/gi,
        /\b(delhi|new delhi)\b/gi,
        /\b(shanghai)\b/gi,
        /\b(beijing)\b/gi,
        /\b(hong kong|hk)\b/gi
      ];

      // Extract potential city names
      const potentialCities = [];
      cityPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          potentialCities.push(...matches);
        }
      });

      // Also look for words that might be cities (capitalized words in description)
      const capitalizedWords = (contact.description || '').match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];

      // Combine all potential city names
      const allPotentialCities = [...new Set([...potentialCities, ...capitalizedWords])];

      if (allPotentialCities.length === 0) {
        setSuggestedCities([]);
        return;
      }

      // Search for these cities in the database
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .or(allPotentialCities.map(city => `name.ilike.%${city}%`).join(','))
        .limit(10);

      if (error) throw error;

      // Filter out cities already associated with contact
      const filteredSuggestions = data.filter(city =>
        !relatedCities.some(related => related.id === city.city_id)
      );

      // Score and sort suggestions by relevance
      const scoredSuggestions = filteredSuggestions.map(city => {
        let score = 0;
        const cityNameLower = city.name.toLowerCase();

        // Higher score for exact matches in description
        if (text.includes(cityNameLower)) {
          score += 5;
        }

        // Check for partial matches
        allPotentialCities.forEach(potential => {
          if (cityNameLower.includes(potential.toLowerCase())) {
            score += 3;
          }
        });

        // Bonus for major cities
        const majorCities = ['new york', 'los angeles', 'san francisco', 'london', 'paris', 'tokyo', 'singapore'];
        if (majorCities.some(major => cityNameLower.includes(major))) {
          score += 2;
        }

        return { ...city, score };
      });

      // Sort by score and take top suggestions
      const topSuggestions = scoredSuggestions
        .sort((a, b) => b.score - a.score)
        .filter(city => city.score > 0)
        .slice(0, 5);

      setSuggestedCities(topSuggestions);
    } catch (error) {
      console.error('Error fetching intelligent city suggestions:', error);
      setSuggestedCities([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Fetch related cities for the contact
  const fetchRelatedCities = async () => {
    try {
      console.log('Fetching related cities for contact ID:', contact.contact_id);
      
      const { data, error } = await supabase
        .from('contact_cities')
        .select(`
          city_id,
          cities:city_id(city_id, name)
        `)
        .eq('contact_id', contact.contact_id);

      if (error) throw error;
      
      console.log('Raw city data from DB:', data);

      const cities = data.map(item => ({
        id: item.city_id,
        name: item.cities?.name || 'Unknown City'
      }));
      
      // Handle case where cities is empty or null
      if (cities.length === 0 && data.length > 0) {
        console.log('Cities data format mismatch, trying alternative format');
        // Try alternative format in case the join didn't work
        const altCities = await Promise.all(data.map(async (item) => {
          try {
            const { data: cityData } = await supabase
              .from('cities')
              .select('city_id, name')
              .eq('city_id', item.city_id)
              .single();
              
            return {
              id: item.city_id,
              name: cityData?.name || 'Unknown City'
            };
          } catch (err) {
            console.error('Error fetching individual city:', err);
            return {
              id: item.city_id,
              name: 'Failed to load'
            };
          }
        }));
        
        if (altCities.length > 0) {
          console.log('Using alternative cities format:', altCities);
          setRelatedCities(altCities);
          return; // Exit early after setting cities
        }
      }

      console.log('Formatted cities:', cities);
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
      
      console.log('City suggestions from DB:', data);

      // Filter out cities that are already connected
      const filteredSuggestions = data.filter(city => {
        console.log('Checking if city is already connected:', city);
        return !relatedCities.some(related => {
          console.log('  Comparing with related city:', related);
          return related.id === city.city_id;
        });
      });

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
    }
  };

  useEffect(() => {
    if (isOpen && contact) {
      fetchRelatedCities();
      fetchIntelligentSuggestions();
    }
  }, [isOpen, contact]);

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
        .from('contact_cities')
        .delete()
        .eq('contact_id', contact.contact_id)
        .eq('city_id', cityToRemove.id);

      if (error) throw error;
      
      // Update local state
      setRelatedCities(relatedCities.filter(city => city.id !== cityToRemove.id));
      
      // Notify parent component that city was removed
      if (onCityRemoved && typeof onCityRemoved === 'function') {
        console.log('Notifying parent about removed city:', cityToRemove);
        onCityRemoved(cityToRemove);
      }
      
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
      console.log('Full Contact Object:', contact);
      console.log('Contact ID:', contact?.contact_id);
      console.log('Contact Keys:', Object.keys(contact || {}));
      
      // Extract contact ID - for debugging let's try to find it in different formats
      let contactId;
      
      if (contact.contact_id) {
        contactId = contact.contact_id;
      } else if (contact.id) {
        contactId = contact.id;
      } else {
        console.error('Cannot find contact ID in contact object:', contact);
        throw new Error('Invalid contact ID - missing from contact object');
      }
      
      console.log('Using contact ID:', contactId);
      console.log('City to add:', cityToAdd);
      
      // Check if already associated
      const { data: existingCheck, error: checkError } = await supabase
        .from('contact_cities')
        .select('contact_id, city_id')
        .eq('contact_id', contactId)
        .eq('city_id', cityToAdd.city_id || cityToAdd.id);
        
      if (checkError) {
        console.error('Error checking existing city:', checkError);
        throw checkError;
      }
      
      console.log('Existing check result:', existingCheck);
      
      if (existingCheck && existingCheck.length > 0) {
        console.log('City already linked:', existingCheck);
        setMessage({ type: 'info', text: 'This city is already linked to the contact' });
        return;
      }
      
      const newAssociation = {
        contact_id: contactId,
        city_id: cityToAdd.city_id || cityToAdd.id,
        created_at: new Date().toISOString()
      };
      console.log('Creating new association:', newAssociation);
      
      const { data, error } = await supabase
        .from('contact_cities')
        .insert(newAssociation)
        .select();

      if (error) {
        console.error('Error inserting city:', error);
        throw error;
      }

      console.log('Successfully added city:', data);
      
      // Notify parent component about the added city
      if (onCityAdded && typeof onCityAdded === 'function') {
        // Create a city object that matches the format expected by the table
        const newCity = {
          city_id: cityToAdd.city_id || cityToAdd.id,
          name: cityToAdd.name,
          entry_id: data[0]?.entry_id || `temp-${Date.now()}`
        };
        console.log('Notifying parent about new city:', newCity);
        onCityAdded(newCity);
      }
      
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
          country: 'Unknown', // Adding required field from the schema
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      // Add the new city to the contact
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
          border: '1px solid #333',
          backgroundColor: '#121212',
          color: '#e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
          maxWidth: '500px',
          width: '90%',
          minHeight: '360px'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <h2>Manage Cities</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>

        <Section>
          <SectionTitle>Related Cities</SectionTitle>
          <CitiesList>
            {relatedCities.map(city => {
              const color = getCityColor();
              return (
                <CityTag 
                  key={city.id} 
                  color={color.bg}
                  textColor={color.text}
                >
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

        {/* Smart Suggestions Section */}
        {suggestedCities.length > 0 && (
          <Section>
            <SectionTitle style={{ color: '#FCD34D' }}>
              <FiPlus size={14} />
              Smart Suggestions
            </SectionTitle>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '12px'
            }}>
              {loadingSuggestions ? (
                <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                  Analyzing description...
                </span>
              ) : (
                suggestedCities.map((city) => (
                  <button
                    key={city.city_id}
                    onClick={() => handleAddCity(city)}
                    disabled={loading}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid #FCD34D',
                      backgroundColor: 'rgba(252, 211, 77, 0.1)',
                      color: '#FCD34D',
                      fontSize: '0.875rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.target.style.backgroundColor = 'rgba(252, 211, 77, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(252, 211, 77, 0.1)';
                    }}
                    title={`Add ${city.name} - Found in contact description`}
                  >
                    <FiPlus size={12} style={{ marginRight: '4px', display: 'inline' }} />
                    {city.name}
                    {city.country && city.country !== 'Unknown' && (
                      <span style={{ opacity: 0.7, marginLeft: '4px' }}>
                        ({city.country})
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#9CA3AF',
              marginTop: '4px'
            }}>
              Based on contact's description
            </div>
          </Section>
        )}

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
              borderTop: '3px solid #007BFF', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CityModal;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style); 