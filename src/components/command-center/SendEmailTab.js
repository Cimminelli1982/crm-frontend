import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaFileAlt, FaPaperPlane, FaClock } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const KIT_EMAIL_SIGNATURE = `

--
SIMONE CIMMINELLI
Newsletter | Website | LinkedIn`;

const SendEmailTab = ({
  theme,
  contact,
  emails = [],
  onEmailSent,
  hideToField = false,
  multipleRecipients = null, // Array of emails to send to (overrides single email selection)
  defaultSubject = '', // Default subject line
  introductionMode = false, // Show intro language flags instead of templates
  introContacts = [], // Contact names for introduction templates [{name: 'Name1'}, {name: 'Name2'}]
  introNotes = '', // Notes from the introduction record
  introductionId = null, // Introduction ID to update status after send
  onIntroductionStatusUpdate = null, // Callback when introduction status is updated
}) => {
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [proofreading, setProofreading] = useState(false);
  const [monitorIntro, setMonitorIntro] = useState(true); // Default: monitor the introduction

  // Template state
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const templateDropdownRef = useRef(null);

  // Update subject when defaultSubject changes
  useEffect(() => {
    if (defaultSubject && !subject) {
      setSubject(defaultSubject);
    }
  }, [defaultSubject]);

  // Introduction templates
  // contacts[0] = person being introduced (use full name), contacts[1] = person receiving (use first name only)
  const getIntroTemplateIT = () => {
    const personIntroducedFullName = introContacts[0]?.fullName || 'Nome Cognome';
    const personReceivingFirstName = introContacts[1]?.firstName || 'Nome';
    const notesText = introNotes ? `${introNotes}` : '[descrizione]';
    return `Ciao ${personReceivingFirstName},

Spero tutto bene.

Ti volevo presentare ${personIntroducedFullName}. ${notesText}

A voi,
Simone`;
  };

  const getIntroTemplateEN = () => {
    const personIntroducedFullName = introContacts[0]?.fullName || 'Full Name';
    const personReceivingFirstName = introContacts[1]?.firstName || 'Name';
    const notesText = introNotes ? `${introNotes}` : '[description]';
    return `Hi ${personReceivingFirstName},

Hope you're doing well.

I wanted to introduce you to ${personIntroducedFullName}. ${notesText}

Over to you,
Simone`;
  };

  // Proofread the email body
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

  // Send email
  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || sending) return;

    // Use multipleRecipients if provided, otherwise fall back to single email
    const recipients = multipleRecipients && multipleRecipients.length > 0
      ? multipleRecipients
      : emails.length > 0
        ? [selectedEmail || emails[0].email]
        : [];

    if (recipients.length === 0) {
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
          to: recipients,
          subject: subject.trim(),
          textBody: fullBody,
          skipCrmDoneStamp: true, // Don't stamp so it appears in inbox
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // Update last_interaction_at (only for single contact mode, not introduction mode)
      if (!introductionMode && contact?.contact_id) {
        const now = new Date();
        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            last_interaction_at: now.toISOString()
          })
          .eq('contact_id', contact.contact_id);

        if (updateError) {
          console.error('Failed to update last_interaction_at:', updateError);
        }
      }

      // Update introduction status if in introduction mode
      if (introductionMode && introductionId) {
        const newStatus = monitorIntro ? 'Done, but need to monitor' : 'Done & Dust';
        const { error: introError } = await supabase
          .from('introductions')
          .update({ status: newStatus })
          .eq('introduction_id', introductionId);

        if (introError) {
          console.error('Failed to update introduction status:', introError);
        } else {
          // Callback to parent to update local state
          if (onIntroductionStatusUpdate) {
            onIntroductionStatusUpdate(introductionId, newStatus);
          }
        }
      }

      // Clear the form
      setSubject('');
      setBody('');
      toast.success('Email sent!');

      // Callback to parent (only for single contact mode)
      if (onEmailSent && contact?.contact_id) {
        onEmailSent(contact.contact_id);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const canSend = subject.trim() && body.trim() && !sending && emails.length > 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: hideToField ? '0' : '12px' }}>
      {/* To Field */}
      {!hideToField && (
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
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
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
      )}

      {/* Subject Field */}
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

      {/* Introduction Language Flags or Template Button */}
      {introductionMode ? (
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setBody(getIntroTemplateIT())}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: theme === 'dark' ? '#374151' : '#F3F4F6',
              border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
              borderRadius: '6px',
              color: theme === 'dark' ? '#D1D5DB' : '#374151',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = theme === 'dark' ? '#4B5563' : '#E5E7EB'}
            onMouseLeave={(e) => e.currentTarget.style.background = theme === 'dark' ? '#374151' : '#F3F4F6'}
          >
            🇮🇹 Italiano
          </button>
          <button
            type="button"
            onClick={() => setBody(getIntroTemplateEN())}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: theme === 'dark' ? '#374151' : '#F3F4F6',
              border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
              borderRadius: '6px',
              color: theme === 'dark' ? '#D1D5DB' : '#374151',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = theme === 'dark' ? '#4B5563' : '#E5E7EB'}
            onMouseLeave={(e) => e.currentTarget.style.background = theme === 'dark' ? '#374151' : '#F3F4F6'}
          >
            🇬🇧 English
          </button>
        </div>
      ) : (
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
              maxHeight: '300px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Search Input */}
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

              {/* Template List */}
              <div style={{ overflow: 'auto', maxHeight: '200px' }}>
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
                        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#F3F4F6'}`,
                        transition: 'background 0.15s'
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
      )}

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
              opacity: proofreading || !body.trim() ? 0.5 : 1,
              transition: 'all 0.15s'
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
            minHeight: '150px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Signature Preview */}
      <div style={{
        padding: '10px 12px',
        borderRadius: '8px',
        background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
        border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
        marginBottom: '12px',
        fontSize: '11px',
        color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        whiteSpace: 'pre-wrap',
        lineHeight: '1.4'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Signature:</div>
        --{'\n'}SIMONE CIMMINELLI{'\n'}Newsletter | Website | LinkedIn
      </div>

      {/* Monitor checkbox for introductions */}
      {introductionMode && introductionId && (
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          cursor: 'pointer',
          fontSize: '13px',
          color: theme === 'dark' ? '#D1D5DB' : '#374151',
        }}>
          <input
            type="checkbox"
            checked={monitorIntro}
            onChange={(e) => setMonitorIntro(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              cursor: 'pointer',
              accentColor: '#F59E0B',
            }}
          />
          <span>Monitor this introduction</span>
          <span style={{
            fontSize: '11px',
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          }}>
            ({monitorIntro ? 'Done, but need to monitor' : 'Done & Dust'})
          </span>
        </label>
      )}

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
  );
};

export default SendEmailTab;
