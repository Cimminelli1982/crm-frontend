// Supabase Edge Function for fetching job title from Apollo using LinkedIn URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Try the enrich endpoint instead of match for more detailed data
const APOLLO_API_URL = 'https://api.apollo.io/v1/people/enrich';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contactId, linkedinUrl } = await req.json();

    if (!contactId || !linkedinUrl) {
      return new Response(
        JSON.stringify({ error: 'Contact ID and LinkedIn URL are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Apollo API key from environment
    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    if (!apolloApiKey) {
      return new Response(
        JSON.stringify({ error: 'Apollo API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Fetch contact to get name for Apollo matching
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('contact_id, first_name, last_name')
      .eq('contact_id', contactId)
      .single();

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({ error: 'Contact not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Call Apollo API - Use LinkedIn URL for enrichment
    console.log('Calling Apollo API with LinkedIn URL:', linkedinUrl);

    const apolloResponse = await fetch(APOLLO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apolloApiKey,
        linkedin_url: linkedinUrl // Enrich endpoint accepts LinkedIn URL directly
      }),
    });

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error('Apollo API error:', apolloResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Apollo API error: ${apolloResponse.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const apolloData = await apolloResponse.json();
    console.log('Full Apollo response:', JSON.stringify(apolloData, null, 2));

    // Log available fields to debug
    if (apolloData?.person) {
      console.log('Available person fields:', Object.keys(apolloData.person));
      console.log('Title field:', apolloData.person.title);
      console.log('Headline field:', apolloData.person.headline);
      console.log('Employment history:', apolloData.person.employment_history?.[0]);
    }

    // Try multiple possible fields for LinkedIn headline/tagline
    // Apollo might use: headline, title, current_title, or employment_history
    const jobTitle =
      apolloData?.person?.headline ||
      apolloData?.person?.title ||
      apolloData?.person?.current_title ||
      apolloData?.person?.employment_history?.[0]?.title ||
      null;

    const apolloLinkedIn = apolloData?.person?.linkedin_url || null;

    // Verify it's the same person by checking LinkedIn URL match
    if (apolloLinkedIn && linkedinUrl) {
      // Normalize URLs for comparison (remove trailing slashes, protocol, etc.)
      const normalizeUrl = (url) => url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (normalizeUrl(apolloLinkedIn) !== normalizeUrl(linkedinUrl)) {
        console.warn('LinkedIn URL mismatch - Apollo returned different person');
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Apollo matched a different person. Please verify the contact details.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    if (jobTitle) {
      // Update contact with job title
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          job_role: jobTitle,
          last_modified_at: new Date().toISOString()
        })
        .eq('contact_id', contactId);

      if (updateError) {
        console.error('Error updating contact:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update contact' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          jobTitle,
          message: `LinkedIn headline updated to: ${jobTitle}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No job title found in Apollo data'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in apollo-job-title function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});