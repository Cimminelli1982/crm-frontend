import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiLink, FiCheck, FiEdit2, FiBriefcase, FiBuilding, FiLoader, FiSave } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-toastify';

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  
  &:hover {
    color: #fff;
  }
`;

const ModalContent = styled.div`
  padding: 20px;
  color: #eee;
  position: relative;
  box-sizing: border-box;
`;

const ProfilePreview = styled.div`
  background: #2d2d2d;
  border-radius: 5px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  border: 1px solid #444;
`;

const ProfileHeader = styled.div`
  display: flex;
  gap: 10px;
`;

const ProfileImage = styled.div`
  width: 60px;
  height: 60px;
  background: #0077b5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  flex: 1;
`;

const ProfileName = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: white;
`;

const ProfileHeadline = styled.div`
  font-size: 13px;
  color: #bbb;
  margin-bottom: 5px;
`;

const ProfileLocation = styled.div`
  font-size: 13px;
  color: #999;
`;

const ProfileButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #0077b5;
  color: white;
  padding: 6px 0;
  text-decoration: none;
  border-radius: 4px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 5px;
  
  &:hover {
    background: #006097;
  }
`;

const ExtractionSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #444;
  box-sizing: border-box;
  width: 100%;
`;

const ExtractionTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #ddd;
`;

const InputGroup = styled.div`
  margin-bottom: 10px;
  padding-right: 10px; /* Add consistent right padding */
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #bbb;
  font-size: 13px;
