import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const useWhatsAppData = (activeTab) => {
  // WhatsApp state
  const [whatsappMessages, setWhatsappMessages] = useState([]);
  const [whatsappChats, setWhatsappChats] = useState([]); // Grouped by chat_id
  const [selectedWhatsappChat, setSelectedWhatsappChat] = useState(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappRefreshTrigger, setWhatsappRefreshTrigger] = useState(0);

  // Baileys WhatsApp connection status
  const [baileysStatus, setBaileysStatus] = useState({ status: 'unknown', hasQR: false });
  const [showBaileysQRModal, setShowBaileysQRModal] = useState(false);

  // WhatsApp search state (for searching saved/archived chats)
  const [whatsappSearchQuery, setWhatsappSearchQuery] = useState('');
  const [whatsappSearchResults, setWhatsappSearchResults] = useState([]);
  const [whatsappSearchLoading, setWhatsappSearchLoading] = useState(false);
  const [isSearchingWhatsapp, setIsSearchingWhatsapp] = useState(false);
  const [archivedWhatsappContact, setArchivedWhatsappContact] = useState(null);

  // New WhatsApp message modal
  const [newWhatsAppModalOpen, setNewWhatsAppModalOpen] = useState(false);
  const [newWhatsAppContact, setNewWhatsAppContact] = useState(null);
  const [newWhatsAppMessage, setNewWhatsAppMessage] = useState('');
  const [newWhatsAppSearchQuery, setNewWhatsAppSearchQuery] = useState('');
  const [newWhatsAppSearchResults, setNewWhatsAppSearchResults] = useState([]);
  const [newWhatsAppSending, setNewWhatsAppSending] = useState(false);

  // --- Helper Functions ---

  // Search saved/archived WhatsApp chats
  const searchSavedWhatsapp = useCallback(async (query) => {
    if (!query.trim()) {
      setWhatsappSearchResults([]);
      setIsSearchingWhatsapp(false);
      return;
    }
    setWhatsappSearchLoading(true);
    setIsSearchingWhatsapp(true);
    try {
      const { data, error } = await supabase.rpc('search_whatsapp', {
        search_query: query.trim(),
        result_limit: 100
      });
      if (error) throw error;
      setWhatsappSearchResults(data || []);
    } catch (error) {
      console.error('Error searching WhatsApp:', error);
      toast.error('Search failed');
      setWhatsappSearchResults([]);
    } finally {
      setWhatsappSearchLoading(false);
    }
  }, []);

  // Group WhatsApp messages by chat_id
  const groupWhatsAppByChat = (messages) => {
    const chatMap = {};
    messages.forEach(msg => {
      const chatId = msg.chat_id || msg.id;
      if (!chatMap[chatId]) {
        chatMap[chatId] = {
          chat_id: chatId,
          chat_name: msg.chat_name || msg.from_name,
          contact_number: msg.contact_number,
          is_group_chat: msg.is_group_chat,
          messages: [],
          latestMessage: msg,
          status: msg.status || null
        };
      }
      chatMap[chatId].messages.push(msg);
      // Update latest message if this one is newer
      if (new Date(msg.date) > new Date(chatMap[chatId].latestMessage.date)) {
        chatMap[chatId].latestMessage = msg;
        chatMap[chatId].status = msg.status || null;
      }
    });
    // Convert to array and sort by latest message date
    return Object.values(chatMap).sort((a, b) =>
      new Date(b.latestMessage.date) - new Date(a.latestMessage.date)
    );
  };

  // --- useEffects ---

  // Fetch WhatsApp messages from Supabase
  useEffect(() => {
    const fetchWhatsApp = async () => {
      setWhatsappLoading(true);
      const { data, error } = await supabase
        .from('command_center_inbox')
        .select('*')
        .eq('type', 'whatsapp')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching WhatsApp messages:', error);
      } else {
        setWhatsappMessages(data || []);
        // Group by chat_id
        let grouped = groupWhatsAppByChat(data || []);

        // Fetch contact profile images by matching phone numbers
        const phoneNumbers = [...new Set(grouped.map(c => c.contact_number).filter(Boolean))];
        if (phoneNumbers.length > 0) {
          // Normalize phone numbers for matching (remove non-digits except leading +)
          const normalizePhone = (p) => p ? p.replace(/[^\d+]/g, '').replace(/^00/, '+') : '';

          // Fetch contacts with their mobiles (increase limit to cover all records)
          const { data: contactMobiles } = await supabase
            .from('contact_mobiles')
            .select('contact_id, mobile')
            .limit(5000);

          const { data: contacts } = await supabase
            .from('contacts')
            .select('contact_id, profile_image_url')
            .not('profile_image_url', 'is', null)
            .limit(5000);

          if (contactMobiles && contacts) {
            // Create lookup: normalized phone -> profile_image_url
            const phoneToImage = {};
            contactMobiles.forEach(cm => {
              const contact = contacts.find(c => c.contact_id === cm.contact_id);
              if (contact?.profile_image_url) {
                phoneToImage[normalizePhone(cm.mobile)] = contact.profile_image_url;
              }
            });

            // Add profile_image_url to each chat
            grouped = grouped.map(chat => ({
              ...chat,
              profile_image_url: phoneToImage[normalizePhone(chat.contact_number)] || null
            }));
          }
        }

        setWhatsappChats(grouped);
        if (grouped.length > 0) {
          setSelectedWhatsappChat(grouped[0]);
        }
      }
      setWhatsappLoading(false);
    };

    if (activeTab === 'whatsapp') {
      fetchWhatsApp();
    }
  }, [activeTab, whatsappRefreshTrigger]);

  // Check Baileys connection status periodically (when WhatsApp tab is active)
  useEffect(() => {
    const checkBaileysStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/whatsapp/status`);
        const data = await res.json();
        setBaileysStatus(data);
      } catch (e) {
        setBaileysStatus({ status: 'error', error: e.message });
      }
    };

    if (activeTab === 'whatsapp') {
      checkBaileysStatus();
      const interval = setInterval(checkBaileysStatus, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Debounced WhatsApp search effect
  useEffect(() => {
    if (activeTab === 'whatsapp' && whatsappSearchQuery.trim()) {
      const debounce = setTimeout(() => {
        searchSavedWhatsapp(whatsappSearchQuery);
      }, 300);
      return () => clearTimeout(debounce);
    } else if (!whatsappSearchQuery.trim()) {
      setWhatsappSearchResults([]);
      setIsSearchingWhatsapp(false);
      setArchivedWhatsappContact(null);
    }
  }, [whatsappSearchQuery, activeTab, searchSavedWhatsapp]);

  // Clear WhatsApp search when switching tabs
  useEffect(() => {
    if (activeTab !== 'whatsapp') {
      setWhatsappSearchQuery('');
      setWhatsappSearchResults([]);
      setIsSearchingWhatsapp(false);
      setArchivedWhatsappContact(null);
    }
  }, [activeTab]);

  // Clear archivedWhatsappContact when selecting a normal (non-archived) chat
  useEffect(() => {
    if (selectedWhatsappChat && !selectedWhatsappChat._isArchivedChat) {
      setArchivedWhatsappContact(null);
    }
  }, [selectedWhatsappChat]);

  // --- Handlers ---

  // handleWhatsAppDone - synchronous done handler
  // NOTE: This handler references `setSaving` which is shared state from CommandCenterPage.
  // It is passed in via the `setSaving` parameter.
  const handleWhatsAppDone = async (setSaving) => {
    if (!selectedWhatsappChat) return;

    setSaving(true);
    try {
      const chatId = selectedWhatsappChat.chat_id;
      const messages = selectedWhatsappChat.messages || [];
      const contactPhone = selectedWhatsappChat.contact_number;

      // 1. Find or create the chat in chats table
      let crmChatId = null;

      // First try to find by external_chat_id (TimelinesAI ID)
      const { data: existingChat, error: chatFindError } = await supabase
        .from('chats')
        .select('id')
        .eq('external_chat_id', chatId)
        .maybeSingle();

      if (chatFindError) {
        console.error('Error finding chat by external_chat_id:', chatFindError);
      }

      if (existingChat) {
        crmChatId = existingChat.id;
      } else if (selectedWhatsappChat.is_group_chat && selectedWhatsappChat.chat_name) {
        // For groups: also try to match by chat_name (for groups created via Baileys that don't have external_chat_id yet)
        const { data: chatByName, error: nameError } = await supabase
          .from('chats')
          .select('id, external_chat_id')
          .eq('chat_name', selectedWhatsappChat.chat_name)
          .eq('is_group_chat', true)
          .is('external_chat_id', null) // Only match if external_chat_id is not set yet
          .maybeSingle();

        if (nameError) {
          console.error('Error finding chat by name:', nameError);
        }

        if (chatByName) {
          crmChatId = chatByName.id;
          // Update external_chat_id on the existing chat (linking Baileys JID -> TimelinesAI ID)
          const { error: updateError } = await supabase
            .from('chats')
            .update({ external_chat_id: chatId })
            .eq('id', chatByName.id);

          if (updateError) {
            console.error('Error updating external_chat_id:', updateError);
          } else {
            console.log(`Linked TimelinesAI chat_id ${chatId} to existing chat ${chatByName.id}`);
          }
        }
      }

      // If still no match, create new chat
      if (!crmChatId) {
        const { data: newChat, error: chatCreateError } = await supabase
          .from('chats')
          .insert({
            chat_name: selectedWhatsappChat.chat_name || selectedWhatsappChat.contact_number,
            is_group_chat: selectedWhatsappChat.is_group_chat || false,
            category: selectedWhatsappChat.is_group_chat ? 'group' : 'individual',
            external_chat_id: chatId,
            created_by: 'Edge Function'
          })
          .select('id')
          .single();

        if (chatCreateError) {
          console.error('Error creating chat:', chatCreateError);
          toast.error('Failed to create chat record');
          setSaving(false);
          return;
        }
        crmChatId = newChat.id;
      }

      // 2. Find contact by phone number (consistent with email flow)
      let contactId = null;
      if (contactPhone && !selectedWhatsappChat.is_group_chat) {
        // Normalize phone: remove spaces, dashes, parentheses
        const normalizedPhone = contactPhone.replace(/[\s\-\(\)]/g, '');
        // Also try without leading +
        const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');

        const { data: contactMobile, error: mobileError } = await supabase
          .from('contact_mobiles')
          .select('contact_id')
          .or(`mobile.ilike.%${normalizedPhone}%,mobile.ilike.%${phoneWithoutPlus}%`)
          .limit(1)
          .maybeSingle();

        if (mobileError) {
          console.error('Error finding contact by phone:', mobileError);
        } else if (contactMobile) {
          contactId = contactMobile.contact_id;
          console.log('Found contact for phone:', contactPhone, '-> contact_id:', contactId);
        }
      }

      // 3. Link chat to contact (like contact_email_threads for email)
      if (crmChatId && contactId) {
        const { error: linkError } = await supabase
          .from('contact_chats')
          .upsert({
            contact_id: contactId,
            chat_id: crmChatId
          }, { onConflict: 'contact_id,chat_id' });

        if (linkError) {
          console.error('Error linking chat to contact:', linkError);
        } else {
          console.log('Linked chat to contact:', crmChatId, '->', contactId);
        }
      }

      // 4. Save each message as an interaction (now with contact_id)
      for (const msg of messages) {
        const messageUid = msg.message_uid || msg.id;
        let interactionId = null;

        // Check if interaction already exists
        const { data: existingInteraction } = await supabase
          .from('interactions')
          .select('interaction_id')
          .eq('external_interaction_id', messageUid)
          .maybeSingle();

        if (!existingInteraction) {
          const interactionData = {
            interaction_type: 'whatsapp',
            direction: msg.direction || 'received',
            interaction_date: msg.date,
            chat_id: crmChatId,
            summary: msg.body_text || msg.snippet,
            external_interaction_id: messageUid,
            created_at: new Date().toISOString()
          };

          // Add contact_id if we found one (consistent with email flow)
          if (contactId) {
            interactionData.contact_id = contactId;
          }

          const { data: newInteraction } = await supabase
            .from('interactions')
            .insert(interactionData)
            .select('interaction_id')
            .single();

          interactionId = newInteraction?.interaction_id;
        } else {
          interactionId = existingInteraction.interaction_id;
        }

        // 4.5 Link attachments to contact, chat, and interaction
        if (messageUid) {
          const attachmentUpdate = {
            chat_id: crmChatId
          };
          if (contactId) attachmentUpdate.contact_id = contactId;
          if (interactionId) attachmentUpdate.interaction_id = interactionId;

          const { error: attachmentLinkError } = await supabase
            .from('attachments')
            .update(attachmentUpdate)
            .eq('external_reference', messageUid);

          if (attachmentLinkError) {
            console.error('Error linking attachments:', attachmentLinkError);
          }
        }
      }

      // 5. Update contact's last_interaction_at (consistent with email flow)
      if (contactId && messages.length > 0) {
        // Find the latest message date
        const latestMessageDate = messages.reduce((latest, msg) => {
          const msgDate = new Date(msg.date);
          return msgDate > latest ? msgDate : latest;
        }, new Date(0));

        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            last_interaction_at: latestMessageDate.toISOString(),
            last_modified_at: new Date().toISOString(),
            last_modified_by: 'User'
          })
          .eq('contact_id', contactId)
          .or(`last_interaction_at.is.null,last_interaction_at.lt.${latestMessageDate.toISOString()}`);

        if (updateError) {
          console.error('Failed to update last_interaction_at:', updateError);
        } else {
          console.log('Updated last_interaction_at for contact:', contactId);
        }
      }

      // 6. Delete messages from staging (command_center_inbox)
      const messageIds = messages.map(m => m.id).filter(Boolean);
      if (messageIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('command_center_inbox')
          .delete()
          .in('id', messageIds);

        if (deleteError) {
          console.error('Error deleting from staging:', deleteError);
        }
      }

      // 6b. Track this chat as "done" to prevent sent messages from reappearing
      // Get the last message UID (most recent by date)
      const sortedMessages = [...messages].sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastMessageUid = sortedMessages[0]?.message_uid || null;

      const { error: doneError } = await supabase
        .from('whatsapp_chat_done')
        .upsert({
          chat_id: chatId,
          done_at: new Date().toISOString(),
          last_message_uid: lastMessageUid
        }, { onConflict: 'chat_id' });

      if (doneError) {
        console.error('Error saving chat done status:', doneError);
      } else {
        console.log('Marked chat as done:', chatId, 'last_message_uid:', lastMessageUid);
      }

      // 7. Find current chat index BEFORE updating state
      const currentIndex = whatsappChats.findIndex(c => c.chat_id === chatId);

      // 8. Update local state - remove processed chat
      setWhatsappChats(prev => prev.filter(c => c.chat_id !== chatId));
      setWhatsappMessages(prev => prev.filter(m => m.chat_id !== chatId));

      // 9. Select next chat if available (the one that takes current position)
      const remainingChats = whatsappChats.filter(c => c.chat_id !== chatId);
      if (remainingChats.length > 0) {
        // Select the chat at the same index (which was the next one), or last if at end
        const nextIndex = Math.min(currentIndex, remainingChats.length - 1);
        setSelectedWhatsappChat(remainingChats[nextIndex]);
      } else {
        setSelectedWhatsappChat(null);
      }

      toast.success('WhatsApp messages archived');
    } catch (error) {
      console.error('Error archiving WhatsApp:', error);
      toast.error('Failed to archive WhatsApp messages');
    } finally {
      setSaving(false);
    }
  };

  // handleWhatsAppDoneAsync - fast UI with background processing
  const handleWhatsAppDoneAsync = async () => {
    if (!selectedWhatsappChat) return;

    // Capture state at time of click (before any updates)
    const chatToProcess = { ...selectedWhatsappChat };
    const messages = [...(selectedWhatsappChat.messages || [])];
    const messageIds = messages.map(m => m.id).filter(Boolean);
    const chatId = selectedWhatsappChat.chat_id;
    const currentChatIndex = whatsappChats.findIndex(c => c.chat_id === chatId);

    if (messageIds.length === 0) {
      toast.error('No messages to archive');
      return;
    }

    // 1. SYNC: Update DB status to 'archiving' (fast ~200ms, ensures consistency)
    const { error: updateError } = await supabase
      .from('command_center_inbox')
      .update({ status: 'archiving' })
      .in('id', messageIds);

    if (updateError) {
      console.error('Failed to set archiving status:', updateError);
      toast.error('Failed to archive');
      return;
    }

    // 2. Update local state - move chat to archiving status
    setWhatsappChats(prev => prev.map(chat =>
      chat.chat_id === chatId
        ? { ...chat, status: 'archiving', messages: chat.messages.map(m => ({ ...m, status: 'archiving' })) }
        : chat
    ));

    // 3. Select next chat (from inbox only, excluding archiving)
    const remainingInboxChats = whatsappChats.filter(c =>
      c.chat_id !== chatId && c.status !== 'archiving'
    );

    if (remainingInboxChats.length > 0) {
      const nextIndex = Math.min(currentChatIndex, remainingInboxChats.length - 1);
      setSelectedWhatsappChat(remainingInboxChats[nextIndex]);
    } else {
      setSelectedWhatsappChat(null);
    }

    // 4. ASYNC: Call backend for full processing (non-blocking)
    fetch(`${BACKEND_URL}/whatsapp/save-and-archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatData: {
          chat_id: chatToProcess.chat_id,
          chat_name: chatToProcess.chat_name,
          contact_number: chatToProcess.contact_number,
          is_group_chat: chatToProcess.is_group_chat || false,
          chat_jid: chatToProcess.chat_jid
        },
        messages: messages.map(m => ({
          id: m.id,
          message_uid: m.message_uid || m.id,
          body_text: m.body_text || m.snippet,
          direction: m.direction || 'received',
          date: m.date,
          has_attachments: m.has_attachments || false,
          attachments: m.attachments || []
        }))
      })
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Backend processing failed');
      }

      // SUCCESS: Remove from local state (backend deleted from DB)
      setWhatsappChats(prev => prev.filter(c => c.chat_id !== chatId));
      setWhatsappMessages(prev => prev.filter(m => m.chat_id !== chatId));

      toast.success('WhatsApp archived successfully');
    })
    .catch(async (error) => {
      console.error('WhatsApp archive backend error:', error);
      toast.error(`Archive failed: ${error.message}`);

      // ROLLBACK: Move back to Inbox (DB has reliable 'archiving' status to rollback from)
      const { error: rollbackError } = await supabase
        .from('command_center_inbox')
        .update({ status: null })
        .in('id', messageIds);

      if (rollbackError) {
        console.error('Rollback failed:', rollbackError);
        toast.error('Please refresh the page');
      } else {
        // Update local state back to inbox
        setWhatsappChats(prev => prev.map(chat =>
          chat.chat_id === chatId
            ? { ...chat, status: null, messages: chat.messages.map(m => ({ ...m, status: null })) }
            : chat
        ));
      }
    });
  };

  // Search contacts for new WhatsApp message
  const handleNewWhatsAppSearch = async (query) => {
    setNewWhatsAppSearchQuery(query);
    if (!query || query.length < 2) {
      setNewWhatsAppSearchResults([]);
      return;
    }

    try {
      // Search contacts with phone numbers
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          profile_image_url,
          contact_mobiles(mobile, is_primary)
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      // Filter contacts that have phone numbers
      const contactsWithPhone = (data || []).filter(c =>
        c.contact_mobiles && c.contact_mobiles.length > 0
      ).map(c => ({
        ...c,
        phone: c.contact_mobiles.find(m => m.is_primary)?.mobile || c.contact_mobiles[0]?.mobile
      }));

      setNewWhatsAppSearchResults(contactsWithPhone);
    } catch (error) {
      console.error('Error searching contacts:', error);
    }
  };

  // Send new WhatsApp message
  const handleSendNewWhatsApp = async () => {
    if (!newWhatsAppContact || !newWhatsAppMessage.trim()) return;

    setNewWhatsAppSending(true);
    try {
      const response = await fetch(`${BACKEND_URL}/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: newWhatsAppContact.phone,
          message: newWhatsAppMessage.trim()
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      toast.success(`Message sent to ${newWhatsAppContact.first_name} ${newWhatsAppContact.last_name}`);

      // Reset and close modal
      setNewWhatsAppModalOpen(false);
      setNewWhatsAppContact(null);
      setNewWhatsAppMessage('');
      setNewWhatsAppSearchQuery('');
      setNewWhatsAppSearchResults([]);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast.error('Failed to send WhatsApp message');
    } finally {
      setNewWhatsAppSending(false);
    }
  };

  // Handle WhatsApp Spam - add to spam list and delete messages + attachments
  // NOTE: This handler references `setSaving` which is shared state from CommandCenterPage.
  // It is passed in via the `setSaving` parameter.
  const handleWhatsAppSpam = async (setSaving) => {
    if (!selectedWhatsappChat) return;

    setSaving(true);
    try {
      const phone = selectedWhatsappChat.contact_number;
      const chatId = selectedWhatsappChat.chat_id;
      const isGroup = selectedWhatsappChat.is_group_chat;
      const messages = selectedWhatsappChat.messages || [];
      const messageUids = messages.map(m => m.message_uid || m.id).filter(Boolean);

      // 1. Add to whatsapp_spam list
      // For groups: use chat_id, for 1-to-1: use phone number
      if (isGroup) {
        // Check if group chat_id already in spam
        const { data: existingGroup } = await supabase
          .from('whatsapp_spam')
          .select('counter')
          .eq('chat_id', chatId)
          .maybeSingle();

        if (existingGroup) {
          await supabase
            .from('whatsapp_spam')
            .update({ counter: existingGroup.counter + 1 })
            .eq('chat_id', chatId);
        } else {
          await supabase
            .from('whatsapp_spam')
            .insert({ mobile_number: `group:${chatId}`, chat_id: chatId, counter: 1 });
        }
      } else {
        // 1-to-1 chat: use phone number
        const { data: existing } = await supabase
          .from('whatsapp_spam')
          .select('counter')
          .eq('mobile_number', phone)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('whatsapp_spam')
            .update({ counter: existing.counter + 1 })
            .eq('mobile_number', phone);
        } else {
          await supabase
            .from('whatsapp_spam')
            .insert({ mobile_number: phone, counter: 1 });
        }
      }

      // 2. Get attachments to delete
      if (messageUids.length > 0) {
        const { data: attachments } = await supabase
          .from('attachments')
          .select('attachment_id, permanent_url')
          .in('external_reference', messageUids);

        // 3. Delete from Storage bucket
        if (attachments && attachments.length > 0) {
          for (const att of attachments) {
            if (att.permanent_url) {
              // Extract path from URL: .../whatsapp-attachments/path/to/file
              const urlParts = att.permanent_url.split('/whatsapp-attachments/');
              if (urlParts[1]) {
                const storagePath = decodeURIComponent(urlParts[1].split('?')[0]);
                await supabase.storage
                  .from('whatsapp-attachments')
                  .remove([storagePath]);
              }
            }
          }

          // 4. Delete from attachments table
          const attIds = attachments.map(a => a.attachment_id);
          await supabase
            .from('attachments')
            .delete()
            .in('attachment_id', attIds);
        }
      }

      // 5. Delete from command_center_inbox
      const messageIds = messages.map(m => m.id).filter(Boolean);
      if (messageIds.length > 0) {
        await supabase
          .from('command_center_inbox')
          .delete()
          .in('id', messageIds);
      }

      // 6. Find current chat index BEFORE updating state
      const currentIndex = whatsappChats.findIndex(c => c.chat_id === chatId);

      // 7. Update local state
      setWhatsappChats(prev => prev.filter(c => c.chat_id !== chatId));
      setWhatsappMessages(prev => prev.filter(m => m.chat_id !== chatId));

      // 8. Select next chat (the one that takes current position)
      const remainingChats = whatsappChats.filter(c => c.chat_id !== chatId);
      if (remainingChats.length > 0) {
        const nextIndex = Math.min(currentIndex, remainingChats.length - 1);
        setSelectedWhatsappChat(remainingChats[nextIndex]);
      } else {
        setSelectedWhatsappChat(null);
      }

      toast.success(`${isGroup ? selectedWhatsappChat.chat_name || 'Group' : phone} marked as spam`);
    } catch (error) {
      console.error('Error marking WhatsApp as spam:', error);
      toast.error('Failed to mark as spam');
    } finally {
      setSaving(false);
    }
  };

  // Handle selecting a WhatsApp search result - loads the chat and displays it
  // NOTE: This handler references `setSelectedRightPanelContactId` and `setListCollapsed`
  // which are shared state from CommandCenterPage. They are passed as parameters.
  const handleSelectWhatsappSearchResult = async (searchResult, { setSelectedRightPanelContactId, setListCollapsed } = {}) => {
    try {
      const chatId = searchResult.result_chat_id;

      // Fetch all messages for this chat from interactions
      const { data: messages, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('chat_id', chatId)
        .eq('interaction_type', 'whatsapp')
        .order('interaction_date', { ascending: true });

      if (error) throw error;

      // Fetch chat info
      const { data: chatInfo } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      // Fetch contact info if available
      const { data: contactChats } = await supabase
        .from('contact_chats')
        .select('contact_id')
        .eq('chat_id', chatId)
        .limit(1);

      let contact = null;
      if (contactChats?.[0]?.contact_id) {
        const { data: contactData } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name, profile_image_url')
          .eq('contact_id', contactChats[0].contact_id)
          .single();
        contact = contactData;
      }

      // Extract phone number from baileys_jid (e.g., "393495758107@s.whatsapp.net" -> "393495758107")
      let contactNumber = null;
      if (chatInfo?.baileys_jid && !chatInfo?.is_group_chat) {
        contactNumber = chatInfo.baileys_jid.replace(/@s\.whatsapp\.net$/, '');
      }

      // Format the chat object to match expected structure
      const formattedChat = {
        chat_id: chatId,
        chat_name: searchResult.result_chat_name || chatInfo?.chat_name || 'Unknown',
        is_group_chat: chatInfo?.is_group_chat || false,
        contact_number: contactNumber,
        profileImage: contact?.profile_image_url || null,
        crmName: contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : null,
        contact_id: contact?.contact_id || null,
        messages: (messages || []).map(msg => ({
          id: msg.interaction_id,
          body_text: msg.summary,
          date: msg.interaction_date,
          direction: msg.direction,
          _isArchivedMessage: true
        })),
        latestMessage: messages?.length > 0 ? {
          body_text: messages[messages.length - 1].summary,
          date: messages[messages.length - 1].interaction_date,
          direction: messages[messages.length - 1].direction
        } : null,
        _isArchivedChat: true
      };

      setSelectedWhatsappChat(formattedChat);

      // Set the contact in the right panel (for archived chats)
      if (contact?.contact_id) {
        setArchivedWhatsappContact(contact);
        if (setSelectedRightPanelContactId) {
          setSelectedRightPanelContactId(contact.contact_id);
        }
      } else {
        setArchivedWhatsappContact(null);
      }

      // Collapse mobile panels
      if (window.innerWidth <= 768 && setListCollapsed) {
        setListCollapsed(true);
      }
    } catch (err) {
      console.error('Error loading search result chat:', err);
      toast.error('Failed to load chat');
    }
  };

  return {
    // State
    whatsappMessages,
    setWhatsappMessages,
    whatsappChats,
    setWhatsappChats,
    selectedWhatsappChat,
    setSelectedWhatsappChat,
    whatsappLoading,
    whatsappRefreshTrigger,
    setWhatsappRefreshTrigger,

    // Baileys state
    baileysStatus,
    setBaileysStatus,
    showBaileysQRModal,
    setShowBaileysQRModal,

    // WhatsApp search state
    whatsappSearchQuery,
    setWhatsappSearchQuery,
    whatsappSearchResults,
    setWhatsappSearchResults,
    whatsappSearchLoading,
    isSearchingWhatsapp,
    setIsSearchingWhatsapp,
    archivedWhatsappContact,
    setArchivedWhatsappContact,

    // New WhatsApp message modal state
    newWhatsAppModalOpen,
    setNewWhatsAppModalOpen,
    newWhatsAppContact,
    setNewWhatsAppContact,
    newWhatsAppMessage,
    setNewWhatsAppMessage,
    newWhatsAppSearchQuery,
    setNewWhatsAppSearchQuery,
    newWhatsAppSearchResults,
    setNewWhatsAppSearchResults,
    newWhatsAppSending,
    setNewWhatsAppSending,

    // Handlers
    groupWhatsAppByChat,
    handleWhatsAppDone,        // Requires setSaving parameter from CommandCenterPage
    handleWhatsAppDoneAsync,
    handleNewWhatsAppSearch,
    handleSendNewWhatsApp,
    handleWhatsAppSpam,        // Requires setSaving parameter from CommandCenterPage
    searchSavedWhatsapp,
    handleSelectWhatsappSearchResult, // Requires { setSelectedRightPanelContactId, setListCollapsed } parameter
  };
};

export default useWhatsAppData;
