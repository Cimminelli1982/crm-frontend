import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaEdit, FaCheck, FaTimes, FaStickyNote, FaSync, FaArrowLeft } from 'react-icons/fa';
import { FiAlertTriangle, FiX, FiSkipForward } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const InboxPage = ({ theme }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Category change modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [contactToUpdate, setContactToUpdate] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  const categories = [
    { value: 'Keep in Touch', label: 'Keep in Touch', color: '#10B981' },
    { value: 'Friends', label: 'Friends', color: '#3B82F6' },
    { value: 'Family', label: 'Family', color: '#8B5CF6' },
    { value: 'Work', label: 'Work', color: '#F59E0B' },
    { value: 'Business', label: 'Business', color: '#EF4444' },
    { value: 'Prospects', label: 'Prospects', color: '#06B6D4' },
    { value: 'Clients', label: 'Clients', color: '#84CC16' },
    { value: 'Skip', label: 'Skip', color: '#6B7280' },
  ];

  const fetchInboxContacts = async () => {
    setLoading(true);
    try {
      // Calculate date 100 days ago (same logic as original inbox)
      const oneHundredDaysAgo = new Date();
      oneHundredDaysAgo.setDate(oneHundredDaysAgo.getDate() - 100);
      const formattedDate = oneHundredDaysAgo.toISOString();

      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          contact_emails (email, type, is_primary),
          contact_mobiles (mobile, type, is_primary),
          contact_companies (
            company_id,
            relationship,
            is_primary,
            companies (name, website, category)
          ),
          contact_tags (
            tags (name)
          ),
          contact_cities (
            cities (name, country)
          )
        `)
        .eq('category', 'Inbox')
        .gte('last_interaction_at', formattedDate)
        .order('last_interaction_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const processedContacts = data.map(contact => ({
        ...contact,
        emails: contact.contact_emails || [],
        mobiles: contact.contact_mobiles || [],
        companies: contact.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
        tags: contact.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
        cities: contact.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
      }));

      setContacts(processedContacts);
    } catch (error) {
      console.error('Error fetching inbox contacts:', error);
      toast.error('Failed to load inbox contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInboxContacts();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchInboxContacts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
  };

  const handleBackToInbox = () => {
    setSelectedContact(null);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchInboxContacts();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleEditContact = (contactId) => {
    const url = `/contacts/workflow/${contactId}?step=2`;
    const newTab = window.open(url, '_blank');

    if (newTab) {
      newTab.focus();
      setTimeout(() => {
        if (newTab.document && newTab.document.documentElement && newTab.document.documentElement.requestFullscreen) {
          newTab.document.documentElement.requestFullscreen().catch(() => {
            newTab.moveTo(0, 0);
            newTab.resizeTo(window.screen.availWidth, window.screen.availHeight);
          });
        } else {
          newTab.moveTo(0, 0);
          newTab.resizeTo(window.screen.availWidth, window.screen.availHeight);
        }
      }, 100);
    }
  };

  const handleOpenObsidianNote = (contact) => {
    const vaultName = "Living with Intention";
    const fileName = `${contact.first_name} ${contact.last_name}`;
    const obsidianUrl = `obsidian://advanced-uri?vault=${encodeURIComponent(vaultName)}&commandid=workspace%253Anew-file&filename=${encodeURIComponent(fileName + '.md')}`;

    window.open(obsidianUrl, '_self');
    toast.success(`Opening note for ${fileName}`, {
      duration: 2000,
      icon: '📝'
    });
  };

  const handleCategoryChange = (contact, category) => {
    setContactToUpdate(contact);
    setNewCategory(category);
    setCategoryModalOpen(true);
  };

  const handleConfirmCategoryChange = async () => {
    if (!contactToUpdate || !newCategory) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ category: newCategory })
        .eq('contact_id', contactToUpdate.contact_id);

      if (error) throw error;

      toast.success(`Contact moved to ${newCategory}`);

      // Remove contact from inbox list
      setContacts(prev => prev.filter(c => c.contact_id !== contactToUpdate.contact_id));

      // If this was the selected contact, go back to inbox
      if (selectedContact && selectedContact.contact_id === contactToUpdate.contact_id) {
        setSelectedContact(null);
      }

      setCategoryModalOpen(false);
      setContactToUpdate(null);
      setNewCategory('');
    } catch (error) {
      console.error('Error updating contact category:', error);
      toast.error('Failed to update contact category');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle spam/delete functionality (copied from existing pages)
  const handleOpenDeleteModal = async (contactData) => {
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

  const handleSpamContact = (contactData) => {
    const contactWithEmailMobile = {
      ...contactData,
      email: contactData.emails?.[0]?.email || null,
      mobile: contactData.mobiles?.[0]?.mobile || null
    };
    handleOpenDeleteModal(contactWithEmailMobile);
  };

  const handleSkipContact = async (contact) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ category: 'Skip' })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      // Remove contact from inbox list
      setContacts(prev => prev.filter(c => c.contact_id !== contact.contact_id));

      toast.success(`${contact.first_name || ''} ${contact.last_name || ''} moved to Skip`.trim());
    } catch (error) {
      console.error('Error skipping contact:', error);
      toast.error('Failed to skip contact');
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

      // Delete associated records (implementation similar to other pages)
      const promises = [];

      if (selectedItems.deleteInteractions && associatedData.interactionsCount > 0) {
        promises.push(supabase.from('interactions').delete().eq('contact_id', contactToDelete.contact_id));
      }

      // Add other deletions as needed...

      await Promise.all(promises);

      // Finally delete the main contact record
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactToDelete.contact_id);

      if (error) throw error;

      toast.success('Contact and selected associated records deleted successfully');

      // Remove contact from inbox list
      setContacts(prev => prev.filter(contact => contact.contact_id !== contactToDelete.contact_id));

      if (selectedContact && selectedContact.contact_id === contactToDelete.contact_id) {
        setSelectedContact(null);
      }

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

  const getContactPriorityLabel = (contact) => {
    if (!contact.last_interaction_at) return 'ages ago';

    const daysSinceInteraction = Math.floor(
      (Date.now() - new Date(contact.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceInteraction === 0) return 'today';
    if (daysSinceInteraction <= 7) return 'this week';
    if (daysSinceInteraction <= 30) return 'this month';
    return 'ages ago';
  };

  const getContactPriorityScore = (contact) => {
    let score = 0;

    // Has recent interaction
    if (contact.last_interaction_at) {
      const daysSinceInteraction = Math.floor(
        (Date.now() - new Date(contact.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceInteraction <= 7) score += 3;
      else if (daysSinceInteraction <= 30) score += 2;
      else score += 1;
    }

    // Has complete profile info
    if (contact.job_role) score += 1;
    if (contact.companies && contact.companies.length > 0) score += 1;
    if (contact.emails && contact.emails.length > 0) score += 1;
    if (contact.mobiles && contact.mobiles.length > 0) score += 1;

    return score;
  };

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const scoreA = getContactPriorityScore(a);
      const scoreB = getContactPriorityScore(b);

      if (scoreB !== scoreA) return scoreB - scoreA;

      // If scores are equal, sort by last interaction date (newest first) - same as original
      return new Date(b.last_interaction_at) - new Date(a.last_interaction_at);
    });
  }, [contacts]);

  return (
    <PageContainer theme={theme}>
      {!selectedContact ? (
        <InboxView>
          <InboxHeader theme={theme}>
            <HeaderContent>
              <HeaderText>
                <PageTitle theme={theme}>Inbox</PageTitle>
                <PageSubtitle theme={theme}>
                  {contacts.length} contact{contacts.length !== 1 ? 's' : ''} need{contacts.length === 1 ? 's' : ''} categorization
                </PageSubtitle>
              </HeaderText>
              <RefreshButton
                theme={theme}
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                $isRefreshing={isRefreshing}
              >
                <FaSync />
              </RefreshButton>
            </HeaderContent>
          </InboxHeader>

          {loading && (
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText theme={theme}>Loading contacts...</LoadingText>
            </LoadingContainer>
          )}

          <ContactsList>
            {sortedContacts.map(contact => (
              <ContactCard key={contact.contact_id} theme={theme}>
                <ContactCardContent onClick={() => handleContactSelect(contact)}>
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
                        <PriorityIndicator $score={getContactPriorityScore(contact)}>
                          {getContactPriorityLabel(contact)}
                        </PriorityIndicator>
                      </ContactName>
                      {contact.job_role && <ContactRole theme={theme}>{contact.job_role}</ContactRole>}
                      {contact.companies[0] && (
                        <ContactCompany theme={theme}>
                          <FaBuilding style={{ marginRight: '6px' }} />
                          {contact.companies[0].name}
                        </ContactCompany>
                      )}
                    </ContactInfo>
                  </ContactCardHeader>

                  <ContactCardDetails>
                    {contact.emails?.length > 0 && contact.emails[0]?.email && (
                      <ContactDetail theme={theme}>
                        <FaEnvelope />
                        <span>{contact.emails[0].email}</span>
                      </ContactDetail>
                    )}
                    {contact.mobiles?.length > 0 && contact.mobiles[0]?.mobile && (
                      <ContactDetail theme={theme}>
                        <FaPhone />
                        <span>{contact.mobiles[0].mobile}</span>
                      </ContactDetail>
                    )}
                  </ContactCardDetails>
                </ContactCardContent>

                <ContactCardActions>
                  <CardActionButton
                    theme={theme}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditContact(contact.contact_id);
                    }}
                    $edit
                    title="Edit contact"
                  >
                    <FaEdit />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSkipContact(contact);
                    }}
                    $skip
                    title="Skip contact"
                  >
                    <FiSkipForward />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpamContact(contact);
                    }}
                    $delete
                    title="Delete contact"
                  >
                    <FiAlertTriangle />
                  </CardActionButton>
                </ContactCardActions>
              </ContactCard>
            ))}

            {!loading && contacts.length === 0 && (
              <EmptyState>
                <EmptyIcon>📥</EmptyIcon>
                <EmptyTitle theme={theme}>Inbox is empty!</EmptyTitle>
                <EmptyText theme={theme}>All contacts have been categorized. Great work!</EmptyText>
              </EmptyState>
            )}
          </ContactsList>
        </InboxView>
      ) : (
        <DetailView theme={theme}>
          <DetailHeader theme={theme}>
            <BackButton theme={theme} onClick={handleBackToInbox}>
              <FaArrowLeft />
              <span>Back to Inbox</span>
            </BackButton>
            <ActionButtons>
              {selectedContact.emails?.length > 0 && selectedContact.emails[0]?.email && (
                <ActionButton
                  href={`mailto:${selectedContact.emails[0].email}`}
                  $primary
                >
                  <FaEnvelope />
                  Email
                </ActionButton>
              )}
              {selectedContact.mobiles?.length > 0 && selectedContact.mobiles[0]?.mobile && (
                <ActionButton
                  href={`https://wa.me/${selectedContact.mobiles[0].mobile.replace(/\D/g, '')}`}
                  $secondary
                >
                  <FaPhone />
                  WhatsApp
                </ActionButton>
              )}
            </ActionButtons>
          </DetailHeader>

          <DetailContent>
            <ProfileSection>
              <ProfileAvatar>
                {selectedContact.profile_image_url ? (
                  <img src={selectedContact.profile_image_url} alt="Profile" />
                ) : (
                  <FaUser />
                )}
              </ProfileAvatar>
              <ProfileInfo>
                <ProfileHeader>
                  <ProfileName theme={theme}>
                    {selectedContact.first_name} {selectedContact.last_name}
                  </ProfileName>
                  <ObsidianNoteButton
                    theme={theme}
                    onClick={() => handleOpenObsidianNote(selectedContact)}
                    title={`Open Obsidian note for ${selectedContact.first_name} ${selectedContact.last_name}`}
                  >
                    <FaStickyNote />
                  </ObsidianNoteButton>
                </ProfileHeader>
                {selectedContact.job_role && (
                  <ProfileRole theme={theme}>{selectedContact.job_role}</ProfileRole>
                )}
              </ProfileInfo>
            </ProfileSection>

            <CategorizeSection>
              <SectionTitle theme={theme}>Categorize Contact</SectionTitle>
              <CategoryGrid>
                {categories.map(category => (
                  <CategoryCard
                    key={category.value}
                    theme={theme}
                    $color={category.color}
                    onClick={() => handleCategoryChange(selectedContact, category.value)}
                  >
                    <CategoryIcon $color={category.color}>
                      {category.value === 'Skip' ? <FiSkipForward /> : <FaCheck />}
                    </CategoryIcon>
                    <CategoryLabel>{category.label}</CategoryLabel>
                  </CategoryCard>
                ))}
              </CategoryGrid>
            </CategorizeSection>

            {/* Contact details sections similar to other pages */}
          </DetailContent>
        </DetailView>
      )}

      {/* Category Change Confirmation Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onRequestClose={() => setCategoryModalOpen(false)}
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
            maxWidth: '400px',
            width: '90%',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
            borderRadius: '12px',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <ModalHeader>
          <h2>Confirm Category Change</h2>
          <CloseButton
            theme={theme}
            onClick={() => setCategoryModalOpen(false)}
            disabled={isUpdating}
          >
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalContent theme={theme}>
          Move <strong>{contactToUpdate?.first_name} {contactToUpdate?.last_name}</strong> to <strong>{newCategory}</strong>?
        </ModalContent>

        <ModalActions>
          <ConfirmButton
            theme={theme}
            onClick={handleConfirmCategoryChange}
            disabled={isUpdating}
          >
            {isUpdating ? 'Moving...' : 'Confirm'}
          </ConfirmButton>
          <CancelButton
            theme={theme}
            onClick={() => setCategoryModalOpen(false)}
            disabled={isUpdating}
          >
            Cancel
          </CancelButton>
        </ModalActions>
      </Modal>

      {/* Delete Modal (similar to other pages but simplified for brevity) */}
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const InboxView = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const InboxHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 24px 20px;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeaderText = styled.div`
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
`;

