import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Custom hook to handle company suggestions for contacts
 * Manages fetching and processing company suggestions based on contact email domains
 */
export const useCompanySuggestions = (contacts, pageContext) => {
  const [companySuggestions, setCompanySuggestions] = useState({});

  // Extract domain from email (skip generic providers)
  const extractBusinessDomain = (email) => {
    if (!email) return null;
    const domain = email.split('@')[1]?.toLowerCase();
    const genericDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'icloud.com', 'me.com', 'aol.com', 'protonmail.com'
    ];
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
    // Debug logs removed

    const loadSuggestions = async () => {
      const suggestions = {};
      const contactsWithoutCompanies = contacts.filter(contact => !contact.companies?.[0]);

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

  return {
    companySuggestions,
    setCompanySuggestions,
    fetchCompanySuggestion,
    extractBusinessDomain
  };
};