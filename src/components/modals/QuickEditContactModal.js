import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import {
  FiX, FaEnvelope, FaPhone, FaBuilding, FaUser, FaBirthdayCake,
  FaMapMarkerAlt, FaTags, FaSkull, FaPlus, FaTrash, FaStar,
  FaInfoCircle, FaBriefcase, FaGift
} from 'react-icons/fa';
import { MdWork } from 'react-icons/md';
import { supabase } from '../../lib/supabaseClient';

const QuickEditContactModal = ({
  isOpen,
  onClose,
  contact,
  theme,
  onContactUpdate,
  onDeleteContact,
  companies = [],
  cities = [],
  tags = [],
  categoryOptions = ['Not Set', 'Family', 'Friend', 'Work', 'Acquaintance', 'VIP', 'Other'],
  showMissingFieldsOnly = false
}) => {
  // State for contact fields
  const [activeTab, setActiveTab] = useState('Info');
  const [descriptionText, setDescriptionText] = useState('');
  const [jobRoleText, setJobRoleText] = useState('');
  const [contactCategory, setContactCategory] = useState('');
  const [contactScore, setContactScore] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [keepInTouchFrequency, setKeepInTouchFrequency] = useState('');
  const [birthdayDay, setBirthdayDay] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [ageEstimate, setAgeEstimate] = useState('');
  const [christmasWishes, setChristmasWishes] = useState('');
  const [easterWishes, setEasterWishes] = useState('');

  // Collections
  const [contactEmails, setContactEmails] = useState([]);
  const [contactMobiles, setContactMobiles] = useState([]);
  const [contactCities, setContactCities] = useState([]);
  const [contactTags, setContactTags] = useState([]);
  const [contactCompanies, setContactCompanies] = useState([]);

  // Input state
  const [newEmailText, setNewEmailText] = useState('');
  const [newEmailType, setNewEmailType] = useState('personal');
  const [newMobileText, setNewMobileText] = useState('');
  const [newMobileType, setNewMobileType] = useState('personal');

  // Initialize data when contact changes
  useEffect(() => {
    if (contact) {
      setFirstName(contact.first_name || '');
      setLastName(contact.last_name || '');
      setDescriptionText(contact.description || '');
      setJobRoleText(contact.job_role || '');
      setContactCategory(contact.category || 'Not Set');
      setContactScore(contact.score || 0);
      setLinkedin(contact.linkedin || '');
      setKeepInTouchFrequency(contact.keep_in_touch_frequency || '');
      setBirthdayDay(contact.birthday_day || '');
      setBirthdayMonth(contact.birthday_month || '');
      setAgeEstimate(contact.age_estimate || '');
      setChristmasWishes(contact.christmas_card ? 'Yes' : 'No');
      setEasterWishes(contact.easter_card ? 'Yes' : 'No');

      // Load related data
      loadContactEmails(contact.id);
      loadContactMobiles(contact.id);
      loadContactCities(contact.id);
      loadContactTags(contact.id);
      loadContactCompanies(contact.id);
    }
  }, [contact]);

  const loadContactEmails = async (contactId) => {
    const { data } = await supabase
      .from('contact_emails')
      .select('*')
      .eq('contact_id', contactId)
      .order('is_primary', { ascending: false });
    setContactEmails(data || []);
  };

  const loadContactMobiles = async (contactId) => {
    const { data } = await supabase
      .from('contact_mobiles')
      .select('*')
      .eq('contact_id', contactId)
      .order('is_primary', { ascending: false });
    setContactMobiles(data || []);
  };

  const loadContactCities = async (contactId) => {
    const { data } = await supabase
      .from('contact_cities')
      .select('*, cities(*)')
      .eq('contact_id', contactId);
    setContactCities(data || []);
  };

  const loadContactTags = async (contactId) => {
    const { data } = await supabase
      .from('contact_tags')
      .select('*, tags(*)')
      .eq('contact_id', contactId);
    setContactTags(data || []);
  };

  const loadContactCompanies = async (contactId) => {
    const { data } = await supabase
      .from('contact_companies')
      .select('*, companies(*)')
      .eq('contact_id', contactId)
      .order('is_primary', { ascending: false });
    setContactCompanies(data || []);
  };

  // Email handlers
  const handleAddEmail = async (email, type) => {
    const { data, error } = await supabase
      .from('contact_emails')
      .insert({
        contact_id: contact.id,
        email: email.trim(),
        type: type,
        is_primary: contactEmails.length === 0
      })
      .select()
      .single();

    if (!error) {
      setContactEmails([...contactEmails, data]);
    }
  };

  const handleRemoveEmail = async (emailId) => {
    await supabase
      .from('contact_emails')
      .delete()
      .eq('email_id', emailId);

    setContactEmails(contactEmails.filter(e => e.email_id !== emailId));
  };

  const handleSetEmailPrimary = async (emailId) => {
    // First unset all primary
    await supabase
      .from('contact_emails')
      .update({ is_primary: false })
      .eq('contact_id', contact.id);

    // Set new primary
    await supabase
      .from('contact_emails')
      .update({ is_primary: true })
      .eq('email_id', emailId);

    setContactEmails(contactEmails.map(e => ({
      ...e,
      is_primary: e.email_id === emailId
    })));
  };

  const handleUpdateEmailType = async (emailId, newType) => {
    await supabase
      .from('contact_emails')
      .update({ type: newType })
      .eq('email_id', emailId);

    setContactEmails(contactEmails.map(e =>
      e.email_id === emailId ? { ...e, type: newType } : e
    ));
  };

  // Mobile handlers
  const handleAddMobile = async (mobile, type) => {
    const { data, error } = await supabase
      .from('contact_mobiles')
      .insert({
        contact_id: contact.id,
        mobile: mobile.trim(),
        type: type,
        is_primary: contactMobiles.length === 0
      })
      .select()
      .single();

    if (!error) {
      setContactMobiles([...contactMobiles, data]);
    }
  };

  const handleRemoveMobile = async (mobileId) => {
    await supabase
      .from('contact_mobiles')
      .delete()
      .eq('mobile_id', mobileId);

    setContactMobiles(contactMobiles.filter(m => m.mobile_id !== mobileId));
  };

  const handleSetMobilePrimary = async (mobileId) => {
    await supabase
      .from('contact_mobiles')
      .update({ is_primary: false })
      .eq('contact_id', contact.id);

    await supabase
      .from('contact_mobiles')
      .update({ is_primary: true })
      .eq('mobile_id', mobileId);

    setContactMobiles(contactMobiles.map(m => ({
      ...m,
      is_primary: m.mobile_id === mobileId
    })));
  };

  const handleUpdateMobileType = async (mobileId, newType) => {
    await supabase
      .from('contact_mobiles')
      .update({ type: newType })
      .eq('mobile_id', mobileId);

    setContactMobiles(contactMobiles.map(m =>
      m.mobile_id === mobileId ? { ...m, type: newType } : m
    ));
  };

  // Save handler
  const handleSave = async () => {
    const updates = {
      first_name: firstName,
      last_name: lastName,
      description: descriptionText,
      job_role: jobRoleText,
      category: contactCategory,
      score: contactScore,
      linkedin: linkedin,
      keep_in_touch_frequency: keepInTouchFrequency,
      birthday_day: birthdayDay || null,
      birthday_month: birthdayMonth || null,
      age_estimate: ageEstimate || null,
      christmas_card: christmasWishes === 'Yes',
      easter_card: easterWishes === 'Yes'
    };

    const { error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', contact.id);

    if (!error) {
      onContactUpdate({ ...contact, ...updates });
      onClose();
    }
  };

  // Helper function to determine if a field should be shown
  const shouldShowField = (contact, field) => {
    if (!showMissingFieldsOnly) return true;

    switch(field) {
      case 'first_name': return !contact?.first_name;
      case 'last_name': return !contact?.last_name;
      case 'category': return !contact?.category || contact.category === 'Not Set';
      case 'score': return !contact?.score || contact.score === 0;
      case 'description': return !contact?.description;
      case 'job_role': return !contact?.job_role;
      case 'email': return !contactEmails?.length;
      case 'mobile': return !contactMobiles?.length;
      case 'linkedin': return !contact?.linkedin;
      case 'birthday': return !contact?.birthday_day || !contact?.birthday_month;
      case 'keep_in_touch': return !contact?.keep_in_touch_frequency;
      case 'age': return !contact?.age_estimate;
      case 'christmas': return contact?.christmas_card === undefined;
      case 'easter': return contact?.easter_card === undefined;
      case 'cities': return !contactCities?.length;
      case 'tags': return !contactTags?.length;
      case 'companies': return !contactCompanies?.length;
      default: return true;
    }
  };

  // Tab configuration
  const allTabs = [
    { id: 'Info', label: 'Info', icon: FaInfoCircle },
    { id: 'Contacts', label: 'Contacts', icon: FaEnvelope },
    { id: 'Work', label: 'Work', icon: MdWork },
    { id: 'Personal', label: 'Personal', icon: FaUser },
    { id: 'Cities', label: 'Cities', icon: FaMapMarkerAlt },
    { id: 'Tags', label: 'Tags', icon: FaTags },
    { id: 'Companies', label: 'Companies', icon: FaBuilding }
  ];

  const getVisibleTabs = () => {
    if (!showMissingFieldsOnly) return allTabs;

    return allTabs.filter(tab => {
      switch(tab.id) {
        case 'Info':
          return shouldShowField(contact, 'first_name') ||
                 shouldShowField(contact, 'last_name') ||
                 shouldShowField(contact, 'category') ||
                 shouldShowField(contact, 'score') ||
                 shouldShowField(contact, 'description');
        case 'Contacts':
          return shouldShowField(contact, 'email') ||
                 shouldShowField(contact, 'mobile');
        case 'Work':
          return shouldShowField(contact, 'job_role') ||
                 shouldShowField(contact, 'linkedin') ||
                 shouldShowField(contact, 'companies');
        case 'Personal':
          return shouldShowField(contact, 'birthday') ||
                 shouldShowField(contact, 'keep_in_touch') ||
                 shouldShowField(contact, 'age') ||
                 shouldShowField(contact, 'christmas') ||
                 shouldShowField(contact, 'easter');
        case 'Cities':
          return shouldShowField(contact, 'cities');
        case 'Tags':
          return shouldShowField(contact, 'tags');
        case 'Companies':
          return shouldShowField(contact, 'companies');
        default:
          return false;
      }
    });
  };

  if (!contact) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
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
            Editing: {contact.first_name} {contact.last_name}
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <CloseButton
              onClick={() => onDeleteContact(contact)}
              theme={theme}
              title="Delete or Skip Contact"
              style={{
                background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                color: theme === 'light' ? '#DC2626' : '#FCA5A5'
              }}
            >
              <FaSkull />
            </CloseButton>
            <CloseButton onClick={onClose} theme={theme} title="Close">
              <FiX />
            </CloseButton>
          </div>
        </ModalHeader>

        <ModalBody>
          {/* Tab Navigation */}
          <TabMenu theme={theme}>
            {getVisibleTabs().map(tab => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Tab
                  key={tab.id}
                  theme={theme}
                  $active={isActive}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <IconComponent style={{ fontSize: '14px' }} />
                  <span className="tab-text">{tab.label}</span>
                </Tab>
              );
            })}
          </TabMenu>

          {/* Tab Content */}
          <TabContent>
            {/* Info Tab */}
            {activeTab === 'Info' && (
              <TabPanel>
                {/* First Name */}
                {shouldShowField(contact, 'first_name') && (
                  <FormField>
                    <Label theme={theme}>First Name</Label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name..."
                      theme={theme}
                    />
                  </FormField>
                )}

                {/* Last Name */}
                {shouldShowField(contact, 'last_name') && (
                  <FormField>
                    <Label theme={theme}>Last Name</Label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name..."
                      theme={theme}
                    />
                  </FormField>
                )}

                {/* Category */}
                {shouldShowField(contact, 'category') && (
                  <FormField>
                    <Label theme={theme}>Category</Label>
                    <Select
                      value={contactCategory}
                      onChange={(e) => setContactCategory(e.target.value)}
                      theme={theme}
                    >
                      {categoryOptions.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </Select>
                  </FormField>
                )}

                {/* Score Rating */}
                {shouldShowField(contact, 'score') && (
                  <FormField>
                    <Label theme={theme}>Score Rating</Label>
                    <StarRating theme={theme}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          $active={star <= contactScore}
                          onClick={() => setContactScore(star)}
                        >
                          <FaStar />
                        </Star>
                      ))}
                      <span style={{
                        marginLeft: '12px',
                        fontSize: '14px',
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                      }}>
                        {contactScore > 0 ? `${contactScore}/5` : 'Not rated'}
                      </span>
                    </StarRating>
                  </FormField>
                )}

                {/* Description */}
                {shouldShowField(contact, 'description') && (
                  <FormField>
                    <Label theme={theme}>Description / Notes</Label>
                    <TextArea
                      value={descriptionText}
                      onChange={(e) => setDescriptionText(e.target.value)}
                      placeholder="Enter description or notes..."
                      rows={4}
                      theme={theme}
                    />
                  </FormField>
                )}
              </TabPanel>
            )}

            {/* Contacts Tab */}
            {activeTab === 'Contacts' && (
              <TabPanel>
                {/* Emails Section */}
                {shouldShowField(contact, 'email') && (
                  <Section>
                    <SectionHeader>
                      <Label theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaEnvelope style={{ fontSize: '14px', color: '#3B82F6' }} />
                        Email Addresses
                      </Label>
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
                    <ItemList theme={theme}>
                      {contactEmails?.length > 0 ? (
                        contactEmails.map((emailData) => (
                          <ListItem key={emailData.email_id} theme={theme}>
                            <FaEnvelope style={{ fontSize: '14px', color: '#3B82F6' }} />
                            <ItemContent>
                              <ItemText theme={theme}>
                                {emailData.email}
                                {emailData.is_primary && (
                                  <PrimaryBadge>PRIMARY</PrimaryBadge>
                                )}
                              </ItemText>
                            </ItemContent>
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
                        ))
                      ) : (
                        <EmptyState theme={theme}>
                          <FaEnvelope style={{ fontSize: '24px', opacity: 0.5 }} />
                          <span>No email addresses</span>
                        </EmptyState>
                      )}
                    </ItemList>
                  </Section>
                )}

                {/* Mobile Numbers Section */}
                {shouldShowField(contact, 'mobile') && (
                  <Section>
                    <SectionHeader>
                      <Label theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaPhone style={{ fontSize: '14px', color: '#3B82F6' }} />
                        Mobile Numbers
                      </Label>
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
                    <ItemList theme={theme}>
                      {contactMobiles?.length > 0 ? (
                        contactMobiles.map((mobileData) => (
                          <ListItem key={mobileData.mobile_id} theme={theme}>
                            <FaPhone style={{ fontSize: '14px', color: '#3B82F6' }} />
                            <ItemContent>
                              <ItemText theme={theme}>
                                {mobileData.mobile}
                                {mobileData.is_primary && (
                                  <PrimaryBadge>PRIMARY</PrimaryBadge>
                                )}
                              </ItemText>
                            </ItemContent>
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
                        ))
                      ) : (
                        <EmptyState theme={theme}>
                          <FaPhone style={{ fontSize: '24px', opacity: 0.5 }} />
                          <span>No mobile numbers</span>
                        </EmptyState>
                      )}
                    </ItemList>
                  </Section>
                )}
              </TabPanel>
            )}

            {/* Add more tabs as needed... */}
          </TabContent>

          {/* Save Button */}
          <SaveButtonContainer>
            <SaveButton onClick={handleSave} theme={theme}>
              Save Changes
            </SaveButton>
          </SaveButtonContainer>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const ModalBody = styled.div`
  padding: 0;
`;

