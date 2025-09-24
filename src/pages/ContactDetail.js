import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaArrowLeft, FaEdit, FaStickyNote, FaComments, FaHandshake, FaSlack } from 'react-icons/fa';
import { FiAlertTriangle, FiMail, FiUser, FiCalendar, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';

const ContactDetail = ({ theme }) => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Info');
  const [activeChatTab, setActiveChatTab] = useState('Timeline');
  const [activeRelatedTab, setActiveRelatedTab] = useState('Contacts');
  const [activeKeepInTouchTab, setActiveKeepInTouchTab] = useState('Next');

  // Email/Mobile selection modals
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);

  // Email detail modal
  const [emailDetailModalOpen, setEmailDetailModalOpen] = useState(false);
  const [selectedEmailDetail, setSelectedEmailDetail] = useState(null);
  const [loadingEmailDetail, setLoadingEmailDetail] = useState(false);

  // Timeline data
  const [interactions, setInteractions] = useState([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [whatsappInteractions, setWhatsappInteractions] = useState([]);
  const [loadingWhatsappInteractions, setLoadingWhatsappInteractions] = useState(false);
  const [emailInteractions, setEmailInteractions] = useState([]);
  const [loadingEmailInteractions, setLoadingEmailInteractions] = useState(false);

  // Delete modal state (copied from StandaloneInteractions.js)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [associatedData, setAssociatedData] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchContact = async () => {
    if (!contactId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
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
        `)
        .eq('contact_id', contactId)
        .single();

      if (error) throw error;

      // Process contact data
      const processedContact = {
        ...data,
        emails: data.contact_emails || [],
        mobiles: data.contact_mobiles || [],
        companies: data.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
        tags: data.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
        cities: data.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
      };

      setContact(processedContact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      toast.error('Failed to load contact details');
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async () => {
    if (!contactId) return;

    setLoadingInteractions(true);
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          *,
          chats (
            chat_name
          ),
          email_threads (
            subject
          )
        `)
        .eq('contact_id', contactId)
        .order('interaction_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      console.error('Error fetching interactions:', error);
      toast.error('Failed to load interactions');
    } finally {
      setLoadingInteractions(false);
    }
  };

  const fetchWhatsappInteractions = async () => {
    if (!contactId) return;

    setLoadingWhatsappInteractions(true);
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          *,
          chats (
            chat_name
          )
        `)
        .eq('contact_id', contactId)
        .eq('interaction_type', 'whatsapp')
        .order('interaction_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setWhatsappInteractions(data || []);
    } catch (error) {
      console.error('Error fetching WhatsApp interactions:', error);
      toast.error('Failed to load WhatsApp interactions');
    } finally {
      setLoadingWhatsappInteractions(false);
    }
  };

  const fetchEmailInteractions = async () => {
    if (!contactId) return;

    setLoadingEmailInteractions(true);
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select(`
          *,
          email_threads (
            subject
          )
        `)
        .eq('contact_id', contactId)
        .eq('interaction_type', 'email')
        .order('interaction_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEmailInteractions(data || []);
    } catch (error) {
      console.error('Error fetching email interactions:', error);
      toast.error('Failed to load email interactions');
    } finally {
      setLoadingEmailInteractions(false);
    }
  };

  useEffect(() => {
    fetchContact();
    if (activeTab === 'Chats') {
      if (activeChatTab === 'Timeline') {
        fetchInteractions();
      } else if (activeChatTab === 'WhatsApp') {
        fetchWhatsappInteractions();
      } else if (activeChatTab === 'Email') {
        fetchEmailInteractions();
      }
    }
  }, [contactId, activeTab, activeChatTab]);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleEmailClick = () => {
    if (!contact?.emails?.length) return;

    if (contact.emails.length === 1) {
      // Only one email, open directly
      window.open(`mailto:${contact.emails[0].email}`, '_self');
    } else {
      // Multiple emails, show modal
      setEmailModalOpen(true);
    }
  };

  const handleMobileClick = () => {
    if (!contact?.mobiles?.length) return;

    if (contact.mobiles.length === 1) {
      // Only one mobile, open WhatsApp directly
      const cleanMobile = contact.mobiles[0].mobile.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanMobile}`, '_blank');
    } else {
      // Multiple mobiles, show modal
      setMobileModalOpen(true);
    }
  };

  const handleEmailSelect = (email) => {
    window.open(`mailto:${email}`, '_self');
    setEmailModalOpen(false);
  };

  const handleMobileSelect = (mobile) => {
    const cleanMobile = mobile.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanMobile}`, '_blank');
    setMobileModalOpen(false);
  };

  const handleEmailInteractionClick = async (interaction) => {
    if (interaction.interaction_type !== 'email' || !interaction.email_thread_id) return;

    setLoadingEmailDetail(true);
    setEmailDetailModalOpen(true);

    try {
      const { data, error } = await supabase
        .from('emails')
        .select(`
          *,
          email_participants (
            participant_type,
            contacts (
              contact_id,
              first_name,
              last_name,
              contact_emails (email, is_primary)
            )
          )
        `)
        .eq('email_thread_id', interaction.email_thread_id)
        .order('message_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setSelectedEmailDetail(data);
    } catch (error) {
      console.error('Error fetching email details:', error);
      toast.error('Failed to load email details');
      setEmailDetailModalOpen(false);
    } finally {
      setLoadingEmailDetail(false);
    }
  };

  // Helper functions for timeline
  const getInteractionIcon = (type) => {
    switch (type) {
      case 'email': return <FaEnvelope />;
      case 'whatsapp': return <FaComments />;
      case 'meeting': return <FaHandshake />;
      case 'phone_call':
      case 'call': return <FaPhone />;
      case 'slack': return <FaSlack />;
      case 'sms': return <FaPhone />;
      case 'note': return <FaStickyNote />;
      default: return <FaComments />;
    }
  };

  const getInteractionTypeLabel = (type) => {
    switch (type) {
      case 'email': return 'Email';
      case 'whatsapp': return 'WhatsApp';
      case 'meeting': return 'Meeting';
      case 'phone_call':
      case 'call': return 'Phone Call';
      case 'slack': return 'Slack';
      case 'sms': return 'SMS';
      case 'note': return 'Note';
      default: return 'Other';
    }
  };

  const formatInteractionDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const formatInteractionTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Group interactions by date and then by conversations
  const groupInteractionsByDate = (interactions) => {
    const groups = {};
    interactions.forEach(interaction => {
      const dateKey = new Date(interaction.interaction_date).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(interaction);
    });
    return groups;
  };

  // Group interactions within a day by conversation (chat_id or email_thread_id)
  const groupInteractionsByConversation = (dayInteractions) => {
    const conversationGroups = {};
    const standaloneInteractions = [];

    dayInteractions.forEach(interaction => {
      const conversationId = interaction.chat_id || interaction.email_thread_id;

      if (conversationId) {
        if (!conversationGroups[conversationId]) {
          // Get the name from the related data
          const name = interaction.chat_id
            ? interaction.chats?.chat_name || 'WhatsApp Chat'
            : interaction.email_threads?.subject || 'Email Thread';

          conversationGroups[conversationId] = {
            id: conversationId,
            type: interaction.chat_id ? 'chat' : 'email',
            name: name,
            interactions: []
          };
        }
        conversationGroups[conversationId].interactions.push(interaction);
      } else {
        standaloneInteractions.push(interaction);
      }
    });

    // Sort interactions within each conversation by time
    Object.values(conversationGroups).forEach(group => {
      group.interactions.sort((a, b) => new Date(a.interaction_date) - new Date(b.interaction_date));
    });

    return { conversationGroups: Object.values(conversationGroups), standaloneInteractions };
  };

  // Render timeline component
  const renderTimeline = (interactionData, loadingState, emptyMessage) => {
    if (loadingState) {
      return (
        <TimelineLoading theme={theme}>
          <LoadingSpinner />
          <span>Loading interactions...</span>
        </TimelineLoading>
      );
    }

    if (interactionData.length === 0) {
      return (
        <EmptyTimelineMessage theme={theme}>
          {emptyMessage}
        </EmptyTimelineMessage>
      );
    }

    return (
      <TimelineContent>
        {Object.entries(groupInteractionsByDate(interactionData)).map(([dateKey, dayInteractions]) => {
          const { conversationGroups, standaloneInteractions } = groupInteractionsByConversation(dayInteractions);

          return (
            <TimelineDay key={dateKey}>
              <TimelineDateHeader theme={theme}>
                {formatInteractionDate(dayInteractions[0].interaction_date)}
              </TimelineDateHeader>
              <TimelineItems>
                {/* Render conversation groups */}
                {conversationGroups.map((conversationGroup) => (
                  <ConversationGroup key={conversationGroup.id} theme={theme}>
                    <ConversationHeader theme={theme}>
                      <ConversationIcon theme={theme} $type={conversationGroup.type}>
                        {conversationGroup.type === 'chat' ? '💬' : '📧'}
                      </ConversationIcon>
                      <ConversationTitle theme={theme}>
                        {conversationGroup.name}
                        <ConversationCount theme={theme}>
                          {conversationGroup.interactions.length} message{conversationGroup.interactions.length !== 1 ? 's' : ''}
                        </ConversationCount>
                      </ConversationTitle>
                    </ConversationHeader>

                    <ConversationMessages>
                      {conversationGroup.interactions.map((interaction, index) => (
                        <ConversationMessage
                          key={interaction.interaction_id}
                          theme={theme}
                          $direction={interaction.direction}
                          $clickable={interaction.interaction_type === 'email'}
                          onClick={() => interaction.interaction_type === 'email' ? handleEmailInteractionClick(interaction) : null}
                        >
                          <MessageHeader>
                            <MessageDirection theme={theme} $direction={interaction.direction}>
                              {interaction.direction === 'received' ? '↓' : '↑'}
                            </MessageDirection>
                            <MessageTime theme={theme}>
                              {formatInteractionTime(interaction.interaction_date)}
                            </MessageTime>
                          </MessageHeader>
                          {interaction.summary && (
                            <MessageContent theme={theme} $direction={interaction.direction}>
                              {interaction.summary}
                            </MessageContent>
                          )}
                          {interaction.special_case_tag && (
                            <TimelineSpecialTag theme={theme}>
                              {interaction.special_case_tag}
                            </TimelineSpecialTag>
                          )}
                        </ConversationMessage>
                      ))}
                    </ConversationMessages>
                  </ConversationGroup>
                ))}

                {/* Render standalone interactions */}
                {standaloneInteractions.map((interaction) => (
                  <TimelineItem
                    key={interaction.interaction_id}
                    theme={theme}
                    $clickable={interaction.interaction_type === 'email'}
                    onClick={() => interaction.interaction_type === 'email' ? handleEmailInteractionClick(interaction) : null}
                  >
                    <TimelineIconContainer
                      theme={theme}
                      $type={interaction.interaction_type}
                      $direction={interaction.direction}
                    >
                      {getInteractionIcon(interaction.interaction_type)}
                    </TimelineIconContainer>
                    <TimelineItemContent theme={theme}>
                      <TimelineItemHeader>
                        <TimelineItemType theme={theme}>
                          {getInteractionTypeLabel(interaction.interaction_type)}
                          <TimelineDirection theme={theme} $direction={interaction.direction}>
                            {interaction.direction === 'received' ? '↓' : '↑'}
                          </TimelineDirection>
                        </TimelineItemType>
                        <TimelineItemTime theme={theme}>
                          {formatInteractionTime(interaction.interaction_date)}
                        </TimelineItemTime>
                      </TimelineItemHeader>
                      {interaction.summary && (
                        <TimelineItemSummary theme={theme}>
                          {interaction.summary}
                        </TimelineItemSummary>
                      )}
                      {interaction.special_case_tag && (
                        <TimelineSpecialTag theme={theme}>
                          {interaction.special_case_tag}
                        </TimelineSpecialTag>
                      )}
                    </TimelineItemContent>
                  </TimelineItem>
                ))}
              </TimelineItems>
            </TimelineDay>
          );
        })}
      </TimelineContent>
    );
  };

  const handleEditContact = () => {
    if (!contact) return;
    const url = `/contacts/workflow/${contact.contact_id}?step=2`;
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

  const handleOpenObsidianNote = () => {
    if (!contact) return;
    const vaultName = "Living with Intention";
    const fileName = `${contact.first_name} ${contact.last_name}`;
    const obsidianUrl = `obsidian://advanced-uri?vault=${encodeURIComponent(vaultName)}&commandid=workspace%253Anew-file&filename=${encodeURIComponent(fileName + '.md')}`;

    window.open(obsidianUrl, '_self');
    toast.success(`Opening note for ${fileName}`, {
      duration: 2000,
      icon: '📝'
    });
  };

  // Delete functionality (copied from StandaloneInteractions.js)
  const handleOpenDeleteModal = async () => {
    if (!contact) return;
    setContactToDelete(contact);

    try {
      // Get counts of associated records (same as StandaloneInteractions.js)
      const [
        chatResult,
        contactChatsResult,
        interactionsResult,
        emailsResult,
        emailParticipantsResult,
        emailThreadsResult,
        tagsResult,
        citiesResult,
        companiesResult,
        notesResult,
        attachmentsResult,
        contactEmailsResult,
        contactMobilesResult,
        dealsResult,
        meetingsResult,
        investmentsResult,
        kitResult,
        lastInteractionResult
      ] = await Promise.all([
        supabase.from('chat').select('id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_chats').select('id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('interactions').select('interaction_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('emails').select('email_id', { count: 'exact', head: true }).eq('sender_contact_id', contact.contact_id),
        supabase.from('email_participants').select('participant_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_email_threads').select('email_thread_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_tags').select('entry_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_cities').select('entry_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_companies').select('contact_companies_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_notes').select('note_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_attachments').select('attachment_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_emails').select('contact_email_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('contact_mobiles').select('contact_mobile_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('deals').select('deal_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('meetings').select('meeting_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('investments').select('investment_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('keep_in_touch').select('kit_id', { count: 'exact', head: true }).eq('contact_id', contact.contact_id),
        supabase.from('interactions').select('type, notes, created_at').eq('contact_id', contact.contact_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      // Format last interaction
      let lastInteraction = null;
      if (lastInteractionResult.data) {
        const interaction = lastInteractionResult.data;
        const date = new Date(interaction.created_at).toLocaleDateString();
        lastInteraction = {
          summary: `${interaction.type} - ${interaction.notes || 'No notes'} (${date})`
        };
      }

      // Set associated data
      const data = {
        chatCount: chatResult.count || 0,
        contactChatsCount: contactChatsResult.count || 0,
        interactionsCount: interactionsResult.count || 0,
        emailsCount: emailsResult.count || 0,
        emailParticipantsCount: emailParticipantsResult.count || 0,
        emailThreadsCount: emailThreadsResult.count || 0,
        tagsCount: tagsResult.count || 0,
        citiesCount: citiesResult.count || 0,
        companiesCount: companiesResult.count || 0,
        notesCount: notesResult.count || 0,
        attachmentsCount: attachmentsResult.count || 0,
        contactEmailsCount: contactEmailsResult.count || 0,
        contactMobilesCount: contactMobilesResult.count || 0,
        dealsCount: dealsResult.count || 0,
        meetingsCount: meetingsResult.count || 0,
        investmentsCount: investmentsResult.count || 0,
        kitCount: kitResult.count || 0,
        lastInteraction
      };

      setAssociatedData(data);

      // Initialize selected items (all checked by default)
      setSelectedItems({
        deleteInteractions: data.interactionsCount > 0,
        deleteEmails: data.emailsCount > 0,
        deleteEmailParticipants: data.emailParticipantsCount > 0,
        deleteEmailThreads: data.emailThreadsCount > 0,
        deleteTags: data.tagsCount > 0,
        deleteCities: data.citiesCount > 0,
        deleteCompanies: data.companiesCount > 0,
        deleteNotes: data.notesCount > 0,
        deleteAttachments: data.attachmentsCount > 0,
        deleteContactEmails: data.contactEmailsCount > 0,
        deleteContactMobiles: data.contactMobilesCount > 0,
        deleteDeals: data.dealsCount > 0,
        deleteMeetings: data.meetingsCount > 0,
        deleteInvestments: data.investmentsCount > 0,
        deleteKit: data.kitCount > 0,
        deleteChat: data.chatCount > 0,
        deleteContactChats: data.contactChatsCount > 0
      });

      setDeleteModalOpen(true);
    } catch (error) {
      console.error('Error fetching associated data:', error);
      toast.error('Failed to load contact details');
    }
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedItems(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;

    setIsDeleting(true);
    try {
      const contactIdToDelete = contactToDelete.contact_id;

      // Delete selected associated records first (same logic as StandaloneInteractions.js)
      const deletePromises = [];

      if (selectedItems.deleteInteractions && associatedData.interactionsCount > 0) {
        deletePromises.push(supabase.from('interactions').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteEmails && associatedData.emailsCount > 0) {
        deletePromises.push(supabase.from('emails').delete().eq('sender_contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteEmailParticipants && associatedData.emailParticipantsCount > 0) {
        deletePromises.push(supabase.from('email_participants').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteEmailThreads && associatedData.emailThreadsCount > 0) {
        deletePromises.push(supabase.from('contact_email_threads').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteTags && associatedData.tagsCount > 0) {
        deletePromises.push(supabase.from('contact_tags').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteCities && associatedData.citiesCount > 0) {
        deletePromises.push(supabase.from('contact_cities').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteCompanies && associatedData.companiesCount > 0) {
        deletePromises.push(supabase.from('contact_companies').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteNotes && associatedData.notesCount > 0) {
        deletePromises.push(supabase.from('contact_notes').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteAttachments && associatedData.attachmentsCount > 0) {
        deletePromises.push(supabase.from('contact_attachments').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteContactEmails && associatedData.contactEmailsCount > 0) {
        deletePromises.push(supabase.from('contact_emails').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteContactMobiles && associatedData.contactMobilesCount > 0) {
        deletePromises.push(supabase.from('contact_mobiles').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteDeals && associatedData.dealsCount > 0) {
        deletePromises.push(supabase.from('deals').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteMeetings && associatedData.meetingsCount > 0) {
        deletePromises.push(supabase.from('meetings').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteInvestments && associatedData.investmentsCount > 0) {
        deletePromises.push(supabase.from('investments').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteKit && associatedData.kitCount > 0) {
        deletePromises.push(supabase.from('keep_in_touch').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteChat && associatedData.chatCount > 0) {
        deletePromises.push(supabase.from('chat').delete().eq('contact_id', contactIdToDelete));
      }

      if (selectedItems.deleteContactChats && associatedData.contactChatsCount > 0) {
        deletePromises.push(supabase.from('contact_chats').delete().eq('contact_id', contactIdToDelete));
      }

      // Execute all deletions for related records
      if (deletePromises.length > 0) {
        const results = await Promise.allSettled(deletePromises);
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`Failed to delete related records:`, result.reason);
          }
        });
      }

      // Finally delete the main contact record
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactIdToDelete);

      if (error) throw error;

      toast.success('Contact and selected associated records deleted successfully');

      setDeleteModalOpen(false);
      setContactToDelete(null);
      setAssociatedData({});
      setSelectedItems({});

      // Navigate back to previous page
      navigate(-1);

    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer theme={theme}>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText theme={theme}>Loading contact...</LoadingText>
        </LoadingContainer>
      </PageContainer>
    );
  }

  if (!contact) {
    return (
      <PageContainer theme={theme}>
        <ErrorContainer>
          <ErrorText theme={theme}>Contact not found</ErrorText>
        </ErrorContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer theme={theme}>
      <DetailView theme={theme}>
        <DetailHeader theme={theme}>
          <BackButton theme={theme} onClick={handleBack}>
            <FaArrowLeft />
            <span>Back</span>
          </BackButton>
          <ActionButtons>
            <ActionButton
              as="button"
              onClick={handleEditContact}
              $edit
              theme={theme}
            >
              <FaEdit />
              <span>Edit</span>
            </ActionButton>
            <ActionButton
              as="button"
              onClick={handleOpenDeleteModal}
              $delete
              theme={theme}
            >
              <FiAlertTriangle />
              <span>Delete</span>
            </ActionButton>
            {contact.emails?.length > 0 && (
              <ActionButton
                as="button"
                onClick={handleEmailClick}
                $primary
                theme={theme}
              >
                <FaEnvelope />
                <span>Email</span>
              </ActionButton>
            )}
            {contact.mobiles?.length > 0 && (
              <ActionButton
                as="button"
                onClick={handleMobileClick}
                $secondary
                theme={theme}
              >
                <FaPhone />
                <span>WhatsApp</span>
              </ActionButton>
            )}
          </ActionButtons>
        </DetailHeader>

        <DetailContent theme={theme}>
          <ProfileSection theme={theme}>
            <ProfileAvatar theme={theme}>
              {contact.profile_image_url ? (
                <img src={contact.profile_image_url} alt="Profile" />
              ) : (
                <FaUser />
              )}
            </ProfileAvatar>
            <ProfileInfo>
              <ProfileHeader>
                <ProfileName theme={theme}>
                  {contact.first_name} {contact.last_name}
                  {contact.companies?.length > 0 && (
                    <CompanyNames theme={theme}>
                      {contact.companies.map(company => company.name).join(', ')}
                    </CompanyNames>
                  )}
                </ProfileName>
                <ObsidianNoteButton
                  theme={theme}
                  onClick={handleOpenObsidianNote}
                  title={`Open Obsidian note for ${contact.first_name} ${contact.last_name}`}
                >
                  <FaStickyNote />
                </ObsidianNoteButton>
              </ProfileHeader>
              {contact.job_role && (
                <ProfileRole theme={theme}>{contact.job_role}</ProfileRole>
              )}
              <ProfileBadges>
                {contact.category && (
                  <CategoryBadge theme={theme}>{contact.category}</CategoryBadge>
                )}
                {contact.score && (
                  <ScoreBadge theme={theme}>
                    {'⭐'.repeat(contact.score)}
                  </ScoreBadge>
                )}
              </ProfileBadges>
            </ProfileInfo>
          </ProfileSection>

          <NavTabs theme={theme}>
            {['Info', 'Chats', 'Related', 'Keep in touch'].map(tab => (
              <NavTab
                key={tab}
                theme={theme}
                $active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </NavTab>
            ))}
          </NavTabs>

          {activeTab === 'Info' && (
            <InfoGrid>
            {(contact.emails?.length > 0 || contact.mobiles?.length > 0) && (
              <InfoSection>
                <SectionTitle theme={theme}>Contact Information</SectionTitle>
                <InfoList>
                  {contact.emails?.map((email, idx) => (
                    <InfoItem key={`email-${idx}`}>
                      <InfoItemIcon><FaEnvelope /></InfoItemIcon>
                      <InfoItemContent>
                        <InfoItemLabel theme={theme}>{email.type} Email</InfoItemLabel>
                        <InfoItemValue theme={theme}>
                          <a href={`mailto:${email.email}`}>{email.email}</a>
                          {email.is_primary && <PrimaryTag>Primary</PrimaryTag>}
                        </InfoItemValue>
                      </InfoItemContent>
                    </InfoItem>
                  ))}
                  {contact.mobiles?.map((mobile, idx) => (
                    <InfoItem key={`mobile-${idx}`}>
                      <InfoItemIcon><FaPhone /></InfoItemIcon>
                      <InfoItemContent>
                        <InfoItemLabel theme={theme}>{mobile.type} Phone</InfoItemLabel>
                        <InfoItemValue theme={theme}>
                          <a href={`https://wa.me/${mobile.mobile.replace(/\D/g, '')}`}>{mobile.mobile}</a>
                          {mobile.is_primary && <PrimaryTag>Primary</PrimaryTag>}
                        </InfoItemValue>
                      </InfoItemContent>
                    </InfoItem>
                  ))}
                </InfoList>
              </InfoSection>
            )}

            {contact.companies?.length > 0 && (
              <InfoSection>
                <SectionTitle theme={theme}>Company Information</SectionTitle>
                <InfoList>
                  {contact.companies.map((company, idx) => (
                    <InfoItem key={`company-${idx}`}>
                      <InfoItemIcon><FaBuilding /></InfoItemIcon>
                      <InfoItemContent>
                        <InfoItemLabel theme={theme}>Company</InfoItemLabel>
                        <InfoItemValue theme={theme}>{company.name}</InfoItemValue>
                        {company.website && (
                          <InfoItemSubValue theme={theme}>
                            <a href={company.website} target="_blank" rel="noopener noreferrer">
                              {company.website}
                            </a>
                          </InfoItemSubValue>
                        )}
                      </InfoItemContent>
                    </InfoItem>
                  ))}
                </InfoList>
              </InfoSection>
            )}

            {contact.cities?.length > 0 && (
              <InfoSection>
                <SectionTitle theme={theme}>Location</SectionTitle>
                <InfoList>
                  {contact.cities.map((city, idx) => (
                    <InfoItem key={`city-${idx}`}>
                      <InfoItemIcon><FaMapMarkerAlt /></InfoItemIcon>
                      <InfoItemContent>
                        <InfoItemLabel theme={theme}>Location</InfoItemLabel>
                        <InfoItemValue theme={theme}>{city.name}, {city.country}</InfoItemValue>
                      </InfoItemContent>
                    </InfoItem>
                  ))}
                </InfoList>
              </InfoSection>
            )}

            {contact.tags?.length > 0 && (
              <InfoSection>
                <SectionTitle theme={theme}>Tags</SectionTitle>
                <TagList>
                  {contact.tags.map((tag, idx) => (
                    <Tag key={idx} theme={theme}>{tag}</Tag>
                  ))}
                </TagList>
              </InfoSection>
            )}

            {contact.description && (
              <InfoSection>
                <SectionTitle theme={theme}>Notes</SectionTitle>
                <NotesText theme={theme}>{contact.description}</NotesText>
              </InfoSection>
            )}

            {contact.linkedin && (
              <InfoSection>
                <SectionTitle theme={theme}>Social Media</SectionTitle>
                <InfoList>
                  <InfoItem>
                    <InfoItemContent>
                      <InfoItemLabel theme={theme}>LinkedIn Profile</InfoItemLabel>
                      <InfoItemValue theme={theme}>
                        <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                          View LinkedIn Profile
                        </a>
                      </InfoItemValue>
                    </InfoItemContent>
                  </InfoItem>
                </InfoList>
              </InfoSection>
            )}
            </InfoGrid>
          )}

          {activeTab === 'Chats' && (
            <>
              <ChatSubMenu theme={theme}>
                {['Timeline', 'WhatsApp', 'Email', 'Meetings'].map(chatTab => (
                  <ChatSubTab
                    key={chatTab}
                    theme={theme}
                    $active={activeChatTab === chatTab}
                    onClick={() => setActiveChatTab(chatTab)}
                    disabled={chatTab === 'Meetings'}
                  >
                    {chatTab}
                  </ChatSubTab>
                ))}
              </ChatSubMenu>

              {activeChatTab === 'Timeline' && (
                <TimelineContainer theme={theme}>
                  {renderTimeline(interactions, loadingInteractions, '📅 No interactions found for this contact')}
                </TimelineContainer>
              )}

              {activeChatTab === 'WhatsApp' && (
                <TimelineContainer theme={theme}>
                  {renderTimeline(whatsappInteractions, loadingWhatsappInteractions, '💬 No WhatsApp messages found for this contact')}
                </TimelineContainer>
              )}

              {activeChatTab === 'Email' && (
                <TimelineContainer theme={theme}>
                  {renderTimeline(emailInteractions, loadingEmailInteractions, '📧 No email conversations found for this contact')}
                </TimelineContainer>
              )}

              {activeChatTab === 'Meetings' && (
                <ComingSoonMessage theme={theme}>
                  🤝 Meetings coming soon
                </ComingSoonMessage>
              )}
            </>
          )}

          {activeTab === 'Related' && (
            <>
              <RelatedSubMenu theme={theme}>
                {['Contacts', 'Companies', 'Deals', 'Lists'].map(relatedTab => (
                  <RelatedSubTab
                    key={relatedTab}
                    theme={theme}
                    $active={activeRelatedTab === relatedTab}
                    onClick={() => setActiveRelatedTab(relatedTab)}
                  >
                    {relatedTab}
                  </RelatedSubTab>
                ))}
              </RelatedSubMenu>

              {activeRelatedTab === 'Contacts' && (
                <ComingSoonMessage theme={theme}>
                  👥 Related contacts coming soon
                </ComingSoonMessage>
              )}

              {activeRelatedTab === 'Companies' && (
                <ComingSoonMessage theme={theme}>
                  🏢 Related companies coming soon
                </ComingSoonMessage>
              )}

              {activeRelatedTab === 'Deals' && (
                <ComingSoonMessage theme={theme}>
                  💼 Related deals coming soon
                </ComingSoonMessage>
              )}

              {activeRelatedTab === 'Lists' && (
                <ComingSoonMessage theme={theme}>
                  📋 Related lists coming soon
                </ComingSoonMessage>
              )}
            </>
          )}

          {activeTab === 'Keep in touch' && (
            <>
              <KeepInTouchSubMenu theme={theme}>
                {['Next', 'Touch base', 'Occurrences', 'Lists'].map(keepInTouchTab => (
                  <KeepInTouchSubTab
                    key={keepInTouchTab}
                    theme={theme}
                    $active={activeKeepInTouchTab === keepInTouchTab}
                    onClick={() => setActiveKeepInTouchTab(keepInTouchTab)}
                  >
                    {keepInTouchTab}
                  </KeepInTouchSubTab>
                ))}
              </KeepInTouchSubMenu>

              {activeKeepInTouchTab === 'Next' && (
                <ComingSoonMessage theme={theme}>
                  ⏭️ Next interactions coming soon
                </ComingSoonMessage>
              )}

              {activeKeepInTouchTab === 'Touch base' && (
                <ComingSoonMessage theme={theme}>
                  🤝 Touch base reminders coming soon
                </ComingSoonMessage>
              )}

              {activeKeepInTouchTab === 'Occurrences' && (
                <ComingSoonMessage theme={theme}>
                  🔄 Occurrences coming soon
                </ComingSoonMessage>
              )}

              {activeKeepInTouchTab === 'Lists' && (
                <ComingSoonMessage theme={theme}>
                  📝 Keep in touch lists coming soon
                </ComingSoonMessage>
              )}
            </>
          )}
        </DetailContent>
      </DetailView>

      {/* Delete Modal (copied from StandaloneInteractions.js) */}
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
            maxWidth: '600px',
            width: '90%',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
            borderRadius: '12px',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
            zIndex: 1001
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
          }
        }}
      >
        <ModalHeader theme={theme}>
          <h2>Delete Contact and Associated Data</h2>
          <CloseButton theme={theme} onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
            <FiAlertTriangle />
          </CloseButton>
        </ModalHeader>

        {contactToDelete && (
          <>
            <ModalContactDetail theme={theme}>
              <DetailItem>
                <DetailValue theme={theme}>
                  {contactToDelete.first_name} {contactToDelete.last_name}
                  {contactToDelete.emails?.[0]?.email ? ` (${contactToDelete.emails[0].email})` :
                   contactToDelete.mobiles?.[0]?.mobile ? ` (${contactToDelete.mobiles[0].mobile})` : ''}
                </DetailValue>
              </DetailItem>
            </ModalContactDetail>

            <DetailItem style={{ marginTop: '15px', marginBottom: '15px' }}>
              <DetailLabel theme={theme}>Last Interaction:</DetailLabel>
              <DetailValue theme={theme}>
                {associatedData.lastInteraction ?
                  associatedData.lastInteraction.summary :
                  'None'}
              </DetailValue>
            </DetailItem>

            <ModalContent theme={theme}>
              Select which items to delete:
            </ModalContent>

            <CheckboxContainer theme={theme}>
              <CheckboxGroup>
                {associatedData.interactionsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteInteractions"
                      name="deleteInteractions"
                      checked={selectedItems.deleteInteractions}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteInteractions">Interactions ({associatedData.interactionsCount})</label>
                  </CheckboxItem>
                )}

                {associatedData.emailsCount > 0 && (
                  <CheckboxItem>
                    <Checkbox
                      type="checkbox"
                      id="deleteEmails"
                      name="deleteEmails"
                      checked={selectedItems.deleteEmails}
                      onChange={handleCheckboxChange}
                      disabled={isDeleting}
                    />
                    <label htmlFor="deleteEmails">Emails ({associatedData.emailsCount})</label>
                  </CheckboxItem>
                )}

                {/* Add other checkbox items as needed - truncated for brevity */}

              </CheckboxGroup>
            </CheckboxContainer>

            <ModalActions>
              <DeleteButton
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                theme={theme}
              >
                {isDeleting ? 'Deleting...' : 'Delete Selected Items'}
              </DeleteButton>
              <CancelButton
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                theme={theme}
              >
                Cancel
              </CancelButton>
            </ModalActions>
          </>
        )}
      </Modal>

      {/* Email Selection Modal */}
      <Modal
        isOpen={emailModalOpen}
        onRequestClose={() => setEmailModalOpen(false)}
        shouldCloseOnOverlayClick={true}
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
            zIndex: 1001
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
          }
        }}
      >
        <SelectionModalHeader theme={theme}>
          <h3>Select Email Address</h3>
          <SelectionCloseButton theme={theme} onClick={() => setEmailModalOpen(false)}>
            ✕
          </SelectionCloseButton>
        </SelectionModalHeader>

        <SelectionList>
          {contact?.emails?.map((emailObj, index) => (
            <SelectionItem
              key={index}
              theme={theme}
              onClick={() => handleEmailSelect(emailObj.email)}
            >
              <SelectionIcon>
                <FaEnvelope />
              </SelectionIcon>
              <SelectionDetails>
                <SelectionPrimary theme={theme}>
                  {emailObj.email}
                  {emailObj.is_primary && <PrimaryBadge theme={theme}>Primary</PrimaryBadge>}
                </SelectionPrimary>
                <SelectionSecondary theme={theme}>
                  {emailObj.type || 'Email'}
                </SelectionSecondary>
              </SelectionDetails>
            </SelectionItem>
          ))}
        </SelectionList>
      </Modal>

      {/* Mobile Selection Modal */}
      <Modal
        isOpen={mobileModalOpen}
        onRequestClose={() => setMobileModalOpen(false)}
        shouldCloseOnOverlayClick={true}
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
            zIndex: 1001
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
          }
        }}
      >
        <SelectionModalHeader theme={theme}>
          <h3>Select Phone Number</h3>
          <SelectionCloseButton theme={theme} onClick={() => setMobileModalOpen(false)}>
            ✕
          </SelectionCloseButton>
        </SelectionModalHeader>

        <SelectionList>
          {contact?.mobiles?.map((mobileObj, index) => (
            <SelectionItem
              key={index}
              theme={theme}
              onClick={() => handleMobileSelect(mobileObj.mobile)}
            >
              <SelectionIcon>
                <FaPhone />
              </SelectionIcon>
              <SelectionDetails>
                <SelectionPrimary theme={theme}>
                  {mobileObj.mobile}
                  {mobileObj.is_primary && <PrimaryBadge theme={theme}>Primary</PrimaryBadge>}
                </SelectionPrimary>
                <SelectionSecondary theme={theme}>
                  {mobileObj.type || 'Mobile'} • WhatsApp
                </SelectionSecondary>
              </SelectionDetails>
            </SelectionItem>
          ))}
        </SelectionList>
      </Modal>

      {/* Email Detail Modal */}
      <Modal
        isOpen={emailDetailModalOpen}
        onRequestClose={() => setEmailDetailModalOpen(false)}
        shouldCloseOnOverlayClick={true}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
            borderRadius: '12px',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
            zIndex: 1001,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1000
          }
        }}
      >
        {loadingEmailDetail ? (
          <EmailDetailLoading>
            <LoadingSpinner />
            <span>Loading email details...</span>
          </EmailDetailLoading>
        ) : selectedEmailDetail ? (
          <>
            <EmailDetailHeader theme={theme}>
              <EmailDetailTitle theme={theme}>
                {selectedEmailDetail.subject || '(No Subject)'}
              </EmailDetailTitle>

              <EmailDetailCloseButton theme={theme} onClick={() => setEmailDetailModalOpen(false)}>
                ×
              </EmailDetailCloseButton>
            </EmailDetailHeader>

            <EmailDetailBody theme={theme}>
              <EmailDetailMessage theme={theme}>
                {selectedEmailDetail.body_plain || selectedEmailDetail.body_html || '(No message content)'}
              </EmailDetailMessage>
            </EmailDetailBody>
          </>
        ) : (
          <EmailDetailLoading>
            <span>No email details available</span>
          </EmailDetailLoading>
        )}
      </Modal>
    </PageContainer>
  );
};

// Styled Components (reusing from StandaloneInteractions.js with theme support)
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const DetailView = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  display: flex;
  flex-direction: column;
  border-radius: 0;

  @media (min-width: 768px) {
    margin: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    min-height: calc(100vh - 40px);
  }
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  position: sticky;
  top: 0;
  z-index: 10;
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

  @media (max-width: 640px) {
    gap: 0;
    padding: 8px 4px;

    span {
      display: none;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 640px) {
    gap: 4px;
  }
`;

const ActionButton = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  font-family: inherit;

  @media (max-width: 640px) {
    padding: 10px 12px;
    gap: 0;
    font-size: 16px;

    span {
      display: none;
    }
  }

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

  ${props => props.$edit && `
    background: #F59E0B;
    color: white;

    &:hover {
      background: #D97706;
      color: white;
    }
  `}

  ${props => props.$delete && `
    background: #EF4444;
    color: white;

    &:hover {
      background: #DC2626;
      color: white;
    }
  `}
`;

const DetailContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  -webkit-overflow-scrolling: touch;
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
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  border: 3px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#6B7280'};

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#D1D5DB'};
    font-size: 32px;
  }

  @media (min-width: 768px) {
    width: 100px;
    height: 100px;

    svg {
      font-size: 40px;
    }
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
  display: flex;
  flex-direction: column;
  gap: 4px;

  @media (min-width: 768px) {
    font-size: 28px;
  }
`;

const CompanyNames = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};

  @media (min-width: 768px) {
    font-size: 18px;
  }
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

  &:active {
    transform: translateY(0);
  }
`;

const ProfileRole = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
  margin-bottom: 8px;
`;

const ProfileBadges = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const CategoryBadge = styled.div`
  background: ${props => props.theme === 'light' ? '#F0FDF4' : '#14532D'};
  color: ${props => props.theme === 'light' ? '#16A34A' : '#86EFAC'};
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
  border: 1px solid ${props => props.theme === 'light' ? '#BBF7D0' : '#166534'};
`;

const ScoreBadge = styled.div`
  background: white;
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#1D4ED8'};
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InfoSection = styled.div``;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
`;

const InfoItemIcon = styled.div`
  width: 40px;
  display: flex;
  justify-content: center;
  margin-top: 2px;
  flex-shrink: 0;

  svg {
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
    font-size: 16px;
  }
`;

const InfoItemContent = styled.div`
  flex: 1;
`;

const InfoItemLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 2px;
`;

const InfoItemValue = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  a {
    color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const InfoItemSubValue = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 4px;

  a {
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  }
`;

const PrimaryTag = styled.span`
  background: ${props => props.theme === 'light' ? '#D1FAE5' : '#065F46'};
  color: ${props => props.theme === 'light' ? '#065F46' : '#6EE7B7'};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#6B7280'};
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
`;

const NotesText = styled.div`
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  line-height: 1.6;
  font-size: 16px;
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
  border: 3px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-top: 3px solid ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
`;

const ErrorText = styled.div`
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  font-size: 18px;
  font-weight: 500;
`;

// Modal styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  h2 {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    margin: 0;
    font-size: 1.2em;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 5px;
  border-radius: 3px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ModalContactDetail = styled.div`
  margin-bottom: 15px;
`;

const DetailItem = styled.div`
  margin-bottom: 8px;
`;

const DetailLabel = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-weight: 500;
  margin-right: 8px;
`;

const DetailValue = styled.span`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 600;
`;

const ModalContent = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 20px;
  font-weight: 500;
`;

const CheckboxContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 20px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 4px;
  padding: 10px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  label {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    cursor: pointer;
    user-select: none;
    flex: 1;
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const DeleteButton = styled.button`
  background: #DC2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #B91C1C;
  }

  &:disabled {
    background: ${props => props.theme === 'light' ? '#9CA3AF' : '#4B5563'};
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const CancelButton = styled.button`
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

// Navigation styled components
const NavTabs = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 600px;
  margin: 24px auto;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 12px;
  padding: 6px;
  width: fit-content;
  box-shadow: ${props => props.theme === 'light'
    ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
    : '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
  };
`;

const NavTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  font-size: 15px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: fit-content;
  white-space: nowrap;
  position: relative;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)'
        : '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)')
    : 'none'
  };

  &:hover {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    transform: translateY(-1px);
    box-shadow: ${props => props.theme === 'light'
      ? '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)'
      : '0 2px 8px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.4)'
    };
  }

  &:active {
    transform: translateY(0);
  }
`;

const ComingSoonMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 18px;
  font-weight: 500;
`;

// Chat submenu styled components (similar to TouchBase submenu)
const ChatSubMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 500px;
  margin: 15px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
`;

const ChatSubTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: fit-content;
  white-space: nowrap;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 2px rgba(0, 0, 0, 0.1)'
        : '0 1px 2px rgba(0, 0, 0, 0.2)')
    : 'none'
  };

  &:hover:not([disabled]) {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    box-shadow: ${props => props.theme === 'light'
      ? '0 1px 3px rgba(0, 0, 0, 0.12)'
      : '0 1px 3px rgba(0, 0, 0, 0.4)'
    };
  }

  &:active:not([disabled]) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Related submenu styled components
const RelatedSubMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 500px;
  margin: 15px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
`;

const RelatedSubTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: fit-content;
  white-space: nowrap;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 2px rgba(0, 0, 0, 0.1)'
        : '0 1px 2px rgba(0, 0, 0, 0.2)')
    : 'none'
  };

  &:hover:not([disabled]) {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    box-shadow: ${props => props.theme === 'light'
      ? '0 1px 3px rgba(0, 0, 0, 0.12)'
      : '0 1px 3px rgba(0, 0, 0, 0.4)'
    };
  }

  &:active:not([disabled]) {
    transform: scale(0.98);
  }
`;

// Keep in Touch submenu styled components
const KeepInTouchSubMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 600px;
  margin: 15px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
`;

const KeepInTouchSubTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: fit-content;
  white-space: nowrap;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 2px rgba(0, 0, 0, 0.1)'
        : '0 1px 2px rgba(0, 0, 0, 0.2)')
    : 'none'
  };

  &:hover:not([disabled]) {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    box-shadow: ${props => props.theme === 'light'
      ? '0 1px 3px rgba(0, 0, 0, 0.12)'
      : '0 1px 3px rgba(0, 0, 0, 0.4)'
    };
  }

  &:active:not([disabled]) {
    transform: scale(0.98);
  }
`;

// Email/Mobile Selection Modal styled components
const SelectionModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  h3 {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    margin: 0;
    font-size: 1.1em;
    font-weight: 600;
  }
`;

const SelectionCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 5px;
  border-radius: 3px;
  font-size: 18px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const SelectionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SelectionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    border-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#6B7280'};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const SelectionIcon = styled.div`
  width: 32px;
  height: 32px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
    font-size: 14px;
  }
