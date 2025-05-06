import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import DuplicateProcessingModal from './DuplicateProcessingModal';
import { 
  FiX, 
  FiCheck, 
  FiTrash2, 
  FiArrowRight, 
  FiAlertTriangle, 
  FiMessageSquare, 
  FiMail, 
  FiPhone, 
  FiTag, 
  FiMapPin, 
  FiBriefcase, 
  FiLink, 
  FiCalendar,
  FiGitMerge,
  FiInfo
} from 'react-icons/fi';

// Helper function to calculate string similarity (Levenshtein distance)
const stringSimilarity = (str1, str2) => {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Early return for empty strings
  if (len1 === 0) return 0.0;
  if (len2 === 0) return 0.0;
  
  // Return simple partial match if strings are very short
  if (len1 < 3 || len2 < 3) {
    return str1.includes(str2) || str2.includes(str1) ? 0.9 : 0.0;
  }
  
  // Calculate Levenshtein distance matrix
  const matrix = [];
  
  // Initialize the matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  // Calculate similarity as 1 - (distance / max length)
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
};

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;

  h2 {
    color: #00ff00;
    margin: 0;
    font-size: 1.2rem;
    font-family: 'Courier New', monospace;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ff5555;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #ff0000;
  }
`;

const ProgressBar = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #1a1a1a;
  height: 6px;
`;

const ProgressStep = styled.div`
  flex: 1;
  height: 100%;
  background-color: ${props => props.active ? '#00ff00' : (props.completed ? '#00aa00' : '#333')};
  transition: background-color 0.3s ease;
`;

const StepIndicator = styled.div`
  display: flex;
  margin-bottom: 25px;
  justify-content: space-between;
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  
  .step-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: ${props => props.active ? '#00ff00' : (props.completed ? '#00aa00' : '#333')};
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 6px;
    transition: background-color 0.3s ease;
  }
  
  .step-label {
    font-size: 0.8rem;
    color: ${props => props.active ? '#00ff00' : (props.completed ? '#00aa00' : '#999')};
    transition: color 0.3s ease;
  }
`;

const StepContent = styled.div`
  margin-bottom: 30px;
`;

const StepTitle = styled.h3`
  color: #00ff00;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
`;

const SectionTitle = styled.h4`
  color: #00ff00;
  margin: 0 0 15px 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #333;
`;

const Card = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  padding: 20px;
  margin-bottom: 15px;
`;

const InteractionItem = styled.div`
  border-bottom: 1px solid #333;
  padding: 15px 10px;
  margin-bottom: 10px;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InteractionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  .interaction-type {
    font-weight: bold;
    color: #00ff00;
  }
  
  .interaction-date {
    color: #999;
    font-size: 0.85rem;
  }
`;

const InteractionSummary = styled.div`
  padding: 12px;
  color: #eee;
  background-color: #222;
  border-radius: 4px;
  white-space: pre-wrap;
  max-height: 250px;
  overflow: auto;
  font-size: 0.95rem;
  line-height: 1.4;
`;

const DuplicatesList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin-top: 15px;
`;

const DuplicateItem = styled.div`
  border: 1px solid ${props => props.selected ? '#00ff00' : '#333'};
  border-radius: 8px;
  padding: 15px;
  background-color: ${props => props.selected ? 'rgba(0, 255, 0, 0.1)' : '#222'};
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.selected ? 'rgba(0, 255, 0, 0.15)' : '#333'};
  }
`;

const DuplicateName = styled.h4`
  margin: 0 0 8px 0;
  color: #00ff00;
  font-size: 1rem;
`;

const DuplicateDetails = styled.div`
  font-size: 0.9rem;
  color: #ccc;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SourcedField = styled.div`
  margin-bottom: 20px;
`;

const InputLabel = styled.label`
  color: #999;
  display: block;
  margin-bottom: 5px;
  font-size: 0.8rem;
`;

const Input = styled.input`
  background-color: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
  padding: 8px 10px;
  width: 100%;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const Select = styled.select`
  background-color: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
  padding: 8px 10px;
  width: 100%;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const TextArea = styled.textarea`
  background-color: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
  padding: 8px 10px;
  width: 100%;
  min-height: 100px;
  font-size: 0.9rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const ExternalSourceInfo = styled.div`
  margin-top: 8px;
  padding: 8px;
  background-color: #222;
  border-radius: 4px;
  border-left: 3px solid ${props => props.color || '#666'};
  font-size: 0.85rem;
  color: #ccc;
  
  .source-label {
    font-size: 0.7rem;
    color: ${props => props.color || '#999'};
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  
  .source-value {
    word-break: break-word;
  }
`;

const MultipleSourcesToggle = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 0.8rem;
  padding: 0;
  margin-top: 5px;
  text-decoration: underline;
  cursor: pointer;
  
  &:hover {
    color: #00ff00;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const Tag = styled.div`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 5px;
  
  .remove {
    cursor: pointer;
    &:hover {
      color: #ff5555;
    }
  }
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 30px;
  color: #999;
  font-style: italic;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #00ff00;
  color: #000;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: #00cc00;
  }
