import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiMail } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001; /* Higher than MailingListsModal */
`;

const ModalContainer = styled.div`
  background-color: #111;
  border: 2px solid #00ff00;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  height: 80%;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #333;
  background-color: #000;
`;

const ModalTitle = styled.h2`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    color: #ffffff;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  display: flex;
  background-color: #111;
  overflow: hidden;
`;

const LeftSidebar = styled.div`
  width: 200px;
  background-color: #000;
  border-right: 1px solid #333;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ListTypeButton = styled.button`
  background-color: ${props => props.$active ? '#00ff00' : '#111'};
  border: 2px solid ${props => props.$active ? '#00ff00' : '#333'};
  color: ${props => props.$active ? '#000' : '#ffffff'};
  padding: 15px 10px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  text-align: center;
  
  &:hover {
    border-color: #00ff00;
    color: ${props => props.$active ? '#000' : '#00ff00'};
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  text-transform: uppercase;
`;

const Input = styled.input`
  background-color: #000;
  border: 2px solid #333;
  color: #ffffff;
  padding: 12px 15px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  border-radius: 4px;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #00ff00;
  }
  
  &::placeholder {
    color: #666;
  }
`;

const ContactsSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ContactsContainer = styled.div`
  flex: 1;
  background-color: #000;
  border: 2px solid #333;
  border-radius: 4px;
  padding: 20px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const PlaceholderText = styled.div`
  color: #666;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FilterRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TagsContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const TagBox = styled.div`
  background-color: #000;
  border: 2px solid #333;
  color: #ffffff;
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border-radius: 4px;
  min-width: 80px;
  min-height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #00ff00;
    color: #00ff00;
  }
`;

const ScoreContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const ScoreBox = styled.div`
  background-color: #000;
  border: 2px solid #333;
  color: #ffffff;
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  border-radius: 4px;
  width: 50px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #00ff00;
    color: #00ff00;
  }
  
  &.selected {
    background-color: #00ff00;
    color: #000;
    border-color: #00ff00;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #333;
  background-color: #000;
`;

const CreateButton = styled.button`
  background-color: #000;
  border: 2px solid #00ff00;
  color: #00ff00;
  padding: 12px 30px;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #00ff00;
    color: #000;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background-color: #000;
      color: #00ff00;
    }
  }
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
`;

const ContactItem = styled.div`
  background: #000;
  border: 1px solid #333;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
`;

const ContactName = styled.div`
  color: #00ff00;
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 4px;
`;

const ContactEmail = styled.div`
  color: #ccc;
  font-size: 11px;
