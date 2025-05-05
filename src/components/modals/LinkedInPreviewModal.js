import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiLink, FiCheck, FiEdit2, FiBriefcase, FiBuilding, FiLoader } from 'react-icons/fi';

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
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  border: 1px solid #444;
`;

const ProfileHeader = styled.div`
  display: flex;
  gap: 15px;
`;

const ProfileImage = styled.div`
  width: 80px;
  height: 80px;
  background: #0077b5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
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
  font-size: 18px;
  font-weight: bold;
  color: white;
`;

const ProfileHeadline = styled.div`
  font-size: 14px;
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
  padding: 8px 0;
  text-decoration: none;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
  
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
  margin-bottom: 15px;
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
  padding: 10px;
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  font-size: 14px;
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
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
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
    maxHeight: '90vh',
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

const LinkedInPreviewModal = ({ 
  isOpen, 
  onClose, 
  linkedInUrl, 
  contactName,
  jobRole,
  onSaveData,
  firstName,
  lastName,
  email,
}) => {
  const [extractedJobRole, setExtractedJobRole] = useState(jobRole || '');
  const [extractedCompany, setExtractedCompany] = useState('');
  const [extractedBio, setExtractedBio] = useState('');
  const [extractedCompanyWebsite, setExtractedCompanyWebsite] = useState('');
  const [extractedCompanyDescription, setExtractedCompanyDescription] = useState('');
  const [extractedKeywords, setExtractedKeywords] = useState([]);
  const [extractedCity, setExtractedCity] = useState('');
  const [loading, setLoading] = useState(false);
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
        
        // Use job role from props if available, or mock data
        const mockJobTitle = jobRole || 'Software Engineer';
        const mockCompany = 'Tech Company Inc.';
        const mockBio = 'Experienced professional with a passion for technology and innovation.';
        const mockCompanyWebsite = 'https://techcompany.com';
        const mockCompanyDescription = 'A leading technology company focused on creating innovative solutions.';
        const mockKeywords = ['technology', 'software', 'engineering', 'innovation'];
        const mockCity = 'San Francisco, CA';
        
        setExtractedJobRole(mockJobTitle);
        setExtractedCompany(mockCompany);
        setExtractedBio(mockBio);
        setExtractedCompanyWebsite(mockCompanyWebsite);
        setExtractedCompanyDescription(mockCompanyDescription);
        setExtractedKeywords(mockKeywords);
        setExtractedCity(mockCity);
        
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
          linkedinUrl: linkedInUrl || null
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

        // Set additional fields
        if (result.data.bio) {
          setExtractedBio(result.data.bio);
        }
        
        if (result.data.companyWebsite) {
          setExtractedCompanyWebsite(result.data.companyWebsite);
        }
        
        if (result.data.companyDescription) {
          setExtractedCompanyDescription(result.data.companyDescription);
        }
        
        if (result.data.keywords && result.data.keywords.length > 0) {
          setExtractedKeywords(result.data.keywords);
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
  useEffect(() => {
    if (isOpen && linkedInUrl && !extractionAttempted) {
      extractLinkedInData();
    }
  }, [isOpen, linkedInUrl]);
  
  // Handle save
  const handleSave = () => {
    if (onSaveData) {
      onSaveData({
        jobRole: extractedJobRole,
        company: extractedCompany,
        bio: extractedBio,
        companyWebsite: extractedCompanyWebsite,
        companyDescription: extractedCompanyDescription,
        keywords: extractedKeywords,
        city: extractedCity
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel="LinkedIn Preview"
    >
      <ModalHeader>
        <h3 style={{ margin: 0, fontSize: '16px' }}>LinkedIn Profile Preview</h3>
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
                {linkedInUrl ? 'LinkedIn Profile' : 'No LinkedIn URL'}
              </ProfileLocation>
            </ProfileInfo>
          </ProfileHeader>
          
          <ProfileButton 
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!linkedInUrl}
          >
            <FiLink size={14} /> Visit Full LinkedIn Profile
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
            <Label>About the Contact {loading && <small style={{ color: '#999', fontWeight: 'normal' }}>(extracting...)</small>}</Label>
            <textarea
              value={extractedBio}
              onChange={(e) => setExtractedBio(e.target.value)}
              placeholder="Enter information about the contact"
              disabled={loading}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px',
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
          
          <InputGroup>
            <Label>About the Company {loading && <small style={{ color: '#999', fontWeight: 'normal' }}>(extracting...)</small>}</Label>
            <textarea
              value={extractedCompanyDescription}
              onChange={(e) => setExtractedCompanyDescription(e.target.value)}
              placeholder="Enter information about the company"
              disabled={loading}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px',
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
          
          {extractedKeywords.length > 0 && (
            <InputGroup>
              <Label>Keywords/Tags</Label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '5px', 
                marginTop: '5px' 
              }}>
                {extractedKeywords.map((keyword, index) => (
                  <div key={index} style={{ 
                    background: '#333', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#ddd'
                  }}>
                    {keyword}
                  </div>
                ))}
              </div>
            </InputGroup>
          )}
          
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

export default LinkedInPreviewModal;