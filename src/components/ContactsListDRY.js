import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaEdit, FaClock, FaTimes, FaCalendarAlt, FaHeart, FaCog, FaInfoCircle, FaStar, FaPlus, FaBriefcase, FaLink, FaHandshake, FaBolt, FaTrash, FaMapMarkerAlt, FaTag, FaExternalLinkAlt, FaSkull } from 'react-icons/fa';
import { FiSkipForward, FiAlertTriangle, FiX, FiMessageCircle, FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';
import { CityManagementModal, TagManagementModal } from './RelatedSection';
import FindDuplicatesModal from './FindDuplicatesModal';
import ContactEnrichModal from './modals/ContactEnrichModal';
import CreateCompanyModal from './modals/CreateCompanyModal';
import ContactCard from './ContactCard';
import QuickEditModal from './QuickEditModal';
import { useQuickEditModal } from '../hooks/useQuickEditModal';
// Remove CompanyMainModal import - we'll handle this inline

const ContactsListDRY = ({
  dataSource = null, // { type: 'interactions', timeFilter: 'Today' } or { type: 'spam', subCategory: 'Email' } etc.
  refreshTrigger = 0, // External trigger to refresh data
  onDataLoad = null, // Callback when data is loaded
  theme,
  emptyStateConfig = {
    icon: '📥',
    title: 'No contacts found',
    text: 'There are no contacts to display.'
  },
  onContactUpdate,
  showActions = true,
  onContactClick,
  badgeType = 'time', // 'time' or 'category'
  pageContext = null, // 'keepInTouch' or null
  keepInTouchConfig = null, // { showDaysCounter: boolean, showFrequencyBadge: boolean }
  filterCategory = null // 'Birthday' or other category
}) => {
  const navigate = useNavigate();

  // Internal state for data management
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data based on dataSource
  const fetchData = async () => {
    console.log('[ContactsListDRY] fetchData called');
    console.log('[ContactsListDRY] dataSource:', dataSource);
    console.log('[ContactsListDRY] pageContext:', pageContext);

    if (!dataSource) return;

    setLoading(true);
    try {
      let data = [];

      if (dataSource.type === 'interactions') {
        console.log('[INTERACTIONS] Starting fetch');
        // Fetch interactions data similar to InteractionsPage
        let startDate = new Date();
        let endDate = null;
        const timeFilter = dataSource.timeFilter || 'Today';
        const filterCategory = dataSource.filterCategory || 'All';

        if (timeFilter === 'Today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'This Week') {
          endDate = new Date();
          endDate.setDate(endDate.getDate() - 1);
          endDate.setHours(23, 59, 59, 999);
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'This Month') {
          endDate = new Date();
          endDate.setDate(endDate.getDate() - 8);
          endDate.setHours(23, 59, 59, 999);
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
        }

        const formattedStartDate = startDate.toISOString();
        let query = supabase
          .from('contacts')
          .select(`
            *,
            contact_companies (
              company_id,
              is_primary,
              companies (
                company_id,
                name
              )
            ),
            contact_emails (
              email_id,
              email,
              type,
              is_primary
            ),
            contact_mobiles (
              mobile_id,
              mobile,
              type,
              is_primary
            ),
            contact_cities (
              city_id,
              cities (
                city_id,
                name
              )
            ),
            contact_tags (
              tag_id,
              tags (
                tag_id,
                name
              )
            ),
            keep_in_touch (
              frequency,
              christmas,
              easter
            )
          `)
          .not('category', 'in', '("Skip","WhatsApp Group Contact","System","Not Set","Inbox")')
          .not('last_interaction_at', 'is', null);

        if (filterCategory !== 'All') {
          if (filterCategory === 'Founders') {
            query = query.eq('category', 'Founder');
          } else if (filterCategory === 'Investors') {
            query = query.eq('category', 'Professional Investor');
          } else if (filterCategory === 'Family and Friends') {
            query = query.eq('category', 'Friend and Family');
          }
        } else {
          query = query.gte('last_interaction_at', formattedStartDate);
          if (endDate) {
            const formattedEndDate = endDate.toISOString();
            query = query.lte('last_interaction_at', formattedEndDate);
          }
        }

        const { data: contactsData, error } = await query
          .order('last_interaction_at', { ascending: false, nullsLast: true })
          .limit(100);

        if (error) throw error;

        // Fetch completeness scores
        let completenessScores = {};
        if (contactsData && contactsData.length > 0) {
          const contactIds = contactsData.map(contact => contact.contact_id);
          const { data: completenessData } = await supabase
            .from('contact_completeness')
            .select('contact_id, completeness_score')
            .in('contact_id', contactIds);

          if (completenessData) {
            completenessScores = completenessData.reduce((acc, item) => {
              acc[item.contact_id] = item.completeness_score;
              return acc;
            }, {});
          }
        }

        // Transform data
        data = (contactsData || []).map(contact => ({
          ...contact,
          companies: contact.contact_companies?.map(cc => ({
            ...cc.companies,
            company_id: cc.company_id
          })).filter(Boolean) || [],
          contact_emails: contact.contact_emails || [], // Keep emails!
          keep_in_touch_frequency: contact.keep_in_touch?.frequency || contact.keep_in_touch?.[0]?.frequency || null,
          christmas: contact.keep_in_touch?.christmas || contact.keep_in_touch?.[0]?.christmas || null,
          easter: contact.keep_in_touch?.easter || contact.keep_in_touch?.[0]?.easter || null,
          completeness_score: completenessScores[contact.contact_id] || null
        }));

        console.log('[INTERACTIONS] After transform:', data);
        if (data && data.length > 0) {
          console.log('[INTERACTIONS] First contact after transform:', data[0]);
          console.log('[INTERACTIONS] First contact emails after transform:', data[0].contact_emails);
        }

      } else if (dataSource.type === 'spam') {
        // Fetch spam data based on subCategory
        const subCategory = dataSource.subCategory || 'Email';

        if (subCategory === 'Email') {
          // Fetch emails pending spam review (special_case = 'pending_approval')
          const { data: spamEmails, error } = await supabase
            .from('email_inbox')
            .select('*')
            .eq('special_case', 'pending_approval')
            .order('message_timestamp', { ascending: false })
            .limit(100);

          if (error) throw error;

          // Transform spam emails to contact format
          data = (spamEmails || []).map(email => {
            const isSent = email.direction?.toLowerCase() === 'sent';
            const contactEmail = isSent ? email.to_email : email.from_email;
            const contactName = isSent ? email.to_name : email.from_name;

            return {
              contact_id: `spam-email-${email.id}`,
              first_name: contactName || contactEmail?.split('@')[0] || 'Unknown',
              last_name: contactEmail ? `(${contactEmail.split('@')[1]})` : '(Spam)',
              email: contactEmail || '',
              mobile: email.subject || '(No Subject)',
              last_interaction_at: email.message_timestamp,
              created_at: email.message_timestamp,
              category: 'Spam',
              direction: email.direction,
              email_data: email
            };
          });

        } else if (subCategory === 'WhatsApp') {
          // For WhatsApp spam, check if there's a whatsapp_spam table or similar
          const { data: spamData, error } = await supabase
            .from('whatsapp_spam')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) {
            console.warn('WhatsApp spam table not available:', error);
            data = [];
          } else {
            // Transform WhatsApp spam data
            data = (spamData || []).map(spam => ({
              contact_id: `spam-whatsapp-${spam.id || Date.now()}`,
              first_name: spam.phone_number || 'Unknown',
              last_name: '(WhatsApp Spam)',
              mobile: spam.phone_number || null,
              category: 'Spam',
              created_at: spam.created_at,
              ...spam
            }));
          }
        }

      } else if (dataSource.type === 'missing') {
        // Fetch missing data based on subCategory
        const subCategory = dataSource.subCategory || 'Basics';

        if (subCategory === 'Basics') {
          // Use the dedicated view for contacts without basic info
          const { data: basicsData, error } = await supabase
            .from('contacts_without_basics')
            .select('*')
            .not('last_interaction_at', 'is', null)
            .order('last_interaction_at', { ascending: false })
            .limit(100);

          if (error) throw error;

          // Transform data
          data = (basicsData || []).map(contact => ({
            ...contact,
            emails: [],
            mobiles: [],
            companies: [],
            contact_emails: [], // Keep empty for compatibility
          }));

        } else if (subCategory === 'Company') {
          // Use the optimized view for contacts without companies
          const { data: companyData, error } = await supabase
            .from('contacts_without_companies')
            .select('*')
            .not('category', 'in', '("Skip","WhatsApp Group Contact","System","Not Set","Inbox")')
            .not('last_interaction_at', 'is', null)
            .order('last_interaction_at', { ascending: false })
            .limit(100);

          if (error) throw error;

          // Transform data
          data = (companyData || []).map(contact => ({
            ...contact,
            emails: contact.emails || [],
            mobiles: contact.mobiles || [],
            companies: [],
            contact_emails: contact.emails || [], // Map emails to contact_emails for compatibility
          }));

        } else if (subCategory === 'Tags') {
          // Use the dedicated view for contacts without tags
          const { data: tagsData, error } = await supabase
            .from('contacts_without_tags')
            .select('*')
            .not('last_interaction_at', 'is', null)
            .order('last_interaction_at', { ascending: false })
            .limit(100);

          if (error) throw error;

          // Transform data
          data = (tagsData || []).map(contact => ({
            ...contact,
            emails: [],
            mobiles: [],
            companies: [],
            tags: [],
            contact_emails: [], // Keep empty for compatibility
          }));

        } else if (subCategory === 'Cities') {
          // Use the dedicated view for contacts without cities
          const { data: citiesData, error } = await supabase
            .from('contacts_without_cities')
            .select('*')
            .not('last_interaction_at', 'is', null)
            .order('last_interaction_at', { ascending: false })
            .limit(100);

          if (error) throw error;

          // Transform data
          data = (citiesData || []).map(contact => ({
            ...contact,
            emails: [],
            mobiles: [],
            companies: [],
            cities: [],
            contact_emails: [], // Keep empty for compatibility
          }));

        } else if (subCategory === 'Score') {
          // Use the dedicated view for contacts without score
          const { data: scoreData, error } = await supabase
            .from('contacts_without_score')
            .select('*')
            .not('last_interaction_at', 'is', null)
            .order('last_interaction_at', { ascending: false })
            .limit(100);

          if (error) throw error;

          // Transform data
          data = (scoreData || []).map(contact => ({
            ...contact,
            emails: [],
            mobiles: [],
            companies: [],
            contact_emails: [], // Keep empty for compatibility
          }));

        } else if (subCategory === 'Keep in touch') {
          // Use the dedicated view for contacts without keep in touch
          const { data: kitData, error } = await supabase
            .from('contacts_without_keep_in_touch')
            .select('*')
            .not('last_interaction_at', 'is', null)
            .order('last_interaction_at', { ascending: false })
            .limit(100);

          if (error) throw error;

          // Transform data
          data = (kitData || []).map(contact => ({
            ...contact,
            emails: [],
            mobiles: [],
            companies: [],
            keep_in_touch: null,
            contact_emails: [], // Keep empty for compatibility
          }));

        } else if (subCategory === 'Birthday') {
          // Use the dedicated view for contacts without birthday
          const { data: birthdayData, error } = await supabase
            .from('contacts_without_birthday')
            .select('*')
            .not('last_interaction_at', 'is', null)
            .order('last_interaction_at', { ascending: false })
            .limit(100);

          if (error) throw error;

          // Transform data
          data = (birthdayData || []).map(contact => ({
            ...contact,
            emails: [],
            mobiles: [],
            companies: [],
            birthday: null,
            contact_emails: [], // Keep empty for compatibility
          }));

        } else {
          // For other subcategories, use generic query approach
          let query = supabase
            .from('contacts')
            .select(`
              *,
              contact_companies (
                company_id,
                is_primary,
                companies (
                  company_id,
                  name
                )
              ),
              contact_emails (
                email_id,
                email,
                type,
                is_primary
              ),
              contact_mobiles (
                mobile_id,
                mobile,
                type,
                is_primary
              ),
              contact_cities (
                city_id,
                cities (
                  city_id,
                  name
                )
              ),
              contact_tags (
                tag_id,
                tags (
                  tag_id,
                  name
                )
              ),
              keep_in_touch (
                frequency,
                christmas,
                easter
              )
            `)
            .not('category', 'in', '("Skip","WhatsApp Group Contact","System","Not Set","Inbox")');

          // Apply missing data filters based on subCategory
          if (subCategory === 'Email') {
            query = query.or('contact_emails.is.null,contact_emails.eq.{}');
          } else if (subCategory === 'Mobile') {
            query = query.or('contact_mobiles.is.null,contact_mobiles.eq.{}');
          } else if (subCategory === 'LinkedIn') {
            query = query.or('linkedin.is.null,linkedin.eq.""');
          } else if (subCategory === 'Job Role') {
            query = query.or('job_role.is.null,job_role.eq.""');
          } else if (subCategory === 'Category') {
            query = query.or('category.is.null,category.eq.""');
          } else if (subCategory === 'Score') {
            query = query.or('score.is.null,score.eq.0');
          } else if (subCategory === 'City' || subCategory === 'Cities') {
            query = query.or('contact_cities.is.null,contact_cities.eq.{}');
          } else if (subCategory === 'Tags') {
            query = query.or('contact_tags.is.null,contact_tags.eq.{}');
          } else if (subCategory === 'Keep in touch') {
            query = query.or('keep_in_touch.is.null,keep_in_touch.eq.{}');
          } else if (subCategory === 'Birthday') {
            query = query.or('birthday.is.null,birthday.eq.""');
          }

          const { data: contactsData, error } = await query
            .order('last_interaction_at', { ascending: false, nullsLast: true })
            .limit(100);

          if (error) throw error;

          // Transform data
          data = (contactsData || []).map(contact => ({
            ...contact,
            companies: contact.contact_companies?.map(cc => ({
              ...cc.companies,
              company_id: cc.company_id
            })).filter(Boolean) || [],
            contact_emails: contact.contact_emails || [],
            keep_in_touch_frequency: contact.keep_in_touch?.frequency || contact.keep_in_touch?.[0]?.frequency || null,
            christmas: contact.keep_in_touch?.christmas || contact.keep_in_touch?.[0]?.christmas || null,
            easter: contact.keep_in_touch?.easter || contact.keep_in_touch?.[0]?.easter || null
          }));
        }

      } else if (dataSource.type === 'mail_filter') {
        // Fetch mail filter data - contacts that need email filtering
        const { data: emailData, error } = await supabase
          .from('email_inbox')
          .select('*')
          .eq('special_case', 'mail_filter')
          .order('message_timestamp', { ascending: false })
          .limit(100);

        if (error) throw error;

        // Transform email data to contact-like structure for display
        data = (emailData || []).map(email => ({
          contact_id: email.id,
          first_name: email.from_name?.split(' ')[0] || '',
          last_name: email.from_name?.split(' ').slice(1).join(' ') || '',
          contact_emails: [{
            email_id: email.id,
            email: email.from_email,
            is_primary: true
          }],
          email_data: email, // Include original email data
          category: 'Mail Filter'
        }));

      } else if (dataSource.type === 'inbox') {
        // Fetch inbox data using the new view with time filtering
        const timeFilter = dataSource.timeFilter || 'Today';

        // Calculate date range based on time filter - matching interactions logic
        let startDate = new Date();
        let endDate = new Date();

        if (timeFilter === 'Today') {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (timeFilter === 'This Week') {
          // This Week = 7 days ago to yesterday (excluding today)
          endDate = new Date();
          endDate.setDate(endDate.getDate() - 1);
          endDate.setHours(23, 59, 59, 999);
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'This Month') {
          // This Month = 30 days ago to 8 days ago (excluding last week)
          endDate = new Date();
          endDate.setDate(endDate.getDate() - 8);
          endDate.setHours(23, 59, 59, 999);
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
        }

        const { data: contactsData, error } = await supabase
          .from('inbox_contacts_with_interactions')
          .select(`
            *,
            contact_companies (
              company_id,
              is_primary,
              companies (
                company_id,
                name
              )
            ),
            contact_emails (
              email_id,
              email,
              type,
              is_primary
            ),
            contact_mobiles (
              mobile_id,
              mobile,
              type,
              is_primary
            ),
            contact_cities (
              city_id,
              cities (
                city_id,
                name
              )
            ),
            contact_tags (
              tag_id,
              tags (
                tag_id,
                name
              )
            ),
            keep_in_touch (
              frequency,
              christmas,
              easter
            )
          `)
          .gte('computed_last_interaction', startDate.toISOString())
          .lte('computed_last_interaction', endDate.toISOString())
          .order('computed_last_interaction', { ascending: false, nullsLast: true })
          .limit(100);

        if (error) throw error;

        console.log('[INBOX] Raw data from Supabase:', contactsData);
        if (contactsData && contactsData.length > 0) {
          console.log('[INBOX] First contact raw:', contactsData[0]);
          console.log('[INBOX] First contact emails:', contactsData[0].contact_emails);
          if (contactsData[0].contact_emails && contactsData[0].contact_emails.length > 0) {
            console.log('[INBOX] First email details:', contactsData[0].contact_emails[0]);
          }
        }

        // Transform data - KEEP contact_emails!
        data = (contactsData || []).map(contact => ({
          ...contact,
          companies: contact.contact_companies?.map(cc => ({
            ...cc.companies,
            company_id: cc.company_id
          })).filter(Boolean) || [],
          contact_emails: contact.contact_emails || [], // IMPORTANT: Pass through emails
          keep_in_touch_frequency: contact.keep_in_touch?.frequency || contact.keep_in_touch?.[0]?.frequency || null,
          christmas: contact.keep_in_touch?.christmas || contact.keep_in_touch?.[0]?.christmas || null,
          easter: contact.keep_in_touch?.easter || contact.keep_in_touch?.[0]?.easter || null
        }));

        console.log('[INBOX] After transform:', data);
        if (data && data.length > 0) {
          console.log('[INBOX] First contact after transform:', data[0]);
          console.log('[INBOX] First contact emails after transform:', data[0].contact_emails);
        }

      } else if (dataSource.type === 'search') {
        // Search page provides preloaded data
        data = dataSource.preloadedData || [];

      } else if (dataSource.type === 'contacts') {
        // Generic category-based fetching
        const category = dataSource.category;
        let query = supabase
          .from('contacts')
          .select(`
            *,
            contact_companies (
              company_id,
              is_primary,
              companies (
                company_id,
                name
              )
            ),
            contact_emails (
              email_id,
              email,
              type,
              is_primary
            ),
            contact_mobiles (
              mobile_id,
              mobile,
              type,
              is_primary
            ),
            contact_cities (
              city_id,
              cities (
                city_id,
                name
              )
            ),
            contact_tags (
              tag_id,
              tags (
                tag_id,
                name
              )
            ),
            keep_in_touch (
              frequency,
              christmas,
              easter
            )
          `);

        if (category) {
          query = query.eq('category', category);
        }

        const { data: contactsData, error } = await query
          .order('last_interaction_at', { ascending: false, nullsLast: true })
          .limit(100);

        if (error) throw error;

        // Transform data
        data = (contactsData || []).map(contact => ({
          ...contact,
          companies: contact.contact_companies?.map(cc => ({
            ...cc.companies,
            company_id: cc.company_id
          })).filter(Boolean) || [],
          contact_emails: contact.contact_emails || [], // Keep emails!
          keep_in_touch_frequency: contact.keep_in_touch?.frequency || contact.keep_in_touch?.[0]?.frequency || null,
          christmas: contact.keep_in_touch?.christmas || contact.keep_in_touch?.[0]?.christmas || null,
          easter: contact.keep_in_touch?.easter || contact.keep_in_touch?.[0]?.easter || null
        }));
      }

      setContacts(data);
      if (onDataLoad) onDataLoad(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dataSource or refreshTrigger changes
  useEffect(() => {
    fetchData();
  }, [dataSource, refreshTrigger]);

  // Update data when external onContactUpdate is called
  const handleContactUpdate = async () => {
    await fetchData();
    if (onContactUpdate) onContactUpdate();
  };

  // Keep in Touch helper functions
  const formatDaysUntilNext = (daysUntilNext, contact = null) => {
    if (daysUntilNext === null || daysUntilNext === undefined) {
      // Check if this is a birthday contact
      if (contact?.days_until_birthday !== undefined) {
        return formatBirthdayCountdown(contact.days_until_birthday, contact);
      }
      return '';
    }

    const days = parseInt(daysUntilNext);
    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    } else if (days === 0) {
      return 'Due today';
    } else {
      return `Due in ${days} days`;
    }
  };

  const formatBirthdayCountdown = (daysUntilBirthday, contact = null) => {
    const days = parseInt(daysUntilBirthday);
    const ageInfo = contact?.turning_age ? ` (turning ${contact.turning_age})` : '';

    if (days === 0) {
      return `🎉 Birthday today${ageInfo}!`;
    } else if (days === 1) {
      return `🎂 Birthday tomorrow${ageInfo}!`;
    } else if (days <= 7) {
      return `🎈 Birthday in ${days} days${ageInfo}`;
    } else if (days <= 30) {
      return `🎁 Birthday in ${days} days${ageInfo}`;
    } else {
      return `🎂 Birthday in ${days} days${ageInfo}`;
    }
  };

  const getUrgencyColor = (daysUntilNext, theme, contact = null) => {
    // Handle birthday coloring
    if (contact?.days_until_birthday !== undefined) {
      const days = parseInt(contact.days_until_birthday);
      if (days === 0) {
        return '#EF4444'; // Red for birthday today
      } else if (days <= 7) {
        return '#F59E0B'; // Amber for birthday this week
      } else {
        return '#10B981'; // Green for birthday coming up
      }
    }

    if (daysUntilNext === null || daysUntilNext === undefined) return theme === 'light' ? '#6B7280' : '#9CA3AF';

    const days = parseInt(daysUntilNext);
    if (days < 0) {
      return '#EF4444'; // Red for overdue
    } else if (days <= 7) {
      return '#F59E0B'; // Amber for due soon
    } else {
      return '#10B981'; // Green for coming up
    }
  };

  const formatFrequency = (frequency) => {
    if (!frequency) return '';
    return frequency.replace(/([A-Z])/g, ' $1').trim();
  };

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [associatedData, setAssociatedData] = useState({});
  const [selectedItems, setSelectedItems] = useState({
    deleteInteractions: true,
    deleteEmails: true,
    deleteEmailParticipants: true,
    deleteEmailThreads: true,
    deleteTags: true,
    deleteCities: true,
    deleteCompanies: true,
    deleteNotes: true,
    deleteAttachments: true,
    deleteContactEmails: true,
    deleteContactMobiles: true,
    deleteChat: true,
    deleteContactChats: true,
    deleteDeals: true,
    deleteMeetings: true,
    deleteInvestments: true,
    deleteKit: true,
    addToSpam: true,
    addMobileToSpam: true
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Keep in Touch frequency modal state
  const [frequencyModalOpen, setFrequencyModalOpen] = useState(false);
  const [contactForFrequency, setContactForFrequency] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState('');

  // Birthday edit modal state
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [contactForBirthday, setContactForBirthday] = useState(null);
  const [selectedBirthday, setSelectedBirthday] = useState('');

  // Communication modal state (for interactions page)
  const [communicationModalOpen, setCommunicationModalOpen] = useState(false);
  const [contactForCommunication, setContactForCommunication] = useState(null);

  // Keep in touch data input modal state (for interactions page)
  const [keepInTouchModalOpen, setKeepInTouchModalOpen] = useState(false);
  const [contactForKeepInTouch, setContactForKeepInTouch] = useState(null);
  const [keepInTouchData, setKeepInTouchData] = useState({}); // Store loaded keep_in_touch data for status checks
  const [keepInTouchFormData, setKeepInTouchFormData] = useState({
    frequency: '',
    birthday: '',
    birthdayDay: '',
    birthdayMonth: '',
    ageEstimate: '',
    christmasWishes: '',
    easterWishes: ''
  });

  // Quick Edit Modal - use the custom hook
  const quickEditModal = useQuickEditModal(handleContactUpdate);

  // Destructure for backward compatibility
  const {
    quickEditContactModalOpen,
    contactForQuickEdit,
    showMissingFieldsOnly,
    quickEditActiveTab,
    setQuickEditActiveTab,
    quickEditDescriptionText,
    setQuickEditDescriptionText,
    quickEditJobRoleText,
    setQuickEditJobRoleText,
    quickEditContactCategory,
    setQuickEditContactCategory,
    quickEditContactScore,
    setQuickEditContactScore,
    quickEditFirstName,
    setQuickEditFirstName,
    quickEditLastName,
    setQuickEditLastName,
    quickEditLinkedin,
    setQuickEditLinkedin,
    quickEditKeepInTouchFrequency,
    setQuickEditKeepInTouchFrequency,
    quickEditBirthdayDay,
    setQuickEditBirthdayDay,
    quickEditBirthdayMonth,
    setQuickEditBirthdayMonth,
    quickEditAgeEstimate,
    setQuickEditAgeEstimate,
    quickEditChristmasWishes,
    setQuickEditChristmasWishes,
    quickEditEasterWishes,
    setQuickEditEasterWishes,
    quickEditContactEmails,
    setQuickEditContactEmails,
    quickEditContactMobiles,
    setQuickEditContactMobiles,
    newEmailText,
    setNewEmailText,
    newEmailType,
    setNewEmailType,
    newMobileText,
    setNewMobileText,
    newMobileType,
    setNewMobileType,
    quickEditContactCities,
    setQuickEditContactCities,
    quickEditContactTags,
    setQuickEditContactTags,
    quickEditCityModalOpen,
    setQuickEditCityModalOpen,
    quickEditTagModalOpen,
    setQuickEditTagModalOpen,
    quickEditAssociateCompanyModalOpen,
    setQuickEditAssociateCompanyModalOpen,
    quickEditContactCompanies,
    setQuickEditContactCompanies,
    // Handlers
    openModal: handleOpenQuickEditContactModal,
    closeModal,
    handleSaveQuickEditContact,
    handleAddEmail,
    handleRemoveEmail,
    handleUpdateEmailType,
    handleSetEmailPrimary,
    handleAddMobile,
    handleRemoveMobile,
    handleUpdateMobileType,
    handleSetMobilePrimary,
    handleRemoveCity,
    handleRemoveTag,
    handleUpdateCompanyRelationship,
    handleUpdateCompanyCategory,
    handleSaveQuickEditFrequency,
    handleSaveQuickEditBirthday,
    handleSaveQuickEditChristmasWishes,
    handleSaveQuickEditEasterWishes,
    handleAutomation,
    handleQuickEditCompanyAdded,
    handleQuickEditCityAdded,
    handleQuickEditTagAdded,
  } = quickEditModal;

  // Additional state for Create Company Modal (not in hook)
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [createCompanyInitialName, setCreateCompanyInitialName] = useState('');

  // Company association modal state
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [selectedContactForCompany, setSelectedContactForCompany] = useState(null);
  // Smart company suggestions state
  const [companySuggestions, setCompanySuggestions] = useState({});

  // Powerups menu modal state
  const [powerupsMenuOpen, setPowerupsMenuOpen] = useState(false);
  const [contactForPowerups, setContactForPowerups] = useState(null);

  // Find Duplicates modal state
  const [findDuplicatesModalOpen, setFindDuplicatesModalOpen] = useState(false);
  const [contactForDuplicates, setContactForDuplicates] = useState(null);

  // Contact Enrich modal state
  const [contactEnrichModalOpen, setContactEnrichModalOpen] = useState(false);
  const [contactForEnrich, setContactForEnrich] = useState(null);

  const frequencyOptions = [
    'Weekly',
    'Monthly',
    'Quarterly',
    'Twice per Year',
    'Once per Year'
  ];

  const categoryOptions = [
    'Inbox',
    'Skip',
    'Professional Investor',
    'Team',
    'WhatsApp Group Contact',
    'Advisor',
    'Supplier',
    'Founder',
    'Manager',
    'Friend and Family',
    'Other',
    'Student',
    'Media',
    'Not Set',
    'Institution',
    'SUBSCRIBER NEWSLETTER',
    'System'
  ];

  const renderScoreStars = (score, size = 'small') => {
    const starSize = size === 'small' ? '12px' : '16px';
    const gap = size === 'small' ? '2px' : '4px';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap }}>
        {[1, 2, 3, 4, 5].map(star => (
          <FaStar
            key={star}
            style={{
              fontSize: starSize,
              color: star <= score ? '#F59E0B' : '#D1D5DB'
            }}
          />
        ))}
      </div>
    )
  };

  const handleEditContact = (contactId, e) => {
    if (e) e.stopPropagation();

    // Navigate to the new contact edit page
    navigate(`/contact/${contactId}/edit`);
  };

  const handleOpenPowerupsMenu = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForPowerups(contact);
    setPowerupsMenuOpen(true);
  };

  const handleOpenFindDuplicatesModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForDuplicates(contact);
    setFindDuplicatesModalOpen(true);
    setPowerupsMenuOpen(false); // Close powerups menu
  };

  const handleOpenContactEnrichModal = (contact, e) => {
    if (e) e.stopPropagation();
    // Check if LinkedIn URL is missing
    if (contact.linkedin) {
      toast.error('Contact already has a LinkedIn URL. Use the existing LinkedIn enrichment feature.');
      return;
    }
    setContactForEnrich(contact);
    setContactEnrichModalOpen(true);
    setPowerupsMenuOpen(false); // Close powerups menu
  };

  const handleMergeContact = (sourceContact, targetContact) => {
    // TODO: Implement contacts merging modal
    console.log('Open contacts merging modal:', sourceContact?.first_name, sourceContact?.last_name, 'with', targetContact?.first_name, targetContact?.last_name);
    toast.success('Merging functionality will be implemented in the next step');
  };

  const handleSkipContact = async (contact, e) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ category: 'Skip' })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('Contact moved to Skip');
      if (handleContactUpdate) handleContactUpdate();
    } catch (error) {
      console.error('Error skipping contact:', error);
      toast.error('Failed to skip contact');
    }
  };

  // Keep in Touch specific handlers
  const handleRemoveFromKeepInTouch = async (contact, e) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .delete()
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('Contact removed from keep in touch');
      if (handleContactUpdate) handleContactUpdate();
    } catch (error) {
      console.error('Error removing from keep in touch:', error);
      toast.error('Failed to remove from keep in touch');
    }
  };

  const handleOpenFrequencyModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForFrequency(contact);
    setSelectedFrequency(contact.keep_in_touch_frequency || 'Monthly');
    setFrequencyModalOpen(true);
  };

  const handleUpdateFrequency = async () => {
    if (!contactForFrequency || !selectedFrequency) return;

    try {
      const { error } = await supabase
        .from('keep_in_touch')
        .update({ frequency: selectedFrequency })
        .eq('contact_id', contactForFrequency.contact_id);

      if (error) throw error;

      toast.success(`Keep in touch frequency updated to ${selectedFrequency}`);
      setFrequencyModalOpen(false);
      setContactForFrequency(null);
      setSelectedFrequency('');
      if (handleContactUpdate) handleContactUpdate();
    } catch (error) {
      console.error('Error updating frequency:', error);
      toast.error('Failed to update frequency');
    }
  };

  // Handle opening birthday modal
  const handleOpenBirthdayModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForBirthday(contact);
    setSelectedBirthday(contact.birthday || '');
    setBirthdayModalOpen(true);
  };

  // Handle updating birthday
  const handleUpdateBirthday = async () => {
    if (!contactForBirthday) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ birthday: selectedBirthday || null })
        .eq('contact_id', contactForBirthday.contact_id);

      if (error) throw error;

      toast.success('Birthday updated successfully');
      setBirthdayModalOpen(false);
      setContactForBirthday(null);
      setSelectedBirthday('');
      if (handleContactUpdate) handleContactUpdate();
    } catch (error) {
      console.error('Error updating birthday:', error);
      toast.error('Failed to update birthday');
    }
  };

  // Handle opening communication modal (for interactions page)
  const handleOpenCommunicationModal = (contact, e) => {
    if (e) e.stopPropagation();
    setContactForCommunication(contact);
    setCommunicationModalOpen(true);
  };

  // Handle opening missing fields modal (completeness-focused Quick Edit)
  const handleOpenMissingFieldsModal = async (contact, e) => {
    if (e) e.stopPropagation();
    // Reuse the existing Quick Edit modal but in "missing fields" mode
    await handleOpenQuickEditContactModal(contact, e, true);
  };

  // Handle opening keep in touch data input modal (for interactions page)
  const handleOpenKeepInTouchModal = async (contact, e) => {
    if (e) e.stopPropagation();
    setContactForKeepInTouch(contact);

    // Load existing keep in touch data from keep_in_touch table
    try {
      const { data: existingKeepInTouchData, error } = await supabase
        .from('keep_in_touch')
        .select('frequency, christmas, easter')
        .eq('contact_id', contact.contact_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading keep in touch data:', error);
      }

      // Pre-populate form with existing data
      const birthdayComponents = parseBirthdayIntoComponents(contact.birthday);
      setKeepInTouchFormData({
        frequency: existingKeepInTouchData?.frequency || '',
        birthday: contact.birthday || '',
        birthdayDay: birthdayComponents.day,
        birthdayMonth: birthdayComponents.month,
        ageEstimate: birthdayComponents.ageEstimate,
        christmasWishes: existingKeepInTouchData?.christmas || '',
        easterWishes: existingKeepInTouchData?.easter || ''
      });
    } catch (error) {
      console.error('Error loading keep in touch data:', error);
      // Set default values if loading fails
      const birthdayComponents = parseBirthdayIntoComponents(contact.birthday);
      setKeepInTouchFormData({
        frequency: '',
        birthday: contact.birthday || '',
        birthdayDay: birthdayComponents.day,
        birthdayMonth: birthdayComponents.month,
        ageEstimate: birthdayComponents.ageEstimate,
        christmasWishes: '',
        easterWishes: ''
      });
    }

    setKeepInTouchModalOpen(true);
  };

  // Calculate birthday from day, month and age estimate
  const calculateBirthdayFromComponents = (day, month, ageEstimate) => {
    if (!day || !month || !ageEstimate) return '';

    const currentYear = new Date().getFullYear();
    let birthYear;

    if (ageEstimate === '80+') {
      birthYear = currentYear - 85; // Use 85 as average for 80+
    } else {
      birthYear = currentYear - parseInt(ageEstimate);
    }

    // Format as YYYY-MM-DD for database storage
    const paddedMonth = month.toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    return `${birthYear}-${paddedMonth}-${paddedDay}`;
  };

  // Parse existing birthday into components
  const parseBirthdayIntoComponents = (birthday) => {
    if (!birthday) return { day: '', month: '', ageEstimate: '' };

    try {
      const date = new Date(birthday);
      const currentYear = new Date().getFullYear();
      const birthYear = date.getFullYear();
      const age = currentYear - birthYear;

      // Find closest age estimate
      const ageOptions = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
      let closestAge = '80+';

      if (age <= 82) {
        closestAge = ageOptions.reduce((prev, curr) =>
          Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
        ).toString();
      }

      return {
        day: date.getDate().toString(),
        month: (date.getMonth() + 1).toString(),
        ageEstimate: closestAge
      };
    } catch (error) {
      console.error('Error parsing birthday:', error);
      return { day: '', month: '', ageEstimate: '' };
    }
  };

  // Get contact completeness score from database view
  const getContactCompleteness = (contact) => {
    // The completeness_score should come from the contact_completeness view
    // If it's not available, fallback to a basic calculation
    if (contact.completeness_score !== undefined) {
      return parseInt(contact.completeness_score);
    }

    // Fallback for cases where view data isn't loaded
    return 50; // Default neutral score
  };

  // Helper functions for missing fields modal - simplified approach
  const getMissingFields = (contact) => {
    if (!contact) return {
      info: [],
      contacts: [],
      work: [],
      related: [],
      keepInTouch: []
    };

    const missing = {
      info: [],
      contacts: [],
      work: [],
      related: [],
      keepInTouch: []
    };

    // Info tab missing fields - exactly match the scoring logic
    if (!contact.first_name || !contact.first_name.trim()) missing.info.push('first_name');
    if (!contact.last_name || !contact.last_name.trim()) missing.info.push('last_name');
    if (!contact.category) missing.info.push('category');
    if (!contact.score || contact.score <= 0) missing.info.push('score');
    if (!contact.description || !contact.description.trim()) missing.info.push('description');

    // Work tab fields
    if (!contact.job_role || !contact.job_role.trim()) missing.work.push('job_role');
    if (!contact.linkedin || !contact.linkedin.trim()) missing.work.push('linkedin');

    // Contacts tab - check if contact has emails/mobiles arrays
    if (!contact.contact_emails || contact.contact_emails.length === 0) missing.contacts.push('email');
    if (!contact.contact_mobiles || contact.contact_mobiles.length === 0) missing.contacts.push('mobile');

    // Work tab - check if contact has companies
    if (!contact.companies || contact.companies.length === 0) missing.work.push('company');

    // Related tab - only check if arrays are explicitly empty (not undefined/not loaded)
    // We can't assume undefined means missing since it might just not be loaded
    if (contact.contact_cities !== undefined && (!contact.contact_cities || contact.contact_cities.length === 0)) missing.related.push('cities');
    if (contact.contact_tags !== undefined && (!contact.contact_tags || contact.contact_tags.length === 0)) missing.related.push('tags');

    // Keep in Touch tab - check actual values (including birthday which is in this tab)
    if (!contact.birthday) missing.keepInTouch.push('birthday');
    if (!contact.keep_in_touch_frequency && !contact.kit_frequency) missing.keepInTouch.push('frequency');
    if (!contact.christmas) missing.keepInTouch.push('christmas');
    if (!contact.easter) missing.keepInTouch.push('easter');

    console.log('Simplified missing analysis for:', contact.first_name, contact.last_name);
    console.log('Contact arrays check:', {
      contact_emails: contact.contact_emails,
      contact_mobiles: contact.contact_mobiles,
      companies: contact.companies,
      contact_cities: contact.contact_cities,
      contact_tags: contact.contact_tags,
      birthday: contact.birthday,
      christmas: contact.christmas,
      easter: contact.easter
    });
    console.log('Missing:', missing);

    return missing;
  };

  const getVisibleTabs = (contact, forceShowMissing = null) => {
    if (!contact) return [];

    const showMissing = forceShowMissing !== null ? forceShowMissing : showMissingFieldsOnly;

    if (!showMissing) {
      // Show all tabs in normal mode
      return [
        { id: 'Info', label: 'Info', icon: FaInfoCircle },
        { id: 'Contacts', label: 'Contacts', icon: FaEnvelope },
        { id: 'Work', label: 'Work', icon: FaBriefcase },
        { id: 'Related', label: 'Related', icon: FaLink },
        { id: 'Keep in touch', label: 'Keep in touch', icon: FaHandshake }
      ];
    }

    // In missing fields mode, only show tabs that have missing fields
    const allTabs = [
      { id: 'Info', label: 'Info', icon: FaInfoCircle },
      { id: 'Contacts', label: 'Contacts', icon: FaEnvelope },
      { id: 'Work', label: 'Work', icon: FaBriefcase },
      { id: 'Related', label: 'Related', icon: FaLink },
      { id: 'Keep in touch', label: 'Keep in touch', icon: FaHandshake }
    ];

    return allTabs.filter(tab => shouldShowTab(contact, tab.id));
  };

  const shouldShowField = (contact, fieldName) => {
    if (!contact || !showMissingFieldsOnly) return true;


    // Direct field checking - show field if it's missing/empty
    switch (fieldName) {
      case 'first_name': return !contact.first_name || !contact.first_name.trim();
      case 'last_name': return !contact.last_name || !contact.last_name.trim();
      case 'category': return !contact.category || contact.category === 'Not Set';
      case 'score': return !contact.score || contact.score <= 0;
      case 'description': return !contact.description || !contact.description.trim();
      case 'job_role': return !contact.job_role || !contact.job_role.trim();
      case 'linkedin': return !contact.linkedin || !contact.linkedin.trim();
      case 'email': return contact.contact_emails !== undefined && (!contact.contact_emails || contact.contact_emails.length === 0);
      case 'mobile': return contact.contact_mobiles !== undefined && (!contact.contact_mobiles || contact.contact_mobiles.length === 0);
      case 'company': return !contact.companies || contact.companies.length === 0;
      case 'cities': return contact.contact_cities !== undefined && (!contact.contact_cities || contact.contact_cities.length === 0);
      case 'tags': return contact.contact_tags !== undefined && (!contact.contact_tags || contact.contact_tags.length === 0);
      case 'birthday': return !contact.birthday || contact.birthday === null || contact.birthday === '' || (typeof contact.birthday === 'string' && contact.birthday.trim() === '');
      case 'frequency': return !contact.keep_in_touch_frequency;
      case 'christmas': return !contact.christmas || contact.christmas === 'no wishes set';
      case 'easter': return !contact.easter || contact.easter === 'no wishes set';
      default: return false;
    }
  };

  // Check if a tab should be shown (show tab if at least one field in it should be shown)
  const shouldShowTab = (contact, tabName) => {
    if (!contact || !showMissingFieldsOnly) return true;

    const tabFields = {
      'Info': ['first_name', 'last_name', 'category', 'score', 'description'],
      'Contacts': ['email', 'mobile'],
      'Work': ['job_role', 'linkedin', 'company'],
      'Related': ['cities', 'tags'],
      'Keep in touch': ['birthday', 'frequency', 'christmas', 'easter']
    };

    const fieldsForTab = tabFields[tabName] || [];
    const showTab = fieldsForTab.some(field => shouldShowField(contact, field));


    return showTab;
  };

  // Get completeness display info (icon, color, text)
  const getCompletenessDisplay = (completenessScore) => {
    if (completenessScore >= 100) {
      return {
        icon: '⭐',
        color: '#10B981', // Green
        backgroundColor: '#10B981',
        text: 'Perfect',
        title: `${completenessScore}% Complete - Perfect!`
      };
    } else if (completenessScore > 80) {
      return {
        icon: '🟢',
        color: '#34D399', // Lighter green
        backgroundColor: '#34D399',
        text: 'Complete',
        title: `${completenessScore}% Complete - Excellent!`
      };
    } else if (completenessScore >= 60) {
      return {
        icon: '🟡',
        color: '#F59E0B', // Yellow
        backgroundColor: '#F59E0B',
        text: 'Good',
        title: `${completenessScore}% Complete - Almost there!`
      };
    } else {
      return {
        icon: '🔴',
        color: '#EF4444', // Red
        backgroundColor: '#EF4444',
        text: 'Incomplete',
        title: `${completenessScore}% Complete - Missing fields`
      };
    }
  };

  // Handle form field changes
  const handleKeepInTouchFormChange = (field, value) => {
    setKeepInTouchFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Auto-calculate birthday when any component changes
      if (['birthdayDay', 'birthdayMonth', 'ageEstimate'].includes(field)) {
        const day = field === 'birthdayDay' ? value : prev.birthdayDay;
        const month = field === 'birthdayMonth' ? value : prev.birthdayMonth;
        const age = field === 'ageEstimate' ? value : prev.ageEstimate;

        updated.birthday = calculateBirthdayFromComponents(day, month, age);
      }

      return updated;
    });
  };

  // Handle saving keep in touch data
  const handleSaveKeepInTouchData = async () => {
    if (!contactForKeepInTouch) return;

    try {
      // Update birthday in contacts table - handle empty strings properly
      const birthdayValue = keepInTouchFormData.birthday && keepInTouchFormData.birthday.trim() !== ''
                           ? keepInTouchFormData.birthday
                           : null;

      if (birthdayValue !== contactForKeepInTouch.birthday) {
        const { error: contactError } = await supabase
          .from('contacts')
          .update({ birthday: birthdayValue })
          .eq('contact_id', contactForKeepInTouch.contact_id);

        if (contactError) throw contactError;
      }

      // Check if keep_in_touch record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('keep_in_touch')
        .select('id')
        .eq('contact_id', contactForKeepInTouch.contact_id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Prepare keep in touch data - handle NULL and empty values properly
      const keepInTouchUpdateData = {
        contact_id: contactForKeepInTouch.contact_id,
        frequency: keepInTouchFormData.frequency && keepInTouchFormData.frequency.trim() !== ''
                  ? keepInTouchFormData.frequency
                  : 'Not Set',
        christmas: keepInTouchFormData.christmasWishes && keepInTouchFormData.christmasWishes.trim() !== ''
                  ? keepInTouchFormData.christmasWishes
                  : 'no wishes set',
        easter: keepInTouchFormData.easterWishes && keepInTouchFormData.easterWishes.trim() !== ''
                ? keepInTouchFormData.easterWishes
                : 'no wishes set'
      };

      let keepInTouchError;
      if (existingRecord) {
        // Update existing record
        ({ error: keepInTouchError } = await supabase
          .from('keep_in_touch')
          .update(keepInTouchUpdateData)
          .eq('contact_id', contactForKeepInTouch.contact_id));
      } else {
        // Insert new record
        ({ error: keepInTouchError } = await supabase
          .from('keep_in_touch')
          .insert(keepInTouchUpdateData));
      }

      if (keepInTouchError) throw keepInTouchError;

      toast.success('Keep in Touch data updated successfully!');
      setKeepInTouchModalOpen(false);
      setContactForKeepInTouch(null);

      // Refresh data if callback provided
      if (handleContactUpdate) {
        handleContactUpdate();
      }
    } catch (error) {
      console.error('Error updating keep in touch data:', error);
      toast.error('Failed to update keep in touch data: ' + (error.message || 'Unknown error'));
    }
  };

  // Check keep in touch data completeness status using 4 fields
  const getKeepInTouchStatus = (contact) => {
    // Check 4 fields: birthday (contacts), frequency, christmas, easter (keep_in_touch)
    const hasBirthday = !!(contact.birthday && contact.birthday !== null);
    const hasFrequency = !!(contact.keep_in_touch_frequency &&
                        contact.keep_in_touch_frequency !== 'Not Set');
    const hasChristmas = !!(contact.christmas &&
                        contact.christmas !== 'no wishes set');
    const hasEaster = !!(contact.easter &&
                     contact.easter !== 'no wishes set');


    const filledFields = [hasBirthday, hasFrequency, hasChristmas, hasEaster].filter(Boolean).length;

    // All 4 fields filled = heart
    if (filledFields === 4) {
      return 'complete';
    }
    // All filled except birthday = cake
    else if (filledFields === 3 && !hasBirthday && hasFrequency && hasChristmas && hasEaster) {
      return 'missing_birthday';
    }
    // Missing 2+ fields = sad face
    else {
      return 'incomplete';
    }
  };

  // Enhanced status check that considers christmas/easter wishes
  // This properly checks all fields including wishes from keep_in_touch table
  const getEnhancedKeepInTouchStatus = (contact, keepInTouchRecord = null) => {
    // Frequency complete: NOT NULL AND NOT "Not Set"
    const hasFrequency = contact.keep_in_touch_frequency &&
                        contact.keep_in_touch_frequency !== 'Not Set';

    // Birthday complete: NOT NULL AND NOT empty
    const hasBirthday = contact.birthday && contact.birthday.trim() !== '';

    // Christmas wishes complete: NOT NULL AND NOT "no wishes set"
    const hasChristmasWishes = keepInTouchRecord?.christmas &&
                              keepInTouchRecord.christmas !== 'no wishes set';

    // Easter wishes complete: NOT NULL AND NOT "no wishes set"
    const hasEasterWishes = keepInTouchRecord?.easter &&
                           keepInTouchRecord.easter !== 'no wishes set';

    if (!hasFrequency) {
      return 'incomplete'; // Frequency not set - sad face
    } else if (hasFrequency && !hasBirthday) {
      return 'missing_birthday'; // Frequency set but birthday missing - cake
    } else if (hasFrequency && hasBirthday && hasChristmasWishes && hasEasterWishes) {
      return 'complete'; // Everything properly filled - thumbs up
    } else {
      return 'incomplete'; // Missing wishes data - sad face
    }
  };

  // Get icon and styling based on status
  const getKeepInTouchDisplay = (contact) => {
    // Use basic status for now - could be enhanced to load keep_in_touch data for each contact
    // but that would be expensive. For now, we'll be conservative:
    // Only show 'complete' (thumbs up) if we're certain all data is present
    const status = getKeepInTouchStatus(contact);

    switch (status) {
      case 'complete':
        return {
          icon: '👍',
          backgroundColor: '#10B981',
          title: 'Keep in touch - Basic info complete (check wishes in modal)'
        };
      case 'missing_birthday':
        return {
          icon: '🎂',
          backgroundColor: '#A7F3D0',
          title: 'Keep in touch - Birthday missing'
        };
      case 'incomplete':
      default:
        return {
          icon: '😕',
          backgroundColor: '#F87171',
          title: 'Keep in touch - Incomplete'
        };
    }
  };

  // Handle communication actions
  const handleWhatsAppClick = (mobile) => {
    const cleanMobile = mobile.replace(/[^\d]/g, ''); // Remove non-digit characters
    const whatsappUrl = `https://wa.me/${cleanMobile}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailClick = (email) => {
    const mailtoUrl = `mailto:${email}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleLinkedInClick = (linkedinUrl) => {
    window.open(linkedinUrl, '_blank');
  };

  // Handle removing birthday
  const handleRemoveBirthday = async (contact, e) => {
    if (e) e.stopPropagation();

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ birthday: null })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('Birthday removed');
      if (handleContactUpdate) handleContactUpdate();
    } catch (error) {
      console.error('Error removing birthday:', error);
      toast.error('Failed to remove birthday');
    }
  };

  // Quick Edit handlers are now coming from the useQuickEditModal hook

  // Handle company click
  const handleCompanyClick = (companyId, e) => {
    if (e) e.stopPropagation();
    navigate(`/company/${companyId}`);
  };

  // Extract domain from email (skip generic providers)
  const extractBusinessDomain = (email) => {
    if (!email) return null;
    const domain = email.split('@')[1]?.toLowerCase();
    const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'me.com', 'aol.com', 'protonmail.com'];
    return genericDomains.includes(domain) ? null : domain;
  };

  // Fetch company suggestion based on email domain with sophisticated matching
  const fetchCompanySuggestion = async (contact) => {
    try {
      // Use email from contact object if available (already loaded), otherwise fetch it
      let email;

      if (contact.contact_emails && contact.contact_emails.length > 0) {
        // Email already loaded with the contact
        email = contact.contact_emails[0].email;
        console.log(`Using loaded email for ${contact.first_name}: ${email}`);
      } else {
        console.log(`No contact_emails for ${contact.first_name}, fetching from DB`);
        // Fallback: fetch from database (for cases where emails weren't included in query)
        const { data: emailData, error: emailError } = await supabase
          .from('contact_emails')
          .select('email')
          .eq('contact_id', contact.contact_id)
          .limit(1);

        if (emailError || !emailData?.length) {
          return null;
        }
        email = emailData[0].email;
      }
      const domain = extractBusinessDomain(email);

      if (!domain) return null;

      // Step 1: Try exact domain match first
      const { data: exactMatches, error: exactError } = await supabase
        .from('company_domains')
        .select(`
          domain,
          is_primary,
          companies (
            company_id,
            name,
            category,
            description,
            linkedin,
            created_at
          )
        `)
        .or(`domain.eq.${domain},domain.eq.https://${domain}/,domain.eq.http://${domain}/,domain.eq.${domain}/`);

      if (exactError) throw exactError;

      // Step 2: If multiple companies share the domain, find best match
      if (exactMatches && exactMatches.length > 0) {
        if (exactMatches.length === 1) {
          // Single match - easy case
          const companyData = exactMatches[0].companies;
          return {
            ...companyData,
            domain: exactMatches[0].domain,
            is_primary_domain: exactMatches[0].is_primary,
            suggestionType: 'existing'
          };
        } else {
          // Multiple companies share this domain - need intelligent selection
          console.log(`🤔 Found ${exactMatches.length} companies sharing domain: ${domain}`);

          // Get contact's name for similarity matching
          const contactName = `${contact.first_name} ${contact.last_name}`.toLowerCase();

          // Score each company based on various factors
          let bestMatch = null;
          let bestScore = -1;

          for (const match of exactMatches) {
            const companyData = match.companies;
            let score = 0;

            // Factor 1: Primary domain gets bonus
            if (match.is_primary) score += 10;

            // Factor 2: Company name similarity to contact name
            const companyName = companyData.name.toLowerCase();
            if (contactName.includes(companyName.split(' ')[0]) ||
                companyName.includes(contactName.split(' ')[0])) {
              score += 20;
            }

            // Factor 3: Prefer more specific/longer company names (less generic)
            score += Math.min(companyData.name.length / 5, 10);

            // Factor 4: Recent activity bonus (newer companies might be more relevant)
            const daysSinceCreation = (new Date() - new Date(companyData.created_at)) / (1000 * 60 * 60 * 24);
            if (daysSinceCreation < 365) score += 5; // Bonus for companies created in last year

            console.log(`📊 ${companyData.name}: score ${score}`);

            if (score > bestScore) {
              bestScore = score;
              bestMatch = {
                ...companyData,
                domain: match.domain,
                is_primary_domain: match.is_primary,
                suggestionType: 'existing',
                matchReason: `Best match among ${exactMatches.length} companies sharing ${domain}`
              };
            }
          }

          if (bestMatch) {
            return bestMatch;
          }
        }
      }

      // Step 3: Intelligent domain variant matching for corporate groups

      // Extract the core company name from the domain (before first dot)
      const domainParts = domain.split('.');
      const coreCompanyName = domainParts[0];

      // Only proceed if we have a meaningful company name (not generic)
      if (coreCompanyName.length > 3 && !['www', 'mail', 'email', 'app'].includes(coreCompanyName.toLowerCase())) {

        // Search for domain variants with the same core company name but different TLDs/suffixes
        const { data: variantMatches, error: variantError } = await supabase
          .from('company_domains')
          .select(`
            domain,
            is_primary,
            companies (
              company_id,
              name,
              category,
              description,
              linkedin,
              created_at
            )
          `)
          .or(`domain.ilike.${coreCompanyName}.%,domain.ilike.www.${coreCompanyName}.%,domain.ilike.%.${coreCompanyName}.%`)
          .neq('domain', domain) // Exclude exact match we already checked
          .limit(5);

        if (!variantError && variantMatches && variantMatches.length > 0) {

          // Score the matches based on domain similarity and company relevance
          let bestMatch = null;
          let bestScore = 0;

          for (const variant of variantMatches) {
            const variantCompany = variant.companies;
            let score = 0;

            // Factor 1: Exact core name match in domain gets high score
            const variantCore = variant.domain.split('.')[0].replace(/^www\./, '');
            if (variantCore.toLowerCase() === coreCompanyName.toLowerCase()) {
              score += 50;
            }

            // Factor 2: Core name appears in company name
            const companyNameLower = variantCompany.name.toLowerCase();
            if (companyNameLower.includes(coreCompanyName.toLowerCase())) {
              score += 30;
            }

            // Factor 3: Primary domain bonus
            if (variant.is_primary) {
              score += 10;
            }

            // Factor 4: Shorter, cleaner company names are preferred (less likely to be auto-generated)
            if (variantCompany.name.length < 50 && !variantCompany.name.includes('.')) {
              score += 15;
            }

            // Factor 5: Recent companies get slight bonus (more likely to be actively managed)
            const daysSinceCreation = (new Date() - new Date(variantCompany.created_at)) / (1000 * 60 * 60 * 24);
            if (daysSinceCreation < 365) {
              score += 5;
            }


            if (score > bestScore) {
              bestScore = score;
              bestMatch = {
                ...variantCompany,
                domain: variant.domain,
                is_primary_domain: variant.is_primary,
                suggestionType: 'existing',
                matchReason: `Domain variant of ${coreCompanyName} group (${variant.domain})`
              };
            }
          }

          if (bestMatch && bestScore >= 30) { // Minimum threshold for confidence
            return bestMatch;
          }
        }
      }

      // Step 4: If no match found, suggest creating new company
      const companyName = domain.split('.')[0];
      const capitalizedName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

      return {
        suggestionType: 'create',
        name: capitalizedName,
        website: domain,
        domain: domain,
        category: 'Corporate'
      };
    } catch (err) {
      console.error('Error fetching company suggestion:', err);
      return null;
    }
  };

  // Load company suggestions for contacts without companies (batched)
  useEffect(() => {
    console.log('[SUGGESTIONS] useEffect triggered, contacts length:', contacts.length);
    console.log('[SUGGESTIONS] pageContext:', pageContext);

    const loadSuggestions = async () => {
      const suggestions = {};
      const contactsWithoutCompanies = contacts.filter(contact => !contact.companies?.[0]);
      console.log('[SUGGESTIONS] Contacts without companies:', contactsWithoutCompanies.length);
      if (contactsWithoutCompanies.length > 0) {
        console.log('[SUGGESTIONS] First contact without company:', contactsWithoutCompanies[0]);
      }

      // Process suggestions for contacts without companies
      if (contactsWithoutCompanies.length > 0) {

        // Process in batches of 10 to avoid overwhelming the database
        const batchSize = 10;

        for (let i = 0; i < contactsWithoutCompanies.length; i += batchSize) {
          const batch = contactsWithoutCompanies.slice(i, i + batchSize);

          // Process batch in parallel
          const batchPromises = batch.map(async (contact) => {
            const suggestion = await fetchCompanySuggestion(contact);
            return { contactId: contact.contact_id, suggestion };
          });

          const batchResults = await Promise.all(batchPromises);

          // Add suggestions from this batch
          batchResults.forEach(({ contactId, suggestion }) => {
            if (suggestion) {
              suggestions[contactId] = suggestion;
            }
          });

          // Small delay between batches to be nice to the database
          if (i + batchSize < contactsWithoutCompanies.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        setCompanySuggestions(suggestions);
      }
    };

    if (contacts.length > 0) {
      loadSuggestions();
    }
  }, [contacts, pageContext]);

  // Handle accepting company suggestion
  const handleAcceptSuggestion = async (contact, company, e) => {
    if (e) e.stopPropagation();

    try {
      let companyIdToUse;

      if (company.suggestionType === 'create') {
        // Create new company first
        console.log(`🏢 Creating new company: ${company.name}`);
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: company.name,
            category: company.category || 'Corporate'
          })
          .select()
          .single();

        if (createError) throw createError;
        companyIdToUse = newCompany.company_id;

        // Create domain entry in company_domains table
        const { error: domainError } = await supabase
          .from('company_domains')
          .insert({
            company_id: companyIdToUse,
            domain: company.domain || company.website,
            is_primary: true
          });

        if (domainError) throw domainError;

        console.log(`✅ Created domain entry: ${company.domain || company.website} for company: ${company.name}`);
        toast.success(`Created ${company.name} company and associated with ${contact.first_name}`);
      } else {
        // Use existing company - handle different data structures
        companyIdToUse = company.company_id || company.id || company.companies?.company_id;
        toast.success(`Associated ${contact.first_name} with ${company.name}`);
      }

      // Associate contact with company
      const { error: associateError } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.contact_id,
          company_id: companyIdToUse,
          is_primary: true
        });

      if (associateError) throw associateError;

      // Remove from suggestions and refresh contacts
      setCompanySuggestions(prev => {
        const updated = { ...prev };
        delete updated[contact.contact_id];
        return updated;
      });

      if (handleContactUpdate) handleContactUpdate();
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      toast.error(company.suggestionType === 'create' ? 'Failed to create company' : 'Failed to associate company');
    }
  };

  // Handle rejecting company suggestion (opens manual modal)
  const handleRejectSuggestion = async (contact, e) => {
    if (e) e.stopPropagation();
    setContactForQuickEdit(contact);

    // Load company associations for the contact
    try {
      const { data: companiesData, error } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          relationship,
          is_primary,
          companies (
            company_id,
            name,
            category,
            description
          )
        `)
        .eq('contact_id', contact.contact_id);

      if (error) throw error;
      setQuickEditContactCompanies(companiesData || []);
    } catch (error) {
      console.error('Error loading company associations:', error);
      setQuickEditContactCompanies([]);
    }

    setQuickEditAssociateCompanyModalOpen(true);
  };

  // Handle add company click (manual)
  const handleAddCompanyClick = (contact, e) => {
    if (e) e.stopPropagation();
    setSelectedContactForCompany(contact);
    setCompanyModalOpen(true);
  };

  // Handle delete from Quick Edit modal
  const handleDeleteFromQuickEdit = (contact) => {
    closeModal(); // Use closeModal from the hook
    handleOpenDeleteModal(contact);
  };

  // Handle opening delete modal with spam functionality
  const handleOpenDeleteModal = async (contact, e) => {
    if (e) e.stopPropagation();

    const contactData = {
      ...contact,
      email: contact.emails?.[0]?.email || null,
      mobile: contact.mobiles?.[0]?.mobile || null
    };

    setContactToDelete(contactData);

    try {
      // Get counts of associated records
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
        Promise.resolve({ count: 0 }),
        Promise.resolve({ count: 0 }),
        supabase.from('interactions').select('interaction_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('emails').select('email_id', { count: 'exact', head: true }).eq('sender_contact_id', contactData.contact_id),
        supabase.from('email_participants').select('participant_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_email_threads').select('email_thread_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_tags').select('entry_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_cities').select('entry_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_companies').select('contact_companies_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('notes_contacts').select('note_contact_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('attachments').select('attachment_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_emails').select('email_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('contact_mobiles').select('mobile_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('deals_contacts').select('deals_contacts_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('meeting_contacts').select('meeting_contact_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('investments_contacts').select('investments_contacts_id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('keep_in_touch').select('id', { count: 'exact', head: true }).eq('contact_id', contactData.contact_id),
        supabase.from('interactions').select('interaction_id, interaction_type, direction, interaction_date, summary').eq('contact_id', contactData.contact_id).order('interaction_date', { ascending: false }).limit(1)
      ]);

      // Format last interaction
      let lastInteraction = null;
      if (lastInteractionResult.data && lastInteractionResult.data.length > 0) {
        const interaction = lastInteractionResult.data[0];
        const date = new Date(interaction.interaction_date).toLocaleDateString();
        lastInteraction = {
          summary: `${interaction.interaction_type} - ${interaction.summary || 'No notes'} (${date})`
        };
      }

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

    try {
      setIsDeleting(true);

      // Add email to spam list if selected
      if (selectedItems.addToSpam && contactToDelete.email) {
        const { error: spamError } = await supabase
          .from('emails_spam')
          .insert([{
            email: contactToDelete.email,
            counter: 1
          }]);

        if (spamError) {
          console.error('Error adding to spam list:', spamError);
        }
      }

      // Add mobile to WhatsApp spam list if selected
      if (selectedItems.addMobileToSpam && contactToDelete.mobile) {
        const { error: whatsappSpamError } = await supabase
          .from('whatsapp_spam')
          .insert([{
            mobile_number: contactToDelete.mobile,
            counter: 1,
            created_at: new Date().toISOString(),
            last_modified_at: new Date().toISOString()
          }]);

        if (whatsappSpamError) {
          console.error('Error adding to WhatsApp spam list:', whatsappSpamError);
        }
      }

      // Delete associated records
      const promises = [];

      if (selectedItems.deleteInteractions && associatedData.interactionsCount > 0) {
        promises.push(supabase.from('interactions').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteEmails && associatedData.emailsCount > 0) {
        promises.push(supabase.from('emails').delete().eq('sender_contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteEmailParticipants && associatedData.emailParticipantsCount > 0) {
        promises.push(supabase.from('email_participants').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteEmailThreads && associatedData.emailThreadsCount > 0) {
        promises.push(supabase.from('contact_email_threads').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteTags && associatedData.tagsCount > 0) {
        promises.push(supabase.from('contact_tags').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteCities && associatedData.citiesCount > 0) {
        promises.push(supabase.from('contact_cities').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteCompanies && associatedData.companiesCount > 0) {
        promises.push(supabase.from('contact_companies').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteNotes && associatedData.notesCount > 0) {
        promises.push(supabase.from('notes_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteAttachments && associatedData.attachmentsCount > 0) {
        promises.push(supabase.from('attachments').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteContactEmails && associatedData.contactEmailsCount > 0) {
        promises.push(supabase.from('contact_emails').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteContactMobiles && associatedData.contactMobilesCount > 0) {
        promises.push(supabase.from('contact_mobiles').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteDeals && associatedData.dealsCount > 0) {
        promises.push(supabase.from('deals_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteMeetings && associatedData.meetingsCount > 0) {
        promises.push(supabase.from('meeting_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteInvestments && associatedData.investmentsCount > 0) {
        promises.push(supabase.from('investments_contacts').delete().eq('contact_id', contactToDelete.contact_id));
      }
      if (selectedItems.deleteKit && associatedData.kitCount > 0) {
        promises.push(supabase.from('keep_in_touch').delete().eq('contact_id', contactToDelete.contact_id));
      }

      await Promise.all(promises);

      // Finally delete the main contact record
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('contact_id', contactToDelete.contact_id);

      if (error) throw error;

      toast.success('Contact and selected associated records deleted successfully');

      if (handleContactUpdate) handleContactUpdate();

      setDeleteModalOpen(false);
      setContactToDelete(null);
      setAssociatedData({});

    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContactClick = (contact) => {
    if (onContactClick) {
      onContactClick(contact);
    } else {
      navigate(`/contact/${contact.contact_id}`);
    }
  };

  const getContactPriorityScore = (contact) => {
    // Use last_interaction_at if available, otherwise fall back to created_at
    const interactionDate = contact.last_interaction_at || contact.created_at;
    if (!interactionDate) return 9999; // Very high number for contacts with no date

    const lastInteraction = new Date(interactionDate);
    const now = new Date();

    // Reset time to start of day for accurate day calculation
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const interactionDay = new Date(lastInteraction.getFullYear(), lastInteraction.getMonth(), lastInteraction.getDate());

    const daysDiff = Math.floor((today - interactionDay) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysDiff); // Ensure non-negative
  };

  const getContactPriorityLabel = (contact) => {
    // For spam contacts, show the spam counter instead of other labels
    if (contact.spam_counter !== undefined) {
      return `${contact.spam_counter}x`;
    }

    // If in Birthday filter, always show the contact category
    if (filterCategory === 'Birthday') {
      return contact.category || 'No Category';
    }

    // If badgeType is 'category', show the contact category
    if (badgeType === 'category') {
      return contact.category || 'No Category';
    }

    // Default to time-based labels
    const daysDiff = getContactPriorityScore(contact);

    if (daysDiff === 0) return 'today';
    if (daysDiff === 1) return 'yesterday';
    if (daysDiff <= 7) return 'this week';
    if (daysDiff <= 30) return 'this month';
    if (daysDiff <= 90) return 'this quarter';
    if (daysDiff <= 365) return 'this year';
    return 'ages ago';
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingText theme={theme}>Loading contacts...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <ContactsListContainer>
      {contacts.map(contact => (
        <ContactCard
          key={contact.contact_id}
          contact={contact}
          theme={theme}
          showActions={showActions}
          pageContext={pageContext}
          keepInTouchConfig={keepInTouchConfig}
          filterCategory={filterCategory}
          companySuggestions={companySuggestions}
          onContactClick={handleContactClick}
          onOpenQuickEditContactModal={handleOpenQuickEditContactModal}
          onOpenCommunicationModal={handleOpenCommunicationModal}
          onOpenMissingFieldsModal={handleOpenMissingFieldsModal}
          onOpenPowerupsMenu={handleOpenPowerupsMenu}
          onOpenFrequencyModal={handleOpenFrequencyModal}
          onOpenBirthdayModal={handleOpenBirthdayModal}
          onRemoveFromKeepInTouch={handleRemoveFromKeepInTouch}
          onRemoveBirthday={handleRemoveBirthday}
          onCompanyClick={handleCompanyClick}
          onAcceptSuggestion={handleAcceptSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
          onAddCompanyClick={handleAddCompanyClick}
          getContactPriorityScore={getContactPriorityScore}
          getContactPriorityLabel={getContactPriorityLabel}
          getContactCompleteness={getContactCompleteness}
          getCompletenessDisplay={getCompletenessDisplay}
          formatFrequency={formatFrequency}
          formatDaysUntilNext={formatDaysUntilNext}
          getUrgencyColor={getUrgencyColor}
          renderScoreStars={renderScoreStars}
        />
      ))}

      {/* Delete Modal */}
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
            maxHeight: '80vh',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
            borderRadius: '12px',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
            overflow: 'auto',
            zIndex: 9999
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9998
          }
        }}
      >
        {contactToDelete && (
          <>
            <ModalHeader>
              <h2>Delete Contact</h2>
              <CloseButton
                theme={theme}
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                <FiX />
              </CloseButton>
            </ModalHeader>

            <ModalContent theme={theme}>
              <ContactSummary>
                <strong>{contactToDelete.first_name} {contactToDelete.last_name}</strong>
                {contactToDelete.email && <div>Email: {contactToDelete.email}</div>}
                {contactToDelete.mobile && <div>Mobile: {contactToDelete.mobile}</div>}
                {associatedData.lastInteraction && (
                  <div style={{ marginTop: '8px', fontSize: '14px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    Last interaction: {associatedData.lastInteraction.summary}
                  </div>
                )}
              </ContactSummary>

              <WarningText>
                ⚠️ This action cannot be undone. Select which associated data to delete:
              </WarningText>

              <CheckboxContainer>
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
                  {associatedData.tagsCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteTags"
                        name="deleteTags"
                        checked={selectedItems.deleteTags}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteTags">Tags ({associatedData.tagsCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.companiesCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteCompanies"
                        name="deleteCompanies"
                        checked={selectedItems.deleteCompanies}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteCompanies">Companies ({associatedData.companiesCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.notesCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteNotes"
                        name="deleteNotes"
                        checked={selectedItems.deleteNotes}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteNotes">Notes ({associatedData.notesCount})</label>
                    </CheckboxItem>
                  )}
                  {associatedData.kitCount > 0 && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="deleteKit"
                        name="deleteKit"
                        checked={selectedItems.deleteKit}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="deleteKit">Keep In Touch ({associatedData.kitCount})</label>
                    </CheckboxItem>
                  )}

                  {contactToDelete.email && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="addToSpam"
                        name="addToSpam"
                        checked={selectedItems.addToSpam}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="addToSpam">Add email to spam list</label>
                    </CheckboxItem>
                  )}

                  {contactToDelete.mobile && (
                    <CheckboxItem>
                      <Checkbox
                        type="checkbox"
                        id="addMobileToSpam"
                        name="addMobileToSpam"
                        checked={selectedItems.addMobileToSpam}
                        onChange={handleCheckboxChange}
                        disabled={isDeleting}
                      />
                      <label htmlFor="addMobileToSpam">Add mobile to WhatsApp spam list</label>
                    </CheckboxItem>
                  )}
                </CheckboxGroup>
              </CheckboxContainer>

              <ButtonGroup>
                <CancelButton
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </CancelButton>
                <DeleteButton
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Contact'}
                </DeleteButton>
              </ButtonGroup>
            </ModalContent>
          </>
        )}
      </Modal>

      {/* Frequency Modal */}
      <Modal
        isOpen={frequencyModalOpen}
        onRequestClose={() => setFrequencyModalOpen(false)}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          },
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
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            maxWidth: '400px',
            width: '90%'
          }
        }}
      >
        <FrequencyModalContent theme={theme}>
          <FrequencyModalHeader theme={theme}>
            <h3>Change Keep in Touch Frequency</h3>
            <FrequencyModalCloseButton
              theme={theme}
              onClick={() => setFrequencyModalOpen(false)}
            >
              <FiX />
            </FrequencyModalCloseButton>
          </FrequencyModalHeader>

          <FrequencyModalBody>
            <ContactNameDisplay theme={theme}>
              {contactForFrequency?.first_name} {contactForFrequency?.last_name}
            </ContactNameDisplay>

            <FrequencyOptionsContainer>
              {frequencyOptions.map(frequency => (
                <FrequencyOption
                  key={frequency}
                  theme={theme}
                  $selected={selectedFrequency === frequency}
                  onClick={() => setSelectedFrequency(frequency)}
                >
                  {frequency}
                </FrequencyOption>
              ))}
            </FrequencyOptionsContainer>

            <ButtonGroup>
              <CancelButton
                theme={theme}
                onClick={() => setFrequencyModalOpen(false)}
              >
                Cancel
              </CancelButton>
              <UpdateFrequencyButton
                theme={theme}
                onClick={handleUpdateFrequency}
                disabled={!selectedFrequency}
              >
                Update Frequency
              </UpdateFrequencyButton>
            </ButtonGroup>
          </FrequencyModalBody>
        </FrequencyModalContent>
      </Modal>

      {/* Birthday Modal */}
      <Modal
        isOpen={birthdayModalOpen}
        onRequestClose={() => setBirthdayModalOpen(false)}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
          },
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
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            maxWidth: '400px',
            width: '90%'
          }
        }}
      >
        <FrequencyModalContent theme={theme}>
          <FrequencyModalHeader theme={theme}>
            <h3>Edit Birthday</h3>
            <FrequencyModalCloseButton
              theme={theme}
              onClick={() => setBirthdayModalOpen(false)}
            >
              <FiX />
            </FrequencyModalCloseButton>
          </FrequencyModalHeader>

          <FrequencyModalBody>
            <ContactNameDisplay theme={theme}>
              {contactForBirthday?.first_name} {contactForBirthday?.last_name}
            </ContactNameDisplay>

            <BirthdayInputContainer>
              <BirthdayLabel theme={theme}>Birthday</BirthdayLabel>
              <BirthdayInput
                type="date"
                theme={theme}
                value={selectedBirthday}
                onChange={(e) => setSelectedBirthday(e.target.value)}
              />
            </BirthdayInputContainer>

            <ButtonGroup>
              <CancelButton
                theme={theme}
                onClick={() => setBirthdayModalOpen(false)}
              >
                Cancel
              </CancelButton>
              <UpdateFrequencyButton
                theme={theme}
                onClick={handleUpdateBirthday}
              >
                Update Birthday
              </UpdateFrequencyButton>
            </ButtonGroup>
          </FrequencyModalBody>
        </FrequencyModalContent>
      </Modal>

      {/* Communication Modal (for interactions page) */}
      <Modal
        isOpen={communicationModalOpen}
        onRequestClose={() => setCommunicationModalOpen(false)}
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
            border: 'none',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            background: 'transparent'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <FrequencyModalContent theme={theme}>
          <FrequencyModalHeader theme={theme}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Contact {contactForCommunication?.first_name} {contactForCommunication?.last_name}</h3>
            <FrequencyModalCloseButton
              onClick={() => setCommunicationModalOpen(false)}
              theme={theme}
            >
              <FiX />
            </FrequencyModalCloseButton>
          </FrequencyModalHeader>
          <FrequencyModalBody>
            {/* Mobile Numbers */}
            {contactForCommunication?.contact_mobiles?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>📱 Mobile Numbers</h4>
                {contactForCommunication.contact_mobiles.map((mobileObj, index) => (
                  <FrequencyOption
                    key={index}
                    theme={theme}
                    onClick={() => handleWhatsAppClick(mobileObj.mobile)}
                    style={{ cursor: 'pointer', marginBottom: '8px' }}
                  >
                    <FaPhone style={{ marginRight: '8px' }} />
                    {mobileObj.mobile}
                    {mobileObj.is_primary && <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>(Primary)</span>}
                  </FrequencyOption>
                ))}
              </div>
            )}

            {/* Email Addresses */}
            {contactForCommunication?.contact_emails?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>📧 Email Addresses</h4>
                {contactForCommunication.contact_emails.map((emailObj, index) => (
                  <FrequencyOption
                    key={index}
                    theme={theme}
                    onClick={() => handleEmailClick(emailObj.email)}
                    style={{ cursor: 'pointer', marginBottom: '8px' }}
                  >
                    <FaEnvelope style={{ marginRight: '8px' }} />
                    {emailObj.email}
                    {emailObj.is_primary && <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>(Primary)</span>}
                  </FrequencyOption>
                ))}
              </div>
            )}

            {/* LinkedIn */}
            {contactForCommunication?.linkedin && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>🔗 LinkedIn</h4>
                <FrequencyOption
                  theme={theme}
                  onClick={() => handleLinkedInClick(contactForCommunication.linkedin)}
                  style={{ cursor: 'pointer', marginBottom: '8px' }}
                >
                  <FaBuilding style={{ marginRight: '8px' }} />
                  View LinkedIn Profile
                </FrequencyOption>
              </div>
            )}

            {/* No contact info available */}
            {(!contactForCommunication?.contact_mobiles?.length &&
              !contactForCommunication?.contact_emails?.length &&
              !contactForCommunication?.linkedin) && (
              <div style={{ textAlign: 'center', padding: '20px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                No contact information available for this contact.
              </div>
            )}
          </FrequencyModalBody>
        </FrequencyModalContent>
      </Modal>

      {/* Keep in Touch Data Input Modal (for interactions page) */}
      <Modal
        isOpen={keepInTouchModalOpen}
        onRequestClose={() => setKeepInTouchModalOpen(false)}
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
            border: 'none',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            background: 'transparent'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <FrequencyModalContent theme={theme}>
          <FrequencyModalHeader theme={theme}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Keep in Touch Settings</h3>
            <FrequencyModalCloseButton
              onClick={() => setKeepInTouchModalOpen(false)}
              theme={theme}
            >
              <FiX />
            </FrequencyModalCloseButton>
          </FrequencyModalHeader>
          <FrequencyModalBody>
            <div style={{ padding: '20px' }}>

              {/* Keep in Touch Frequency */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  <FaHeart style={{ marginRight: '6px' }} />
                  Keep in Touch Frequency
                </label>
                <select
                  value={keepInTouchFormData.frequency}
                  onChange={(e) => handleKeepInTouchFormChange('frequency', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select frequency...</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Twice per Year">Twice per Year</option>
                  <option value="Once per Year">Once per Year</option>
                  <option value="Do not keep in touch">Do not keep in touch</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: theme === 'light' ? '#111827' : '#F9FAFB'
                  }}>
                    <FaCalendarAlt style={{ marginRight: '6px' }} />
                    Date of Birth
                  </label>
                  <button
                    onClick={async () => {
                      try {
                        // Clear birthday in database
                        const { error } = await supabase
                          .from('contacts')
                          .update({ birthday: null })
                          .eq('contact_id', contactForKeepInTouch.contact_id);

                        if (error) throw error;

                        // Clear form fields
                        setKeepInTouchFormData(prev => ({
                          ...prev,
                          birthday: '',
                          birthdayDay: '',
                          birthdayMonth: '',
                          ageEstimate: ''
                        }));

                        toast.success('Birthday cleared successfully!');
                      } catch (error) {
                        console.error('Error clearing birthday:', error);
                        toast.error('Failed to clear birthday');
                      }
                    }}
                    style={{
                      padding: '4px 6px',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: theme === 'light' ? '#EF4444' : '#DC2626',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: '500'
                    }}
                    title="Clear birthday"
                  >
                    <FiX size={14} />
                  </button>
                </div>

                {/* Day and Month dropdowns in same row */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <select
                    value={keepInTouchFormData.birthdayDay}
                    onChange={(e) => handleKeepInTouchFormChange('birthdayDay', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      borderRadius: '6px',
                      backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                      color: theme === 'light' ? '#111827' : '#F9FAFB',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Day</option>
                    {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>

                  <select
                    value={keepInTouchFormData.birthdayMonth}
                    onChange={(e) => handleKeepInTouchFormChange('birthdayMonth', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      borderRadius: '6px',
                      backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                      color: theme === 'light' ? '#111827' : '#F9FAFB',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Month</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>

                {/* Age estimate dropdown */}
                <select
                  value={keepInTouchFormData.ageEstimate}
                  onChange={(e) => handleKeepInTouchFormChange('ageEstimate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Age estimate (for birthday calculation)</option>
                  <option value="20">20</option>
                  <option value="25">25</option>
                  <option value="30">30</option>
                  <option value="35">35</option>
                  <option value="40">40</option>
                  <option value="45">45</option>
                  <option value="50">50</option>
                  <option value="55">55</option>
                  <option value="60">60</option>
                  <option value="65">65</option>
                  <option value="70">70</option>
                  <option value="75">75</option>
                  <option value="80">80</option>
                  <option value="80+">80+</option>
                </select>
              </div>

              {/* Christmas Wishes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  🎄 Christmas Wishes
                </label>
                <select
                  value={keepInTouchFormData.christmasWishes}
                  onChange={(e) => handleKeepInTouchFormChange('christmasWishes', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Christmas wishes...</option>
                  <option value="no wishes set">Not set</option>
                  <option value="no wishes">No wishes</option>
                  <option value="whatsapp standard">WhatsApp standard</option>
                  <option value="email standard">Email standard</option>
                  <option value="email custom">Email custom</option>
                  <option value="whatsapp custom">WhatsApp custom</option>
                  <option value="call">Call</option>
                  <option value="present">Present</option>
                </select>
              </div>

              {/* Easter Wishes */}
              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  🐰 Easter Wishes
                </label>
                <select
                  value={keepInTouchFormData.easterWishes}
                  onChange={(e) => handleKeepInTouchFormChange('easterWishes', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Easter wishes...</option>
                  <option value="no wishes set">Not set</option>
                  <option value="no wishes">No wishes</option>
                  <option value="whatsapp standard">WhatsApp standard</option>
                  <option value="email standard">Email standard</option>
                  <option value="email custom">Email custom</option>
                  <option value="whatsapp custom">WhatsApp custom</option>
                  <option value="call">Call</option>
                  <option value="present">Present</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setKeepInTouchModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKeepInTouchData}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </FrequencyModalBody>
        </FrequencyModalContent>
      </Modal>

      {/* Quick Edit Contact Modal */}
      <QuickEditModal
        isOpen={quickEditContactModalOpen}
        onClose={closeModal}
        contact={contactForQuickEdit}
        theme={theme}
        showMissingFieldsOnly={showMissingFieldsOnly}
        // State props
        quickEditActiveTab={quickEditActiveTab}
        setQuickEditActiveTab={setQuickEditActiveTab}
        quickEditDescriptionText={quickEditDescriptionText}
        setQuickEditDescriptionText={setQuickEditDescriptionText}
        quickEditJobRoleText={quickEditJobRoleText}
        setQuickEditJobRoleText={setQuickEditJobRoleText}
        quickEditContactCategory={quickEditContactCategory}
        setQuickEditContactCategory={setQuickEditContactCategory}
        quickEditContactScore={quickEditContactScore}
        setQuickEditContactScore={setQuickEditContactScore}
        quickEditFirstName={quickEditFirstName}
        setQuickEditFirstName={setQuickEditFirstName}
        quickEditLastName={quickEditLastName}
        setQuickEditLastName={setQuickEditLastName}
        quickEditLinkedin={quickEditLinkedin}
        setQuickEditLinkedin={setQuickEditLinkedin}
        quickEditKeepInTouchFrequency={quickEditKeepInTouchFrequency}
        setQuickEditKeepInTouchFrequency={setQuickEditKeepInTouchFrequency}
        quickEditBirthdayDay={quickEditBirthdayDay}
        setQuickEditBirthdayDay={setQuickEditBirthdayDay}
        quickEditBirthdayMonth={quickEditBirthdayMonth}
        setQuickEditBirthdayMonth={setQuickEditBirthdayMonth}
        quickEditAgeEstimate={quickEditAgeEstimate}
        setQuickEditAgeEstimate={setQuickEditAgeEstimate}
        quickEditChristmasWishes={quickEditChristmasWishes}
        setQuickEditChristmasWishes={setQuickEditChristmasWishes}
        quickEditEasterWishes={quickEditEasterWishes}
        setQuickEditEasterWishes={setQuickEditEasterWishes}
        quickEditContactEmails={quickEditContactEmails}
        setQuickEditContactEmails={setQuickEditContactEmails}
        quickEditContactMobiles={quickEditContactMobiles}
        setQuickEditContactMobiles={setQuickEditContactMobiles}
        quickEditContactCities={quickEditContactCities}
        setQuickEditContactCities={setQuickEditContactCities}
        quickEditContactTags={quickEditContactTags}
        setQuickEditContactTags={setQuickEditContactTags}
        quickEditContactCompanies={quickEditContactCompanies}
        setQuickEditContactCompanies={setQuickEditContactCompanies}
        newEmailText={newEmailText}
        setNewEmailText={setNewEmailText}
        newEmailType={newEmailType}
        setNewEmailType={setNewEmailType}
        newMobileText={newMobileText}
        setNewMobileText={setNewMobileText}
        newMobileType={newMobileType}
        setNewMobileType={setNewMobileType}
        // Modal controls
        quickEditCityModalOpen={quickEditCityModalOpen}
        setQuickEditCityModalOpen={setQuickEditCityModalOpen}
        quickEditTagModalOpen={quickEditTagModalOpen}
        setQuickEditTagModalOpen={setQuickEditTagModalOpen}
        quickEditAssociateCompanyModalOpen={quickEditAssociateCompanyModalOpen}
        setQuickEditAssociateCompanyModalOpen={setQuickEditAssociateCompanyModalOpen}
        // Handler functions
        onSave={handleSaveQuickEditContact}
        onDelete={handleDeleteFromQuickEdit}
        handleAddEmail={handleAddEmail}
        handleRemoveEmail={handleRemoveEmail}
        handleUpdateEmailType={handleUpdateEmailType}
        handleSetEmailPrimary={handleSetEmailPrimary}
        handleAddMobile={handleAddMobile}
        handleRemoveMobile={handleRemoveMobile}
        handleUpdateMobileType={handleUpdateMobileType}
        handleSetMobilePrimary={handleSetMobilePrimary}
        handleRemoveCity={handleRemoveCity}
        handleRemoveTag={handleRemoveTag}
        handleUpdateCompanyRelationship={handleUpdateCompanyRelationship}
        handleUpdateCompanyCategory={handleUpdateCompanyCategory}
        handleSaveQuickEditFrequency={handleSaveQuickEditFrequency}
        handleSaveQuickEditBirthday={handleSaveQuickEditBirthday}
        handleSaveQuickEditChristmasWishes={handleSaveQuickEditChristmasWishes}
        handleSaveQuickEditEasterWishes={handleSaveQuickEditEasterWishes}
        handleAutomation={handleAutomation}
        // Helper functions
        getVisibleTabs={getVisibleTabs}
        shouldShowField={shouldShowField}
        categoryOptions={categoryOptions}
      />

      {/* Quick Edit Associate Company Modal */}
      <Modal
        isOpen={quickEditAssociateCompanyModalOpen}
        onRequestClose={() => setQuickEditAssociateCompanyModalOpen(false)}
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
            maxWidth: '500px',
            width: '90%',
            background: 'transparent'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1100
          }
        }}
      >
        <QuickEditAssociateCompanyModal
          theme={theme}
          contact={contactForQuickEdit}
          contactCompanies={quickEditContactCompanies}
          onCompanyAdded={handleQuickEditCompanyAdded}
          onCompanyRemoved={handleQuickEditCompanyAdded}
          onClose={() => setQuickEditAssociateCompanyModalOpen(false)}
          onCreateCompany={(companyName) => {
            setCreateCompanyInitialName(companyName);
            setShowCreateCompanyModal(true);
            setQuickEditAssociateCompanyModalOpen(false);
          }}
        />
      </Modal>

      {/* Create Company Modal */}
      {showCreateCompanyModal && (
        <CreateCompanyModal
          isOpen={showCreateCompanyModal}
          onRequestClose={() => {
            setShowCreateCompanyModal(false);
            setCreateCompanyInitialName('');
          }}
          initialName={createCompanyInitialName}
          contactId={contactForQuickEdit?.contact_id}
          contactEmail={contactForQuickEdit?.emails?.[0]?.email || contactForQuickEdit?.email}
          theme={theme}
          isNewCrm={true}
          onCompanyCreated={(companyData) => {
            // Refresh the company list by calling the same handler
            handleQuickEditCompanyAdded();
            setShowCreateCompanyModal(false);
            setCreateCompanyInitialName('');
            toast.success(`Company "${companyData.company.name}" created and associated successfully`);
          }}
        />
      )}

      {/* Quick Edit City Modal */}
      <Modal
        isOpen={quickEditCityModalOpen}
        onRequestClose={() => setQuickEditCityModalOpen(false)}
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <CityManagementModal
          theme={theme}
          contact={contactForQuickEdit}
          contactCities={quickEditContactCities}
          onCityAdded={handleQuickEditCityAdded}
          onCityRemoved={handleQuickEditCityAdded}
          onClose={() => setQuickEditCityModalOpen(false)}
        />
      </Modal>

      {/* Quick Edit Tag Modal */}
      <Modal
        isOpen={quickEditTagModalOpen}
        onRequestClose={() => setQuickEditTagModalOpen(false)}
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <TagManagementModal
          theme={theme}
          contact={contactForQuickEdit}
          contactTags={quickEditContactTags}
          onTagAdded={handleQuickEditTagAdded}
          onTagRemoved={handleQuickEditTagAdded}
          onClose={() => setQuickEditTagModalOpen(false)}
        />
      </Modal>

      {!loading && contacts.length === 0 && (
        <EmptyState>
          <EmptyIcon>{emptyStateConfig.icon}</EmptyIcon>
          <EmptyTitle theme={theme}>{emptyStateConfig.title}</EmptyTitle>
          <EmptyText theme={theme}>{emptyStateConfig.text}</EmptyText>
        </EmptyState>
      )}

      {/* Company Association Modal */}
      <Modal
        isOpen={companyModalOpen}
        onRequestClose={() => {
          setCompanyModalOpen(false);
          setSelectedContactForCompany(null);
        }}
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
            border: 'none',
            borderRadius: '12px',
            backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
            width: '600px',
            maxWidth: '90vw',
            height: '500px',
            overflow: 'hidden'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        {selectedContactForCompany && (
          <CompanyAssociationModal
            theme={theme}
            contact={selectedContactForCompany}
            onClose={() => {
              setCompanyModalOpen(false);
              setSelectedContactForCompany(null);
            }}
            onCompanyAdded={() => {
              if (handleContactUpdate) handleContactUpdate();
              setCompanyModalOpen(false);
              setSelectedContactForCompany(null);
            }}
          />
        )}
      </Modal>

      {/* Contacts Powerups Menu Modal */}
      <Modal
        isOpen={powerupsMenuOpen}
        onRequestClose={() => setPowerupsMenuOpen(false)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            background: theme === 'light' ? '#FFFFFF' : '#1F2937',
            border: theme === 'light' ? '1px solid #E5E7EB' : '1px solid #374151',
            borderRadius: '12px',
            padding: '0',
            width: '320px',
            maxWidth: '90%'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
          }
        }}
        contentLabel="Contact Power-ups"
      >
        <PowerupsMenuContainer theme={theme}>
          <PowerupsMenuHeader theme={theme}>
            <PowerupsMenuTitle theme={theme}>
              ⚡ Contact Power-ups
            </PowerupsMenuTitle>
            <PowerupsMenuCloseButton
              theme={theme}
              onClick={() => setPowerupsMenuOpen(false)}
            >
              <FiX />
            </PowerupsMenuCloseButton>
          </PowerupsMenuHeader>

          <PowerupsMenuContent>
            <PowerupsMenuItem
              theme={theme}
              onClick={() => {
                setPowerupsMenuOpen(false);
                handleOpenQuickEditContactModal(contactForPowerups);
              }}
            >
              <PowerupsMenuIcon>
                <FaEdit />
              </PowerupsMenuIcon>
              <PowerupsMenuText theme={theme}>
                <PowerupsMenuItemTitle theme={theme}>Edit Contact</PowerupsMenuItemTitle>
                <PowerupsMenuItemSubtitle theme={theme}>Quick edit contact details</PowerupsMenuItemSubtitle>
              </PowerupsMenuText>
            </PowerupsMenuItem>

            <PowerupsMenuItem
              theme={theme}
              onClick={() => {
                handleOpenFindDuplicatesModal(contactForPowerups);
              }}
            >
              <PowerupsMenuIcon>
                <FiSearch />
              </PowerupsMenuIcon>
              <PowerupsMenuText theme={theme}>
                <PowerupsMenuItemTitle theme={theme}>Merge Contacts</PowerupsMenuItemTitle>
                <PowerupsMenuItemSubtitle theme={theme}>Search & merge duplicate contacts</PowerupsMenuItemSubtitle>
              </PowerupsMenuText>
            </PowerupsMenuItem>

            <PowerupsMenuItem
              theme={theme}
              onClick={() => {
                handleOpenContactEnrichModal(contactForPowerups);
              }}
            >
              <PowerupsMenuIcon>
                <FaBriefcase />
              </PowerupsMenuIcon>
              <PowerupsMenuText theme={theme}>
                <PowerupsMenuItemTitle theme={theme}>Enrich Contact</PowerupsMenuItemTitle>
                <PowerupsMenuItemSubtitle theme={theme}>Add LinkedIn & company data</PowerupsMenuItemSubtitle>
              </PowerupsMenuText>
            </PowerupsMenuItem>
          </PowerupsMenuContent>
        </PowerupsMenuContainer>
      </Modal>

      {/* Find Duplicates Modal */}
      <FindDuplicatesModal
        isOpen={findDuplicatesModalOpen}
        onClose={() => {
          setFindDuplicatesModalOpen(false);
          setContactForDuplicates(null);
        }}
        contact={contactForDuplicates}
        theme={theme}
        onMergeContact={handleMergeContact}
      />

      {/* Contact Enrich Modal */}
      <ContactEnrichModal
        isOpen={contactEnrichModalOpen}
        onClose={() => {
          setContactEnrichModalOpen(false);
          setContactForEnrich(null);
        }}
        contact={contactForEnrich}
        theme={theme}
        onEnrichComplete={() => {
          setContactEnrichModalOpen(false);
          setContactForEnrich(null);
          // Refresh data if needed
          if (handleContactUpdate) {
            handleContactUpdate();
          }
        }}
      />
    </ContactsListContainer>
  );
};

// Company Association Modal Component
const CompanyAssociationModal = ({ theme, contact, onClose, onCompanyAdded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch company suggestions
  const fetchCompanySuggestions = async (search) => {
    try {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('Error fetching company suggestions:', err);
      toast.error('Failed to search companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchCompanySuggestions(searchTerm);
        setShowSuggestions(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleAddCompany = async (company) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.contact_id,
          company_id: company.company_id || company.id,
          is_primary: true
        });

      if (error) throw error;
      toast.success(`Added ${company.name} to ${contact.first_name} ${contact.last_name}`);
      onCompanyAdded();
    } catch (err) {
      console.error('Error adding company:', err);
      toast.error('Failed to associate company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '24px',
      color: theme === 'light' ? '#111827' : '#F9FAFB',
      height: '500px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '500' }}>
          Add Company for {contact.first_name} {contact.last_name}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
            padding: '5px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '500',
          fontSize: '14px'
        }}>
          Search Companies
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type company name..."
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `2px solid ${theme === 'light' ? '#10B981' : '#065F46'}`,
            borderRadius: '8px',
            fontSize: '16px',
            background: theme === 'light' ? '#FFFFFF' : '#374151',
            color: theme === 'light' ? '#111827' : '#F9FAFB',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{
        background: theme === 'light' ? '#F9FAFB' : '#374151',
        border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}`,
        borderRadius: '8px',
        height: '250px',
        overflowY: 'auto',
        flex: 1
        }}>
        {!showSuggestions ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: theme === 'light' ? '#6B7280' : '#9CA3AF'
          }}>
            {searchTerm.length === 0 ? 'Start typing to search companies...' : 'Type at least 2 characters...'}
          </div>
        ) : loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Searching...
          </div>
        ) : suggestions.length > 0 ? (
          suggestions.map((company) => (
            <button
              key={company.company_id || company.id}
              onClick={() => handleAddCompany(company)}
              style={{
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}`,
                color: theme === 'light' ? '#111827' : '#F9FAFB',
                fontSize: '14px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = theme === 'light' ? '#F3F4F6' : '#4B5563';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
              }}
            >
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                {company.name}
              </div>
              {company.category && (
                <div style={{
                  fontSize: '12px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}>
                  {company.category}
                </div>
              )}
            </button>
          ))
        ) : (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: theme === 'light' ? '#6B7280' : '#9CA3AF'
          }}>
            No companies found. Try a different search term.
          </div>
        )}
      </div>

      <div style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
        textAlign: 'center'
      }}>
        <p style={{
          margin: '0 0 16px 0',
          color: theme === 'light' ? '#6B7280' : '#9CA3AF',
          fontSize: '14px'
        }}>
          Can't find the company? You can create a new one from the contact detail page.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            background: theme === 'light' ? '#F3F4F6' : '#374151',
            border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            color: theme === 'light' ? '#374151' : '#D1D5DB',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Styled Components
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
`;

const LoadingText = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ContactsListContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const EmptyText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
  margin: 0;
`;

// Modal Components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalContent = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  line-height: 1.5;
`;

const ContactSummary = styled.div`
  background: ${props => props.theme === 'light' ? '#F8FAFC' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#E2E8F0' : '#E2E8F0'};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;

  div {
    margin: 4px 0;
    font-size: 14px;
    color: ${props => props.theme === 'light' ? '#1F2937' : '#1F2937'};
  }
`;

const WarningText = styled.div`
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#F59E0B'};
  color: ${props => props.theme === 'light' ? '#92400E' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#F59E0B' : '#D97706'};
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
`;

const CheckboxContainer = styled.div`
  margin: 20px 0;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#FFFFFF'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#E5E7EB'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#F3F4F6'};
    border-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#D1D5DB'};
  }

  label {
    font-size: 14px;
    color: ${props => props.theme === 'light' ? '#374151' : '#374151'};
    cursor: pointer;
    flex: 1;
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const CancelButton = styled.button`
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  background: #EF4444;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #DC2626;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Keep in Touch specific styled components for actions and modal
const FrequencyModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
`;

const FrequencyModalHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    font-size: 18px;
    font-weight: 600;
  }
`;

const FrequencyModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  }
`;

const FrequencyModalBody = styled.div`
  padding: 20px;
`;

const ContactNameDisplay = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
`;

const FrequencyOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
`;

const FrequencyOption = styled.button`
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#F9FAFB' : '#374151')
  };
  color: ${props => props.$selected
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#111827' : '#F9FAFB')
  };
  border: 1px solid ${props => props.$selected
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
  };
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  text-align: left;

  &:hover {
    background: ${props => props.$selected
      ? (props.theme === 'light' ? '#2563EB' : '#3B82F6')
      : (props.theme === 'light' ? '#F3F4F6' : '#4B5563')
    };
  }
`;

const UpdateFrequencyButton = styled.button`
  background: #10B981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BirthdayInputContainer = styled.div`
  margin-bottom: 20px;
`;

const BirthdayLabel = styled.label`
  display: block;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const BirthdayInput = styled.input`
  width: 100%;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    ring: 2px solid ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }

  &::-webkit-calendar-picker-indicator {
    filter: ${props => props.theme === 'light' ? 'none' : 'invert(1)'};
  }
`;

const InfoIconButton = styled.button`
  width: 100%;
  height: 100%;
  background: #F3F4F6;
  border: none;
  border-radius: 50%;
  color: #6B7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: #E5E7EB;
    color: #374151;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Quick Edit Associate Company Modal Component
const QuickEditAssociateCompanyModal = ({ theme, contact, contactCompanies, onCompanyAdded, onCompanyRemoved, onClose, onCreateCompany }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [removingCompany, setRemovingCompany] = useState(null);
  const [emailDomains, setEmailDomains] = useState([]);
  const [similarCompanies, setSimilarCompanies] = useState([]);

  // Calculate similarity percentage between two strings using Levenshtein distance
  const calculateSimilarity = (str1, str2) => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    const distance = matrix[len1][len2];
    return ((maxLen - distance) / maxLen) * 100;
  };

  // Fetch similar companies based on domain suggestions
  const fetchSimilarCompanies = async (domainSuggestions) => {
    if (!domainSuggestions || domainSuggestions.length === 0) {
      setSimilarCompanies([]);
      return;
    }

    try {
      // Get all companies from database
      const { data: allCompanies, error } = await supabase
        .from('companies')
        .select('company_id, name, category')
        .limit(500); // Limit to prevent performance issues

      if (error) throw error;

      const similarMatches = [];

      for (const domainSuggestion of domainSuggestions) {
        for (const company of allCompanies || []) {
          const domainLower = domainSuggestion.toLowerCase();
          const companyLower = company.name.toLowerCase();

          // Debug specific case
          if (companyLower.includes('exceptional')) {
            console.log(`🔍 Processing company: "${company.name}" for domain: "${domainSuggestion}"`);
          }

          // Calculate similarity in multiple ways to catch edge cases
          const directSimilarity = calculateSimilarity(domainLower, companyLower);

          // Also try without spaces/punctuation for better matching
          const domainClean = domainLower.replace(/[^a-z0-9]/g, '');
          const companyClean = companyLower.replace(/[^a-z0-9]/g, '');
          const cleanSimilarity = calculateSimilarity(domainClean, companyClean);

          // Try language-aware matching (arte = art, etc.)
          const domainNormalized = domainClean.replace(/arte$/, 'art').replace(/art$/, 'art');
          const companyNormalized = companyClean.replace(/arte$/, 'art').replace(/art$/, 'art');
          const normalizedSimilarity = calculateSimilarity(domainNormalized, companyNormalized);

          // Check if domain is a prefix/substring of company name (high priority match)
          let substringScore = 0;
          if (companyClean.startsWith(domainClean) || domainClean.startsWith(companyClean)) {
            // Perfect prefix match gets 95% score
            substringScore = 95;
            if (companyLower.includes('exceptional')) {
              console.log(`🎯 PREFIX MATCH: "${domainClean}" and "${companyClean}" - score: 95`);
            }
          } else if (companyClean.includes(domainClean) || domainClean.includes(companyClean)) {
            // Substring match gets 85% score
            substringScore = 85;
            if (companyLower.includes('exceptional')) {
              console.log(`🎯 SUBSTRING MATCH: "${domainClean}" and "${companyClean}" - score: 85`);
            }
          }

          // Use the highest similarity score from all methods
          const similarity = Math.max(directSimilarity, cleanSimilarity, normalizedSimilarity, substringScore);

          // Debug logging only for matches above threshold
          if (similarity >= 70 && (domainLower.includes('exceptional') || companyLower.includes('exceptional'))) {
            console.log(`✅ MATCH: "${domainLower}" vs "${companyLower}":`, {
              direct: directSimilarity,
              clean: cleanSimilarity,
              normalized: normalizedSimilarity,
              substring: substringScore,
              final: similarity
            });
          }

          if (similarity >= 70) {
            // Check if company is already in the contact's associations
            const isAlreadyAssociated = contactCompanies.some(
              relation => relation.companies?.company_id === company.company_id
            );

            if (!isAlreadyAssociated) {
              similarMatches.push({
                ...company,
                similarity: Math.round(similarity),
                originalDomain: domainSuggestion
              });
            }
          }
        }
      }

      // Sort by similarity percentage (highest first) and remove duplicates
      const uniqueMatches = similarMatches
        .filter((company, index, self) =>
          self.findIndex(c => c.company_id === company.company_id) === index
        )
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5); // Limit to top 5 matches

      setSimilarCompanies(uniqueMatches);
      console.log(`🔍 Fuzzy matching results for domains [${domainSuggestions}]:`, uniqueMatches);
    } catch (err) {
      console.error('Error fetching similar companies:', err);
      setSimilarCompanies([]);
    }
  };

  // Fetch email domains from contact emails
  const fetchEmailDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_emails')
        .select('email')
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      if (!data || data.length === 0) {
        setEmailDomains([]);
        return;
      }

      // Extract domains from emails and remove duplicates
      const domains = data
        .map(item => {
          const email = item.email;
          if (!email || !email.includes('@')) return null;
          const domain = email.substring(email.indexOf('@') + 1);
          // Convert domain to potential company name (capitalize first letter)
          const companyName = domain.split('.')[0];
          return companyName.charAt(0).toUpperCase() + companyName.slice(1);
        })
        .filter(domain => domain && domain.length > 1) // Filter out null and single character domains
        .filter((domain, index, self) => self.indexOf(domain) === index); // Remove duplicates

      setEmailDomains(domains);

      // Fetch similar companies based on domain suggestions
      await fetchSimilarCompanies(domains);
    } catch (err) {
      console.error('Error fetching email domains:', err);
      setEmailDomains([]);
      setSimilarCompanies([]);
    }
  };

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

  // Fetch email domains when modal opens
  useEffect(() => {
    if (contact) {
      fetchEmailDomains();
    }
  }, [contact]);

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

      onCompanyAdded();
      setSearchTerm('');
      setShowSuggestions(false);
      toast.success('Company association added successfully');
    } catch (err) {
      console.error('Error adding company:', err);
      toast.error('Failed to add company association');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCompany = async (companyRelation) => {
    try {
      setRemovingCompany(companyRelation.contact_companies_id);

      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_companies_id', companyRelation.contact_companies_id);

      if (error) throw error;

      onCompanyRemoved();
      toast.success('Company association removed successfully');
    } catch (err) {
      console.error('Error removing company:', err);
      toast.error('Failed to remove company association');
    } finally {
      setRemovingCompany(null);
    }
  };

  return (
    <QuickEditCompanyModalContainer theme={theme}>
      <QuickEditCompanyModalHeader theme={theme}>
        <QuickEditCompanyModalTitle theme={theme}>Manage Company Associations</QuickEditCompanyModalTitle>
        <QuickEditCompanyModalCloseButton theme={theme} onClick={onClose}>
          ×
        </QuickEditCompanyModalCloseButton>
      </QuickEditCompanyModalHeader>

      <QuickEditCompanyModalContent theme={theme}>
        {/* Associated Companies Section */}
        <QuickEditCompanyModalSection>
          <QuickEditCompanyModalSectionTitle theme={theme}>Current Associations</QuickEditCompanyModalSectionTitle>
          {contactCompanies.length === 0 ? (
            <QuickEditCompanyEmptyMessage theme={theme}>
              No companies associated with this contact
            </QuickEditCompanyEmptyMessage>
          ) : (
            <QuickEditCompanyList>
              {contactCompanies.map((companyRelation) => (
                <QuickEditCompanyTag key={companyRelation.contact_companies_id} theme={theme}>
                  <QuickEditCompanyTagContent>
                    <QuickEditCompanyTagName theme={theme}>
                      {companyRelation.companies?.name || 'Unknown Company'}
                      {companyRelation.is_primary && (
                        <QuickEditPrimaryBadge theme={theme}>Primary</QuickEditPrimaryBadge>
                      )}
                    </QuickEditCompanyTagName>

                    {/* Relationship Type */}
                    <QuickEditCompanyTagDetails theme={theme}>
                      Relationship: {companyRelation.relationship ?
                        companyRelation.relationship.charAt(0).toUpperCase() + companyRelation.relationship.slice(1).replace('_', ' ')
                        : 'Not Set'}
                    </QuickEditCompanyTagDetails>

                    {companyRelation.companies?.category && (
                      <QuickEditCompanyTagDetails theme={theme}>
                        Category: {companyRelation.companies.category}
                      </QuickEditCompanyTagDetails>
                    )}
                  </QuickEditCompanyTagContent>
                  <QuickEditCompanyRemoveButton
                    theme={theme}
                    onClick={() => handleRemoveCompany(companyRelation)}
                    disabled={removingCompany === companyRelation.contact_companies_id}
                  >
                    {removingCompany === companyRelation.contact_companies_id ? '...' : '×'}
                  </QuickEditCompanyRemoveButton>
                </QuickEditCompanyTag>
              ))}
            </QuickEditCompanyList>
          )}
        </QuickEditCompanyModalSection>

        {/* Add Companies Section */}
        <QuickEditCompanyModalSection>
          <QuickEditCompanyModalSectionTitle theme={theme}>Add Company</QuickEditCompanyModalSectionTitle>
          <QuickEditCompanySearchContainer>
            <QuickEditCompanySearchInput
              theme={theme}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a company by name..."
            />
          </QuickEditCompanySearchContainer>

          {/* Email Domain Suggestions */}
          {emailDomains.length > 0 && searchTerm.length < 3 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{
                fontSize: '12px',
                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Suggestions from contact's email:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {emailDomains.map((domain, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchTerm(domain)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      borderRadius: '4px',
                      backgroundColor: theme === 'light' ? '#F9FAFB' : '#374151',
                      color: theme === 'light' ? '#374151' : '#D1D5DB',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = theme === 'light' ? '#EEF2FF' : '#4B5563';
                      e.target.style.borderColor = '#3B82F6';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = theme === 'light' ? '#F9FAFB' : '#374151';
                      e.target.style.borderColor = theme === 'light' ? '#D1D5DB' : '#4B5563';
                    }}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Similar Companies Based on Domain Matching */}
          {similarCompanies.length > 0 && searchTerm.length < 3 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                fontSize: '12px',
                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Similar companies (70%+ match):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {similarCompanies.map((company, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddCompany(company)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}`,
                      borderRadius: '6px',
                      backgroundColor: theme === 'light' ? '#FFFFFF' : '#374151',
                      color: theme === 'light' ? '#111827' : '#F9FAFB',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = theme === 'light' ? '#F3F4F6' : '#4B5563';
                      e.target.style.borderColor = theme === 'light' ? '#D1D5DB' : '#6B7280';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = theme === 'light' ? '#FFFFFF' : '#374151';
                      e.target.style.borderColor = theme === 'light' ? '#E5E7EB' : '#4B5563';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{company.name}</div>
                      <div style={{
                        fontSize: '11px',
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                        marginTop: '2px'
                      }}>
                        {company.similarity}% match with "{company.originalDomain}"
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: theme === 'light' ? '#059669' : '#10B981',
                      fontWeight: '600'
                    }}>
                      {company.similarity}%
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </QuickEditCompanyModalSection>

        {showSuggestions && (
          <QuickEditCompanySuggestionsContainer theme={theme}>
            {suggestions.length > 0
              ? suggestions.map((suggestion, index) => (
                  <QuickEditCompanySuggestionItem
                    key={suggestion.id || suggestion.company_id || `suggestion-${index}`}
                    theme={theme}
                    onClick={() => handleAddCompany(suggestion)}
                    disabled={loading}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{suggestion.name}</div>
                      {suggestion.category && (
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {suggestion.category}
                        </div>
                      )}
                    </div>
                  </QuickEditCompanySuggestionItem>
                ))
              : <div>
                  <QuickEditCompanyEmptyMessage theme={theme}>
                    No companies found matching "{searchTerm}"
                  </QuickEditCompanyEmptyMessage>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '16px',
                    paddingBottom: '16px'
                  }}>
                    <button
                      onClick={() => {
                        if (onCreateCompany) {
                          onCreateCompany(searchTerm);
                        }
                        onClose(); // Close the current modal
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: theme === 'light' ? '#3B82F6' : '#60A5FA',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = theme === 'light' ? '#2563EB' : '#3B82F6';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = theme === 'light' ? '#3B82F6' : '#60A5FA';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <FaPlus size={12} />
                      Create "{searchTerm}" as new company
                    </button>
                  </div>
                </div>
            }
          </QuickEditCompanySuggestionsContainer>
        )}
      </QuickEditCompanyModalContent>

    </QuickEditCompanyModalContainer>
  );
};

const QuickEditTabMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 90%;
  margin: 0 auto 20px auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    max-width: 95%;
    gap: 1px;
    padding: 3px;
  }

  @media (max-width: 600px) {
    max-width: fit-content;
    margin: 0 auto 20px auto;
  }

  @media (max-width: 480px) {
    flex-direction: row;
    width: fit-content;
    max-width: fit-content;
    gap: 2px;
    justify-content: center;
    margin: 0 auto 20px auto;
  }
`;

const QuickEditTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  min-width: fit-content;

  &:hover {
    background: ${props => props.$active
      ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
      : (props.theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)')
    };
  }

  .tab-text {
    display: none;
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 13px;
  }

  @media (max-width: 600px) {
    padding: 8px;
    gap: 0;

    .tab-text {
      display: none;
    }
  }

  @media (max-width: 480px) {
    width: auto;
    justify-content: center;
    padding: 8px;
    min-width: 44px; /* Ensure minimum touch target */
  }
`;

// Quick Edit Company Modal Styled Components
const QuickEditCompanyModalContainer = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const QuickEditCompanyModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const QuickEditCompanyModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const QuickEditCompanyModalCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const QuickEditCompanyModalContent = styled.div`
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
`;

const QuickEditCompanyModalSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const QuickEditCompanyModalSectionTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const QuickEditCompanyEmptyMessage = styled.div`
  text-align: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  padding: 20px;
`;

const QuickEditCompanyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const QuickEditCompanyTag = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
`;

const QuickEditCompanyTagContent = styled.div`
  flex: 1;
`;

const QuickEditCompanyTagName = styled.div`
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QuickEditPrimaryBadge = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  background: #10B981;
  color: white;
  border-radius: 10px;
  font-weight: 600;
`;

const QuickEditCompanyTagDetails = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 4px;
`;

const QuickEditCompanyRemoveButton = styled.button`
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background: #DC2626;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuickEditCompanySearchContainer = styled.div`
  position: relative;
`;

const QuickEditCompanySearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const QuickEditCompanySuggestionsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  max-height: 200px;
  overflow-y: auto;
`;

const QuickEditCompanySuggestionItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Powerups Menu Styled Components
const PowerupsMenuContainer = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
`;

const PowerupsMenuHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const PowerupsMenuTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PowerupsMenuCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
  }
`;

const PowerupsMenuContent = styled.div`
  padding: 16px;
`;

const PowerupsMenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const PowerupsMenuIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: white;
  font-size: 16px;
`;

const PowerupsMenuText = styled.div`
  flex: 1;
`;

const PowerupsMenuItemTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 4px;
`;

const PowerupsMenuItemSubtitle = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

export default ContactsListDRY;