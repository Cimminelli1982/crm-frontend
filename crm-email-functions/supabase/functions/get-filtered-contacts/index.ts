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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

console.log("Get Filtered Contacts Edge Function loaded")

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
      )
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body
    const requestData = await req.json()
    const { filters } = requestData
    
    console.log('Received filters:', JSON.stringify(filters))

    if (!filters) {
      return new Response(
        JSON.stringify({ error: 'Filters are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build the query
    let query = supabaseClient
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
        contact_emails(email, is_primary)
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
        let hasInboxInMixed = false
        
        for (const category of filters.category) {
          console.log('Processing category:', category)
          
          if (category === 'Rockstars') {
            // Rockstars = contacts with score = 5
            scoreConditions.push(5)
          } else if (category === 'Inbox') {
            hasInboxInMixed = true
            // Will be handled in OR condition below
          } else if (category === 'Professional Investor') {
            categoryConditions.push('Professional Investor')
          } else if (category === 'Founder') {
            categoryConditions.push('Founder')
          } else if (category === 'Manager') {
            categoryConditions.push('Manager')
          } else if (category === 'Friend and Family') {
            categoryConditions.push('Friend and Family')
          } else if (category === 'Advisor') {
            categoryConditions.push('Advisor')
          } else if (category === 'Team') {
            categoryConditions.push('Team')
          } else if (category === 'Supplier') {
            categoryConditions.push('Supplier')
          } else if (category === 'Other') {
            categoryConditions.push('Other')
          } else if (category === 'Skip') {
            categoryConditions.push('Skip')
          } else {
            // Default: use the category as-is
            categoryConditions.push(category)
          }
        }
        
        // Build OR conditions for mixed filters
        const orConditions: string[] = []
        
        if (categoryConditions.length > 0) {
          orConditions.push(`category.in.(${categoryConditions.join(',')})`)
        }
        
        if (scoreConditions.length > 0) {
          orConditions.push(`score.in.(${scoreConditions.join(',')})`)
        }
        
        if (hasInboxInMixed) {
          orConditions.push(`and(category.eq.Inbox,last_interaction_at.not.is.null)`)
        }
        
        // Apply OR conditions
        if (orConditions.length > 0) {
          if (orConditions.length === 1) {
            const condition = orConditions[0]
            if (condition.startsWith('category.in.')) {
              const categories = condition.replace('category.in.(', '').replace(')', '').split(',')
              query = query.in('category', categories)
            } else if (condition.startsWith('score.in.')) {
              const scores = condition.replace('score.in.(', '').replace(')', '').split(',').map(Number)
              query = query.in('score', scores)
            }
          } else {
            console.log('Applying OR conditions:', orConditions.join(','))
            query = query.or(orConditions.join(','))
          }
        }
      }
    } else {
      // No category filters - apply "all except Skip" logic
      console.log('No category filters - applying "all except Skip" logic')
      query = query.neq('category', 'Skip')
    }

    // Apply score range filter (if not already applied by category)
    if (filters.score_range && Array.isArray(filters.score_range) && filters.score_range.length === 2) {
      const [minScore, maxScore] = filters.score_range
      console.log('Applying score range filter:', minScore, 'to', maxScore)
      
      // Only apply if we didn't already filter by score in category
      const hasRockstarsFilter = filters.category && filters.category.includes('Rockstars')
      if (!hasRockstarsFilter) {
        query = query.gte('score', minScore).lte('score', maxScore)
      }
    }

    // Apply keep in touch frequency filter
    if (filters.keep_in_touch && Array.isArray(filters.keep_in_touch) && filters.keep_in_touch.length > 0) {
      console.log('Applying keep in touch filter:', filters.keep_in_touch)
      
      // Map frontend values to database values
      const mappedFrequencies = filters.keep_in_touch.map(freq => {
        switch (freq.toLowerCase()) {
          case 'weekly': return 'Weekly'
          case 'monthly': return 'Monthly'
          case 'quarterly': return 'Quarterly'
          case 'once_per_year': return 'Once per Year'
          case 'not_set': return null
          default: return freq
        }
      })
      
      // Handle null values separately
      if (mappedFrequencies.includes(null)) {
        const nonNullFreqs = mappedFrequencies.filter(f => f !== null)
        if (nonNullFreqs.length > 0) {
          query = query.or(`keep_in_touch_frequency.in.(${nonNullFreqs.join(',')}),keep_in_touch_frequency.is.null`)
        } else {
          query = query.is('keep_in_touch_frequency', null)
        }
      } else {
        query = query.in('keep_in_touch_frequency', mappedFrequencies)
      }
    }

    // Apply limit and offset
    const limit = filters.limit || 1000
    const offset = filters.offset || 0
    
    console.log('Applying limit:', limit, 'offset:', offset)
    query = query.range(offset, offset + limit - 1)

    // Execute query
    console.log('Executing query...')
    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: `Database error: ${error.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Query successful, found', data?.length || 0, 'contacts')

    // Transform the data to match expected format
    const transformedContacts = data?.map(contact => ({
      contact_id: contact.contact_id,
      full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.contact_emails && contact.contact_emails.length > 0 ? contact.contact_emails[0]?.email || '' : '',
      category: contact.category,
      score: contact.score,
      keep_in_touch_frequency: contact.keep_in_touch_frequency,
      created_at: contact.created_at,
      last_interaction_at: contact.last_interaction_at
    })) || []

    // Return response
    const response = {
      contacts: transformedContacts,
      total: transformedContacts.length,
      filters_applied: {
        category: filters.category,
        score_range: filters.score_range,
        keep_in_touch: filters.keep_in_touch,
        limit: limit,
        offset: offset
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
  return new Response(
      JSON.stringify({ error: `Function error: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-filtered-contacts' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
