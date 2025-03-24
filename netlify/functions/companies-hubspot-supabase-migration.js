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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Handle preflight OPTIONS request
const handleOptions = () => {
  console.log('Handling OPTIONS request');
  return {
    statusCode: 200,
    headers: headers,
    body: ''
  };
};

// Validate authentication
const validateAuth = (event) => {
  // Check for correct authorization header
  const authHeader = event.headers.authorization || '';
  const expectedToken = `Bearer ${process.env.MIGRATION_SECRET_KEY || 'test_migration_key'}`;
  
  console.log('Auth validation:', { 
    authHeader: authHeader.substring(0, 15) + '...',
    expectedTokenPrefix: expectedToken.substring(0, 15) + '...',
    envVarExists: !!process.env.MIGRATION_SECRET_KEY,
    match: authHeader === expectedToken
  });
  
  // Accept either the environment variable or the hardcoded test key
  if (authHeader === expectedToken || authHeader === 'Bearer test_migration_key') {
    console.log('Authorization successful');
    return true;
  }
  
  console.log('Unauthorized access attempt');
  return false;
};

// Get HubSpot data for a company by domain or name
async function getHubSpotCompanyData(company) {
  try {
    // First try to match by domain if website exists
    if (company.website) {
      console.log(`Attempting to find HubSpot match by domain for: ${company.name}`);
      
      // Clean domain to remove protocol and www.
      const cleanDomain = company.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
      
      // Search HubSpot for companies with this domain
      const domainSearchResponse = await hubspot.crm.companies.searchApi.doSearch({
        filterGroups: [{
          filters: [{
            propertyName: 'domain',
            operator: 'EQ',
            value: cleanDomain
          }]
        }],
        limit: 5,
        properties: [
          'name', 
          'domain', 
          'description', 
          'industry', 
          'website', 
          'phone', 
          'city',
          'country',
          'category',
          'numberofemployees',
          'annualrevenue',
          'founded_year',
          'linkedin_company_page',
          'facebook_company_page',
          'twitter_handle',
          'instagram_handle'
        ]
      });
      
      if (domainSearchResponse.results && domainSearchResponse.results.length > 0) {
        console.log(`Found company match by domain: ${domainSearchResponse.results[0].properties.name}`);
        return domainSearchResponse.results[0];
      }
    }
    
    // If no match by domain, try by name
    console.log(`Attempting to find HubSpot match by name for: ${company.name}`);
    
    // Prepare name for search (remove legal entity types, etc.)
    const simplifiedName = company.name
      .replace(/\s?(inc|llc|ltd|gmbh|co\.?|corporation|limited|group)\.?\s*$/i, '')
      .trim();
    
    // Search for company by name
    const nameSearchResponse = await hubspot.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'name',
          operator: 'CONTAINS_TOKEN',
          value: simplifiedName
        }]
      }],
      limit: 5,
      properties: [
        'name', 
        'domain', 
        'description', 
        'industry', 
        'website', 
        'phone', 
        'city',
        'country',
        'category',
        'numberofemployees',
        'annualrevenue',
        'founded_year',
        'linkedin_company_page',
        'facebook_company_page',
        'twitter_handle',
        'instagram_handle'
      ]
    });
    
    if (nameSearchResponse.results && nameSearchResponse.results.length > 0) {
      // Try to find the best match by comparing names
      const bestMatch = findBestNameMatch(company.name, nameSearchResponse.results);
      if (bestMatch) {
        console.log(`Found company match by name: ${bestMatch.properties.name}`);
        return bestMatch;
      }
    }
    
    console.log(`No HubSpot match found for company: ${company.name}`);
    return null;
  } catch (error) {
    console.error(`Error fetching HubSpot company data for ${company.name}:`, error.message);
    return null;
  }
}

