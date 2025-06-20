import { useState, useCallback } from 'react'
import { emailAPI } from '../lib/supabase'
import type { Contact, FilterOptions } from '../lib/supabase'

export interface CreateListFormData {
  name: string
  description: string
  listType: 'dynamic' | 'static'
  filters: FilterOptions
  selectedContacts: string[]
}

export function useEmailLists() {
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredCount, setFilteredCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Carica contatti con filtri
  const loadFilteredContacts = useCallback(async (filters: FilterOptions) => {
    console.log('🔍 Loading filtered contacts with filters:', filters)
    setLoading(true)
    setError(null)
    
    try {
      const result = await emailAPI.getFilteredContacts(filters)
      console.log('📊 API Response:', result)
      setContacts(result.contacts || [])
      setFilteredCount(result.total || 0)
      console.log('✅ Contacts loaded:', result.contacts?.length || 0, 'Total:', result.total || 0)
    } catch (err) {
      console.error('❌ Error loading contacts:', err)
      setError(err instanceof Error ? err.message : 'Error loading contacts')
      setContacts([])
      setFilteredCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  // Crea nuova lista
  const createEmailList = useCallback(async (formData: CreateListFormData) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await emailAPI.createEmailList({
        name: formData.name,
        description: formData.description,
        listType: formData.listType,
        queryFilters: formData.listType === 'dynamic' ? formData.filters : null,
        contactIds: formData.listType === 'static' ? formData.selectedContacts : undefined
      })
      
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione lista')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Invia campagna email
  const sendEmailCampaign = useCallback(async (campaignData: {
    listId: string
    subject: string
    fromName: string
    fromEmail: string
    htmlContent: string
    testMode?: boolean
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await emailAPI.sendEmailCampaign(campaignData)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'invio email')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    contacts,
    filteredCount,
    error,
    loadFilteredContacts,
    createEmailList,
    sendEmailCampaign,
    clearError: () => setError(null)
  }
} 