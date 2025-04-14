// src/pages/ContactIntegrity.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { 
  FiCheck, 
  FiX, 
  FiAlertTriangle, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiTag, 
  FiBriefcase, 
  FiSearch,
  FiPlus,
  FiTrash2,
  FiLink,
  FiSave,
  FiRefreshCw,
  FiGitMerge
} from 'react-icons/fi';

// Styled components
const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
`;

const Title = styled.h1`
  color: #00ff00;
  margin: 0;
  font-family: 'Courier New', monospace;
`;

const ActionButton = styled.button`
  background-color: #222;
  color: ${props => props.danger ? '#ff5555' : '#00ff00'};
  border: 1px solid ${props => props.danger ? '#ff5555' : '#00ff00'};
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  
  &:hover {
    background-color: #333;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  padding: 20px;
  margin-bottom: 20px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #00ff00;
  margin: 0 0 15px 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #333;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
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

const TabContainer = styled.div`
  margin-bottom: 20px;
`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 1px solid #333;
`;

const Tab = styled.div`
  padding: 10px 15px;
  cursor: pointer;
  color: ${props => props.active ? '#00ff00' : '#999'};
  border-bottom: 2px solid ${props => props.active ? '#00ff00' : 'transparent'};
  
  &:hover {
    color: ${props => props.active ? '#00ff00' : '#ddd'};
  }
`;

const TabContent = styled.div`
  display: ${props => props.active ? 'block' : 'none'};
  padding: 20px 0;
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  color: #00ff00;
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 70, 70, 0.2);
  border: 1px solid #ff4646;
  color: #ff9999;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DuplicatesList = styled.div`
  margin-bottom: 20px;
`;

const DuplicateItem = styled.div`
  padding: 12px;
  border: 1px solid #444;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: pointer;
  
  &:hover {
    background-color: #222;
  }
`;

const DuplicateName = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  color: #eee;
`;

const DuplicateDetails = styled.div`
  font-size: 0.85rem;
  color: #999;
`;

const Badge = styled.span`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 0.65rem;
  margin-right: 4px;
  white-space: nowrap;
`;

const MultipleItemContainer = styled.div`
  margin-top: 8px;
`;

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
`;

const ComparisonTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  
  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #333;
  }
  
  th {
    color: #999;
    font-weight: normal;
    font-size: 0.85rem;
  }
  
  td {
    color: #eee;
  }
  
  tr:hover td {
    background-color: #222;
  }
`;

const MergeOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: #222;
  }
`;

const MergeRadio = styled.input`
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid #00ff00;
  border-radius: 50%;
  position: relative;
  
  &:checked {
    &:after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 8px;
      height: 8px;
      background-color: #00ff00;
      border-radius: 50%;
    }
  }
