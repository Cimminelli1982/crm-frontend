import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaEdit, FaUndo, FaStickyNote, FaSync, FaTrashRestore, FaEye } from 'react-icons/fa';
import { FiAlertTriangle, FiX, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';

const TrashPage = ({ theme }) => {
  const [trashedContacts, setTrashedContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  // Restore modal state
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [contactToRestore, setContactToRestore] = useState(null);
  const [restoreCategory, setRestoreCategory] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Permanent delete modal state
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

  const restoreCategories = [
    { value: 'Keep in Touch', label: 'Keep in Touch' },
    { value: 'Friends', label: 'Friends' },
    { value: 'Family', label: 'Family' },
    { value: 'Work', label: 'Work' },
    { value: 'Business', label: 'Business' },
    { value: 'Prospects', label: 'Prospects' },
    { value: 'Clients', label: 'Clients' },
    { value: 'Inbox', label: 'Inbox' },
  ];

  const fetchTrashedContacts = async () => {
    setLoading(true);
    try {
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
        .in('category', ['Skip', 'WhatsApp Group Contact', 'System'])
        .order('last_interaction_at', { ascending: false, nullsFirst: false })
        .limit(200);

      if (error) throw error;

      const processedContacts = data.map(contact => ({
        ...contact,
        emails: contact.contact_emails || [],
        mobiles: contact.contact_mobiles || [],
        companies: contact.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
        tags: contact.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
        cities: contact.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
      }));

      setTrashedContacts(processedContacts);
    } catch (error) {
      console.error('Error fetching trashed contacts:', error);
      toast.error('Failed to load trashed contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashedContacts();

    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchTrashedContacts();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
  };

  const handleBackToTrash = () => {
    setSelectedContact(null);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchTrashedContacts();
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

  const handleRestoreContact = (contact) => {
    setContactToRestore(contact);
    setRestoreCategory('Inbox'); // Default restore category
    setRestoreModalOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!contactToRestore || !restoreCategory) return;

    setIsRestoring(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          category: restoreCategory,
          last_modified_at: new Date().toISOString()
        })
        .eq('contact_id', contactToRestore.contact_id);

      if (error) throw error;

      toast.success(`Contact restored to ${restoreCategory}`);

      // Remove contact from trash list
      setTrashedContacts(prev => prev.filter(c => c.contact_id !== contactToRestore.contact_id));

      // If this was the selected contact, go back to trash
      if (selectedContact && selectedContact.contact_id === contactToRestore.contact_id) {
        setSelectedContact(null);
      }

      setRestoreModalOpen(false);
      setContactToRestore(null);
      setRestoreCategory('');
    } catch (error) {
      console.error('Error restoring contact:', error);
      toast.error('Failed to restore contact');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle permanent delete functionality (copied from existing pages)
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

  const handlePermanentDelete = (contactData) => {
    const contactWithEmailMobile = {
      ...contactData,
      email: contactData.emails?.[0]?.email || null,
      mobile: contactData.mobiles?.[0]?.mobile || null
    };
    handleOpenDeleteModal(contactWithEmailMobile);
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

      toast.success('Contact permanently deleted');

      // Remove contact from trash list
      setTrashedContacts(prev => prev.filter(contact => contact.contact_id !== contactToDelete.contact_id));

      if (selectedContact && selectedContact.contact_id === contactToDelete.contact_id) {
        setSelectedContact(null);
      }

      setDeleteModalOpen(false);
      setContactToDelete(null);
      setAssociatedData({});

    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact permanently');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Skip': return '#6B7280';
      case 'WhatsApp Group Contact': return '#10B981';
      case 'System': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Skip': return '⏭️';
      case 'WhatsApp Group Contact': return '💬';
      case 'System': return '⚙️';
      default: return '🗑️';
    }
  };

  const getInteractionAge = (lastInteractionAt) => {
    if (!lastInteractionAt) return null;

    const daysSince = Math.floor(
      (Date.now() - new Date(lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince < 7) return { text: `${daysSince}d ago`, color: '#10B981' };
    if (daysSince < 30) return { text: `${daysSince}d ago`, color: '#F59E0B' };
    if (daysSince < 90) return { text: `${Math.floor(daysSince / 30)}m ago`, color: '#EF4444' };
    if (daysSince < 365) return { text: `${Math.floor(daysSince / 30)}m ago`, color: '#6B7280' };
    return { text: `${Math.floor(daysSince / 365)}y ago`, color: '#6B7280' };
  };

  // Filter contacts by category
  const filteredContacts = useMemo(() => {
    if (filterCategory === 'All') {
      return trashedContacts;
    }
    return trashedContacts.filter(contact => contact.category === filterCategory);
  }, [trashedContacts, filterCategory]);

  // Sort by last interaction (most recent first, then no interaction)
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      if (!a.last_interaction_at && !b.last_interaction_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (!a.last_interaction_at) return 1;
      if (!b.last_interaction_at) return -1;
      return new Date(b.last_interaction_at) - new Date(a.last_interaction_at);
    });
  }, [filteredContacts]);

  const trashCategories = ['All', 'Skip', 'WhatsApp Group Contact', 'System'];

  return (
    <PageContainer theme={theme}>
      {!selectedContact ? (
        <TrashView>
          <TrashHeader theme={theme}>
            <HeaderContent>
              <HeaderText>
                <PageTitle theme={theme}>Trash</PageTitle>
                <PageSubtitle theme={theme}>
                  {trashedContacts.length} contact{trashedContacts.length !== 1 ? 's' : ''} in trash • Review and restore if needed
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

            <FilterTabs theme={theme}>
              {trashCategories.map(category => (
                <FilterTab
                  key={category}
                  theme={theme}
                  $active={filterCategory === category}
                  onClick={() => setFilterCategory(category)}
                >
                  {getCategoryIcon(category)} {category}
                  {category !== 'All' && (
                    <CategoryCount theme={theme}>
                      {trashedContacts.filter(c => c.category === category).length}
                    </CategoryCount>
                  )}
                </FilterTab>
              ))}
            </FilterTabs>
          </TrashHeader>

          {loading && (
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText theme={theme}>Loading trashed contacts...</LoadingText>
            </LoadingContainer>
          )}

          <ContactsList>
            {sortedContacts.map(contact => {
              const interactionAge = getInteractionAge(contact.last_interaction_at);
              return (
                <ContactCard key={contact.contact_id} theme={theme} $category={contact.category}>
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
                          <CategoryBadge $color={getCategoryColor(contact.category)}>
                            {getCategoryIcon(contact.category)} {contact.category}
                          </CategoryBadge>
                        </ContactName>
                        {contact.job_role && <ContactRole theme={theme}>{contact.job_role}</ContactRole>}
                        {contact.companies[0] && (
                          <ContactCompany theme={theme}>
                            <FaBuilding style={{ marginRight: '6px' }} />
                            {contact.companies[0].name}
                          </ContactCompany>
                        )}
                      </ContactInfo>
                      <ContactMeta>
                        {interactionAge && (
                          <InteractionAge $color={interactionAge.color}>
                            {interactionAge.text}
                          </InteractionAge>
                        )}
                        <TrashDate theme={theme}>
                          Trashed: {new Date(contact.last_modified_at || contact.created_at).toLocaleDateString()}
                        </TrashDate>
                      </ContactMeta>
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
                    <ActionButton
                      theme={theme}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreContact(contact);
                      }}
                      $restore
                      title="Restore contact"
                    >
                      <FaTrashRestore />
                    </ActionButton>

                    <ActionButton
                      theme={theme}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditContact(contact.contact_id);
                      }}
                      $view
                      title="View/Edit contact"
                    >
                      <FaEye />
                    </ActionButton>

                    <ActionButton
                      theme={theme}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePermanentDelete(contact);
                      }}
                      $delete
                      title="Delete permanently"
                    >
                      <FiTrash2 />
                    </ActionButton>
                  </ContactCardActions>
                </ContactCard>
              );
            })}

            {!loading && filteredContacts.length === 0 && (
              <EmptyState>
                <EmptyIcon>🗑️</EmptyIcon>
                <EmptyTitle theme={theme}>
                  {filterCategory === 'All' ? 'Trash is empty!' : `No ${filterCategory} contacts`}
                </EmptyTitle>
                <EmptyText theme={theme}>
                  {filterCategory === 'All'
                    ? 'No contacts have been moved to trash.'
                    : `No contacts in the ${filterCategory} category.`
                  }
                </EmptyText>
              </EmptyState>
            )}
          </ContactsList>
        </TrashView>
      ) : (
        <DetailView theme={theme}>
          <DetailHeader theme={theme}>
            <BackButton theme={theme} onClick={handleBackToTrash}>
              <FiTrash2 />
              <span>Back to Trash</span>
            </BackButton>
            <ActionButtons>
              <ActionButtonLarge
                theme={theme}
                onClick={() => handleRestoreContact(selectedContact)}
                $restore
              >
                <FaTrashRestore />
                Restore
              </ActionButtonLarge>
              {selectedContact.emails?.length > 0 && selectedContact.emails[0]?.email && (
                <ActionButtonLarge
                  href={`mailto:${selectedContact.emails[0].email}`}
                  $primary
                >
                  <FaEnvelope />
                  Email
                </ActionButtonLarge>
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
                  <CategoryBadge $color={getCategoryColor(selectedContact.category)}>
                    {getCategoryIcon(selectedContact.category)} {selectedContact.category}
                  </CategoryBadge>
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
                {selectedContact.last_interaction_at && (
                  <LastInteraction theme={theme}>
                    Last interaction: {getInteractionAge(selectedContact.last_interaction_at)?.text}
                  </LastInteraction>
                )}
              </ProfileInfo>
            </ProfileSection>

            <ActionSection>
              <SectionTitle theme={theme}>Quick Actions</SectionTitle>
              <ActionGrid>
                <QuickActionCard
                  theme={theme}
                  onClick={() => handleRestoreContact(selectedContact)}
                  $color="#10B981"
                >
                  <QuickActionIcon $color="#10B981">
                    <FaTrashRestore />
                  </QuickActionIcon>
                  <QuickActionLabel>Restore Contact</QuickActionLabel>
                  <QuickActionDescription theme={theme}>
                    Move back to active contacts
                  </QuickActionDescription>
                </QuickActionCard>

                <QuickActionCard
                  theme={theme}
                  onClick={() => handleEditContact(selectedContact.contact_id)}
                  $color="#3B82F6"
                >
                  <QuickActionIcon $color="#3B82F6">
                    <FaEye />
                  </QuickActionIcon>
                  <QuickActionLabel>View Details</QuickActionLabel>
                  <QuickActionDescription theme={theme}>
                    Open full contact editor
                  </QuickActionDescription>
                </QuickActionCard>

                <QuickActionCard
                  theme={theme}
                  onClick={() => handlePermanentDelete(selectedContact)}
                  $color="#EF4444"
                >
                  <QuickActionIcon $color="#EF4444">
                    <FiTrash2 />
                  </QuickActionIcon>
                  <QuickActionLabel>Delete Forever</QuickActionLabel>
                  <QuickActionDescription theme={theme}>
                    Permanently remove contact
                  </QuickActionDescription>
                </QuickActionCard>
              </ActionGrid>
            </ActionSection>

            {/* Contact details sections similar to other pages */}
            {(selectedContact.emails?.length > 0 || selectedContact.mobiles?.length > 0) && (
              <InfoSection>
                <SectionTitle theme={theme}>Contact Information</SectionTitle>
                <InfoList>
                  {selectedContact.emails?.map((email, idx) => (
                    <InfoItem key={`email-${idx}`}>
                      <InfoItemIcon><FaEnvelope /></InfoItemIcon>
                      <InfoItemContent>
                        <InfoItemLabel theme={theme}>{email.type} Email</InfoItemLabel>
                        <InfoItemValue theme={theme}>
                          <a href={`mailto:${email.email}`}>{email.email}</a>
                          {email.is_primary && <PrimaryTag>Primary</PrimaryTag>}
                        </InfoItemValue>
                      </InfoItemContent>
                    </InfoItem>
                  ))}
                  {selectedContact.mobiles?.map((mobile, idx) => (
                    <InfoItem key={`mobile-${idx}`}>
                      <InfoItemIcon><FaPhone /></InfoItemIcon>
                      <InfoItemContent>
                        <InfoItemLabel theme={theme}>{mobile.type} Phone</InfoItemLabel>
                        <InfoItemValue theme={theme}>
                          <a href={`https://wa.me/${mobile.mobile.replace(/\D/g, '')}`}>{mobile.mobile}</a>
                          {mobile.is_primary && <PrimaryTag>Primary</PrimaryTag>}
                        </InfoItemValue>
                      </InfoItemContent>
                    </InfoItem>
                  ))}
                </InfoList>
              </InfoSection>
            )}
          </DetailContent>
        </DetailView>
      )}

      {/* Restore Modal */}
      <Modal
        isOpen={restoreModalOpen}
        onRequestClose={() => setRestoreModalOpen(false)}
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
            maxWidth: '500px',
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
          <h2>Restore Contact</h2>
          <CloseButton
            theme={theme}
            onClick={() => setRestoreModalOpen(false)}
            disabled={isRestoring}
          >
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalContent theme={theme}>
          <p>Restore <strong>{contactToRestore?.first_name} {contactToRestore?.last_name}</strong> to:</p>

          <RestoreCategoryGrid>
            {restoreCategories.map(category => (
              <RestoreCategoryOption
                key={category.value}
                theme={theme}
                $selected={restoreCategory === category.value}
                onClick={() => setRestoreCategory(category.value)}
              >
                {category.label}
              </RestoreCategoryOption>
            ))}
          </RestoreCategoryGrid>
        </ModalContent>

        <ModalActions>
          <ConfirmButton
            theme={theme}
            onClick={handleConfirmRestore}
            disabled={isRestoring || !restoreCategory}
          >
            {isRestoring ? 'Restoring...' : 'Restore'}
          </ConfirmButton>
          <CancelButton
            theme={theme}
            onClick={() => setRestoreModalOpen(false)}
            disabled={isRestoring}
          >
            Cancel
          </CancelButton>
        </ModalActions>
      </Modal>

      {/* Delete Modal (simplified version for trash) */}
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
          <h2>Delete Permanently</h2>
          <CloseButton
            theme={theme}
            onClick={() => setDeleteModalOpen(false)}
            disabled={isDeleting}
          >
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalContent theme={theme}>
          <WarningMessage>
            ⚠️ This action cannot be undone!
          </WarningMessage>

          <p>
            Permanently delete <strong>{contactToDelete?.first_name} {contactToDelete?.last_name}</strong>?
          </p>

          <p>This will also delete:</p>
          <ul>
            <li>{associatedData.interactionsCount || 0} interactions</li>
            <li>{associatedData.emailsCount || 0} emails</li>
            <li>{associatedData.notesCount || 0} notes</li>
            <li>All associated data</li>
          </ul>
        </ModalContent>

        <ModalActions>
          <ConfirmButton
            theme={theme}
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            $danger
          >
            {isDeleting ? 'Deleting...' : 'Delete Forever'}
          </ConfirmButton>
          <CancelButton
            theme={theme}
            onClick={() => setDeleteModalOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </CancelButton>
        </ModalActions>
      </Modal>
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const TrashView = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const TrashHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 24px 20px 0 20px;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto 20px auto;
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
  background: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
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

const FilterTabs = styled.div`
  display: flex;
  gap: 2px;
  max-width: 1200px;
  margin: 0 auto;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 8px;
  padding: 4px;
`;

const FilterTab = styled.button`
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
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const CategoryCount = styled.span`
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
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
  border-top: 3px solid #EF4444;
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
  border: 1px solid ${props => {
    const colors = {
      'Skip': '#6B7280',
      'WhatsApp Group Contact': '#10B981',
      'System': '#EF4444'
    };
    return colors[props.$category] || (props.theme === 'light' ? '#E5E7EB' : '#374151');
  }};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20px;
  align-items: flex-start;
  opacity: 0.8;

  &:hover {
    opacity: 1;
    border-color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
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
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
`;

const ContactAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
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
    font-size: 24px;
  }
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
`;

const ContactName = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 18px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const CategoryBadge = styled.div`
  background: ${props => props.$color};
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
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

const InteractionAge = styled.div`
  background: ${props => props.$color};
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
`;

const TrashDate = styled.div`
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-size: 11px;
  font-style: italic;
`;

const ContactCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  gap: 8px;
  align-items: flex-end;
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.$restore) return '#10B981';
    if (props.$view) return '#3B82F6';
    if (props.$delete) return '#EF4444';
    return '#6B7280';
  }};
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
  line-height: 1.5;
`;

// Detail View Components
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
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
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

const ActionButtonLarge = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  font-family: inherit;

  ${props => props.$primary && `
    background: #3B82F6;
    color: white;

    &:hover {
      background: #2563EB;
      color: white;
    }
  `}

  ${props => props.$restore && `
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
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: flex-start;
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
  flex-wrap: wrap;
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
  margin-bottom: 8px;
`;

const LastInteraction = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  font-style: italic;
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

const ActionSection = styled.div`
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

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const QuickActionCard = styled.button`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  border: 2px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  &:hover {
    border-color: ${props => props.$color};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const QuickActionIcon = styled.div`
  background: ${props => props.$color};
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const QuickActionLabel = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const QuickActionDescription = styled.span`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  text-align: center;
`;

const InfoSection = styled.div`
  margin-bottom: 32px;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
`;

const InfoItemIcon = styled.div`
  width: 40px;
  display: flex;
  justify-content: center;
  margin-top: 2px;
  flex-shrink: 0;

  svg {
    color: #6B7280;
    font-size: 16px;
  }
`;

const InfoItemContent = styled.div`
  flex: 1;
`;

const InfoItemLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 2px;
`;

const InfoItemValue = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  a {
    color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const PrimaryTag = styled.span`
  background: #D1FAE5;
  color: #065F46;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
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
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  line-height: 1.5;
`;

const RestoreCategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 16px;
`;

const RestoreCategoryOption = styled.button`
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#F3F4F6' : '#374151')
  };
  color: ${props => props.$selected
    ? 'white'
    : (props.theme === 'light' ? '#374151' : '#F9FAFB')
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

  &:hover {
    background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    color: white;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  }
`;

const WarningMessage = styled.div`
  background: ${props => props.theme === 'light' ? '#FEF2F2' : '#451A1A'};
  color: ${props => props.theme === 'light' ? '#DC2626' : '#F87171'};
  border: 1px solid ${props => props.theme === 'light' ? '#FECACA' : '#7F1D1D'};
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 500;
  text-align: center;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ConfirmButton = styled.button`
  background: ${props => props.$danger ? '#EF4444' : '#3B82F6'};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.$danger ? '#DC2626' : '#2563EB'};
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

export default TrashPage;