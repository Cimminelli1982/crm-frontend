import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { AgGridReact } from '../../ag-grid-setup';
import ContactsInteractionModal from '../../components/modals/ContactsInteractionModal';
import DealViewFindAddModal from '../../components/modals/DealViewFindAddModal';
import LinkedinSearchOpenEnrich from '../../components/modals/Linkedin-Search-Open-Enrich';
import { FiMail, FiLinkedin, FiDollarSign } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

// Styled components - Updated to match ContactsListTable
const Container = styled.div`
  height: calc(100vh - 60px);
  width: 100%;
  padding: 0 5px 0 0;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
  position: relative;
`;

const Title = styled.h1`
  color: #00ff00;
  margin-bottom: 20px;
  font-family: 'Courier New', monospace;
  font-size: 24px;
  padding: 20px;
`;

const ErrorText = styled.div`
  color: #ff3333;
  background-color: #330000;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const LoadingContainer = styled.div`
  color: #00ff00;
  text-align: center;
  padding: 40px;
  font-family: monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
`;

const LoadingBar = styled.div`
  width: 300px;
  height: 8px;
  background-color: #111;
  margin: 20px 0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 30%;
    background-color: #00ff00;
    animation: pulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 20px #00ff00;
    border-radius: 4px;
  }
  
  @keyframes pulse {
    0% {
      left: -30%;
      opacity: 0.8;
    }
    100% {
      left: 100%;
      opacity: 0.2;
    }
  }
`;

const LoadingText = styled.div`
  margin-top: 15px;
  color: #00ff00;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
  letter-spacing: 1px;
  font-size: 16px;
  opacity: 0.9;
  animation: blink 1.5s ease-in-out infinite alternate;
  
  @keyframes blink {
    from { opacity: 0.6; }
    to { opacity: 1; }
  }
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

