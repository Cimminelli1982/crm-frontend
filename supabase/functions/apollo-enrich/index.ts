// Supabase Edge Function for Contact Enrichment using Apollo.io
// Respects existing schema with relationship tables

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Apollo API configuration
const APOLLO_API_URL = 'https://api.apollo.io/v1/people/match';

// Define types for better code safety
interface ContactData {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  email2?: string;
  email3?: string;
  mobile?: string;
  mobile2?: string;
}

interface ApolloRequestData {
  api_key: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
}

interface ApolloResponseData {
  person?: {
    linkedin_url?: string;
    title?: string;
    bio?: string;
    city?: string;
    keywords?: string[];
    organization?: {
      name?: string;
      website_url?: string;
      short_description?: string;
    }
  }
}

interface ContactUpdateData {
  linkedin: string | null;  // Changed from linkedin_url to linkedin
  job_title: string | null;
  about_the_contact: string | null;  // Changed from bio to about_the_contact
  enrichment_date: string;  // Added back as timestampz field
  enrichment_source: string;  // Added back as text field
}

// Core enrichment logic
async function enrichContact(
  supabase: SupabaseClient,
  contactId: string,
  apiKey: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  console.log('Starting contact enrichment for ID:', contactId);
  
  try {
    // Fetch contact data
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, email2, email3, mobile, mobile2')
      .eq('id', contactId)
      .single();
    
    if (error) {
      console.error('Error fetching contact data:', error);
      return { success: false, error: 'Failed to fetch contact data' };
    }
    
    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Prepare data for Apollo API
    const apolloRequestData: ApolloRequestData = {
      api_key: apiKey,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || contact.email2 || contact.email3 || null,
      phone: contact.mobile || contact.mobile2 || null,
    };

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

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error('Apollo API error:', errorText);
      return { 
        success: false, 
        error: `Apollo API error: ${apolloResponse.status} ${errorText}` 
      };
    }

    const apolloData: ApolloResponseData = await apolloResponse.json();
    console.log('Apollo response received:', apolloData);
    
    if (!apolloData.person) {
      return { success: false, error: 'No person data returned from Apollo' };
    }

    // Start updating data
    console.log('Updating contact with Apollo data...');

    // 1. Update basic contact information
    const contactUpdateData: ContactUpdateData = {
      linkedin: apolloData.person?.linkedin_url || null,  // Changed from linkedin_url to linkedin
      job_title: apolloData.person?.title || null,
      about_the_contact: apolloData.person?.bio || null,
      enrichment_source: 'apollo',
      enrichment_date: new Date().toISOString(),
    };

    const { error: updateContactError } = await supabase
      .from('contacts')
      .update(contactUpdateData)
      .eq('id', contactId);
    
    if (updateContactError) {
      console.error('Error updating contact:', updateContactError);
      return { 
        success: false, 
        error: 'Failed to update contact with enriched data' 
      };
    }

    // 2. Handle city relationship if provided
    if (apolloData.person?.city) {
      await handleCityRelationship(supabase, contactId, apolloData.person.city);
    }

    // 3. Handle company information
    if (apolloData.person?.organization?.name) {
      await handleCompanyRelationship(
        supabase, 
        contactId, 
        apolloData.person.organization
      );
    }

    // 4. Handle tags/keywords
    if (apolloData.person?.keywords?.length > 0) {
      await handleTagsRelationships(supabase, contactId, apolloData.person.keywords);
    }

    return {
      success: true,
      data: {
        ...contactUpdateData,
        city: apolloData.person?.city || null,
        company: apolloData.person?.organization?.name || null,
        tags: apolloData.person?.keywords || []
      }
    };
  } catch (error) {
    console.error('Error in enrichContact:', error);
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
    } else {
      // Create new city
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
        const { error: createRelationError } = await supabase
          .from('contact_cities')
          .insert({ contact_id: contactId, city_id: cityId });
        
        if (createRelationError) {
          console.error('Error linking contact to city:', createRelationError);
        } else {
          console.log('Successfully linked contact to city:', cityName);
        }
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
  companyData: {
    name?: string;
    website_url?: string;
    short_description?: string;
  }
): Promise<void> {
  if (!companyData.name) return;
  
  try {
    // First, check if company exists or create it
    const { data: existingCompany, error: companyLookupError } = await supabase
      .from('companies')
      .select('id')
      .eq('name', companyData.name)
      .maybeSingle();
    
    if (companyLookupError) {
      console.error('Error looking up company:', companyLookupError);
      return;
    }

    let companyId;
    if (existingCompany) {
      companyId = existingCompany.id;
      
      // Update company info if we have new details
      if (companyData.website_url || companyData.short_description) {
        const companyUpdateData: Record<string, any> = {};
        
        if (companyData.website_url) {
          companyUpdateData.website = companyData.website_url;
        }
        
        if (companyData.short_description) {
          companyUpdateData.description = companyData.short_description;
        }
        
        const { error: updateCompanyError } = await supabase
          .from('companies')
          .update(companyUpdateData)
          .eq('id', companyId);
        
        if (updateCompanyError) {
          console.error('Error updating company:', updateCompanyError);
        } else {
          console.log('Successfully updated company:', companyData.name);
        }
      }
    } else {
      // Create new company
      const newCompanyData = {
        name: companyData.name,
        website: companyData.website_url || null,
        description: companyData.short_description || null
      };
      
      const { data: newCompany, error: createCompanyError } = await supabase
        .from('companies')
        .insert(newCompanyData)
        .select('id')
        .single();
      
      if (createCompanyError) {
        console.error('Error creating company:', createCompanyError);
        return;
      } else {
        companyId = newCompany.id;
        console.log('Successfully created company:', companyData.name);
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
        const { error: createRelationError } = await supabase
          .from('contact_companies')
          .insert({ contact_id: contactId, company_id: companyId });
        
        if (createRelationError) {
          console.error('Error linking contact to company:', createRelationError);
        } else {
          console.log('Successfully linked contact to company:', companyData.name);
        }
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
      } else {
        // Create new tag
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
          console.log('Successfully created tag:', keyword);
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
          const { error: createRelationError } = await supabase
            .from('contact_tags')
            .insert({ contact_id: contactId, tag_id: tagId });
          
          if (createRelationError) {
            console.error('Error linking contact to tag:', createRelationError);
          } else {
            console.log('Successfully linked contact to tag:', keyword);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in handleTagsRelationships:', error);
  }
}

// Main handler for the Supabase Edge Function
Deno.serve(async (req) => {
  console.log('Apollo enrichment function called');
  
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
    
    const apiKey = Deno.env.get('APOLLO_API_KEY');
    if (!apiKey) {
      console.error('Missing APOLLO_API_KEY environment variable');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing API key' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Perform the enrichment
    const result = await enrichContact(supabaseClient, contactId, apiKey);
    
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
        message: 'Contact successfully enriched',
        data: result.data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Unhandled error in Apollo enrichment function:', error);
    
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