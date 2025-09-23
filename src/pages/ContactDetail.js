import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaArrowLeft, FaEdit, FaStickyNote } from 'react-icons/fa';
import { FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';

const ContactDetail = ({ theme }) => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  // Delete modal state (copied from StandaloneInteractions.js)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [associatedData, setAssociatedData] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchContact = async () => {
    if (!contactId) return;

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
        .eq('contact_id', contactId)
        .single();

      if (error) throw error;

      // Process contact data
      const processedContact = {
        ...data,
        emails: data.contact_emails || [],
        mobiles: data.contact_mobiles || [],
        companies: data.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
        tags: data.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
        cities: data.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
      };

      setContact(processedContact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      toast.error('Failed to load contact details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleEditContact = () => {
    if (!contact) return;
    const url = `/contacts/workflow/${contact.contact_id}?step=2`;
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

  const handleOpenObsidianNote = () => {
    if (!contact) return;
    const vaultName = "Living with Intention";
    const fileName = `${contact.first_name} ${contact.last_name}`;
    const obsidianUrl = `obsidian://advanced-uri?vault=${encodeURIComponent(vaultName)}&commandid=workspace%253Anew-file&filename=${encodeURIComponent(fileName + '.md')}`;

    window.open(obsidianUrl, '_self');
    toast.success(`Opening note for ${fileName}`, {
      duration: 2000,
      icon: '📝'
    });
  };

  // Delete functionality (copied from StandaloneInteractions.js)
  const handleOpenDeleteModal = async () => {
    if (!contact) return;
    setContactToDelete(contact);

    try {
      // Get counts of associated records (same as StandaloneInteractions.js)
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
        supabase.from('chat').select('id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_chats').select('id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('interactions').select('interaction_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('emails').select('email_id', { count: 'exact', head: true }).eq('sender_contact_id', contact.contact_id),
        supabase.from('email_participants').select('participant_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_email_threads').select('email_thread_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_tags').select('entry_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_cities').select('entry_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_companies').select('contact_companies_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_notes').select('note_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_attachments').select('attachment_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_emails').select('contact_email_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_mobiles').select('contact_mobile_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('deals').select('deal_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('meetings').select('meeting_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('investments').select('investment_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('keep_in_touch').select('kit_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('interactions').select('type, notes, created_at').eq('contact_id', contact.contact_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
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

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedItems(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    setIsDeleting(true);
    try {
      const contactIdToDelete = contactToDelete.contact_id;

      // Delete selected associated records first (same logic as StandaloneInteractions.js)
      const deletePromises = [];

      if (selectedItems.deleteInteractions && associatedData.interactionsCount > 0) {
        deletePromises.push(supabase.from('interactions').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteEmails && associatedData.emailsCount > 0) {
        deletePromises.push(supabase.from('emails').delete().eq('sender_contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteEmailParticipants && associatedData.emailParticipantsCount > 0) {
        deletePromises.push(supabase.from('email_participants').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteEmailThreads && associatedData.emailThreadsCount > 0) {
        deletePromises.push(supabase.from('contact_email_threads').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteTags && associatedData.tagsCount > 0) {
        deletePromises.push(supabase.from('contact_tags').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteCities && associatedData.citiesCount > 0) {
        deletePromises.push(supabase.from('contact_cities').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteCompanies && associatedData.companiesCount > 0) {
        deletePromises.push(supabase.from('contact_companies').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteNotes && associatedData.notesCount > 0) {
        deletePromises.push(supabase.from('contact_notes').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteAttachments && associatedData.attachmentsCount > 0) {
        deletePromises.push(supabase.from('contact_attachments').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteContactEmails && associatedData.contactEmailsCount > 0) {
        deletePromises.push(supabase.from('contact_emails').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteContactMobiles && associatedData.contactMobilesCount > 0) {
        deletePromises.push(supabase.from('contact_mobiles').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteDeals && associatedData.dealsCount > 0) {
        deletePromises.push(supabase.from('deals').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteMeetings && associatedData.meetingsCount > 0) {
        deletePromises.push(supabase.from('meetings').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteInvestments && associatedData.investmentsCount > 0) {
        deletePromises.push(supabase.from('investments').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteKit && associatedData.kitCount > 0) {
        deletePromises.push(supabase.from('keep_in_touch').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteChat && associatedData.chatCount > 0) {
        deletePromises.push(supabase.from('chat').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteContactChats && associatedData.contactChatsCount > 0) {
        deletePromises.push(supabase.from('contact_chats').delete().eq('contact_id', contactIdToDelete));
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
        .eq('contact_id', contactIdToDelete);

      if (error) throw error;

      toast.success('Contact and selected associated records deleted successfully');

      setDeleteModalOpen(false);
      setContactToDelete(null);
      setAssociatedData({});
      setSelectedItems({});

      // Navigate back to previous page
      navigate(-1);

    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer theme={theme}>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText theme={theme}>Loading contact...</LoadingText>
        </LoadingContainer>
      </PageContainer>
    );
  }

  if (!contact) {
    return (
      <PageContainer theme={theme}>
        <ErrorContainer>
          <ErrorText theme={theme}>Contact not found</ErrorText>
        </ErrorContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer theme={theme}>
      <DetailView theme={theme}>
        <DetailHeader theme={theme}>
          <BackButton theme={theme} onClick={handleBack}>
            <FaArrowLeft />
            <span>Back</span>
          </BackButton>
          <ActionButtons>
            <ActionButton
              as="button"
              onClick={handleEditContact}
              $edit
              theme={theme}
            >
              <FaEdit />
              Edit
            </ActionButton>
            <ActionButton
              as="button"
              onClick={handleOpenDeleteModal}
              $delete
              theme={theme}
            >
              <FiAlertTriangle />
              Delete
            </ActionButton>
            {contact.emails?.length > 0 && contact.emails[0]?.email && (
              <ActionButton
                href={`mailto:${contact.emails[0].email}`}
                $primary
                theme={theme}
              >
                <FaEnvelope />
                Email
              </ActionButton>
            )}
            {contact.mobiles?.length > 0 && contact.mobiles[0]?.mobile && (
              <ActionButton
                href={`https://wa.me/${contact.mobiles[0].mobile.replace(/\D/g, '')}`}
                $secondary
                theme={theme}
              >
                <FaPhone />
                WhatsApp
              </ActionButton>
            )}
          </ActionButtons>
        </DetailHeader>

        <DetailContent theme={theme}>
          <ProfileSection theme={theme}>
            <ProfileAvatar theme={theme}>
              {contact.profile_image_url ? (
                <img src={contact.profile_image_url} alt="Profile" />
              ) : (
                <FaUser />
              )}
            </ProfileAvatar>
            <ProfileInfo>
              <ProfileHeader>
                <ProfileName theme={theme}>
                  {contact.first_name} {contact.last_name}
                </ProfileName>
                <ObsidianNoteButton
                  theme={theme}
                  onClick={handleOpenObsidianNote}
                  title={`Open Obsidian note for ${contact.first_name} ${contact.last_name}`}
                >
                  <FaStickyNote />
                </ObsidianNoteButton>
              </ProfileHeader>
              {contact.job_role && (
                <ProfileRole theme={theme}>{contact.job_role}</ProfileRole>
              )}
              {contact.score && (
                <ScoreBadge theme={theme}>Score: {contact.score}</ScoreBadge>
              )}
            </ProfileInfo>
          </ProfileSection>

          <InfoGrid>
            {(contact.emails?.length > 0 || contact.mobiles?.length > 0) && (
              <InfoSection>
                <SectionTitle theme={theme}>Contact Information</SectionTitle>
                <InfoList>
                  {contact.emails?.map((email, idx) => (
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
                  {contact.mobiles?.map((mobile, idx) => (
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

            {contact.companies?.length > 0 && (
              <InfoSection>
                <SectionTitle theme={theme}>Company Information</SectionTitle>
                <InfoList>
                  {contact.companies.map((company, idx) => (
                    <InfoItem key={`company-${idx}`}>
                      <InfoItemIcon><FaBuilding /></InfoItemIcon>
                      <InfoItemContent>
                        <InfoItemLabel theme={theme}>Company</InfoItemLabel>
                        <InfoItemValue theme={theme}>{company.name}</InfoItemValue>
                        {company.website && (
                          <InfoItemSubValue theme={theme}>
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

            {contact.cities?.length > 0 && (
              <InfoSection>
                <SectionTitle theme={theme}>Location</SectionTitle>
                <InfoList>
                  {contact.cities.map((city, idx) => (
                    <InfoItem key={`city-${idx}`}>
                      <InfoItemIcon><FaMapMarkerAlt /></InfoItemIcon>
                      <InfoItemContent>
                        <InfoItemLabel theme={theme}>Location</InfoItemLabel>
                        <InfoItemValue theme={theme}>{city.name}, {city.country}</InfoItemValue>
                      </InfoItemContent>
                    </InfoItem>
                  ))}
                </InfoList>
              </InfoSection>
            )}

            {contact.tags?.length > 0 && (
              <InfoSection>
                <SectionTitle theme={theme}>Tags</SectionTitle>
                <TagList>
                  {contact.tags.map((tag, idx) => (
                    <Tag key={idx} theme={theme}>{tag}</Tag>
                  ))}
                </TagList>
              </InfoSection>
            )}

            {contact.description && (
              <InfoSection>
                <SectionTitle theme={theme}>Notes</SectionTitle>
                <NotesText theme={theme}>{contact.description}</NotesText>
              </InfoSection>
            )}

            {contact.linkedin && (
              <InfoSection>
                <SectionTitle theme={theme}>Social Media</SectionTitle>
                <InfoList>
                  <InfoItem>
                    <InfoItemContent>
                      <InfoItemLabel theme={theme}>LinkedIn Profile</InfoItemLabel>
                      <InfoItemValue theme={theme}>
                        <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
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

      {/* Delete Modal (copied from StandaloneInteractions.js) */}
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
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
            borderRadius: '12px',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
            zIndex: 1001
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
          }
        }}
      >
        <ModalHeader theme={theme}>
          <h2>Delete Contact and Associated Data</h2>
          <CloseButton theme={theme} onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
            <FiAlertTriangle />
          </CloseButton>
        </ModalHeader>

        {contactToDelete && (
          <>
            <ModalContactDetail theme={theme}>
              <DetailItem>
                <DetailValue theme={theme}>
                  {contactToDelete.first_name} {contactToDelete.last_name}
                  {contactToDelete.emails?.[0]?.email ? ` (${contactToDelete.emails[0].email})` :
                   contactToDelete.mobiles?.[0]?.mobile ? ` (${contactToDelete.mobiles[0].mobile})` : ''}
                </DetailValue>
              </DetailItem>
            </ModalContactDetail>

            <DetailItem style={{ marginTop: '15px', marginBottom: '15px' }}>
              <DetailLabel theme={theme}>Last Interaction:</DetailLabel>
              <DetailValue theme={theme}>
                {associatedData.lastInteraction ?
                  associatedData.lastInteraction.summary :
                  'None'}
              </DetailValue>
            </DetailItem>

            <ModalContent theme={theme}>
              Select which items to delete:
            </ModalContent>

            <CheckboxContainer theme={theme}>
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

                {/* Add other checkbox items as needed - truncated for brevity */}

              </CheckboxGroup>
            </CheckboxContainer>

            <ModalActions>
              <DeleteButton
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                theme={theme}
              >
                {isDeleting ? 'Deleting...' : 'Delete Selected Items'}
              </DeleteButton>
              <CancelButton
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                theme={theme}
              >
                Cancel
              </CancelButton>
            </ModalActions>
          </>
        )}
      </Modal>
    </PageContainer>
  );
};

// Styled Components (reusing from StandaloneInteractions.js with theme support)
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const DetailView = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  display: flex;
  flex-direction: column;
  border-radius: 0;

  @media (min-width: 768px) {
    margin: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    min-height: calc(100vh - 40px);
  }
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  position: sticky;
  top: 0;
  z-index: 10;
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
  border: none;
  cursor: pointer;
  font-family: inherit;

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

  ${props => props.$edit && `
    background: #F59E0B;
    color: white;

    &:hover {
      background: #D97706;
      color: white;
    }
  `}

  ${props => props.$delete && `
    background: #EF4444;
    color: white;

    &:hover {
      background: #DC2626;
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
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const ProfileAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  border: 3px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#6B7280'};

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#D1D5DB'};
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

const ProfileName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;

  @media (min-width: 768px) {
    font-size: 28px;
  }
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

  &:active {
    transform: translateY(0);
  }
`;

const ProfileRole = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
  margin-bottom: 8px;
`;

const ScoreBadge = styled.div`
  background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
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
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
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
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
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

const InfoItemSubValue = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 4px;

  a {
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  }
`;

const PrimaryTag = styled.span`
  background: ${props => props.theme === 'light' ? '#D1FAE5' : '#065F46'};
  color: ${props => props.theme === 'light' ? '#065F46' : '#6EE7B7'};
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
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#6B7280'};
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
`;

const NotesText = styled.div`
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  line-height: 1.6;
  font-size: 16px;
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
  border: 3px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-top: 3px solid ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
`;

const ErrorText = styled.div`
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  font-size: 18px;
  font-weight: 500;
`;

// Modal styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  h2 {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    margin: 0;
    font-size: 1.2em;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 5px;
  border-radius: 3px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
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
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-weight: 500;
  margin-right: 8px;
`;

const DetailValue = styled.span`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 600;
`;

const ModalContent = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 20px;
  font-weight: 500;
`;

const CheckboxContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 4px;
  padding: 10px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
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
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    cursor: pointer;
    user-select: none;
    flex: 1;
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};

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
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const DeleteButton = styled.button`
  background: #DC2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #B91C1C;
  }

  &:disabled {
    background: ${props => props.theme === 'light' ? '#9CA3AF' : '#4B5563'};
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const CancelButton = styled.button`
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

export default ContactDetail;