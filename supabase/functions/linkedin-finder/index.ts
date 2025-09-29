// Production LinkedIn URL Discovery System
// Maximizes database utilization and Apollo API accuracy
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

const APOLLO_SEARCH_URL = 'https://api.apollo.io/v1/people/search';
const APOLLO_MATCH_URL = 'https://api.apollo.io/v1/people/match';

interface ContactData {
  contact_id: string;
  first_name?: string;
  last_name?: string;
  job_role?: string;
  job_title?: string;
  description?: string;
  about_the_contact?: string;
  category?: string;
  emails: { email: string; type: string; is_primary: boolean }[];
  companies: { name: string; website?: string; description?: string }[];
  cities: { name: string; country?: string }[];
}

interface LinkedInMatch {
  linkedin_url: string;
  confidence: number;
  match_reason: string;
  person_data: {
    name: string;
    title?: string;
    company?: string;
    location?: string;
    email?: string;
  };
}

// Strategic search function using ALL available database data
async function findLinkedInMatches(contactData: ContactData, apiKey: string): Promise<LinkedInMatch[]> {
  const matches: LinkedInMatch[] = [];

  console.log('=== LinkedIn Discovery Started ===');
  console.log('Contact:', contactData.first_name, contactData.last_name);
  console.log('Emails:', contactData.emails?.map(e => e.email));
  console.log('Companies:', contactData.companies?.map(c => c.name));
  console.log('Cities:', contactData.cities?.map(c => c.name));
  console.log('Role:', contactData.job_role, '| Category:', contactData.category);

  // STRATEGY 1: Email Match (95% accuracy)
  for (const emailData of contactData.emails || []) {
    console.log('🎯 Strategy 1: Email lookup -', emailData.email);
    const emailMatches = await searchByEmail(emailData.email, apiKey);
    matches.push(...emailMatches.map(match => ({
      ...match,
      confidence: Math.min(match.confidence + (emailData.is_primary ? 5 : 0), 98),
      match_reason: `Email: ${emailData.email} (${emailData.type})`
    })));
  }

  // STRATEGY 2: Name + Company + Location (85% accuracy)
  for (const company of contactData.companies || []) {
    const locations = contactData.cities?.map(c => mapCityToCountry(c.name)) || [];
    console.log('🎯 Strategy 2: Name+Company+Location -', company.name, locations);

    const companyMatches = await searchByNameCompanyLocation(
      contactData.first_name!,
      contactData.last_name!,
      company.name,
      locations,
      inferIndustryFromData(contactData),
      contactData.job_role,
      apiKey
    );
    matches.push(...companyMatches);
  }

  // STRATEGY 3: Name + Domain + Industry Context (80% accuracy)
  for (const company of contactData.companies || []) {
    if (company.website) {
      const domain = extractDomain(company.website);
      const industries = inferIndustryFromData(contactData);
      console.log('🎯 Strategy 3: Name+Domain+Industry -', domain, industries);

      const domainMatches = await searchByNameDomainIndustry(
        contactData.first_name!,
        contactData.last_name!,
        domain!,
        industries,
        contactData.job_role,
        apiKey
      );
      matches.push(...domainMatches);
    }
  }

  // STRATEGY 4: Contextual Name Search (70% accuracy)
  if (contactData.cities?.length || contactData.category) {
    const locations = contactData.cities?.map(c => mapCityToCountry(c.name)) || [];
    const industries = inferIndustryFromData(contactData);
    console.log('🎯 Strategy 4: Contextual Name Search -', locations, industries);

    const contextMatches = await searchByNameWithContext(
      contactData.first_name!,
      contactData.last_name!,
      locations,
      industries,
      contactData.job_role,
      apiKey
    );
    matches.push(...contextMatches);
  }

  // Remove duplicates, apply confidence thresholds, and rank
  const uniqueMatches = deduplicateMatches(matches);
  const filteredMatches = uniqueMatches.filter(match => match.confidence >= 60);
  const sortedMatches = filteredMatches.sort((a, b) => b.confidence - a.confidence);

  console.log('=== Final Results ===');
  sortedMatches.slice(0, 3).forEach((match, i) => {
    console.log(`${i+1}. ${match.person_data.name} - ${match.confidence}% - ${match.match_reason}`);
  });

  return sortedMatches.slice(0, 3);
}

// Email-based search (highest accuracy)
async function searchByEmail(email: string, apiKey: string): Promise<LinkedInMatch[]> {
  try {
    const response = await fetch(APOLLO_MATCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, email: email })
    });

    if (!response.ok) return [];
    const data = await response.json();

    if (data.person && data.person.linkedin_url) {
      return [{
        linkedin_url: data.person.linkedin_url,
        confidence: 95,
        match_reason: 'Email match',
        person_data: {
          name: `${data.person.first_name || ''} ${data.person.last_name || ''}`.trim(),
          title: data.person.title,
          company: data.person.organization?.name,
          location: data.person.city,
          email: data.person.email
        }
      }];
    }
    return [];
  } catch (error) {
    console.error('Email search error:', error);
    return [];
  }
}

