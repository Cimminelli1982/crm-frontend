import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
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
  padding: 15px;
  color: #eee;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const LinkedInBadgeContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const FullProfileLink = styled.a`
  display: inline-block;
  margin-top: 15px;
  padding: 8px 12px;
  background: #0077b5;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 14px;
  
  &:hover {
    background: #005e93;
  }
`;

// Modal styles for a smaller window
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
    width: '350px',
    height: '320px',
    overflow: 'hidden'
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

const LinkedInBadgeModal = ({ isOpen, onClose, linkedInUrl, contactName }) => {
  const [badgeLoaded, setBadgeLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && linkedInUrl) {
      // Load LinkedIn badge script
      const script = document.createElement('script');
      script.src = 'https://platform.linkedin.com/badges/js/profile.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      // Clean up
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isOpen, linkedInUrl]);

  // Extract LinkedIn username from URL
  const getLinkedInUsername = (url) => {
    if (!url) return '';
    
    // Handle various LinkedIn URL formats
    const regex = /linkedin\.com\/in\/([^\/\?]+)/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };
  
  const username = getLinkedInUsername(linkedInUrl);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel="LinkedIn Profile"
    >
      <ModalHeader>
        <h3 style={{ margin: 0, fontSize: '16px' }}>LinkedIn Profile: {contactName}</h3>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      <ModalContent>
        {linkedInUrl ? (
          <LinkedInBadgeContainer>
            {/* LinkedIn Badge */}
            <div 
              className="LI-profile-badge" 
              data-version="v1" 
              data-size="medium" 
              data-locale="en_US" 
              data-type="horizontal" 
              data-theme="dark" 
              data-vanity={username}
            >
              <a 
                className="LI-simple-link" 
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {contactName} on LinkedIn
              </a>
            </div>
            
            {/* Fallback if badge doesn't load */}
            {!badgeLoaded && (
              <FullProfileLink 
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Full LinkedIn Profile
              </FullProfileLink>
            )}
          </LinkedInBadgeContainer>
        ) : (
          <div style={{ textAlign: 'center', color: '#999' }}>
            No LinkedIn profile URL available
          </div>
        )}
      </ModalContent>
    </Modal>
  );
};

export default LinkedInBadgeModal;