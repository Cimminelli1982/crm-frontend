import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

export const useContactsData = (dataSource, refreshTrigger, onDataLoad) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [missingInfoContactIds, setMissingInfoContactIds] = useState(new Set());

  // Fetch all contact IDs that are in contacts_missing_info view
  const fetchMissingInfoIds = async () => {
    try {
      const { data: missingData, error } = await supabase
        .from('contacts_missing_info')
        .select('contact_id');

      if (!error && missingData) {
        const idSet = new Set(missingData.map(item => item.contact_id));
        setMissingInfoContactIds(idSet);
        return idSet;
      }
      return new Set();
    } catch (error) {
      console.error('Error fetching missing info IDs:', error);
      return new Set();
    }
  };

  const fetchData = async () => {
    console.log('[useContactsData] fetchData called');
    console.log('[useContactsData] dataSource:', dataSource);

    if (!dataSource) return;

    setLoading(true);
    try {
      // First, fetch the missing info IDs
      const missingIds = await fetchMissingInfoIds();

      let data = [];

      if (dataSource.type === 'interactions') {
        data = await fetchInteractionsData(dataSource);
      } else if (dataSource.type === 'spam') {
        data = await fetchSpamData(dataSource);
      } else if (dataSource.type === 'missing') {
        data = await fetchMissingData(dataSource);
      } else if (dataSource.type === 'mail_filter') {
        data = await fetchMailFilterData();
      } else if (dataSource.type === 'inbox') {
        data = await fetchInboxData(dataSource);
      } else if (dataSource.type === 'duplicates') {
        data = await fetchDuplicatesData();
      } else if (dataSource.type === 'search') {
        data = dataSource.preloadedData || [];
      } else if (dataSource.type === 'contacts') {
        data = await fetchContactsByCategory(dataSource);
      }

      // Add is_missing_info flag to each contact based on the fetched IDs
      data = data.map(contact => ({
        ...contact,
        is_missing_info: missingIds.has(contact.contact_id)
      }));

      setContacts(data);
      if (onDataLoad) onDataLoad(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch interactions data
  const fetchInteractionsData = async (dataSource) => {
    console.log('[INTERACTIONS] Starting fetch');
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
    const transformedData = (contactsData || []).map(contact => ({
      ...contact,
      companies: contact.contact_companies?.map(cc => ({
        ...cc.companies,
        company_id: cc.company_id
      })).filter(Boolean) || [],
      contact_emails: contact.contact_emails || [],
      keep_in_touch_frequency: contact.keep_in_touch?.frequency || contact.keep_in_touch?.[0]?.frequency || null,
      christmas: contact.keep_in_touch?.christmas || contact.keep_in_touch?.[0]?.christmas || null,
      easter: contact.keep_in_touch?.easter || contact.keep_in_touch?.[0]?.easter || null,
      completeness_score: completenessScores[contact.contact_id] || null
    }));

    console.log('[INTERACTIONS] After transform:', transformedData);
    return transformedData;
  };

  // Fetch spam data
  const fetchSpamData = async (dataSource) => {
    const subCategory = dataSource.subCategory || 'Email';
    let data = [];

    if (subCategory === 'Email') {
      const { data: spamEmails, error } = await supabase
        .from('email_inbox')
        .select('*')
        .eq('special_case', 'pending_approval')
        .order('message_timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

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
      const { data: spamData, error } = await supabase
        .from('whatsapp_spam')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('WhatsApp spam table not available:', error);
        data = [];
      } else {
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

    return data;
  };

  // Fetch missing data
  const fetchMissingData = async (dataSource) => {
    const subCategory = dataSource.subCategory || 'Need Input';
    let data = [];

    // Handle dedicated views for different missing data types
    if (subCategory === 'Need Input') {
      // First get contact IDs from the view
      const { data: missingInfoData, error: viewError } = await supabase
        .from('contacts_missing_info')
        .select('contact_id')
        .limit(100);

      if (viewError) throw viewError;

      // If we have contacts, fetch their full data with relationships
      if (missingInfoData && missingInfoData.length > 0) {
        const contactIds = missingInfoData.map(c => c.contact_id);

        const { data: contactsData, error } = await supabase
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
          .in('contact_id', contactIds)
          .order('last_interaction_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        // Transform data similar to inbox
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
      } else {
        data = [];
      }
    } else if (subCategory === 'Basics') {
      const { data: basicsData, error } = await supabase
        .from('contacts_without_basics')
        .select('*')
        .not('last_interaction_at', 'is', null)
        .order('last_interaction_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      data = (basicsData || []).map(contact => ({
        ...contact,
        emails: [],
        mobiles: [],
        companies: [],
        contact_emails: [],
      }));
    } else if (subCategory === 'Company') {
      const { data: companyData, error } = await supabase
        .from('contacts_without_companies')
        .select('*')
        .not('category', 'in', '("Skip","WhatsApp Group Contact","System","Not Set","Inbox")')
        .not('last_interaction_at', 'is', null)
        .order('last_interaction_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      data = (companyData || []).map(contact => ({
        ...contact,
        emails: contact.emails || [],
        mobiles: contact.mobiles || [],
        companies: [],
        contact_emails: contact.emails || [],
      }));
    } else if (subCategory === 'Tags') {
      const { data: tagsData, error } = await supabase
        .from('contacts_without_tags')
        .select('*')
        .not('last_interaction_at', 'is', null)
        .order('last_interaction_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      data = (tagsData || []).map(contact => ({
        ...contact,
        emails: [],
        mobiles: [],
        companies: [],
        tags: [],
        contact_emails: [],
      }));
    } else if (subCategory === 'Cities') {
      const { data: citiesData, error } = await supabase
        .from('contacts_without_cities')
        .select('*')
        .not('last_interaction_at', 'is', null)
        .order('last_interaction_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      data = (citiesData || []).map(contact => ({
        ...contact,
        emails: [],
        mobiles: [],
        companies: [],
        cities: [],
        contact_emails: [],
      }));
    } else if (subCategory === 'Score') {
      const { data: scoreData, error } = await supabase
        .from('contacts_without_score')
        .select('*')
        .not('last_interaction_at', 'is', null)
        .order('last_interaction_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      data = (scoreData || []).map(contact => ({
        ...contact,
        emails: [],
        mobiles: [],
        companies: [],
        contact_emails: [],
      }));
    } else if (subCategory === 'Keep in touch') {
      const { data: kitData, error } = await supabase
        .from('contacts_without_keep_in_touch')
        .select('*')
        .not('last_interaction_at', 'is', null)
        .order('last_interaction_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      data = (kitData || []).map(contact => ({
        ...contact,
        emails: [],
        mobiles: [],
        companies: [],
        keep_in_touch: null,
        contact_emails: [],
      }));
    } else if (subCategory === 'Birthday') {
      // First get contact IDs from the birthday view
      const { data: birthdayData, error: viewError } = await supabase
        .from('contacts_without_birthday')
        .select('contact_id')
        .not('last_interaction_at', 'is', null)
        .limit(100);

      if (viewError) throw viewError;

      // If we have contacts, fetch their full data with relationships
      if (birthdayData && birthdayData.length > 0) {
        const contactIds = birthdayData.map(c => c.contact_id);

        const { data: contactsData, error } = await supabase
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
          .in('contact_id', contactIds)
          .order('last_interaction_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        // Transform data similar to inbox
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
      } else {
        data = [];
      }
    } else {
      // Generic query for other missing data types
      data = await fetchMissingDataGeneric(subCategory);
    }

    return data;
  };

  // Generic missing data query
  const fetchMissingDataGeneric = async (subCategory) => {
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
    return (contactsData || []).map(contact => ({
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
  };

  // Fetch mail filter data
  const fetchMailFilterData = async () => {
    const { data: emailData, error } = await supabase
      .from('email_inbox')
      .select('*')
      .eq('special_case', 'mail_filter')
      .order('message_timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;

    return (emailData || []).map(email => ({
      contact_id: email.id,
      first_name: email.from_name?.split(' ')[0] || '',
      last_name: email.from_name?.split(' ').slice(1).join(' ') || '',
      contact_emails: [{
        email_id: email.id,
        email: email.from_email,
        is_primary: true
      }],
      email_data: email,
      category: 'Mail Filter'
    }));
  };

  // Fetch duplicates data
  const fetchDuplicatesData = async () => {
    const { data: duplicatesData, error } = await supabase
      .from('contacts_with_duplicate_names')
      .select(`
        *,
        contact_companies:contact_companies!contact_id (
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
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (duplicatesData || []).map(contact => ({
      ...contact,
      companies: contact.contact_companies?.map(cc => ({
        ...cc.companies,
        company_id: cc.company_id,
        is_primary: cc.is_primary
      })).filter(Boolean) || [],
      emails: contact.contact_emails?.map(ce => ({
        email: ce.email,
        type: ce.type,
        is_primary: ce.is_primary
      })) || [],
      mobiles: contact.contact_mobiles?.map(cm => ({
        mobile: cm.mobile,
        type: cm.type,
        is_primary: cm.is_primary
      })) || [],
      cities: contact.contact_cities?.map(cc => ({
        ...cc.cities,
        city_id: cc.city_id
      })).filter(Boolean) || [],
      tags: contact.contact_tags?.map(ct => ({
        ...ct.tags,
        tag_id: ct.tag_id
      })).filter(Boolean) || [],
      contact_emails: contact.contact_emails || [],
      keep_in_touch_frequency: contact.keep_in_touch?.frequency || contact.keep_in_touch?.[0]?.frequency || null,
      christmas: contact.keep_in_touch?.christmas || contact.keep_in_touch?.[0]?.christmas || null,
      easter: contact.keep_in_touch?.easter || contact.keep_in_touch?.[0]?.easter || null
    }));
  };

  // Fetch inbox data
  const fetchInboxData = async (dataSource) => {
    const timeFilter = dataSource.timeFilter || 'This Week';

    let query = supabase
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
      `);

    if (timeFilter === 'This Week') {
      // Last 7 days (day 1-7)
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      query = query
        .gte('computed_last_interaction', startDate.toISOString())
        .lte('computed_last_interaction', endDate.toISOString());
    } else if (timeFilter === 'This Month') {
      // Day 8 to day 30
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 8);
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      query = query
        .gte('computed_last_interaction', startDate.toISOString())
        .lte('computed_last_interaction', endDate.toISOString());
    } else if (timeFilter === 'All') {
      // Day 31 and older
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 31);
      cutoffDate.setHours(23, 59, 59, 999);
      query = query.lte('computed_last_interaction', cutoffDate.toISOString());
    }

    const { data: contactsData, error } = await query
      .order('computed_last_interaction', { ascending: false, nullsLast: true });

    if (error) throw error;

    console.log('[INBOX] Raw data from Supabase:', contactsData);

    return (contactsData || []).map(contact => ({
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
  };

  // Fetch contacts by category
  const fetchContactsByCategory = async (dataSource) => {
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

    return (contactsData || []).map(contact => ({
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
  };

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [dataSource, refreshTrigger]);

  return {
    contacts,
    loading,
    refetch: fetchData
  };
};