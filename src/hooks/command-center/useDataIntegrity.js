import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';
const AGENT_SERVICE_URL = 'https://crm-agent-api-production.up.railway.app';

const useDataIntegrity = (
  activeTab,
  selectedThread,
  selectedWhatsappChat,
  selectedCalendarEvent,
  emailContacts,
  // Cross-cutting deps passed from parent
  {
    threads,
    setThreads,
    setEmails,
    setSelectedThread,
    whatsappChats,
    setWhatsappChats,
    whatsappMessages,
    setWhatsappMessages,
    setSelectedWhatsappChat,
    removeEmailsBySender,
    refreshThreads,
    setCreateContactEmail,
    setCreateContactModalOpen,
    handleOpenQuickEditModal,
    setAddToListContact,
    setAddToListModalOpen,
  } = {}
) => {
  // ===== State declarations =====

  // Not in CRM
  const [notInCrmEmails, setNotInCrmEmails] = useState([]);
  const [notInCrmDomains, setNotInCrmDomains] = useState([]);
  const [crmEmailSet, setCrmEmailSet] = useState(new Set());
  const [notInCrmTab, setNotInCrmTab] = useState('contacts');

  // Hold
  const [holdContacts, setHoldContacts] = useState([]);
  const [holdCompanies, setHoldCompanies] = useState([]);
  const [holdTab, setHoldTab] = useState('contacts');

  // Completeness / Incomplete
  const [incompleteContacts, setIncompleteContacts] = useState([]);
  const [incompleteCompanies, setIncompleteCompanies] = useState([]);
  const [completenessTab, setCompletenessTab] = useState('contacts');

  // Duplicates
  const [duplicateContacts, setDuplicateContacts] = useState([]);
  const [duplicateCompanies, setDuplicateCompanies] = useState([]);
  const [duplicatesTab, setDuplicatesTab] = useState('contacts');

  // Category missing
  const [categoryMissingContacts, setCategoryMissingContacts] = useState([]);
  const [categoryMissingCompanies, setCategoryMissingCompanies] = useState([]);
  const [categoryMissingTab, setCategoryMissingTab] = useState('contacts');

  // Keep in touch missing
  const [keepInTouchMissingContacts, setKeepInTouchMissingContacts] = useState([]);

  // Company links
  const [missingCompanyLinks, setMissingCompanyLinks] = useState([]);
  const [contactsMissingCompany, setContactsMissingCompany] = useState([]);
  const [potentialCompanyMatches, setPotentialCompanyMatches] = useState([]);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalContact, setDeleteModalContact] = useState(null);

  // Edit company modal
  const [editCompanyModalOpen, setEditCompanyModalOpen] = useState(false);
  const [editCompanyModalCompany, setEditCompanyModalCompany] = useState(null);

  // Loading
  const [loadingDataIntegrity, setLoadingDataIntegrity] = useState(false);

  // Collapsible sections
  const [expandedDataIntegrity, setExpandedDataIntegrity] = useState({ notInCrm: true });

  // Data Integrity Modal (contacts)
  const [dataIntegrityModalOpen, setDataIntegrityModalOpen] = useState(false);
  const [dataIntegrityContactId, setDataIntegrityContactId] = useState(null);

  // Company Data Integrity Modal
  const [companyDataIntegrityModalOpen, setCompanyDataIntegrityModalOpen] = useState(false);
  const [companyDataIntegrityCompanyId, setCompanyDataIntegrityCompanyId] = useState(null);

  // Create Company from Domain Modal state
  const [createCompanyFromDomainModalOpen, setCreateCompanyFromDomainModalOpen] = useState(false);
  const [createCompanyFromDomainData, setCreateCompanyFromDomainData] = useState(null);

  // Link to Existing Modal state
  const [linkToExistingModalOpen, setLinkToExistingModalOpen] = useState(false);
  const [linkToExistingEntityType, setLinkToExistingEntityType] = useState('company');
  const [linkToExistingItemData, setLinkToExistingItemData] = useState(null);

  // Link Company Modal (for missing_company issues)
  const [linkCompanyModalContact, setLinkCompanyModalContact] = useState(null);

  // AI Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  // Audit state
  const [auditResult, setAuditResult] = useState(null);
  const [auditActions, setAuditActions] = useState([]);
  const [selectedActions, setSelectedActions] = useState(new Set());
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [executingActions, setExecutingActions] = useState(false);

  // ===== Helper functions =====

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

  // Extract unique participants from a thread (from/to/cc)
  const getThreadParticipants = (thread) => {
    const participants = new Map();
    const myEmail = 'simone@cimminelli.com'.toLowerCase();

    (thread || []).forEach(email => {
      // From
      if (email.from_email && email.from_email.toLowerCase() !== myEmail) {
        const key = email.from_email.toLowerCase();
        if (!participants.has(key)) {
          participants.set(key, { email: email.from_email, name: email.from_name });
        }
      }
      // To
      (email.to_recipients || []).forEach(r => {
        const addr = typeof r === 'string' ? r : r.email;
        if (addr && addr.toLowerCase() !== myEmail) {
          const key = addr.toLowerCase();
          if (!participants.has(key)) {
            participants.set(key, { email: addr, name: typeof r === 'object' ? r.name : null });
          }
        }
      });
      // CC
      (email.cc_recipients || []).forEach(r => {
        const addr = typeof r === 'string' ? r : r.email;
        if (addr && addr.toLowerCase() !== myEmail) {
          const key = addr.toLowerCase();
          if (!participants.has(key)) {
            participants.set(key, { email: addr, name: typeof r === 'object' ? r.name : null });
          }
        }
      });
    });

    return participants;
  };

  // Helper: normalize domain (remove www., http://, https://, trailing paths)
  const normalizeDomain = (domain) => {
    if (!domain) return null;
    let normalized = domain.toLowerCase().trim();
    normalized = normalized.replace(/^https?:\/\//, '');
    normalized = normalized.replace(/^www\./, '');
    normalized = normalized.split('/')[0];
    normalized = normalized.split(':')[0];
    return normalized || null;
  };

  // Helper: extract domain from email address
  const extractDomainFromEmail = (email) => {
    if (!email) return null;
    const parts = email.split('@');
    if (parts.length !== 2) return null;
    return normalizeDomain(parts[1]);
  };

  // Extract unique domains from thread participants
  const getThreadDomains = (thread) => {
    const participants = getThreadParticipants(thread);
    const domains = new Set();
    participants.forEach((value, email) => {
      const domain = extractDomainFromEmail(email);
      if (domain) domains.add(domain);
    });
    return domains;
  };

  // Parse emails from current email body - suggestions for adding new contacts
  const suggestionsFromMessage = useMemo(() => {
    if (!selectedThread || selectedThread.length === 0 || crmEmailSet.size === 0) return [];

    const emailWithNameRegex = /([A-Za-zÀ-ÿ\s]+)\s*<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g;
    const plainEmailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const foundEmails = new Map();

    selectedThread.forEach(email => {
      const bodyText = email.body_text || '';
      const bodyHtml = email.body_html || '';
      const combined = bodyText + ' ' + bodyHtml;

      let match;
      while ((match = emailWithNameRegex.exec(combined)) !== null) {
        const name = match[1].trim();
        const emailAddr = match[2].toLowerCase().trim();
        if (!foundEmails.has(emailAddr)) {
          foundEmails.set(emailAddr, { email: emailAddr, name });
        }
      }

      const allPlainEmails = combined.match(plainEmailRegex) || [];
      allPlainEmails.forEach(emailAddr => {
        const normalized = emailAddr.toLowerCase().trim();
        if (!foundEmails.has(normalized)) {
          foundEmails.set(normalized, { email: normalized, name: '' });
        }
      });
    });

    const excludePatterns = ['noreply', 'no-reply', 'mailer-daemon', 'postmaster', 'newsletter'];
    const myEmails = ['simone@cimminelli.com', 'simone.cimminelli@gmail.com'];

    const suggestions = [];
    foundEmails.forEach((value, emailAddr) => {
      if (crmEmailSet.has(emailAddr)) return;
      if (myEmails.includes(emailAddr)) return;
      if (excludePatterns.some(p => emailAddr.includes(p))) return;

      let firstName = '';
      let lastName = '';
      if (value.name) {
        const nameParts = value.name.split(/\s+/).filter(Boolean);
        if (nameParts.length >= 2) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        } else if (nameParts.length === 1) {
          firstName = nameParts[0];
        }
      }

      suggestions.push({
        email: emailAddr,
        name: value.name,
        firstName,
        lastName
      });
    });

    return suggestions;
  }, [selectedThread, crmEmailSet]);

  // ===== Main fetch function =====

  const fetchDataIntegrity = async () => {
    setLoadingDataIntegrity(true);

    try {
      // Get inbox_ids from selected thread, whatsapp chat, or calendar event
      let inboxIds = [];
      let isArchivedChat = false;
      let archivedChatContactMobile = null;

      if (activeTab === 'email' && selectedThread) {
        inboxIds = selectedThread.map(email => email.id).filter(Boolean);
      } else if (activeTab === 'whatsapp' && selectedWhatsappChat?.messages) {
        if (selectedWhatsappChat._isArchivedChat) {
          isArchivedChat = true;
          archivedChatContactMobile = selectedWhatsappChat.contact_number;
        } else {
          inboxIds = selectedWhatsappChat.messages.map(msg => msg.id).filter(Boolean);
        }
      } else if (activeTab === 'calendar' && selectedCalendarEvent) {
        inboxIds = [selectedCalendarEvent.id].filter(Boolean);
      }

      // Skip if no selection and not an archived chat
      if (inboxIds.length === 0 && !isArchivedChat) {
        setNotInCrmEmails([]);
        setNotInCrmDomains([]);
        setHoldContacts([]);
        setHoldCompanies([]);
        setIncompleteContacts([]);
        setIncompleteCompanies([]);
        setDuplicateContacts([]);
        setDuplicateCompanies([]);
        setCategoryMissingContacts([]);
        setCategoryMissingCompanies([]);
        setKeepInTouchMissingContacts([]);
        setMissingCompanyLinks([]);
        setContactsMissingCompany([]);
        setLoadingDataIntegrity(false);
        return;
      }

      // ============================================
      // 1. FETCH FROM data_integrity_inbox (backend)
      // ============================================
      let integrityIssues = [];
      let integrityError = null;

      if (isArchivedChat && archivedChatContactMobile) {
        const result = await supabase
          .from('data_integrity_inbox')
          .select('*')
          .eq('mobile', archivedChatContactMobile)
          .eq('status', 'pending');
        integrityIssues = result.data;
        integrityError = result.error;
      } else if (inboxIds.length > 0) {
        const result = await supabase
          .from('data_integrity_inbox')
          .select('*')
          .in('inbox_id', inboxIds)
          .eq('status', 'pending');
        integrityIssues = result.data;
        integrityError = result.error;
      }

      if (integrityError) {
        console.error('Error fetching data integrity issues:', integrityError);
      }

      // Group issues by type
      const issues = integrityIssues || [];

      // NOT IN CRM - Contacts (deduplicate by email or mobile)
      const notInCrmContactIssues = issues.filter(i => i.issue_type === 'not_in_crm' && i.entity_type === 'contact');
      const seenContacts = new Set();
      const uniqueNotInCrmContacts = notInCrmContactIssues.filter(i => {
        const key = i.email?.toLowerCase() || i.mobile;
        if (!key || seenContacts.has(key)) return false;
        seenContacts.add(key);
        return true;
      });
      setNotInCrmEmails(uniqueNotInCrmContacts.map(i => ({
        id: i.id,
        issueId: i.id,
        email: i.email,
        mobile: i.mobile,
        name: i.name,
        firstName: i.name?.split(' ')[0] || '',
        lastName: i.name?.split(' ').slice(1).join(' ') || ''
      })));

      // NOT IN CRM - Companies (domains) - deduplicate by domain
      const notInCrmCompanyIssues = issues.filter(i => i.issue_type === 'not_in_crm' && i.entity_type === 'company');
      const domainMap = new Map();
      notInCrmCompanyIssues.forEach(i => {
        if (!i.domain) return;
        if (domainMap.has(i.domain)) {
          const existing = domainMap.get(i.domain);
          if (i.email && !existing.sampleEmails.includes(i.email)) {
            existing.sampleEmails.push(i.email);
          }
          existing.count++;
          if (!existing.issueIds.includes(i.id)) {
            existing.issueIds.push(i.id);
          }
        } else {
          domainMap.set(i.domain, {
            domain: i.domain,
            issueId: i.id,
            issueIds: [i.id],
            count: 1,
            sampleEmails: i.email ? [i.email] : []
          });
        }
      });
      setNotInCrmDomains([...domainMap.values()]);

      // HOLD - Contacts
      const holdContactIssues = issues.filter(i => i.issue_type === 'hold' && i.entity_type === 'contact');
      setHoldContacts(holdContactIssues.map(i => ({
        email: i.email,
        mobile: i.mobile,
        full_name: i.name,
        first_name: i.name?.split(' ')[0] || '',
        last_name: i.name?.split(' ').slice(1).join(' ') || '',
        email_count: 1,
        status: 'pending'
      })));

      // HOLD - Companies
      const holdCompanyIssues = issues.filter(i => i.issue_type === 'hold' && i.entity_type === 'company');
      setHoldCompanies(holdCompanyIssues.map(i => ({
        domain: i.domain,
        name: i.name || i.domain,
        status: 'pending'
      })));

      // INCOMPLETE - Contacts (deduplicate by contact_id, fetch real-time scores)
      const incompleteContactIssues = issues.filter(i => i.issue_type === 'incomplete' && i.entity_type === 'contact');
      const incompleteByContact = new Map();
      incompleteContactIssues.forEach(i => {
        const contactId = i.entity_id;
        if (!incompleteByContact.has(contactId)) {
          incompleteByContact.set(contactId, {
            contact_id: contactId,
            first_name: i.name?.split(' ')[0] || '',
            last_name: i.name?.split(' ').slice(1).join(' ') || '',
            completeness_score: i.details?.completeness_score || 0
          });
        }
      });

      // Fetch real-time completeness scores AND current names for contacts
      const contactIds = Array.from(incompleteByContact.keys()).filter(Boolean);
      if (contactIds.length > 0) {
        const { data: realTimeData } = await supabase
          .from('contact_completeness')
          .select('contact_id, completeness_score, first_name, last_name')
          .in('contact_id', contactIds);

        if (realTimeData) {
          realTimeData.forEach(data => {
            const contact = incompleteByContact.get(data.contact_id);
            if (contact) {
              contact.completeness_score = Math.round(data.completeness_score);
              contact.first_name = data.first_name || contact.first_name;
              contact.last_name = data.last_name || contact.last_name;
            }
          });
        }
      }
      setIncompleteContacts(Array.from(incompleteByContact.values()));

      // INCOMPLETE - Companies (fetch real-time scores)
      const incompleteCompanyIssues = issues.filter(i => i.issue_type === 'incomplete' && i.entity_type === 'company');
      const incompleteCompaniesData = incompleteCompanyIssues.map(i => ({
        company_id: i.entity_id,
        name: i.name,
        completeness_score: i.details?.completeness_score || 0
      }));

      // Fetch real-time completeness scores AND current names for companies
      const companyIds = incompleteCompaniesData.map(c => c.company_id).filter(Boolean);
      if (companyIds.length > 0) {
        const { data: realTimeCompanyData } = await supabase
          .from('company_completeness')
          .select('company_id, completeness_score, name')
          .in('company_id', companyIds);

        if (realTimeCompanyData) {
          const dataMap = new Map(realTimeCompanyData.map(s => [s.company_id, s]));
          incompleteCompaniesData.forEach(company => {
            const data = dataMap.get(company.company_id);
            if (data) {
              company.completeness_score = Math.round(data.completeness_score);
              company.name = data.name || company.name;
            }
          });
        }
      }
      setIncompleteCompanies(incompleteCompaniesData);

      // MISSING COMPANY LINK
      const missingLinkIssues = issues.filter(i => i.issue_type === 'missing_company_link');
      setMissingCompanyLinks(missingLinkIssues.map(i => ({
        id: i.id,
        contact_id: i.entity_id,
        contact_name: i.name,
        email: i.email,
        company_id: i.details?.company_id || i.duplicate_entity_id,
        company_name: i.details?.company_name,
        domain: i.domain
      })));

      // MISSING COMPANY - deduplicate by contact_id
      const missingCompanyIssues = issues.filter(i => i.issue_type === 'missing_company');
      const missingCompanyByContact = new Map();
      missingCompanyIssues.forEach(i => {
        const contactId = i.entity_id;
        if (!missingCompanyByContact.has(contactId)) {
          missingCompanyByContact.set(contactId, {
            issue_ids: [i.id],
            contact_id: contactId,
            first_name: i.name?.split(' ')[0] || '',
            last_name: i.name?.split(' ').slice(1).join(' ') || '',
            emails: i.email ? [i.email] : [],
            category: i.details?.category
          });
        } else {
          missingCompanyByContact.get(contactId).issue_ids.push(i.id);
        }
      });
      setContactsMissingCompany(Array.from(missingCompanyByContact.values()));

      // POTENTIAL COMPANY MATCHES - domains that might match existing companies by name
      const potentialMatchIssues = issues.filter(i => i.issue_type === 'potential_company_match');
      setPotentialCompanyMatches(potentialMatchIssues.map(i => ({
        id: i.id,
        domain: i.domain,
        email: i.email,
        matched_company_id: i.entity_id,
        matched_company_name: i.name,
        details: i.details
      })));

      // ============================================
      // 2. FETCH FROM duplicates_inbox (backend)
      // ============================================
      let duplicatesRaw = [];
      let duplicatesError = null;

      // Skip duplicates query for archived chats (they don't have inbox_id)
      if (!isArchivedChat && inboxIds.length > 0) {
        const result = await supabase
          .from('duplicates_inbox')
          .select('*')
          .or(`inbox_id.in.(${inboxIds.join(',')}),inbox_id.is.null`)
          .eq('status', 'pending');
        duplicatesRaw = result.data;
        duplicatesError = result.error;
      }

      if (duplicatesError) {
        console.error('Error fetching duplicates:', duplicatesError);
      }

      const duplicates = duplicatesRaw || [];

      // Contact Duplicates - enrich with contact details
      const contactDups = duplicates.filter(d => d.entity_type === 'contact');
      if (contactDups.length > 0) {
        const dupContactIds = [...new Set(contactDups.flatMap(d => [d.source_id, d.duplicate_id]))];
        const { data: contacts } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name')
          .in('contact_id', dupContactIds);

        const contactMap = Object.fromEntries((contacts || []).map(c => [c.contact_id, c]));

        setDuplicateContacts(contactDups.map(d => ({
          id: d.id,
          entity_type: 'contact',
          source_id: d.source_id,
          duplicate_id: d.duplicate_id,
          match_type: d.match_type,
          source: contactMap[d.source_id],
          duplicate: contactMap[d.duplicate_id],
          match_details: d.match_details
        })));
      } else {
        setDuplicateContacts([]);
      }

      // Company Duplicates - enrich with company details
      const companyDups = duplicates.filter(d => d.entity_type === 'company');
      if (companyDups.length > 0) {
        const dupCompanyIds = [...new Set(companyDups.flatMap(d => [d.source_id, d.duplicate_id]))];
        const { data: companies } = await supabase
          .from('companies')
          .select('company_id, name, category')
          .in('company_id', dupCompanyIds);

        const companyMap = Object.fromEntries((companies || []).map(c => [c.company_id, c]));

        setDuplicateCompanies(companyDups.map(d => ({
          id: d.id,
          entity_type: 'company',
          source_id: d.source_id,
          duplicate_id: d.duplicate_id,
          match_type: d.match_type,
          source: companyMap[d.source_id],
          duplicate: companyMap[d.duplicate_id],
          match_details: d.match_details
        })));
      } else {
        setDuplicateCompanies([]);
      }

      // Category missing and keep in touch - these are not in data_integrity_inbox yet
      setCategoryMissingContacts([]);
      setCategoryMissingCompanies([]);
      setKeepInTouchMissingContacts([]);

      // Keep crmEmailSet for other uses (backward compatibility)
      const allInboxEmails = getThreadParticipants(selectedThread);
      const crmEmailSetLocal = new Set();
      setCrmEmailSet(crmEmailSetLocal);

    } catch (error) {
      console.error('Error fetching data integrity:', error);
    }
    setLoadingDataIntegrity(false);
  };

  // ===== useEffects =====

  // Reload data integrity when selection changes (for warning bar and data integrity tab)
  useEffect(() => {
    if (['email', 'whatsapp', 'calendar'].includes(activeTab)) {
      fetchDataIntegrity();
    }
  }, [activeTab, selectedThread, selectedWhatsappChat, selectedCalendarEvent]);

  // ===== Handlers =====

  // Handle adding email or mobile to spam list
  const handleAddToSpam = async (emailOrMobile, item = null) => {
    try {
      const isWhatsApp = Boolean(item?.mobile);
      const isEmailContact = Boolean(item?.email) && !item?.mobile;

      if (!item?.mobile && !item?.email && !emailOrMobile) {
        toast.error('No email or mobile to add to spam');
        return;
      }

      if (isWhatsApp) {
        // WhatsApp contact - add to whatsapp_spam
        const mobile = item.mobile;
        const { error } = await supabase
          .from('whatsapp_spam')
          .upsert({
            mobile_number: mobile,
            counter: 1,
          }, {
            onConflict: 'mobile_number',
          });

        if (error) throw error;

        // First get message_uids before deleting (needed for attachments)
        const { data: messagesToDelete } = await supabase
          .from('command_center_inbox')
          .select('id, message_uid')
          .eq('contact_number', mobile)
          .eq('type', 'whatsapp');

        const messageUids = (messagesToDelete || [])
          .map(m => m.message_uid)
          .filter(Boolean);

        // Delete attachments linked to these messages
        let deletedAttachmentsCount = 0;
        if (messageUids.length > 0) {
          const { data: deletedAttachments, error: attachError } = await supabase
            .from('attachments')
            .delete()
            .in('external_reference', messageUids)
            .select('attachment_id');

          if (attachError) {
            console.error('Error deleting attachments:', attachError);
          } else {
            deletedAttachmentsCount = deletedAttachments?.length || 0;
          }
        }

        // Delete WhatsApp messages from this contact
        const { data: deletedMessages, error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .eq('contact_number', mobile)
          .eq('type', 'whatsapp')
          .select('id');

        if (deleteError) {
          console.error('Error deleting WhatsApp messages:', deleteError);
        }

        const deletedCount = deletedMessages?.length || 0;

        // Mark all data_integrity issues for this mobile as dismissed
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq('mobile', mobile)
          .eq('status', 'pending');

        // Remove from notInCrmEmails list
        setNotInCrmEmails(prev => prev.filter(i => i.mobile !== mobile));

        // Update local WhatsApp state - remove chats/messages with this contact
        if (setWhatsappChats) setWhatsappChats(prev => prev.filter(c => c.contact_number !== mobile));
        if (setWhatsappMessages) setWhatsappMessages(prev => prev.filter(m => m.contact_number !== mobile));

        // Select first remaining chat
        const remainingChats = (whatsappChats || []).filter(c => c.contact_number !== mobile);
        if (remainingChats.length > 0) {
          if (setSelectedWhatsappChat) setSelectedWhatsappChat(remainingChats[0]);
        } else {
          if (setSelectedWhatsappChat) setSelectedWhatsappChat(null);
        }

        const attachmentMsg = deletedAttachmentsCount > 0 ? `, ${deletedAttachmentsCount} attachments` : '';
        toast.success(`${mobile} added to WhatsApp spam${deletedCount > 0 ? ` - deleted ${deletedCount} messages${attachmentMsg}` : ''}`);
      } else {
        // Email contact - add to emails_spam
        const emailLower = emailOrMobile.toLowerCase();

        const { error } = await supabase
          .from('emails_spam')
          .upsert({
            email: emailLower,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString(),
          }, {
            onConflict: 'email',
          });

        if (error) throw error;

        // Get all emails from this sender (need fastmail_id for archiving)
        const { data: emailsToArchive, error: fetchError } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', emailLower);

        if (fetchError) {
          console.error('Error fetching emails to archive:', fetchError);
        }

        // Archive each email in Fastmail
        for (const emailRecord of emailsToArchive || []) {
          if (emailRecord.fastmail_id) {
            try {
              await archiveInFastmail(emailRecord.fastmail_id);
            } catch (archiveErr) {
              console.error('Failed to archive email:', emailRecord.fastmail_id, archiveErr);
            }
          }
        }

        // Delete all emails from this sender from command_center_inbox
        const { data: deletedEmails, error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', emailLower)
          .select('id');

        if (deleteError) {
          console.error('Error deleting from inbox:', deleteError);
        }

        const deletedCount = deletedEmails?.length || 0;

        // Mark all data_integrity issues for this email as dismissed
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .ilike('email', emailLower)
          .eq('status', 'pending');

        // Update threads state - remove emails from this sender
        if (removeEmailsBySender) removeEmailsBySender(emailOrMobile);

        // Remove from notInCrmEmails list
        setNotInCrmEmails(prev => prev.filter(i => i.email?.toLowerCase() !== emailLower));

        // Refresh threads and select first one
        if (refreshThreads) await refreshThreads();

        toast.success(`${emailOrMobile} added to spam list${deletedCount > 0 ? ` - deleted ${deletedCount} emails` : ''}`);
      }
    } catch (error) {
      console.error('Error adding to spam:', error);
      toast.error('Failed to add to spam list');
    }
  };

  // Handle putting contact on hold (supports both email and WhatsApp contacts)
  const handlePutOnHold = async (item) => {
    try {
      const isWhatsApp = item.mobile && !item.email;
      const identifier = isWhatsApp ? item.mobile : item.email?.toLowerCase();

      if (!identifier) {
        toast.error('No email or mobile to put on hold');
        return;
      }

      // Build upsert data based on contact type
      const upsertData = {
        full_name: item.name || null,
        status: 'pending',
        email_count: 1,
        created_at: new Date().toISOString(),
        source_type: isWhatsApp ? 'whatsapp' : 'email',
      };

      if (isWhatsApp) {
        upsertData.mobile = item.mobile;
        upsertData.email = `whatsapp_${item.mobile.replace(/[^0-9]/g, '')}@placeholder.hold`;
      } else {
        upsertData.email = item.email.toLowerCase();
      }

      const { error } = await supabase
        .from('contacts_hold')
        .upsert(upsertData, {
          onConflict: 'email',
        });

      if (error) throw error;

      // Mark data_integrity_inbox issue as dismissed
      if (item.id) {
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq('id', item.id);
      } else {
        const matchField = isWhatsApp ? 'mobile' : 'email';
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq(matchField, identifier)
          .eq('issue_type', 'not_in_crm')
          .eq('entity_type', 'contact')
          .eq('status', 'pending');
      }

      // Remove from notInCrmEmails list
      setNotInCrmEmails(prev => prev.filter(i => {
        if (isWhatsApp) {
          return i.mobile !== item.mobile;
        }
        return i.email?.toLowerCase() !== item.email?.toLowerCase();
      }));

      // Add to hold list
      setHoldContacts(prev => [...prev, {
        email: upsertData.email,
        mobile: isWhatsApp ? item.mobile : null,
        full_name: item.name,
        status: 'pending',
        email_count: 1,
        source_type: isWhatsApp ? 'whatsapp' : 'email'
      }]);

      toast.success(`${item.name || item.email || item.mobile} put on hold`);
    } catch (error) {
      console.error('Error putting on hold:', error);
      toast.error('Failed to put on hold');
    }
  };

  // Handle editing a category missing contact - fetch full data and open QuickEditModal
  const handleEditCategoryMissingContact = async (contact) => {
    try {
      const { data: fullContact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_id', contact.contact_id)
        .single();

      if (error) throw error;

      if (handleOpenQuickEditModal) handleOpenQuickEditModal(fullContact, true);
    } catch (error) {
      console.error('Error fetching contact for edit:', error);
      toast.error('Failed to load contact');
    }
  };

  // Handle putting a category missing contact on hold - sets category to 'Hold'
  const handleHoldCategoryMissingContact = async (contact) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ category: 'Hold' })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      setCategoryMissingContacts(prev => prev.filter(c => c.contact_id !== contact.contact_id));
      toast.success(`${contact.first_name} ${contact.last_name} moved to Hold`);
    } catch (error) {
      console.error('Error setting hold category:', error);
      toast.error('Failed to set Hold category');
    }
  };

  // Handle opening delete modal for a category missing contact
  const handleDeleteCategoryMissingContact = async (contact) => {
    try {
      const { data: fullContact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_id', contact.contact_id)
        .single();

      if (error) throw error;

      setDeleteModalContact(fullContact);
      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error fetching contact for delete:', error);
      toast.error('Failed to load contact');
    }
  };

  // Handle closing delete modal and refreshing list
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteModalContact(null);
    fetchDataIntegrity();
  };

  // Handle opening Manage Lists modal
  const handleOpenAddToListModal = (contact) => {
    if (setAddToListContact) setAddToListContact(contact);
    if (setAddToListModalOpen) setAddToListModalOpen(true);
  };

  // Handle editing a category missing company - open CompanyDataIntegrityModal
  const handleEditCategoryMissingCompany = async (company) => {
    setCompanyDataIntegrityCompanyId(company.company_id);
    setCompanyDataIntegrityModalOpen(true);
  };

  // Handle closing edit company modal
  const handleCloseEditCompanyModal = () => {
    setEditCompanyModalOpen(false);
    setEditCompanyModalCompany(null);
    fetchDataIntegrity();
  };

  // Handle putting a category missing company on hold - sets category to 'Hold'
  const handleHoldCategoryMissingCompany = async (company) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ category: 'Hold' })
        .eq('company_id', company.company_id);

      if (error) throw error;

      setCategoryMissingCompanies(prev => prev.filter(c => c.company_id !== company.company_id));
      toast.success(`${company.name} moved to Hold`);
    } catch (error) {
      console.error('Error setting hold category:', error);
      toast.error('Failed to set Hold category');
    }
  };

  // Handle deleting a category missing company
  const handleDeleteCategoryMissingCompany = async (company) => {
    if (!window.confirm(`Delete ${company.name}? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('company_id', company.company_id);

      if (error) throw error;

      setCategoryMissingCompanies(prev => prev.filter(c => c.company_id !== company.company_id));
      toast.success(`${company.name} deleted`);
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  // Handle adding contact from hold to CRM (supports both email and WhatsApp contacts)
  const handleAddFromHold = async (contact) => {
    const isWhatsApp = contact.mobile || contact.source_type === 'whatsapp' ||
                       contact.email?.startsWith('whatsapp_');

    let contextContent = null;

    if (isWhatsApp && contact.mobile) {
      // For WhatsApp contacts, search WhatsApp messages for context
      for (const thread of (threads || [])) {
        if (thread.type === 'whatsapp' && thread.contact_number === contact.mobile) {
          contextContent = {
            chat_name: thread.chat_name,
            body_text: thread.snippet || thread.body_text
          };
          break;
        }
      }
    } else {
      // For email contacts, find an email involving this contact
      for (const thread of (threads || [])) {
        const found = thread.emails?.find(e => {
          const emailLower = contact.email?.toLowerCase();
          if (!emailLower) return false;
          if (e.from_email?.toLowerCase() === emailLower) return true;
          if (e.to_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
          if (e.cc_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
          return false;
        });
        if (found) {
          contextContent = found;
          break;
        }
      }
    }

    // Open the create contact modal with complete contact data from hold
    if (setCreateContactEmail) {
      setCreateContactEmail({
        email: isWhatsApp ? '' : contact.email,
        mobile: contact.mobile || null,
        name: contact.full_name || contact.first_name,
        hold_id: contact.hold_id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        company_name: contact.company_name,
        job_role: contact.job_role,
        subject: contextContent?.subject || contextContent?.chat_name || '',
        body_text: contextContent?.body_text || contextContent?.snippet || '',
        source_type: isWhatsApp ? 'whatsapp' : 'email'
      });
    }
    if (setCreateContactModalOpen) setCreateContactModalOpen(true);
  };

  // Handle marking contact from hold as spam (supports both email and WhatsApp contacts)
  const handleSpamFromHold = async (contact) => {
    try {
      const isWhatsApp = contact.mobile || contact.source_type === 'whatsapp' ||
                         contact.email?.startsWith('whatsapp_');
      const identifier = isWhatsApp ? contact.mobile : contact.email?.toLowerCase();

      if (!identifier) {
        toast.error('No email or mobile to mark as spam');
        return;
      }

      if (isWhatsApp) {
        // 1. Add to WhatsApp spam list
        const { error: spamError } = await supabase
          .from('whatsapp_spam')
          .upsert({
            mobile_number: contact.mobile,
            counter: 1,
          }, {
            onConflict: 'mobile_number',
          });

        if (spamError) throw spamError;

        // 2. Remove from contacts_hold (match by mobile or placeholder email)
        if (contact.email) {
          await supabase.from('contacts_hold').delete().eq('email', contact.email);
        }
        if (contact.mobile) {
          await supabase.from('contacts_hold').delete().eq('mobile', contact.mobile);
        }

        // 3. Delete WhatsApp messages from this contact
        const { data: deletedMessages, error: inboxDeleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .eq('contact_number', contact.mobile)
          .eq('type', 'whatsapp')
          .select('id');

        if (inboxDeleteError) {
          console.error('Error deleting WhatsApp messages:', inboxDeleteError);
        }

        const deletedCount = deletedMessages?.length || 0;

        // 4. Update threads state - remove WhatsApp messages from this contact
        if (setThreads) setThreads(prev => prev.filter(t => !(t.type === 'whatsapp' && t.contact_number === contact.mobile)));

        // 5. Update local hold contacts state
        setHoldContacts(prev => prev.filter(c => c.mobile !== contact.mobile));

        toast.success(`${contact.mobile} marked as spam${deletedCount > 0 ? ` - deleted ${deletedCount} messages` : ''}`);
      } else {
        // Original email spam logic
        const emailLower = contact.email.toLowerCase();

        // 1. Add to email spam list
        const { error: spamError } = await supabase
          .from('emails_spam')
          .upsert({
            email: emailLower,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString(),
          }, {
            onConflict: 'email',
          });

        if (spamError) throw spamError;

        // 2. Remove from contacts_hold
        const { error: deleteError } = await supabase
          .from('contacts_hold')
          .delete()
          .eq('email', emailLower);

        if (deleteError) throw deleteError;

        // 3. Get all emails from this sender (need fastmail_id for archiving)
        const { data: emailsToArchive, error: fetchError } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', emailLower);

        if (fetchError) {
          console.error('Error fetching emails to archive:', fetchError);
        }

        // 4. Archive each email in Fastmail
        for (const emailRecord of emailsToArchive || []) {
          if (emailRecord.fastmail_id) {
            try {
              await archiveInFastmail(emailRecord.fastmail_id);
            } catch (archiveErr) {
              console.error('Failed to archive email:', emailRecord.fastmail_id, archiveErr);
            }
          }
        }

        // 5. Delete all emails from this sender from command_center_inbox
        const { data: deletedEmails, error: inboxDeleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', emailLower)
          .select('id');

        if (inboxDeleteError) {
          console.error('Error deleting from inbox:', inboxDeleteError);
        }

        const deletedCount = deletedEmails?.length || 0;

        // 6. Update threads state - remove emails from this sender
        if (removeEmailsBySender) removeEmailsBySender(contact.email);

        // 7. Update local hold contacts state
        setHoldContacts(prev => prev.filter(c => c.email?.toLowerCase() !== emailLower));

        toast.success(`${contact.email} marked as spam${deletedCount > 0 ? ` - deleted ${deletedCount} emails` : ''}`);
      }
    } catch (error) {
      console.error('Error marking as spam from hold:', error);
      toast.error('Failed to mark as spam');
    }
  };

  // Handle opening create contact modal (supports both email and WhatsApp contacts)
  const handleOpenCreateContact = (item) => {
    const isWhatsApp = item.mobile && !item.email;

    let contextContent = null;

    if (isWhatsApp) {
      for (const thread of (threads || [])) {
        if (thread.type === 'whatsapp' && thread.contact_number === item.mobile) {
          contextContent = {
            chat_name: thread.chat_name,
            body_text: thread.snippet || thread.body_text
          };
          break;
        }
      }
    } else {
      for (const thread of (threads || [])) {
        const found = thread.emails?.find(e => {
          const emailLower = item.email?.toLowerCase();
          if (!emailLower) return false;
          if (e.from_email?.toLowerCase() === emailLower) return true;
          if (e.to_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
          if (e.cc_recipients?.some(r => r.email?.toLowerCase() === emailLower)) return true;
          return false;
        });
        if (found) {
          contextContent = found;
          break;
        }
      }
    }

    if (setCreateContactEmail) {
      setCreateContactEmail({
        ...item,
        subject: contextContent?.subject || contextContent?.chat_name || '',
        body_text: contextContent?.body_text || contextContent?.snippet || '',
        source_type: isWhatsApp ? 'whatsapp' : 'email'
      });
    }
    if (setCreateContactModalOpen) setCreateContactModalOpen(true);
  };

  // Handler for Add button on company - opens LinkToExisting modal first
  const handleAddCompanyFromDomain = (domainData) => {
    setLinkToExistingEntityType('company');
    setLinkToExistingItemData({
      domain: domainData.domain,
      issueId: domainData.issueId,
      issueIds: domainData.issueIds || [domainData.issueId],
      count: domainData.count,
      sampleEmails: domainData.sampleEmails
    });
    setLinkToExistingModalOpen(true);
  };

  // Handler for Add button on contact - opens LinkToExisting modal first
  const handleAddContactFromNotInCrm = (contactData) => {
    setLinkToExistingEntityType('contact');
    setLinkToExistingItemData({
      email: contactData.email,
      mobile: contactData.mobile,
      name: contactData.name,
      issueId: contactData.issueId
    });
    setLinkToExistingModalOpen(true);
  };

  // Called when "Create New" is clicked in LinkToExisting modal
  const handleCreateNewFromLinkModal = (itemData) => {
    if (linkToExistingEntityType === 'company') {
      setCreateCompanyFromDomainData({
        domain: itemData.domain,
        count: itemData.count,
        sampleEmails: itemData.sampleEmails
      });
      setCreateCompanyFromDomainModalOpen(true);
    } else {
      if (setCreateContactEmail) {
        setCreateContactEmail({
          email: itemData.email || '',
          mobile: itemData.mobile || null,
          name: itemData.name || '',
          first_name: itemData.name?.split(' ')[0] || '',
          last_name: itemData.name?.split(' ').slice(1).join(' ') || '',
          subject: '',
          body_text: ''
        });
      }
      if (setCreateContactModalOpen) setCreateContactModalOpen(true);
    }
  };

  // Called when link is successful in LinkToExisting modal
  const handleLinkSuccess = async () => {
    // Mark data_integrity_inbox issue as resolved
    if (linkToExistingEntityType === 'company' && linkToExistingItemData?.domain) {
      await supabase
        .from('data_integrity_inbox')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('domain', linkToExistingItemData.domain)
        .eq('issue_type', 'not_in_crm')
        .eq('entity_type', 'company')
        .eq('status', 'pending');
    } else if (linkToExistingItemData?.email || linkToExistingItemData?.mobile) {
      let query = supabase
        .from('data_integrity_inbox')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('issue_type', 'not_in_crm')
        .eq('entity_type', 'contact')
        .eq('status', 'pending');

      if (linkToExistingItemData.email) {
        query = query.eq('email', linkToExistingItemData.email);
      } else if (linkToExistingItemData.mobile) {
        query = query.eq('mobile', linkToExistingItemData.mobile);
      }
      await query;
    }

    fetchDataIntegrity();
    // Remove item from local state
    if (linkToExistingEntityType === 'company') {
      setNotInCrmDomains(prev => prev.filter(c => c.domain !== linkToExistingItemData?.domain));
    } else {
      setNotInCrmEmails(prev => prev.filter(c =>
        c.email !== linkToExistingItemData?.email && c.mobile !== linkToExistingItemData?.mobile
      ));
    }
  };

  const handleCreateCompanyFromDomainSuccess = async (newCompanyId) => {
    // Mark data_integrity_inbox issues as resolved for this domain
    if (createCompanyFromDomainData?.domain) {
      await supabase
        .from('data_integrity_inbox')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('domain', createCompanyFromDomainData.domain)
        .eq('issue_type', 'not_in_crm')
        .eq('entity_type', 'company')
        .eq('status', 'pending');
    }

    // Refresh data integrity list
    fetchDataIntegrity();

    // Open CompanyDataIntegrityModal for further enrichment
    setCompanyDataIntegrityCompanyId(newCompanyId);
    setCompanyDataIntegrityModalOpen(true);

    toast.success('Company created! Complete the details below.');
  };

  // Handler for domain Hold/Delete actions
  const handleDomainAction = async (domainItem, action) => {
    const domain = typeof domainItem === 'string' ? domainItem : domainItem.domain;

    try {
      if (action === 'hold') {
        // Check if domain already exists in companies_hold
        const { data: existing } = await supabase
          .from('companies_hold')
          .select('company_id')
          .eq('domain', domain)
          .single();

        if (existing) {
          await supabase
            .from('companies_hold')
            .update({
              email_count: domainItem.count || 1,
              last_seen_at: new Date().toISOString()
            })
            .eq('domain', domain);
        } else {
          const { error } = await supabase
            .from('companies_hold')
            .insert({
              company_id: crypto.randomUUID(),
              domain: domain,
              name: domain,
              email_count: domainItem.count || 1,
              status: 'pending',
              first_seen_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            });

          if (error) throw error;
        }

        // Add to holdCompanies state
        setHoldCompanies(prev => [...prev, {
          domain,
          name: domain,
          email_count: domainItem.count || 1,
          status: 'pending'
        }]);

        toast.success(`${domain} put on hold`);
      } else if (action === 'spam') {
        // Add domain to domains_spam
        const { error: spamError } = await supabase
          .from('domains_spam')
          .upsert({
            domain: domain,
            counter: 1
          }, {
            onConflict: 'domain'
          });

        if (spamError) throw spamError;

        // Get all emails from this domain (need fastmail_id for archiving)
        const { data: emailsToArchive } = await supabase
          .from('command_center_inbox')
          .select('id, fastmail_id')
          .ilike('from_email', `%@${domain}`);

        // Archive each email in Fastmail
        for (const emailRecord of emailsToArchive || []) {
          if (emailRecord.fastmail_id) {
            try {
              await archiveInFastmail(emailRecord.fastmail_id);
            } catch (archiveErr) {
              console.error('Failed to archive email:', emailRecord.fastmail_id, archiveErr);
            }
          }
        }

        // Delete all emails from this domain from command_center_inbox
        const { data: deletedEmails } = await supabase
          .from('command_center_inbox')
          .delete()
          .ilike('from_email', `%@${domain}`)
          .select('id');

        const deletedCount = deletedEmails?.length || 0;

        // Mark all data_integrity issues for this domain as dismissed
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq('domain', domain)
          .eq('status', 'pending');

        // Refresh threads and select first one
        if (refreshThreads) await refreshThreads();

        toast.success(`${domain} added to spam${deletedCount > 0 ? ` - deleted ${deletedCount} emails` : ''}`);
      } else if (action === 'delete') {
        // Just remove from list, no DB action
        toast.success(`${domain} dismissed`);
      }

      // Remove from not in CRM list
      setNotInCrmDomains(prev => prev.filter(d => d.domain !== domain));
    } catch (error) {
      console.error('Error handling domain action:', error);
      toast.error(`Failed to ${action} domain`);
    }
  };

  // Handle adding company from hold to CRM
  const handleAddCompanyFromHold = async (company) => {
    try {
      // Create the company
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          name: company.name || company.domain,
          website: company.domain,
          category: 'Inbox'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add domain to company_domains
      await supabase
        .from('company_domains')
        .insert({
          company_id: newCompany.company_id,
          domain: company.domain
        });

      // Remove from companies_hold
      await supabase
        .from('companies_hold')
        .delete()
        .eq('domain', company.domain);

      // Update local state
      setHoldCompanies(prev => prev.filter(c => c.domain !== company.domain));

      // Open modal for further editing
      setCompanyDataIntegrityCompanyId(newCompany.company_id);
      setCompanyDataIntegrityModalOpen(true);

      toast.success('Company created! Complete the details below.');
    } catch (error) {
      console.error('Error adding company from hold:', error);
      toast.error('Failed to add company');
    }
  };

  // Handle deleting company from hold
  const handleDeleteCompanyFromHold = async (company) => {
    try {
      const { error } = await supabase
        .from('companies_hold')
        .delete()
        .eq('domain', company.domain);

      if (error) throw error;

      setHoldCompanies(prev => prev.filter(c => c.domain !== company.domain));

      toast.success(`${company.domain} removed from hold`);
    } catch (error) {
      console.error('Error deleting company from hold:', error);
      toast.error('Failed to remove from hold');
    }
  };

  // Handler to link contact to company (for missing company links)
  const handleLinkContactToCompany = async (item) => {
    try {
      // First, lookup the current company by domain (in case original was merged)
      let companyId = item.company_id;
      let companyName = item.company_name;

      if (item.domain) {
        const { data: domainLookup } = await supabase
          .from('company_domains')
          .select('company_id, companies(name)')
          .eq('domain', item.domain.toLowerCase())
          .single();

        if (domainLookup) {
          companyId = domainLookup.company_id;
          companyName = domainLookup.companies?.name || companyName;
        }
      }

      // Check if already linked to this company
      const { data: existingLink } = await supabase
        .from('contact_companies')
        .select('contact_companies_id')
        .eq('contact_id', item.contact_id)
        .eq('company_id', companyId)
        .single();

      if (existingLink) {
        // Mark as resolved since it's already linked
        if (item.id) {
          await supabase
            .from('data_integrity_inbox')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('id', item.id);
        }
        toast.success(`${item.contact_name} is already linked to ${companyName}`);
        setMissingCompanyLinks(prev =>
          prev.filter(link => link.contact_id !== item.contact_id || link.domain !== item.domain)
        );
        return;
      }

      // Check if contact already has a primary company
      const { data: existingPrimary } = await supabase
        .from('contact_companies')
        .select('contact_companies_id')
        .eq('contact_id', item.contact_id)
        .eq('is_primary', true)
        .single();

      // Insert the link
      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: item.contact_id,
          company_id: companyId,
          is_primary: !existingPrimary,
          relationship: 'not_set'
        });

      if (error) throw error;

      // Mark the data_integrity_inbox issue as resolved
      if (item.id) {
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('id', item.id);
      }

      // Remove from the list
      setMissingCompanyLinks(prev =>
        prev.filter(link => link.contact_id !== item.contact_id || link.domain !== item.domain)
      );

      toast.success(`${item.contact_name} linked to ${companyName}`);
    } catch (error) {
      console.error('Error linking contact to company:', error);
      toast.error('Failed to link contact to company');
    }
  };

  // Handle linking a domain to an existing company (potential_company_match)
  const handleLinkDomainToCompany = async (item) => {
    try {
      // Check if domain already exists
      const { data: existingDomain } = await supabase
        .from('company_domains')
        .select('company_id, companies(name)')
        .eq('domain', item.domain.toLowerCase())
        .single();

      if (existingDomain) {
        toast.success(`Domain ${item.domain} already linked to ${existingDomain.companies?.name || 'company'}`);
      } else {
        const { error } = await supabase
          .from('company_domains')
          .insert({
            company_id: item.matched_company_id,
            domain: item.domain.toLowerCase()
          });

        if (error) throw error;
        toast.success(`Domain ${item.domain} linked to ${item.matched_company_name}`);
      }

      // Mark ALL potential_company_match issues with this domain as resolved
      await supabase
        .from('data_integrity_inbox')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('issue_type', 'potential_company_match')
        .eq('domain', item.domain.toLowerCase())
        .eq('status', 'pending');

      // Remove ALL matches with this domain from local state
      setPotentialCompanyMatches(prev =>
        prev.filter(match => match.domain?.toLowerCase() !== item.domain?.toLowerCase())
      );
    } catch (error) {
      console.error('Error linking domain to company:', error);
      toast.error('Failed to link domain to company');
    }
  };

  // Handle dismissing a potential company match
  const handleDismissPotentialMatch = async (item) => {
    try {
      // Mark ALL potential_company_match issues with this domain as dismissed
      await supabase
        .from('data_integrity_inbox')
        .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
        .eq('issue_type', 'potential_company_match')
        .eq('domain', item.domain.toLowerCase())
        .eq('status', 'pending');

      // Remove ALL matches with this domain from local state
      setPotentialCompanyMatches(prev =>
        prev.filter(match => match.domain?.toLowerCase() !== item.domain?.toLowerCase())
      );

      toast.success('Match dismissed');
    } catch (error) {
      console.error('Error dismissing potential match:', error);
      toast.error('Failed to dismiss match');
    }
  };

  // Handle linking a contact to company by email domain (for missing_company issues)
  const handleLinkContactToCompanyByDomain = async (contact) => {
    try {
      const email = contact.emails?.[0];

      // If no email, open the modal for manual company selection
      if (!email) {
        setLinkCompanyModalContact(contact);
        return;
      }

      // Extract domain from email
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain) {
        setLinkCompanyModalContact(contact);
        return;
      }

      // Find company by domain in company_domains
      const { data: domainData, error: domainError } = await supabase
        .from('company_domains')
        .select('company_id, companies(company_id, name)')
        .eq('domain', domain)
        .single();

      if (domainError || !domainData) {
        setLinkCompanyModalContact(contact);
        toast.info(`No company found for domain ${domain}. Select one manually.`);
        return;
      }

      const companyId = domainData.company_id;
      const companyName = domainData.companies?.name || domain;

      // Insert into contact_companies (upsert to handle existing links)
      const { error: linkError } = await supabase
        .from('contact_companies')
        .upsert({
          contact_id: contact.contact_id,
          company_id: companyId,
          is_primary: true
        }, { onConflict: 'contact_id,company_id' });

      if (linkError) throw linkError;

      // Mark all data_integrity_inbox issues as resolved (may have multiple per contact)
      const issueIds = contact.issue_ids || (contact.issue_id ? [contact.issue_id] : []);
      if (issueIds.length > 0) {
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .in('id', issueIds);
      }

      // Remove from the list
      setContactsMissingCompany(prev =>
        prev.filter(c => c.contact_id !== contact.contact_id)
      );

      toast.success(`${contact.first_name} linked to ${companyName}`);
    } catch (error) {
      console.error('Error linking contact to company:', error);
      toast.error('Failed to link contact to company');
    }
  };

  // Fetch AI suggestions from Supabase
  const fetchAiSuggestions = async () => {
    setLoadingAiSuggestions(true);
    try {
      const { data, error } = await supabase
        .from('agent_suggestions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching AI suggestions:', error);
      } else {
        setAiSuggestions(data || []);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    }
    setLoadingAiSuggestions(false);
  };

  // Handle AI suggestion action (accept/reject)
  const handleSuggestionAction = async (suggestionId, action, notes = null) => {
    setProcessingAction(true);
    try {
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      const { error } = await supabase
        .from('agent_suggestions')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'user',
          user_notes: notes,
        })
        .eq('id', suggestionId);

      if (error) {
        console.error('Error updating suggestion:', error);
        toast.error('Failed to update suggestion');
      } else {
        toast.success(`Suggestion ${action}ed`);
        fetchAiSuggestions();
        setSelectedSuggestion(null);
      }
    } catch (error) {
      console.error('Error handling suggestion action:', error);
      toast.error('Failed to process action');
    }
    setProcessingAction(false);
  };

  // Trigger duplicate scan
  const triggerDuplicateScan = async () => {
    try {
      toast.loading('Running duplicate scan...');
      const response = await fetch(`${BACKEND_URL}/agent/run-cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: 'contact', limit: 100 }),
      });
      toast.dismiss();
      if (response.ok) {
        const result = await response.json();
        toast.success(`Scan complete: ${result.suggestions_created} suggestions created`);
        fetchAiSuggestions();
      } else {
        toast.error('Scan failed');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Could not connect to agent service');
    }
  };

  // Dismiss a duplicate - move from inbox to main table with ignored status
  const handleDismissDuplicate = async (item) => {
    try {
      if (item.entity_type === 'contact') {
        const { error: insertError } = await supabase
          .from('contact_duplicates')
          .upsert({
            primary_contact_id: item.source_id,
            duplicate_contact_id: item.duplicate_id,
            status: 'ignored',
            false_positive: true,
            notes: `Dismissed from duplicates_inbox: ${item.match_type || 'manual'} match`
          }, { onConflict: 'primary_contact_id,duplicate_contact_id' });

        if (insertError) {
          console.error('Error upserting dismissed contact duplicate:', insertError);
          throw insertError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('company_duplicates')
          .upsert({
            primary_company_id: item.source_id,
            duplicate_company_id: item.duplicate_id,
            status: 'ignored',
            notes: `Dismissed from duplicates_inbox: ${item.match_type || 'manual'} match`
          }, { onConflict: 'primary_company_id,duplicate_company_id' });

        if (insertError) {
          console.error('Error upserting dismissed company duplicate:', insertError);
          throw insertError;
        }
      }

      // Delete from duplicates_inbox (both directions of the pair)
      await supabase
        .from('duplicates_inbox')
        .delete()
        .eq('entity_type', item.entity_type)
        .or(`and(source_id.eq.${item.source_id},duplicate_id.eq.${item.duplicate_id}),and(source_id.eq.${item.duplicate_id},duplicate_id.eq.${item.source_id})`);

      // Update data_integrity_inbox to mark as dismissed
      if (item.id) {
        await supabase
          .from('data_integrity_inbox')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq('id', item.id);
      }

      // Remove from local state
      if (item.entity_type === 'contact') {
        setDuplicateContacts(prev => prev.filter(d =>
          !(d.source_id === item.source_id && d.duplicate_id === item.duplicate_id)
        ));
      } else {
        setDuplicateCompanies(prev => prev.filter(d =>
          !(d.source_id === item.source_id && d.duplicate_id === item.duplicate_id)
        ));
      }

      toast.success('Duplicate dismissed');
    } catch (error) {
      console.error('Error dismissing duplicate:', error);
      toast.error('Failed to dismiss duplicate');
    }
  };

  // Confirm merge for a duplicate from duplicates_inbox
  const handleConfirmMergeDuplicate = async (item) => {
    try {
      if (item.entity_type === 'contact') {
        const { error: insertError } = await supabase
          .from('contact_duplicates')
          .upsert({
            primary_contact_id: item.source_id,
            duplicate_contact_id: item.duplicate_id,
            start_trigger: true,
            status: 'pending',
            merge_selections: {
              emails: 'combine',
              mobiles: 'combine',
              companies: 'combine',
              tags: 'combine',
              cities: 'combine'
            },
            notes: `From duplicates_inbox: ${item.match_type} match`
          }, {
            onConflict: 'primary_contact_id,duplicate_contact_id'
          });

        if (insertError) {
          console.error('Failed to create merge record:', insertError);
          toast.error('Merge failed: ' + insertError.message);
          return;
        }

        toast.success('Contacts merged successfully');
      } else if (item.entity_type === 'company') {
        const { error: insertError } = await supabase
          .from('company_duplicates')
          .upsert({
            primary_company_id: item.source_id,
            duplicate_company_id: item.duplicate_id,
            start_trigger: true,
            status: 'pending',
            merge_selections: {
              contacts: 'combine',
              domains: 'combine',
              tags: 'combine',
              cities: 'combine'
            },
            notes: `From duplicates_inbox: ${item.match_type} match`
          }, {
            onConflict: 'primary_company_id,duplicate_company_id'
          });

        if (insertError) {
          console.error('Failed to create company merge record:', insertError);
          toast.error('Company merge failed: ' + insertError.message);
          return;
        }

        toast.success('Companies merged successfully');
      } else {
        toast.error('Unknown entity type');
        return;
      }

      // Delete from duplicates_inbox (both directions of the pair)
      await supabase
        .from('duplicates_inbox')
        .delete()
        .eq('entity_type', item.entity_type)
        .or(`and(source_id.eq.${item.source_id},duplicate_id.eq.${item.duplicate_id}),and(source_id.eq.${item.duplicate_id},duplicate_id.eq.${item.source_id})`);

      fetchDataIntegrity(); // Refresh the list

    } catch (err) {
      console.error('Merge error:', err);
      toast.error('An error occurred during merge');
    }
  };

  // Run contact audit for selected email
  const runContactAudit = async () => {
    if (!selectedThread || selectedThread.length === 0) {
      toast.error('No email selected');
      return;
    }

    const email = selectedThread[0];
    setLoadingAudit(true);
    setAuditResult(null);
    setAuditActions([]);
    setSelectedActions(new Set());

    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/audit-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: {
            id: email.id,
            fastmail_id: email.fastmail_id || '',
            from_email: email.from_email,
            from_name: email.from_name,
            to_recipients: email.to_recipients || [],
            cc_recipients: email.cc_recipients || [],
            subject: email.subject,
            body_text: email.body_text,
            snippet: email.snippet,
            date: email.date,
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAuditResult(result.audit);
        setAuditActions(result.actions || []);
        const allIndices = new Set(result.actions?.map((_, i) => i) || []);
        setSelectedActions(allIndices);
        toast.success(`Audit complete: ${result.action_count} actions found`);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Audit failed');
      }
    } catch (error) {
      console.error('Error running audit:', error);
      toast.error('Could not connect to agent service');
    }
    setLoadingAudit(false);
  };

  // Execute selected actions
  const executeSelectedActions = async () => {
    if (selectedActions.size === 0) {
      toast.error('No actions selected');
      return;
    }

    const actionsToExecute = auditActions.filter((_, i) => selectedActions.has(i));
    setExecutingActions(true);

    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/execute-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionsToExecute),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`All ${result.successful} actions executed successfully`);
        } else {
          toast.success(`${result.successful}/${result.total} actions executed`);
          if (result.failed > 0) {
            result.results.filter(r => !r.success).forEach(r => {
              toast.error(`Failed: ${r.action} - ${r.message}`);
            });
          }
        }
        // Clear audit after execution
        setAuditResult(null);
        setAuditActions([]);
        setSelectedActions(new Set());
        // Trigger refresh of email contacts by briefly clearing and re-setting selectedThread
        if (selectedThread && setSelectedThread) {
          const thread = selectedThread;
          setSelectedThread(null);
          setTimeout(() => setSelectedThread(thread), 100);
        }
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Execution failed');
      }
    } catch (error) {
      console.error('Error executing actions:', error);
      toast.error('Could not connect to agent service');
    }
    setExecutingActions(false);
  };

  // Toggle action selection
  const toggleActionSelection = (index) => {
    const newSelected = new Set(selectedActions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedActions(newSelected);
  };

  // Run data integrity checks for a specific contact (from right panel)
  const handleRunContactChecks = useCallback(async (contactId, contactName, inboxId) => {
    if (!inboxId) {
      toast.error('Select a message first to run checks', { id: 'check-contact' });
      return;
    }

    toast.loading(`Running data integrity checks for ${contactName}...`, { id: 'check-contact' });
    try {
      const { data, error } = await supabase.rpc('run_contact_data_integrity_checks', {
        p_contact_id: contactId,
        p_inbox_id: inboxId
      });
      if (error) throw error;
      const total = data?.find(r => r.check_name === 'TOTAL')?.issues_created || 0;
      if (total > 0) {
        toast.success(`Found ${total} issue${total > 1 ? 's' : ''} for ${contactName}`, { id: 'check-contact' });
      } else {
        toast.success(`No new issues for ${contactName}`, { id: 'check-contact' });
      }
      fetchDataIntegrity();
    } catch (err) {
      console.error('Error running data integrity checks:', err);
      toast.error('Failed to run checks', { id: 'check-contact' });
    }
  }, [fetchDataIntegrity]);

  // ===== Return =====

  return {
    // State
    notInCrmEmails,
    setNotInCrmEmails,
    notInCrmDomains,
    setNotInCrmDomains,
    crmEmailSet,
    setCrmEmailSet,
    notInCrmTab,
    setNotInCrmTab,
    holdContacts,
    setHoldContacts,
    holdCompanies,
    setHoldCompanies,
    holdTab,
    setHoldTab,
    incompleteContacts,
    setIncompleteContacts,
    incompleteCompanies,
    setIncompleteCompanies,
    completenessTab,
    setCompletenessTab,
    duplicateContacts,
    setDuplicateContacts,
    duplicateCompanies,
    setDuplicateCompanies,
    duplicatesTab,
    setDuplicatesTab,
    categoryMissingContacts,
    setCategoryMissingContacts,
    categoryMissingCompanies,
    setCategoryMissingCompanies,
    categoryMissingTab,
    setCategoryMissingTab,
    keepInTouchMissingContacts,
    setKeepInTouchMissingContacts,
    missingCompanyLinks,
    setMissingCompanyLinks,
    contactsMissingCompany,
    setContactsMissingCompany,
    potentialCompanyMatches,
    setPotentialCompanyMatches,
    deleteModalOpen,
    setDeleteModalOpen,
    deleteModalContact,
    setDeleteModalContact,
    editCompanyModalOpen,
    setEditCompanyModalOpen,
    editCompanyModalCompany,
    setEditCompanyModalCompany,
    loadingDataIntegrity,
    setLoadingDataIntegrity,
    expandedDataIntegrity,
    setExpandedDataIntegrity,
    dataIntegrityModalOpen,
    setDataIntegrityModalOpen,
    dataIntegrityContactId,
    setDataIntegrityContactId,
    companyDataIntegrityModalOpen,
    setCompanyDataIntegrityModalOpen,
    companyDataIntegrityCompanyId,
    setCompanyDataIntegrityCompanyId,
    createCompanyFromDomainModalOpen,
    setCreateCompanyFromDomainModalOpen,
    createCompanyFromDomainData,
    setCreateCompanyFromDomainData,
    linkToExistingModalOpen,
    setLinkToExistingModalOpen,
    linkToExistingEntityType,
    setLinkToExistingEntityType,
    linkToExistingItemData,
    setLinkToExistingItemData,
    linkCompanyModalContact,
    setLinkCompanyModalContact,

    // AI Suggestions state
    aiSuggestions,
    setAiSuggestions,
    loadingAiSuggestions,
    selectedSuggestion,
    setSelectedSuggestion,
    processingAction,

    // Audit state
    auditResult,
    setAuditResult,
    auditActions,
    setAuditActions,
    selectedActions,
    setSelectedActions,
    loadingAudit,
    executingActions,

    // Computed
    suggestionsFromMessage,

    // Helpers
    getThreadParticipants,
    normalizeDomain,
    extractDomainFromEmail,
    getThreadDomains,

    // Handlers
    fetchDataIntegrity,
    handleAddToSpam,
    handlePutOnHold,
    handleEditCategoryMissingContact,
    handleHoldCategoryMissingContact,
    handleDeleteCategoryMissingContact,
    handleCloseDeleteModal,
    handleOpenAddToListModal,
    handleEditCategoryMissingCompany,
    handleCloseEditCompanyModal,
    handleHoldCategoryMissingCompany,
    handleDeleteCategoryMissingCompany,
    handleAddFromHold,
    handleSpamFromHold,
    handleOpenCreateContact,
    handleAddCompanyFromDomain,
    handleAddContactFromNotInCrm,
    handleCreateNewFromLinkModal,
    handleLinkSuccess,
    handleCreateCompanyFromDomainSuccess,
    handleDomainAction,
    handleAddCompanyFromHold,
    handleDeleteCompanyFromHold,
    handleLinkContactToCompany,
    handleLinkDomainToCompany,
    handleDismissPotentialMatch,
    handleLinkContactToCompanyByDomain,
    fetchAiSuggestions,
    handleSuggestionAction,
    triggerDuplicateScan,
    handleDismissDuplicate,
    handleConfirmMergeDuplicate,
    runContactAudit,
    executeSelectedActions,
    toggleActionSelection,
    handleRunContactChecks,
  };
};

export default useDataIntegrity;
