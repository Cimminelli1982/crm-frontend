import { supabase } from '../lib/supabaseClient';

/**
 * Normalize email for comparison
 */
export const normalizeEmail = (email) => {
  if (!email) return null;
  return email.toLowerCase().trim();
};

/**
 * Normalize mobile number for comparison (remove spaces, dashes, etc.)
 */
export const normalizeMobile = (mobile) => {
  if (!mobile) return null;
  return mobile.replace(/[\s\-\(\)\.]/g, '');
};

/**
 * Normalize LinkedIn URL for comparison
 */
export const normalizeLinkedin = (url) => {
  if (!url) return null;
  const normalized = url.toLowerCase().trim();
  // Return null for empty strings to avoid matching empty values
  return normalized || null;
};

/**
 * Normalize domain for comparison
 */
export const normalizeDomain = (domain) => {
  if (!domain) return null;
  let normalized = domain.toLowerCase().trim();
  normalized = normalized.replace(/^https?:\/\//, '');
  normalized = normalized.replace(/^www\./, '');
  normalized = normalized.split('/')[0];
  normalized = normalized.split(':')[0];
  return normalized || null;
};

/**
 * Normalize company name for fuzzy comparison
 * Removes spaces, punctuation, common suffixes (.com, ltd, inc, etc.)
 */
export const normalizeCompanyName = (name) => {
  if (!name) return null;
  let normalized = name.toLowerCase().trim();
  // Remove common domain suffixes
  normalized = normalized.replace(/\.(com|net|org|io|co|uk|it|de|fr|es|eu)$/gi, '');
  // Remove common company suffixes
  normalized = normalized.replace(/\s*(ltd|llc|inc|corp|srl|spa|gmbh|sa|ag|plc)\.?$/gi, '');
  // Remove all spaces and punctuation
  normalized = normalized.replace(/[\s\-\_\.\,\'\"\&\+]/g, '');
  return normalized || null;
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;

  // Create a matrix
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
};

/**
 * Check if two company names are similar (fuzzy match)
 */
export const areCompanyNamesSimilar = (name1, name2) => {
  const n1 = normalizeCompanyName(name1);
  const n2 = normalizeCompanyName(name2);

  if (!n1 || !n2) return false;

  // Exact match after normalization
  if (n1 === n2) return true;

  // One contains the other (min 4 chars)
  if (n1.length >= 4 && n2.includes(n1)) return true;
  if (n2.length >= 4 && n1.includes(n2)) return true;

  // One starts with the other (min 4 chars)
  if (n1.length >= 4 && n2.startsWith(n1)) return true;
  if (n2.length >= 4 && n1.startsWith(n2)) return true;

  // Similar length and share significant prefix (80% of shorter name)
  const shorter = n1.length < n2.length ? n1 : n2;
  const longer = n1.length < n2.length ? n2 : n1;
  const prefixLen = Math.floor(shorter.length * 0.8);
  if (prefixLen >= 4 && longer.startsWith(shorter.slice(0, prefixLen))) return true;

  // Levenshtein distance check - allow small differences for longer names
  // For names 8+ chars, allow up to 2 edits; for 5-7 chars, allow 1 edit
  if (n1.length >= 5 && n2.length >= 5) {
    const distance = levenshteinDistance(n1, n2);
    const maxLen = Math.max(n1.length, n2.length);

    // Allow ~15% difference (e.g., 2 edits for 13-char string)
    const maxAllowedDistance = Math.max(1, Math.floor(maxLen * 0.15));

    if (distance <= maxAllowedDistance) return true;
  }

  return false;
};

/**
 * Find duplicate contacts based on email, mobile, linkedin, and name matching
 * @param {string} contactId - The contact ID to find duplicates for
 * @param {Array} emails - Array of email objects with 'email' property
 * @param {Array} mobiles - Array of mobile objects with 'mobile' property
 * @param {string} linkedin - LinkedIn URL
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {Promise<Array>} Array of duplicate objects
 */
export const findContactDuplicates = async (contactId, emails = [], mobiles = [], linkedin = '', firstName = '', lastName = '') => {
  if (!contactId) return [];

  const foundDuplicates = [];

  try {
    // 1. Check for same email duplicates
    if (emails.length > 0) {
      const emailAddresses = emails.map(e => normalizeEmail(e.email)).filter(Boolean);
      if (emailAddresses.length > 0) {
        const { data: emailMatches } = await supabase
          .from('contact_emails')
          .select('contact_id, email')
          .in('email', emailAddresses)
          .neq('contact_id', contactId);

        if (emailMatches && emailMatches.length > 0) {
          const uniqueContactIds = [...new Set(emailMatches.map(m => m.contact_id))];
          const { data: contactsData } = await supabase
            .from('contacts')
            .select('contact_id, first_name, last_name')
            .in('contact_id', uniqueContactIds);

          (contactsData || []).forEach(c => {
            const matchedEmail = emailMatches.find(m => m.contact_id === c.contact_id)?.email;
            foundDuplicates.push({
              id: `email-${c.contact_id}`,
              duplicate_id: c.contact_id,
              duplicate: c,
              match_type: 'email',
              match_details: { value: matchedEmail }
            });
          });
        }
      }
    }

    // 2. Check for same mobile duplicates
    if (mobiles.length > 0) {
      const mobileNumbers = mobiles.map(m => normalizeMobile(m.mobile)).filter(Boolean);
      if (mobileNumbers.length > 0) {
        const { data: mobileMatches } = await supabase
          .from('contact_mobiles')
          .select('contact_id, mobile')
          .neq('contact_id', contactId);

        const matchingMobiles = (mobileMatches || []).filter(m =>
          mobileNumbers.some(num => normalizeMobile(m.mobile) === num)
        );

        if (matchingMobiles.length > 0) {
          const uniqueContactIds = [...new Set(matchingMobiles.map(m => m.contact_id))];
          const { data: contactsData } = await supabase
            .from('contacts')
            .select('contact_id, first_name, last_name')
            .in('contact_id', uniqueContactIds);

          (contactsData || []).forEach(c => {
            if (!foundDuplicates.some(d => d.duplicate_id === c.contact_id)) {
              const matchedMobile = matchingMobiles.find(m => m.contact_id === c.contact_id)?.mobile;
              foundDuplicates.push({
                id: `mobile-${c.contact_id}`,
                duplicate_id: c.contact_id,
                duplicate: c,
                match_type: 'mobile',
                match_details: { value: matchedMobile }
              });
            }
          });
        }
      }
    }

    // 3. Check for same LinkedIn duplicates
    if (linkedin?.trim()) {
      const linkedinUrl = normalizeLinkedin(linkedin);
      // Skip if normalized URL is null/empty
      if (linkedinUrl) {
        const { data: linkedinMatches } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name, linkedin')
          .neq('contact_id', contactId)
          .not('linkedin', 'is', null);

        const matchingLinkedin = (linkedinMatches || []).filter(c => {
          const normalizedMatch = normalizeLinkedin(c.linkedin);
          // Both must be non-null to match
          return normalizedMatch && normalizedMatch === linkedinUrl;
        });

        matchingLinkedin.forEach(c => {
          if (!foundDuplicates.some(d => d.duplicate_id === c.contact_id)) {
            foundDuplicates.push({
              id: `linkedin-${c.contact_id}`,
              duplicate_id: c.contact_id,
              duplicate: c,
              match_type: 'linkedin',
              match_details: { value: c.linkedin }
            });
          }
        });
      }
    }

    // 4. Check for similar names (fuzzy matching)
    if (firstName?.trim()) {
      const firstNameLower = firstName.toLowerCase().trim();
      const lastNameLower = (lastName || '').toLowerCase().trim();

      const { data: nameMatches } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name')
        .neq('contact_id', contactId)
        .ilike('first_name', firstNameLower);

      const similarNames = (nameMatches || []).filter(c => {
        const cFirstName = (c.first_name || '').toLowerCase().trim();
        const cLastName = (c.last_name || '').toLowerCase().trim();

        // Exact first name match required
        if (cFirstName !== firstNameLower) return false;

        // Check last name similarity
        if (lastNameLower && cLastName) {
          // Exact match
          if (cLastName === lastNameLower) return true;
          // One starts with the other (min 3 chars)
          if (lastNameLower.length >= 3 && cLastName.startsWith(lastNameLower)) return true;
          if (cLastName.length >= 3 && lastNameLower.startsWith(cLastName)) return true;
          // Allow 1-2 char difference for longer names
          if (lastNameLower.length >= 4 && cLastName.length >= 4) {
            const maxLen = Math.max(lastNameLower.length, cLastName.length);
            const minLen = Math.min(lastNameLower.length, cLastName.length);
            if (maxLen - minLen <= 2 && (cLastName.includes(lastNameLower.slice(0, 3)) || lastNameLower.includes(cLastName.slice(0, 3)))) {
              return true;
            }
          }
        } else if (!lastNameLower && !cLastName) {
          // Both have no last name but same first name
          return true;
        }

        return false;
      });

      similarNames.forEach(c => {
        if (!foundDuplicates.some(d => d.duplicate_id === c.contact_id)) {
          foundDuplicates.push({
            id: `name-${c.contact_id}`,
            duplicate_id: c.contact_id,
            duplicate: c,
            match_type: 'name',
            match_details: { similarity: 0.9 }
          });
        }
      });
    }

  } catch (error) {
    console.error('Error finding contact duplicates:', error);
  }

  return foundDuplicates;
};

/**
 * Find duplicate companies based on linkedin, website, domain, and name matching
 * @param {string} companyId - The company ID to find duplicates for
 * @param {Object} companyData - Company object with name, linkedin, website
 * @param {Array} domains - Array of domain objects with 'domain' property
 * @returns {Promise<Array>} Array of duplicate objects
 */
export const findCompanyDuplicates = async (companyId, companyData = {}, domains = []) => {
  if (!companyId) return [];

  const foundDuplicates = [];

  try {
    // 1. Same LinkedIn URL
    if (companyData?.linkedin?.trim()) {
      const { data } = await supabase
        .from('companies')
        .select('company_id, name, linkedin')
        .neq('company_id', companyId)
        .eq('linkedin', companyData.linkedin.trim());

      if (data?.length) {
        data.forEach(d => {
          foundDuplicates.push({
            company_id: d.company_id,
            name: d.name,
            match_type: 'linkedin',
            match_value: d.linkedin
          });
        });
      }
    }

    // 2. Same website
    if (companyData?.website?.trim()) {
      const { data } = await supabase
        .from('companies')
        .select('company_id, name, website')
        .neq('company_id', companyId)
        .eq('website', companyData.website.trim());

      if (data?.length) {
        data.forEach(d => {
          if (!foundDuplicates.some(f => f.company_id === d.company_id)) {
            foundDuplicates.push({
              company_id: d.company_id,
              name: d.name,
              match_type: 'website',
              match_value: d.website
            });
          }
        });
      }
    }

    // 3. Same domain
    if (domains?.length > 0) {
      const domainValues = domains.map(d => d.domain).filter(Boolean);
      if (domainValues.length > 0) {
        const { data } = await supabase
          .from('company_domains')
          .select('company_id, domain, companies(name)')
          .in('domain', domainValues)
          .neq('company_id', companyId);

        if (data?.length) {
          data.forEach(d => {
            if (!foundDuplicates.some(f => f.company_id === d.company_id)) {
              foundDuplicates.push({
                company_id: d.company_id,
                name: d.companies?.name || 'Unknown',
                match_type: 'domain',
                match_value: d.domain
              });
            }
          });
        }
      }
    }

    // 4. Similar name (fuzzy matching)
    if (companyData?.name?.trim()) {
      const normalizedSearchName = normalizeCompanyName(companyData.name);

      if (normalizedSearchName && normalizedSearchName.length >= 4) {
        // Search directly for companies with similar names using SQL ILIKE
        // This avoids Supabase's default 1000 row limit
        const { data } = await supabase
          .from('companies')
          .select('company_id, name, category')
          .neq('company_id', companyId)
          .or(`name.ilike.%${normalizedSearchName}%,name.ilike.${companyData.name}`)
          .limit(100);

        if (data?.length) {
          data.forEach(d => {
            if (areCompanyNamesSimilar(companyData.name, d.name)) {
              if (!foundDuplicates.some(f => f.company_id === d.company_id)) {
                foundDuplicates.push({
                  company_id: d.company_id,
                  name: d.name,
                  category: d.category,
                  match_type: 'name',
                  match_value: d.name
                });
              }
            }
          });
        }
      }
    }

    // 5. Check existing duplicates table (pending status)
    const { data: existingDuplicates } = await supabase
      .from('company_duplicates')
      .select('*')
      .or(`primary_company_id.eq.${companyId},duplicate_company_id.eq.${companyId}`)
      .eq('status', 'pending');

    if (existingDuplicates?.length) {
      for (const dup of existingDuplicates) {
        const otherCompanyId = dup.primary_company_id === companyId
          ? dup.duplicate_company_id
          : dup.primary_company_id;

        if (!foundDuplicates.some(f => f.company_id === otherCompanyId)) {
          const { data: otherCompany } = await supabase
            .from('companies')
            .select('name')
            .eq('company_id', otherCompanyId)
            .single();

          foundDuplicates.push({
            company_id: otherCompanyId,
            name: otherCompany?.name || 'Unknown',
            match_type: 'detected',
            match_value: 'Previously detected',
            duplicate_id: dup.duplicate_id
          });
        }
      }
    }

  } catch (error) {
    console.error('Error finding company duplicates:', error);
  }

  return foundDuplicates;
};

/**
 * Find contact duplicates for a thread (thread-aware version)
 * Filters results to only include duplicates where at least one contact has email in thread
 * @param {Map} threadParticipants - Map of email -> { email, name } from thread
 * @returns {Promise<Array>} Array of duplicate objects filtered by thread
 */
export const findContactDuplicatesForThread = async (threadParticipants) => {
  if (!threadParticipants || threadParticipants.size === 0) return [];

  const allDuplicates = [];
  const participantEmails = Array.from(threadParticipants.keys());

  try {
    // Find contacts that match thread participant emails
    const { data: contactEmails } = await supabase
      .from('contact_emails')
      .select('contact_id, email')
      .in('email', participantEmails);

    if (!contactEmails || contactEmails.length === 0) return [];

    // Get unique contact IDs
    const contactIds = [...new Set(contactEmails.map(ce => ce.contact_id))];

    // For each contact, find duplicates
    for (const contactId of contactIds) {
      // Get contact details
      const { data: contact } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, linkedin')
        .eq('contact_id', contactId)
        .single();

      if (!contact) continue;

      // Get contact emails
      const { data: emails } = await supabase
        .from('contact_emails')
        .select('email')
        .eq('contact_id', contactId);

      // Get contact mobiles
      const { data: mobiles } = await supabase
        .from('contact_mobiles')
        .select('mobile')
        .eq('contact_id', contactId);

      // Find duplicates for this contact
      const duplicates = await findContactDuplicates(
        contactId,
        emails || [],
        mobiles || [],
        contact.linkedin,
        contact.first_name,
        contact.last_name
      );

      // Add source contact info and ensure UI compatibility
      duplicates.forEach(dup => {
        dup.source = contact;
        dup.source_id = contactId;
        dup.entity_type = 'contact';
        // duplicate and duplicate_id should already be set by findContactDuplicates

        // Avoid adding the same duplicate pair twice
        if (!allDuplicates.some(d =>
          (d.source_id === dup.source_id && d.duplicate_id === dup.duplicate_id) ||
          (d.source_id === dup.duplicate_id && d.duplicate_id === dup.source_id)
        )) {
          allDuplicates.push(dup);
        }
      });
    }

  } catch (error) {
    console.error('Error finding contact duplicates for thread:', error);
  }

  return allDuplicates;
};

/**
 * Find company duplicates for a thread (thread-aware version)
 * Filters results to only include duplicates where at least one company has domain in thread
 * @param {Set} threadDomains - Set of domains from thread participants
 * @returns {Promise<Array>} Array of duplicate objects filtered by thread
 */
export const findCompanyDuplicatesForThread = async (threadDomains) => {
  if (!threadDomains || threadDomains.size === 0) return [];

  const allDuplicates = [];
  const domainList = Array.from(threadDomains);

  try {
    // Find companies that match thread domains
    const { data: companyDomains } = await supabase
      .from('company_domains')
      .select('company_id, domain')
      .in('domain', domainList);

    if (!companyDomains || companyDomains.length === 0) return [];

    // Get unique company IDs
    const companyIds = [...new Set(companyDomains.map(cd => cd.company_id))];

    // For each company, find duplicates
    for (const companyId of companyIds) {
      // Get company details
      const { data: company } = await supabase
        .from('companies')
        .select('company_id, name, linkedin, website')
        .eq('company_id', companyId)
        .single();

      if (!company) continue;

      // Get company domains
      const { data: domains } = await supabase
        .from('company_domains')
        .select('domain')
        .eq('company_id', companyId);

      // Find duplicates for this company
      const duplicates = await findCompanyDuplicates(
        companyId,
        company,
        domains || []
      );

      // Add source company info and restructure for UI compatibility
      duplicates.forEach(dup => {
        // Create structure that matches UI expectations
        dup.source = company;
        dup.source_id = companyId;
        dup.duplicate_id = dup.company_id;
        dup.duplicate = {
          name: dup.name,
          company_id: dup.company_id,
          category: dup.category || null
        };
        dup.entity_type = 'company';

        // Avoid adding the same duplicate pair twice
        if (!allDuplicates.some(d =>
          (d.source_id === dup.source_id && d.duplicate_id === dup.duplicate_id) ||
          (d.source_id === dup.duplicate_id && d.duplicate_id === dup.source_id)
        )) {
          allDuplicates.push(dup);
        }
      });
    }

  } catch (error) {
    console.error('Error finding company duplicates for thread:', error);
  }

  return allDuplicates;
};
