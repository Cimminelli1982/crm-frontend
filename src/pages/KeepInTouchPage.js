import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaEdit, FaClock, FaCalendar, FaStickyNote, FaSync, FaCheck, FaPause } from 'react-icons/fa';
import { FiAlertTriangle, FiX, FiBell, FiClock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';

const KeepInTouchPage = ({ theme, onKeepInTouchCountChange }) => {
  const navigate = useNavigate();
  const [keepInTouchContacts, setKeepInTouchContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Snooze modal state
  const [snoozeModalOpen, setSnoozeModalOpen] = useState(false);
  const [contactToSnooze, setContactToSnooze] = useState(null);
  const [snoozeDays, setSnoozeDays] = useState(7);
  const [isSnoozing, setIsSnoozing] = useState(false);

  // Mark as done modal state
  const [doneModalOpen, setDoneModalOpen] = useState(false);
  const [contactToMarkDone, setContactToMarkDone] = useState(null);
  const [interactionNotes, setInteractionNotes] = useState('');
  const [isMarkingDone, setIsMarkingDone] = useState(false);

  // Delete modal state (for removing from keep in touch)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchKeepInTouchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('keep_in_touch')
        .select(`
          *,
          contacts (
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
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate next follow-up dates and filter overdue/due soon
      const now = new Date();
      const processedContacts = data
        .map(kit => {
          const contact = kit.contacts;
          if (!contact) return null;

          // Calculate next follow-up date based on last interaction and frequency
          let nextFollowUpDate = new Date();

          if (contact.last_interaction_at) {
            nextFollowUpDate = new Date(contact.last_interaction_at);
          } else {
            nextFollowUpDate = new Date(kit.created_at);
          }

          // Add frequency days
          const frequencyDays = getFrequencyDays(kit.frequency);
          nextFollowUpDate.setDate(nextFollowUpDate.getDate() + frequencyDays);

          // Add snooze days if any
          if (kit.snooze_days) {
            nextFollowUpDate.setDate(nextFollowUpDate.getDate() + kit.snooze_days);
          }

          const daysDifference = Math.floor((nextFollowUpDate - now) / (1000 * 60 * 60 * 24));

          return {
            ...kit,
            contact: {
              ...contact,
              emails: contact.contact_emails || [],
              mobiles: contact.contact_mobiles || [],
              companies: contact.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
              tags: contact.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
              cities: contact.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
            },
            nextFollowUpDate,
            daysDifference,
            isOverdue: daysDifference < 0,
            isDueSoon: daysDifference >= 0 && daysDifference <= 3
          };
        })
        .filter(Boolean)
        .filter(kit => kit.isOverdue || kit.isDueSoon); // Only show overdue or due soon

      setKeepInTouchContacts(processedContacts);

      // Update count in navigation
      if (onKeepInTouchCountChange) {
        onKeepInTouchCountChange(processedContacts.length);
      }
    } catch (error) {
      console.error('Error fetching keep in touch contacts:', error);
      toast.error('Failed to load keep in touch contacts');

      // Update count to 0 on error
      if (onKeepInTouchCountChange) {
        onKeepInTouchCountChange(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyDays = (frequency) => {
    switch (frequency) {
      case 'Weekly': return 7;
      case 'Bi-Weekly': return 14;
      case 'Monthly': return 30;
      case 'Quarterly': return 90;
      case 'Bi-Annually': return 180;
      case 'Annually': return 365;
      default: return 30;
    }
  };

  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case 'Weekly': return '#EF4444';
      case 'Bi-Weekly': return '#F59E0B';
      case 'Monthly': return '#3B82F6';
      case 'Quarterly': return '#10B981';
      case 'Bi-Annually': return '#8B5CF6';
      case 'Annually': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityLevel = (daysDifference) => {
    if (daysDifference < -7) return { level: 'critical', color: '#DC2626', text: 'Critical' };
    if (daysDifference < -3) return { level: 'high', color: '#EF4444', text: 'High' };
    if (daysDifference < 0) return { level: 'medium', color: '#F59E0B', text: 'Medium' };
    if (daysDifference <= 1) return { level: 'due', color: '#3B82F6', text: 'Due' };
    return { level: 'upcoming', color: '#10B981', text: 'Soon' };
  };

  useEffect(() => {
    fetchKeepInTouchContacts();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchKeepInTouchContacts();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleContactSelect = (kitContact) => {
    navigate(`/contact/${kitContact.contact.contact_id}`);
  };

  const handleBackToKeepInTouch = () => {
    setSelectedContact(null);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchKeepInTouchContacts();
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

  const handleSnoozeContact = (kitContact) => {
    setContactToSnooze(kitContact);
    setSnoozeDays(7);
    setSnoozeModalOpen(true);
  };

  const handleConfirmSnooze = async () => {
    if (!contactToSnooze || !snoozeDays) return;

    setIsSnoozing(true);
    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .update({
          snooze_days: snoozeDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactToSnooze.id);

      if (error) throw error;

      toast.success(`Contact snoozed for ${snoozeDays} day${snoozeDays !== 1 ? 's' : ''}`);

      // Remove from current list (will reappear when snooze expires)
      const newContacts = keepInTouchContacts.filter(c => c.id !== contactToSnooze.id);
      setKeepInTouchContacts(newContacts);

      // Update count in navigation
      if (onKeepInTouchCountChange) {
        onKeepInTouchCountChange(newContacts.length);
      }

      if (selectedContact && selectedContact.id === contactToSnooze.id) {
        setSelectedContact(null);
      }

      setSnoozeModalOpen(false);
      setContactToSnooze(null);
      setSnoozeDays(7);
    } catch (error) {
      console.error('Error snoozing contact:', error);
      toast.error('Failed to snooze contact');
    } finally {
      setIsSnoozing(false);
    }
  };

  const handleMarkAsDone = (kitContact) => {
    setContactToMarkDone(kitContact);
    setInteractionNotes('');
    setDoneModalOpen(true);
  };

  const handleConfirmMarkAsDone = async () => {
    if (!contactToMarkDone) return;

    setIsMarkingDone(true);
    try {
      // Update last_interaction_at on the contact
      const { error: contactError } = await supabase
        .from('contacts')
        .update({
          last_interaction_at: new Date().toISOString()
        })
        .eq('contact_id', contactToMarkDone.contact.contact_id);

      if (contactError) throw contactError;

      // Create an interaction record if notes provided
      if (interactionNotes.trim()) {
        const { error: interactionError } = await supabase
          .from('interactions')
          .insert([{
            contact_id: contactToMarkDone.contact.contact_id,
            interaction_type: 'Follow-up',
            direction: 'Outbound',
            interaction_date: new Date().toISOString(),
            summary: interactionNotes.trim(),
            created_at: new Date().toISOString()
          }]);

        if (interactionError) {
          console.warn('Failed to create interaction record:', interactionError);
          // Don't fail the whole operation for this
        }
      }

      // Reset snooze days on the keep_in_touch record
      const { error: kitError } = await supabase
        .from('keep_in_touch')
        .update({
          snooze_days: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactToMarkDone.id);

      if (kitError) throw kitError;

      toast.success('Contact marked as done! Next follow-up scheduled.');

      // Remove from current list (will reappear based on frequency)
      const newContacts = keepInTouchContacts.filter(c => c.id !== contactToMarkDone.id);
      setKeepInTouchContacts(newContacts);

      // Update count in navigation
      if (onKeepInTouchCountChange) {
        onKeepInTouchCountChange(newContacts.length);
      }

      if (selectedContact && selectedContact.id === contactToMarkDone.id) {
        setSelectedContact(null);
      }

      setDoneModalOpen(false);
      setContactToMarkDone(null);
      setInteractionNotes('');
    } catch (error) {
      console.error('Error marking contact as done:', error);
      toast.error('Failed to mark contact as done');
    } finally {
      setIsMarkingDone(false);
    }
  };

  const handleRemoveFromKeepInTouch = (kitContact) => {
    setContactToDelete(kitContact);
    setDeleteModalOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!contactToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .delete()
        .eq('id', contactToDelete.id);

      if (error) throw error;

      toast.success('Contact removed from Keep in Touch');

      const newContacts = keepInTouchContacts.filter(c => c.id !== contactToDelete.id);
      setKeepInTouchContacts(newContacts);

      // Update count in navigation
      if (onKeepInTouchCountChange) {
        onKeepInTouchCountChange(newContacts.length);
      }

      if (selectedContact && selectedContact.id === contactToDelete.id) {
        setSelectedContact(null);
      }

      setDeleteModalOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error('Error removing contact from keep in touch:', error);
      toast.error('Failed to remove contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateDifference = (daysDifference) => {
    if (daysDifference < 0) {
      const overdueDays = Math.abs(daysDifference);
      return `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`;
    } else if (daysDifference === 0) {
      return 'Due today';
    } else if (daysDifference === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${daysDifference} day${daysDifference !== 1 ? 's' : ''}`;
    }
  };

  // Sort contacts by priority (most overdue first)
  const sortedContacts = useMemo(() => {
    return [...keepInTouchContacts].sort((a, b) => {
      // First by overdue status and days
      if (a.daysDifference !== b.daysDifference) {
        return a.daysDifference - b.daysDifference;
      }
      // Then by creation date (older first)
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }, [keepInTouchContacts]);

  return (
    <PageContainer theme={theme}>
      {!selectedContact ? (
        <KeepInTouchView>
          <KeepInTouchHeader theme={theme}>
            <HeaderContent>
              <HeaderText>
                <PageTitle theme={theme}>Keep in Touch</PageTitle>
                <PageSubtitle theme={theme}>
                  {keepInTouchContacts.length} contact{keepInTouchContacts.length !== 1 ? 's' : ''} need{keepInTouchContacts.length === 1 ? 's' : ''} follow-up
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
          </KeepInTouchHeader>

          {loading && (
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText theme={theme}>Loading contacts...</LoadingText>
            </LoadingContainer>
          )}

          <ContactsList>
            {sortedContacts.map(kitContact => {
              const priority = getPriorityLevel(kitContact.daysDifference);
              return (
                <ContactCard key={kitContact.id} theme={theme} $priority={priority.level}>
                  <ContactCardContent onClick={() => handleContactSelect(kitContact)}>
                    <ContactCardHeader>
                      <ContactAvatar>
                        {kitContact.contact?.profile_image_url ? (
                          <img src={kitContact.contact.profile_image_url} alt="Profile" />
                        ) : (
                          <FaUser />
                        )}
                      </ContactAvatar>
                      <ContactInfo>
                        <ContactName theme={theme}>
                          {kitContact.contact?.first_name} {kitContact.contact?.last_name}
                          <PriorityBadge $color={priority.color}>
                            {priority.text}
                          </PriorityBadge>
                        </ContactName>
                        {kitContact.contact?.job_role && <ContactRole theme={theme}>{kitContact.contact.job_role}</ContactRole>}
                        {kitContact.contact?.companies[0] && (
                          <ContactCompany theme={theme}>
                            <FaBuilding style={{ marginRight: '6px' }} />
                            {kitContact.contact.companies[0].name}
                          </ContactCompany>
                        )}
                      </ContactInfo>
                      <ContactMeta>
                        <FrequencyBadge $color={getFrequencyColor(kitContact.frequency)}>
                          <FiClock />
                          {kitContact.frequency}
                        </FrequencyBadge>
                        <DueDate $isOverdue={kitContact.isOverdue}>
                          <FaCalendar />
                          {formatDateDifference(kitContact.daysDifference)}
                        </DueDate>
                      </ContactMeta>
                    </ContactCardHeader>

                    <ContactCardDetails>
                      {kitContact.why_keeping_in_touch && (
                        <KeepInTouchReason theme={theme}>
                          <strong>Why:</strong> {kitContact.why_keeping_in_touch}
                        </KeepInTouchReason>
                      )}
                      {kitContact.next_follow_up_notes && (
                        <NextFollowUpNotes theme={theme}>
                          <strong>Next notes:</strong> {kitContact.next_follow_up_notes}
                        </NextFollowUpNotes>
                      )}
                      {kitContact.contact?.emails?.length > 0 && kitContact.contact.emails[0]?.email && (
                        <ContactDetail theme={theme}>
                          <FaEnvelope />
                          <span>{kitContact.contact.emails[0].email}</span>
                        </ContactDetail>
                      )}
                    </ContactCardDetails>
                  </ContactCardContent>

                  <ContactCardActions>
                    <ActionButton
                      theme={theme}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsDone(kitContact);
                      }}
                      $done
                      title="Mark as done"
                    >
                      <FaCheck />
                    </ActionButton>

                    <ActionButton
                      theme={theme}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSnoozeContact(kitContact);
                      }}
                      $snooze
                      title="Snooze"
                    >
                      <FaPause />
                    </ActionButton>

                    <ActionButton
                      theme={theme}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditContact(kitContact.contact.contact_id);
                      }}
                      $edit
                      title="Edit contact"
                    >
                      <FaEdit />
                    </ActionButton>

                    <ActionButton
                      theme={theme}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromKeepInTouch(kitContact);
                      }}
                      $remove
                      title="Remove from keep in touch"
                    >
                      <FiX />
                    </ActionButton>
                  </ContactCardActions>
                </ContactCard>
              );
            })}

            {!loading && keepInTouchContacts.length === 0 && (
              <EmptyState>
                <EmptyIcon>🎉</EmptyIcon>
                <EmptyTitle theme={theme}>All caught up!</EmptyTitle>
                <EmptyText theme={theme}>No contacts need follow-up right now. Check back later or add more contacts to keep in touch.</EmptyText>
              </EmptyState>
            )}
          </ContactsList>
        </KeepInTouchView>
      ) : (
        <DetailView theme={theme}>
          <DetailHeader theme={theme}>
            <BackButton theme={theme} onClick={handleBackToKeepInTouch}>
              <FiBell />
              <span>Back to Keep in Touch</span>
            </BackButton>
            <ActionButtons>
              {selectedContact.contact?.emails?.length > 0 && selectedContact.contact.emails[0]?.email && (
                <ActionButtonLarge
                  href={`mailto:${selectedContact.contact.emails[0].email}`}
                  $primary
                >
                  <FaEnvelope />
                  Email
                </ActionButtonLarge>
              )}
              {selectedContact.contact?.mobiles?.length > 0 && selectedContact.contact.mobiles[0]?.mobile && (
                <ActionButtonLarge
                  href={`https://wa.me/${selectedContact.contact.mobiles[0].mobile.replace(/\D/g, '')}`}
                  $secondary
                >
                  <FaPhone />
                  WhatsApp
                </ActionButtonLarge>
              )}
            </ActionButtons>
          </DetailHeader>

          <DetailContent>
            <ProfileSection>
              <ProfileAvatar>
                {selectedContact.contact?.profile_image_url ? (
                  <img src={selectedContact.contact.profile_image_url} alt="Profile" />
                ) : (
                  <FaUser />
                )}
              </ProfileAvatar>
              <ProfileInfo>
                <ProfileHeader>
                  <ProfileName theme={theme}>
                    {selectedContact.contact?.first_name} {selectedContact.contact?.last_name}
                  </ProfileName>
                  <ObsidianNoteButton
                    theme={theme}
                    onClick={() => handleOpenObsidianNote(selectedContact.contact)}
                    title={`Open Obsidian note for ${selectedContact.contact?.first_name} ${selectedContact.contact?.last_name}`}
                  >
                    <FaStickyNote />
                  </ObsidianNoteButton>
                </ProfileHeader>
                {selectedContact.contact?.job_role && (
                  <ProfileRole theme={theme}>{selectedContact.contact.job_role}</ProfileRole>
                )}
              </ProfileInfo>
            </ProfileSection>

            <KeepInTouchDetails theme={theme}>
              <SectionTitle theme={theme}>Keep in Touch Details</SectionTitle>
              <DetailGrid>
                <DetailItem>
                  <DetailLabel theme={theme}>Frequency:</DetailLabel>
                  <DetailValue theme={theme}>{selectedContact.frequency}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel theme={theme}>Status:</DetailLabel>
                  <DetailValue theme={theme}>
                    <PriorityBadge $color={getPriorityLevel(selectedContact.daysDifference).color}>
                      {formatDateDifference(selectedContact.daysDifference)}
                    </PriorityBadge>
                  </DetailValue>
                </DetailItem>
                {selectedContact.why_keeping_in_touch && (
                  <DetailItem $fullWidth>
                    <DetailLabel theme={theme}>Why keeping in touch:</DetailLabel>
                    <DetailValue theme={theme}>{selectedContact.why_keeping_in_touch}</DetailValue>
                  </DetailItem>
                )}
                {selectedContact.next_follow_up_notes && (
                  <DetailItem $fullWidth>
                    <DetailLabel theme={theme}>Next follow-up notes:</DetailLabel>
                    <DetailValue theme={theme}>{selectedContact.next_follow_up_notes}</DetailValue>
                  </DetailItem>
                )}
              </DetailGrid>
            </KeepInTouchDetails>

            <ActionSection>
              <SectionTitle theme={theme}>Quick Actions</SectionTitle>
              <ActionGrid>
                <QuickActionCard
                  theme={theme}
                  onClick={() => handleMarkAsDone(selectedContact)}
                  $color="#10B981"
                >
                  <QuickActionIcon $color="#10B981">
                    <FaCheck />
                  </QuickActionIcon>
                  <QuickActionLabel>Mark as Done</QuickActionLabel>
                  <QuickActionDescription theme={theme}>
                    Record interaction and reset timer
                  </QuickActionDescription>
                </QuickActionCard>

                <QuickActionCard
                  theme={theme}
                  onClick={() => handleSnoozeContact(selectedContact)}
                  $color="#F59E0B"
                >
                  <QuickActionIcon $color="#F59E0B">
                    <FaPause />
                  </QuickActionIcon>
                  <QuickActionLabel>Snooze</QuickActionLabel>
                  <QuickActionDescription theme={theme}>
                    Postpone follow-up reminder
                  </QuickActionDescription>
                </QuickActionCard>

                <QuickActionCard
                  theme={theme}
                  onClick={() => handleRemoveFromKeepInTouch(selectedContact)}
                  $color="#EF4444"
                >
                  <QuickActionIcon $color="#EF4444">
                    <FiX />
                  </QuickActionIcon>
                  <QuickActionLabel>Remove</QuickActionLabel>
                  <QuickActionDescription theme={theme}>
                    Stop keeping in touch
                  </QuickActionDescription>
                </QuickActionCard>
              </ActionGrid>
            </ActionSection>
          </DetailContent>
        </DetailView>
      )}

      {/* Snooze Modal */}
      <Modal
        isOpen={snoozeModalOpen}
        onRequestClose={() => setSnoozeModalOpen(false)}
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
          <h2>Snooze Contact</h2>
          <CloseButton
            theme={theme}
            onClick={() => setSnoozeModalOpen(false)}
            disabled={isSnoozing}
          >
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalContent theme={theme}>
          <p>Snooze <strong>{contactToSnooze?.contact?.first_name} {contactToSnooze?.contact?.last_name}</strong> for:</p>

          <SnoozeOptions>
            {[1, 3, 7, 14, 30].map(days => (
              <SnoozeOption
                key={days}
                theme={theme}
                $selected={snoozeDays === days}
                onClick={() => setSnoozeDays(days)}
              >
                {days} day{days !== 1 ? 's' : ''}
              </SnoozeOption>
            ))}
          </SnoozeOptions>
        </ModalContent>

        <ModalActions>
          <ConfirmButton
            theme={theme}
            onClick={handleConfirmSnooze}
            disabled={isSnoozing}
          >
            {isSnoozing ? 'Snoozing...' : 'Snooze'}
          </ConfirmButton>
          <CancelButton
            theme={theme}
            onClick={() => setSnoozeModalOpen(false)}
            disabled={isSnoozing}
          >
            Cancel
          </CancelButton>
        </ModalActions>
      </Modal>

      {/* Mark as Done Modal */}
      <Modal
        isOpen={doneModalOpen}
        onRequestClose={() => setDoneModalOpen(false)}
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
          <h2>Mark as Done</h2>
          <CloseButton
            theme={theme}
            onClick={() => setDoneModalOpen(false)}
            disabled={isMarkingDone}
          >
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalContent theme={theme}>
          <p>Mark <strong>{contactToMarkDone?.contact?.first_name} {contactToMarkDone?.contact?.last_name}</strong> as contacted.</p>

          <NotesTextarea
            theme={theme}
            placeholder="Add notes about this interaction (optional)..."
            value={interactionNotes}
            onChange={(e) => setInteractionNotes(e.target.value)}
            rows={4}
          />
        </ModalContent>

        <ModalActions>
          <ConfirmButton
            theme={theme}
            onClick={handleConfirmMarkAsDone}
            disabled={isMarkingDone}
          >
            {isMarkingDone ? 'Marking...' : 'Mark as Done'}
          </ConfirmButton>
          <CancelButton
            theme={theme}
            onClick={() => setDoneModalOpen(false)}
            disabled={isMarkingDone}
          >
            Cancel
          </CancelButton>
        </ModalActions>
      </Modal>

      {/* Remove Modal */}
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
          <h2>Remove from Keep in Touch</h2>
          <CloseButton
            theme={theme}
            onClick={() => setDeleteModalOpen(false)}
            disabled={isDeleting}
          >
            <FiX />
          </CloseButton>
        </ModalHeader>

        <ModalContent theme={theme}>
          Remove <strong>{contactToDelete?.contact?.first_name} {contactToDelete?.contact?.last_name}</strong> from keep in touch reminders?
        </ModalContent>

        <ModalActions>
          <ConfirmButton
            theme={theme}
            onClick={handleConfirmRemove}
            disabled={isDeleting}
            $danger
          >
            {isDeleting ? 'Removing...' : 'Remove'}
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

