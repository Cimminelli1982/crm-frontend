import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaArrowLeft, FaClock, FaComments, FaEdit, FaSearch, FaSync, FaStickyNote } from 'react-icons/fa';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';
import Modal from 'react-modal';

const StandaloneInteractions = () => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Delete modal state (copied from ContactsInbox.js)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [associatedData, setAssociatedData] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      // Get contacts with last_interaction data
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
        .order('last_interaction_at', { ascending: false, nullsFirst: false })
        .limit(50);

      if (error) throw error;

      // Filter and process contacts with last interaction data (client-side filtering)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filteredContacts = data.filter(contact => {
        if (!contact.last_interaction_at) return false;

        // Filter out contacts with category "Skip"
        if (contact.category === 'Skip') return false;

        // Filter out contacts with category "WhatsApp Group Contact"
        if (contact.category === 'WhatsApp Group Contact') return false;

        // Filter out contacts with category "System"
        if (contact.category === 'System') return false;

        const lastInteractionDate = new Date(contact.last_interaction_at);
        return lastInteractionDate >= thirtyDaysAgo;
      });

      // Process contacts with last interaction data
      const processedInteractions = filteredContacts.slice(0, 30).map(contact => ({
        id: `contact_${contact.contact_id}_${contact.last_interaction_at}`,
        contact_id: contact.contact_id,
        created_at: contact.last_interaction_at,
        type: 'interaction', // Generic type since we don't have specific interaction type
        notes: null, // No specific notes from interaction records
        contact: {
          ...contact,
          emails: contact.contact_emails || [],
          mobiles: contact.contact_mobiles || [],
          companies: contact.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
          tags: contact.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
          cities: contact.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
        }
      }));

      setInteractions(processedInteractions);
    } catch (error) {
      console.error('Error fetching contacts with recent interactions:', error);
      toast.error('Failed to load recent interactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchInteractions();
      console.log('Auto-refreshing interactions data...');
    }, 60000); // 60 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
  };

  const handleBackToInteractions = () => {
    setSelectedContact(null);
  };

  const handleEditContact = (contactId) => {
    const url = `/contacts/workflow/${contactId}?step=2`;
    const newTab = window.open(url, '_blank');

    // Try to make the new tab fullscreen (requires user interaction)
    if (newTab) {
      newTab.focus();
      // Note: Fullscreen API requires user interaction and may be blocked by browsers
      setTimeout(() => {
        if (newTab.document && newTab.document.documentElement && newTab.document.documentElement.requestFullscreen) {
          newTab.document.documentElement.requestFullscreen().catch(() => {
            // Fallback: maximize window if fullscreen fails
            newTab.moveTo(0, 0);
            newTab.resizeTo(window.screen.availWidth, window.screen.availHeight);
          });
        } else {
          // Fallback: maximize window
          newTab.moveTo(0, 0);
          newTab.resizeTo(window.screen.availWidth, window.screen.availHeight);
        }
      }, 100);
    }
  };

  // Handle Obsidian note opening/creation
  const handleOpenObsidianNote = (contact) => {
    const vaultName = "Living with Intention";
    const fileName = `${contact.first_name} ${contact.last_name}`;

    // Use Obsidian's native workspace:new-file command for safe file creation
    const obsidianUrl = `obsidian://advanced-uri?vault=${encodeURIComponent(vaultName)}&commandid=workspace%253Anew-file&filename=${encodeURIComponent(fileName + '.md')}`;

    window.open(obsidianUrl, '_self');

    toast.success(`Opening note for ${fileName}`, {
      duration: 2000,
      icon: '📝'
    });
  };

  // Open the powerful delete modal (copied from ContactsInbox.js)
  const handleOpenDeleteModal = async (contactData) => {
    setContactToDelete(contactData);

    try {
      // Get counts of associated records and last interaction details
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
        // Get chat count
        supabase
          .from('chat')
          .select('id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get contact_chats count
        supabase
          .from('contact_chats')
          .select('id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get interactions count
        supabase
          .from('interactions')
          .select('interaction_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get emails count (where contact is sender)
        supabase
          .from('emails')
          .select('email_id', { count: 'exact', head: true })
          .eq('sender_contact_id', contactData.contact_id),

        // Get email_participants count
        supabase
          .from('email_participants')
          .select('participant_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get contact_email_threads count
        supabase
          .from('contact_email_threads')
          .select('email_thread_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get tags count
        supabase
          .from('contact_tags')
          .select('entry_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get cities count
        supabase
          .from('contact_cities')
          .select('entry_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get companies count
        supabase
          .from('contact_companies')
          .select('contact_companies_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get notes count
        supabase
          .from('contact_notes')
          .select('note_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get attachments count
        supabase
          .from('contact_attachments')
          .select('attachment_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get contact emails count
        supabase
          .from('contact_emails')
          .select('contact_email_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get contact mobiles count
        supabase
          .from('contact_mobiles')
          .select('contact_mobile_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get deals count
        supabase
          .from('deals')
          .select('deal_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get meetings count
        supabase
          .from('meetings')
          .select('meeting_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get investments count
        supabase
          .from('investments')
          .select('investment_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get keep in touch count
        supabase
          .from('keep_in_touch')
          .select('kit_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get last interaction details
        supabase
          .from('interactions')
          .select('type, notes, created_at')
          .eq('contact_id', contactData.contact_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      // Format last interaction
      let lastInteraction = null;
      if (lastInteractionResult.data) {
        const interaction = lastInteractionResult.data;
        const date = new Date(interaction.created_at).toLocaleDateString();
        lastInteraction = {
          summary: `${interaction.type} - ${interaction.notes || 'No notes'} (${date})`
        };
      }

      // Set associated data
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

      // Initialize selected items (all checked by default)
      setSelectedItems({
        deleteInteractions: data.interactionsCount > 0,
        deleteEmails: data.emailsCount > 0,
        deleteEmailParticipants: data.emailParticipantsCount > 0,
        deleteEmailThreads: data.emailThreadsCount > 0,
        deleteTags: data.tagsCount > 0,
        deleteCities: data.citiesCount > 0,
        deleteCompanies: data.companiesCount > 0,
        deleteNotes: data.notesCount > 0,
        deleteAttachments: data.attachmentsCount > 0,
        deleteContactEmails: data.contactEmailsCount > 0,
        deleteContactMobiles: data.contactMobilesCount > 0,
        deleteDeals: data.dealsCount > 0,
        deleteMeetings: data.meetingsCount > 0,
        deleteInvestments: data.investmentsCount > 0,
        deleteKit: data.kitCount > 0,
        deleteChat: data.chatCount > 0,
        deleteContactChats: data.contactChatsCount > 0
      });

      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error fetching associated data:', error);
      toast.error('Failed to load contact details');
    }
  };

  // Handle spam button click
  const handleSpamContact = (contactData) => {
    handleOpenDeleteModal(contactData);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedItems(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Execute the powerful delete operation
  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    setIsDeleting(true);
    try {
      const contactId = contactToDelete.contact_id;

      // Delete selected associated records first
      const deletePromises = [];

      if (selectedItems.deleteInteractions && associatedData.interactionsCount > 0) {
        deletePromises.push(supabase.from('interactions').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteEmails && associatedData.emailsCount > 0) {
        deletePromises.push(supabase.from('emails').delete().eq('sender_contact_id', contactId));
      }

      if (selectedItems.deleteEmailParticipants && associatedData.emailParticipantsCount > 0) {
        deletePromises.push(supabase.from('email_participants').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteEmailThreads && associatedData.emailThreadsCount > 0) {
        deletePromises.push(supabase.from('contact_email_threads').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteTags && associatedData.tagsCount > 0) {
        deletePromises.push(supabase.from('contact_tags').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteCities && associatedData.citiesCount > 0) {
        deletePromises.push(supabase.from('contact_cities').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteCompanies && associatedData.companiesCount > 0) {
        deletePromises.push(supabase.from('contact_companies').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteNotes && associatedData.notesCount > 0) {
        deletePromises.push(supabase.from('contact_notes').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteAttachments && associatedData.attachmentsCount > 0) {
        deletePromises.push(supabase.from('contact_attachments').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteContactEmails && associatedData.contactEmailsCount > 0) {
        deletePromises.push(supabase.from('contact_emails').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteContactMobiles && associatedData.contactMobilesCount > 0) {
        deletePromises.push(supabase.from('contact_mobiles').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteDeals && associatedData.dealsCount > 0) {
        deletePromises.push(supabase.from('deals').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteMeetings && associatedData.meetingsCount > 0) {
        deletePromises.push(supabase.from('meetings').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteInvestments && associatedData.investmentsCount > 0) {
        deletePromises.push(supabase.from('investments').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteKit && associatedData.kitCount > 0) {
        deletePromises.push(supabase.from('keep_in_touch').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteChat && associatedData.chatCount > 0) {
        deletePromises.push(supabase.from('chat').delete().eq('contact_id', contactId));
      }

      if (selectedItems.deleteContactChats && associatedData.contactChatsCount > 0) {
        deletePromises.push(supabase.from('contact_chats').delete().eq('contact_id', contactId));
      }

      // Execute all deletions for related records
      if (deletePromises.length > 0) {
        const results = await Promise.allSettled(deletePromises);
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`Failed to delete related records:`, result.reason);
          }
        });
      }

      // Finally delete the main contact record
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactId);

      if (error) throw error;

      toast.success('Contact and selected associated records deleted successfully');

      // Remove the contact from the interactions list
      setInteractions(prev => prev.filter(interaction => interaction.contact_id !== contactId));

      // If this was the selected contact, go back to the list
      if (selectedContact && selectedContact.contact_id === contactId) {
        setSelectedContact(null);
      }

      setDeleteModalOpen(false);
      setContactToDelete(null);
      setAssociatedData({});
      setSelectedItems({});

    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchInteractions();
    console.log('Manual refresh triggered...');

    // Stop the refresh animation after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const formatInteractionDate = (dateString) => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInteractionTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'email':
        return <FaEnvelope />;
      case 'call':
      case 'phone':
        return <FaPhone />;
      case 'meeting':
        return <FaComments />;
      default:
        return <FaComments />;
    }
  };

  return (
    <FullScreenContainer>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#000',
              color: '#00ff00',
              border: '1px solid #00ff00',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#000',
              color: '#ff0000',
              border: '1px solid #ff0000',
            },
          },
        }}
      />

      {!selectedContact ? (
        <InteractionsView>
          <InteractionsHeader>
            <HeaderContent>
              <HeaderText>
                <AppTitle>Recent Interactions</AppTitle>
                <AppSubtitle>Last 30 days of contact interactions</AppSubtitle>
              </HeaderText>
              <HeaderButtons>
                <HeaderButton
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  title="Refresh interactions (Auto-refreshes every 60s)"
                  $isRefreshing={isRefreshing}
                >
                  <FaSync />
                </HeaderButton>
                <SearchIconButton
                  onClick={() => window.location.href = 'https://crm-editor-frontend.netlify.app/search'}
                  title="Switch to Search"
                >
                  <FaSearch />
                </SearchIconButton>
              </HeaderButtons>
            </HeaderContent>
          </InteractionsHeader>

          {loading && (
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText>Loading interactions...</LoadingText>
            </LoadingContainer>
          )}

          <ResultsContainer>

            {interactions.map(interaction => (
              <InteractionCard key={interaction.id}>
                <InteractionCardContent onClick={() => handleContactSelect(interaction.contact)}>
                  <InteractionCardHeader>
                    <ContactAvatar>
                      {interaction.contact?.profile_image_url ? (
                        <img src={interaction.contact.profile_image_url} alt="Profile" />
                      ) : (
                        <FaUser />
                      )}
                    </ContactAvatar>
                    <InteractionInfo>
                      <ContactName>
                        {interaction.contact?.first_name} {interaction.contact?.last_name}
                        {interaction.contact?.category && <CategoryBadge category={interaction.contact.category}>{interaction.contact.category}</CategoryBadge>}
                      </ContactName>
                      {interaction.contact?.job_role && <ContactRole>{interaction.contact.job_role}</ContactRole>}
                      {interaction.contact?.companies[0] && (
                        <ContactCompany>
                          <FaBuilding style={{ marginRight: '6px' }} />
                          {interaction.contact.companies[0].name}
                        </ContactCompany>
                      )}
                    </InteractionInfo>
                    <InteractionMeta>
                      <InteractionType>
                        <FaComments />
                        <span>Last Contact</span>
                      </InteractionType>
                      <InteractionDate>
                        <FaClock />
                        <span>{formatInteractionDate(interaction.created_at)}</span>
                      </InteractionDate>
                    </InteractionMeta>
                  </InteractionCardHeader>

                </InteractionCardContent>

                <InteractionCardActions>
                  <CardActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditContact(interaction.contact.contact_id);
                    }}
                    $edit
                  >
                    <FaEdit />
                  </CardActionButton>
                  <CardActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpamContact(interaction.contact);
                    }}
                    $spam
                  >
                    <FiAlertTriangle />
                  </CardActionButton>
                </InteractionCardActions>
              </InteractionCard>
            ))}

            {!loading && interactions.length === 0 && (
              <NoResultsContainer>
                <NoResultsIcon>📅</NoResultsIcon>
                <NoResultsTitle>No recent interactions</NoResultsTitle>
                <NoResultsText>No interactions found in the last 30 days</NoResultsText>
              </NoResultsContainer>
            )}
          </ResultsContainer>
        </InteractionsView>
      ) : (
        <DetailView>
          <DetailHeader>
            <BackButton onClick={handleBackToInteractions}>
              <FaArrowLeft />
              <span>Back to Interactions</span>
            </BackButton>
            <ActionButtons>
              <ActionButton
                as="button"
                onClick={() => handleEditContact(selectedContact.contact_id)}
                $edit
              >
                <FaEdit />
                Edit
              </ActionButton>
              <ActionButton
                as="button"
                onClick={() => handleSpamContact(selectedContact)}
                $delete
              >
                <FiAlertTriangle />
                Spam
              </ActionButton>
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
                  <ProfileName>
                    {selectedContact.first_name} {selectedContact.last_name}
                  </ProfileName>
                  <ObsidianNoteButton
                    onClick={() => handleOpenObsidianNote(selectedContact)}
                    title={`Open Obsidian note for ${selectedContact.first_name} ${selectedContact.last_name}`}
                  >
                    <FaStickyNote />
                  </ObsidianNoteButton>
                </ProfileHeader>
                {selectedContact.job_role && (
                  <ProfileRole>{selectedContact.job_role}</ProfileRole>
                )}
                {selectedContact.score && (
                  <ScoreBadge>Score: {selectedContact.score}</ScoreBadge>
                )}
              </ProfileInfo>
            </ProfileSection>

            <InfoGrid>
              {(selectedContact.emails?.length > 0 || selectedContact.mobiles?.length > 0) && (
                <InfoSection>
                  <SectionTitle>Contact Information</SectionTitle>
                  <InfoList>
                    {selectedContact.emails?.map((email, idx) => (
                      <InfoItem key={`email-${idx}`}>
                        <InfoItemIcon><FaEnvelope /></InfoItemIcon>
                        <InfoItemContent>
                          <InfoItemLabel>{email.type} Email</InfoItemLabel>
                          <InfoItemValue>
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
                          <InfoItemLabel>{mobile.type} Phone</InfoItemLabel>
                          <InfoItemValue>
                            <a href={`https://wa.me/${mobile.mobile.replace(/\D/g, '')}`}>{mobile.mobile}</a>
                            {mobile.is_primary && <PrimaryTag>Primary</PrimaryTag>}
                          </InfoItemValue>
                        </InfoItemContent>
                      </InfoItem>
                    ))}
                  </InfoList>
                </InfoSection>
              )}

              {selectedContact.companies?.length > 0 && (
                <InfoSection>
                  <SectionTitle>Company Information</SectionTitle>
                  <InfoList>
                    {selectedContact.companies.map((company, idx) => (
                      <InfoItem key={`company-${idx}`}>
                        <InfoItemIcon><FaBuilding /></InfoItemIcon>
                        <InfoItemContent>
                          <InfoItemLabel>Company</InfoItemLabel>
                          <InfoItemValue>{company.name}</InfoItemValue>
                          {company.website && (
                            <InfoItemSubValue>
                              <a href={company.website} target="_blank" rel="noopener noreferrer">
                                {company.website}
                              </a>
                            </InfoItemSubValue>
                          )}
                        </InfoItemContent>
                      </InfoItem>
                    ))}
                  </InfoList>
                </InfoSection>
              )}

              {selectedContact.cities?.length > 0 && (
                <InfoSection>
                  <SectionTitle>Location</SectionTitle>
                  <InfoList>
                    {selectedContact.cities.map((city, idx) => (
                      <InfoItem key={`city-${idx}`}>
                        <InfoItemIcon><FaMapMarkerAlt /></InfoItemIcon>
                        <InfoItemContent>
                          <InfoItemLabel>Location</InfoItemLabel>
                          <InfoItemValue>{city.name}, {city.country}</InfoItemValue>
                        </InfoItemContent>
                      </InfoItem>
                    ))}
                  </InfoList>
                </InfoSection>
              )}

              {selectedContact.tags?.length > 0 && (
                <InfoSection>
                  <SectionTitle>Tags</SectionTitle>
                  <TagList>
                    {selectedContact.tags.map((tag, idx) => (
                      <Tag key={idx}>{tag}</Tag>
                    ))}
                  </TagList>
                </InfoSection>
              )}

              {selectedContact.description && (
                <InfoSection>
                  <SectionTitle>Notes</SectionTitle>
                  <NotesText>{selectedContact.description}</NotesText>
                </InfoSection>
              )}

              {selectedContact.linkedin && (
                <InfoSection>
                  <SectionTitle>Social Media</SectionTitle>
                  <InfoList>
                    <InfoItem>
                      <InfoItemContent>
                        <InfoItemLabel>LinkedIn Profile</InfoItemLabel>
                        <InfoItemValue>
                          <a href={selectedContact.linkedin} target="_blank" rel="noopener noreferrer">
                            View LinkedIn Profile
                          </a>
                        </InfoItemValue>
                      </InfoItemContent>
                    </InfoItem>
                  </InfoList>
                </InfoSection>
              )}
            </InfoGrid>
          </DetailContent>
        </DetailView>
      )}

      {/* Powerful Delete Modal (copied from ContactsInbox.js) */}
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
        }}
      >
        <ModalHeader>
          <h2>Delete Contact and Associated Data</h2>
          <CloseButton onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        {contactToDelete && (
          <>
            <ModalContactDetail>
              <DetailItem>
                <DetailValue>
                  {contactToDelete.first_name} {contactToDelete.last_name}
                  {contactToDelete.emails?.[0]?.email ? ` (${contactToDelete.emails[0].email})` :
                   contactToDelete.mobiles?.[0]?.mobile ? ` (${contactToDelete.mobiles[0].mobile})` : ''}
                </DetailValue>
              </DetailItem>
            </ModalContactDetail>

            <DetailItem style={{ marginTop: '15px', marginBottom: '15px' }}>
              <DetailLabel>Last Interaction:</DetailLabel>
              <DetailValue>
                {associatedData.lastInteraction ?
                  associatedData.lastInteraction.summary :
                  'None'}
              </DetailValue>
            </DetailItem>

            <ModalContent>
              Select which items to delete:
            </ModalContent>

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

                {associatedData.emailParticipantsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteEmailParticipants"
                      name="deleteEmailParticipants"
                      checked={selectedItems.deleteEmailParticipants}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteEmailParticipants">Email Participants ({associatedData.emailParticipantsCount})</label>
                  </CheckboxItem>
                )}

                {associatedData.emailThreadsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteEmailThreads"
                      name="deleteEmailThreads"
                      checked={selectedItems.deleteEmailThreads}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteEmailThreads">Email Threads ({associatedData.emailThreadsCount})</label>
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

                {associatedData.citiesCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteCities"
                      name="deleteCities"
                      checked={selectedItems.deleteCities}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteCities">Cities ({associatedData.citiesCount})</label>
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

                {associatedData.attachmentsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteAttachments"
                      name="deleteAttachments"
                      checked={selectedItems.deleteAttachments}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteAttachments">Attachments ({associatedData.attachmentsCount})</label>
                  </CheckboxItem>
                )}

                {associatedData.contactEmailsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteContactEmails"
                      name="deleteContactEmails"
                      checked={selectedItems.deleteContactEmails}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteContactEmails">Contact Emails ({associatedData.contactEmailsCount})</label>
                  </CheckboxItem>
                )}

                {associatedData.contactMobilesCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteContactMobiles"
                      name="deleteContactMobiles"
                      checked={selectedItems.deleteContactMobiles}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteContactMobiles">Contact Mobiles ({associatedData.contactMobilesCount})</label>
                  </CheckboxItem>
                )}

                {associatedData.dealsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteDeals"
                      name="deleteDeals"
                      checked={selectedItems.deleteDeals}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteDeals">Deals ({associatedData.dealsCount})</label>
                  </CheckboxItem>
                )}

                {associatedData.meetingsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteMeetings"
                      name="deleteMeetings"
                      checked={selectedItems.deleteMeetings}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteMeetings">Meetings ({associatedData.meetingsCount})</label>
                  </CheckboxItem>
                )}

                {associatedData.investmentsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteInvestments"
                      name="deleteInvestments"
                      checked={selectedItems.deleteInvestments}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteInvestments">Investments ({associatedData.investmentsCount})</label>
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
                    <label htmlFor="deleteKit">Keep in Touch ({associatedData.kitCount})</label>
                  </CheckboxItem>
                )}

                {associatedData.chatCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteChat"
                      name="deleteChat"
                      checked={selectedItems.deleteChat}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteChat">Chat ({associatedData.chatCount})</label>
                  </CheckboxItem>
                )}

                {associatedData.contactChatsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteContactChats"
                      name="deleteContactChats"
                      checked={selectedItems.deleteContactChats}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteContactChats">Contact Chats ({associatedData.contactChatsCount})</label>
                  </CheckboxItem>
                )}
              </CheckboxGroup>
            </CheckboxContainer>

            <ModalActions>
              <DeleteButton
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Selected Items'}
              </DeleteButton>
              <CancelButton
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </CancelButton>
            </ModalActions>
          </>
        )}
      </Modal>
    </FullScreenContainer>
  );
};

// Styled Components (reusing from StandaloneContactSearch with specific modifications)
const FullScreenContainer = styled.div`
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
`;

const InteractionsView = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 0;

  @media (min-width: 768px) {
    margin: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    min-height: calc(100vh - 40px);
  }
`;

const InteractionsHeader = styled.div`
  background: white;
  padding: 24px 20px 20px 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 800px;
  margin: 0 auto;
`;

const HeaderText = styled.div`
  text-align: center;
  flex: 1;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const HeaderButton = styled.button`
  background: none;
  border: 2px solid #10b981;
  color: #10b981;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 18px;
  flex-shrink: 0;

  &:hover {
    background: #10b981;
    color: white;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  ${props => props.$isRefreshing && `
    svg {
      animation: spin 1s linear infinite;
    }
  `}

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 16px;
  }
`;

const SearchIconButton = styled.button`
  background: none;
  border: 2px solid #3b82f6;
  color: #3b82f6;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 20px;
  flex-shrink: 0;

  &:hover {
    background: #3b82f6;
    color: white;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
`;

const AppTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;

  @media (min-width: 768px) {
    font-size: 32px;
  }
`;

const AppSubtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 16px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.span`
  color: #6b7280;
  font-size: 14px;
`;

const ResultsHeader = styled.div`
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  padding: 0 20px 16px 20px;
`;

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  -webkit-overflow-scrolling: touch;
`;

const InteractionCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: stretch;

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const InteractionCardContent = styled.div`
  flex: 1;
  padding: 16px;
  cursor: pointer;
  min-width: 0;
`;

const InteractionCardActions = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
  border-left: 1px solid #e5e7eb;
  min-width: 60px;
  justify-content: center;
  align-items: center;
`;

const InteractionCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
`;

const ContactAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid #e5e7eb;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: #9ca3af;
    font-size: 20px;
  }
`;

const InteractionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
  line-height: 1.4;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CategoryBadge = styled.span`
  background: ${props =>
    props.category === 'Inbox' || props.category === 'Not Set'
      ? '#fee2e2'
      : '#f3f4f6'
  };
  color: ${props =>
    props.category === 'Inbox' || props.category === 'Not Set'
      ? '#dc2626'
      : '#374151'
  };
  border: 1px solid ${props =>
    props.category === 'Inbox' || props.category === 'Not Set'
      ? '#fecaca'
      : '#d1d5db'
  };
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
`;

const ContactRole = styled.div`
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 4px;
`;

const ContactCompany = styled.div`
  color: #6b7280;
  font-size: 14px;
  display: flex;
  align-items: center;

  svg {
    font-size: 12px;
  }
`;

const InteractionMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
`;

const InteractionType = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #3b82f6;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;

  svg {
    font-size: 12px;
  }
`;

const InteractionDate = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  font-size: 12px;

  svg {
    font-size: 10px;
  }
`;

const InteractionNotes = styled.div`
  color: #374151;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #e5e7eb;
`;

const InteractionCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ContactDetail = styled.div`
  color: #6b7280;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    font-size: 12px;
    flex-shrink: 0;
    color: #9ca3af;
  }

  span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const NoResultsContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
`;

const NoResultsIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const NoResultsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
`;

const NoResultsText = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
`;

// Detail view components (reused from StandaloneContactSearch)
const DetailView = styled.div`
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 0;

  @media (min-width: 768px) {
    margin: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    height: calc(100% - 40px);
  }
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
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
  border: none;
  cursor: pointer;
  font-family: inherit;

  ${props => props.$primary && `
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
      color: white;
    }
  `}

  ${props => props.$secondary && `
    background: #10b981;
    color: white;

    &:hover {
      background: #059669;
      color: white;
    }
  `}

  ${props => props.$edit && `
    background: #f59e0b;
    color: white;

    &:hover {
      background: #d97706;
      color: white;
    }
  `}

  ${props => props.$delete && `
    background: #ef4444;
    color: white;

    &:hover {
      background: #dc2626;
      color: white;
    }
  `}
`;

const CardActionButton = styled.button`
  background: none;
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

  ${props => props.$edit && `
    color: #f59e0b;
    &:hover {
      background: #fef3c7;
      color: #d97706;
    }
  `}

  ${props => props.$delete && `
    color: #ef4444;
    &:hover {
      background: #fee2e2;
      color: #dc2626;
    }
  `}

  ${props => props.$spam && `
    color: #f59e0b;
    &:hover {
      background: #fef3c7;
      color: #d97706;
    }
  `}

  &:active {
    transform: scale(0.95);
  }
`;

const DetailContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  -webkit-overflow-scrolling: touch;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ProfileAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  border: 3px solid #e5e7eb;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: #9ca3af;
    font-size: 32px;
  }

  @media (min-width: 768px) {
    width: 100px;
    height: 100px;

    svg {
      font-size: 40px;
    }
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

const ObsidianNoteButton = styled.button`
  background: #8b5cf6;
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
    background: #7c3aed;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ProfileName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 28px;
  }
`;

const ProfileRole = styled.div`
  color: #6b7280;
  font-size: 16px;
  margin-bottom: 8px;
`;

const ScoreBadge = styled.div`
  background: #dbeafe;
  color: #1d4ed8;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InfoSection = styled.div``;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
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
    color: #6b7280;
    font-size: 16px;
  }
`;

const InfoItemContent = styled.div`
  flex: 1;
`;

const InfoItemLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 2px;
`;

const InfoItemValue = styled.div`
  color: #1f2937;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  a {
    color: #3b82f6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const InfoItemSubValue = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;

  a {
    color: #6b7280;
  }
`;

const PrimaryTag = styled.span`
  background: #d1fae5;
  color: #065f46;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
`;

const NotesText = styled.div`
  color: #374151;
  line-height: 1.6;
  font-size: 16px;
`;

// Modal styled components (copied from ContactsInbox.js)
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;

  h2 {
    color: #e0e0e0;
    margin: 0;
    font-size: 1.2em;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
  border-radius: 3px;

  &:hover {
    background: #333;
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ModalContactDetail = styled.div`
  margin-bottom: 15px;
`;

const DetailItem = styled.div`
  margin-bottom: 8px;
`;

const DetailLabel = styled.span`
  color: #999;
  font-weight: 500;
  margin-right: 8px;
`;

const DetailValue = styled.span`
  color: #e0e0e0;
  font-weight: 600;
`;

const ModalContent = styled.div`
  color: #e0e0e0;
  margin-bottom: 20px;
  font-weight: 500;
`;

const CheckboxContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 10px;
  background: #1a1a1a;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  label {
    color: #e0e0e0;
    cursor: pointer;
    user-select: none;
    flex: 1;
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #00ff00;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #333;
`;

const DeleteButton = styled.button`
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #b91c1c;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const CancelButton = styled.button`
  background: #374151;
  color: #e0e0e0;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #4b5563;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

export default StandaloneInteractions;