`;

const Input = styled.input`
  width: 100%; /* Full width */
  padding: 8px;
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  font-size: 13px;
  box-sizing: border-box; /* Ensures padding doesn't add to width */
  
  &:focus {
    outline: none;
    border-color: #0077b5;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SaveButton = styled(Button)`
  background: #00ff00;
  color: #111;
  
  &:hover:not(:disabled) {
    background: #00cc00;
  }
`;

const CancelButton = styled(Button)`
  background: #333;
  color: #eee;
  
  &:hover {
    background: #444;
  }
`;

// Modal styles
const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    background: '#222',
    border: '1px solid #333',
    borderRadius: '5px',
    padding: '0',
    width: '550px',
    maxWidth: '90%',
    maxHeight: '85vh',
    overflow: 'auto'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000
  }
};

// Set the app element for accessibility
if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

// LinkedIn profile management component

const LinkedinSearchOpenEnrich = ({ 
  isOpen, 
  onClose, 
  linkedInUrl, 
  contactName,
  jobRole,
  onSaveData,
  firstName,
  lastName,
  email,
  contactId,
  context, // Add context for refreshing the data
}) => {
  const [extractedJobRole, setExtractedJobRole] = useState(jobRole || '');
  const [extractedCompany, setExtractedCompany] = useState('');
  const [extractedCompanyWebsite, setExtractedCompanyWebsite] = useState('');
  const [extractedCompanyDescription, setExtractedCompanyDescription] = useState('');
  const [extractedCity, setExtractedCity] = useState('');
  const [customLinkedInUrl, setCustomLinkedInUrl] = useState(linkedInUrl || '');
  const [loading, setLoading] = useState(false);
  const [urlSaving, setUrlSaving] = useState(false);
  const [error, setError] = useState(null);
  const [extractionAttempted, setExtractionAttempted] = useState(false);
  
  // Get initials for the profile image
  const getInitials = (name) => {
    if (!name) return '?';
    
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  // Extract job title and company from LinkedIn using Apollo API
  const extractLinkedInData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Determine if we're in development or production
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const functionUrl = isDevelopment 
        ? 'https://your-netlify-site.netlify.app/.netlify/functions/linkedin-job-extract' // Replace with your actual Netlify site URL
        : '/.netlify/functions/linkedin-job-extract';
      
      // Skip actual API call in development if needed
      if (isDevelopment) {
        console.log('Development mode detected - using mock data instead of API call');
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Display message that this feature is only available online
        setError('LinkedIn data extraction is only available in the online version');
        
        setLoading(false);
        setExtractionAttempted(true);
        return;
      }
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName || contactName.split(' ')[0] || '',
          lastName: lastName || (contactName.split(' ').length > 1 ? contactName.split(' ').slice(1).join(' ') : ''),
          email: email || null,
          linkedinUrl: customLinkedInUrl || linkedInUrl || null
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        if (result.data.jobTitle) {
          setExtractedJobRole(result.data.jobTitle);
        }
        
        if (result.data.company) {
          setExtractedCompany(result.data.company);
        }

        // No bio field extraction as per API limitations
        
        if (result.data.companyWebsite) {
          setExtractedCompanyWebsite(result.data.companyWebsite);
        }
        
        if (result.data.companyDescription) {
          setExtractedCompanyDescription(result.data.companyDescription);
        }
        
        
        if (result.data.city) {
          setExtractedCity(result.data.city);
        }
      } else {
        setError(result.error || 'Unable to extract data from LinkedIn');
      }
    } catch (err) {
      console.error('Failed to extract LinkedIn data:', err);
      setError('Failed to extract data from LinkedIn. Please try manually entering the information.');
    } finally {
      setLoading(false);
      setExtractionAttempted(true);
    }
  };
  
  // Run extraction when modal opens if we have a LinkedIn URL
  // Also run if customLinkedInUrl changes (after saving)
  useEffect(() => {
    if (isOpen && (linkedInUrl || customLinkedInUrl) && !extractionAttempted) {
      extractLinkedInData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, linkedInUrl, customLinkedInUrl, extractionAttempted]);
  
  // Function to trigger Apollo enrichment API
  const triggerApolloEnrichment = async (contactId, linkedinUrl) => {
    try {
      if (!contactId || !linkedinUrl) return;
      
      // Determine if we're in development or production
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const functionUrl = isDevelopment 
        ? 'https://your-netlify-site.netlify.app/.netlify/functions/apollo-enrich' 
        : '/.netlify/functions/apollo-enrich';
      
      // Log the API call for debugging
      console.log(`Triggering Apollo enrichment for contact ${contactId} with LinkedIn URL: ${linkedinUrl}`);
      
      // Skip actual API call in development if needed
      if (isDevelopment) {
        console.log('Development mode detected - skipping Apollo enrichment API call');
        return;
      }
      
      // Call the Apollo enrichment function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: contactId,
          linkedinUrl: linkedinUrl
        }),
      });
      
      const result = await response.json();
      console.log('Apollo enrichment result:', result);
      
      // No need to wait for this to complete - it's a background process
    } catch (error) {
      console.error('Error triggering Apollo enrichment:', error);
      // Don't show an error toast - this is a background process and failures shouldn't interrupt the user
    }
  };
  
  // Save LinkedIn URL to contact
  const saveLinkedInUrl = async () => {
    if (!customLinkedInUrl) return;
    
    setUrlSaving(true);
    try {
      // Validate the Contact ID format and use only the numeric portion if necessary
      // This helps prevent errors like "eq.lists:1" which is an invalid format
      let contactIdToUse = contactId;
      
      // If not provided via props, try to extract from URL
      if (!contactIdToUse) {
        const pathParts = window.location.pathname.split('/');
        contactIdToUse = pathParts[pathParts.length - 1];
        
        // If it contains a colon, extract just the number part (handle formats like "lists:1")
        if (contactIdToUse && contactIdToUse.includes(':')) {
          contactIdToUse = contactIdToUse.split(':')[1];
        }
      }
      
      // Double check we have a valid ID
      if (!contactIdToUse || contactIdToUse === '' || contactIdToUse === 'undefined') {
        throw new Error("Valid contact ID not found");
      }
      
      console.log("Saving LinkedIn URL for contact ID:", contactIdToUse);
      
      // Using Supabase client to update the contact's LinkedIn URL
      const { data, error } = await supabase
        .from('contacts')
        .update({ linkedin: customLinkedInUrl })
        .eq('contact_id', contactIdToUse)
        .select();
        
      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      
      console.log("Update success, response:", data);
      
      // 1. Already saved the URL to contacts.linkedin in Supabase (in the code above)
      
      // 2. Show success toast notification immediately
      toast.success('LinkedIn URL saved successfully to contacts.linkedin in Supabase!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      // 3. Trigger Apollo enrich function for the contact
      // Call an Apollo enrichment API with the LinkedIn URL
      triggerApolloEnrichment(contactIdToUse, customLinkedInUrl);
      
      // 4. Refresh the modal with new data
      // Update the local state to reflect this save
      setCustomLinkedInUrl(customLinkedInUrl);
      
      // Reset extraction state to trigger a refresh of data
      setExtractionAttempted(false);
      
      // Re-extract the data immediately with the new URL
      setTimeout(() => {
        extractLinkedInData();
      }, 1000);
      
      // Also refresh the parent table to show the updated LinkedIn URL
      if (context && context.refreshData) {
        setTimeout(() => {
          context.refreshData();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to save LinkedIn URL:', err.message, err);
      
      // Show error toast notification
      toast.error(`Failed to save URL to Supabase contacts.linkedin: ${err.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } finally {
      setUrlSaving(false);
    }
  };

  // Handle save all information
  const handleSave = () => {
    if (onSaveData) {
      onSaveData({
        jobRole: extractedJobRole,
        company: extractedCompany,
        companyWebsite: extractedCompanyWebsite,
        companyDescription: extractedCompanyDescription,
        city: extractedCity,
        linkedin: customLinkedInUrl // Include the custom URL when saving all data
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel="LinkedIn Profile Search & Enrich"
    >
      <ModalHeader>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>LinkedIn Profile Search & Enrich</h3>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      <ModalContent>
        <ProfilePreview>
          <ProfileHeader>
            <ProfileImage>
              {getInitials(contactName)}
            </ProfileImage>
            <ProfileInfo>
              <ProfileName>{contactName}</ProfileName>
              <ProfileHeadline>
                {extractedJobRole && extractedCompany 
                  ? `${extractedJobRole} at ${extractedCompany}`
                  : extractedJobRole || (loading ? 'Extracting data...' : 'Add job information')}
              </ProfileHeadline>
              {/* Show LinkedIn URL or loading state */}
              <ProfileLocation>
                {linkedInUrl ? 'LinkedIn Profile' : 'Add LinkedIn URL below'}
              </ProfileLocation>
            </ProfileInfo>
          </ProfileHeader>
          
          {/* LinkedIn URL input and save button */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '10px',
            width: '100%'
          }}>
            <Input 
              type="text"
              value={customLinkedInUrl}
              onChange={(e) => setCustomLinkedInUrl(e.target.value)}
              placeholder="Paste LinkedIn URL here"
              style={{ flex: 1 }}
            />
            <button
              onClick={saveLinkedInUrl}
              disabled={urlSaving || !customLinkedInUrl}
              style={{
                background: '#0077b5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0 10px',
                cursor: urlSaving || !customLinkedInUrl ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                opacity: urlSaving || !customLinkedInUrl ? 0.6 : 1,
                fontSize: '13px'
              }}
            >
              {urlSaving ? <FiLoader size={14} /> : <FiSave size={14} />} Save URL
            </button>
          </div>
          
          <ProfileButton 
            href={customLinkedInUrl ? customLinkedInUrl : `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(contactName)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiLink size={14} /> {customLinkedInUrl ? 'Visit Full LinkedIn Profile' : 'Search on LinkedIn'}
          </ProfileButton>
        </ProfilePreview>
        
        <ExtractionSection>
          <ExtractionTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <FiBriefcase size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> 
              Professional Information
            </div>
            
            {/* Refresh button to retry extraction */}
            {linkedInUrl && (
              <button 
                onClick={extractLinkedInData}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0077b5',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? (
                  <><FiLoader size={14} style={{ animation: 'spin 1.5s linear infinite' }} /> Extracting...</>
                ) : (
                  <>Refresh</>
                )}
              </button>
            )}
          </ExtractionTitle>
          
          {error && (
            <div style={{ 
              padding: '10px 12px', 
              marginBottom: '12px',
              background: 'rgba(255, 0, 0, 0.1)', 
              border: '1px solid rgba(255, 0, 0, 0.2)',
              borderRadius: '4px',
              color: '#ff6b6b',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}
          
          <InputGroup>
            <Label>Job Title {loading && <small style={{ color: '#999', fontWeight: 'normal' }}>(extracting...)</small>}</Label>
            <Input 
              type="text"
              value={extractedJobRole}
              onChange={(e) => setExtractedJobRole(e.target.value)}
              placeholder="Enter job title (e.g. Software Engineer)"
              disabled={loading}
            />
          </InputGroup>
          
          <InputGroup>
            <Label>Company {loading && <small style={{ color: '#999', fontWeight: 'normal' }}>(extracting...)</small>}</Label>
            <Input 
              type="text"
              value={extractedCompany}
              onChange={(e) => setExtractedCompany(e.target.value)}
              placeholder="Enter company name (e.g. Acme Corp)"
              disabled={loading}
            />
          </InputGroup>
          
          <InputGroup>
            <Label>Company Website {loading && <small style={{ color: '#999', fontWeight: 'normal' }}>(extracting...)</small>}</Label>
            <Input 
              type="text"
              value={extractedCompanyWebsite}
              onChange={(e) => setExtractedCompanyWebsite(e.target.value)}
              placeholder="Enter company website (e.g. https://company.com)"
              disabled={loading}
            />
          </InputGroup>
          
          <InputGroup>
            <Label>City {loading && <small style={{ color: '#999', fontWeight: 'normal' }}>(extracting...)</small>}</Label>
            <Input 
              type="text"
              value={extractedCity}
              onChange={(e) => setExtractedCity(e.target.value)}
              placeholder="Enter city (e.g. San Francisco, CA)"
              disabled={loading}
            />
          </InputGroup>
          
          
          <InputGroup>
            <Label>About the Company {loading && <small style={{ color: '#999', fontWeight: 'normal' }}>(extracting...)</small>}</Label>
            <textarea
              value={extractedCompanyDescription}
              onChange={(e) => setExtractedCompanyDescription(e.target.value)}
              placeholder="Enter information about the company"
              disabled={loading}
              style={{
                width: '100%',
                minHeight: '70px',
                padding: '8px',
                background: '#1e1e1e',
                border: '1px solid #444',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </InputGroup>
          
          
          <ButtonRow>
            <CancelButton onClick={onClose} disabled={loading}>
              Cancel
            </CancelButton>
            <SaveButton 
              onClick={handleSave}
              disabled={loading || (!extractedJobRole && !extractedCompany)}
            >
              <FiCheck size={14} /> Save Information
            </SaveButton>
          </ButtonRow>
        </ExtractionSection>
      </ModalContent>
    </Modal>
  );
};

export default LinkedinSearchOpenEnrich;