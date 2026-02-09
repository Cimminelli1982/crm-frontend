import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaEnvelope, FaPaperPlane, FaClock, FaFileAlt, FaPlus, FaReply, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const KIT_EMAIL_SIGNATURE = `

--
SIMONE CIMMINELLI
Newsletter | Website | LinkedIn`;

/**
 * RightPanelEmailTab - Email compose and threads for right panel
 *
 * @param {Object} props
 * @param {string} props.theme - 'dark' or 'light'
 * @param {string} props.contactId - The contact ID
 * @param {Object} props.contact - Contact object with first_name, last_name
 * @param {Array} props.emails - Contact's email addresses
 * @param {Function} props.onEmailSent - Callback when email is sent
 * @param {string} props.initialSelectedEmail - Pre-selected email address
 */
const RightPanelEmailTab = ({
  theme,
  contactId,
  contact,
  emails = [],
  onEmailSent,
  initialSelectedEmail,
}) => {
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [threadParticipants, setThreadParticipants] = useState([]);

  // Compose state
  const [mode, setMode] = useState('compose'); // 'compose' | 'thread'
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [composeCc, setComposeCc] = useState([]); // Array of { email, name }
  const [composeBcc, setComposeBcc] = useState([]);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null); // 'cc' | 'bcc'
  const [sending, setSending] = useState(false);
  const [proofreading, setProofreading] = useState(false);

  // New template modal state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateSubject, setNewTemplateSubject] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Manage templates modal state
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const [manageTemplates, setManageTemplates] = useState([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null); // template object being edited
  const [deletingId, setDeletingId] = useState(null);

  // Set selectedEmail when initialSelectedEmail changes
  useEffect(() => {
    if (initialSelectedEmail) {
      setSelectedEmail(initialSelectedEmail);
    }
  }, [initialSelectedEmail]);

  // Template state
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const templateDropdownRef = useRef(null);

  // Fetch contact's email threads: COMBINE interactions + command_center_inbox
  useEffect(() => {
    const fetchThreads = async () => {
      if (!contactId) {
        setThreads([]);
        setSelectedThreadId(null);
        setSelectedThread(null);
        return;
      }

      setLoadingThreads(true);
      try {
        const threadMap = new Map();

        // 1. Get archived threads via interactions
        const { data: interactionData } = await supabase
          .from('interactions')
          .select(`
            email_thread_id,
            interaction_date,
            email_threads(email_thread_id, thread_id, subject)
          `)
          .eq('contact_id', contactId)
          .eq('interaction_type', 'email')
          .not('email_thread_id', 'is', null)
          .order('interaction_date', { ascending: false });

        (interactionData || []).forEach(d => {
          if (d.email_threads && !threadMap.has(d.email_thread_id)) {
            threadMap.set(d.email_thread_id, {
              id: d.email_threads.email_thread_id,
              thread_id: d.email_threads.thread_id,
              subject: d.email_threads.subject || '(No Subject)',
              latestDate: d.interaction_date,
              source: 'archived'
            });
          }
        });

        // 2. Get threads from command_center_inbox by email address
        if (emails.length > 0) {
          const emailAddresses = emails.map(e => e.email.toLowerCase());

          const { data: inboxData } = await supabase
            .from('command_center_inbox')
            .select('*')
            .eq('type', 'email')
            .order('date', { ascending: false });

          // Filter by email address match
          (inboxData || []).forEach(msg => {
            const fromEmail = (msg.from_email || '').toLowerCase();
            const toRecipients = (msg.to_recipients || []).map(r => (r.email || '').toLowerCase());
            const ccRecipients = (msg.cc_recipients || []).map(r => (r.email || '').toLowerCase());
            const allEmails = [fromEmail, ...toRecipients, ...ccRecipients];

            const hasMatch = emailAddresses.some(addr => allEmails.includes(addr));
            if (!hasMatch) return;

            const threadKey = msg.thread_id || msg.id;
            if (!threadMap.has(threadKey)) {
              threadMap.set(threadKey, {
                id: threadKey,
                thread_id: msg.thread_id,
                subject: msg.subject || '(No Subject)',
                latestDate: msg.date,
                source: 'inbox',
                messages: []
              });
            }
            const thread = threadMap.get(threadKey);
            thread.messages = thread.messages || [];
            thread.messages.push(msg);
            if (new Date(msg.date) > new Date(thread.latestDate || 0)) {
              thread.latestDate = msg.date;
            }
          });
        }

        // Sort by latest date
        const sortedThreads = Array.from(threadMap.values())
          .sort((a, b) => new Date(b.latestDate || 0) - new Date(a.latestDate || 0));

        setThreads(sortedThreads);

        // Start in compose mode
        setMode('compose');
        setSelectedThreadId(null);
        setSelectedThread(null);
      } catch (err) {
        console.error('Error fetching threads:', err);
        setThreads([]);
      } finally {
        setLoadingThreads(false);
      }
    };

    fetchThreads();
  }, [contactId, emails]);

  // Load messages when thread is selected (from inbox or archived)
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedThread) {
        setThreadMessages([]);
        setThreadParticipants([]);
        return;
      }

      setLoadingMessages(true);
      try {
        let messages = [];
        let participants = new Set();

        // 1. If thread has inbox messages, use them (from command_center_inbox)
        if (selectedThread.messages?.length > 0) {
          messages = selectedThread.messages.map(m => {
            // Collect participants from inbox messages
            if (m.from_email) participants.add(m.from_email);
            (m.to_recipients || []).forEach(r => r.email && participants.add(r.email));

            return {
              email_id: m.id,
              subject: m.subject,
              body_text: m.body_text || m.snippet || '',
              snippet: m.snippet,
              direction: m.direction || (m.from_email?.toLowerCase().includes('simone') ? 'sent' : 'received'),
              email_date: m.date
            };
          });
        }

        // 2. Also fetch from archived emails table by thread_id
        if (selectedThread.thread_id) {
          const { data: threadData } = await supabase
            .from('email_threads')
            .select('email_thread_id')
            .eq('thread_id', selectedThread.thread_id)
            .single();

          if (threadData?.email_thread_id) {
            // Fetch emails
            const { data: archivedData } = await supabase
              .from('emails')
              .select('email_id, subject, body_plain, direction, message_timestamp')
              .eq('email_thread_id', threadData.email_thread_id)
              .order('message_timestamp', { ascending: false });

            if (archivedData?.length > 0) {
              // Fetch participants for this thread
              const emailIds = archivedData.map(e => e.email_id);
              const { data: participantsData } = await supabase
                .from('email_participants')
                .select('contact_id')
                .in('email_id', emailIds);

              if (participantsData?.length > 0) {
                const contactIds = [...new Set(participantsData.map(p => p.contact_id))];
                const { data: contactsData } = await supabase
                  .from('contacts')
                  .select('contact_id, first_name, last_name')
                  .in('contact_id', contactIds);

                const { data: contactEmailsData } = await supabase
                  .from('contact_emails')
                  .select('contact_id, email')
                  .in('contact_id', contactIds)
                  .eq('is_primary', true);

                (contactsData || []).forEach(c => {
                  const emailRecord = contactEmailsData?.find(ce => ce.contact_id === c.contact_id);
                  const displayName = emailRecord?.email || `${c.first_name || ''} ${c.last_name || ''}`.trim();
                  if (displayName) participants.add(displayName);
                });
              }

              const archivedMapped = archivedData.map(email => ({
                email_id: email.email_id,
                subject: email.subject,
                body_text: email.body_plain,
                direction: email.direction,
                email_date: email.message_timestamp
              }));
              messages = [...messages, ...archivedMapped];
            }
          }
        }

        // Dedupe messages by email_id
        const seen = new Set();
        messages = messages.filter(m => {
          if (seen.has(m.email_id)) return false;
          seen.add(m.email_id);
          return true;
        });

        // Sort by date (newest first)
        messages.sort((a, b) => new Date(b.email_date) - new Date(a.email_date));

        setThreadMessages(messages);
        setThreadParticipants([...participants]);
      } catch (err) {
        console.error('Error loading messages:', err);
        setThreadMessages([]);
        setThreadParticipants([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedThread]);

  // Handle thread selection
  const handleThreadSelect = (threadId) => {
    if (threadId === 'compose') {
      setMode('compose');
      setSelectedThreadId(null);
      setSelectedThread(null);
    } else {
      const thread = threads.find(t => t.id === threadId);
      setMode('thread');
      setSelectedThreadId(threadId);
      setSelectedThread(thread || null);
    }
  };

  // Fetch templates
  const fetchTemplates = useCallback(async (searchTerm = '') => {
    setTemplatesLoading(true);
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .order('name');

      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
    setTemplatesLoading(false);
  }, []);

  // Search templates with debounce
  useEffect(() => {
    if (templateDropdownOpen) {
      const debounce = setTimeout(() => {
        fetchTemplates(templateSearch);
      }, 200);
      return () => clearTimeout(debounce);
    }
  }, [templateSearch, templateDropdownOpen, fetchTemplates]);

  // Close template dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target)) {
        setTemplateDropdownOpen(false);
      }
    };

    if (templateDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [templateDropdownOpen]);

  // Apply template
  const applyTemplate = (template) => {
    setSubject(template.subject || '');
    setBody(template.template_text || '');
    setTemplateDropdownOpen(false);
    setTemplateSearch('');
    toast.success(`Template "${template.name}" applied`);
  };

  // Search contacts for CC/BCC autocomplete
  const searchContacts = async (query) => {
    if (!query || query.length < 2) {
      setContactSuggestions([]);
      return;
    }
    try {
      const { data: emailMatches } = await supabase
        .from('contact_emails')
        .select('email, contacts (contact_id, first_name, last_name, profile_image_url)')
        .ilike('email', `%${query}%`)
        .limit(8);

      const { data: nameMatches } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, profile_image_url, contact_emails (email)')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(8);

      const emailSuggestions = (emailMatches || [])
        .filter(item => item.contacts)
        .map(item => ({
          id: item.contacts.contact_id,
          first_name: item.contacts.first_name,
          last_name: item.contacts.last_name,
          email: item.email,
          profile_image_url: item.contacts.profile_image_url
        }));

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

      const all = [...emailSuggestions, ...nameSuggestions];
      const unique = all.filter((item, idx, self) => idx === self.findIndex(t => t.email === item.email));
      setContactSuggestions(unique.slice(0, 8));
    } catch (error) {
      console.error('Error searching contacts:', error);
      setContactSuggestions([]);
    }
  };

  const addEmailToField = (field, contact) => {
    const email = typeof contact === 'string' ? contact : contact.email;
    const name = typeof contact === 'string' ? '' : `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    if (field === 'cc') {
      if (!composeCc.find(r => r.email.toLowerCase() === email.toLowerCase())) {
        setComposeCc([...composeCc, { email, name }]);
      }
      setCcInput('');
    } else {
      if (!composeBcc.find(r => r.email.toLowerCase() === email.toLowerCase())) {
        setComposeBcc([...composeBcc, { email, name }]);
      }
      setBccInput('');
    }
    setContactSuggestions([]);
  };

  const removeEmailFromField = (field, email) => {
    if (field === 'cc') {
      setComposeCc(composeCc.filter(r => r.email !== email));
    } else {
      setComposeBcc(composeBcc.filter(r => r.email !== email));
    }
  };

  const handleEmailInputKeyDown = (e, field) => {
    const input = field === 'cc' ? ccInput : bccInput;
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      const trimmed = input.trim().replace(/,$/, '');
      if (trimmed && trimmed.includes('@')) {
        addEmailToField(field, trimmed);
      }
    } else if (e.key === 'Backspace' && !input) {
      if (field === 'cc' && composeCc.length > 0) {
        setComposeCc(composeCc.slice(0, -1));
      } else if (field === 'bcc' && composeBcc.length > 0) {
        setComposeBcc(composeBcc.slice(0, -1));
      }
    }
  };

  // Save new template
  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Template name is required');
      return;
    }
    setSavingTemplate(true);
    try {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          name: newTemplateName.trim(),
          short_description: newTemplateDesc.trim() || null,
          subject: newTemplateSubject.trim() || null,
          template_text: newTemplateBody.trim() || null,
        });
      if (error) throw error;
      toast.success('Template saved!');
      setNewTemplateName('');
      setNewTemplateDesc('');
      setTemplateModalOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Fetch all templates for manage modal
  const fetchManageTemplates = async () => {
    setManageLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');
      if (error) throw error;
      setManageTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
    setManageLoading(false);
  };

  const openManageTemplates = () => {
    setTemplateDropdownOpen(false);
    setManageTemplatesOpen(true);
    setEditingTemplate(null);
    fetchManageTemplates();
  };

  const handleDeleteTemplate = async (templateId) => {
    setDeletingId(templateId);
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('template_id', templateId);
      if (error) throw error;
      setManageTemplates(prev => prev.filter(t => t.template_id !== templateId));
      if (editingTemplate?.template_id === templateId) setEditingTemplate(null);
      toast.success('Template deleted');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
    setDeletingId(null);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate?.name?.trim()) {
      toast.error('Template name is required');
      return;
    }
    setSavingTemplate(true);
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          name: editingTemplate.name.trim(),
          short_description: editingTemplate.short_description?.trim() || null,
          subject: editingTemplate.subject?.trim() || null,
          template_text: editingTemplate.template_text?.trim() || null,
        })
        .eq('template_id', editingTemplate.template_id);
      if (error) throw error;
      setManageTemplates(prev => prev.map(t =>
        t.template_id === editingTemplate.template_id ? { ...t, ...editingTemplate } : t
      ));
      setEditingTemplate(null);
      toast.success('Template updated');
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
    setSavingTemplate(false);
  };

  // Proofread
  const handleProofread = async () => {
    if (!body.trim() || proofreading) return;

    setProofreading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Proofread and polish this email message. Fix grammar, spelling, and awkward phrasing. Keep the same tone and intent. Return ONLY the improved message, nothing else. No quotes, no explanation.

Message:
${body.trim()}`
          }],
          systemPrompt: 'You are a helpful writing assistant. You improve email messages while keeping their original intent and tone. Keep the style professional but warm.'
        })
      });

      const data = await response.json();

      if (data.response) {
        setBody(data.response.trim());
        toast.success('Email polished!');
      }
    } catch (error) {
      console.error('Proofread error:', error);
      toast.error('Failed to proofread');
    } finally {
      setProofreading(false);
    }
  };

  // Send email
  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || sending) return;

    const toEmail = selectedEmail || (emails.length > 0 ? emails[0].email : null);
    if (!toEmail) {
      toast.error('No email address available');
      return;
    }

    const fullBody = body.trim() + KIT_EMAIL_SIGNATURE;

    setSending(true);
    try {
      const response = await fetch(`${BACKEND_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: [toEmail],
          cc: composeCc.length > 0 ? composeCc : undefined,
          bcc: composeBcc.length > 0 ? composeBcc : undefined,
          subject: subject.trim(),
          textBody: fullBody,
          skipCrmDoneStamp: true,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // Update last_interaction_at
      if (contactId) {
        await supabase
          .from('contacts')
          .update({ last_interaction_at: new Date().toISOString() })
          .eq('contact_id', contactId);
      }

      setSubject('');
      setBody('');
      setComposeCc([]);
      setComposeBcc([]);
      setCcInput('');
      setBccInput('');
      setShowCcBcc(false);
      toast.success('Email sent!');

      if (onEmailSent) {
        onEmailSent(contactId);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const canSend = subject.trim() && body.trim() && !sending && emails.length > 0;

  // No contact selected
  if (!contactId) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
        textAlign: 'center'
      }}>
        <FaEnvelope size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <div style={{ fontSize: '14px', fontWeight: 500 }}>No contact selected</div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Select a contact to compose email</div>
      </div>
    );
  }

  // Loading
  if (loadingThreads) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Thread/Compose Selector */}
      <div style={{
        padding: '12px',
        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
        background: theme === 'dark' ? '#1F2937' : '#F9FAFB'
      }}>
        <select
          value={mode === 'compose' ? 'compose' : selectedThreadId || ''}
          onChange={(e) => handleThreadSelect(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
            background: theme === 'dark' ? '#374151' : '#FFFFFF',
            color: theme === 'dark' ? '#F9FAFB' : '#111827',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <option value="compose">✏️ New Email</option>
          {threads.length > 0 && (
            <optgroup label="Recent Threads">
              {threads.slice(0, 10).map(thread => (
                <option key={thread.id} value={thread.id}>
                  📧 {thread.subject.length > 40 ? thread.subject.substring(0, 40) + '...' : thread.subject}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Compose Mode */}
      {mode === 'compose' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px' }}>
          {/* To Field */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>To</label>
            {emails.length === 0 ? (
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                background: theme === 'dark' ? '#374151' : '#F9FAFB',
                color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                fontSize: '13px',
                fontStyle: 'italic'
              }}>
                No email address
              </div>
            ) : emails.length === 1 ? (
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                background: theme === 'dark' ? '#374151' : '#F9FAFB',
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
                fontSize: '13px'
              }}>
                {emails[0].email}
              </div>
            ) : (
              <select
                value={selectedEmail || emails[0].email}
                onChange={(e) => setSelectedEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  background: theme === 'dark' ? '#374151' : '#FFFFFF',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  fontSize: '13px'
                }}
              >
                {emails.map((e, idx) => (
                  <option key={e.email_id || idx} value={e.email}>
                    {e.email}{e.is_primary ? ' (primary)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* CC/BCC toggle + fields */}
          <div style={{ marginBottom: '8px' }}>
            {!showCcBcc ? (
              <button
                type="button"
                onClick={() => setShowCcBcc(true)}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  color: '#3B82F6',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                + Cc / Bcc
              </button>
            ) : (
              <>
                {/* CC Field */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Cc</label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#FFFFFF',
                    minHeight: '34px',
                    alignItems: 'center',
                    cursor: 'text',
                    position: 'relative',
                  }} onClick={() => document.getElementById('rp-cc-input')?.focus()}>
                    {composeCc.map((r, idx) => (
                      <span key={idx} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '11px',
                        maxWidth: '180px',
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name || r.email}</span>
                        <FaTimes size={8} style={{ cursor: 'pointer', flexShrink: 0, opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); removeEmailFromField('cc', r.email); }} />
                      </span>
                    ))}
                    <input
                      id="rp-cc-input"
                      type="text"
                      value={ccInput}
                      onChange={(e) => { setCcInput(e.target.value); setActiveField('cc'); searchContacts(e.target.value); }}
                      onKeyDown={(e) => handleEmailInputKeyDown(e, 'cc')}
                      onFocus={() => setActiveField('cc')}
                      onBlur={() => setTimeout(() => { setContactSuggestions([]); setActiveField(null); }, 200)}
                      placeholder={composeCc.length === 0 ? "Search contacts..." : ""}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '12px',
                        flex: 1,
                        minWidth: '80px',
                        padding: '2px 0',
                      }}
                    />
                    {activeField === 'cc' && contactSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 100,
                        maxHeight: '180px',
                        overflowY: 'auto',
                      }}>
                        {contactSuggestions.map((c) => (
                          <div
                            key={`${c.id}-${c.email}`}
                            onMouseDown={() => addEmailToField('cc', c)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 10px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = theme === 'dark' ? '#374151' : '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                              background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 600, overflow: 'hidden',
                              color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
                            }}>
                              {c.profile_image_url
                                ? <img src={c.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : `${c.first_name?.[0] || ''}${c.last_name?.[0] || ''}`}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 500, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>{c.first_name} {c.last_name}</div>
                              <div style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* BCC Field */}
                <div>
                  <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Bcc</label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#FFFFFF',
                    minHeight: '34px',
                    alignItems: 'center',
                    cursor: 'text',
                    position: 'relative',
                  }} onClick={() => document.getElementById('rp-bcc-input')?.focus()}>
                    {composeBcc.map((r, idx) => (
                      <span key={idx} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '11px',
                        maxWidth: '180px',
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name || r.email}</span>
                        <FaTimes size={8} style={{ cursor: 'pointer', flexShrink: 0, opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); removeEmailFromField('bcc', r.email); }} />
                      </span>
                    ))}
                    <input
                      id="rp-bcc-input"
                      type="text"
                      value={bccInput}
                      onChange={(e) => { setBccInput(e.target.value); setActiveField('bcc'); searchContacts(e.target.value); }}
                      onKeyDown={(e) => handleEmailInputKeyDown(e, 'bcc')}
                      onFocus={() => setActiveField('bcc')}
                      onBlur={() => setTimeout(() => { setContactSuggestions([]); setActiveField(null); }, 200)}
                      placeholder={composeBcc.length === 0 ? "Search contacts..." : ""}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '12px',
                        flex: 1,
                        minWidth: '80px',
                        padding: '2px 0',
                      }}
                    />
                    {activeField === 'bcc' && contactSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 100,
                        maxHeight: '180px',
                        overflowY: 'auto',
                      }}>
                        {contactSuggestions.map((c) => (
                          <div
                            key={`${c.id}-${c.email}`}
                            onMouseDown={() => addEmailToField('bcc', c)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 10px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = theme === 'dark' ? '#374151' : '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                              background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 600, overflow: 'hidden',
                              color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
                            }}>
                              {c.profile_image_url
                                ? <img src={c.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : `${c.first_name?.[0] || ''}${c.last_name?.[0] || ''}`}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 500, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>{c.first_name} {c.last_name}</div>
                              <div style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Subject */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                background: theme === 'dark' ? '#374151' : '#FFFFFF',
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Templates + New Template */}
          <div style={{ marginBottom: '12px', position: 'relative' }} ref={templateDropdownRef}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: theme === 'dark' ? '#374151' : '#F3F4F6',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  borderRadius: '6px',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <FaFileAlt size={12} />
                Templates
              </button>
              <button
                type="button"
                onClick={() => { setTemplateModalOpen(true); setNewTemplateName(''); setNewTemplateDesc(''); setNewTemplateSubject(subject); setNewTemplateBody(body); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 10px',
                  background: 'none',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  borderRadius: '6px',
                  color: '#3B82F6',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                <FaPlus size={10} />
                New
              </button>
            </div>

            {templateDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 100,
                maxHeight: '250px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ padding: '8px', borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}` }}>
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      borderRadius: '6px',
                      background: theme === 'dark' ? '#374151' : '#F9FAFB',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ overflow: 'auto', maxHeight: '180px' }}>
                  {templatesLoading ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '13px' }}>
                      Loading...
                    </div>
                  ) : templates.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: '13px' }}>
                      {templateSearch ? 'No templates found' : 'No templates yet'}
                    </div>
                  ) : (
                    templates.map((template) => (
                      <div
                        key={template.template_id}
                        onClick={() => applyTemplate(template)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#F3F4F6'}`
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = theme === 'dark' ? '#374151' : '#F3F4F6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 500, fontSize: '13px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                          {template.name}
                        </div>
                        {template.short_description && (
                          <div style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: '2px' }}>
                            {template.short_description}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div
                  onClick={openManageTemplates}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#3B82F6',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = theme === 'dark' ? '#374151' : '#F3F4F6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FaEdit size={11} />
                  Edit Templates
                </div>
              </div>
            )}
          </div>

          {/* Message Body */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '12px', minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontWeight: 600 }}>Message</label>
              <button
                type="button"
                onClick={handleProofread}
                disabled={proofreading || !body.trim()}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#8B5CF6',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: proofreading || !body.trim() ? 'not-allowed' : 'pointer',
                  opacity: proofreading || !body.trim() ? 0.5 : 1
                }}
              >
                {proofreading ? 'Polishing...' : 'Proofread'}
              </button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                background: theme === 'dark' ? '#374151' : '#FFFFFF',
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
                fontSize: '13px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                minHeight: '120px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: canSend ? '#3B82F6' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
              color: canSend ? 'white' : (theme === 'dark' ? '#6B7280' : '#9CA3AF'),
              cursor: canSend ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {sending ? (
              <>
                <FaClock size={14} />
                Sending...
              </>
            ) : (
              <>
                <FaPaperPlane size={14} />
                Send Email
              </>
            )}
          </button>
        </div>
      )}

      {/* Thread View Mode */}
      {mode === 'thread' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Thread Header */}
          <div style={{
            padding: '12px',
            borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
            background: theme === 'dark' ? '#111827' : '#F3F4F6'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: theme === 'dark' ? '#F9FAFB' : '#111827',
              marginBottom: '4px'
            }}>
              {selectedThread?.subject || 'Thread'}
            </div>
            {threadParticipants.length > 0 && (
              <div style={{
                fontSize: '12px',
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '2px'
              }}>
                {threadParticipants.join(', ')}
              </div>
            )}
            <div style={{
              fontSize: '11px',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF'
            }}>
              {threadMessages.length} message{threadMessages.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Messages - Email Card Style */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: theme === 'dark' ? '#111827' : '#F3F4F6'
          }}>
            {loadingMessages ? (
              <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                Loading messages...
              </div>
            ) : threadMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                No messages in this thread
              </div>
            ) : (
              threadMessages.map((msg, idx) => (
                <div
                  key={msg.email_id || idx}
                  style={{
                    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                    overflow: 'hidden'
                  }}
                >
                  {/* Email Header - just date */}
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                    background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                    }}>
                      {new Date(msg.email_date).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Email Body */}
                  <div style={{
                    padding: '14px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: theme === 'dark' ? '#E5E7EB' : '#374151',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}>
                    {msg.body_text || msg.snippet || '(No content)'}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply Button */}
          <div style={{
            padding: '12px',
            borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
            background: theme === 'dark' ? '#1F2937' : '#FFFFFF'
          }}>
            <button
              onClick={() => {
                setSubject(`Re: ${selectedThread?.subject || ''}`);
                setMode('compose');
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                background: theme === 'dark' ? '#374151' : '#F9FAFB',
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <FaReply size={12} />
              Reply
            </button>
          </div>
        </div>
      )}
      {/* Manage Templates Modal */}
      {manageTemplatesOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }} onClick={() => setManageTemplatesOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              width: '560px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
            }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                {editingTemplate ? 'Edit Template' : 'Manage Templates'}
              </div>
              <button
                onClick={() => { setManageTemplatesOpen(false); setEditingTemplate(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', padding: '4px' }}
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Body */}
            {editingTemplate ? (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'auto' }}>
                <div>
                  <label style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Name *</label>
                  <input
                    type="text"
                    value={editingTemplate.name || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: theme === 'dark' ? '#374151' : '#F9FAFB',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Description</label>
                  <input
                    type="text"
                    value={editingTemplate.short_description || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, short_description: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: theme === 'dark' ? '#374151' : '#F9FAFB',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Subject</label>
                  <input
                    type="text"
                    value={editingTemplate.subject || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: theme === 'dark' ? '#374151' : '#F9FAFB',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Body</label>
                  <textarea
                    value={editingTemplate.template_text || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, template_text: e.target.value })}
                    rows={8}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: theme === 'dark' ? '#374151' : '#F9FAFB',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      fontSize: '14px', outline: 'none', resize: 'vertical',
                      fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box',
                    }}
                  />
                </div>
                {/* Edit footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={() => setEditingTemplate(null)}
                    style={{
                      padding: '10px 16px', borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: 'transparent',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '14px', cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUpdateTemplate}
                    disabled={savingTemplate || !editingTemplate.name?.trim()}
                    style={{
                      padding: '10px 20px', borderRadius: '8px', border: 'none',
                      background: savingTemplate || !editingTemplate.name?.trim() ? (theme === 'dark' ? '#374151' : '#E5E7EB') : '#3B82F6',
                      color: savingTemplate || !editingTemplate.name?.trim() ? (theme === 'dark' ? '#6B7280' : '#9CA3AF') : 'white',
                      fontSize: '14px', fontWeight: 600,
                      cursor: savingTemplate || !editingTemplate.name?.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingTemplate ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ overflow: 'auto', flex: 1 }}>
                {manageLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>Loading...</div>
                ) : manageTemplates.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>No templates yet</div>
                ) : (
                  manageTemplates.map((template) => (
                    <div
                      key={template.template_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 20px',
                        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#F3F4F6'}`,
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: '14px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                          {template.name}
                        </div>
                        {template.short_description && (
                          <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: '2px' }}>
                            {template.short_description}
                          </div>
                        )}
                        {template.subject && (
                          <div style={{ fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', marginTop: '2px' }}>
                            Subject: {template.subject}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingTemplate({ ...template })}
                        title="Edit template"
                        style={{
                          padding: '8px', borderRadius: '6px', border: 'none',
                          background: theme === 'dark' ? '#374151' : '#F3F4F6',
                          color: theme === 'dark' ? '#D1D5DB' : '#374151',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <FaEdit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.template_id)}
                        disabled={deletingId === template.template_id}
                        title="Delete template"
                        style={{
                          padding: '8px', borderRadius: '6px', border: 'none',
                          background: theme === 'dark' ? '#7F1D1D' : '#FEE2E2',
                          color: theme === 'dark' ? '#FCA5A5' : '#DC2626',
                          cursor: deletingId === template.template_id ? 'not-allowed' : 'pointer',
                          opacity: deletingId === template.template_id ? 0.5 : 1,
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Template Modal */}
      {templateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }} onClick={() => setTemplateModalOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              width: '480px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
            }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                New Email Template
              </div>
              <button
                onClick={() => setTemplateModalOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280', padding: '4px',
                }}
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'auto' }}>
              <div>
                <label style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Template Name *</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. Follow-up after meeting"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#F9FAFB',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Short Description</label>
                <input
                  type="text"
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="Optional description..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#F9FAFB',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Subject</label>
                <input
                  type="text"
                  value={newTemplateSubject}
                  onChange={(e) => setNewTemplateSubject(e.target.value)}
                  placeholder="Email subject..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#F9FAFB',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <label style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Body</label>
                <textarea
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  placeholder="Write template body..."
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#F9FAFB',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              padding: '16px 20px',
              borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
            }}>
              <button
                onClick={() => setTemplateModalOpen(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  background: 'transparent',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !newTemplateName.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: savingTemplate || !newTemplateName.trim() ? (theme === 'dark' ? '#374151' : '#E5E7EB') : '#3B82F6',
                  color: savingTemplate || !newTemplateName.trim() ? (theme === 'dark' ? '#6B7280' : '#9CA3AF') : 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: savingTemplate || !newTemplateName.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {savingTemplate ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightPanelEmailTab;
