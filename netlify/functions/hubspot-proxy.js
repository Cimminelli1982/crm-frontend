const axios = require('axios');

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Log the incoming request for debugging
    console.log('Incoming request path:', event.path);
    console.log('Incoming request method:', event.httpMethod);
    console.log('Incoming request query params:', JSON.stringify(event.queryStringParameters));
    
    if (event.body) {
      try {
        console.log('Incoming request body:', event.body);
      } catch (e) {
        console.log('Could not log request body');
      }
    }

    // Get HubSpot credentials from environment variables
    const HUBSPOT_API_KEY = process.env.REACT_APP_HUBSPOT_API_KEY || process.env.HUBSPOT_API_KEY || '';
    const HUBSPOT_ACCESS_TOKEN = process.env.REACT_APP_HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN || '';
    
    console.log('API Key available:', !!HUBSPOT_API_KEY);
    console.log('Access Token available:', !!HUBSPOT_ACCESS_TOKEN);
    
    // Log the first few characters of the tokens for debugging (don't log the full token)
    if (HUBSPOT_API_KEY) {
      console.log('API Key prefix:', HUBSPOT_API_KEY.substring(0, 7) + '...');
    }
    if (HUBSPOT_ACCESS_TOKEN) {
      console.log('Access Token prefix:', HUBSPOT_ACCESS_TOKEN.substring(0, 7) + '...');
    }

    if (!HUBSPOT_API_KEY && !HUBSPOT_ACCESS_TOKEN) {
      console.error('No HubSpot credentials found in environment variables');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'No HubSpot credentials found',
          details: 'Please check your environment variables for REACT_APP_HUBSPOT_API_KEY or REACT_APP_HUBSPOT_ACCESS_TOKEN'
        })
      };
    }

    // Parse the request body if it exists
    let requestBody = {};
    if (event.body) {
      try {
        requestBody = JSON.parse(event.body);
        console.log('Parsed request body:', JSON.stringify(requestBody));
      } catch (e) {
        console.log('Error parsing request body:', e.message);
      }
    }

    // Get the HubSpot endpoint from the path parameter or request body
    const path = event.path.replace('/.netlify/functions/hubspot-proxy', '');
    // Default to contacts endpoint if no path is provided
    const endpoint = path && path !== '/' ? path : requestBody.endpoint || '/crm/v3/objects/contacts';
    
    console.log('Resolved endpoint:', endpoint);

    // Determine if we're using EU tokens
    const isEuToken = HUBSPOT_ACCESS_TOKEN.startsWith('pat-eu1-');
    
    // Set the base URL based on the token region
    const baseUrl = isEuToken ? 'https://api.hubapi.com' : 'https://api.hubapi.com';
    console.log('Using base URL:', baseUrl);

    // Prepare request config
    const config = {
      method: requestBody.method || event.httpMethod || 'GET',
      url: `${baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Add authentication - prefer access token over API key if both are present
    if (HUBSPOT_ACCESS_TOKEN) {
      config.headers.Authorization = `Bearer ${HUBSPOT_ACCESS_TOKEN}`;
      console.log('Using access token authentication');
    } else if (HUBSPOT_API_KEY) {
      config.params = { hapikey: HUBSPOT_API_KEY };
      console.log('Using API key authentication');
    }

    // Add request body for POST/PUT requests
    if (['POST', 'PUT'].includes(config.method) && requestBody.data) {
      config.data = requestBody.data;
    }

    // Add query parameters from the original request
    if (event.queryStringParameters) {
      config.params = {
        ...config.params,
        ...event.queryStringParameters
      };
    }

    // Add query parameters from the request body
    if (requestBody.params) {
      config.params = {
        ...config.params,
        ...requestBody.params
      };
    }

    console.log('Making request to HubSpot:', endpoint);
    console.log('Request method:', config.method);
    console.log('Request params:', JSON.stringify(config.params));
    console.log('Using EU token:', isEuToken);
    console.log('Full request URL:', `${baseUrl}${endpoint}`);

    // Make the request to HubSpot
    const response = await axios(config);

    console.log('HubSpot response status:', response.status);
    console.log('HubSpot response data preview:', JSON.stringify(response.data).substring(0, 200) + '...');

    // Return the response
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('HubSpot Proxy Error:', error.message);
    
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error('No response received from HubSpot API');
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    if (error.config) {
      console.error('Request config that failed:', JSON.stringify({
        url: error.config.url,
        method: error.config.method,
        params: error.config.params,
        headers: {
          ...error.config.headers,
          Authorization: error.config.headers?.Authorization ? 'Bearer [REDACTED]' : undefined
        }
      }));
    }
    
    // Return error response with detailed information
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        status: error.response?.status,
        details: error.response?.data || {},
        path: error.config?.url || 'Unknown URL'
      })
    };
  }
}; 