`;

const SelectionDetails = styled.div`
  flex: 1;
`;

const SelectionPrimary = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
  font-size: 15px;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SelectionSecondary = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 13px;
`;

const PrimaryBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#D1FAE5' : '#065F46'};
  color: ${props => props.theme === 'light' ? '#065F46' : '#6EE7B7'};
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
`;

// Timeline styled components
const TimelineContainer = styled.div`
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;
`;

const TimelineLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmptyTimelineMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const TimelineContent = styled.div`
  position: relative;
`;

const TimelineDay = styled.div`
  margin-bottom: 30px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TimelineDateHeader = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 16px;
  margin-bottom: 16px;
  padding-left: 50px;
  position: sticky;
  top: 0;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  padding-top: 8px;
  padding-bottom: 8px;
  z-index: 5;
`;

const TimelineItems = styled.div`
  position: relative;
`;

const TimelineItem = styled.div`
  position: relative;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;

  ${props => props.$clickable && `
    &:hover {
      transform: translateY(-1px);

      & > div:last-child {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  `}

  &:last-child {
    margin-bottom: 0;
  }
`;

const TimelineIconContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  flex-shrink: 0;

  background: ${props => {
    if (props.$direction === 'received') {
      return props.theme === 'light' ? '#DBEAFE' : '#1E3A8A';
    } else {
      return props.theme === 'light' ? '#D1FAE5' : '#065F46';
    }
  }};

  color: ${props => {
    if (props.$direction === 'received') {
      return props.theme === 'light' ? '#1D4ED8' : '#93C5FD';
    } else {
      return props.theme === 'light' ? '#059669' : '#6EE7B7';
    }
  }};

  border: 3px solid ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  svg {
    font-size: 16px;
  }
`;

