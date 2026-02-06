import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import useContactDetails from '../useContactDetails';

/**
 * useRightPanelState - manages all right panel state:
 * contact/company selection, company details, enrichment, task/note linked entities
 */
const useRightPanelState = ({
  activeTab,
  emailContacts,
  selectedIntroductionItem,
  selectedKeepInTouchContact,
  keepInTouchContactDetails,
  archivedWhatsappContact,
  onKeepInTouchUpdated,
}) => {
  // Active action tab (right panel tab)
  const [activeActionTab, setActiveActionTab] = useState('crm');

  // Right panel contact selector state
  const [selectedRightPanelContactId, setSelectedRightPanelContactId] = useState(null);
  const [selectedListMember, setSelectedListMember] = useState(null);
  const [tasksLinkedContacts, setTasksLinkedContacts] = useState([]);
  const [tasksLinkedChats, setTasksLinkedChats] = useState([]);
  const [tasksLinkedCompanies, setTasksLinkedCompanies] = useState([]);
  const [tasksLinkedDeals, setTasksLinkedDeals] = useState([]);
  const [tasksChatContacts, setTasksChatContacts] = useState([]);
  const [tasksCompanyContacts, setTasksCompanyContacts] = useState([]);
  const [tasksDealsContacts, setTasksDealsContacts] = useState([]);
  // Notes linked entities
  const [notesLinkedContacts, setNotesLinkedContacts] = useState([]);
  const [notesLinkedCompanies, setNotesLinkedCompanies] = useState([]);
  const [notesLinkedDeals, setNotesLinkedDeals] = useState([]);

  // Right panel company selector state
  const [selectedRightPanelCompanyId, setSelectedRightPanelCompanyId] = useState(null);
  const [rightPanelCompanyDetails, setRightPanelCompanyDetails] = useState(null);
  const [loadingRightPanelCompany, setLoadingRightPanelCompany] = useState(false);
  const [rightPanelCompanyRefreshKey, setRightPanelCompanyRefreshKey] = useState(0);

  // Right panel company enrichment modal state
  const [rightPanelCompanyEnrichModalOpen, setRightPanelCompanyEnrichModalOpen] = useState(false);

  // Right panel associate company modal state
  const [rightPanelAssociateCompanyModalOpen, setRightPanelAssociateCompanyModalOpen] = useState(false);

  // Right panel company merge/duplicate modal state
  const [companyMergeModalOpen, setCompanyMergeModalOpen] = useState(false);
  const [companyMergeCompany, setCompanyMergeCompany] = useState(null);

  // Company main modal (for mobile view company)
  const [companyMainModalOpen, setCompanyMainModalOpen] = useState(false);
  const [companyMainModalId, setCompanyMainModalId] = useState(null);

  // Right panel email tab - pre-selected email
  const [initialSelectedEmail, setInitialSelectedEmail] = useState(null);

  // Right panel WhatsApp tab - pre-selected mobile
  const [initialSelectedMobile, setInitialSelectedMobile] = useState(null);

  // Right panel Related tab - pre-selected tag
  const [initialSelectedTagId, setInitialSelectedTagId] = useState(null);

  // When switching to deals tab, if dataIntegrity is selected, switch to chat
  useEffect(() => {
    if (activeTab === 'deals' && activeActionTab === 'dataIntegrity') {
      setActiveActionTab('chat');
    }
    if (activeTab === 'calendar' && (activeActionTab === 'chat' || activeActionTab === 'dataIntegrity')) {
      setActiveActionTab('crm');
    }
  }, [activeTab]);

  // Right panel contact details hook
  const rightPanelContactDetails = useContactDetails(selectedRightPanelContactId);

  // Auto-select primary company when contact's companies change
  useEffect(() => {
    const companies = rightPanelContactDetails?.companies || [];
    if (companies.length > 0) {
      const primaryCompany = companies.find(c => c.is_primary) || companies[0];
      setSelectedRightPanelCompanyId(primaryCompany?.company_id || null);
    } else {
      setSelectedRightPanelCompanyId(null);
      setRightPanelCompanyDetails(null);
    }
  }, [rightPanelContactDetails?.companies]);

  // Fetch company details when selected company changes
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!selectedRightPanelCompanyId) {
        setRightPanelCompanyDetails(null);
        return;
      }

      setLoadingRightPanelCompany(true);
      try {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('company_id', selectedRightPanelCompanyId)
          .single();

        if (companyError) throw companyError;

        const { data: domains } = await supabase
          .from('company_domains')
          .select('id, domain, is_primary')
          .eq('company_id', selectedRightPanelCompanyId);

        let logoUrl = null;
        const { data: logoData } = await supabase
          .from('company_attachments')
          .select('attachment_id, attachments(permanent_url, file_url)')
          .eq('company_id', selectedRightPanelCompanyId)
          .eq('is_logo', true)
          .limit(1)
          .maybeSingle();

        if (logoData?.attachments) {
          logoUrl = logoData.attachments.permanent_url || logoData.attachments.file_url;
        }

        const { data: tagsData } = await supabase
          .from('company_tags')
          .select('entry_id, tag_id, tags(tag_id, name)')
          .eq('company_id', selectedRightPanelCompanyId);

        let citiesData = [];
        try {
          const { data: citiesResult } = await supabase
            .from('company_cities')
            .select('entry_id, city_id, cities(city_id, name, country)')
            .eq('company_id', selectedRightPanelCompanyId);
          citiesData = citiesResult || [];
        } catch (e) {
          console.log('company_cities not available');
        }

        const { data: contactsData } = await supabase
          .from('contact_companies')
          .select('contact_id, is_primary, relationship, contacts(contact_id, first_name, last_name, job_role, profile_image_url)')
          .eq('company_id', selectedRightPanelCompanyId);

        const transformedTags = (tagsData || []).map(t => ({
          tag_id: t.tags?.tag_id || t.tag_id,
          name: t.tags?.name || 'Unknown'
        }));

        const transformedCities = (citiesData || []).map(c => ({
          city_id: c.cities?.city_id || c.city_id,
          name: c.cities?.name,
          country: c.cities?.country
        })).filter(c => c.name);

        const transformedContacts = (contactsData || []).map(c => ({
          contact_id: c.contacts?.contact_id || c.contact_id,
          is_primary: c.is_primary,
          relationship: c.relationship,
          first_name: c.contacts?.first_name,
          last_name: c.contacts?.last_name,
          job_role: c.contacts?.job_role,
          profile_image_url: c.contacts?.profile_image_url
        })).filter(c => c.first_name || c.last_name);

        setRightPanelCompanyDetails({
          company,
          logoUrl,
          domains: domains || [],
          tags: transformedTags,
          cities: transformedCities,
          contacts: transformedContacts
        });
      } catch (err) {
        console.error('Error fetching company details:', err);
        setRightPanelCompanyDetails(null);
      } finally {
        setLoadingRightPanelCompany(false);
      }
    };

    fetchCompanyDetails();
  }, [selectedRightPanelCompanyId, rightPanelCompanyRefreshKey]);

  // Fetch contacts from task-linked chats
  useEffect(() => {
    const fetchChatContacts = async () => {
      if (activeTab !== 'tasks' || tasksLinkedChats.length === 0) {
        setTasksChatContacts([]);
        return;
      }

      try {
        const chatIds = tasksLinkedChats.map(c => c.id);
        const { data, error } = await supabase
          .from('contact_chats')
          .select('contact_id, contacts(contact_id, first_name, last_name, profile_image_url, show_missing)')
          .in('chat_id', chatIds);

        if (error) throw error;

        const uniqueContacts = [];
        const seen = new Set();
        (data || []).forEach(cc => {
          if (cc.contacts && !seen.has(cc.contacts.contact_id)) {
            seen.add(cc.contacts.contact_id);
            uniqueContacts.push(cc.contacts);
          }
        });

        setTasksChatContacts(uniqueContacts);
      } catch (err) {
        console.error('Error fetching chat contacts:', err);
        setTasksChatContacts([]);
      }
    };

    fetchChatContacts();
  }, [activeTab, tasksLinkedChats]);

  // Fetch contacts from task-linked companies
  useEffect(() => {
    const fetchCompanyContacts = async () => {
      if (activeTab !== 'tasks' || tasksLinkedCompanies.length === 0) {
        setTasksCompanyContacts([]);
        return;
      }

      try {
        const companyIds = tasksLinkedCompanies.map(c => c.company_id);
        const { data, error } = await supabase
          .from('contact_companies')
          .select('contact_id, contacts(contact_id, first_name, last_name, profile_image_url, show_missing)')
          .in('company_id', companyIds);

        if (error) throw error;

        const uniqueContacts = [];
        const seen = new Set();
        (data || []).forEach(cc => {
          if (cc.contacts && !seen.has(cc.contacts.contact_id)) {
            seen.add(cc.contacts.contact_id);
            uniqueContacts.push(cc.contacts);
          }
        });

        setTasksCompanyContacts(uniqueContacts);
      } catch (err) {
        console.error('Error fetching company contacts:', err);
        setTasksCompanyContacts([]);
      }
    };

    fetchCompanyContacts();
  }, [activeTab, tasksLinkedCompanies]);

  // Fetch contacts from task-linked deals
  useEffect(() => {
    const fetchDealsContacts = async () => {
      if (activeTab !== 'tasks' || tasksLinkedDeals.length === 0) {
        setTasksDealsContacts([]);
        return;
      }

      try {
        const dealIds = tasksLinkedDeals.map(d => d.deal_id);
        const { data, error } = await supabase
          .from('deals_contacts')
          .select('contact_id, contacts(contact_id, first_name, last_name, profile_image_url, show_missing)')
          .in('deal_id', dealIds);

        if (error) throw error;

        const uniqueContacts = [];
        const seen = new Set();
        (data || []).forEach(dc => {
          if (dc.contacts && !seen.has(dc.contacts.contact_id)) {
            seen.add(dc.contacts.contact_id);
            uniqueContacts.push(dc.contacts);
          }
        });

        setTasksDealsContacts(uniqueContacts);
      } catch (err) {
        console.error('Error fetching deals contacts:', err);
        setTasksDealsContacts([]);
      }
    };

    fetchDealsContacts();
  }, [activeTab, tasksLinkedDeals]);

  // Compute available contacts for ContactSelector based on active tab
  const availableRightPanelContacts = useMemo(() => {
    if (activeTab === 'whatsapp' && archivedWhatsappContact) {
      return [{
        contact_id: archivedWhatsappContact.contact_id,
        first_name: archivedWhatsappContact.first_name,
        last_name: archivedWhatsappContact.last_name,
        email: null,
        role: 'Contact',
        completeness_score: archivedWhatsappContact.completeness_score || 0,
        show_missing: archivedWhatsappContact.show_missing,
        profile_image_url: archivedWhatsappContact.profile_image_url,
      }];
    }

    if (['email', 'whatsapp', 'calendar', 'deals'].includes(activeTab)) {
      return (emailContacts || [])
        .filter(c => c.contact?.contact_id)
        .map(c => ({
          contact_id: c.contact.contact_id,
          first_name: c.contact.first_name,
          last_name: c.contact.last_name,
          email: c.email || c.contact.email,
          role: c.roles?.[0] || 'Contact',
          completeness_score: c.contact.completeness_score || 0,
          show_missing: c.contact.show_missing,
          profile_image_url: c.contact.profile_image_url,
        }));
    }

    if (activeTab === 'introductions' && selectedIntroductionItem?.contacts) {
      return selectedIntroductionItem.contacts
        .filter(c => c.contact_id)
        .map(c => ({
          contact_id: c.contact_id,
          first_name: c.first_name,
          last_name: c.last_name,
          email: null,
          role: c.role || 'Contact',
          completeness_score: c.completeness_score || 0,
          show_missing: c.show_missing,
          profile_image_url: c.profile_image_url,
        }));
    }

    if (activeTab === 'keepintouch' && selectedKeepInTouchContact) {
      return [{
        contact_id: selectedKeepInTouchContact.contact_id,
        first_name: selectedKeepInTouchContact.full_name?.split(' ')[0] || '',
        last_name: selectedKeepInTouchContact.full_name?.split(' ').slice(1).join(' ') || '',
        email: null,
        role: 'Contact',
        completeness_score: keepInTouchContactDetails?.completeness_score || 0,
        show_missing: keepInTouchContactDetails?.show_missing,
        profile_image_url: keepInTouchContactDetails?.profile_image_url,
      }];
    }

    if (activeTab === 'lists' && selectedListMember) {
      return [{
        contact_id: selectedListMember.contact_id,
        first_name: selectedListMember.first_name || '',
        last_name: selectedListMember.last_name || '',
        email: selectedListMember.email || null,
        role: 'Contact',
        completeness_score: selectedListMember.completeness_score || 0,
        show_missing: selectedListMember.show_missing,
        profile_image_url: selectedListMember.profile_image_url,
      }];
    }

    if (activeTab === 'tasks' && (tasksLinkedContacts.length > 0 || tasksChatContacts.length > 0 || tasksCompanyContacts.length > 0 || tasksDealsContacts.length > 0)) {
      const allContacts = [];
      const seen = new Set();

      tasksLinkedContacts.forEach(c => {
        if (!seen.has(c.contact_id)) {
          seen.add(c.contact_id);
          allContacts.push({
            contact_id: c.contact_id,
            first_name: c.first_name || '',
            last_name: c.last_name || '',
            email: null,
            role: 'Contact',
            completeness_score: c.completeness_score || 0,
            show_missing: c.show_missing,
            profile_image_url: c.profile_image_url,
          });
        }
      });

      tasksCompanyContacts.forEach(c => {
        if (!seen.has(c.contact_id)) {
          seen.add(c.contact_id);
          allContacts.push({
            contact_id: c.contact_id,
            first_name: c.first_name || '',
            last_name: c.last_name || '',
            email: null,
            role: 'Company Contact',
            completeness_score: c.completeness_score || 0,
            show_missing: c.show_missing,
            profile_image_url: c.profile_image_url,
          });
        }
      });

      tasksDealsContacts.forEach(c => {
        if (!seen.has(c.contact_id)) {
          seen.add(c.contact_id);
          allContacts.push({
            contact_id: c.contact_id,
            first_name: c.first_name || '',
            last_name: c.last_name || '',
            email: null,
            role: 'Deal Contact',
            completeness_score: c.completeness_score || 0,
            show_missing: c.show_missing,
            profile_image_url: c.profile_image_url,
          });
        }
      });

      tasksChatContacts.forEach(c => {
        if (!seen.has(c.contact_id)) {
          seen.add(c.contact_id);
          allContacts.push({
            contact_id: c.contact_id,
            first_name: c.first_name || '',
            last_name: c.last_name || '',
            email: null,
            role: 'Chat Contact',
            completeness_score: c.completeness_score || 0,
            show_missing: c.show_missing,
            profile_image_url: c.profile_image_url,
          });
        }
      });

      return allContacts;
    }

    if (activeTab === 'notes' && notesLinkedContacts.length > 0) {
      return notesLinkedContacts.map(c => ({
        contact_id: c.contact_id,
        first_name: c.first_name || '',
        last_name: c.last_name || '',
        email: null,
        role: 'Note Contact',
        completeness_score: c.completeness_score || 0,
        show_missing: c.show_missing,
        profile_image_url: c.profile_image_url,
      }));
    }

    return [];
  }, [activeTab, emailContacts, selectedIntroductionItem, selectedKeepInTouchContact, keepInTouchContactDetails, selectedListMember, tasksLinkedContacts, tasksChatContacts, tasksCompanyContacts, tasksDealsContacts, archivedWhatsappContact, notesLinkedContacts]);

  // Enrich contacts with completeness scores from DB
  const [enrichedRightPanelContacts, setEnrichedRightPanelContacts] = useState([]);

  useEffect(() => {
    const enrichContacts = async () => {
      if (availableRightPanelContacts.length === 0) {
        setEnrichedRightPanelContacts([]);
        return;
      }

      const contactIds = availableRightPanelContacts.map(c => c.contact_id);

      const [completenessResult, contactsResult] = await Promise.all([
        supabase
          .from('contact_completeness')
          .select('contact_id, completeness_score')
          .in('contact_id', contactIds),
        supabase
          .from('contacts')
          .select('contact_id, show_missing, profile_image_url')
          .in('contact_id', contactIds)
      ]);

      const completenessMap = {};
      (completenessResult.data || []).forEach(c => {
        completenessMap[c.contact_id] = c.completeness_score;
      });

      const contactsMap = {};
      (contactsResult.data || []).forEach(c => {
        contactsMap[c.contact_id] = { show_missing: c.show_missing, profile_image_url: c.profile_image_url };
      });

      const enriched = availableRightPanelContacts.map(c => ({
        ...c,
        completeness_score: completenessMap[c.contact_id] ?? c.completeness_score ?? 0,
        show_missing: contactsMap[c.contact_id]?.show_missing ?? c.show_missing,
        profile_image_url: contactsMap[c.contact_id]?.profile_image_url || c.profile_image_url,
      }));

      setEnrichedRightPanelContacts(enriched);
    };

    enrichContacts();
  }, [availableRightPanelContacts]);

  // Auto-select contact when available contacts change
  useEffect(() => {
    if (availableRightPanelContacts.length === 1) {
      setSelectedRightPanelContactId(availableRightPanelContacts[0].contact_id);
    } else if (availableRightPanelContacts.length > 1 && !selectedRightPanelContactId) {
      setSelectedRightPanelContactId(availableRightPanelContacts[0].contact_id);
    } else if (availableRightPanelContacts.length === 0) {
      setSelectedRightPanelContactId(null);
    }
  }, [availableRightPanelContacts]);

  // --- Right panel mutation handlers (extracted from DesktopLayout inline handlers) ---

  const handleRightPanelUpdateContactField = useCallback(async (field, value) => {
    const contactId = selectedRightPanelContactId;
    if (!contactId) return;
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ [field]: value })
        .eq('contact_id', contactId);
      if (error) throw error;
      rightPanelContactDetails?.refetch?.();
      toast.success(`${field} updated`);
    } catch (err) {
      console.error('Error updating contact field:', err);
      toast.error('Failed to update');
    }
  }, [selectedRightPanelContactId, rightPanelContactDetails]);

  const handleUpdateKeepInTouch = useCallback(async (fieldOrUpdates, value) => {
    const contactId = selectedRightPanelContactId;
    if (!contactId) return;

    try {
      const updates = typeof fieldOrUpdates === 'object'
        ? fieldOrUpdates
        : { [fieldOrUpdates]: value };

      const { data: existing } = await supabase
        .from('keep_in_touch')
        .select('id')
        .eq('contact_id', contactId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('keep_in_touch')
          .update(updates)
          .eq('contact_id', contactId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('keep_in_touch')
          .insert({ contact_id: contactId, frequency: 'Not Set', ...updates });
        if (error) throw error;
      }

      if (updates.frequency) {
        const { error: freqError } = await supabase
          .from('contacts')
          .update({ keep_in_touch_frequency: updates.frequency })
          .eq('contact_id', contactId);
        if (freqError) throw freqError;
      }

      rightPanelContactDetails?.refetch?.();

      // Sync with center panel if viewing the same contact in Keep in Touch tab
      onKeepInTouchUpdated?.({ contactId, updates });

      const fieldNames = Object.keys(updates).join(', ');
      toast.success(`${fieldNames} updated`);
    } catch (err) {
      console.error('Error updating keep in touch:', err);
      toast.error('Failed to update');
    }
  }, [selectedRightPanelContactId, rightPanelContactDetails, onKeepInTouchUpdated]);

  const handleMarkContactComplete = useCallback(async () => {
    if (!selectedRightPanelContactId) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ show_missing: false })
        .eq('contact_id', selectedRightPanelContactId);

      if (error) throw error;

      const contactName = `${rightPanelContactDetails?.contact?.first_name || ''} ${rightPanelContactDetails?.contact?.last_name || ''}`.trim() || 'Contact';
      toast.success(`${contactName} marked as complete!`);

      rightPanelContactDetails?.refetch?.();
    } catch (err) {
      console.error('Error marking contact as complete:', err);
      toast.error('Failed to mark contact as complete');
    }
  }, [selectedRightPanelContactId, rightPanelContactDetails]);

  const handleMarkCompanyComplete = useCallback(async () => {
    if (!selectedRightPanelCompanyId) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ show_missing: false })
        .eq('company_id', selectedRightPanelCompanyId);

      if (error) throw error;

      const companyName = rightPanelCompanyDetails?.company?.name || 'Company';
      toast.success(`${companyName} marked as complete!`);

      rightPanelContactDetails?.refetch?.();
      setRightPanelCompanyRefreshKey(k => k + 1);
    } catch (err) {
      console.error('Error marking company as complete:', err);
      toast.error('Failed to mark company as complete');
    }
  }, [selectedRightPanelCompanyId, rightPanelCompanyDetails, rightPanelContactDetails]);

  const handleRemoveCompanyAssociation = useCallback(async () => {
    if (!selectedRightPanelCompanyId || !selectedRightPanelContactId) return;

    const companyName = rightPanelCompanyDetails?.company?.name || 'this company';
    if (!window.confirm(`Remove association with ${companyName}?`)) return;

    try {
      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_id', selectedRightPanelContactId)
        .eq('company_id', selectedRightPanelCompanyId);

      if (error) throw error;

      toast.success(`Removed association with ${companyName}`);

      rightPanelContactDetails?.refetch?.();

      setSelectedRightPanelCompanyId(null);
      setRightPanelCompanyDetails(null);
    } catch (err) {
      console.error('Error removing company association:', err);
      toast.error('Failed to remove association');
    }
  }, [selectedRightPanelCompanyId, selectedRightPanelContactId, rightPanelCompanyDetails, rightPanelContactDetails]);

  return {
    activeActionTab, setActiveActionTab,
    selectedRightPanelContactId, setSelectedRightPanelContactId,
    selectedListMember, setSelectedListMember,
    tasksLinkedContacts, setTasksLinkedContacts,
    tasksLinkedChats, setTasksLinkedChats,
    tasksLinkedCompanies, setTasksLinkedCompanies,
    tasksLinkedDeals, setTasksLinkedDeals,
    tasksChatContacts, setTasksChatContacts,
    tasksCompanyContacts, setTasksCompanyContacts,
    tasksDealsContacts, setTasksDealsContacts,
    notesLinkedContacts, setNotesLinkedContacts,
    notesLinkedCompanies, setNotesLinkedCompanies,
    notesLinkedDeals, setNotesLinkedDeals,
    selectedRightPanelCompanyId, setSelectedRightPanelCompanyId,
    rightPanelCompanyDetails, setRightPanelCompanyDetails,
    loadingRightPanelCompany, setLoadingRightPanelCompany,
    rightPanelCompanyRefreshKey, setRightPanelCompanyRefreshKey,
    rightPanelCompanyEnrichModalOpen, setRightPanelCompanyEnrichModalOpen,
    rightPanelAssociateCompanyModalOpen, setRightPanelAssociateCompanyModalOpen,
    companyMergeModalOpen, setCompanyMergeModalOpen,
    companyMergeCompany, setCompanyMergeCompany,
    companyMainModalOpen, setCompanyMainModalOpen,
    companyMainModalId, setCompanyMainModalId,
    initialSelectedEmail, setInitialSelectedEmail,
    initialSelectedMobile, setInitialSelectedMobile,
    initialSelectedTagId, setInitialSelectedTagId,
    rightPanelContactDetails,
    availableRightPanelContacts,
    enrichedRightPanelContacts,
    handleRightPanelUpdateContactField,
    handleUpdateKeepInTouch,
    handleMarkContactComplete,
    handleMarkCompanyComplete,
    handleRemoveCompanyAssociation,
  };
};

export default useRightPanelState;
