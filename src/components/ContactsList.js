import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaEdit, FaClock, FaTimes } from 'react-icons/fa';
import { FiSkipForward, FiAlertTriangle, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';

const ContactsList = ({
  contacts = [],
  loading = false,
  theme,
  emptyStateConfig = {
    icon: '📥',
    title: 'No contacts found',
    text: 'There are no contacts to display.'
  },
  onContactUpdate,
  showActions = true,
  onContactClick,
  badgeType = 'time', // 'time' or 'category'
  pageContext = null, // 'keepInTouch' or null
  keepInTouchData = null // { showDaysCounter: boolean, showFrequencyBadge: boolean }
}) => {
  const navigate = useNavigate();

  // Keep in Touch helper functions
  const formatDaysUntilNext = (daysUntilNext, contact = null) => {
    if (daysUntilNext === null || daysUntilNext === undefined) {
      // Check if this is a birthday contact
      if (contact?.days_until_birthday !== undefined) {
        return formatBirthdayCountdown(contact.days_until_birthday);
      }
      return '';
    }

    const days = parseInt(daysUntilNext);
    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    } else if (days === 0) {
      return 'Due today';
    } else {
      return `Due in ${days} days`;
    }
  };

  const formatBirthdayCountdown = (daysUntilBirthday) => {
    const days = parseInt(daysUntilBirthday);
    if (days === 0) {
      return '🎉 Birthday today!';
    } else if (days === 1) {
      return '🎂 Birthday tomorrow!';
    } else if (days <= 7) {
      return `🎈 Birthday in ${days} days`;
    } else {
      return `🎁 Birthday in ${days} days`;
    }
  };

  const getUrgencyColor = (daysUntilNext, theme, contact = null) => {
    // Handle birthday coloring
    if (contact?.days_until_birthday !== undefined) {
      const days = parseInt(contact.days_until_birthday);
      if (days === 0) {
        return '#EF4444'; // Red for birthday today
      } else if (days <= 7) {
        return '#F59E0B'; // Amber for birthday this week
      } else {
        return '#10B981'; // Green for birthday coming up
      }
    }

    if (daysUntilNext === null || daysUntilNext === undefined) return theme === 'light' ? '#6B7280' : '#9CA3AF';

    const days = parseInt(daysUntilNext);
    if (days < 0) {
      return '#EF4444'; // Red for overdue
    } else if (days <= 7) {
      return '#F59E0B'; // Amber for due soon
    } else {
      return '#10B981'; // Green for coming up
    }
  };

  const formatFrequency = (frequency) => {
    if (!frequency) return '';
    return frequency.replace(/([A-Z])/g, ' $1').trim();
  };

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [associatedData, setAssociatedData] = useState({});
  const [selectedItems, setSelectedItems] = useState({
    deleteInteractions: true,
    deleteEmails: true,
    deleteEmailParticipants: true,
    deleteEmailThreads: true,
    deleteTags: true,
    deleteCities: true,
    deleteCompanies: true,
    deleteNotes: true,
    deleteAttachments: true,
    deleteContactEmails: true,
    deleteContactMobiles: true,
    deleteChat: true,
    deleteContactChats: true,
    deleteDeals: true,
    deleteMeetings: true,
    deleteInvestments: true,
    deleteKit: true,
    addToSpam: true,
    addMobileToSpam: true
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Keep in Touch frequency modal state
  const [frequencyModalOpen, setFrequencyModalOpen] = useState(false);
  const [contactForFrequency, setContactForFrequency] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState('');

  const frequencyOptions = [
    'Weekly',
    'Monthly',
    'Quarterly',
    'Twice per Year',
    'Once per Year'
  ];

  const handleEditContact = (contactId, e) => {
    if (e) e.stopPropagation();

    // Check if we're in local development
    const isLocal = window.location.hostname === 'localhost';
    const url = isLocal
      ? `http://localhost:3000/contacts/workflow/${contactId}?step=2`
      : `/contacts/workflow/${contactId}?step=2`;

    const newTab = window.open(url, '_blank');
    if (newTab) {
      newTab.focus();
    }
  };

  const handleSkipContact = async (contact, e) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ category: 'Skip' })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('Contact moved to Skip');
      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error skipping contact:', error);
      toast.error('Failed to skip contact');
    }
  };

  // Keep in Touch specific handlers
  const handleRemoveFromKeepInTouch = async (contact, e) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .delete()
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('Contact removed from keep in touch');
      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error removing from keep in touch:', error);
      toast.error('Failed to remove from keep in touch');
    }
  };

  const handleOpenFrequencyModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForFrequency(contact);
    setSelectedFrequency(contact.keep_in_touch_frequency || 'Monthly');
    setFrequencyModalOpen(true);
  };

  const handleUpdateFrequency = async () => {
    if (!contactForFrequency || !selectedFrequency) return;

    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .update({ frequency: selectedFrequency })
        .eq('contact_id', contactForFrequency.contact_id);

      if (error) throw error;

      toast.success(`Keep in touch frequency updated to ${selectedFrequency}`);
      setFrequencyModalOpen(false);
      setContactForFrequency(null);
      setSelectedFrequency('');
      if (onContactUpdate) onContactUpdate();
    } catch (error) {
      console.error('Error updating frequency:', error);
      toast.error('Failed to update frequency');
    }
  };

  // Handle opening delete modal with spam functionality
  const handleOpenDeleteModal = async (contact, e) => {
    if (e) e.stopPropagation();

    const contactData = {
      ...contact,
      email: contact.emails?.[0]?.email || null,
      mobile: contact.mobiles?.[0]?.mobile || null
    };

    setContactToDelete(contactData);

    try {
      // Get counts of associated records
      const [
        chatResult,
        contactChatsResult,
        interactionsResult,
        emailsResult,
        emailParticipantsResult,
        emailThreadsResult,
        tagsResult,
        citiesResult,
        companiesResult,
        notesResult,
        attachmentsResult,
        contactEmailsResult,
        contactMobilesResult,
        dealsResult,
        meetingsResult,
        investmentsResult,
        kitResult,
        lastInteractionResult
      ] = await Promise.all([
        Promise.resolve({ count: 0 }),
        Promise.resolve({ count: 0 }),
        supabase.from('interactions').select('interaction_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('emails').select('email_id', { count: 'exact', head: true }).eq('sender_contact_id', contactData.contact_id),
        supabase.from('email_participants').select('participant_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_email_threads').select('email_thread_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_tags').select('entry_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_cities').select('entry_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_companies').select('contact_companies_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('notes_contacts').select('note_contact_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('attachments').select('attachment_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_emails').select('email_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_mobiles').select('mobile_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('deals_contacts').select('deals_contacts_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('meeting_contacts').select('meeting_contact_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('investments_contacts').select('investments_contacts_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('keep_in_touch').select('id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('interactions').select('interaction_id, interaction_type, direction, interaction_date, summary').eq('contact_id', contactData.contact_id).order('interaction_date', { ascending: false }).limit(1)
      ]);

      // Format last interaction
      let lastInteraction = null;
      if (lastInteractionResult.data && lastInteractionResult.data.length > 0) {
        const interaction = lastInteractionResult.data[0];
        const date = new Date(interaction.interaction_date).toLocaleDateString();
        lastInteraction = {
          summary: `${interaction.interaction_type} - ${interaction.summary || 'No notes'} (${date})`
        };
      }

      const data = {
        chatCount: chatResult.count || 0,
        contactChatsCount: contactChatsResult.count || 0,
        interactionsCount: interactionsResult.count || 0,
        emailsCount: emailsResult.count || 0,
        emailParticipantsCount: emailParticipantsResult.count || 0,
        emailThreadsCount: emailThreadsResult.count || 0,
        tagsCount: tagsResult.count || 0,
        citiesCount: citiesResult.count || 0,
        companiesCount: companiesResult.count || 0,
        notesCount: notesResult.count || 0,
        attachmentsCount: attachmentsResult.count || 0,
        contactEmailsCount: contactEmailsResult.count || 0,
        contactMobilesCount: contactMobilesResult.count || 0,
        dealsCount: dealsResult.count || 0,
        meetingsCount: meetingsResult.count || 0,
        investmentsCount: investmentsResult.count || 0,
        kitCount: kitResult.count || 0,
        lastInteraction
      };

      setAssociatedData(data);
      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error fetching associated data:', error);
      toast.error('Failed to load contact details');
    }
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedItems(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    try {
      setIsDeleting(true);

      // Add email to spam list if selected
      if (selectedItems.addToSpam && contactToDelete.email) {
        const { error: spamError } = await supabase
          .from('emails_spam')
          .insert([{
            email: contactToDelete.email,
            counter: 1
          }]);

        if (spamError) {
          console.error('Error adding to spam list:', spamError);
        }
      }

      // Add mobile to WhatsApp spam list if selected
      if (selectedItems.addMobileToSpam && contactToDelete.mobile) {
        const { error: whatsappSpamError } = await supabase
          .from('whatsapp_spam')
          .insert([{
            mobile_number: contactToDelete.mobile,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString()
          }]);

        if (whatsappSpamError) {
          console.error('Error adding to WhatsApp spam list:', whatsappSpamError);
        }
      }

      // Delete associated records
      const promises = [];

      if (selectedItems.deleteInteractions && associatedData.interactionsCount > 0) {
        promises.push(supabase.from('interactions').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteEmails && associatedData.emailsCount > 0) {
        promises.push(supabase.from('emails').delete().eq('sender_contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteEmailParticipants && associatedData.emailParticipantsCount > 0) {
        promises.push(supabase.from('email_participants').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteEmailThreads && associatedData.emailThreadsCount > 0) {
        promises.push(supabase.from('contact_email_threads').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteTags && associatedData.tagsCount > 0) {
        promises.push(supabase.from('contact_tags').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteCities && associatedData.citiesCount > 0) {
        promises.push(supabase.from('contact_cities').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteCompanies && associatedData.companiesCount > 0) {
        promises.push(supabase.from('contact_companies').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteNotes && associatedData.notesCount > 0) {
        promises.push(supabase.from('notes_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteAttachments && associatedData.attachmentsCount > 0) {
        promises.push(supabase.from('attachments').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteContactEmails && associatedData.contactEmailsCount > 0) {
        promises.push(supabase.from('contact_emails').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteContactMobiles && associatedData.contactMobilesCount > 0) {
        promises.push(supabase.from('contact_mobiles').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteDeals && associatedData.dealsCount > 0) {
        promises.push(supabase.from('deals_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteMeetings && associatedData.meetingsCount > 0) {
        promises.push(supabase.from('meeting_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteInvestments && associatedData.investmentsCount > 0) {
        promises.push(supabase.from('investments_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteKit && associatedData.kitCount > 0) {
        promises.push(supabase.from('keep_in_touch').delete().eq('contact_id', contactToDelete.contact_id));
      }

      await Promise.all(promises);

      // Finally delete the main contact record
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactToDelete.contact_id);

      if (error) throw error;

      toast.success('Contact and selected associated records deleted successfully');

      if (onContactUpdate) onContactUpdate();

      setDeleteModalOpen(false);
      setContactToDelete(null);
      setAssociatedData({});

    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContactClick = (contact) => {
    if (onContactClick) {
      onContactClick(contact);
    } else {
      navigate(`/contact/${contact.contact_id}`);
    }
  };

  const getContactPriorityScore = (contact) => {
    // Use last_interaction_at if available, otherwise fall back to created_at
    const interactionDate = contact.last_interaction_at || contact.created_at;
    if (!interactionDate) return 9999; // Very high number for contacts with no date

    const lastInteraction = new Date(interactionDate);
    const now = new Date();

    // Reset time to start of day for accurate day calculation
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const interactionDay = new Date(lastInteraction.getFullYear(), lastInteraction.getMonth(), lastInteraction.getDate());

    const daysDiff = Math.floor((today - interactionDay) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff); // Ensure non-negative
  };

  const getContactPriorityLabel = (contact) => {
    // For spam contacts, show the spam counter instead of other labels
    if (contact.spam_counter !== undefined) {
      return `${contact.spam_counter}x`;
    }

    // If badgeType is 'category', show the contact category
    if (badgeType === 'category') {
      return contact.category || 'No Category';
    }

    // Default to time-based labels
    const daysDiff = getContactPriorityScore(contact);

    if (daysDiff === 0) return 'today';
    if (daysDiff === 1) return 'yesterday';
    if (daysDiff <= 7) return 'this week';
    if (daysDiff <= 30) return 'this month';
    if (daysDiff <= 90) return 'this quarter';
    if (daysDiff <= 365) return 'this year';
    return 'ages ago';
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingText theme={theme}>Loading contacts...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <ContactsListContainer>
      {contacts.map(contact => (
        <ContactCard key={contact.contact_id} theme={theme}>
          <ContactCardContent onClick={() => handleContactClick(contact)}>
            <ContactCardHeader>
              <ContactAvatar>
                {contact.profile_image_url ? (
                  <img src={contact.profile_image_url} alt="Profile" />
                ) : (
                  <FaUser />
                )}
              </ContactAvatar>
              <ContactInfo>
                <ContactName theme={theme}>
                  {contact.first_name} {contact.last_name}
                  {pageContext === 'keepInTouch' && keepInTouchData?.showFrequencyBadge && contact.keep_in_touch_frequency && (
                    <KeepInTouchFrequencyBadge theme={theme}>
                      {formatFrequency(contact.keep_in_touch_frequency)}
                    </KeepInTouchFrequencyBadge>
                  )}
                  {pageContext !== 'keepInTouch' && (
                    <PriorityIndicator $score={getContactPriorityScore(contact)}>
                      {getContactPriorityLabel(contact)}
                    </PriorityIndicator>
                  )}
                </ContactName>
                {pageContext === 'keepInTouch' && keepInTouchData?.showDaysCounter && (
                  <KeepInTouchStatus
                    theme={theme}
                    $urgencyColor={getUrgencyColor(contact.days_until_next, theme, contact)}
                  >
                    {formatDaysUntilNext(contact.days_until_next, contact)}
                  </KeepInTouchStatus>
                )}
                {contact.job_role && <ContactRole theme={theme}>{contact.job_role}</ContactRole>}
                {contact.companies?.[0] && (
                  <ContactCompany theme={theme}>
                    <FaBuilding style={{ marginRight: '6px' }} />
                    {contact.companies[0].name}
                  </ContactCompany>
                )}
              </ContactInfo>
            </ContactCardHeader>

            <ContactCardDetails>
              {pageContext !== 'keepInTouch' && contact.emails?.length > 0 && contact.emails[0]?.email && (
                <ContactDetail theme={theme}>
                  <FaEnvelope />
                  <span>{contact.emails[0].email}</span>
                </ContactDetail>
              )}
              {pageContext !== 'keepInTouch' && contact.mobiles?.length > 0 && contact.mobiles[0]?.mobile && (
                <ContactDetail theme={theme}>
                  <FaPhone />
                  <span>{contact.mobiles[0].mobile}</span>
                </ContactDetail>
              )}
            </ContactCardDetails>
          </ContactCardContent>

          {showActions && (
            <ContactCardActions>
              <CardActionButton
                theme={theme}
                onClick={(e) => handleEditContact(contact.contact_id, e)}
                $edit
                title="Edit contact"
              >
                <FaEdit />
              </CardActionButton>

              {pageContext === 'keepInTouch' ? (
                <>
                  <CardActionButton
                    theme={theme}
                    onClick={(e) => handleOpenFrequencyModal(contact, e)}
                    $frequency
                    title="Change keep in touch frequency"
                  >
                    <FaClock />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => handleRemoveFromKeepInTouch(contact, e)}
                    $removeKeepInTouch
                    title="Don't keep in touch"
                  >
                    <FaTimes />
                  </CardActionButton>
                </>
              ) : (
                <>
                  <CardActionButton
                    theme={theme}
                    onClick={(e) => handleSkipContact(contact, e)}
                    $skip
                    title="Skip contact"
                  >
                    <FiSkipForward />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => handleOpenDeleteModal(contact, e)}
                    $delete
                    title="Delete contact"
                  >
                    <FiAlertTriangle />
                  </CardActionButton>
                </>
              )}
            </ContactCardActions>
          )}
        </ContactCard>
      ))}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onRequestClose={() => setDeleteModalOpen(false)}
        shouldCloseOnOverlayClick={false}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '25px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
            borderRadius: '12px',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
            overflow: 'auto',
            zIndex: 9999
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9998
          }
        }}
      >
        {contactToDelete && (
          <>
            <ModalHeader>
              <h2>Delete Contact</h2>
              <CloseButton
                theme={theme}
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                <FiX />
              </CloseButton>
            </ModalHeader>

            <ModalContent theme={theme}>
              <ContactSummary>
                <strong>{contactToDelete.first_name} {contactToDelete.last_name}</strong>
                {contactToDelete.email && <div>Email: {contactToDelete.email}</div>}
                {contactToDelete.mobile && <div>Mobile: {contactToDelete.mobile}</div>}
                {associatedData.lastInteraction && (
                  <div style={{ marginTop: '8px', fontSize: '14px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    Last interaction: {associatedData.lastInteraction.summary}
                  </div>
                )}
              </ContactSummary>

              <WarningText>
                ⚠️ This action cannot be undone. Select which associated data to delete:
              </WarningText>

              <CheckboxContainer>
                <CheckboxGroup>
                  {associatedData.interactionsCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteInteractions"
                        name="deleteInteractions"
                        checked={selectedItems.deleteInteractions}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteInteractions">Interactions ({associatedData.interactionsCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.emailsCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteEmails"
                        name="deleteEmails"
                        checked={selectedItems.deleteEmails}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteEmails">Emails ({associatedData.emailsCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.tagsCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteTags"
                        name="deleteTags"
                        checked={selectedItems.deleteTags}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteTags">Tags ({associatedData.tagsCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.companiesCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteCompanies"
                        name="deleteCompanies"
                        checked={selectedItems.deleteCompanies}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteCompanies">Companies ({associatedData.companiesCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.notesCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteNotes"
                        name="deleteNotes"
                        checked={selectedItems.deleteNotes}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteNotes">Notes ({associatedData.notesCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.kitCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteKit"
                        name="deleteKit"
                        checked={selectedItems.deleteKit}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteKit">Keep In Touch ({associatedData.kitCount})</label>
                    </CheckboxItem>
                  )}

                  {contactToDelete.email && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="addToSpam"
                        name="addToSpam"
                        checked={selectedItems.addToSpam}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="addToSpam">Add email to spam list</label>
                    </CheckboxItem>
                  )}

                  {contactToDelete.mobile && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="addMobileToSpam"
                        name="addMobileToSpam"
                        checked={selectedItems.addMobileToSpam}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="addMobileToSpam">Add mobile to WhatsApp spam list</label>
                    </CheckboxItem>
                  )}
                </CheckboxGroup>
              </CheckboxContainer>

              <ButtonGroup>
                <CancelButton
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </CancelButton>
                <DeleteButton
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Contact'}
                </DeleteButton>
              </ButtonGroup>
            </ModalContent>
          </>
        )}
      </Modal>

      {/* Frequency Modal */}
      <Modal
        isOpen={frequencyModalOpen}
        onRequestClose={() => setFrequencyModalOpen(false)}
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
            maxWidth: '400px',
            width: '90%'
          }
        }}
      >
        <FrequencyModalContent theme={theme}>
          <FrequencyModalHeader theme={theme}>
            <h3>Change Keep in Touch Frequency</h3>
            <FrequencyModalCloseButton
              theme={theme}
              onClick={() => setFrequencyModalOpen(false)}
            >
              <FiX />
            </FrequencyModalCloseButton>
          </FrequencyModalHeader>

          <FrequencyModalBody>
            <ContactNameDisplay theme={theme}>
              {contactForFrequency?.first_name} {contactForFrequency?.last_name}
            </ContactNameDisplay>

            <FrequencyOptionsContainer>
              {frequencyOptions.map(frequency => (
                <FrequencyOption
                  key={frequency}
                  theme={theme}
                  $selected={selectedFrequency === frequency}
                  onClick={() => setSelectedFrequency(frequency)}
                >
                  {frequency}
                </FrequencyOption>
              ))}
            </FrequencyOptionsContainer>

            <ButtonGroup>
              <CancelButton
                theme={theme}
                onClick={() => setFrequencyModalOpen(false)}
              >
                Cancel
              </CancelButton>
              <UpdateFrequencyButton
                theme={theme}
                onClick={handleUpdateFrequency}
                disabled={!selectedFrequency}
              >
                Update Frequency
              </UpdateFrequencyButton>
            </ButtonGroup>
          </FrequencyModalBody>
        </FrequencyModalContent>
      </Modal>

      {!loading && contacts.length === 0 && (
        <EmptyState>
          <EmptyIcon>{emptyStateConfig.icon}</EmptyIcon>
          <EmptyTitle theme={theme}>{emptyStateConfig.title}</EmptyTitle>
          <EmptyText theme={theme}>{emptyStateConfig.text}</EmptyText>
        </EmptyState>
      )}
    </ContactsListContainer>
  );
};

// Styled Components
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
`;

const LoadingText = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ContactsListContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const ContactCard = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20px;
  align-items: center;

  &:hover {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ContactCardContent = styled.div`
  flex: 1;
  cursor: pointer;
  min-width: 0;
`;

const ContactCardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const ContactAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  border: 2px solid #E5E7EB;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: #9CA3AF;
    font-size: 20px;
  }
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 18px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PriorityIndicator = styled.div`
  background: ${props => {
    const label = props.children;

    // Spam counter badges
    if (label && label.toString().includes('x')) {
      return '#EF4444'; // Red for spam
    }

    // Category badges
    if (label === 'Founder') return '#7C3AED';           // Purple for Founder
    if (label === 'Professional Investor') return '#059669';  // Green for Professional Investor
    if (label === 'Team') return '#0284C7';             // Blue for Team
    if (label === 'Advisor') return '#DC2626';          // Red for Advisor
    if (label === 'Supplier') return '#EA580C';         // Orange for Supplier
    if (label === 'Manager') return '#7C2D12';          // Brown for Manager
    if (label === 'Institution') return '#1F2937';      // Gray for Institution
    if (label === 'Media') return '#BE185D';            // Pink for Media
    if (label === 'Friend and Family') return '#16A34A'; // Light green for Friend and Family
    if (label === 'No Category' || label === 'Not Set') return '#6B7280'; // Gray for No Category

    // Time-based badges (original colors)
    if (label === 'today') return '#10B981';          // Bright green for today
    if (label === 'yesterday') return '#34D399';      // Light green for yesterday
    if (label === 'this week') return '#F59E0B';      // Yellow for this week
    if (label === 'this month') return '#F97316';     // Orange for this month
    if (label === 'this quarter') return '#EF4444';   // Red for this quarter
    if (label === 'this year') return '#DC2626';      // Dark red for this year
    if (label === 'ages ago') return '#7F1D1D';       // Very dark red for ages ago

    return '#6B7280'; // Default gray
  }};
  color: white;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 6px;
  min-width: fit-content;
  text-align: center;
  white-space: nowrap;
`;

const ContactRole = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  margin-bottom: 4px;
`;

const ContactCompany = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  display: flex;
  align-items: center;

  svg {
    font-size: 12px;
  }
`;

const ContactCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ContactDetail = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    font-size: 12px;
    flex-shrink: 0;
  }

  span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ContactCardActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
`;

const CardActionButton = styled.button`
  background: ${props =>
    props.$edit ? '#10B981' :                    // Green for edit
    props.$skip ? '#F59E0B' :                    // Yellow for skip
    props.$delete ? '#EF4444' :                  // Red for delete
    props.$frequency ? '#3B82F6' :               // Blue for frequency
    props.$removeKeepInTouch ? '#EF4444' :       // Red for remove keep in touch
    '#6B7280'                                    // Default gray
  };
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;

  &:hover {
    transform: scale(1.1);
    background: ${props =>
      props.$edit ? '#059669' :                  // Darker green for edit
      props.$skip ? '#D97706' :                  // Darker yellow for skip
      props.$delete ? '#DC2626' :                // Darker red for delete
      props.$frequency ? '#2563EB' :             // Darker blue for frequency
      props.$removeKeepInTouch ? '#DC2626' :     // Darker red for remove keep in touch
      '#4B5563'                                  // Darker gray for default
    };
  }

  &:active {
    transform: scale(0.95);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const EmptyText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
  margin: 0;
`;

// Modal Components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalContent = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  line-height: 1.5;
`;

const ContactSummary = styled.div`
  background: ${props => props.theme === 'light' ? '#F8FAFC' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#E2E8F0' : '#E2E8F0'};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;

  div {
    margin: 4px 0;
    font-size: 14px;
    color: ${props => props.theme === 'light' ? '#1F2937' : '#1F2937'};
  }
`;

const WarningText = styled.div`
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#F59E0B'};
  color: ${props => props.theme === 'light' ? '#92400E' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#F59E0B' : '#D97706'};
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
`;

const CheckboxContainer = styled.div`
  margin: 20px 0;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#FFFFFF'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#E5E7EB'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#F3F4F6'};
    border-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#D1D5DB'};
  }

  label {
    font-size: 14px;
    color: ${props => props.theme === 'light' ? '#374151' : '#374151'};
    cursor: pointer;
    flex: 1;
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const CancelButton = styled.button`
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  background: #EF4444;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #DC2626;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Keep in Touch specific styled components
const KeepInTouchFrequencyBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#EBF4FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 8px;
  text-transform: uppercase;
`;

const KeepInTouchStatus = styled.div`
  color: ${props => props.$urgencyColor};
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

// Keep in Touch specific styled components for actions and modal
const FrequencyModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
`;

const FrequencyModalHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    font-size: 18px;
    font-weight: 600;
  }
`;

const FrequencyModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  }
`;

const FrequencyModalBody = styled.div`
  padding: 20px;
`;

const ContactNameDisplay = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
`;

const FrequencyOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
`;

const FrequencyOption = styled.button`
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#F9FAFB' : '#374151')
  };
  color: ${props => props.$selected
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#111827' : '#F9FAFB')
  };
  border: 1px solid ${props => props.$selected
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
  };
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  text-align: left;

  &:hover {
    background: ${props => props.$selected
      ? (props.theme === 'light' ? '#2563EB' : '#3B82F6')
      : (props.theme === 'light' ? '#F3F4F6' : '#4B5563')
    };
  }
`;

const UpdateFrequencyButton = styled.button`
  background: #10B981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default ContactsList;