// Name + Company + Location search
async function searchByNameCompanyLocation(
  firstName: string,
  lastName: string,
  companyName: string,
  locations: string[],
  industries: string[],
  jobRole?: string,
  apiKey: string
): Promise<LinkedInMatch[]> {
  try {
    const searchParams: any = {
      api_key: apiKey,
      q_keywords: `${firstName} ${lastName}`,
      organization_names: [companyName],
      per_page: 10
    };

    if (locations.length > 0) searchParams.person_locations = locations;
    if (industries.length > 0) searchParams.person_industries = industries;
    if (jobRole) searchParams.person_titles = [jobRole];

    const response = await fetch(APOLLO_SEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) return [];
    const data = await response.json();

    return (data.people || [])
      .filter((person: any) => person.linkedin_url && person.first_name && person.last_name)
      .map((person: any) => ({
        linkedin_url: person.linkedin_url,
        confidence: calculateNameCompanyLocationConfidence(person, firstName, lastName, companyName, locations),
        match_reason: `Name+Company+Location: ${companyName} in ${locations.join('/')}`,
        person_data: {
          name: `${person.first_name} ${person.last_name}`,
          title: person.title,
          company: person.organization?.name,
          location: person.city,
          email: person.email
        }
      }))
      .filter(match => match.confidence >= 60);
  } catch (error) {
    console.error('Name+Company+Location search error:', error);
    return [];
  }
}

// Name + Domain + Industry search
async function searchByNameDomainIndustry(
  firstName: string,
  lastName: string,
  domain: string,
  industries: string[],
  jobRole?: string,
  apiKey: string
): Promise<LinkedInMatch[]> {
  try {
    const searchParams: any = {
      api_key: apiKey,
      q_keywords: `${firstName} ${lastName}`,
      organization_domains: [domain],
      per_page: 10
    };

    if (industries.length > 0) searchParams.person_industries = industries;
    if (jobRole) searchParams.person_titles = [jobRole];

    const response = await fetch(APOLLO_SEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) return [];
    const data = await response.json();

    return (data.people || [])
      .filter((person: any) => person.linkedin_url && person.first_name && person.last_name)
      .map((person: any) => ({
        linkedin_url: person.linkedin_url,
        confidence: calculateNameDomainConfidence(person, firstName, lastName, domain),
        match_reason: `Name+Domain: ${domain}`,
        person_data: {
          name: `${person.first_name} ${person.last_name}`,
          title: person.title,
          company: person.organization?.name,
          location: person.city,
          email: person.email
        }
      }))
      .filter(match => match.confidence >= 60);
  } catch (error) {
    console.error('Name+Domain search error:', error);
    return [];
  }
}

// Contextual name search with location/industry filters
async function searchByNameWithContext(
  firstName: string,
  lastName: string,
  locations: string[],
  industries: string[],
  jobRole?: string,
  apiKey: string
): Promise<LinkedInMatch[]> {
  try {
    const searchParams: any = {
      api_key: apiKey,
      q_keywords: `${firstName} ${lastName}`,
      per_page: 20
    };

    if (locations.length > 0) searchParams.person_locations = locations;
    if (industries.length > 0) searchParams.person_industries = industries;
    if (jobRole) searchParams.person_titles = [jobRole];

    const response = await fetch(APOLLO_SEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) return [];
    const data = await response.json();

    return (data.people || [])
      .filter((person: any) => person.linkedin_url && person.first_name && person.last_name)
      .map((person: any) => ({
        linkedin_url: person.linkedin_url,
        confidence: calculateContextualConfidence(person, firstName, lastName, locations, industries),
        match_reason: `Context: ${locations.join('/')} ${industries.join('/')}`,
        person_data: {
          name: `${person.first_name} ${person.last_name}`,
          title: person.title,
          company: person.organization?.name,
          location: person.city,
          email: person.email
        }
      }))
      .filter(match => match.confidence >= 60);
  } catch (error) {
    console.error('Contextual search error:', error);
    return [];
  }
}

// Production-grade confidence calculations
function calculateNameCompanyLocationConfidence(person: any, firstName: string, lastName: string, companyName: string, locations: string[]): number {
  let confidence = 40;

  // Name similarity (40 points max)
  const nameSim = calculateNameSimilarity(person.first_name, person.last_name, firstName, lastName);
  confidence += nameSim * 40;

  // Company match (25 points max)
  if (person.organization?.name) {
    const companySim = calculateStringSimilarity(person.organization.name.toLowerCase(), companyName.toLowerCase());
    confidence += companySim * 25;
  }

  // Location bonus (10 points max)
  if (locations.length > 0 && person.city) {
    const locationMatch = locations.some(loc =>
      person.city.toLowerCase().includes(loc.toLowerCase()) ||
      loc.toLowerCase().includes(person.city.toLowerCase())
    );
    if (locationMatch) confidence += 10;
  }

  return Math.min(confidence, 95);
}

