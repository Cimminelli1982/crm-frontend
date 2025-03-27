// Supabase Edge Function for Company Description Enrichment using Apollo.io
// Fetches company description from Apollo based on website and updates Supabase

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Apollo API configuration
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const APOLLO_API_URL = 'https://api.apollo.io/v1/organizations/enrich';

// Netlify serverless function handler
exports.handler = async (event, context) => {
  console.log('Apollo Website Description Enrichment function called', { body: event.body });
  
  // Define CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle OPTIONS request (preflight CORS check)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  
  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    const { companyId, website } = requestBody;
    
    // Add detailed debug logging
    console.log('DEBUG - Request details:', { 
      companyId, 
      originalWebsite: website,
      headers: event.headers,
      requestURL: event.rawUrl || 'Not available'
    });
    
    if (!companyId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Company ID is required" })
      };
    }

    if (!website) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Website is required" })
      };
    }

    // Fetch company data from Supabase
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, website, description')
      .eq('id', companyId)
      .single();
    
    if (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to fetch company data", details: error })
      };
    }
    
    if (!company) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Company not found" })
      };
    }

    // Prepare data for Apollo API
    const processedDomain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    const apolloRequestData = {
      api_key: APOLLO_API_KEY,
      domain: processedDomain
    };
    
    // Add debug log for Apollo request
    console.log('DEBUG - Apollo API request:', { 
      originalWebsite: website,
      processedDomain: processedDomain,
      apolloRequestURL: APOLLO_API_URL
    });

    // Call Apollo API
    const apolloResponse = await fetch(APOLLO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apolloRequestData),
    });

    const apolloData = await apolloResponse.json();
    
    // Log Apollo response status and data summary
    console.log('DEBUG - Apollo API response:', { 
      status: apolloResponse.status,
      ok: apolloResponse.ok,
      hasOrganization: !!apolloData.organization,
      dataKeys: Object.keys(apolloData),
      organizationKeys: apolloData.organization ? Object.keys(apolloData.organization) : []
    });
    
    if (!apolloResponse.ok) {
      console.log('DEBUG - Apollo API error details:', apolloData);
      return {
        statusCode: apolloResponse.status,
        headers,
        body: JSON.stringify({ error: "Apollo API error", details: apolloData })
      };
    }

    // Check if we got organization data
    if (!apolloData.organization) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "No organization data found for the provided website" })
      };
    }

    // Extract the description from Apollo response
    const description = apolloData.organization.short_description || 
                        apolloData.organization.long_description || 
                        null;
                        
    if (!description) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "No description found for the organization" })
      };
    }

    // Update company description in Supabase
    const companyUpdateData = {
      description: description,
      modified_at: new Date().toISOString(),
      enrichment_source: 'apollo',
      enrichment_date: new Date().toISOString()
    };
    
    // If we also got LinkedIn data and there isn't one already, add it
    if (apolloData.organization.linkedin_url && !company.linkedin) {
      companyUpdateData.linkedin = apolloData.organization.linkedin_url;
    }

    // Update the company in Supabase
    const { error: updateCompanyError } = await supabase
      .from('companies')
      .update(companyUpdateData)
      .eq('id', companyId);
    
    if (updateCompanyError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Failed to update company with enriched data", 
          details: updateCompanyError 
        })
      };
    }

    // Prepare response data
    const responseData = {
      message: "Company description successfully enriched",
      data: {
        companyId,
        description,
        website,
        linkedin: companyUpdateData.linkedin || null
      }
    };
    
    console.log('Apollo company description enrichment successful:', responseData);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Error enriching company description:', error);
    const errorMessage = error.message || "Internal server error";
    console.log('Apollo company description enrichment failed:', errorMessage);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};