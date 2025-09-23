import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaSearch, FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaArrowLeft, FaClock, FaEdit, FaStickyNote } from 'react-icons/fa';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';
import Modal from 'react-modal';

const StandaloneContactSearch = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  // Delete modal state (copied from ContactsInbox.js)
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

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return [];

    const term = searchTerm.toLowerCase();
    return contacts.filter(contact => {
      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
      const company = contact.companies?.[0]?.name?.toLowerCase() || '';
      const jobRole = contact.job_role?.toLowerCase() || '';
      const email = contact.emails?.[0]?.email?.toLowerCase() || '';
      const mobile = contact.mobiles?.[0]?.mobile?.toLowerCase() || '';

      return fullName.includes(term) ||
             company.includes(term) ||
             jobRole.includes(term) ||
             email.includes(term) ||
             mobile.includes(term);
    });
  }, [contacts, searchTerm]);

  const fetchContacts = async (search = '') => {
    if (!search.trim()) {
      setContacts([]);
      return;
    }

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
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,job_role.ilike.%${search}%`)
        .not('category', 'eq', 'Skip')
        .not('category', 'eq', 'WhatsApp Group Contact')
        .limit(50);

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
      console.error('Error fetching contacts:', error);
      toast.error('Failed to search contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchContacts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleContactSelect = (contact) => {
    // Add to search history before navigating
    const newHistory = [contact.contact_id, ...searchHistory.filter(id => id !== contact.contact_id)].slice(0, 5);
    setSearchHistory(newHistory);

    // Navigate to shared contact detail page
    navigate(`/contact/${contact.contact_id}`);
    localStorage.setItem('contactSearchHistory', JSON.stringify(newHistory));
  };

  const handleBackToSearch = () => {
    setSelectedContact(null);
  };

  // Handle edit button - opens in new tab with fullscreen (copied from StandaloneInteractions.js)
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

  // Open the spam modal (copied from ContactsInbox.js)
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
        // Skip chat tables as they don't exist (return 0)
        Promise.resolve({ count: 0 }),
        Promise.resolve({ count: 0 }),

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
          .from('notes_contacts')
          .select('note_contact_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get attachments count
        supabase
          .from('attachments')
          .select('attachment_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get contact emails count
        supabase
          .from('contact_emails')
          .select('email_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get contact mobiles count
        supabase
          .from('contact_mobiles')
          .select('mobile_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get deals count
        supabase
          .from('deals_contacts')
          .select('deals_contacts_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get meetings count
        supabase
          .from('meeting_contacts')
          .select('meeting_contact_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get investments count
        supabase
          .from('investments_contacts')
          .select('investments_contacts_id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get keep in touch count
        supabase
          .from('keep_in_touch')
          .select('id', { count: 'exact', head: true })
          .eq('contact_id', contactData.contact_id),

        // Get last interaction details
        supabase
          .from('interactions')
          .select('interaction_id, interaction_type, direction, interaction_date, summary')
          .eq('contact_id', contactData.contact_id)
          .order('interaction_date', { ascending: false })
          .limit(1)
      ]);

      // Format last interaction
      let lastInteraction = null;
      if (lastInteractionResult.data) {
        const interaction = lastInteractionResult.data;
        const date = new Date(interaction.interaction_date).toLocaleDateString();
        lastInteraction = {
          summary: `${interaction.interaction_type} - ${interaction.summary || 'No notes'} (${date})`
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
      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error fetching associated data:', error);
      toast.error('Failed to load contact details');
    }
  };

  // Handle spam button click
  const handleSpamContact = (contactData) => {
    // Prepare contact data with email and mobile fields
    const contactWithEmailMobile = {
      ...contactData,
      email: contactData.emails?.[0]?.email || null,
      mobile: contactData.mobiles?.[0]?.mobile || null
    };
    handleOpenDeleteModal(contactWithEmailMobile);
  };

  // Handle Obsidian note opening/creation
  const handleOpenObsidianNote = (contact) => {
    const vaultName = "Living with Intention"; // Your actual vault name
    const fileName = `${contact.first_name} ${contact.last_name}`;

    // Use Advanced URI without mode parameter for "open existing OR create new" behavior
    // Using filepath with .md extension - default behavior opens existing file or creates new
    // SOLUTION: Use workspace:new-file command with filename parameter
    // This should check if file exists and only create if it doesn't
    const obsidianUrl = `obsidian://advanced-uri?vault=${encodeURIComponent(vaultName)}&commandid=workspace%253Anew-file&filename=${encodeURIComponent(fileName + '.md')}`;

    // Open Obsidian URL
    window.open(obsidianUrl, '_self');

    toast.success(`Opening note for ${fileName}`, {
      duration: 2000,
      icon: '📝'
    });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedItems(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Execute the spam deletion operation (copied from ContactsInbox.js)
  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    try {
      setIsDeleting(true);

      // Add email to emails_spam table if selected and email exists
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

      // Add mobile to whatsapp_spam table if selected and mobile exists
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

      // Delete associated records based on selections
      const promises = [];

      // 1. Delete chat records if selected
      if (selectedItems.deleteChat && associatedData.chatCount > 0) {
        promises.push(
          supabase
            .from('chat')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 2. Delete interaction records if selected
      if (selectedItems.deleteInteractions && associatedData.interactionsCount > 0) {
        promises.push(
          supabase
            .from('interactions')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 3. Delete emails and associated records if selected
      if (selectedItems.deleteEmails && associatedData.emailsCount > 0) {
        // First get all email IDs
        const { data: emailsData } = await supabase
          .from('emails')
          .select('email_id')
          .eq('sender_contact_id', contactToDelete.contact_id);

        if (emailsData && emailsData.length > 0) {
          const emailIds = emailsData.map(e => e.email_id);

          // Delete email participants
          promises.push(
            supabase
              .from('email_participants')
              .delete()
              .in('email_id', emailIds)
          );

          // Delete emails
          promises.push(
            supabase
              .from('emails')
              .delete()
              .eq('sender_contact_id', contactToDelete.contact_id)
          );
        }
      }

      // 4. Delete email threads if selected
      if (selectedItems.deleteEmailThreads && associatedData.emailThreadsCount > 0) {
        promises.push(
          supabase
            .from('contact_email_threads')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 5. Delete contact emails if selected
      if (selectedItems.deleteContactEmails && associatedData.contactEmailsCount > 0) {
        promises.push(
          supabase
            .from('contact_emails')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 6. Delete contact mobiles if selected
      if (selectedItems.deleteContactMobiles && associatedData.contactMobilesCount > 0) {
        promises.push(
          supabase
            .from('contact_mobiles')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 7. Delete note relationships if selected
      if (selectedItems.deleteNotes && associatedData.notesCount > 0) {
        promises.push(
          supabase
            .from('notes_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 8. Delete attachments if selected
      if (selectedItems.deleteAttachments && associatedData.attachmentsCount > 0) {
        promises.push(
          supabase
            .from('attachments')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 9. Delete tags if selected
      if (selectedItems.deleteTags && associatedData.tagsCount > 0) {
        promises.push(
          supabase
            .from('contact_tags')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 10. Delete cities if selected
      if (selectedItems.deleteCities && associatedData.citiesCount > 0) {
        promises.push(
          supabase
            .from('contact_cities')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 11. Delete companies if selected
      if (selectedItems.deleteCompanies && associatedData.companiesCount > 0) {
        promises.push(
          supabase
            .from('contact_companies')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 12. Delete contact chats if selected
      if (selectedItems.deleteContactChats && associatedData.contactChatsCount > 0) {
        promises.push(
          supabase
            .from('contact_chats')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 13. Delete deals if selected
      if (selectedItems.deleteDeals && associatedData.dealsCount > 0) {
        promises.push(
          supabase
            .from('deals_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 14. Delete meetings if selected
      if (selectedItems.deleteMeetings && associatedData.meetingsCount > 0) {
        promises.push(
          supabase
            .from('meeting_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 15. Delete investments if selected
      if (selectedItems.deleteInvestments && associatedData.investmentsCount > 0) {
        promises.push(
          supabase
            .from('investments_contacts')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // 16. Delete keep in touch records if selected
      if (selectedItems.deleteKit && associatedData.kitCount > 0) {
        promises.push(
          supabase
            .from('keep_in_touch')
            .delete()
            .eq('contact_id', contactToDelete.contact_id)
        );
      }

      // Execute all deletions
      await Promise.all(promises);

      // Finally delete the main contact record
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactToDelete.contact_id);

      if (error) throw error;

      toast.success('Contact and selected associated records deleted successfully');

      // Remove the contact from the contacts list
      setContacts(prev => prev.filter(contact => contact.contact_id !== contactToDelete.contact_id));

      // If this was the selected contact, go back to the search
      if (selectedContact && selectedContact.contact_id === contactToDelete.contact_id) {
        setSelectedContact(null);
      }

      setDeleteModalOpen(false);
      setContactToDelete(null);
      setAssociatedData({});

      // Trigger count refresh in parent if needed
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('refreshInboxCounts'));
      }

    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('contactSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

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
        <SearchView>
          <SearchHeader>
            <HeaderContent>
              <HeaderText>
                <AppTitle>Contact Search</AppTitle>
                <AppSubtitle>Find and connect with your contacts</AppSubtitle>
              </HeaderText>
              <InteractionsIconButton
                onClick={() => window.location.href = 'https://crm-editor-frontend.netlify.app/interactions'}
                title="Switch to Interactions"
              >
                <FaClock />
              </InteractionsIconButton>
            </HeaderContent>
          </SearchHeader>

          <SearchContainer>
            <SearchInputWrapper>
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search contacts by name, company, role, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </SearchInputWrapper>

            {loading && (
              <LoadingContainer>
                <LoadingSpinner />
                <LoadingText>Searching...</LoadingText>
              </LoadingContainer>
            )}

            {searchTerm && !loading && (
              <ResultsHeader>
                {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} found
              </ResultsHeader>
            )}
          </SearchContainer>

          <ResultsContainer>
            {filteredContacts.map(contact => (
              <ContactCard key={contact.contact_id}>
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
                      <ContactName>
                        {contact.first_name} {contact.last_name}
                        {contact.category && <CategoryBadge category={contact.category}>{contact.category}</CategoryBadge>}
                      </ContactName>
                      {contact.job_role && <ContactRole>{contact.job_role}</ContactRole>}
                      {contact.companies[0] && (
                        <ContactCompany>
                          <FaBuilding style={{ marginRight: '6px' }} />
                          {contact.companies[0].name}
                        </ContactCompany>
                      )}
                    </ContactInfo>
                  </ContactCardHeader>

                  <ContactCardDetails>
                    {contact.emails?.length > 0 && contact.emails[0]?.email && (
                      <ContactDetail>
                        <FaEnvelope />
                        <span>{contact.emails[0].email}</span>
                      </ContactDetail>
                    )}
                    {contact.mobiles?.length > 0 && contact.mobiles[0]?.mobile && (
                      <ContactDetail>
                        <FaPhone />
                        <span>{contact.mobiles[0].mobile}</span>
                      </ContactDetail>
                    )}
                  </ContactCardDetails>
                </ContactCardContent>

                <ContactCardActions>
                  <CardActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditContact(contact.contact_id);
                    }}
                    $edit
                  >
                    <FaEdit />
                  </CardActionButton>
                  <CardActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpamContact(contact);
                    }}
                    $spam
                  >
                    <FiAlertTriangle />
                  </CardActionButton>
                </ContactCardActions>
              </ContactCard>
            ))}

            {searchTerm && !loading && filteredContacts.length === 0 && (
              <NoResultsContainer>
                <NoResultsIcon>🔍</NoResultsIcon>
                <NoResultsTitle>No contacts found</NoResultsTitle>
                <NoResultsText>Try searching with different keywords or check your spelling</NoResultsText>
              </NoResultsContainer>
            )}

            {!searchTerm && (
              <WelcomeContainer>
                <WelcomeIcon>👋</WelcomeIcon>
                <WelcomeTitle>Welcome to Contact Search</WelcomeTitle>
                <WelcomeText>Start typing to search your contacts by name, company, role, email, or phone number</WelcomeText>
              </WelcomeContainer>
            )}
          </ResultsContainer>
        </SearchView>
      ) : (
        <DetailView>
          <DetailHeader>
            <BackButton onClick={handleBackToSearch}>
              <FaArrowLeft />
              <span>Back to Search</span>
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

      {/* Powerful Delete Modal (copied from StandaloneInteractions.js) */}
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
                  {contactToDelete.email ? ` (${contactToDelete.email})` :
                   contactToDelete.mobile ? ` (${contactToDelete.mobile})` : ''}
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

// Styled Components
const FullScreenContainer = styled.div`
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
`;

const SearchView = styled.div`
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

const SearchHeader = styled.div`
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

const InteractionsIconButton = styled.button`
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
  font-size: 20px;
  flex-shrink: 0;

  &:hover {
    background: #10b981;
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

const SearchContainer = styled.div`
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  z-index: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
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
`;

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px 20px;
  -webkit-overflow-scrolling: touch;
`;

const ContactCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const ContactCardContent = styled.div`
  flex: 1;
  cursor: pointer;
`;

const ContactCardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: 15px;
  align-items: flex-start;
`;

const CardActionButton = styled.button`
  background: ${props => props.$edit ? '#007acc' : props.$spam ? '#ff4444' : '#333'};
  border: 1px solid ${props => props.$edit ? '#0099ff' : props.$spam ? '#ff6666' : '#555'};
  border-radius: 4px;
  color: white;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  min-width: 32px;
  height: 32px;

  &:hover {
    background: ${props => props.$edit ? '#0099ff' : props.$spam ? '#ff6666' : '#555'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
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
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
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

const ContactInfo = styled.div`
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

const ContactCardDetails = styled.div`
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

const WelcomeContainer = styled.div`
  text-align: center;
  padding: 80px 20px;
`;

const WelcomeIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
`;

const WelcomeTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
`;

const WelcomeText = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

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

// Modal styled components (copied from StandaloneInteractions.js)
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;

  h2 {
    color: #e0e0e0;
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #333;
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalContactDetail = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  color: #999;
  font-size: 14px;
  font-weight: 500;
  margin-right: 10px;
  min-width: 120px;
`;

const DetailValue = styled.span`
  color: #e0e0e0;
  font-size: 14px;
  flex: 1;
  text-align: right;
  word-break: break-word;
`;

const ModalContent = styled.div`
  color: #e0e0e0;
  font-size: 16px;
  margin-bottom: 20px;
  font-weight: 500;
`;

const CheckboxContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  padding: 10px 0;
  border: 1px solid #333;
  border-radius: 6px;
  background: #1a1a1a;
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 15px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  label {
    color: #e0e0e0;
    font-size: 14px;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: #00ff00;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #333;
`;

const DeleteButton = styled.button`
  background: #ff4444;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #ff6666;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const CancelButton = styled.button`
  background: #333;
  color: #e0e0e0;
  border: 1px solid #555;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #444;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

export default StandaloneContactSearch;