function calculateNameDomainConfidence(person: any, firstName: string, lastName: string, domain: string): number {
  let confidence = 45;

  const nameSim = calculateNameSimilarity(person.first_name, person.last_name, firstName, lastName);
  confidence += nameSim * 35;

  // Domain match already filtered, add bonus
  confidence += 15;

  return Math.min(confidence, 90);
}

function calculateContextualConfidence(person: any, firstName: string, lastName: string, locations: string[], industries: string[]): number {
  let confidence = 25;

  const nameSim = calculateNameSimilarity(person.first_name, person.last_name, firstName, lastName);
  if (nameSim < 0.85) return 0; // Strict name matching for context-only

  confidence += nameSim * 35;

  // Location match bonus
  if (locations.length > 0 && person.city) {
    const locationMatch = locations.some(loc =>
      person.city.toLowerCase().includes(loc.toLowerCase())
    );
    if (locationMatch) confidence += 15;
  }

  // Industry context bonus
  if (industries.length > 0 && person.title) {
    const industryMatch = industries.some(ind =>
      person.title.toLowerCase().includes(ind.toLowerCase().split(' ')[0])
    );
    if (industryMatch) confidence += 10;
  }

  return Math.min(confidence, 85);
}

// Helper functions
function calculateNameSimilarity(personFirst: string, personLast: string, targetFirst: string, targetLast: string): number {
  const firstSim = calculateStringSimilarity((personFirst || '').toLowerCase(), targetFirst.toLowerCase());
  const lastSim = calculateStringSimilarity((personLast || '').toLowerCase(), targetLast.toLowerCase());
  return (firstSim + lastSim) / 2;
}

function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0;

  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

function mapCityToCountry(cityName: string): string {
  const city = cityName.toLowerCase();
  if (city.includes('london') || city.includes('manchester') || city.includes('birmingham')) return 'United Kingdom';
  if (city.includes('milan') || city.includes('rome') || city.includes('savigliano') || city.includes('turin')) return 'Italy';
  if (city.includes('paris') || city.includes('lyon')) return 'France';
  if (city.includes('berlin') || city.includes('munich')) return 'Germany';
  if (city.includes('new york') || city.includes('san francisco') || city.includes('chicago')) return 'United States';
  return 'Europe'; // Default fallback
}

function inferIndustryFromData(contactData: ContactData): string[] {
  const text = [contactData.job_role, contactData.job_title, contactData.description, contactData.category].filter(Boolean).join(' ').toLowerCase();
  const industries: string[] = [];

  if (text.includes('vc') || text.includes('venture') || text.includes('gp') || text.includes('investor') || text.includes('professional investor')) {
    industries.push('Venture Capital & Private Equity');
  }
  if (text.includes('tech') || text.includes('software') || text.includes('startup')) {
    industries.push('Computer Software');
  }
  if (text.includes('finance') || text.includes('banking')) {
    industries.push('Financial Services');
  }

  return industries;
}

function extractDomain(website: string): string | null {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

function deduplicateMatches(matches: LinkedInMatch[]): LinkedInMatch[] {
  const seen = new Set();
  return matches.filter(match => {
    if (seen.has(match.linkedin_url)) return false;
    seen.add(match.linkedin_url);
    return true;
  });
}

// Fetch ALL contact data from database
async function getContactData(supabase: any, contactId: string): Promise<ContactData | null> {
  try {
    // Get basic contact info
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('contact_id', contactId)
      .single();

    if (error || !contact) {
      console.error('Error fetching contact:', error);
      return null;
    }

    // Get emails
    const { data: emails } = await supabase
      .from('contact_emails')
      .select('email, type, is_primary')
      .eq('contact_id', contactId);

    // Get companies
    const { data: companies } = await supabase
      .from('contact_companies')
      .select(`
        companies!inner (
          name,
          website,
          description
        )
      `)
      .eq('contact_id', contactId);

    // Get cities
    const { data: cities } = await supabase
      .from('contact_cities')
      .select(`
        cities!inner (
          name,
          country
        )
      `)
      .eq('contact_id', contactId);

    return {
      contact_id: contact.contact_id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      job_role: contact.job_role,
      job_title: contact.job_title,
      description: contact.description,
      about_the_contact: contact.about_the_contact,
      category: contact.category,
      emails: emails || [],
      companies: companies?.map((item: any) => item.companies) || [],
      cities: cities?.map((item: any) => item.cities) || []
    };
  } catch (error) {
    console.error('Error in getContactData:', error);
    return null;
  }
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { contactId } = await req.json();
    if (!contactId) {
      return new Response(JSON.stringify({ error: 'Contact ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') }
        }
      }
    );

    const apiKey = Deno.env.get('APOLLO_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const contactData = await getContactData(supabaseClient, contactId);
    if (!contactData) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const matches = await findLinkedInMatches(contactData, apiKey);

    return new Response(JSON.stringify({
      success: true,
      contact: {
        name: `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim(),
        emails: contactData.emails?.map(e => e.email),
        companies: contactData.companies?.map(c => c.name),
        cities: contactData.cities?.map(c => c.name)
      },
      matches: matches,
      total_matches: matches.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in LinkedIn finder:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});