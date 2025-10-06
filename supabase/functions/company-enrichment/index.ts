import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');
const APOLLO_ENRICH_URL = 'https://api.apollo.io/v1/organizations/enrich';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface EnrichmentRequest {
  companyId: string;
  website?: string;
  companyName?: string;
}

interface ApolloOrganization {
  id?: string;
  name?: string;
  domain?: string;
  website_url?: string;
  linkedin_url?: string;
  short_description?: string;
  long_description?: string;
  industries?: string[];
  keywords?: string[];
  industry?: string;
  subindustry?: string;
  estimated_num_employees?: number;
  annual_revenue?: number;
  total_funding?: number;
  latest_funding_round_date?: string;
  latest_funding_stage?: string;
  founded_year?: number;
  publicly_traded_symbol?: string;
  publicly_traded_exchange?: string;
  logo_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  primary_domain?: string;
  domains?: string[];
  organization_city?: string;
  organization_street_address?: string;
  organization_state?: string;
  organization_country?: string;
  organization_postal_code?: string;
  headquarters?: {
    city?: string;
    state?: string;
    country?: string;
    street_address?: string;
    postal_code?: string;
  };
  locations?: Array<{
    city?: string;
    state?: string;
    country?: string;
    street_address?: string;
    postal_code?: string;
    raw_address?: string;
  }>;
  phone?: string;
  technologies?: string[];
  technology_names?: string[];
}

interface EnrichmentResponse {
  success: boolean;
  data?: {
    description?: string;
    linkedin?: string;
    logo_url?: string;
    industries?: string[];
    tags?: string[];
    domains?: Array<{
      domain: string;
      is_primary: boolean;
    }>;
    locations?: Array<{
      city: string;
      state?: string;
      country?: string;
    }>;
    company_size?: number;
    founded_year?: number;
    revenue?: number;
    funding?: number;
    technologies?: string[];
    social_media?: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
    };
    confidence?: number;
  };
  error?: string;
  message?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const requestData: EnrichmentRequest = await req.json();
    const { companyId, website, companyName } = requestData;

    console.log('Company enrichment request:', { companyId, website, companyName });

    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Company ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch company from database if we need additional info
    let company: any = null;
    if (!website || !companyName) {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, website, description, linkedin')
        .eq('company_id', companyId)
        .single();

      if (error || !data) {
        console.error('Failed to fetch company:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Company not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      company = data;
    }

    // Use provided data or fallback to database data
    const searchDomain = website || company?.website;
    const searchName = companyName || company?.name;

    if (!searchDomain && !searchName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Either website or company name is required for enrichment'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare Apollo API request
    const processedDomain = searchDomain
      ? searchDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
      : null;

    let apolloRequestData: any = {
      api_key: APOLLO_API_KEY
    };

    // Try domain search first if available
    if (processedDomain) {
      apolloRequestData.domain = processedDomain;
    } else if (searchName) {
      // Fallback to name search
      apolloRequestData.q_organization_name = searchName;
    }

    console.log('Apollo API request:', apolloRequestData);

    // Call Apollo API
    const apolloResponse = await fetch(APOLLO_ENRICH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apolloRequestData),
    });

    const apolloData = await apolloResponse.json();
    console.log('Apollo API response status:', apolloResponse.status);
    console.log('Apollo API response:', JSON.stringify(apolloData).substring(0, 500));

    // If domain search failed and we have a name, try name search
    if (!apolloData.organization && processedDomain && searchName) {
      console.log('Domain search failed, trying name search...');

      apolloRequestData = {
        api_key: APOLLO_API_KEY,
        q_organization_name: searchName
      };

      const nameResponse = await fetch(APOLLO_ENRICH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apolloRequestData),
      });

      const nameData = await nameResponse.json();
      if (nameData.organization) {
        apolloData.organization = nameData.organization;
        console.log('Found organization via name search');
      }
    }

    if (!apolloData.organization) {
      console.log('No organization data found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No organization data found',
          message: 'Apollo API could not find matching organization data'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const org: ApolloOrganization = apolloData.organization;

    // Extract and structure enrichment data
    const enrichmentData: EnrichmentResponse = {
      success: true,
      data: {
        description: org.short_description || org.long_description || undefined,
        linkedin: org.linkedin_url || undefined,
        logo_url: org.logo_url || undefined,

        // Combine industries and keywords for tags
        industries: org.industries || (org.industry ? [org.industry] : []),
        tags: [
          ...(org.industries || []),
          ...(org.keywords || []),
          ...(org.subindustry ? [org.subindustry] : [])
        ].filter((tag, index, self) => tag && self.indexOf(tag) === index), // Remove duplicates

        // Extract domains
        domains: [
          ...(org.primary_domain ? [{
            domain: org.primary_domain,
            is_primary: true
          }] : []),
          ...(org.domains || []).map(d => ({
            domain: d,
            is_primary: d === org.primary_domain
          }))
        ].filter((d, index, self) =>
          d.domain && self.findIndex(item => item.domain === d.domain) === index
        ),

        // Extract locations
        locations: [
          ...(org.headquarters ? [{
            city: org.headquarters.city || '',
            state: org.headquarters.state,
            country: org.headquarters.country
          }] : []),
          ...(org.locations || []).map(loc => ({
            city: loc.city || '',
            state: loc.state,
            country: loc.country
          }))
        ].filter((loc, index, self) =>
          loc.city && self.findIndex(item =>
            item.city === loc.city && item.country === loc.country
          ) === index
        ),

        // Additional enrichment data
        company_size: org.estimated_num_employees,
        founded_year: org.founded_year,
        revenue: org.annual_revenue,
        funding: org.total_funding,
        technologies: org.technologies || org.technology_names || [],

        // Social media
        social_media: {
          facebook: org.facebook_url,
          twitter: org.twitter_url,
          linkedin: org.linkedin_url
        },

        // Confidence score based on data completeness
        confidence: calculateConfidence(org)
      }
    };

    console.log('Enrichment successful, returning data');

    return new Response(
      JSON.stringify(enrichmentData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in company enrichment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to process enrichment request'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Calculate confidence score based on data completeness
function calculateConfidence(org: ApolloOrganization): number {
  let score = 0;
  let maxScore = 0;

  // Critical fields (higher weight)
  const criticalFields = [
    { field: org.name, weight: 15 },
    { field: org.domain || org.primary_domain, weight: 15 },
    { field: org.short_description || org.long_description, weight: 20 },
    { field: org.linkedin_url, weight: 10 }
  ];

  // Important fields (medium weight)
  const importantFields = [
    { field: org.industries?.length, weight: 8 },
    { field: org.headquarters || org.organization_city, weight: 8 },
    { field: org.estimated_num_employees, weight: 6 },
    { field: org.founded_year, weight: 5 }
  ];

  // Nice to have fields (lower weight)
  const niceToHaveFields = [
    { field: org.annual_revenue, weight: 4 },
    { field: org.total_funding, weight: 3 },
    { field: org.technologies?.length, weight: 3 },
    { field: org.facebook_url || org.twitter_url, weight: 3 }
  ];

  // Calculate scores
  [...criticalFields, ...importantFields, ...niceToHaveFields].forEach(item => {
    maxScore += item.weight;
    if (item.field) {
      score += item.weight;
    }
  });

  return Math.round((score / maxScore) * 100);
}