const TimelineItemContent = styled.div`
  flex: 1;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border-radius: 12px;
  padding: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  margin-top: 4px;
`;

const TimelineItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const TimelineItemType = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
`;

const TimelineDirection = styled.span`
  font-size: 16px;
  color: ${props => {
    if (props.$direction === 'received') {
      return props.theme === 'light' ? '#3B82F6' : '#60A5FA';
    } else {
      return props.theme === 'light' ? '#10B981' : '#34D399';
    }
  }};
`;

const TimelineItemTime = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-weight: 500;
`;

const TimelineItemSummary = styled.div`
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 14px;
  line-height: 1.5;

  a {
    color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const TimelineSpecialTag = styled.div`
  margin-top: 8px;
  padding: 4px 8px;
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#92400E'};
  color: ${props => props.theme === 'light' ? '#92400E' : '#FEF3C7'};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
`;

// Conversation Group styled components
const ConversationGroup = styled.div`
  margin-bottom: 24px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 12px;
  background: ${props => props.theme === 'light' ? '#FEFEFE' : '#2D3748'};
  overflow: hidden;
`;

const ConversationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F8FAFC' : '#1A202C'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E2E8F0' : '#4A5568'};
`;

const ConversationIcon = styled.div`
  font-size: 20px;
  flex-shrink: 0;
`;

