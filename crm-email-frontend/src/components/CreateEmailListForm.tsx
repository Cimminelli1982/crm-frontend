import { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { Plus, Users, Filter, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { emailAPI } from '../lib/supabase'

interface Contact {
  contact_id: string
  first_name: string
  last_name: string
  email?: string
}

interface CreateEmailListFormProps {
  availableContacts?: Contact[]
  onListCreated?: (list: any) => void
}

export function CreateEmailListForm({ availableContacts = [], onListCreated }: CreateEmailListFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    listType: 'static' as 'static' | 'dynamic',
    queryFilters: null,
    contactIds: [] as string[]
  })

  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Filter contacts based on search
  const filteredContacts = availableContacts.filter(contact =>
    `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleContactToggle = (contact: Contact) => {
    const isSelected = selectedContacts.some(c => c.contact_id === contact.contact_id)
    
    if (isSelected) {
      setSelectedContacts(prev => prev.filter(c => c.contact_id !== contact.contact_id))
      setFormData(prev => ({
        ...prev,
        contactIds: prev.contactIds.filter(id => id !== contact.contact_id)
      }))
    } else {
      setSelectedContacts(prev => [...prev, contact])
      setFormData(prev => ({
        ...prev,
        contactIds: [...prev.contactIds, contact.contact_id]
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('List name is required')
      }

      if (formData.listType === 'static' && formData.contactIds.length === 0) {
        throw new Error('Static list requires at least one contact')
      }

      // Call the Edge Function
      const response = await fetch('https://efazuvegwxouysfcgwja.supabase.co/functions/v1/create-email-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYXp1dmVnd3hvdXlzZmNnd2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mjk1MjcsImV4cCI6MjA1MTUwNTUyN30.1G5n0CyQEHGeE1XaJld_PbpstUFd0Imaao6N8MUmfvE`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYXp1dmVnd3hvdXlzZmNnd2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mjk1MjcsImV4cCI6MjA1MTUwNTUyN30.1G5n0CyQEHGeE1XaJld_PbpstUFd0Imaao6N8MUmfvE'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setSuccess(true)
        setFormData({
          name: '',
          description: '',
          listType: 'static',
          queryFilters: null,
          contactIds: []
        })
        setSelectedContacts([])
        onListCreated?.(result.list)
      } else {
        throw new Error(result.error || 'Unknown error occurred')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-matrix-gray p-6 rounded-lg shadow-lg border border-matrix-green font-matrix">
      <div className="flex items-center mb-6">
        <Mail className="w-6 h-6 text-matrix-green mr-3" />
        <h2 className="text-xl font-bold text-matrix-green tracking-wider">Create Email List</h2>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-900/20 border border-green-500 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
          <span className="text-green-400 font-matrix">Email list created successfully!</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
          <span className="text-red-400 font-matrix">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-matrix-text-dim mb-2 font-matrix">
              List Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-matrix-black border border-matrix-green rounded-lg text-matrix-green placeholder-matrix-text-dim focus:ring-2 focus:ring-matrix-green focus:border-transparent font-matrix"
              placeholder="Enter list name..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-matrix-text-dim mb-2 font-matrix">
              List Type
            </label>
            <select
              value={formData.listType}
              onChange={(e) => setFormData(prev => ({ ...prev, listType: e.target.value as 'static' | 'dynamic' }))}
              className="w-full px-3 py-2 bg-matrix-black border border-matrix-green rounded-lg text-matrix-green focus:ring-2 focus:ring-matrix-green focus:border-transparent font-matrix"
            >
              <option value="static">Static List</option>
              <option value="dynamic">Dynamic List</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-matrix-text-dim mb-2 font-matrix">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 bg-matrix-black border border-matrix-green rounded-lg text-matrix-green placeholder-matrix-text-dim focus:ring-2 focus:ring-matrix-green focus:border-transparent font-matrix"
            rows={3}
            placeholder="Optional description..."
          />
        </div>

        {/* Contact Selection for Static Lists */}
        {formData.listType === 'static' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-matrix-text-dim font-matrix">
                Select Contacts ({selectedContacts.length} selected)
              </label>
              <div className="flex items-center text-sm text-matrix-text-dim">
                <Users className="w-4 h-4 mr-1" />
                {availableContacts.length} available
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-matrix-black border border-matrix-green rounded-lg text-matrix-green placeholder-matrix-text-dim focus:ring-2 focus:ring-matrix-green focus:border-transparent font-matrix"
                placeholder="Search contacts..."
              />
            </div>

            {/* Contacts List */}
            <div className="max-h-64 overflow-y-auto border border-matrix-green rounded-lg bg-matrix-black">
              {filteredContacts.length === 0 ? (
                <div className="p-4 text-center text-matrix-text-dim font-matrix">
                  No contacts found
                </div>
              ) : (
                <div className="divide-y divide-matrix-green/20">
                  {filteredContacts.map(contact => {
                    const isSelected = selectedContacts.some(c => c.contact_id === contact.contact_id)
                    return (
                      <label
                        key={contact.contact_id}
                        className="flex items-center p-3 hover:bg-matrix-gray cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleContactToggle(contact)}
                          className="rounded border-matrix-green text-matrix-green focus:ring-matrix-green bg-matrix-black mr-3"
                        />
                        <div className="flex-1">
                          <div className="text-matrix-green font-medium font-matrix">
                            {contact.first_name} {contact.last_name}
                          </div>
                          {contact.email && (
                            <div className="text-sm text-matrix-text-dim font-matrix">
                              {contact.email}
                            </div>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic List Filters */}
        {formData.listType === 'dynamic' && (
          <div className="p-4 bg-matrix-black border border-matrix-green rounded-lg">
            <div className="flex items-center mb-2">
              <Filter className="w-4 h-4 text-matrix-green mr-2" />
              <span className="text-matrix-text-dim font-matrix">Dynamic List Filters</span>
            </div>
            <p className="text-sm text-matrix-text-dim font-matrix">
              Dynamic lists will be implemented in a future update. For now, use static lists.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setFormData({
                name: '',
                description: '',
                listType: 'static',
                queryFilters: null,
                contactIds: []
              })
              setSelectedContacts([])
              setError('')
              setSuccess(false)
            }}
          >
            Reset
          </Button>
          
          <Button
            type="submit"
            disabled={loading || (formData.listType === 'static' && selectedContacts.length === 0)}
            icon={loading ? undefined : <Plus className="w-4 h-4" />}
          >
            {loading ? 'Creating...' : 'Create List'}
          </Button>
        </div>
      </form>

      {/* Summary */}
      {selectedContacts.length > 0 && (
        <div className="mt-6 p-4 bg-matrix-black border border-matrix-green rounded-lg">
          <h3 className="text-sm font-medium text-matrix-green mb-2 font-matrix">List Summary</h3>
          <div className="text-sm text-matrix-text-dim font-matrix">
            <div>Name: <span className="text-matrix-green">{formData.name || 'Untitled List'}</span></div>
            <div>Type: <span className="text-matrix-green">{formData.listType}</span></div>
            <div>Contacts: <span className="text-matrix-green">{selectedContacts.length}</span></div>
          </div>
        </div>
      )}
    </div>
  )
} 