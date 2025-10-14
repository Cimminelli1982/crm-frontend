import React, { useState } from 'react';
import Modal from 'react-modal';
import { FiX, FiGitMerge, FiCheck } from 'react-icons/fi';
import { FaSkull, FaInfoCircle, FaEnvelope, FaBriefcase, FaMapMarkerAlt, FaHeart } from 'react-icons/fa';
import ContactEnrichModal from './modals/ContactEnrichModal';
import FindDuplicatesModal from './FindDuplicatesModal';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

// Tab Components
import InfoTab from './quickEditModal/InfoTab';
import ContactsTab from './quickEditModal/ContactsTab';
import WorkTab from './quickEditModal/WorkTab';
import RelatedTab from './quickEditModal/RelatedTab';
import KeepInTouchTab from './quickEditModal/KeepInTouchTab';

// Styled Components
import {
  ModalContent,
  ModalHeader,
  ModalBody,
  CloseButton,
  TabsContainer,
  TabButton,
  TabContent,
  ActionButtons,
  ToggleSwitch,
  ToggleSlider
} from './quickEditModal/StyledComponents';

const QuickEditModalRefactored = ({
  isOpen,
  onClose,
  contact,
  theme,
  showMissingFieldsOnly,
  onRefresh,
  // State props from hook
  quickEditActiveTab,
  setQuickEditActiveTab,
  quickEditDescriptionText,
  setQuickEditDescriptionText,
  quickEditJobRoleText,
  setQuickEditJobRoleText,
  quickEditContactCategory,
  setQuickEditContactCategory,
  quickEditContactScore,
  setQuickEditContactScore,
  quickEditFirstName,
  setQuickEditFirstName,
  quickEditLastName,
  setQuickEditLastName,
  quickEditLinkedin,
  setQuickEditLinkedin,
  quickEditKeepInTouchFrequency,
  setQuickEditKeepInTouchFrequency,
  quickEditBirthdayDay,
  setQuickEditBirthdayDay,
  quickEditBirthdayMonth,
  setQuickEditBirthdayMonth,
  quickEditAgeEstimate,
  setQuickEditAgeEstimate,
  quickEditChristmasWishes,
  setQuickEditChristmasWishes,
  quickEditEasterWishes,
  setQuickEditEasterWishes,
  quickEditShowMissing,
  setQuickEditShowMissing,
  quickEditContactEmails,
  setQuickEditContactEmails,
  quickEditContactMobiles,
  setQuickEditContactMobiles,
  quickEditContactCities,
  setQuickEditContactCities,
  quickEditContactTags,
  setQuickEditContactTags,
  quickEditContactCompanies,
  setQuickEditContactCompanies,
  newEmailText,
  setNewEmailText,
  newEmailType,
  setNewEmailType,
  newMobileText,
  setNewMobileText,
  newMobileType,
  setNewMobileType,
  // Modal controls
  quickEditCityModalOpen,
  setQuickEditCityModalOpen,
  quickEditTagModalOpen,
  setQuickEditTagModalOpen,
  quickEditAssociateCompanyModalOpen,
  setQuickEditAssociateCompanyModalOpen,
  // Handler functions
  onSave,
  onDelete,
  handleSilentSave,
  handleAddEmail,
  handleRemoveEmail,
  handleUpdateEmailType,
  handleSetEmailPrimary,
  handleAddMobile,
  handleRemoveMobile,
  handleUpdateMobileType,
  handleSetMobilePrimary,
  handleRemoveCity,
  handleRemoveTag,
  handleUpdateCompanyRelationship,
  handleUpdateCompanyCategory,
  handleSaveQuickEditFrequency,
  handleSaveQuickEditBirthday,
  handleSaveQuickEditChristmasWishes,
  handleSaveQuickEditEasterWishes,
  handleAutomation,
  // Helper functions
  getVisibleTabs,
  shouldShowField,
  categoryOptions = [
    'Not Set',
    'Advisor',
    'Corporation',
    'Founder',
    'Friend',
    'Inbox',
    'Institution',
    'Investor',
    'Media',
    'Professional Investor',
    'Service Provider',
    'Skip',
    'SME'
  ],
  frequencyOptions = ['Weekly', 'Monthly', 'Quarterly', 'Twice per Year', 'Once per Year', 'Do not keep in touch']
}) => {
  const [contactEnrichModalOpen, setContactEnrichModalOpen] = useState(false);
  const [findDuplicatesModalOpen, setFindDuplicatesModalOpen] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [missingOnly, setMissingOnly] = useState(showMissingFieldsOnly); // Use the prop value


  // Sync missingOnly with showMissingFieldsOnly prop when it changes
  React.useEffect(() => {
    setMissingOnly(showMissingFieldsOnly);
  }, [showMissingFieldsOnly]);

  if (!contact) return null;

  const handleClose = () => {
    // Reset all state
    setQuickEditDescriptionText('');
    setQuickEditJobRoleText('');
    setQuickEditContactCategory('Not Set');
    setQuickEditContactScore(0);
    setNewEmailText('');
    setNewEmailType('personal');
    setNewMobileText('');
    setNewMobileType('personal');
    setQuickEditContactCities([]);
    setQuickEditContactTags([]);
    setQuickEditCityModalOpen(false);
    setQuickEditTagModalOpen(false);
    onClose();
  };

  const renderTabContent = () => {
    switch (quickEditActiveTab) {
      case 'Info':
        return (
          <InfoTab
            contact={contact}
            linkedin={quickEditLinkedin}
            firstName={quickEditFirstName}
            setFirstName={setQuickEditFirstName}
            lastName={quickEditLastName}
            setLastName={setQuickEditLastName}
            category={quickEditContactCategory}
            setCategory={setQuickEditContactCategory}
            score={quickEditContactScore}
            setScore={setQuickEditContactScore}
            description={quickEditDescriptionText}
            setDescription={setQuickEditDescriptionText}
            theme={theme}
            shouldShowField={(field) => shouldShowField(field, missingOnly)}
            categoryOptions={categoryOptions}
          />
        );

      case 'Contacts':
        return (
          <ContactsTab
            emails={quickEditContactEmails}
            mobiles={quickEditContactMobiles}
            newEmailText={newEmailText}
            setNewEmailText={setNewEmailText}
            newEmailType={newEmailType}
            setNewEmailType={setNewEmailType}
            newMobileText={newMobileText}
            setNewMobileText={setNewMobileText}
            newMobileType={newMobileType}
            setNewMobileType={setNewMobileType}
            handleAddEmail={handleAddEmail}
            handleRemoveEmail={handleRemoveEmail}
            handleUpdateEmailType={handleUpdateEmailType}
            handleSetEmailPrimary={handleSetEmailPrimary}
            handleAddMobile={handleAddMobile}
            handleRemoveMobile={handleRemoveMobile}
            handleUpdateMobileType={handleUpdateMobileType}
            handleSetMobilePrimary={handleSetMobilePrimary}
            theme={theme}
            shouldShowField={(field) => shouldShowField(field, missingOnly)}
          />
        );

      case 'Work':
        return (
          <WorkTab
            contact={contact}
            jobRole={quickEditJobRoleText}
            setJobRole={setQuickEditJobRoleText}
            linkedin={quickEditLinkedin}
            setLinkedin={setQuickEditLinkedin}
            companies={quickEditContactCompanies}
            setCompanyModalOpen={setQuickEditAssociateCompanyModalOpen}
            handleUpdateCompanyRelationship={handleUpdateCompanyRelationship}
            handleUpdateCompanyCategory={handleUpdateCompanyCategory}
            theme={theme}
            shouldShowField={(field) => shouldShowField(field, missingOnly)}
            onOpenEnrichModal={() => setContactEnrichModalOpen(true)}
          />
        );

      case 'Related':
        return (
          <RelatedTab
            cities={quickEditContactCities}
            tags={quickEditContactTags}
            setCityModalOpen={setQuickEditCityModalOpen}
            setTagModalOpen={setQuickEditTagModalOpen}
            handleRemoveCity={handleRemoveCity}
            handleRemoveTag={handleRemoveTag}
            theme={theme}
            shouldShowField={(field) => shouldShowField(field, missingOnly)}
          />
        );

      case 'Keep in touch':
        return (
          <KeepInTouchTab
            contact={contact}
            frequency={quickEditKeepInTouchFrequency}
            setFrequency={setQuickEditKeepInTouchFrequency}
            birthdayDay={quickEditBirthdayDay}
            setBirthdayDay={setQuickEditBirthdayDay}
            birthdayMonth={quickEditBirthdayMonth}
            setBirthdayMonth={setQuickEditBirthdayMonth}
            ageEstimate={quickEditAgeEstimate}
            setAgeEstimate={setQuickEditAgeEstimate}
            christmasWishes={quickEditChristmasWishes}
            setChristmasWishes={setQuickEditChristmasWishes}
            easterWishes={quickEditEasterWishes}
            setEasterWishes={setQuickEditEasterWishes}
            handleSaveFrequency={handleSaveQuickEditFrequency}
            handleSaveBirthday={handleSaveQuickEditBirthday}
            handleSaveChristmasWishes={handleSaveQuickEditChristmasWishes}
            handleSaveEasterWishes={handleSaveQuickEditEasterWishes}
            theme={theme}
            shouldShowField={(field) => shouldShowField(field, missingOnly)}
            frequencyOptions={frequencyOptions}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={handleClose}
      shouldCloseOnOverlayClick={true}
      style={{
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
          maxWidth: '500px',
          width: '90%',
          background: 'transparent'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <ModalContent theme={theme}>
        <ModalHeader theme={theme}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {/* Missing only toggle button */}
            <button
              onClick={() => {
                setMissingOnly(!missingOnly);
                // Force re-render of tabs
                setQuickEditActiveTab('');
                setTimeout(() => setQuickEditActiveTab('Info'), 0);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                background: missingOnly
                  ? (theme === 'light' ? '#3B82F6' : '#2563EB')
                  : (theme === 'light' ? '#FFFFFF' : '#1F2937'),
                color: missingOnly
                  ? '#FFFFFF'
                  : (theme === 'light' ? '#374151' : '#D1D5DB'),
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {missingOnly ? '✓ Missing only' : 'Missing only'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Check button for marking complete */}
            <CloseButton
              onClick={async () => {
                if (savingToggle) return; // Prevent multiple clicks

                // Check if category is Inbox
                if (contact.category === 'Inbox' || quickEditContactCategory === 'Inbox') {
                  toast.error('Cannot mark as complete: Please move contact out of Inbox first');
                  return;
                }

                // Start saving
                setSavingToggle(true);

                try {
                  // Set show_missing to false - user is satisfied with current info
                  const { error: updateError } = await supabase
                    .from('contacts')
                    .update({
                      show_missing: false,
                      last_modified_at: new Date().toISOString()
                    })
                    .eq('contact_id', contact.contact_id);

                  if (updateError) throw updateError;

                  // Save all other current changes
                  await onSave();

                  // Close the modal after successful save
                  setTimeout(() => {
                    handleClose();
                    // Refresh the parent list
                    if (onRefresh) {
                      onRefresh();
                    }
                  }, 100);
                } catch (error) {
                  console.error('Error marking contact as complete:', error);
                  toast.error('Failed to mark as complete');
                } finally {
                  setSavingToggle(false);
                }
              }}
              disabled={savingToggle || contact.show_missing === false}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                background: contact.show_missing !== false
                  ? (theme === 'light' ? '#10B981' : '#059669')
                  : (theme === 'light' ? '#E5E7EB' : '#374151'),
                color: contact.show_missing !== false
                  ? '#FFFFFF'
                  : (theme === 'light' ? '#9CA3AF' : '#6B7280'),
                fontSize: '13px',
                fontWeight: '500',
                cursor: contact.show_missing !== false ? (savingToggle ? 'wait' : 'pointer') : 'not-allowed',
                opacity: savingToggle || contact.show_missing === false ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              theme={theme}
              title="Mark as Complete"
              style={{
                background: contact.show_missing !== false
                  ? (theme === 'light' ? '#10B981' : '#059669')
                  : (theme === 'light' ? '#E5E7EB' : '#374151'),
                color: contact.show_missing !== false
                  ? '#FFFFFF'
                  : (theme === 'light' ? '#9CA3AF' : '#6B7280'),
                opacity: savingToggle || !contact.show_missing ? 0.6 : 1
              }}
            >
              <FiCheck />
            </CloseButton>
            <CloseButton
              onClick={() => {
                setFindDuplicatesModalOpen(true);
              }}
              theme={theme}
              title="Find and Merge Duplicates"
              style={{
                background: theme === 'light' ? '#EDE9FE' : '#4C1D95',
                color: theme === 'light' ? '#7C3AED' : '#DDD6FE'
              }}
            >
              <FiGitMerge />
            </CloseButton>
            <CloseButton
              onClick={() => {
                handleClose();
                if (onDelete) onDelete(contact);
              }}
              theme={theme}
              title="Delete or Skip Contact"
              style={{
                background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                color: theme === 'light' ? '#DC2626' : '#FCA5A5'
              }}
            >
              <FaSkull />
            </CloseButton>
            <CloseButton
              onClick={handleClose}
              theme={theme}
              title="Close"
            >
              <FiX />
            </CloseButton>
          </div>
        </ModalHeader>

        <ModalBody>
          {/* Tab Navigation */}
          <TabsContainer theme={theme}>
            {getVisibleTabs(contact, missingOnly).map(tab => {
              const isActive = quickEditActiveTab === tab.id;
              // Map tab IDs to icons
              const tabIcons = {
                'Info': <FaInfoCircle />,
                'Contacts': <FaEnvelope />,
                'Work': <FaBriefcase />,
                'Related': <FaMapMarkerAlt />,
                'Keep in touch': <FaHeart />
              };

              return (
                <TabButton
                  key={tab.id}
                  theme={theme}
                  $active={isActive}
                  onClick={async () => {
                    // Save current tab data before switching (silently, without closing modal)
                    if (!isActive) {
                      try {
                        await handleSilentSave();
                      } catch (error) {
                        console.error('Error saving tab data:', error);
                      }
                      setQuickEditActiveTab(tab.id);
                    }
                  }}
                  title={tab.label} // Tooltip for accessibility
                >
                  {tabIcons[tab.id]}
                </TabButton>
              );
            })}
          </TabsContainer>

          {/* Tab Content */}
          <TabContent theme={theme}>
            {renderTabContent()}
          </TabContent>

          {/* Action Buttons */}
          <ActionButtons theme={theme}>
            {/* Automation Dropdown - Full width on top */}
            <select
              onChange={(e) => handleAutomation(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px',
                paddingRight: '40px',
                border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                borderRadius: '8px',
                backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                color: theme === 'light' ? '#111827' : '#F9FAFB',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${theme === 'light' ? '%236B7280' : '%239CA3AF'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '16px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = theme === 'light' ? '#9CA3AF' : '#6B7280';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = theme === 'light' ? '#D1D5DB' : '#4B5563';
              }}
              value=""
            >
              <option value="" disabled>🤖 Automations</option>
              <option value="cold_contacted_founder">Cold contacted founder</option>
              <option value="quick_skip">Quick Skip</option>
            </select>

            {/* Cancel and Save buttons on second row */}
            <div style={{
              display: 'flex',
              gap: '12px',
              width: '100%',
              marginTop: '12px'
            }}>
              <button
                onClick={handleClose}
                style={{
                  flex: 1,
                  padding: '11px 24px',
                  border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                  borderRadius: '8px',
                  backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme === 'light' ? '#F9FAFB' : '#111827';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = theme === 'light' ? '#FFFFFF' : '#1F2937';
                }}
              >
                Cancel
              </button>

              <button
                onClick={onSave}
                style={{
                  flex: 1,
                  padding: '11px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2563EB';
                  e.target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#3B82F6';
                  e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                }}
              >
                Save Details
              </button>
            </div>
          </ActionButtons>
        </ModalBody>
      </ModalContent>
    </Modal>

      {/* Contact Enrich Modal */}
      <ContactEnrichModal
        isOpen={contactEnrichModalOpen}
        onClose={() => setContactEnrichModalOpen(false)}
        contact={contact}
        theme={theme}
        onEnrichComplete={async () => {
          setContactEnrichModalOpen(false);
          // Refresh the contact data to get the updated LinkedIn URL, job_role, and description
          if (contact?.contact_id) {
            try {
              const { data, error } = await supabase
                .from('contacts')
                .select('linkedin, job_role, description')
                .eq('contact_id', contact.contact_id)
                .single();

              if (!error && data) {
                // Update the local state with the new LinkedIn URL, job role, and description
                setQuickEditLinkedin(data.linkedin || '');
                setQuickEditJobRoleText(data.job_role || '');
                setQuickEditDescriptionText(data.description || '');
                // Update the contact object as well
                contact.linkedin = data.linkedin;
                contact.job_role = data.job_role;
                contact.description = data.description;
              }
            } catch (err) {
              console.error('Error fetching updated contact data:', err);
            }
          }
        }}
      />

      {/* Find Duplicates Modal */}
      <FindDuplicatesModal
        isOpen={findDuplicatesModalOpen}
        onClose={() => setFindDuplicatesModalOpen(false)}
        contact={contact}
        theme={theme}
        onMergeContact={(sourceContact, targetContact) => {
          console.log('Merging contacts:', sourceContact, targetContact);
          // The actual merge is handled by the ContactMergeModal
        }}
      />
    </>
  );
};

export default QuickEditModalRefactored;