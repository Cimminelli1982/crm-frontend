import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { 
  FiX, 
  FiCheck, 
  FiTrash2, 
  FiArrowRight,
  FiArrowLeft, 
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
  FiInfo,
  FiHome,
  FiChevronRight,
  FiSearch
} from 'react-icons/fi';

// Styled components
const Container = styled.div`
  padding: 0 0 0 20px;
  max-width: 1200px;
  margin: 0;
`;

const Header = styled.div`
  display: none;
`;

const Title = styled.h1`
  display: none;
`;

const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 0.9rem;
  color: #999;
`;

const Crumb = styled.div`
  display: flex;
  align-items: center;
  margin-right: 5px;
  
  a {
    color: ${props => props.active ? '#00ff00' : '#999'};
    text-decoration: none;
    padding: 5px 8px;
    border-radius: 4px;
    cursor: ${props => props.active ? 'default' : 'pointer'};
    font-weight: ${props => props.active ? 'bold' : 'normal'};
    
    &:hover {
      color: ${props => props.active ? '#00ff00' : '#ccc'};
      background-color: ${props => props.active ? 'transparent' : '#333'};
    }
  }
`;

const ProgressBar = styled.div`
  display: flex;
  margin: 10px 0;
  border-radius: 4px;
  overflow: hidden;
  background-color: #1a1a1a;
  height: 4px;
`;

const ProgressStep = styled.div`
  flex: 1;
  height: 100%;
  background-color: ${props => props.active ? '#00ff00' : (props.completed ? '#00aa00' : '#333')};
  transition: background-color 0.3s ease;
`;

const StepIndicator = styled.div`
  display: flex;
  margin-bottom: 15px;
  justify-content: space-between;
  border-bottom: 1px solid #333;
  padding-bottom: 8px;
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  padding: 0 5px;
  
  &:hover .step-number {
    background-color: ${props => props.clickable && !props.active ? '#444' : props.active ? '#00ff00' : (props.completed ? '#00aa00' : '#333')};
  }
  
  &:hover .step-label {
    color: ${props => props.clickable && !props.active ? '#ccc' : props.active ? '#00ff00' : (props.completed ? '#00aa00' : '#999')};
  }
  
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
    font-size: 12px;
    margin-right: 8px;
    transition: background-color 0.3s ease;
    flex-shrink: 0;
  }
  
  .step-label {
    font-size: 0.8rem;
    color: ${props => props.active ? '#00ff00' : (props.completed ? '#00aa00' : '#999')};
    transition: color 0.3s ease;
    white-space: nowrap;
  }
`;

const Card = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  padding: 20px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #00ff00;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
`;

const ActionButton = styled.button`
  background-color: ${props => {
    if (props.variant === 'primary') return '#00ff00';
    if (props.variant === 'danger') return '#ff5555';
    if (props.variant === 'warning') return '#ff9900';
    return 'transparent';
  }};
  color: ${props => {
    if (props.variant === 'primary' || props.variant === 'warning') return '#000';
    if (props.variant === 'danger') return '#fff';
    return '#ccc';
  }};
  border: ${props => props.variant ? 'none' : '1px solid #555'};
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  
  &:hover {
    background-color: ${props => {
      if (props.variant === 'primary') return '#00dd00';
      if (props.variant === 'danger') return '#ff3333';
      if (props.variant === 'warning') return '#ff8800';
      return '#333';
    }};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const InteractionsLayout = styled.div`
  display: flex;
  height: 525px; /* Added 5% more (500px to 525px) */
  border: 1px solid #333;
  border-radius: 6px;
  overflow: hidden;
  background-color: #1a1a1a;
`;

const ChannelsMenu = styled.div`
  flex: 0 0 30%;
  border-right: 1px solid #333;
  background-color: #111;
  overflow-y: auto;
`;

const ChannelItem = styled.div`
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid #222;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.active ? '#222' : 'transparent'};
  
  .channel-name {
    font-weight: ${props => props.active ? 'bold' : 'normal'};
    color: ${props => {
      if (!props.active) return '#aaa';
      switch(props.channel) {
        case 'Email': return '#4a9eff';
        case 'Meeting': return '#ff9900';
        case 'Phone': return '#00ff00';
        case 'Slack': return '#9000ff';
        case 'WhatsApp': return '#25d366';
        default: return '#ccc';
      }
    }};
  }
  
  .channel-count {
    background-color: ${props => props.active ? '#333' : '#222'};
    color: ${props => props.active ? '#fff' : '#888'};
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 0.7rem;
    margin-left: auto;
  }
  
  &:hover {
    background-color: #1e1e1e;
  }
`;

const InteractionsContainer = styled.div`
  flex: 0 0 70%;
  padding: 0;
  overflow-y: auto;
  background-color: #1a1a1a;
`;

const InteractionItem = styled.div`
  padding: 15px;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InteractionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  align-items: center;
  
  .interaction-direction {
    font-size: 0.75rem;
    background-color: ${props => props.direction === 'Outbound' ? '#2d562d' : '#333'};
    color: ${props => props.direction === 'Outbound' ? '#8aff8a' : '#ccc'};
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .interaction-date {
    color: #888;
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    
    .date {
      color: #999;
    }
    
    .time {
      color: #777;
      font-size: 0.7rem;
    }
  }
`;

const InteractionSummary = styled.div`
  color: #eee;
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.5;
  background-color: ${props => props.type === 'whatsapp' ? 'transparent' : '#222'};
  padding: ${props => props.type === 'whatsapp' ? '0' : '12px'};
  border-radius: 4px;
  
  .summary-title {
    font-weight: bold;
    color: #ccc;
    margin-bottom: 5px;
    font-size: 0.8rem;
  }
`;

const WhatsAppMessage = styled.div`
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  position: relative;
  font-size: 0.9rem;
  line-height: 1.4;
  word-break: break-word;
  
  /* Messages colors */
  background-color: ${props => props.direction === 'Outbound' ? '#056162' : '#262d31'};
  color: #e5e5e5;
  
  .time {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    text-align: right;
    margin-top: 4px;
  }
`;

const WhatsAppContainer = styled.div`
  display: flex;
  width: 100%;
  padding: 4px 0;
  justify-content: ${props => props.direction === 'Outbound' ? 'flex-end' : 'flex-start'};
`;

const DuplicatesList = styled.div`
  max-height: 500px;
  overflow-y: auto;
  margin-top: 15px;
`;

const DuplicateItem = styled.div`
  border: 1px solid ${props => props.selected ? '#00ff00' : '#333'};
  border-radius: 8px;
  padding: 15px;
  background-color: ${props => props.selected ? 'rgba(0, 255, 0, 0.1)' : '#222'};
  margin-bottom: 15px;
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
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InputLabel = styled.label`
  color: #999;
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const Input = styled.input`
  background-color: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
  padding: 10px 12px;
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
  padding: 10px 12px;
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
  padding: 10px 12px;
  width: 100%;
  min-height: 120px;
  font-size: 0.9rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const ExternalSourceInfo = styled.div`
  margin-top: 10px;
  padding: 10px;
  background-color: #222;
  border-radius: 4px;
  border-left: 3px solid ${props => props.color || '#666'};
  font-size: 0.85rem;
  color: #ccc;
  
  .source-label {
    font-size: 0.75rem;
    color: ${props => props.color || '#999'};
    text-transform: uppercase;
    margin-bottom: 3px;
    font-weight: bold;
  }
  
  .source-value {
    word-break: break-word;
  }
`;

const SourceToggles = styled.div`
  display: flex;
  flex-wrap: wrap;
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

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
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

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #00ff00;
`;

const Badge = styled.span`
  display: inline-block;
  background-color: ${props => props.bg || '#222'};
  color: ${props => props.color || '#00ff00'};
  border: 1px solid ${props => props.borderColor || '#00ff00'};
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

const ContactHeader = styled.div`
  margin-bottom: 20px;
  
  h2 {
    color: #fff;
    margin: 0 0 5px 0;
    font-size: 1.5rem;
  }
  
  .contact-details {
    color: #aaa;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    font-size: 0.9rem;
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 70, 70, 0.2);
  border: 1px solid #ff4646;
  color: #ff9999;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

// Helper function for string similarity
const stringSimilarity = (str1, str2) => {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Early return for empty strings
  if (len1 === 0 || len2 === 0) return 0.0;
  
  // Return simple partial match if strings are very short
  if (len1 < 3 || len2 < 3) {
    return str1.includes(str2) || str2.includes(str1) ? 0.9 : 0.0;
  }
  
  let len = Math.max(len1, len2);
  let distance = 0;
  
  // Simple comparison for web performance
  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (str1[i] !== str2[i]) distance++;
  }
  
  // Add remaining length difference to distance
  distance += Math.abs(len1 - len2);
  
  return 1.0 - (distance / len);
};