`;

const ContactIntegrity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Main state
  const [contact, setContact] = useState({
    first_name: '',
    last_name: '',
    category: 'Inbox',
    job_role: '',
    linkedin: '',
    description: '',
    score: null,
    birthday: null
  });
  
  // Related data state
  const [emails, setEmails] = useState([{ email: '', type: 'personal', is_primary: false }]);
  const [mobiles, setMobiles] = useState([{ mobile: '', type: 'personal', is_primary: false }]);
  const [tags, setTags] = useState([]);
  const [cities, setCities] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState(null);
  const [mergeSelections, setMergeSelections] = useState({});
  
  // Reference data
  const [allTags, setAllTags] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  
  // Contact categories
  const categories = [
    'Inbox',
    'Lead',
    'Customer',
    'Partner',
    'Vendor',
    'Friend',
    'Family',
    'Skip',
    'To Skip',
    'WhatsApp Group Contact'
  ];
  
  // Point types
  const pointTypes = ['personal', 'work', 'other'];
  
  // Load contact data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load reference data first
        await loadReferenceData();
        
        if (id) {
          // Load existing contact
          await loadContact(id);
        } else {
          // New contact - stop loading
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
        setLoading(false);
      }
    };
    
    loadData();
  }, [id]);
  
  // Load reference data
  const loadReferenceData = async () => {
    // Get tags, cities, and companies in parallel
    const [tagsResponse, citiesResponse, companiesResponse] = await Promise.all([
      supabase.from('tags').select('*').order('name'),
      supabase.from('cities').select('*').order('name'),
      supabase.from('companies').select('*').order('name')
    ]);
    
    if (tagsResponse.error) throw tagsResponse.error;
    if (citiesResponse.error) throw citiesResponse.error;
    if (companiesResponse.error) throw companiesResponse.error;
    
    setAllTags(tagsResponse.data || []);
    setAllCities(citiesResponse.data || []);
    setAllCompanies(companiesResponse.data || []);
  };
  
  // Load contact data
  const loadContact = async (contactId) => {
    try {
      // Get basic contact info
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_id', contactId)
        .single();
        
      if (contactError) throw contactError;
      if (!contactData) throw new Error('Contact not found');
      
      setContact(contactData);
      
      // Get related data in parallel
      const [emailsResult, mobilesResult, tagsResult, citiesResult, companiesResult] = await Promise.all([
        // Get emails
        supabase
          .from('contact_emails')
          .select('*')
          .eq('contact_id', contactId)
          .order('is_primary', { ascending: false }),
          
        // Get mobiles
        supabase
          .from('contact_mobiles')
          .select('*')
          .eq('contact_id', contactId)
          .order('is_primary', { ascending: false }),
          
        // Get tags
        supabase
          .from('contact_tags')
          .select('tag_id')
          .eq('contact_id', contactId),
          
        // Get cities
        supabase
          .from('contact_cities')
          .select('city_id')
          .eq('contact_id', contactId),
          
        // Get companies
        supabase
          .from('contact_companies')
          .select('company_id, relationship, is_primary')
          .eq('contact_id', contactId)
      ]);
      
      // Ensure there's at least one empty email/mobile row
      setEmails(emailsResult.data?.length ? emailsResult.data : [{ email: '', type: 'personal', is_primary: false }]);
      setMobiles(mobilesResult.data?.length ? mobilesResult.data : [{ mobile: '', type: 'personal', is_primary: false }]);
      
      // Extract IDs from junction tables
      setTags(tagsResult.data?.map(t => t.tag_id) || []);
      setCities(citiesResult.data?.map(c => c.city_id) || []);
      setCompanies(companiesResult.data || []);
      
    } catch (err) {
      console.error('Error loading contact:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input change for basic contact info
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContact(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle email changes
  const handleEmailChange = (index, field, value) => {
    const updatedEmails = [...emails];
    updatedEmails[index] = {
      ...updatedEmails[index],
      [field]: value
    };
    setEmails(updatedEmails);
  };
  
  // Add new email row
  const addEmail = () => {
    setEmails([...emails, { email: '', type: 'personal', is_primary: false }]);
  };
  
  // Remove email row
  const removeEmail = (index) => {
    if (emails.length <= 1) return;
    setEmails(emails.filter((_, i) => i !== index));
  };
  
  // Set primary email
  const setPrimaryEmail = (index) => {
    setEmails(emails.map((email, i) => ({
      ...email,
      is_primary: i === index
    })));
  };
  
  // Handle mobile changes
  const handleMobileChange = (index, field, value) => {
    const updatedMobiles = [...mobiles];
    updatedMobiles[index] = {
      ...updatedMobiles[index],
      [field]: value
    };
    setMobiles(updatedMobiles);
  };
  
  // Add new mobile row
  const addMobile = () => {
    setMobiles([...mobiles, { mobile: '', type: 'personal', is_primary: false }]);
  };
  
  // Remove mobile row
  const removeMobile = (index) => {
    setMobiles(mobiles.filter((_, i) => i !== index));
  };
  
  // Set primary mobile
  const setPrimaryMobile = (index) => {
    setMobiles(mobiles.map((mobile, i) => ({
      ...mobile,
      is_primary: i === index
    })));
  };
  
  // Handle multi-select changes
  const handleMultiSelectChange = (e, setter) => {
    const options = e.target.options;
    const values = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    setter(values);
  };
  
  // Handle tag select change
  const handleTagChange = (e) => {
    handleMultiSelectChange(e, setTags);
  };
  
  // Handle city select change
  const handleCityChange = (e) => {
    handleMultiSelectChange(e, setCities);
  };
  
  // Handle company change
  const handleCompanyChange = (index, field, value) => {
    const updatedCompanies = [...companies];
    updatedCompanies[index] = {
      ...updatedCompanies[index],
      [field]: value
    };
    setCompanies(updatedCompanies);
  };
  
  // Add company association
  const addCompany = () => {
    setCompanies([...companies, { company_id: '', relationship: 'not_set', is_primary: false }]);
  };
  
  // Remove company association
  const removeCompany = (index) => {
    if (companies.length <= 0) return;
    setCompanies(companies.filter((_, i) => i !== index));
  };
  
  // Set primary company
  const setPrimaryCompany = (index) => {
    setCompanies(companies.map((company, i) => ({
      ...company,
      is_primary: i === index
    })));
  };
  
  // Calculate string similarity - 0 to 1 where 1 is exact match
  const calculateStringSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    
    // Convert to lowercase for comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1.0; // Exact match
    if (s1.length === 0 || s2.length === 0) return 0.0;
    
    // Levenshtein distance calculation
    const matrix = Array(s1.length + 1).fill().map(() => Array(s2.length + 1).fill(0));
    
    for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    // Convert distance to similarity score
    const maxLength = Math.max(s1.length, s2.length);
    return maxLength > 0 ? 1 - matrix[s1.length][s2.length] / maxLength : 1;
  };
  
  // Search for potential duplicates by name with high similarity threshold
  const searchNameDuplicates = async () => {
    setSearchResults([]);
    setSelectedDuplicate(null);
    
    if (!contact.first_name && !contact.last_name) {
      toast.error('Please enter a first name and/or last name to search');
      return;
    }
    
    setLoading(true);
    
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
      
      // Exclude the current contact if editing
      if (id) {
        nameQuery = nameQuery.neq('contact_id', id);
      }
      
      const { data: nameData, error } = await nameQuery;
      
      if (error) throw error;
      potentialMatches = nameData || [];
      
      // Apply more precise similarity matching (80% similarity threshold)
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
      const nameMatches = similarMatches.map(match => ({
        ...match,
        matched_on: 'Name similarity'
      }));
      
      setSearchResults(nameMatches);
      
    } catch (err) {
      console.error('Error searching by name:', err);
      toast.error('Failed to search by name');
    } finally {
      setLoading(false);
    }
  };
  
  // Search for duplicates by email
  const searchEmailDuplicates = async () => {
    setSearchResults([]);
    setSelectedDuplicate(null);
    
    // Get all emails from the contact
    const contactEmails = emails.filter(e => e.email.trim()).map(e => e.email.trim());
    
    if (contactEmails.length === 0) {
      toast.error('Please add at least one email address to search');
      return;
    }
    
    setLoading(true);
    
    try {
      // Search for all contacts with matching emails
      const promises = contactEmails.map(email => {
        return supabase
          .from('contact_emails')
          .select(`
            email,
            contact_id,
            contacts (*)
          `)
          .ilike('email', email)
          .neq('contact_id', id || '0'); // Exclude current contact
      });
      
      const results = await Promise.all(promises);
      
      // Combine and deduplicate results
      const emailMatches = [];
      const seenIds = new Set();
      
      results.forEach((result, index) => {
        if (result.data) {
          result.data.forEach(match => {
            if (match.contacts && match.contact_id && !seenIds.has(match.contact_id)) {
              seenIds.add(match.contact_id);
              emailMatches.push({
                ...match.contacts,
                matched_on: `Email: ${match.email}`
              });
            }
          });
        }
      });
      
      setSearchResults(emailMatches);
      
    } catch (err) {
      console.error('Error searching by email:', err);
      toast.error('Failed to search by email');
    } finally {
      setLoading(false);
    }
  };
  
  // Search for duplicates by mobile
  const searchMobileDuplicates = async () => {
    setSearchResults([]);
    setSelectedDuplicate(null);
    
    // Get all mobiles from the contact
    const contactMobiles = mobiles.filter(m => m.mobile.trim()).map(m => m.mobile.trim());
    
    if (contactMobiles.length === 0) {
      toast.error('Please add at least one mobile number to search');
      return;
    }
    
    setLoading(true);
    
    try {
      // Search for all contacts with matching mobiles
      const promises = contactMobiles.map(mobile => {
        return supabase
          .from('contact_mobiles')
          .select(`
            mobile,
            contact_id,
            contacts (*)
          `)
          .ilike('mobile', mobile)
          .neq('contact_id', id || '0'); // Exclude current contact
      });
      
      const results = await Promise.all(promises);
      
      // Combine and deduplicate results
      const mobileMatches = [];
      const seenIds = new Set();
      
      results.forEach((result, index) => {
        if (result.data) {
          result.data.forEach(match => {
            if (match.contacts && match.contact_id && !seenIds.has(match.contact_id)) {
              seenIds.add(match.contact_id);
              mobileMatches.push({
                ...match.contacts,
                matched_on: `Mobile: ${match.mobile}`
              });
            }
          });
        }
      });
      
      setSearchResults(mobileMatches);
      
    } catch (err) {
      console.error('Error searching by mobile:', err);
      toast.error('Failed to search by mobile');
    } finally {
      setLoading(false);
    }
  };
  
  // Select a duplicate for comparison
  const selectDuplicate = async (duplicateContact) => {
    setSelectedDuplicate(null);
    setLoading(true);
    
    try {
      // Load the full duplicate contact details
      const { data: fullContact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_id', duplicateContact.contact_id)
        .single();
        
      if (error) throw error;
      
      // Get related data in parallel
      const [emailsResult, mobilesResult, tagsResult, citiesResult, companiesResult] = await Promise.all([
        // Get emails
        supabase
          .from('contact_emails')
          .select('*')
          .eq('contact_id', duplicateContact.contact_id),
          
        // Get mobiles
        supabase
          .from('contact_mobiles')
          .select('*')
          .eq('contact_id', duplicateContact.contact_id),
          
        // Get tags
        supabase
          .from('contact_tags')
          .select('tags (*)')
          .eq('contact_id', duplicateContact.contact_id),
          
        // Get cities
        supabase
          .from('contact_cities')
          .select('cities (*)')
          .eq('contact_id', duplicateContact.contact_id),
          
        // Get companies
        supabase
          .from('contact_companies')
          .select('companies (*), relationship, is_primary')
          .eq('contact_id', duplicateContact.contact_id)
      ]);
      
      // Combine all data
      const fullDuplicate = {
        ...fullContact,
        emails: emailsResult.data || [],
        mobiles: mobilesResult.data || [],
        tags: tagsResult.data?.map(t => t.tags) || [],
        cities: citiesResult.data?.map(c => c.cities) || [],
        companies: companiesResult.data || []
      };
      
      setSelectedDuplicate(fullDuplicate);
      
      // Initialize merge selections with the current contact data as defaults
      initializeMergeSelections(fullDuplicate);
      
    } catch (err) {
      console.error('Error loading duplicate details:', err);
      toast.error('Failed to load duplicate details');
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize merge selections
  const initializeMergeSelections = (duplicate) => {
    // Create initial merge selections with current contact as default
    const initialSelections = {
      first_name: 'current',
      last_name: 'current',
      category: 'current',
      job_role: 'current',
      linkedin: 'current',
      description: 'current',
      score: 'current',
      birthday: 'current',
      keep_in_touch_frequency: 'current',
      // For collections, we'll have special handling
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
    if (!contact.birthday && duplicate.birthday) initialSelections.birthday = 'duplicate';
    if (!contact.keep_in_touch_frequency && duplicate.keep_in_touch_frequency) initialSelections.keep_in_touch_frequency = 'duplicate';
    
    setMergeSelections(initialSelections);
  };
  
  // Handle merge selection change
  const handleMergeSelectionChange = (field, value) => {
    setMergeSelections(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Merge duplicate into current contact
  const mergeContacts = async () => {
    if (!selectedDuplicate) return;
    
    setSaving(true);
    
    try {
      // Create a complete snapshot of the duplicate contact and its related data
      const duplicateSnapshot = {
        contact: selectedDuplicate,
        emails: selectedDuplicate.emails || [],
        mobiles: selectedDuplicate.mobiles || [],
        tags: selectedDuplicate.tags || [],
        cities: selectedDuplicate.cities || [],
        companies: selectedDuplicate.companies || []
      };
      
      // First primary mobile or email for the duplicate record
      const primaryMobile = selectedDuplicate.mobiles?.find(m => m.is_primary)?.mobile || 
                          selectedDuplicate.mobiles?.[0]?.mobile || 
                          '';
                          
      const primaryEmail = selectedDuplicate.emails?.find(e => e.is_primary)?.email || 
                         selectedDuplicate.emails?.[0]?.email ||
                         '';
      
      // First check if there's already a record for this pair of contacts
      const { data: existingDuplicate, error: checkError } = await supabase
        .from('contact_duplicates')
        .select('duplicate_id, status')
        .eq('primary_contact_id', id)
        .eq('duplicate_contact_id', selectedDuplicate.contact_id)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      let duplicateRecord;
      
      if (existingDuplicate) {
        // Update the existing record with new merge selections and reset status
        const { data: updatedRecord, error: updateError } = await supabase
          .from('contact_duplicates')
          .update({
            status: 'pending',
            notes: 'Manually merged via Contact Integrity page - Updated',
            merge_selections: mergeSelections,
            duplicate_data: duplicateSnapshot,
            start_trigger: true, // Set trigger to start the merge process
            detected_at: new Date().toISOString(),
            resolved_at: null,
            error_message: null
          })
          .eq('duplicate_id', existingDuplicate.duplicate_id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        duplicateRecord = updatedRecord;
        toast.success('Updated existing merge settings. The system will process it shortly.');
      } else {
        // Create a new record in the contact_duplicates table
        const { data: newRecord, error: insertError } = await supabase
          .from('contact_duplicates')
          .insert({
            duplicate_id: uuidv4(), // Generate a new UUID
            primary_contact_id: id,
            duplicate_contact_id: selectedDuplicate.contact_id,
            mobile_number: primaryMobile,
            email: primaryEmail,
            detected_at: new Date().toISOString(),
            status: 'pending',
            notes: 'Manually merged via Contact Integrity page',
            merge_selections: mergeSelections,
            duplicate_data: duplicateSnapshot,
            start_trigger: true // Set trigger to start the merge process
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        duplicateRecord = newRecord;
        toast.success('Merge request submitted. The system will process it shortly.');
      }
      
      if (!duplicateRecord) throw new Error('Failed to create or update merge record');
      
      // Only show one success message (we already showed one above based on whether it's new or updated)
      
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
          // Refresh the contact data if we're still on this page
          if (id) {
            loadContact(id);
          }
        } else if (statusData.status === 'failed') {
          toast.error(`Merge failed: ${statusData.error_message || 'Unknown error'}`);
        } else if (['pending', 'processing'].includes(statusData.status)) {
          // Still processing, check again in a few seconds (up to 5 attempts)
          setTimeout(() => checkMergeStatus(duplicateId), 2000);
        }
      };
      
      // Start checking for the merge status
      checkMergeStatus(duplicateRecord.duplicate_id);
      
      // Clear the UI state
      setSelectedDuplicate(null);
      setSearchResults([]);
      
    } catch (err) {
      console.error('Error initiating merge:', err);
      toast.error('Failed to initiate merge: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };
  
  // Save contact
  // Save basic contact information
  const saveBasicInfo = async () => {
    // Validate required fields
    if (!contact.first_name && !contact.last_name) {
      toast.error('Please enter a first or last name');
      return;
    }
    
    setSaving(true);
    
    try {
      let contactId = id;
      
      // Insert or update contact
      if (id) {
        // Update existing contact
        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            first_name: contact.first_name,
            last_name: contact.last_name,
            category: contact.category,
            job_role: contact.job_role,
            linkedin: contact.linkedin,
            description: contact.description,
            score: contact.score,
            birthday: contact.birthday,
            keep_in_touch_frequency: contact.keep_in_touch_frequency,
            last_modified_at: new Date().toISOString()
          })
          .eq('contact_id', id);
          
        if (updateError) throw updateError;
        
        toast.success('Basic information updated successfully');
      } else {
        // Insert new contact
        const { data: insertData, error: insertError } = await supabase
          .from('contacts')
          .insert({
            first_name: contact.first_name,
            last_name: contact.last_name,
            category: contact.category,
            job_role: contact.job_role,
            linkedin: contact.linkedin,
            description: contact.description,
            score: contact.score,
            birthday: contact.birthday,
            keep_in_touch_frequency: contact.keep_in_touch_frequency,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString()
          })
          .select('contact_id')
          .single();
          
        if (insertError) throw insertError;
        contactId = insertData.contact_id;
        
        // Redirect to the new contact's edit page
        toast.success('Contact created successfully');
        navigate(`/contact-integrity/${contactId}`);
      }
    } catch (err) {
      console.error('Error saving basic info:', err);
      toast.error(`Failed to ${id ? 'update' : 'create'} contact`);
    } finally {
      setSaving(false);
    }
  };
  
  // Function to find LinkedIn profile using Apollo
  const enrichWithApollo = async () => {
    if (!contact.first_name && !contact.last_name) {
      toast.error('Please enter a name first');
      return;
    }
    
    // Show a loading toast while we process
    const loadingToast = toast.loading('Searching for LinkedIn profile...');
    
    try {
      // First, try to get any email addresses from the contact_emails table
      let emailsToTry = [];
      
      if (id) {
        // Get emails from the database if we have a contact ID
        const { data: emailData, error: emailError } = await supabase
          .from('contact_emails')
          .select('email')
          .eq('contact_id', id)
          .order('is_primary', { ascending: false });
        
        if (emailData && emailData.length > 0) {
          emailsToTry = emailData.map(e => e.email);
        }
      }
      
      // Also check form emails that might not be saved yet
      const formEmails = emails.filter(e => e.email.trim()).map(e => e.email.trim());
      
      // Combine all unique emails, with DB emails first (they're more likely to be correct)
      const allEmails = [...new Set([...emailsToTry, ...formEmails])];
      
      if (allEmails.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('Please add at least one email address');
        return;
      }
      
      // Use the most likely email (primary or first in the list)
      const emailToUse = allEmails[0];
      
      // Call Apollo API via Netlify function
      // We use the full Netlify function path to ensure it works in all environments
      const apolloResponse = await fetch('/.netlify/functions/apollo-enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          contactId: id || '',
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: emailToUse
        }),
      });
      
      const apolloData = await apolloResponse.json();
      
      // Clear the loading toast
      toast.dismiss(loadingToast);
      
      if (apolloData.error) {
        toast.error('Failed to find LinkedIn profile');
        console.error('Apollo API error:', apolloData.error);
        return;
      }
      
      // Data structure might vary slightly depending on how Apollo returns data
      // We look for linkedin in a few possible places
      const linkedinUrl = 
        apolloData.data?.linkedin || 
        apolloData.data?.linkedin_url || 
        apolloData.person?.linkedin_url ||
        null;
      
      if (linkedinUrl) {
        // Update the contact state with the LinkedIn URL
        setContact({
          ...contact,
          linkedin: linkedinUrl
        });
        
        toast.success('LinkedIn profile found!');
      } else {
        toast.error('No LinkedIn profile found for this contact');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Error finding LinkedIn profile');
      console.error('Error finding LinkedIn profile:', error);
    }
  };
  
  // Save just emails
  const saveEmails = async () => {
    if (!id) {
      toast.error('Please save basic information first');
      setActiveTab('basic');
      return;
    }
    
    setSaving(true);
    
    try {
      // Delete existing email records
      const { error: deleteEmailsError } = await supabase
        .from('contact_emails')
        .delete()
        .eq('contact_id', id);
        
      if (deleteEmailsError) throw deleteEmailsError;
      
      // Insert new email records
      const validEmails = emails.filter(e => e.email.trim());
      if (validEmails.length > 0) {
        const { error: insertEmailsError } = await supabase
          .from('contact_emails')
          .insert(validEmails.map(e => ({
            contact_id: id,
            email: e.email.trim(),
            type: e.type,
            is_primary: e.is_primary
          })));
          
        if (insertEmailsError) throw insertEmailsError;
      }
      
      toast.success('Email addresses updated successfully');
    } catch (err) {
      console.error('Error saving emails:', err);
      toast.error('Failed to update email addresses');
    } finally {
      setSaving(false);
    }
  };

  // Save just mobiles
  const saveMobiles = async () => {
    if (!id) {
      toast.error('Please save basic information first');
      setActiveTab('basic');
      return;
    }
    
    setSaving(true);
    
    try {
      // Delete existing mobile records
      const { error: deleteMobilesError } = await supabase
        .from('contact_mobiles')
        .delete()
        .eq('contact_id', id);
        
      if (deleteMobilesError) throw deleteMobilesError;
      
      // Insert new mobile records
      const validMobiles = mobiles.filter(m => m.mobile.trim());
      if (validMobiles.length > 0) {
        const { error: insertMobilesError } = await supabase
          .from('contact_mobiles')
          .insert(validMobiles.map(m => ({
            contact_id: id,
            mobile: m.mobile.trim(),
            type: m.type,
            is_primary: m.is_primary
          })));
          
        if (insertMobilesError) throw insertMobilesError;
      }
      
      toast.success('Mobile numbers updated successfully');
    } catch (err) {
      console.error('Error saving mobiles:', err);
      toast.error('Failed to update mobile numbers');
    } finally {
      setSaving(false);
    }
  };
  
  // Save just tags
  const saveTags = async () => {
    if (!id) {
      toast.error('Please save basic information first');
      setActiveTab('basic');
      return;
    }
    
    setSaving(true);
    
    try {
      // Delete existing tag associations
      const { error: deleteTagsError } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', id);
        
      if (deleteTagsError) throw deleteTagsError;
      
      // Insert new tag associations
      if (tags.length > 0) {
        const { error: insertTagsError } = await supabase
          .from('contact_tags')
          .insert(tags.map(tagId => ({
            contact_id: id,
            tag_id: tagId
          })));
          
        if (insertTagsError) throw insertTagsError;
      }
      
      toast.success('Tags updated successfully');
    } catch (err) {
      console.error('Error saving tags:', err);
      toast.error('Failed to update tags');
    } finally {
      setSaving(false);
    }
  };
  
  // Save just cities
  const saveCities = async () => {
    if (!id) {
      toast.error('Please save basic information first');
      setActiveTab('basic');
      return;
    }
    
    setSaving(true);
    
    try {
      // Delete existing city associations
      const { error: deleteCitiesError } = await supabase
        .from('contact_cities')
        .delete()
        .eq('contact_id', id);
        
      if (deleteCitiesError) throw deleteCitiesError;
      
      // Insert new city associations
      if (cities.length > 0) {
        const { error: insertCitiesError } = await supabase
          .from('contact_cities')
          .insert(cities.map(cityId => ({
            contact_id: id,
            city_id: cityId
          })));
          
        if (insertCitiesError) throw insertCitiesError;
      }
      
      toast.success('Cities updated successfully');
    } catch (err) {
      console.error('Error saving cities:', err);
      toast.error('Failed to update cities');
    } finally {
      setSaving(false);
    }
  };
  
  // Save just companies
  const saveCompanies = async () => {
    if (!id) {
      toast.error('Please save basic information first');
      setActiveTab('basic');
      return;
    }
    
    setSaving(true);
    
    try {
      // Delete existing company associations
      const { error: deleteCompaniesError } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_id', id);
        
      if (deleteCompaniesError) throw deleteCompaniesError;
      
      // Insert new company associations
      const validCompanies = companies.filter(c => c.company_id);
      if (validCompanies.length > 0) {
        const { error: insertCompaniesError } = await supabase
          .from('contact_companies')
          .insert(validCompanies.map(c => ({
            contact_id: id,
            company_id: c.company_id,
            relationship: c.relationship,
            is_primary: c.is_primary
          })));
          
        if (insertCompaniesError) throw insertCompaniesError;
      }
      
      toast.success('Companies updated successfully');
    } catch (err) {
      console.error('Error saving companies:', err);
      toast.error('Failed to update companies');
    } finally {
      setSaving(false);
    }
  };
  
  // Cancel and go back
  const handleCancel = () => {
    navigate(id ? `/contacts/${id}` : '/contacts/simple');
  };
  
  if (loading && !contact.contact_id) {
    return (
      <Container>
        <LoadingScreen>
          <div>Loading Data...</div>
        </LoadingScreen>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <Title>{id ? 'Edit Contact' : 'New Contact'}</Title>
        <div>
          <ActionButton onClick={handleCancel} danger>
            <FiX /> Cancel
          </ActionButton>
          {/* Save button removed from header - now in each tab */}
        </div>
      </Header>
      
      {error && (
        <ErrorMessage>
          <FiAlertTriangle />
          <div>{error}</div>
        </ErrorMessage>
      )}
      
      <TabContainer>
        <TabBar>
          <Tab active={activeTab === 'basic'} onClick={() => setActiveTab('basic')}>
            Basic Information
          </Tab>
          <Tab active={activeTab === 'connections'} onClick={() => setActiveTab('connections')}>
            Connections
          </Tab>
          <Tab active={activeTab === 'duplicates'} onClick={() => setActiveTab('duplicates')}>
            Find Duplicates
          </Tab>
        </TabBar>
        
        <TabContent active={activeTab === 'basic'}>
          <Card>
            <FormGrid>
              <FormGroup style={{ width: '97%' }}>
                <InputLabel htmlFor="first_name">First Name</InputLabel>
                <Input
                  id="first_name"
                  name="first_name"
                  value={contact.first_name || ''}
                  onChange={handleInputChange}
                  placeholder="First Name"
                />
              </FormGroup>
              
              <FormGroup style={{ width: '97%' }}>
                <InputLabel htmlFor="last_name">Last Name</InputLabel>
                <Input
                  id="last_name"
                  name="last_name"
                  value={contact.last_name || ''}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                />
              </FormGroup>
              
              <FormGroup>
                <InputLabel htmlFor="category">Category</InputLabel>
                <Select
                  id="category"
                  name="category"
                  value={contact.category || 'Not Set'}
                  onChange={handleInputChange}
                >
                  <option value="Not Set">Not Set</option>
                  <option value="Inbox">Inbox</option>
                  <option value="Founder">Founder</option>
                  <option value="Professional Investor">Professional Investor</option>
                  <option value="Manager">Manager</option>
                  <option value="Team">Team</option>
                  <option value="Advisor">Advisor</option>
                  <option value="Supplier">Supplier</option>
                  <option value="Friend and Family">Friend and Family</option>
                  <option value="Institution">Institution</option>
                  <option value="Media">Media</option>
                  <option value="Student">Student</option>
                  <option value="Skip">Skip</option>
                  <option value="WhatsApp Group Contact">WhatsApp Group Contact</option>
                  <option value="SUBSCRIBER NEWSLETTER">Subscriber Newsletter</option>
                  <option value="Other">Other</option>
                </Select>
              </FormGroup>
              
              <FormGroup style={{ width: '97%' }}>
                <InputLabel htmlFor="job_role">Job Role</InputLabel>
                <Input
                  id="job_role"
                  name="job_role"
                  value={contact.job_role || ''}
                  onChange={handleInputChange}
                  placeholder="Job Role"
                />
              </FormGroup>
              
              <FormGroup style={{ width: '97%' }}>
                <InputLabel htmlFor="linkedin">LinkedIn URL</InputLabel>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input
                    id="linkedin"
                    name="linkedin"
                    value={contact.linkedin || ''}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/..."
                    style={{ flex: 1 }}
                  />
                  {!contact.linkedin && (
                    <ActionButton 
                      onClick={() => enrichWithApollo()}
                      style={{ padding: '4px 8px', minWidth: 'auto', height: '40px' }}
                      title="Find LinkedIn with Apollo"
                    >
                      <FiLink />
                    </ActionButton>
                  )}
                </div>
              </FormGroup>
              
              <FormGroup style={{ width: '97%' }}>
                <InputLabel htmlFor="score">Score (1-5)</InputLabel>
                <Input
                  id="score"
                  name="score"
                  type="number"
                  value={contact.score || ''}
                  onChange={handleInputChange}
                  placeholder="Score (1-5)"
                  min="1"
                  max="5"
                />
              </FormGroup>
              
              <FormGroup style={{ width: '97%' }}>
                <InputLabel htmlFor="birthday">Birthday</InputLabel>
                <Input
                  id="birthday"
                  name="birthday"
                  type="date"
                  value={contact.birthday || ''}
                  onChange={handleInputChange}
                />
              </FormGroup>
              
              <FormGroup>
                <InputLabel htmlFor="keep_in_touch_frequency">Last Interaction Frequency</InputLabel>
                <Select
                  id="keep_in_touch_frequency"
                  name="keep_in_touch_frequency"
                  value={contact.keep_in_touch_frequency || ''}
                  onChange={handleInputChange}
                >
                  <option value="Not Set">Not Set</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Twice per Year">Twice per Year</option>
                  <option value="Once per Year">Once per Year</option>
                  <option value="Do not keep in touch">Do not keep in touch</option>
                </Select>
              </FormGroup>
            </FormGrid>
            
            <FormSection style={{ width: '98%' }}>
              <InputLabel htmlFor="description">Description / Notes</InputLabel>
              <TextArea
                id="description"
                name="description"
                value={contact.description || ''}
                onChange={handleInputChange}
                placeholder="Add notes about this contact..."
              />
            </FormSection>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <ActionButton onClick={saveBasicInfo} disabled={saving}>
                <FiSave /> {saving ? 'Saving...' : 'Save Basic Information'}
              </ActionButton>
            </div>
          </Card>
        </TabContent>
        
        <TabContent active={activeTab === 'connections'}>
          <Card>
            <SectionTitle>
              <FiMail /> Email Addresses
            </SectionTitle>
            
            <MultipleItemContainer>
              {emails.map((email, index) => (
                <ItemRow key={index}>
                  <div style={{ flex: 2 }}>
                    <Input
                      value={email.email}
                      onChange={(e) => handleEmailChange(index, 'email', e.target.value)}
                      placeholder="Email address"
                    />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <Select
                      value={email.type}
                      onChange={(e) => handleEmailChange(index, 'type', e.target.value)}
                    >
                      {pointTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </div>
                  
                  <ActionButton 
                    onClick={() => setPrimaryEmail(index)}
                    disabled={email.is_primary}
                    style={{ padding: '4px', minWidth: '32px' }}
                  >
                    <FiCheck />
                  </ActionButton>
                  
                  <ActionButton 
                    onClick={() => removeEmail(index)}
                    danger
                    style={{ padding: '4px', minWidth: '32px' }}
                  >
                    <FiTrash2 />
                  </ActionButton>
                </ItemRow>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <ActionButton onClick={addEmail}>
                  <FiPlus /> Add Email
                </ActionButton>
                <ActionButton onClick={() => saveEmails()} disabled={saving || !id}>
                  <FiSave /> {saving ? 'Saving...' : 'Save Emails'}
                </ActionButton>
              </div>
            </MultipleItemContainer>
          </Card>
          
          <Card>
            <SectionTitle>
              <FiPhone /> Mobile Numbers
            </SectionTitle>
            
            <MultipleItemContainer>
              {mobiles.map((mobile, index) => (
                <ItemRow key={index}>
                  <div style={{ flex: 2 }}>
                    <Input
                      value={mobile.mobile}
                      onChange={(e) => handleMobileChange(index, 'mobile', e.target.value)}
                      placeholder="Mobile number"
                    />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <Select
                      value={mobile.type}
                      onChange={(e) => handleMobileChange(index, 'type', e.target.value)}
                    >
                      {pointTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </div>
                  
                  <ActionButton 
                    onClick={() => setPrimaryMobile(index)}
                    disabled={mobile.is_primary}
                    style={{ padding: '4px', minWidth: '32px' }}
                  >
                    <FiCheck />
                  </ActionButton>
                  
                  <ActionButton 
                    onClick={() => removeMobile(index)}
                    danger
                    style={{ padding: '4px', minWidth: '32px' }}
                  >
                    <FiTrash2 />
                  </ActionButton>
                </ItemRow>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <ActionButton onClick={addMobile}>
                  <FiPlus /> Add Mobile
                </ActionButton>
                <ActionButton onClick={() => saveMobiles()} disabled={saving || !id}>
                  <FiSave /> {saving ? 'Saving...' : 'Save Mobiles'}
                </ActionButton>
              </div>
            </MultipleItemContainer>
          </Card>
          
          <Card>
            <SectionTitle>
              <FiTag /> Tags
            </SectionTitle>
            
            <MultipleItemContainer>
              {tags.map((tag, index) => (
                <ItemRow key={index}>
                  <div style={{ flex: 1 }}>
                    <Select
                      value={typeof tag === 'object' ? tag.id || '' : tag || ''}
                      onChange={(e) => {
                        const newTags = [...tags];
                        
                        // Check if new tag needs to be created
                        if (e.target.value === 'new_tag') {
                          // Open a dialog to create a new tag
                          const tagName = prompt('Enter a name for the new tag:');
                          if (tagName && tagName.trim()) {
                            // Create a new tag in the database
                            const createNewTag = async () => {
                              try {
                                const { data, error } = await supabase
                                  .from('tags')
                                  .insert({ name: tagName.trim() })
                                  .select()
                                  .single();
                                
                                if (error) throw error;
                                
                                // Add the new tag to allTags
                                setAllTags([...allTags, data]);
                                
                                // Set the new tag as selected
                                newTags[index] = data.tag_id;
                                
                                toast.success(`Tag "${tagName}" created successfully`);
                              } catch (err) {
                                console.error('Error creating tag:', err);
                                toast.error('Failed to create new tag');
                              }
                            };
                            
                            createNewTag();
                          }
                        } else {
                          newTags[index] = e.target.value;
                        }
                        
                        setTags(newTags);
                      }}
                    >
                      <option value="">Select a tag</option>
                      {allTags.map(t => (
                        <option key={t.tag_id} value={t.tag_id}>
                          {t.name}
                        </option>
                      ))}
                      <option value="new_tag" style={{ fontStyle: 'italic', color: '#00ff00' }}>
                        + Create new tag...
                      </option>
                    </Select>
                  </div>
                  
                  <ActionButton 
                    onClick={() => {
                      const newTags = [...tags];
                      newTags.splice(index, 1);
                      setTags(newTags);
                    }}
                    danger
                    style={{ padding: '4px', minWidth: '32px' }}
                  >
                    <FiTrash2 />
                  </ActionButton>
                </ItemRow>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <ActionButton onClick={() => setTags([...tags, ''])}>
                  <FiPlus /> Add Tag
                </ActionButton>
                <ActionButton onClick={() => saveTags()} disabled={saving || !id}>
                  <FiSave /> {saving ? 'Saving...' : 'Save Tags'}
                </ActionButton>
              </div>
            </MultipleItemContainer>
          </Card>
          
          <Card>
            <SectionTitle>
              <FiMapPin /> Cities
            </SectionTitle>
            
            <MultipleItemContainer>
              {cities.map((city, index) => (
                <ItemRow key={index}>
                  <div style={{ flex: 1 }}>
                    <Select
                      value={typeof city === 'object' ? city.id || '' : city || ''}
                      onChange={(e) => {
                        const newCities = [...cities];
                        
                        // Check if new city needs to be created
                        if (e.target.value === 'new_city') {
                          // Ask for city name
                          const cityName = prompt('Enter city name:');
                          if (cityName && cityName.trim()) {
                            // Ask for country
                            const country = prompt('Enter country:');
                            if (country && country.trim()) {
                              // Create a new city in the database
                              const createNewCity = async () => {
                                try {
                                  const { data, error } = await supabase
                                    .from('cities')
                                    .insert({ 
                                      name: cityName.trim(),
                                      country: country.trim()
                                    })
                                    .select()
                                    .single();
                                  
                                  if (error) throw error;
                                  
                                  // Add the new city to allCities
                                  setAllCities([...allCities, data]);
                                  
                                  // Set the new city as selected
                                  newCities[index] = data.city_id;
                                  
                                  toast.success(`City "${cityName}, ${country}" created successfully`);
                                } catch (err) {
                                  console.error('Error creating city:', err);
                                  toast.error('Failed to create new city');
                                }
                              };
                              
                              createNewCity();
                            }
                          }
                        } else {
                          newCities[index] = e.target.value;
                        }
                        
                        setCities(newCities);
                      }}
                    >
                      <option value="">Select a city</option>
                      {allCities.map(c => (
                        <option key={c.city_id} value={c.city_id}>
                          {c.name}, {c.country}
                        </option>
                      ))}
                      <option value="new_city" style={{ fontStyle: 'italic', color: '#00ff00' }}>
                        + Create new city...
                      </option>
                    </Select>
                  </div>
                  
                  <ActionButton 
                    onClick={() => {
                      const newCities = [...cities];
                      newCities.splice(index, 1);
                      setCities(newCities);
                    }}
                    danger
                    style={{ padding: '4px', minWidth: '32px' }}
                  >
                    <FiTrash2 />
                  </ActionButton>
                </ItemRow>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <ActionButton onClick={() => setCities([...cities, ''])}>
                  <FiPlus /> Add City
                </ActionButton>
                <ActionButton onClick={() => saveCities()} disabled={saving || !id}>
                  <FiSave /> {saving ? 'Saving...' : 'Save Cities'}
                </ActionButton>
              </div>
            </MultipleItemContainer>
          </Card>
          
          <Card>
            <SectionTitle>
              <FiBriefcase /> Companies
            </SectionTitle>
            
            <MultipleItemContainer>
              {companies.map((company, index) => (
                <ItemRow key={index}>
                  <div style={{ flex: 2 }}>
                    <Select
                      value={company.company_id || ''}
                      onChange={(e) => {
                        // Check if new company needs to be created
                        if (e.target.value === 'new_company') {
                          // Ask for company name
                          const companyName = prompt('Enter company name:');
                          if (companyName && companyName.trim()) {
                            // Ask for optional website
                            const website = prompt('Enter company website (optional):');
                            const createNewCompany = async () => {
                              try {
                                const newCompany = {
                                  name: companyName.trim(),
                                  category: 'Inbox'
                                };
                                
                                // Add website if provided
                                if (website && website.trim()) {
                                  newCompany.website = website.trim();
                                }
                                
                                const { data, error } = await supabase
                                  .from('companies')
                                  .insert(newCompany)
                                  .select()
                                  .single();
                                
                                if (error) throw error;
                                
                                // Add the new company to allCompanies
                                setAllCompanies([...allCompanies, data]);
                                
                                // Set the new company as selected
                                handleCompanyChange(index, 'company_id', data.company_id);
                                
                                toast.success(`Company "${companyName}" created successfully`);
                              } catch (err) {
                                console.error('Error creating company:', err);
                                toast.error('Failed to create new company');
                              }
                            };
                            
                            createNewCompany();
                          }
                        } else {
                          handleCompanyChange(index, 'company_id', e.target.value);
                        }
                      }}
                    >
                      <option value="">Select a company</option>
                      {allCompanies.map(comp => (
                        <option key={comp.company_id} value={comp.company_id}>
                          {comp.name}
                        </option>
                      ))}
                      <option value="new_company" style={{ fontStyle: 'italic', color: '#00ff00' }}>
                        + Create new company...
                      </option>
                    </Select>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <Select
                      value={company.relationship || 'not_set'}
                      onChange={(e) => handleCompanyChange(index, 'relationship', e.target.value)}
                    >
                      <option value="not_set">Relationship</option>
                      <option value="employee">Employee</option>
                      <option value="founder">Founder</option>
                      <option value="investor">Investor</option>
                      <option value="advisor">Advisor</option>
                      <option value="board_member">Board Member</option>
                      <option value="customer">Customer</option>
                      <option value="partner">Partner</option>
                    </Select>
                  </div>
                  
                  <ActionButton 
                    onClick={() => setPrimaryCompany(index)}
                    disabled={company.is_primary}
                    style={{ padding: '4px', minWidth: '32px' }}
                  >
                    <FiCheck />
                  </ActionButton>
                  
                  <ActionButton 
                    onClick={() => removeCompany(index)}
                    danger
                    style={{ padding: '4px', minWidth: '32px' }}
                  >
                    <FiTrash2 />
                  </ActionButton>
                </ItemRow>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <ActionButton onClick={addCompany}>
                  <FiPlus /> Add Company
                </ActionButton>
                <ActionButton onClick={() => saveCompanies()} disabled={saving || !id}>
                  <FiSave /> {saving ? 'Saving...' : 'Save Companies'}
                </ActionButton>
              </div>
            </MultipleItemContainer>
          </Card>
        </TabContent>
        
        <TabContent active={activeTab === 'duplicates'}>
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
                <ActionButton onClick={searchNameDuplicates} disabled={loading}>
                  <FiSearch /> {loading ? 'Searching...' : 'Search by Name'}
                </ActionButton>
              </div>
              
              <div>
                <h4 style={{ color: '#00ff00', margin: '0 0 8px 0', fontSize: '0.9rem' }}>By Email</h4>
                <p style={{ color: '#999', marginBottom: '10px', fontSize: '0.8rem' }}>
                  Searches for contacts with matching email addresses
                </p>
                <ActionButton onClick={searchEmailDuplicates} disabled={loading}>
                  <FiMail /> {loading ? 'Searching...' : 'Search by Email'}
                </ActionButton>
              </div>
              
              <div>
                <h4 style={{ color: '#00ff00', margin: '0 0 8px 0', fontSize: '0.9rem' }}>By Mobile</h4>
                <p style={{ color: '#999', marginBottom: '10px', fontSize: '0.8rem' }}>
                  Searches for contacts with matching mobile numbers
                </p>
                <ActionButton onClick={searchMobileDuplicates} disabled={loading}>
                  <FiPhone /> {loading ? 'Searching...' : 'Search by Mobile'}
                </ActionButton>
              </div>
            </div>
            
            {searchResults.length > 0 && (
              <DuplicatesList>
                <h3 style={{ color: '#00ff00', marginTop: '20px' }}>Potential Duplicates Found ({searchResults.length})</h3>
                
                {searchResults.map(result => (
                  <DuplicateItem key={result.contact_id} onClick={() => selectDuplicate(result)}>
                    <DuplicateName>
                      {result.first_name} {result.last_name}
                    </DuplicateName>
                    <DuplicateDetails>
                      {result.category && <Badge>{result.category}</Badge>}
                      {result.job_role && <span style={{ marginRight: '10px' }}>{result.job_role}</span>}
                      {result.last_interaction_at && 
                        <span>Last interaction: {new Date(result.last_interaction_at).toLocaleDateString()}</span>
                      }
                    </DuplicateDetails>
                  </DuplicateItem>
                ))}
              </DuplicatesList>
            )}
            
            {selectedDuplicate && (
              <div style={{ marginTop: '20px' }}>
                <SectionTitle>
                  <FiGitMerge /> Merge Contact Data
                </SectionTitle>
                
                <p style={{ color: '#999', marginBottom: '15px' }}>
                  Select which data to keep from each record.
                </p>
                
                <ComparisonTable>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Current Contact</th>
                      <th>Duplicate Contact</th>
                      <th>Selection</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Name</td>
                      <td>{contact.first_name} {contact.last_name}</td>
                      <td>{selectedDuplicate.first_name} {selectedDuplicate.last_name}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_name"
                              value="current"
                              checked={mergeSelections.first_name === 'current' && mergeSelections.last_name === 'current'}
                              onChange={() => {
                                handleMergeSelectionChange('first_name', 'current');
                                handleMergeSelectionChange('last_name', 'current');
                              }}
                            />
                            <span>Current</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_name"
                              value="duplicate"
                              checked={mergeSelections.first_name === 'duplicate' && mergeSelections.last_name === 'duplicate'}
                              onChange={() => {
                                handleMergeSelectionChange('first_name', 'duplicate');
                                handleMergeSelectionChange('last_name', 'duplicate');
                              }}
                            />
                            <span>Duplicate</span>
                          </MergeOption>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Category</td>
                      <td>{contact.category}</td>
                      <td>{selectedDuplicate.category}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_category"
                              value="current"
                              checked={mergeSelections.category === 'current'}
                              onChange={() => handleMergeSelectionChange('category', 'current')}
                            />
                            <span>Current</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_category"
                              value="duplicate"
                              checked={mergeSelections.category === 'duplicate'}
                              onChange={() => handleMergeSelectionChange('category', 'duplicate')}
                            />
                            <span>Duplicate</span>
                          </MergeOption>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Job Role</td>
                      <td>{contact.job_role || '-'}</td>
                      <td>{selectedDuplicate.job_role || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_job_role"
                              value="current"
                              checked={mergeSelections.job_role === 'current'}
                              onChange={() => handleMergeSelectionChange('job_role', 'current')}
                            />
                            <span>Current</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_job_role"
                              value="duplicate"
                              checked={mergeSelections.job_role === 'duplicate'}
                              onChange={() => handleMergeSelectionChange('job_role', 'duplicate')}
                            />
                            <span>Duplicate</span>
                          </MergeOption>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Emails</td>
                      <td>
                        {emails.filter(e => e.email).map(e => e.email).join(', ') || '-'}
                      </td>
                      <td>
                        {selectedDuplicate.emails.map(e => e.email).join(', ') || '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_emails"
                              value="current"
                              checked={mergeSelections.emails === 'current'}
                              onChange={() => handleMergeSelectionChange('emails', 'current')}
                            />
                            <span>Current</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_emails"
                              value="duplicate"
                              checked={mergeSelections.emails === 'duplicate'}
                              onChange={() => handleMergeSelectionChange('emails', 'duplicate')}
                            />
                            <span>Duplicate</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_emails"
                              value="combine"
                              checked={mergeSelections.emails === 'combine'}
                              onChange={() => handleMergeSelectionChange('emails', 'combine')}
                            />
                            <span>Combine</span>
                          </MergeOption>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Mobiles</td>
                      <td>
                        {mobiles.filter(m => m.mobile).map(m => m.mobile).join(', ') || '-'}
                      </td>
                      <td>
                        {selectedDuplicate.mobiles.map(m => m.mobile).join(', ') || '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_mobiles"
                              value="current"
                              checked={mergeSelections.mobiles === 'current'}
                              onChange={() => handleMergeSelectionChange('mobiles', 'current')}
                            />
                            <span>Current</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_mobiles"
                              value="duplicate"
                              checked={mergeSelections.mobiles === 'duplicate'}
                              onChange={() => handleMergeSelectionChange('mobiles', 'duplicate')}
                            />
                            <span>Duplicate</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_mobiles"
                              value="combine"
                              checked={mergeSelections.mobiles === 'combine'}
                              onChange={() => handleMergeSelectionChange('mobiles', 'combine')}
                            />
                            <span>Combine</span>
                          </MergeOption>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Tags</td>
                      <td>
                        {tags.length > 0 ? tags.length + ' tags' : '-'}
                      </td>
                      <td>
                        {selectedDuplicate.tags.length > 0 ? selectedDuplicate.tags.length + ' tags' : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_tags"
                              value="current"
                              checked={mergeSelections.tags === 'current'}
                              onChange={() => handleMergeSelectionChange('tags', 'current')}
                            />
                            <span>Current</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_tags"
                              value="duplicate"
                              checked={mergeSelections.tags === 'duplicate'}
                              onChange={() => handleMergeSelectionChange('tags', 'duplicate')}
                            />
                            <span>Duplicate</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_tags"
                              value="combine"
                              checked={mergeSelections.tags === 'combine'}
                              onChange={() => handleMergeSelectionChange('tags', 'combine')}
                            />
                            <span>Combine</span>
                          </MergeOption>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Cities</td>
                      <td>
                        {cities.length > 0 ? cities.length + ' cities' : '-'}
                      </td>
                      <td>
                        {selectedDuplicate.cities.length > 0 ? selectedDuplicate.cities.length + ' cities' : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_cities"
                              value="current"
                              checked={mergeSelections.cities === 'current'}
                              onChange={() => handleMergeSelectionChange('cities', 'current')}
                            />
                            <span>Current</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_cities"
                              value="duplicate"
                              checked={mergeSelections.cities === 'duplicate'}
                              onChange={() => handleMergeSelectionChange('cities', 'duplicate')}
                            />
                            <span>Duplicate</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_cities"
                              value="combine"
                              checked={mergeSelections.cities === 'combine'}
                              onChange={() => handleMergeSelectionChange('cities', 'combine')}
                            />
                            <span>Combine</span>
                          </MergeOption>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Companies</td>
                      <td>
                        {companies.length > 0 ? companies.length + ' companies' : '-'}
                      </td>
                      <td>
                        {selectedDuplicate.companies.length > 0 ? selectedDuplicate.companies.length + ' companies' : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_companies"
                              value="current"
                              checked={mergeSelections.companies === 'current'}
                              onChange={() => handleMergeSelectionChange('companies', 'current')}
                            />
                            <span>Current</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_companies"
                              value="duplicate"
                              checked={mergeSelections.companies === 'duplicate'}
                              onChange={() => handleMergeSelectionChange('companies', 'duplicate')}
                            />
                            <span>Duplicate</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_companies"
                              value="combine"
                              checked={mergeSelections.companies === 'combine'}
                              onChange={() => handleMergeSelectionChange('companies', 'combine')}
                            />
                            <span>Combine</span>
                          </MergeOption>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>LinkedIn</td>
                      <td>{contact.linkedin || '-'}</td>
                      <td>{selectedDuplicate.linkedin || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_linkedin"
                              value="current"
                              checked={mergeSelections.linkedin === 'current'}
                              onChange={() => handleMergeSelectionChange('linkedin', 'current')}
                            />
                            <span>Current</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_linkedin"
                              value="duplicate"
                              checked={mergeSelections.linkedin === 'duplicate'}
                              onChange={() => handleMergeSelectionChange('linkedin', 'duplicate')}
                            />
                            <span>Duplicate</span>
                          </MergeOption>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Score</td>
                      <td>{contact.score || '-'}</td>
                      <td>{selectedDuplicate.score || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_score"
                              value="current"
                              checked={mergeSelections.score === 'current'}
                              onChange={() => handleMergeSelectionChange('score', 'current')}
                            />
                            <span>Current</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_score"
                              value="duplicate"
                              checked={mergeSelections.score === 'duplicate'}
                              onChange={() => handleMergeSelectionChange('score', 'duplicate')}
                            />
                            <span>Duplicate</span>
                          </MergeOption>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Keep In Touch Frequency</td>
                      <td>{contact.keep_in_touch_frequency || '-'}</td>
                      <td>{selectedDuplicate.keep_in_touch_frequency || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_keep_in_touch_frequency"
                              value="current"
                              checked={mergeSelections.keep_in_touch_frequency === 'current'}
                              onChange={() => handleMergeSelectionChange('keep_in_touch_frequency', 'current')}
                            />
                            <span>Current</span>
                          </MergeOption>
                          <MergeOption>
                            <MergeRadio
                              type="radio"
                              name="merge_keep_in_touch_frequency"
                              value="duplicate"
                              checked={mergeSelections.keep_in_touch_frequency === 'duplicate'}
                              onChange={() => handleMergeSelectionChange('keep_in_touch_frequency', 'duplicate')}
                            />
                            <span>Duplicate</span>
                          </MergeOption>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </ComparisonTable>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  <ActionButton
                    onClick={() => setSelectedDuplicate(null)}
                  >
                    <FiX /> Cancel
                  </ActionButton>
                  
                  <ActionButton
                    onClick={mergeContacts}
                    disabled={saving}
                  >
                    <FiGitMerge /> {saving ? 'Merging...' : 'Merge Contacts'}
                  </ActionButton>
                </div>
              </div>
            )}
          </Card>
        </TabContent>
      </TabContainer>
    </Container>
  );
};

export default ContactIntegrity;