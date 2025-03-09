import React, { useState, useMemo, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp, faHubspot } from '@fortawesome/free-brands-svg-icons';
// eslint-disable-next-line no-unused-vars
import { faEnvelope, faSearch, faPlus, faSpinner, faPhone, faLocationDot, faArrowUpRightFromSquare, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
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
  margin-bottom: 24px;
  
  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .counter {
    color: #6b7280;
    font-weight: normal;
  }
`;

// Add or update these styled components to make the table responsive

// Add this table wrapper component that will handle the horizontal scrolling
const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1rem;
  
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
`;

// Update the ContactTable to have a minimum width
const ContactTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 1rem;
  min-width: 900px; // Ensures minimum width for all columns
`;

// Add styles for icon columns to ensure they don't wrap
const IconCell = styled.td`
  white-space: nowrap;
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

const ContactNameWrapper = styled.div`
  position: relative;
  display: inline-block;
  
  &:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
`;

const Tooltip = styled.div`
  visibility: hidden;
  position: absolute;
  z-index: 100;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1f2937;
  color: white;
  text-align: center;
  padding: 8px 12px;
  border-radius: 6px;
  width: max-content;
  max-width: 250px;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 0.8rem;
  
  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #1f2937 transparent transparent transparent;
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

// Utility function to format phone numbers
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  console.log(`Formatting phone number: "${phoneNumber}"`);
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  console.log(`After removing non-digits: "${cleaned}"`);
  
  // Always add a + prefix to the cleaned number
  const formatted = `+${cleaned}`;
  console.log(`Final formatted number: "${formatted}"`);
  
  return formatted;
};

// Utility function to format LinkedIn URLs
const formatLinkedInUrl = (url) => {
  if (!url) return '';
  
  console.log(`Formatting LinkedIn URL: "${url}"`);
  
  // Don't process email addresses
  if (url.includes('@')) {
    console.log('Input appears to be an email, not formatting as LinkedIn URL');
    return '';
  }
  
  // Check if it's already properly formatted with https://www.linkedin.com/in/
  if (url.startsWith('https://www.linkedin.com/in/')) {
    console.log('LinkedIn URL already properly formatted');
    return url;
  }
  
  let username = '';
  
  // Extract username from different possible formats
  if (url.includes('linkedin.com/in/')) {
    // Extract username from linkedin.com/in/ format
    const parts = url.split('linkedin.com/in/')[1];
    if (parts) {
      username = parts.split('/')[0].split('?')[0].trim();
    }
  } else if (url.includes('/')) {
    // URL contains slashes but not in the linkedin.com/in/ format
    // Consider it not a valid LinkedIn URL
    console.log('Not a recognized LinkedIn URL format');
    return '';
  } else {
    // Assume it's just the username
    username = url.trim();
  }
  
  // If we have a valid username, format the URL
  if (username) {
    const formatted = `https://www.linkedin.com/in/${username}`;
    console.log(`Reformatted LinkedIn URL: "${formatted}"`);
    return formatted;
  }
  
  // If we couldn't extract a valid username, return empty string
  console.log('Could not extract a valid LinkedIn username');
  return '';
};

// Utility function to format website URLs
const formatWebsiteUrl = (url) => {
  if (!url) return '';
  
  console.log(`Formatting website URL: "${url}"`);
  
  // Don't process email addresses
  if (url.includes('@')) {
    console.log('Input appears to be an email, not formatting as website URL');
    return '';
  }
  
  // Remove any protocol (http://, https://, etc.)
  let domain = url.replace(/^(https?:\/\/)?(www\.)?/i, '');
  
  // Remove any path, query parameters, or hash
  domain = domain.split('/')[0].split('?')[0].split('#')[0];
  
  // Remove trailing dots and extra spaces
  domain = domain.replace(/\.$/, '').trim();
  
  if (!domain) {
    console.log('Could not extract a valid domain');
    return '';
  }
  
  // Format as www.domain.com
  const formatted = `www.${domain.replace(/^www\./i, '')}`;
  console.log(`Reformatted website URL: "${formatted}"`);
  return formatted;
};

