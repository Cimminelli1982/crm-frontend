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
    
    // Simple debug for website input
    console.log('→ GOT WEBSITE?', website ? 'YES' : 'NO');
    console.log('→ WEBSITE VALUE:', website);
    
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
    
    // Enhanced Apollo input debug
    console.log('→ PROCESSED DOMAIN FOR APOLLO:', processedDomain);
    console.log('→ APOLLO API KEY PRESENT?', !!APOLLO_API_KEY);
    console.log('→ APOLLO API KEY LENGTH:', APOLLO_API_KEY ? APOLLO_API_KEY.length : 0);

    // Log entire request payload for troubleshooting
    console.log('→ FULL APOLLO REQUEST PAYLOAD:', JSON.stringify(apolloRequestData));

    // Call Apollo API
    const apolloResponse = await fetch(APOLLO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apolloRequestData),
    });

    const apolloData = await apolloResponse.json();
    
    // Enhanced Apollo response debugging
    console.log('→ APOLLO API RESPONSE STATUS:', apolloResponse.status);
    console.log('→ RESPONSE TYPE:', typeof apolloData);
    console.log('→ FULL RESPONSE DATA:', JSON.stringify(apolloData));
    console.log('→ FOUND ORGANIZATION?', !!apolloData.organization);
    
    if (apolloData.organization) {
      console.log('→ HAS SHORT DESCRIPTION?', !!apolloData.organization.short_description);
      console.log('→ HAS LONG DESCRIPTION?', !!apolloData.organization.long_description);
      console.log('→ HAS LINKEDIN URL?', !!apolloData.organization.linkedin_url);
    } else {
      console.log('→ ORGANIZATION DATA MISSING - ALL RESPONSE KEYS:', Object.keys(apolloData));
      
      // Check for error messages that might indicate the issue
      if (apolloData.message) {
        console.log('→ APOLLO ERROR MESSAGE:', apolloData.message);
      }
      
      if (apolloData.error) {
        console.log('→ APOLLO ERROR DETAILS:', apolloData.error);
      }
    }
    
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
      console.log(`→ APOLLO RETURNED NO DATA FOR DOMAIN: ${processedDomain}`);
      
      // Try fallback - search by company name if available
      if (company && company.name) {
        console.log(`→ TRYING FALLBACK SEARCH BY COMPANY NAME: ${company.name}`);
        
        // Create alternate API request to search by name
        const nameSearchData = {
          api_key: APOLLO_API_KEY,
          q_organization_name: company.name
        };
        
        try {
          // Call Apollo API with name search
          const nameSearchResponse = await fetch(APOLLO_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(nameSearchData),
          });
          
          const nameSearchResults = await nameSearchResponse.json();
          console.log('→ NAME SEARCH RESPONSE STATUS:', nameSearchResponse.status);
          console.log('→ NAME SEARCH FOUND ORGANIZATION?', !!nameSearchResults.organization);
          
          // If we found a match by name, use it
          if (nameSearchResults.organization) {
            console.log('→ FOUND ORGANIZATION BY NAME SEARCH!');
            apolloData.organization = nameSearchResults.organization;
            // Continue with the regular flow - the next part of code will handle the description
          } else {
            console.log('→ NO RESULTS FOUND BY NAME SEARCH EITHER');
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ 
                error: "No organization data found for the provided website or company name",
                companyId: companyId
              })
            };
          }
        } catch (nameSearchError) {
          console.log('→ ERROR IN NAME SEARCH:', nameSearchError.message);
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: "No organization data found for the provided website and name search failed",
              companyId: companyId
            })
          };
        }
      } else {
        // If Apollo failed but we have a description already in the DB, return it
        if (company && company.description) {
          console.log('→ USING EXISTING COMPANY DESCRIPTION FROM DATABASE');
          // Return the existing description
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              message: "Using existing company description",
              data: {
                companyId,
                description: company.description,
                website,
                linkedin: company.linkedin || null,
                source: "database"
              }
            })
          };
        } else {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ 
              error: "No organization data found for the provided website",
              companyId: companyId
            })
          };
        }
      }
    }

    // Extract the description from Apollo response
    const description = apolloData.organization.short_description || 
                        apolloData.organization.long_description || 
                        null;
                        
    // Final debug - did we get a usable description?
    console.log('→ FINAL DESCRIPTION FOUND?', !!description);
    if (description) {
      console.log('→ DESCRIPTION LENGTH:', description.length);
      console.log('→ DESCRIPTION PREVIEW:', description.substring(0, 100) + '...');
    }
                        
    if (!description) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "No description found for the organization" })
      };
    }

    // Don't update Supabase - instead return data to frontend for review
    
    // Prepare data that WOULD be sent to Supabase
    const enrichedData = {
      description: description,
      linkedin: apolloData.organization.linkedin_url || null
    };
    
    // Log what we found
    console.log('→ FOUND DESCRIPTION:', description ? 'YES' : 'NO', description ? `(${description.length} chars)` : '');
    console.log('→ FOUND LINKEDIN:', enrichedData.linkedin ? 'YES' : 'NO');
    
    // Prepare response data
    const responseData = {
      message: "Company data enriched from Apollo - review and save",
      data: {
        companyId,
        description: enrichedData.description,
        website,
        linkedin: enrichedData.linkedin,
        // Include additional fields that might be useful for review
        name: apolloData.organization.name || null,
        foundMatch: true
      }
    };
    
    console.log('→ SUCCESS! DATA RETRIEVED FOR FRONTEND REVIEW');
    
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