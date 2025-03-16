// Supabase Edge Function for Contact Enrichment using Airtable
// Production-ready implementation

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Airtable API configuration
const AIRTABLE_BASE_ID = 'appTMYAU4N43eJdxG';
const AIRTABLE_TABLE_NAME = 'CONTACTS';
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

// Helper function to create proper Airtable Authorization header
function getAirtableHeaders() {
  // Using updated API key with correct permissions
  return {
    'Authorization': 'Bearer patsAqQtI4eM71EIp.e42097d6cd529026d446be3da1b627c423ed3a5a7b59b0b38a9d77585e0909ea',
    'Content-Type': 'application/json',
  };
}

// Validate the API key is in the correct format
function validateApiKey(key: string): boolean {
  return key.startsWith('pat') && key.includes('.');
}

// Define types for better code safety
interface ContactData {
  id: string;
  airtable_id?: string;
  email?: string;
  email2?: string;
  email3?: string;
  job_title?: string;
  about_the_contact?: string;
}

interface AirtableRecord {
  id: string;
  fields: {
    'Primary email'?: string;
    'Job Title'?: string;
    'Description'?: string;
    'City'?: string[] | string;
    'Keywords'?: string[] | string;
    'Rating'?: number;
    'Company'?: string[] | string;
    // Add any other fields you might want to use
  };
}

interface AirtableResponse {
  records: AirtableRecord[];
}

interface ContactUpdateData {
  job_title?: string;
  about_the_contact?: string;
  email?: string;
  email2?: string;
  email3?: string;
  score?: number;
  airtable_id?: string;
  enrichment_source?: string;
  enrichment_date?: string;
}

