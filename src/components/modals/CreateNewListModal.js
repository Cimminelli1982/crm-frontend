import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiMail } from 'react-icons/fi';

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

const CreateNewListModal = ({ isOpen, onClose }) => {
  const [listType, setListType] = useState('static');
  const [listName, setListName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCities, setSearchCities] = useState('');
  const [associatedCities, setAssociatedCities] = useState([]);
  const [searchTags, setSearchTags] = useState('');
  const [associatedTags, setAssociatedTags] = useState([]);
  const [selectedScores, setSelectedScores] = useState([]);

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
    onClose();
  };

  const handleScoreClick = (score) => {
    setSelectedScores(prev => 
      prev.includes(score) 
        ? prev.filter(s => s !== score)
        : [...prev, score]
    );
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
                    placeholder="Search for cities..."
                  />
                </FilterRow>
                
                <FilterRow>
                  <Label>Associated Cities:</Label>
                  <TagsContainer>
                    <TagBox></TagBox>
                    <TagBox></TagBox>
                    <TagBox></TagBox>
                  </TagsContainer>
                </FilterRow>
                
                <FilterRow>
                  <Label>Search Tags:</Label>
                  <Input
                    type="text"
                    value={searchTags}
                    onChange={(e) => setSearchTags(e.target.value)}
                    placeholder="Search for tags..."
                  />
                </FilterRow>
                
                <FilterRow>
                  <Label>Associated Tags:</Label>
                  <TagsContainer>
                    <TagBox></TagBox>
                    <TagBox></TagBox>
                    <TagBox></TagBox>
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