const CloseButton = styled.button`
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const TabMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 90%;
  margin: 20px auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;

  @media (max-width: 768px) {
    .tab-text {
      display: none;
    }
  }
`;

const Tab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;

  &:hover {
    background: ${props => props.$active
      ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
      : (props.theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)')
    };
  }
`;

const TabContent = styled.div`
  padding: 0 20px 20px 20px;
  min-height: 400px;
`;

const TabPanel = styled.div`
  height: 460px;
  overflow: auto;
  padding-right: 8px;
  margin-right: -8px;
`;

const FormField = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  fontSize: 14px;
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

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const TextArea = styled.textarea`
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

const StarRating = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const Star = styled.div`
  font-size: 18px;
  color: ${props => props.$active ? '#F59E0B' : '#D1D5DB'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
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

const AddItemRow = styled.div`
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const AddButton = styled.button`
  padding: 8px 12px;
  background-color: #3B82F6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background-color: #2563EB;
  }
`;

const ItemList = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
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
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  &:last-child {
    border-bottom: none;
  }
`;

const ItemContent = styled.div`
  flex: 1;
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
  gap: 8px;
  height: 100px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const SaveButtonContainer = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
`;

const SaveButton = styled.button`
  padding: 12px 24px;
  background-color: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: #2563EB;
  }
`;

export default QuickEditContactModal;