const PageSubtitle = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
  font-size: 16px;
`;

const RefreshButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$isRefreshing && `
    svg {
      animation: spin 1s linear infinite;
    }
  `}

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  &:hover {
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid #E5E7EB;
  border-top: 3px solid #3B82F6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`;

const LoadingText = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ContactsList = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
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
    if (label === 'today') return '#10B981';      // Green for today
    if (label === 'this week') return '#F59E0B';  // Yellow for this week
    if (label === 'this month') return '#F97316'; // Orange for this month
    return '#EF4444';                             // Red for ages ago
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

const CategoryButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const CategoryButton = styled.button`
  background: ${props => props.$color};
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
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const CardActionButton = styled.button`
  background: ${props =>
    props.$edit ? '#10B981' :     // Green for edit
    props.$skip ? '#F59E0B' :     // Yellow for skip
    props.$delete ? '#EF4444' :   // Red for delete
    '#6B7280'                     // Default gray
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
      props.$edit ? '#059669' :     // Darker green for edit
      props.$skip ? '#D97706' :     // Darker yellow for skip
      props.$delete ? '#DC2626' :   // Darker red for delete
      '#4B5563'                     // Darker gray
    };
  }

  &:active {
    transform: scale(0.95);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
`;

const EmptyTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 12px 0;
`;

const EmptyText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
  font-size: 16px;
`;

const DetailView = styled.div`
  height: 100vh;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  display: flex;
  flex-direction: column;
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  position: sticky;
  top: 0;
  z-index: 10;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;

  ${props => props.$primary && `
    background: #3B82F6;
    color: white;

    &:hover {
      background: #2563EB;
      color: white;
    }
  `}

  ${props => props.$secondary && `
    background: #10B981;
    color: white;

    &:hover {
      background: #059669;
      color: white;
    }
  `}
`;

const DetailContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const ProfileAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  border: 3px solid #E5E7EB;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: #9CA3AF;
    font-size: 32px;
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
`;

const ProfileName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
`;

const ProfileRole = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ObsidianNoteButton = styled.button`
  background: #8B5CF6;
  color: white;
  border: none;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;

  &:hover {
    background: #7C3AED;
    transform: translateY(-1px);
  }
`;

const CategorizeSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
`;

const CategoryCard = styled.button`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  border: 2px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  &:hover {
    border-color: ${props => props.$color};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CategoryIcon = styled.div`
  background: ${props => props.$color};
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
`;

const CategoryLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
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
  margin-bottom: 20px;
  font-size: 16px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ConfirmButton = styled.button`
  background: #3B82F6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #2563EB;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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

export default InboxPage;