const KeepInTouchView = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const KeepInTouchHeader = styled.div`
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
  border: 2px solid ${props => {
    const borderColors = {
      critical: '#DC2626',
      high: '#EF4444',
      medium: '#F59E0B',
      due: '#3B82F6',
      upcoming: '#10B981'
    };
    return borderColors[props.$priority] || (props.theme === 'light' ? '#E5E7EB' : '#374151');
  }};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20px;
  align-items: flex-start;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
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
`;

const PriorityBadge = styled.div`
  background: ${props => props.$color};
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
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

const FrequencyBadge = styled.div`
  background: ${props => props.$color};
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DueDate = styled.div`
  color: ${props => props.$isOverdue ? '#EF4444' : '#6B7280'};
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ContactCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const KeepInTouchReason = styled.div`
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 14px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid #10B981;
`;

const NextFollowUpNotes = styled.div`
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 14px;
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#451A03'};
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid #F59E0B;
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
    if (props.$done) return '#10B981';
    if (props.$snooze) return '#F59E0B';
    if (props.$edit) return '#3B82F6';
    if (props.$remove) return '#EF4444';
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
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
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
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
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

const KeepInTouchDetails = styled.div`
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

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  ${props => props.$fullWidth && `
    grid-column: 1 / -1;
  `}
`;

const DetailLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 4px;
`;

const DetailValue = styled.div`
  font-size: 16px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  line-height: 1.4;
`;

const ActionSection = styled.div`
  margin-bottom: 32px;
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

const SnoozeOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
`;

const SnoozeOption = styled.button`
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
  padding: 8px 16px;
  border-radius: 6px;
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

const NotesTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  resize: vertical;
  margin-top: 16px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 3px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
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

export default KeepInTouchPage;