// Supabase Edge Function for Contact Enrichment using Apollo.io
// Respects existing schema with relationship tables

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Apollo API configuration
const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const APOLLO_API_URL = 'https://api.apollo.io/v1/people/match';

// Netlify serverless function handler
exports.handler = async (event, context) => {
  console.log('Apollo Enrichment function called', { body: event.body });
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  
  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    const { contactId } = requestBody;
    
    if (!contactId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Contact ID is required" })
      };
    }

    // Fetch contact data from Supabase
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, email2, email3, mobile, mobile2')
      .eq('id', contactId)
      .single();
    
    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch contact data" })
      };
    }
    
    if (!contact) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Contact not found" })
      };
    }

    // Prepare data for Apollo API
    const apolloRequestData = {
      api_key: APOLLO_API_KEY,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || contact.email2 || contact.email3 || null,
      phone: contact.mobile || contact.mobile2 || null,
    };

    // Call Apollo API
    const apolloResponse = await fetch(APOLLO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apolloRequestData),
    });

    const apolloData = await apolloResponse.json();
    
    if (!apolloResponse.ok) {
      return {
        statusCode: apolloResponse.status,
        body: JSON.stringify({ error: "Apollo API error", details: apolloData })
      };
    }

    // Start a transaction to update multiple tables
    // We'll use a simple approach of consecutive operations with error checking

    // 1. Update basic contact information
    const contactUpdateData = {
      linkedin_url: apolloData.person?.linkedin_url || null,
      job_title: apolloData.person?.title || null,
      bio: apolloData.person?.bio || null,
      enrichment_source: 'apollo',
      enrichment_date: new Date().toISOString(),
    };

    const { error: updateContactError } = await supabase
      .from('contacts')
      .update(contactUpdateData)
      .eq('id', contactId);
    
    if (updateContactError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "Failed to update contact with enriched data", 
          details: updateContactError 
        })
      };
    }

    // 2. Handle city relationship if provided
    if (apolloData.person?.city) {
      // First, check if city exists or create it
      const { data: existingCity, error: cityLookupError } = await supabase
        .from('cities')  // Assuming you have a cities table
        .select('id')
        .eq('name', apolloData.person.city)
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
          .insert({ name: apolloData.person.city })
          .select('id')
          .single();
        
        if (createCityError) {
          console.error('Error creating city:', createCityError);
        } else {
          cityId = newCity.id;
        }
      }

      // Link contact to city if we have a cityId
      if (cityId) {
        // Check if relation already exists
        const { data: existingRelation, error: relationLookupError } = await supabase
          .from('contact_cities')  // Assuming this is your junction table
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
          }
        }
      }
    }

    // 3. Handle company information
    if (apolloData.person?.organization?.name) {
      // First, check if company exists or create it
      const { data: existingCompany, error: companyLookupError } = await supabase
        .from('companies')  // Assuming you have a companies table
        .select('id')
        .eq('name', apolloData.person.organization.name)
        .maybeSingle();
      
      if (companyLookupError) {
        console.error('Error looking up company:', companyLookupError);
      }

      let companyId;
      if (existingCompany) {
        companyId = existingCompany.id;
        
        // Update company info if we have new details
        if (apolloData.person.organization.website_url || apolloData.person.organization.short_description) {
          const companyUpdateData = {};
          
          if (apolloData.person.organization.website_url) {
            companyUpdateData.website = apolloData.person.organization.website_url;
          }
          
          if (apolloData.person.organization.short_description) {
            companyUpdateData.description = apolloData.person.organization.short_description;
          }
          
          const { error: updateCompanyError } = await supabase
            .from('companies')
            .update(companyUpdateData)
            .eq('id', companyId);
          
          if (updateCompanyError) {
            console.error('Error updating company:', updateCompanyError);
          }
        }
      } else {
        // Create new company
        const newCompanyData = {
          name: apolloData.person.organization.name,
          website: apolloData.person.organization.website_url || null,
          description: apolloData.person.organization.short_description || null
        };
        
        const { data: newCompany, error: createCompanyError } = await supabase
          .from('companies')
          .insert(newCompanyData)
          .select('id')
          .single();
        
        if (createCompanyError) {
          console.error('Error creating company:', createCompanyError);
        } else {
          companyId = newCompany.id;
        }
      }

      // Link contact to company if we have a companyId
      if (companyId) {
        // Check if relation already exists
        const { data: existingRelation, error: relationLookupError } = await supabase
          .from('contact_companies')  // Assuming this is your junction table
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
          }
        }
      }
    }

    // 4. Handle tags/keywords
    if (apolloData.person?.keywords?.length > 0) {
      for (const keyword of apolloData.person.keywords) {
        // First, check if tag exists or create it
        const { data: existingTag, error: tagLookupError } = await supabase
          .from('tags')  // Assuming you have a tags table
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
          }
        }

        // Link contact to tag if we have a tagId
        if (tagId) {
          // Check if relation already exists
          const { data: existingRelation, error: relationLookupError } = await supabase
            .from('contact_tags')  // Assuming this is your junction table
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
            }
          }
        }
      }
    }

    const responseData = {
      message: "Contact successfully enriched",
      data: {
        ...contactUpdateData,
        city: apolloData.person?.city || null,
        company: apolloData.person?.organization?.name || null,
        tags: apolloData.person?.keywords || []
      }
    };
    
    console.log('Apollo enrichment successful:', responseData);
    
    return {
      statusCode: 200,
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Error enriching contact:', error);
    const errorMessage = error.message || "Internal server error";
    console.log('Apollo enrichment failed:', errorMessage);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};