// Supabase Edge Function for Company LinkedIn URL Discovery
// Uses Apollo.io to find LinkedIn URLs for companies based on domain/website

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Apollo API configuration
const APOLLO_ORG_ENRICH_URL = 'https://api.apollo.io/v1/organizations/enrich';

interface CompanyData {
  company_id: string;
  name: string;
  website?: string;
  linkedin?: string;
}

interface LinkedInMatch {
  linkedin_url: string;
  confidence: number;
  match_reason: string;
  company_data?: {
    name: string;
    domain?: string;
    industry?: string;
    size?: string;
  };
}

// Find LinkedIn URL for company
async function findCompanyLinkedIn(
  supabase: SupabaseClient,
  companyId: string,
  website: string,
  companyName: string,
  apiKey: string
): Promise<{ success: boolean; linkedin?: string; data?: any; error?: string }> {
  console.log('=== Company LinkedIn Discovery Started ===');
  console.log('Company:', companyName);
  console.log('Website:', website);

  try {
    // Clean the domain
    const cleanDomain = website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .toLowerCase();

    console.log('Clean domain:', cleanDomain);

    // Try Apollo organization enrichment by domain
    const apolloRequestData = {
      api_key: apiKey,
      domain: cleanDomain
    };

    console.log('Calling Apollo API for domain:', cleanDomain);

    const apolloResponse = await fetch(APOLLO_ORG_ENRICH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apolloRequestData),
    });

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error('Apollo API error:', errorText);

      // If domain search fails, try by company name
      return tryCompanyNameSearch(companyName, apiKey);
    }

    const apolloData = await apolloResponse.json();
    console.log('Apollo response received');

    if (apolloData.organization?.linkedin_url) {
      console.log('✅ LinkedIn URL found:', apolloData.organization.linkedin_url);

      return {
        success: true,
        linkedin: apolloData.organization.linkedin_url,
        data: {
          linkedin_url: apolloData.organization.linkedin_url,
          confidence: 95,
          match_reason: 'Domain match',
          company_data: {
            name: apolloData.organization.name || companyName,
            domain: cleanDomain,
            industry: apolloData.organization.industry,
            size: apolloData.organization.estimated_num_employees
          }
        }
      };
    }

    // If no LinkedIn found via domain, try company name
    console.log('No LinkedIn found via domain, trying company name search...');
    return tryCompanyNameSearch(companyName, apiKey);

  } catch (error) {
    console.error('Error in findCompanyLinkedIn:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Fallback: Try searching by company name
async function tryCompanyNameSearch(
  companyName: string,
  apiKey: string
): Promise<{ success: boolean; linkedin?: string; data?: any; error?: string }> {
  try {
    console.log('Attempting company name search for:', companyName);

    // Clean company name for search
    const cleanName = companyName
      .replace(/\s+(Inc|LLC|Ltd|Corp|Corporation|Co|Company)\.?$/i, '')
      .trim();

    const apolloRequestData = {
      api_key: apiKey,
      q_organization_name: cleanName
    };

    const apolloResponse = await fetch(APOLLO_ORG_ENRICH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apolloRequestData),
    });

    if (!apolloResponse.ok) {
      console.error('Apollo name search failed');
      return {
        success: false,
        error: 'No LinkedIn URL found for this company'
      };
    }

    const apolloData = await apolloResponse.json();

    if (apolloData.organization?.linkedin_url) {
      console.log('✅ LinkedIn URL found via name search:', apolloData.organization.linkedin_url);

      return {
        success: true,
        linkedin: apolloData.organization.linkedin_url,
        data: {
          linkedin_url: apolloData.organization.linkedin_url,
          confidence: 80,
          match_reason: 'Company name match',
          company_data: {
            name: apolloData.organization.name || companyName,
            industry: apolloData.organization.industry,
            size: apolloData.organization.estimated_num_employees
          }
        }
      };
    }

    console.log('❌ No LinkedIn URL found');
    return {
      success: false,
      error: 'No LinkedIn URL found for this company'
    };

  } catch (error) {
    console.error('Error in company name search:', error);
    return {
      success: false,
      error: 'Failed to search by company name'
    };
  }
}

// Main handler
Deno.serve(async (req) => {
  console.log('Company LinkedIn finder function called');

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const requestData = await req.json();
    const { companyId, website, companyName } = requestData;

    console.log('Request data:', { companyId, website, companyName });

    if (!companyId || (!website && !companyName)) {
      return new Response(
        JSON.stringify({ error: 'Company ID and either website or company name are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const apiKey = Deno.env.get('APOLLO_API_KEY');
    if (!apiKey) {
      console.error('Missing APOLLO_API_KEY environment variable');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing API key' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If no website provided, try to get it from the database
    let websiteToUse = website;
    if (!websiteToUse) {
      console.log('No website provided, checking database...');

      // Check company_domains table first
      const { data: domains } = await supabaseClient
        .from('company_domains')
        .select('domain, is_primary')
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false })
        .limit(1);

      if (domains && domains.length > 0) {
        websiteToUse = domains[0].domain;
        console.log('Found domain in database:', websiteToUse);
      } else {
        // Fallback to companies table website field
        const { data: company } = await supabaseClient
          .from('companies')
          .select('website')
          .eq('company_id', companyId)
          .single();

        if (company?.website) {
          websiteToUse = company.website;
          console.log('Found website in companies table:', websiteToUse);
        }
      }
    }

    // Perform the LinkedIn search
    const result = await findCompanyLinkedIn(
      supabaseClient,
      companyId,
      websiteToUse || '',
      companyName || '',
      apiKey
    );

    if (!result.success) {
      console.log('LinkedIn search failed:', result.error);
      return new Response(
        JSON.stringify({
          error: result.error,
          suggestion: companyName ?
            `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}` :
            null
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('LinkedIn search successful');

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'LinkedIn URL found successfully',
        linkedin: result.linkedin,
        data: result.data
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Unhandled error in company LinkedIn finder:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});