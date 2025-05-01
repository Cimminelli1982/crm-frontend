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
`;

const ExtractionTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #ddd;
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #bbb;
  font-size: 13px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  
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
    width: '400px',
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
      const response = await fetch('/.netlify/functions/linkedin-job-extract', {
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
        company: extractedCompany
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