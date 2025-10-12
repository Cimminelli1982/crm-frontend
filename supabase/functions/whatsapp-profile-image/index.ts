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
    const { contactId } = await req.json();

    if (!contactId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Contact ID is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Initialize Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get Timelines API credentials from environment
    const timelinesApiKey = Deno.env.get('TIMELINES_API_KEY');
    const timelinesBaseUrl = 'https://app.timelines.ai/integrations/api';

    if (!timelinesApiKey) {
      console.error('Timelines API key not configured');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Timelines integration not configured'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // First, get the contact's last name to search for chats
    const { data: contactInfo, error: contactError } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('contact_id', contactId)
      .single();

    if (!contactInfo) {
      console.error('Contact not found:', contactError);
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

    console.log('Looking for WhatsApp chat for:', contactInfo.first_name, contactInfo.last_name);

    // Get the external_chat_id - try both linked and orphaned chats
    let chatData = null;

    // First try with contact_id in contact_chats (properly linked)
    const result1 = await supabase
      .from('contact_chats')
      .select(`
        chats!inner(
          external_chat_id,
          is_group_chat,
          chat_name
        )
      `)
      .eq('contact_id', contactId)
      .eq('chats.is_group_chat', false)
      .not('chats.external_chat_id', 'is', null)
      .limit(1)
      .single();

    if (result1.data) {
      chatData = result1.data;
      console.log('Found linked chat:', chatData);
    } else {
      // If no linked chat, search for orphaned chats where last_name is in chat_name
      console.log('No linked chat, searching by last name in chat_name');

      const result2 = await supabase
        .from('chats')
        .select('external_chat_id, is_group_chat, chat_name')
        .eq('is_group_chat', false)
        .ilike('chat_name', `%${contactInfo.last_name}%`)
        .not('external_chat_id', 'is', null)
        .limit(1)
        .single();

      if (result2.data) {
        chatData = { chats: result2.data };
        console.log('Found orphaned chat by last name:', result2.data);
      }
    }

    if (!chatData) {
      console.log('No individual WhatsApp chats found for contact:', contactId);

      // If no individual chat found, check if there are any group chats
      const { data: groupChatData } = await supabase
        .from('contact_chats')
        .select(`
          chats!inner(
            external_chat_id,
            is_group_chat,
            chat_name
          )
        `)
        .eq('contact_id', contactId)
        .eq('chats.is_group_chat', true)
        .not('chats.external_chat_id', 'is', null)
        .limit(1);

      if (groupChatData && groupChatData.length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Only group chats found for this contact. Profile images are not available for group chats.'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: 'No WhatsApp chat history found for this contact'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    const externalChatId = chatData.chats.external_chat_id;
    const chatName = chatData.chats.chat_name;
    console.log(`Found individual chat ID from database: ${externalChatId} (${chatName})`);

    // Now get the chat details from Timelines API using the external_chat_id
    const chatDetailsUrl = `${timelinesBaseUrl}/chats/${externalChatId}`;
    console.log(`Fetching chat details from: ${chatDetailsUrl}`);

    const chatDetailsResponse = await fetch(chatDetailsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${timelinesApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!chatDetailsResponse.ok) {
      console.error('Timelines API error (chat details):', chatDetailsResponse.status, await chatDetailsResponse.text());
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to fetch chat details from Timelines'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const chatResponse = await chatDetailsResponse.json();
    console.log('Chat response:', chatResponse);

    // Timelines API returns data in a wrapper object
    const chatDetails = chatResponse.data || chatResponse;
    console.log('Chat details:', chatDetails);

    // Extract the profile photo URL from the chat details
    // Timelines returns the photo in the 'photo' field
    let profileImageUrl = chatDetails.photo;

    if (!profileImageUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No profile image found in WhatsApp via Timelines'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // If it's a relative URL from Timelines, make it absolute
    if (profileImageUrl.startsWith('/')) {
      profileImageUrl = `https://app.timelines.ai${profileImageUrl}`;
    }

    console.log(`Found profile image URL: ${profileImageUrl}`);

    // Return the profile image URL
    return new Response(
      JSON.stringify({
        success: true,
        profileImageUrl,
        source: 'whatsapp_timelines',
        additionalData: {
          name: chatDetails.name || chatDetails.full_name || chatName,
          phone: chatDetails.phone || chatDetails.contact_phone,
          chatId: externalChatId
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in whatsapp-profile-image function:', error);
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