import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { 
  FiX, 
  FiCheck, 
  FiAlertTriangle, 
  FiMail, 
  FiPhone, 
  FiTag, 
  FiMapPin, 
  FiBriefcase, 
  FiGitMerge,
  FiExternalLink
} from 'react-icons/fi';

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;

  h2 {
    color: #00ff00;
    margin: 0;
    font-size: 1.2rem;
    font-family: 'Courier New', monospace;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ff5555;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #ff0000;
  }
`;

const Card = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  padding: 20px;
  margin-bottom: 15px;
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

const StepContent = styled.div`
  margin-bottom: 30px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #00ff00;
  color: #000;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: #00cc00;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: transparent;
  color: #ccc;
  border: 1px solid #555;
  
  &:hover:not(:disabled) {
    background-color: #333;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
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

const DuplicateProcessingModal = ({ 
  isOpen, 
  onClose, 
  primaryContactId,
  duplicateContactId,
  onComplete 
}) => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [primaryContact, setPrimaryContact] = useState(null);
  const [duplicateContact, setDuplicateContact] = useState(null);
  const [mergeSelections, setMergeSelections] = useState({});

  // Modal custom styles
  const modalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      padding: '25px',
      maxWidth: '800px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
      backgroundColor: '#121212',
      border: '1px solid #333',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
      color: '#e0e0e0',
      zIndex: 1001
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000
    }
  };

  // Load contact data when modal opens
  useEffect(() => {
    if (isOpen && primaryContactId && duplicateContactId) {
      loadContactData();
    }
  }, [isOpen, primaryContactId, duplicateContactId]);

  // Load all contact data
  const loadContactData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load both contacts in parallel
      const [primaryResult, duplicateResult] = await Promise.all([
        loadContact(primaryContactId),
        loadContact(duplicateContactId)
      ]);
      
      setPrimaryContact(primaryResult);
      setDuplicateContact(duplicateResult);
      
      // Initialize merge selections with primary contact as default
      initializeMergeSelections(primaryResult, duplicateResult);
    } catch (err) {
      console.error('Error loading contact data:', err);
      setError('Failed to load contact data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load a single contact with all related data
  const loadContact = async (contactId) => {
    // Get basic contact info
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('contact_id', contactId)
      .single();
      
    if (contactError) throw contactError;
    if (!contactData) throw new Error(`Contact ${contactId} not found`);
    
    // Get related data in parallel
    const [
      emailsResult, 
      mobilesResult, 
      tagsResult, 
      citiesResult, 
      companiesResult
    ] = await Promise.all([
      // Get emails
      supabase
        .from('contact_emails')
        .select('*')
        .eq('contact_id', contactId),
        
      // Get mobiles
      supabase
        .from('contact_mobiles')
        .select('*')
        .eq('contact_id', contactId),
        
      // Get tags
      supabase
        .from('contact_tags')
        .select('tags (*)')
        .eq('contact_id', contactId),
        
      // Get cities
      supabase
        .from('contact_cities')
        .select('cities (*)')
        .eq('contact_id', contactId),
        
      // Get companies
      supabase
        .from('contact_companies')
        .select('companies (*), relationship, is_primary')
        .eq('contact_id', contactId)
    ]);
    
    // Combine all data
    return {
      ...contactData,
      emails: emailsResult.data || [],
      mobiles: mobilesResult.data || [],
      tags: tagsResult.data?.map(t => t.tags) || [],
      cities: citiesResult.data?.map(c => c.cities) || [],
      companies: companiesResult.data || []
    };
  };

  // Initialize merge selections
  const initializeMergeSelections = (primary, duplicate) => {
    // Create initial merge selections with primary contact as default
    const initialSelections = {
      first_name: 'primary',
      last_name: 'primary',
      category: 'primary',
      job_role: 'primary',
      linkedin: 'primary',
      description: 'primary',
      score: 'primary',
      birthday: 'primary',
      keep_in_touch_frequency: 'primary',
      // For collections, we'll have special handling
      emails: 'combine',
      mobiles: 'combine',
      tags: 'combine',
      cities: 'combine',
      companies: 'combine'
    };
    
    // Check if duplicate has better/more data for fields
    if (!primary.first_name && duplicate.first_name) initialSelections.first_name = 'duplicate';
    if (!primary.last_name && duplicate.last_name) initialSelections.last_name = 'duplicate';
    if (primary.category === 'Inbox' && duplicate.category !== 'Inbox') initialSelections.category = 'duplicate';
    if (!primary.job_role && duplicate.job_role) initialSelections.job_role = 'duplicate';
    if (!primary.linkedin && duplicate.linkedin) initialSelections.linkedin = 'duplicate';
    if (!primary.description && duplicate.description) initialSelections.description = 'duplicate';
    if ((primary.score === null || primary.score === undefined) && duplicate.score !== null) initialSelections.score = 'duplicate';
    if (!primary.birthday && duplicate.birthday) initialSelections.birthday = 'duplicate';
    if (!primary.keep_in_touch_frequency && duplicate.keep_in_touch_frequency) initialSelections.keep_in_touch_frequency = 'duplicate';
    
    setMergeSelections(initialSelections);
  };

  // Handle merge selection change
  const handleMergeSelectionChange = (field, value) => {
    setMergeSelections(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle the merge process
  const handleMerge = async () => {
    if (!primaryContact || !duplicateContact) return;
    
    setLoading(true);
    
    try {
      // Create a complete snapshot of the duplicate contact and its related data
      const duplicateSnapshot = {
        contact: duplicateContact,
        emails: duplicateContact.emails || [],
        mobiles: duplicateContact.mobiles || [],
        tags: duplicateContact.tags || [],
        cities: duplicateContact.cities || [],
        companies: duplicateContact.companies || []
      };
      
      // First primary mobile or email for the duplicate record
      const primaryMobile = duplicateContact.mobiles?.find(m => m.is_primary)?.mobile || 
                        duplicateContact.mobiles?.[0]?.mobile || 
                        '';
                        
      const primaryEmail = duplicateContact.emails?.find(e => e.is_primary)?.email || 
                       duplicateContact.emails?.[0]?.email ||
                       '';
      
      // First check if there's already a record for this pair of contacts
      const { data: existingDuplicate, error: checkError } = await supabase
        .from('contact_duplicates')
        .select('duplicate_id, status')
        .eq('primary_contact_id', primaryContactId)
        .eq('duplicate_contact_id', duplicateContactId)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      let duplicateRecord;
      
      if (existingDuplicate) {
        // Update the existing record with new merge selections and reset status
        const { data: updatedRecord, error: updateError } = await supabase
          .from('contact_duplicates')
          .update({
            status: 'pending',
            notes: 'Manually merged via Duplicate Processing Modal',
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
            primary_contact_id: primaryContactId,
            duplicate_contact_id: duplicateContactId,
            mobile_number: primaryMobile,
            email: primaryEmail,
            detected_at: new Date().toISOString(),
            status: 'pending',
            notes: 'Manually merged via Duplicate Processing Modal',
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
      
      // Check the status of the merge periodically
      const checkMergeStatus = async (duplicateId, attempts = 0) => {
        // Limit to a maximum of 5 attempts
        if (attempts >= 5) {
          console.log('Maximum status check attempts reached');
          // Assume it was successful anyway and proceed
          toast.success('Merge process initiated! Changes will take effect shortly.');
          if (onComplete) onComplete('merged', primaryContactId);
          closeModal();
          return;
        }
        
        try {
          // Wait a moment to let the database process the merge
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log(`Checking merge status (attempt ${attempts + 1}/5)...`);
          
          const { data: statusData, error: statusError } = await supabase
            .from('contact_duplicates')
            .select('status, error_message')
            .eq('duplicate_id', duplicateId)
            .single();
            
          if (statusError) {
            console.error('Error checking merge status:', statusError);
            // Even if there's an error checking status, proceed with the merge
            if (attempts >= 2) {
              toast.success('Merge process initiated! Changes will take effect shortly.');
              if (onComplete) onComplete('merged', primaryContactId);
              closeModal();
            } else {
              // Try again
              setTimeout(() => checkMergeStatus(duplicateId, attempts + 1), 2000);
            }
            return;
          }
          
          if (!statusData) {
            console.warn('No status data returned');
            // Proceed anyway after a couple attempts
            if (attempts >= 2) {
              toast.success('Merge process initiated! Changes will take effect shortly.');
              if (onComplete) onComplete('merged', primaryContactId);
              closeModal();
            } else {
              setTimeout(() => checkMergeStatus(duplicateId, attempts + 1), 2000);
            }
            return;
          }
          
          console.log('Merge status:', statusData.status);
          
          if (statusData.status === 'completed') {
            toast.success('Contacts successfully merged!');
            // Call onComplete to inform parent component
            if (onComplete) onComplete('merged', primaryContactId);
            closeModal();
          } else if (statusData.status === 'failed') {
            toast.error(`Merge failed: ${statusData.error_message || 'Unknown error'}`);
            setLoading(false);
          } else if (['pending', 'processing'].includes(statusData.status)) {
            // Still processing, check again in a few seconds
            setTimeout(() => checkMergeStatus(duplicateId, attempts + 1), 2000);
          } else {
            // Unknown status, assume it's working anyway after a few attempts
            if (attempts >= 2) {
              toast.success('Merge process initiated! Changes will take effect shortly.');
              if (onComplete) onComplete('merged', primaryContactId);
              closeModal();
            } else {
              setTimeout(() => checkMergeStatus(duplicateId, attempts + 1), 2000);
            }
          }
        } catch (err) {
          console.error('Error in checkMergeStatus:', err);
          // Even if there's an exception, after a few attempts, proceed
          if (attempts >= 2) {
            toast.success('Merge process initiated! Changes will take effect shortly.');
            if (onComplete) onComplete('merged', primaryContactId);
            closeModal();
          } else {
            setTimeout(() => checkMergeStatus(duplicateId, attempts + 1), 2000);
          }
        }
      };
      
      // Start checking for the merge status
      checkMergeStatus(duplicateRecord.duplicate_id);
      
    } catch (err) {
      console.error('Error initiating merge:', err);
      toast.error('Failed to initiate merge: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  // Handle closing the modal
  const closeModal = () => {
    // Reset state
    setPrimaryContact(null);
    setDuplicateContact(null);
    setError(null);
    setLoading(false);
    
    // Call the parent's onClose
    onClose();
  };

  // Render helper for the contact sections
  const renderContactSection = (contact, title) => {
    if (!contact) return null;
    
    return (
      <Card>
        <SectionTitle>{title}</SectionTitle>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px', color: '#00ff00' }}>
            {contact.first_name} {contact.last_name}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.9rem', color: '#ccc' }}>
            {contact.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FiMail size={14} />
                {contact.email}
              </div>
            )}
            {contact.mobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FiPhone size={14} />
                {contact.mobile}
              </div>
            )}
            {contact.category && <Badge>{contact.category}</Badge>}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={loading ? null : closeModal}
      shouldCloseOnOverlayClick={!loading}
      style={modalStyles}
      contentLabel="Duplicate Processing"
    >
      <ModalHeader>
        <h2>Merge Duplicate Contacts</h2>
        <CloseButton onClick={closeModal} disabled={loading}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      {error && (
        <div style={{ 
          backgroundColor: 'rgba(255, 70, 70, 0.2)', 
          color: '#ff9999', 
          padding: '10px 15px',
          borderRadius: '4px',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FiAlertTriangle />
          <div>{error}</div>
        </div>
      )}
      
      {loading ? (
        <LoadingContainer>
          <div style={{ color: '#00ff00', marginBottom: '10px' }}>Loading contact data...</div>
        </LoadingContainer>
      ) : (
        <StepContent>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {renderContactSection(primaryContact, 'Primary Contact')}
            {renderContactSection(duplicateContact, 'Duplicate Contact')}
          </div>
          
          <Card>
            <SectionTitle>
              <FiGitMerge /> Merge Contact Data
            </SectionTitle>
            
            <p style={{ color: '#999', marginBottom: '15px' }}>
              Select which data to keep from each contact.
            </p>
            
            {primaryContact && duplicateContact && (
              <ComparisonTable>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Primary Contact</th>
                    <th>Duplicate Contact</th>
                    <th>Selection</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>{primaryContact.first_name} {primaryContact.last_name}</td>
                    <td>{duplicateContact.first_name} {duplicateContact.last_name}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <MergeOption>
                          <MergeRadio
                            type="radio"
                            name="merge_name"
                            value="primary"
                            checked={mergeSelections.first_name === 'primary' && mergeSelections.last_name === 'primary'}
                            onChange={() => {
                              handleMergeSelectionChange('first_name', 'primary');
                              handleMergeSelectionChange('last_name', 'primary');
                            }}
                          />
                          <span>Primary</span>
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
                    <td>{primaryContact.category || '-'}</td>
                    <td>{duplicateContact.category || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <MergeOption>
                          <MergeRadio
                            type="radio"
                            name="merge_category"
                            value="primary"
                            checked={mergeSelections.category === 'primary'}
                            onChange={() => handleMergeSelectionChange('category', 'primary')}
                          />
                          <span>Primary</span>
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
                    <td>{primaryContact.job_role || '-'}</td>
                    <td>{duplicateContact.job_role || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <MergeOption>
                          <MergeRadio
                            type="radio"
                            name="merge_job_role"
                            value="primary"
                            checked={mergeSelections.job_role === 'primary'}
                            onChange={() => handleMergeSelectionChange('job_role', 'primary')}
                          />
                          <span>Primary</span>
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
                      {primaryContact.emails.map(e => e.email).join(', ') || '-'}
                    </td>
                    <td>
                      {duplicateContact.emails.map(e => e.email).join(', ') || '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <MergeOption>
                          <MergeRadio
                            type="radio"
                            name="merge_emails"
                            value="primary"
                            checked={mergeSelections.emails === 'primary'}
                            onChange={() => handleMergeSelectionChange('emails', 'primary')}
                          />
                          <span>Primary</span>
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
                      {primaryContact.mobiles.map(m => m.mobile).join(', ') || '-'}
                    </td>
                    <td>
                      {duplicateContact.mobiles.map(m => m.mobile).join(', ') || '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <MergeOption>
                          <MergeRadio
                            type="radio"
                            name="merge_mobiles"
                            value="primary"
                            checked={mergeSelections.mobiles === 'primary'}
                            onChange={() => handleMergeSelectionChange('mobiles', 'primary')}
                          />
                          <span>Primary</span>
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
                      {primaryContact.tags.length > 0 ? primaryContact.tags.map(t => t.name).join(', ') : '-'}
                    </td>
                    <td>
                      {duplicateContact.tags.length > 0 ? duplicateContact.tags.map(t => t.name).join(', ') : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <MergeOption>
                          <MergeRadio
                            type="radio"
                            name="merge_tags"
                            value="primary"
                            checked={mergeSelections.tags === 'primary'}
                            onChange={() => handleMergeSelectionChange('tags', 'primary')}
                          />
                          <span>Primary</span>
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
                    <td>LinkedIn</td>
                    <td>{primaryContact.linkedin ? (primaryContact.linkedin.length > 30 ? primaryContact.linkedin.substring(0, 30) + '...' : primaryContact.linkedin) : '-'}</td>
                    <td>{duplicateContact.linkedin ? (duplicateContact.linkedin.length > 30 ? duplicateContact.linkedin.substring(0, 30) + '...' : duplicateContact.linkedin) : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <MergeOption>
                          <MergeRadio
                            type="radio"
                            name="merge_linkedin"
                            value="primary"
                            checked={mergeSelections.linkedin === 'primary'}
                            onChange={() => handleMergeSelectionChange('linkedin', 'primary')}
                          />
                          <span>Primary</span>
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
                    <td>{primaryContact.score !== null ? primaryContact.score : '-'}</td>
                    <td>{duplicateContact.score !== null ? duplicateContact.score : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <MergeOption>
                          <MergeRadio
                            type="radio"
                            name="merge_score"
                            value="primary"
                            checked={mergeSelections.score === 'primary'}
                            onChange={() => handleMergeSelectionChange('score', 'primary')}
                          />
                          <span>Primary</span>
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
                    <td>{primaryContact.keep_in_touch_frequency || '-'}</td>
                    <td>{duplicateContact.keep_in_touch_frequency || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <MergeOption>
                          <MergeRadio
                            type="radio"
                            name="merge_keep_in_touch_frequency"
                            value="primary"
                            checked={mergeSelections.keep_in_touch_frequency === 'primary'}
                            onChange={() => handleMergeSelectionChange('keep_in_touch_frequency', 'primary')}
                          />
                          <span>Primary</span>
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
            )}
          </Card>
          
          <ButtonGroup>
            <SecondaryButton onClick={closeModal} disabled={loading}>
              <FiX /> Cancel
            </SecondaryButton>
            
            <SecondaryButton 
              onClick={() => {
                // Store the contactIds in session storage
                if (primaryContact && duplicateContact) {
                  sessionStorage.setItem('workflow_contact_id', primaryContactId);
                  
                  // Check if both contacts have the same first and last name values
                  if (mergeSelections.first_name === mergeSelections.last_name) {
                    // Navigate to the ContactCrmWorkflow page
                    window.location.href = `/contacts/workflow/${primaryContactId}`;
                  } else {
                    // Navigate to the ContactCrmWorkflow page
                    window.location.href = `/contacts/workflow/${primaryContactId}`;
                  }
                }
              }} 
              disabled={loading}
              style={{ marginRight: 'auto', color: '#00aaff', borderColor: '#00aaff' }}
            >
              <FiExternalLink /> Edit and Match
            </SecondaryButton>
            
            <PrimaryButton onClick={handleMerge} disabled={loading}>
              <FiGitMerge /> {loading ? 'Merging...' : 'Merge Contacts'}
            </PrimaryButton>
          </ButtonGroup>
        </StepContent>
      )}
    </Modal>
  );
};

export default DuplicateProcessingModal;