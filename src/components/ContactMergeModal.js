import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { FiX, FiChevronLeft, FiChevronRight, FiCheck, FiEdit2 } from 'react-icons/fi';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [customValues, setCustomValues] = useState({});
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [emailsBeingProcessed, setEmailsBeingProcessed] = useState(new Set());
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailType, setNewEmailType] = useState('personal');
  const [mobilesBeingProcessed, setMobilesBeingProcessed] = useState(new Set());
  const [showAddMobile, setShowAddMobile] = useState(false);
  const [newMobile, setNewMobile] = useState('');
  const [newMobileType, setNewMobileType] = useState('personal');

  // Category enum values from Supabase
  const categoryOptions = [
    'Inbox', 'Skip', 'Professional Investor', 'Team', 'Advisor',
    'WhatsApp Group Contact', 'Supplier', 'Founder', 'Manager',
    'Friend and Family', 'Other', 'Student', 'Media', 'Not Set',
    'Institution', 'SUBSCRIBER NEWSLETTER', 'System'
  ];

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

  // Reload contact data when navigating between fields
  useEffect(() => {
    if (isOpen && primaryContact && duplicateContact && primaryContactData && duplicateContactData) {
      // Only reload if we have existing data (not the initial load)
      loadContactData();
    }
  }, [currentFieldIndex]);

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

  const handleFieldChoice = async (choice) => {
    if (choice === 'primary') {
      // Keep primary - no database update needed, just move to next field
      moveToNextField();
    } else if (choice === 'duplicate') {
      // Keep duplicate - immediately update primary contact with duplicate's value
      await updatePrimaryContactField(choice);
    }
  };

  const updatePrimaryContactField = async (choice) => {
    try {
      let updateData = {};

      if (currentField.key === 'name') {
        // Handle name field
        if (choice === 'duplicate') {
          updateData.first_name = duplicateContactData?.first_name || '';
          updateData.last_name = duplicateContactData?.last_name || '';
        }
      } else if (currentField.type === 'single') {
        // Handle single fields
        if (choice === 'duplicate') {
          updateData[currentField.key] = duplicateContactData?.[currentField.key] || '';
        }
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('contact_id', primaryContact.contact_id);

        if (error) throw error;

        // Update local primary contact data
        setPrimaryContactData(prev => ({
          ...prev,
          ...updateData
        }));

        console.log('Field updated successfully:', currentField.label, updateData);
        toast.success(`${currentField.label} updated successfully`);
        setUpdateTrigger(prev => prev + 1); // Force re-render
      }

      moveToNextField();
    } catch (error) {
      console.error('Error updating contact field:', error);
      toast.error(`Failed to update ${currentField.label}`);
    }
  };

  const moveToNextField = async () => {
    // If we're leaving the emails field, clean up duplicate emails immediately
    if (currentField?.key === 'emails') {
      await cleanupDuplicateEmails();
      // Reload contact data to reflect the cleanup
      await loadContactData();
      setUpdateTrigger(prev => prev + 1);
    }

    // If we're leaving the mobiles field, clean up duplicate mobiles immediately
    if (currentField?.key === 'mobiles') {
      await cleanupDuplicateMobiles();
      // Reload contact data to reflect the cleanup
      await loadContactData();
      setUpdateTrigger(prev => prev + 1);
    }

    setTimeout(() => {
      if (isLastField) {
        // All fields processed, complete the merge by deleting duplicate
        completeFieldProcessing();
      } else {
        setCurrentFieldIndex(prev => prev + 1);
      }
    }, 200);
  };

  const completeFieldProcessing = async () => {
    try {
      // Delete the duplicate contact since all processing is complete
      // (emails were already cleaned up when leaving the emails field)
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', duplicateContact.contact_id);

      if (deleteError) throw deleteError;

      toast.success('Contacts merged successfully');
      onMergeComplete?.(primaryContact, duplicateContact);
      onClose();
    } catch (error) {
      console.error('Error completing merge:', error);
      toast.error('Failed to complete merge');
    }
  };

  // Email management functions
  const moveEmailToPrimary = async (emailId, emailAddress) => {
    if (emailsBeingProcessed.has(emailId)) return;

    setEmailsBeingProcessed(prev => new Set([...prev, emailId]));

    try {
      // Check if primary already has this email address
      const existingEmail = primaryContactData?.contact_emails?.find(e => e.email === emailAddress);

      if (existingEmail) {
        // If duplicate email exists, just delete the duplicate's version
        const { error } = await supabase
          .from('contact_emails')
          .delete()
          .eq('email_id', emailId);

        if (error) throw error;
        toast.success('Duplicate email removed');
      } else {
        // Move email to primary contact
        const { error } = await supabase
          .from('contact_emails')
          .update({ contact_id: primaryContact.contact_id })
          .eq('email_id', emailId);

        if (error) throw error;
        toast.success('Email moved to primary contact');
      }

      // Reload contact data to reflect changes
      await loadContactData();
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error moving email:', error);
      toast.error('Failed to move email');
    } finally {
      setEmailsBeingProcessed(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
    }
  };

  const removeEmailFromPrimary = async (emailId) => {
    if (emailsBeingProcessed.has(emailId)) return;

    setEmailsBeingProcessed(prev => new Set([...prev, emailId]));

    try {
      // Check if this is the primary email
      const emailToRemove = primaryContactData?.contact_emails?.find(e => e.email_id === emailId);
      const isPrimaryEmail = emailToRemove?.is_primary;

      // Delete the email
      const { error } = await supabase
        .from('contact_emails')
        .delete()
        .eq('email_id', emailId);

      if (error) throw error;

      // If we removed the primary email, promote another one
      if (isPrimaryEmail) {
        await promoteNewPrimaryEmail();
      }

      toast.success('Email removed');

      // Reload contact data to reflect changes
      await loadContactData();
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error removing email:', error);
      toast.error('Failed to remove email');
    } finally {
      setEmailsBeingProcessed(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
    }
  };

  const promoteNewPrimaryEmail = async () => {
    try {
      // Find the first remaining email for this contact and make it primary
      const { data: remainingEmails, error: fetchError } = await supabase
        .from('contact_emails')
        .select('email_id')
        .eq('contact_id', primaryContact.contact_id)
        .limit(1);

      if (fetchError) throw fetchError;

      if (remainingEmails && remainingEmails.length > 0) {
        const { error: updateError } = await supabase
          .from('contact_emails')
          .update({ is_primary: true })
          .eq('email_id', remainingEmails[0].email_id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error promoting primary email:', error);
    }
  };

  const cleanupDuplicateEmails = async () => {
    try {
      // Delete all remaining emails from duplicate contact
      const { error } = await supabase
        .from('contact_emails')
        .delete()
        .eq('contact_id', duplicateContact.contact_id);

      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning up duplicate emails:', error);
    }
  };

  const addNewEmail = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      // Check if email already exists for this contact
      const existingEmail = primaryContactData?.contact_emails?.find(e => e.email === newEmail.trim());
      if (existingEmail) {
        toast.error('Email already exists for this contact');
        return;
      }

      // Add new email to primary contact
      const { error } = await supabase
        .from('contact_emails')
        .insert({
          contact_id: primaryContact.contact_id,
          email: newEmail.trim(),
          type: newEmailType,
          is_primary: primaryContactData?.contact_emails?.length === 0 // Make primary if no other emails
        });

      if (error) throw error;

      toast.success('Email added successfully');
      setShowAddEmail(false);
      setNewEmail('');
      setNewEmailType('personal');

      // Reload contact data to reflect changes
      await loadContactData();
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error adding email:', error);

      // More specific error messages
      if (error.message?.includes('Failed to fetch') || error.code === 'NETWORK_ERROR') {
        toast.error('Connection lost. Please check your internet and try again.');
      } else if (error.code === 'PGRST301') {
        toast.error('Database connection timeout. Please try again.');
      } else {
        toast.error('Failed to add email. Please try again.');
      }
    }
  };

  const cancelAddEmail = () => {
    setShowAddEmail(false);
    setNewEmail('');
    setNewEmailType('personal');
  };

  // Mobile management functions (identical to email functions)
  const moveMobileToPrimary = async (mobileId, mobileNumber) => {
    if (mobilesBeingProcessed.has(mobileId)) return;

    setMobilesBeingProcessed(prev => new Set([...prev, mobileId]));

    try {
      // Check if primary already has this mobile number
      const existingMobile = primaryContactData?.contact_mobiles?.find(m => m.mobile === mobileNumber);

      if (existingMobile) {
        // If duplicate mobile exists, just delete the duplicate's version
        const { error } = await supabase
          .from('contact_mobiles')
          .delete()
          .eq('mobile_id', mobileId);

        if (error) throw error;
        toast.success('Duplicate mobile removed');
      } else {
        // Move mobile to primary contact
        const { error } = await supabase
          .from('contact_mobiles')
          .update({ contact_id: primaryContact.contact_id })
          .eq('mobile_id', mobileId);

        if (error) throw error;
        toast.success('Mobile moved to primary contact');
      }

      // Reload contact data to reflect changes
      await loadContactData();
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error moving mobile:', error);
      toast.error('Failed to move mobile');
    } finally {
      setMobilesBeingProcessed(prev => {
        const newSet = new Set(prev);
        newSet.delete(mobileId);
        return newSet;
      });
    }
  };

  const removeMobileFromPrimary = async (mobileId) => {
    if (mobilesBeingProcessed.has(mobileId)) return;

    setMobilesBeingProcessed(prev => new Set([...prev, mobileId]));

    try {
      // Check if this is the primary mobile
      const mobileToRemove = primaryContactData?.contact_mobiles?.find(m => m.mobile_id === mobileId);
      const isPrimaryMobile = mobileToRemove?.is_primary;

      // Delete the mobile
      const { error } = await supabase
        .from('contact_mobiles')
        .delete()
        .eq('mobile_id', mobileId);

      if (error) throw error;

      // If we removed the primary mobile, promote another one
      if (isPrimaryMobile) {
        await promoteNewPrimaryMobile();
      }

      toast.success('Mobile removed');

      // Reload contact data to reflect changes
      await loadContactData();
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error removing mobile:', error);
      toast.error('Failed to remove mobile');
    } finally {
      setMobilesBeingProcessed(prev => {
        const newSet = new Set(prev);
        newSet.delete(mobileId);
        return newSet;
      });
    }
  };

  const promoteNewPrimaryMobile = async () => {
    try {
      // Find the first remaining mobile for this contact and make it primary
      const { data: remainingMobiles, error: fetchError } = await supabase
        .from('contact_mobiles')
        .select('mobile_id')
        .eq('contact_id', primaryContact.contact_id)
        .limit(1);

      if (fetchError) throw fetchError;

      if (remainingMobiles && remainingMobiles.length > 0) {
        const { error: updateError } = await supabase
          .from('contact_mobiles')
          .update({ is_primary: true })
          .eq('mobile_id', remainingMobiles[0].mobile_id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error promoting primary mobile:', error);
    }
  };

  const cleanupDuplicateMobiles = async () => {
    try {
      // Delete all remaining mobiles from duplicate contact
      const { error } = await supabase
        .from('contact_mobiles')
        .delete()
        .eq('contact_id', duplicateContact.contact_id);

      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning up duplicate mobiles:', error);
    }
  };

  const addNewMobile = async () => {
    if (!newMobile.trim()) {
      toast.error('Please enter a mobile number');
      return;
    }

    try {
      // Check if mobile already exists for this contact
      const existingMobile = primaryContactData?.contact_mobiles?.find(m => m.mobile === newMobile.trim());
      if (existingMobile) {
        toast.error('Mobile already exists for this contact');
        return;
      }

      // Add new mobile to primary contact
      const { error } = await supabase
        .from('contact_mobiles')
        .insert({
          contact_id: primaryContact.contact_id,
          mobile: newMobile.trim(),
          type: newMobileType,
          is_primary: primaryContactData?.contact_mobiles?.length === 0 // Make primary if no other mobiles
        });

      if (error) throw error;

      toast.success('Mobile added successfully');
      setShowAddMobile(false);
      setNewMobile('');
      setNewMobileType('personal');

      // Reload contact data to reflect changes
      await loadContactData();
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error adding mobile:', error);

      // More specific error messages
      if (error.message?.includes('Failed to fetch') || error.code === 'NETWORK_ERROR') {
        toast.error('Connection lost. Please check your internet and try again.');
      } else if (error.code === 'PGRST301') {
        toast.error('Database connection timeout. Please try again.');
      } else {
        toast.error('Failed to add mobile. Please try again.');
      }
    }
  };

  const cancelAddMobile = () => {
    setShowAddMobile(false);
    setNewMobile('');
    setNewMobileType('personal');
  };

  const handleEdit = () => {
    if (currentField.key === 'name') {
      // For name field, populate first and last name separately
      const primaryFirst = primaryContactData?.first_name || '';
      const primaryLast = primaryContactData?.last_name || '';
      setEditFirstName(primaryFirst);
      setEditLastName(primaryLast);
    } else if (currentField.key === 'category') {
      // For category field, populate current category
      const currentCategory = primaryContactData?.category || '';
      setEditCategory(currentCategory);
    } else {
      const currentValue = getCurrentFieldValue();
      setEditValue(currentValue);
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      let updateData = {};

      if (currentField.key === 'name') {
        // For name field, update both first_name and last_name
        updateData.first_name = editFirstName.trim();
        updateData.last_name = editLastName.trim();
      } else if (currentField.key === 'category') {
        // For category field, update category
        updateData.category = editCategory;
      } else {
        // For other single fields
        updateData[currentField.key] = editValue.trim();
      }

      // Update in database
      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('contact_id', primaryContact.contact_id);

      if (error) throw error;

      // Update local primary contact data
      setPrimaryContactData(prev => ({
        ...prev,
        ...updateData
      }));

      console.log('Field updated successfully:', currentField.label, updateData);
      toast.success(`${currentField.label} updated successfully`);
      setIsEditing(false);
      setUpdateTrigger(prev => prev + 1); // Force re-render

      // Move to next field
      moveToNextField();
    } catch (error) {
      console.error('Error updating contact field:', error);
      toast.error(`Failed to update ${currentField.label}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue('');
    setEditFirstName('');
    setEditLastName('');
    setEditCategory('');
  };

  const getCurrentFieldValue = () => {
    // Start with primary contact value as default
    const primaryValue = formatFieldValue(primaryContactData, currentField);
    const duplicateValue = formatFieldValue(duplicateContactData, currentField);

    // For name field, combine first and last name
    if (currentField.key === 'name') {
      const primaryFirst = primaryContactData?.first_name || '';
      const primaryLast = primaryContactData?.last_name || '';
      return `${primaryFirst} ${primaryLast}`.trim();
    }

    return primaryValue !== 'Loading...' ? primaryValue : duplicateValue;
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

  // Removed old processMerge function - now using immediate field updates

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
          zIndex: 10000
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
              <FieldCard theme={theme} key={`${currentField.key}-${updateTrigger}`}>
                <FieldIcon>
                  <currentField.icon />
                </FieldIcon>
                <FieldTitle theme={theme}>{currentField.label}</FieldTitle>

                {currentField.key !== 'emails' && currentField.key !== 'mobiles' && (
                  <ComparisonContainer>
                    <ContactOption theme={theme}>
                      <OptionHeader theme={theme}>Primary Contact</OptionHeader>
                      <OptionName theme={theme}>
                        {primaryContactData?.first_name || primaryContact?.first_name} {primaryContactData?.last_name || primaryContact?.last_name}
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
                )}
              </FieldCard>

              {currentField.key === 'emails' ? (
                // Special email bubble interface
                <EmailBubblesContainer>
                  <EmailSection>
                    <EmailSectionTitle theme={theme}>Primary Contact Emails</EmailSectionTitle>
                    <EmailBubbles>
                      {primaryContactData?.contact_emails?.map((email) => (
                        <EmailBubble key={email.email_id} theme={theme}>
                          <EmailContent>
                            <EmailAddress primary={email.is_primary}>
                              {email.email}
                              {email.is_primary && <PrimaryBadge theme={theme}>PRIMARY</PrimaryBadge>}
                            </EmailAddress>
                            <EmailType theme={theme}>{email.type}</EmailType>
                          </EmailContent>
                          <EmailAction
                            onClick={() => removeEmailFromPrimary(email.email_id)}
                            disabled={emailsBeingProcessed.has(email.email_id)}
                            theme={theme}
                            title="Remove email"
                          >
                            {emailsBeingProcessed.has(email.email_id) ? '⏳' : '❌'}
                          </EmailAction>
                        </EmailBubble>
                      ))}
                      {(!primaryContactData?.contact_emails || primaryContactData.contact_emails.length === 0) && (
                        <NoEmailsMessage theme={theme}>No emails</NoEmailsMessage>
                      )}

                      {showAddEmail ? (
                        <AddEmailForm>
                          <AddEmailInput
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Enter email address"
                            autoFocus
                          />
                          <AddEmailTypeSelect
                            value={newEmailType}
                            onChange={(e) => setNewEmailType(e.target.value)}
                          >
                            <option value="personal">Personal</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                          </AddEmailTypeSelect>
                          <AddEmailActions>
                            <AddEmailButton onClick={addNewEmail} variant="save">
                              ✓ Add
                            </AddEmailButton>
                            <AddEmailButton onClick={cancelAddEmail} variant="cancel">
                              ✕ Cancel
                            </AddEmailButton>
                          </AddEmailActions>
                        </AddEmailForm>
                      ) : (
                        <AddNewEmailButton onClick={() => setShowAddEmail(true)} theme={theme}>
                          + Add New Email
                        </AddNewEmailButton>
                      )}
                    </EmailBubbles>
                  </EmailSection>

                  <EmailSection>
                    <EmailSectionTitle theme={theme}>Duplicate Contact Emails</EmailSectionTitle>
                    <EmailBubbles>
                      {duplicateContactData?.contact_emails?.map((email) => {
                        // Check if this email already exists in primary
                        const alreadyInPrimary = primaryContactData?.contact_emails?.some(pe => pe.email === email.email);

                        return (
                          <EmailBubble key={email.email_id} theme={theme} faded={alreadyInPrimary}>
                            <EmailContent>
                              <EmailAddress primary={email.is_primary}>
                                {email.email}
                                {email.is_primary && <PrimaryBadge theme={theme}>PRIMARY</PrimaryBadge>}
                                {alreadyInPrimary && <DuplicateBadge theme={theme}>DUPLICATE</DuplicateBadge>}
                              </EmailAddress>
                              <EmailType theme={theme}>{email.type}</EmailType>
                            </EmailContent>
                            {!alreadyInPrimary && (
                              <EmailAction
                                onClick={() => moveEmailToPrimary(email.email_id, email.email)}
                                disabled={emailsBeingProcessed.has(email.email_id)}
                                theme={theme}
                                title="Move to primary"
                              >
                                {emailsBeingProcessed.has(email.email_id) ? '⏳' : '➡️'}
                              </EmailAction>
                            )}
                          </EmailBubble>
                        );
                      })}
                      {(!duplicateContactData?.contact_emails || duplicateContactData.contact_emails.length === 0) && (
                        <NoEmailsMessage theme={theme}>No emails</NoEmailsMessage>
                      )}
                    </EmailBubbles>
                  </EmailSection>

                  <EmailNextButton
                    onClick={moveToNextField}
                    theme={theme}
                  >
                    Next Field →
                  </EmailNextButton>
                </EmailBubblesContainer>
              ) : currentField.key === 'mobiles' ? (
                // Special mobile bubble interface (identical to emails)
                <EmailBubblesContainer>
                  <EmailSection>
                    <EmailSectionTitle theme={theme}>Primary Contact Mobiles</EmailSectionTitle>
                    <EmailBubbles>
                      {primaryContactData?.contact_mobiles?.map((mobile) => (
                        <EmailBubble key={mobile.mobile_id} theme={theme}>
                          <EmailContent>
                            <EmailAddress primary={mobile.is_primary}>
                              {mobile.mobile}
                              {mobile.is_primary && <PrimaryBadge theme={theme}>PRIMARY</PrimaryBadge>}
                            </EmailAddress>
                            <EmailType theme={theme}>{mobile.type}</EmailType>
                          </EmailContent>
                          <EmailAction
                            onClick={() => removeMobileFromPrimary(mobile.mobile_id)}
                            disabled={mobilesBeingProcessed.has(mobile.mobile_id)}
                            theme={theme}
                            title="Remove mobile"
                          >
                            {mobilesBeingProcessed.has(mobile.mobile_id) ? '⏳' : '❌'}
                          </EmailAction>
                        </EmailBubble>
                      ))}
                      {(!primaryContactData?.contact_mobiles || primaryContactData.contact_mobiles.length === 0) && (
                        <NoEmailsMessage theme={theme}>No mobiles</NoEmailsMessage>
                      )}

                      {showAddMobile ? (
                        <AddEmailForm>
                          <AddEmailInput
                            type="tel"
                            value={newMobile}
                            onChange={(e) => setNewMobile(e.target.value)}
                            placeholder="Enter mobile number"
                            autoFocus
                          />
                          <AddEmailTypeSelect
                            value={newMobileType}
                            onChange={(e) => setNewMobileType(e.target.value)}
                          >
                            <option value="personal">Personal</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                          </AddEmailTypeSelect>
                          <AddEmailActions>
                            <AddEmailButton onClick={addNewMobile} variant="save">
                              ✓ Add
                            </AddEmailButton>
                            <AddEmailButton onClick={cancelAddMobile} variant="cancel">
                              ✕ Cancel
                            </AddEmailButton>
                          </AddEmailActions>
                        </AddEmailForm>
                      ) : (
                        <AddNewEmailButton onClick={() => setShowAddMobile(true)} theme={theme}>
                          + Add New Mobile
                        </AddNewEmailButton>
                      )}
                    </EmailBubbles>
                  </EmailSection>

                  <EmailSection>
                    <EmailSectionTitle theme={theme}>Duplicate Contact Mobiles</EmailSectionTitle>
                    <EmailBubbles>
                      {duplicateContactData?.contact_mobiles?.map((mobile) => {
                        // Check if this mobile already exists in primary
                        const alreadyInPrimary = primaryContactData?.contact_mobiles?.some(pm => pm.mobile === mobile.mobile);

                        return (
                          <EmailBubble key={mobile.mobile_id} theme={theme} faded={alreadyInPrimary}>
                            <EmailContent>
                              <EmailAddress primary={mobile.is_primary}>
                                {mobile.mobile}
                                {mobile.is_primary && <PrimaryBadge theme={theme}>PRIMARY</PrimaryBadge>}
                                {alreadyInPrimary && <DuplicateBadge theme={theme}>DUPLICATE</DuplicateBadge>}
                              </EmailAddress>
                              <EmailType theme={theme}>{mobile.type}</EmailType>
                            </EmailContent>
                            {!alreadyInPrimary && (
                              <EmailAction
                                onClick={() => moveMobileToPrimary(mobile.mobile_id, mobile.mobile)}
                                disabled={mobilesBeingProcessed.has(mobile.mobile_id)}
                                theme={theme}
                                title="Move to primary"
                              >
                                {mobilesBeingProcessed.has(mobile.mobile_id) ? '⏳' : '➡️'}
                              </EmailAction>
                            )}
                          </EmailBubble>
                        );
                      })}
                      {(!duplicateContactData?.contact_mobiles || duplicateContactData.contact_mobiles.length === 0) && (
                        <NoEmailsMessage theme={theme}>No mobiles</NoEmailsMessage>
                      )}
                    </EmailBubbles>
                  </EmailSection>

                  <EmailNextButton
                    onClick={moveToNextField}
                    theme={theme}
                  >
                    Next Field →
                  </EmailNextButton>
                </EmailBubblesContainer>
              ) : isEditing ? (
                <EditContainer>
                  {currentField.key === 'name' ? (
                    <NameEditContainer>
                      <EditInput
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        placeholder="First name"
                        theme={theme}
                        autoFocus
                      />
                      <EditInput
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        placeholder="Last name"
                        theme={theme}
                      />
                    </NameEditContainer>
                  ) : currentField.key === 'category' ? (
                    <CategoryDropdown
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      theme={theme}
                      autoFocus
                    >
                      <option value="">Select category...</option>
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </CategoryDropdown>
                  ) : (
                    <EditInput
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Enter custom value"
                      theme={theme}
                      autoFocus
                    />
                  )}
                  <EditButtonContainer>
                    <EditActionButton
                      variant="cancel"
                      onClick={handleCancelEdit}
                      theme={theme}
                    >
                      <FiX /> Cancel
                    </EditActionButton>
                    <EditActionButton
                      variant="save"
                      onClick={handleSaveEdit}
                      theme={theme}
                    >
                      <FiCheck /> Save
                    </EditActionButton>
                  </EditButtonContainer>
                </EditContainer>
              ) : (
                <ButtonContainer>
                  <TinderButton
                    variant="primary"
                    onClick={() => handleFieldChoice('primary')}
                    theme={theme}
                  >
                    <ButtonContent>
                      <ButtonEmoji>👆</ButtonEmoji>
                      <ButtonText>Keep Primary</ButtonText>
                    </ButtonContent>
                  </TinderButton>

                  <TinderButton
                    variant="edit"
                    onClick={handleEdit}
                    theme={theme}
                  >
                    <FiEdit2 /> Edit
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
                    <ButtonContent>
                      <ButtonEmoji>👆</ButtonEmoji>
                      <ButtonText>Keep Duplicate</ButtonText>
                    </ButtonContent>
                  </TinderButton>
                </ButtonContainer>
              )}

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
      case 'primary': return '#10B981'; // Green for Keep Primary
      case 'edit': return '#3B82F6';
      case 'combine': return '#3B82F6';
      case 'duplicate': return '#EF4444'; // Red for Keep Duplicate
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

const EditContainer = styled.div`
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
`;

const NameEditContainer = styled.div`
  display: flex;
  gap: 12px;
`;

const EditInput = styled.input`
  padding: 12px 16px;
  border: 2px solid #3B82F6;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:focus {
    outline: none;
    border-color: #2563EB;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const CategoryDropdown = styled.select`
  padding: 12px 16px;
  border: 2px solid #3B82F6;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #2563EB;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  option {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    padding: 8px 12px;
  }
`;

const EditButtonContainer = styled.div`
  display: flex;
  gap: 12px;
`;

const EditActionButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  background: ${props => {
    switch (props.variant) {
      case 'save': return '#10B981';
      case 'cancel': return '#6B7280';
      default: return '#6B7280';
    }
  }};

  color: white;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ButtonContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const ButtonEmoji = styled.div`
  font-size: 20px;
  line-height: 1;
`;

const ButtonText = styled.div`
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
`;

// Email Bubble Components
const EmailBubblesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
  margin-top: auto;
`;

const EmailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EmailSectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin: 0;
  text-align: center;
`;

const EmailBubbles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 40px;
`;

const EmailBubble = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  transition: all 0.2s;
  opacity: ${props => props.faded ? 0.5 : 1};

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  }
`;

const EmailContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const EmailAddress = styled.div`
  font-size: 14px;
  font-weight: ${props => props.primary ? 600 : 500};
  color: #000000;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmailType = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  text-transform: capitalize;
`;

const PrimaryBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  background: #10B981;
  color: white;
  border-radius: 4px;
  text-transform: uppercase;
`;

const DuplicateBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  background: #F59E0B;
  color: white;
  border-radius: 4px;
  text-transform: uppercase;
`;

const EmailAction = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#6B7280'};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const NoEmailsMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-style: italic;
`;

const EmailNextButton = styled.button`
  padding: 12px 24px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  align-self: center;

  &:hover {
    background: #2563EB;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Add New Email Components
const AddNewEmailButton = styled.button`
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#EBF8FF' : '#1E3A8A'};
  color: #3B82F6;
  border: 2px dashed #3B82F6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  width: 100%;

  &:hover {
    background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E40AF'};
    border-color: #2563EB;
  }
`;

const AddEmailForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: ${props => props.theme === 'light' ? '#F0F9FF' : '#1E3A8A'};
  border: 2px solid #3B82F6;
  border-radius: 8px;
`;

const AddEmailInput = styled.input`
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  color: black;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const AddEmailTypeSelect = styled.select`
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  color: black;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const AddEmailActions = styled.div`
  display: flex;
  gap: 8px;
`;

const AddEmailButton = styled.button`
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  background: ${props => {
    switch (props.variant) {
      case 'save': return '#10B981';
      case 'cancel': return '#6B7280';
      default: return '#6B7280';
    }
  }};

  color: white;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

export default ContactMergeModal;