// Add a new styled component for the filter buttons
// const FilterButtonsContainer = styled.div`...`;
// const FilterButton = styled.button`...`;

// Remove these styled components:
// const FilterButtonsContainer = styled.div`...`;
// const FilterButton = styled.button`...`;

// Keep other styled components, then in the component:

const RecentContactsList = ({ 
  defaultShowAll = false,
  defaultFilter = 'all'
}) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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
  const [error, setError] = useState(null);
  
  // Update to ensure defaultShowAll is respected
  const [showRecentOnly, setShowRecentOnly] = useState(!defaultShowAll);

  // Add state for tracking the current filter
  const [currentFilter, setCurrentFilter] = useState(defaultFilter);
  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    today: 0,
    recent: 0,
    missing: 0
  });

  const getLastThirtyDaysRange = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    return { start: thirtyDaysAgo.toISOString(), end: now.toISOString() };
  }, []);

  const getLastSevenDaysRange = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    // Format as YYYY-MM-DD for Supabase comparison
    const formattedDate = sevenDaysAgo.toISOString().split('T')[0];
    return formattedDate;
  }, []);

  const getTodayDate = useMemo(() => {
    const today = new Date();
    // Format as YYYY-MM-DD for Supabase comparison
    return today.toISOString().split('T')[0];
  }, []);

  const getThirtyDaysAgoDate = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Format as YYYY-MM-DD for Supabase comparison
    return thirtyDaysAgo.toISOString().split('T')[0];
  }, []);

  const rowsPerPage = useMemo(() => 50, []);

  const fetchData = useCallback(async () => {
    console.log('Fetching all contacts and doing client-side sorting');
    setLoading(true);
    setError(null);
    
    try {
      // Build the basic query with only filtering, no sorting
      let query = supabase
        .from('contacts')
        .select('*, companies(*)', { count: 'exact' })
        .neq('contact_category', 'Skip')
        .neq('email', 'simone@cimminelli.com');
      
      // Apply specific filters based on the page we're on
      if (currentFilter === 'today') {
        query = query.gte('last_interaction', getTodayDate);
      } else if (currentFilter === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.gte('created_at', oneWeekAgo.toISOString());
      } else if (currentFilter === 'missing') {
        query = query.or('first_name.is.null,last_name.is.null,keep_in_touch_frequency.is.null');
      } else if (currentFilter === 'keepintouch') {
        query = query.not('keep_in_touch_frequency', 'is', null);
      } else if (showRecentOnly) {
        query = query.gte('last_interaction', getTodayDate);
      }
      
      // Execute the query WITHOUT any sorting
      console.log('Executing Supabase query WITHOUT sorting...');
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log(`Retrieved ${data?.length || 0} contacts out of ${count || 0} total`);
      
      // Now do the sorting client-side
      let sortedContacts = [...(data || [])];
      
      // Custom sort function based on the page we're on
      if (currentFilter === 'all' || currentFilter === 'today' || showRecentOnly) {
        console.log('Sorting by last_interaction on client side');
        
        // First, log some sample data to debug
        if (sortedContacts.length > 0) {
          console.log('Sample last_interaction values before sorting:');
          sortedContacts.slice(0, 5).forEach(contact => {
            console.log(`ID: ${contact.id}, last_interaction: ${contact.last_interaction}, type: ${typeof contact.last_interaction}`);
          });
        }
        
        // Sort by last_interaction date (most recent first)
        sortedContacts.sort((a, b) => {
          // Handle null values
          if (!a.last_interaction && !b.last_interaction) return 0;
          if (!a.last_interaction) return 1; // Nulls last
          if (!b.last_interaction) return -1;
          
          // Parse dates and compare (most recent first)
          const dateA = new Date(a.last_interaction);
          const dateB = new Date(b.last_interaction);
          
          return dateB - dateA;
        });
        
        // Log results after sorting
        if (sortedContacts.length > 0) {
          console.log('Sample last_interaction values AFTER sorting:');
          sortedContacts.slice(0, 5).forEach(contact => {
            console.log(`ID: ${contact.id}, last_interaction: ${contact.last_interaction}`);
          });
          
          console.log('Last 5 contacts after sorting:');
          sortedContacts.slice(-5).forEach(contact => {
            console.log(`ID: ${contact.id}, last_interaction: ${contact.last_interaction}`);
          });
        }
      } else if (currentFilter === 'recent') {
        // Sort by created_at (most recent first)
        sortedContacts.sort((a, b) => {
          if (!a.created_at && !b.created_at) return 0;
          if (!a.created_at) return 1;
          if (!b.created_at) return -1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
      } else if (currentFilter === 'keepintouch') {
        // Sort by keep_in_touch_frequency
        sortedContacts.sort((a, b) => {
          if (!a.keep_in_touch_frequency && !b.keep_in_touch_frequency) return 0;
          if (!a.keep_in_touch_frequency) return 1;
          if (!b.keep_in_touch_frequency) return -1;
          return a.keep_in_touch_frequency.localeCompare(b.keep_in_touch_frequency);
        });
      }
      
      // Apply pagination to the sorted contacts
      const from = currentPage * rowsPerPage;
      const to = Math.min(from + rowsPerPage, sortedContacts.length);
      const paginatedContacts = sortedContacts.slice(from, to);
      
      console.log(`Showing contacts ${from+1} to ${to} out of ${sortedContacts.length}`);
      
      // Update state with sorted and paginated contacts
      setContacts(paginatedContacts);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / rowsPerPage));
      
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError(error.message);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [currentFilter, currentPage, rowsPerPage, showRecentOnly, getTodayDate, getThirtyDaysAgoDate]);

  // Make sure fetchData runs when component mounts
  useEffect(() => {
    console.log('Initial data fetch with defaultShowAll:', defaultShowAll);
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

  // Helper function to save company data - wrapped in useCallback to prevent dependency warnings
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSaveCompany = useCallback(async () => {
    try {
      // Format the website URL before saving
      const formattedWebsite = formatWebsiteUrl(companyData.website);
      const updatedCompanyData = {
        ...companyData,
        website: formattedWebsite
      };
      
      // Check if a company with the same formatted website already exists
      const { data: existingByWebsite, error: websiteError } = await supabase
        .from('companies')
        .select('*')
        .ilike('website', `%${formattedWebsite.replace(/^www\./i, '')}%`);

      if (websiteError) throw websiteError;
      
      let companyId;
      
      if (existingByWebsite && existingByWebsite.length > 0) {
        // Company with similar website exists
        const existingCompany = existingByWebsite[0];
        console.log(`Found existing company with similar website: ${existingCompany.name} (${existingCompany.website})`);
        
        // Confirm with user if they want to update the existing company or create a new one
        if (window.confirm(`A company with a similar website already exists (${existingCompany.name}). Do you want to update it instead of creating a new one?`)) {
        await supabase
          .from('companies')
            .update(updatedCompanyData)
          .eq('id', existingCompany.id);
        companyId = existingCompany.id;
          console.log(`Updated existing company: ${existingCompany.name}`);
      } else {
          // User chose to create a new company despite the duplicate
        const { data: newCompany } = await supabase
          .from('companies')
            .insert(updatedCompanyData)
          .select()
          .single();
        companyId = newCompany.id;
          console.log(`Created new company despite duplicate: ${newCompany.name}`);
        }
      } else {
        // No duplicate website found, proceed with normal flow
        const { data: newCompany } = await supabase
          .from('companies')
          .insert(updatedCompanyData)
          .select()
          .single();
        companyId = newCompany.id;
        console.log(`Created new company: ${newCompany.name}`);
      }
      
      await supabase
        .from('contacts')
        .update({ company_id: companyId })
        .eq('id', currentContact.id);
        
      fetchData();
      setShowCompanyModal(false);
    } catch (error) {
      console.error('Failed to save company:', error);
      alert('Failed to save company: ' + error.message);
    }
  }, [companyData, currentContact, fetchData, formatWebsiteUrl]);

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

  const goToFirstPage = () => {
    setCurrentPage(0);
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages - 1);
  };

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
      keep_in_touch_frequency: contact.keep_in_touch_frequency || '',
      about_the_contact: contact.about_the_contact || ''
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
      
      // Skip HubSpot authentication in local development
      if (window.location.hostname === 'localhost') {
        console.log('Running in local development - skipping HubSpot authentication');
        setHubspotAuthStatus({
          isAuthenticated: false,
          isLoading: false,
          error: "HubSpot authentication skipped in local development"
        });
        return;
      }
      
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
        // Don't throw an error, just log it
        console.error(`HubSpot authentication failed: ${error.response?.status || error.message}`);
      }
    };
    
    // Check HubSpot authentication if not in local development
    const isLocalDevelopment = window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1';
    
    if (!isLocalDevelopment) {
      checkHubspotAuth();
    } else {
      console.log('Running in local development - skipping HubSpot authentication check');
      setHubspotAuthStatus({
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  }, []);

  // Function to search for a contact in Hubspot - wrapped in useCallback
  const searchHubspotContact = useCallback(async (contact) => {
    // Implementation
  }, []);

  return (
    <Container>
      {loading && (
        <LoadingOverlay>
          <p>Loading contacts...</p>
        </LoadingOverlay>
      )}
      
      <Header>
        <h2>
          {!loading && totalCount > 0 && (
            <span className="counter">({totalCount})</span>
          )}
        </h2>
      </Header>
      
      {error && (
        <div style={{ 
          background: '#FEF2F2', 
          color: '#B91C1C', 
          padding: '1rem', 
          borderRadius: '0.375rem',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          <strong>Error loading contacts:</strong> {error}
        </div>
      )}
      
      {!loading && contacts.length === 0 ? (
        <p>No contacts found.</p>
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
                      <span style={{ fontWeight: '600' }}>
                        {`${contact.first_name || ''} ${contact.last_name || ''}`}
                      </span>
                    ) : (
                      <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>No name</span>
                    )}
                  </td>
                  <td>
                    {contact.companies ? (
                      <span>{contact.companies.name}</span>
                    ) : (
                      <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>No company</span>
                    )}
                  </td>
                  <td>{contact.email || <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>No email</span>}</td>
                  <td>{contact.mobile || <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>No mobile</span>}</td>
                  <td>
                    {contactTags[contact.id]?.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {contactTags[contact.id].map(tag => (
                          <Tag key={tag.id} color="#e5e7eb">
                            {tag.name}
                          </Tag>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>No tags</span>
                    )}
                  </td>
                  <td>{contact.contact_category || <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>Not set</span>}</td>
                  <td>{contact.keep_in_touch_frequency || <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>Not set</span>}</td>
                  <td>
                    <StarContainer>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          filled={star <= (contact.score || 0)}
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
          
          {totalPages > 1 && (
            <PaginationControls>
              <PageButton onClick={goToFirstPage} disabled={currentPage === 0}>First</PageButton>
              <PageButton onClick={goToPrevPage} disabled={currentPage === 0}>Previous</PageButton>
              <div style={{ margin: '0 1rem' }}>
                Page {currentPage + 1} of {totalPages}
              </div>
              <PageButton onClick={goToNextPage} disabled={currentPage === totalPages - 1}>Next</PageButton>
              <PageButton onClick={goToLastPage} disabled={currentPage === totalPages - 1}>Last</PageButton>
            </PaginationControls>
          )}
        </>
      )}
    </Container>
  );
};

export default RecentContactsList;
  