const ConversationTitle = styled.div`
  flex: 1;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#2D3748' : '#E2E8F0'};
  font-size: 14px;
`;

const ConversationCount = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: ${props => props.theme === 'light' ? '#718096' : '#A0AEC0'};
  margin-top: 2px;
`;

const ConversationMessages = styled.div`
  padding: 8px;
`;

const ConversationMessage = styled.div`
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  position: relative;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;

  background: ${props => {
    if (props.$direction === 'sent') {
      return props.theme === 'light' ? '#E6FFFA' : '#065F46';
    } else {
      return props.theme === 'light' ? '#EBF8FF' : '#1E3A8A';
    }
  }};

  border-left: 3px solid ${props => {
    if (props.$direction === 'sent') {
      return props.theme === 'light' ? '#38B2AC' : '#81E6D9';
    } else {
      return props.theme === 'light' ? '#4299E1' : '#90CDF4';
    }
  }};

  ${props => props.$clickable && `
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  `}

  &:last-child {
    margin-bottom: 0;
  }
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const MessageDirection = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => {
    if (props.$direction === 'received') {
      return props.theme === 'light' ? '#3182CE' : '#90CDF4';
    } else {
      return props.theme === 'light' ? '#319795' : '#81E6D9';
    }
  }};
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#718096' : '#A0AEC0'};
  font-weight: 500;
`;

const MessageContent = styled.div`
  color: ${props => props.theme === 'light' ? '#2D3748' : '#E2E8F0'};
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;

  a {
    color: ${props => props.theme === 'light' ? '#3182CE' : '#90CDF4'};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

// Email Detail Modal styled components
const EmailDetailLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  flex-direction: column;
`;

const EmailDetailHeader = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const EmailDetailTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  flex: 1;
`;

const EmailDetailCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const EmailDetailBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const EmailDetailMessage = styled.div`
  background-color: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 20px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  max-height: 500px;
  overflow-y: auto;
  font-size: 14px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
    border-radius: 4px;

    &:hover {
      background-color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
    }
  }
`;

export default ContactDetail;