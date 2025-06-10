// src/pages/ContactRecord.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import { FiEdit, FiPhone, FiMail, FiMapPin, FiTag, FiBriefcase, FiMessageSquare, FiCalendar, FiClock, FiCheck, FiX, FiStar, FiLinkedin, FiPlus, FiTrash, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DealViewFindAddModal from '../components/modals/DealViewFindAddModal';
import TagsModalComponent from '../components/modals/TagsModal';
import CityModal from '../components/modals/CityModal';
import LinkedInPreviewModal from '../components/modals/LinkedInPreviewModal';
import ManageContactEmails from '../components/modals/ManageContactEmails';
import ContactsInteractionModal from '../components/modals/ContactsInteractionModal';
import IntroductionAddModal from '../components/modals/IntroductionAddModal';
import ContactNotesModal from '../components/modals/ContactNotesModal';

// Styled components
const Container = styled.div`
  padding: 10px 30px 30px 20px;
  width: calc(100% - 50px);
  max-width: calc(100% - 50px);
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
  width: 100%;
`;

const Title = styled.h1`
  color: #00ff00;
  margin: 0;
  font-family: 'Courier New', monospace;
`;

const EditButton = styled.button`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 10px 20px;
  margin-right: 15px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #333;
  }
`;

const ContentGrid = styled.div`
  display: flex;
  width: 100%;
  gap: 35px;
  box-sizing: border-box;
  margin-top: 30px;
  
  @media (max-width: 992px) {
    flex-direction: column;
    
    > div {
      width: 100% !important;
    }
  }
`;

const Card = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  padding: 20px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

const CardTitle = styled.h2`
  font-size: 1.2rem;
  color: #00ff00;
  margin-top: 0;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    font-size: 1.2rem;
  }
`;

const InfoItem = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.div`
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 2px;
`;

const InfoValue = styled.div`
  color: #eee;
  font-size: 0.95rem;
`;

const EmailValue = styled(InfoValue)`
  font-size: 0.8rem;
  word-break: break-all;
  line-height: 1.3;
`;

const NumberInput = styled.input`
  background-color: #222;
  color: #eee;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.95rem;
  width: 60px;
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const RelatedItem = styled.div`
  padding: 10px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-break: break-word;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #222;
  }
`;

const RelatedTitle = styled.div`
  font-weight: bold;
  color: #eee;
  margin-bottom: 4px;
`;

const RelatedSubtitle = styled.div`
  font-size: 0.85rem;
  color: #999;
`;

const BadgeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 5px;
`;

const Badge = styled.span`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #333;
  margin-bottom: 20px;
  width: 100%;
  padding-left: 10px;
`;

const Tab = styled.div`
  padding: 10px 30px;
  margin-right: 15px;
  cursor: pointer;
  color: ${props => props.active ? '#00ff00' : '#ccc'};
  border-bottom: 2px solid ${props => props.active ? '#00ff00' : 'transparent'};
  
  &:hover {
    color: ${props => props.active ? '#00ff00' : '#eee'};
  }
`;

const TabContent = styled.div`
  display: ${props => props.active ? 'block' : 'none'};
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  margin-top: -5px;
  font-size: 0.9rem;
  color: #999;
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  color: #00ff00;
`;

const ErrorScreen = styled.div`
  padding: 20px;
  background-color: #331111;
  color: #ff5555;
  border-radius: 4px;
  margin: 20px 0;
`;

// Add new styled components for editable fields
const EditableField = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DateInput = styled.input`
  background-color: #222;
  color: #eee;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.95rem;
  width: 140px;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const SaveButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #00cc00;
  }
`;

const CancelButton = styled.button`
  background: none;
  border: none;
  color: #ff5555;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #ff3333;
  }
`;

const StarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Star = styled(FiStar)`
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  color: ${props => props.filled ? '#00ff00' : '#666'};
  fill: ${props => props.filled ? '#00ff00' : 'transparent'};
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.clickable ? '#00ff00' : (props.filled ? '#00ff00' : '#666')};
  }
`;

const ScoreEditContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LinkedInIcon = styled(FiLinkedin)`
  cursor: pointer;
  color: ${props => props.hasLink ? '#00ff00' : '#666'};
  transition: color 0.2s ease;
  padding: 2px;
  border-radius: 3px;
  outline: none;
  
  &:hover {
    color: ${props => props.hasLink ? '#00cc00' : '#888'};
  }
  
  &:focus {
    outline: none;
  }
`;

const LinkedInContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LinkedInEditButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  font-size: 14px;
  opacity: 0.7;
  transition: all 0.2s ease;
  
  &:hover {
    color: #00cc00;
    opacity: 1;
  }
`;

const AddButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  cursor: pointer;
  padding: 2px;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  
  &:hover {
    color: #00cc00;
  }
`;

const MobileInput = styled.input`
  background-color: #222;
  color: #eee;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.95rem;
  width: 100px;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
`;

const MobileActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const MobileContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover ${MobileActions} {
    opacity: 1;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #ff5555;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #ff3333;
  }
`;

const EmailActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1px;
  margin-left: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const EmailContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover ${EmailActions} {
    opacity: 1;
  }
`;

const SmallEditButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  cursor: pointer;
  padding: 1px;
  display: flex;
  align-items: center;
  font-size: 10px;
  
  &:hover {
    color: #00cc00;
  }
`;

const SmallDeleteButton = styled.button`
  background: none;
  border: none;
  color: #ff5555;
  cursor: pointer;
  padding: 1px;
  display: flex;
  align-items: center;
  font-size: 10px;
  
  &:hover {
    color: #ff3333;
  }
`;

const EmailInput = styled.input`
  background-color: #222;
  color: #eee;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  width: 140px;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const FrequencySelect = styled.select`
  background-color: #222;
  color: #eee;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.95rem;
  width: auto;
  min-width: 120px;
  max-width: 100%;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
  
  option {
    background-color: #222;
    color: #eee;
  }
`;

const TagInput = styled.input`
  background-color: #222;
  color: #eee;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  width: 100px;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const EditableTag = styled.div`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  border-radius: 8px;
  padding: 5px;
  font-size: 0.7rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  width: fit-content;
  white-space: nowrap;
  box-sizing: border-box;
`;

const TagActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const TagEditButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  cursor: pointer;
  padding: 1px;
  display: flex;
  align-items: center;
  font-size: 10px;
  
  &:hover {
    color: #00cc00;
  }
`;

const TagDeleteButton = styled.button`
  background: none;
  border: none;
  color: #ff5555;
  cursor: pointer;
  padding: 1px;
  display: flex;
  align-items: center;
  font-size: 10px;
  
  &:hover {
    color: #ff3333;
  }
`;

const TagsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const TagEditContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 2px;
`;

const TagWithActions = styled.div`
  display: inline-flex;
  align-items: center;
  position: relative;
  margin: 2px;
  
  &:hover .tag-actions {
    opacity: 1;
  }
`;

// Styled components for introductions display
const IntroductionCard = styled.div`
  background-color: #222;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #555;
    background-color: #252525;
  }
`;

const IntroductionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const IntroductionDate = styled.div`
  color: #00ff00;
  font-size: 0.9rem;
  font-weight: bold;
`;

const IntroductionStatus = styled.div`
  background-color: ${props => {
    switch(props.status?.toLowerCase()) {
      case 'completed': return '#004d00';
      case 'in progress': return '#4d4d00';
      case 'cancelled': return '#4d0000';
      default: return '#002d4d';
    }
  }};
  color: ${props => {
    switch(props.status?.toLowerCase()) {
      case 'completed': return '#00ff00';
      case 'in progress': return '#ffff00';
      case 'cancelled': return '#ff5555';
      default: return '#00aaff';
    }
  }};
  border: 1px solid currentColor;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: bold;
`;

const IntroductionContacts = styled.div`
  margin-bottom: 8px;
`;

const IntroductionContactsLabel = styled.div`
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 4px;
`;

const IntroductionContactsValue = styled.div`
  color: #eee;
  font-size: 0.95rem;
  font-weight: 500;
`;

const IntroductionCompanies = styled.div`
  margin-bottom: 12px;
`;

const IntroductionCompaniesLabel = styled.div`
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 4px;
`;

const IntroductionCompaniesValue = styled.div`
  color: #ccc;
  font-size: 0.85rem;
`;

const IntroductionDescription = styled.div`
  color: #ddd;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 8px;
`;

const IntroductionCategory = styled.div`
  display: inline-block;
  background-color: rgba(0, 255, 0, 0.1);
  color: #00ff00;
  border: 1px solid rgba(0, 255, 0, 0.3);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: bold;
`;

const IntroductionsContainer = styled.div`
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const AddNewButton = styled.button`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #00ff00;
    color: #000;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 255, 0, 0.3);
  }
`;

const IntroductionsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #333;
`;

// Tags Modal Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  width: 80%;
  max-width: 1000px;
  height: 70%;
  max-height: 600px;
  display: flex;
  overflow: hidden;
`;

const ModalSidebar = styled.div`
  width: 200px;
  background-color: #222;
  border-right: 1px solid #333;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ModalContent = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  color: #00ff00;
  margin: 0;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    color: #fff;
  }
`;

const FilterButton = styled.button`
  background-color: ${props => props.active ? '#00ff00' : '#333'};
  color: ${props => props.active ? '#000' : '#fff'};
  border: 1px solid ${props => props.active ? '#00ff00' : '#555'};
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#00cc00' : '#444'};
  }
`;

const ContentArea = styled.div`
  flex: 1;
  border: 2px solid #333;
  border-radius: 4px;
  position: relative;
  background-color: #111;
`;

const InnerRectangle = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: #1a1a1a;
`;

const FilterableTag = styled.div`
  background-color: ${props => props.selected ? '#00ff00' : '#222'};
  color: ${props => props.selected ? '#000' : '#00ff00'};
  border: 1px solid #00ff00;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 0.7rem;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  white-space: nowrap;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.selected ? '#00cc00' : '#333'};
  }
`;

const ResultItem = styled.div`
  padding: 12px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #222;
  }
`;

const ResultTitle = styled.div`
  font-weight: bold;
  color: #eee;
  margin-bottom: 4px;
`;

const ResultSubtitle = styled.div`
  font-size: 0.85rem;
  color: #999;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #00ff00;
