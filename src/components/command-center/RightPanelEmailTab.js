import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaEnvelope, FaPaperPlane, FaClock, FaFileAlt, FaPlus, FaReply } from 'react-icons/fa';
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
  const [sending, setSending] = useState(false);
  const [proofreading, setProofreading] = useState(false);

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

          {/* Template Button */}
          <div style={{ marginBottom: '12px', position: 'relative' }} ref={templateDropdownRef}>
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
    </div>
  );
};

export default RightPanelEmailTab;
