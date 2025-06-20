// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { filters } = await req.json()
    console.log('Received filters:', JSON.stringify(filters, null, 2))

    // Start building the query
    let query = supabase
      .from('contacts')
      .select(`
        contact_id,
        first_name,
        last_name,
        category,
        score,
        keep_in_touch_frequency,
        created_at,
        last_interaction_at,
        contact_emails (
          email_id,
          email,
          is_primary
        )
      `)

    // Handle category filters with special mappings
    if (filters.category && Array.isArray(filters.category) && filters.category.length > 0) {
      console.log('Processing category filters:', filters.category)
      
      // Check if Inbox is the only filter (special case)
      if (filters.category.length === 1 && filters.category[0] === 'Inbox') {
        console.log('Applying Inbox-only filter: category=Inbox AND last_interaction_at IS NOT NULL')
        query = query.eq('category', 'Inbox').not('last_interaction_at', 'is', null)
      } else {
        // Handle other categories and mixed filters
        const categoryConditions: string[] = []
        const scoreConditions: number[] = []
        let hasInbox = false
        
        for (const category of filters.category) {
          console.log('Processing category:', category)
          
          if (category === 'Rockstars') {
            // Rockstars = contacts with score = 5
            scoreConditions.push(5)
          } else if (category === 'Inbox') {
            hasInbox = true
            categoryConditions.push('Inbox')
          } else if (category === 'Professional Investor') {
            categoryConditions.push('Professional Investor')
          } else if (category === 'Founder') {
            categoryConditions.push('Founder')
          } else if (category === 'Manager') {
            categoryConditions.push('Manager')
          } else if (category === 'People I Care') {
            categoryConditions.push('Friend and Family')
          } else {
            // Handle any other valid categories
            categoryConditions.push(category)
          }
        }
        
        // Apply category conditions
        if (categoryConditions.length > 0) {
          console.log('Applying category conditions:', categoryConditions)
          query = query.in('category', categoryConditions)
        }
        
        // Apply score conditions for Rockstars
        if (scoreConditions.length > 0) {
          console.log('Applying score conditions:', scoreConditions)
          query = query.in('score', scoreConditions)
        }
        
        // Apply special Inbox logic if Inbox is included with other filters
        if (hasInbox && categoryConditions.includes('Inbox')) {
          console.log('Applying special Inbox logic for mixed filters')
          // This is complex - we need to handle Inbox specially even in mixed filters
          // For now, let's apply the last_interaction_at filter globally when Inbox is present
          query = query.not('last_interaction_at', 'is', null)
        }
      }
    } else {
      // No category filters - apply default "all except Skip" logic
      console.log('No category filters - applying default "all except Skip" logic')
      query = query.neq('category', 'Skip')
    }

    // Apply score range filter
    if (filters.score_range && Array.isArray(filters.score_range) && filters.score_range.length === 2) {
      const [minScore, maxScore] = filters.score_range
      console.log(`Applying score range filter: ${minScore} to ${maxScore}`)
      query = query.gte('score', minScore).lte('score', maxScore)
    }

    // Apply keep_in_touch filter
    if (filters.keep_in_touch && Array.isArray(filters.keep_in_touch) && filters.keep_in_touch.length > 0) {
      console.log('Applying keep_in_touch filter:', filters.keep_in_touch)
      query = query.in('keep_in_touch_frequency', filters.keep_in_touch)
    }

    // Apply pagination
    const limit = filters.limit || 1000
    const offset = filters.offset || 0
    console.log(`Applying pagination: limit=${limit}, offset=${offset}`)
    
    query = query.range(offset, offset + limit - 1)

    // Execute the query
    console.log('Executing query...')
    const { data: contacts, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log(`Query successful. Found ${contacts?.length || 0} contacts`)

    // Get total count for pagination
    let totalQuery = supabase
      .from('contacts')
      .select('contact_id', { count: 'exact', head: true })

    // Apply the same filters for count query
    if (filters.category && Array.isArray(filters.category) && filters.category.length > 0) {
      if (filters.category.length === 1 && filters.category[0] === 'Inbox') {
        totalQuery = totalQuery.eq('category', 'Inbox').not('last_interaction_at', 'is', null)
      } else {
        const categoryConditions: string[] = []
        const scoreConditions: number[] = []
        let hasInbox = false
        
        for (const category of filters.category) {
          if (category === 'Rockstars') {
            scoreConditions.push(5)
          } else if (category === 'Inbox') {
            hasInbox = true
            categoryConditions.push('Inbox')
          } else if (category === 'Professional Investor') {
            categoryConditions.push('Professional Investor')
          } else if (category === 'Founder') {
            categoryConditions.push('Founder')
          } else if (category === 'Manager') {
            categoryConditions.push('Manager')
          } else if (category === 'People I Care') {
            categoryConditions.push('Friend and Family')
          } else {
            categoryConditions.push(category)
          }
        }
        
        if (categoryConditions.length > 0) {
          totalQuery = totalQuery.in('category', categoryConditions)
        }
        
        if (scoreConditions.length > 0) {
          totalQuery = totalQuery.in('score', scoreConditions)
        }
        
        if (hasInbox && categoryConditions.includes('Inbox')) {
          totalQuery = totalQuery.not('last_interaction_at', 'is', null)
        }
      }
    } else {
      totalQuery = totalQuery.neq('category', 'Skip')
    }

    // Apply score range filter to count query
    if (filters.score_range && Array.isArray(filters.score_range) && filters.score_range.length === 2) {
      const [minScore, maxScore] = filters.score_range
      totalQuery = totalQuery.gte('score', minScore).lte('score', maxScore)
    }

    // Apply keep_in_touch filter to count query
    if (filters.keep_in_touch && Array.isArray(filters.keep_in_touch) && filters.keep_in_touch.length > 0) {
      totalQuery = totalQuery.in('keep_in_touch_frequency', filters.keep_in_touch)
    }

    const { count: totalCount, error: countError } = await totalQuery

    if (countError) {
      console.error('Count query error:', countError)
      throw countError
    }

    console.log(`Total count: ${totalCount}`)

    // Process contacts to ensure full_name is available and add primary email
    const processedContacts = contacts?.map(contact => {
      // Find primary email or first email
      const primaryEmail = contact.contact_emails?.find(email => email.is_primary) || contact.contact_emails?.[0]
      
      return {
        ...contact,
        full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
        email: primaryEmail?.email || '' // Add email field from contact_emails
      }
    }) || []

    const response = {
      contacts: processedContacts,
      total: totalCount || 0,
      filters_applied: filters
    }

    console.log('Returning response with', processedContacts.length, 'contacts')

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
}) 