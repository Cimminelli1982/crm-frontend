import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { FiX, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaLinkedin, FaTag, FaMapMarkerAlt } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const ContactMergeModal = ({
  isOpen,
  onClose,
  primaryContact,
  duplicateContact,
  theme,
  onMergeComplete
}) => {
  // Define the fields to merge through
  const mergeFields = [
    { key: 'name', label: 'Name', icon: FaUser, type: 'single' },
    { key: 'category', label: 'Category', icon: FaUser, type: 'single' },
    { key: 'job_role', label: 'Job Role', icon: FaBuilding, type: 'single' },
    { key: 'emails', label: 'Emails', icon: FaEnvelope, type: 'array' },
    { key: 'mobiles', label: 'Mobiles', icon: FaPhone, type: 'array' },
    { key: 'linkedin', label: 'LinkedIn', icon: FaLinkedin, type: 'single' },
    { key: 'tags', label: 'Tags', icon: FaTag, type: 'array' },
    { key: 'cities', label: 'Cities', icon: FaMapMarkerAlt, type: 'array' },
    { key: 'companies', label: 'Companies', icon: FaBuilding, type: 'array' },
    { key: 'score', label: 'Score', icon: FaUser, type: 'single' },
    { key: 'keep_in_touch_frequency', label: 'Keep in Touch', icon: FaUser, type: 'single' }
  ];

  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [mergeSelections, setMergeSelections] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [primaryContactData, setPrimaryContactData] = useState(null);
  const [duplicateContactData, setDuplicateContactData] = useState(null);

  const currentField = mergeFields[currentFieldIndex];
  const isLastField = currentFieldIndex === mergeFields.length - 1;
  const isFirstField = currentFieldIndex === 0;

  // Load full contact data when modal opens
  useEffect(() => {
    if (isOpen && primaryContact && duplicateContact) {
      loadContactData();
      initializeMergeSelections();
    }
  }, [isOpen, primaryContact, duplicateContact]);

  const loadContactData = async () => {
    try {
      // Load primary contact data with all related tables
      const { data: primaryData, error: primaryError } = await supabase
        .from('contacts')
        .select(`
          *,
          contact_emails (email_id, email, type, is_primary),
          contact_mobiles (mobile_id, mobile, type, is_primary),
          contact_tags (
            entry_id,
            tags (tag_id, name)
          ),
          contact_cities (
            entry_id,
            cities (city_id, name, country)
          ),
          contact_companies (
            contact_companies_id,
            relationship,
            is_primary,
            companies (company_id, name, category)
          )
        `)
        .eq('contact_id', primaryContact.contact_id)
        .single();

      if (primaryError) throw primaryError;

      // Load duplicate contact data with all related tables
      const { data: duplicateData, error: duplicateError } = await supabase
        .from('contacts')
        .select(`
          *,
          contact_emails (email_id, email, type, is_primary),
          contact_mobiles (mobile_id, mobile, type, is_primary),
          contact_tags (
            entry_id,
            tags (tag_id, name)
          ),
          contact_cities (
            entry_id,
            cities (city_id, name, country)
          ),
          contact_companies (
            contact_companies_id,
            relationship,
            is_primary,
            companies (company_id, name, category)
          )
        `)
        .eq('contact_id', duplicateContact.contact_id)
        .single();

      if (duplicateError) throw duplicateError;

      setPrimaryContactData(primaryData);
      setDuplicateContactData(duplicateData);
    } catch (error) {
      console.error('Error loading contact data:', error);
      toast.error('Failed to load contact data');
    }
  };

  const initializeMergeSelections = () => {
    const initialSelections = {};
    mergeFields.forEach(field => {
      // Default to primary for single fields, combine for arrays
      initialSelections[field.key] = field.type === 'array' ? 'combine' : 'primary';
    });
    setMergeSelections(initialSelections);
  };

  const handleFieldChoice = (choice) => {
    setMergeSelections(prev => ({
      ...prev,
      [currentField.key]: choice
    }));

    // Move to next field after a brief delay for visual feedback
    setTimeout(() => {
      if (isLastField) {
        // If last field, show completion and process merge
        processMerge();
      } else {
        setCurrentFieldIndex(prev => prev + 1);
      }
    }, 200);
  };

  const goToPreviousField = () => {
    if (!isFirstField) {
      setCurrentFieldIndex(prev => prev - 1);
    }
  };

  const goToNextField = () => {
    if (!isLastField) {
      setCurrentFieldIndex(prev => prev + 1);
    }
  };

  const processMerge = async () => {
    if (!primaryContactData || !duplicateContactData) return;

    setIsProcessing(true);
    try {
      // Process merge based on selections (simplified version of the logic from ContactCrmWorkflow)
      const mergedData = {};

      // Process each field based on selection
      for (const field of mergeFields) {
        const selection = mergeSelections[field.key];

        if (field.type === 'single') {
          if (selection === 'primary') {
            mergedData[field.key] = primaryContactData[field.key];
          } else if (selection === 'duplicate') {
            mergedData[field.key] = duplicateContactData[field.key];
          }
        } else if (field.type === 'array') {
          // Handle array merging (simplified)
          if (selection === 'primary') {
            mergedData[field.key] = primaryContactData[field.key] || [];
          } else if (selection === 'duplicate') {
            mergedData[field.key] = duplicateContactData[field.key] || [];
          } else if (selection === 'combine') {
            // Combine arrays (this would need more sophisticated logic)
            mergedData[field.key] = [
              ...(primaryContactData[field.key] || []),
              ...(duplicateContactData[field.key] || [])
            ];
          }
        }
      }

      // Update the primary contact with merged data
      const { error: updateError } = await supabase
        .from('contacts')
        .update(mergedData)
        .eq('contact_id', primaryContact.contact_id);

      if (updateError) throw updateError;

      // Delete the duplicate contact
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', duplicateContact.contact_id);

      if (deleteError) throw deleteError;

      toast.success('Contacts merged successfully');
      onMergeComplete?.(primaryContact, duplicateContact);
      onClose();
    } catch (error) {
      console.error('Error merging contacts:', error);
      toast.error('Failed to merge contacts');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFieldValue = (contact, field) => {
    if (!contact) return 'Loading...';

    switch (field.key) {
      case 'name':
        return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'No name';
      case 'emails':
        return contact.contact_emails?.length
          ? contact.contact_emails.map(e => e.email).join(', ')
          : 'No emails';
      case 'mobiles':
        return contact.contact_mobiles?.length
          ? contact.contact_mobiles.map(m => m.mobile).join(', ')
          : 'No mobiles';
      case 'tags':
        return contact.contact_tags?.length
          ? contact.contact_tags.map(t => t.tags?.name).join(', ')
          : 'No tags';
      case 'cities':
        return contact.contact_cities?.length
          ? contact.contact_cities.map(c => c.cities?.name).join(', ')
          : 'No cities';
      case 'companies':
        return contact.contact_companies?.length
          ? contact.contact_companies.map(c => c.companies?.name).join(', ')
          : 'No companies';
      default:
        return contact[field.key] || '-';
    }
  };

  const canCombine = currentField?.type === 'array';

  // Debug logging
  console.log('ContactMergeModal render - isOpen:', isOpen);
  console.log('ContactMergeModal render - primaryContact:', primaryContact);
  console.log('ContactMergeModal render - duplicateContact:', duplicateContact);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999
        },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '0',
          border: 'none',
          borderRadius: '12px',
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          maxWidth: '533px',
          width: '60%',
          height: '70vh',
          maxHeight: '70vh'
        }
      }}
    >
      <ModalContent theme={theme}>
        <ModalHeader theme={theme}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>
              Merge Contacts
            </h3>
            <ProgressText theme={theme}>
              {currentFieldIndex + 1} of {mergeFields.length} fields
            </ProgressText>
          </div>
          <CloseButton theme={theme} onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ProgressBar>
          {mergeFields.map((_, index) => (
            <ProgressStep
              key={index}
              $completed={index < currentFieldIndex}
              $active={index === currentFieldIndex}
            />
          ))}
        </ProgressBar>

        <ModalBody>
          {!isProcessing ? (
            <>
              <FieldCard theme={theme}>
                <FieldIcon>
                  <currentField.icon />
                </FieldIcon>
                <FieldTitle theme={theme}>{currentField.label}</FieldTitle>

                <ComparisonContainer>
                  <ContactOption theme={theme}>
                    <OptionHeader theme={theme}>Primary Contact</OptionHeader>
                    <OptionName theme={theme}>
                      {primaryContact?.first_name} {primaryContact?.last_name}
                    </OptionName>
                    <OptionValue theme={theme}>
                      {formatFieldValue(primaryContactData, currentField)}
                    </OptionValue>
                  </ContactOption>

                  <VS theme={theme}>VS</VS>

                  <ContactOption theme={theme}>
                    <OptionHeader theme={theme}>Duplicate Contact</OptionHeader>
                    <OptionName theme={theme}>
                      {duplicateContact?.first_name} {duplicateContact?.last_name}
                    </OptionName>
                    <OptionValue theme={theme}>
                      {formatFieldValue(duplicateContactData, currentField)}
                    </OptionValue>
                  </ContactOption>
                </ComparisonContainer>
              </FieldCard>

              <ButtonContainer>
                <TinderButton
                  variant="primary"
                  onClick={() => handleFieldChoice('primary')}
                  theme={theme}
                >
                  👈 Keep Primary
                </TinderButton>

                {canCombine && (
                  <TinderButton
                    variant="combine"
                    onClick={() => handleFieldChoice('combine')}
                    theme={theme}
                  >
                    🔀 Combine
                  </TinderButton>
                )}

                <TinderButton
                  variant="duplicate"
                  onClick={() => handleFieldChoice('duplicate')}
                  theme={theme}
                >
                  👉 Keep Duplicate
                </TinderButton>
              </ButtonContainer>

              <NavigationContainer>
                <NavButton
                  onClick={goToPreviousField}
                  disabled={isFirstField}
                  theme={theme}
                >
                  <FiChevronLeft /> Previous
                </NavButton>

                <NavButton
                  onClick={goToNextField}
                  disabled={isLastField}
                  theme={theme}
                >
                  Next <FiChevronRight />
                </NavButton>
              </NavigationContainer>
            </>
          ) : (
            <ProcessingContainer>
              <ProcessingIcon>
                <FiCheck />
              </ProcessingIcon>
              <ProcessingText theme={theme}>Merging contacts...</ProcessingText>
            </ProcessingContainer>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Styled Components
const ModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  h3 {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const ProgressText = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 4px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 18px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
  }
`;

const ProgressBar = styled.div`
  display: flex;
  height: 4px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
`;

const ProgressStep = styled.div`
  flex: 1;
  height: 100%;
  background: ${props => {
    if (props.$active) return '#3B82F6';
    if (props.$completed) return '#10B981';
    return 'transparent';
  }};
  transition: background-color 0.3s ease;
`;

const ModalBody = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const FieldCard = styled.div`
  background: ${props => props.theme === 'light' ? '#FAFAFA' : '#111827'};
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const FieldIcon = styled.div`
  font-size: 32px;
  color: #3B82F6;
  margin-bottom: 16px;
`;

const FieldTitle = styled.h2`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: 600;
`;

const ComparisonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
`;

const ContactOption = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  padding: 16px;
  text-align: center;
`;

const OptionHeader = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const OptionName = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 8px;
  font-size: 14px;
`;

const OptionValue = styled.div`
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
`;

const VS = styled.div`
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding: 16px 0;
`;

const TinderButton = styled.button`
  flex: 1;
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  background: ${props => {
    switch (props.variant) {
      case 'primary': return '#EF4444';
      case 'combine': return '#3B82F6';
      case 'duplicate': return '#10B981';
      default: return '#6B7280';
    }
  }};

  color: white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const NavButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProcessingContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const ProcessingIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #10B981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 16px;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;

const ProcessingText = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

export default ContactMergeModal;