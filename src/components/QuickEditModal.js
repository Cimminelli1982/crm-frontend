import React from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FaInfoCircle, FaEnvelope, FaBriefcase, FaLink, FaHandshake, FaStar, FaPlus, FaBuilding, FaPhone, FaTrash, FaMapMarkerAlt, FaTag, FaHeart, FaCalendarAlt, FaSkull } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

const QuickEditModal = ({
  isOpen,
  onClose,
  contact,
  theme,
  showMissingFieldsOnly,
  // State props
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
  categoryOptions,
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
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            Editing: {contact?.first_name} {contact?.last_name}
          </h3>
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
              const IconComponent = tab.icon;
              const isActive = quickEditActiveTab === tab.id;
              return (
                <TabButton
                  key={tab.id}
                  theme={theme}
                  $active={isActive}
                  onClick={() => setQuickEditActiveTab(tab.id)}
                >
                  {tab.label}
                </TabButton>
              );
            })}
          </TabsContainer>

          {/* Tab Content */}
          <div style={{ minHeight: '500px' }}>

            {/* Info Tab */}
            {quickEditActiveTab === 'Info' && (
              <TabContent>
                {/* Show Missing Toggle - Always visible at the top */}
                <FormGroup style={{
                  padding: '16px',
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#1a1a1a',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <Label theme={theme} style={{ margin: 0, fontWeight: '600' }}>
                        Track Missing Information
                      </Label>
                      <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '12px',
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                      }}>
                        Include this contact in the missing information view
                      </p>
                    </div>
                    <ToggleSwitch
                      theme={theme}
                      $checked={quickEditShowMissing}
                      onClick={() => setQuickEditShowMissing(!quickEditShowMissing)}
                    >
                      <ToggleSlider $checked={quickEditShowMissing} />
                    </ToggleSwitch>
                  </div>
                </FormGroup>

                {/* First Name */}
                {shouldShowField(contact, 'first_name') && (
                  <FormGroup>
                    <Label theme={theme}>First Name</Label>
                    <Input
                      type="text"
                      value={quickEditFirstName}
                      onChange={(e) => setQuickEditFirstName(e.target.value)}
                      placeholder="Enter first name..."
                      theme={theme}
                    />
                  </FormGroup>
                )}

                {/* Last Name */}
                {shouldShowField(contact, 'last_name') && (
                  <FormGroup>
                    <Label theme={theme}>Last Name</Label>
                    <Input
                      type="text"
                      value={quickEditLastName}
                      onChange={(e) => setQuickEditLastName(e.target.value)}
                      placeholder="Enter last name..."
                      theme={theme}
                    />
                  </FormGroup>
                )}

                {/* Category */}
                {shouldShowField(contact, 'category') && (
                  <FormGroup>
                    <Label theme={theme}>Category</Label>
                    <Select
                      value={quickEditContactCategory}
                      onChange={(e) => setQuickEditContactCategory(e.target.value)}
                      theme={theme}
                    >
                      {categoryOptions.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}

                {/* Score Rating */}
                {shouldShowField(contact, 'score') && (
                  <FormGroup>
                    <Label theme={theme}>Score Rating</Label>
                    <ScoreContainer theme={theme}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <FaStar
                          key={star}
                          onClick={() => setQuickEditContactScore(star)}
                          style={{
                            fontSize: '24px',
                            color: star <= quickEditContactScore ? '#FCD34D' : '#E5E7EB',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            filter: star <= quickEditContactScore ? 'drop-shadow(0 2px 4px rgba(251, 191, 36, 0.4))' : 'none'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.2) rotate(-10deg)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1) rotate(0deg)'}
                        />
                      ))}
                      <span style={{
                        marginLeft: '12px',
                        fontSize: '14px',
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                      }}>
                        {quickEditContactScore > 0 ? `${quickEditContactScore}/5` : 'Not rated'}
                      </span>
                    </ScoreContainer>
                  </FormGroup>
                )}

                {/* Description */}
                {shouldShowField(contact, 'description') && (
                  <FormGroup>
                    <Label theme={theme}>Description / Notes</Label>
                    <Textarea
                      value={quickEditDescriptionText}
                      onChange={(e) => setQuickEditDescriptionText(e.target.value)}
                      placeholder="Enter description or notes..."
                      rows={4}
                      theme={theme}
                    />
                  </FormGroup>
                )}
              </TabContent>
            )}

            {/* Contacts Tab */}
            {quickEditActiveTab === 'Contacts' && (
              <TabContent>
                {/* Emails Section */}
                {shouldShowField(contact, 'email') && (
                  <Section>
                    <SectionHeader>
                      <SectionLabel theme={theme}>
                        <FaEnvelope style={{ fontSize: '14px', color: '#3B82F6' }} />
                        Email Addresses
                      </SectionLabel>
                    </SectionHeader>

                    {/* Add New Email */}
                    <AddItemRow>
                      <Input
                        type="email"
                        value={newEmailText}
                        onChange={(e) => setNewEmailText(e.target.value)}
                        placeholder="Add email address..."
                        theme={theme}
                        style={{ flex: 1 }}
                      />
                      <Select
                        value={newEmailType}
                        onChange={(e) => setNewEmailType(e.target.value)}
                        theme={theme}
                        style={{ width: 'auto' }}
                      >
                        <option value="personal">Personal</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </Select>
                      <AddButton
                        onClick={() => {
                          if (newEmailText.trim()) {
                            handleAddEmail(newEmailText, newEmailType);
                            setNewEmailText('');
                          }
                        }}
                      >
                        <FaPlus style={{ fontSize: '12px' }} />
                        Add
                      </AddButton>
                    </AddItemRow>

                    {/* Email List */}
                    <ListContainer theme={theme}>
                      {quickEditContactEmails?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          {quickEditContactEmails.map((emailData, index) => (
                            <ListItem key={emailData.email_id} theme={theme} $first={index === 0} $last={index === quickEditContactEmails.length - 1}>
                              <FaEnvelope style={{ fontSize: '14px', color: '#3B82F6' }} />
                              <div style={{ flex: 1 }}>
                                <ItemText theme={theme}>
                                  {emailData.email}
                                  {emailData.is_primary && (
                                    <PrimaryBadge>PRIMARY</PrimaryBadge>
                                  )}
                                </ItemText>
                              </div>
                              <Select
                                value={emailData.type}
                                onChange={(e) => handleUpdateEmailType(emailData.email_id, e.target.value)}
                                theme={theme}
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                <option value="personal">Personal</option>
                                <option value="work">Work</option>
                                <option value="other">Other</option>
                              </Select>
                              {!emailData.is_primary && (
                                <SetPrimaryButton
                                  onClick={() => handleSetEmailPrimary(emailData.email_id)}
                                >
                                  Set Primary
                                </SetPrimaryButton>
                              )}
                              <DeleteButton
                                onClick={() => handleRemoveEmail(emailData.email_id)}
                              >
                                <FaTrash />
                              </DeleteButton>
                            </ListItem>
                          ))}
                        </div>
                      ) : (
                        <EmptyState theme={theme}>
                          <FaEnvelope style={{ fontSize: '24px', opacity: 0.5 }} />
                          <span>No email addresses</span>
                        </EmptyState>
                      )}
                    </ListContainer>
                  </Section>
                )}

                {/* Mobile Numbers Section */}
                {shouldShowField(contact, 'mobile') && (
                  <Section>
                    <SectionHeader>
                      <SectionLabel theme={theme}>
                        <FaPhone style={{ fontSize: '14px', color: '#3B82F6' }} />
                        Mobile Numbers
                      </SectionLabel>
                    </SectionHeader>

                    {/* Add New Mobile */}
                    <AddItemRow>
                      <Input
                        type="tel"
                        value={newMobileText}
                        onChange={(e) => setNewMobileText(e.target.value)}
                        placeholder="Add mobile number..."
                        theme={theme}
                        style={{ flex: 1 }}
                      />
                      <Select
                        value={newMobileType}
                        onChange={(e) => setNewMobileType(e.target.value)}
                        theme={theme}
                        style={{ width: 'auto' }}
                      >
                        <option value="personal">Personal</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </Select>
                      <AddButton
                        onClick={() => {
                          if (newMobileText.trim()) {
                            handleAddMobile(newMobileText, newMobileType);
                            setNewMobileText('');
                          }
                        }}
                      >
                        <FaPlus style={{ fontSize: '12px' }} />
                        Add
                      </AddButton>
                    </AddItemRow>

                    {/* Mobile List */}
                    <ListContainer theme={theme}>
                      {quickEditContactMobiles?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          {quickEditContactMobiles.map((mobileData, index) => (
                            <ListItem key={mobileData.mobile_id} theme={theme} $first={index === 0} $last={index === quickEditContactMobiles.length - 1}>
                              <FaPhone style={{ fontSize: '14px', color: '#3B82F6' }} />
                              <div style={{ flex: 1 }}>
                                <ItemText theme={theme}>
                                  {mobileData.mobile}
                                  {mobileData.is_primary && (
                                    <PrimaryBadge>PRIMARY</PrimaryBadge>
                                  )}
                                </ItemText>
                              </div>
                              <Select
                                value={mobileData.type}
                                onChange={(e) => handleUpdateMobileType(mobileData.mobile_id, e.target.value)}
                                theme={theme}
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                <option value="personal">Personal</option>
                                <option value="work">Work</option>
                                <option value="other">Other</option>
                              </Select>
                              {!mobileData.is_primary && (
                                <SetPrimaryButton
                                  onClick={() => handleSetMobilePrimary(mobileData.mobile_id)}
                                >
                                  Set Primary
                                </SetPrimaryButton>
                              )}
                              <DeleteButton
                                onClick={() => handleRemoveMobile(mobileData.mobile_id)}
                              >
                                <FaTrash />
                              </DeleteButton>
                            </ListItem>
                          ))}
                        </div>
                      ) : (
                        <EmptyState theme={theme}>
                          <FaPhone style={{ fontSize: '24px', opacity: 0.5 }} />
                          <span>No mobile numbers</span>
                        </EmptyState>
                      )}
                    </ListContainer>
                  </Section>
                )}
              </TabContent>
            )}

            {/* Work Tab */}
            {quickEditActiveTab === 'Work' && (
              <TabContent>
                {/* Job Title */}
                {shouldShowField(contact, 'job_role') && (
                  <FormGroup>
                    <Label theme={theme}>Job Title</Label>
                    <Input
                      type="text"
                      value={quickEditJobRoleText}
                      onChange={(e) => setQuickEditJobRoleText(e.target.value)}
                      placeholder="Enter job title..."
                      theme={theme}
                    />
                  </FormGroup>
                )}

                {/* LinkedIn */}
                {shouldShowField(contact, 'linkedin') && (
                  <FormGroup>
                    <Label theme={theme}>LinkedIn Profile</Label>
                    <Input
                      type="url"
                      value={quickEditLinkedin}
                      onChange={(e) => setQuickEditLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      theme={theme}
                    />
                  </FormGroup>
                )}

                {/* Company Associations */}
                {shouldShowField(contact, 'company') && (
                  <FormGroup>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Label theme={theme} style={{ margin: 0 }}>Company Associations</Label>
                      <ManageButton
                        onClick={() => setQuickEditAssociateCompanyModalOpen(true)}
                      >
                        + Manage Companies
                      </ManageButton>
                    </div>

                    <CompaniesContainer theme={theme}>
                      {quickEditContactCompanies?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {quickEditContactCompanies.map((companyRelation) => (
                            <CompanyItem key={companyRelation.contact_companies_id} theme={theme}>
                              <FaBuilding style={{ fontSize: '14px', color: '#3B82F6' }} />
                              <div style={{ flex: 1 }}>
                                <CompanyName theme={theme}>
                                  {companyRelation.companies?.name || 'Unknown Company'}
                                  {companyRelation.is_primary && (
                                    <PrimaryBadge>PRIMARY</PrimaryBadge>
                                  )}
                                </CompanyName>

                                {/* Relationship Type */}
                                <CompanyFieldGroup>
                                  <CompanyFieldLabel theme={theme}>Relationship</CompanyFieldLabel>
                                  <CompanySelect
                                    value={companyRelation.relationship || 'not_set'}
                                    onChange={(e) => handleUpdateCompanyRelationship(companyRelation.contact_companies_id, e.target.value)}
                                    theme={theme}
                                  >
                                    <option value="not_set">Not Set</option>
                                    <option value="employee">Employee</option>
                                    <option value="founder">Founder</option>
                                    <option value="advisor">Advisor</option>
                                    <option value="manager">Manager</option>
                                    <option value="investor">Investor</option>
                                    <option value="other">Other</option>
                                    <option value="suggestion">Suggestion</option>
                                  </CompanySelect>
                                </CompanyFieldGroup>

                                {/* Company Category */}
                                <CompanyFieldGroup>
                                  <CompanyFieldLabel theme={theme}>Company Category</CompanyFieldLabel>
                                  <CompanySelect
                                    value={companyRelation.companies?.category || 'Not Set'}
                                    onChange={(e) => handleUpdateCompanyCategory(companyRelation.companies?.company_id || companyRelation.companies?.id, e.target.value)}
                                    theme={theme}
                                  >
                                    <option value="Not Set">Not Set</option>
                                    <option value="Advisory">Advisory</option>
                                    <option value="Corporate">Corporate</option>
                                    <option value="Corporation">Corporation</option>
                                    <option value="Inbox">Inbox</option>
                                    <option value="Institution">Institution</option>
                                    <option value="Media">Media</option>
                                    <option value="Professional Investor">Professional Investor</option>
                                    <option value="SME">SME</option>
                                    <option value="Skip">Skip</option>
                                    <option value="Startup">Startup</option>
                                  </CompanySelect>
                                </CompanyFieldGroup>
                              </div>
                            </CompanyItem>
                          ))}
                        </div>
                      ) : (
                        <EmptyState theme={theme}>
                          <FaBuilding style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }} />
                          <span>No companies associated</span>
                        </EmptyState>
                      )}
                    </CompaniesContainer>
                  </FormGroup>
                )}
              </TabContent>
            )}

            {/* Related Tab */}
            {quickEditActiveTab === 'Related' && (
              <TabContent>
                {/* Cities Section */}
                {shouldShowField(contact, 'cities') && (
                  <Section>
                    <SectionHeader>
                      <SectionLabel theme={theme}>
                        <FaMapMarkerAlt style={{ fontSize: '14px', color: '#3B82F6' }} />
                        Cities
                      </SectionLabel>
                      <AddButton
                        onClick={() => setQuickEditCityModalOpen(true)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <FaPlus style={{ fontSize: '10px' }} />
                        Add Cities
                      </AddButton>
                    </SectionHeader>

                    <ListContainer theme={theme}>
                      {quickEditContactCities?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          {quickEditContactCities.map((cityData, index) => (
                            <ListItem key={cityData.entry_id} theme={theme} $first={index === 0} $last={index === quickEditContactCities.length - 1}>
                              <FaMapMarkerAlt style={{ fontSize: '14px', color: '#3B82F6' }} />
                              <div style={{ flex: 1 }}>
                                <ItemText theme={theme}>
                                  {cityData.cities?.name || 'Unknown City'}
                                  {cityData.cities?.country && cityData.cities.country !== 'Unknown' && (
                                    <span style={{
                                      fontSize: '12px',
                                      color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                                      fontWeight: 'normal',
                                      marginLeft: '8px'
                                    }}>
                                      {cityData.cities.country}
                                    </span>
                                  )}
                                </ItemText>
                              </div>
                              <DeleteButton
                                onClick={() => handleRemoveCity(cityData.entry_id)}
                              >
                                <FaTrash />
                              </DeleteButton>
                            </ListItem>
                          ))}
                        </div>
                      ) : (
                        <EmptyState theme={theme}>
                          <FaMapMarkerAlt style={{ fontSize: '24px', opacity: 0.5 }} />
                          <span>No cities associated</span>
                        </EmptyState>
                      )}
                    </ListContainer>
                  </Section>
                )}

                {/* Tags Section */}
                {shouldShowField(contact, 'tags') && (
                  <Section>
                    <SectionHeader>
                      <SectionLabel theme={theme}>
                        <FaTag style={{ fontSize: '14px', color: '#3B82F6' }} />
                        Tags
                      </SectionLabel>
                      <AddButton
                        onClick={() => setQuickEditTagModalOpen(true)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <FaPlus style={{ fontSize: '10px' }} />
                        Add Tags
                      </AddButton>
                    </SectionHeader>

                    <TagsContainer theme={theme}>
                      {quickEditContactTags?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {quickEditContactTags.map((tagData) => (
                            <TagItem
                              key={tagData.entry_id}
                              theme={theme}
                            >
                              <FaTag style={{ fontSize: '10px', color: '#3B82F6' }} />
                              <span>{tagData.tags?.name || 'Unknown Tag'}</span>
                              <TagDeleteButton
                                onClick={() => handleRemoveTag(tagData.entry_id)}
                              >
                                <FaTrash />
                              </TagDeleteButton>
                            </TagItem>
                          ))}
                        </div>
                      ) : (
                        <EmptyState theme={theme} style={{ height: '68px' }}>
                          <FaTag style={{ fontSize: '24px', opacity: 0.5 }} />
                          <span>No tags associated</span>
                        </EmptyState>
                      )}
                    </TagsContainer>
                  </Section>
                )}
              </TabContent>
            )}

            {/* Keep in Touch Tab */}
            {quickEditActiveTab === 'Keep in touch' && (
              <TabContent>
                {/* Keep in Touch Frequency */}
                {shouldShowField(contact, 'frequency') && (
                  <FormGroup>
                    <Label theme={theme}>
                      <FaHeart style={{ marginRight: '6px' }} />
                      Keep in Touch Frequency
                    </Label>
                    <Select
                      value={quickEditKeepInTouchFrequency}
                      onChange={(e) => {
                        setQuickEditKeepInTouchFrequency(e.target.value);
                        handleSaveQuickEditFrequency(e.target.value);
                      }}
                      theme={theme}
                    >
                      <option value="">Select frequency...</option>
                      {frequencyOptions.map(freq => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}

                {/* Date of Birth */}
                {shouldShowField(contact, 'birthday') && (
                  <FormGroup>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Label theme={theme} style={{ margin: 0 }}>
                        <FaCalendarAlt style={{ marginRight: '6px' }} />
                        Date of Birth
                      </Label>
                      <ClearButton
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('contacts')
                              .update({ birthday: null })
                              .eq('contact_id', contact.contact_id);
                            if (error) throw error;
                            setQuickEditBirthdayDay('');
                            setQuickEditBirthdayMonth('');
                            setQuickEditAgeEstimate('');
                            toast.success('Birthday cleared successfully!');
                          } catch (error) {
                            console.error('Error clearing birthday:', error);
                            toast.error('Failed to clear birthday');
                          }
                        }}
                        theme={theme}
                      >
                        <FiX size={14} />
                      </ClearButton>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <Select
                        value={quickEditBirthdayDay}
                        onChange={(e) => setQuickEditBirthdayDay(e.target.value)}
                        theme={theme}
                        style={{ flex: 1 }}
                      >
                        <option value="">Day</option>
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </Select>

                      <Select
                        value={quickEditBirthdayMonth}
                        onChange={(e) => setQuickEditBirthdayMonth(e.target.value)}
                        theme={theme}
                        style={{ flex: 1 }}
                      >
                        <option value="">Month</option>
                        {['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'].map((month, i) => (
                          <option key={i} value={i + 1}>{month}</option>
                        ))}
                      </Select>
                    </div>

                    <Select
                      value={quickEditAgeEstimate}
                      onChange={(e) => setQuickEditAgeEstimate(e.target.value)}
                      theme={theme}
                    >
                      <option value="">Age estimate (for birthday calculation)</option>
                      {[20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80].map(age => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                      <option value="80+">80+</option>
                    </Select>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <SaveButton
                        onClick={handleSaveQuickEditBirthday}
                      >
                        Save Birthday
                      </SaveButton>
                    </div>
                  </FormGroup>
                )}

                {/* Christmas Wishes */}
                {shouldShowField(contact, 'christmas') && (
                  <FormGroup>
                    <Label theme={theme}>
                      🎄 Christmas Wishes
                    </Label>
                    <Select
                      value={quickEditChristmasWishes}
                      onChange={(e) => {
                        setQuickEditChristmasWishes(e.target.value);
                        handleSaveQuickEditChristmasWishes(e.target.value);
                      }}
                      theme={theme}
                    >
                      <option value="">Select Christmas wishes...</option>
                      <option value="no wishes set">Not set</option>
                      <option value="no wishes">No wishes</option>
                      <option value="whatsapp standard">WhatsApp standard</option>
                      <option value="email standard">Email standard</option>
                      <option value="email custom">Email custom</option>
                      <option value="whatsapp custom">WhatsApp custom</option>
                      <option value="call">Call</option>
                      <option value="present">Present</option>
                    </Select>
                  </FormGroup>
                )}

                {/* Easter Wishes */}
                {shouldShowField(contact, 'easter') && (
                  <FormGroup>
                    <Label theme={theme}>
                      🐰 Easter Wishes
                    </Label>
                    <Select
                      value={quickEditEasterWishes}
                      onChange={(e) => {
                        setQuickEditEasterWishes(e.target.value);
                        handleSaveQuickEditEasterWishes(e.target.value);
                      }}
                      theme={theme}
                    >
                      <option value="">Select Easter wishes...</option>
                      <option value="no wishes set">Not set</option>
                      <option value="no wishes">No wishes</option>
                      <option value="whatsapp standard">WhatsApp standard</option>
                      <option value="email standard">Email standard</option>
                      <option value="email custom">Email custom</option>
                      <option value="whatsapp custom">WhatsApp custom</option>
                      <option value="call">Call</option>
                      <option value="present">Present</option>
                    </Select>
                  </FormGroup>
                )}
              </TabContent>
            )}

          </div>

          {/* Action Buttons */}
          <ActionButtons theme={theme}>
            <button
              onClick={handleClose}
              style={{
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

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Automation Dropdown */}
              <select
                onChange={(e) => handleAutomation(e.target.value)}
                style={{
                  padding: '11px 16px',
                  paddingRight: '40px',
                  border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                  borderRadius: '8px',
                  backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                  color: theme === 'light' ? '#111827' : '#F9FAFB',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  minWidth: '170px',
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

              <button
                onClick={onSave}
                style={{
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

// Styled Components
const ModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  }
`;

const ModalBody = styled.div``;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 500px;
  margin: 15px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
`;

const TabButton = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: fit-content;
  white-space: nowrap;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 2px rgba(0, 0, 0, 0.1)'
        : '0 1px 2px rgba(0, 0, 0, 0.3)')
    : 'none'
  };

  &:hover {
    background: ${props => props.$active
      ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
      : (props.theme === 'light' ? '#F9FAFB' : '#374151')
    };
    color: ${props => props.$active
      ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
      : (props.theme === 'light' ? '#4B5563' : '#D1D5DB')
    };
  }

  svg {
    flex-shrink: 0;
    display: none;
  }
`;

const TabContent = styled.div`
  height: 460px;
  overflow-y: auto;
  padding: 20px 20px 0 20px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
    border-radius: 3px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const ScoreContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SectionLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const AddItemRow = styled.div`
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const AddButton = styled.button`
  padding: 10px 16px;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ListContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  font-size: 14px;
  min-height: 100px;
  max-height: 200px;
  overflow-y: auto;
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: ${props =>
    props.$first ? '6px 6px 0 0' :
    props.$last ? '0 0 6px 6px' : '0'
  };
`;

const ItemText = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PrimaryBadge = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  background-color: #10B981;
  color: white;
  border-radius: 10px;
  font-weight: 600;
`;

const SetPrimaryButton = styled.button`
  padding: 4px 6px;
  background-color: transparent;
  color: #10B981;
  border: 1px solid #10B981;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;

  &:hover {
    background-color: #10B981;
    color: white;
  }
`;

const DeleteButton = styled.button`
  padding: 4px;
  background-color: transparent;
  color: #EF4444;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background-color: #FEE2E2;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  text-align: center;
  gap: 8px;
`;

const ManageButton = styled.button`
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: #2563EB;
  }
`;

const CompaniesContainer = styled.div`
  padding: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  font-size: 14px;
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
`;

const CompanyItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 4px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const CompanyName = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CompanyFieldGroup = styled.div`
  margin-top: 8px;
  margin-bottom: 4px;
`;

const CompanyFieldLabel = styled.label`
  font-size: 10px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 2px;
  display: block;
`;

const CompanySelect = styled.select`
  width: 100%;
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 4px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-family: inherit;
  cursor: pointer;
`;

const TagsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  font-size: 14px;
  min-height: 100px;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
`;

const TagItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const TagDeleteButton = styled.button`
  padding: 2px;
  background-color: transparent;
  color: #EF4444;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;

  &:hover {
    background-color: #FEE2E2;
  }
`;

const ClearButton = styled.button`
  padding: 4px 6px;
  border: none;
  border-radius: 4px;
  background-color: ${props => props.theme === 'light' ? '#EF4444' : '#DC2626'};
  color: #FFFFFF;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-weight: 500;

  &:hover {
    background-color: ${props => props.theme === 'light' ? '#DC2626' : '#B91C1C'};
  }
`;

const SaveButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: #3B82F6;
  color: #FFFFFF;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #2563EB;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 0 0 12px 12px;
  margin: 0;
`;

const ToggleSwitch = styled.button`
  position: relative;
  width: 48px;
  height: 24px;
  background-color: ${props => props.$checked ? '#3B82F6' :
    (props.theme === 'light' ? '#D1D5DB' : '#4B5563')};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 2px;

  &:hover {
    background-color: ${props => props.$checked ? '#2563EB' :
      (props.theme === 'light' ? '#9CA3AF' : '#6B7280')};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme === 'light' ? '#DBEAFE' : '#1E3A8A'};
  }
`;

const ToggleSlider = styled.div`
  position: absolute;
  top: 2px;
  left: ${props => props.$checked ? '26px' : '2px'};
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 10px;
  transition: left 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

export default QuickEditModal;