// Core enrichment logic
async function enrichContactFromAirtable(
  supabase: SupabaseClient,
  contactId: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  console.log('Starting contact enrichment from Airtable for ID:', contactId);
  
  try {
    // Fetch contact data from Supabase
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('id, airtable_id, email, email2, email3, first_name, last_name')
      .eq('id', contactId)
      .single();
    
    if (error) {
      console.error('Error fetching contact data from Supabase:', error);
      return { success: false, error: 'Failed to fetch contact data' };
    }
    
    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // If we already have an Airtable ID, use it to fetch the record directly
    let airtableRecord: AirtableRecord | null = null;
    
    if (contact.airtable_id) {
      console.log('Fetching Airtable record using existing ID:', contact.airtable_id);
      
      try {
        // Use the helper function to get proper headers
        const headers = getAirtableHeaders();
        
        const response = await fetch(`${AIRTABLE_API_URL}/${contact.airtable_id}`, {
          method: 'GET',
          headers: headers,
          credentials: 'include'
        });
        
        console.log('Airtable API request headers:', {
          Authorization: 'Bearer [REDACTED]',
          'Content-Type': 'application/json'
        });
        
        if (response.ok) {
          const record = await response.json();
          airtableRecord = record;
          console.log('Found Airtable record using ID:', record);
        } else {
          console.log('No record found with the stored Airtable ID, will search by email');
        }
      } catch (error) {
        console.error('Error fetching Airtable record by ID:', error);
      }
    }
    
    // If we don't have an Airtable ID or couldn't find the record, search by email
    if (!airtableRecord) {
      console.log('Searching for Airtable record by email');
      
      // Create a formula to search for any of the contact's emails
      const emails = [contact.email, contact.email2, contact.email3].filter(Boolean);
      
      if (emails.length === 0) {
        return { success: false, error: 'Contact has no email addresses to search with' };
      }
      
      const emailFilterParts = emails.map(email => 
        `{Primary email} = "${email}"`
      );
      
      const filterFormula = `OR(${emailFilterParts.join(',')})`;
      console.log('Using filter formula:', filterFormula);
      
      // Fetch records from Airtable using the email filter
      const url = `${AIRTABLE_API_URL}?filterByFormula=${encodeURIComponent(filterFormula)}`;
      console.log('Requesting Airtable URL:', url);
      console.log('Using API endpoint:', AIRTABLE_API_URL);
      
      // Log for debugging
      console.log('Using hardcoded authorization header');
      
      // Use the helper function to get proper headers
      const headers = getAirtableHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
      
      console.log('Airtable API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Airtable API error:', errorText);
        return { 
          success: false, 
          error: `Airtable API error: ${response.status} ${errorText}` 
        };
      }
      
      const airtableData: AirtableResponse = await response.json();
      console.log('Airtable response received:', airtableData);
      
      if (!airtableData.records || airtableData.records.length === 0) {
        return { success: false, error: 'No matching records found in Airtable' };
      }
      
      // Use the first matching record
      airtableRecord = airtableData.records[0];
      console.log('Using Airtable record:', airtableRecord);
    }
    
    // If we don't have a record at this point, return error
    if (!airtableRecord) {
      return { success: false, error: 'Could not find a matching record in Airtable' };
    }
    
    // Prepare data for Supabase update
    const contactUpdateData: ContactUpdateData = {
      airtable_id: airtableRecord.id,
      job_title: airtableRecord.fields['Job Title'] || null,
      about_the_contact: airtableRecord.fields['Description'] || null,
      score: airtableRecord.fields['Rating'] || null,
      enrichment_source: 'airtable',
      enrichment_date: new Date().toISOString(),
    };
    
    // Handle email fields - only update if they don't already exist
    const primaryEmail = airtableRecord.fields['Primary email'];
    if (primaryEmail) {
      if (!contact.email) {
        contactUpdateData.email = primaryEmail;
      } else if (!contact.email2) {
        contactUpdateData.email2 = primaryEmail;
      } else if (!contact.email3) {
        contactUpdateData.email3 = primaryEmail;
      }
      // If all email fields are full, don't update any
    }
    
    console.log('Updating contact with data:', contactUpdateData);
    
    // Update the contact in Supabase
    const { error: updateContactError } = await supabase
      .from('contacts')
      .update(contactUpdateData)
      .eq('id', contactId);
    
    if (updateContactError) {
      console.error('Error updating contact:', updateContactError);
      return { 
        success: false, 
        error: 'Failed to update contact with Airtable data' 
      };
    }
    
    // Handle city relationships
    const cities = airtableRecord.fields['City'];
    if (cities) {
      const cityNames = Array.isArray(cities) ? cities : [cities];
      for (const cityName of cityNames) {
        await handleCityRelationship(supabase, contactId, cityName);
      }
    }
    
    // Handle keyword/tag relationships
    const keywords = airtableRecord.fields['Keywords'];
    if (keywords) {
      const tagNames = Array.isArray(keywords) ? keywords : [keywords];
      await handleTagsRelationships(supabase, contactId, tagNames);
    }
    
    // Handle company relationship
    const companies = airtableRecord.fields['Company'];
    if (companies) {
      console.log('Company data from Airtable:', companies);
      
      // Check if companies is an array of record IDs or actual company names
      const companyValues = Array.isArray(companies) ? companies : [companies];
      
      // Handle each company
      for (const companyValue of companyValues) {
        // If it looks like an Airtable record ID, try to get the actual company name
        if (typeof companyValue === 'string' && companyValue.startsWith('rec')) {
          console.log('Found company record ID:', companyValue);
          
          try {
            // Try to get the company name from Airtable
            const companyUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/COMPANIES/${companyValue}`;
            console.log('Fetching company details from:', companyUrl);
            
            const companyResponse = await fetch(companyUrl, {
              method: 'GET',
              headers: getAirtableHeaders(),
            });
            
            if (companyResponse.ok) {
              const companyData = await companyResponse.json();
              console.log('Company data fetched:', companyData);
              
              // If we have a name field, use it
              if (companyData.fields && companyData.fields.Name) {
                const actualCompanyName = companyData.fields.Name;
                console.log('Found actual company name:', actualCompanyName);
                await handleCompanyRelationship(supabase, contactId, actualCompanyName);
              } else {
                console.log('Company record found but no name field:', companyData);
              }
            } else {
              console.error('Failed to fetch company details:', await companyResponse.text());
            }
          } catch (error) {
            console.error('Error fetching company details:', error);
          }
          
          continue;
        }
        
        // Direct handling for non-record-ID values
        if (companyValue && typeof companyValue === 'string' && companyValue.length > 0) {
          console.log('Processing company name:', companyValue);
          await handleCompanyRelationship(supabase, contactId, companyValue);
        }
      }
    }
    
    return {
      success: true,
      data: {
        ...contactUpdateData,
        airtable_id: airtableRecord.id,
        cities: cities || null,
        companies: companies || null,
        tags: keywords || null
      }
    };
  } catch (error) {
    console.error('Error in enrichContactFromAirtable:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Helper function to handle city relationships
async function handleCityRelationship(
  supabase: SupabaseClient, 
  contactId: string, 
  cityName: string
): Promise<void> {
  try {
    console.log('Handling city relationship for city:', cityName);
    
    // First, check if city exists or create it
    const { data: existingCity, error: cityLookupError } = await supabase
      .from('cities')
      .select('id')
      .eq('name', cityName)
      .maybeSingle();
    
    if (cityLookupError) {
      console.error('Error looking up city:', cityLookupError);
      return;
    }

    let cityId;
    if (existingCity) {
      cityId = existingCity.id;
      console.log('Found existing city with ID:', cityId);
    } else {
      // Create new city
      console.log('Creating new city:', cityName);
      const { data: newCity, error: createCityError } = await supabase
        .from('cities')
        .insert({ name: cityName })
        .select('id')
        .single();
      
      if (createCityError) {
        console.error('Error creating city:', createCityError);
        return;
      } else {
        cityId = newCity.id;
        console.log('Created new city with ID:', cityId);
      }
    }

    // Link contact to city if we have a cityId
    if (cityId) {
      // Check if relation already exists
      const { data: existingRelation, error: relationLookupError } = await supabase
        .from('contact_cities')
        .select('id')
        .eq('contact_id', contactId)
        .eq('city_id', cityId)
        .maybeSingle();

      if (!existingRelation && !relationLookupError) {
        // Create relation
        console.log('Creating city relationship for contact', contactId, 'and city', cityId);
        const { error: createRelationError } = await supabase
          .from('contact_cities')
          .insert({ contact_id: contactId, city_id: cityId });
        
        if (createRelationError) {
          console.error('Error linking contact to city:', createRelationError);
        } else {
          console.log('Successfully linked contact to city:', cityName);
        }
      } else {
        console.log('Relationship already exists for contact and city');
      }
    }
  } catch (error) {
    console.error('Error in handleCityRelationship:', error);
  }
}

// Helper function to handle company relationships
async function handleCompanyRelationship(
  supabase: SupabaseClient, 
  contactId: string, 
  companyName: string
): Promise<void> {
  if (!companyName) return;
  
  try {
    console.log('Handling company relationship for company:', companyName);
    
    // First, check if this contact already has a relationship with any company
    const { data: existingRelationships, error: relationshipsError } = await supabase
      .from('contact_companies')
      .select('company_id')
      .eq('contact_id', contactId);
    
    if (relationshipsError) {
      console.error('Error checking existing company relationships:', relationshipsError);
      return;
    }
    
    if (existingRelationships && existingRelationships.length > 0) {
      console.log('Contact already has company relationships. Skipping new company addition.');
      console.log('Existing relationships:', existingRelationships);
      return;
    }
    
    // Next, check if company exists or create it
    const { data: existingCompany, error: companyLookupError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', companyName)
      .maybeSingle();
    
    if (companyLookupError) {
      console.error('Error looking up company:', companyLookupError);
      return;
    }

    let companyId;
    if (existingCompany) {
      companyId = existingCompany.id;
      console.log('Found existing company with ID:', companyId);
    } else {
      // Create new company
      console.log('Creating new company:', companyName);
      const { data: newCompany, error: createCompanyError } = await supabase
        .from('companies')
        .insert({ name: companyName })
        .select('id')
        .single();
      
      if (createCompanyError) {
        console.error('Error creating company:', createCompanyError);
        return;
      } else {
        companyId = newCompany.id;
        console.log('Created new company with ID:', companyId);
      }
    }

    // Link contact to company if we have a companyId
    if (companyId) {
      // Check if relation already exists
      const { data: existingRelation, error: relationLookupError } = await supabase
        .from('contact_companies')
        .select('id')
        .eq('contact_id', contactId)
        .eq('company_id', companyId)
        .maybeSingle();

      if (!existingRelation && !relationLookupError) {
        // Create relation
        console.log('Creating company relationship for contact', contactId, 'and company', companyId);
        const { error: createRelationError } = await supabase
          .from('contact_companies')
          .insert({ contact_id: contactId, company_id: companyId });
        
        if (createRelationError) {
          console.error('Error linking contact to company:', createRelationError);
        } else {
          console.log('Successfully linked contact to company:', companyName);
        }
      } else {
        console.log('Relationship already exists for contact and company');
      }
    }
  } catch (error) {
    console.error('Error in handleCompanyRelationship:', error);
  }
}

// Helper function to handle tags relationships
async function handleTagsRelationships(
  supabase: SupabaseClient, 
  contactId: string, 
  keywords: string[]
): Promise<void> {
  try {
    console.log('Handling tag relationships for keywords:', keywords);
    
    for (const keyword of keywords) {
      // First, check if tag exists or create it
      const { data: existingTag, error: tagLookupError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', keyword)
        .maybeSingle();
      
      if (tagLookupError) {
        console.error('Error looking up tag:', tagLookupError);
        continue;
      }

      let tagId;
      if (existingTag) {
        tagId = existingTag.id;
        console.log('Found existing tag with ID:', tagId);
      } else {
        // Create new tag
        console.log('Creating new tag:', keyword);
        const { data: newTag, error: createTagError } = await supabase
          .from('tags')
          .insert({ name: keyword })
          .select('id')
          .single();
        
        if (createTagError) {
          console.error('Error creating tag:', createTagError);
          continue;
        } else {
          tagId = newTag.id;
          console.log('Created new tag with ID:', tagId);
        }
      }

      // Link contact to tag if we have a tagId
      if (tagId) {
        // Check if relation already exists
        const { data: existingRelation, error: relationLookupError } = await supabase
          .from('contact_tags')
          .select('id')
          .eq('contact_id', contactId)
          .eq('tag_id', tagId)
          .maybeSingle();

        if (!existingRelation && !relationLookupError) {
          // Create relation
          console.log('Creating tag relationship for contact', contactId, 'and tag', tagId);
          const { error: createRelationError } = await supabase
            .from('contact_tags')
            .insert({ contact_id: contactId, tag_id: tagId });
          
          if (createRelationError) {
            console.error('Error linking contact to tag:', createRelationError);
          } else {
            console.log('Successfully linked contact to tag:', keyword);
          }
        } else {
          console.log('Relationship already exists for contact and tag');
        }
      }
    }
  } catch (error) {
    console.error('Error in handleTagsRelationships:', error);
  }
}

// Main handler for the Supabase Edge Function
Deno.serve(async (req) => {
  console.log('Airtable enrichment function called');
  
  // Check the authorization header
  const authHeader = getAirtableHeaders().Authorization;
  console.log(`Authorization header set: ${authHeader.length > 0 ? 'Yes' : 'No'}, Length: ${authHeader.length}`);
  
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Parse request body
    const requestData = await req.json();
    const { contactId } = requestData;
    
    console.log('Request data:', { contactId });
    
    if (!contactId) {
      return new Response(
        JSON.stringify({ error: 'Contact ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Create a Supabase client with the Deno runtime API key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Log headers info for debugging
    const headers = getAirtableHeaders();
    console.log('Using hardcoded Authorization header');
    console.log('Authorization header starts with:', headers.Authorization.substring(0, 12));
    console.log('Authorization header length:', headers.Authorization.length);
    
    // Perform the enrichment
    const result = await enrichContactFromAirtable(supabaseClient, contactId);
    
    if (!result.success) {
      console.error('Enrichment failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('Enrichment successful:', result.data);
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        message: 'Contact successfully enriched from Airtable',
        data: result.data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Unhandled error in Airtable enrichment function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});