`;

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
`;

const ContactRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [contact, setContact] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [tags, setTags] = useState([]);
  const [cities, setCities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [emails, setEmails] = useState([]);
  const [mobiles, setMobiles] = useState([]);
  const [keepInTouch, setKeepInTouch] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('interactions');
  
  // Add new state for active interaction sub-tab
  const [activeInteractionTab, setActiveInteractionTab] = useState('emails');
  
  // Add introductions state
  const [introductions, setIntroductions] = useState([]);
  const [loadingIntroductions, setLoadingIntroductions] = useState(false);
  
  // Birthday editing state
  const [isEditingBirthday, setIsEditingBirthday] = useState(false);
  const [editBirthdayValue, setEditBirthdayValue] = useState('');
  const [isSavingBirthday, setIsSavingBirthday] = useState(false);
  
  // Score editing state
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [editScoreValue, setEditScoreValue] = useState(0);
  const [isSavingScore, setIsSavingScore] = useState(false);
  
  // Mobile number adding state
  const [isAddingMobile, setIsAddingMobile] = useState(false);
  const [newMobileValue, setNewMobileValue] = useState('');
  const [isSavingMobile, setIsSavingMobile] = useState(false);
  
  // Mobile number editing state
  const [editingMobileId, setEditingMobileId] = useState(null);
  const [editMobileValue, setEditMobileValue] = useState('');
  const [isSavingEditMobile, setIsSavingEditMobile] = useState(false);
  
  // Snooze days editing state
  const [isEditingSnoozeDays, setIsEditingSnoozeDays] = useState(false);
  const [editSnoozeDaysValue, setEditSnoozeDaysValue] = useState(0);
  const [isSavingSnoozeDays, setIsSavingSnoozeDays] = useState(false);
  
  // Email editing state
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [newEmailValue, setNewEmailValue] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [editEmailValue, setEditEmailValue] = useState('');
  const [isSavingEditEmail, setIsSavingEditEmail] = useState(false);
  
  // Frequency editing state
  const [isEditingFrequency, setIsEditingFrequency] = useState(false);
  const [editFrequencyValue, setEditFrequencyValue] = useState('');
  const [isSavingFrequency, setIsSavingFrequency] = useState(false);
  
  // Tag editing state
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editingTagId, setEditingTagId] = useState(null);
  const [editTagValue, setEditTagValue] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [isSavingTag, setIsSavingTag] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  
  // Tags modal state
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState('contacts');
  
  // Location Relationships modal state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeLocationFilter, setActiveLocationFilter] = useState('contacts');
  const [selectedCities, setSelectedCities] = useState([]);
  const [locationFilteredResults, setLocationFilteredResults] = useState([]);
  const [isLoadingLocationResults, setIsLoadingLocationResults] = useState(false);
  
  // TagsModalComponent state
  const [isTagsManagerModalOpen, setIsTagsManagerModalOpen] = useState(false);
  
  // CityModal state
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  
  // Add new state for tag filtering
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  
  // LinkedIn preview modal state
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  
  // ManageContactEmails modal state
  const [isManageEmailsModalOpen, setIsManageEmailsModalOpen] = useState(false);
  
  // ContactsInteractionModal state
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [interactionModalFilters, setInteractionModalFilters] = useState({
    showWhatsApp: true,
    showEmail: true,
    showMeetings: true
  });
  
  // IntroductionAddModal state
  const [isIntroductionAddModalOpen, setIsIntroductionAddModalOpen] = useState(false);
  
  // ContactNotesModal state
  const [isContactNotesModalOpen, setIsContactNotesModalOpen] = useState(false);
  
  // Ref for click outside detection
  const mobileInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const emailEditRef = useRef(null);
  const birthdayEditRef = useRef(null);
  const tagEditRef = useRef(null);
  const tagAddRef = useRef(null);
  
  // Deals state
  const [deals, setDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  
  // Handle click outside for mobile input
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAddingMobile && mobileInputRef.current && !mobileInputRef.current.contains(event.target)) {
        if (newMobileValue.trim()) {
          handleSaveMobile();
        } else {
          handleCancelMobile();
        }
      }
    };

    if (isAddingMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddingMobile, newMobileValue]);
  
  // Handle click outside for email input
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAddingEmail && emailInputRef.current && !emailInputRef.current.contains(event.target)) {
        if (newEmailValue.trim()) {
          handleSaveEmail();
        } else {
          handleCancelEmail();
        }
      }
    };

    if (isAddingEmail) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddingEmail, newEmailValue]);
  
  // Handle click outside for email editing
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingEmailId && emailEditRef.current && !emailEditRef.current.contains(event.target)) {
        if (editEmailValue.trim()) {
          handleSaveEditEmail();
        } else {
          handleCancelEditEmail();
        }
      }
    };

    if (editingEmailId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingEmailId, editEmailValue]);
  
  // Handle click outside for birthday editing
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditingBirthday && birthdayEditRef.current && !birthdayEditRef.current.contains(event.target)) {
        if (editBirthdayValue.trim()) {
          handleSaveBirthday();
        } else {
          handleCancelBirthday();
        }
      }
    };

    if (isEditingBirthday) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingBirthday, editBirthdayValue]);
  
  // Handle click outside for tag editing
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingTagId && tagEditRef.current && !tagEditRef.current.contains(event.target)) {
        if (editTagValue.trim()) {
          handleSaveEditTag();
        } else {
          handleCancelTag();
        }
      }
    };

    if (editingTagId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingTagId, editTagValue]);
  
  // Handle click outside for tag adding
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAddingTag && tagAddRef.current && !tagAddRef.current.contains(event.target)) {
        if (newTagValue.trim()) {
          handleSaveNewTag();
        } else {
          handleCancelTag();
        }
      }
    };

    if (isAddingTag) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddingTag, newTagValue]);
  
  // Fetch contact data and related info
  useEffect(() => {
    if (!id) return;
    
    const fetchContactData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get basic contact info
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('*')
          .eq('contact_id', id)
          .single();
          
        if (contactError) throw contactError;
        if (!contactData) throw new Error('Contact not found');
        
        setContact(contactData);
        
        // Fetch related data in parallel
        const [
          interactionsResult,
          tagsResult,
          citiesResult,
          companiesResult,
          emailsResult,
          mobilesResult,
          notesResult,
          kitResult
        ] = await Promise.all([
          // Get interactions
          supabase
            .from('interactions')
            .select('*')
            .eq('contact_id', id)
            .order('interaction_date', { ascending: false }),
            
          // Get tags
          supabase
            .from('contact_tags')
            .select(`
              entry_id,
              tags (
                tag_id,
                name
              )
            `)
            .eq('contact_id', id),
            
          // Get cities
          supabase
            .from('contact_cities')
            .select(`
              entry_id,
              cities (
                city_id,
                name,
                country
              )
            `)
            .eq('contact_id', id),
            
          // Get companies
          supabase
            .from('contact_companies')
            .select(`
              contact_companies_id,
              relationship,
              is_primary,
              companies (
                company_id,
                name,
                website,
                category
              )
            `)
            .eq('contact_id', id),
            
          // Get emails
          supabase
            .from('contact_emails')
            .select('*')
            .eq('contact_id', id),
            
          // Get mobiles
          supabase
            .from('contact_mobiles')
            .select('*')
            .eq('contact_id', id),
            
          // Get notes
          supabase
            .from('notes_contacts')
            .select(`
              note_contact_id,
              notes (
                note_id,
                title,
                text,
                created_at
              )
            `)
            .eq('contact_id', id)
            .order('created_at', { foreignTable: 'notes', ascending: false }),
            
          // Get keep in touch record
          supabase
            .from('mv_keep_in_touch')
            .select('*')
            .eq('contact_id', id)
            .single()
        ]);
        
        // Set all related data
        setInteractions(interactionsResult.data || []);
        setTags(tagsResult.data?.map(t => t.tags) || []);
        setCities(citiesResult.data?.map(c => c.cities) || []);
        setCompanies(companiesResult.data || []);
        setEmails(emailsResult.data || []);
        setMobiles(mobilesResult.data || []);
        setNotes(notesResult.data?.map(n => n.notes) || []);
        setKeepInTouch(kitResult.data || null);
        
      } catch (err) {
        console.error('Error fetching contact data:', err);
        setError(err.message || 'Error loading contact data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContactData();
  }, [id]);

  useEffect(() => {
    console.log('🚀 useEffect running for deals and introductions - id:', id);
    if (id) {
      console.log('✅ id exists, calling fetchDeals and fetchIntroductions');
      fetchDeals();
      fetchIntroductions();
    } else {
      console.log('❌ no id in useEffect');
    }
  }, [id]);
  
  // Handle edit button click
  const handleEdit = () => {
    navigate(`/contacts/workflow/${id}`);
  };
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Format date and time
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Format date as MM/YY
  const formatMonthYear = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    const month = String(date.getMonth() + 1).padStart(2, '0'); // +1 because getMonth() is 0-indexed
    const year = String(date.getFullYear()).slice(-2); // Get last 2 digits of year
    return `${month}/${year}`;
  };

  // Birthday editing handlers
  const handleEditBirthday = () => {
    // Convert birthday to YYYY-MM-DD format for input
    const birthdayValue = contact.birthday ? new Date(contact.birthday).toISOString().split('T')[0] : '';
    setEditBirthdayValue(birthdayValue);
    setIsEditingBirthday(true);
  };

  const handleSaveBirthday = async () => {
    if (isSavingBirthday) return;
    
    setIsSavingBirthday(true);
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ 
          birthday: editBirthdayValue || null,
          last_modified_at: new Date().toISOString()
        })
        .eq('contact_id', id);
        
      if (error) throw error;
      
      // Update local state
      setContact(prev => ({
        ...prev,
        birthday: editBirthdayValue || null,
        last_modified_at: new Date().toISOString()
      }));
      
      setIsEditingBirthday(false);
      toast.success('Birthday updated successfully');
      
    } catch (err) {
      console.error('Error updating birthday:', err);
      toast.error('Failed to update birthday');
    } finally {
      setIsSavingBirthday(false);
    }
  };

  const handleCancelBirthday = () => {
    setIsEditingBirthday(false);
    setEditBirthdayValue('');
  };

  // Score editing handlers
  const handleEditScore = () => {
    setEditScoreValue(contact.score || 0);
    setIsEditingScore(true);
  };

  const handleSaveScore = async () => {
    if (isSavingScore) return;
    
    setIsSavingScore(true);
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ 
          score: editScoreValue,
          last_modified_at: new Date().toISOString()
        })
        .eq('contact_id', id);
        
      if (error) throw error;
      
      // Update local state
      setContact(prev => ({
        ...prev,
        score: editScoreValue,
        last_modified_at: new Date().toISOString()
      }));
      
      setIsEditingScore(false);
      toast.success('Score updated successfully');
      
    } catch (err) {
      console.error('Error updating score:', err);
      toast.error('Failed to update score');
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleCancelScore = () => {
    setIsEditingScore(false);
    setEditScoreValue(0);
  };

  const handleStarClick = (starValue) => {
    setEditScoreValue(starValue);
  };

  // LinkedIn handlers
  const handleLinkedInClick = () => {
    try {
      if (contact.linkedin && contact.linkedin.trim()) {
        // Open LinkedIn profile
        const linkedinUrl = contact.linkedin.startsWith('http') 
          ? contact.linkedin 
          : `https://${contact.linkedin}`;
        window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Search on LinkedIn
        const searchQuery = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
        if (searchQuery) {
          const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`;
          window.open(searchUrl, '_blank', 'noopener,noreferrer');
        } else {
          toast.info('No name available to search on LinkedIn');
        }
      }
    } catch (error) {
      console.error('Error opening LinkedIn:', error);
      toast.error('Failed to open LinkedIn');
    }
  };

  // LinkedIn edit modal handlers
  const handleLinkedInEditClick = (e) => {
    e.stopPropagation();
    setIsLinkedInModalOpen(true);
  };

  const handleLinkedInModalClose = () => {
    setIsLinkedInModalOpen(false);
  };

  const handleLinkedInDataSave = async (linkedInData) => {
    try {
      // Update contact with the LinkedIn data
      const updates = {};
      
      if (linkedInData.jobRole) {
        updates.job_role = linkedInData.jobRole;
      }
      
      if (linkedInData.city) {
        // Handle city data - we might need to create or find the city
        // For now, let's just store it in a simple field if available
        // You can enhance this to work with your cities system
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('contacts')
          .update(updates)
          .eq('contact_id', id);
        
        if (error) throw error;
        
        // Update local state
        setContact(prev => ({ ...prev, ...updates }));
        toast.success('LinkedIn information updated successfully');
      }

      // Handle company data if provided
      if (linkedInData.company) {
        // This would require more complex logic to handle company creation/association
        // For now, we'll just show a success message
        toast.info('Company information extracted. You may need to manually associate the company.');
      }
      
    } catch (error) {
      console.error('Error saving LinkedIn data:', error);
      toast.error('Failed to save LinkedIn information');
    }
  };

  // ManageContactEmails modal handlers
  const handleOpenEmailsModal = () => {
    setIsManageEmailsModalOpen(true);
  };

  const handleCloseEmailsModal = () => {
    setIsManageEmailsModalOpen(false);
  };

  const fetchEmails = async () => {
    try {
      const { data: emailsData, error } = await supabase
        .from('contact_emails')
        .select('*')
        .eq('contact_id', id);
        
      if (error) throw error;
      setEmails(emailsData || []);
    } catch (err) {
      console.error('Error refreshing emails:', err);
    }
  };

  const fetchDeals = async () => {
    if (!id) return;
    
    setLoadingDeals(true);
    try {
      // Get deals associated with this contact through deals_contacts table
      const { data: dealContactsData, error: dealContactsError } = await supabase
        .from('deals_contacts')
        .select(`
          deals_contacts_id,
          relationship,
          deals:deal_id (
            deal_id,
            opportunity,
            total_investment,
            category,
            stage,
            description,
            created_at,
            updated_at
          )
        `)
        .eq('contact_id', id);
        
      if (dealContactsError) throw dealContactsError;
      
      // Format the deals data
      const formattedDeals = dealContactsData?.map(dc => ({
        ...dc.deals,
        relationship: dc.relationship,
        deals_contacts_id: dc.deals_contacts_id
      })) || [];
      
      setDeals(formattedDeals);
    } catch (err) {
      console.error('Error fetching associated deals:', err);
      setDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  const fetchIntroductions = async () => {
    console.log('🔥 fetchIntroductions CALLED - id:', id, 'type:', typeof id);
    
    if (!id) {
      console.log('❌ No id provided, returning early');
      return;
    }
    
    setLoadingIntroductions(true);
    console.log('Fetching introductions for contact ID:', id);
    
    try {
      // Get introductions where this contact is involved
      // Fetch all introductions and filter in JavaScript due to PostgREST JSONB operator issues
      const { data: introductionsData, error: introductionsError } = await supabase
        .from('introductions')
        .select('*')
        .order('introduction_date', { ascending: false });
        
      console.log('Introductions query result:', introductionsData, 'Error:', introductionsError);
        
      if (introductionsError) throw introductionsError;
      
      // Filter introductions to only include those with the current contact
      const filteredIntroductions = introductionsData?.filter(intro => {
        return intro.contact_ids && Array.isArray(intro.contact_ids) && intro.contact_ids.includes(id);
      }) || [];
      
      console.log('Filtered introductions for contact:', filteredIntroductions);
      
      if (filteredIntroductions.length === 0) {
        console.log('No introductions found for this contact');
        setIntroductions([]);
        return;
      }

      console.log('Found', filteredIntroductions.length, 'introductions');

      // Get all unique contact IDs from the introductions (excluding current contact)
      const allContactIds = new Set();
      filteredIntroductions.forEach(intro => {
        console.log('Processing introduction:', intro.introduction_id, 'contact_ids:', intro.contact_ids);
        if (intro.contact_ids && Array.isArray(intro.contact_ids)) {
          intro.contact_ids.forEach(contactId => {
            if (contactId !== id) { // Exclude current contact - comparing strings now
              allContactIds.add(contactId);
            }
          });
        }
      });

      console.log('Other contact IDs found:', Array.from(allContactIds));

      // Fetch contact names for the other contacts involved
      let contactsMap = {};
      let companiesMap = {};
      
      if (allContactIds.size > 0) {
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name')
          .in('contact_id', Array.from(allContactIds));
        
        console.log('Contacts data:', contactsData, 'Error:', contactsError);
        
        if (contactsError) {
          console.error('Error fetching contacts for introductions:', contactsError);
        } else {
          // Create a map of contact_id to full name
          contactsData?.forEach(contact => {
            const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
            contactsMap[contact.contact_id] = fullName || 'Unknown Contact';
          });
          
          console.log('Contacts map:', contactsMap);
          
          // Fetch companies for the contacts
          const { data: contactCompaniesData, error: contactCompaniesError } = await supabase
            .from('contact_companies')
            .select(`
              contact_id,
              company_id,
              companies!inner(
                company_id,
                name
              )
            `)
            .in('contact_id', Array.from(allContactIds));
            
          console.log('Contact companies data:', contactCompaniesData, 'Error:', contactCompaniesError);
            
          if (contactCompaniesError) {
            console.error('Error fetching contact companies for introductions:', contactCompaniesError);
          } else {
            // Create a map of contact_id to array of company names
            contactCompaniesData?.forEach(contactCompany => {
              const contactId = contactCompany.contact_id;
              const companyName = contactCompany.companies?.name;
              
              if (companyName) {
                if (!companiesMap[contactId]) {
                  companiesMap[contactId] = [];
                }
                companiesMap[contactId].push(companyName);
              }
            });
            
            console.log('Companies map:', companiesMap);
          }
        }
      }

      // Transform the data for display
      const transformedIntroductions = filteredIntroductions.map(intro => {
        // Get other contacts involved (excluding current contact)
        const otherContactIds = intro.contact_ids?.filter(contactId => contactId !== id) || [];
        const otherContactNames = otherContactIds.map(contactId => {
          return contactsMap[contactId] || '🚫 Deleted Contact';
        });

        // Get companies for other contacts
        const allCompanies = new Set();
        otherContactIds.forEach(contactId => {
          if (companiesMap[contactId]) {
            companiesMap[contactId].forEach(companyName => {
              allCompanies.add(companyName);
            });
          }
        });

        const transformed = {
          id: intro.introduction_id,
          date: intro.introduction_date || intro.created_at,
          otherContacts: otherContactNames,
          relatedCompanies: Array.from(allCompanies),
          description: intro.text || '',
          category: intro.category || '',
          status: intro.status || 'Requested',
          created_at: intro.created_at
        };
        
        console.log('Transformed introduction:', transformed);
        return transformed;
      });

      console.log('Final transformed introductions:', transformedIntroductions);
      setIntroductions(transformedIntroductions);
    } catch (err) {
      console.error('Error fetching introductions:', err);
      setIntroductions([]);
    } finally {
      setLoadingIntroductions(false);
    }
  };

  const handleEmailsUpdated = () => {
    // Refresh emails data after modal operations
    fetchEmails();
  };

  const handleDealsUpdated = () => {
    // Refresh deals data after modal operations
    fetchDeals();
  };

  // Interaction modal handlers
  const handleOpenInteractionModal = (filterType = 'all') => {
    let filters = { showWhatsApp: true, showEmail: true, showMeetings: true };
    
    if (filterType === 'emails') {
      filters = { showWhatsApp: false, showEmail: true, showMeetings: false };
    } else if (filterType === 'whatsapp') {
      filters = { showWhatsApp: true, showEmail: false, showMeetings: false };
    } else if (filterType === 'meetings') {
      filters = { showWhatsApp: false, showEmail: false, showMeetings: true };
    }
    
    setInteractionModalFilters(filters);
    setIsInteractionModalOpen(true);
  };

  const handleCloseInteractionModal = () => {
    setIsInteractionModalOpen(false);
    setInteractionModalFilters({
      showWhatsApp: true,
      showEmail: true,
      showMeetings: true
    });
  };

  // IntroductionAddModal handlers
  const handleOpenIntroductionAddModal = () => {
    setIsIntroductionAddModalOpen(true);
  };

  const handleCloseIntroductionAddModal = () => {
    setIsIntroductionAddModalOpen(false);
  };

  const handleIntroductionSaved = () => {
    // Refresh introductions after a new one is saved
    fetchIntroductions();
    setIsIntroductionAddModalOpen(false);
  };

  // ContactNotesModal handlers
  const handleOpenContactNotesModal = () => {
    setIsContactNotesModalOpen(true);
  };

  const handleCloseContactNotesModal = () => {
    setIsContactNotesModalOpen(false);
  };

  const handleNotesUpdated = () => {
    // Refresh notes data after modal operations
    fetchNotes();
  };

  // Function to fetch just the notes
  const fetchNotes = async () => {
    if (!id) return;
    
    try {
      const { data: notesResult, error } = await supabase
        .from('notes_contacts')
        .select(`
          note_contact_id,
          notes (
            note_id,
            title,
            text,
            created_at
          )
        `)
        .eq('contact_id', id)
        .order('created_at', { foreignTable: 'notes', ascending: false });
        
      if (error) throw error;
      setNotes(notesResult?.map(n => n.notes) || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  // Mobile number handlers
  const handleAddMobile = () => {
    setNewMobileValue('');
    setIsAddingMobile(true);
  };

  const handleSaveMobile = async () => {
    if (isSavingMobile || !newMobileValue.trim()) return;
    
    setIsSavingMobile(true);
    
    try {
      const { data, error } = await supabase
        .from('contact_mobiles')
        .insert({
          contact_id: id,
          mobile: newMobileValue.trim(),
          is_primary: mobiles.length === 0 // First mobile becomes primary
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update local state
      setMobiles(prev => [...prev, data]);
      setIsAddingMobile(false);
      setNewMobileValue('');
      toast.success('Mobile number added successfully');
      
    } catch (err) {
      console.error('Error adding mobile number:', err);
      toast.error('Failed to add mobile number');
    } finally {
      setIsSavingMobile(false);
    }
  };

  const handleCancelMobile = () => {
    setIsAddingMobile(false);
    setNewMobileValue('');
  };

  // Edit existing mobile handlers
  const handleEditExistingMobile = (mobile) => {
    setEditingMobileId(mobile.mobile_id);
    setEditMobileValue(mobile.mobile);
  };

  const handleSaveEditMobile = async () => {
    if (isSavingEditMobile || !editMobileValue.trim()) return;
    
    setIsSavingEditMobile(true);
    
    try {
      const { error } = await supabase
        .from('contact_mobiles')
        .update({ mobile: editMobileValue.trim() })
        .eq('mobile_id', editingMobileId);
        
      if (error) throw error;
      
      // Update local state
      setMobiles(prev => prev.map(mobile => 
        mobile.mobile_id === editingMobileId 
          ? { ...mobile, mobile: editMobileValue.trim() }
          : mobile
      ));
      
      setEditingMobileId(null);
      setEditMobileValue('');
      toast.success('Mobile number updated successfully');
      
    } catch (err) {
      console.error('Error updating mobile number:', err);
      toast.error('Failed to update mobile number');
    } finally {
      setIsSavingEditMobile(false);
    }
  };

  const handleDeleteMobile = async (mobileId) => {
    try {
      const { error } = await supabase
        .from('contact_mobiles')
        .delete()
        .eq('mobile_id', mobileId);
        
      if (error) throw error;
      
      // Update local state
      setMobiles(prev => prev.filter(mobile => mobile.mobile_id !== mobileId));
      toast.success('Mobile number deleted successfully');
      
    } catch (err) {
      console.error('Error deleting mobile number:', err);
      toast.error('Failed to delete mobile number');
    }
  };

  const handleCancelEditMobile = () => {
    setEditingMobileId(null);
    setEditMobileValue('');
  };

  // Snooze days editing handlers
  const handleEditSnoozeDays = () => {
    setEditSnoozeDaysValue(keepInTouch?.snooze_days || 0);
    setIsEditingSnoozeDays(true);
  };

  const handleSaveSnoozeDays = async () => {
    if (isSavingSnoozeDays) return;
    
    setIsSavingSnoozeDays(true);
    
    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .update({ 
          snooze_days: parseInt(editSnoozeDaysValue) || 0
        })
        .eq('contact_id', id);
        
      if (error) throw error;
      
      // Update local state
      setKeepInTouch(prev => ({
        ...prev,
        snooze_days: parseInt(editSnoozeDaysValue) || 0
      }));
      
      setIsEditingSnoozeDays(false);
      toast.success('Snooze days updated successfully');
      
    } catch (err) {
      console.error('Error updating snooze days:', err);
      toast.error('Failed to update snooze days');
    } finally {
      setIsSavingSnoozeDays(false);
    }
  };

  const handleCancelSnoozeDays = () => {
    setIsEditingSnoozeDays(false);
    setEditSnoozeDaysValue(0);
  };

  // Email handlers
  const handleAddEmail = () => {
    setNewEmailValue('');
    setIsAddingEmail(true);
  };

  const handleSaveEmail = async () => {
    if (isSavingEmail || !newEmailValue.trim()) return;
    
    setIsSavingEmail(true);
    
    try {
      const { data, error } = await supabase
        .from('contact_emails')
        .insert({
          contact_id: id,
          email: newEmailValue.trim(),
          is_primary: emails.length === 0 // First email becomes primary
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update local state
      setEmails(prev => [...prev, data]);
      setIsAddingEmail(false);
      setNewEmailValue('');
      toast.success('Email added successfully');
      
    } catch (err) {
      console.error('Error adding email:', err);
      toast.error('Failed to add email');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleCancelEmail = () => {
    setIsAddingEmail(false);
    setNewEmailValue('');
  };

  const handleEditExistingEmail = (email) => {
    setEditingEmailId(email.email_id);
    setEditEmailValue(email.email);
  };

  const handleSaveEditEmail = async () => {
    if (isSavingEditEmail || !editEmailValue.trim()) return;
    
    setIsSavingEditEmail(true);
    
    try {
      const { error } = await supabase
        .from('contact_emails')
        .update({ email: editEmailValue.trim() })
        .eq('email_id', editingEmailId);
        
      if (error) throw error;
      
      // Update local state
      setEmails(prev => prev.map(email => 
        email.email_id === editingEmailId 
          ? { ...email, email: editEmailValue.trim() }
          : email
      ));
      
      setEditingEmailId(null);
      setEditEmailValue('');
      toast.success('Email updated successfully');
      
    } catch (err) {
      console.error('Error updating email:', err);
      toast.error('Failed to update email');
    } finally {
      setIsSavingEditEmail(false);
    }
  };

  const handleDeleteEmail = async (emailId) => {
    try {
      const { error } = await supabase
        .from('contact_emails')
        .delete()
        .eq('email_id', emailId);
        
      if (error) throw error;
      
      // Update local state
      setEmails(prev => prev.filter(email => email.email_id !== emailId));
      toast.success('Email deleted successfully');
      
    } catch (err) {
      console.error('Error deleting email:', err);
      toast.error('Failed to delete email');
    }
  };

  const handleCancelEditEmail = () => {
    setEditingEmailId(null);
    setEditEmailValue('');
  };

  // Frequency editing handlers
  const frequencyOptions = [
    { value: 'Do not keep in touch', label: 'Do not keep in touch' },
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Quarterly', label: 'Quarterly' },
    { value: 'Twice per Year', label: 'Twice per Year' },
    { value: 'Once per Year', label: 'Once per Year' }
  ];

  const handleEditFrequency = () => {
    setEditFrequencyValue(keepInTouch?.frequency || '');
    setIsEditingFrequency(true);
  };

  const handleSaveFrequency = async (newFrequency) => {
    if (isSavingFrequency) return;
    
    setIsSavingFrequency(true);
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ keep_in_touch_frequency: newFrequency })
        .eq('contact_id', id);
        
      if (error) throw error;
      
      // Update local state
      setKeepInTouch(prev => ({
        ...prev,
        frequency: newFrequency
      }));
      
      setIsEditingFrequency(false);
      toast.success('Frequency updated successfully');
      
    } catch (err) {
      console.error('Error updating frequency:', err);
      toast.error('Failed to update frequency');
    } finally {
      setIsSavingFrequency(false);
    }
  };

  const handleCancelFrequency = () => {
    setIsEditingFrequency(false);
    setEditFrequencyValue('');
  };

  // Tag editing handlers
  const fetchAvailableTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setAvailableTags(data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const handleEditTags = () => {
    setIsEditingTags(true);
    fetchAvailableTags();
  };

  const handleEditTag = (tag) => {
    setEditingTagId(tag.tag_id);
    setEditTagValue(tag.name);
  };

  const handleSaveEditTag = async () => {
    if (isSavingTag || !editTagValue.trim()) return;
    
    setIsSavingTag(true);
    
    try {
      const { error } = await supabase
        .from('tags')
        .update({ name: editTagValue.trim() })
        .eq('tag_id', editingTagId);
        
      if (error) throw error;
      
      // Update local state
      setTags(prev => prev.map(tag => 
        tag.tag_id === editingTagId 
          ? { ...tag, name: editTagValue.trim() }
          : tag
      ));
      
      setEditingTagId(null);
      setEditTagValue('');
      toast.success('Tag updated successfully');
      
    } catch (err) {
      console.error('Error updating tag:', err);
      toast.error('Failed to update tag');
    } finally {
      setIsSavingTag(false);
    }
  };

  const handleDeleteTagAssociation = async (tagId) => {
    try {
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', id)
        .eq('tag_id', tagId);
        
      if (error) throw error;
      
      // Update local state
      setTags(prev => prev.filter(tag => tag.tag_id !== tagId));
      toast.success('Tag removed from contact');
      
    } catch (err) {
      console.error('Error removing tag:', err);
      toast.error('Failed to remove tag');
    }
  };

  const handleAddTag = () => {
    setNewTagValue('');
    setIsAddingTag(true);
    fetchAvailableTags();
  };

  const handleSaveNewTag = async () => {
    if (isSavingTag || !newTagValue.trim()) return;
    
    setIsSavingTag(true);
    
    try {
      // First, check if tag exists
      let tagId;
      const existingTag = availableTags.find(tag => 
        tag.name.toLowerCase() === newTagValue.trim().toLowerCase()
      );
      
      if (existingTag) {
        tagId = existingTag.tag_id;
      } else {
        // Create new tag
        const { data: newTag, error: tagError } = await supabase
          .from('tags')
          .insert({ name: newTagValue.trim() })
          .select()
          .single();
          
        if (tagError) throw tagError;
        tagId = newTag.tag_id;
      }
      
      // Check if association already exists
      const { data: existingAssociation } = await supabase
        .from('contact_tags')
        .select('entry_id')
        .eq('contact_id', id)
        .eq('tag_id', tagId)
        .single();
        
      if (existingAssociation) {
        toast.info('Tag is already associated with this contact');
        setIsAddingTag(false);
        setNewTagValue('');
        return;
      }
      
      // Create association
      const { error: associationError } = await supabase
        .from('contact_tags')
        .insert({
          contact_id: id,
          tag_id: tagId
        });
        
      if (associationError) throw associationError;
      
      // Update local state
      const tagToAdd = existingTag || { tag_id: tagId, name: newTagValue.trim() };
      setTags(prev => [...prev, tagToAdd]);
      
      setIsAddingTag(false);
      setNewTagValue('');
      toast.success('Tag added successfully');
      
    } catch (err) {
      console.error('Error adding tag:', err);
      toast.error('Failed to add tag');
    } finally {
      setIsSavingTag(false);
    }
  };

  const handleCancelTag = () => {
    setIsAddingTag(false);
    setNewTagValue('');
    setEditingTagId(null);
    setEditTagValue('');
  };

  // TagsModalComponent handlers
  const handleOpenTagsManagerModal = () => {
    setIsTagsManagerModalOpen(true);
  };

  const handleCloseTagsManagerModal = () => {
    setIsTagsManagerModalOpen(false);
  };

  const handleTagAdded = (newTag) => {
    // Refresh tags when a tag is added
    setTags(prev => {
      const exists = prev.some(tag => tag.tag_id === newTag.tag_id);
      if (!exists) {
        return [...prev, newTag];
      }
      return prev;
    });
  };

  const handleTagRemoved = (removedTag) => {
    // Refresh tags when a tag is removed
    setTags(prev => prev.filter(tag => tag.tag_id !== removedTag.tag_id));
  };

  // Tags modal handlers
  const handleOpenTagsModal = () => {
    setIsTagsModalOpen(true);
    // Reset state when opening modal
    setSelectedTags([]);
    setFilteredResults([]);
    setActiveTagFilter('contacts');
  };

  const handleCloseTagsModal = () => {
    setIsTagsModalOpen(false);
    // Reset state when closing modal
    setSelectedTags([]);
    setFilteredResults([]);
  };

  const handleFilterChange = (filter) => {
    setActiveTagFilter(filter);
  };
  
  // Add new filtering handlers
  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => {
      const newSelected = prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      
      // Fetch results when tags change
      if (newSelected.length > 0) {
        fetchFilteredResults(newSelected, activeTagFilter);
      } else {
        setFilteredResults([]);
      }
      
      return newSelected;
    });
  };

  const handleEntityTypeChange = (entityType) => {
    setActiveTagFilter(entityType);
    if (selectedTags.length > 0) {
      fetchFilteredResults(selectedTags, entityType);
    }
  };

  const fetchFilteredResults = async (tagIds, entityType) => {
    if (tagIds.length === 0) {
      setFilteredResults([]);
      return;
    }

    setIsLoadingResults(true);
    
    try {
      let entityField;
      let entityTable;
      let mainTable;
      let selectFields;
      
      if (entityType === 'contacts') {
        entityField = 'contact_id';
        entityTable = 'contact_tags';
        mainTable = 'contacts';
        selectFields = `
          contact_id,
          first_name,
          last_name,
          job_role,
          score,
          category
        `;
      } else if (entityType === 'companies') {
        entityField = 'company_id';
        entityTable = 'company_tags';
        mainTable = 'companies';
        selectFields = `
          company_id,
          name,
          website,
          category,
          description
        `;
      } else if (entityType === 'deals') {
        entityField = 'deal_id';
        entityTable = 'deal_tags';
        mainTable = 'deals';
        selectFields = `
          deal_id,
          opportunity,
          total_investment,
          category,
          stage,
          description,
          created_at
        `;
      }

      // Get all tag associations for the selected tags
      const { data: tagAssociations, error } = await supabase
        .from(entityTable)
        .select(`${entityField}, tag_id`)
        .in('tag_id', tagIds);
        
      if (error) throw error;
      
      // Group by entity and count matching tags
      const entityTagCounts = {};
      tagAssociations.forEach(association => {
        const entityId = association[entityField];
        if (!entityTagCounts[entityId]) {
          entityTagCounts[entityId] = 0;
        }
        entityTagCounts[entityId]++;
      });
      
      // Filter entities that have ALL selected tags
      const entityIdsWithAllTags = Object.keys(entityTagCounts)
        .filter(entityId => entityTagCounts[entityId] === tagIds.length);
      
      if (entityIdsWithAllTags.length === 0) {
        setFilteredResults([]);
        return;
      }
      
      // Now fetch the actual entity data directly from main table
      const { data: entities, error: entitiesError } = await supabase
        .from(mainTable)
        .select(selectFields)
        .in(entityField, entityIdsWithAllTags);
      
      if (entitiesError) throw entitiesError;
      
      // The results are already the direct entity data, no need to extract nested data
      setFilteredResults(entities || []);
      
    } catch (err) {
      console.error('Error fetching filtered results:', err);
      toast.error('Failed to fetch filtered results');
      setFilteredResults([]);
    } finally {
      setIsLoadingResults(false);
    }
  };
  
  // CityModal handlers
  const handleOpenCityModal = () => {
    setIsCityModalOpen(true);
  };

  const handleCloseCityModal = () => {
    setIsCityModalOpen(false);
  };

  const handleCityAdded = (newCity) => {
    // Refresh cities when a city is added
    setCities(prev => {
      const exists = prev.some(city => city.city_id === newCity.id);
      if (!exists) {
        return [...prev, { city_id: newCity.id, name: newCity.name, country: newCity.country }];
      }
      return prev;
    });
  };

  const handleCityRemoved = (removedCity) => {
    // Refresh cities when a city is removed
    setCities(prev => prev.filter(city => city.city_id !== removedCity.id));
  };
  
  // Location Relationships modal handlers
  const handleOpenLocationModal = () => {
    setIsLocationModalOpen(true);
    // Reset state when opening modal
    setSelectedCities([]);
    setLocationFilteredResults([]);
    setActiveLocationFilter('contacts');
  };

  const handleCloseLocationModal = () => {
    setIsLocationModalOpen(false);
    // Reset state when closing modal
    setSelectedCities([]);
    setLocationFilteredResults([]);
  };

  const handleLocationFilterChange = (filter) => {
    setActiveLocationFilter(filter);
  };
  
  // Add new filtering handlers
  const handleLocationToggle = (cityId) => {
    setSelectedCities(prev => {
      const newSelected = prev.includes(cityId) 
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId];
      
      // Fetch results when cities change
      if (newSelected.length > 0) {
        fetchLocationFilteredResults(newSelected, activeLocationFilter);
      } else {
        setLocationFilteredResults([]);
      }
      
      return newSelected;
    });
  };

  const handleLocationEntityTypeChange = (entityType) => {
    setActiveLocationFilter(entityType);
    if (selectedCities.length > 0) {
      fetchLocationFilteredResults(selectedCities, entityType);
    }
  };

  const fetchLocationFilteredResults = async (cityIds, entityType) => {
    if (cityIds.length === 0) {
      setLocationFilteredResults([]);
      return;
    }

    setIsLoadingLocationResults(true);
    
    try {
      let entityField;
      let entityTable;
      let mainTable;
      let selectFields;
      
      if (entityType === 'contacts') {
        entityField = 'contact_id';
        entityTable = 'contact_cities';
        mainTable = 'contacts';
        selectFields = `
          contact_id,
          first_name,
          last_name,
          job_role,
          score,
          category
        `;
      } else if (entityType === 'companies') {
        entityField = 'company_id';
        entityTable = 'company_cities';
        mainTable = 'companies';
        selectFields = `
          company_id,
          name,
          website,
          category,
          description
        `;
      } else if (entityType === 'deals') {
        // Deals not implemented yet - no deal_cities table
        setLocationFilteredResults([]);
        setIsLoadingLocationResults(false);
        return;
      }

      // Get all city associations for the selected cities
      const { data: cityAssociations, error } = await supabase
        .from(entityTable)
        .select(`${entityField}, city_id`)
        .in('city_id', cityIds);
        
      if (error) throw error;
      
      // Group by entity and count matching cities
      const entityCityCounts = {};
      cityAssociations.forEach(association => {
        const entityId = association[entityField];
        if (!entityCityCounts[entityId]) {
          entityCityCounts[entityId] = 0;
        }
        entityCityCounts[entityId]++;
      });
      
      // Filter entities that have ALL selected cities
      const entityIdsWithAllCities = Object.keys(entityCityCounts)
        .filter(entityId => entityCityCounts[entityId] === cityIds.length);
      
      if (entityIdsWithAllCities.length === 0) {
        setLocationFilteredResults([]);
        return;
      }
      
      // Now fetch the actual entity data directly from main table
      const { data: entities, error: entitiesError } = await supabase
        .from(mainTable)
        .select(selectFields)
        .in(entityField, entityIdsWithAllCities);
      
      if (entitiesError) throw entitiesError;
      
      // The results are already the direct entity data, no need to extract nested data
      setLocationFilteredResults(entities || []);
      
    } catch (err) {
      console.error('Error fetching filtered results:', err);
      toast.error('Failed to fetch filtered results');
      setLocationFilteredResults([]);
    } finally {
      setIsLoadingLocationResults(false);
    }
  };
  
  if (loading) {
    return (
      <Container>
        <LoadingScreen>
          <div>Loading Contact Data...</div>
        </LoadingScreen>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <ErrorScreen>
          <h2>Error Loading Contact</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/contacts/simple')}>Back to Contacts</button>
        </ErrorScreen>
      </Container>
    );
  }
  
  if (!contact) {
    return (
      <Container>
        <ErrorScreen>
          <h2>Contact Not Found</h2>
          <p>The requested contact could not be found.</p>
          <button onClick={() => navigate('/contacts/simple')}>Back to Contacts</button>
        </ErrorScreen>
      </Container>
    );
  }
  
  return (
    <Container>
      <Breadcrumbs>
        <span onClick={() => navigate('/contacts/lists')} style={{ cursor: 'pointer' }}>Lists</span>
        <span style={{ margin: '0 8px' }}>/</span>
        <span 
          onClick={() => navigate(`/contacts/lists?category=${encodeURIComponent(contact.category || 'Uncategorized')}`)} 
          style={{ cursor: 'pointer' }}
        >
          {contact.category || 'Uncategorized'}
        </span>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: '#ccc' }}>{contact.first_name} {contact.last_name}</span>
      </Breadcrumbs>
      
      <Header>
        <div>
          <Title>{contact.first_name} {contact.last_name}</Title>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', color: '#999', fontSize: '0.85rem' }}>
            <div style={{ marginRight: '20px' }}>
              <span>Created: </span>
              <span style={{ color: '#eee' }}>{formatDateTime(contact.created_at)}</span>
            </div>
            <div>
              <span>Last modified: </span>
              <span style={{ color: '#eee' }}>{formatDateTime(contact.last_modified_at)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {mobiles.length > 0 && (
            <a 
              href={`https://wa.me/${mobiles[0].mobile.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#25D366',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <FiPhone style={{ marginRight: '5px' }} /> WhatsApp
            </a>
          )}
          
          {emails.length > 0 && (
            <a 
              href={`mailto:${emails[0].email}`}
              style={{
                backgroundColor: '#4285F4',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <FiMail style={{ marginRight: '5px' }} /> Email
            </a>
          )}
          
          {contact.linkedin && (
            <LinkedInContainer>
              <LinkedInIcon 
                size={20}
                hasLink={!!(contact.linkedin && contact.linkedin.trim())}
                onClick={handleLinkedInClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLinkedInClick();
                  }
                }}
                tabIndex={0}
                title={
                  contact.linkedin && contact.linkedin.trim() 
                    ? "Click to open LinkedIn profile" 
                    : `Click to search for ${contact.first_name} ${contact.last_name} on LinkedIn`
                }
              />
              <LinkedInEditButton onClick={handleLinkedInEditClick}>
                Edit LinkedIn
              </LinkedInEditButton>
            </LinkedInContainer>
          )}
          
          <EditButton onClick={handleEdit}>
            <FiEdit /> Edit
          </EditButton>
        </div>
      </Header>
      
      <ContentGrid>
        {/* Left Column - Contact Info */}
        <div style={{ width: '20%', flexShrink: 0 }}>
          <Card>
            <CardTitle><FiMail /> Contact Information</CardTitle>
            
              <InfoItem>
              <SectionHeader>
                <InfoLabel>Emails</InfoLabel>
              </SectionHeader>
              {emails.length > 0 && emails.map((email, index) => (
                <EmailContainer key={email.email_id}>
                  <EmailValue 
                    onClick={() => {
                      window.open(`mailto:${email.email}`, '_self');
                    }}
                    style={{ 
                      cursor: 'pointer'
                    }}
                    title="Click to send email"
                  >
                    {email.email}
                  </EmailValue>
                  <EmailActions>
                    <SmallEditButton 
                      onClick={handleOpenEmailsModal}
                      title="Manage emails"
                    >
                      <FiEdit size={10} />
                    </SmallEditButton>
                    <SmallDeleteButton 
                      onClick={() => handleDeleteEmail(email.email_id)}
                      title="Delete email"
                    >
                      <FiTrash size={10} />
                    </SmallDeleteButton>
                  </EmailActions>
                </EmailContainer>
              ))}
              {emails.length === 0 && (
                <InfoValue 
                  onClick={handleOpenEmailsModal}
                  style={{ color: '#00ff00', fontStyle: 'italic', cursor: 'pointer' }}
                  title="Click to add emails"
                >
                  Add emails
                </InfoValue>
              )}
            </InfoItem>
            
              <InfoItem>
              <SectionHeader>
                <InfoLabel>Mobile Numbers</InfoLabel>
                <AddButton onClick={handleAddMobile} title="Add mobile number">
                  <FiPlus size={14} />
                </AddButton>
              </SectionHeader>
              {mobiles.length > 0 && mobiles.map((mobile, index) => (
                <MobileContainer key={mobile.mobile_id}>
                  {editingMobileId === mobile.mobile_id ? (
                    <EditableField>
                      <MobileInput
                        type="tel"
                        value={editMobileValue}
                        onChange={(e) => setEditMobileValue(e.target.value)}
                        disabled={isSavingEditMobile}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEditMobile();
                          } else if (e.key === 'Escape') {
                            handleCancelEditMobile();
                          }
                        }}
                        autoFocus
                      />
                      <SaveButton 
                        onClick={handleSaveEditMobile}
                        disabled={isSavingEditMobile || !editMobileValue.trim()}
                        title="Save changes"
                      >
                        <FiCheck size={14} />
                      </SaveButton>
                      <CancelButton 
                        onClick={handleCancelEditMobile}
                        disabled={isSavingEditMobile}
                        title="Cancel"
                      >
                        <FiX size={14} />
                      </CancelButton>
                    </EditableField>
                  ) : (
                    <>
                      <InfoValue 
                        onClick={() => {
                          try {
                            const formattedNumber = mobile.mobile.replace(/\D/g, '');
                            if (formattedNumber) {
                              window.open(`https://wa.me/${formattedNumber}`, '_blank', 'noopener,noreferrer');
                            } else {
                              toast.error('Invalid phone number format');
                            }
                          } catch (error) {
                            console.error('Error opening WhatsApp:', error);
                            toast.error('Failed to open WhatsApp');
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            try {
                              const formattedNumber = mobile.mobile.replace(/\D/g, '');
                              if (formattedNumber) {
                                window.open(`https://wa.me/${formattedNumber}`, '_blank', 'noopener,noreferrer');
                              } else {
                                toast.error('Invalid phone number format');
                              }
                            } catch (error) {
                              console.error('Error opening WhatsApp:', error);
                              toast.error('Failed to open WhatsApp');
                            }
                          }
                        }}
                        tabIndex={0}
                        style={{ 
                          cursor: 'pointer'
                        }}
                        title="Click to open WhatsApp chat"
                      >
                        {mobile.mobile}
                  </InfoValue>
                      <MobileActions>
                        <SaveButton 
                          onClick={() => handleEditExistingMobile(mobile)}
                          title="Edit mobile number"
                        >
                          <FiEdit size={12} />
                        </SaveButton>
                        <DeleteButton 
                          onClick={() => handleDeleteMobile(mobile.mobile_id)}
                          title="Delete mobile number"
                        >
                          <FiTrash size={12} />
                        </DeleteButton>
                      </MobileActions>
                    </>
                  )}
                </MobileContainer>
              ))}
              {mobiles.length === 0 && !isAddingMobile && (
                <InfoValue style={{ color: '#666', fontStyle: 'italic' }}>
                  No mobile numbers
                </InfoValue>
              )}
              {isAddingMobile && (
                <EditableField ref={mobileInputRef} style={{ marginTop: '8px' }}>
                  <MobileInput
                    type="tel"
                    value={newMobileValue}
                    onChange={(e) => setNewMobileValue(e.target.value)}
                    disabled={isSavingMobile}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMobileValue.trim()) {
                        handleSaveMobile();
                      } else if (e.key === 'Escape') {
                        handleCancelMobile();
                      }
                    }}
                    onBlur={() => {
                      if (newMobileValue.trim()) {
                        handleSaveMobile();
                      } else {
                        handleCancelMobile();
                      }
                    }}
                    autoFocus
                  />
                  <CancelButton 
                    onClick={handleCancelMobile}
                    disabled={isSavingMobile}
                    title="Cancel"
                  >
                    <FiX size={14} />
                  </CancelButton>
                </EditableField>
              )}
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>LinkedIn</InfoLabel>
              <LinkedInContainer>
                <LinkedInIcon 
                  size={20}
                  hasLink={!!(contact.linkedin && contact.linkedin.trim())}
                  onClick={handleLinkedInClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLinkedInClick();
                    }
                  }}
                  tabIndex={0}
                  title={
                    contact.linkedin && contact.linkedin.trim() 
                      ? "Click to open LinkedIn profile" 
                      : `Click to search for ${contact.first_name} ${contact.last_name} on LinkedIn`
                  }
                />
                <LinkedInEditButton onClick={handleLinkedInEditClick}>
                  <FiEdit2 size={14} />
                </LinkedInEditButton>
              </LinkedInContainer>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Job Role</InfoLabel>
              <InfoValue>{contact.job_role || '-'}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Score</InfoLabel>
              {isEditingScore ? (
                <ScoreEditContainer
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key >= '1' && e.key <= '5') {
                      const newScore = parseInt(e.key);
                      setEditScoreValue(newScore);
                    } else if (e.key === 'Enter') {
                      handleSaveScore();
                    } else if (e.key === 'Escape') {
                      handleCancelScore();
                    }
                  }}
                  autoFocus
                >
                  <StarContainer>
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <Star
                        key={starValue}
                        size={16}
                        clickable={true}
                        filled={starValue <= editScoreValue}
                        onClick={() => handleStarClick(starValue)}
                      />
                    ))}
                  </StarContainer>
                  <SaveButton 
                    onClick={handleSaveScore}
                    disabled={isSavingScore}
                    title="Save score"
                  >
                    <FiCheck size={14} />
                  </SaveButton>
                  <CancelButton 
                    onClick={handleCancelScore}
                    disabled={isSavingScore}
                    title="Cancel"
                  >
                    <FiX size={14} />
                  </CancelButton>
                </ScoreEditContainer>
              ) : (
                <StarContainer 
                  onClick={handleEditScore}
                  style={{ cursor: 'pointer' }}
                  title="Click to edit score"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key >= '1' && e.key <= '5') {
                      const newScore = parseInt(e.key);
                      setEditScoreValue(newScore);
                      setIsEditingScore(true);
                    }
                  }}
                >
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <Star
                      key={starValue}
                      size={16}
                      clickable={false}
                      filled={starValue <= (contact.score || 0)}
                    />
                  ))}
                </StarContainer>
              )}
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Birthday</InfoLabel>
              {isEditingBirthday ? (
                <EditableField ref={birthdayEditRef}>
                  <DateInput
                    type="date"
                    value={editBirthdayValue}
                    onChange={(e) => setEditBirthdayValue(e.target.value)}
                    disabled={isSavingBirthday}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveBirthday();
                      } else if (e.key === 'Escape') {
                        handleCancelBirthday();
                      }
                    }}
                    autoFocus
                  />
                </EditableField>
              ) : (
                <InfoValue 
                  onClick={handleEditBirthday}
                  style={{ 
                    cursor: 'pointer'
                  }}
                  title="Click to edit birthday"
                >
                  {contact.birthday ? formatDate(contact.birthday) : '-'}
                </InfoValue>
              )}
            </InfoItem>
          </Card>
          
          {keepInTouch && (
            <Card>
              <CardTitle><FiClock /> Keep in Touch</CardTitle>
              
              <InfoItem>
                <InfoLabel>Frequency</InfoLabel>
                {isEditingFrequency ? (
                  <EditableField>
                    <FrequencySelect
                      value={editFrequencyValue}
                      onChange={(e) => handleSaveFrequency(e.target.value)}
                      disabled={isSavingFrequency}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          handleCancelFrequency();
                        }
                      }}
                      autoFocus
                    >
                      {frequencyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FrequencySelect>
                  </EditableField>
                ) : (
                  <InfoValue 
                    onClick={handleEditFrequency}
                    style={{ 
                      cursor: 'pointer'
                    }}
                    title="Click to edit frequency"
                  >
                    {keepInTouch.frequency || 'Not set'}
                  </InfoValue>
                )}
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>Last Interaction</InfoLabel>
                <InfoValue>{formatMonthYear(contact.last_interaction_at || '-')}</InfoValue>
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>Next Interaction Due</InfoLabel>
                <InfoValue style={{ 
                  color: keepInTouch.next_interaction_date && 
                  new Date(keepInTouch.next_interaction_date) < new Date() ? 
                  '#ff5555' : undefined 
                }}>
                  {formatDateTime(keepInTouch.next_interaction_date || '-')}
                  {keepInTouch.days_until_next && (
                    <span style={{ 
                      marginLeft: '8px',
                      color: keepInTouch.days_until_next < 0 ? '#ff5555' : '#00ff00' 
                    }}>
                      ({keepInTouch.days_until_next > 0 ? `in ${keepInTouch.days_until_next} days` : `${Math.abs(keepInTouch.days_until_next)} days overdue`})
                    </span>
                  )}
                </InfoValue>
              </InfoItem>
              
              {keepInTouch.why_keeping_in_touch && (
                <InfoItem>
                  <InfoLabel>Why Keeping in Touch</InfoLabel>
                  <InfoValue>{keepInTouch.why_keeping_in_touch}</InfoValue>
                </InfoItem>
              )}
              
              {keepInTouch.next_follow_up_notes && (
                <InfoItem>
                  <InfoLabel>Follow-up Notes</InfoLabel>
                  <InfoValue>{keepInTouch.next_follow_up_notes}</InfoValue>
                </InfoItem>
              )}
              
              <InfoItem>
                <InfoLabel>Snooze Days</InfoLabel>
                {isEditingSnoozeDays ? (
                  <EditableField>
                    <NumberInput
                      type="number"
                      min="0"
                      value={editSnoozeDaysValue}
                      onChange={(e) => setEditSnoozeDaysValue(e.target.value)}
                      disabled={isSavingSnoozeDays}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveSnoozeDays();
                        } else if (e.key === 'Escape') {
                          handleCancelSnoozeDays();
                        }
                      }}
                      autoFocus
                    />
                    <SaveButton 
                      onClick={handleSaveSnoozeDays}
                      disabled={isSavingSnoozeDays}
                      title="Save snooze days"
                    >
                      <FiCheck size={14} />
                    </SaveButton>
                    <CancelButton 
                      onClick={handleCancelSnoozeDays}
                      disabled={isSavingSnoozeDays}
                      title="Cancel"
                    >
                      <FiX size={14} />
                    </CancelButton>
                  </EditableField>
                ) : (
                  <InfoValue 
                    onClick={handleEditSnoozeDays}
                    style={{ 
                      cursor: 'pointer'
                    }}
                    title="Click to edit snooze days"
                  >
                    {keepInTouch.snooze_days || 0}
                </InfoValue>
                )}
              </InfoItem>
            </Card>
          )}
          
            <Card>
            <TagsHeader>
              <CardTitle 
                onClick={handleOpenTagsModal}
                style={{ cursor: 'pointer' }}
                title="Click to view tag relationships"
              >
                <FiTag /> Tags
              </CardTitle>
            </TagsHeader>
            
              <BadgeContainer>
                {tags.length > 0 ? (
                  tags.map(tag => (
                    <Badge 
                      key={tag.tag_id}
                      onClick={handleOpenTagsManagerModal}
                      style={{ cursor: 'pointer' }}
                      title="Click to manage tags"
                    >
                      {tag.name}
                    </Badge>
                  ))
                ) : (
                  <span 
                    style={{ 
                      color: '#00ff00', 
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                    onClick={handleOpenTagsManagerModal}
                    title="Click to add tags"
                  >
                    Add Tags
                  </span>
                )}
              </BadgeContainer>
            </Card>
          
            <Card>
            <CardTitle
              onClick={handleOpenLocationModal}
              style={{ cursor: 'pointer' }}
              title="Click to view location relationships"
            >
              <FiMapPin /> Locations
            </CardTitle>
              <BadgeContainer>
              {cities.length > 0 ? (
                cities.map(city => (
                  <Badge 
                    key={city.city_id}
                    onClick={handleOpenCityModal}
                    style={{ cursor: 'pointer' }}
                    title="Click to manage locations"
                  >
                    {city.name}, {city.country}
                  </Badge>
                ))
              ) : (
                <span 
                  style={{ 
                    color: '#00ff00', 
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                  onClick={handleOpenCityModal}
                  title="Click to add locations"
                >
                  Add Location
                </span>
              )}
              </BadgeContainer>
            </Card>
          
          {companies.length > 0 && (
            <Card>
              <CardTitle><FiBriefcase /> Companies</CardTitle>
              {companies.map(company => (
                <InfoItem key={company.contact_companies_id}>
                  <InfoValue>
                    {company.companies.name} 
                    {company.is_primary && ' (Primary)'}
                  </InfoValue>
                  <InfoLabel>
                    {company.relationship || 'Associated'}
                    {company.companies.website && ` · ${company.companies.website}`}
                  </InfoLabel>
                </InfoItem>
              ))}
            </Card>
          )}
        </div>
        
        {/* Right Column - Interactions, Notes, etc */}
        <div style={{ width: '80%', flexGrow: 1, boxSizing: 'border-box', overflow: 'hidden', paddingRight: '5px' }}>
          <Tabs>
            <Tab 
              active={activeTab === 'interactions'}
              onClick={() => setActiveTab('interactions')}
            >
              Interactions
            </Tab>
            <Tab 
              active={activeTab === 'opportunities'}
              onClick={() => setActiveTab('opportunities')}
            >
              Deals
            </Tab>
            <Tab 
              active={activeTab === 'introductions'}
              onClick={() => setActiveTab('introductions')}
            >
              Introductions
            </Tab>
            <Tab 
              active={activeTab === 'notes'}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </Tab>
            <Tab 
              active={activeTab === 'related'}
              onClick={() => setActiveTab('related')}
            >
              Related
            </Tab>
          </Tabs>
          
          <TabContent active={activeTab === 'interactions'}>
            <Card>
              <Tabs style={{ borderBottom: '1px solid #222', marginTop: '-10px', paddingLeft: '0' }}>
                <Tab 
                  active={activeInteractionTab === 'emails'}
                  onClick={() => setActiveInteractionTab('emails')}
                  style={{ fontSize: '0.9rem', padding: '8px 20px', cursor: 'pointer' }}
                  title="View email interactions"
                >
                  Emails
                </Tab>
                <Tab 
                  active={activeInteractionTab === 'whatsapp'}
                  onClick={() => setActiveInteractionTab('whatsapp')}
                  style={{ fontSize: '0.9rem', padding: '8px 20px', cursor: 'pointer' }}
                  title="View WhatsApp interactions"
                >
                  WhatsApp
                </Tab>
                <Tab 
                  active={false}
                  onClick={() => {}}
                  style={{ fontSize: '0.9rem', padding: '8px 20px', opacity: 0.5, cursor: 'not-allowed' }}
                  title="Meetings section - coming soon"
                >
                  Meetings
                </Tab>
              </Tabs>
              
              {activeInteractionTab === 'emails' && (
                <ContactsInteractionModal
                  isOpen={true}
                  onRequestClose={() => {}} // No close action needed for inline display
                  contact={contact}
                  showWhatsApp={false}
                  showEmail={true}
                  showMeetings={false}
                  inline={true}
                />
              )}
              
              {activeInteractionTab === 'whatsapp' && (
                <ContactsInteractionModal
                  isOpen={true}
                  onRequestClose={() => {}} // No close action needed for inline display
                  contact={contact}
                  showWhatsApp={true}
                  showEmail={false}
                  showMeetings={false}
                  inline={true}
                />
              )}
              
              {activeInteractionTab === 'meetings' && (
                <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>
                  Meetings functionality coming soon
                </div>
              )}
            </Card>
          </TabContent>
          
          <TabContent active={activeTab === 'opportunities'}>
            <DealViewFindAddModal
              isOpen={true}
              onClose={() => {}} // No close action needed for inline display
              contactData={contact}
              showOnlyCreateTab={false}
              onSave={handleDealsUpdated}
              inline={true}
            />
          </TabContent>
          
          <TabContent active={activeTab === 'introductions'}>
            <Card>
              <IntroductionsHeader>
                <div style={{ 
                  color: '#00ff00', 
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}>
                  {loadingIntroductions ? 'Loading...' : 
                   introductions.length === 0 ? 'No Introductions' :
                   `${introductions.length} Introduction${introductions.length !== 1 ? 's' : ''} Found`
                  }
                </div>
                <AddNewButton onClick={handleOpenIntroductionAddModal}>
                  <FiPlus size={16} />
                  ADD NEW
                </AddNewButton>
              </IntroductionsHeader>
              
              {loadingIntroductions ? (
                <div style={{ padding: '30px 0', color: '#00ff00', textAlign: 'center' }}>
                  Loading introductions...
                </div>
              ) : introductions.length === 0 ? (
                <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>
                  No introductions found for this contact
                </div>
              ) : (
                <IntroductionsContainer>
                  {introductions.map(intro => (
                    <IntroductionCard key={intro.id}>
                      <IntroductionHeader>
                        <IntroductionDate>
                          {intro.date ? new Date(intro.date).toLocaleDateString() : 'No date'}
                        </IntroductionDate>
                        <IntroductionStatus status={intro.status}>
                          {intro.status}
                        </IntroductionStatus>
                      </IntroductionHeader>
                      
                      <IntroductionContacts>
                        <IntroductionContactsLabel>
                          Introduced to:
                        </IntroductionContactsLabel>
                        <IntroductionContactsValue>
                          {intro.otherContacts.length > 0 
                            ? intro.otherContacts.join(' • ') 
                            : 'No other contacts found'
                          }
                        </IntroductionContactsValue>
                      </IntroductionContacts>
                      
                      {intro.relatedCompanies.length > 0 && (
                        <IntroductionCompanies>
                          <IntroductionCompaniesLabel>
                            Related Companies:
                          </IntroductionCompaniesLabel>
                          <IntroductionCompaniesValue>
                            {intro.relatedCompanies.join(', ')}
                          </IntroductionCompaniesValue>
                        </IntroductionCompanies>
                      )}
                      
                      {intro.description && (
                        <IntroductionDescription>
                          {intro.description}
                        </IntroductionDescription>
                      )}
                      
                      {intro.category && (
                        <IntroductionCategory>
                          {intro.category}
                        </IntroductionCategory>
                      )}
                    </IntroductionCard>
                  ))}
                </IntroductionsContainer>
              )}
            </Card>
          </TabContent>
          
          <TabContent active={activeTab === 'notes'}>
            <Card>
              <IntroductionsHeader>
                <div style={{ 
                  color: '#00ff00', 
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}>
                  {notes.length === 0 ? 'No Notes' : `${notes.length} Note${notes.length !== 1 ? 's' : ''} Found`}
                </div>
                <AddNewButton onClick={handleOpenContactNotesModal}>
                  <FiPlus size={16} />
                  ADD NEW
                </AddNewButton>
              </IntroductionsHeader>
              
              {notes.length === 0 ? (
                <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>
                  No notes found for this contact
                </div>
              ) : (
                <div>
                  {notes.map(note => (
                    <RelatedItem key={note.note_id} onClick={handleOpenContactNotesModal} style={{ cursor: 'pointer' }}>
                      <RelatedTitle>{note.title}</RelatedTitle>
                      <RelatedSubtitle>{formatDateTime(note.created_at)}</RelatedSubtitle>
                      <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#ddd' }}>
                        {note.text}
                      </div>
                    </RelatedItem>
                  ))}
                </div>
              )}
            </Card>
          </TabContent>
          
          <TabContent active={activeTab === 'related'}>
            <Card>
              <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>Coming soon</div>
            </Card>
          </TabContent>
        </div>
      </ContentGrid>

      {/* TagsModalComponent */}
      {isTagsManagerModalOpen && (
        <TagsModalComponent
          isOpen={isTagsManagerModalOpen}
          onRequestClose={handleCloseTagsManagerModal}
          contact={contact}
          onTagAdded={handleTagAdded}
          onTagRemoved={handleTagRemoved}
        />
      )}

      {/* CityModal */}
      {isCityModalOpen && (
        <CityModal
          isOpen={isCityModalOpen}
          onRequestClose={handleCloseCityModal}
          contact={contact}
          onCityAdded={handleCityAdded}
          onCityRemoved={handleCityRemoved}
        />
      )}

      {/* Location Relationships Modal */}
      {isLocationModalOpen && (
        <ModalOverlay onClick={handleCloseLocationModal}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalSidebar>
              <FilterButton 
                active={activeLocationFilter === 'contacts'}
                onClick={() => handleLocationEntityTypeChange('contacts')}
              >
                Related contacts
              </FilterButton>
              <FilterButton 
                active={activeLocationFilter === 'companies'}
                onClick={() => handleLocationEntityTypeChange('companies')}
              >
                Related Companies
              </FilterButton>
              <FilterButton 
                active={false}
                onClick={() => {}}
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                title="Coming soon - no deal_cities table yet"
              >
                Related Deals
              </FilterButton>
              
              {/* Cities display in sidebar */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ color: '#00ff00', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Filter by Cities
                  {selectedCities.length > 0 && (
                    <span style={{ color: '#999', fontSize: '0.8rem', marginLeft: '8px' }}>
                      ({selectedCities.length} selected)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {cities.length > 0 ? (
                    cities.map(city => (
                      <FilterableTag
                        key={city.city_id}
                        selected={selectedCities.includes(city.city_id)}
                        onClick={() => handleLocationToggle(city.city_id)}
                      >
                        {city.name}
                      </FilterableTag>
                    ))
                  ) : (
                    <span style={{ color: '#666', fontStyle: 'italic', fontSize: '0.8rem' }}>
                      No cities
                    </span>
                  )}
                </div>
              </div>
            </ModalSidebar>
            
            <ModalContent>
              <ModalHeader>
                <ModalTitle>City Relationships</ModalTitle>
                <CloseButton onClick={handleCloseLocationModal}>
                  <FiX size={20} />
                </CloseButton>
              </ModalHeader>
              
              <ResultsContainer>
                {selectedCities.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '200px',
                    color: '#999',
                    textAlign: 'center'
                  }}>
                    Select one or more cities to see related {activeLocationFilter}
                  </div>
                ) : isLoadingLocationResults ? (
                  <LoadingSpinner>
                    Loading {activeLocationFilter}...
                  </LoadingSpinner>
                ) : locationFilteredResults.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '200px',
                    color: '#999',
                    textAlign: 'center'
                  }}>
                    No {activeLocationFilter} found with selected cities
                  </div>
                ) : (
                  <div>
                    <div style={{ 
                      padding: '15px 20px 10px 20px', 
                      borderBottom: '1px solid #333',
                      color: '#00ff00',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      {locationFilteredResults.length} {activeLocationFilter} found
                    </div>
                    {locationFilteredResults.map(item => {
                      if (activeLocationFilter === 'contacts') {
                        return (
                          <ResultItem 
                            key={item.contact_id}
                            onClick={() => {
                              if (item.contact_id !== id) {
                                navigate(`/contacts/${item.contact_id}`);
                                handleCloseLocationModal();
                              }
                            }}
                          >
                            <ResultTitle>
                              {item.first_name} {item.last_name}
                            </ResultTitle>
                            <ResultSubtitle>
                              {item.job_role && `${item.job_role} • `}
                              {item.category || 'Uncategorized'}
                              {item.score && ` • Score: ${item.score}/5`}
                            </ResultSubtitle>
                          </ResultItem>
                        );
                      } else if (activeLocationFilter === 'companies') {
                        return (
                          <ResultItem 
                            key={item.company_id}
                            onClick={() => {
                              // Navigate to companies page with search parameter
                              navigate(`/companies?search=${encodeURIComponent(item.name)}`);
                              handleCloseLocationModal();
                            }}
                          >
                            <ResultTitle>{item.name}</ResultTitle>
                            <ResultSubtitle>
                              {item.category && `${item.category} • `}
                              {item.website && `${item.website} • `}
                              {item.description || 'No description'}
                            </ResultSubtitle>
                          </ResultItem>
                        );
                      } else if (activeLocationFilter === 'deals') {
                        return (
                          <ResultItem 
                            key={item.deal_id}
                            onClick={() => {
                              // Since we're using inline display, we can just switch to the deals tab
                              setActiveTab('opportunities');
                              handleCloseLocationModal();
                            }}
                          >
                            <ResultTitle>{item.opportunity}</ResultTitle>
                            <ResultSubtitle>
                              {item.total_investment && `$${item.total_investment.toLocaleString()} • `}
                              {item.category && `${item.category} • `}
                              {item.stage}
                            </ResultSubtitle>
                          </ResultItem>
                        );
                      }
                    })}
                  </div>
                )}
              </ResultsContainer>
            </ModalContent>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* LinkedIn Preview Modal */}
      {isLinkedInModalOpen && contact && (
        <LinkedInPreviewModal
          isOpen={isLinkedInModalOpen}
          onClose={handleLinkedInModalClose}
          linkedInUrl={contact.linkedin || ''}
          contactName={`${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
          firstName={contact.first_name || ''}
          lastName={contact.last_name || ''}
          email={emails.length > 0 ? emails[0].email : ''}
          jobRole={contact.job_role || ''}
          onSaveData={handleLinkedInDataSave}
        />
      )}

      {/* ManageContactEmails Modal */}
      {isManageEmailsModalOpen && (
        <ManageContactEmails
          isOpen={isManageEmailsModalOpen}
          onRequestClose={handleCloseEmailsModal}
          contact={contact}
          onUpdateEmails={handleEmailsUpdated}
        />
      )}

      {/* ContactsInteractionModal */}
      {isInteractionModalOpen && contact && (
        <ContactsInteractionModal
          isOpen={isInteractionModalOpen}
          onRequestClose={handleCloseInteractionModal}
          contact={contact}
          showWhatsApp={interactionModalFilters.showWhatsApp}
          showEmail={interactionModalFilters.showEmail}
          showMeetings={interactionModalFilters.showMeetings}
        />
      )}

      {/* IntroductionAddModal */}
      {isIntroductionAddModalOpen && (
        <IntroductionAddModal
          isOpen={isIntroductionAddModalOpen}
          onClose={handleCloseIntroductionAddModal}
          onSave={handleIntroductionSaved}
          preselectedContact={contact}
        />
      )}

      {/* ContactNotesModal */}
      {isContactNotesModalOpen && (
        <ContactNotesModal
          isOpen={isContactNotesModalOpen}
          onRequestClose={handleCloseContactNotesModal}
          contact={contact}
          onNotesUpdated={handleNotesUpdated}
        />
      )}
    </Container>
  );
};

export default ContactRecord;
