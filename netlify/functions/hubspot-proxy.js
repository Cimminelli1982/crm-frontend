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
    // Get HubSpot credentials from environment variables
    const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY || '';
    const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || '';
    
    console.log('API Key available:', !!HUBSPOT_API_KEY);
    console.log('Access Token available:', !!HUBSPOT_ACCESS_TOKEN);

    if (!HUBSPOT_API_KEY && !HUBSPOT_ACCESS_TOKEN) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No HubSpot credentials found' })
      };
    }

    // Parse the request body if it exists
    let requestBody = {};
    if (event.body) {
      requestBody = JSON.parse(event.body);
    }

    // Get the HubSpot endpoint from the path parameter
    const path = event.path.replace('/.netlify/functions/hubspot-proxy', '');
    const endpoint = path || requestBody.endpoint || '/crm/v3/objects/contacts';

    // Prepare request config
    const config = {
      method: event.httpMethod || requestBody.method || 'GET',
      url: `https://api.hubapi.com${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Add authentication
    if (HUBSPOT_API_KEY) {
      config.params = { hapikey: HUBSPOT_API_KEY };
    }
    
    if (HUBSPOT_ACCESS_TOKEN) {
      config.headers.Authorization = `Bearer ${HUBSPOT_ACCESS_TOKEN}`;
    }

    // Add request body for POST/PUT requests
    if (['POST', 'PUT'].includes(config.method) && requestBody.data) {
      config.data = requestBody.data;
    }

    // Add query parameters
    if (requestBody.params) {
      config.params = {
        ...config.params,
        ...requestBody.params
      };
    }

    console.log('Making request to HubSpot:', endpoint);

    // Make the request to HubSpot
    const response = await axios(config);

    console.log('HubSpot response status:', response.status);

    // Return the response
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('HubSpot Proxy Error:', error.message);
    console.error('Error details:', error.response?.data || 'No detailed error data');
    
    // Return error response
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || {}
      })
    };
  }
}; 