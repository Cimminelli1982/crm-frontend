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
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const SuggestionsContainer = styled.div`
  margin-top: 5px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SuggestionItem = styled.div`
  background-color: #111;
  border: 1px solid #00ff00;
  color: #00ff00;
  padding: 6px 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #00ff00;
    color: #000;
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

const ClearFiltersButton = styled.button`
  background-color: #000;
  border: 2px solid #ff4444;
  color: #ff4444;
  padding: 12px 20px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-right: 15px;
  
  &:hover {
    background-color: #ff4444;
    color: #000;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background-color: #000;
      color: #ff4444;
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

const Dropdown = styled.select`
  background-color: #000;
  border: 2px solid #333;
  color: #ffffff;
  padding: 12px 15px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  border-radius: 4px;
  outline: none;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:focus {
    border-color: #00ff00;
  }
  
  option {
    background-color: #000;
    color: #ffffff;
    padding: 8px;
  }
`;

const CategoryContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const CreateNewListModal = ({ isOpen, onClose, onListCreated }) => {
  const [listType, setListType] = useState('static');
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCities, setSearchCities] = useState('');
  const [associatedCities, setAssociatedCities] = useState([]);
  const [searchTags, setSearchTags] = useState('');
  const [associatedTags, setAssociatedTags] = useState([]);
  const [selectedScores, setSelectedScores] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedKeepInTouch, setSelectedKeepInTouch] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState(null);
  
  // Autocomplete states
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Category options based on the edge function
  const categoryOptions = [
    'Inbox',
    'Rockstars',
    'Professional Investor',
    'Founder',
    'Manager',
    'People I Care'
  ];

  // Keep in Touch frequency options based on the codebase
  const keepInTouchOptions = [
    'Weekly',
    'Monthly',
    'Quarterly',
    'Twice per Year',
    'Once per Year',
    'Do not keep in touch',
    'Not Set'
  ];

  const handleCreate = async () => {
    if (!listName.trim()) {
      alert('Please enter a list name');
      return;
    }

    try {
      console.log('Creating email list:', {
        type: listType,
        name: listName.trim(),
        cities: associatedCities,
        tags: associatedTags,
        scores: selectedScores
      });

      // Create the email list first
      const requestBody = {
        name: listName.trim(),
        description: listDescription.trim() || `${listType} list with ${associatedCities.length} cities, ${associatedTags.length} tags, ${selectedCategories.length} categories, ${selectedKeepInTouch.length} frequencies`,
        listType: listType,
        queryFilters: listType === 'dynamic' ? {
          cities: associatedCities,
          tags: associatedTags,
          scores: selectedScores,
          categories: selectedCategories,
          keepInTouch: selectedKeepInTouch
        } : null
      };

      // For dynamic lists, don't send contactIds at all
      // For static lists, send empty array (edge function should be modified to allow this)
      if (listType === 'static') {
        requestBody.contactIds = [];
      }

      const { data: emailListData, error: listError } = await supabase.functions.invoke('create-email-list', {
        body: requestBody
      });

      if (listError) {
        throw listError;
      }

      const createdList = emailListData.list;
      const listId = createdList.list_id || createdList.email_list_id || createdList.uuid || createdList.id;

      if (!listId) {
        throw new Error('No list ID returned from create-email-list function');
      }

      console.log('Email list created with ID:', listId);

      // Create city associations in lists_cities table
      if (associatedCities.length > 0) {
        const cityAssociations = associatedCities.map(cityName => ({
          list_id: listId,
          city_name: cityName
        }));

        const { error: cityError } = await supabase
          .from('lists_cities')
          .insert(cityAssociations);

        if (cityError) {
          console.error('Error creating city associations:', cityError);
        } else {
          console.log('Created city associations:', cityAssociations.length);
        }
      }

      // Create tag associations in emaillist_tags table
      if (associatedTags.length > 0) {
        const tagAssociations = associatedTags.map(tagName => ({
          list_id: listId,
          tag_name: tagName
        }));

        const { error: tagError } = await supabase
          .from('emaillist_tags')
          .insert(tagAssociations);

        if (tagError) {
          console.error('Error creating tag associations:', tagError);
        } else {
          console.log('Created tag associations:', tagAssociations.length);
        }
      }

      // Success - close modal and reset
      alert(`Email list "${listName.trim()}" created successfully!`);
      
      // Notify parent to refresh the list
      if (onListCreated) {
        onListCreated();
      }
      
      handleClose();

    } catch (err) {
      console.error('Error creating email list:', err);
      alert(`Error creating email list: ${err.message}`);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setListType('static');
    setListName('');
    setListDescription('');
    setSearchTerm('');
    setSearchCities('');
    setAssociatedCities([]);
    setSearchTags('');
    setAssociatedTags([]);
    setSelectedScores([]);
    setSelectedCategories([]);
    setSelectedKeepInTouch([]);
    setFilteredContacts([]);
    setLoadingContacts(false);
    setContactsError(null);
    
    // Clear autocomplete states
    setCitySuggestions([]);
    setTagSuggestions([]);
    setShowCitySuggestions(false);
    setShowTagSuggestions(false);
    
    onClose();
  };

  const handleScoreClick = (score) => {
    setSelectedScores(prev => 
      prev.includes(score) 
        ? prev.filter(s => s !== score)
        : [...prev, score]
    );
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    if (category && !selectedCategories.includes(category)) {
      setSelectedCategories(prev => [...prev, category]);
      // Reset dropdown to placeholder after selection
      e.target.value = "";
    }
  };

  const removeCategory = (categoryToRemove) => {
    setSelectedCategories(prev => prev.filter(cat => cat !== categoryToRemove));
  };

  const handleKeepInTouchChange = (e) => {
    const frequency = e.target.value;
    if (frequency && !selectedKeepInTouch.includes(frequency)) {
      setSelectedKeepInTouch(prev => [...prev, frequency]);
      // Reset dropdown to placeholder after selection
      e.target.value = "";
    }
  };

  const removeKeepInTouch = (frequencyToRemove) => {
    setSelectedKeepInTouch(prev => prev.filter(freq => freq !== frequencyToRemove));
  };

  const clearAllFilters = () => {
    setAssociatedCities([]);
    setAssociatedTags([]);
    setSelectedScores([]);
    setSelectedCategories([]);
    setSelectedKeepInTouch([]);
    setFilteredContacts([]);
    setContactsError(null);
    setLoadingContacts(false);
  };

  const handleTagKeyPress = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await addTag(searchTags);
    }
  };

  // Search for cities in the database
  const searchCitiesInDB = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setCitySuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cities')
        .select('name')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      // Get unique cities and filter out already selected ones
      const uniqueCities = data
        .map(item => item.name)
        .filter(city => city && !associatedCities.includes(city))
        .slice(0, 5);

      setCitySuggestions(uniqueCities);
    } catch (err) {
      console.error('Error searching cities:', err);
      setCitySuggestions([]);
    }
  };

  // Search for tags in the database
  const searchTagsInDB = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setTagSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      // Get unique tags and filter out already selected ones
      const uniqueTags = data
        .map(item => item.name)
        .filter(tag => tag && !associatedTags.includes(tag))
        .slice(0, 5);

      setTagSuggestions(uniqueTags);
    } catch (err) {
      console.error('Error searching tags:', err);
      setTagSuggestions([]);
    }
  };

  // Handle city input change with search
  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setSearchCities(value);
    searchCitiesInDB(value);
  };

  // Handle tag input change with search
  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setSearchTags(value);
    searchTagsInDB(value);
  };

  // Add city from suggestion
  const addCityFromSuggestion = async (city) => {
    await addCity(city);
  };

  // Add tag from suggestion
  const addTagFromSuggestion = async (tag) => {
    await addTag(tag);
  };

  // Fetch filtered contacts when dynamic list criteria changes
  useEffect(() => {
    if (listType === 'dynamic') {
      fetchFilteredContacts();
    }
  }, [listType, associatedCities, associatedTags, selectedScores, selectedCategories, selectedKeepInTouch]);

  const fetchFilteredContacts = async () => {
    if (listType !== 'dynamic') return;

    try {
      setLoadingContacts(true);
      setContactsError(null);

      // Build filters for the edge function - no limit
      const filters = {};

      // Add score range filter
      if (selectedScores.length > 0) {
        const minScore = Math.min(...selectedScores);
        const maxScore = Math.max(...selectedScores);
        filters.score_range = [minScore, maxScore];
      }

      // Add city filters
      if (associatedCities.length > 0) {
        filters.city = associatedCities;
      }

      // Add tag filters
      if (associatedTags.length > 0) {
        filters.tags = associatedTags;
      }

      // Add category filters
      if (selectedCategories.length > 0) {
        filters.category = selectedCategories;
      }

      // Add keep in touch filters
      if (selectedKeepInTouch.length > 0) {
        filters.keep_in_touch = selectedKeepInTouch;
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

  const addCity = async (city) => {
    if (!city.trim() || associatedCities.includes(city.trim())) {
      return;
    }

    try {
      // Check if city exists in database
      const { data: existingCity, error: checkError } = await supabase
        .from('cities')
        .select('name')
        .eq('name', city.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Error other than "not found"
        throw checkError;
      }

      // If city doesn't exist, create it
      if (!existingCity) {
        const { error: insertError } = await supabase
          .from('cities')
          .insert([{ name: city.trim() }]);

        if (insertError) {
          throw insertError;
        }
        console.log('Created new city:', city.trim());
      }

      // Add to local state
      setAssociatedCities(prev => [...prev, city.trim()]);
      setSearchCities('');
      setCitySuggestions([]);

    } catch (err) {
      console.error('Error adding city:', err);
      // Still add to local state even if database operation fails
      setAssociatedCities(prev => [...prev, city.trim()]);
      setSearchCities('');
      setCitySuggestions([]);
    }
  };

  const removeCity = (cityToRemove) => {
    setAssociatedCities(prev => prev.filter(city => city !== cityToRemove));
  };

  const addTag = async (tag) => {
    if (!tag.trim() || associatedTags.includes(tag.trim())) {
      return;
    }

    try {
      // Check if tag exists in database
      const { data: existingTag, error: checkError } = await supabase
        .from('tags')
        .select('name')
        .eq('name', tag.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Error other than "not found"
        throw checkError;
      }

      // If tag doesn't exist, create it
      if (!existingTag) {
        const { error: insertError } = await supabase
          .from('tags')
          .insert([{ name: tag.trim() }]);

        if (insertError) {
          throw insertError;
        }
        console.log('Created new tag:', tag.trim());
      }

      // Add to local state
      setAssociatedTags(prev => [...prev, tag.trim()]);
      setSearchTags('');
      setTagSuggestions([]);

    } catch (err) {
      console.error('Error adding tag:', err);
      // Still add to local state even if database operation fails
      setAssociatedTags(prev => [...prev, tag.trim()]);
      setSearchTags('');
      setTagSuggestions([]);
    }
  };

  const removeTag = (tagToRemove) => {
    setAssociatedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleCityKeyPress = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await addCity(searchCities);
    }
  };

  // Fetch city suggestions from database
  const fetchCitySuggestions = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('category')
        .ilike('category', `%${searchTerm}%`)
        .not('category', 'is', null)
        .limit(10);

      if (error) throw error;

      // Get unique categories and filter out already selected ones
      const uniqueCities = [...new Set(data.map(item => item.category))]
        .filter(city => city && !associatedCities.includes(city))
        .slice(0, 10);

      setCitySuggestions(uniqueCities);
      setShowCitySuggestions(uniqueCities.length > 0);
    } catch (err) {
      console.error('Error fetching city suggestions:', err);
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  };

  // Fetch tag suggestions from database
  const fetchTagSuggestions = async (searchTerm) => {
    if (searchTerm.length < 1) {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('keep_in_touch_frequency')
        .ilike('keep_in_touch_frequency', `%${searchTerm}%`)
        .not('keep_in_touch_frequency', 'is', null)
        .limit(10);

      if (error) throw error;

      // Get unique keep_in_touch values and filter out already selected ones
      const uniqueTags = [...new Set(data.map(item => item.keep_in_touch_frequency))]
        .filter(tag => tag && !associatedTags.includes(tag))
        .slice(0, 10);

      setTagSuggestions(uniqueTags);
      setShowTagSuggestions(uniqueTags.length > 0);
    } catch (err) {
      console.error('Error fetching tag suggestions:', err);
      setTagSuggestions([]);
      setShowTagSuggestions(false);
    }
  };

  // Select city from suggestions
  const selectCitySuggestion = (city) => {
    addCity(city);
    setShowCitySuggestions(false);
  };

  // Select tag from suggestions
  const selectTagSuggestion = (tag) => {
    addTag(tag);
    setShowTagSuggestions(false);
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
            
            <FormSection>
              <Label>List Description:</Label>
              <Input
                type="text"
                value={listDescription}
                onChange={(e) => setListDescription(e.target.value)}
                placeholder="Enter list description (optional)..."
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
                    onChange={handleCityInputChange}
                    onKeyPress={handleCityKeyPress}
                    placeholder="Enter city name and press Enter"
                  />
                  {citySuggestions.length > 0 && (
                    <SuggestionsContainer>
                      {citySuggestions.map((city, index) => (
                        <SuggestionItem 
                          key={index}
                          onClick={() => addCityFromSuggestion(city)}
                        >
                          {city}
                        </SuggestionItem>
                      ))}
                    </SuggestionsContainer>
                  )}
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
                    onChange={handleTagInputChange}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Enter tag name and press Enter"
                  />
                  {tagSuggestions.length > 0 && (
                    <SuggestionsContainer>
                      {tagSuggestions.map((tag, index) => (
                        <SuggestionItem 
                          key={index}
                          onClick={() => addTagFromSuggestion(tag)}
                        >
                          {tag}
                        </SuggestionItem>
                      ))}
                    </SuggestionsContainer>
                  )}
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
                
                <FilterRow>
                  <Label>Category:</Label>
                  <Dropdown
                    value=""
                    onChange={handleCategoryChange}
                  >
                    <option value="">Select a category...</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Dropdown>
                </FilterRow>
                
                <FilterRow>
                  <Label>Selected Categories:</Label>
                  <CategoryContainer>
                    {selectedCategories.map((category, index) => (
                      <TagBox key={index} onClick={() => removeCategory(category)} style={{ cursor: 'pointer' }}>
                        {category} ×
                      </TagBox>
                    ))}
                    {selectedCategories.length === 0 && (
                      <TagBox style={{ opacity: 0.5 }}>No categories selected</TagBox>
                    )}
                  </CategoryContainer>
                </FilterRow>
                
                <FilterRow>
                  <Label>Keep in Touch Frequency:</Label>
                  <Dropdown
                    value=""
                    onChange={handleKeepInTouchChange}
                  >
                    <option value="">Select a frequency...</option>
                    {keepInTouchOptions.map((frequency) => (
                      <option key={frequency} value={frequency}>
                        {frequency}
                      </option>
                    ))}
                  </Dropdown>
                </FilterRow>
                
                <FilterRow>
                  <Label>Selected Frequencies:</Label>
                  <CategoryContainer>
                    {selectedKeepInTouch.map((frequency, index) => (
                      <TagBox key={index} onClick={() => removeKeepInTouch(frequency)} style={{ cursor: 'pointer' }}>
                        {frequency} ×
                      </TagBox>
                    ))}
                    {selectedKeepInTouch.length === 0 && (
                      <TagBox style={{ opacity: 0.5 }}>No frequencies selected</TagBox>
                    )}
                  </CategoryContainer>
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
                        {(associatedCities.length > 0 || associatedTags.length > 0 || selectedScores.length > 0 || selectedCategories.length > 0 || selectedKeepInTouch.length > 0) 
                          ? 'No contacts match the selected criteria' 
                          : 'Select cities, tags, scores, categories, or frequencies to filter contacts'}
                      </PlaceholderText>
                    )}
                  </ContactsContainer>
                </ContactsSection>
              </FilterSection>
            )}
          </MainContent>
        </ModalContent>
        
        <ButtonContainer>
          {listType === 'dynamic' && (
            <ClearFiltersButton
              onClick={clearAllFilters}
              disabled={associatedCities.length === 0 && 
                       associatedTags.length === 0 && 
                       selectedScores.length === 0 && 
                       selectedCategories.length === 0 && 
                       selectedKeepInTouch.length === 0}
            >
              Clear All Filters
            </ClearFiltersButton>
          )}
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