`;

const DangerButton = styled(Button)`
  background-color: #ff5555;
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: #ff3333;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: transparent;
  color: #ccc;
  border: 1px solid #555;
  
  &:hover:not(:disabled) {
    background-color: #333;
  }
`;

const WarningButton = styled(Button)`
  background-color: #ff9900;
  color: #000;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: #ff8800;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
`;

const Badge = styled.span`
  display: inline-block;
  background-color: ${props => props.bg || '#222'};
  color: ${props => props.color || '#00ff00'};
  border: 1px solid ${props => props.borderColor || '#00ff00'};
  padding: 2px 6px;
  margin-right: 3px;
  border-radius: 4px;
  font-size: 11px;
`;

const SourceToggles = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const SourceToggle = styled.button`
  background-color: ${props => props.active ? 'rgba(0, 255, 0, 0.2)' : '#222'};
  border: 1px solid ${props => props.active ? '#00ff00' : '#444'};
  color: ${props => props.active ? '#00ff00' : '#999'};
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.active ? 'rgba(0, 255, 0, 0.3)' : '#333'};
  }
`;

const AddToCrmWorkflowModal = ({ 
  isOpen, 
  onClose, 
  contact, 
  onComplete 
}) => {
  // Workflow state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Step 1: Relevance confirmation
  const [interactions, setInteractions] = useState([]);
  
  // Step 2: Duplicate check
  const [duplicates, setDuplicates] = useState([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  // Step 3 & 4: Contact enrichment
  const [formData, setFormData] = useState({
    keepInTouch: null,
    category: null,
    notes: '',
    city: null,
    tags: [],
    mobile: '',
    email: '',
    linkedIn: '',
    company: null,
    dealInfo: ''
  });
  
  // Mock data for external source information
  const [externalSources, setExternalSources] = useState({
    hubspot: {
      email: '',
      mobile: '',
      company: null,
      tags: [],
      notes: ''
    },
    supabase: {
      email: '',
      mobile: '',
      company: null,
      tags: [],
      notes: ''
    },
    airtable: {
      email: '',
      mobile: '',
      company: null,
      tags: [],
      notes: ''
    }
  });
  
  const [showSources, setShowSources] = useState({
    hubspot: false,
    supabase: false,
    airtable: false
  });
  
  // Modal custom styles
  const modalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      padding: '25px',
      maxWidth: '800px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
      backgroundColor: '#121212',
      border: '1px solid #333',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
      color: '#e0e0e0',
      zIndex: 1001
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000
    }
  };
  
  // Initialize data when contact changes
  useEffect(() => {
    if (contact && isOpen) {
      initializeData();
    }
  }, [contact, isOpen]);
  
  // Initialize data for the workflow
  const initializeData = async () => {
    if (!contact) return;
    
    setLoading(true);
    setError(null);
    setCurrentStep(1);
    setSelectedDuplicate(null);
    
    try {
      // Reset form data with contact information
      setFormData({
        keepInTouch: null,
        category: null,
        notes: '',
        city: contact.cities && contact.cities.length > 0 ? contact.cities[0] : null,
        tags: contact.tags || [],
        mobile: contact.mobile || '',
        email: contact.email || '',
        linkedIn: '',
        company: contact.companies && contact.companies.length > 0 ? contact.companies[0] : null,
        dealInfo: ''
      });
      
      // Fetch recent interactions for this contact
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('interaction_id, interaction_type, direction, interaction_date, summary')
        .eq('contact_id', contact.contact_id)
        .order('interaction_date', { ascending: false })
        .limit(5);
      
      if (interactionsError) throw interactionsError;
      setInteractions(interactionsData || []);
      
      // Mock fetching external source data
      // In a real implementation, these would be API calls to HubSpot, old Supabase, etc.
      setExternalSources({
        hubspot: {
          email: contact.email || 'example@hubspot.com',
          mobile: contact.mobile || '+1234567890',
          company: contact.companies && contact.companies.length > 0 ? contact.companies[0] : null,
          tags: ['HubSpot Tag 1', 'HubSpot Tag 2'],
          notes: 'Notes from HubSpot: This contact was last active 3 months ago.'
        },
        supabase: {
          email: contact.email || 'example@oldsupabase.com',
          mobile: contact.mobile || '+1987654321',
          company: null,
          tags: ['Supabase Tag 1'],
          notes: 'Notes from old Supabase: Contact has been in database since 2021.'
        },
        airtable: {
          email: '',
          mobile: contact.mobile || '+1234509876',
          company: null,
          tags: ['Airtable Tag 1', 'Airtable Tag 2', 'Airtable Tag 3'],
          notes: 'Notes from Airtable: Contact requested follow-up.'
        }
      });
      
    } catch (err) {
      console.error('Error initializing workflow data:', err);
      setError('Failed to load contact data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle moving to the next step in the workflow
  const handleNextStep = () => {
    if (currentStep === 1) {
      // Move to duplicate check
      setCurrentStep(2);
      searchForDuplicates();
    } else if (currentStep === 2) {
      // Move to contact enrichment
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Move to professional information
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Complete the workflow
      saveToCRM();
    }
  };
  
  // Search for potential duplicates
  const searchForDuplicates = async () => {
    if (!contact) return;
    
    setLoading(true);
    try {
      // Use similar approach as in ContactIntegrity page
      // First check for exact email matches
      let emailMatches = [];
      if (contact.email) {
        const { data: emailMatches1, error: emailError1 } = await supabase
          .from('contact_emails')
          .select('contact_id')
          .eq('email', contact.email)
          .neq('contact_id', contact.contact_id);
        
        if (!emailError1 && emailMatches1 && emailMatches1.length > 0) {
          emailMatches = emailMatches1.map(m => m.contact_id);
        }
      }
      
      // Then check for exact mobile matches
      let mobileMatches = [];
      if (contact.mobile) {
        const { data: mobileMatches1, error: mobileError1 } = await supabase
          .from('contact_mobiles')
          .select('contact_id')
          .eq('mobile', contact.mobile)
          .neq('contact_id', contact.contact_id);
        
        if (!mobileError1 && mobileMatches1 && mobileMatches1.length > 0) {
          mobileMatches = mobileMatches1.map(m => m.contact_id);
        }
      }
      
      // Then check for name similarity with LOWER to ensure case-insensitive matching
      // This is similar to what's used in the integrity page
      const firstName = (contact.first_name || '').toLowerCase();
      const lastName = (contact.last_name || '').toLowerCase();
      
      let nameMatches = [];
      if (firstName || lastName) {
        const { data: nameMatches1, error: nameError1 } = await supabase
          .from('contacts')
          .select('contact_id')
          .filter('first_name', 'not.is', null)
          .filter('last_name', 'not.is', null)
          .neq('contact_id', contact.contact_id);
        
        if (!nameError1 && nameMatches1) {
          // Filter for similar names (80% similarity)
          nameMatches = nameMatches1
            .filter(c => {
              const otherFirst = (c.first_name || '').toLowerCase();
              const otherLast = (c.last_name || '').toLowerCase();
              
              // Simple similarity check - in a real implementation, 
              // you would use something like Levenshtein distance
              return (firstName && otherFirst.includes(firstName)) || 
                     (lastName && otherLast.includes(lastName)) ||
                     (firstName && otherFirst && stringSimilarity(firstName, otherFirst) > 0.8) ||
                     (lastName && otherLast && stringSimilarity(lastName, otherLast) > 0.8);
            })
            .map(c => c.contact_id);
        }
      }
      
      // Combine all potential duplicate IDs
      const allDuplicateIds = [...new Set([...emailMatches, ...mobileMatches, ...nameMatches])];
      
      // Get full contact details for all potential duplicates
      let nameResults = [];
      if (allDuplicateIds.length > 0) {
        const { data: potentialDuplicates, error: dupError } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name, email, mobile, category, last_interaction_at')
          .in('contact_id', allDuplicateIds)
          .limit(5);
        
        if (!dupError) {
          nameResults = potentialDuplicates || [];
        }
      }
      
      // Search by email if available
      let emailResults = [];
      if (contact.email) {
        const { data: results, error: emailError } = await supabase
          .from('contact_emails')
          .select('contact_id, email')
          .eq('email', contact.email)
          .neq('contact_id', contact.contact_id);
        
        if (!emailError && results && results.length > 0) {
          // Get full contact details for these matches
          const contactIds = results.map(r => r.contact_id);
          const { data: contacts, error: contactsError } = await supabase
            .from('contacts')
            .select('contact_id, first_name, last_name, email, mobile, category, last_interaction_at')
            .in('contact_id', contactIds);
            
          if (!contactsError) {
            emailResults = contacts || [];
          }
        }
      }
      
      // Search by mobile if available
      let mobileResults = [];
      if (contact.mobile) {
        const { data: results, error: mobileError } = await supabase
          .from('contact_mobiles')
          .select('contact_id, mobile')
          .eq('mobile', contact.mobile)
          .neq('contact_id', contact.contact_id);
        
        if (!mobileError && results && results.length > 0) {
          // Get full contact details for these matches
          const contactIds = results.map(r => r.contact_id);
          const { data: contacts, error: contactsError } = await supabase
            .from('contacts')
            .select('contact_id, first_name, last_name, email, mobile, category, last_interaction_at')
            .in('contact_id', contactIds);
            
          if (!contactsError) {
            mobileResults = contacts || [];
          }
        }
      }
      
      // Combine results, remove duplicates
      const allResults = [...nameResults || [], ...emailResults || [], ...mobileResults || []];
      const uniqueResults = [];
      const seenIds = new Set();
      
      allResults.forEach(contact => {
        if (!seenIds.has(contact.contact_id)) {
          seenIds.add(contact.contact_id);
          uniqueResults.push(contact);
        }
      });
      
      setDuplicates(uniqueResults);
    } catch (err) {
      console.error('Error searching for duplicates:', err);
      setError('Failed to search for duplicates. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle selecting a duplicate contact
  const handleSelectDuplicate = (duplicate) => {
    setSelectedDuplicate(selectedDuplicate?.contact_id === duplicate.contact_id ? null : duplicate);
  };
  
  // Handle merging with selected duplicate
  const handleMergeWithDuplicate = async () => {
    if (!contact || !selectedDuplicate) return;
    
    setLoading(true);
    try {
      // Create a duplicate record
      const { error: duplicateError } = await supabase
        .from('contact_duplicates')
        .insert([{
          primary_contact_id: selectedDuplicate.contact_id,
          duplicate_contact_id: contact.contact_id,
          status: 'pending',
          detected_at: new Date().toISOString(),
          notes: 'Detected during inbox processing'
        }]);
      
      if (duplicateError) throw duplicateError;
      
      // Mark original contact as merged
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ category: 'Merged' })
        .eq('contact_id', contact.contact_id);
        
      if (updateError) throw updateError;
      
      // Close modal and notify parent
      onComplete('merged', contact.contact_id);
      closeModal();
      
      // Show success message
      toast.success('Contact marked as duplicate and will be merged');
    } catch (err) {
      console.error('Error merging contacts:', err);
      setError(`Failed to merge contacts: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // Handle marking as spam or skip
  const handleCategorize = async (category) => {
    if (!contact) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ category: category })
        .eq('contact_id', contact.contact_id);
        
      if (error) throw error;
      
      // If spam, optionally add to spam list
      if (category === 'Spam' && contact.email) {
        try {
          await supabase
            .from('emails_spam')
            .insert([{ 
              email: contact.email,
              counter: 1
            }]);
        } catch (spamErr) {
          console.error('Error adding to spam list:', spamErr);
        }
      }
      
      // Close modal and notify parent
      onComplete(category.toLowerCase(), contact.contact_id);
      closeModal();
      
      // Show success message
      toast.success(`Contact marked as ${category}`);
    } catch (err) {
      console.error(`Error marking contact as ${category}:`, err);
      setError(`Failed to mark contact as ${category}: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle form submission and save to CRM
  const saveToCRM = async () => {
    if (!contact) return;
    
    setLoading(true);
    try {
      // 1. Update contact basic info
      const { error: contactError } = await supabase
        .from('contacts')
        .update({ 
          category: formData.category || null,
          linkedin_url: formData.linkedIn || null,
          notes: formData.notes || null,
          keep_in_touch_frequency: formData.keepInTouch || null
        })
        .eq('contact_id', contact.contact_id);
        
      if (contactError) throw contactError;
      
      // 2. Update mobile if changed
      if (formData.mobile && formData.mobile !== contact.mobile) {
        // Check if mobile exists
        const { data: existingMobile } = await supabase
          .from('contact_mobiles')
          .select('mobile_id')
          .eq('contact_id', contact.contact_id)
          .eq('is_primary', true);
          
        if (existingMobile && existingMobile.length > 0) {
          // Update existing primary mobile
          await supabase
            .from('contact_mobiles')
            .update({ mobile: formData.mobile })
            .eq('mobile_id', existingMobile[0].mobile_id);
        } else {
          // Insert new primary mobile
          await supabase
            .from('contact_mobiles')
            .insert([{
              contact_id: contact.contact_id,
              mobile: formData.mobile,
              is_primary: true
            }]);
        }
      }
      
      // 3. Update email if changed
      if (formData.email && formData.email !== contact.email) {
        // Check if email exists
        const { data: existingEmail } = await supabase
          .from('contact_emails')
          .select('email_id')
          .eq('contact_id', contact.contact_id)
          .eq('is_primary', true);
          
        if (existingEmail && existingEmail.length > 0) {
          // Update existing primary email
          await supabase
            .from('contact_emails')
            .update({ email: formData.email })
            .eq('email_id', existingEmail[0].email_id);
        } else {
          // Insert new primary email
          await supabase
            .from('contact_emails')
            .insert([{
              contact_id: contact.contact_id,
              email: formData.email,
              is_primary: true
            }]);
        }
      }
      
      // 4. Update city if selected
      if (formData.city && (!contact.cities || !contact.cities.some(c => c.id === formData.city.id))) {
        // First check if relation already exists
        const { data: existingCity } = await supabase
          .from('contact_cities')
          .select('entry_id')
          .eq('contact_id', contact.contact_id)
          .eq('city_id', formData.city.id);
          
        if (!existingCity || existingCity.length === 0) {
          // Add city relation
          await supabase
            .from('contact_cities')
            .insert([{
              contact_id: contact.contact_id,
              city_id: formData.city.id
            }]);
        }
      }
      
      // 5. Update tags
      if (formData.tags && formData.tags.length > 0) {
        // Get current tags
        const { data: currentTags } = await supabase
          .from('contact_tags')
          .select('entry_id, tag_id')
          .eq('contact_id', contact.contact_id);
          
        // Find tags to add
        const currentTagIds = (currentTags || []).map(t => t.tag_id);
        const tagsToAdd = formData.tags
          .filter(t => !currentTagIds.includes(t.id))
          .map(t => ({
            contact_id: contact.contact_id,
            tag_id: t.id
          }));
          
        // Add new tags
        if (tagsToAdd.length > 0) {
          await supabase
            .from('contact_tags')
            .insert(tagsToAdd);
        }
      }
      
      // 6. Update company if selected
      if (formData.company) {
        // First check if relation already exists
        const { data: existingCompany } = await supabase
          .from('contact_companies')
          .select('contact_companies_id')
          .eq('contact_id', contact.contact_id)
          .eq('company_id', formData.company.id);
          
        if (!existingCompany || existingCompany.length === 0) {
          // Add company relation
          await supabase
            .from('contact_companies')
            .insert([{
              contact_id: contact.contact_id,
              company_id: formData.company.id
            }]);
        }
      }
      
      // 7. Add note if provided
      if (formData.notes && formData.notes.trim() !== '') {
        // Create a new note
        const { data: noteData, error: noteError } = await supabase
          .from('notes')
          .insert([{
            note_text: formData.notes,
            created_at: new Date().toISOString()
          }])
          .select('note_id');
          
        if (noteError) throw noteError;
        
        if (noteData && noteData.length > 0) {
          // Link note to contact
          await supabase
            .from('notes_contacts')
            .insert([{
              note_id: noteData[0].note_id,
              contact_id: contact.contact_id
            }]);
        }
      }
      
      // Finally, update category to null (remove from inbox)
      const { error: categoryError } = await supabase
        .from('contacts')
        .update({ category: null })
        .eq('contact_id', contact.contact_id);
        
      if (categoryError) throw categoryError;
      
      // Close modal and notify parent
      onComplete('added', contact.contact_id);
      closeModal();
      
      // Show success message
      toast.success('Contact successfully added to CRM');
    } catch (err) {
      console.error('Error saving contact to CRM:', err);
      setError(`Failed to save contact to CRM: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // Handle closing the modal
  const closeModal = () => {
    // Reset state
    setCurrentStep(1);
    setInteractions([]);
    setDuplicates([]);
    setSelectedDuplicate(null);
    setError(null);
    setLoading(false);
    
    // Call the parent's onClose
    onClose();
  };
  
  // Toggle showing external source data
  const toggleSource = (source) => {
    setShowSources(prev => ({
      ...prev,
      [source]: !prev[source]
    }));
  };
  
  return (
    <>
      <DuplicateProcessingModal 
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        primaryContactId={selectedDuplicate?.contact_id}
        duplicateContactId={contact?.contact_id}
        onComplete={(action, contactId) => {
          setShowDuplicateModal(false);
          if (action === 'merged') {
            onComplete('merged', contactId);
            closeModal();
          }
        }}
      />
      
      <Modal
        isOpen={isOpen}
        onRequestClose={loading ? null : closeModal}
        shouldCloseOnOverlayClick={!loading}
        style={modalStyles}
        contentLabel="Add to CRM Workflow"
      >
      <ModalHeader>
        <h2>Add Contact to CRM</h2>
        <CloseButton onClick={closeModal} disabled={loading}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      {/* Progress indicator */}
      <StepIndicator>
        <Step active={currentStep === 1} completed={currentStep > 1}>
          <div className="step-number">1</div>
          <div className="step-label">Relevance</div>
        </Step>
        <Step active={currentStep === 2} completed={currentStep > 2}>
          <div className="step-number">2</div>
          <div className="step-label">Duplicates</div>
        </Step>
        <Step active={currentStep === 3} completed={currentStep > 3}>
          <div className="step-number">3</div>
          <div className="step-label">Enrichment</div>
        </Step>
        <Step active={currentStep === 4} completed={currentStep > 4}>
          <div className="step-number">4</div>
          <div className="step-label">Professional</div>
        </Step>
      </StepIndicator>
      
      <ProgressBar>
        <ProgressStep active={currentStep === 1} completed={currentStep > 1} />
        <ProgressStep active={currentStep === 2} completed={currentStep > 2} />
        <ProgressStep active={currentStep === 3} completed={currentStep > 3} />
        <ProgressStep active={currentStep === 4} completed={currentStep > 4} />
      </ProgressBar>
      
      {error && (
        <div style={{ 
          backgroundColor: 'rgba(255, 70, 70, 0.2)', 
          color: '#ff9999', 
          padding: '10px 15px',
          borderRadius: '4px',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FiAlertTriangle />
          <div>{error}</div>
        </div>
      )}
      
      {loading ? (
        <LoadingContainer>
          <div style={{ color: '#00ff00', marginBottom: '10px' }}>Loading...</div>
        </LoadingContainer>
      ) : (
        <>
          {/* Step 1: Relevance Confirmation */}
          {currentStep === 1 && (
            <StepContent>
              <StepTitle>
                <FiMessageSquare /> Confirm Contact Relevance
              </StepTitle>
              
              {contact && (
                <Card>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                      {contact.first_name} {contact.last_name}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.9rem', color: '#ccc' }}>
                      {contact.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FiMail size={14} />
                          {contact.email}
                        </div>
                      )}
                      {contact.mobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FiPhone size={14} />
                          {contact.mobile}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
              
              <Card>
                <SectionTitle>
                  <FiMessageSquare /> Recent Interactions
                </SectionTitle>
                
                {interactions.length === 0 ? (
                  <NoDataMessage>
                    No recent interactions found for this contact
                  </NoDataMessage>
                ) : (
                  <>
                    {interactions.map(interaction => (
                      <InteractionItem key={interaction.interaction_id}>
                        <InteractionHeader>
                          <div className="interaction-type">
                            {interaction.interaction_type} ({interaction.direction})
                          </div>
                          <div className="interaction-date">
                            {new Date(interaction.interaction_date).toLocaleString()}
                          </div>
                        </InteractionHeader>
                        <InteractionSummary>
                          {interaction.summary || 'No summary available'}
                        </InteractionSummary>
                      </InteractionItem>
                    ))}
                  </>
                )}
              </Card>
              
              <ButtonGroup>
                <div>
                  <DangerButton onClick={() => handleCategorize('Spam')} disabled={loading}>
                    <FiTrash2 /> Spam
                  </DangerButton>
                  <WarningButton 
                    onClick={() => handleCategorize('Skip')} 
                    disabled={loading}
                    style={{ marginLeft: '10px' }}
                  >
                    <FiX /> Skip
                  </WarningButton>
                </div>
                <PrimaryButton onClick={handleNextStep} disabled={loading}>
                  Next <FiArrowRight />
                </PrimaryButton>
              </ButtonGroup>
            </StepContent>
          )}
          
          {/* Step 2: Duplicate Check */}
          {currentStep === 2 && (
            <StepContent>
              <StepTitle>
                <FiGitMerge /> Check for Duplicates
              </StepTitle>
              
              <Card>
                {duplicates.length === 0 ? (
                  <NoDataMessage>
                    No potential duplicates found for this contact
                  </NoDataMessage>
                ) : (
                  <>
                    <div style={{ marginBottom: '15px' }}>
                      We found {duplicates.length} potential duplicate contacts. 
                      Select a duplicate to merge with, or continue with this as a new contact.
                    </div>
                    
                    <DuplicatesList>
                      {duplicates.map(duplicate => (
                        <DuplicateItem 
                          key={duplicate.contact_id} 
                          selected={selectedDuplicate?.contact_id === duplicate.contact_id}
                          onClick={() => handleSelectDuplicate(duplicate)}
                        >
                          <DuplicateName>
                            {duplicate.first_name} {duplicate.last_name}
                          </DuplicateName>
                          <DuplicateDetails>
                            {duplicate.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FiMail size={14} />
                                {duplicate.email}
                              </div>
                            )}
                            {duplicate.mobile && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FiPhone size={14} />
                                {duplicate.mobile}
                              </div>
                            )}
                            {duplicate.category && <Badge>{duplicate.category}</Badge>}
                            {duplicate.last_interaction_at && 
                              <div>Last interaction: {new Date(duplicate.last_interaction_at).toLocaleDateString()}</div>
                            }
                          </DuplicateDetails>
                        </DuplicateItem>
                      ))}
                    </DuplicatesList>
                  </>
                )}
              </Card>
              
              <ButtonGroup>
                <div>
                  <SecondaryButton onClick={() => setCurrentStep(1)} disabled={loading}>
                    Back
                  </SecondaryButton>
                </div>
                <div>
                  {selectedDuplicate && (
                    <Button 
                      style={{ 
                        backgroundColor: '#ff9900', 
                        color: 'black',
                        border: 'none',
                        marginRight: '10px'
                      }} 
                      onClick={() => setShowDuplicateModal(true)} 
                      disabled={loading}
                    >
                      <FiGitMerge /> Process Duplicate
                    </Button>
                  )}
                  <PrimaryButton onClick={handleNextStep} disabled={loading}>
                    Continue as New <FiArrowRight />
                  </PrimaryButton>
                </div>
              </ButtonGroup>
            </StepContent>
          )}
          
          {/* Step 3: Contact Enrichment */}
          {currentStep === 3 && (
            <StepContent>
              <StepTitle>
                <FiInfo /> Contact Enrichment
              </StepTitle>
              
              <SourceToggles>
                <SourceToggle 
                  active={showSources.hubspot} 
                  onClick={() => toggleSource('hubspot')}
                >
                  HubSpot
                </SourceToggle>
                <SourceToggle 
                  active={showSources.supabase} 
                  onClick={() => toggleSource('supabase')}
                >
                  Old Supabase
                </SourceToggle>
                <SourceToggle 
                  active={showSources.airtable} 
                  onClick={() => toggleSource('airtable')}
                >
                  Airtable
                </SourceToggle>
              </SourceToggles>
              
              <FormGrid>
                {/* Left column */}
                <div>
                  <Card>
                    <SectionTitle>
                      <FiCalendar /> Keep in Touch Frequency
                    </SectionTitle>
                    
                    <FormGroup>
                      <Select 
                        value={formData.keepInTouch || ''}
                        onChange={(e) => handleInputChange('keepInTouch', e.target.value === '' ? null : e.target.value)}
                      >
                        <option value="">None</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="biannually">Bi-Annually</option>
                        <option value="annually">Annually</option>
                      </Select>
                      
                      {showSources.hubspot && externalSources.hubspot.keepInTouch && (
                        <ExternalSourceInfo color="#ff7a59">
                          <div className="source-label">HubSpot</div>
                          <div className="source-value">{externalSources.hubspot.keepInTouch}</div>
                        </ExternalSourceInfo>
                      )}
                      
                      {showSources.airtable && externalSources.airtable.keepInTouch && (
                        <ExternalSourceInfo color="#2d7ff9">
                          <div className="source-label">Airtable</div>
                          <div className="source-value">{externalSources.airtable.keepInTouch}</div>
                        </ExternalSourceInfo>
                      )}
                    </FormGroup>
                  </Card>
                  
                  <Card>
                    <SectionTitle>
                      <FiTag /> Category
                    </SectionTitle>
                    
                    <FormGroup>
                      <Select 
                        value={formData.category || ''}
                        onChange={(e) => handleInputChange('category', e.target.value === '' ? null : e.target.value)}
                      >
                        <option value="">None</option>
                        <option value="Friend">Friend</option>
                        <option value="Family">Family</option>
                        <option value="Work">Work</option>
                        <option value="Business">Business</option>
                        <option value="Client">Client</option>
                        <option value="Founder">Founder</option>
                        <option value="Investor">Investor</option>
                        <option value="Portfolio">Portfolio</option>
                      </Select>
                      
                      {showSources.hubspot && externalSources.hubspot.category && (
                        <ExternalSourceInfo color="#ff7a59">
                          <div className="source-label">HubSpot</div>
                          <div className="source-value">{externalSources.hubspot.category}</div>
                        </ExternalSourceInfo>
                      )}
                    </FormGroup>
                  </Card>
                  
                  <Card>
                    <SectionTitle>
                      <FiPhone /> Mobile Number
                    </SectionTitle>
                    
                    <FormGroup>
                      <Input 
                        type="text"
                        value={formData.mobile || ''}
                        onChange={(e) => handleInputChange('mobile', e.target.value)}
                        placeholder="Enter mobile number"
                      />
                      
                      {showSources.hubspot && externalSources.hubspot.mobile && (
                        <ExternalSourceInfo color="#ff7a59">
                          <div className="source-label">HubSpot</div>
                          <div className="source-value">{externalSources.hubspot.mobile}</div>
                        </ExternalSourceInfo>
                      )}
                      
                      {showSources.supabase && externalSources.supabase.mobile && (
                        <ExternalSourceInfo color="#3ecf8e">
                          <div className="source-label">Old Supabase</div>
                          <div className="source-value">{externalSources.supabase.mobile}</div>
                        </ExternalSourceInfo>
                      )}
                      
                      {showSources.airtable && externalSources.airtable.mobile && (
                        <ExternalSourceInfo color="#2d7ff9">
                          <div className="source-label">Airtable</div>
                          <div className="source-value">{externalSources.airtable.mobile}</div>
                        </ExternalSourceInfo>
                      )}
                    </FormGroup>
                  </Card>
                  
                  <Card>
                    <SectionTitle>
                      <FiMail /> Email Address
                    </SectionTitle>
                    
                    <FormGroup>
                      <Input 
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter email address"
                      />
                      
                      {showSources.hubspot && externalSources.hubspot.email && (
                        <ExternalSourceInfo color="#ff7a59">
                          <div className="source-label">HubSpot</div>
                          <div className="source-value">{externalSources.hubspot.email}</div>
                        </ExternalSourceInfo>
                      )}
                      
                      {showSources.supabase && externalSources.supabase.email && (
                        <ExternalSourceInfo color="#3ecf8e">
                          <div className="source-label">Old Supabase</div>
                          <div className="source-value">{externalSources.supabase.email}</div>
                        </ExternalSourceInfo>
                      )}
                    </FormGroup>
                  </Card>
                </div>
                
                {/* Right column */}
                <div>
                  <Card>
                    <SectionTitle>
                      <FiMapPin /> City
                    </SectionTitle>
                    
                    <FormGroup>
                      <Select 
                        value={formData.city?.id || ''}
                        onChange={(e) => {
                          const cityId = e.target.value;
                          // This would typically fetch the city details from a list of cities
                          // Here we're just using a placeholder
                          handleInputChange('city', cityId ? { id: cityId, name: e.target.options[e.target.selectedIndex].text } : null);
                        }}
                      >
                        <option value="">Select a city</option>
                        <option value="1">New York</option>
                        <option value="2">San Francisco</option>
                        <option value="3">London</option>
                        <option value="4">Berlin</option>
                        <option value="5">Paris</option>
                        <option value="6">Tokyo</option>
                      </Select>
                    </FormGroup>
                  </Card>
                  
                  <Card>
                    <SectionTitle>
                      <FiTag /> Tags
                    </SectionTitle>
                    
                    <FormGroup>
                      <Input 
                        type="text"
                        placeholder="Type a tag and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            // Add tag
                            const newTag = { id: Date.now().toString(), name: e.target.value.trim() };
                            handleInputChange('tags', [...formData.tags, newTag]);
                            e.target.value = '';
                          }
                        }}
                      />
                      
                      <TagsContainer>
                        {formData.tags.map(tag => (
                          <Tag key={tag.id}>
                            {tag.name}
                            <FiX 
                              className="remove" 
                              size={14} 
                              onClick={() => handleInputChange('tags', formData.tags.filter(t => t.id !== tag.id))}
                            />
                          </Tag>
                        ))}
                      </TagsContainer>
                      
                      {showSources.hubspot && externalSources.hubspot.tags?.length > 0 && (
                        <ExternalSourceInfo color="#ff7a59">
                          <div className="source-label">HubSpot Tags</div>
                          <div className="source-value">
                            {externalSources.hubspot.tags.join(', ')}
                          </div>
                        </ExternalSourceInfo>
                      )}
                      
                      {showSources.airtable && externalSources.airtable.tags?.length > 0 && (
                        <ExternalSourceInfo color="#2d7ff9">
                          <div className="source-label">Airtable Tags</div>
                          <div className="source-value">
                            {externalSources.airtable.tags.join(', ')}
                          </div>
                        </ExternalSourceInfo>
                      )}
                    </FormGroup>
                  </Card>
                  
                  <Card>
                    <SectionTitle>
                      <FiMessageSquare /> Notes
                    </SectionTitle>
                    
                    <FormGroup>
                      <TextArea 
                        value={formData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Enter notes about this contact"
                      />
                      
                      {showSources.hubspot && externalSources.hubspot.notes && (
                        <ExternalSourceInfo color="#ff7a59">
                          <div className="source-label">HubSpot</div>
                          <div className="source-value">{externalSources.hubspot.notes}</div>
                        </ExternalSourceInfo>
                      )}
                      
                      {showSources.supabase && externalSources.supabase.notes && (
                        <ExternalSourceInfo color="#3ecf8e">
                          <div className="source-label">Old Supabase</div>
                          <div className="source-value">{externalSources.supabase.notes}</div>
                        </ExternalSourceInfo>
                      )}
                      
                      {showSources.airtable && externalSources.airtable.notes && (
                        <ExternalSourceInfo color="#2d7ff9">
                          <div className="source-label">Airtable</div>
                          <div className="source-value">{externalSources.airtable.notes}</div>
                        </ExternalSourceInfo>
                      )}
                    </FormGroup>
                  </Card>
                </div>
              </FormGrid>
              
              <ButtonGroup>
                <SecondaryButton onClick={() => setCurrentStep(2)} disabled={loading}>
                  Back
                </SecondaryButton>
                <PrimaryButton onClick={handleNextStep} disabled={loading}>
                  Next <FiArrowRight />
                </PrimaryButton>
              </ButtonGroup>
            </StepContent>
          )}
          
          {/* Step 4: Professional Information */}
          {currentStep === 4 && (
            <StepContent>
              <StepTitle>
                <FiBriefcase /> Professional Information
              </StepTitle>
              
              <Card>
                <SectionTitle>
                  <FiLink /> LinkedIn Profile
                </SectionTitle>
                
                <FormGroup>
                  <Input 
                    type="text"
                    value={formData.linkedIn || ''}
                    onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                    placeholder="Enter LinkedIn URL"
                  />
                  
                  {showSources.hubspot && externalSources.hubspot.linkedIn && (
                    <ExternalSourceInfo color="#ff7a59">
                      <div className="source-label">HubSpot</div>
                      <div className="source-value">{externalSources.hubspot.linkedIn}</div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
              </Card>
              
              <Card>
                <SectionTitle>
                  <FiBriefcase /> Company Association
                </SectionTitle>
                
                <FormGroup>
                  <Select 
                    value={formData.company?.id || ''}
                    onChange={(e) => {
                      const companyId = e.target.value;
                      // This would typically fetch the company details from a list of companies
                      handleInputChange('company', companyId ? { 
                        id: companyId, 
                        name: e.target.options[e.target.selectedIndex].text 
                      } : null);
                    }}
                  >
                    <option value="">Select a company</option>
                    <option value="1">Acme Corp</option>
                    <option value="2">Stark Industries</option>
                    <option value="3">Wayne Enterprises</option>
                    <option value="4">Hooli</option>
                    <option value="5">Pied Piper</option>
                  </Select>
                  
                  {showSources.hubspot && externalSources.hubspot.company && (
                    <ExternalSourceInfo color="#ff7a59">
                      <div className="source-label">HubSpot</div>
                      <div className="source-value">{externalSources.hubspot.company.name}</div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
              </Card>
              
              <Card>
                <SectionTitle>
                  <FiBriefcase /> Deal Information
                </SectionTitle>
                
                <FormGroup>
                  <TextArea 
                    value={formData.dealInfo || ''}
                    onChange={(e) => handleInputChange('dealInfo', e.target.value)}
                    placeholder="Enter any deal-related information"
                  />
                </FormGroup>
              </Card>
              
              <ButtonGroup>
                <SecondaryButton onClick={() => setCurrentStep(3)} disabled={loading}>
                  Back
                </SecondaryButton>
                <PrimaryButton onClick={saveToCRM} disabled={loading}>
                  <FiCheck /> Add to CRM
                </PrimaryButton>
              </ButtonGroup>
            </StepContent>
          )}
        </>
      )}
    </Modal>
    </>
  );
};

export default AddToCrmWorkflowModal;