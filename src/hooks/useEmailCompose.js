import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const EMAIL_SIGNATURE = `

--
SIMONE CIMMINELLI
Newsletter: https://www.angelinvesting.it/
Website: https://www.cimminelli.com/
LinkedIn: https://www.linkedin.com/in/cimminelli/

Build / Buy / Invest in
internet businesses.`;

/**
 * Custom hook for email compose functionality
 * Handles composing, replying, forwarding, and sending emails
 */
const useEmailCompose = (selectedThread, onSendSuccess) => {
  // Modal state
  const [composeModal, setComposeModal] = useState({ open: false, mode: null }); // mode: 'reply', 'replyAll', 'forward'

  // Recipients
  const [composeTo, setComposeTo] = useState([]); // Array of { email, name }
  const [composeCc, setComposeCc] = useState([]); // Array of { email, name }
  const [composeToInput, setComposeToInput] = useState('');
  const [composeCcInput, setComposeCcInput] = useState('');

  // Content
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Autocomplete
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null); // 'to' or 'cc'

  // Sending state
  const [sending, setSending] = useState(false);

  // Attachments
  const [composeAttachments, setComposeAttachments] = useState([]);
  const composeFileInputRef = useRef(null);

  // Helper: get latest email in thread
  const getLatestEmail = useCallback(() => {
    if (!selectedThread || selectedThread.length === 0) return null;
    return selectedThread[0];
  }, [selectedThread]);

  // Helper: format recipients array to string
  const formatRecipients = useCallback((recipients) => {
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) return null;
    return recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(', ');
  }, []);

  // Search contacts for autocomplete
  const searchContacts = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setContactSuggestions([]);
      return;
    }

    try {
      // Search by email directly in contact_emails table
      const { data: emailMatches, error: emailError } = await supabase
        .from('contact_emails')
        .select(`
          email,
          contacts (
            contact_id,
            first_name,
            last_name,
            profile_image_url
          )
        `)
        .ilike('email', `%${query}%`)
        .limit(8);

      if (emailError) throw emailError;

      // Also search by name in contacts and get their emails
      const { data: nameMatches, error: nameError } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          profile_image_url,
          contact_emails (email)
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(8);

      if (nameError) throw nameError;

      // Transform email matches to flat structure
      const emailSuggestions = (emailMatches || [])
        .filter(item => item.contacts)
        .map(item => ({
          id: item.contacts.contact_id,
          first_name: item.contacts.first_name,
          last_name: item.contacts.last_name,
          email: item.email,
          profile_image_url: item.contacts.profile_image_url
        }));

      // Transform name matches - expand to one entry per email
      const nameSuggestions = (nameMatches || []).flatMap(contact => {
        const emails = contact.contact_emails || [];
        if (emails.length === 0) return [];
        return emails.map(e => ({
          id: contact.contact_id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: e.email,
          profile_image_url: contact.profile_image_url
        }));
      });

      // Combine and deduplicate by email
      const allSuggestions = [...emailSuggestions, ...nameSuggestions];
      const uniqueByEmail = allSuggestions.filter((item, index, self) =>
        index === self.findIndex(t => t.email === item.email)
      );

      setContactSuggestions(uniqueByEmail.slice(0, 8));
    } catch (error) {
      console.error('Error searching contacts:', error);
      setContactSuggestions([]);
    }
  }, []);

  // Add email to To or CC
  const addEmailToField = useCallback((field, contact) => {
    const email = typeof contact === 'string' ? contact : contact.email;
    const name = typeof contact === 'string' ? '' : `${contact.first_name || ''} ${contact.last_name || ''}`.trim();

    if (field === 'to') {
      setComposeTo(prev => {
        if (prev.find(r => r.email.toLowerCase() === email.toLowerCase())) return prev;
        return [...prev, { email, name }];
      });
      setComposeToInput('');
    } else {
      setComposeCc(prev => {
        if (prev.find(r => r.email.toLowerCase() === email.toLowerCase())) return prev;
        return [...prev, { email, name }];
      });
      setComposeCcInput('');
    }
    setContactSuggestions([]);
  }, []);

  // Remove email from To or CC
  const removeEmailFromField = useCallback((field, email) => {
    if (field === 'to') {
      setComposeTo(prev => prev.filter(r => r.email !== email));
    } else {
      setComposeCc(prev => prev.filter(r => r.email !== email));
    }
  }, []);

  // Handle input keydown for adding emails
  const handleEmailInputKeyDown = useCallback((e, field) => {
    const input = field === 'to' ? composeToInput : composeCcInput;

    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      const trimmed = input.trim().replace(/,$/, '');
      if (trimmed && trimmed.includes('@')) {
        addEmailToField(field, trimmed);
      }
    } else if (e.key === 'Backspace' && !input) {
      // Remove last email if backspace on empty input
      if (field === 'to') {
        setComposeTo(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
      } else {
        setComposeCc(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
      }
    }
  }, [composeToInput, composeCcInput, addEmailToField]);

  // Open compose modal for reply
  const openReply = useCallback((replyAll = false) => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const mode = replyAll ? 'replyAll' : 'reply';
    const myEmail = 'simone@cimminelli.com';
    const isSentByMe = latestEmail.from_email?.toLowerCase() === myEmail.toLowerCase();

    // Determine To recipients as array
    let toRecipients = [];
    if (isSentByMe && latestEmail.to_recipients?.length > 0) {
      // If I sent it, reply to original recipients
      toRecipients = latestEmail.to_recipients.map(r => ({ email: r.email, name: r.name || '' }));
    } else {
      toRecipients = [{ email: latestEmail.from_email, name: latestEmail.from_name || '' }];
    }

    // Get CC recipients for Reply All (excluding myself)
    let ccRecipients = [];
    if (replyAll) {
      // Add other TO recipients (excluding myself and the sender who goes in TO)
      if (!isSentByMe && latestEmail.to_recipients?.length > 0) {
        const otherToRecipients = latestEmail.to_recipients
          .filter(r => r.email?.toLowerCase() !== myEmail.toLowerCase())
          .map(r => ({ email: r.email, name: r.name || '' }));
        ccRecipients = [...ccRecipients, ...otherToRecipients];
      }
      // Add original CC recipients
      if (latestEmail.cc_recipients?.length > 0) {
        const originalCcRecipients = latestEmail.cc_recipients
          .filter(r => r.email?.toLowerCase() !== myEmail.toLowerCase())
          .map(r => ({ email: r.email, name: r.name || '' }));
        ccRecipients = [...ccRecipients, ...originalCcRecipients];
      }
    }

    const subject = latestEmail.subject?.startsWith('Re:')
      ? latestEmail.subject
      : `Re: ${latestEmail.subject}`;

    setComposeTo(toRecipients);
    setComposeCc(ccRecipients);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject(subject);
    setComposeBody('\n\n' + EMAIL_SIGNATURE + '\n\n' + '─'.repeat(40) + '\n' +
      `On ${new Date(latestEmail.date).toLocaleString()}, ${latestEmail.from_name || latestEmail.from_email} wrote:\n\n` +
      (latestEmail.body_text || latestEmail.snippet || ''));
    setComposeModal({ open: true, mode });
  }, [getLatestEmail]);

  // Open reply modal with AI-drafted text
  const openReplyWithDraft = useCallback((draftText) => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const myEmail = 'simone@cimminelli.com';
    const isSentByMe = latestEmail.from_email?.toLowerCase() === myEmail.toLowerCase();

    // Determine To recipients as array
    let toRecipients = [];
    if (isSentByMe && latestEmail.to_recipients?.length > 0) {
      toRecipients = latestEmail.to_recipients.map(r => ({ email: r.email, name: r.name || '' }));
    } else {
      toRecipients = [{ email: latestEmail.from_email, name: latestEmail.from_name || '' }];
    }

    // Get CC recipients (including other TO recipients and original CC, excluding myself)
    let ccRecipients = [];
    // Add other TO recipients (excluding myself and the sender who goes in TO)
    if (!isSentByMe && latestEmail.to_recipients?.length > 0) {
      const otherToRecipients = latestEmail.to_recipients
        .filter(r => r.email?.toLowerCase() !== myEmail.toLowerCase())
        .map(r => ({ email: r.email, name: r.name || '' }));
      ccRecipients = [...ccRecipients, ...otherToRecipients];
    }
    // Add original CC recipients
    if (latestEmail.cc_recipients?.length > 0) {
      const originalCcRecipients = latestEmail.cc_recipients
        .filter(r => r.email?.toLowerCase() !== myEmail.toLowerCase())
        .map(r => ({ email: r.email, name: r.name || '' }));
      ccRecipients = [...ccRecipients, ...originalCcRecipients];
    }

    const subject = latestEmail.subject?.startsWith('Re:')
      ? latestEmail.subject
      : `Re: ${latestEmail.subject}`;

    setComposeTo(toRecipients);
    setComposeCc(ccRecipients);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject(subject);
    setComposeBody(draftText + '\n\n' + EMAIL_SIGNATURE + '\n\n' + '─'.repeat(40) + '\n' +
      `On ${new Date(latestEmail.date).toLocaleString()}, ${latestEmail.from_name || latestEmail.from_email} wrote:\n\n` +
      (latestEmail.body_text || latestEmail.snippet || ''));
    setComposeModal({ open: true, mode: 'reply' });
  }, [getLatestEmail]);

  // Open compose modal for forward
  const openForward = useCallback(() => {
    const latestEmail = getLatestEmail();
    if (!latestEmail) return;

    const subject = latestEmail.subject?.startsWith('Fwd:')
      ? latestEmail.subject
      : `Fwd: ${latestEmail.subject}`;

    setComposeTo([]);
    setComposeCc([]);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject(subject);
    setComposeBody('\n\n' + EMAIL_SIGNATURE + '\n\n' + '─'.repeat(40) + '\n' +
      `---------- Forwarded message ----------\n` +
      `From: ${latestEmail.from_name || ''} <${latestEmail.from_email}>\n` +
      `Date: ${new Date(latestEmail.date).toLocaleString()}\n` +
      `Subject: ${latestEmail.subject}\n` +
      `To: ${formatRecipients(latestEmail.to_recipients) || ''}\n\n` +
      (latestEmail.body_text || latestEmail.snippet || ''));
    setComposeModal({ open: true, mode: 'forward' });
  }, [getLatestEmail, formatRecipients]);

  // Close compose modal
  const closeCompose = useCallback(() => {
    setComposeModal({ open: false, mode: null });
    setComposeTo([]);
    setComposeCc([]);
    setComposeToInput('');
    setComposeCcInput('');
    setComposeSubject('');
    setComposeBody('');
    setContactSuggestions([]);
    setActiveField(null);
    setComposeAttachments([]);
  }, []);

  // Handle file selection for attachments
  const handleComposeFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newAttachments = await Promise.all(files.map(async (file) => {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove data:xxx;base64, prefix
        reader.readAsDataURL(file);
      });
      return {
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        data: base64,
      };
    }));

    setComposeAttachments(prev => [...prev, ...newAttachments]);
    // Reset input so same file can be selected again
    if (composeFileInputRef.current) {
      composeFileInputRef.current.value = '';
    }
  }, []);

  // Remove attachment
  const removeComposeAttachment = useCallback((index) => {
    setComposeAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Send email (with optional body override for AI draft feature)
  const handleSend = useCallback(async (bodyOverride = null) => {
    const bodyToUse = bodyOverride || composeBody;

    if (composeTo.length === 0 || !bodyToUse.trim()) {
      toast.error('Please fill in recipient and message');
      return;
    }

    const latestEmail = getLatestEmail();
    if (!latestEmail) {
      toast.error('No email selected');
      return;
    }

    setSending(true);

    try {
      // Get just the body text (before the quote separator)
      const bodyText = bodyToUse.split('─'.repeat(40))[0].trim();

      // Use /send endpoint directly for full control
      const response = await fetch(`${BACKEND_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: composeTo,
          cc: composeCc.length > 0 ? composeCc : undefined,
          subject: composeSubject,
          textBody: bodyText,
          inReplyTo: composeModal.mode !== 'forward' ? latestEmail.fastmail_id : undefined,
          references: composeModal.mode !== 'forward' ? latestEmail.fastmail_id : undefined,
          attachments: composeAttachments.length > 0 ? composeAttachments.map(a => ({
            name: a.name,
            type: a.type,
            data: a.data,
          })) : undefined,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      toast.success('Email sent! Saving to CRM and archiving...');
      closeCompose();

      // Call success callback (e.g., saveAndArchive)
      if (onSendSuccess) {
        await onSendSuccess();
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error(`Failed to send: ${error.message}`);
    } finally {
      setSending(false);
    }
  }, [composeTo, composeCc, composeSubject, composeBody, composeModal.mode, composeAttachments, getLatestEmail, closeCompose, onSendSuccess]);

  // Extract draft text from Claude's response
  const extractDraftFromMessage = useCallback((content) => {
    // Look for text between --- markers (common draft format)
    const draftMatch = content.match(/---\n([\s\S]*?)\n---/);
    if (draftMatch) {
      return draftMatch[1].trim();
    }

    // Look for Subject: followed by content
    const subjectMatch = content.match(/\*\*Subject:\*\*.*?\n\n---\n([\s\S]*?)\n---/);
    if (subjectMatch) {
      return subjectMatch[1].trim();
    }

    return null;
  }, []);

  // Check if message contains a draft reply
  const hasDraftReply = useCallback((content) => {
    return content.includes('---\n') &&
           (content.toLowerCase().includes('ciao') ||
            content.toLowerCase().includes('simone') ||
            content.toLowerCase().includes('thanks') ||
            content.toLowerCase().includes('send it?') ||
            content.toLowerCase().includes('draft'));
  }, []);

  return {
    // Modal state
    composeModal,
    setComposeModal,

    // Recipients
    composeTo,
    setComposeTo,
    composeCc,
    setComposeCc,
    composeToInput,
    setComposeToInput,
    composeCcInput,
    setComposeCcInput,

    // Content
    composeSubject,
    setComposeSubject,
    composeBody,
    setComposeBody,

    // Autocomplete
    contactSuggestions,
    setContactSuggestions,
    activeField,
    setActiveField,
    searchContacts,

    // Sending
    sending,
    setSending,

    // Attachments
    composeAttachments,
    setComposeAttachments,
    composeFileInputRef,
    handleComposeFileSelect,
    removeComposeAttachment,

    // Actions
    openReply,
    openReplyWithDraft,
    openForward,
    closeCompose,
    handleSend,
    addEmailToField,
    removeEmailFromField,
    handleEmailInputKeyDown,

    // Draft helpers
    extractDraftFromMessage,
    hasDraftReply,

    // Utility
    getLatestEmail,
    formatRecipients,
  };
};

export default useEmailCompose;
