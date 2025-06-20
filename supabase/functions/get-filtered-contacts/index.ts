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

    // FIXED: Main query with proper email filtering for primary emails only
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
        contact_emails!inner (
          email_id,
          email,
          is_primary
        ),
        contact_cities (
          cities (
            name
          )
        ),
        contact_tags (
          tags (
            name
          )
        )
      `)

    // FIXED: Filter for primary emails only in the main query
    query = query.eq('contact_emails.is_primary', true)

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
          query = query.not('last_interaction_at', 'is', null)
        }
      }
    } else {
      // No category filters - apply default "all except Skip" logic
      console.log('No category filters - applying default "all except Skip" logic')
      query = query.neq('category', 'Skip')
    }

    // Apply score filter (handle both score array and score_range)
    if (filters.score && Array.isArray(filters.score) && filters.score.length > 0) {
      console.log('Applying score filter:', filters.score)
      query = query.in('score', filters.score)
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

    // Apply city and tags filters (handled in post-processing for performance)
    if (filters.city && Array.isArray(filters.city) && filters.city.length > 0) {
      console.log('City filter will be applied in post-processing:', filters.city)
    }

    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      console.log('Tags filter will be applied in post-processing:', filters.tags)
    }

    // Apply pagination - increased default limit to 150
    const limit = filters.limit || 150
    const offset = filters.offset || 0
    console.log(`Applying pagination: limit=${limit}, offset=${offset}`)
    
    query = query.range(offset, offset + limit - 1)

    // Execute the query
    console.log('Executing main query...')
    const { data: contacts, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log(`Main query successful. Found ${contacts?.length || 0} contacts`)

    // FIXED: Count query with proper join to contact_emails for primary emails
    let totalQuery = supabase
      .from('contacts')
      .select('contact_id', { count: 'exact', head: true })
      .eq('contact_emails.is_primary', true)

    // FIXED: Add the inner join to contact_emails in count query
    totalQuery = totalQuery.select(`
      contact_id,
      contact_emails!inner(email, is_primary)
    `, { count: 'exact', head: true })

    // Apply the same filters for count query
    if (filters.category && Array.isArray(filters.category) && filters.category.length > 0) {
      if (filters.category.length === 1 && filters.category[0] === 'Inbox') {
        totalQuery = totalQuery.eq('category', 'Inbox').not('last_interaction_at', 'is', null);
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
          totalQuery = totalQuery.not('last_interaction_at', 'is', null');
        }
      }
    } else {
      totalQuery = totalQuery.neq('category', 'Skip')
    }

    // Apply score filter to count query
    if (filters.score && Array.isArray(filters.score) && filters.score.length > 0) {
      totalQuery = totalQuery.in('score', filters.score)
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

    console.log('Executing count query...')
    const { count: totalCount, error: countError } = await totalQuery

    if (countError) {
      console.error('Count query error:', countError)
      throw countError
    }

    console.log(`Total count: ${totalCount}`)

    // FIXED: Improved processing - since we already filter for primary emails in query
    const processedContacts = contacts?.map(contact => {
      // Since we filtered for is_primary=true in query, we can safely get the first email
      const primaryEmail = contact.contact_emails?.[0]?.email || null
      
      // Get city name from contact_cities
      const cityName = contact.contact_cities?.[0]?.cities?.name || null
      
      // Get all tag names from contact_tags
      const tagNames = contact.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || []
      
      return {
        ...contact,
        full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
        email: primaryEmail,
        city: cityName,
        tags: tagNames
      }
    }).filter(contact => {
      // FIXED: Less aggressive filtering since we already have primary emails from query
      if (!contact.email) {
        console.warn('Contact without email found despite primary email filter:', contact.contact_id)
        return false
      }
      
      // Apply city filter in post-processing if specified
      if (filters.city && Array.isArray(filters.city) && filters.city.length > 0) {
        if (!contact.city) return false
        return filters.city.some(filterCity => 
          contact.city.toLowerCase().includes(filterCity.toLowerCase())
        )
      }
      
      // Apply tags filter in post-processing if specified
      if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
        if (!contact.tags || contact.tags.length === 0) return false
        return filters.tags.some(filterTag => 
          contact.tags.some(contactTag => 
            contactTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        )
      }
      
      return true
    }) || []

    const response = {
      contacts: processedContacts,
      total: totalCount || 0,
      filters_applied: filters
    }

    console.log('Returning response with', processedContacts.length, 'contacts out of', totalCount, 'total')

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