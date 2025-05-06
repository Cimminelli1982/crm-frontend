import React, { useState } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiCheck, FiLoader, FiExternalLink } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
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
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  background: #222;
  border: 1px solid #444;
  padding: 10px 12px;
  border-radius: 4px;
  color: #fff;
  font-size: 16px;
  margin-bottom: 5px;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ExtractButton = styled(Button)`
  background: #00ff00;
  color: #000;
`;

const CancelButton = styled(Button)`
  background: #333;
  color: #fff;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const ResultsContainer = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 15px;
  margin-top: 20px;
`;

const ResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ResultLabel = styled.div`
  color: #999;
`;

const ResultValue = styled.div`
  color: #fff;
  max-width: 60%;
  word-break: break-word;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  padding: 10px;
  margin-top: 10px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 4px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  flex-direction: column;
  gap: 15px;
  color: #ccc;
`;

const Spinner = styled.div`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  animation: spin 1.5s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
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

const LinkedInExtractModal = ({ isOpen, onClose, contactId, onDataExtracted }) => {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  const handleExtract = async () => {
    if (!linkedinUrl) return;
    
    try {
      setIsExtracting(true);
      setError(null);
      
      // Call Netlify function to extract data
      const response = await fetch('/.netlify/functions/extract-linkedin-data', {
        method: 'POST',
        body: JSON.stringify({ url: linkedinUrl })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to extract LinkedIn data');
      }
      
      setExtractedData(data);
    } catch (err) {
      console.error('Error extracting LinkedIn data:', err);
      setError(err.message || 'An error occurred while extracting data from LinkedIn');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveData = async () => {
    if (!extractedData || !contactId) return;
    
    try {
      setIsExtracting(true);
      
      const updates = {};
      let companyId = null;
      
      // Update job role if available
      if (extractedData.jobRole) {
        updates.job_role = extractedData.jobRole;
      }
      
      // Update LinkedIn URL if provided
      if (linkedinUrl) {
        updates.linkedin = linkedinUrl;
      }
      
      // Only update if we have changes
      if (Object.keys(updates).length > 0) {
        updates.last_modified_at = new Date();
        
        // Update contact record
        const { error: updateError } = await supabase
          .from('contacts')
          .update(updates)
          .eq('contact_id', contactId);
          
        if (updateError) throw updateError;
      }
      
      // Handle company if available
      if (extractedData.company) {
        // Check if company already exists
        const { data: existingCompanies, error: companyError } = await supabase
          .from('companies')
          .select('company_id, name')
          .ilike('name', extractedData.company)
          .limit(1);
          
        if (companyError) throw companyError;
        
        if (existingCompanies && existingCompanies.length > 0) {
          // Use existing company
          companyId = existingCompanies[0].company_id;
        } else {
          // Create new company
          const { data: newCompany, error: createError } = await supabase
            .from('companies')
            .insert({
              name: extractedData.company,
              created_at: new Date()
            })
            .select();
            
          if (createError) throw createError;
          
          if (newCompany && newCompany.length > 0) {
            companyId = newCompany[0].company_id;
          }
        }
        
        // If we have a company ID, associate it with the contact
        if (companyId) {
          // Check if association already exists
          const { data: existingAssoc, error: assocQueryError } = await supabase
            .from('contact_companies')
            .select('contact_company_id')
            .eq('contact_id', contactId)
            .eq('company_id', companyId);
            
          if (assocQueryError) throw assocQueryError;
          
          if (!existingAssoc || existingAssoc.length === 0) {
            // Create new association
            const { error: createAssocError } = await supabase
              .from('contact_companies')
              .insert({
                contact_id: contactId,
                company_id: companyId,
                created_at: new Date()
              });
              
            if (createAssocError) throw createAssocError;
          }
        }
      }
      
      toast.success('LinkedIn data saved successfully');
      
      // Notify parent component that data was extracted and saved
      if (onDataExtracted) {
        onDataExtracted({
          jobRole: extractedData.jobRole,
          company: extractedData.company,
          linkedinUrl
        });
      }
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error saving LinkedIn data:', err);
      setError('Failed to save LinkedIn data: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel="Extract LinkedIn Data"
    >
      <ModalHeader>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Extract LinkedIn Data</h2>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      <ModalContent>
        <FormGroup>
          <Label>LinkedIn Profile URL</Label>
          <Input
            type="text"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/username"
            disabled={isExtracting}
          />
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
            Enter the full LinkedIn profile URL to extract job role and company information
          </div>
        </FormGroup>
        
        {isExtracting && (
          <LoadingContainer>
            <Spinner>
              <FiLoader />
            </Spinner>
            <div>Extracting data from LinkedIn...</div>
          </LoadingContainer>
        )}
        
        {error && !isExtracting && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}
        
        {extractedData && !isExtracting && (
          <ResultsContainer>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Extracted Information</h3>
            
            <ResultItem>
              <ResultLabel>Job Role</ResultLabel>
              <ResultValue>{extractedData.jobRole || 'Not found'}</ResultValue>
            </ResultItem>
            
            <ResultItem>
              <ResultLabel>Company</ResultLabel>
              <ResultValue>{extractedData.company || 'Not found'}</ResultValue>
            </ResultItem>
          </ResultsContainer>
        )}
        
        <ButtonGroup>
          <CancelButton onClick={onClose} disabled={isExtracting}>
            Cancel
          </CancelButton>
          
          {!extractedData ? (
            <ExtractButton onClick={handleExtract} disabled={!linkedinUrl || isExtracting}>
              {isExtracting ? <FiLoader /> : <FiExternalLink />} Extract Data
            </ExtractButton>
          ) : (
            <ExtractButton onClick={handleSaveData} disabled={isExtracting}>
              {isExtracting ? <FiLoader /> : <FiCheck />} Save Data
            </ExtractButton>
          )}
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
};

export default LinkedInExtractModal;