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
    const HUBSPOT_ACCESS_TOKEN = process.env.REACT_APP_HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN || '';
    
    if (!HUBSPOT_ACCESS_TOKEN) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No HubSpot access token found' })
      };
    }
    
    console.log('Using token starting with:', HUBSPOT_ACCESS_TOKEN.substring(0, 7) + '...');

    // Make a simple request to HubSpot
    const response = await axios({
      method: 'GET',
      url: 'https://api.hubapi.com/crm/v3/objects/contacts',
      headers: {
        'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 1
      }
    });

    console.log('HubSpot test response status:', response.status);

    // Return the response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'HubSpot API connection successful',
        data: response.data
      })
    };
  } catch (error) {
    console.error('HubSpot Test Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
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