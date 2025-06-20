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

interface EmailCampaignRequest {
  listId?: string
  contactIds?: string[]
  subject?: string
  fromName?: string
  fromEmail?: string
  htmlContent?: string
  testMode?: boolean
}

console.log("Hello from send-email-campaign!")

Deno.serve(async (req) => {
  // Handle CORS preflight
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
    const request: EmailCampaignRequest = await req.json()
    console.log('Email campaign request:', request)

    // Email data with defaults
    const emailData = {
      subject: request.subject || 'Email dal CRM',
      fromName: request.fromName || 'CRM Netlify',
      fromEmail: request.fromEmail || 'onboarding@resend.dev',
      htmlContent: request.htmlContent || '<h1>Ciao {{first_name}}!</h1><p>Email dal CRM su Netlify!</p>'
    }

    console.log('Email data:', emailData)

    // Get contacts to send to
    let contacts = []

    if (request.listId) {
      // Get contacts from email list
      const { data: listMembers, error: listError } = await supabase
        .from('email_list_members')
        .select('contact_id, email_address, contacts(first_name, last_name)')
        .eq('list_id', request.listId)

      if (listError) {
        throw new Error('Error getting list members: ' + listError.message)
      }

      contacts = listMembers || []
    } else if (request.contactIds && request.contactIds.length > 0) {
      // Get specific contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, contact_emails!inner(email, is_primary)')
        .in('contact_id', request.contactIds)

      if (contactsError) {
        throw new Error('Error getting contacts: ' + contactsError.message)
      }

      contacts = contactsData?.map(contact => ({
        contact_id: contact.contact_id,
        email_address: contact.contact_emails.find(e => e.is_primary)?.email || contact.contact_emails[0]?.email,
        contacts: {
          first_name: contact.first_name,
          last_name: contact.last_name
        }
      })) || []
    } else {
      throw new Error('Either listId or contactIds must be provided')
    }

    if (contacts.length === 0) {
      throw new Error('No contacts found to send emails to')
    }

    console.log(`Sending to ${contacts.length} contacts`)

    // Send emails using Resend API
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || 're_RwhvDF2c_9Zx9LwyoXHcb11jH6JvUVaf8'
    const sentEmails = []
    const failedEmails = []

    for (const contact of contacts) {
      if (!contact.email_address) {
        failedEmails.push({
          contact_id: contact.contact_id,
          error: 'No email address'
        })
        continue
      }

      try {
        // Personalize content
        const personalizedContent = emailData.htmlContent
          .replace(/{{first_name}}/g, contact.contacts?.first_name || 'Cliente')
          .replace(/{{last_name}}/g, contact.contacts?.last_name || '')

        // Send email via Resend
        const emailPayload = {
          from: emailData.fromName + ' <' + emailData.fromEmail + '>',
          to: [contact.email_address],
          subject: emailData.subject,
          html: personalizedContent
        }

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + resendApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        })

        if (!response.ok) {
          const errorData = await response.text()
          throw new Error('Resend API error: ' + errorData)
        }

        const result = await response.json()
        sentEmails.push({
          contact_id: contact.contact_id,
          email: contact.email_address,
          email_id: result.id
        })

        console.log(`Email sent to ${contact.email_address}: ${result.id}`)

      } catch (error) {
        console.error(`Failed to send email to ${contact.email_address}:`, error)
        failedEmails.push({
          contact_id: contact.contact_id,
          email: contact.email_address,
          error: error.message
        })
      }
    }

    // Return results
    return new Response(JSON.stringify({
      success: true,
      message: 'Campaign sent to ' + sentEmails.length + ' recipients',
      results: {
        sent: sentEmails.length,
        failed: failedEmails.length,
        total: contacts.length
      },
      details: {
        sentEmails: sentEmails,
        failedEmails: failedEmails
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in send-email-campaign:', error)
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-email-campaign' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
