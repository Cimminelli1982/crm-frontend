import { createClient } from '@supabase/supabase-js'

// Hardcode the correct values to avoid any environment variable issues
const supabaseUrl = 'https://efazuvegwxouysfcgwja.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYXp1dmVnd3hvdXlzZmNnd2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mjk1MjcsImV4cCI6MjA1MTUwNTUyN30.1G5n0CyQEHGeE1XaJld_PbpstUFd0Imaao6N8MUmfvE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types per TypeScript
export interface Contact {
  contact_id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  category: string
  score: number
  keep_in_touch_frequency: string
  city: string | null
  company: string | null
  created_at: string
}

export interface EmailList {
  list_id: string
  name: string
  description: string | null
  list_type: 'dynamic' | 'static'
  query_filters: any
  total_contacts: number
  active_contacts: number
  created_at: string
  last_modified_at: string
  is_active: boolean
}

export interface FilterOptions {
  category?: string[]
  score?: number[]
  city?: string[]
  keepInTouchFrequency?: string[]
  searchText?: string
}

// API calls
export const emailAPI = {
  // Filtra contatti - Using direct fetch to Edge Function (temporary fix)
  getFilteredContacts: async (filters: FilterOptions) => {
    console.log('🌐 Calling Edge Function with filters:', filters)
    
    try {
      // Convert frontend FilterOptions to Edge Function format
      const requestBody = {
        filters: {
          category: filters.category && filters.category.length > 0 ? filters.category : [],
          score_range: filters.score && filters.score.length > 0 ? [Math.min(...filters.score), Math.max(...filters.score)] : [0, 5],
          keep_in_touch: filters.keepInTouchFrequency && filters.keepInTouchFrequency.length > 0 
            ? filters.keepInTouchFrequency.map(freq => freq.toLowerCase().replace(/ /g, '_'))
            : [],
          limit: 1000, // Get more contacts
          offset: 0
        }
      }
      
      console.log('📤 Sending request body:', requestBody)
      
      const url = 'https://efazuvegwxouysfcgwja.supabase.co/functions/v1/get-filtered-contacts'
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ HTTP error:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ Edge Function response received:', data?.contacts?.length || 0, 'contacts')
      return data
    } catch (error) {
      console.error('💥 Function call error:', error)
      throw error
    }
  },

  // Crea lista email
  createEmailList: async (listData: {
    name: string
    description?: string
    listType: 'dynamic' | 'static'
    queryFilters?: any
    contactIds?: string[]
  }) => {
    const { data, error } = await supabase.functions.invoke('create-email-list', {
      body: listData
    })
    
    if (error) throw error
    return data
  },

  // Ottieni liste email
  getEmailLists: async () => {
    const { data, error } = await supabase
      .from('email_lists')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Invia campagna email
  sendEmailCampaign: async (campaignData: {
    listId: string
    subject: string
    fromName: string
    fromEmail: string
    htmlContent: string
    testMode?: boolean
  }) => {
    const { data, error } = await supabase.functions.invoke('send-email-campaign', {
      body: campaignData
    })
    
    if (error) throw error
    return data
  }
} 