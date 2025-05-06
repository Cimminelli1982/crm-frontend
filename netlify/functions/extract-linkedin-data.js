const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) 
    };
  }

  try {
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid request body' 
        })
      };
    }

    const { url } = requestBody;
    
    if (!url || !url.includes('linkedin.com/in/')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false, 
          message: 'Invalid LinkedIn URL' 
        })
      };
    }

    // Make the HTTP request to LinkedIn
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Set a reasonable timeout
      timeout: 10000
    });

    // Load HTML content into cheerio (similar to BeautifulSoup)
    const $ = cheerio.load(response.data);

    // Extract job title
    // Note: These selectors are based on LinkedIn's HTML structure as of now
    // They might need to be updated if LinkedIn changes their page structure
    let jobRole = '';
    
    // Try different selector patterns that might contain job role
    const possibleJobSelectors = [
      '.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      '.pv-top-card-section__headline',
      'h2.mt1.t-18.t-black.t-normal'
    ];

    for (const selector of possibleJobSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        jobRole = element.text().trim();
        break;
      }
    }

    // Try to find company name
    let company = '';
    
    // Try different selector patterns that might contain company name
    const possibleCompanySelectors = [
      '.pv-text-details__right-panel .inline-show-more-text',
      '.pv-entity__secondary-title',
      '.text-body-small.inline.t-black--light.break-words'
    ];

    for (const selector of possibleCompanySelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        company = element.text().trim();
        break;
      }
    }

    // If we found some data, return it
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        jobRole: jobRole || null,
        company: company || null,
        success: true
      })
    };
  } catch (error) {
    console.log('Error scraping LinkedIn:', error);
    
    // Provide a more detailed error for debugging
    const errorMessage = 
      error.response ? 
        `Request failed with status ${error.response.status}: ${error.response.statusText}` : 
        error.message;
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false,
        message: 'Failed to extract data from LinkedIn profile',
        error: errorMessage,
      })
    };
  }
};