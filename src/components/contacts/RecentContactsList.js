import React, { useState, useMemo, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faSearch, faPlus, faFire } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios'; // Import axios for API calls

// Add Hubspot API configuration
const HUBSPOT_API_CONFIG = {
  // Use our Netlify function as a proxy to avoid CORS issues
  baseURL: '/.netlify/functions/hubspot-proxy',
  timeout: 10000,
};

// Hubspot credentials - in a real app, these should be stored in environment variables
const HUBSPOT_API_KEY = process.env.REACT_APP_HUBSPOT_API_KEY || '';
const HUBSPOT_ACCESS_TOKEN = process.env.REACT_APP_HUBSPOT_ACCESS_TOKEN || '';

// Log credentials availability for debugging
console.log('HubSpot credentials check:');
console.log('- API Key available:', !!HUBSPOT_API_KEY);
console.log('- Access Token available:', !!HUBSPOT_ACCESS_TOKEN);
console.log('- Using EU token:', HUBSPOT_ACCESS_TOKEN.startsWith('pat-eu1-'));

// Create a Hubspot API client
const hubspotClient = axios.create({
  baseURL: HUBSPOT_API_CONFIG.baseURL,
  timeout: HUBSPOT_API_CONFIG.timeout,
});

// Add request interceptor for debugging
hubspotClient.interceptors.request.use(
  config => {
    console.log('Making request to:', config.baseURL + config.url);
    console.log('Request method:', config.method);
    console.log('Request params:', config.params);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
hubspotClient.interceptors.response.use(
  response => {
    console.log('Response status:', response.status);
    return response;
  },
  error => {
    console.error('Response error:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

const COMPANY_CATEGORIES = [
  'Advisor', 'Corporate', 'Institution', 'Professional Investor', 'SKIP', 'SME',
  'Startup', 'Supplier', 'Media', 'Team', 'Angels Sharing Society'
];

const CONTACT_CATEGORIES = [
  'Professional Investor', 'Founder', 'Manager', 'Team', 'Advisor',
  'Friend or Family', 'Media', 'Institution'
];

const KEEP_IN_TOUCH_FREQUENCIES = [
  'Weekly', 'Monthly', 'Quarterly', 'Twice a Year', 'Once a Year', 'Do not keep in touch'
];

// Updated Styled Components
const Container = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin: 2rem 0;
  width: 100%;
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
  }
`;

const ContactTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 1rem;
`;

const TableHead = styled.thead`
  background: #f3f4f6;
  th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.8rem;
    font-weight: 600;
    color: #4a5568;
    text-transform: uppercase;
    border-bottom: 2px solid #e5e7eb;
  }
`;

const TableBody = styled.tbody`
  tr {
    transition: background-color 0.2s ease;
    &:hover {
      background-color: #f9fafb;
    }
  }
  td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.9rem;
    color: #2d3748;
    vvertical-align: middle;
    position: relative; // Ensure relative positioning for absolute child (CompanyDropdown)
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: #6b7280;
`;

const PageButton = styled.button`
  padding: 0.5rem 0.875rem;
  border: 1px solid #e5e7eb;
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#4a5568'};
  border-radius: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: background-color 0.2s ease, transform 0.1s ease;
  &:hover:not(:disabled) {
    background: ${props => props.active ? '#2563eb' : '#f9fafb'};
    transform: translateY(-2px);
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  font-size: 0.9rem;
  color: #6b7280;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: #fff;
  border-radius: 12px;
  width: ${props => props.narrow ? '35%' : '70%'};
  max-width: ${props => props.narrow ? '500px' : '1000px'};
  height: auto;
  max-height: 90vh;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  animation: scaleIn 0.2s ease-out forwards;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  margin: auto;
  position: relative;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
    
    &:hover {
      background: #a1a1a1;
    }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const ContactDetailsSection = styled.div`
  background: #f8fafc;
  margin: 1.5rem;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`;

const ContactDetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 0.5rem;
`;

const ContactDetailItem = styled.div`
  font-size: 0.875rem;
  color: #475569;
  
  span.label {
    font-weight: 500;
    color: #334155;
    margin-right: 0.5rem;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.75rem;
`;

const CompanyForm = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  padding: 0 1.5rem 1.5rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
  
  .full-width {
    grid-column: span 2;
    
    @media (max-width: 640px) {
      grid-column: span 1;
    }
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1.5rem;
  position: relative;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
`;

const Input = styled.input`
  padding: 0.2rem 0.4rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  width: 100%;
  height: 22px;
  background-color: white;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #94a3b8;
  }
`;

const TextArea = styled.textarea`
  padding: 0.625rem 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  transition: all 0.2s ease;
  width: 94%;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: .5rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background-color: ${props => props.primary ? '#3b82f6' : 'white'};
  color: ${props => props.primary ? 'white' : '#374151'};
  border: ${props => props.primary ? 'none' : '1px solid #d1d5db'};
  
  &:hover {
    background-color: ${props => props.primary ? '#2563eb' : '#f9fafb'};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const CompanyInput = styled.input`
  padding: 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: 75%; // Halved width as requested
  font-size: 0.875rem;
  color: #2d3748;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const CompanyDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 150px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 75%; // Matches CompanyInput width
`;

const CompanyOption = styled.div`
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #2d3748;
  transition: background-color 0.2s ease, transform 0.1s ease;
  &:hover {
    background-color: #f9fafb;
    transform: translateX(2px);
  }
`;

const UnlinkButton = styled.button`
  margin-left: 0.625rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  color: #ef4444;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.1s ease;
  &:hover {
    color: #dc2626;
    transform: translateY(-2px);
  }
`;

const EditButton = styled.span`
  margin-left: 0.625rem;
  cursor: pointer;
  color: #3b82f6;
  font-size: 0.875rem;
  transition: color 0.2s ease, transform 0.1s ease;
  &:hover {
    color: #2563eb;
    transform: translateY(-2px);
  }
`;

const EmailButton = styled.span`
  margin-left: 0.625rem;
  cursor: pointer;
  color: #3b82f6;
  font-size: 0.875rem;
  transition: color 0.2s ease, transform 0.1s ease;
  &:hover {
    color: #2563eb;
    transform: translateY(-2px);
  }
`;

const Select = styled.select`
  padding: 0.25rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  color: ${props => !props.value ? '#dc2626' : '#1f2937'};
  width: 100%;
  height: 28px;
  background-color: ${props => !props.value ? '#fee2e2' : 'white'};
  transition: all 0.2s ease;
  appearance: menulist;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  
  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  
  &:hover { 
    color: #ef4444; 
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 1rem;
  padding: 0 1.5rem;
`;

const SearchInput = styled.input`
  padding: 0.625rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 50%;
  font-size: 0.875rem;
  color: #2d3748;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const SearchResults = styled.div`
  margin-top: 0.5rem;
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 50%;
`;

const SearchResultItem = styled.div`
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  font-size: 0.875rem;
  color: #2d3748;
  transition: background-color 0.2s ease, transform 0.1s ease;
  
  &:hover {
    background-color: #f9fafb;
    transform: translateX(2px);
  }
  
  &:last-child { 
    border-bottom: none; 
  }
`;

const TransferArrow = styled.span`
  position: absolute;
  left: -20px;
  top: calc(50% + 10px);
  transform: translateY(-50%);
  color: #3b82f6;
  font-size: 1.25rem;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.1s ease;
  
  &:hover {
    color: #2563eb;
    transform: translateY(-50%) scale(1.2);
  }
`;

const MergeFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  padding: 0 1.5rem;
`;

const MergeFormColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const MergeFormSection = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 2rem;
  border: 1px solid #e2e8f0;
`;

const MergeSectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

const StarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const Star = styled.span`
  cursor: pointer;
  color: ${props => props.filled ? '#fbbf24' : '#e5e7eb'};
  font-size: 1.25rem;
  transition: color 0.2s ease, transform 0.1s ease;
  
  &:hover {
    color: #fbbf24;
    transform: translateY(-2px);
  }
`;

const MergeIcon = styled.span`
  margin-right: 0.625rem;
  cursor: pointer;
  color: #3b82f6;
  font-size: 1.25rem;
  transition: color 0.2s ease, transform 0.1s ease;
  
  &:hover {
    color: #2563eb;
    transform: translateY(-2px);
  }
`;

const HubspotIcon = styled.span`
  margin-right: 0.625rem;
  cursor: pointer;
  color: #ff7a59; /* Hubspot orange */
  font-size: 0.875rem;
  transition: color 0.2s ease, transform 0.1s ease;
  
  &:hover {
    color: #ff5c39; /* Darker Hubspot orange */
    transform: translateY(-2px);
  }
`;

const EditContactForm = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 0 1.5rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SkipIcon = styled.span`
  margin-left: 0.625rem;
  cursor: pointer;
  color: #ef4444;
  font-size: 1.25rem;
  transition: color 0.2s ease, transform 0.1s ease;
  
  &:hover {
    color: #dc2626;
    transform: translateY(-2px);
  }
`;

const MergeModalContent = styled(ModalContent)`
  width: ${props => !props.hasTarget ? '35%' : '70%'};
  max-width: ${props => !props.hasTarget ? '500px' : '1000px'};
  padding: 1.5rem;
  height: auto;
  max-height: 90vh;
  position: relative;
  margin: auto;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
    
    &:hover {
      background: #a1a1a1;
    }
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const Tag = styled.span`
  background: ${props => props.color || '#e0f2fe'};
  color: ${props => {
    // Calculate contrasting text color based on background brightness
    const color = props.color || '#e0f2fe';
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }};
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  
  &:hover {
    filter: brightness(0.9);
  }
`;

const TagDeleteButton = styled.span`
  margin-left: 0.25rem;
  cursor: pointer;
  font-size: 0.8rem;
  &:hover {
    color: #ef4444;
  }
`;

const AddTagButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  transition: color 0.2s ease;
  
  &:hover {
    color: #3b82f6;
  }
`;

const TagInput = styled.input`
  padding: 0.2rem 0.4rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.75rem;
  width: 95%;
  height: 22px;
`;

const TagDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 95%;
`;

const TagOption = styled.div`
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: #2d3748;
  &:hover {
    background-color: #f9fafb;
  }
`;

const getRandomColor = () => {
  // Array of vibrant colors for tags
  const colors = [
    '#F44336', // Red
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#03A9F4', // Light Blue
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#4CAF50', // Green
    '#8BC34A', // Light Green
    '#CDDC39', // Lime
    '#FFEB3B', // Yellow
    '#FFC107', // Amber
    '#FF9800', // Orange
    '#FF5722', // Deep Orange
    '#795548', // Brown
    '#607D8B'  // Blue Grey
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const RecentContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [targetContact, setTargetContact] = useState(null);
  const [mergedData, setMergedData] = useState({});
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [companyData, setCompanyData] = useState({
    name: '',
    website: '',
    category: '',
    city: '',
    nation: '',
    description: ''
  });
  const [companySearchTerm, setCompanySearchTerm] = useState({});
  const [companySuggestions, setCompanySuggestions] = useState({});
  const [showContactEditModal, setShowContactEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactEditData, setContactEditData] = useState({});
  const [contactTags, setContactTags] = useState({});
  const [isAddingTag, setIsAddingTag] = useState({});
  const [tagInput, setTagInput] = useState({});
  const [tagSuggestions, setTagSuggestions] = useState({});
  const [allTags, setAllTags] = useState([]);
  const [hubspotLoading, setHubspotLoading] = useState({});
  const [hubspotAuthStatus, setHubspotAuthStatus] = useState({
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  const getThirtyDaysAgoRange = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    return { start: thirtyDaysAgo.toISOString(), end: now.toISOString() };
  }, []);

  const rowsPerPage = useMemo(() => 50, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [countResponse, contactsResponse] = await Promise.all([
        supabase
          .from('contacts')
          .select('*, companies(*)', { count: 'exact', head: true })
          .gte('created_at', getThirtyDaysAgoRange.start)
          .lte('created_at', getThirtyDaysAgoRange.end)
          .or(`contact_category.neq.Skip,contact_category.is.null`),
        supabase
          .from('contacts')
          .select('*, companies(*)')
          .gte('created_at', getThirtyDaysAgoRange.start)
          .lte('created_at', getThirtyDaysAgoRange.end)
          .or(`contact_category.neq.Skip,contact_category.is.null`)
          .order('created_at', { ascending: false })
          .range(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage - 1)
      ]);
      if (countResponse.error) {
        setTotalCount(0);
      } else {
        setTotalCount(countResponse.count || 0);
      }
      if (contactsResponse.error) {
        setContacts([]);
      } else {
        setContacts(contactsResponse.data || []);
      }
    } catch (error) {
      setContacts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, getThirtyDaysAgoRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        // Fetch all available tags
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*');
          
        if (tagsError) throw tagsError;
        
        // Assign a random color to each tag
        const tagsWithColors = tagsData.map(tag => ({
          ...tag,
          color: getRandomColor()
        }));
        
        setAllTags(tagsWithColors || []);
        
        // For each contact, fetch their associated tags
        const contactIds = contacts.map(contact => contact.id);
        if (contactIds.length === 0) return;
        
        const { data: contactTagsData, error: contactTagsError } = await supabase
          .from('contact_tags')
          .select('contact_id, tags(*)')
          .in('contact_id', contactIds);
          
        if (contactTagsError) throw contactTagsError;
        
        // Organize tags by contact_id and assign colors
        const tagsByContact = {};
        contactTagsData.forEach(item => {
          if (!tagsByContact[item.contact_id]) {
            tagsByContact[item.contact_id] = [];
          }
          // Assign a random color to each tag
          const tagWithColor = {
            ...item.tags,
            color: getRandomColor()
          };
          tagsByContact[item.contact_id].push(tagWithColor);
        });
        
        setContactTags(tagsByContact);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };
    
    if (contacts.length > 0) {
      fetchTags();
    }
  }, [contacts]);

  const totalPages = useMemo(() => Math.ceil(totalCount / rowsPerPage), [totalCount, rowsPerPage]);

  const handleSkipContact = useCallback(async (contactId) => {
    if (!window.confirm('Are you sure you want to mark this contact as Skip?')) return;
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ contact_category: 'Skip' })
        .eq('id', contactId);
      if (error) throw error;
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setTotalCount(prev => prev - 1);
    } catch (error) {
      alert('Failed to mark contact as Skip');
    }
  }, []);

  const handleOpenMerge = useCallback((contact) => {
    setSelectedContact(contact);
    setShowMergeModal(true);
    setMergedData({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      email2: contact.email2 || '',
      email3: contact.email3 || '',
      mobile: contact.mobile || '',
      linkedin: contact.linkedin || '',
      contact_category: contact.contact_category || '',
      keep_in_touch_frequency: contact.keep_in_touch_frequency || ''
    });
  }, []);

  const handleSearch = useCallback(async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
        .neq('id', selectedContact?.id)
        .limit(10);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      setSearchResults([]);
    }
  }, [selectedContact]);

  const handleSelectTarget = useCallback((contact) => {
    setTargetContact(contact);
    setSearchResults([]);
    setSearchTerm('');
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setMergedData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleMerge = useCallback(async () => {
    if (!selectedContact || !targetContact) return;
    const confirmMessage = `Are you sure you want to merge these contacts?\n\nThis will update ${selectedContact.first_name || ''} ${selectedContact.last_name || ''} with the merged data and delete ${targetContact.first_name || ''} ${targetContact.last_name || ''}.`;
    if (!window.confirm(confirmMessage)) return;
    try {
      const { error: updateError } = await supabase
        .from('contacts')
        .update(mergedData)
        .eq('id', selectedContact.id);
      if (updateError) throw updateError;
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', targetContact.id);
      if (deleteError) throw deleteError;
      await supabase
        .from('interactions')
        .update({ contact_id: selectedContact.id })
        .eq('contact_id', targetContact.id);
      setContacts(prev => prev.map(c => 
        c.id === selectedContact.id 
          ? { ...c, ...mergedData } 
          : c.id === targetContact.id 
            ? null 
            : c
      ).filter(Boolean));
      setShowMergeModal(false);
      setSelectedContact(null);
      setTargetContact(null);
      setMergedData({});
      alert('Contacts merged successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to merge contacts: ' + error.message);
    }
  }, [selectedContact, targetContact, mergedData, fetchData]);

  const handleOpenCompanyModal = useCallback(async (contact) => {
    setCurrentContact(contact);
    setCompanyData({
      name: companySearchTerm[contact.id] || '',
      website: '',
      category: '',
      city: '',
      nation: '',
      description: ''
    });
    if (contact.companies) {
      setCompanyData({
        name: contact.companies.name || '',
        website: contact.companies.website || '',
        category: contact.companies.category || '',
        city: contact.companies.city || '',
        nation: contact.companies.nation || '',
        description: contact.companies.description || ''
      });
    } else if (contact.email) {
      const emailDomain = contact.email.split('@')[1];
      try {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('*')
          .eq('website', emailDomain)
          .single();
        if (existingCompany) {
          setCompanyData({
            name: existingCompany.name || '',
            website: existingCompany.website || '',
            category: existingCompany.category || '',
            city: existingCompany.city || '',
            nation: existingCompany.nation || '',
            description: existingCompany.description || ''
          });
        }
      } catch (error) {}
    }
    setCompanySearchTerm(prev => ({ ...prev, [contact.id]: '' }));
    setCompanySuggestions(prev => ({ ...prev, [contact.id]: [] }));
    setShowCompanyModal(true);
  }, [companySearchTerm]);

  const handleSaveCompany = useCallback(async () => {
    try {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('*')
        .eq('website', companyData.website)
        .single();
      let companyId;
      if (existingCompany) {
        await supabase
          .from('companies')
          .update(companyData)
          .eq('id', existingCompany.id);
        companyId = existingCompany.id;
      } else {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert(companyData)
          .select()
          .single();
        companyId = newCompany.id;
      }
      await supabase
        .from('contacts')
        .update({ company_id: companyId })
        .eq('id', currentContact.id);
      fetchData();
      setShowCompanyModal(false);
    } catch (error) {
      alert('Failed to save company');
    }
  }, [companyData, currentContact, fetchData]);

  const handleCompanySearch = useCallback(async (contactId, term) => {
    setCompanySearchTerm(prev => ({ ...prev, [contactId]: term }));
    if (term.length < 4) {
      setCompanySuggestions(prev => ({ ...prev, [contactId]: [] }));
      return;
    }
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${term}%`)
        .limit(5);
      if (error) throw error;
      setCompanySuggestions(prev => ({
        ...prev,
        [contactId]: data.length > 0 ? data : [{ name: 'Add a company', isAddOption: true }]
      }));
    } catch (error) {
      setCompanySuggestions(prev => ({ ...prev, [contactId]: [{ name: 'Add a company', isAddOption: true }] }));
    }
  }, []);

  const handleCompanySelect = useCallback(async (contactId, company) => {
    if (company.isAddOption) {
      handleOpenCompanyModal(contacts.find(c => c.id === contactId));
      return;
    }
    try {
      await supabase
        .from('contacts')
        .update({ company_id: company.id })
        .eq('id', contactId);
      fetchData();
      setCompanySearchTerm(prev => ({ ...prev, [contactId]: '' }));
      setCompanySuggestions(prev => ({ ...prev, [contactId]: [] }));
    } catch (error) {
      alert('Failed to assign company');
    }
  }, [contacts, handleOpenCompanyModal, fetchData]);

  const handleCompanyCreateOnEnter = useCallback(async (event, contactId) => {
    if (event.key === 'Enter' && companySearchTerm[contactId] && companySearchTerm[contactId].length >= 4) {
      const suggestions = companySuggestions[contactId];
      if (suggestions && suggestions.length > 0 && suggestions[0].isAddOption) {
        // Create a new company using the input text
        const newCompany = {
          name: companySearchTerm[contactId],
          website: '', // You can modify this to infer a website or leave it empty
          category: '', // Default or inferred category (you can customize)
          city: '',
          nation: '',
          description: ''
        };
        try {
          const { data: createdCompany, error } = await supabase
            .from('companies')
            .insert(newCompany)
            .select()
            .single();
          if (error) throw error;
          await supabase
            .from('contacts')
            .update({ company_id: createdCompany.id })
            .eq('id', contactId);
          fetchData(); // Refresh the contacts list
          setCompanySearchTerm(prev => ({ ...prev, [contactId]: '' }));
          setCompanySuggestions(prev => ({ ...prev, [contactId]: [] }));
          // Open the "Add/Edit Company" modal for the newly created company
          setCurrentContact(contacts.find(c => c.id === contactId));
          setCompanyData(createdCompany);
          setShowCompanyModal(true);
        } catch (error) {
          alert('Failed to create company: ' + error.message);
        }
      }
    }
  }, [companySearchTerm, companySuggestions, fetchData, contacts]);
  
  const handleUnlinkCompany = useCallback(async (contactId) => {
    if (!window.confirm('Are you sure you want to unlink this company from the contact?')) return;
    try {
      await supabase
        .from('contacts')
        .update({ company_id: null })
        .eq('id', contactId);
      fetchData();
    } catch (error) {
      alert('Failed to unlink company');
    }
  }, [fetchData]);

  const goToFirstPage = useCallback(() => setCurrentPage(0), []);
  const goToPreviousPage = useCallback(() => setCurrentPage(prev => Math.max(0, prev - 1)), []);
  const goToNextPage = useCallback(() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1)), [totalPages]);
  const goToLastPage = useCallback(() => setCurrentPage(totalPages > 0 ? totalPages - 1 : 0), [totalPages]);

  const handleOpenContactEdit = useCallback((contact) => {
    setEditingContact(contact);
    setContactEditData({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      contact_category: contact.contact_category || '',
      mobile: contact.mobile || '',
      mobile2: contact.mobile2 || '',
      email: contact.email || '',
      email2: contact.email2 || '',
      email3: contact.email3 || '',
      linkedin: contact.linkedin || '',
      keep_in_touch_frequency: contact.keep_in_touch_frequency || ''
    });
    setShowContactEditModal(true);
  }, []);

  const handleContactInputChange = useCallback((field, value) => {
    setContactEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveContactEdit = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update(contactEditData)
        .eq('id', editingContact.id);
      if (error) throw error;
      setContacts(prev => prev.map(c =>
        c.id === editingContact.id ? { ...c, ...contactEditData } : c
      ));
      setShowContactEditModal(false);
      setEditingContact(null);
      setContactEditData({});
    } catch (error) {
      alert('Failed to update contact: ' + error.message);
    }
  }, [editingContact, contactEditData]);

  const handleEditCompany = useCallback((contact) => {
    setCurrentContact(contact);
    setCompanyData({
      name: contact.companies?.name || '',
      website: contact.companies?.website || '',
      category: contact.companies?.category || '',
      city: contact.companies?.city || '',
      nation: contact.companies?.nation || '',
      description: contact.companies?.description || ''
    });
    setShowCompanyModal(true);
  }, []);

  // Handle ESC key to close company input
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setCompanySearchTerm(prev => {
          const newTerm = { ...prev };
          Object.keys(newTerm).forEach(key => newTerm[key] = '');
          return newTerm;
        });
        setCompanySuggestions(prev => {
          const newSuggestions = { ...prev };
          Object.keys(newSuggestions).forEach(key => newSuggestions[key] = []);
          return newSuggestions;
        });
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Add ESC key handler for merge modal
  useEffect(() => {
    const handleEscForMergeModal = (event) => {
      if (event.key === 'Escape' && showMergeModal) {
        setShowMergeModal(false);
        setSelectedContact(null);
        setTargetContact(null);
        setMergedData({});
        setSearchTerm('');
        setSearchResults([]);
      }
    };
    window.addEventListener('keydown', handleEscForMergeModal);
    return () => window.removeEventListener('keydown', handleEscForMergeModal);
  }, [showMergeModal]);

  const handleAddTagClick = useCallback((contactId) => {
    setIsAddingTag(prev => ({ ...prev, [contactId]: true }));
    setTagInput(prev => ({ ...prev, [contactId]: '' }));
  }, []);

  const handleTagInputChange = useCallback((contactId, value) => {
    setTagInput(prev => ({ ...prev, [contactId]: value }));
    
    // Filter suggestions based on input
    if (value.trim()) {
      const suggestions = allTags.filter(tag => 
        tag.name.toLowerCase().includes(value.toLowerCase())
      );
      setTagSuggestions(prev => ({ ...prev, [contactId]: suggestions }));
    } else {
      setTagSuggestions(prev => ({ ...prev, [contactId]: [] }));
    }
  }, [allTags]);

  const handleTagSelect = useCallback(async (contactId, tag) => {
    try {
      // Check if tag already exists for this contact
      const existingTags = contactTags[contactId] || [];
      if (existingTags.some(t => t.id === tag.id)) {
        // Tag already exists, don't add it again
        setIsAddingTag(prev => ({ ...prev, [contactId]: false }));
        setTagInput(prev => ({ ...prev, [contactId]: '' }));
        setTagSuggestions(prev => ({ ...prev, [contactId]: [] }));
        return;
      }
      
      // Add tag to contact
      const { error } = await supabase
        .from('contact_tags')
        .insert({ contact_id: contactId, tag_id: tag.id });
        
      if (error) throw error;
      
      // Assign a random color to this tag
      const tagWithColor = {
        ...tag,
        color: getRandomColor()
      };
      
      // Update local state
      setContactTags(prev => {
        const updatedTags = { ...prev };
        if (!updatedTags[contactId]) {
          updatedTags[contactId] = [];
        }
        updatedTags[contactId] = [...updatedTags[contactId], tagWithColor];
        return updatedTags;
      });
      
      setIsAddingTag(prev => ({ ...prev, [contactId]: false }));
      setTagInput(prev => ({ ...prev, [contactId]: '' }));
      setTagSuggestions(prev => ({ ...prev, [contactId]: [] }));
    } catch (error) {
      console.error('Error adding tag:', error);
      alert('Failed to add tag');
    }
  }, [contactTags]);

  const handleCreateTag = useCallback(async (contactId, tagName) => {
    try {
      // Create new tag
      const { data: newTag, error: createError } = await supabase
        .from('tags')
        .insert({ name: tagName })
        .select()
        .single();
        
      if (createError) throw createError;
      
      // Add tag to contact
      const { error: linkError } = await supabase
        .from('contact_tags')
        .insert({ contact_id: contactId, tag_id: newTag.id });
        
      if (linkError) throw linkError;
      
      // Assign a random color to the new tag
      const tagWithColor = {
        ...newTag,
        color: getRandomColor()
      };
      
      // Update local state
      setAllTags(prev => [...prev, tagWithColor]);
      setContactTags(prev => {
        const updatedTags = { ...prev };
        if (!updatedTags[contactId]) {
          updatedTags[contactId] = [];
        }
        updatedTags[contactId] = [...updatedTags[contactId], tagWithColor];
        return updatedTags;
      });
      
      setIsAddingTag(prev => ({ ...prev, [contactId]: false }));
      setTagInput(prev => ({ ...prev, [contactId]: '' }));
      setTagSuggestions(prev => ({ ...prev, [contactId]: [] }));
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Failed to create tag');
    }
  }, []);

  const handleTagInputKeyDown = useCallback((e, contactId) => {
    if (e.key === 'Enter' && tagInput[contactId]?.trim()) {
      const suggestions = tagSuggestions[contactId] || [];
      if (suggestions.length > 0) {
        // Select the first suggestion
        handleTagSelect(contactId, suggestions[0]);
      } else {
        // Create a new tag
        handleCreateTag(contactId, tagInput[contactId].trim());
      }
    } else if (e.key === 'Escape') {
      setIsAddingTag(prev => ({ ...prev, [contactId]: false }));
      setTagInput(prev => ({ ...prev, [contactId]: '' }));
      setTagSuggestions(prev => ({ ...prev, [contactId]: [] }));
    }
  }, [tagInput, tagSuggestions, handleTagSelect, handleCreateTag]);

  const handleRemoveTag = useCallback(async (contactId, tagId) => {
    try {
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contactId)
        .eq('tag_id', tagId);
        
      if (error) throw error;
      
      // Update local state
      setContactTags(prev => {
        const updatedTags = { ...prev };
        if (updatedTags[contactId]) {
          updatedTags[contactId] = updatedTags[contactId].filter(tag => tag.id !== tagId);
        }
        return updatedTags;
      });
    } catch (error) {
      console.error('Error removing tag:', error);
      alert('Failed to remove tag');
    }
  }, []);

  // Check Hubspot authentication on component mount
  useEffect(() => {
    const checkHubspotAuth = async () => {
      console.log('Checking HubSpot authentication...');
      
      // Check if we have credentials
      if (!HUBSPOT_API_KEY && !HUBSPOT_ACCESS_TOKEN) {
        console.log('No HubSpot credentials found');
        setHubspotAuthStatus({
          isAuthenticated: false,
          isLoading: false,
          error: "No Hubspot credentials found. Configure API key or OAuth token."
        });
        return;
      }
      
      try {
        console.log('Making test request to HubSpot API...');
        
        // Explicitly specify the endpoint in the request
        const response = await hubspotClient.post('', {
          endpoint: '/crm/v3/objects/contacts',
          method: 'GET',
          params: { limit: 1 }
        });
        
        console.log('HubSpot authentication successful!');
        console.log('Response status:', response.status);
        setHubspotAuthStatus({
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('HubSpot authentication failed:', error.message);
        
        if (error.response) {
          console.error('Error status:', error.response.status);
          console.error('Error data:', JSON.stringify(error.response.data));
          
          // Check for specific error types
          if (error.response.status === 401) {
            console.error('Authentication error: Invalid credentials or token expired');
          } else if (error.response.status === 403) {
            console.error('Authorization error: Insufficient permissions');
          }
        } else if (error.request) {
          console.error('No response received from HubSpot API');
        } else {
          console.error('Error setting up request:', error.message);
        }
        
        setHubspotAuthStatus({
          isAuthenticated: false,
          isLoading: false,
          error: error.message || 'Failed to authenticate with Hubspot'
        });
        throw new Error(`HubSpot authentication failed: ${error.response?.status || error.message}`);
      }
    };
    
    checkHubspotAuth();
  }, []);
  
  // Function to search for a contact in Hubspot - wrapped in useCallback
  const searchHubspotContact = useCallback(async (contact) => {
    try {
      // Define all the properties we want to fetch from HubSpot
      const contactProperties = [
        'firstname', 'lastname', 'email', 'work_email', 'mobilephone', 
        'phone', 'hs_lead_status', 'linkedin_profile', 'hubspot_score',
        'city', 'about', 'notes_last_updated', 'notes_last_contacted',
        'contact_category', 'keep_in_touch_frequency', 'score'
      ];
      
      // Search by email first if available
      if (contact.email) {
        const emailResponse = await hubspotClient.post('/crm/v3/objects/contacts/search', {
          method: 'POST',
          data: {
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: 'email',
                    operator: 'EQ',
                    value: contact.email
                  }
                ]
              }
            ],
            properties: contactProperties,
            limit: 10
          }
        });
        
        if (emailResponse.data.results && emailResponse.data.results.length > 0) {
          // Also fetch associated companies for this contact
          const contactId = emailResponse.data.results[0].id;
          const companiesResponse = await hubspotClient.post('', {
            endpoint: `/crm/v3/objects/contacts/${contactId}/associations/companies`,
            method: 'GET'
          });
          
          let companyData = null;
          
          // If there are associated companies, fetch the first company's details
          if (companiesResponse.data.results && companiesResponse.data.results.length > 0) {
            const companyId = companiesResponse.data.results[0].id;
            const companyResponse = await hubspotClient.post('', {
              endpoint: `/crm/v3/objects/companies/${companyId}`,
              method: 'GET',
              params: {
                properties: 'name,website,description,city,country,industry,category'
              }
            });
            
            if (companyResponse.data) {
              companyData = companyResponse.data;
            }
          }
          
          return {
            found: true,
            nameMatch: true, // Assuming email is unique enough
            contact: emailResponse.data.results[0],
            company: companyData
          };
        }
      }
      
      // If no results by email, search by name
      if (contact.first_name || contact.last_name) {
        // Build the search query based on available name parts
        const nameFilters = [];
        
        if (contact.first_name) {
          nameFilters.push({
            propertyName: 'firstname',
            operator: 'EQ',
            value: contact.first_name
          });
        }
        
        if (contact.last_name) {
          nameFilters.push({
            propertyName: 'lastname',
            operator: 'EQ',
            value: contact.last_name
          });
        }
        
        const nameResponse = await hubspotClient.post('/crm/v3/objects/contacts/search', {
          method: 'POST',
          data: {
            filterGroups: [
              {
                filters: nameFilters
              }
            ],
            properties: contactProperties,
            limit: 10
          }
        });
        
        if (nameResponse.data.results && nameResponse.data.results.length > 0) {
          // Check if first name and last name match
          const result = nameResponse.data.results[0];
          const firstNameMatch = !contact.first_name || 
            (result.properties.firstname && 
             result.properties.firstname.toLowerCase() === contact.first_name.toLowerCase());
          const lastNameMatch = !contact.last_name || 
            (result.properties.lastname && 
             result.properties.lastname.toLowerCase() === contact.last_name.toLowerCase());
          
          // Also fetch associated companies for this contact
          const contactId = result.id;
          const companiesResponse = await hubspotClient.post('', {
            endpoint: `/crm/v3/objects/contacts/${contactId}/associations/companies`,
            method: 'GET'
          });
          
          let companyData = null;
          
          // If there are associated companies, fetch the first company's details
          if (companiesResponse.data.results && companiesResponse.data.results.length > 0) {
            const companyId = companiesResponse.data.results[0].id;
            const companyResponse = await hubspotClient.post('', {
              endpoint: `/crm/v3/objects/companies/${companyId}`,
              method: 'GET',
              params: {
                properties: 'name,website,description,city,country,industry,category'
              }
            });
            
            if (companyResponse.data) {
              companyData = companyResponse.data;
            }
          }
          
          return {
            found: true,
            nameMatch: firstNameMatch && lastNameMatch,
            contact: result,
            company: companyData
          };
        }
      }
      
      // No matching contact found
      return {
        found: false,
        nameMatch: false,
        contact: null,
        company: null
      };
    } catch (error) {
      console.error('Error searching Hubspot:', error);
      throw error;
    }
  }, []);
  
  // Helper function to map Hubspot status categories - wrapped in useCallback to prevent dependency warnings
  const mapHubspotStatusToCategory = useCallback((hubspotStatus) => {
    if (!hubspotStatus) return '';
    
    // Define mapping from Hubspot lead statuses to our categories
    const statusMap = {
      'NEW': 'Founder',
      'OPEN': 'Professional Investor',
      'IN PROGRESS': 'Manager',
      'OPEN DEAL': 'Professional Investor',
      'UNQUALIFIED': 'Do not keep in touch',
      'CUSTOMER': 'Advisor',
      'EVANGELIST': 'Friend or Family'
    };
    
    return statusMap[hubspotStatus.toUpperCase()] || 'Professional Investor';
  }, []);
  
  // Helper function to map Hubspot score - wrapped in useCallback to prevent dependency warnings
  const mapHubspotScoreToOurScore = useCallback((hubspotScore) => {
    if (!hubspotScore) return 3; // Default to middle score
    
    const score = parseInt(hubspotScore, 10);
    if (isNaN(score)) return 3;
    
    // Map 0-100 scale to 1-5 scale
    if (score < 20) return 1;
    if (score < 40) return 2;
    if (score < 60) return 3;
    if (score < 80) return 4;
    return 5;
  }, []);
  
  // Function to map Hubspot contact properties to our data model - wrapped in useCallback
  const mapHubspotContactToOurModel = useCallback((hubspotContact, hubspotCompany) => {
    const properties = hubspotContact.properties;
    
    // Map Hubspot properties to our data model
    const contactData = {
      first_name: properties.firstname || '',
      last_name: properties.lastname || '',
      email: properties.email || '',
      email2: properties.work_email || '',
      email3: '', // Hubspot might not have a third email field
      mobile: properties.mobilephone || '',
      mobile2: properties.phone || '', // Using phone as secondary mobile
      linkedin: properties.linkedin_profile || '',
      // Map Hubspot lead status to our contact category if possible
      contact_category: mapHubspotStatusToCategory(properties.hs_lead_status),
      // Default to quarterly for keep in touch frequency
      keep_in_touch_frequency: properties.keep_in_touch_frequency || 'Quarterly',
      // Map Hubspot score to our score (assuming 0-100 scale)
      score: mapHubspotScoreToOurScore(properties.hubspot_score),
      // Additional fields
      city: properties.city || '',
      note: properties.about || '' // Using about field for notes
    };
    
    // If we have company data, prepare it for insertion/update
    let companyData = null;
    if (hubspotCompany) {
      const companyProperties = hubspotCompany.properties;
      companyData = {
        name: companyProperties.name || '',
        website: companyProperties.website || '',
        description: companyProperties.description || '',
        city: companyProperties.city || '',
        nation: companyProperties.country || '',
        category: companyProperties.industry || companyProperties.category || ''
      };
    }
    
    return {
      contactData,
      companyData
    };
  }, [mapHubspotStatusToCategory, mapHubspotScoreToOurScore]);

  // Updated handleSearchHubspot function to use real Hubspot API
  const handleSearchHubspot = useCallback(async (contact) => {
    if (!contact.first_name && !contact.last_name) {
      alert("Contact must have a name to search in Hubspot");
      return;
    }
    
    // Check if we're authenticated with Hubspot
    if (!hubspotAuthStatus.isAuthenticated) {
      alert("Not authenticated with Hubspot. Please check your API credentials.");
      return;
    }
    
    // Set loading state for this specific contact
    setHubspotLoading(prev => ({ ...prev, [contact.id]: true }));
    
    try {
      // Search for the contact in Hubspot
      const hubspotResult = await searchHubspotContact(contact);
      
      // Check if the contact was found and names match
      if (hubspotResult.found && hubspotResult.nameMatch) {
        // Map Hubspot data to our model
        const hubspotData = mapHubspotContactToOurModel(hubspotResult.contact, hubspotResult.company);
        
        // Update Supabase with the contact data from Hubspot
        const { error } = await supabase
          .from('contacts')
          .update({
            first_name: hubspotData.contactData.first_name || contact.first_name,
            last_name: hubspotData.contactData.last_name || contact.last_name,
            email: hubspotData.contactData.email || contact.email,
            email2: hubspotData.contactData.email2 || contact.email2,
            email3: hubspotData.contactData.email3 || contact.email3,
            mobile: hubspotData.contactData.mobile || contact.mobile,
            mobile2: hubspotData.contactData.mobile2 || contact.mobile2,
            linkedin: hubspotData.contactData.linkedin || contact.linkedin,
            contact_category: hubspotData.contactData.contact_category || contact.contact_category,
            keep_in_touch_frequency: hubspotData.contactData.keep_in_touch_frequency || contact.keep_in_touch_frequency,
            score: hubspotData.contactData.score || contact.score,
            city: hubspotData.contactData.city || contact.city,
            note: hubspotData.contactData.note || contact.note
          })
          .eq('id', contact.id);
        
        if (error) throw error;
        
        // If we have company data, update or create the company
        if (hubspotData.companyData) {
          // Check if the company already exists
          let companyId = null;
          
          if (hubspotData.companyData.website) {
            const { data: existingCompany } = await supabase
              .from('companies')
              .select('id')
              .eq('website', hubspotData.companyData.website)
              .maybeSingle();
              
            if (existingCompany) {
              // Update existing company
              companyId = existingCompany.id;
              await supabase
                .from('companies')
                .update(hubspotData.companyData)
                .eq('id', companyId);
            } else {
              // Create new company
              const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert(hubspotData.companyData)
                .select()
                .single();
                
              if (companyError) throw companyError;
              companyId = newCompany.id;
            }
            
            // Link the contact to the company
            if (companyId) {
              await supabase
                .from('contacts')
                .update({ company_id: companyId })
                .eq('id', contact.id);
            }
          }
        }
        
        // Refresh data to show updated contact
        await fetchData();
        
        alert(`Contact and company data updated from Hubspot for ${contact.first_name} ${contact.last_name}`);
      } else if (hubspotResult.found && !hubspotResult.nameMatch) {
        alert(`Found contact in Hubspot but names don't match for ${contact.first_name} ${contact.last_name}`);
      } else {
        alert(`No matching contact found in Hubspot for ${contact.first_name} ${contact.last_name}`);
      }
    } catch (error) {
      console.error("Error searching Hubspot:", error);
      alert(`Failed to search Hubspot: ${error.message}`);
    } finally {
      // Clear loading state for this contact
      setHubspotLoading(prev => ({ ...prev, [contact.id]: false }));
    }
  }, [fetchData, hubspotAuthStatus.isAuthenticated, mapHubspotContactToOurModel, searchHubspotContact]);

  return (
    <Container>
      {loading && (
        <LoadingOverlay>
          <p>Loading contacts...</p>
        </LoadingOverlay>
      )}
      <Header>
        <h2>Contacts Added in Last 30 Days</h2>
      </Header>
      {!loading && contacts.length === 0 ? (
        <p>No contacts found in the last 30 days.</p>
      ) : (
        <>
          <ContactTable>
            <TableHead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Tags</th>
                <th>Category</th>
                <th>Keep in Touch</th>
                <th>Score</th>
              </tr>
            </TableHead>
            <TableBody>
              {contacts.map(contact => (
                <tr key={contact.id}>
                  <td>
                    {contact.first_name || contact.last_name ? (
                      contact.linkedin ? (
                        <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#2d3748', textDecoration: 'none', fontWeight: '600' }}>
                          {`${contact.first_name || ''} ${contact.last_name || ''}`}
                        </a>
                      ) : (
                        <a
                          href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${contact.first_name || ''} ${contact.last_name || ''}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2d3748', textDecoration: 'none', fontWeight: '600' }}
                        >
                          {`${contact.first_name || ''} ${contact.last_name || ''}`}
                        </a>
                      )
                    ) : (
                      '-'
                    )}
                    <EditButton onClick={() => handleOpenContactEdit(contact)}>✎</EditButton>
                    <HubspotIcon 
                      onClick={() => handleSearchHubspot(contact)} 
                      title="Search in Hubspot and import data"
                    >
                      {hubspotLoading[contact.id] ? (
                        "..."
                      ) : (
                        <FontAwesomeIcon icon={faFire} />
                      )}
                    </HubspotIcon>
                    <MergeIcon onClick={() => handleOpenMerge(contact)}>⚏</MergeIcon>
                    {!contact.keep_in_touch_frequency && (
                      <SkipIcon onClick={() => handleSkipContact(contact.id)}>✕</SkipIcon>
                    )}
                  </td>
                  <td>
                    {contact.companies ? (
                      <div>
                        <a
                          href={
                            contact.companies.website
                              ? contact.companies.website.startsWith('http')
                                ? contact.companies.website
                                : `https://${contact.companies.website}`
                              : '#'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2d3748', textDecoration: 'none' }}
                        >
                          {contact.companies.name}
                        </a>
                        <EditButton onClick={() => handleEditCompany(contact)}>✎</EditButton>
                        <UnlinkButton onClick={() => handleUnlinkCompany(contact.id)}>✕</UnlinkButton>
                      </div>
                    ) : (
                      <div>
                        <CompanyInput
                          value={companySearchTerm[contact.id] || ''}
                          onChange={(e) => handleCompanySearch(contact.id, e.target.value)}
                          onKeyPress={(e) => handleCompanyCreateOnEnter(e, contact.id)}
                          placeholder="Add a company"
                        />
                        {companySuggestions[contact.id]?.length > 0 && (
                          <CompanyDropdown>
                            {companySuggestions[contact.id].map((company, index) => (
                              <CompanyOption
                                key={index}
                                onClick={() => handleCompanySelect(contact.id, company)}
                              >
                                {company.name}
                              </CompanyOption>
                            ))}
                          </CompanyDropdown>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {contact.email ? (
                      <>
                        <a
                          href={`mailto:${contact.email}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2d3748', textDecoration: 'none' }}
                          title={contact.email}
                        >
                          <FontAwesomeIcon icon={faEnvelope} />
                        </a>
                        <EmailButton>
                          <a 
                            href={`https://mail.superhuman.com/search/${encodeURIComponent(
                              (contact.first_name || contact.last_name) 
                                ? `${contact.first_name || ''} ${contact.last_name || ''}` 
                                : contact.email
                            )}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="Search in Superhuman"
                          >
                            <FontAwesomeIcon icon={faSearch} />
                          </a>
                        </EmailButton>
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {contact.mobile ? (
                      <a 
                        href={`https://wa.me/${contact.mobile.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ color: '#25D366', textDecoration: 'none' }}
                        title={`Chat on WhatsApp (${contact.mobile})`}
                      >
                        <FontAwesomeIcon icon={faWhatsapp} />
                      </a>
                    ) : (
                      <a
                        href={`https://app.timelines.ai/search/?s=${encodeURIComponent(`${contact.first_name || ''} ${contact.last_name || ''}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2d3748', textDecoration: 'none' }}
                        title="Search contact on Timelines.ai"
                      >
                        Search
                      </a>
                    )}
                  </td>
                  <td>
                    <TagsContainer>
                      {contactTags[contact.id]?.map(tag => (
                        <Tag key={tag.id} color={tag.color}>
                          {tag.name}
                          <TagDeleteButton onClick={() => handleRemoveTag(contact.id, tag.id)}>×</TagDeleteButton>
                        </Tag>
                      ))}
                      {isAddingTag[contact.id] ? (
                        <div style={{ position: 'relative' }}>
                          <TagInput
                            value={tagInput[contact.id] || ''}
                            onChange={(e) => handleTagInputChange(contact.id, e.target.value)}
                            onKeyDown={(e) => handleTagInputKeyDown(e, contact.id)}
                            placeholder="Type to search or create..."
                            autoFocus
                            onBlur={() => {
                              // Small delay to allow clicking on suggestions
                              setTimeout(() => {
                                setIsAddingTag(prev => ({ ...prev, [contact.id]: false }));
                                setTagSuggestions(prev => ({ ...prev, [contact.id]: [] }));
                              }, 200);
                            }}
                          />
                          {tagSuggestions[contact.id]?.length > 0 && (
                            <TagDropdown>
                              {tagSuggestions[contact.id].map(tag => (
                                <TagOption 
                                  key={tag.id} 
                                  onClick={() => handleTagSelect(contact.id, tag)}
                                >
                                  {tag.name}
                                </TagOption>
                              ))}
                            </TagDropdown>
                          )}
                        </div>
                      ) : (
                        <AddTagButton onClick={() => handleAddTagClick(contact.id)} title="Add tag">
                          <FontAwesomeIcon icon={faPlus} />
                        </AddTagButton>
                      )}
                    </TagsContainer>
                  </td>
                  <td>
                    <Select
                      value={contact.contact_category || ''}
                      onChange={(e) => {
                        const newCategory = e.target.value;
                        const updateCategory = async () => {
                          try {
                            const { error } = await supabase
                              .from('contacts')
                              .update({ contact_category: newCategory || null })
                              .eq('id', contact.id);
                            if (error) throw error;
                            setContacts(prev => prev.map(c =>
                              c.id === contact.id ? { ...c, contact_category: newCategory || null } : c
                            ));
                          } catch (error) {
                            alert('Failed to update category');
                          }
                        };
                        updateCategory();
                      }}
                    >
                      <option value="">Missing</option>
                      {CONTACT_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </Select>
                  </td>
                  <td>
                    {contact.keep_in_touch_frequency ? (
                      <Select
                        value={contact.keep_in_touch_frequency}
                        onChange={(e) => {
                          const newFrequency = e.target.value;
                          const updateFrequency = async () => {
                            try {
                              const { error } = await supabase
                                .from('contacts')
                                .update({ keep_in_touch_frequency: newFrequency || null })
                                .eq('id', contact.id);
                              if (error) throw error;
                              setContacts(prev => prev.map(c =>
                                c.id === contact.id ? { ...c, keep_in_touch_frequency: newFrequency || null } : c
                              ));
                            } catch (error) {
                              alert('Failed to update keep in touch frequency');
                            }
                          };
                          updateFrequency();
                        }}
                      >
                        <option value="">Select Frequency</option>
                        {KEEP_IN_TOUCH_FREQUENCIES.map(frequency => (
                          <option key={frequency} value={frequency}>{frequency}</option>
                        ))}
                      </Select>
                    ) : (
                      <Select
                        value=""
                        onChange={(e) => {
                          const newFrequency = e.target.value;
                          const updateFrequency = async () => {
                            try {
                              const { error } = await supabase
                                .from('contacts')
                                .update({ keep_in_touch_frequency: newFrequency || null })
                                .eq('id', contact.id);
                              if (error) throw error;
                              setContacts(prev => prev.map(c =>
                                c.id === contact.id ? { ...c, keep_in_touch_frequency: newFrequency || null } : c
                              ));
                            } catch (error) {
                              alert('Failed to update keep in touch frequency');
                            }
                          };
                          updateFrequency();
                        }}
                      >
                        <option value="">Missing</option>
                        {KEEP_IN_TOUCH_FREQUENCIES.map(frequency => (
                          <option key={frequency} value={frequency}>{frequency}</option>
                        ))}
                      </Select>
                    )}
                  </td>
                  <td>
                    <StarContainer>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          filled={contact.score >= star}
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('contacts')
                                .update({ score: star })
                                .eq('id', contact.id);
                              if (error) throw error;
                              setContacts(prev => prev.map(c =>
                                c.id === contact.id ? { ...c, score: star } : c
                              ));
                            } catch (error) {
                              alert('Failed to update score');
                            }
                          }}
                        >
                          ★
                        </Star>
                      ))}
                    </StarContainer>
                  </td>
                </tr>
              ))}
            </TableBody>
          </ContactTable>
          <PaginationControls>
            <PageButton onClick={goToFirstPage} disabled={currentPage === 0}>First</PageButton>
            <PageButton onClick={goToPreviousPage} disabled={currentPage === 0}>Previous</PageButton>
            <span>
              Page {currentPage + 1} of {totalPages > 0 ? totalPages : 1} (Total: {totalCount})
            </span>
            <PageButton onClick={goToNextPage} disabled={currentPage >= totalPages - 1}>Next</PageButton>
            <PageButton onClick={goToLastPage} disabled={currentPage >= totalPages - 1}>Last</PageButton>
          </PaginationControls>
        </>
      )}

      {showMergeModal && selectedContact && (
        <Modal>
          <MergeModalContent hasTarget={!!targetContact}>
            <ModalHeader>
              <h2>Merge Contacts</h2>
              <CloseButton onClick={() => setShowMergeModal(false)}>×</CloseButton>
            </ModalHeader>
            
            {!targetContact && (
              <SearchContainer>
                <Label>Search for a contact to merge with:</Label>
                <SearchInput
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  placeholder="Type to search..."
                />
                {searchResults.length > 0 && (
                  <SearchResults>
                    {searchResults.map(contact => (
                      <SearchResultItem key={contact.id} onClick={() => handleSelectTarget(contact)}>
                        {`${contact.first_name || ''} ${contact.last_name || ''}`} - {contact.email || 'No email'}
                      </SearchResultItem>
                    ))}
                  </SearchResults>
                )}
              </SearchContainer>
            )}

            {targetContact && (
              <>
                <MergeFormGrid>
                  <MergeFormColumn>
                    <MergeFormSection>
                      <MergeSectionTitle>Original Contact (Will be updated)</MergeSectionTitle>
                      <FormGroup>
                        <Label>First Name</Label>
                        <Input
                          type="text"
                          value={mergedData.first_name || ''}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>Last Name</Label>
                        <Input
                          type="text"
                          value={mergedData.last_name || ''}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>Primary Email</Label>
                        <Input
                          type="email"
                          value={mergedData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>Secondary Email</Label>
                        <Input
                          type="email"
                          value={mergedData.email2 || ''}
                          onChange={(e) => handleInputChange('email2', e.target.value)}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>Third Email</Label>
                        <Input
                          type="email"
                          value={mergedData.email3 || ''}
                          onChange={(e) => handleInputChange('email3', e.target.value)}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>Mobile</Label>
                        <Input
                          type="text"
                          value={mergedData.mobile || ''}
                          onChange={(e) => handleInputChange('mobile', e.target.value)}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>LinkedIn</Label>
                        <Input
                          type="text"
                          value={mergedData.linkedin || ''}
                          onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>Category</Label>
                        <Select
                          value={mergedData.contact_category || ''}
                          onChange={(e) => handleInputChange('contact_category', e.target.value)}
                        >
                          <option value="">Select Category</option>
                          {CONTACT_CATEGORIES.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </Select>
                      </FormGroup>
                      <FormGroup>
                        <Label>Keep in Touch</Label>
                        <Select
                          value={mergedData.keep_in_touch_frequency || ''}
                          onChange={(e) => handleInputChange('keep_in_touch_frequency', e.target.value)}
                        >
                          <option value="">Select Frequency</option>
                          {KEEP_IN_TOUCH_FREQUENCIES.map(frequency => (
                            <option key={frequency} value={frequency}>{frequency}</option>
                          ))}
                        </Select>
                      </FormGroup>
                    </MergeFormSection>
                  </MergeFormColumn>

                  <MergeFormColumn>
                    <MergeFormSection>
                      <MergeSectionTitle>Duplicate Contact (Will be deleted)</MergeSectionTitle>
                      <FormGroup style={{ position: 'relative' }}>
                        <Label>First Name</Label>
                        <Input
                          type="text"
                          value={targetContact.first_name || ''}
                          disabled
                          style={{ backgroundColor: '#f3f4f6' }}
                        />
                        {targetContact.first_name && (
                          <TransferArrow 
                            onClick={() => handleInputChange('first_name', targetContact.first_name)}
                            title="Copy to original contact"
                          >
                            ←
                          </TransferArrow>
                        )}
                      </FormGroup>
                      <FormGroup style={{ position: 'relative' }}>
                        <Label>Last Name</Label>
                        <Input
                          type="text"
                          value={targetContact.last_name || ''}
                          disabled
                          style={{ backgroundColor: '#f3f4f6' }}
                        />
                        {targetContact.last_name && (
                          <TransferArrow 
                            onClick={() => handleInputChange('last_name', targetContact.last_name)}
                            title="Copy to original contact"
                          >
                            ←
                          </TransferArrow>
                        )}
                      </FormGroup>
                      <FormGroup style={{ position: 'relative' }}>
                        <Label>Primary Email</Label>
                        <Input
                          type="email"
                          value={targetContact.email || ''}
                          disabled
                          style={{ backgroundColor: '#f3f4f6' }}
                        />
                        {targetContact.email && (
                          <TransferArrow 
                            onClick={() => handleInputChange('email', targetContact.email)}
                            title="Copy to original contact"
                          >
                            ←
                          </TransferArrow>
                        )}
                      </FormGroup>
                      <FormGroup style={{ position: 'relative' }}>
                        <Label>Secondary Email</Label>
                        <Input
                          type="email"
                          value={targetContact.email2 || ''}
                          disabled
                          style={{ backgroundColor: '#f3f4f6' }}
                        />
                        {targetContact.email2 && (
                          <TransferArrow 
                            onClick={() => handleInputChange('email2', targetContact.email2)}
                            title="Copy to original contact"
                          >
                            ←
                          </TransferArrow>
                        )}
                      </FormGroup>
                      <FormGroup style={{ position: 'relative' }}>
                        <Label>Third Email</Label>
                        <Input
                          type="email"
                          value={targetContact.email3 || ''}
                          disabled
                          style={{ backgroundColor: '#f3f4f6' }}
                        />
                        {targetContact.email3 && (
                          <TransferArrow 
                            onClick={() => handleInputChange('email3', targetContact.email3)}
                            title="Copy to original contact"
                          >
                            ←
                          </TransferArrow>
                        )}
                      </FormGroup>
                      <FormGroup style={{ position: 'relative' }}>
                        <Label>Mobile</Label>
                        <Input
                          type="text"
                          value={targetContact.mobile || ''}
                          disabled
                          style={{ backgroundColor: '#f3f4f6' }}
                        />
                        {targetContact.mobile && (
                          <TransferArrow 
                            onClick={() => handleInputChange('mobile', targetContact.mobile)}
                            title="Copy to original contact"
                          >
                            ←
                          </TransferArrow>
                        )}
                      </FormGroup>
                      <FormGroup>
                        <Label>LinkedIn</Label>
                        <Input
                          type="text"
                          value={targetContact.linkedin || ''}
                          disabled
                          style={{ backgroundColor: '#f3f4f6' }}
                        />
                        {targetContact.linkedin && (
                          <TransferArrow 
                            onClick={() => handleInputChange('linkedin', targetContact.linkedin)}
                            title="Copy to original contact"
                          >
                            ←
                          </TransferArrow>
                        )}
                      </FormGroup>
                      <FormGroup>
                        <Label>Category</Label>
                        <Input
                          type="text"
                          value={targetContact.contact_category || ''}
                          disabled
                          style={{ backgroundColor: '#f3f4f6' }}
                        />
                        {targetContact.contact_category && (
                          <TransferArrow 
                            onClick={() => handleInputChange('contact_category', targetContact.contact_category)}
                            title="Copy to original contact"
                          >
                            ←
                          </TransferArrow>
                        )}
                      </FormGroup>
                      <FormGroup>
                        <Label>Keep in Touch</Label>
                        <Input
                          type="text"
                          value={targetContact.keep_in_touch_frequency || ''}
                          disabled
                          style={{ backgroundColor: '#f3f4f6' }}
                        />
                        {targetContact.keep_in_touch_frequency && (
                          <TransferArrow 
                            onClick={() => handleInputChange('keep_in_touch_frequency', targetContact.keep_in_touch_frequency)}
                            title="Copy to original contact"
                          >
                            ←
                          </TransferArrow>
                        )}
                      </FormGroup>
                    </MergeFormSection>
                  </MergeFormColumn>
                </MergeFormGrid>

                <ButtonGroup>
                  <Button onClick={() => {
                    setShowMergeModal(false);
                    setSelectedContact(null);
                    setTargetContact(null);
                    setMergedData({});
                    setSearchTerm('');
                    setSearchResults([]);
                  }}>
                    Cancel
                  </Button>
                  <Button primary onClick={handleMerge}>Merge Contacts</Button>
                </ButtonGroup>
              </>
            )}
          </MergeModalContent>
        </Modal>
      )}

{showCompanyModal && (
  <Modal>
    <ModalContent>
      <ModalHeader>
        <h2>Add/Edit Company</h2>
        <CloseButton onClick={() => setShowCompanyModal(false)}>×</CloseButton>
      </ModalHeader>
      
      <ContactDetailsSection>
        <SectionTitle>Contact Details</SectionTitle>
        <ContactDetailsGrid>
          <ContactDetailItem>
            <span className="label">Name:</span>
            {currentContact?.first_name} {currentContact?.last_name}
          </ContactDetailItem>
          <ContactDetailItem>
            <span className="label">Email:</span>
            {currentContact?.email}
          </ContactDetailItem>
        </ContactDetailsGrid>
      </ContactDetailsSection>

      <div style={{ padding: '0 1.5rem' }}>
        <SectionTitle>Company Information</SectionTitle>
      </div>
      
      <CompanyForm>
        <FormGroup>
          <Label htmlFor="company-name">Company Name</Label>
          <Input
            id="company-name"
            type="text"
            value={companyData.name}
            onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter company name"
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="text"
            value={companyData.website}
            onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="e.g., company.com"
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={companyData.category}
            onChange={(e) => setCompanyData(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">Select Category</option>
            {COMPANY_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            type="text"
            value={companyData.city}
            onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Enter city"
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="nation">Country</Label>
          <Input
            id="nation"
            type="text"
            value={companyData.nation}
            onChange={(e) => setCompanyData(prev => ({ ...prev, nation: e.target.value }))}
            placeholder="Enter country"
          />
        </FormGroup>
        
        <FormGroup className="full-width">
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            value={companyData.description}
            onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter company description"
          />
        </FormGroup>
      </CompanyForm>
      
      <ButtonGroup>
        <Button onClick={() => setShowCompanyModal(false)}>Cancel</Button>
        <Button primary onClick={handleSaveCompany}>Save Company</Button>
      </ButtonGroup>
    </ModalContent>
  </Modal>
)}

      {showContactEditModal && editingContact && (
        <Modal>
          <ModalContent narrow>
            <ModalHeader>
              <h2>Edit Contact</h2>
              <CloseButton onClick={() => setShowContactEditModal(false)}>×</CloseButton>
            </ModalHeader>
            <EditContactForm>
              <FormGroup>
                <Label>First Name</Label>
                <Input
                  type="text"
                  value={contactEditData.first_name}
                  onChange={(e) => handleContactInputChange('first_name', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  value={contactEditData.last_name}
                  onChange={(e) => handleContactInputChange('last_name', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Contact Category</Label>
                <Select
                  value={contactEditData.contact_category}
                  onChange={(e) => handleContactInputChange('contact_category', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {CONTACT_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Mobile</Label>
                <Input
                  type="text"
                  value={contactEditData.mobile}
                  onChange={(e) => handleContactInputChange('mobile', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Mobile 2</Label>
                <Input
                  type="text"
                  value={contactEditData.mobile2}
                  onChange={(e) => handleContactInputChange('mobile2', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={contactEditData.email}
                  onChange={(e) => handleContactInputChange('email', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Email 2</Label>
                <Input
                  type="email"
                  value={contactEditData.email2}
                  onChange={(e) => handleContactInputChange('email2', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Email 3</Label>
                <Input
                  type="email"
                  value={contactEditData.email3}
                  onChange={(e) => handleContactInputChange('email3', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>LinkedIn</Label>
                <Input
                  type="text"
                  value={contactEditData.linkedin}
                  onChange={(e) => handleContactInputChange('linkedin', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Keep in Touch Frequency</Label>
                <Select
                  value={contactEditData.keep_in_touch_frequency}
                  onChange={(e) => handleContactInputChange('keep_in_touch_frequency', e.target.value)}
                >
                  <option value="">Select Frequency</option>
                  {KEEP_IN_TOUCH_FREQUENCIES.map(frequency => (
                    <option key={frequency} value={frequency}>{frequency}</option>
                  ))}
                </Select>
              </FormGroup>
            </EditContactForm>
            <ButtonGroup>
              <Button onClick={() => setShowContactEditModal(false)}>Cancel</Button>
              <Button primary onClick={handleSaveContactEdit}>Save</Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
      {!hubspotAuthStatus.isAuthenticated && !hubspotAuthStatus.isLoading && (
        <div style={{ 
          background: '#FEF2F2', 
          color: '#B91C1C', 
          padding: '0.5rem 1rem', 
          borderRadius: '0.375rem',
          margin: '0 0 1rem 0',
          fontSize: '0.875rem'
        }}>
          Hubspot integration is not configured: {hubspotAuthStatus.error}
        </div>
      )}
    </Container>
  );
};

export default RecentContactsList;
