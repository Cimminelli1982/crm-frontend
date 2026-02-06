import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const useIntroductionsData = (activeTab) => {
  const [introductionsList, setIntroductionsList] = useState([]);
  const [introductionsLoading, setIntroductionsLoading] = useState(false);
  const [selectedIntroductionItem, setSelectedIntroductionItem] = useState(null);
  const [introductionsSections, setIntroductionsSections] = useState({
    inbox: true,
    monitoring: true,
    closed: false
  });
  const [introductionsActionTab, setIntroductionsActionTab] = useState('email');
  const [introContactEmails, setIntroContactEmails] = useState([]);
  const [introContactMobiles, setIntroContactMobiles] = useState([]);
  const [selectedIntroEmails, setSelectedIntroEmails] = useState([]);
  const [selectedIntroMobile, setSelectedIntroMobile] = useState('');
  const [creatingIntroGroup, setCreatingIntroGroup] = useState(false);
  const [linkChatModalOpen, setLinkChatModalOpen] = useState(false);
  const [availableChatsToLink, setAvailableChatsToLink] = useState([]);
  const [linkingChat, setLinkingChat] = useState(false);
  const [linkEmailModalOpen, setLinkEmailModalOpen] = useState(false);
  const [availableEmailThreadsToLink, setAvailableEmailThreadsToLink] = useState([]);
  const [introEmailThread, setIntroEmailThread] = useState(null);
  const [introEmailMessages, setIntroEmailMessages] = useState([]);
  const [introEmailLoading, setIntroEmailLoading] = useState(false);
  const [introGroupMessages, setIntroGroupMessages] = useState([]);
  const [introGroupLoading, setIntroGroupLoading] = useState(false);
  const [introGroupInput, setIntroGroupInput] = useState('');
  const [introGroupSending, setIntroGroupSending] = useState(false);
  const [introContactCompanies, setIntroContactCompanies] = useState({});
  const [introContactTags, setIntroContactTags] = useState({});
  // Introduction creation/editing modal states
  const [introductionModalOpen, setIntroductionModalOpen] = useState(false);
  const [introductionSearchQuery, setIntroductionSearchQuery] = useState('');
  const [introductionSearchResults, setIntroductionSearchResults] = useState([]);
  const [searchingIntroductions, setSearchingIntroductions] = useState(false);
  const [selectedIntroducer, setSelectedIntroducer] = useState(null);
  const [selectedIntroducee, setSelectedIntroducee] = useState(null);
  const [introductionStatus, setIntroductionStatus] = useState('Requested');
  const [introductionTool, setIntroductionTool] = useState('email');
  const [introductionCategory, setIntroductionCategory] = useState('Karma Points');
  const [introductionText, setIntroductionText] = useState('');
  const [creatingIntroduction, setCreatingIntroduction] = useState(false);
  const [introducerSearchQuery, setIntroducerSearchQuery] = useState('');
  const [introducerSearchResults, setIntroducerSearchResults] = useState([]);
  const [searchingIntroducer, setSearchingIntroducer] = useState(false);
  const [introduceeSearchQuery, setIntroduceeSearchQuery] = useState('');
  const [introduceeSearchResults, setIntroduceeSearchResults] = useState([]);
  const [searchingIntroducee, setSearchingIntroducee] = useState(false);
  const [selectedIntroducee2, setSelectedIntroducee2] = useState(null);
  const [introducee2SearchQuery, setIntroducee2SearchQuery] = useState('');
  const [introducee2SearchResults, setIntroducee2SearchResults] = useState([]);
  const [searchingIntroducee2, setSearchingIntroducee2] = useState(false);
  const [editingIntroduction, setEditingIntroduction] = useState(null);

  // Filter introductions by section
  const filterIntroductionsBySection = (intros, section) => {
    return intros.filter(intro => {
      if (section === 'inbox') return ['Requested', 'Promised'].includes(intro.status);
      if (section === 'monitoring') return intro.status === 'Done, but need to monitor';
      if (section === 'closed') return ['Done & Dust', 'Aborted'].includes(intro.status);
      return true;
    });
  };

  // Fetch introductions for Introductions tab
  useEffect(() => {
    const fetchIntroductions = async () => {
      if (activeTab !== 'introductions') return;

      setIntroductionsLoading(true);
      try {
        // Fetch introductions with their contacts
        const { data: intros, error } = await supabase
          .from('introductions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch contacts for each introduction
        const introsWithContacts = await Promise.all(
          (intros || []).map(async (intro) => {
            const { data: introContacts } = await supabase
              .from('introduction_contacts')
              .select(`
                role,
                contact:contacts(contact_id, first_name, last_name, description, profile_image_url, show_missing)
              `)
              .eq('introduction_id', intro.introduction_id);

            // Get contact IDs to fetch completeness scores
            const contactIds = (introContacts || [])
              .map(ic => ic.contact?.contact_id)
              .filter(Boolean);

            // Fetch completeness scores for all contacts
            let completenessMap = {};
            if (contactIds.length > 0) {
              const { data: completenessData } = await supabase
                .from('contact_completeness')
                .select('contact_id, completeness_score')
                .in('contact_id', contactIds);

              if (completenessData) {
                completenessData.forEach(c => {
                  completenessMap[c.contact_id] = c.completeness_score;
                });
              }
            }

            const contacts = (introContacts || []).map(ic => ({
              ...ic.contact,
              role: ic.role,
              name: `${ic.contact?.first_name || ''} ${ic.contact?.last_name || ''}`.trim(),
              description: ic.contact?.description || '',
              profile_image_url: ic.contact?.profile_image_url || null,
              completeness_score: completenessMap[ic.contact?.contact_id] || 0,
              show_missing: ic.contact?.show_missing
            }));

            return { ...intro, contacts };
          })
        );

        setIntroductionsList(introsWithContacts);
      } catch (error) {
        console.error('Error fetching introductions:', error);
      } finally {
        setIntroductionsLoading(false);
      }
    };

    fetchIntroductions();
  }, [activeTab]);

  // Fetch emails, mobiles, companies, and tags for ALL introduction contacts
  useEffect(() => {
    const fetchAllIntroContactDetails = async () => {
      if (!selectedIntroductionItem?.contacts?.length) {
        setIntroContactEmails([]);
        setIntroContactMobiles([]);
        setIntroContactCompanies({});
        setIntroContactTags({});
        return;
      }

      const allEmails = [];
      const allMobiles = [];
      const companiesMap = {};
      const tagsMap = {};

      for (const contact of selectedIntroductionItem.contacts) {
        const contactName = contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim();

        // Fetch emails
        const { data: emailsData } = await supabase
          .from('contact_emails')
          .select('email')
          .eq('contact_id', contact.contact_id);

        (emailsData || []).forEach(e => {
          allEmails.push({ email: e.email, contactName, contactId: contact.contact_id });
        });

        // Fetch mobiles with type and is_primary for smart selection
        const { data: mobilesData } = await supabase
          .from('contact_mobiles')
          .select('mobile, type, is_primary')
          .eq('contact_id', contact.contact_id)
          .order('is_primary', { ascending: false });

        (mobilesData || []).forEach(m => {
          // Skip WhatsApp Group type numbers (they're fake)
          if (m.type === 'WhatsApp Group') return;
          allMobiles.push({
            mobile: m.mobile,
            contactName,
            contactId: contact.contact_id,
            firstName: contact.first_name || contactName.split(' ')[0],
            role: contact.role,
            type: m.type,
            isPrimary: m.is_primary,
          });
        });

        // Fetch companies
        const { data: companiesData } = await supabase
          .from('contact_companies')
          .select('company:companies(company_id, name)')
          .eq('contact_id', contact.contact_id);

        companiesMap[contact.contact_id] = (companiesData || [])
          .map(cc => cc.company)
          .filter(c => c);

        // Fetch tags
        const { data: tagsData } = await supabase
          .from('contact_tags')
          .select('tag_id, tags(tag_id, name)')
          .eq('contact_id', contact.contact_id);

        tagsMap[contact.contact_id] = (tagsData || [])
          .map(ct => ct.tags)
          .filter(t => t);
      }

      setIntroContactEmails(allEmails);
      setIntroContactMobiles(allMobiles);
      setIntroContactCompanies(companiesMap);
      setIntroContactTags(tagsMap);
      // Auto-select all emails, first mobile
      setSelectedIntroEmails(allEmails.map(e => e.email));
      if (allMobiles.length > 0) setSelectedIntroMobile(allMobiles[0].mobile);
    };

    fetchAllIntroContactDetails();
  }, [selectedIntroductionItem]);

  // Fetch linked email thread messages when introduction has email_thread_id
  useEffect(() => {
    const fetchIntroEmailThread = async () => {
      if (!selectedIntroductionItem?.email_thread_id) {
        setIntroEmailThread(null);
        setIntroEmailMessages([]);
        return;
      }

      setIntroEmailLoading(true);
      try {
        // Fetch thread info
        const { data: threadData, error: threadError } = await supabase
          .from('email_threads')
          .select('email_thread_id, subject, last_message_timestamp')
          .eq('email_thread_id', selectedIntroductionItem.email_thread_id)
          .maybeSingle();

        if (threadError) throw threadError;
        setIntroEmailThread(threadData);

        // Fetch emails in this thread with sender info
        const { data: emailsData, error: emailsError } = await supabase
          .from('emails')
          .select('email_id, subject, body_plain, body_html, direction, message_timestamp, sender:contacts!fk_emails_sender_contact(first_name, last_name)')
          .eq('email_thread_id', selectedIntroductionItem.email_thread_id)
          .order('message_timestamp', { ascending: true });

        if (emailsError) throw emailsError;
        setIntroEmailMessages(emailsData || []);
      } catch (err) {
        console.error('Error fetching intro email thread:', err);
        setIntroEmailThread(null);
        setIntroEmailMessages([]);
      } finally {
        setIntroEmailLoading(false);
      }
    };

    fetchIntroEmailThread();
  }, [selectedIntroductionItem?.email_thread_id]);

  // Fetch WhatsApp group messages when introduction has a group JID
  useEffect(() => {
    const fetchIntroGroupMessages = async () => {
      // Need either chat_id (robust) or whatsapp_group_jid/name (fallback)
      if (!selectedIntroductionItem?.chat_id && !selectedIntroductionItem?.whatsapp_group_jid) {
        setIntroGroupMessages([]);
        return;
      }

      setIntroGroupLoading(true);
      try {
        let externalChatId = null;
        let chatName = selectedIntroductionItem.whatsapp_group_name;
        const crmChatId = selectedIntroductionItem.chat_id;

        // If we have chat_id FK, get the external_chat_id from chats table
        if (crmChatId) {
          const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .select('external_chat_id, chat_name')
            .eq('id', crmChatId)
            .maybeSingle();

          if (chatError) {
            console.error('Error fetching chat:', chatError);
          } else if (chatData) {
            externalChatId = chatData.external_chat_id;
            chatName = chatData.chat_name || chatName;
          }
        }

        // 1. Fetch staging messages from command_center_inbox
        let stagingQuery = supabase
          .from('command_center_inbox')
          .select('*')
          .eq('type', 'whatsapp')
          .eq('is_group_chat', true);

        // Match by external_chat_id if available, otherwise by chat_name
        if (externalChatId) {
          stagingQuery = stagingQuery.eq('chat_id', externalChatId);
        } else if (chatName) {
          stagingQuery = stagingQuery.eq('chat_name', chatName);
        }

        const { data: stagingMessages, error: stagingError } = await stagingQuery.order('date', { ascending: true });

        if (stagingError) {
          console.error('Error fetching staging messages:', stagingError);
        }

        // 2. Fetch archived messages from interactions (if we have chat_id)
        let archivedMessages = [];
        if (crmChatId) {
          const { data: interactions, error: interactionsError } = await supabase
            .from('interactions')
            .select('interaction_id, interaction_type, direction, interaction_date, summary, external_interaction_id')
            .eq('chat_id', crmChatId)
            .eq('interaction_type', 'whatsapp')
            .order('interaction_date', { ascending: true });

          if (interactionsError) {
            console.error('Error fetching archived messages:', interactionsError);
          } else {
            archivedMessages = interactions || [];
          }
        }

        // 3. Combine staging and archived messages
        const stagingFormatted = (stagingMessages || []).map(m => ({
          id: m.id || m.message_uid,
          body_text: m.body_text || m.snippet,
          direction: m.direction,
          date: m.date,
          from_name: m.from_name || m.first_name,
          isArchived: false,
        }));

        const archivedFormatted = archivedMessages.map(m => ({
          id: m.interaction_id,
          body_text: m.summary,
          direction: m.direction,
          date: m.interaction_date,
          from_name: null,
          isArchived: true,
        }));

        // Combine and sort by date
        const allMessages = [...stagingFormatted, ...archivedFormatted].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        setIntroGroupMessages(allMessages);
      } catch (err) {
        console.error('Error fetching intro group messages:', err);
      } finally {
        setIntroGroupLoading(false);
      }
    };

    fetchIntroGroupMessages();

    // Set up polling for new messages
    const interval = setInterval(fetchIntroGroupMessages, 10000);
    return () => clearInterval(interval);
  }, [selectedIntroductionItem?.chat_id, selectedIntroductionItem?.whatsapp_group_jid, selectedIntroductionItem?.whatsapp_group_name]);

  // Send message to introduction WhatsApp group
  const sendIntroGroupMessage = async () => {
    // Need baileys JID to send via Baileys
    if (!introGroupInput.trim() || !selectedIntroductionItem?.whatsapp_group_jid || introGroupSending) return;

    setIntroGroupSending(true);
    try {
      const response = await fetch('https://command-center-backend-production.up.railway.app/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: selectedIntroductionItem.whatsapp_group_jid, // Baileys JID for sending
          message: introGroupInput.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add optimistic message
      setIntroGroupMessages(prev => [...prev, {
        id: `temp-${Date.now()}`,
        body_text: introGroupInput.trim(),
        direction: 'sent',
        date: new Date().toISOString(),
        from_name: 'You',
        isArchived: false,
      }]);

      setIntroGroupInput('');
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending group message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIntroGroupSending(false);
    }
  };

  // Handler for editing introduction (used by IntroductionsTab)
  const handleEditIntroduction = (intro) => {
    setEditingIntroduction(intro);
    setIntroductionStatus(intro.status || 'Requested');
    setIntroductionTool(intro.introduction_tool || 'email');
    setIntroductionCategory(intro.category || 'Karma Points');
    setIntroductionText(intro.text || '');
    const introducees = intro.contacts?.filter(c => c.role === 'introducee') || [];
    setSelectedIntroducee(introducees[0] || null);
    setSelectedIntroducee2(introducees[1] || null);
    setIntroductionModalOpen(true);
  };

  // Handler for deleting introduction (used by IntroductionsTab and DesktopLayout)
  const handleDeleteIntroduction = async (introductionId, { skipConfirm = false } = {}) => {
    if (!skipConfirm && !window.confirm('Delete this introduction?')) return;
    await supabase.from('introduction_contacts').delete().eq('introduction_id', introductionId);
    const { error } = await supabase
      .from('introductions')
      .delete()
      .eq('introduction_id', introductionId);
    if (!error) {
      setIntroductionsList(prev => prev.filter(i => i.introduction_id !== introductionId));
      setSelectedIntroductionItem(prev => prev?.introduction_id === introductionId ? null : prev);
    }
  };

  // Generic field updater for introduction details (status, tool, category, date, notes)
  const updateIntroductionField = useCallback(async (field, value) => {
    if (!selectedIntroductionItem?.introduction_id) return;
    const { error } = await supabase.from('introductions').update({ [field]: value })
      .eq('introduction_id', selectedIntroductionItem.introduction_id);
    if (error) {
      console.error('Error updating introduction field:', error);
      toast.error('Failed to update');
      return;
    }
    setSelectedIntroductionItem(prev => ({ ...prev, [field]: value }));
    setIntroductionsList(prev => prev.map(i =>
      i.introduction_id === selectedIntroductionItem.introduction_id ? { ...i, [field]: value } : i
    ));
  }, [selectedIntroductionItem?.introduction_id]);

  // Unlink email thread from introduction
  const handleUnlinkIntroductionEmailThread = useCallback(async () => {
    if (!selectedIntroductionItem?.introduction_id) return;
    const { error } = await supabase.from('introductions').update({ email_thread_id: null })
      .eq('introduction_id', selectedIntroductionItem.introduction_id);
    if (error) {
      console.error('Error unlinking email thread:', error);
      toast.error('Failed to unlink');
      return;
    }
    const updated = { ...selectedIntroductionItem, email_thread_id: null, email_thread: null };
    setSelectedIntroductionItem(updated);
    setIntroductionsList(prev => prev.map(i =>
      i.introduction_id === updated.introduction_id ? updated : i
    ));
    toast.success('Email thread unlinked');
  }, [selectedIntroductionItem]);

  // Callback when introduction status is updated (e.g. from SendEmailTab)
  const handleIntroductionStatusUpdated = useCallback((introId, newStatus) => {
    setSelectedIntroductionItem(prev => prev ? { ...prev, status: newStatus } : prev);
    setIntroductionsList(prev => prev.map(i =>
      i.introduction_id === introId ? { ...i, status: newStatus } : i
    ));
    toast.success(`Introduction marked as "${newStatus}"`);
  }, []);

  // Edit introduction with contacts fetched from DB (used in right panel)
  const handleEditIntroductionWithContacts = useCallback(async (intro) => {
    const { data: introContacts } = await supabase
      .from('introduction_contacts')
      .select(`
        contact_id,
        role,
        contacts(contact_id, first_name, last_name)
      `)
      .eq('introduction_id', intro.introduction_id);

    const contacts = (introContacts || []).map(ic => ({
      contact_id: ic.contact_id,
      first_name: ic.contacts?.first_name || '',
      last_name: ic.contacts?.last_name || '',
      name: `${ic.contacts?.first_name || ''} ${ic.contacts?.last_name || ''}`.trim(),
      role: ic.role,
    }));

    handleEditIntroduction({ ...intro, contacts });
  }, []);

  // Handler for creating WhatsApp group for introduction
  const handleCreateIntroWhatsAppGroup = async () => {
    if (!selectedIntroductionItem || introContactMobiles.length === 0) {
      toast.error('No phone numbers available');
      return;
    }

    // Get introducees (the people being introduced to each other)
    const introducees = selectedIntroductionItem.contacts?.filter(c => c.role === 'introducee') || [];
    if (introducees.length < 2) {
      toast.error('Need at least 2 introducees to create a group');
      return;
    }

    // Get best phone number for each introducee (prefer is_primary, exclude WhatsApp Group type)
    const phonesForGroup = [];
    const firstNames = [];
    const contactIds = []; // Collect contact IDs for linking to chat

    for (const introducee of introducees) {
      // Find mobiles for this contact
      const contactMobiles = introContactMobiles.filter(m => m.contactId === introducee.contact_id);
      if (contactMobiles.length === 0) {
        toast.error(`No phone number for ${introducee.first_name || introducee.name}`);
        return;
      }
      // Prefer primary, then first available
      const bestMobile = contactMobiles.find(m => m.isPrimary) || contactMobiles[0];
      phonesForGroup.push(bestMobile.mobile);
      firstNames.push(bestMobile.firstName || introducee.first_name || 'Unknown');
      contactIds.push(introducee.contact_id);
    }

    // Group name: "FirstName <> FirstName"
    const groupName = firstNames.join(' <> ');

    // Prepare draft message for after group creation
    const draftMessage = selectedIntroductionItem.text || `Ciao! Vi presento: ${firstNames.join(' e ')}.`;

    setCreatingIntroGroup(true);
    try {
      const response = await fetch('https://command-center-backend-production.up.railway.app/whatsapp/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          phones: phonesForGroup,
          contactIds: contactIds, // Send contact IDs for linking
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create group');
      }

      // Update introduction with status, tool, group info AND chat_id FK
      await supabase
        .from('introductions')
        .update({
          status: 'Done, but need to monitor',
          introduction_tool: 'whatsapp',
          whatsapp_group_jid: data.groupJid,
          whatsapp_group_name: groupName,
          chat_id: data.chatId, // New: FK to chats table for robust linking
        })
        .eq('introduction_id', selectedIntroductionItem.introduction_id);

      // Refresh introductions list with new group info
      const updatedIntro = {
        ...selectedIntroductionItem,
        status: 'Done, but need to monitor',
        introduction_tool: 'whatsapp',
        whatsapp_group_jid: data.groupJid,
        whatsapp_group_name: groupName,
        chat_id: data.chatId,
      };
      setIntroductionsList(prev => prev.map(intro =>
        intro.introduction_id === selectedIntroductionItem.introduction_id
          ? updatedIntro
          : intro
      ));
      setSelectedIntroductionItem(updatedIntro);

      // Put draft message in input for user to edit and send
      setIntroGroupInput(draftMessage);

      toast.success(`Group "${groupName}" created! Edit the message and press send.`);

      if (data.invalidPhones?.length > 0) {
        toast.warning(`${data.invalidPhones.length} number(s) not on WhatsApp`);
      }
    } catch (error) {
      console.error('Error creating WhatsApp group:', error);
      toast.error(error.message || 'Failed to create WhatsApp group');
    } finally {
      setCreatingIntroGroup(false);
    }
  };

  // Open modal to link existing chat to introduction
  const handleOpenLinkChatModal = async () => {
    try {
      // Fetch available group chats that aren't already linked to this introduction
      const { data: groupChats, error } = await supabase
        .from('chats')
        .select('id, chat_name, external_chat_id, baileys_jid')
        .eq('is_group_chat', true)
        .order('chat_name');

      if (error) {
        console.error('Error fetching group chats:', error);
        toast.error('Failed to load available chats');
        return;
      }

      setAvailableChatsToLink(groupChats || []);
      setLinkChatModalOpen(true);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load chats');
    }
  };

  // Link selected chat to introduction
  const handleLinkChatToIntro = async (chat) => {
    if (!selectedIntroductionItem || !chat) return;

    setLinkingChat(true);
    try {
      // Update introduction with chat_id and group info
      const { error } = await supabase
        .from('introductions')
        .update({
          chat_id: chat.id,
          whatsapp_group_jid: chat.baileys_jid || null,
          whatsapp_group_name: chat.chat_name,
        })
        .eq('introduction_id', selectedIntroductionItem.introduction_id);

      if (error) {
        throw error;
      }

      // Update local state
      const updatedIntro = {
        ...selectedIntroductionItem,
        chat_id: chat.id,
        whatsapp_group_jid: chat.baileys_jid || null,
        whatsapp_group_name: chat.chat_name,
      };
      setIntroductionsList(prev => prev.map(intro =>
        intro.introduction_id === selectedIntroductionItem.introduction_id
          ? updatedIntro
          : intro
      ));
      setSelectedIntroductionItem(updatedIntro);

      toast.success(`Linked to "${chat.chat_name}"`);
      setLinkChatModalOpen(false);
    } catch (error) {
      console.error('Error linking chat:', error);
      toast.error('Failed to link chat');
    } finally {
      setLinkingChat(false);
    }
  };

  // Open modal to link existing email thread to introduction
  const handleOpenLinkEmailModal = async () => {
    if (!selectedIntroductionItem) return;

    try {
      // Get contact IDs from the introduction
      const contactIds = selectedIntroductionItem.contacts?.map(c => c.contact_id) || [];

      if (contactIds.length === 0) {
        toast.error('No contacts in this introduction');
        return;
      }

      // Fetch email threads where these contacts are participants
      const { data: participantData, error: partError } = await supabase
        .from('email_participants')
        .select('email_id, contact_id')
        .in('contact_id', contactIds);

      if (partError) throw partError;

      if (!participantData || participantData.length === 0) {
        toast.error('No email threads found for these contacts');
        return;
      }

      // Get unique email IDs
      const emailIds = [...new Set(participantData.map(p => p.email_id))];

      // Fetch emails to get thread IDs
      const { data: emailsData, error: emailsError } = await supabase
        .from('emails')
        .select('email_id, email_thread_id')
        .in('email_id', emailIds);

      if (emailsError) throw emailsError;

      // Get unique thread IDs
      const threadIds = [...new Set(emailsData?.map(e => e.email_thread_id).filter(Boolean) || [])];

      if (threadIds.length === 0) {
        toast.error('No email threads found');
        return;
      }

      // Fetch thread details
      const { data: threads, error: threadsError } = await supabase
        .from('email_threads')
        .select('email_thread_id, subject, last_message_timestamp')
        .in('email_thread_id', threadIds)
        .order('last_message_timestamp', { ascending: false });

      if (threadsError) throw threadsError;

      setAvailableEmailThreadsToLink(threads || []);
      setLinkEmailModalOpen(true);
    } catch (err) {
      console.error('Error fetching email threads:', err);
      toast.error('Failed to load email threads');
    }
  };

  // Link selected email thread to introduction
  const handleLinkEmailToIntro = async (thread) => {
    if (!selectedIntroductionItem || !thread) return;

    try {
      const { error } = await supabase
        .from('introductions')
        .update({ email_thread_id: thread.email_thread_id })
        .eq('introduction_id', selectedIntroductionItem.introduction_id);

      if (error) throw error;

      // Update local state
      const updatedIntro = {
        ...selectedIntroductionItem,
        email_thread_id: thread.email_thread_id,
        email_thread: thread,
      };
      setIntroductionsList(prev => prev.map(intro =>
        intro.introduction_id === selectedIntroductionItem.introduction_id
          ? updatedIntro
          : intro
      ));
      setSelectedIntroductionItem(updatedIntro);

      toast.success(`Linked to "${thread.subject || 'Email thread'}"`);
      setLinkEmailModalOpen(false);
    } catch (error) {
      console.error('Error linking email thread:', error);
      toast.error('Failed to link email thread');
    }
  };

  return {
    // State
    introductionsList,
    setIntroductionsList,
    introductionsLoading,
    setIntroductionsLoading,
    selectedIntroductionItem,
    setSelectedIntroductionItem,
    introductionsSections,
    setIntroductionsSections,
    introductionsActionTab,
    setIntroductionsActionTab,
    introContactEmails,
    setIntroContactEmails,
    introContactMobiles,
    setIntroContactMobiles,
    selectedIntroEmails,
    setSelectedIntroEmails,
    selectedIntroMobile,
    setSelectedIntroMobile,
    creatingIntroGroup,
    setCreatingIntroGroup,
    linkChatModalOpen,
    setLinkChatModalOpen,
    availableChatsToLink,
    setAvailableChatsToLink,
    linkingChat,
    setLinkingChat,
    linkEmailModalOpen,
    setLinkEmailModalOpen,
    availableEmailThreadsToLink,
    setAvailableEmailThreadsToLink,
    introEmailThread,
    setIntroEmailThread,
    introEmailMessages,
    setIntroEmailMessages,
    introEmailLoading,
    setIntroEmailLoading,
    introGroupMessages,
    setIntroGroupMessages,
    introGroupLoading,
    setIntroGroupLoading,
    introGroupInput,
    setIntroGroupInput,
    introGroupSending,
    setIntroGroupSending,
    introContactCompanies,
    setIntroContactCompanies,
    introContactTags,
    setIntroContactTags,
    introductionModalOpen,
    setIntroductionModalOpen,
    introductionSearchQuery,
    setIntroductionSearchQuery,
    introductionSearchResults,
    setIntroductionSearchResults,
    searchingIntroductions,
    setSearchingIntroductions,
    selectedIntroducer,
    setSelectedIntroducer,
    selectedIntroducee,
    setSelectedIntroducee,
    introductionStatus,
    setIntroductionStatus,
    introductionTool,
    setIntroductionTool,
    introductionCategory,
    setIntroductionCategory,
    introductionText,
    setIntroductionText,
    creatingIntroduction,
    setCreatingIntroduction,
    introducerSearchQuery,
    setIntroducerSearchQuery,
    introducerSearchResults,
    setIntroducerSearchResults,
    searchingIntroducer,
    setSearchingIntroducer,
    introduceeSearchQuery,
    setIntroduceeSearchQuery,
    introduceeSearchResults,
    setIntroduceeSearchResults,
    searchingIntroducee,
    setSearchingIntroducee,
    selectedIntroducee2,
    setSelectedIntroducee2,
    introducee2SearchQuery,
    setIntroducee2SearchQuery,
    introducee2SearchResults,
    setIntroducee2SearchResults,
    searchingIntroducee2,
    setSearchingIntroducee2,
    editingIntroduction,
    setEditingIntroduction,

    // Handlers
    filterIntroductionsBySection,
    sendIntroGroupMessage,
    handleEditIntroduction,
    handleDeleteIntroduction,
    handleCreateIntroWhatsAppGroup,
    handleOpenLinkChatModal,
    handleLinkChatToIntro,
    handleOpenLinkEmailModal,
    handleLinkEmailToIntro,
    updateIntroductionField,
    handleUnlinkIntroductionEmailThread,
    handleIntroductionStatusUpdated,
    handleEditIntroductionWithContacts,
  };
};

export default useIntroductionsData;
