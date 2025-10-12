import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const { contactId, linkedinUrl } = await req.json();

    if (!contactId || !linkedinUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Contact ID and LinkedIn URL are required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Apollo API key from environment
    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    if (!apolloApiKey) {
      console.error('Apollo API key not configured');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Apollo integration not configured'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Extract LinkedIn username from URL
    const linkedinMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (!linkedinMatch) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid LinkedIn URL format'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    const linkedinUsername = linkedinMatch[1];

    // Get contact details for better matching
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('first_name, last_name, contact_emails(email)')
      .eq('contact_id', contactId)
      .single();

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Contact not found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Call Apollo People API to get profile data
    const apolloUrl = 'https://api.apollo.io/v1/people/match';

    const requestBody = {
      linkedin_url: linkedinUrl,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.contact_emails?.[0]?.email
    };

    const apolloResponse = await fetch(apolloUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloApiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!apolloResponse.ok) {
      console.error('Apollo API error:', apolloResponse.status, await apolloResponse.text());
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to fetch from Apollo'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const apolloData = await apolloResponse.json();

    if (!apolloData || !apolloData.person) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No profile data found on Apollo'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Extract profile image URL from Apollo response
    const profileImageUrl = apolloData.person.photo_url ||
                           apolloData.person.profile_pic_url ||
                           apolloData.person.picture_url;

    if (!profileImageUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No profile image found in Apollo data'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Don't update directly - let the frontend handle the save

    return new Response(
      JSON.stringify({
        success: true,
        profileImageUrl,
        source: 'apollo',
        additionalData: {
          name: apolloData.person.name,
          title: apolloData.person.title,
          company: apolloData.person.organization?.name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in apollo-profile-image function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An error occurred while fetching profile image',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});