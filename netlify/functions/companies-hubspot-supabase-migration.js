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
          // Core fields - EXACTLY what we need
          'name',
          'website', 
          'domain',
          'description',
          'about_us',      // Backup for description
          // Location for city relationship
          'city',
          // LinkedIn for social link
          'linkedin_company_page',
          // For tags and categorization
          'industry',
          'type'
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
        // Core fields - EXACTLY what we need
        'name',
        'website', 
        'domain',
        'description',
        'about_us',      // Backup for description
        // Location for city relationship
        'city',
        // LinkedIn for social link
        'linkedin_company_page',
        // For tags and categorization
        'industry',
        'type'
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
  
  // Normalize both names for comparison by:
  // 1. Converting to lowercase
  // 2. Removing legal entities (Inc, LLC, Ltd, etc.)
  // 3. Removing special characters and extra spaces
  const normalizeCompanyName = (name) => {
    return name
      .toLowerCase()
      .replace(/\s?(inc|llc|ltd|gmbh|co\.?|corporation|limited|group|ventures|capital|partners)\.?\s*$/i, '')
      .replace(/[^\w\s]/g, '') // Remove non-alphanumeric characters except spaces
      .replace(/\s+/g, ' ')    // Replace multiple spaces with a single space
      .trim();
  };
  
  const normalizedOriginal = normalizeCompanyName(originalName);
  
  let bestMatch = null;
  let highestSimilarity = 0;
  
  for (const candidate of candidates) {
    const candidateName = candidate.properties.name;
    const normalizedCandidate = normalizeCompanyName(candidateName);
    
    // Calculate Levenshtein distance-based similarity
    const maxLength = Math.max(normalizedOriginal.length, normalizedCandidate.length);
    if (maxLength === 0) continue; // Skip empty strings
    
    // Check for exact match after normalization
    if (normalizedOriginal === normalizedCandidate) {
      return candidate; // Immediate return for exact normalized match
    }
    
    // Check if one contains the other
    if (normalizedCandidate.includes(normalizedOriginal) || normalizedOriginal.includes(normalizedCandidate)) {
      const minLength = Math.min(normalizedOriginal.length, normalizedCandidate.length);
      const similarity = minLength / maxLength;
      
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = candidate;
      }
    } 
    // Check for word-level similarity
    else {
      const originalWords = normalizedOriginal.split(' ');
      const candidateWords = normalizedCandidate.split(' ');
      
      // Count shared words
      const sharedWords = originalWords.filter(word => 
        word.length > 2 && candidateWords.includes(word)
      ).length;
      
      // Calculate word-based similarity
      const totalUniqueWords = new Set([...originalWords, ...candidateWords]).size;
      const wordSimilarity = sharedWords / totalUniqueWords;
      
      if (wordSimilarity > highestSimilarity) {
        highestSimilarity = wordSimilarity;
        bestMatch = candidate;
      }
    }
  }
  
  console.log(`Best match score for "${originalName}": ${highestSimilarity}`);
  
  // Return match if similarity is sufficient (85% or higher)
  return highestSimilarity >= 0.6 ? bestMatch : null;
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
      const requiredFields = ['website', 'description', 'category', 'linkedin'];
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
      let hubspotCompany;
      try {
        // Special case for records that look like Airtable IDs
        if (company.name.startsWith('rec') && company.name.length === 17) {
          console.log(`${company.name} appears to be an Airtable ID, skipping HubSpot lookup`);
          results.skipped++;
          results.details.push({
            company_id: company.id,
            name: company.name,
            status: 'skipped',
            reason: 'Company name appears to be an Airtable ID'
          });
          continue;
        }
        
        // Try to match with HubSpot
        hubspotCompany = await getHubSpotCompanyData(company);
        
        if (!hubspotCompany) {
          console.log(`No HubSpot match found for ${company.name}, trying a generic lookup`);
          
          // Last resort - try to lookup by exact name in HubSpot
          const exactNameSearchResponse = await hubspot.crm.companies.searchApi.doSearch({
            filterGroups: [{
              filters: [{
                propertyName: 'name',
                operator: 'EQ',
                value: company.name
              }]
            }],
            limit: 1,
            properties: [
              // Core fields - EXACTLY what we need
              'name',
              'website', 
              'domain',
              'description',
              'about_us',      // Backup for description
              // Location for city relationship
              'city',
              // LinkedIn for social link
              'linkedin_company_page',
              // For tags and categorization
              'industry',
              'type'
            ]
          });
          
          if (exactNameSearchResponse.results && exactNameSearchResponse.results.length > 0) {
            hubspotCompany = exactNameSearchResponse.results[0];
            console.log(`Found exact name match for ${company.name}`);
          }
        }
        
        if (!hubspotCompany) {
          // We couldn't find a match by any method
          results.skipped++;
          results.details.push({
            company_id: company.id,
            name: company.name,
            status: 'skipped',
            reason: 'No matching company found in HubSpot'
          });
          continue;
        }
      } catch (lookupError) {
        console.error(`Error looking up company ${company.name} in HubSpot:`, lookupError);
        results.errors++;
        results.details.push({
          company_id: company.id,
          name: company.name,
          status: 'error',
          error: `HubSpot lookup error: ${lookupError.message}`
        });
        continue;
      }
      
      console.log(`Found HubSpot match for ${company.name}: ${hubspotCompany.properties.name} (ID: ${hubspotCompany.id})`);
      
      // DEBUG: Let's see ALL available properties from HubSpot
      console.log(`===== HUBSPOT PROPERTIES FOR ${company.name} =====`);
      for (const key in hubspotCompany.properties) {
        if (hubspotCompany.properties[key]) {
          console.log(`PROPERTY: ${key} = ${hubspotCompany.properties[key]}`);
        }
      }
      console.log(`=== END HUBSPOT PROPERTIES ===`);
      
      console.log(`HubSpot match details: Website: ${hubspotCompany.properties.website || 'N/A'}, Type: ${hubspotCompany.properties.type || 'N/A'}, LinkedIn: ${hubspotCompany.properties.linkedin_company_page || 'N/A'}`);
      console.log(`Current company values: Website: ${company.website || 'N/A'}, Description: ${company.description ? 'Has description' : 'No description'}, Category: ${company.category || 'N/A'}, LinkedIn: ${company.linkedin || 'N/A'}`);
      
      // Extract category from HubSpot if available - prefer type field
      let category = null;
      if (hubspotCompany.properties.type) {
        // Use type directly as the category - it's already a business category
        category = hubspotCompany.properties.type;
      } else if (hubspotCompany.properties.hs_lead_status) {
        // If lead status is available, might be useful as category
        category = `Status: ${hubspotCompany.properties.hs_lead_status}`;
      }
      
      // Prepare data for update FOCUSING ONLY on required fields
      // For website, clean up the URL to ensure it's properly formatted
      let websiteValue = hubspotCompany.properties.website || hubspotCompany.properties.domain;
      if (websiteValue && !websiteValue.startsWith('http')) {
        websiteValue = `https://${websiteValue}`;
      }
      
      // For LinkedIn, clean up the URL
      let linkedinValue = hubspotCompany.properties.linkedin_company_page;
      if (linkedinValue && !linkedinValue.startsWith('http')) {
        linkedinValue = `https://${linkedinValue}`;
      }
      
      // Prepare update data - ONLY include the fields we care about
      const updateData = {};
      
      console.log(`DECISION MAKING FOR COMPANY ${company.name}:`);
      
      // Website decision
      console.log(`WEBSITE: Company has ${company.website ? company.website : 'NO WEBSITE'}`);
      console.log(`WEBSITE: HubSpot has ${websiteValue ? websiteValue : 'NO WEBSITE'}`);
      if (websiteValue && (!company.website || company.website.length < 10)) {
        updateData.website = websiteValue;
        console.log(`WEBSITE DECISION: Will update with "${websiteValue}"`);
      } else {
        console.log(`WEBSITE DECISION: Will NOT update`);
      }
      
      // Description decision
      const hubspotDescription = hubspotCompany.properties.description || hubspotCompany.properties.about_us;
      console.log(`DESCRIPTION: Company has ${company.description ? (company.description.length + ' chars') : 'NO DESCRIPTION'}`);
      console.log(`DESCRIPTION: HubSpot has description=${hubspotCompany.properties.description ? 'YES' : 'NO'}, about_us=${hubspotCompany.properties.about_us ? 'YES' : 'NO'}`);
      console.log(`DESCRIPTION: Combined HubSpot text is ${hubspotDescription ? (hubspotDescription.length + ' chars') : 'NOT AVAILABLE'}`);
      
      if (hubspotDescription && (!company.description || company.description.length < 50)) {
        updateData.description = hubspotDescription;
        console.log(`DESCRIPTION DECISION: Will update with "${hubspotDescription.substring(0, 50)}..."`);
      } else {
        console.log(`DESCRIPTION DECISION: Will NOT update`);
      }
      
      // LinkedIn decision
      console.log(`LINKEDIN: Company has ${company.linkedin ? company.linkedin : 'NO LINKEDIN'}`);
      console.log(`LINKEDIN: HubSpot has ${linkedinValue ? linkedinValue : 'NO LINKEDIN'}`);
      if (linkedinValue && (!company.linkedin || !company.linkedin.includes('linkedin.com'))) {
        updateData.linkedin = linkedinValue;
        console.log(`LINKEDIN DECISION: Will update with "${linkedinValue}"`);
      } else {
        console.log(`LINKEDIN DECISION: Will NOT update`);
      }
      
      // Category decision
      const categoryValue = hubspotCompany.properties.industry || hubspotCompany.properties.type;
      console.log(`CATEGORY: Company has ${company.category ? company.category : 'NO CATEGORY'}`);
      console.log(`CATEGORY: HubSpot has ${categoryValue ? categoryValue : 'NO CATEGORY'}`);
      if (categoryValue && (!company.category || company.category.length < 3)) {
        updateData.category = categoryValue;
        console.log(`CATEGORY DECISION: Will update with "${categoryValue}"`);
      } else {
        console.log(`CATEGORY DECISION: Will NOT update`);
      }
      
      // Always include hubspot_id for reference
      updateData.hubspot_id = hubspotCompany.id;
      
      // Log what we're updating
      console.log(`Update data for ${company.name}: ${JSON.stringify(updateData)}`);
      
      // Log the enrichment data
      console.log(`Updating company ${company.name} with HubSpot data:`, 
        Object.keys(updateData).filter(k => !!updateData[k]).reduce((obj, key) => {
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
      
      // Handle city relationship - SIMPLIFIED
      if (hubspotCompany.properties.city) {
        const cityName = hubspotCompany.properties.city.trim();
        
        if (cityName) {
          console.log(`Processing city relation: ${cityName}`);
          try {
            // First check if city exists
            const { data: existingCity, error: cityLookupError } = await supabase
              .from('cities')
              .select('id')
              .ilike('name', cityName)
              .maybeSingle();
            
            let cityId;
            
            if (cityLookupError) {
              console.error('Error looking up city:', cityLookupError);
            } else if (existingCity) {
              // Use existing city
              cityId = existingCity.id;
              console.log(`Found existing city: ${cityName} (ID: ${cityId})`);
            } else {
              // Create new city
              console.log(`Creating new city: ${cityName}`);
              const { data: newCity, error: createCityError } = await supabase
                .from('cities')
                .insert({ name: cityName })
                .select('id')
                .single();
              
              if (createCityError) {
                console.error('Error creating city:', createCityError);
              } else {
                cityId = newCity.id;
                console.log(`Created new city: ${cityName} (ID: ${cityId})`);
              }
            }
            
            // Link company to city if we have a cityId
            if (cityId) {
              // Check if relation already exists
              const { data: existingRelation, error: relationLookupError } = await supabase
                .from('companies_cities')
                .select('*')
                .eq('company_id', company.id)
                .eq('city_id', cityId)
                .maybeSingle();
              
              if (relationLookupError) {
                console.error('Error checking relation:', relationLookupError);
              } else if (!existingRelation) {
                // Create relation if it doesn't exist
                const { error: createRelationError } = await supabase
                  .from('companies_cities')
                  .insert({ 
                    company_id: company.id, 
                    city_id: cityId
                  });
                
                if (createRelationError) {
                  console.error('Error creating relation:', createRelationError);
                } else {
                  console.log(`Created company-city relation: ${company.name} + ${cityName}`);
                  updatedRelations.city = true;
                }
              } else {
                console.log(`Company-city relation already exists for ${cityName}`);
                updatedRelations.city = true;
              }
            }
          } catch (cityError) {
            console.error(`Error processing city for ${company.name}:`, cityError);
          }
        }
      }
      
      // Handle category as a tag if it exists
      if (category) {
        console.log(`Processing category as tag: ${category}`);
        try {
          // Check if tag exists or create it
          const { data: existingTags, error: tagLookupError } = await supabase
            .from('tags')
            .select('id, name')
            .ilike('name', category) // Case-insensitive match
            .limit(5);
          
          if (tagLookupError) {
            console.error('Error looking up tag:', tagLookupError);
          }
          
          // Try to find an exact match first
          let tagId;
          let exactMatch = existingTags && existingTags.find(t => 
            t.name.toLowerCase() === category.toLowerCase());
            
          if (exactMatch) {
            tagId = exactMatch.id;
            console.log(`Found exact matching tag: ${exactMatch.name} (ID: ${tagId})`);
          } else if (existingTags && existingTags.length > 0) {
            // If no exact match but similar tags exist, use the first one
            tagId = existingTags[0].id;
            console.log(`Found similar tag: ${existingTags[0].name} (ID: ${tagId})`);
          } else {
            // Create new tag
            console.log(`Creating new tag: ${category}`);
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
            console.log(`Attempting to link company ${company.id} to tag ${tagId}`);
            
            // Check if relation already exists
            const { data: existingRelation, error: relationLookupError } = await supabase
              .from('companies_tags')  // Use the correct table name from schema
              .select('*')
              .eq('company_id', company.id)
              .eq('tag_id', tagId)
              .maybeSingle();
            
            if (relationLookupError) {
              console.error('Error checking company-tag relation:', relationLookupError);
            }
            
            if (!existingRelation) {
              // Create relation - use the correct table name from schema
              console.log(`Creating new company-tag relation: company_id=${company.id}, tag_id=${tagId}`);
              const { error: createRelationError } = await supabase
                .from('companies_tags')  // Use the correct table name from schema
                .insert({ 
                  company_id: company.id, 
                  tag_id: tagId 
                });
              
              if (createRelationError) {
                console.error('Error creating company-tag relation:', createRelationError);
              } else {
                console.log(`Created company-tag relation for ${company.name} and ${category}`);
                updatedRelations.tags = true;
              }
            } else {
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
              .from('companies_tags')
              .select('*')
              .eq('company_id', company.id)
              .eq('tag_id', tagId)
              .maybeSingle();
            
            if (!existingRelation && !relationLookupError) {
              const { error: createRelationError } = await supabase
                .from('companies_tags')
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
      
      // Only count as enriched if we actually updated fields beyond just hubspot_id
      // or if we added city or tag relations
      const realFieldsUpdated = Object.keys(updateData)
        .filter(k => !!updateData[k] && k !== 'hubspot_id')
        .length > 0;
      
      const wasActuallyEnriched = realFieldsUpdated || updatedRelations.city || updatedRelations.tags;
      
      if (wasActuallyEnriched) {
        results.enriched++;
        results.details.push({
          company_id: company.id,
          name: company.name,
          status: 'enriched',
          hubspot_id: hubspotCompany.id,
          hubspot_name: hubspotCompany.properties.name,
          updated_fields: Object.keys(updateData).filter(k => !!updateData[k]),
          updated_relations: updatedRelations
        });
      } else {
        // If we only added the hubspot_id without any real enrichment, count as skipped
        results.skipped++;
        results.details.push({
          company_id: company.id,
          name: company.name,
          status: 'skipped',
          hubspot_id: hubspotCompany.id,
          hubspot_name: hubspotCompany.properties.name,
          reason: 'No meaningful fields to update - company already had all data'
        });
      }
      
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
      scheduled = false,
      check_environment = false
    } = requestBody;
    
    // Log the start of execution
    console.log('Starting HubSpot migration...', {
      limit,
      offset,
      scheduled,
      check_environment
    });
    
    // If this is an environment check request, just return the environment info
    if (check_environment) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Environment check successful',
          timestamp: new Date().toISOString(),
          env_vars_set: {
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            HUBSPOT_ACCESS_TOKEN: !!process.env.HUBSPOT_ACCESS_TOKEN,
            MIGRATION_SECRET_KEY: !!process.env.MIGRATION_SECRET_KEY,
            test_mode: !process.env.MIGRATION_SECRET_KEY || event.headers.authorization === 'Bearer test_migration_key',
            node_version: process.version
          }
        })
      };
    }
    
    // Fetch companies from Supabase - prioritize those missing required fields
    const requiredFields = ['website', 'description', 'category', 'linkedin'];
    
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
            // Try companies missing linkedin
            const linkedinResult = await supabase
              .from('companies')
              .select('*', { count: 'exact' })
              .is('linkedin', null)
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