`;

const CreateNewListModal = ({ isOpen, onClose }) => {
  const [listType, setListType] = useState('static');
  const [listName, setListName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCities, setSearchCities] = useState('');
  const [associatedCities, setAssociatedCities] = useState([]);
  const [searchTags, setSearchTags] = useState('');
  const [associatedTags, setAssociatedTags] = useState([]);
  const [selectedScores, setSelectedScores] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState(null);

  const handleCreate = () => {
    // TODO: Implement create functionality
    console.log('Creating list:', {
      type: listType,
      name: listName,
      searchTerm: searchTerm
    });
  };

  const handleClose = () => {
    // Reset form when closing
    setListType('static');
    setListName('');
    setSearchTerm('');
    setSearchCities('');
    setAssociatedCities([]);
    setSearchTags('');
    setAssociatedTags([]);
    setSelectedScores([]);
    setFilteredContacts([]);
    setLoadingContacts(false);
    setContactsError(null);
    onClose();
  };

  const handleScoreClick = (score) => {
    setSelectedScores(prev => 
      prev.includes(score) 
        ? prev.filter(s => s !== score)
        : [...prev, score]
    );
  };

  // Fetch filtered contacts when dynamic list criteria changes
  useEffect(() => {
    if (listType === 'dynamic') {
      fetchFilteredContacts();
    }
  }, [listType, associatedCities, associatedTags, selectedScores]);

  const fetchFilteredContacts = async () => {
    if (listType !== 'dynamic') return;

    try {
      setLoadingContacts(true);
      setContactsError(null);

      // Build filters for the edge function
      const filters = {
        limit: 100, // Limit for preview
        offset: 0
      };

      // Add score range filter
      if (selectedScores.length > 0) {
        const minScore = Math.min(...selectedScores);
        const maxScore = Math.max(...selectedScores);
        filters.score_range = [minScore, maxScore];
      }

      // Add city filters (map to categories - you may need to adjust this mapping)
      if (associatedCities.length > 0) {
        // This is a simplified mapping - you might need to adjust based on your data structure
        filters.category = associatedCities;
      }

      // Add tag filters (map to keep_in_touch - you may need to adjust this mapping)
      if (associatedTags.length > 0) {
        // This is a simplified mapping - you might need to adjust based on your data structure
        filters.keep_in_touch = associatedTags;
      }

      console.log('Fetching contacts with filters:', filters);

      // Call the get-filtered-contacts edge function
      const { data, error } = await supabase.functions.invoke('get-filtered-contacts', {
        body: { filters }
      });

      if (error) {
        throw error;
      }

      if (data && data.contacts) {
        setFilteredContacts(data.contacts);
        console.log('Filtered contacts:', data.contacts.length);
      } else {
        setFilteredContacts([]);
      }

    } catch (err) {
      console.error('Error fetching filtered contacts:', err);
      setContactsError(err.message);
      setFilteredContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const addCity = (city) => {
    if (city.trim() && !associatedCities.includes(city.trim())) {
      setAssociatedCities(prev => [...prev, city.trim()]);
      setSearchCities('');
    }
  };

  const removeCity = (cityToRemove) => {
    setAssociatedCities(prev => prev.filter(city => city !== cityToRemove));
  };

  const addTag = (tag) => {
    if (tag.trim() && !associatedTags.includes(tag.trim())) {
      setAssociatedTags(prev => [...prev, tag.trim()]);
      setSearchTags('');
    }
  };

  const removeTag = (tagToRemove) => {
    setAssociatedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleCityKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCity(searchCities);
    }
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(searchTags);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiMail style={{ marginRight: '10px' }} />
            Create New List
          </ModalTitle>
          <CloseButton onClick={handleClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>
        
        <ModalContent>
          <LeftSidebar>
            <ListTypeButton
              $active={listType === 'static'}
              onClick={() => setListType('static')}
            >
              Create Static List
            </ListTypeButton>
            <ListTypeButton
              $active={listType === 'dynamic'}
              onClick={() => setListType('dynamic')}
            >
              Create Dynamic List
            </ListTypeButton>
          </LeftSidebar>
          
          <MainContent>
            <FormSection>
              <Label>List Name:</Label>
              <Input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Enter list name..."
              />
            </FormSection>
            
            {listType === 'static' ? (
              <>
                <FormSection>
                  <Label>Search Contacts:</Label>
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for contacts..."
                  />
                </FormSection>
                
                <ContactsSection>
                  <Label>Associated Contacts:</Label>
                  <ContactsContainer>
                    <PlaceholderText>
                      Associated Contacts List
                    </PlaceholderText>
                  </ContactsContainer>
                </ContactsSection>
              </>
            ) : (
              <FilterSection>
                <FilterRow>
                  <Label>Search Cities:</Label>
                  <Input
                    type="text"
                    value={searchCities}
                    onChange={(e) => setSearchCities(e.target.value)}
                    onKeyPress={handleCityKeyPress}
                    placeholder="Enter city name and press Enter"
                  />
                </FilterRow>
                
                <FilterRow>
                  <Label>Associated Cities:</Label>
                  <TagsContainer>
                    {associatedCities.map((city, index) => (
                      <TagBox key={index} onClick={() => removeCity(city)} style={{ cursor: 'pointer' }}>
                        {city} ×
                      </TagBox>
                    ))}
                    {associatedCities.length === 0 && (
                      <TagBox style={{ opacity: 0.5 }}>No cities selected</TagBox>
                    )}
                  </TagsContainer>
                </FilterRow>
                
                <FilterRow>
                  <Label>Search Tags:</Label>
                  <Input
                    type="text"
                    value={searchTags}
                    onChange={(e) => setSearchTags(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Enter tag name and press Enter"
                  />
                </FilterRow>
                
                <FilterRow>
                  <Label>Associated Tags:</Label>
                  <TagsContainer>
                    {associatedTags.map((tag, index) => (
                      <TagBox key={index} onClick={() => removeTag(tag)} style={{ cursor: 'pointer' }}>
                        {tag} ×
                      </TagBox>
                    ))}
                    {associatedTags.length === 0 && (
                      <TagBox style={{ opacity: 0.5 }}>No tags selected</TagBox>
                    )}
                  </TagsContainer>
                </FilterRow>
                
                <FilterRow>
                  <Label>Score:</Label>
                  <ScoreContainer>
                    {[1, 2, 3, 4, 5].map(score => (
                      <ScoreBox
                        key={score}
                        className={selectedScores.includes(score) ? 'selected' : ''}
                        onClick={() => handleScoreClick(score)}
                      >
                        {score}
                      </ScoreBox>
                    ))}
                  </ScoreContainer>
                </FilterRow>
                
                <ContactsSection>
                  <Label>Filtered Contacts ({filteredContacts.length}):</Label>
                  <ContactsContainer>
                    {loadingContacts ? (
                      <PlaceholderText>Loading contacts...</PlaceholderText>
                    ) : contactsError ? (
                      <PlaceholderText style={{ color: '#ff4444' }}>
                        Error: {contactsError}
                      </PlaceholderText>
                    ) : filteredContacts.length > 0 ? (
                      <ContactGrid>
                        {filteredContacts.map((contact, index) => (
                          <ContactItem key={index}>
                            <ContactName>{contact.first_name} {contact.last_name}</ContactName>
                            <ContactEmail>{contact.email || 'No email'}</ContactEmail>
                          </ContactItem>
                        ))}
                      </ContactGrid>
                    ) : (
                      <PlaceholderText>
                        {(associatedCities.length > 0 || associatedTags.length > 0 || selectedScores.length > 0) 
                          ? 'No contacts match the selected criteria' 
                          : 'Select cities, tags, or scores to filter contacts'}
                      </PlaceholderText>
                    )}
                  </ContactsContainer>
                </ContactsSection>
              </FilterSection>
            )}
          </MainContent>
        </ModalContent>
        
        <ButtonContainer>
          <CreateButton
            onClick={handleCreate}
            disabled={!listName.trim()}
          >
            Create
          </CreateButton>
        </ButtonContainer>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default CreateNewListModal; 