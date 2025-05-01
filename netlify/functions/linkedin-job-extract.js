// Netlify function to extract job title and company from LinkedIn profile using Apollo API
// Based on the apollo-enrich Supabase function

// Apollo API configuration
const APOLLO_API_URL = 'https://api.apollo.io/v1/people/match';
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

exports.handler = async (event, context) => {
  console.log('LinkedIn Job Title Extraction function called');
  
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
    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { firstName, lastName, email, linkedinUrl } = requestBody;
    
    // Validate inputs
    if (!firstName || !lastName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "First name and last name are required" })
      };
    }
    
    // Either email or LinkedIn URL should be provided for better matching
    if (!email && !linkedinUrl) {
      console.log('Warning: Neither email nor LinkedIn URL provided, match quality might be low');
    }
    
    // Prepare data for Apollo API
    const apolloRequestData = {
      api_key: APOLLO_API_KEY,
      first_name: firstName,
      last_name: lastName,
      email: email || null
    };
    
    // If LinkedIn URL is provided, extract username and add it to the request
    if (linkedinUrl) {
      const linkedinUsername = extractLinkedInUsername(linkedinUrl);
      if (linkedinUsername) {
        apolloRequestData.linkedin_url = `https://www.linkedin.com/in/${linkedinUsername}`;
      } else {
        apolloRequestData.linkedin_url = linkedinUrl; // Use as-is if we can't parse it
      }
    }
    
    console.log('Calling Apollo API with data:', { 
      ...apolloRequestData, 
      api_key: '***REDACTED***' // Don't log the actual API key
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
    
    console.log('Apollo API response status:', apolloResponse.status);
    console.log('Found person data?', !!apolloData.person);
    
    if (!apolloResponse.ok) {
      return {
        statusCode: apolloResponse.status,
        headers,
        body: JSON.stringify({ error: "Apollo API error", details: apolloData })
      };
    }

    // Check if we got valid person data
    if (!apolloData.person) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: "No person data found with the provided information",
          success: false
        })
      };
    }
    
    // Extract the relevant information
    const extractedData = {
      jobTitle: apolloData.person.title || null,
      company: apolloData.person.organization?.name || null,
      linkedinUrl: apolloData.person.linkedin_url || linkedinUrl || null,
      city: apolloData.person.city || null
    };
    
    console.log('Successfully extracted job data:', extractedData);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: extractedData
      })
    };
  } catch (error) {
    console.error('Error extracting LinkedIn job data:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Internal server error",
        message: error.message || "Unknown error",
        success: false
      })
    };
  }
};

// Helper function to extract LinkedIn username from URL
function extractLinkedInUsername(url) {
  if (!url) return null;
  
  try {
    // Handle various LinkedIn URL formats
    const regex = /linkedin\.com\/in\/([^\/\?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting LinkedIn username:', error);
    return null;
  }
}