const axios = require('axios');

// Get token from environment variable or command line argument
const token = process.env.HUBSPOT_ACCESS_TOKEN || process.argv[2] || '';

if (!token) {
  console.error('Error: No token provided. Please set HUBSPOT_ACCESS_TOKEN environment variable or provide as command line argument.');
  process.exit(1);
}

async function testToken() {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.hubapi.com/crm/v3/objects/contacts',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 1
      }
    });
    
    console.log('Success! Token is valid.');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error testing token:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testToken(); 