const ContactCrmWorkflow = () => {
  const { id: contactId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const stepParam = searchParams.get('step');
  
  // State
  const [contact, setContact] = useState(null);
  const [currentStep, setCurrentStep] = useState(parseInt(stepParam) || 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Step 1: Relevance confirmation
  const [interactions, setInteractions] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('All');
  
  // Step 2: Duplicate check
  const [duplicates, setDuplicates] = useState([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState(null);
  
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
      notes: '',
      keepInTouch: null,
      category: null
    },
    supabase: {
      email: '',
      mobile: '',
      company: null,
      tags: [],
      notes: '',
      keepInTouch: null,
      category: null
    },
    airtable: {
      email: '',
      mobile: '',
      company: null,
      tags: [],
      notes: '',
      keepInTouch: null,
      category: null
    }
  });
  
  const [showSources, setShowSources] = useState({
    hubspot: false,
    supabase: false,
    airtable: false
  });
  
  // Load contact data and initialize workflow
  useEffect(() => {
    if (contactId) {
      loadContactData();
    }
  }, [contactId]);
  
  // Update URL when step changes and scroll to top left
  useEffect(() => {
    const newSearch = new URLSearchParams(location.search);
    newSearch.set('step', currentStep);
    navigate(`/contacts/workflow/${contactId}?${newSearch.toString()}`, { replace: true });
    
    // Scroll to top left of the page
    window.scrollTo(0, 0);
  }, [currentStep, contactId, navigate, location.search]);
  
  // Load contact data
  const loadContactData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load contact details - using the correct column names from schema
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          category,
          score,
          last_interaction_at,
          linkedin,
          keep_in_touch_frequency
        `)
        .eq('contact_id', contactId)
        .single();
      
      if (contactError) throw contactError;
      if (!contactData) throw new Error('Contact not found');
      
      setContact(contactData);
      
      // Initialize form data with empty email/mobile (will be loaded below)
      setFormData({
        keepInTouch: contactData.keep_in_touch_frequency,
        category: contactData.category,
        notes: '',
        city: null,
        tags: [],
        mobile: '',
        email: '',
        linkedIn: contactData.linkedin || '',
        company: null,
        dealInfo: ''
      });
      
      // Load related data in parallel
      await Promise.all([
        loadInteractions(contactData.contact_id),
        loadContactDetails(contactData.contact_id),
        loadEmailAndMobile(contactData.contact_id),
        mockExternalData(contactData)
      ]);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading contact data:', err);
      setError(`Failed to load contact data: ${err.message}`);
      setLoading(false);
    }
  };
  
  // Load all interactions for the contact
  const loadInteractions = async (contactId) => {
    try {
      // Get regular interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('interaction_id, interaction_type, direction, interaction_date, summary')
        .eq('contact_id', contactId)
        .order('interaction_date', { ascending: false });
      
      if (interactionsError) throw interactionsError;
      
      // Get all email_participants for this contact (any participant type)
      const { data: emailParticipantsData, error: emailParticipantsError } = await supabase
        .from('email_participants')
        .select('participant_id, email_id, participant_type')
        .eq('contact_id', contactId);
      
      if (emailParticipantsError) {
        console.error('Error fetching email participants:', emailParticipantsError);
      }
      
      // Prepare email interactions array
      let emailInteractions = [];
      
      // If we have email participants, get the email details
      if (emailParticipantsData && emailParticipantsData.length > 0) {
        console.log(`Found ${emailParticipantsData.length} email participants`);
        
        // Extract the email IDs
        const emailIds = emailParticipantsData.map(item => item.email_id);
        
        // Fetch the actual email data
        const { data: emailsData, error: emailsError } = await supabase
          .from('emails')
          .select('email_id, subject, body_plain, message_timestamp, direction')
          .in('email_id', emailIds);
        
        if (emailsError) {
          console.error('Error fetching emails for participants:', emailsError);
        } else if (emailsData) {
          console.log(`Found ${emailsData.length} emails`);
          
          // Create interaction objects for each email
          emailInteractions = emailsData.map(email => {
            // Find the matching participant to determine participant_type
            const participant = emailParticipantsData.find(p => p.email_id === email.email_id);
            const participantType = participant ? participant.participant_type : 'unknown';
            
            return {
              interaction_id: participant ? participant.participant_id : `email-${email.email_id}`,
              interaction_type: participantType, // Use participant_type as interaction_type
              direction: email.direction || 'received',
              interaction_date: email.message_timestamp,
              summary: `Subject: ${email.subject || 'No subject'}\n\n${email.body_plain || 'No content'}`
            };
          });
        }
      }
      
      // Combine regular interactions with email interactions
      const allInteractions = [...(interactionsData || []), ...emailInteractions];
      console.log(`Total interactions: ${allInteractions.length}`);
      setInteractions(allInteractions);
    } catch (err) {
      console.error('Error loading interactions:', err);
    }
  };
  
  // Load email and mobile data for the contact
  const loadEmailAndMobile = async (contactId) => {
    try {
      // Load primary email
      const { data: emailData, error: emailError } = await supabase
        .from('contact_emails')
        .select('email_id, email, is_primary')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false })
        .limit(1);
      
      if (!emailError && emailData && emailData.length > 0) {
        setFormData(prev => ({
          ...prev,
          email: emailData[0].email
        }));
        
        // Update contact object to include email for display
        setContact(prev => ({
          ...prev,
          email: emailData[0].email
        }));
      }
      
      // Load primary mobile
      const { data: mobileData, error: mobileError } = await supabase
        .from('contact_mobiles')
        .select('mobile_id, mobile, is_primary')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false })
        .limit(1);
      
      if (!mobileError && mobileData && mobileData.length > 0) {
        setFormData(prev => ({
          ...prev,
          mobile: mobileData[0].mobile
        }));
        
        // Update contact object to include mobile for display
        setContact(prev => ({
          ...prev,
          mobile: mobileData[0].mobile
        }));
      }
    } catch (err) {
      console.error('Error loading email and mobile data:', err);
    }
  };
  
  // Load contact details (tags, companies, cities)
  const loadContactDetails = async (contactId) => {
    try {
      // Load tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('contact_tags')
        .select(`
          entry_id,
          tag_id,
          tags:tag_id(tag_id, name)
        `)
        .eq('contact_id', contactId);
      
      if (!tagsError && tagsData) {
        const tags = tagsData.map(t => ({
          id: t.tags.tag_id,
          name: t.tags.name
        })).filter(t => t.id && t.name);
        
        setFormData(prev => ({
          ...prev,
          tags
        }));
      }
      
      // Load cities
      const { data: citiesData, error: citiesError } = await supabase
        .from('contact_cities')
        .select(`
          entry_id,
          city_id,
          cities:city_id(city_id, name)
        `)
        .eq('contact_id', contactId);
      
      if (!citiesError && citiesData && citiesData.length > 0) {
        const city = {
          id: citiesData[0].cities.city_id,
          name: citiesData[0].cities.name
        };
        
        setFormData(prev => ({
          ...prev,
          city
        }));
      }
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          company_id,
          companies:company_id(company_id, name, website)
        `)
        .eq('contact_id', contactId);
      
      if (!companiesError && companiesData && companiesData.length > 0) {
        const company = {
          id: companiesData[0].companies.company_id,
          name: companiesData[0].companies.name,
          website: companiesData[0].companies.website
        };
        
        setFormData(prev => ({
          ...prev,
          company
        }));
      }
    } catch (err) {
      console.error('Error loading contact details:', err);
    }
  };
  
  // Mock external data sources (in a real app, these would be API calls)
  const mockExternalData = async (contactData) => {
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setExternalSources({
      hubspot: {
        email: contactData.email || 'hubspot_email@example.com',
        mobile: contactData.mobile || '+1234567890',
        company: { id: 'hs1', name: 'HubSpot Company', website: 'https://example.com' },
        tags: ['HubSpot Tag 1', 'HubSpot Tag 2'],
        notes: 'Notes from HubSpot: This contact was last active 3 months ago.',
        keepInTouch: 'monthly',
        category: 'Client'
      },
      supabase: {
        email: contactData.email || 'supabase_email@example.com',
        mobile: contactData.mobile ? contactData.mobile.replace('123', '456') : '+9876543210',
        company: null,
        tags: ['Supabase Tag 1'],
        notes: 'Notes from old Supabase: Contact has been in database since 2021.',
        keepInTouch: 'quarterly',
        category: 'Lead'
      },
      airtable: {
        email: '',
        mobile: contactData.mobile ? contactData.mobile.replace('123', '789') : '+1122334455',
        company: { id: 'at1', name: 'Airtable Company', website: 'https://airtable-example.com' },
        tags: ['Airtable Tag 1', 'Airtable Tag 2', 'Airtable Tag 3'],
        notes: 'Notes from Airtable: Contact requested follow-up.',
        keepInTouch: 'weekly',
        category: 'Investor'
      }
    });
  };
  
  // Toggle showing external source data
  const toggleSource = (source) => {
    setShowSources(prev => ({
      ...prev,
      [source]: !prev[source]
    }));
  };
  
  // Handle navigating to a specific step
  const goToStep = (step) => {
    if (step < currentStep || step === currentStep) {
      setCurrentStep(step);
    } else if (step === 2 && currentStep === 1) {
      // Going from relevance to duplicates
      setCurrentStep(2);
      searchForDuplicates();
    } else if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Calculate string similarity between two strings (from ContactIntegrity)
  const calculateStringSimilarity = (str1, str2) => {
    // Return perfect match for identical strings
    if (str1 === str2) return 1.0;
    
    // Return no match for empty strings
    if (!str1 || !str2) return 0.0;
    
    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Early return for matching strings after normalization
    if (s1 === s2) return 1.0;
    
    // For short strings, use basic matching
    if (s1.length < 3 || s2.length < 3) {
      return s1.includes(s2) || s2.includes(s1) ? 0.9 : 0;
    }
    
    // For longer strings, use Levenshtein distance calculation via stringSimilarity
    return stringSimilarity(s1, s2);
  };
  
  // Search for duplicates by name (dedicated search function)
  const searchNameDuplicates = async () => {
    if (!contact || (!contact.first_name && !contact.last_name)) {
      return [];
    }
    
    try {
      // Search by name with a broader initial filter
      let potentialMatches = [];
      
      // Build a query based on available names
      let nameQuery = supabase
        .from('contacts')
        .select('*');
      
      if (contact.first_name && contact.last_name) {
        // Get contacts with similar first OR last name for initial filtering
        nameQuery = nameQuery.or(
          `first_name.ilike.%${contact.first_name}%,last_name.ilike.%${contact.last_name}%`
        );
      } else if (contact.first_name) {
        nameQuery = nameQuery.ilike('first_name', `%${contact.first_name}%`);
      } else if (contact.last_name) {
        nameQuery = nameQuery.ilike('last_name', `%${contact.last_name}%`);
      }
      
      // Exclude the current contact
      nameQuery = nameQuery.neq('contact_id', contact.contact_id);
      
      const { data: nameData, error } = await nameQuery;
      
      if (error) throw error;
      potentialMatches = nameData || [];
      
      // Apply more precise similarity matching (80% threshold)
      const similarMatches = potentialMatches.filter(match => {
        const firstNameSimilarity = calculateStringSimilarity(
          contact.first_name || '', 
          match.first_name || ''
        );
        
        const lastNameSimilarity = calculateStringSimilarity(
          contact.last_name || '', 
          match.last_name || ''
        );
        
        // High threshold for similarity (0.8 = 80%)
        const SIMILARITY_THRESHOLD = 0.8;
        
        // Match if both names are highly similar
        if (contact.first_name && contact.last_name && match.first_name && match.last_name) {
          return firstNameSimilarity >= SIMILARITY_THRESHOLD && lastNameSimilarity >= SIMILARITY_THRESHOLD;
        }
        
        // Match if one name is very highly similar (when only one name is available)
        if ((contact.first_name && match.first_name && !contact.last_name) || 
            (!contact.first_name && contact.last_name && match.last_name)) {
          return firstNameSimilarity >= SIMILARITY_THRESHOLD || lastNameSimilarity >= SIMILARITY_THRESHOLD;
        }
        
        // If comparing mixed patterns (one has first name only, other has last name only)
        // Check if either combination has high similarity
        return firstNameSimilarity >= SIMILARITY_THRESHOLD || lastNameSimilarity >= SIMILARITY_THRESHOLD;
      });
      
      // Add a "matched on" property for display
      let matches = similarMatches.map(match => ({
        ...match,
        matched_on: 'Name similarity'
      }));
      
      // For each match, check if we need to load email and mobile fields
      for (const match of matches) {
        // Load email if not present
        if (!match.email) {
          const { data: emailData } = await supabase
            .from('contact_emails')
            .select('email')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (emailData && emailData.length > 0) {
            match.email = emailData[0].email;
          }
        }
        
        // Load mobile if not present
        if (!match.mobile) {
          const { data: mobileData } = await supabase
            .from('contact_mobiles')
            .select('mobile')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (mobileData && mobileData.length > 0) {
            match.mobile = mobileData[0].mobile;
          }
        }
      }
      
      return matches;
      
    } catch (err) {
      console.error('Error searching by name:', err);
      return [];
    }
  };
  
  // Search for duplicates by email (dedicated search function)
  const searchEmailDuplicates = async () => {
    if (!contact || !contact.email) {
      return [];
    }
    
    try {
      // Search for contacts with matching email
      const { data, error } = await supabase
        .from('contact_emails')
        .select(`
          email,
          contact_id,
          contacts (*)
        `)
        .eq('email', contact.email)
        .neq('contact_id', contact.contact_id);
      
      if (error) throw error;
      
      // Format the results
      const matches = [];
      const seenIds = new Set();
      
      if (data) {
        data.forEach(match => {
          if (match.contacts && match.contact_id && !seenIds.has(match.contact_id)) {
            seenIds.add(match.contact_id);
            matches.push({
              ...match.contacts,
              matched_on: `Email: ${match.email}`
            });
          }
        });
      }
      
      // For each match, check if we need to load email and mobile fields
      for (const match of matches) {
        // Load email if not present
        if (!match.email) {
          match.email = contact.email; // Using the matching email
        }
        
        // Load mobile if not present
        if (!match.mobile) {
          const { data: mobileData } = await supabase
            .from('contact_mobiles')
            .select('mobile')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (mobileData && mobileData.length > 0) {
            match.mobile = mobileData[0].mobile;
          }
        }
      }
      
      return matches;
      
    } catch (err) {
      console.error('Error searching by email:', err);
      return [];
    }
  };
  
  // Search for duplicates by mobile (dedicated search function)
  const searchMobileDuplicates = async () => {
    if (!contact || !contact.mobile) {
      return [];
    }
    
    try {
      // Search for contacts with matching mobile
      const { data, error } = await supabase
        .from('contact_mobiles')
        .select(`
          mobile,
          contact_id,
          contacts (*)
        `)
        .eq('mobile', contact.mobile)
        .neq('contact_id', contact.contact_id);
      
      if (error) throw error;
      
      // Format the results
      const matches = [];
      const seenIds = new Set();
      
      if (data) {
        data.forEach(match => {
          if (match.contacts && match.contact_id && !seenIds.has(match.contact_id)) {
            seenIds.add(match.contact_id);
            matches.push({
              ...match.contacts,
              matched_on: `Mobile: ${match.mobile}`
            });
          }
        });
      }
      
      // For each match, check if we need to load email and mobile fields
      for (const match of matches) {
        // Load mobile if not present
        if (!match.mobile) {
          match.mobile = contact.mobile; // Using the matching mobile
        }
        
        // Load email if not present
        if (!match.email) {
          const { data: emailData } = await supabase
            .from('contact_emails')
            .select('email')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (emailData && emailData.length > 0) {
            match.email = emailData[0].email;
          }
        }
      }
      
      return matches;
      
    } catch (err) {
      console.error('Error searching by mobile:', err);
      return [];
    }
  };

  // Search for potential duplicates - comprehensive approach from ContactIntegrity
  const searchForDuplicates = async () => {
    if (!contact) return;
    
    setDuplicates([]);
    setSelectedDuplicate(null);
    setLoading(true);
    
    try {
      // 1. Search for email matches (more exact)
      let emailMatches = [];
      if (contact.email) {
        const { data, error } = await supabase
          .from('contact_emails')
          .select(`
            email,
            contact_id,
            contacts (*)
          `)
          .eq('email', contact.email)
          .neq('contact_id', contact.contact_id);
          
        if (!error && data) {
          // Format the results
          const seenIds = new Set();
          data.forEach(match => {
            if (match.contacts && match.contact_id && !seenIds.has(match.contact_id)) {
              seenIds.add(match.contact_id);
              emailMatches.push({
                ...match.contacts,
                matched_on: `Email: ${match.email}`
              });
            }
          });
        }
      }
      
      // 2. Search for mobile matches (more exact)
      let mobileMatches = [];
      if (contact.mobile) {
        const { data, error } = await supabase
          .from('contact_mobiles')
          .select(`
            mobile,
            contact_id,
            contacts (*)
          `)
          .eq('mobile', contact.mobile)
          .neq('contact_id', contact.contact_id);
          
        if (!error && data) {
          // Format the results
          const seenIds = new Set();
          data.forEach(match => {
            if (match.contacts && match.contact_id && !seenIds.has(match.contact_id)) {
              seenIds.add(match.contact_id);
              mobileMatches.push({
                ...match.contacts,
                matched_on: `Mobile: ${match.mobile}`
              });
            }
          });
        }
      }
      
      // 3. Search by name with similarity matching
      let nameMatches = [];
      if (contact.first_name || contact.last_name) {
        // Get potential matches by name (broad search first)
        let nameQuery = supabase
          .from('contacts')
          .select('*');
        
        if (contact.first_name && contact.last_name) {
          // Search for either first or last name match
          nameQuery = nameQuery.or(
            `first_name.ilike.%${contact.first_name}%,last_name.ilike.%${contact.last_name}%`
          );
        } else if (contact.first_name) {
          nameQuery = nameQuery.ilike('first_name', `%${contact.first_name}%`);
        } else if (contact.last_name) {
          nameQuery = nameQuery.ilike('last_name', `%${contact.last_name}%`);
        }
        
        // Exclude current contact
        nameQuery = nameQuery.neq('contact_id', contact.contact_id);
        
        const { data: potentialMatches, error } = await nameQuery;
        
        if (!error && potentialMatches) {
          // Apply more precise similarity matching (80% threshold)
          const SIMILARITY_THRESHOLD = 0.8;
          
          nameMatches = potentialMatches.filter(match => {
            const firstNameSimilarity = calculateStringSimilarity(
              contact.first_name || '', 
              match.first_name || ''
            );
            
            const lastNameSimilarity = calculateStringSimilarity(
              contact.last_name || '', 
              match.last_name || ''
            );
            
            // Match if both names are similar
            if (contact.first_name && contact.last_name && match.first_name && match.last_name) {
              return firstNameSimilarity >= SIMILARITY_THRESHOLD && lastNameSimilarity >= SIMILARITY_THRESHOLD;
            }
            
            // For partial name matching
            return firstNameSimilarity >= SIMILARITY_THRESHOLD || lastNameSimilarity >= SIMILARITY_THRESHOLD;
          }).map(match => ({
            ...match,
            matched_on: 'Name similarity'
          }));
        }
      }
      
      // Combine all matches, preserving the 'matched_on' property
      const allMatches = [...emailMatches, ...mobileMatches, ...nameMatches];
      
      // Remove duplicates while preserving the original object properties
      const uniqueMatches = [];
      const seenIds = new Set();
      
      allMatches.forEach(match => {
        if (!seenIds.has(match.contact_id)) {
          seenIds.add(match.contact_id);
          uniqueMatches.push(match);
        }
      });
      
      // For each match, check if we need to load email and mobile fields
      for (const match of uniqueMatches) {
        // Load email if not present
        if (!match.email) {
          const { data: emailData } = await supabase
            .from('contact_emails')
            .select('email')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (emailData && emailData.length > 0) {
            match.email = emailData[0].email;
          }
        }
        
        // Load mobile if not present
        if (!match.mobile) {
          const { data: mobileData } = await supabase
            .from('contact_mobiles')
            .select('mobile')
            .eq('contact_id', match.contact_id)
            .eq('is_primary', true)
            .limit(1);
            
          if (mobileData && mobileData.length > 0) {
            match.mobile = mobileData[0].mobile;
          }
        }
      }
      
      // Set the final list of duplicates
      setDuplicates(uniqueMatches);
      
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
  
  // Initialize merge selections for contact merging
  const initializeMergeSelections = (duplicate) => {
    if (!duplicate) return;
    
    // Create initial merge selections with current contact as default
    const initialSelections = {
      first_name: 'current',
      last_name: 'current',
      category: 'current',
      job_role: 'current',
      linkedin: 'current',
      description: 'current',
      score: 'current',
      keep_in_touch_frequency: 'current',
      // For collections, we'll use combine by default
      emails: 'combine',
      mobiles: 'combine',
      tags: 'combine',
      cities: 'combine',
      companies: 'combine'
    };
    
    // Check if duplicate has better/more data for fields
    if (!contact.first_name && duplicate.first_name) initialSelections.first_name = 'duplicate';
    if (!contact.last_name && duplicate.last_name) initialSelections.last_name = 'duplicate';
    if (contact.category === 'Inbox' && duplicate.category !== 'Inbox') initialSelections.category = 'duplicate';
    if (!contact.job_role && duplicate.job_role) initialSelections.job_role = 'duplicate';
    if (!contact.linkedin && duplicate.linkedin) initialSelections.linkedin = 'duplicate';
    if (!contact.description && duplicate.description) initialSelections.description = 'duplicate';
    if ((contact.score === null || contact.score === undefined) && duplicate.score !== null) initialSelections.score = 'duplicate';
    if (!contact.keep_in_touch_frequency && duplicate.keep_in_touch_frequency) initialSelections.keep_in_touch_frequency = 'duplicate';
    
    return initialSelections;
  };
  
  // Handle merging with selected duplicate
  const handleMergeWithDuplicate = async () => {
    if (!contact || !selectedDuplicate) return;
    
    setLoading(true);
    try {
      // Create a complete snapshot of the duplicate contact and its related data
      const duplicateSnapshot = {
        contact: selectedDuplicate,
        // Include related data if available, use empty arrays as fallbacks
        emails: [],
        mobiles: [],
        tags: [],
        cities: [],
        companies: []
      };
      
      // First check if we need to get emails for the duplicate
      if (!selectedDuplicate.email) {
        const { data: emailData } = await supabase
          .from('contact_emails')
          .select('email_id, email, is_primary, type')
          .eq('contact_id', selectedDuplicate.contact_id);
          
        if (emailData && emailData.length > 0) {
          duplicateSnapshot.emails = emailData;
        }
      } else {
        // Create a simple entry from the existing email
        duplicateSnapshot.emails = [{
          email: selectedDuplicate.email,
          is_primary: true,
          type: 'personal'
        }];
      }
      
      // Get mobiles if needed
      if (!selectedDuplicate.mobile) {
        const { data: mobileData } = await supabase
          .from('contact_mobiles')
          .select('mobile_id, mobile, is_primary, type')
          .eq('contact_id', selectedDuplicate.contact_id);
          
        if (mobileData && mobileData.length > 0) {
          duplicateSnapshot.mobiles = mobileData;
        }
      } else {
        // Create a simple entry from the existing mobile
        duplicateSnapshot.mobiles = [{
          mobile: selectedDuplicate.mobile,
          is_primary: true,
          type: 'personal'
        }];
      }
      
      // Get tags, cities, and companies for the duplicate
      const [tagsResult, citiesResult, companiesResult] = await Promise.all([
        // Get tags
        supabase
          .from('contact_tags')
          .select('tags:tag_id(tag_id, name)')
          .eq('contact_id', selectedDuplicate.contact_id),
          
        // Get cities
        supabase
          .from('contact_cities')
          .select('cities:city_id(city_id, name, country)')
          .eq('contact_id', selectedDuplicate.contact_id),
          
        // Get companies
        supabase
          .from('contact_companies')
          .select('companies:company_id(company_id, name, website), relationship, is_primary')
          .eq('contact_id', selectedDuplicate.contact_id)
      ]);
      
      // Process results into the snapshot
      if (tagsResult.data) {
        duplicateSnapshot.tags = tagsResult.data.map(t => t.tags).filter(Boolean);
      }
      
      if (citiesResult.data) {
        duplicateSnapshot.cities = citiesResult.data.map(c => c.cities).filter(Boolean);
      }
      
      if (companiesResult.data) {
        duplicateSnapshot.companies = companiesResult.data;
      }
      
      // Initialize merge selections
      const mergeSelections = initializeMergeSelections(selectedDuplicate);
      
      // Get primary email/mobile for display
      const primaryEmail = duplicateSnapshot.emails.find(e => e.is_primary)?.email || 
                         duplicateSnapshot.emails[0]?.email ||
                         selectedDuplicate.email || '';
                         
      const primaryMobile = duplicateSnapshot.mobiles.find(m => m.is_primary)?.mobile || 
                          duplicateSnapshot.mobiles[0]?.mobile || 
                          selectedDuplicate.mobile || '';
      
      // Create a record in the contact_duplicates table to trigger the merge
      const { data: duplicateRecord, error: duplicateError } = await supabase
        .from('contact_duplicates')
        .insert({
          primary_contact_id: selectedDuplicate.contact_id,
          duplicate_contact_id: contact.contact_id,
          mobile_number: primaryMobile,
          email: primaryEmail,
          detected_at: new Date().toISOString(),
          status: 'pending',
          notes: 'Manually merged via Contact CRM workflow',
          merge_selections: mergeSelections,
          duplicate_data: duplicateSnapshot,
          start_trigger: true // Set trigger to start the merge process
        })
        .select()
        .single();
      
      if (duplicateError) throw duplicateError;
      
      if (!duplicateRecord) throw new Error('Failed to create merge record');
      
      // Show success message
      toast.success('Merge request submitted. The system will process it shortly.');
      
      // Check the status of the merge periodically
      const checkMergeStatus = async (duplicateId) => {
        // Wait a moment to let the database process the merge
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: statusData, error: statusError } = await supabase
          .from('contact_duplicates')
          .select('status, error_message')
          .eq('duplicate_id', duplicateId)
          .single();
          
        if (statusError) {
          console.error('Error checking merge status:', statusError);
          return;
        }
        
        if (statusData.status === 'completed') {
          toast.success('Contacts successfully merged!');
        } else if (statusData.status === 'failed') {
          toast.error(`Merge failed: ${statusData.error_message || 'Unknown error'}`);
        } else if (['pending', 'processing'].includes(statusData.status)) {
          // Still processing, check again in a few seconds (up to 5 attempts)
          setTimeout(() => checkMergeStatus(duplicateId), 2000);
        }
      };
      
      // Mark original contact as "Merged" since it will be kept as a record
      await supabase
        .from('contacts')
        .update({ category: 'Merged' })
        .eq('contact_id', contact.contact_id);
      
      // Start checking for the merge status
      checkMergeStatus(duplicateRecord.duplicate_id);
      
      // Return to inbox
      navigate('/contacts/inbox');
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
      
      // Show success message
      toast.success(`Contact marked as ${category}`);
      
      // Return to inbox
      navigate('/contacts/inbox');
    } catch (err) {
      console.error(`Error marking contact as ${category}:`, err);
      setError(`Failed to mark contact as ${category}: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // Save contact to CRM
  const saveToCRM = async () => {
    if (!contact) return;
    
    setLoading(true);
    try {
      // 1. Update contact basic info
      const { error: contactError } = await supabase
        .from('contacts')
        .update({ 
          category: formData.category || null,
          linkedin: formData.linkedIn || null,
          description: formData.notes || null, // Using description field for notes
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
      if (formData.city && formData.city.id) {
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
      if (formData.company && formData.company.id) {
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
      
      // Show success message
      toast.success('Contact successfully added to CRM');
      
      // Return to inbox
      navigate('/contacts/inbox');
    } catch (err) {
      console.error('Error saving contact to CRM:', err);
      setError(`Failed to save contact to CRM: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };
  
  // Handle cancel and return to inbox
  const handleCancel = () => {
    navigate('/inbox?source=category');
  };
  
  // Render loading state
  if (loading && !contact) {
    return (
      <Container>
        <LoadingContainer>
          <div>Loading contact data...</div>
        </LoadingContainer>
      </Container>
    );
  }
  
  // Render error state
  if (error && !contact) {
    return (
      <Container>
        <ErrorMessage>
          <FiAlertTriangle size={20} />
          <div>{error}</div>
        </ErrorMessage>
        <ActionButton onClick={handleCancel}>
          Return to Inbox
        </ActionButton>
      </Container>
    );
  }
  
  return (
    <Container>
      {/* Breadcrumbs */}
      <Breadcrumbs>
        <Crumb>
          <a onClick={() => navigate('/inbox')}>
            <FiHome />
          </a>
        </Crumb>
        <Crumb>
          <FiChevronRight />
        </Crumb>
        <Crumb>
          <a onClick={() => navigate('/inbox?source=category')}>
            Processing
          </a>
        </Crumb>
        <Crumb>
          <FiChevronRight />
        </Crumb>
        <Crumb active>
          <a>
            Add to CRM: {contact?.first_name} {contact?.last_name}
          </a>
        </Crumb>
      </Breadcrumbs>
      
      {/* Header removed */}
      
      {/* Contact info */}
      {contact && (
        <ContactHeader>
          <h2>{contact.first_name} {contact.last_name}</h2>
          <div className="contact-details">
            {contact.email && (
              <div className="detail-item">
                <FiMail /> {contact.email}
              </div>
            )}
            {contact.mobile && (
              <div className="detail-item">
                <FiPhone /> {contact.mobile}
              </div>
            )}
            {contact.category && (
              <Badge>{contact.category}</Badge>
            )}
            {contact.last_interaction_at && (
              <div className="detail-item">
                Last interaction: {new Date(contact.last_interaction_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </ContactHeader>
      )}
      
      {/* Progress indicator */}
      <StepIndicator>
        <Step 
          active={currentStep === 1} 
          completed={currentStep > 1}
          clickable={true}
          onClick={() => goToStep(1)}
        >
          <div className="step-number">1</div>
          <div className="step-label">Relevance</div>
        </Step>
        <Step 
          active={currentStep === 2} 
          completed={currentStep > 2}
          clickable={currentStep >= 2 || currentStep === 1}
          onClick={() => currentStep >= 2 || currentStep === 1 ? goToStep(2) : null}
        >
          <div className="step-number">2</div>
          <div className="step-label">Duplicates</div>
        </Step>
        <Step 
          active={currentStep === 3} 
          completed={currentStep > 3}
          clickable={currentStep >= 3 || currentStep === 2}
          onClick={() => currentStep >= 3 || currentStep === 2 ? goToStep(3) : null}
        >
          <div className="step-number">3</div>
          <div className="step-label">Enrichment</div>
        </Step>
        <Step 
          active={currentStep === 4} 
          completed={currentStep > 4}
          clickable={currentStep >= 4 || currentStep === 3}
          onClick={() => currentStep >= 4 || currentStep === 3 ? goToStep(4) : null}
        >
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
        <ErrorMessage>
          <FiAlertTriangle size={20} />
          <div>{error}</div>
        </ErrorMessage>
      )}
      
      {/* Step 1: Relevance Confirmation */}
      {currentStep === 1 && (
        <>
          <Card>
            <SectionTitle>
              <FiMessageSquare /> Recent Interactions
            </SectionTitle>
            
            {loading ? (
              <LoadingContainer style={{ minHeight: '200px' }}>
                Loading interactions...
              </LoadingContainer>
            ) : interactions.length === 0 ? (
              <NoDataMessage>
                No recent interactions found for this contact
              </NoDataMessage>
            ) : (
              <InteractionsLayout>
                {/* Channels menu */}
                <ChannelsMenu>
                  {/* All channels option */}
                  <ChannelItem 
                    active={selectedChannel === 'All'} 
                    onClick={() => setSelectedChannel('All')}
                  >
                    <FiMessageSquare size={16} />
                    <span className="channel-name">All Channels</span>
                    <span className="channel-count">{interactions.length}</span>
                  </ChannelItem>
                  
                  {/* Get unique interaction types */}
                  {[...new Set(interactions.map(i => i.interaction_type))].map(type => {
                    // Count interactions of this type
                    const count = interactions.filter(i => i.interaction_type === type).length;
                    
                    // Determine icon based on interaction type
                    let ChannelIcon = FiMessageSquare;
                    if (type === 'email') ChannelIcon = FiMail;
                    if (type === 'cc') ChannelIcon = FiMail; // Use mail icon for CC emails
                    if (type === 'phone_call' || type === 'call') ChannelIcon = FiPhone;
                    if (type === 'meeting') ChannelIcon = FiCalendar;
                    if (type === 'whatsapp') ChannelIcon = FiMessageSquare;
                    if (type === 'slack') ChannelIcon = FiMessageSquare;
                    if (type === 'sms') ChannelIcon = FiMessageSquare;
                    if (type === 'note') ChannelIcon = FiMessageSquare;
                    if (type === 'other') ChannelIcon = FiMessageSquare;
                    
                    return (
                      <ChannelItem 
                        key={type}
                        channel={type}
                        active={selectedChannel === type}
                        onClick={() => setSelectedChannel(type)}
                      >
                        <ChannelIcon size={16} />
                        <span className="channel-name">
                          {type === 'cc' ? 'Email (CC)' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                        <span className="channel-count">{count}</span>
                      </ChannelItem>
                    );
                  })}
                </ChannelsMenu>
                
                {/* Interactions list */}
                <InteractionsContainer>
                  {interactions
                    .filter(i => selectedChannel === 'All' || i.interaction_type === selectedChannel)
                    .map(interaction => {
                      // Format date/time
                      const interactionDate = new Date(interaction.interaction_date);
                      const dateFormatted = interactionDate.toLocaleDateString();
                      const timeFormatted = interactionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                      
                      return (
                        <InteractionItem key={interaction.interaction_id}>
                          <InteractionHeader direction={interaction.direction}>
                            <div className="interaction-direction">
                              {interaction.direction}
                            </div>
                            <div className="interaction-date">
                              <span className="date">{dateFormatted}</span>
                              <span className="time">{timeFormatted}</span>
                            </div>
                          </InteractionHeader>
                          {interaction.interaction_type === 'whatsapp' ? (
                            <div style={{
                              textAlign: interaction.direction === 'sent' ? 'right' : 'left', 
                              padding: '5px'
                            }}>
                              <div style={{
                                display: 'inline-block',
                                maxWidth: '70%',
                                backgroundColor: interaction.direction === 'sent' ? '#005c4b' : '#1f2c34',
                                color: 'white',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                textAlign: 'left'
                              }}>
                                {interaction.summary}
                                <div style={{fontSize: '0.7rem', color: '#aaa', textAlign: 'right'}}>{timeFormatted}</div>
                              </div>
                            </div>
                          ) : (
                            <InteractionSummary type={interaction.interaction_type}>
                              {interaction.summary || 'No summary available'}
                            </InteractionSummary>
                          )}
                        </InteractionItem>
                      );
                    })}
                </InteractionsContainer>
              </InteractionsLayout>
            )}
          </Card>
          
          <ButtonGroup>
            <div>
              <ActionButton 
                variant="danger" 
                onClick={() => handleCategorize('Spam')} 
                disabled={loading}
              >
                <FiTrash2 /> Mark as Spam
              </ActionButton>
              <ActionButton 
                variant="warning" 
                onClick={() => handleCategorize('Skip')} 
                disabled={loading}
                style={{ marginLeft: '10px' }}
              >
                <FiX /> Skip Contact
              </ActionButton>
            </div>
            <ActionButton 
              variant="primary" 
              onClick={() => goToStep(2)} 
              disabled={loading}
            >
              Continue <FiArrowRight />
            </ActionButton>
          </ButtonGroup>
        </>
      )}
      
      {/* Step 2: Duplicate Check */}
      {currentStep === 2 && (
        <>
          <Card>
            <SectionTitle>
              <FiSearch /> Find Duplicate Contacts
            </SectionTitle>
            
            <div style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
              <div>
                <h4 style={{ color: '#00ff00', margin: '0 0 8px 0', fontSize: '0.9rem' }}>By Name</h4>
                <p style={{ color: '#999', marginBottom: '10px', fontSize: '0.8rem' }}>
                  Uses 80% name similarity threshold for more precise matching
                </p>
                <ActionButton onClick={() => {
                  setDuplicates([]);
                  setSelectedDuplicate(null);
                  setLoading(true);
                  
                  searchNameDuplicates().then(results => {
                    setDuplicates(results || []);
                    setLoading(false);
                  }).catch(err => {
                    console.error('Error in name search:', err);
                    setLoading(false);
                  });
                }} disabled={loading}>
                  <FiSearch /> {loading ? 'Searching...' : 'Search by Name'}
                </ActionButton>
              </div>
              
              <div>
                <h4 style={{ color: '#00ff00', margin: '0 0 8px 0', fontSize: '0.9rem' }}>By Email</h4>
                <p style={{ color: '#999', marginBottom: '10px', fontSize: '0.8rem' }}>
                  Searches for contacts with matching email addresses
                </p>
                <ActionButton onClick={() => {
                  setDuplicates([]);
                  setSelectedDuplicate(null);
                  setLoading(true);
                  
                  searchEmailDuplicates().then(results => {
                    setDuplicates(results || []);
                    setLoading(false);
                  }).catch(err => {
                    console.error('Error in email search:', err);
                    setLoading(false);
                  });
                }} disabled={loading || !contact?.email}>
                  <FiMail /> {loading ? 'Searching...' : 'Search by Email'}
                </ActionButton>
              </div>
              
              <div>
                <h4 style={{ color: '#00ff00', margin: '0 0 8px 0', fontSize: '0.9rem' }}>By Mobile</h4>
                <p style={{ color: '#999', marginBottom: '10px', fontSize: '0.8rem' }}>
                  Searches for contacts with matching mobile numbers
                </p>
                <ActionButton onClick={() => {
                  setDuplicates([]);
                  setSelectedDuplicate(null);
                  setLoading(true);
                  
                  searchMobileDuplicates().then(results => {
                    setDuplicates(results || []);
                    setLoading(false);
                  }).catch(err => {
                    console.error('Error in mobile search:', err);
                    setLoading(false);
                  });
                }} disabled={loading || !contact?.mobile}>
                  <FiPhone /> {loading ? 'Searching...' : 'Search by Mobile'}
                </ActionButton>
              </div>
            </div>
            
            {loading ? (
              <LoadingContainer style={{ minHeight: '200px' }}>
                Searching for duplicates...
              </LoadingContainer>
            ) : duplicates.length === 0 ? (
              <NoDataMessage>
                No potential duplicates found for this contact
              </NoDataMessage>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
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
                        {duplicate.matched_on && <Badge color="#00ff00" bg="#222">{duplicate.matched_on}</Badge>}
                        {duplicate.category && <Badge>{duplicate.category}</Badge>}
                        {duplicate.last_interaction_at && 
                          <div>Last interaction: {new Date(duplicate.last_interaction_at).toLocaleDateString()}</div>
                        }
                      </DuplicateDetails>
                    </DuplicateItem>
                  ))}
                </DuplicatesList>
                
                {/* Show merge option UI when a duplicate is selected */}
                {selectedDuplicate && (
                  <Card style={{ marginTop: '20px', border: '1px solid #00ff00', backgroundColor: '#111' }}>
                    <SectionTitle style={{ color: '#00ff00' }}>
                      <FiGitMerge /> Merge Contact Data
                    </SectionTitle>
                    
                    <div style={{ marginBottom: '15px', color: '#aaa', fontSize: '0.9rem' }}>
                      This will merge the inbox contact into the selected existing contact.
                      All data from both contacts will be combined, with the existing contact
                      being kept as the primary record.
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '15px', 
                      backgroundColor: '#222', 
                      borderRadius: '6px',
                      marginBottom: '20px'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#00ff00' }}>Current Contact (Inbox)</h4>
                        <div>{contact.first_name} {contact.last_name}</div>
                        {contact.email && <div style={{ marginTop: '5px' }}><FiMail size={12} /> {contact.email}</div>}
                        {contact.mobile && <div style={{ marginTop: '5px' }}><FiPhone size={12} /> {contact.mobile}</div>}
                      </div>
                      
                      <div style={{ fontSize: '24px', display: 'flex', alignItems: 'center', color: '#00ff00' }}>
                        <FiArrowRight />
                      </div>
                      
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#00ff00' }}>Selected Contact (Existing)</h4>
                        <div>{selectedDuplicate.first_name} {selectedDuplicate.last_name}</div>
                        {selectedDuplicate.email && <div style={{ marginTop: '5px' }}><FiMail size={12} /> {selectedDuplicate.email}</div>}
                        {selectedDuplicate.mobile && <div style={{ marginTop: '5px' }}><FiPhone size={12} /> {selectedDuplicate.mobile}</div>}
                      </div>
                    </div>
                    
                    <div style={{ color: '#ffcc00', fontWeight: 'bold', marginBottom: '15px' }}>
                      <FiAlertTriangle size={16} style={{ marginRight: '8px' }} />
                      Warning: This action cannot be undone
                    </div>
                  </Card>
                )}
              </>
            )}
          </Card>
          
          <ButtonGroup>
            <ActionButton onClick={() => goToStep(1)} disabled={loading}>
              <FiArrowLeft /> Back
            </ActionButton>
            
            <div>
              {selectedDuplicate && (
                <ActionButton 
                  variant="warning" 
                  onClick={handleMergeWithDuplicate} 
                  disabled={loading}
                  style={{ marginRight: '10px' }}
                >
                  <FiGitMerge /> Merge with Selected
                </ActionButton>
              )}
              <ActionButton 
                variant="primary" 
                onClick={() => goToStep(3)} 
                disabled={loading}
              >
                Continue as New <FiArrowRight />
              </ActionButton>
            </div>
          </ButtonGroup>
        </>
      )}
      
      {/* Step 3: Contact Enrichment */}
      {currentStep === 3 && (
        <>
          <Card>
            <SectionTitle>
              <FiInfo /> Contact Enrichment
            </SectionTitle>
            
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
                <FormGroup>
                  <InputLabel>Keep in Touch Frequency</InputLabel>
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
                
                <FormGroup>
                  <InputLabel>Category</InputLabel>
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
                  
                  {showSources.supabase && externalSources.supabase.category && (
                    <ExternalSourceInfo color="#3ecf8e">
                      <div className="source-label">Old Supabase</div>
                      <div className="source-value">{externalSources.supabase.category}</div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
                
                <FormGroup>
                  <InputLabel>Mobile Number</InputLabel>
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
              </div>
              
              {/* Right column */}
              <div>
                <FormGroup>
                  <InputLabel>Email Address</InputLabel>
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
                
                <FormGroup>
                  <InputLabel>City</InputLabel>
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
                
                <FormGroup>
                  <InputLabel>Tags</InputLabel>
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
              </div>
            </FormGrid>
          </Card>
          
          <ButtonGroup>
            <ActionButton onClick={() => goToStep(2)} disabled={loading}>
              <FiArrowLeft /> Back
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={() => goToStep(4)} 
              disabled={loading}
            >
              Next <FiArrowRight />
            </ActionButton>
          </ButtonGroup>
        </>
      )}
      
      {/* Step 4: Professional Information */}
      {currentStep === 4 && (
        <>
          <Card>
            <SectionTitle>
              <FiBriefcase /> Professional Information
            </SectionTitle>
            
            <FormGrid>
              <div>
                <FormGroup>
                  <InputLabel>LinkedIn Profile</InputLabel>
                  <Input 
                    type="text"
                    value={formData.linkedIn || ''}
                    onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                    placeholder="Enter LinkedIn URL"
                  />
                </FormGroup>
                
                <FormGroup>
                  <InputLabel>Company</InputLabel>
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
                  
                  {showSources.airtable && externalSources.airtable.company && (
                    <ExternalSourceInfo color="#2d7ff9">
                      <div className="source-label">Airtable</div>
                      <div className="source-value">{externalSources.airtable.company.name}</div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
              </div>
              
              <div>
                <FormGroup>
                  <InputLabel>Notes</InputLabel>
                  <TextArea 
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter notes about this contact"
                  />
                  
                  {showSources.hubspot && externalSources.hubspot.notes && (
                    <ExternalSourceInfo color="#ff7a59">
                      <div className="source-label">HubSpot Notes</div>
                      <div className="source-value">{externalSources.hubspot.notes}</div>
                    </ExternalSourceInfo>
                  )}
                  
                  {showSources.supabase && externalSources.supabase.notes && (
                    <ExternalSourceInfo color="#3ecf8e">
                      <div className="source-label">Old Supabase Notes</div>
                      <div className="source-value">{externalSources.supabase.notes}</div>
                    </ExternalSourceInfo>
                  )}
                  
                  {showSources.airtable && externalSources.airtable.notes && (
                    <ExternalSourceInfo color="#2d7ff9">
                      <div className="source-label">Airtable Notes</div>
                      <div className="source-value">{externalSources.airtable.notes}</div>
                    </ExternalSourceInfo>
                  )}
                </FormGroup>
                
                <FormGroup>
                  <InputLabel>Deal Information</InputLabel>
                  <TextArea 
                    value={formData.dealInfo || ''}
                    onChange={(e) => handleInputChange('dealInfo', e.target.value)}
                    placeholder="Enter any deal-related information"
                  />
                </FormGroup>
              </div>
            </FormGrid>
          </Card>
          
          <ButtonGroup>
            <ActionButton onClick={() => goToStep(3)} disabled={loading}>
              <FiArrowLeft /> Back
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={saveToCRM} 
              disabled={loading}
            >
              <FiCheck /> Add to CRM
            </ActionButton>
          </ButtonGroup>
        </>
      )}
    </Container>
  );
};

export default ContactCrmWorkflow;