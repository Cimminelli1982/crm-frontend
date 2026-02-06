import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';
const MY_EMAIL = 'simone@cimminelli.com';

const useEmailActions = ({
  selectedThread, emailContacts, emailCompanies,
  threads, setThreads, setEmails, setSelectedThread,
  refreshThreads, activeTab,
  // Email compose dependencies
  handleSend, getLatestEmail,
  // WhatsApp dependencies (for updateItemStatus)
  selectedWhatsappChat, setWhatsappChats,
  // Calendar dependencies (for handleImportCalendarInvitation)
  importingCalendar, setImportingCalendar,
  refreshInbox,
}) => {
  // Saving state
  const [saving, setSaving] = useState(false);

  // Pending status for keeping email in inbox after send
  const pendingInboxStatusRef = useRef(null);

  // Attachment save modal state
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [saveAndArchiveCallback, setSaveAndArchiveCallback] = useState(null);

  // Spam menu state
  const [spamMenuOpen, setSpamMenuOpen] = useState(false);

  // Archive email in Fastmail
  const archiveInFastmail = async (fastmailId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fastmailId }),
      });
      const result = await response.json();
      if (!result.success) {
        console.error('Archive failed:', result.error);
      }
      return result.success;
    } catch (error) {
      console.error('Archive error:', error);
      return false;
    }
  };

  // Helper function to check if attachment should be auto-skipped (images, ICS files)
  const shouldSkipAttachment = (att) => {
    const skipTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/ico', 'text/calendar'];
    const skipExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'ics'];
    const ext = att.name?.split('.').pop()?.toLowerCase();
    return skipTypes.includes(att.type?.toLowerCase()) || skipExtensions.includes(ext);
  };

  // Check for attachments and show modal before saving
  const handleDoneClick = async () => {
    if (!selectedThread || selectedThread.length === 0) return;

    // Collect all attachments from all emails in thread
    const allAttachments = selectedThread.flatMap(email =>
      (email.attachments || []).map(att => ({
        ...att,
        emailSubject: email.subject,
        emailDate: email.date,
        fastmailId: email.fastmail_id
      }))
    );

    if (allAttachments.length > 0) {
      // Filter out images and ICS files for the modal
      const relevantAttachments = allAttachments.filter(att => !shouldSkipAttachment(att));

      if (relevantAttachments.length > 0) {
        // Show attachment modal only for relevant attachments
        setPendingAttachments(relevantAttachments);
        setAttachmentModalOpen(true);
      } else {
        // All attachments are images or ICS, skip modal
        saveAndArchiveAsync();
      }
    } else {
      // No attachments, proceed directly
      saveAndArchiveAsync();
    }
  };

  // Called when attachment modal is closed (save or skip)
  const handleAttachmentModalClose = () => {
    setAttachmentModalOpen(false);
    setPendingAttachments([]);
    // Continue with save and archive
    saveAndArchiveAsync();
  };

  // Import calendar invitation from email to "Living with Intention" calendar
  const handleImportCalendarInvitation = async () => {
    if (!selectedThread || selectedThread.length === 0) return;

    // Find the email with the ICS attachment (usually the first one for invitations)
    const emailWithIcs = selectedThread.find(email => {
      const attachments = email.attachments || [];
      return attachments.some(a =>
        a.type === 'text/calendar' ||
        a.type === 'application/ics' ||
        (a.name && a.name.endsWith('.ics'))
      );
    });

    if (!emailWithIcs) {
      toast.error('No calendar invitation found in this email');
      return;
    }

    // Get the inbox_id from the email
    const inboxId = emailWithIcs.id;
    if (!inboxId) {
      toast.error('Could not find inbox ID for this email');
      return;
    }

    setImportingCalendar(true);
    try {
      const response = await fetch(`${BACKEND_URL}/calendar/import-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inbox_id: inboxId })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to import invitation');
      }

      toast.success(`Added "${data.event.title}" to Living with Intention calendar`);

      // Optionally refresh inbox to show the new calendar event
      if (typeof refreshInbox === 'function') {
        refreshInbox();
      }
    } catch (error) {
      console.error('Import calendar invitation error:', error);
      toast.error(error.message || 'Failed to import calendar invitation');
    } finally {
      setImportingCalendar(false);
    }
  };

  // Check if selected email is a calendar invitation
  const isCalendarInvitation = () => {
    if (!selectedThread || selectedThread.length === 0) return false;

    // Check subject starts with "Invitation:"
    const subject = selectedThread[0]?.subject || '';
    if (subject.startsWith('Invitation:') || subject.startsWith('Updated invitation:')) {
      return true;
    }

    // Check for ICS attachment
    return selectedThread.some(email => {
      const attachments = email.attachments || [];
      return attachments.some(a =>
        a.type === 'text/calendar' ||
        a.type === 'application/ics' ||
        (a.name && a.name.endsWith('.ics'))
      );
    });
  };

  // Wrapper for handleSend that checks attachments after sending
  const handleSendWithAttachmentCheck = async (bodyOverride = null, keepInInboxWithStatus = null) => {
    // Store the status for later use in saveAndArchive
    pendingInboxStatusRef.current = keepInInboxWithStatus;

    // First, send the email
    await handleSend(bodyOverride, keepInInboxWithStatus);

    // After sending, check for attachments in thread (same logic as Done button)
    if (!selectedThread || selectedThread.length === 0) return;

    const allAttachments = selectedThread.flatMap(email =>
      (email.attachments || []).map(att => ({
        ...att,
        emailSubject: email.subject,
        emailDate: email.date,
        fastmailId: email.fastmail_id
      }))
    );

    if (allAttachments.length > 0) {
      // Filter out images and ICS files for the modal
      const relevantAttachments = allAttachments.filter(att => !shouldSkipAttachment(att));

      if (relevantAttachments.length > 0) {
        // Show attachment modal only for relevant attachments
        setPendingAttachments(relevantAttachments);
        setAttachmentModalOpen(true);
      } else {
        // All attachments are images or ICS, skip modal
        saveAndArchiveAsync();
      }
    } else {
      // No attachments, proceed directly with saveAndArchive
      saveAndArchiveAsync();
    }
  };

  // Save & Archive - save email to CRM tables and archive in Fastmail
  const saveAndArchive = async () => {
    if (!selectedThread || selectedThread.length === 0) return;

    setSaving(true);
    const errors = [];
    const logs = [];

    const log = (step, message, data = null) => {
      const entry = { step, message, data, timestamp: new Date().toISOString() };
      logs.push(entry);
    };

    try {
      log('START', 'Beginning Save & Archive process');

      // Get all contacts from the email thread (excluding me)
      const contactsInThread = emailContacts.filter(p =>
        p.contact?.contact_id && p.email?.toLowerCase() !== MY_EMAIL
      );
      log('CONTACTS', `Found ${contactsInThread.length} contacts (excluding me)`,
        contactsInThread.map(c => ({ email: c.email, name: c.contact?.first_name })));

      // Track successfully saved emails for archive/cleanup
      const successfullySavedEmails = [];

      // Process each email in the thread
      for (const email of selectedThread) {
        log('EMAIL', `Processing email: ${email.subject}`, { id: email.id, fastmail_id: email.fastmail_id });

        // Track if CRM save was successful for this email
        let crmSaveSuccess = true;

        // 1. Create or get email_thread
        let emailThreadId = null;
        try {
          // Check if thread already exists
          const { data: existingThread, error: checkError } = await supabase
            .from('email_threads')
            .select('email_thread_id')
            .eq('thread_id', email.thread_id)
            .maybeSingle();

          if (checkError) {
            log('ERROR', 'Failed to check existing thread', checkError);
            errors.push({ step: 'check_thread', error: checkError });
            crmSaveSuccess = false;
          }

          if (existingThread) {
            emailThreadId = existingThread.email_thread_id;
            log('THREAD', 'Using existing thread', { emailThreadId });

            // Update last_message_timestamp if newer
            const { error: updateError } = await supabase
              .from('email_threads')
              .update({
                last_message_timestamp: email.date,
                updated_at: new Date().toISOString()
              })
              .eq('email_thread_id', emailThreadId)
              .lt('last_message_timestamp', email.date);

            if (updateError) {
              log('WARNING', 'Failed to update thread timestamp', updateError);
            }
          } else {
            // Create new thread
            const { data: newThread, error: insertError } = await supabase
              .from('email_threads')
              .insert({
                thread_id: email.thread_id,
                subject: email.subject?.replace(/^(Re: |Fwd: )+/i, ''),
                last_message_timestamp: email.date,
              })
              .select('email_thread_id')
              .single();

            if (insertError) {
              log('ERROR', 'Failed to create thread', insertError);
              errors.push({ step: 'create_thread', error: insertError });
              crmSaveSuccess = false;
            } else {
              emailThreadId = newThread.email_thread_id;
              log('THREAD', 'Created new thread', { emailThreadId });
            }
          }
        } catch (threadError) {
          log('ERROR', 'Thread operation failed', threadError.message);
          errors.push({ step: 'thread', error: threadError.message });
          crmSaveSuccess = false;
        }

        // 2. Get sender contact_id (if in CRM)
        const senderEmail = email.from_email?.toLowerCase();
        let senderContactId = null;

        // First check emailContacts (already loaded)
        const senderContact = emailContacts.find(p => p.email?.toLowerCase() === senderEmail);
        if (senderContact?.contact?.contact_id) {
          senderContactId = senderContact.contact.contact_id;
        } else {
          // If not found (e.g., I'm the sender), look up directly in DB
          try {
            const { data: contactEmail } = await supabase
              .from('contact_emails')
              .select('contact_id')
              .eq('email', senderEmail)
              .maybeSingle();
            senderContactId = contactEmail?.contact_id || null;
          } catch (e) {
            log('WARNING', 'Failed to look up sender contact_id', e.message);
          }
        }
        log('SENDER', `Sender: ${senderEmail}`, { contactId: senderContactId, inCRM: !!senderContactId });

        // 3. Create email record if not exists
        let emailId = null;
        try {
          // Check if email already exists
          const { data: existingEmail, error: checkEmailError } = await supabase
            .from('emails')
            .select('email_id')
            .eq('gmail_id', email.fastmail_id)
            .maybeSingle();

          if (checkEmailError) {
            log('ERROR', 'Failed to check existing email', checkEmailError);
            errors.push({ step: 'check_email', error: checkEmailError });
            crmSaveSuccess = false;
          }

          if (existingEmail) {
            emailId = existingEmail.email_id;
            log('EMAIL_RECORD', 'Email already exists', { emailId });
          } else {
            // Determine direction
            const isSentByMe = senderEmail === MY_EMAIL;
            const direction = isSentByMe ? 'sent' : 'received';

            // Build email record - only include sender_contact_id if we have one
            const emailRecord = {
              gmail_id: email.fastmail_id,
              thread_id: email.thread_id,
              email_thread_id: emailThreadId,
              subject: email.subject,
              body_plain: email.body_text,
              body_html: email.body_html,
              message_timestamp: email.date,
              direction: direction,
              has_attachments: email.has_attachments || false,
              attachment_count: email.attachments?.length || 0,
              is_read: email.is_read || false,
              is_starred: email.is_starred || false,
              created_by: 'Edge Function',
            };

            // Only add sender_contact_id if we have a contact for the sender
            if (senderContactId) {
              emailRecord.sender_contact_id = senderContactId;
            }

            const { data: newEmail, error: insertEmailError } = await supabase
              .from('emails')
              .insert(emailRecord)
              .select('email_id')
              .single();

            if (insertEmailError) {
              log('ERROR', 'Failed to create email record', insertEmailError);
              errors.push({ step: 'create_email', error: insertEmailError });
              crmSaveSuccess = false;
            } else {
              emailId = newEmail.email_id;
              log('EMAIL_RECORD', 'Created email record', { emailId, direction });
            }
          }
        } catch (emailError) {
          log('ERROR', 'Email operation failed', emailError.message);
          errors.push({ step: 'email', error: emailError.message });
          crmSaveSuccess = false;
        }

        // 4. Create email_participants for contacts in CRM
        if (emailId) {
          try {
            // Collect all participants with their roles
            const participants = [];

            // From (sender)
            if (senderContactId) {
              participants.push({ contact_id: senderContactId, participant_type: 'sender' });
            }

            // To recipients
            const toRecipients = email.to_recipients || [];
            for (const recipient of toRecipients) {
              const recipientContact = emailContacts.find(p =>
                p.email?.toLowerCase() === recipient.email?.toLowerCase()
              );
              if (recipientContact?.contact?.contact_id) {
                participants.push({
                  contact_id: recipientContact.contact.contact_id,
                  participant_type: 'to'
                });
              }
            }

            // CC recipients
            const ccRecipients = email.cc_recipients || [];
            for (const recipient of ccRecipients) {
              const recipientContact = emailContacts.find(p =>
                p.email?.toLowerCase() === recipient.email?.toLowerCase()
              );
              if (recipientContact?.contact?.contact_id) {
                participants.push({
                  contact_id: recipientContact.contact.contact_id,
                  participant_type: 'cc'
                });
              }
            }

            log('PARTICIPANTS', `Found ${participants.length} participants in CRM`, participants);

            // Insert participants (skip if already exists)
            for (const participant of participants) {
              const { data: existing } = await supabase
                .from('email_participants')
                .select('participant_id')
                .eq('email_id', emailId)
                .eq('contact_id', participant.contact_id)
                .maybeSingle();

              if (!existing) {
                const { error: insertParticipantError } = await supabase
                  .from('email_participants')
                  .insert({
                    email_id: emailId,
                    contact_id: participant.contact_id,
                    participant_type: participant.participant_type,
                  });

                if (insertParticipantError) {
                  log('WARNING', 'Failed to insert participant', { ...participant, error: insertParticipantError });
                }
              }
            }
            log('PARTICIPANTS', 'Participants processed');
          } catch (participantError) {
            log('ERROR', 'Participant operation failed', participantError.message);
            errors.push({ step: 'participants', error: participantError.message });
          }
        }

        // 5. Create interactions for contacts (not me)
        if (emailThreadId) {
          try {
            const isSentByMe = senderEmail === MY_EMAIL;

            for (const contactEntry of contactsInThread) {
              const contactId = contactEntry.contact?.contact_id;
              if (!contactId) continue;

              // Check if interaction already exists for this thread and contact
              const { data: existingInteraction } = await supabase
                .from('interactions')
                .select('interaction_id')
                .eq('contact_id', contactId)
                .eq('email_thread_id', emailThreadId)
                .maybeSingle();

              if (existingInteraction) {
                log('INTERACTION', `Interaction already exists for contact ${contactEntry.email}`,
                  { interactionId: existingInteraction.interaction_id });
                continue;
              }

              // Determine direction from contact's perspective
              // If I sent it -> contact received it -> direction is 'sent' (from me)
              // If contact sent it -> I received it -> direction is 'received' (from them)
              const direction = isSentByMe ? 'sent' : 'received';

              const { data: newInteraction, error: interactionError } = await supabase
                .from('interactions')
                .insert({
                  contact_id: contactId,
                  interaction_type: 'email',
                  direction: direction,
                  interaction_date: email.date,
                  email_thread_id: emailThreadId,
                  summary: email.subject || email.snippet?.substring(0, 100),
                })
                .select('interaction_id')
                .single();

              if (interactionError) {
                log('WARNING', `Failed to create interaction for ${contactEntry.email}`, interactionError);
              } else {
                log('INTERACTION', `Created interaction for ${contactEntry.email}`,
                  { interactionId: newInteraction.interaction_id, direction });
              }
            }
          } catch (interactionError) {
            log('ERROR', 'Interaction operation failed', interactionError.message);
            errors.push({ step: 'interactions', error: interactionError.message });
          }
        }

        // 6. Link thread to contacts via contact_email_threads
        if (emailThreadId) {
          try {
            for (const contactEntry of contactsInThread) {
              const contactId = contactEntry.contact?.contact_id;
              if (!contactId) continue;

              const { data: existing } = await supabase
                .from('contact_email_threads')
                .select('contact_id')
                .eq('contact_id', contactId)
                .eq('email_thread_id', emailThreadId)
                .maybeSingle();

              if (!existing) {
                const { error: linkError } = await supabase
                  .from('contact_email_threads')
                  .insert({ contact_id: contactId, email_thread_id: emailThreadId });

                if (linkError) {
                  log('WARNING', `Failed to link thread to contact ${contactEntry.email}`, linkError);
                }
              }
            }
            log('THREAD_LINKS', 'Thread linked to contacts');
          } catch (linkError) {
            log('ERROR', 'Thread link operation failed', linkError.message);
            errors.push({ step: 'thread_links', error: linkError.message });
          }
        }

        // 7. Update last_interaction_at on contacts
        try {
          for (const contactEntry of contactsInThread) {
            const contactId = contactEntry.contact?.contact_id;
            if (!contactId) continue;

            // Only update if this email is newer than current last_interaction_at
            const { error: updateError } = await supabase
              .from('contacts')
              .update({
                last_interaction_at: email.date,
                last_modified_at: new Date().toISOString(),
                last_modified_by: 'Edge Function'
              })
              .eq('contact_id', contactId)
              .or(`last_interaction_at.is.null,last_interaction_at.lt.${email.date}`);

            if (updateError) {
              log('WARNING', `Failed to update last_interaction_at for ${contactEntry.email}`, updateError);
            }
          }
          log('CONTACTS_UPDATE', 'Updated last_interaction_at for contacts');
        } catch (updateError) {
          log('ERROR', 'Contact update operation failed', updateError.message);
          errors.push({ step: 'contacts_update', error: updateError.message });
        }

        // Only proceed with archive and cleanup if CRM save was successful
        if (crmSaveSuccess) {
          // 8. Archive in Fastmail
          try {
            const archiveSuccess = await archiveInFastmail(email.fastmail_id);
            if (archiveSuccess) {
              log('FASTMAIL', 'Archived in Fastmail', { fastmail_id: email.fastmail_id });
            } else {
              log('WARNING', 'Failed to archive in Fastmail', { fastmail_id: email.fastmail_id });
            }
          } catch (archiveError) {
            log('ERROR', 'Fastmail archive failed', archiveError.message);
            errors.push({ step: 'fastmail_archive', error: archiveError.message });
          }

          // 9. Remove from command_center_inbox OR update status if keeping in inbox
          const keepStatus = pendingInboxStatusRef.current;
          try {
            if (keepStatus) {
              // Keep in inbox but update status
              const { error: updateError } = await supabase
                .from('command_center_inbox')
                .update({ status: keepStatus })
                .eq('id', email.id);

              if (updateError) {
                log('ERROR', 'Failed to update status in command_center_inbox', updateError);
                errors.push({ step: 'update_inbox_status', error: updateError });
              } else {
                log('STATUS_UPDATE', `Updated status to '${keepStatus}' in command_center_inbox`, { id: email.id });
              }
            } else {
              // Normal flow - delete from inbox
              const { error: deleteError } = await supabase
                .from('command_center_inbox')
                .delete()
                .eq('id', email.id);

              if (deleteError) {
                log('ERROR', 'Failed to delete from command_center_inbox', deleteError);
                errors.push({ step: 'delete_inbox', error: deleteError });
              } else {
                log('CLEANUP', 'Removed from command_center_inbox', { id: email.id });
              }
            }
          } catch (opError) {
            log('ERROR', 'Inbox operation failed', opError.message);
            errors.push({ step: 'inbox_operation', error: opError.message });
          }

          // Track this email as successfully saved
          successfullySavedEmails.push(email.id);
        } else {
          log('SKIP_ARCHIVE', 'Skipping archive/cleanup due to CRM save failure', { emailId: email.id });
        }
      }

      // Update local state based on whether we're keeping with status or removing
      const keepStatus = pendingInboxStatusRef.current;
      if (successfullySavedEmails.length > 0) {
        const processedIds = new Set(successfullySavedEmails);

        // Find current thread index BEFORE modifying state
        const currentThreadId = selectedThread[0]?.thread_id;
        const currentThreadIndex = threads.findIndex(t => t.emails[0]?.thread_id === currentThreadId);

        if (keepStatus) {
          // Update status in local state instead of removing
          setEmails(prev => prev.map(e =>
            processedIds.has(e.id) ? { ...e, status: keepStatus } : e
          ));
          setThreads(prev => prev.map(t => ({
            ...t,
            emails: t.emails.map(e =>
              processedIds.has(e.id) ? { ...e, status: keepStatus } : e
            ),
            status: t.emails.some(e => processedIds.has(e.id)) ? keepStatus : t.status
          })));
          // Select next thread (same position in updated list)
          const nextIndex = Math.min(currentThreadIndex, threads.length - 2);
          if (nextIndex >= 0 && threads[nextIndex + 1]) {
            setSelectedThread(threads[nextIndex + 1].emails);
          } else if (nextIndex > 0 && threads[nextIndex - 1]) {
            setSelectedThread(threads[nextIndex - 1].emails);
          } else {
            setSelectedThread(null);
          }
          log('STATE_UPDATE', `Updated status to '${keepStatus}' for ${successfullySavedEmails.length} emails in local state`);
        } else {
          // Normal flow - remove from local state
          setEmails(prev => prev.filter(e => !processedIds.has(e.id)));

          // Calculate remaining threads to select next
          const remainingThreads = threads.map(t => ({
            ...t,
            emails: t.emails.filter(e => !processedIds.has(e.id))
          })).filter(t => t.emails.length > 0);

          setThreads(prev => {
            const updated = prev.map(t => ({
              ...t,
              emails: t.emails.filter(e => !processedIds.has(e.id)),
              count: t.emails.filter(e => !processedIds.has(e.id)).length
            })).filter(t => t.emails.length > 0);
            return updated.map(t => ({
              ...t,
              latestEmail: t.emails[0]
            }));
          });

          // Select next thread (the one that takes current position)
          if (remainingThreads.length > 0) {
            const nextIndex = Math.min(currentThreadIndex, remainingThreads.length - 1);
            setSelectedThread(remainingThreads[nextIndex].emails);
          } else {
            setSelectedThread(null);
          }
          log('STATE_UPDATE', `Removed ${successfullySavedEmails.length} emails from local state`);
        }
      } else {
        log('STATE_UPDATE', 'No emails were successfully saved - keeping all in local state');
      }

      // Clear the pending status ref
      pendingInboxStatusRef.current = null;

      log('COMPLETE', `Finished with ${errors.length} errors, ${successfullySavedEmails.length} saved`);

      if (successfullySavedEmails.length === 0) {
        toast.error('Failed to save - emails not archived');
      } else if (errors.length > 0) {
        const action = keepStatus ? `moved to '${keepStatus}'` : 'archived';
        toast.success(`Saved & ${action} ${successfullySavedEmails.length} emails (${errors.length} warnings)`);
      } else {
        const action = keepStatus ? `Saved & moved to '${keepStatus}'` : 'Saved & Archived';
        toast.success(`${action} successfully`);
      }

    } catch (error) {
      log('FATAL', 'Unexpected error', error.message);
      errors.push({ step: 'fatal', error: error.message });
      toast.error('Failed to Save & Archive');
    } finally {
      setSaving(false);
    }
  };

  // ASYNC Save & Archive - DB update is sync (safe), backend is async (fast)
  const saveAndArchiveAsync = async () => {
    if (!selectedThread || selectedThread.length === 0) return;

    // Capture state at time of click (before any updates)
    const threadToProcess = [...selectedThread];
    const emailIds = threadToProcess.map(e => e.id);
    const keepStatus = pendingInboxStatusRef.current;
    const currentThreadId = threadToProcess[0]?.thread_id;
    const currentThreadIndex = threads.findIndex(t => t.emails[0]?.thread_id === currentThreadId);

    // Get contacts to pass to backend (excluding me)
    const contactsToProcess = emailContacts
      .filter(p => p.contact?.contact_id && p.email?.toLowerCase() !== MY_EMAIL)
      .map(p => ({
        email: p.email,
        contact_id: p.contact.contact_id,
        first_name: p.contact.first_name,
        last_name: p.contact.last_name
      }));

    // Clear pending status ref early
    pendingInboxStatusRef.current = null;

    // 1. SYNC: Update DB status to 'archiving' (fast ~200ms, ensures consistency)
    const { error: updateError } = await supabase
      .from('command_center_inbox')
      .update({ status: 'archiving' })
      .in('id', emailIds);

    if (updateError) {
      console.error('Failed to set archiving status:', updateError);
      toast.error('Failed to archive');
      return;
    }

    // 2. Update local state
    setEmails(prev => prev.map(e =>
      emailIds.includes(e.id) ? { ...e, status: 'archiving' } : e
    ));
    setThreads(prev => prev.map(t => ({
      ...t,
      emails: t.emails.map(e =>
        emailIds.includes(e.id) ? { ...e, status: 'archiving' } : e
      ),
      status: t.emails.some(e => emailIds.includes(e.id)) ? 'archiving' : t.status
    })));

    // 3. Select next thread
    const remainingInboxThreads = threads.filter(t =>
      !t.emails.some(e => emailIds.includes(e.id)) && t.status !== 'archiving'
    );

    if (remainingInboxThreads.length > 0) {
      const nextIndex = Math.min(currentThreadIndex, remainingInboxThreads.length - 1);
      setSelectedThread(remainingInboxThreads[nextIndex].emails);
    } else {
      setSelectedThread(null);
    }

    // 4. ASYNC: Call backend for full processing (non-blocking)
    fetch(`${BACKEND_URL}/email/save-and-archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadData: threadToProcess,
        contactsData: contactsToProcess,
        keepStatus: keepStatus
      })
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Backend processing failed');
      }

      // SUCCESS: Remove from local state (backend deleted from DB)
      setEmails(prev => prev.filter(e => !emailIds.includes(e.id)));
      setThreads(prev => prev
        .map(t => ({
          ...t,
          emails: t.emails.filter(e => !emailIds.includes(e.id)),
          count: t.emails.filter(e => !emailIds.includes(e.id)).length
        }))
        .filter(t => t.emails.length > 0)
        .map(t => ({ ...t, latestEmail: t.emails[0] }))
      );

      const action = keepStatus ? `Saved & moved to '${keepStatus}'` : 'Saved & Archived';
      toast.success(`${action} successfully`);
    })
    .catch(async (error) => {
      console.error('Archive backend error:', error);
      toast.error(`Archive failed: ${error.message}`);

      // ROLLBACK: Move back to Inbox (DB has reliable 'archiving' status to rollback from)
      const { error: rollbackError } = await supabase
        .from('command_center_inbox')
        .update({ status: null })
        .in('id', emailIds);

      if (rollbackError) {
        console.error('Rollback failed:', rollbackError);
        toast.error('Please refresh the page');
      } else {
        // Update local state back to inbox
        setEmails(prev => prev.map(e =>
          emailIds.includes(e.id) ? { ...e, status: null } : e
        ));
        setThreads(prev => prev.map(t => ({
          ...t,
          emails: t.emails.map(e =>
            emailIds.includes(e.id) ? { ...e, status: null } : e
          ),
          status: t.emails.some(e => emailIds.includes(e.id)) ? null : t.status
        })));
      }
    });
  };

  // Update status of selected thread/chat (for Need Actions / Waiting Input)
  const updateItemStatus = async (newStatus) => {
    if (activeTab === 'email' && selectedThread?.length > 0) {
      const ids = selectedThread.map(e => e.id);
      const { error } = await supabase
        .from('command_center_inbox')
        .update({ status: newStatus })
        .in('id', ids);

      if (error) {
        toast.error('Failed to update status');
        console.error('Error updating status:', error);
      } else {
        toast.success(`Moved to ${newStatus === 'need_actions' ? 'Need Actions' : 'Waiting Input'}`);
        // Refresh threads to reflect new status
        refreshThreads();
      }
    } else if (activeTab === 'whatsapp' && selectedWhatsappChat) {
      const ids = selectedWhatsappChat.messages.map(m => m.id);
      const { error } = await supabase
        .from('command_center_inbox')
        .update({ status: newStatus })
        .in('id', ids);

      if (error) {
        toast.error('Failed to update status');
        console.error('Error updating status:', error);
      } else {
        toast.success(`Moved to ${newStatus === 'need_actions' ? 'Need Actions' : 'Waiting Input'}`);
        // Refresh WhatsApp chats
        setWhatsappChats(prev => prev.map(chat =>
          chat.chat_id === selectedWhatsappChat.chat_id
            ? { ...chat, status: newStatus }
            : chat
        ));
      }
    }
  };

  // Mark as spam - block email or domain, archive in Fastmail, and delete from Supabase
  const markAsSpam = async (type) => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const emailAddr = latestEmail.from_email?.toLowerCase();
    const domain = emailAddr?.split('@')[1];

    try {
      let deletedCount = 0;

      if (type === 'email') {
        // Check if email already in spam list
        const { data: existingArr } = await supabase
          .from('emails_spam')
          .select('counter')
          .eq('email', emailAddr);

        const existing = existingArr?.[0];
        if (existing) {
          // Increment counter
          const { error: spamError } = await supabase
            .from('emails_spam')
            .update({
              counter: existing.counter + 1,
              last_modified_at: new Date().toISOString()
            })
            .eq('email', emailAddr);

          if (spamError) {
            console.error('Spam update error:', spamError);
            throw spamError;
          }
        } else {
          // Insert new
          const { error: spamError } = await supabase.from('emails_spam').insert({
            email: emailAddr,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString(),
          });

          if (spamError) {
            console.error('Spam insert error:', spamError);
            throw spamError;
          }
        }

        // Get all emails from this sender (need fastmail_id for archiving)
        const { data: emailsToDelete, error: fetchError } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', emailAddr);

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }

        // Archive each email in Fastmail
        for (const email of emailsToDelete || []) {
          if (email.fastmail_id) {
            await archiveInFastmail(email.fastmail_id);
          }
        }

        // Delete ALL emails from this sender in Supabase
        const { data: deleted, error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', emailAddr)
          .select('id');

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw deleteError;
        }

        deletedCount = deleted?.length || 0;
        console.log('Deleted emails:', deleted);

        // Update local state - remove all emails from this sender
        const idsToRemove = new Set(deleted?.map(e => e.id) || []);
        setEmails(prev => prev.filter(e => !idsToRemove.has(e.id)));
        setThreads(prev => {
          const updated = prev.map(t => ({
            ...t,
            emails: t.emails.filter(e => !idsToRemove.has(e.id)),
            count: t.emails.filter(e => !idsToRemove.has(e.id)).length
          })).filter(t => t.emails.length > 0);

          // Update latestEmail for remaining threads
          return updated.map(t => ({
            ...t,
            latestEmail: t.emails[0]
          }));
        });

        toast.success(`Blocked ${emailAddr} - archived & deleted ${deletedCount} emails`);
      } else {
        // Check if domain already in spam list
        const { data: existingDomainArr } = await supabase
          .from('domains_spam')
          .select('counter')
          .eq('domain', domain);

        const existing = existingDomainArr?.[0];
        if (existing) {
          // Increment counter
          const { error: spamError } = await supabase
            .from('domains_spam')
            .update({
              counter: existing.counter + 1,
              last_modified_at: new Date().toISOString()
            })
            .eq('domain', domain);

          if (spamError) {
            console.error('Domain spam update error:', spamError);
            throw spamError;
          }
        } else {
          // Insert new
          const { error: spamError } = await supabase.from('domains_spam').insert({
            domain: domain,
            counter: 1,
            created_at: new Date().toISOString(),
          });

          if (spamError) {
            console.error('Domain spam insert error:', spamError);
            throw spamError;
          }
        }

        // Get all emails from this domain (need fastmail_id for archiving)
        const { data: emailsToDelete, error: fetchError } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', `%@${domain}`);

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }

        // Archive each email in Fastmail
        for (const email of emailsToDelete || []) {
          if (email.fastmail_id) {
            await archiveInFastmail(email.fastmail_id);
          }
        }

        // Delete ALL emails from this domain in Supabase
        const { data: deleted, error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', `%@${domain}`)
          .select('id');

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw deleteError;
        }

        deletedCount = deleted?.length || 0;
        console.log('Deleted emails:', deleted);

        // Update local state - remove all emails from this domain
        const idsToRemove = new Set(deleted?.map(e => e.id) || []);
        setEmails(prev => prev.filter(e => !idsToRemove.has(e.id)));
        setThreads(prev => {
          const updated = prev.map(t => ({
            ...t,
            emails: t.emails.filter(e => !idsToRemove.has(e.id)),
            count: t.emails.filter(e => !idsToRemove.has(e.id)).length
          })).filter(t => t.emails.length > 0);

          return updated.map(t => ({
            ...t,
            latestEmail: t.emails[0]
          }));
        });

        toast.success(`Blocked @${domain} - archived & deleted ${deletedCount} emails`);
      }

      // Clear selection if current thread was deleted
      setSelectedThread(prev => {
        if (!prev) return null;
        const remaining = prev.filter(e =>
          type === 'email'
            ? e.from_email?.toLowerCase() !== emailAddr
            : !e.from_email?.toLowerCase().endsWith(`@${domain}`)
        );
        return remaining.length > 0 ? remaining : null;
      });

      setSpamMenuOpen(false);
    } catch (error) {
      console.error('Spam error:', error);
      toast.error('Failed to mark as spam');
    }
  };

  // Delete single email (without blocking)
  const deleteEmail = async () => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    try {
      // Archive in Fastmail first
      if (latestEmail.fastmail_id) {
        await archiveInFastmail(latestEmail.fastmail_id);
      }

      const { error } = await supabase
        .from('command_center_inbox')
        .delete()
        .eq('id', latestEmail.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete email: ' + error.message);
        return;
      }

      // Update local state
      if (selectedThread.length === 1) {
        setThreads(prev => prev.filter(t => t.threadId !== (latestEmail.thread_id || latestEmail.id)));
        setSelectedThread(null);
      } else {
        const newThread = selectedThread.filter(e => e.id !== latestEmail.id);
        setSelectedThread(newThread);
        setThreads(prev => prev.map(t =>
          t.threadId === (latestEmail.thread_id || latestEmail.id)
            ? { ...t, emails: newThread, latestEmail: newThread[0], count: newThread.length }
            : t
        ));
      }

      setEmails(prev => prev.filter(e => e.id !== latestEmail.id));
      toast.success('Email deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete email');
    }
  };

  // Download email attachment via backend proxy
  const handleDownloadAttachment = async (att) => {
    try {
      toast.loading('Downloading...', { id: 'download' });
      const url = `${BACKEND_URL}/attachment/${encodeURIComponent(att.blobId)}?name=${encodeURIComponent(att.name || 'attachment')}&type=${encodeURIComponent(att.type || 'application/octet-stream')}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = att.name || 'attachment';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast.success('Downloaded!', { id: 'download' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download', { id: 'download' });
    }
  };

  return {
    // State
    saving,
    setSaving,
    pendingInboxStatusRef,
    attachmentModalOpen,
    setAttachmentModalOpen,
    pendingAttachments,
    setPendingAttachments,
    saveAndArchiveCallback,
    setSaveAndArchiveCallback,
    spamMenuOpen,
    setSpamMenuOpen,

    // Handlers
    archiveInFastmail,
    shouldSkipAttachment,
    handleDoneClick,
    handleAttachmentModalClose,
    handleImportCalendarInvitation,
    isCalendarInvitation,
    handleSendWithAttachmentCheck,
    saveAndArchive,
    saveAndArchiveAsync,
    updateItemStatus,
    markAsSpam,
    deleteEmail,
    handleDownloadAttachment,
  };
};

export default useEmailActions;