// Helper function to find the best match by name similarity
function findBestNameMatch(originalName, candidates) {
  if (!candidates || candidates.length === 0) return null;
  
  // Simple string comparison for now - could be improved with more sophisticated matching
  const simplifiedOriginal = originalName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let bestMatch = null;
  let highestSimilarity = 0;
  
  for (const candidate of candidates) {
    const candidateName = candidate.properties.name;
    const simplifiedCandidate = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Calculate simple similarity score
    let similarity = 0;
    if (simplifiedCandidate.includes(simplifiedOriginal) || simplifiedOriginal.includes(simplifiedCandidate)) {
      // Calculate percentage of shared characters
      const minLength = Math.min(simplifiedOriginal.length, simplifiedCandidate.length);
      const maxLength = Math.max(simplifiedOriginal.length, simplifiedCandidate.length);
      similarity = minLength / maxLength;
    }
    
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = candidate;
    }
  }
  
  // Only return if we have a reasonable match
  return highestSimilarity > 0.5 ? bestMatch : null;
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
      console.log(`Processing company: ${company.name} (ID: ${company.id})`);
      
      // Only skip companies that have all the required fields filled in
      const requiredFields = ['website', 'description', 'category', 'linkedin_url'];
      const missingFields = requiredFields.filter(field => !company[field]);
      
      if (missingFields.length === 0) {
        console.log(`Skipping company with all required fields: ${company.name}`);
        results.skipped++;
        results.details.push({
          company_id: company.id,
          name: company.name,
          status: 'skipped',
          reason: 'All required fields already filled',
          has_fields: requiredFields
        });
        continue;
      }
      
      console.log(`Company ${company.name} is missing fields: ${missingFields.join(', ')}`);
      
      
      // Try to find a match in HubSpot
      const hubspotCompany = await getHubSpotCompanyData(company);
      
      if (!hubspotCompany) {
        // We couldn't find a match by domain or name
        results.skipped++;
        results.details.push({
          company_id: company.id,
          name: company.name,
          status: 'skipped',
          reason: 'No matching company found in HubSpot'
        });
        continue;
      }
      
      console.log(`Found HubSpot match for ${company.name}: ${hubspotCompany.properties.name} (ID: ${hubspotCompany.id})`);
      
      // Extract category from HubSpot if available
      let category = null;
      if (hubspotCompany.properties.category) {
        category = hubspotCompany.properties.category;
      } else if (hubspotCompany.properties.industry) {
        // Map industry to category if possible
        const industryToCategoryMap = {
          'TECHNOLOGY': 'Tech',
          'FINANCIAL_SERVICES': 'Financial Services',
          'HEALTHCARE': 'Healthcare',
          'EDUCATION': 'Education',
          'MANUFACTURING': 'Manufacturing'
          // Add more mappings as needed
        };
        category = industryToCategoryMap[hubspotCompany.properties.industry] || hubspotCompany.properties.industry;
      }
      
      // Prepare data for update, prioritizing HubSpot data
      const updateData = {
        website: hubspotCompany.properties.website || company.website,
        description: hubspotCompany.properties.description || company.description,
        industry: hubspotCompany.properties.industry || company.industry,
        category: category || company.category,
        employees: hubspotCompany.properties.numberofemployees || company.employees,
        linkedin_url: hubspotCompany.properties.linkedin_company_page || company.linkedin_url,
        enrichment_source: 'hubspot',
        enrichment_date: new Date().toISOString(),
        hubspot_id: hubspotCompany.id,
        hubspot_match_name: hubspotCompany.properties.name
      };
      
      // Log the enrichment data
      console.log(`Updating company ${company.name} with HubSpot data:`, 
        Object.keys(updateData).filter(k => !!updateData[k] && k !== 'enrichment_date').reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {})
      );
      
      // Update company in Supabase
      const { error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company.id);
      
      if (updateError) {
        throw new Error(`Error updating company: ${updateError.message}`);
      }
      
      // Track what relations we've updated
      const updatedRelations = {
        city: false,
        tags: false
      };
      
      // Handle city relationship
      if (hubspotCompany.properties.city) {
        console.log(`Processing city relation: ${hubspotCompany.properties.city}`);
        try {
          // Check if city exists or create it
          const { data: existingCity, error: cityLookupError } = await supabase
            .from('cities')
            .select('id')
            .ilike('name', hubspotCompany.properties.city) // Case-insensitive match
            .maybeSingle();
          
          if (cityLookupError) {
            console.error('Error looking up city:', cityLookupError);
          }
          
          let cityId;
          if (existingCity) {
            cityId = existingCity.id;
            console.log(`Found existing city: ${hubspotCompany.properties.city} (ID: ${cityId})`);
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
              console.log(`Created new city: ${hubspotCompany.properties.city} (ID: ${cityId})`);
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
              } else {
                console.log(`Created company-city relation for ${company.name} and ${hubspotCompany.properties.city}`);
                updatedRelations.city = true;
              }
            } else if (existingRelation) {
              console.log(`Company-city relation already exists for ${company.name} and ${hubspotCompany.properties.city}`);
              updatedRelations.city = true;
            }
          }
        } catch (cityError) {
          console.error(`Error processing city for ${company.name}:`, cityError);
        }
      }
      
      // Handle category as a tag if it exists
      if (category) {
        console.log(`Processing category as tag: ${category}`);
        try {
          // Check if tag exists or create it
          const { data: existingTag, error: tagLookupError } = await supabase
            .from('tags')
            .select('id')
            .ilike('name', category) // Case-insensitive match
            .maybeSingle();
          
          if (tagLookupError) {
            console.error('Error looking up tag:', tagLookupError);
          }
          
          let tagId;
          if (existingTag) {
            tagId = existingTag.id;
            console.log(`Found existing tag: ${category} (ID: ${tagId})`);
          } else {
            // Create new tag
            const { data: newTag, error: createTagError } = await supabase
              .from('tags')
              .insert({ name: category })
              .select('id')
              .single();
            
            if (createTagError) {
              console.error('Error creating tag:', createTagError);
            } else {
              tagId = newTag.id;
              console.log(`Created new tag: ${category} (ID: ${tagId})`);
            }
          }
          
          // Link company to tag if we have a tagId
          if (tagId) {
            // Check if relation already exists
            const { data: existingRelation, error: relationLookupError } = await supabase
              .from('company_tags')
              .select('id')
              .eq('company_id', company.id)
              .eq('tag_id', tagId)
              .maybeSingle();
            
            if (!existingRelation && !relationLookupError) {
              // Create relation
              const { error: createRelationError } = await supabase
                .from('company_tags')
                .insert({ company_id: company.id, tag_id: tagId });
              
              if (createRelationError) {
                console.error('Error linking company to tag:', createRelationError);
              } else {
                console.log(`Created company-tag relation for ${company.name} and ${category}`);
                updatedRelations.tags = true;
              }
            } else if (existingRelation) {
              console.log(`Company-tag relation already exists for ${company.name} and ${category}`);
              updatedRelations.tags = true;
            }
          }
        } catch (tagError) {
          console.error(`Error processing tag for ${company.name}:`, tagError);
        }
      }
      
      // Add social media handles as tags if available
      const socialHandles = [
        { platform: 'LinkedIn', value: hubspotCompany.properties.linkedin_company_page },
        { platform: 'Facebook', value: hubspotCompany.properties.facebook_company_page },
        { platform: 'Twitter', value: hubspotCompany.properties.twitter_handle },
        { platform: 'Instagram', value: hubspotCompany.properties.instagram_handle }
      ].filter(handle => !!handle.value);
      
      if (socialHandles.length > 0) {
        console.log(`Processing ${socialHandles.length} social media handles as tags`);
        // Add social media presence tags
        for (const handle of socialHandles) {
          try {
            const tagName = `Has ${handle.platform}`;
            
            // Check if tag exists or create it
            const { data: existingTag, error: tagLookupError } = await supabase
              .from('tags')
              .select('id')
              .ilike('name', tagName)
              .maybeSingle();
            
            if (tagLookupError) {
              console.error(`Error looking up ${handle.platform} tag:`, tagLookupError);
              continue;
            }
            
            let tagId;
            if (existingTag) {
              tagId = existingTag.id;
            } else {
              const { data: newTag, error: createTagError } = await supabase
                .from('tags')
                .insert({ name: tagName })
                .select('id')
                .single();
              
              if (createTagError) {
                console.error(`Error creating ${handle.platform} tag:`, createTagError);
                continue;
              }
              
              tagId = newTag.id;
              console.log(`Created new tag: ${tagName} (ID: ${tagId})`);
            }
            
            // Link company to tag
            const { data: existingRelation, error: relationLookupError } = await supabase
              .from('company_tags')
              .select('id')
              .eq('company_id', company.id)
              .eq('tag_id', tagId)
              .maybeSingle();
            
            if (!existingRelation && !relationLookupError) {
              const { error: createRelationError } = await supabase
                .from('company_tags')
                .insert({ company_id: company.id, tag_id: tagId });
              
              if (createRelationError) {
                console.error(`Error linking company to ${handle.platform} tag:`, createRelationError);
              } else {
                console.log(`Created company-tag relation for ${company.name} and ${tagName}`);
                updatedRelations.tags = true;
              }
            }
          } catch (socialTagError) {
            console.error(`Error processing social media tag for ${company.name}:`, socialTagError);
          }
        }
      }
      
      results.enriched++;
      results.details.push({
        company_id: company.id,
        name: company.name,
        status: 'enriched',
        hubspot_id: hubspotCompany.id,
        hubspot_name: hubspotCompany.properties.name,
        updated_fields: Object.keys(updateData).filter(k => !!updateData[k] && k !== 'enrichment_date'),
        updated_relations: updatedRelations
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

// Main handler function - ensuring proper Netlify function format
exports.handler = async (event, context) => {
  // Allow CORS for development
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  console.log('Function called: companies-hubspot-supabase-migration');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Has authorization header:', !!event.headers.authorization);
  
  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed', method: event.httpMethod })
    };
  }
  
  // Validate authentication
  if (!validateAuth(event)) {
    console.log('Unauthorized access attempt');
    // Provide debugging information
    const debugInfo = {
      error: 'Unauthorized',
      headers_received: event.headers,
      env_vars_set: {
        MIGRATION_SECRET_KEY: !!process.env.MIGRATION_SECRET_KEY,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        HUBSPOT_ACCESS_TOKEN: !!process.env.HUBSPOT_ACCESS_TOKEN
      },
      test_token_used: event.headers.authorization === 'Bearer test_migration_key'
    };
    
    console.log('Unauthorized with debug info:', debugInfo);
    
    return {
      statusCode: 401,
      headers: headers,
      body: JSON.stringify(debugInfo)
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
    
    // Fetch companies from Supabase - prioritize those missing required fields
    const requiredFields = ['website', 'description', 'category', 'linkedin_url'];
    
    // Try to find companies missing all required fields first
    console.log('Attempting to find companies missing required fields...');
    
    // Build a query that finds companies missing at least one of the required fields
    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' });
    
    // We'll use OR conditions for each missing field
    let orConditions = requiredFields.map(field => {
      return `${field}.is.null`;
    });
    
    query = query
      .or(orConditions.join(','))
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: incompleteCompanies, error: incompleteError, count: incompleteCount } = await query;
    
    let companies;
    let fetchError;
    let count;
    
    if (incompleteError) {
      console.error('Error with complex query for incomplete companies:', incompleteError);
      // Fall back to simpler query - find those missing any required field
      
      // Try a simpler approach - find companies missing website
      const websiteResult = await supabase
        .from('companies')
        .select('*', { count: 'exact' })
        .is('website', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (websiteResult.data && websiteResult.data.length > 0) {
        console.log(`Found ${websiteResult.count} companies missing website`);
        companies = websiteResult.data;
        fetchError = null;
        count = websiteResult.count;
      } else {
        // Try companies missing description
        const descriptionResult = await supabase
          .from('companies')
          .select('*', { count: 'exact' })
          .is('description', null)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (descriptionResult.data && descriptionResult.data.length > 0) {
          console.log(`Found ${descriptionResult.count} companies missing description`);
          companies = descriptionResult.data;
          fetchError = null;
          count = descriptionResult.count;
        } else {
          // Try companies missing category
          const categoryResult = await supabase
            .from('companies')
            .select('*', { count: 'exact' })
            .is('category', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
          
          if (categoryResult.data && categoryResult.data.length > 0) {
            console.log(`Found ${categoryResult.count} companies missing category`);
            companies = categoryResult.data;
            fetchError = null;
            count = categoryResult.count;
          } else {
            // Try companies missing linkedin_url
            const linkedinResult = await supabase
              .from('companies')
              .select('*', { count: 'exact' })
              .is('linkedin_url', null)
              .order('created_at', { ascending: false })
              .range(offset, offset + limit - 1);
            
            if (linkedinResult.data && linkedinResult.data.length > 0) {
              console.log(`Found ${linkedinResult.count} companies missing LinkedIn URL`);
              companies = linkedinResult.data;
              fetchError = null;
              count = linkedinResult.count;
            } else {
              // Fall back to any companies
              console.log('No companies missing any required fields, getting any companies');
              const finalResult = await supabase
                .from('companies')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
              
              companies = finalResult.data;
              fetchError = finalResult.error;
              count = finalResult.count;
            }
          }
        }
      }
    } else if (incompleteCompanies && incompleteCompanies.length > 0) {
      // Use the incomplete companies if we found any
      console.log(`Found ${incompleteCount} companies missing at least one required field`);
      companies = incompleteCompanies;
      fetchError = null;
      count = incompleteCount;
    } else {
      // If no incomplete companies, get any companies
      console.log('No companies missing required fields, getting any companies');
      const finalResult = await supabase
        .from('companies')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      companies = finalResult.data;
      fetchError = finalResult.error;
      count = finalResult.count;
    }
    
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
    console.log('Company IDs to process:', companies.map(c => c.id).join(', '));
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
    
    console.log('Successfully processed companies:', results.processed);
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error in HubSpot migration function:', error);
    
    console.error('Returning error response:', error.message);
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};