// Supabase Edge Function for Company LinkedIn Enrichment using Apollo.io
// Fetches company LinkedIn URL from Apollo based on website

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
  console.log('Apollo Website LinkedIn Enrichment function called', { body: event.body });
  
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
      .select('id, name, website, linkedin')
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
    
    // Debug Apollo input
    console.log('→ PROCESSED DOMAIN FOR APOLLO:', processedDomain);
    console.log('→ APOLLO API KEY PRESENT?', !!APOLLO_API_KEY);
    console.log('→ APOLLO API KEY LENGTH:', APOLLO_API_KEY ? APOLLO_API_KEY.length : 0);
    console.log('→ APOLLO REQUEST PAYLOAD:', JSON.stringify(apolloRequestData));

    // Call Apollo API
    const apolloResponse = await fetch(APOLLO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apolloRequestData),
    });

    const apolloData = await apolloResponse.json();
    
    // Debug Apollo response
    console.log('→ APOLLO API RESPONSE STATUS:', apolloResponse.status);
    console.log('→ FOUND ORGANIZATION?', !!apolloData.organization);
    
    if (apolloData.organization) {
      console.log('→ HAS LINKEDIN URL?', !!apolloData.organization.linkedin_url);
      if (apolloData.organization.linkedin_url) {
        console.log('→ LINKEDIN URL:', apolloData.organization.linkedin_url);
      }
    } else {
      console.log('→ ORGANIZATION DATA MISSING - ALL RESPONSE KEYS:', Object.keys(apolloData));
      
      if (apolloData.message) {
        console.log('→ APOLLO ERROR MESSAGE:', apolloData.message);
      }
      
      if (apolloData.error) {
        console.log('→ APOLLO ERROR DETAILS:', apolloData.error);
      }
    }
    
    if (!apolloResponse.ok) {
      return {
        statusCode: apolloResponse.status,
        headers,
        body: JSON.stringify({ error: "Apollo API error", details: apolloData })
      };
    }

    // Check if we got organization data with LinkedIn
    if (!apolloData.organization || !apolloData.organization.linkedin_url) {
      console.log(`→ NO LINKEDIN URL FOUND FOR DOMAIN: ${processedDomain}`);
      
      // Try name search if domain search fails
      if (company && company.name) {
        console.log(`→ TRYING FALLBACK SEARCH BY COMPANY NAME: ${company.name}`);
        
        const nameSearchData = {
          api_key: APOLLO_API_KEY,
          q_organization_name: company.name
        };
        
        try {
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
          
          if (nameSearchResults.organization && nameSearchResults.organization.linkedin_url) {
            console.log('→ FOUND LINKEDIN URL BY NAME SEARCH!');
            apolloData.organization = nameSearchResults.organization;
          } else {
            console.log('→ NO LINKEDIN URL FOUND BY NAME SEARCH EITHER');
            
            // If we already have a LinkedIn URL in the database, return it
            if (company && company.linkedin) {
              console.log('→ USING EXISTING LINKEDIN URL FROM DATABASE');
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                  message: "Using existing LinkedIn URL",
                  data: {
                    companyId,
                    website,
                    linkedin: company.linkedin,
                    source: "database"
                  }
                })
              };
            }
            
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ 
                error: "No LinkedIn URL found for this company",
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
              error: "LinkedIn URL search failed",
              companyId: companyId
            })
          };
        }
      } else {
        // Check if we already have LinkedIn in database
        if (company && company.linkedin) {
          console.log('→ USING EXISTING LINKEDIN URL FROM DATABASE');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              message: "Using existing LinkedIn URL",
              data: {
                companyId,
                website,
                linkedin: company.linkedin,
                source: "database" 
              }
            })
          };
        }
        
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: "No LinkedIn URL found for this company",
            companyId: companyId
          })
        };
      }
    }

    // Extract the LinkedIn URL
    const linkedinUrl = apolloData.organization.linkedin_url;
    
    // Log what we found
    console.log('→ FOUND LINKEDIN URL:', linkedinUrl ? 'YES' : 'NO');
    
    // Prepare response data
    const responseData = {
      message: "Company LinkedIn URL found from Apollo - review and save",
      data: {
        companyId,
        website,
        linkedin: linkedinUrl,
        name: apolloData.organization.name || null,
        foundMatch: true
      }
    };
    
    console.log('→ SUCCESS! LINKEDIN URL RETRIEVED FOR FRONTEND REVIEW');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Error enriching company LinkedIn URL:', error);
    const errorMessage = error.message || "Internal server error";
    console.log('Apollo LinkedIn enrichment failed:', errorMessage);
    
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