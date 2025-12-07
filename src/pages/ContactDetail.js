import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaArrowLeft, FaEdit, FaStickyNote, FaComments, FaHandshake, FaSlack, FaTimes, FaLinkedin } from 'react-icons/fa';
import { FiAlertTriangle, FiMail, FiUser, FiCalendar, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Modal from 'react-modal';
import LinkedinSearchOpenEnrich from '../components/modals/Linkedin-Search-Open-Enrich';
import ManageContactEmailsModal from '../components/modals/ManageContactEmailsModal';
import ManageContactMobilesModal from '../components/modals/ManageContactMobilesModal';
import EmailComposerModal from '../components/modals/EmailComposerModal';
import QuickEditModal from '../components/QuickEditModalRefactored';
import { useQuickEditModal } from '../hooks/useQuickEditModal';
import { getVisibleTabs, shouldShowField } from '../helpers/contactListHelpers';

// Set Modal app element for accessibility
Modal.setAppElement('#root');

const ContactDetail = ({ theme }) => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Contacts');
  const [activeChatTab, setActiveChatTab] = useState('Timeline');
  const [activeRelatedTab, setActiveRelatedTab] = useState('Contacts');
  const [activeKeepInTouchTab, setActiveKeepInTouchTab] = useState('Next');

  // Email/Mobile selection modals
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);

  // Email management and composer modals
  const [manageEmailsModalOpen, setManageEmailsModalOpen] = useState(false);
  const [manageMobilesModalOpen, setManageMobilesModalOpen] = useState(false);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [composerToEmail, setComposerToEmail] = useState([]);

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
  // LinkedIn enrichment modal
  const [linkedinEnrichModalOpen, setLinkedinEnrichModalOpen] = useState(false);

  // Delete modal state (copied from StandaloneInteractions.js)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [associatedData, setAssociatedData] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  // Keep in touch data
  const [keepInTouchData, setKeepInTouchData] = useState(null);
  const [loadingKeepInTouchData, setLoadingKeepInTouchData] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(null);
  const [editingFrequency, setEditingFrequency] = useState(false);

  // Occurrences editing states
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [editingEaster, setEditingEaster] = useState(false);
  const [editingChristmas, setEditingChristmas] = useState(false);

  // Holiday countdown states
  const [easterCountdown, setEasterCountdown] = useState(null);
  const [christmasCountdown, setChristmasCountdown] = useState(null);
  const [loadingHolidayData, setLoadingHolidayData] = useState(false);

  // Next event state
  const [nextEvent, setNextEvent] = useState(null);
  const [loadingNextEvent, setLoadingNextEvent] = useState(false);

  // QuickEdit modal hook
  const quickEditModal = useQuickEditModal(() => {
    fetchContact();
  });

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
    quickEditShowMissing,
    setQuickEditShowMissing,
    quickEditContactEmails,
    setQuickEditContactEmails,
    quickEditContactMobiles,
    setQuickEditContactMobiles,
    quickEditContactCities,
    setQuickEditContactCities,
    quickEditContactTags,
    setQuickEditContactTags,
    quickEditContactCompanies,
    setQuickEditContactCompanies,
    newEmailText,
    setNewEmailText,
    newEmailType,
    setNewEmailType,
    newMobileText,
    setNewMobileText,
    newMobileType,
    setNewMobileType,
    quickEditCityModalOpen,
    setQuickEditCityModalOpen,
    quickEditTagModalOpen,
    setQuickEditTagModalOpen,
    quickEditAssociateCompanyModalOpen,
    setQuickEditAssociateCompanyModalOpen,
    openModal: handleOpenQuickEditModal,
    closeModal: handleCloseQuickEditModal,
    handleSaveQuickEditContact,
    handleSilentSave,
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
    handleMarkCompleteWithCategory,
  } = quickEditModal;

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
            tags (tag_id, name)
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
        tags: data.contact_tags?.map(ct => ct.tags).filter(Boolean) || [],
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

  const fetchKeepInTouchData = async () => {
    if (!contactId || !contact) return;
    setLoadingKeepInTouchData(true);
    try {
      // First try to get data from the view by matching the full name
      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
      const { data, error } = await supabase
        .from('v_keep_in_touch_complete')
        .select('*')
        .eq('full_name', fullName)
        .maybeSingle();

      if (error) throw error;
      console.log('fetchKeepInTouchData result:', data);
      setKeepInTouchData(data);
    } catch (error) {
      console.error('Error fetching keep in touch data:', error);
      // Don't show toast error as this might be normal if no keep in touch record exists
    } finally {
      setLoadingKeepInTouchData(false);
    }
  };

  const fetchLastInteraction = async () => {
    if (!contactId) return;
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('interaction_date, summary, interaction_type')
        .eq('contact_id', contactId)
        .order('interaction_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setLastInteraction(data);
    } catch (error) {
      console.error('Error fetching last interaction:', error);
      setLastInteraction(null);
    }
  };

  const updateKeepInTouchFrequency = async (newFrequency) => {
    if (!contactId) {
      console.error('No contactId available!');
      return;
    }
    console.log('Updating frequency to:', newFrequency, 'for contact:', contactId);

    try {
      // Update the contacts table directly
      const { data: updateData, error: updateError } = await supabase
        .from('contacts')
        .update({ keep_in_touch_frequency: newFrequency })
        .eq('contact_id', contactId)
        .select();

      if (updateError) throw updateError;
      console.log('Contacts table update result:', updateData);

      // Update local contact state
      setContact(prev => ({ ...prev, keep_in_touch_frequency: newFrequency }));

      // Refresh the keep in touch data
      await fetchKeepInTouchData();

      // Recalculate next event if we're on the Next tab
      if (activeKeepInTouchTab === 'Next') {
        await calculateNextEvent();
      }

      toast.success('Keep in touch frequency updated');
    } catch (error) {
      console.error('Error updating keep in touch frequency:', error);
      toast.error('Failed to update keep in touch frequency');
    }
  };

  const updateBirthday = async (newBirthday) => {
    if (!contactId) return;
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ birthday: newBirthday })
        .eq('contact_id', contactId);

      if (error) throw error;

      // Update local contact data
      setContact(prev => ({ ...prev, birthday: newBirthday }));
      toast.success('Birthday updated');
    } catch (error) {
      console.error('Error updating birthday:', error);
      toast.error('Failed to update birthday');
    }
  };

  const updateWishes = async (wishType, newWish) => {
    if (!contactId) return;
    try {
      // First check if keep_in_touch record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('keep_in_touch')
        .select('id')
        .eq('contact_id', contactId)
        .maybeSingle();

      if (checkError) throw checkError;

      const updateData = { [wishType]: newWish };

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('keep_in_touch')
          .update(updateData)
          .eq('contact_id', contactId);

        if (updateError) throw updateError;
      } else {
        // Create new record with default frequency
        const { error: insertError } = await supabase
          .from('keep_in_touch')
          .insert({
            contact_id: contactId,
            frequency: 'Not Set',
            ...updateData
          });

        if (insertError) throw insertError;
      }

      // Refresh the keep in touch data
      await fetchKeepInTouchData();
      toast.success(`${wishType === 'easter' ? 'Easter' : 'Christmas'} wishes updated`);
    } catch (error) {
      console.error(`Error updating ${wishType} wishes:`, error);
      toast.error(`Failed to update ${wishType === 'easter' ? 'Easter' : 'Christmas'} wishes`);
    }
  };

  // Birthday helper functions
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateDaysUntilBirthday = (birthday) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);

    // Set the birthday for this year
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

    // If birthday has passed this year, calculate for next year
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }

    // Calculate days until birthday
    const timeDiff = thisYearBirthday.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
  };

  const isBirthdayToday = (birthday) => {
    if (!birthday) return false;
    const today = new Date();
    const birthDate = new Date(birthday);
    return today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
  };

  const getNextAge = (birthday) => {
    const currentAge = calculateAge(birthday);
    if (currentAge === null) return null;

    const daysUntil = calculateDaysUntilBirthday(birthday);
    if (daysUntil === 0) return currentAge + 1; // It's their birthday today
    if (daysUntil === null) return null;

    return currentAge + 1;
  };

  // Holiday calculation functions - using web API for accurate Easter dates
  const [easterDates, setEasterDates] = useState({});
  const [loadingEasterDates, setLoadingEasterDates] = useState(false);

  const fetchEasterDate = async (year) => {
    if (easterDates[year]) return easterDates[year];

    setLoadingEasterDates(true);
    try {
      // Using a free API for Easter dates
      const response = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/US`);
      const holidays = await response.json();
      const easter = holidays.find(holiday => holiday.name === 'Easter Sunday');

      if (easter) {
        const easterDate = new Date(easter.date);
        setEasterDates(prev => ({ ...prev, [year]: easterDate }));
        setLoadingEasterDates(false);
        return easterDate;
      }
    } catch (error) {
      console.error('Failed to fetch Easter date:', error);
    }

    // Fallback to calculation if API fails
    setLoadingEasterDates(false);
    return calculateEasterDateFallback(year);
  };

  const calculateEasterDateFallback = (year) => {
    // Simplified Easter calculation as fallback
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
  };

  const calculateChristmasDate = (year) => {
    return new Date(year, 11, 25); // December 25th
  };

  const calculateDaysUntilHoliday = async (holidayType) => {
    const today = new Date();
    const currentYear = today.getFullYear();

    let holidayDate;
    if (holidayType === 'easter') {
      holidayDate = await fetchEasterDate(currentYear);
    } else if (holidayType === 'christmas') {
      holidayDate = calculateChristmasDate(currentYear);
    }

    // If holiday has passed this year, get next year's date
    if (holidayDate < today) {
      if (holidayType === 'easter') {
        holidayDate = await fetchEasterDate(currentYear + 1);
      } else if (holidayType === 'christmas') {
        holidayDate = calculateChristmasDate(currentYear + 1);
      }
    }

    const timeDiff = holidayDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return { days: daysDiff, date: holidayDate };
  };

  const isHolidayToday = async (holidayType) => {
    const today = new Date();
    let holidayDate;

    if (holidayType === 'easter') {
      holidayDate = await fetchEasterDate(today.getFullYear());
    } else if (holidayType === 'christmas') {
      holidayDate = calculateChristmasDate(today.getFullYear());
    }

    return today.getMonth() === holidayDate.getMonth() &&
           today.getDate() === holidayDate.getDate();
  };

  const getHolidayEmoji = (wishType, isToday = false) => {
    if (wishType === 'easter') {
      return isToday ? '🐰🥕🌸' : '🐰🥚🌷';
    } else if (wishType === 'christmas') {
      return isToday ? '🎅🎁❄️' : '🎄🎅⭐';
    }
    return '';
  };

  const fetchHolidayCountdowns = async () => {
    if (loadingHolidayData) return;
    setLoadingHolidayData(true);

    try {
      const [easter, christmas] = await Promise.all([
        calculateDaysUntilHoliday('easter'),
        calculateDaysUntilHoliday('christmas')
      ]);

      setEasterCountdown(easter);
      setChristmasCountdown(christmas);
    } catch (error) {
      console.error('Error fetching holiday countdowns:', error);
    } finally {
      setLoadingHolidayData(false);
    }
  };

  const [actualKeepInTouchFrequency, setActualKeepInTouchFrequency] = useState(null);

  const checkActualKeepInTouchFrequency = async () => {
    if (!contact?.contact_id) return null;
    try {
      const { data: keepInTouchRecord } = await supabase
        .from('keep_in_touch')
        .select('frequency')
        .eq('contact_id', contact.contact_id)
        .maybeSingle();

      const frequency = keepInTouchRecord?.frequency || null;
      console.log('Actual frequency from keep_in_touch table:', frequency);
      setActualKeepInTouchFrequency(frequency);
      return frequency;
    } catch (error) {
      console.error('Error checking actual keep_in_touch frequency:', error);
      setActualKeepInTouchFrequency(null);
      return null;
    }
  };

  const calculateNextEvent = async () => {
    if (!contact || loadingNextEvent) return;
    setLoadingNextEvent(true);

    try {
      // Ensure we have the latest actual frequency
      const currentActualFrequency = await checkActualKeepInTouchFrequency();

      const events = [];
      const today = new Date();

      // Birthday event
      if (contact.birthday) {
        const birthdayDays = calculateDaysUntilBirthday(contact.birthday);
        if (birthdayDays !== null) {
          events.push({
            type: 'birthday',
            name: 'Birthday',
            days: birthdayDays,
            emoji: '🎂',
            color: '#F59E0B',
            gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            age: birthdayDays === 0 ? getNextAge(contact.birthday) : getNextAge(contact.birthday),
            date: new Date(today.getFullYear() + (birthdayDays === 0 ? 0 : (new Date(contact.birthday).getMonth() < today.getMonth() ||
              (new Date(contact.birthday).getMonth() === today.getMonth() && new Date(contact.birthday).getDate() < today.getDate()) ? 1 : 0)),
              new Date(contact.birthday).getMonth(), new Date(contact.birthday).getDate())
          });
        }
      }

      // Touch base event - use contact.keep_in_touch_frequency directly
      if (contact.keep_in_touch_frequency === 'Do not keep in touch') {
        console.log('Adding relaxed event for "Do not keep in touch"');
        events.push({
          type: 'touchbase-relaxed',
          name: 'No Touch Base',
          days: 999, // Very high number so it doesn't show as priority
          emoji: '😌',
          color: '#059669',
          gradient: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
          frequency: 'Do not keep in touch',
          isRelaxed: true
        });
      } else if (!contact.keep_in_touch_frequency || contact.keep_in_touch_frequency === 'Not Set') {
        console.log('Adding setup event');
        events.push({
          type: 'touchbase-notset',
          name: 'Touch Base Setup',
          days: 0,
          emoji: '⚙️',
          color: '#6B7280',
          gradient: 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%)',
          frequency: 'Not Set',
          needsSetup: true
        });
      } else if (keepInTouchData?.frequency) {
        if (keepInTouchData.frequency === 'Not Set') {
          // Show frequency selector
          events.push({
            type: 'touchbase-notset',
            name: 'Touch Base Setup',
            days: 0,
            emoji: '⚙️',
            color: '#6B7280',
            gradient: 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%)',
            frequency: keepInTouchData.frequency,
            needsSetup: true
          });
        } else if (keepInTouchData.frequency === 'Do not keep in touch') {
          // Show relaxed message
          events.push({
            type: 'touchbase-relaxed',
            name: 'No Touch Base',
            days: 999, // Very high number so it doesn't show as priority
            emoji: '😌',
            color: '#059669',
            gradient: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
            frequency: keepInTouchData.frequency,
            isRelaxed: true
          });
        } else if (keepInTouchData.next_interaction_date) {
          // Normal touch base with date
          const touchBaseDate = new Date(keepInTouchData.next_interaction_date);
          const timeDiff = touchBaseDate.getTime() - today.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

          events.push({
            type: 'touchbase',
            name: 'Touch Base',
            days: daysDiff,
            emoji: '🤝',
            color: '#3B82F6',
            gradient: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
            frequency: keepInTouchData.frequency,
            date: touchBaseDate
          });
        }
      }

      // Easter event
      const easterData = await calculateDaysUntilHoliday('easter');
      if (easterData) {
        events.push({
          type: 'easter',
          name: 'Easter',
          days: easterData.days,
          emoji: '🐰',
          color: '#7C3AED',
          gradient: 'linear-gradient(135deg, #F3E8FF 0%, #DDD6FE 100%)',
          wishes: keepInTouchData?.easter || 'no wishes set',
          date: easterData.date
        });
      }

      // Christmas event
      const christmasData = await calculateDaysUntilHoliday('christmas');
      if (christmasData) {
        events.push({
          type: 'christmas',
          name: 'Christmas',
          days: christmasData.days,
          emoji: '🎄',
          color: '#DC2626',
          gradient: 'linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)',
          wishes: keepInTouchData?.christmas || 'no wishes set',
          date: christmasData.date
        });
      }

      // Find the next most important event
      // Priority: 1) Setup needed, 2) Overdue touch base, 3) Relaxed message, 4) Closest upcoming event
      let nextEvent = null;

      console.log('All events:', events.map(e => ({ type: e.type, name: e.name, days: e.days, needsSetup: e.needsSetup, isRelaxed: e.isRelaxed })));

      // First, check if touch base setup is needed (highest priority)
      const needsSetup = events.find(event => event.needsSetup);
      console.log('Setup needed event:', needsSetup);
      if (needsSetup) {
        console.log('Selecting setup event as next');
        nextEvent = { ...needsSetup, isOverdue: false };
      } else {
        // Then, check for overdue touch base
        const overdueTouch = events.find(event => event.type === 'touchbase' && event.days < 0);
        console.log('Overdue touch event:', overdueTouch);
        if (overdueTouch) {
          console.log('Selecting overdue touch as next');
          nextEvent = { ...overdueTouch, isOverdue: true };
        } else {
          // Check for relaxed event first (should have priority over other events)
          const relaxedEvent = events.find(event => event.isRelaxed);
          console.log('Relaxed event found:', relaxedEvent);
          if (relaxedEvent) {
            console.log('Selecting relaxed event as next');
            nextEvent = { ...relaxedEvent, isOverdue: false };
          } else {
            // Otherwise, find the closest upcoming event
            const activeEvents = events.filter(event => !event.isRelaxed && event.days >= 0);
            console.log('Active events:', activeEvents.map(e => ({ type: e.type, days: e.days })));
            if (activeEvents.length > 0) {
              nextEvent = activeEvents.reduce((prev, current) =>
                prev.days < current.days ? prev : current
              );
              console.log('Selecting closest upcoming event:', nextEvent.type);
              nextEvent.isOverdue = false;
            }
          }
        }
      }

      console.log('Final selected nextEvent:', nextEvent);
      setNextEvent(nextEvent);

    } catch (error) {
      console.error('Error calculating next event:', error);
    } finally {
      setLoadingNextEvent(false);
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
    } else if (activeTab === 'Keep in touch' && (activeKeepInTouchTab === 'Touch base' || activeKeepInTouchTab === 'Occurrences' || activeKeepInTouchTab === 'Next')) {
      fetchKeepInTouchData();
      checkActualKeepInTouchFrequency();
      if (activeKeepInTouchTab === 'Touch base') {
        fetchLastInteraction();
      } else if (activeKeepInTouchTab === 'Occurrences') {
        fetchHolidayCountdowns();
      } else if (activeKeepInTouchTab === 'Next') {
        calculateNextEvent();
      }
    }
  }, [contact, activeTab, activeChatTab, activeRelatedTab, activeKeepInTouchTab]);

  // Recalculate next event when keepInTouchData changes (including when it becomes null)
  useEffect(() => {
    if (activeTab === 'Keep in touch' && activeKeepInTouchTab === 'Next' && contact) {
      calculateNextEvent();
    }
  }, [keepInTouchData, actualKeepInTouchFrequency, contact, activeTab, activeKeepInTouchTab]);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleEmailClick = () => {
    if (!contact?.emails?.length) return;

    if (contact.emails.length === 1) {
      // Only one email, open composer directly
      openEmailComposer(contact.emails[0].email);
    } else {
      // Multiple emails, show selection modal
      setEmailModalOpen(true);
    }
  };

  // Open email composer with a specific email
  const openEmailComposer = (email) => {
    setComposerToEmail([{ email, name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() }]);
    setEmailComposerOpen(true);
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

  const handleTagClick = (tag) => {
    if (!tag?.tag_id || !tag?.name) return;

    navigate(`/tag/${tag.tag_id}/contacts`, {
      state: {
        tagName: tag.name,
        contactId: contact.contact_id
      }
    });
  };

  const handleCompanyClick = (company) => {
    if (!company?.companies?.company_id) return;

    navigate(`/company/${company.companies.company_id}`, {
      state: {
        activeTab: 'Related',
        activeRelatedTab: 'Contacts',
        previousContactId: contact.contact_id
      }
    });
  };

  const handleEmailSelect = (email) => {
    setEmailModalOpen(false);
    openEmailComposer(email);
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
    handleOpenQuickEditModal(contact);
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
                </ProfileName>
                <ObsidianNoteButton
                  theme={theme}
                  onClick={handleOpenObsidianNote}
                  title={`Open Obsidian note for ${contact.first_name} ${contact.last_name}`}
                >
                  <FaStickyNote />
                </ObsidianNoteButton>
              </ProfileHeader>
              {(contact.job_role || contact.companies?.length > 0) && (
                <ProfileRole theme={theme}>
                  {contact.job_role}
                  {contact.job_role && contact.companies?.length > 0 && ' at '}
                  {contact.companies?.length > 0 && contact.companies.map(company => company.name).join(', ')}
                </ProfileRole>
              )}
              {contact.description && (
                <ProfileDescription theme={theme}>{contact.description}</ProfileDescription>
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
            {['Contacts', 'Related', 'Chats', 'Keep in touch'].map(tab => (
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

          {activeTab === 'Contacts' && (
            <InfoGrid>
            {/* Email Section */}
            <InfoSection>
              <SectionTitleRow theme={theme}>
                <SectionTitle theme={theme}>Email</SectionTitle>
                <EditSectionButton theme={theme} onClick={() => setManageEmailsModalOpen(true)} title="Manage emails">
                  <FaEdit size={14} />
                </EditSectionButton>
              </SectionTitleRow>
              <InfoList>
                {contact.emails?.length > 0 ? (
                  contact.emails.map((email, idx) => (
                    <InfoItem key={`email-${idx}`} style={{ cursor: 'pointer' }} onClick={() => openEmailComposer(email.email)}>
                      <InfoItemIcon><FaEnvelope /></InfoItemIcon>
                      <InfoItemContent>
                        <InfoItemLabel theme={theme}>{email.type || 'Email'}</InfoItemLabel>
                        <InfoItemValue theme={theme}>
                          <span style={{ color: '#3B82F6' }}>{email.email}</span>
                          {email.is_primary && <PrimaryTag>Primary</PrimaryTag>}
                        </InfoItemValue>
                      </InfoItemContent>
                    </InfoItem>
                  ))
                ) : (
                  <EmptyFieldText theme={theme}>No email addresses</EmptyFieldText>
                )}
              </InfoList>
            </InfoSection>

            {/* Mobile Section */}
            <InfoSection>
              <SectionTitleRow theme={theme}>
                <SectionTitle theme={theme}>Mobile</SectionTitle>
                <EditSectionButton theme={theme} onClick={() => setManageMobilesModalOpen(true)} title="Manage mobiles">
                  <FaEdit size={14} />
                </EditSectionButton>
              </SectionTitleRow>
              <InfoList>
                {contact.mobiles?.length > 0 ? (
                  contact.mobiles.map((mobile, idx) => (
                    <InfoItem key={`mobile-${idx}`}>
                      <InfoItemIcon><FaPhone /></InfoItemIcon>
                      <InfoItemContent>
                        <InfoItemLabel theme={theme}>{mobile.type || 'Mobile'}</InfoItemLabel>
                        <InfoItemValue theme={theme}>
                          <a href={`https://wa.me/${mobile.mobile.replace(/\D/g, '')}`}>{mobile.mobile}</a>
                          {mobile.is_primary && <PrimaryTag>Primary</PrimaryTag>}
                        </InfoItemValue>
                      </InfoItemContent>
                    </InfoItem>
                  ))
                ) : (
                  <EmptyFieldText theme={theme}>No mobile numbers</EmptyFieldText>
                )}
              </InfoList>
            </InfoSection>

            {contact.linkedin && (
              <InfoSection>
                <SectionTitle theme={theme}>Social Media</SectionTitle>
                <InfoList>
                  <InfoItem>
                    <InfoItemIcon><FaLinkedin /></InfoItemIcon>
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
              {loadingRelatedData ? (
                <RelatedContainer theme={theme}>
                  <RelatedLoading theme={theme}>
                    <LoadingSpinner />
                    <span>Loading related data...</span>
                  </RelatedLoading>
                </RelatedContainer>
              ) : (
                <InfoGrid>
                      {/* Cities Section */}
                      <InfoSection>
                        <SectionTitleRow theme={theme}>
                          <SectionTitle theme={theme}>Cities</SectionTitle>
                          <EditSectionButton theme={theme} onClick={() => setCityModalOpen(true)} title="Manage cities">
                            <FaEdit size={14} />
                          </EditSectionButton>
                        </SectionTitleRow>
                        {contactCities.length === 0 ? (
                          <RelatedEmptyMessage theme={theme}>
                            No cities associated with this contact
                          </RelatedEmptyMessage>
                        ) : (
                          <RelatedGrid>
                            {contactCities.map((cityRelation, index) => (
                              <RelatedCard
                                key={index}
                                theme={theme}
                                $clickable={true}
                                onClick={() => {
                                  const cityId = cityRelation.cities?.city_id;
                                  const cityName = cityRelation.cities?.name || cityRelation.cities?.city_name || 'Unknown City';
                                  if (cityId) {
                                    navigate(`/city/${cityId}/contacts`, {
                                      state: {
                                        cityName: cityName,
                                        contactId: contact.contact_id
                                      }
                                    });
                                  }
                                }}
                              >
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
                      </InfoSection>

                      {/* Tags Section */}
                      <InfoSection>
                        <SectionTitleRow theme={theme}>
                          <SectionTitle theme={theme}>Tags</SectionTitle>
                          <EditSectionButton theme={theme} onClick={() => setTagModalOpen(true)} title="Manage tags">
                            <FaEdit size={14} />
                          </EditSectionButton>
                        </SectionTitleRow>
                        {contactTags.length === 0 ? (
                          <RelatedEmptyMessage theme={theme}>
                            No tags associated with this contact
                          </RelatedEmptyMessage>
                        ) : (
                          <TagsContainer>
                            {contactTags.map((tagRelation, index) => (
                              <TagBadge
                                key={index}
                                theme={theme}
                                $clickable={true}
                                onClick={() => handleTagClick(tagRelation.tags)}
                              >
                                {tagRelation.tags?.name || tagRelation.tags?.tag_name || 'Unknown Tag'}
                              </TagBadge>
                            ))}
                          </TagsContainer>
                        )}
                      </InfoSection>

                      {/* Companies Section */}
                      <InfoSection>
                        <SectionTitleRow theme={theme}>
                          <SectionTitle theme={theme}>Companies</SectionTitle>
                          <EditSectionButton theme={theme} onClick={() => setAssociateCompanyModalOpen(true)} title="Manage companies">
                            <FaEdit size={14} />
                          </EditSectionButton>
                        </SectionTitleRow>
                        {contactCompanies.length === 0 ? (
                          <RelatedEmptyMessage theme={theme}>
                            No companies associated with this contact
                          </RelatedEmptyMessage>
                        ) : (
                          <RelatedGrid>
                            {contactCompanies.map((companyRelation, index) => (
                              <RelatedCard
                                key={index}
                                theme={theme}
                                $clickable={true}
                                onClick={() => handleCompanyClick(companyRelation)}
                              >
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
                      </InfoSection>
                </InfoGrid>
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
                <NextEventContent theme={theme}>
                  {loadingNextEvent ? (
                    <NextEventLoadingContainer theme={theme}>
                      <TouchBaseLoader theme={theme} />
                      <LoadingText theme={theme}>Finding your next important event...</LoadingText>
                    </NextEventLoadingContainer>
                  ) : nextEvent ? (
                    <NextEventContainer theme={theme}>
                      <NextEventCard theme={theme} $eventType={nextEvent.type}>
                        <NextEventHeader theme={theme}>
                          <NextEventEmoji>{nextEvent.emoji}</NextEventEmoji>
                          <NextEventTitle theme={theme}>Next: {nextEvent.name}</NextEventTitle>
                        </NextEventHeader>

                        {nextEvent.needsSetup ? (
                          <FrequencySetupContainer theme={theme}>
                            <SetupMessage theme={theme}>
                              Set your touch base frequency to get started
                            </SetupMessage>
                            <FrequencySelector theme={theme}>
                              <FrequencySelect
                                theme={theme}
                                defaultValue="Not Set"
                                onChange={(e) => {
                                  updateKeepInTouchFrequency(e.target.value);
                                }}
                              >
                                <option value="Not Set">Select frequency...</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Twice per Year">Twice per Year</option>
                                <option value="Once per Year">Once per Year</option>
                                <option value="Do not keep in touch">Do not keep in touch</option>
                              </FrequencySelect>
                            </FrequencySelector>
                          </FrequencySetupContainer>
                        ) : nextEvent.isRelaxed ? (
                          <RelaxedContainer theme={theme}>
                            <RelaxedMessage theme={theme}>
                              😌 No need to keep in touch - you can relax!
                            </RelaxedMessage>
                            <RelaxedSubtext theme={theme}>
                              This contact is set to "Do not keep in touch"
                            </RelaxedSubtext>
                          </RelaxedContainer>
                        ) : (
                          <NextEventCountdown theme={theme}>
                            <NextEventDays theme={theme} $eventType={nextEvent.type} $isOverdue={nextEvent.isOverdue}>
                              {nextEvent.isOverdue ? Math.abs(nextEvent.days) : nextEvent.days}
                            </NextEventDays>
                            <NextEventDaysLabel theme={theme} $isOverdue={nextEvent.isOverdue}>
                              {nextEvent.isOverdue
                                ? Math.abs(nextEvent.days) === 1 ? 'day overdue' : 'days overdue'
                                : nextEvent.days === 0 ? 'TODAY!' : nextEvent.days === 1 ? 'day to go' : 'days to go'
                              }
                            </NextEventDaysLabel>
                          </NextEventCountdown>
                        )}

                        {nextEvent.date && (
                          <NextEventDate theme={theme}>
                            📅 {nextEvent.date.toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </NextEventDate>
                        )}

                        <NextEventDetails theme={theme}>
                          {nextEvent.type === 'birthday' && (
                            <NextEventDetail theme={theme}>
                              🎈 Turning {nextEvent.age} years old
                            </NextEventDetail>
                          )}
                          {nextEvent.type === 'touchbase' && (
                            <NextEventDetail theme={theme}>
                              📞 Frequency: {nextEvent.frequency}
                            </NextEventDetail>
                          )}
                          {(nextEvent.type === 'easter' || nextEvent.type === 'christmas') && nextEvent.wishes !== 'no wishes set' && (
                            <NextEventDetail theme={theme}>
                              🎯 Plan: {nextEvent.wishes}
                            </NextEventDetail>
                          )}
                        </NextEventDetails>

                        {nextEvent.isOverdue && (
                          <NextEventOverdue theme={theme}>
                            🚨 {nextEvent.name} is {Math.abs(nextEvent.days)} day{Math.abs(nextEvent.days) !== 1 ? 's' : ''} overdue - reach out now!
                          </NextEventOverdue>
                        )}
                        {!nextEvent.isOverdue && nextEvent.days === 0 && (
                          <NextEventToday theme={theme}>
                            🔥 Don't forget - it's {nextEvent.name.toLowerCase()} today!
                          </NextEventToday>
                        )}
                        {!nextEvent.isOverdue && nextEvent.days === 1 && (
                          <NextEventSoon theme={theme}>
                            ⚡ Tomorrow is {nextEvent.name.toLowerCase()} - time to prepare!
                          </NextEventSoon>
                        )}
                        {!nextEvent.isOverdue && nextEvent.days > 1 && nextEvent.days <= 7 && (
                          <NextEventThisWeek theme={theme}>
                            📌 {nextEvent.name} is this week - keep it in mind!
                          </NextEventThisWeek>
                        )}
                      </NextEventCard>

                      <EasterApiNote theme={theme}>
                        🌐 <strong>Easter dates</strong> are fetched from the internet and update annually for accuracy
                      </EasterApiNote>
                    </NextEventContainer>
                  ) : (
                    <NextEventEmpty theme={theme}>
                      <NextEventEmptyIcon>📅</NextEventEmptyIcon>
                      <NextEventEmptyText theme={theme}>
                        No upcoming events found
                      </NextEventEmptyText>
                      <NextEventEmptySubtext theme={theme}>
                        Set a birthday, configure touch base frequency, or add holiday wishes to see your next important event
                      </NextEventEmptySubtext>
                    </NextEventEmpty>
                  )}
                </NextEventContent>
              )}

              {activeKeepInTouchTab === 'Touch base' && (
                <TouchBaseContent theme={theme}>
                  {loadingKeepInTouchData ? (
                    <TouchBaseLoadingContainer theme={theme}>
                      <TouchBaseLoader theme={theme} />
                      <LoadingText theme={theme}>Loading touch base data...</LoadingText>
                    </TouchBaseLoadingContainer>
                  ) : (
                    <TouchBaseContainer theme={theme}>
                      <TouchBaseSection theme={theme}>
                        <TouchBaseSectionTitle theme={theme}>Last Interaction</TouchBaseSectionTitle>
                        <TouchBaseValue theme={theme}>
                          {lastInteraction?.interaction_date
                            ? new Date(lastInteraction.interaction_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'No interactions recorded'
                          }
                        </TouchBaseValue>
                      </TouchBaseSection>

                      <TouchBaseSection theme={theme}>
                        <TouchBaseSectionTitle theme={theme}>Keep in Touch Frequency</TouchBaseSectionTitle>
                        {editingFrequency ? (
                          <FrequencySelector theme={theme}>
                            <FrequencySelect
                              theme={theme}
                              value={contact?.keep_in_touch_frequency || 'Not Set'}
                              onChange={(e) => {
                                updateKeepInTouchFrequency(e.target.value);
                                setEditingFrequency(false);
                              }}
                            >
                              <option value="Not Set">Not Set</option>
                              <option value="Weekly">Weekly</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Quarterly">Quarterly</option>
                              <option value="Twice per Year">Twice per Year</option>
                              <option value="Once per Year">Once per Year</option>
                              <option value="Do not keep in touch">Do not keep in touch</option>
                            </FrequencySelect>
                            <FrequencyButton
                              theme={theme}
                              onClick={() => setEditingFrequency(false)}
                            >
                              Cancel
                            </FrequencyButton>
                          </FrequencySelector>
                        ) : (
                          <FrequencyDisplay theme={theme}>
                            <TouchBaseValue theme={theme}>
                              {contact?.keep_in_touch_frequency || 'Not Set'}
                            </TouchBaseValue>
                            <FrequencyButton
                              theme={theme}
                              onClick={() => setEditingFrequency(true)}
                            >
                              <FaEdit /> Edit
                            </FrequencyButton>
                          </FrequencyDisplay>
                        )}
                      </TouchBaseSection>

                      <TouchBaseSection theme={theme}>
                        <TouchBaseSectionTitle theme={theme}>Next Keep in Touch</TouchBaseSectionTitle>
                        {keepInTouchData?.next_interaction_date ? (
                          <TouchBaseNextContainer theme={theme}>
                            <TouchBaseValue theme={theme}>
                              {new Date(keepInTouchData.next_interaction_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </TouchBaseValue>
                            <TouchBaseDaysCount theme={theme} $overdue={keepInTouchData.days_until_next < 0}>
                              {keepInTouchData.days_until_next < 0
                                ? `${Math.abs(Math.floor(keepInTouchData.days_until_next))} days overdue`
                                : keepInTouchData.days_until_next === 0
                                ? 'Due today'
                                : `${Math.floor(keepInTouchData.days_until_next)} days remaining`
                              }
                            </TouchBaseDaysCount>
                          </TouchBaseNextContainer>
                        ) : (
                          <TouchBaseValue theme={theme}>
                            {contact?.keep_in_touch_frequency && contact.keep_in_touch_frequency !== 'Not Set' && contact.keep_in_touch_frequency !== 'Do not keep in touch'
                              ? 'Set frequency to calculate next touch base'
                              : contact?.keep_in_touch_frequency === 'Do not keep in touch'
                                ? 'No need to keep in touch - relax!'
                                : 'No frequency set'
                            }
                          </TouchBaseValue>
                        )}
                      </TouchBaseSection>
                    </TouchBaseContainer>
                  )}
                </TouchBaseContent>
              )}

              {activeKeepInTouchTab === 'Occurrences' && (
                <OccurrencesContent theme={theme}>
                  {loadingKeepInTouchData ? (
                    <OccurrencesLoadingContainer theme={theme}>
                      <TouchBaseLoader theme={theme} />
                      <LoadingText theme={theme}>Loading occurrences data...</LoadingText>
                    </OccurrencesLoadingContainer>
                  ) : (
                    <OccurrencesContainer theme={theme}>
                      {/* Birthday Section */}
                      <OccurrenceSection theme={theme}>
                        <OccurrenceSectionTitle theme={theme}>Date of Birth</OccurrenceSectionTitle>
                        {editingBirthday ? (
                          <BirthdayEditor theme={theme}>
                            <BirthdayInput
                              theme={theme}
                              type="date"
                              defaultValue={contact?.birthday || ''}
                              onBlur={(e) => {
                                if (e.target.value !== contact?.birthday) {
                                  updateBirthday(e.target.value || null);
                                }
                                setEditingBirthday(false);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (e.target.value !== contact?.birthday) {
                                    updateBirthday(e.target.value || null);
                                  }
                                  setEditingBirthday(false);
                                } else if (e.key === 'Escape') {
                                  setEditingBirthday(false);
                                }
                              }}
                              autoFocus
                            />
                            <OccurrenceButton
                              theme={theme}
                              onClick={() => setEditingBirthday(false)}
                            >
                              Cancel
                            </OccurrenceButton>
                          </BirthdayEditor>
                        ) : (
                          <BirthdayDisplayContainer theme={theme}>
                            <BirthdayMainInfo theme={theme}>
                              <OccurrenceValue theme={theme}>
                                {contact?.birthday
                                  ? new Date(contact.birthday).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })
                                  : 'No birthday set'
                                }
                              </OccurrenceValue>
                              <OccurrenceButton
                                theme={theme}
                                onClick={() => setEditingBirthday(true)}
                              >
                                <FaEdit /> Edit
                              </OccurrenceButton>
                            </BirthdayMainInfo>

                            {contact?.birthday && (
                              <BirthdayFunInfo theme={theme}>
                                {isBirthdayToday(contact.birthday) ? (
                                  <BirthdayTodayCard theme={theme}>
                                    🎉 <BirthdayTodayText theme={theme}>Happy Birthday!</BirthdayTodayText> 🎂
                                    <BirthdayAgeText theme={theme}>
                                      Turning {getNextAge(contact.birthday)} years old today!
                                    </BirthdayAgeText>
                                  </BirthdayTodayCard>
                                ) : (
                                  <BirthdayCountdownContainer theme={theme}>
                                    <BirthdayCountdownCard theme={theme}>
                                      <BirthdayCountdownDays theme={theme}>
                                        {calculateDaysUntilBirthday(contact.birthday)}
                                      </BirthdayCountdownDays>
                                      <BirthdayCountdownLabel theme={theme}>
                                        {calculateDaysUntilBirthday(contact.birthday) === 1 ? 'day' : 'days'} until birthday
                                      </BirthdayCountdownLabel>
                                    </BirthdayCountdownCard>

                                    <BirthdayAgeInfo theme={theme}>
                                      <BirthdayCurrentAge theme={theme}>
                                        Currently {calculateAge(contact.birthday)} years old
                                      </BirthdayCurrentAge>
                                      <BirthdayNextAge theme={theme}>
                                        Will be {getNextAge(contact.birthday)} 🎈
                                      </BirthdayNextAge>
                                    </BirthdayAgeInfo>
                                  </BirthdayCountdownContainer>
                                )}
                              </BirthdayFunInfo>
                            )}
                          </BirthdayDisplayContainer>
                        )}
                      </OccurrenceSection>

                      {/* Easter Wishes Section */}
                      <OccurrenceSection theme={theme}>
                        <OccurrenceSectionTitle theme={theme}>Easter Wishes</OccurrenceSectionTitle>
                        {editingEaster ? (
                          <WishesSelector theme={theme}>
                            <WishesSelect
                              theme={theme}
                              value={keepInTouchData?.easter || 'no wishes set'}
                              onChange={(e) => {
                                updateWishes('easter', e.target.value);
                                setEditingEaster(false);
                              }}
                            >
                              <option value="no wishes set">No wishes set</option>
                              <option value="call">Call</option>
                              <option value="email standard">Email standard</option>
                              <option value="email custom">Email custom</option>
                              <option value="whatsapp standard">WhatsApp standard</option>
                              <option value="whatsapp custom">WhatsApp custom</option>
                              <option value="present">Present</option>
                            </WishesSelect>
                            <OccurrenceButton
                              theme={theme}
                              onClick={() => setEditingEaster(false)}
                            >
                              Cancel
                            </OccurrenceButton>
                          </WishesSelector>
                        ) : (
                          <HolidayDisplayContainer theme={theme}>
                            <HolidayMainInfo theme={theme}>
                              <OccurrenceValue theme={theme}>
                                {keepInTouchData?.easter ?
                                  keepInTouchData.easter.charAt(0).toUpperCase() + keepInTouchData.easter.slice(1)
                                  : 'No wishes set'
                                }
                              </OccurrenceValue>
                              <OccurrenceButton
                                theme={theme}
                                onClick={() => setEditingEaster(true)}
                              >
                                <FaEdit /> Edit
                              </OccurrenceButton>
                            </HolidayMainInfo>

                            {easterCountdown && (
                              <HolidayFunInfo theme={theme}>
                                {easterCountdown.days === 0 ? (
                                  <HolidayTodayCard theme={theme} $holiday="easter">
                                    🐰 <HolidayTodayText theme={theme}>Happy Easter!</HolidayTodayText> 🥚
                                    <HolidayMessage theme={theme}>
                                      {keepInTouchData?.easter && keepInTouchData.easter !== 'no wishes set'
                                        ? `Time to send ${keepInTouchData.easter}! 🌸`
                                        : 'Easter wishes not set 🌷'
                                      }
                                    </HolidayMessage>
                                  </HolidayTodayCard>
                                ) : (
                                  <HolidayCountdownContainer theme={theme}>
                                    <HolidayCountdownCard theme={theme} $holiday="easter">
                                      <HolidayCountdownDays theme={theme}>
                                        {easterCountdown.days}
                                      </HolidayCountdownDays>
                                      <HolidayCountdownLabel theme={theme}>
                                        {easterCountdown.days === 1 ? 'day' : 'days'} until Easter
                                      </HolidayCountdownLabel>
                                      <HolidayEmoji>🐰🥚🌷</HolidayEmoji>
                                    </HolidayCountdownCard>

                                    <HolidayInfo theme={theme}>
                                      <HolidayDate theme={theme}>
                                        📅 {easterCountdown.date.toLocaleDateString('en-US', {
                                          weekday: 'long',
                                          month: 'long',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </HolidayDate>
                                      {keepInTouchData?.easter && keepInTouchData.easter !== 'no wishes set' && (
                                        <HolidayPlan theme={theme}>
                                          🎯 Plan: {keepInTouchData.easter}
                                        </HolidayPlan>
                                      )}
                                    </HolidayInfo>
                                  </HolidayCountdownContainer>
                                )}
                              </HolidayFunInfo>
                            )}
                          </HolidayDisplayContainer>
                        )}
                      </OccurrenceSection>

                      {/* Christmas Wishes Section */}
                      <OccurrenceSection theme={theme}>
                        <OccurrenceSectionTitle theme={theme}>Christmas Wishes</OccurrenceSectionTitle>
                        {editingChristmas ? (
                          <WishesSelector theme={theme}>
                            <WishesSelect
                              theme={theme}
                              value={keepInTouchData?.christmas || 'no wishes set'}
                              onChange={(e) => {
                                updateWishes('christmas', e.target.value);
                                setEditingChristmas(false);
                              }}
                            >
                              <option value="no wishes set">No wishes set</option>
                              <option value="call">Call</option>
                              <option value="email standard">Email standard</option>
                              <option value="email custom">Email custom</option>
                              <option value="whatsapp standard">WhatsApp standard</option>
                              <option value="whatsapp custom">WhatsApp custom</option>
                              <option value="present">Present</option>
                            </WishesSelect>
                            <OccurrenceButton
                              theme={theme}
                              onClick={() => setEditingChristmas(false)}
                            >
                              Cancel
                            </OccurrenceButton>
                          </WishesSelector>
                        ) : (
                          <HolidayDisplayContainer theme={theme}>
                            <HolidayMainInfo theme={theme}>
                              <OccurrenceValue theme={theme}>
                                {keepInTouchData?.christmas ?
                                  keepInTouchData.christmas.charAt(0).toUpperCase() + keepInTouchData.christmas.slice(1)
                                  : 'No wishes set'
                                }
                              </OccurrenceValue>
                              <OccurrenceButton
                                theme={theme}
                                onClick={() => setEditingChristmas(true)}
                              >
                                <FaEdit /> Edit
                              </OccurrenceButton>
                            </HolidayMainInfo>

                            {christmasCountdown && (
                              <HolidayFunInfo theme={theme}>
                                {christmasCountdown.days === 0 ? (
                                  <HolidayTodayCard theme={theme} $holiday="christmas">
                                    🎅 <HolidayTodayText theme={theme}>Merry Christmas!</HolidayTodayText> 🎁
                                    <HolidayMessage theme={theme}>
                                      {keepInTouchData?.christmas && keepInTouchData.christmas !== 'no wishes set'
                                        ? `Time to send ${keepInTouchData.christmas}! ❄️`
                                        : 'Christmas wishes not set 🎄'
                                      }
                                    </HolidayMessage>
                                  </HolidayTodayCard>
                                ) : (
                                  <HolidayCountdownContainer theme={theme}>
                                    <HolidayCountdownCard theme={theme} $holiday="christmas">
                                      <HolidayCountdownDays theme={theme}>
                                        {christmasCountdown.days}
                                      </HolidayCountdownDays>
                                      <HolidayCountdownLabel theme={theme}>
                                        {christmasCountdown.days === 1 ? 'day' : 'days'} until Christmas
                                      </HolidayCountdownLabel>
                                      <HolidayEmoji>🎄🎅⭐</HolidayEmoji>
                                    </HolidayCountdownCard>

                                    <HolidayInfo theme={theme}>
                                      <HolidayDate theme={theme}>
                                        📅 {christmasCountdown.date.toLocaleDateString('en-US', {
                                          weekday: 'long',
                                          month: 'long',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
                                      </HolidayDate>
                                      {keepInTouchData?.christmas && keepInTouchData.christmas !== 'no wishes set' && (
                                        <HolidayPlan theme={theme}>
                                          🎯 Plan: {keepInTouchData.christmas}
                                        </HolidayPlan>
                                      )}
                                      <ChristmasCountdownFun theme={theme}>
                                        {christmasCountdown.days <= 30 && christmasCountdown.days > 7 && "🎁 Time to start shopping!"}
                                        {christmasCountdown.days <= 7 && christmasCountdown.days > 1 && "🏃‍♂️ Last week countdown!"}
                                        {christmasCountdown.days === 1 && "🔥 Last day to prepare!"}
                                        {christmasCountdown.days > 100 && "❄️ Still a while to go..."}
                                        {christmasCountdown.days > 30 && christmasCountdown.days <= 100 && "🌟 Getting closer!"}
                                      </ChristmasCountdownFun>
                                    </HolidayInfo>
                                  </HolidayCountdownContainer>
                                )}
                              </HolidayFunInfo>
                            )}
                          </HolidayDisplayContainer>
                        )}
                      </OccurrenceSection>
                    </OccurrencesContainer>
                  )}
                </OccurrencesContent>
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

      {/* Manage Emails Modal */}
      <ManageContactEmailsModal
        isOpen={manageEmailsModalOpen}
        onClose={() => setManageEmailsModalOpen(false)}
        contact={contact}
        theme={theme}
        onEmailsUpdated={() => {
          // Refresh contact data to get updated emails
          fetchContact();
        }}
      />

      {/* Manage Mobiles Modal */}
      <ManageContactMobilesModal
        isOpen={manageMobilesModalOpen}
        onClose={() => setManageMobilesModalOpen(false)}
        contact={contact}
        theme={theme}
        onMobilesUpdated={() => {
          // Refresh contact data to get updated mobiles
          fetchContact();
        }}
      />

      {/* Email Composer Modal */}
      <EmailComposerModal
        isOpen={emailComposerOpen}
        onClose={() => setEmailComposerOpen(false)}
        theme={theme}
        initialTo={composerToEmail}
        initialSubject=""
        mode="compose"
      />

      {/* QuickEdit Modal */}
      <QuickEditModal
        isOpen={quickEditContactModalOpen}
        onClose={handleCloseQuickEditModal}
        contact={contactForQuickEdit}
        theme={theme}
        showMissingFieldsOnly={showMissingFieldsOnly}
        onRefresh={fetchContact}
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
        quickEditShowMissing={quickEditShowMissing}
        setQuickEditShowMissing={setQuickEditShowMissing}
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
        quickEditCityModalOpen={quickEditCityModalOpen}
        setQuickEditCityModalOpen={setQuickEditCityModalOpen}
        quickEditTagModalOpen={quickEditTagModalOpen}
        setQuickEditTagModalOpen={setQuickEditTagModalOpen}
        quickEditAssociateCompanyModalOpen={quickEditAssociateCompanyModalOpen}
        setQuickEditAssociateCompanyModalOpen={setQuickEditAssociateCompanyModalOpen}
        onSave={handleSaveQuickEditContact}
        onDelete={() => {}}
        handleSilentSave={handleSilentSave}
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
        handleMarkCompleteWithCategory={handleMarkCompleteWithCategory}
        getVisibleTabs={getVisibleTabs}
        shouldShowField={shouldShowField}
      />

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
          onCompanyRemoved={handleCompanyAdded} // Reuse the same handler to refresh data
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

      {/* LinkedIn Enrichment Modal */}
      <LinkedinSearchOpenEnrich
        isOpen={linkedinEnrichModalOpen}
        onClose={() => setLinkedinEnrichModalOpen(false)}
        linkedInUrl={contact?.linkedin || ''}
        contactName={contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : ''}
        jobRole={contact?.job_role || ''}
        firstName={contact?.first_name || ''}
        lastName={contact?.last_name || ''}
        email={contact?.contact_emails?.find(e => e.is_primary)?.email || ''}
        contactId={contactId}
        onSaveData={async (enrichedData) => {
          try {
            // Prepare updates for the contact
            const contactUpdates = {};

            if (enrichedData.jobRole && enrichedData.jobRole !== contact?.job_role) {
              contactUpdates.job_role = enrichedData.jobRole;
            }
            // Note: Skipping city update as contacts table may not have city column
            // if (enrichedData.city && enrichedData.city !== contact?.city) {
            //   contactUpdates.city = enrichedData.city;
            // }
            if (enrichedData.linkedin && enrichedData.linkedin !== contact?.linkedin) {
              contactUpdates.linkedin = enrichedData.linkedin;
            }

            // Update contact in database if there are changes
            if (Object.keys(contactUpdates).length > 0) {
              contactUpdates.last_modified_at = new Date().toISOString();

              const { error: contactError } = await supabase
                .from('contacts')
                .update(contactUpdates)
                .eq('contact_id', contactId);

              if (contactError) throw contactError;

              // Update local state
              setContact(prev => ({ ...prev, ...contactUpdates }));
            }

            // Handle company creation and association
            if (enrichedData.company) {
              let companyId = null;

              // Check if company already exists
              const { data: existingCompanies, error: searchError } = await supabase
                .from('companies')
                .select('company_id, name')
                .ilike('name', enrichedData.company)
                .limit(1);

              if (searchError) throw searchError;

              if (existingCompanies && existingCompanies.length > 0) {
                companyId = existingCompanies[0].company_id;
              } else {
                // Create new company
                const companyData = {
                  name: enrichedData.company,
                  created_at: new Date().toISOString()
                };

                if (enrichedData.companyWebsite) {
                  companyData.website = enrichedData.companyWebsite;
                }
                if (enrichedData.companyDescription) {
                  companyData.description = enrichedData.companyDescription;
                }

                const { data: newCompany, error: createError } = await supabase
                  .from('companies')
                  .insert(companyData)
                  .select();

                if (createError) throw createError;

                if (newCompany && newCompany.length > 0) {
                  companyId = newCompany[0].company_id;
                }
              }

              // Associate company with contact if we have a company ID
              if (companyId) {
                // Check if association already exists
                const { data: existingAssoc, error: assocError } = await supabase
                  .from('contact_companies')
                  .select('contact_company_id')
                  .eq('contact_id', contactId)
                  .eq('company_id', companyId);

                if (assocError) throw assocError;

                if (!existingAssoc || existingAssoc.length === 0) {
                  // Create new association
                  const { error: createAssocError } = await supabase
                    .from('contact_companies')
                    .insert({
                      contact_id: contactId,
                      company_id: companyId,
                      created_at: new Date().toISOString()
                    });

                  if (createAssocError) throw createAssocError;
                }
              }
            }

            // Refresh data to show updates
            await fetchContact();
            await fetchRelatedData();

            // Show success toast
            toast.success('Contact enriched successfully!');
            setLinkedinEnrichModalOpen(false);

          } catch (error) {
            console.error('Error saving enriched data:', error);
            toast.error(`Failed to save enriched data: ${error.message}`);
          }
        }}
        context={{
          refreshData: () => {
            fetchContact();
            fetchRelatedData();
          }
        }}
      />

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
  margin-bottom: 4px;
`;

const ProfileDescription = styled.div`
  color: ${props => props.theme === 'light' ? '#4B5563' : '#D1D5DB'};
  font-size: 14px;
  margin-bottom: 8px;
  font-style: italic;
  max-width: 500px;
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

const SectionTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: none;

  ${SectionTitle} {
    margin: 0;
    padding: 0;
    border: none;
    padding-bottom: 8px;
    border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
    flex: 1;
  }
`;

const EditSectionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const EmptyFieldText = styled.div`
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-size: 14px;
  font-style: italic;
  padding: 8px 0;
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
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#6B7280'};

    ${props => props.$clickable && `
      background: ${props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
      border-color: ${props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    `}
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

const TagBadge = styled.div`
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
  border: 1px solid ${props => props.theme === 'light' ? '#DBEAFE' : '#3B82F6'};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E40AF'};
    transform: ${props => props.$clickable ? 'translateY(-1px)' : 'none'};
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
      const filteredSuggestions = data.filter(tag => {
        const isAlreadyAssociated = contactTags.some(contactTag => {
          const contactTagId = contactTag.tags?.tag_id || contactTag.tags?.id || contactTag.tag_id;
          const suggestionTagId = tag.tag_id || tag.id;
          return contactTagId === suggestionTagId;
        });
        return !isAlreadyAssociated;
      });

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
  padding: 2px 4px;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  margin-left: 6px;
  min-width: 16px;
  height: 16px;

  &:hover {
    color: ${props => props.theme === 'light' ? '#DC2626' : '#F87171'};
    background: ${props => props.theme === 'light' ? '#FEE2E2' : '#374151'};
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
const AssociateCompanyModal = ({ theme, contact, contactCompanies, onCompanyAdded, onCompanyRemoved, onClose, onCreateNewCompany }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [removingCompany, setRemovingCompany] = useState(null);

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

  const handleRemoveCompany = async (companyRelation) => {
    try {
      setRemovingCompany(companyRelation.contact_companies_id);

      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_companies_id', companyRelation.contact_companies_id);

      if (error) throw error;

      onCompanyRemoved(companyRelation);
    } catch (err) {
      console.error('Error removing company:', err);
      toast.error('Failed to remove company association');
    } finally {
      setRemovingCompany(null);
    }
  };

  return (
    <CompanyModalContainer theme={theme}>
      <CompanyModalHeader theme={theme}>
        <CompanyModalTitle theme={theme}>Manage Companies</CompanyModalTitle>
        <CompanyModalCloseButton theme={theme} onClick={onClose}>
          ×
        </CompanyModalCloseButton>
      </CompanyModalHeader>

      <CompanyModalContent theme={theme}>
        {/* Associated Companies Section */}
        <CompanyModalSection>
          <CompanyModalSectionTitle theme={theme}>Associated Companies</CompanyModalSectionTitle>
          {contactCompanies.length === 0 ? (
            <CompanyEmptyMessage theme={theme}>
              No companies associated with this contact
            </CompanyEmptyMessage>
          ) : (
            <CompanyList>
              {contactCompanies.map((companyRelation) => (
                <CompanyTag key={companyRelation.contact_companies_id} theme={theme}>
                  <CompanyTagContent>
                    <CompanyTagName>
                      {companyRelation.companies?.name || 'Unknown Company'}
                      {companyRelation.is_primary && (
                        <PrimaryBadge theme={theme}>Primary</PrimaryBadge>
                      )}
                    </CompanyTagName>
                    {(companyRelation.companies?.category || companyRelation.companies?.website) && (
                      <CompanyTagDetails theme={theme}>
                        {companyRelation.companies?.category && companyRelation.companies.category}
                        {companyRelation.companies?.category && companyRelation.companies?.website && ' • '}
                        {companyRelation.companies?.website && (
                          <a
                            href={companyRelation.companies.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit' }}
                          >
                            Website
                          </a>
                        )}
                      </CompanyTagDetails>
                    )}
                  </CompanyTagContent>
                  <CompanyRemoveButton
                    theme={theme}
                    onClick={() => handleRemoveCompany(companyRelation)}
                    disabled={removingCompany === companyRelation.contact_companies_id}
                  >
                    {removingCompany === companyRelation.contact_companies_id ? '...' : '×'}
                  </CompanyRemoveButton>
                </CompanyTag>
              ))}
            </CompanyList>
          )}
        </CompanyModalSection>

        {/* Add Companies Section */}
        <CompanyModalSection>
          <CompanyModalSectionTitle theme={theme}>Add Companies</CompanyModalSectionTitle>
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
        </CompanyModalSection>

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

// Additional Company Modal Components
const CompanyModalSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CompanyModalSectionTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const CompanyEmptyMessage = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  text-align: center;
  padding: 20px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border-radius: 8px;
  border: 1px dashed ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
`;

const CompanyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CompanyTag = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 12px 16px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const CompanyTagContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CompanyTagName = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-word;
`;

const CompanyTagDetails = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.875rem;

  a {
    color: inherit;
    text-decoration: underline;

    &:hover {
      color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    }
  }
`;

const CompanyRemoveButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#FEE2E2' : '#7F1D1D'};
    color: ${props => props.theme === 'light' ? '#DC2626' : '#FCA5A5'};
  }

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

// Touch Base styled components
const TouchBaseContent = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const TouchBaseLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const TouchBaseLoader = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-top: 3px solid ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const TouchBaseContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const TouchBaseSection = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 12px;
  padding: 24px;
  box-shadow: ${props => props.theme === 'light'
    ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
    : '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
  };
`;

const TouchBaseSectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const TouchBaseValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  line-height: 1.5;
`;

const FrequencyDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const FrequencySelector = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FrequencySelect = styled.select`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 3px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }

  option {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const FrequencyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#1D4ED8'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#1E40AF'};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    background: ${props => props.theme === 'light' ? '#9CA3AF' : '#4B5563'};
    cursor: not-allowed;
    opacity: 0.7;
  }

  svg {
    font-size: 12px;
  }
`;

const TouchBaseNextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TouchBaseDaysCount = styled.div`
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-block;
  width: fit-content;

  ${props => props.$overdue
    ? `
      background: ${props.theme === 'light' ? '#FEE2E2' : '#7F1D1D'};
      color: ${props.theme === 'light' ? '#DC2626' : '#FCA5A5'};
    `
    : `
      background: ${props.theme === 'light' ? '#D1FAE5' : '#065F46'};
      color: ${props.theme === 'light' ? '#059669' : '#6EE7B7'};
    `
  }
`;

// Occurrences styled components
const OccurrencesContent = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const OccurrencesLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const OccurrencesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const OccurrenceSection = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 12px;
  padding: 24px;
  box-shadow: ${props => props.theme === 'light'
    ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
    : '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
  };
`;

const OccurrenceSectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const OccurrenceValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  line-height: 1.5;
`;

const OccurrenceDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const OccurrenceButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#1D4ED8'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#1E40AF'};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    background: ${props => props.theme === 'light' ? '#9CA3AF' : '#4B5563'};
    cursor: not-allowed;
    opacity: 0.7;
  }

  svg {
    font-size: 12px;
  }
`;

const BirthdayEditor = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BirthdayInput = styled.input`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 3px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }

  &::-webkit-calendar-picker-indicator {
    filter: ${props => props.theme === 'light' ? 'none' : 'invert(1)'};
  }
`;

const WishesSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const WishesSelect = styled.select`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 3px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }

  option {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

// Birthday Fun styled components
const BirthdayDisplayContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const BirthdayMainInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const BirthdayFunInfo = styled.div`
  margin-top: 16px;
`;

const BirthdayTodayCard = styled.div`
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border: 2px solid #F59E0B;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  animation: birthday-bounce 2s ease-in-out infinite;

  @keyframes birthday-bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
`;

const BirthdayTodayText = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #92400E;
  margin: 0 8px;
`;

const BirthdayAgeText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #92400E;
  margin-top: 8px;
`;

const BirthdayCountdownContainer = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const BirthdayCountdownCard = styled.div`
  background: ${props => props.theme === 'light'
    ? 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)'
    : 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)'
  };
  border: 2px solid ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  min-width: 120px;
  box-shadow: ${props => props.theme === 'light'
    ? '0 4px 12px rgba(59, 130, 246, 0.2)'
    : '0 4px 12px rgba(96, 165, 250, 0.3)'
  };
`;

const BirthdayCountdownDays = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: ${props => props.theme === 'light' ? '#1E40AF' : '#BFDBFE'};
  line-height: 1;
`;

const BirthdayCountdownLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#1E40AF' : '#BFDBFE'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
`;

const BirthdayAgeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BirthdayCurrentAge = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  display: flex;
  align-items: center;
  gap: 8px;

  &:before {
    content: '🎯';
    font-size: 18px;
  }
`;

const BirthdayNextAge = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#059669' : '#6EE7B7'};
  display: flex;
  align-items: center;
  gap: 8px;

  &:before {
    content: '🎂';
    font-size: 18px;
  }
`;

// Holiday Fun styled components
const HolidayDisplayContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const HolidayMainInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const HolidayFunInfo = styled.div`
  margin-top: 16px;
`;

const HolidayTodayCard = styled.div`
  ${props => props.$holiday === 'easter'
    ? `
      background: linear-gradient(135deg, #FEF3C7 0%, #DDD6FE 100%);
      border: 2px solid #7C3AED;
    `
    : `
      background: linear-gradient(135deg, #FECACA 0%, #FEF3C7 100%);
      border: 2px solid #DC2626;
    `
  }
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  animation: holiday-sparkle 3s ease-in-out infinite;

  @keyframes holiday-sparkle {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.02) rotate(0.5deg); }
    50% { transform: scale(1.01) rotate(-0.5deg); }
    75% { transform: scale(1.02) rotate(0.3deg); }
  }
`;

const HolidayTodayText = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#7C2D12' : '#FED7AA'};
  margin: 0 8px;
`;

const HolidayMessage = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#7C2D12' : '#FED7AA'};
  margin-top: 8px;
`;

const HolidayCountdownContainer = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const HolidayCountdownCard = styled.div`
  ${props => props.$holiday === 'easter'
    ? `
      background: ${props.theme === 'light'
        ? 'linear-gradient(135deg, #F3E8FF 0%, #DDD6FE 100%)'
        : 'linear-gradient(135deg, #581C87 0%, #7C3AED 100%)'
      };
      border: 2px solid ${props.theme === 'light' ? '#7C3AED' : '#A855F7'};
      box-shadow: ${props.theme === 'light'
        ? '0 4px 12px rgba(124, 58, 237, 0.2)'
        : '0 4px 12px rgba(168, 85, 247, 0.3)'
      };
    `
    : `
      background: ${props.theme === 'light'
        ? 'linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)'
        : 'linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)'
      };
      border: 2px solid ${props.theme === 'light' ? '#DC2626' : '#EF4444'};
      box-shadow: ${props.theme === 'light'
        ? '0 4px 12px rgba(220, 38, 38, 0.2)'
        : '0 4px 12px rgba(239, 68, 68, 0.3)'
      };
    `
  }
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  min-width: 120px;
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: ${props => props.$holiday === 'easter'
      ? 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)'
      : 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)'
    };
    animation: holiday-glow 4s ease-in-out infinite;
  }

  @keyframes holiday-glow {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(180deg); }
  }
`;

const HolidayCountdownDays = styled.div`
  font-size: 32px;
  font-weight: 800;
  ${props => props.theme === 'light'
    ? 'color: #581C87;'
    : 'color: #DDD6FE;'
  }
  line-height: 1;
  position: relative;
  z-index: 1;
`;

const HolidayCountdownLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  ${props => props.theme === 'light'
    ? 'color: #581C87;'
    : 'color: #DDD6FE;'
  }
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
  position: relative;
  z-index: 1;
`;

const HolidayEmoji = styled.div`
  font-size: 16px;
  margin-top: 8px;
  animation: holiday-bounce 2s ease-in-out infinite;
  position: relative;
  z-index: 1;

  @keyframes holiday-bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-4px); }
    60% { transform: translateY(-2px); }
  }
`;

const HolidayInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
`;

const HolidayDate = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  padding: 8px 12px;
`;

const HolidayPlan = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#059669' : '#6EE7B7'};
  background: ${props => props.theme === 'light' ? '#D1FAE5' : '#065F46'};
  border: 1px solid ${props => props.theme === 'light' ? '#10B981' : '#059669'};
  border-radius: 8px;
  padding: 8px 12px;
`;

const ChristmasCountdownFun = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#DC2626' : '#FCA5A5'};
  background: ${props => props.theme === 'light' ? '#FEE2E2' : '#7F1D1D'};
  border: 1px solid ${props => props.theme === 'light' ? '#EF4444' : '#DC2626'};
  border-radius: 8px;
  padding: 8px 12px;
  font-style: italic;
`;

// Next Event styled components
const NextEventContent = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const NextEventLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const NextEventContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const NextEventCard = styled.div`
  background: ${props => {
    if (props.$eventType === 'birthday') return 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)';
    if (props.$eventType === 'touchbase') return 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)';
    if (props.$eventType === 'easter') return 'linear-gradient(135deg, #F3E8FF 0%, #DDD6FE 100%)';
    if (props.$eventType === 'christmas') return 'linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)';
    return 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%)';
  }};

  border: 3px solid ${props => {
    if (props.$eventType === 'birthday') return '#F59E0B';
    if (props.$eventType === 'touchbase') return '#3B82F6';
    if (props.$eventType === 'easter') return '#7C3AED';
    if (props.$eventType === 'christmas') return '#DC2626';
    return '#6B7280';
  }};

  border-radius: 20px;
  padding: 32px;
  text-align: center;
  box-shadow: ${props => props.theme === 'light'
    ? '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)'
    : '0 10px 25px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  animation: next-event-glow 3s ease-in-out infinite;

  @keyframes next-event-glow {
    0%, 100% { box-shadow: ${props => props.theme === 'light'
      ? '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)'
      : '0 10px 25px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1)'
    }; }
    50% { box-shadow: ${props => props.theme === 'light'
      ? '0 15px 35px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.08)'
      : '0 15px 35px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.2)'
    }; }
  }
`;

const NextEventHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const NextEventEmoji = styled.div`
  font-size: 48px;
  animation: next-event-bounce 2s ease-in-out infinite;

  @keyframes next-event-bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); }
    40% { transform: translateY(-8px) scale(1.1); }
    60% { transform: translateY(-4px) scale(1.05); }
  }
`;

const NextEventTitle = styled.h2`
  font-size: 28px;
  font-weight: 800;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  text-shadow: ${props => props.theme === 'light'
    ? '0 2px 4px rgba(0, 0, 0, 0.1)'
    : '0 2px 4px rgba(0, 0, 0, 0.3)'
  };
`;

const NextEventCountdown = styled.div`
  margin-bottom: 24px;
`;

const NextEventDays = styled.div`
  font-size: 72px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 8px;
  color: ${props => {
    if (props.$isOverdue) return '#DC2626'; // Red for overdue
    if (props.$eventType === 'birthday') return '#92400E';
    if (props.$eventType === 'touchbase') return '#1E40AF';
    if (props.$eventType === 'easter') return '#581C87';
    if (props.$eventType === 'christmas') return '#7F1D1D';
    return '#374151';
  }};

  text-shadow: ${props => props.theme === 'light'
    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.4)'
  };

  animation: ${props => props.$isOverdue ? 'next-event-urgent-pulse' : 'next-event-pulse'} 2s ease-in-out infinite;

  @keyframes next-event-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes next-event-urgent-pulse {
    0%, 100% { transform: scale(1); color: #DC2626; }
    50% { transform: scale(1.1); color: #EF4444; }
  }
`;

const NextEventDaysLabel = styled.div`
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: ${props =>
    props.$isOverdue
      ? '#DC2626'
      : props.theme === 'light' ? '#374151' : '#D1D5DB'
  };
  opacity: ${props => props.$isOverdue ? '1' : '0.8'};
`;

const NextEventDate = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  background: ${props => props.theme === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.2)'};
  border-radius: 12px;
  padding: 12px 20px;
  margin: 20px auto;
  display: inline-block;
  backdrop-filter: blur(8px);
  border: 1px solid ${props => props.theme === 'light' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
`;

const NextEventDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0;
`;

const NextEventDetail = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#059669' : '#6EE7B7'};
  background: ${props => props.theme === 'light' ? 'rgba(209, 250, 229, 0.8)' : 'rgba(6, 95, 70, 0.8)'};
  border-radius: 10px;
  padding: 8px 16px;
  display: inline-block;
  backdrop-filter: blur(4px);
`;

const NextEventToday = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #DC2626;
  background: #FEE2E2;
  border: 2px solid #EF4444;
  border-radius: 12px;
  padding: 16px;
  margin-top: 20px;
  animation: next-event-urgent 1.5s ease-in-out infinite;

  @keyframes next-event-urgent {
    0%, 100% { background: #FEE2E2; }
    50% { background: #FECACA; }
  }
`;

const NextEventSoon = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #F59E0B;
  background: #FEF3C7;
  border: 2px solid #F59E0B;
  border-radius: 12px;
  padding: 12px;
  margin-top: 20px;
`;

const NextEventThisWeek = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #3B82F6;
  background: #DBEAFE;
  border: 2px solid #3B82F6;
  border-radius: 12px;
  padding: 12px;
  margin-top: 20px;
`;

const NextEventOverdue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #DC2626;
  background: #FEE2E2;
  border: 3px solid #EF4444;
  border-radius: 12px;
  padding: 16px;
  margin-top: 20px;
  animation: next-event-critical 1s ease-in-out infinite;

  @keyframes next-event-critical {
    0%, 100% {
      background: #FEE2E2;
      border-color: #EF4444;
      transform: scale(1);
    }
    50% {
      background: #FECACA;
      border-color: #DC2626;
      transform: scale(1.02);
    }
  }
`;

const EasterApiNote = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  font-style: italic;
`;

const NextEventEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const NextEventEmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const NextEventEmptyText = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin-bottom: 8px;
`;

const NextEventEmptySubtext = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  max-width: 400px;
  line-height: 1.5;
`;

// Frequency Setup styled components
const FrequencySetupContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  padding: 24px;
  background: ${props => props.theme === 'light' ? 'rgba(249, 250, 251, 0.8)' : 'rgba(31, 41, 55, 0.8)'};
  border-radius: 16px;
  border: 2px dashed ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  margin: 20px 0;
`;

const SetupMessage = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  text-align: center;
  margin-bottom: 8px;
`;

// Relaxed State styled components
const RelaxedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: 32px 24px;
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  border-radius: 20px;
  border: 2px solid #059669;
  margin: 20px 0;
  animation: relaxed-gentle-glow 4s ease-in-out infinite;

  @keyframes relaxed-gentle-glow {
    0%, 100% { box-shadow: 0 4px 15px rgba(5, 150, 105, 0.2); }
    50% { box-shadow: 0 6px 20px rgba(5, 150, 105, 0.3); }
  }
`;

const RelaxedMessage = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #065F46;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const RelaxedSubtext = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #047857;
  text-align: center;
  opacity: 0.8;
`;

export default ContactDetail;