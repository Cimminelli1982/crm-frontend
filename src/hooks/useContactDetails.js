import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook per fetchare tutti i dettagli di un contatto
 *
 * @param {string} contactId - UUID del contatto
 * @returns {Object} {
 *   contact,           // dati base da contacts table
 *   emails,            // array da contact_emails
 *   mobiles,           // array da contact_mobiles
 *   companies,         // array da contact_companies + companies join
 *   tags,              // array da contact_tags + tags join
 *   cities,            // array da contact_cities + cities join
 *   completenessScore, // da contact_completeness table
 *   keepInTouch,       // da keep_in_touch table
 *   // Secondary dropdown data
 *   chats,             // WhatsApp chats
 *   introductions,     // Introductions (as introducer or introducee)
 *   notes,             // Linked notes
 *   deals,             // Linked deals
 *   lists,             // Email lists membership
 *   // State
 *   loading,           // boolean
 *   error,             // error object or null
 *   refetch            // function per refresh manuale
 * }
 */
export const useContactDetails = (contactId) => {
  // Core contact data
  const [contact, setContact] = useState(null);
  const [emails, setEmails] = useState([]);
  const [mobiles, setMobiles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [tags, setTags] = useState([]);
  const [cities, setCities] = useState([]);
  const [completenessScore, setCompletenessScore] = useState(null);
  const [keepInTouch, setKeepInTouch] = useState(null);

  // Secondary dropdown data
  const [chats, setChats] = useState([]);
  const [introductions, setIntroductions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [deals, setDeals] = useState([]);
  const [lists, setLists] = useState([]);

  // Claude context data
  const [interactions, setInteractions] = useState([]);
  const [recentEmails, setRecentEmails] = useState([]);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContactDetails = useCallback(async () => {
    if (!contactId) {
      // Reset all state when no contact selected
      setContact(null);
      setEmails([]);
      setMobiles([]);
      setCompanies([]);
      setTags([]);
      setCities([]);
      setCompletenessScore(null);
      setKeepInTouch(null);
      setChats([]);
      setIntroductions([]);
      setNotes([]);
      setDeals([]);
      setLists([]);
      setInteractions([]);
      setRecentEmails([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel for performance
      const [
        contactResult,
        emailsResult,
        mobilesResult,
        companiesResult,
        tagsResult,
        citiesResult,
        completenessResult,
        keepInTouchResult,
        chatsResult,
        introductionsResult,
        notesResult,
        dealsResult,
        listsResult,
        interactionsResult,
      ] = await Promise.all([
        // 1. Contact base data
        supabase
          .from('contacts')
          .select('contact_id, first_name, last_name, category, job_role, show_missing, profile_image_url, linkedin, score, birthday, description, last_interaction_at, created_at')
          .eq('contact_id', contactId)
          .single(),

        // 2. Emails
        supabase
          .from('contact_emails')
          .select('email_id, email, is_primary, type')
          .eq('contact_id', contactId)
          .order('is_primary', { ascending: false }),

        // 3. Mobiles
        supabase
          .from('contact_mobiles')
          .select('mobile_id, mobile, is_primary, type')
          .eq('contact_id', contactId)
          .order('is_primary', { ascending: false }),

        // 4. Companies with join
        supabase
          .from('contact_companies')
          .select(`
            contact_companies_id,
            company_id,
            is_primary,
            relationship,
            companies (
              company_id,
              name,
              category,
              website,
              linkedin,
              description
            )
          `)
          .eq('contact_id', contactId)
          .order('is_primary', { ascending: false }),

        // 5. Tags with join
        supabase
          .from('contact_tags')
          .select(`
            entry_id,
            tag_id,
            tags (
              tag_id,
              name
            )
          `)
          .eq('contact_id', contactId),

        // 6. Cities with join
        supabase
          .from('contact_cities')
          .select(`
            entry_id,
            city_id,
            cities (
              city_id,
              name,
              country
            )
          `)
          .eq('contact_id', contactId),

        // 7. Completeness score
        supabase
          .from('contact_completeness')
          .select('completeness_score')
          .eq('contact_id', contactId)
          .maybeSingle(),

        // 8. Keep in Touch settings
        supabase
          .from('keep_in_touch')
          .select('id, frequency, why_keeping_in_touch, snooze_days, next_follow_up_notes, christmas, easter')
          .eq('contact_id', contactId)
          .maybeSingle(),

        // 9. WhatsApp chats
        supabase
          .from('contact_chats')
          .select(`
            chat_id,
            chats (
              id,
              chat_name,
              is_group_chat,
              baileys_jid
            )
          `)
          .eq('contact_id', contactId),

        // 10. Introductions
        supabase
          .from('introduction_contacts')
          .select(`
            introduction_contact_id,
            role,
            introductions (
              introduction_id,
              introduction_date,
              introduction_tool,
              category,
              status,
              text
            )
          `)
          .eq('contact_id', contactId),

        // 11. Notes
        supabase
          .from('notes_contacts')
          .select(`
            note_id,
            notes (
              note_id,
              title,
              text,
              created_at
            )
          `)
          .eq('contact_id', contactId),

        // 12. Deals
        supabase
          .from('deals_contacts')
          .select(`
            deal_id,
            deals (
              deal_id,
              opportunity,
              stage,
              category
            )
          `)
          .eq('contact_id', contactId),

        // 13. Email Lists
        supabase
          .from('email_list_members')
          .select(`
            list_id,
            email_lists (
              list_id,
              name
            )
          `)
          .eq('contact_id', contactId),

        // 14. Interactions (last 10 for Claude context)
        supabase
          .from('interactions')
          .select('interaction_id, interaction_type, direction, interaction_date, summary')
          .eq('contact_id', contactId)
          .order('interaction_date', { ascending: false })
          .limit(10),
      ]);

      // Handle errors
      if (contactResult.error) throw contactResult.error;

      // Set contact data
      setContact(contactResult.data);

      // Set emails
      setEmails(emailsResult.data || []);

      // Set mobiles
      setMobiles(mobilesResult.data || []);

      // Transform and set companies
      const transformedCompanies = (companiesResult.data || []).map(cc => ({
        contact_companies_id: cc.contact_companies_id,
        company_id: cc.company_id,
        is_primary: cc.is_primary,
        relationship: cc.relationship,
        ...cc.companies,
      })).filter(c => c.name); // Filter out null companies
      setCompanies(transformedCompanies);

      // Transform and set tags
      const transformedTags = (tagsResult.data || []).map(ct => ({
        entry_id: ct.entry_id,
        tag_id: ct.tag_id,
        name: ct.tags?.name,
      })).filter(t => t.name);
      setTags(transformedTags);

      // Transform and set cities
      const transformedCities = (citiesResult.data || []).map(cc => ({
        entry_id: cc.entry_id,
        city_id: cc.city_id,
        name: cc.cities?.name,
        country: cc.cities?.country,
      })).filter(c => c.name);
      setCities(transformedCities);

      // Set completeness score
      setCompletenessScore(completenessResult.data?.completeness_score || null);

      // Set keep in touch
      setKeepInTouch(keepInTouchResult.data || null);

      // Transform and set chats
      const transformedChats = (chatsResult.data || []).map(cc => ({
        chat_id: cc.chat_id,
        id: cc.chats?.id,
        chat_name: cc.chats?.chat_name,
        is_group: cc.chats?.is_group_chat,
        chat_jid: cc.chats?.baileys_jid,
      })).filter(c => c.chat_name);
      setChats(transformedChats);

      // Transform and set introductions
      const transformedIntroductions = (introductionsResult.data || []).map(ic => ({
        introduction_contact_id: ic.introduction_contact_id,
        role: ic.role,
        ...ic.introductions,
      })).filter(i => i.introduction_id);
      setIntroductions(transformedIntroductions);

      // Transform and set notes
      const transformedNotes = (notesResult.data || []).map(nc => ({
        note_id: nc.note_id,
        title: nc.notes?.title,
        text: nc.notes?.text,
        created_at: nc.notes?.created_at,
      })).filter(n => n.title);
      setNotes(transformedNotes);

      // Transform and set deals
      const transformedDeals = (dealsResult.data || []).map(dc => ({
        deal_id: dc.deal_id,
        ...dc.deals,
      })).filter(d => d.opportunity);
      setDeals(transformedDeals);

      // Transform and set lists
      const transformedLists = (listsResult.data || []).map(lm => ({
        list_id: lm.list_id,
        name: lm.email_lists?.name,
      })).filter(l => l.name);
      setLists(transformedLists);

      // Set interactions
      setInteractions(interactionsResult.data || []);

      // Fetch recent emails (needs primary email from emailsResult)
      const emailsList = emailsResult.data || [];
      const primaryEmail = emailsList.find(e => e.is_primary)?.email || emailsList[0]?.email;
      if (primaryEmail) {
        const { data: emailThreads } = await supabase
          .from('command_center_inbox')
          .select('id, subject, from_name, from_email, date, snippet')
          .or(`from_email.eq.${primaryEmail},to_recipients.cs.${JSON.stringify([{ email: primaryEmail }])}`)
          .order('date', { ascending: false })
          .limit(5);
        setRecentEmails(emailThreads || []);
      } else {
        setRecentEmails([]);
      }

    } catch (err) {
      console.error('Error fetching contact details:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  // Fetch on mount and when contactId changes
  useEffect(() => {
    fetchContactDetails();
  }, [fetchContactDetails]);

  return {
    // Core data
    contact,
    emails,
    mobiles,
    companies,
    tags,
    cities,
    completenessScore,
    keepInTouch,
    // Secondary dropdown data
    chats,
    introductions,
    notes,
    deals,
    lists,
    // Claude context data
    interactions,
    recentEmails,
    // State
    loading,
    error,
    refetch: fetchContactDetails,
  };
};

export default useContactDetails;
