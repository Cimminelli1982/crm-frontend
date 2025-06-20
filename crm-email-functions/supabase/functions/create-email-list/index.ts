// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface CreateListRequest {
  name: string
  description?: string
  listType: 'dynamic' | 'static'
  queryFilters?: any
  contactIds?: string[]
}

console.log("Hello from create-email-list!")

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request
    const { name, description, listType, queryFilters, contactIds }: CreateListRequest = await req.json()

    console.log('Creating list:', { name, listType, contactCount: contactIds?.length || 0 })

    // Input validation
    if (!name || name.trim().length === 0) {
      throw new Error('List name is required')
    }

    if (listType === 'static' && (!contactIds || contactIds.length === 0)) {
      throw new Error('Static list requires at least one contact')
    }

    // 1. Create the list
    const { data: list, error: listError } = await supabase
      .from('email_lists')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        list_type: listType,
        query_filters: queryFilters || null
      })
      .select()
      .single()

    if (listError) {
      console.error('Error creating list:', listError)
      throw new Error(`Error creating list: ${listError.message}`)
    }

    console.log('List created with ID:', list.list_id)

    // 2. If static list, add contacts
    if (listType === 'static' && contactIds && contactIds.length > 0) {
      
      // Get contact data with emails
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          contact_emails!inner(email, is_primary)
        `)
        .in('contact_id', contactIds)

      if (contactsError) {
        console.error('Error retrieving contacts:', contactsError)
        throw new Error(`Error retrieving contacts: ${contactsError.message}`)
      }

      console.log(`Found ${contacts.length} contacts to add`)

      // Prepare list members
      const listMembers = contacts.map(contact => {
        // Find primary email or take the first
        const primaryEmail = contact.contact_emails.find(e => e.is_primary)?.email || 
                           contact.contact_emails[0]?.email

        return {
          list_id: list.list_id,
          contact_id: contact.contact_id,
          email_address: primaryEmail || ''
        }
      }).filter(member => member.email_address) // Only valid email contacts

      if (listMembers.length === 0) {
        throw new Error('No selected contacts have a valid email address')
      }

      // Insert members into the list
      const { error: membersError } = await supabase
        .from('email_list_members')
        .insert(listMembers)

      if (membersError) {
        console.error('Error inserting members:', membersError)
        // Rollback: delete the created list
        await supabase.from('email_lists').delete().eq('list_id', list.list_id)
        throw new Error(`Error adding contacts: ${membersError.message}`)
      }

      console.log(`Added ${listMembers.length} members to the list`)
    }

    // 3. Get final list data
    const { data: finalList, error: finalError } = await supabase
      .from('email_lists')
      .select(`
        *,
        email_list_members(
          contact_id,
          email_address,
          contacts(first_name, last_name)
        )
      `)
      .eq('list_id', list.list_id)
      .single()

    if (finalError) {
      console.error('Error retrieving final list:', finalError)
      throw finalError
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'List created successfully',
      list: {
        list_id: finalList.list_id,
        name: finalList.name,
        description: finalList.description,
        list_type: finalList.list_type,
        total_contacts: finalList.total_contacts,
        active_contacts: finalList.active_contacts,
        created_at: finalList.created_at,
        members_count: finalList.email_list_members?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in create-email-list function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-email-list' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
