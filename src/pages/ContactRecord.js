// src/pages/ContactRecord.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import { FiEdit, FiPhone, FiMail, FiMapPin, FiTag, FiBriefcase, FiMessageSquare, FiCalendar, FiClock, FiCheck, FiX, FiStar, FiLinkedin, FiPlus, FiTrash } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DealViewFindAddModal from '../components/modals/DealViewFindAddModal';

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
  
  // Deal modal state
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  
  // Add new state for tag filtering
  const [selectedTags, setSelectedTags] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  
  // Ref for click outside detection
  const mobileInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const emailEditRef = useRef(null);
  const birthdayEditRef = useRef(null);
  const tagEditRef = useRef(null);
  const tagAddRef = useRef(null);
  
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
            .from('keep_in_touch')
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
  
  // Deal modal handlers
  const handleOpenDealModal = (deal) => {
    setSelectedDeal(deal);
    setIsDealModalOpen(true);
  };

  const handleCloseDealModal = () => {
    setIsDealModalOpen(false);
    setSelectedDeal(null);
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
            <a 
              href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#0A66C2',
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
              <FiBriefcase style={{ marginRight: '5px' }} /> LinkedIn
            </a>
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
                <AddButton onClick={handleAddEmail} title="Add email">
                  <FiPlus size={14} />
                </AddButton>
              </SectionHeader>
              {emails.length > 0 && emails.map((email, index) => (
                <EmailContainer key={email.email_id}>
                  {editingEmailId === email.email_id ? (
                    <EditableField ref={emailEditRef}>
                      <EmailInput
                        type="email"
                        value={editEmailValue}
                        onChange={(e) => setEditEmailValue(e.target.value)}
                        disabled={isSavingEditEmail}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEditEmail();
                          } else if (e.key === 'Escape') {
                            handleCancelEditEmail();
                          }
                        }}
                        autoFocus
                      />
                      <SaveButton 
                        onClick={handleSaveEditEmail}
                        disabled={isSavingEditEmail || !editEmailValue.trim()}
                        title="Save changes"
                      >
                        <FiCheck size={14} />
                      </SaveButton>
                      <CancelButton 
                        onClick={handleCancelEditEmail}
                        disabled={isSavingEditEmail}
                        title="Cancel"
                      >
                        <FiX size={14} />
                      </CancelButton>
                    </EditableField>
                  ) : (
                    <>
                      <EmailValue 
                        onClick={() => handleEditExistingEmail(email)}
                        style={{ 
                          cursor: 'pointer'
                        }}
                        title="Click to edit email"
                      >
                        {email.email}
                      </EmailValue>
                      <EmailActions>
                        <SmallEditButton 
                          onClick={() => handleEditExistingEmail(email)}
                          title="Edit email"
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
                    </>
                  )}
                </EmailContainer>
              ))}
              {emails.length === 0 && !isAddingEmail && (
                <InfoValue style={{ color: '#666', fontStyle: 'italic' }}>
                  No emails
                </InfoValue>
              )}
              {isAddingEmail && (
                <EditableField ref={emailInputRef} style={{ marginTop: '8px' }}>
                  <EmailInput
                    type="email"
                    value={newEmailValue}
                    onChange={(e) => setNewEmailValue(e.target.value)}
                    disabled={isSavingEmail}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newEmailValue.trim()) {
                        handleSaveEmail();
                      } else if (e.key === 'Escape') {
                        handleCancelEmail();
                      }
                    }}
                    onBlur={() => {
                      if (newEmailValue.trim()) {
                        handleSaveEmail();
                      } else {
                        handleCancelEmail();
                      }
                    }}
                    autoFocus
                  />
                  <CancelButton 
                    onClick={handleCancelEmail}
                    disabled={isSavingEmail}
                    title="Cancel"
                  >
                    <FiX size={14} />
                  </CancelButton>
                </EditableField>
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
              <AddButton onClick={handleAddTag} title="Add tag">
                <FiPlus size={14} />
              </AddButton>
            </TagsHeader>
            
              <BadgeContainer>
                {tags.map(tag => (
                editingTagId === tag.tag_id ? (
                  <TagEditContainer key={tag.tag_id} ref={tagEditRef}>
                    <TagInput
                      value={editTagValue}
                      onChange={(e) => setEditTagValue(e.target.value)}
                      disabled={isSavingTag}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEditTag();
                        } else if (e.key === 'Escape') {
                          handleCancelTag();
                        }
                      }}
                      autoFocus
                    />
                  </TagEditContainer>
                ) : (
                  <TagWithActions key={tag.tag_id}>
                    <EditableTag
                      onClick={() => handleEditTag(tag)}
                      style={{ cursor: 'pointer' }}
                      title="Click to edit tag"
                    >
                      {tag.name}
                    </EditableTag>
                    <TagActions className="tag-actions">
                      <TagEditButton 
                        onClick={() => handleEditTag(tag)}
                        title="Edit tag"
                      >
                        <FiEdit size={10} />
                      </TagEditButton>
                      <TagDeleteButton 
                        onClick={() => handleDeleteTagAssociation(tag.tag_id)}
                        title="Remove tag from contact"
                      >
                        <FiTrash size={10} />
                      </TagDeleteButton>
                    </TagActions>
                  </TagWithActions>
                )
              ))}
              
              {isAddingTag && (
                <TagEditContainer ref={tagAddRef}>
                  <TagInput
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    disabled={isSavingTag}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTagValue.trim()) {
                        handleSaveNewTag();
                      } else if (e.key === 'Escape') {
                        handleCancelTag();
                      }
                    }}
                    placeholder="Enter tag name"
                    autoFocus
                  />
                  <SaveButton 
                    onClick={handleSaveNewTag}
                    disabled={isSavingTag || !newTagValue.trim()}
                    title="Add tag"
                  >
                    <FiCheck size={10} />
                  </SaveButton>
                  <CancelButton 
                    onClick={handleCancelTag}
                    disabled={isSavingTag}
                    title="Cancel"
                  >
                    <FiX size={10} />
                  </CancelButton>
                </TagEditContainer>
              )}
              
              {tags.length === 0 && !isAddingTag && (
                <span style={{ color: '#666', fontStyle: 'italic' }}>No tags</span>
              )}
              </BadgeContainer>
            </Card>
          
          {cities.length > 0 && (
            <Card>
              <CardTitle><FiMapPin /> Locations</CardTitle>
              <BadgeContainer>
                {cities.map(city => (
                  <Badge key={city.city_id}>{city.name}, {city.country}</Badge>
                ))}
              </BadgeContainer>
            </Card>
          )}
          
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
              Opportunities
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
                  active={true}
                  onClick={() => {}}
                  style={{ fontSize: '0.9rem', padding: '8px 20px' }}
                >
                  Emails
                </Tab>
                <Tab 
                  active={false}
                  onClick={() => {}}
                  style={{ fontSize: '0.9rem', padding: '8px 20px' }}
                >
                  WhatsApp
                </Tab>
                <Tab 
                  active={false}
                  onClick={() => {}}
                  style={{ fontSize: '0.9rem', padding: '8px 20px' }}
                >
                  Meetings
                </Tab>
              </Tabs>
              <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>No interactions found</div>
            </Card>
          </TabContent>
          
          <TabContent active={activeTab === 'opportunities'}>
            <Card>
              <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>Coming soon</div>
            </Card>
          </TabContent>
          
          <TabContent active={activeTab === 'introductions'}>
            <Card>
              <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>Coming soon</div>
            </Card>
          </TabContent>
          
          <TabContent active={activeTab === 'notes'}>
            <Card>
              {notes.length === 0 ? (
                <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>No notes found</div>
              ) : (
                notes.map(note => (
                  <RelatedItem key={note.note_id}>
                    <RelatedTitle>{note.title}</RelatedTitle>
                    <RelatedSubtitle>{formatDateTime(note.created_at)}</RelatedSubtitle>
                    <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#ddd' }}>
                      {note.text}
                    </div>
                  </RelatedItem>
                ))
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
      
      {/* Tags Modal */}
      {isTagsModalOpen && (
        <ModalOverlay onClick={handleCloseTagsModal}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalSidebar>
              <FilterButton 
                active={activeTagFilter === 'contacts'}
                onClick={() => handleEntityTypeChange('contacts')}
              >
                Related contacts
              </FilterButton>
              <FilterButton 
                active={activeTagFilter === 'companies'}
                onClick={() => handleEntityTypeChange('companies')}
              >
                Related Companies
              </FilterButton>
              <FilterButton 
                active={activeTagFilter === 'deals'}
                onClick={() => handleEntityTypeChange('deals')}
              >
                Related Deals
              </FilterButton>
              
              {/* Tags display in sidebar */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ color: '#00ff00', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Filter by Tags
                  {selectedTags.length > 0 && (
                    <span style={{ color: '#999', fontSize: '0.8rem', marginLeft: '8px' }}>
                      ({selectedTags.length} selected)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {tags.length > 0 ? (
                    tags.map(tag => (
                      <FilterableTag
                        key={tag.tag_id}
                        selected={selectedTags.includes(tag.tag_id)}
                        onClick={() => handleTagToggle(tag.tag_id)}
                      >
                        {tag.name}
                      </FilterableTag>
                    ))
                  ) : (
                    <span style={{ color: '#666', fontStyle: 'italic', fontSize: '0.8rem' }}>
                      No tags
                    </span>
                  )}
                </div>
              </div>
            </ModalSidebar>
            
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Tag Relationships</ModalTitle>
                <CloseButton onClick={handleCloseTagsModal}>
                  <FiX size={20} />
                </CloseButton>
              </ModalHeader>
              
              <ResultsContainer>
                {selectedTags.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '200px',
                    color: '#999',
                    textAlign: 'center'
                  }}>
                    Select one or more tags to see related {activeTagFilter}
                  </div>
                ) : isLoadingResults ? (
                  <LoadingSpinner>
                    Loading {activeTagFilter}...
                  </LoadingSpinner>
                ) : filteredResults.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '200px',
                    color: '#999',
                    textAlign: 'center'
                  }}>
                    No {activeTagFilter} found with selected tags
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
                      {filteredResults.length} {activeTagFilter} found
                    </div>
                    {filteredResults.map(item => {
                      if (activeTagFilter === 'contacts') {
                        return (
                          <ResultItem 
                            key={item.contact_id}
                            onClick={() => {
                              if (item.contact_id !== id) {
                                navigate(`/contacts/${item.contact_id}`);
                                handleCloseTagsModal();
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
                      } else if (activeTagFilter === 'companies') {
                        return (
                          <ResultItem 
                            key={item.company_id}
                            onClick={() => {
                              // Navigate to companies page with search parameter
                              navigate(`/companies?search=${encodeURIComponent(item.name)}`);
                              handleCloseTagsModal();
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
                      } else if (activeTagFilter === 'deals') {
                        return (
                          <ResultItem 
                            key={item.deal_id}
                            onClick={() => {
                              handleOpenDealModal(item);
                              handleCloseTagsModal();
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

      {/* Deal Modal */}
      {isDealModalOpen && selectedDeal && (
        <DealViewFindAddModal
          isOpen={isDealModalOpen}
          onClose={handleCloseDealModal}
          contactData={contact}
          showOnlyCreateTab={false}
        />
      )}
    </Container>
  );
};

export default ContactRecord;
