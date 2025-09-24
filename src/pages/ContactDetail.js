import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaArrowLeft, FaEdit, FaStickyNote, FaComments, FaHandshake, FaSlack } from 'react-icons/fa';
import { FiAlertTriangle, FiMail, FiUser, FiCalendar, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';

// Set Modal app element for accessibility
Modal.setAppElement('#root');

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

  // Related data
  const [contactCities, setContactCities] = useState([]);
  const [contactTags, setContactTags] = useState([]);
  const [contactCompanies, setContactCompanies] = useState([]);
  const [loadingRelatedData, setLoadingRelatedData] = useState(false);

  // City management modal
  const [cityModalOpen, setCityModalOpen] = useState(false);
  // Tag management modal
  const [tagModalOpen, setTagModalOpen] = useState(false);
  // Company management modals
  const [associateCompanyModalOpen, setAssociateCompanyModalOpen] = useState(false);
  const [createCompanyModalOpen, setCreateCompanyModalOpen] = useState(false);
  const [prefilledCompanyName, setPrefilledCompanyName] = useState('');

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
      console.error('Error details:', error?.message, error?.details, error?.code);
      toast.error(`Failed to load contact details: ${error?.message || 'Unknown error'}`);
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

  const fetchRelatedData = async () => {
    if (!contactId || !contact) return;

    setLoadingRelatedData(true);
    try {
      // Use the contact's UUID (contact_id field) for relationships
      const contactUuid = contact.contact_id;
      console.log('Fetching related data for contact UUID:', contactUuid);

      // Fetch cities with simplified query
      const { data: cities, error: citiesError } = await supabase
        .from('contact_cities')
        .select(`
          entry_id,
          contact_id,
          city_id,
          cities!inner (
            city_id,
            name,
            country
          )
        `)
        .eq('contact_id', contactUuid);

      if (citiesError) {
        console.error('Cities error:', citiesError);
      }

      // Fetch tags with simplified query
      const { data: tags, error: tagsError } = await supabase
        .from('contact_tags')
        .select(`
          entry_id,
          contact_id,
          tag_id,
          tags!inner (
            tag_id,
            name
          )
        `)
        .eq('contact_id', contactUuid);

      if (tagsError) {
        console.error('Tags error:', tagsError);
      }

      // Fetch companies with simplified query
      const { data: companies, error: companiesError } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          contact_id,
          company_id,
          is_primary,
          companies!inner (
            company_id,
            name,
            website,
            category
          )
        `)
        .eq('contact_id', contactUuid);

      if (companiesError) {
        console.error('Companies error:', companiesError);
      }

      setContactCities(cities || []);
      setContactTags(tags || []);
      setContactCompanies(companies || []);

      console.log('Related data loaded:', { cities, tags, companies });
    } catch (error) {
      console.error('Error fetching related data:', error);
      toast.error('Failed to load related data');
    } finally {
      setLoadingRelatedData(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  useEffect(() => {
    // Only fetch additional data after contact is loaded
    if (!contact) return;

    if (activeTab === 'Chats') {
      if (activeChatTab === 'Timeline') {
        fetchInteractions();
      } else if (activeChatTab === 'WhatsApp') {
        fetchWhatsappInteractions();
      } else if (activeChatTab === 'Email') {
        fetchEmailInteractions();
      }
    } else if (activeTab === 'Related' && activeRelatedTab === 'Contacts') {
      fetchRelatedData();
    }
  }, [contact, activeTab, activeChatTab, activeRelatedTab]);

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

  // City management handlers
  const handleCityAdded = (newCity) => {
    // Refresh the related data to show the new city
    fetchRelatedData();
  };

  const handleCityRemoved = (removedCity) => {
    // Refresh the related data to remove the city
    fetchRelatedData();
  };

  // Tag management handlers
  const handleTagAdded = (newTag) => {
    // Refresh the related data to show the new tag
    fetchRelatedData();
  };

  const handleTagRemoved = (removedTag) => {
    // Refresh the related data to remove the tag
    fetchRelatedData();
  };

  // Company management handlers
  const handleCompanyAdded = (addedCompany) => {
    // Refresh the related data to include the new company
    fetchRelatedData();
  };

  const handleCompanyCreated = (newCompany) => {
    // If we have a contact, also add the relationship
    if (contact && newCompany) {
      // Add the company to this contact
      handleCompanyAdded(newCompany);
    }
    // Close the create modal
    setCreateCompanyModalOpen(false);
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
                <RelatedContainer theme={theme}>
                  {loadingRelatedData ? (
                    <RelatedLoading theme={theme}>
                      <LoadingSpinner />
                      <span>Loading related data...</span>
                    </RelatedLoading>
                  ) : (
                    <>
                      {/* Cities Section */}
                      <RelatedSection theme={theme}>
                        <RelatedSectionHeader>
                          <RelatedSectionTitle theme={theme} style={{ borderBottom: 'none', paddingBottom: '0' }}>
                            🌍 Cities
                          </RelatedSectionTitle>
                          <AddButton theme={theme} onClick={() => setCityModalOpen(true)}>
                            + Add Cities
                          </AddButton>
                        </RelatedSectionHeader>
                        {contactCities.length === 0 ? (
                          <RelatedEmptyMessage theme={theme}>
                            No cities associated with this contact
                          </RelatedEmptyMessage>
                        ) : (
                          <RelatedGrid>
                            {contactCities.map((cityRelation, index) => (
                              <RelatedCard key={index} theme={theme}>
                                <RelatedCardIcon theme={theme}>
                                  🏙️
                                </RelatedCardIcon>
                                <RelatedCardContent>
                                  <RelatedCardTitle theme={theme}>
                                    {cityRelation.cities?.name || cityRelation.cities?.city_name || 'Unknown City'}
                                  </RelatedCardTitle>
                                  {cityRelation.cities?.country && (
                                    <RelatedCardSubtitle theme={theme}>
                                      {cityRelation.cities.country}
                                    </RelatedCardSubtitle>
                                  )}
                                </RelatedCardContent>
                              </RelatedCard>
                            ))}
                          </RelatedGrid>
                        )}
                      </RelatedSection>

                      {/* Divider before Tags */}
                      <div style={{
                        width: '100%',
                        height: '1px',
                        background: theme === 'light' ? '#E5E7EB' : '#374151',
                        margin: '24px 0'
                      }}></div>

                      {/* Tags Section */}
                      <RelatedSection theme={theme}>
                        <RelatedSectionHeader>
                          <RelatedSectionTitle theme={theme} style={{ borderBottom: 'none', paddingBottom: '0' }}>
                            🏷️ Tags
                          </RelatedSectionTitle>
                          <AddButton theme={theme} onClick={() => setTagModalOpen(true)}>
                            + Add Tags
                          </AddButton>
                        </RelatedSectionHeader>
                        {contactTags.length === 0 ? (
                          <RelatedEmptyMessage theme={theme}>
                            No tags associated with this contact
                          </RelatedEmptyMessage>
                        ) : (
                          <TagsContainer>
                            {contactTags.map((tagRelation, index) => (
                              <TagBadge key={index} theme={theme}>
                                {tagRelation.tags?.name || tagRelation.tags?.tag_name || 'Unknown Tag'}
                              </TagBadge>
                            ))}
                          </TagsContainer>
                        )}
                      </RelatedSection>

                      {/* Divider after Tags and before Companies */}
                      <div style={{
                        width: '100%',
                        height: '1px',
                        background: theme === 'light' ? '#E5E7EB' : '#374151',
                        margin: '24px 0 16px 0'
                      }} />

                      {/* Companies Section */}
                      <RelatedSection theme={theme}>
                        <RelatedSectionHeader>
                          <RelatedSectionTitle theme={theme} style={{ borderBottom: 'none', paddingBottom: '0' }}>
                            🏢 Companies
                          </RelatedSectionTitle>
                          <AddButton theme={theme} onClick={() => setAssociateCompanyModalOpen(true)}>
                            + Add Companies
                          </AddButton>
                        </RelatedSectionHeader>
                        {contactCompanies.length === 0 ? (
                          <RelatedEmptyMessage theme={theme}>
                            No companies associated with this contact
                          </RelatedEmptyMessage>
                        ) : (
                          <RelatedGrid>
                            {contactCompanies.map((companyRelation, index) => (
                              <RelatedCard key={index} theme={theme}>
                                <RelatedCardIcon theme={theme}>
                                  🏢
                                </RelatedCardIcon>
                                <RelatedCardContent>
                                  <RelatedCardTitle theme={theme}>
                                    {companyRelation.companies?.name || 'Unknown Company'}
                                  </RelatedCardTitle>
                                  {companyRelation.companies?.category && (
                                    <RelatedCardSubtitle theme={theme}>
                                      {companyRelation.companies.category}
                                    </RelatedCardSubtitle>
                                  )}
                                  {companyRelation.companies?.website && (
                                    <RelatedCardLink
                                      href={companyRelation.companies.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      theme={theme}
                                    >
                                      Visit Website
                                    </RelatedCardLink>
                                  )}
                                  {companyRelation.is_primary && (
                                    <PrimaryBadge theme={theme}>Primary</PrimaryBadge>
                                  )}
                                </RelatedCardContent>
                              </RelatedCard>
                            ))}
                          </RelatedGrid>
                        )}
                      </RelatedSection>
                    </>
                  )}
                </RelatedContainer>
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

      {/* City Management Modal */}
      <Modal
        isOpen={cityModalOpen}
        onRequestClose={() => setCityModalOpen(false)}
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
            borderRadius: '12px',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
            zIndex: 1002,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1001
          }
        }}
      >
        <CityManagementModal
          theme={theme}
          contact={contact}
          contactCities={contactCities}
          onCityAdded={handleCityAdded}
          onCityRemoved={handleCityRemoved}
          onClose={() => setCityModalOpen(false)}
        />
      </Modal>

      {/* Tag Management Modal */}
      <Modal
        isOpen={tagModalOpen}
        onRequestClose={() => setTagModalOpen(false)}
        shouldCloseOnOverlayClick={true}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            background: theme === 'light' ? '#FFFFFF' : '#1F2937',
            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1001
          }
        }}
      >
        <TagManagementModal
          theme={theme}
          contact={contact}
          contactTags={contactTags}
          onTagAdded={handleTagAdded}
          onTagRemoved={handleTagRemoved}
          onClose={() => setTagModalOpen(false)}
        />
      </Modal>

      {/* Associate Company Modal */}
      <Modal
        isOpen={associateCompanyModalOpen}
        onRequestClose={() => setAssociateCompanyModalOpen(false)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            boxShadow: theme === 'light'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            background: theme === 'light' ? '#FFFFFF' : '#1F2937'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1100
          }
        }}
      >
        <AssociateCompanyModal
          theme={theme}
          contact={contact}
          contactCompanies={contactCompanies}
          onCompanyAdded={handleCompanyAdded}
          onClose={() => setAssociateCompanyModalOpen(false)}
          onCreateNewCompany={(companyName) => {
            setAssociateCompanyModalOpen(false);
            setCreateCompanyModalOpen(true);
            // Pass the company name to be pre-filled in the create modal
            setPrefilledCompanyName(companyName);
          }}
        />
      </Modal>

      {/* Create New Company Modal */}
      <Modal
        isOpen={createCompanyModalOpen}
        onRequestClose={() => setCreateCompanyModalOpen(false)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            boxShadow: theme === 'light'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'hidden',
            background: theme === 'light' ? '#FFFFFF' : '#1F2937'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1100
          }
        }}
      >
        <CreateCompanyModal
          theme={theme}
          contact={contact}
          onCompanyCreated={handleCompanyCreated}
          onClose={() => {
            setCreateCompanyModalOpen(false);
            setPrefilledCompanyName(''); // Clear prefilled name when closing
          }}
          prefilledName={prefilledCompanyName}
        />
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

// Related data styled components
const RelatedContainer = styled.div`
  padding: 20px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const RelatedLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  flex-direction: column;
`;

const RelatedSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const RelatedSectionTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const RelatedEmptyMessage = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  text-align: center;
  padding: 20px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border-radius: 8px;
  border: 1px dashed ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
`;

const RelatedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const RelatedCard = styled.div`
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#6B7280'};
  }
`;

const RelatedCardIcon = styled.div`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const RelatedCardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const RelatedCardTitle = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
  word-break: break-word;
`;

const RelatedCardSubtitle = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.875rem;
  margin-bottom: 8px;
`;

const RelatedCardLink = styled.a`
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  text-decoration: none;
  font-size: 0.875rem;
  display: inline-block;
  margin-top: 4px;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
    text-decoration: underline;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TagBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
  border: 1px solid ${props => props.theme === 'light' ? '#DBEAFE' : '#3B82F6'};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E40AF'};
    transform: translateY(-1px);
  }
`;

// City Management Modal Component
const CityManagementModal = ({ theme, contact, contactCities, onCityAdded, onCityRemoved, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch city suggestions
  const fetchCitySuggestions = async (search) => {
    try {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out cities that are already connected
      const filteredSuggestions = data.filter(city =>
        !contactCities.some(cityRelation =>
          cityRelation.cities?.city_id === city.city_id
        )
      );

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetchCitySuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, contactCities]);

  const handleAddCity = async (cityToAdd) => {
    try {
      setLoading(true);

      // Check if already associated
      const { data: existingCheck, error: checkError } = await supabase
        .from('contact_cities')
        .select('contact_id, city_id')
        .eq('contact_id', contact.contact_id)
        .eq('city_id', cityToAdd.city_id);

      if (checkError) throw checkError;

      if (existingCheck && existingCheck.length > 0) {
        setMessage({ type: 'info', text: 'This city is already linked to the contact' });
        return;
      }

      const { data, error } = await supabase
        .from('contact_cities')
        .insert({
          contact_id: contact.contact_id,
          city_id: cityToAdd.city_id,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      onCityAdded(cityToAdd);
      setSearchTerm('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: 'City linked successfully' });
    } catch (error) {
      console.error('Error linking city:', error);
      setMessage({ type: 'error', text: `Failed to link city: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCity = async (cityRelation) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('contact_cities')
        .delete()
        .eq('contact_id', contact.contact_id)
        .eq('city_id', cityRelation.cities.city_id);

      if (error) throw error;

      onCityRemoved(cityRelation);
      setMessage({ type: 'success', text: 'City unlinked successfully' });
    } catch (error) {
      console.error('Error unlinking city:', error);
      setMessage({ type: 'error', text: 'Failed to unlink city' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cities')
        .insert({
          name: searchTerm.trim(),
          country: 'Unknown',
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      if (data && data[0]) {
        await handleAddCity(data[0]);
      }
    } catch (error) {
      console.error('Error creating city:', error);
      setMessage({ type: 'error', text: 'Failed to create city' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      <CityModalHeader theme={theme}>
        <CityModalTitle theme={theme}>Manage Cities</CityModalTitle>
        <CityModalCloseButton theme={theme} onClick={onClose}>
          ×
        </CityModalCloseButton>
      </CityModalHeader>

      <CityModalBody theme={theme}>
        <CityModalSection>
          <CityModalSectionTitle theme={theme}>Related Cities</CityModalSectionTitle>
          <CitiesList>
            {contactCities.map((cityRelation, index) => (
              <CityTag key={index} theme={theme}>
                <span>{cityRelation.cities?.name || 'Unknown City'}</span>
                <CityRemoveButton
                  theme={theme}
                  onClick={() => handleRemoveCity(cityRelation)}
                  disabled={loading}
                >
                  ×
                </CityRemoveButton>
              </CityTag>
            ))}
            {contactCities.length === 0 && (
              <CityEmptyMessage theme={theme}>No cities linked</CityEmptyMessage>
            )}
          </CitiesList>
        </CityModalSection>

        <CityModalSection>
          <CityModalSectionTitle theme={theme}>Add Cities</CityModalSectionTitle>
          <CitySearchContainer>
            <CitySearchInput
              theme={theme}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a city (type at least 2 letters)..."
            />
          </CitySearchContainer>

          {showSuggestions && (
            <CitySuggestionsContainer theme={theme}>
              {suggestions.map(suggestion => (
                <CitySuggestionItem
                  key={suggestion.city_id}
                  theme={theme}
                  onClick={() => handleAddCity(suggestion)}
                  disabled={loading}
                >
                  {suggestion.name}
                  {suggestion.country && suggestion.country !== 'Unknown' && (
                    <span style={{ opacity: 0.7 }}> • {suggestion.country}</span>
                  )}
                </CitySuggestionItem>
              ))}
              {suggestions.length === 0 && searchTerm.length >= 2 && (
                <CityNoResults theme={theme}>No cities found</CityNoResults>
              )}
              {searchTerm.length >= 2 && (
                <CityCreateButton
                  theme={theme}
                  onClick={handleCreateCity}
                  disabled={loading}
                >
                  + Create "{searchTerm}" as new city
                </CityCreateButton>
              )}
            </CitySuggestionsContainer>
          )}
        </CityModalSection>

        {message.text && (
          <CityMessage theme={theme} type={message.type}>
            {message.text}
          </CityMessage>
        )}
      </CityModalBody>

      <CityModalFooter theme={theme}>
        <CityModalButton theme={theme} onClick={onClose}>
          Done
        </CityModalButton>
      </CityModalFooter>

      {loading && (
        <CityLoadingOverlay theme={theme}>
          <LoadingSpinner />
        </CityLoadingOverlay>
      )}
    </>
  );
};

// Tag Management Modal Component
const TagManagementModal = ({ theme, contact, contactTags, onTagAdded, onTagRemoved, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch tag suggestions
  const fetchTagSuggestions = async (search) => {
    try {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out tags already associated with contact
      const filteredSuggestions = data.filter(tag =>
        !contactTags.some(contactTag => contactTag.tags?.tag_id === tag.tag_id || contactTag.tags?.id === tag.id)
      );

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetchTagSuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, contactTags]);

  const handleAddTag = async (tag) => {
    try {
      setLoading(true);
      const tagId = tag.tag_id || tag.id;
      const tagName = tag.name || tag.tag_name;

      if (!tagId) {
        throw new Error('Invalid tag ID');
      }

      // Add relationship in contact_tags table
      const { error } = await supabase
        .from('contact_tags')
        .insert({
          contact_id: contact.contact_id,
          tag_id: tagId
        });

      if (error) throw error;

      setMessage({ type: 'success', text: `Added "${tagName}" successfully` });

      if (onTagAdded) {
        onTagAdded({ tag_id: tagId, name: tagName });
      }

      setSearchTerm('');
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error adding tag:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to add tag' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagRelation) => {
    try {
      setLoading(true);
      const tagId = tagRelation.tags?.tag_id || tagRelation.tags?.id;
      const tagName = tagRelation.tags?.name || tagRelation.tags?.tag_name;

      if (!tagId) {
        throw new Error('Invalid tag ID');
      }

      // Remove relationship from contact_tags table
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contact.contact_id)
        .eq('tag_id', tagId);

      if (error) throw error;

      setMessage({ type: 'success', text: `Removed "${tagName}" successfully` });

      if (onTagRemoved) {
        onTagRemoved({ tag_id: tagId, name: tagName });
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to remove tag' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);

      // Check if tag already exists
      const { data: existingTags, error: checkError } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', searchTerm.trim())
        .limit(1);

      if (checkError) throw checkError;

      let tagToUse;

      if (existingTags && existingTags.length > 0) {
        // Use existing tag
        tagToUse = existingTags[0];
      } else {
        // Create new tag
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({ name: searchTerm.trim() })
          .select()
          .single();

        if (createError) throw createError;
        tagToUse = newTag;
      }

      // Add the tag to contact
      await handleAddTag(tagToUse);
    } catch (error) {
      console.error('Error creating tag:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create tag' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TagModalHeader theme={theme}>
        <TagModalTitle theme={theme}>Manage Tags</TagModalTitle>
        <TagModalCloseButton theme={theme} onClick={onClose}>
          ×
        </TagModalCloseButton>
      </TagModalHeader>

      <TagModalContent theme={theme}>
        <TagModalSection>
          <TagModalSectionTitle theme={theme}>Current Tags</TagModalSectionTitle>
          <TagsList>
            {contactTags.map((tagRelation, index) => (
              <TagBadge key={index} theme={theme}>
                <span>{tagRelation.tags?.name || tagRelation.tags?.tag_name || 'Unknown Tag'}</span>
                <TagRemoveButton
                  theme={theme}
                  onClick={() => handleRemoveTag(tagRelation)}
                  disabled={loading}
                >
                  ×
                </TagRemoveButton>
              </TagBadge>
            ))}
            {contactTags.length === 0 && (
              <TagEmptyMessage theme={theme}>No tags assigned</TagEmptyMessage>
            )}
          </TagsList>
        </TagModalSection>

        <TagModalSection>
          <TagModalSectionTitle theme={theme}>Add Tags</TagModalSectionTitle>
          <TagSearchContainer>
            <TagSearchInput
              theme={theme}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a tag or create new (type at least 2 letters)..."
            />
          </TagSearchContainer>

          {showSuggestions && (
            <TagSuggestionsContainer theme={theme}>
              {suggestions.map((suggestion, index) => (
                <TagSuggestionItem
                  key={index}
                  theme={theme}
                  onClick={() => handleAddTag(suggestion)}
                  disabled={loading}
                >
                  {suggestion.name || suggestion.tag_name}
                </TagSuggestionItem>
              ))}

              {searchTerm.trim() && !suggestions.find(s =>
                (s.name || s.tag_name)?.toLowerCase() === searchTerm.toLowerCase()
              ) && (
                <TagCreateButton
                  theme={theme}
                  onClick={handleCreateTag}
                  disabled={loading}
                >
                  + Create "{searchTerm}"
                </TagCreateButton>
              )}
            </TagSuggestionsContainer>
          )}
        </TagModalSection>

        {message.text && (
          <TagModalMessage theme={theme} type={message.type}>
            {message.text}
          </TagModalMessage>
        )}
      </TagModalContent>

      <TagModalFooter theme={theme}>
        <TagModalButton theme={theme} onClick={onClose}>
          Done
        </TagModalButton>
      </TagModalFooter>

      {loading && (
        <TagLoadingOverlay theme={theme}>
          <LoadingSpinner />
        </TagLoadingOverlay>
      )}
    </>
  );
};

// City Modal Styled Components
const RelatedSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const AddButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
    transform: translateY(-1px);
  }
`;

const CityModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const CityModalTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const CityModalCloseButton = styled.button`
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

const CityModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const CityModalSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CityModalSectionTitle = styled.h4`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
`;

const CitiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  min-height: 32px;
`;

const CityTag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
  border: 1px solid ${props => props.theme === 'light' ? '#DBEAFE' : '#3B82F6'};
  border-radius: 20px;
  font-size: 0.875rem;
  gap: 8px;
  max-width: 200px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }
`;

const CityRemoveButton = styled.button`
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#FEE2E2' : '#7F1D1D'};
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CityEmptyMessage = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  padding: 8px;
`;

const CitySearchContainer = styled.div`
  margin-bottom: 12px;
`;

const CitySearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const CitySuggestionsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const CitySuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  transition: background-color 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CityNoResults = styled.div`
  padding: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.875rem;
  text-align: center;
`;

const CityCreateButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px;
  border: none;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#4B5563'};
  cursor: pointer;
  font-size: 0.875rem;
  color: ${props => props.theme === 'light' ? '#059669' : '#10B981'};
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#6B7280'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CityMessage = styled.div`
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 0.875rem;

  ${props => {
    if (props.type === 'success') {
      return `
        background: ${props.theme === 'light' ? '#D1FAE5' : '#064E3B'};
        color: ${props.theme === 'light' ? '#065F46' : '#6EE7B7'};
      `;
    } else if (props.type === 'error') {
      return `
        background: ${props.theme === 'light' ? '#FEE2E2' : '#7F1D1D'};
        color: ${props.theme === 'light' ? '#B91C1C' : '#FCA5A5'};
      `;
    } else if (props.type === 'info') {
      return `
        background: ${props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
        color: ${props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
      `;
    }
  }}
`;

const CityModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const CityModalButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
  }
`;

const CityLoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)'};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

// Tag Modal Styled Components
const TagModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const TagModalTitle = styled.h2`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const TagModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
  }
`;

const TagModalContent = styled.div`
  padding: 20px 0;
`;

const TagModalSection = styled.div`
  margin-bottom: 24px;
`;

const TagModalSectionTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px 0;
  min-height: 40px;
`;


const TagRemoveButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 0;
  font-size: 1.2rem;

  &:hover {
    color: ${props => props.theme === 'light' ? '#DC2626' : '#F87171'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TagEmptyMessage = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  padding: 8px 0;
`;

const TagSearchContainer = styled.div`
  margin-bottom: 16px;
`;

const TagSearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  font-size: 1rem;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 3px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const TagSuggestionsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const TagSuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  cursor: pointer;
  font-size: 0.875rem;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TagCreateButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F0FDF4' : '#064E3B'};
  border: none;
  color: ${props => props.theme === 'light' ? '#059669' : '#34D399'};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#DCFCE7' : '#065F46'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TagModalMessage = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-top: 16px;

  ${props => props.type === 'success' && `
    background: ${props.theme === 'light' ? '#F0FDF4' : '#064E3B'};
    color: ${props.theme === 'light' ? '#059669' : '#34D399'};
    border: 1px solid ${props.theme === 'light' ? '#BBF7D0' : '#065F46'};
  `}

  ${props => props.type === 'error' && `
    background: ${props.theme === 'light' ? '#FEF2F2' : '#7F1D1D'};
    color: ${props.theme === 'light' ? '#DC2626' : '#F87171'};
    border: 1px solid ${props.theme === 'light' ? '#FECACA' : '#991B1B'};
  `}
`;

const TagModalFooter = styled.div`
  padding-top: 16px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
`;

const TagModalButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TagLoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

// Associate Company Modal Component
const AssociateCompanyModal = ({ theme, contact, contactCompanies, onCompanyAdded, onClose, onCreateNewCompany }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch company suggestions
  const fetchCompanySuggestions = async (search) => {
    try {
      if (search.length < 3) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out companies that are already associated
      const filteredSuggestions = data.filter(company => {
        const companyId = company.company_id || company.id;
        return !contactCompanies.some(relation => {
          const relationCompanyId = relation.companies?.company_id || relation.companies?.id;
          return relationCompanyId === companyId;
        });
      });

      setSuggestions(filteredSuggestions);
    } catch (err) {
      console.error('Error fetching company suggestions:', err);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 3) {
      fetchCompanySuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, contactCompanies]);

  const handleAddCompany = async (company) => {
    try {
      setLoading(true);

      // Add relationship in contact_companies table
      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.contact_id,
          company_id: company.company_id || company.id
        });

      if (error) throw error;

      onCompanyAdded(company);
      setSearchTerm('');
      setShowSuggestions(false);
    } catch (err) {
      console.error('Error adding company:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompanyModalContainer theme={theme}>
      <CompanyModalHeader theme={theme}>
        <CompanyModalTitle theme={theme}>Associate Company</CompanyModalTitle>
        <CompanyModalCloseButton theme={theme} onClick={onClose}>
          ×
        </CompanyModalCloseButton>
      </CompanyModalHeader>

      <CompanyModalContent theme={theme}>
        <CompanySearchContainer>
          <CompanySearchInput
            theme={theme}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a company by name..."
          />
          <CompanySearchIcon theme={theme}>🔍</CompanySearchIcon>
        </CompanySearchContainer>

        {showSuggestions && (
          <CompanySuggestionsContainer theme={theme}>
            {suggestions.length > 0
              ? suggestions.map((suggestion, index) => (
                  <CompanySuggestionItem
                    key={suggestion.id || suggestion.company_id || `suggestion-${index}`}
                    theme={theme}
                    onClick={() => handleAddCompany(suggestion)}
                    disabled={loading}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{suggestion.name}</div>
                      {suggestion.website && (
                        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                          {suggestion.website}
                        </div>
                      )}
                    </div>
                  </CompanySuggestionItem>
                ))
              : searchTerm.length >= 3
                ? [<CompanyNoResults key={`no-results-${searchTerm}`} theme={theme}>
                    No companies found with that name.
                    <CompanyCreateButton
                      theme={theme}
                      onClick={() => onCreateNewCompany(searchTerm)}
                    >
                      + Create "{searchTerm}"
                    </CompanyCreateButton>
                  </CompanyNoResults>]
                : []
            }
          </CompanySuggestionsContainer>
        )}
      </CompanyModalContent>

      <CompanyModalFooter theme={theme}>
        <CompanyModalButton
          theme={theme}
          variant="secondary"
          onClick={onClose}
        >
          Cancel
        </CompanyModalButton>
        <CompanyModalButton
          theme={theme}
          variant="primary"
          disabled
        >
          Select a Company
        </CompanyModalButton>
      </CompanyModalFooter>
    </CompanyModalContainer>
  );
};

// Create New Company Modal Component
const CreateCompanyModal = ({ theme, contact, onCompanyCreated, onClose, prefilledName = '' }) => {
  const [companyName, setCompanyName] = useState(prefilledName);
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyCategory, setCompanyCategory] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (prefilledName && prefilledName !== companyName) {
      setCompanyName(prefilledName);
    }
  }, [prefilledName]);

  const COMPANY_CATEGORIES = [
    'Advisory',
    'Corporation',
    'Institution',
    'Professional Investor',
    'SME',
    'Startup',
    'Supplier',
    'Media',
    'Team'
  ];

  // Fetch tag suggestions
  const fetchTagSuggestions = async (search) => {
    try {
      if (!search || search.length < 3) {
        setTagSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out already selected tags
      const filteredSuggestions = data.filter(tag => {
        const tagId = tag.id || tag.tag_id;
        return !selectedTags.some(selectedTag => {
          const selectedTagId = selectedTag.id || selectedTag.tag_id;
          return selectedTagId === tagId || selectedTag.name === tag.name;
        });
      });

      setTagSuggestions(filteredSuggestions);
    } catch (err) {
      console.error('Error fetching tag suggestions:', err);
    }
  };

  // Handle tag search
  useEffect(() => {
    fetchTagSuggestions(searchTerm);
  }, [searchTerm]);

  const handleAddTag = async (tag) => {
    setSelectedTags([...selectedTags, tag]);
    setSearchTerm('');
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagId) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleCreateTag = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: searchTerm.trim() })
        .select()
        .single();

      if (error) throw error;

      handleAddTag(data);
    } catch (err) {
      console.error('Error creating new tag:', err);
      setError('Failed to create new tag');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    if (!companyCategory) {
      setError('Company category is required');
      return;
    }
    if (!companyDescription.trim()) {
      setError('Company description is required');
      return;
    }

    try {
      setLoading(true);

      // Format website URL if provided
      let formattedWebsite = companyWebsite.trim();
      if (formattedWebsite && !formattedWebsite.match(/^https?:\/\//)) {
        formattedWebsite = 'https://' + formattedWebsite;
      }

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName.trim(),
          website: formattedWebsite,
          category: companyCategory,
          description: companyDescription.trim()
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Add tags if any
      if (selectedTags.length > 0) {
        const tagConnections = selectedTags.map(tag => ({
          company_id: company.company_id || company.id,
          tag_id: tag.id || tag.tag_id
        }));

        const { error: tagsError } = await supabase
          .from('company_tags')
          .insert(tagConnections);

        if (tagsError) throw tagsError;
      }

      // If we have a contact, create the relationship
      if (contact) {
        await supabase
          .from('contact_companies')
          .insert({
            contact_id: contact.contact_id,
            company_id: company.company_id || company.id
          });
      }

      onCompanyCreated(company);
      onClose();
    } catch (err) {
      console.error('Error creating company:', err);
      setError('Failed to create company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get tag colors
  const getTagColor = (tagName) => {
    const colors = [
      { bg: '#fee2e2', text: '#b91c1c' }, // Red
      { bg: '#fef3c7', text: '#92400e' }, // Amber
      { bg: '#ecfccb', text: '#3f6212' }, // Lime
      { bg: '#d1fae5', text: '#065f46' }, // Emerald
      { bg: '#e0f2fe', text: '#0369a1' }, // Sky
      { bg: '#ede9fe', text: '#5b21b6' }, // Violet
      { bg: '#fae8ff', text: '#86198f' }, // Fuchsia
      { bg: '#fce7f3', text: '#9d174d' }  // Pink
    ];

    // Generate a consistent index based on the tag name
    const sum = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = sum % colors.length;

    return colors[index];
  };

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          border: 'none',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          backgroundColor: theme === 'light' ? 'white' : '#1F2937'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1100
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <CreateCompanyModalHeader theme={theme}>
          <CreateCompanyModalTitle theme={theme}>Create New Company</CreateCompanyModalTitle>
          <CreateCompanyModalCloseButton theme={theme} onClick={onClose}>
            ×
          </CreateCompanyModalCloseButton>
        </CreateCompanyModalHeader>

        <form onSubmit={handleSubmit}>
          <CreateCompanyFormGroup>
            <CreateCompanyLabel theme={theme}>Company Name *</CreateCompanyLabel>
            <CreateCompanyInput
              theme={theme}
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </CreateCompanyFormGroup>

          <CreateCompanyFormGroup>
            <CreateCompanyLabel theme={theme}>Website</CreateCompanyLabel>
            <CreateCompanyInput
              theme={theme}
              type="text"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="www.example.com"
            />
          </CreateCompanyFormGroup>

          <CreateCompanyFormGroup>
            <CreateCompanyLabel theme={theme}>Category *</CreateCompanyLabel>
            <CreateCompanySelect
              theme={theme}
              value={companyCategory}
              onChange={(e) => setCompanyCategory(e.target.value)}
              required
            >
              <option value="">Select a category...</option>
              {COMPANY_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </CreateCompanySelect>
          </CreateCompanyFormGroup>

          <CreateCompanyFormGroup>
            <CreateCompanyLabel theme={theme}>Description *</CreateCompanyLabel>
            <CreateCompanyTextArea
              theme={theme}
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              placeholder="Enter company description..."
              required
            />
          </CreateCompanyFormGroup>

          <CreateCompanyTagsSection>
            <CreateCompanySectionTitle theme={theme}>Tags</CreateCompanySectionTitle>
            <CreateCompanyTagsList>
              {selectedTags.map((tag, index) => {
                const color = getTagColor(tag.name);
                return (
                  <CreateCompanyTag
                    key={tag.id || tag.tag_id || `selected-tag-${index}`}
                    color={color.bg}
                    textColor={color.text}
                  >
                    <span>{tag.name}</span>
                    <button type="button" onClick={() => handleRemoveTag(tag.id)}>
                      ×
                    </button>
                  </CreateCompanyTag>
                );
              })}
            </CreateCompanyTagsList>

            <CreateCompanyFormGroup style={{ width: '87%' }}>
              <CreateCompanySearchContainer style={{ width: '100%' }}>
                <CreateCompanySearchIcon>
                  🔍
                </CreateCompanySearchIcon>
                <CreateCompanySearchInput
                  theme={theme}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search or create new tag..."
                  onFocus={() => setShowTagSuggestions(true)}
                />
              </CreateCompanySearchContainer>
            </CreateCompanyFormGroup>

            {showTagSuggestions && searchTerm.length >= 3 && (
              <CreateCompanySuggestionsContainer>
                {tagSuggestions.map((suggestion, index) => (
                  <CreateCompanySuggestionItem
                    key={suggestion.id || suggestion.tag_id || `tag-${index}`}
                    theme={theme}
                    onClick={() => handleAddTag(suggestion)}
                  >
                    {suggestion.name}
                  </CreateCompanySuggestionItem>
                ))}
                {searchTerm.trim() && !tagSuggestions.find(s => s.name.toLowerCase() === searchTerm.toLowerCase()) && (
                  <CreateCompanyNewTagButton
                    key={`create-tag-${searchTerm}`}
                    theme={theme}
                    onClick={handleCreateTag}
                    disabled={loading}
                  >
                    + Create "{searchTerm}"
                  </CreateCompanyNewTagButton>
                )}
              </CreateCompanySuggestionsContainer>
            )}
          </CreateCompanyTagsSection>

          {error && (
            <CreateCompanyMessage className="error" theme={theme}>
              {error}
            </CreateCompanyMessage>
          )}

          <CreateCompanyButtonGroup>
            <CreateCompanyButton
              type="button"
              className="secondary"
              theme={theme}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </CreateCompanyButton>
            <CreateCompanyButton
              type="submit"
              className="primary"
              theme={theme}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Company'}
            </CreateCompanyButton>
          </CreateCompanyButtonGroup>
        </form>
      </div>
    </Modal>
  );
};

// Company Modal Styled Components
// Associate Company Modal Styled Components
const CompanyModalContainer = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const CompanyModalHeader = styled.div`
  padding: 24px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding-bottom: 16px;
  margin-bottom: 0;
`;

const CompanyModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const CompanyModalCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 4px;
  line-height: 1;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const CompanyModalContent = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
`;

const CompanySearchContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const CompanySearchInput = styled.input`
  width: 100%;
  padding: 12px 48px 12px 16px;
  border: 2px solid ${props => props.theme === 'light' ? '#10B981' : '#065F46'};
  border-radius: 8px;
  font-size: 1rem;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#059669' : '#10B981'};
    box-shadow: 0 0 0 3px ${props => props.theme === 'light' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.2)'};
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  }
`;

const CompanySearchIcon = styled.div`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
`;

const CompanySuggestionsContainer = styled.div`
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
`;

const CompanySuggestionItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CompanyNoResults = styled.div`
  padding: 16px;
  text-align: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const CompanyCreateButton = styled.button`
  margin-top: 12px;
  padding: 8px 16px;
  background: ${props => props.theme === 'light' ? '#10B981' : '#065F46'};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: ${props => props.theme === 'light' ? '#059669' : '#10B981'};
  }
`;

const CompanyModalFooter = styled.div`
  padding: 16px 24px 24px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const CompanyModalButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.variant === 'primary' ? `
    background: ${props.theme === 'light' ? '#10B981' : '#065F46'};
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: ${props.theme === 'light' ? '#059669' : '#10B981'};
    }
  ` : `
    background: ${props.theme === 'light' ? '#FFFFFF' : '#374151'};
    color: ${props.theme === 'light' ? '#374151' : '#D1D5DB'};
    border: 1px solid ${props.theme === 'light' ? '#D1D5DB' : '#4B5563'};

    &:hover {
      background: ${props.theme === 'light' ? '#F9FAFB' : '#4B5563'};
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Create Company Modal Styled Components
const CreateCompanyModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#e5e7eb' : '#374151'};
`;

const CreateCompanyModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 600;
`;

const CreateCompanyModalCloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#6b7280' : '#9CA3AF'};
  padding: 4px;
  border-radius: 4px;
  font-size: 1.5rem;
  line-height: 1;

  &:hover {
    color: ${props => props.theme === 'light' ? '#1f2937' : '#F9FAFB'};
    background-color: ${props => props.theme === 'light' ? '#f3f4f6' : '#374151'};
  }
`;

const CreateCompanyFormGroup = styled.div`
  margin-bottom: 15px;
`;

const CreateCompanyLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
`;

const CreateCompanyInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#d1d5db' : '#4B5563'};
  border-radius: 4px;
  font-size: 0.875rem;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const CreateCompanySelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#d1d5db' : '#4B5563'};
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: ${props => props.theme === 'light' ? 'white' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const CreateCompanyTextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#d1d5db' : '#4B5563'};
  border-radius: 4px;
  font-size: 0.875rem;
  min-height: 100px;
  resize: vertical;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const CreateCompanyTagsSection = styled.div`
  margin-top: 20px;
  margin-bottom: 15px;
`;

const CreateCompanySectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  margin-bottom: 12px;
`;

const CreateCompanyTagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 5px 0;
  min-height: 32px;
`;

const CreateCompanyTag = styled.div.withConfig({
  shouldForwardProp: (prop) => !['color', 'textColor'].includes(prop),
})`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#374151'};
  border-radius: 16px;
  font-size: 0.875rem;
  gap: 6px;
  max-width: 200px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  button {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      opacity: 1;
    }
  }
`;

const CreateCompanySearchContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
  width: 85%;
`;

const CreateCompanySearchIcon = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme === 'light' ? '#6b7280' : '#9CA3AF'};
`;

const CreateCompanySearchInput = styled.input`
  width: 100%;
  padding: 10px 10px 10px 35px;
  border: 1px solid ${props => props.theme === 'light' ? '#d1d5db' : '#4B5563'};
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const CreateCompanySuggestionsContainer = styled.div`
  position: relative;
  margin-top: 5px;
  border: 1px solid ${props => props.theme === 'light' ? '#e5e7eb' : '#4B5563'};
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  background-color: ${props => props.theme === 'light' ? 'white' : '#374151'};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  width: 87%;
`;

const CreateCompanySuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background-color: ${props => props.theme === 'light' ? '#f3f4f6' : '#4B5563'};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme === 'light' ? '#f3f4f6' : '#4B5563'};
  }
`;

const CreateCompanyNewTagButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background-color: ${props => props.theme === 'light' ? '#f3f4f6' : '#4B5563'};
  cursor: pointer;
  font-size: 0.875rem;
  color: ${props => props.theme === 'light' ? '#1f2937' : '#F9FAFB'};
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme === 'light' ? '#e5e7eb' : '#6B7280'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CreateCompanyMessage = styled.div`
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.875rem;

  &.error {
    background-color: ${props => props.theme === 'light' ? '#fee2e2' : '#7F1D1D'};
    color: ${props => props.theme === 'light' ? '#b91c1c' : '#FEE2E2'};
  }
`;

const CreateCompanyButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const CreateCompanyButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: #000000;
    color: white;
    border: none;

    &:hover {
      background-color: #333333;
    }
  }

  &.secondary {
    background-color: ${props => props.theme === 'light' ? 'white' : '#374151'};
    color: ${props => props.theme === 'light' ? '#4b5563' : '#F9FAFB'};
    border: 1px solid ${props => props.theme === 'light' ? '#d1d5db' : '#4B5563'};

    &:hover {
      background-color: ${props => props.theme === 'light' ? '#f9fafb' : '#4B5563'};
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;


export default ContactDetail;