const SimpleKeepInTouch = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [selectedContactForModal, setSelectedContactForModal] = useState(null);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState({});
  const [showDealModal, setShowDealModal] = useState(false);
  const [selectedContactForDeal, setSelectedContactForDeal] = useState(null);
  const [showLinkedInSearchModal, setShowLinkedInSearchModal] = useState(false);
  const [selectedContactForLinkedIn, setSelectedContactForLinkedIn] = useState(null);
  const [showSnoozeDaysInput, setShowSnoozeDaysInput] = useState({});
  const navigate = useNavigate();
  
  // Handler for saving LinkedIn data from the modal
  const handleSaveLinkedInData = async (linkedInData) => {
    try {
      if (!selectedContactForLinkedIn) return;
      
      // Update contact information
      const contactUpdates = {
        job_role: linkedInData.jobRole,
        linkedin: selectedContactForLinkedIn.linkedin || linkedInData.linkedinUrl,
        last_modified_at: new Date().toISOString(),
        last_modified_by: 'User'
      };
      
      // Update the contact record
      const { error: contactError } = await supabase
        .from('contacts')
        .update(contactUpdates)
        .eq('contact_id', selectedContactForLinkedIn.contact_id);
        
      if (contactError) throw contactError;
      
      // Check if we need to create or update a company
      if (linkedInData.company) {
        // First check if company already exists with this name
        const { data: existingCompanies, error: companySearchError } = await supabase
          .from('companies')
          .select('company_id, name')
          .ilike('name', linkedInData.company);
          
        if (companySearchError) throw companySearchError;
        
        let companyId;
        
        // If company exists, use it
        if (existingCompanies && existingCompanies.length > 0) {
          companyId = existingCompanies[0].company_id;
          
          // Update company information
          const { error: companyUpdateError } = await supabase
            .from('companies')
            .update({
              website: linkedInData.companyWebsite || null,
              description: linkedInData.companyDescription || null,
              last_modified_at: new Date().toISOString(),
              last_modified_by: 'User'
            })
            .eq('company_id', companyId);
            
          if (companyUpdateError) throw companyUpdateError;
        } 
        // If company doesn't exist, create it
        else {
          const { data: newCompany, error: companyCreateError } = await supabase
            .from('companies')
            .insert({
              name: linkedInData.company,
              website: linkedInData.companyWebsite || null,
              description: linkedInData.companyDescription || null,
              created_at: new Date().toISOString(),
              created_by: 'User',
              last_modified_at: new Date().toISOString(),
              last_modified_by: 'User'
            })
            .select();
            
          if (companyCreateError) throw companyCreateError;
          
          if (newCompany && newCompany.length > 0) {
            companyId = newCompany[0].company_id;
          }
        }
        
        // Associate contact with company if we have a company ID
        if (companyId) {
          // Check if relationship already exists
          const { data: existingRelation, error: relationCheckError } = await supabase
            .from('contact_companies')
            .select('contact_id, company_id')
            .eq('contact_id', selectedContactForLinkedIn.contact_id)
            .eq('company_id', companyId);
            
          if (relationCheckError) throw relationCheckError;
          
          // Only create relationship if it doesn't exist
          if (!existingRelation || existingRelation.length === 0) {
            const { error: relationError } = await supabase
              .from('contact_companies')
              .insert({
                contact_id: selectedContactForLinkedIn.contact_id,
                company_id: companyId
              });
              
            if (relationError) throw relationError;
          }
        }
      }
      
      // Add city if provided
      if (linkedInData.city) {
        // Check if city exists
        const { data: existingCities, error: citySearchError } = await supabase
          .from('cities')
          .select('city_id, name')
          .ilike('name', linkedInData.city);
          
        if (citySearchError) throw citySearchError;
        
        let cityId;
        
        // If city exists, use it
        if (existingCities && existingCities.length > 0) {
          cityId = existingCities[0].city_id;
        } 
        // If city doesn't exist, create it
        else {
          const { data: newCity, error: cityCreateError } = await supabase
            .from('cities')
            .insert({
              name: linkedInData.city
            })
            .select();
            
          if (cityCreateError) throw cityCreateError;
          
          if (newCity && newCity.length > 0) {
            cityId = newCity[0].city_id;
          }
        }
        
        // Associate contact with city if we have a city ID
        if (cityId) {
          // Check if relationship already exists
          const { data: existingRelation, error: relationCheckError } = await supabase
            .from('contact_cities')
            .select('contact_id, city_id')
            .eq('contact_id', selectedContactForLinkedIn.contact_id)
            .eq('city_id', cityId);
            
          if (relationCheckError) throw relationCheckError;
          
          // Only create relationship if it doesn't exist
          if (!existingRelation || existingRelation.length === 0) {
            const { error: relationError } = await supabase
              .from('contact_cities')
              .insert({
                contact_id: selectedContactForLinkedIn.contact_id,
                city_id: cityId
              });
              
            if (relationError) throw relationError;
          }
        }
      }
      
      // Refresh the entire table to get the latest data
      await fetchContacts();
      
      console.log('LinkedIn data saved successfully and table refreshed');
    } catch (err) {
      console.error('Error saving LinkedIn data:', err);
    }
  };

  // Frequency Renderer with dropdown functionality
  const FrequencyRenderer = useCallback((props) => {
    const contactId = props.data?.contact_id;
    const currentFrequency = props.value || '';
    const isDropdownOpen = showFrequencyDropdown[contactId] || false;
    
    const frequencyOptions = [
      { value: 'Do not keep in touch', label: 'Do not keep in touch' },
      { value: 'Weekly', label: 'Weekly' },
      { value: 'Monthly', label: 'Monthly' },
      { value: 'Quarterly', label: 'Quarterly' },
      { value: 'Twice per Year', label: 'Twice per Year' },
      { value: 'Once per Year', label: 'Once per Year' }
    ];
    
    const handleFrequencyChange = async (newFrequency) => {
      try {
        // Update the database
        const { error } = await supabase
          .from('contacts')
          .update({ keep_in_touch_frequency: newFrequency })
          .eq('contact_id', contactId);
          
        if (error) throw error;
        
        // Close the dropdown first
        setShowFrequencyDropdown(prev => ({
          ...prev,
          [contactId]: false
        }));
        
        // Refresh the entire table to get the latest data
        await fetchContacts();
        
        console.log(`Updated frequency for contact ${contactId} to ${newFrequency} and refreshed table`);
      } catch (err) {
        console.error('Error updating frequency:', err);
        alert('Failed to update frequency. Please try again.');
      }
    };
    
    const handleClick = (e) => {
      e.stopPropagation();
      setShowFrequencyDropdown(prev => ({
        ...prev,
        [contactId]: !prev[contactId]
      }));
    };
    
    const handleBlur = () => {
      // Delay closing to allow click on dropdown options
      setTimeout(() => {
        setShowFrequencyDropdown(prev => ({
          ...prev,
          [contactId]: false
        }));
      }, 150);
    };
    
    if (isDropdownOpen) {
      return (
        <div style={{ position: 'relative', width: '100%' }}>
          <select
            value={currentFrequency}
            onChange={(e) => handleFrequencyChange(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            style={{
              width: '100%',
              padding: '4px',
              fontSize: '12px',
              backgroundColor: '#222',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px'
            }}
          >
            {frequencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    
    return (
      <div 
        onClick={handleClick}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          cursor: 'pointer',
          width: '100%',
          fontSize: '12px',
          textAlign: 'center',
          color: currentFrequency ? '#00ff00' : '#aaaaaa', // Green for all values, gray for empty
          padding: '4px',
          borderRadius: '4px'
        }}
      >
        {currentFrequency || 'Not set'}
      </div>
    );
  }, [showFrequencyDropdown, setContacts, setShowFrequencyDropdown]);

  // Renderer for the snooze days - now editable
  const SnoozeDaysRenderer = useCallback((props) => {
    const contactId = props.data?.contact_id;
    const currentSnoozeDays = props.value || 0;
    const isEditing = showSnoozeDaysInput[contactId] || false;
    
    console.log('SnoozeDaysRenderer debug:', { contactId, currentSnoozeDays, isEditing, showSnoozeDaysInput });
    
    const handleSnoozeDaysChange = async (newSnoozeDays) => {
      try {
        // Update the database
        const { error } = await supabase
          .from('keep_in_touch')
          .update({ snooze_days: newSnoozeDays })
          .eq('contact_id', contactId);
          
        if (error) throw error;
        
        // Close the input first
        setShowSnoozeDaysInput(prev => ({
          ...prev,
          [contactId]: false
        }));
        
        // Refresh the entire table to get the latest data
        await fetchContacts();
        
        console.log(`Updated snooze days for contact ${contactId} to ${newSnoozeDays} and refreshed table`);
      } catch (err) {
        console.error('Error updating snooze days:', err);
        alert('Failed to update snooze days. Please try again.');
      }
    };
    
    const handleClick = (e) => {
      e.stopPropagation();
      console.log('Snooze days clicked for contact:', contactId);
      setShowSnoozeDaysInput(prev => ({
        ...prev,
        [contactId]: !prev[contactId]
      }));
    };
    
    const handleBlur = () => {
      // Delay closing to allow click on input or buttons
      setTimeout(() => {
        setShowSnoozeDaysInput(prev => ({
          ...prev,
          [contactId]: false
        }));
      }, 150);
    };
    
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        const newValue = parseInt(e.target.value) || 0;
        handleSnoozeDaysChange(newValue);
      }
    };
    
    const handleResetToZero = (e) => {
      e.stopPropagation();
      console.log('Reset to zero clicked for contact:', contactId);
      handleSnoozeDaysChange(0);
    };
    
    if (isEditing) {
      return (
        <div style={{ 
          position: 'relative', 
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <input
            type="number"
            min="0"
            max="365"
            defaultValue={currentSnoozeDays}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            autoFocus
            style={{
              width: '60px',
              padding: '2px 4px',
              fontSize: '11px',
              backgroundColor: '#222',
              color: '#00ff00',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              textAlign: 'center'
            }}
          />
          <button
            onClick={handleResetToZero}
            style={{
              background: '#ff5555',
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Reset to 0"
          >
            ×
          </button>
        </div>
      );
    }
    
    if (!currentSnoozeDays || currentSnoozeDays <= 0) {
      return (
        <div 
          onClick={handleClick}
          style={{
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#666',
            textAlign: 'center'
          }}
          title="Click to set snooze days"
        >
          -
        </div>
      );
    }
    
    return (
      <span 
        onClick={handleClick}
        style={{ 
          color: '#00ff00',
          backgroundColor: '#222',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer',
          display: 'inline-block'
        }}
        title="Click to edit snooze days"
      >
        +{currentSnoozeDays} days
      </span>
    );
  }, [showSnoozeDaysInput, setContacts, setShowSnoozeDaysInput]);

  // Actions Renderer with LinkedIn, WhatsApp, Deal, and Email buttons - Updated to use icons
  const ActionsRenderer = (props) => {
    const data = props.data;
    
    // Get contact data from nested structure
    const contactData = data.contacts || {};
    
    // Get primary email or first available
    const email = data.email || '';
    
    // Get primary mobile (for WhatsApp)
    const mobile = data.mobile || '';
    
    // Get LinkedIn URL from joined contacts table
    const linkedin = contactData.linkedin || '';
    
    const handleLinkedInClick = (e) => {
      e.stopPropagation();
      console.log("=== Opening LinkedIn search & enrich modal ===");
      console.log("Full data object:", data);
      console.log("Contacts nested data:", data.contacts);
      console.log("Data keys:", Object.keys(data));
      console.log("LinkedIn URL from contacts:", data.contacts?.linkedin);
      console.log("LinkedIn URL direct:", data.linkedin);
      console.log("=== Setting selected contact for LinkedIn ===");
      setSelectedContactForLinkedIn(data);
      setShowLinkedInSearchModal(true);
    };
    
    const handleWhatsAppClick = (e) => {
      e.stopPropagation();
      if (mobile) {
        const formattedNumber = mobile.replace(/\D/g, '');
        window.open(`https://wa.me/${formattedNumber}`, '_blank');
      }
    };
    
    const handleEmailClick = (e) => {
      e.stopPropagation();
      
      if (email) {
        // Green button: Contact has email - directly open email compose
        // Try Gmail first as it's most reliable, fallback to mailto
        try {
          window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}`, '_blank');
        } catch (error) {
          // Fallback to mailto if Gmail fails
          window.location.href = `mailto:${email}`;
        }
      } else {
        // Grey button: No email - search on Superhuman using contact's name
        // Debug: log the data structure to see available fields
        console.log('Data structure for grey button:', data);
        
        // Try multiple ways to get the name
        const firstName = data.first_name || data.firstName || '';
        const lastName = data.last_name || data.lastName || '';
        const fullName = data.full_name || data.fullName || '';
        
        console.log('Name fields found:', { firstName, lastName, fullName });
        
        if (firstName && lastName) {
          // Open Superhuman search with the correct schema: first_name%20last_name
          console.log('Using first + last names:', `${firstName}%20${lastName}`);
          window.open(`https://mail.superhuman.com/search/${firstName}%20${lastName}`, '_blank');
        } else if (fullName) {
          // If we have full_name, split it and use the parts
          const nameParts = fullName.trim().split(' ');
          if (nameParts.length >= 2) {
            const first = nameParts[0];
            const last = nameParts[nameParts.length - 1]; // Get last part in case of middle names
            console.log('Using split full name:', `${first}%20${last}`);
            window.open(`https://mail.superhuman.com/search/${first}%20${last}`, '_blank');
          } else if (nameParts.length === 1) {
            // Just one name
            console.log('Using single name:', nameParts[0]);
            window.open(`https://mail.superhuman.com/search/${nameParts[0]}`, '_blank');
          }
        } else if (firstName || lastName) {
          // If only one name is available, use just that
          const availableName = firstName || lastName;
          console.log('Using single available name:', availableName);
          window.open(`https://mail.superhuman.com/search/${availableName}`, '_blank');
        } else {
          // Show a brief notification if no name is available
          console.log('No names found in data:', data);
          const notification = document.createElement('div');
          notification.innerHTML = `
            <div style="
              position: fixed;
              top: 20px;
              right: 20px;
              background: #331100;
              color: #ff9900;
              border: 1px solid #ff9900;
              padding: 15px;
              border-radius: 6px;
              z-index: 10000;
              font-family: 'Courier New', monospace;
            ">
              ⚠️ No contact name available for Superhuman search
            </div>
          `;
          document.body.appendChild(notification);
          setTimeout(() => {
            if (notification.parentElement) {
              notification.parentElement.removeChild(notification);
            }
          }, 3000);
        }
      }
    };
    
    const handleDealClick = (e) => {
      e.stopPropagation();
      setSelectedContactForDeal(data);
      setShowDealModal(true);
    };
    
    return (
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4px',
        width: '100%',
        height: '100%'
      }}>
        {/* LinkedIn Button */}
        <button
          onClick={handleLinkedInClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: linkedin ? '#00ff00' : '#666',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '3px',
            transition: 'all 0.2s',
            padding: '0'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="LinkedIn"
        >
          <FiLinkedin size={16} />
        </button>
        
        {/* WhatsApp Button */}
        <button
          onClick={handleWhatsAppClick}
          disabled={!mobile}
          style={{
            background: 'transparent',
            border: 'none',
            color: mobile ? '#00ff00' : '#666',
            cursor: mobile ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '3px',
            transition: 'all 0.2s',
            padding: '0'
          }}
          onMouseEnter={(e) => mobile && (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => mobile && (e.currentTarget.style.transform = 'scale(1)')}
          title="WhatsApp"
        >
          <FaWhatsapp size={16} />
        </button>
        
        {/* Deal Button */}
        <button
          onClick={handleDealClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#00ff00',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '3px',
            transition: 'all 0.2s',
            padding: '0'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Deal (Coming Soon)"
        >
          <FiDollarSign size={16} />
        </button>
        
        {/* Email Button */}
        <button
          onClick={handleEmailClick}
          style={{
            background: 'transparent',
            border: 'none',
            color: email ? '#00ff00' : '#666',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '3px',
            transition: 'all 0.2s',
            padding: '0'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title={email ? "Email" : "Search on Superhuman"}
        >
          <FiMail size={16} />
        </button>
      </div>
    );
  };
  
  // Last Interaction Renderer with modal functionality
  const LastInteractionRenderer = (props) => {
    if (!props.value) return '';
    
    const date = new Date(props.value);
    // Format as MM/YY
    const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
    
    const handleClick = (e) => {
      e.stopPropagation();
      setSelectedContactForModal(props.data);
      setShowInteractionModal(true);
    };
    
    return (
      <div 
        onClick={handleClick}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingRight: '0',
          width: '100%',
          fontSize: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          color: '#aaaaaa'
        }}
      >
        {formattedDate}
      </div>
    );
  };
  
  // Column definitions with improved display of related data
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Contact', 
      field: 'full_name',
      cellRenderer: (params) => {
        if (!params.value) return '-';
        
        // Make contact name clickable
        const handleClick = () => {
          if (params.data && params.data.contact_id) {
            navigate(`/contacts/${params.data.contact_id}`);
          }
        };
        
        return (
          <div 
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={handleClick}
          >
            {params.value}
          </div>
        );
      },
      minWidth: 180,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
      pinned: 'left',
    },
    { 
      headerName: 'Last Interaction', 
      field: 'last_interaction_at',
      cellRenderer: LastInteractionRenderer,
      minWidth: 150,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Frequency', 
      field: 'frequency',
      cellRenderer: FrequencyRenderer,
      minWidth: 130,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Snooze Days', 
      field: 'snooze_days',
      cellRenderer: SnoozeDaysRenderer,
      width: 120,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Next Interaction', 
      field: 'next_interaction_date', 
      valueFormatter: (params) => {
        if (!params.value) return '-';
        
        const date = new Date(params.value);
        const today = new Date();
        const daysUntil = Math.floor((date - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) return 'DUE';
        return new Date(params.value).toLocaleDateString();
      },
      minWidth: 180,
      filter: 'agDateColumnFilter',
      floatingFilter: true,
      sortable: true,
    },
    { 
      headerName: 'Actions', 
      field: 'actions',
      cellRenderer: ActionsRenderer,
      minWidth: 140,
      sortable: false,
      filter: false,
    }
  ], [navigate, FrequencyRenderer, SnoozeDaysRenderer]);
  
  // Load data on component mount
  useEffect(() => {
    if (!dataLoaded) {
      fetchContacts();
    }
  }, [dataLoaded]);
  
  // Default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  // Grid ready event handler
  const onGridReady = React.useCallback((params) => {
    console.log('Grid is ready');
    setGridApi(params.api);
    
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 0);
  }, []);

  // Row clicked handler
  const handleRowClicked = React.useCallback((params) => {
    console.log('Row clicked:', params.data);
  }, [navigate]);

  // Fetch data from v_keep_in_touch view
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Helper function to retry failed Supabase requests
      const retrySupabaseRequest = async (request, maxRetries = 3, delay = 1000) => {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await request();
          } catch (err) {
            console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, err);
            lastError = err;
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            // Increase delay for next attempt (exponential backoff)
            delay *= 1.5;
          }
        }
        // If we get here, all retries failed
        throw lastError;
      };
      
      setLoading('Accessing Keep in Touch data...');
      
      // Fetch data from v_keep_in_touch with LinkedIn data and snooze_days
      const { data: keepInTouchData, error: keepInTouchError } = await retrySupabaseRequest(async () => {
        return supabase
          .from('v_keep_in_touch')
          .select(`
            *,
            contacts!inner(linkedin)
          `)
          .order('next_interaction_date', { ascending: true });
      });
      
      if (keepInTouchError) {
        console.error('Error fetching keep in touch data:', keepInTouchError);
        throw keepInTouchError;
      }

      // Extract contact IDs to fetch mobile data
      const contactIds = keepInTouchData?.map(contact => contact.contact_id) || [];
      
      // Fetch mobile and email data for these contacts
      let mobilesData = [];
      let emailsData = [];
      
      if (contactIds.length > 0) {
        // Fetch mobile data
        const { data: mobiles, error: mobilesError } = await retrySupabaseRequest(async () => {
          return supabase
            .from('contact_mobiles')
            .select('contact_id, mobile, is_primary')
            .in('contact_id', contactIds);
        });
        
        if (mobilesError) {
          console.error('Error fetching mobile data:', mobilesError);
          // Don't throw error, just log it - mobile data is not critical
        } else {
          mobilesData = mobiles || [];
        }

        // Fetch email data
        const { data: emails, error: emailsError } = await retrySupabaseRequest(async () => {
          return supabase
            .from('contact_emails')
            .select('contact_id, email, is_primary')
            .in('contact_id', contactIds);
        });
        
        if (emailsError) {
          console.error('Error fetching email data:', emailsError);
          // Don't throw error, just log it - email data is not critical
        } else {
          emailsData = emails || [];
        }
      }
      
      // Merge mobile and email data with contacts
      const contactsWithMobilesAndEmails = keepInTouchData?.map(contact => {
        // Find mobiles for this contact
        const contactMobiles = mobilesData.filter(mobile => mobile.contact_id === contact.contact_id);
        const primaryMobile = contactMobiles.find(mobile => mobile.is_primary);
        const mobile = primaryMobile?.mobile || (contactMobiles.length > 0 ? contactMobiles[0].mobile : null);
        
        // Find emails for this contact
        const contactEmails = emailsData.filter(email => email.contact_id === contact.contact_id);
        const primaryEmail = contactEmails.find(email => email.is_primary);
        const email = primaryEmail?.email || (contactEmails.length > 0 ? contactEmails[0].email : null);
        
        return {
          ...contact,
          mobile: mobile,
          email: email
        };
      }) || [];
      
      console.log('Fetched contacts with mobile and email data:', contactsWithMobilesAndEmails);
      setContacts(contactsWithMobilesAndEmails);
      setDataLoaded(true);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
      setError(`Failed to load contacts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create refreshData function for context
  const refreshData = () => {
    if (!loading) {
      fetchContacts();
    }
  };

  // Create context object to pass to grid
  const gridContext = { navigate, refreshData };

  if (error) {
    return (
      <Container>
        <Title>Keep in Touch Contacts</Title>
        <ErrorText>{error}</ErrorText>
      </Container>
    );
  }

  if (loading) {
  return (
    <Container>
        <Title>Keep in Touch Contacts</Title>
        <LoadingContainer>
          <LoadingText>
            {typeof loading === 'string' ? loading : 'Loading contacts...'}
          </LoadingText>
          <LoadingBar />
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      {contacts.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#00ff00',
          background: '#121212',
          borderRadius: '8px'
        }}>
          No contacts found for this category.
        </div>
      ) : (
        <div 
          className="ag-theme-alpine" 
          style={{ 
            height: 'calc(100% - 80px)', 
            width: '100%',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            marginRight: '5px',
            '--ag-background-color': '#121212',
            '--ag-odd-row-background-color': '#1a1a1a',
            '--ag-header-background-color': '#222222',
            '--ag-header-foreground-color': '#00ff00',
            '--ag-foreground-color': '#e0e0e0', 
            '--ag-row-hover-color': 'transparent',
            '--ag-border-color': '#333333',
            '--ag-cell-horizontal-padding': '8px',
            '--ag-borders': 'none',
            '--ag-header-height': '32px',
            '--ag-header-column-separator-display': 'none',
            '--ag-font-size': '12px',
            '--ag-paging-panel-height': '42px',
            '--ag-row-height': '36px'
          }}
        >
          <AgGridReact
            rowData={contacts}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onRowClicked={handleRowClicked}
            context={gridContext}
            animateRows={false}
            suppressRowClickSelection={true}
            enableCellTextSelection={true}
            pagination={true}
            paginationPageSize={50}
            domLayout="normal"
            suppressColumnVirtualisation={true}
            suppressRowVirtualisation={false}
            suppressCellFocus={true}
            suppressHorizontalScroll={true}
            alwaysShowHorizontalScroll={false}
            alwaysShowVerticalScroll={false}
            overlayNoRowsTemplate='<span style="padding: 10px; border: 1px solid #00ff00; background: #121212; color: #00ff00;">No contacts found</span>'
          />
        </div>
      )}
      
      {/* Interaction Modal */}
      {showInteractionModal && selectedContactForModal && (
        <ContactsInteractionModal
          isOpen={showInteractionModal}
          onRequestClose={() => {
            setShowInteractionModal(false);
            setSelectedContactForModal(null);
          }}
          contact={selectedContactForModal}
        />
      )}
      
      {/* Deal Modal */}
      {showDealModal && selectedContactForDeal && (
        <DealViewFindAddModal
          isOpen={showDealModal}
          onClose={() => {
            setShowDealModal(false);
            setSelectedContactForDeal(null);
          }}
          contactData={selectedContactForDeal}
        />
      )}
      
      {/* LinkedIn Search & Enrich Modal */}
      {showLinkedInSearchModal && selectedContactForLinkedIn && (
        <LinkedinSearchOpenEnrich
          isOpen={showLinkedInSearchModal}
          onClose={() => {
            setShowLinkedInSearchModal(false);
            setSelectedContactForLinkedIn(null);
          }}
          linkedInUrl={(() => {
            const contactData = selectedContactForLinkedIn.contacts || {};
            let linkedinUrl = contactData.linkedin || '';
            
            // Ensure LinkedIn URL is properly formatted
            if (linkedinUrl && !linkedinUrl.startsWith('http')) {
              // If it's a relative URL or just a username, make it absolute
              if (linkedinUrl.startsWith('linkedin.com') || linkedinUrl.startsWith('www.linkedin.com')) {
                linkedinUrl = `https://${linkedinUrl}`;
              } else if (linkedinUrl.includes('linkedin.com')) {
                linkedinUrl = `https://${linkedinUrl}`;
              } else {
                // If it's just a username or path, construct the full URL
                linkedinUrl = `https://www.linkedin.com/in/${linkedinUrl.replace(/^\/+/, '')}`;
              }
            }
            
            console.log("LinkedIn URL being passed to modal:", linkedinUrl);
            console.log("Original LinkedIn data:", contactData.linkedin);
            console.log("Selected contact data:", selectedContactForLinkedIn);
            console.log("Contact data object:", contactData);
            return linkedinUrl;
          })()}
          contactName={(() => {
            // Try multiple ways to get the contact name from v_keep_in_touch data
            let firstName = selectedContactForLinkedIn.first_name || '';
            let lastName = selectedContactForLinkedIn.last_name || '';
            let fullName = selectedContactForLinkedIn.full_name || '';
            
            // If we don't have first_name/last_name, try to extract from full_name
            if (!firstName && !lastName && fullName) {
              const nameParts = fullName.trim().split(' ');
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            }
            
            const name = `${firstName} ${lastName}`.trim() || fullName.trim();
            
            console.log("Contact name debugging:");
            console.log("- first_name:", selectedContactForLinkedIn.first_name);
            console.log("- last_name:", selectedContactForLinkedIn.last_name);
            console.log("- full_name:", selectedContactForLinkedIn.full_name);
            console.log("- Final contact name being passed to modal:", name);
            console.log("- Full selected contact data:", selectedContactForLinkedIn);
            
            return name;
          })()}
          firstName={selectedContactForLinkedIn.first_name || selectedContactForLinkedIn.full_name?.split(' ')[0] || ''}
          lastName={selectedContactForLinkedIn.last_name || selectedContactForLinkedIn.full_name?.split(' ').slice(1).join(' ') || ''}
          email={selectedContactForLinkedIn.email || ''}
          jobRole={selectedContactForLinkedIn.job_role || ''}
          contactId={selectedContactForLinkedIn.contact_id}
          context={gridContext}
          onSaveData={handleSaveLinkedInData}
        />
      )}
    </Container>
  );
};

export default SimpleKeepInTouch;