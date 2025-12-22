import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const MY_EMAIL = 'simone@cimminelli.com';
const MY_PHONE = '+393481541119'; // Adjust as needed

/**
 * Custom hook for fetching contacts and companies based on the active context
 * Supports Email, WhatsApp, and Calendar sources
 */
const useContextContacts = (activeTab, selectedThread, selectedWhatsappChat, selectedCalendarEvent, selectedPipelineDeal = null) => {
  const [contextContacts, setContextContacts] = useState([]);
  const [contextCompanies, setContextCompanies] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Function to trigger a refresh of contacts
  const refetchContacts = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  // Extract participants based on source type
  const participants = useMemo(() => {
    if (activeTab === 'email' && selectedThread && selectedThread.length > 0) {
      return extractEmailParticipants(selectedThread);
    }
    if (activeTab === 'whatsapp' && selectedWhatsappChat) {
      return extractWhatsAppParticipants(selectedWhatsappChat);
    }
    if (activeTab === 'calendar' && selectedCalendarEvent) {
      return extractCalendarParticipants(selectedCalendarEvent);
    }
    if (activeTab === 'deals' && selectedPipelineDeal) {
      return { emails: [], phones: [], type: 'deals', deal: selectedPipelineDeal };
    }
    return { emails: [], phones: [], type: null };
  }, [activeTab, selectedThread, selectedWhatsappChat, selectedCalendarEvent, selectedPipelineDeal]);

  // Fetch contacts when participants change
  useEffect(() => {
    const fetchContacts = async () => {
      const { emails, phones, type, participantsMap, isGroupChat, chatId, deal } = participants;

      // For deals, extract contacts directly from deal data
      if (type === 'deals' && deal) {
        setLoadingContacts(true);
        try {
          const contactIds = (deal.deals_contacts || [])
            .filter(dc => dc.contacts?.contact_id)
            .map(dc => dc.contacts.contact_id);

          // Fetch completeness scores for deal contacts
          let completenessById = {};
          if (contactIds.length > 0) {
            const { data: completenessData } = await supabase
              .from('contact_completeness')
              .select('contact_id, completeness_score')
              .in('contact_id', contactIds);

            if (completenessData) {
              completenessData.forEach(c => {
                completenessById[c.contact_id] = c.completeness_score;
              });
            }
          }

          const dealContacts = (deal.deals_contacts || []).map(dc => ({
            contact: dc.contacts ? {
              ...dc.contacts,
              company_name: null,
              completeness_score: completenessById[dc.contacts.contact_id] || 0
            } : null,
            hasContact: !!dc.contacts,
            name: dc.contacts ? `${dc.contacts.first_name || ''} ${dc.contacts.last_name || ''}`.trim() : 'Unknown',
            roles: [dc.relationship || 'linked'],
            email: null,
            phone: null
          })).filter(c => c.contact);

          setContextContacts(dealContacts);
        } catch (error) {
          console.error('Error fetching deal contacts:', error);
        } finally {
          setLoadingContacts(false);
        }
        return;
      }

      // For group chats, fetch contacts from contact_chats table
      if (type === 'whatsapp' && isGroupChat && chatId) {
        setLoadingContacts(true);
        try {
          // First find the chat id in our chats table using external_chat_id
          const { data: chatData } = await supabase
            .from('chats')
            .select('id')
            .eq('external_chat_id', chatId)
            .maybeSingle();

          if (chatData?.id) {
            // Get all contacts linked to this chat
            const { data: contactChatsData } = await supabase
              .from('contact_chats')
              .select('contact_id')
              .eq('chat_id', chatData.id);

            if (contactChatsData && contactChatsData.length > 0) {
              const contactIds = contactChatsData.map(cc => cc.contact_id);

              // Fetch full contact details
              const { data: contacts } = await supabase
                .from('contacts')
                .select('contact_id, first_name, last_name, category, job_role, profile_image_url, description, linkedin, score, birthday, show_missing')
                .in('contact_id', contactIds);

              // Fetch completeness scores
              const { data: completenessData } = await supabase
                .from('contact_completeness')
                .select('contact_id, completeness_score')
                .in('contact_id', contactIds);

              const completenessById = {};
              if (completenessData) {
                completenessData.forEach(c => {
                  completenessById[c.contact_id] = c.completeness_score;
                });
              }

              // Fetch companies for contacts
              const { data: contactCompanies } = await supabase
                .from('contact_companies')
                .select('contact_id, company_id, is_primary, companies(company_id, name, show_missing)')
                .in('contact_id', contactIds);

              // Map contact to primary company
              const contactToCompany = {};
              if (contactCompanies) {
                contactCompanies.forEach(cc => {
                  if (!contactToCompany[cc.contact_id] || cc.is_primary) {
                    contactToCompany[cc.contact_id] = {
                      name: cc.companies?.name
                    };
                  }
                });
              }

              // Fetch phone numbers for contacts
              const { data: mobilesData } = await supabase
                .from('contact_mobiles')
                .select('contact_id, mobile')
                .in('contact_id', contactIds);

              const contactToPhone = {};
              if (mobilesData) {
                mobilesData.forEach(m => {
                  if (!contactToPhone[m.contact_id]) {
                    contactToPhone[m.contact_id] = m.mobile;
                  }
                });
              }

              // Build participants list (exclude "WhatsApp Group Contact" category)
              const groupParticipants = (contacts || [])
                .filter(c => c.category !== 'WhatsApp Group Contact')
                .map(c => ({
                  phone: contactToPhone[c.contact_id] || null,
                  name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
                  roles: ['member'],
                  contact: {
                    ...c,
                    company_name: contactToCompany[c.contact_id]?.name || null,
                    completeness_score: completenessById[c.contact_id] || 0
                  },
                  hasContact: true
                }));

              setContextContacts(groupParticipants);
              setLoadingContacts(false);
              return;
            }
          }

          // No contacts found for this group chat
          setContextContacts([]);
          setLoadingContacts(false);
          return;
        } catch (error) {
          console.error('Error fetching group chat contacts:', error);
          setContextContacts([]);
          setLoadingContacts(false);
          return;
        }
      }

      if (emails.length === 0 && phones.length === 0) {
        setContextContacts([]);
        return;
      }

      setLoadingContacts(true);

      try {
        let emailMatches = [];
        let phoneMatches = [];

        // Fetch email matches if we have emails
        if (emails.length > 0) {
          const { data } = await supabase
            .from('contact_emails')
            .select('email, contact_id')
            .in('email', emails);
          emailMatches = data || [];
        }

        // Fetch phone matches if we have phones (WhatsApp)
        if (phones.length > 0) {
          const { data } = await supabase
            .from('contact_mobiles')
            .select('mobile, contact_id')
            .in('mobile', phones);
          phoneMatches = data || [];
        }

        // Collect all contact IDs
        const contactIds = [
          ...new Set([
            ...emailMatches.map(e => e.contact_id),
            ...phoneMatches.map(p => p.contact_id)
          ])
        ];

        // Fetch contact details if we have matches
        let contactsById = {};
        if (contactIds.length > 0) {
          const { data: contacts } = await supabase
            .from('contacts')
            .select('contact_id, first_name, last_name, category, job_role, profile_image_url, description, linkedin, score, birthday, show_missing')
            .in('contact_id', contactIds);

          // Fetch completeness scores
          const { data: completenessData } = await supabase
            .from('contact_completeness')
            .select('contact_id, completeness_score')
            .in('contact_id', contactIds);

          const completenessById = {};
          if (completenessData) {
            completenessData.forEach(c => {
              completenessById[c.contact_id] = c.completeness_score;
            });
          }

          // Fetch companies for contacts
          const { data: contactCompanies } = await supabase
            .from('contact_companies')
            .select('contact_id, company_id, is_primary, companies(company_id, name, show_missing)')
            .in('contact_id', contactIds);

          // Fetch company domains
          const companyIds = [...new Set((contactCompanies || []).map(cc => cc.company_id).filter(Boolean))];
          let companyDomains = {};
          if (companyIds.length > 0) {
            const { data: domainsData } = await supabase
              .from('company_domains')
              .select('company_id, domain')
              .in('company_id', companyIds);

            if (domainsData) {
              domainsData.forEach(d => {
                if (!companyDomains[d.company_id]) {
                  companyDomains[d.company_id] = [];
                }
                companyDomains[d.company_id].push(d.domain);
              });
            }
          }

          // Map contact to primary company with domains
          const contactToCompany = {};
          if (contactCompanies) {
            contactCompanies.forEach(cc => {
              if (!contactToCompany[cc.contact_id] || cc.is_primary) {
                contactToCompany[cc.contact_id] = {
                  name: cc.companies?.name,
                  domains: companyDomains[cc.company_id] || []
                };
              }
            });
          }

          if (contacts) {
            contacts.forEach(c => {
              const companyData = contactToCompany[c.contact_id];
              contactsById[c.contact_id] = {
                ...c,
                company_name: companyData?.name || null,
                company_domains: companyData?.domains || [],
                completeness_score: completenessById[c.contact_id] || 0
              };
            });
          }
        }

        // Build identifier to contact mapping
        const identifierToContact = {};
        emailMatches.forEach(em => {
          identifierToContact[em.email.toLowerCase()] = contactsById[em.contact_id];
        });
        phoneMatches.forEach(pm => {
          identifierToContact[normalizePhone(pm.mobile)] = contactsById[pm.contact_id];
        });

        // Build final participants list
        const allParticipantsRaw = [];

        if (type === 'email' || type === 'calendar') {
          // For email/calendar, use the participantsMap
          participantsMap?.forEach((p, key) => {
            const contact = identifierToContact[key];
            allParticipantsRaw.push({
              email: p.email,
              name: p.name,
              roles: Array.from(p.roles),
              contact: contact || null,
              hasContact: !!contact
            });
          });
        } else if (type === 'whatsapp') {
          // For WhatsApp, use phone-based lookup
          const chatMessages = selectedWhatsappChat?.messages || [selectedWhatsappChat];
          const seen = new Set();

          chatMessages.forEach(msg => {
            if (msg.contact_number) {
              const normalized = normalizePhone(msg.contact_number);
              if (!seen.has(normalized) && normalized !== normalizePhone(MY_PHONE)) {
                seen.add(normalized);
                const contact = identifierToContact[normalized];
                allParticipantsRaw.push({
                  phone: msg.contact_number,
                  name: msg.first_name && msg.last_name
                    ? `${msg.first_name} ${msg.last_name}`
                    : msg.chat_name || msg.contact_number,
                  roles: [msg.direction === 'sent' ? 'to' : 'from'],
                  contact: contact || null,
                  hasContact: !!contact
                });
              }
            }
          });
        }

        // Deduplicate by contact_id
        const contactIdMap = new Map();
        const noContactList = [];

        allParticipantsRaw.forEach(p => {
          if (p.contact?.contact_id) {
            const cid = p.contact.contact_id;
            if (contactIdMap.has(cid)) {
              const existing = contactIdMap.get(cid);
              if (p.email) existing.allEmails = [...(existing.allEmails || []), p.email];
              if (p.phone) existing.allPhones = [...(existing.allPhones || []), p.phone];
              p.roles.forEach(r => {
                if (!existing.roles.includes(r)) existing.roles.push(r);
              });
            } else {
              contactIdMap.set(cid, {
                ...p,
                allEmails: p.email ? [p.email] : [],
                allPhones: p.phone ? [p.phone] : []
              });
            }
          } else {
            noContactList.push(p);
          }
        });

        const allParticipants = [...contactIdMap.values(), ...noContactList];
        setContextContacts(allParticipants);
      } catch (error) {
        console.error('Error fetching context contacts:', error);
        setContextContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [participants, selectedWhatsappChat, refreshCounter]);

  // Fetch companies when contacts change
  useEffect(() => {
    const fetchCompanies = async () => {
      // For deals, extract companies directly from deal data
      if (participants.type === 'deals' && participants.deal) {
        setLoadingCompanies(true);
        try {
          const companyIds = (participants.deal.deal_companies || [])
            .filter(dco => dco.companies?.company_id)
            .map(dco => dco.companies.company_id);

          // Fetch completeness scores, domains, and logos for deal companies
          let completenessById = {};
          let domainsById = {};
          let logosById = {};

          if (companyIds.length > 0) {
            const [completenessRes, domainsRes, logosRes] = await Promise.all([
              supabase.from('company_completeness').select('company_id, completeness_score').in('company_id', companyIds),
              supabase.from('company_domains').select('company_id, domain').in('company_id', companyIds),
              supabase.from('company_attachments')
                .select('company_id, attachments(file_url, permanent_url)')
                .in('company_id', companyIds)
                .eq('is_logo', true)
            ]);

            if (completenessRes.data) {
              completenessRes.data.forEach(c => {
                completenessById[c.company_id] = c.completeness_score;
              });
            }

            if (domainsRes.data) {
              domainsRes.data.forEach(d => {
                if (!domainsById[d.company_id]) {
                  domainsById[d.company_id] = [];
                }
                domainsById[d.company_id].push(d.domain);
              });
            }

            if (logosRes.data) {
              logosRes.data.forEach(l => {
                if (l.attachments) {
                  logosById[l.company_id] = l.attachments.permanent_url || l.attachments.file_url;
                }
              });
            }
          }

          const dealCompanies = (participants.deal.deal_companies || []).map(dco => ({
            company: dco.companies ? {
              company_id: dco.companies.company_id,
              name: dco.companies.name,
              website: dco.companies.website,
              category: dco.companies.category,
              show_missing: dco.companies.show_missing
            } : null,
            hasCompany: !!dco.companies,
            domain: domainsById[dco.companies?.company_id]?.[0] || null,
            domains: domainsById[dco.companies?.company_id] || [],
            contacts: [],
            completeness_score: completenessById[dco.companies?.company_id] || 0,
            logo_url: logosById[dco.companies?.company_id] || null,
            relationship: dco.relationship
          })).filter(c => c.company);

          setContextCompanies(dealCompanies);
        } catch (error) {
          console.error('Error fetching deal companies:', error);
        } finally {
          setLoadingCompanies(false);
        }
        return;
      }

      if (contextContacts.length === 0 && participants.emails.length === 0) {
        setContextCompanies([]);
        return;
      }

      setLoadingCompanies(true);

      try {
        // Collect domains from emails
        const myDomain = 'cimminelli.com';
        const domainsSet = new Set();
        const hiddenDomains = new Set([
          'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com',
          'outlook.com', 'icloud.com', 'me.com', 'mac.com',
          'live.com', 'msn.com', 'aol.com'
        ]);

        participants.emails.forEach(email => {
          const domain = email.split('@')[1]?.toLowerCase();
          if (domain && domain !== myDomain && !hiddenDomains.has(domain)) {
            domainsSet.add(domain);
          }
        });

        const allDomains = Array.from(domainsSet);

        // Query company_domains for domain matches
        let domainToCompany = {};
        if (allDomains.length > 0) {
          const { data: domainMatches } = await supabase
            .from('company_domains')
            .select('domain, company_id, companies(company_id, name, website, category, show_missing)')
            .in('domain', allDomains);

          if (domainMatches) {
            domainMatches.forEach(dm => {
              if (dm.companies) {
                domainToCompany[dm.domain.toLowerCase()] = dm.companies;
              }
            });
          }
        }

        // Get contact IDs from contacts
        const contactIds = contextContacts
          .filter(p => p.contact?.contact_id)
          .map(p => p.contact.contact_id);

        // Get contact_companies associations
        let companyToContacts = {};
        let contactCompaniesData = [];
        if (contactIds.length > 0) {
          const { data } = await supabase
            .from('contact_companies')
            .select('contact_id, company_id, companies(company_id, name, website, category, show_missing)')
            .in('contact_id', contactIds);
          contactCompaniesData = data || [];

          contactCompaniesData.forEach(cc => {
            if (!companyToContacts[cc.company_id]) {
              companyToContacts[cc.company_id] = [];
            }
            const contact = contextContacts.find(p => p.contact?.contact_id === cc.contact_id);
            if (contact) {
              companyToContacts[cc.company_id].push({
                name: contact.contact?.first_name + ' ' + contact.contact?.last_name,
                email: contact.email,
                phone: contact.phone
              });
            }
          });
        }

        // Get all company IDs
        const companyIdsFromDomains = Object.values(domainToCompany).map(c => c.company_id).filter(Boolean);
        const companyIdsFromContacts = contactCompaniesData.map(cc => cc.company_id).filter(Boolean);
        const allCompanyIds = [...new Set([...companyIdsFromDomains, ...companyIdsFromContacts])];

        // Fetch domains, completeness, logos for all companies
        let companyDomainsMap = {};
        let companyCompletenessMap = {};
        let companyLogosMap = {};

        if (allCompanyIds.length > 0) {
          const [domainsRes, completenessRes, logosRes] = await Promise.all([
            supabase.from('company_domains').select('company_id, domain').in('company_id', allCompanyIds),
            supabase.from('company_completeness').select('company_id, completeness_score').in('company_id', allCompanyIds),
            supabase.from('company_attachments')
              .select('company_id, attachments(file_url, permanent_url)')
              .in('company_id', allCompanyIds)
              .eq('is_logo', true)
          ]);

          if (domainsRes.data) {
            domainsRes.data.forEach(d => {
              if (!companyDomainsMap[d.company_id]) {
                companyDomainsMap[d.company_id] = [];
              }
              companyDomainsMap[d.company_id].push(d.domain);
            });
          }

          if (completenessRes.data) {
            completenessRes.data.forEach(c => {
              companyCompletenessMap[c.company_id] = c.completeness_score;
            });
          }

          if (logosRes.data) {
            logosRes.data.forEach(logo => {
              if (logo.attachments) {
                companyLogosMap[logo.company_id] = logo.attachments.permanent_url || logo.attachments.file_url;
              }
            });
          }
        }

        // Build companies result
        const seenCompanyIds = new Set();
        const companiesResult = [];

        // Add companies from domains
        allDomains.forEach(domain => {
          const company = domainToCompany[domain];
          if (company && !seenCompanyIds.has(company.company_id)) {
            seenCompanyIds.add(company.company_id);
            companiesResult.push({
              domain,
              domains: companyDomainsMap[company.company_id] || [domain],
              company,
              hasCompany: true,
              contacts: companyToContacts[company.company_id] || [],
              completeness_score: companyCompletenessMap[company.company_id] || 0,
              logo_url: companyLogosMap[company.company_id] || null
            });
          }
        });

        // Add companies from contact associations
        contactCompaniesData.forEach(cc => {
          if (cc.companies && !seenCompanyIds.has(cc.companies.company_id)) {
            seenCompanyIds.add(cc.companies.company_id);
            companiesResult.push({
              domain: companyDomainsMap[cc.company_id]?.[0] || null,
              domains: companyDomainsMap[cc.company_id] || [],
              company: cc.companies,
              hasCompany: true,
              contacts: companyToContacts[cc.company_id] || [],
              completeness_score: companyCompletenessMap[cc.company_id] || 0,
              logo_url: companyLogosMap[cc.company_id] || null
            });
          }
        });

        setContextCompanies(companiesResult);
      } catch (error) {
        console.error('Error fetching context companies:', error);
        setContextCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, [contextContacts, participants.emails]);

  return {
    contextContacts,
    contextCompanies,
    loadingContacts,
    loadingCompanies,
    refetchContacts,
    // Aliases for backwards compatibility
    emailContacts: contextContacts,
    emailCompanies: contextCompanies,
    setEmailContacts: setContextContacts,
    setEmailCompanies: setContextCompanies
  };
};

// Helper: Extract participants from email thread
function extractEmailParticipants(selectedThread) {
  const participantsMap = new Map();

  for (const email of selectedThread) {
    // From
    if (email.from_email) {
      const key = email.from_email.toLowerCase();
      if (key !== MY_EMAIL.toLowerCase()) {
        if (!participantsMap.has(key)) {
          participantsMap.set(key, {
            email: email.from_email,
            name: email.from_name || email.from_email,
            roles: new Set()
          });
        }
        participantsMap.get(key).roles.add('from');
      }
    }

    // To
    if (email.to_recipients) {
      email.to_recipients.forEach(r => {
        if (r.email) {
          const key = r.email.toLowerCase();
          if (key !== MY_EMAIL.toLowerCase()) {
            if (!participantsMap.has(key)) {
              participantsMap.set(key, {
                email: r.email,
                name: r.name || r.email,
                roles: new Set()
              });
            }
            participantsMap.get(key).roles.add('to');
          }
        }
      });
    }

    // CC
    if (email.cc_recipients) {
      email.cc_recipients.forEach(r => {
        if (r.email) {
          const key = r.email.toLowerCase();
          if (key !== MY_EMAIL.toLowerCase()) {
            if (!participantsMap.has(key)) {
              participantsMap.set(key, {
                email: r.email,
                name: r.name || r.email,
                roles: new Set()
              });
            }
            participantsMap.get(key).roles.add('cc');
          }
        }
      });
    }
  }

  return {
    emails: Array.from(participantsMap.keys()),
    phones: [],
    type: 'email',
    participantsMap
  };
}

// Helper: Extract participants from WhatsApp chat
function extractWhatsAppParticipants(chat) {
  const messages = chat.messages || [chat];
  const phonesSet = new Set();

  messages.forEach(msg => {
    if (msg.contact_number) {
      const normalized = normalizePhone(msg.contact_number);
      if (normalized !== normalizePhone(MY_PHONE)) {
        phonesSet.add(normalized);
      }
    }
  });

  return {
    emails: [],
    phones: Array.from(phonesSet),
    type: 'whatsapp',
    participantsMap: null,
    isGroupChat: chat.is_group_chat || false,
    chatId: chat.chat_id || null  // external_chat_id from command_center_inbox
  };
}

// Helper: Extract participants from calendar event
function extractCalendarParticipants(event) {
  const participantsMap = new Map();

  // Attendees from calendar event (standard format)
  if (event.attendees && Array.isArray(event.attendees)) {
    event.attendees.forEach(attendee => {
      const email = attendee.email || attendee;
      if (typeof email === 'string' && email.includes('@')) {
        const key = email.toLowerCase();
        if (key !== MY_EMAIL.toLowerCase()) {
          if (!participantsMap.has(key)) {
            participantsMap.set(key, {
              email,
              name: attendee.name || attendee.displayName || email,
              roles: new Set(['attendee'])
            });
          }
        }
      }
    });
  }

  // to_recipients from ICS calendar events (can be JSON string or array)
  let recipients = event.to_recipients;
  if (recipients && typeof recipients === 'string') {
    try {
      recipients = JSON.parse(recipients);
    } catch (e) {
      recipients = [];
    }
  }
  if (recipients && Array.isArray(recipients)) {
    recipients.forEach(r => {
      // Handle both string format "MAILTO:email@domain.com" and object format {email: "...", name: "..."}
      let rawEmail = typeof r === 'string' ? r : r.email;
      let name = typeof r === 'object' ? r.name : null;

      if (rawEmail) {
        // Strip MAILTO: prefix from ICS format
        const cleanEmail = rawEmail.replace(/^MAILTO:/i, '');
        const key = cleanEmail.toLowerCase();
        if (key !== MY_EMAIL.toLowerCase()) {
          if (!participantsMap.has(key)) {
            participantsMap.set(key, {
              email: cleanEmail,
              name: name || cleanEmail,
              roles: new Set(['attendee'])
            });
          }
        }
      }
    });
  }

  // Organizer
  if (event.organizer?.email) {
    const key = event.organizer.email.toLowerCase();
    if (key !== MY_EMAIL.toLowerCase() && !participantsMap.has(key)) {
      participantsMap.set(key, {
        email: event.organizer.email,
        name: event.organizer.name || event.organizer.email,
        roles: new Set(['organizer'])
      });
    }
  }

  // from_email as organizer fallback (ICS events)
  if (event.from_email && !event.organizer) {
    const key = event.from_email.toLowerCase();
    if (key !== MY_EMAIL.toLowerCase() && !participantsMap.has(key)) {
      participantsMap.set(key, {
        email: event.from_email,
        name: event.from_name || event.from_email,
        roles: new Set(['organizer'])
      });
    }
  }

  return {
    emails: Array.from(participantsMap.keys()),
    phones: [],
    type: 'calendar',
    participantsMap
  };
}

// Helper: Normalize phone number for comparison
function normalizePhone(phone) {
  if (!phone) return '';
  // Remove all non-digit characters except leading +
  return phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
}

export default useContextContacts;
