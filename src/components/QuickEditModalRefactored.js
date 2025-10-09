import React from 'react';
import Modal from 'react-modal';
import { FiX } from 'react-icons/fi';
import { FaSkull, FaInfoCircle, FaEnvelope, FaBriefcase, FaMapMarkerAlt, FaHeart } from 'react-icons/fa';

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
            shouldShowField={shouldShowField}
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
            shouldShowField={shouldShowField}
          />
        );

      case 'Work':
        return (
          <WorkTab
            jobRole={quickEditJobRoleText}
            setJobRole={setQuickEditJobRoleText}
            linkedin={quickEditLinkedin}
            setLinkedin={setQuickEditLinkedin}
            companies={quickEditContactCompanies}
            setCompanyModalOpen={setQuickEditAssociateCompanyModalOpen}
            handleUpdateCompanyRelationship={handleUpdateCompanyRelationship}
            handleUpdateCompanyCategory={handleUpdateCompanyCategory}
            theme={theme}
            shouldShowField={shouldShowField}
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
            shouldShowField={shouldShowField}
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
            shouldShowField={shouldShowField}
            frequencyOptions={frequencyOptions}
          />
        );

      default:
        return null;
    }
  };

  return (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{
              fontSize: '14px',
              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
            }}>
              Track Missing Info
            </span>
            <ToggleSwitch
              theme={theme}
              $checked={quickEditShowMissing}
              onClick={() => setQuickEditShowMissing(!quickEditShowMissing)}
            >
              <ToggleSlider $checked={quickEditShowMissing} />
            </ToggleSwitch>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            {getVisibleTabs(contact).map(tab => {
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
                  onClick={() => setQuickEditActiveTab(tab.id)}
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
  );
};

export default QuickEditModalRefactored;