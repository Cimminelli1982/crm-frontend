const { createClient } = require('@supabase/supabase-js');
const { Client } = require('@hubspot/api-client');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize HubSpot client
const hubspot = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// Set batch size for processing
const BATCH_SIZE = 25;

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Handle preflight OPTIONS request
const handleOptions = () => {
  return {
    statusCode: 200,
    headers,
    body: ''
  };
};

// Validate authentication
const validateAuth = (event) => {
  // Check for correct authorization header
  const authHeader = event.headers.authorization || '';
  const expectedToken = `Bearer ${process.env.MIGRATION_SECRET_KEY}`;
  
  if (!process.env.MIGRATION_SECRET_KEY || authHeader !== expectedToken) {
    console.log('Unauthorized access attempt');
    return false;
  }
  
  return true;
};

// Get HubSpot data for a company by domain
async function getHubSpotCompanyByDomain(domain) {
  try {
    if (!domain) return null;
    
    // Clean domain to remove protocol and www.
    const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    
    // Search HubSpot for companies with this domain
    const searchResponse = await hubspot.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'domain',
          operator: 'EQ',
          value: cleanDomain
        }]
      }],
      limit: 1,
      properties: [
        'name', 
        'domain', 
        'description', 
        'industry', 
        'website', 
        'phone', 
        'address', 
        'city', 
        'zip', 
        'state', 
        'country', 
        'hs_lead_status',
        'hubspot_owner_id',
        'numberofemployees',
        'annualrevenue',
        'founded_year',
        'linkedin_company_page'
      ]
    });
    
    if (searchResponse.results && searchResponse.results.length > 0) {
      return searchResponse.results[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching HubSpot company for domain ${domain}:`, error.message);
    return null;
  }
}

// Process a batch of companies
async function processCompanyBatch(companies) {
  const results = {
    processed: 0,
    enriched: 0,
    errors: 0,
    skipped: 0,
    details: []
  };
  
  // Process each company
  for (const company of companies) {
    try {
      results.processed++;
      
      // Skip companies without website
      if (!company.website) {
        results.skipped++;
        results.details.push({
          company_id: company.id,
          name: company.name,
          status: 'skipped',
          reason: 'No website available'
        });
        continue;
      }
      
      // Skip companies already enriched by HubSpot
      if (company.enrichment_source === 'hubspot') {
        results.skipped++;
        results.details.push({
          company_id: company.id,
          name: company.name,
          status: 'skipped',
          reason: 'Already enriched from HubSpot'
        });
        continue;
      }
      
      // Fetch data from HubSpot
      const hubspotCompany = await getHubSpotCompanyByDomain(company.website);
      
      if (!hubspotCompany) {
        results.skipped++;
        results.details.push({
          company_id: company.id,
          name: company.name,
          status: 'skipped',
          reason: 'No matching company found in HubSpot'
        });
        continue;
      }
      
      // Prepare data for update
      const updateData = {
        description: hubspotCompany.properties.description || company.description,
        industry: hubspotCompany.properties.industry || company.industry,
        phone: hubspotCompany.properties.phone || company.phone,
        employees: hubspotCompany.properties.numberofemployees || company.employees,
        revenue: hubspotCompany.properties.annualrevenue || company.revenue,
        founded_year: hubspotCompany.properties.founded_year || company.founded_year,
        linkedin_url: hubspotCompany.properties.linkedin_company_page || company.linkedin_url,
        enrichment_source: 'hubspot',
        enrichment_date: new Date().toISOString(),
        hubspot_id: hubspotCompany.id
      };
      
      // Update company in Supabase
      const { error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id);
      
      if (updateError) {
        throw new Error(`Error updating company: ${updateError.message}`);
      }
      
      // Handle city relationship
      if (hubspotCompany.properties.city) {
        // Check if city exists or create it
        const { data: existingCity, error: cityLookupError } = await supabase
          .from('cities')
          .select('id')
          .eq('name', hubspotCompany.properties.city)
          .maybeSingle();
        
        if (cityLookupError) {
          console.error('Error looking up city:', cityLookupError);
        }
        
        let cityId;
        if (existingCity) {
          cityId = existingCity.id;
        } else {
          // Create new city
          const { data: newCity, error: createCityError } = await supabase
            .from('cities')
            .insert({ name: hubspotCompany.properties.city })
            .select('id')
            .single();
          
          if (createCityError) {
            console.error('Error creating city:', createCityError);
          } else {
            cityId = newCity.id;
          }
        }
        
        // Link company to city if we have a cityId
        if (cityId) {
          // Check if relation already exists
          const { data: existingRelation, error: relationLookupError } = await supabase
            .from('company_cities')
            .select('id')
            .eq('company_id', company.id)
            .eq('city_id', cityId)
            .maybeSingle();
          
          if (!existingRelation && !relationLookupError) {
            // Create relation
            const { error: createRelationError } = await supabase
              .from('company_cities')
              .insert({ company_id: company.id, city_id: cityId });
            
            if (createRelationError) {
              console.error('Error linking company to city:', createRelationError);
            }
          }
        }
      }
      
      results.enriched++;
      results.details.push({
        company_id: company.id,
        name: company.name,
        status: 'enriched',
        hubspot_id: hubspotCompany.id
      });
      
    } catch (error) {
      results.errors++;
      results.details.push({
        company_id: company.id,
        name: company.name,
        status: 'error',
        error: error.message
      });
      console.error(`Error processing company ${company.id}:`, error);
    }
  }
  
  return results;
}

// Main handler function
exports.handler = async (event, context) => {
  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  // Validate authentication
  if (!validateAuth(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }
  
  try {
    // Parse parameters from the request body
    const requestBody = JSON.parse(event.body || '{}');
    const {
      limit = BATCH_SIZE,
      offset = 0,
      scheduled = false
    } = requestBody;
    
    // Log the start of execution
    console.log('Starting HubSpot migration...', {
      limit,
      offset,
      scheduled
    });
    
    // Fetch companies from Supabase
    const { data: companies, error: fetchError, count } = await supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .not('website', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (fetchError) {
      throw new Error(`Error fetching companies: ${fetchError.message}`);
    }
    
    if (!companies || companies.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'No companies found to process',
          offset,
          limit,
          count: 0
        })
      };
    }
    
    // Process the batch
    console.log(`Processing ${companies.length} companies...`);
    const results = await processCompanyBatch(companies);
    
    // Prepare response
    const response = {
      message: `Processed ${results.processed} companies`,
      timestamp: new Date().toISOString(),
      scheduled,
      limit,
      offset,
      next_offset: offset + limit,
      total_count: count,
      remaining: Math.max(0, count - (offset + limit)),
      stats: {
        processed: results.processed,
        enriched: results.enriched,
        skipped: results.skipped,
        errors: results.errors
      },
      details: results.details
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error in HubSpot migration function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};