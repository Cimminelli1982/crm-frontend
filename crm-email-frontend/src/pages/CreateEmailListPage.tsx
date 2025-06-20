import { useState, useEffect } from 'react'
import { CreateEmailListForm } from '../components/CreateEmailListForm'
import { emailAPI } from '../lib/supabase'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'

interface Contact {
  contact_id: string
  first_name: string
  last_name: string
  email?: string
}

export function CreateEmailListPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load contacts when component mounts
  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      setError('')

      // Get filtered contacts with no filters (all contacts)
      const response = await emailAPI.getFilteredContacts({
        category: [],
        score: [],
        keepInTouchFrequency: [],
        searchText: ''
      })

      if (response?.contacts) {
        // Transform the data to match our Contact interface
        const transformedContacts: Contact[] = response.contacts.map((contact: any) => ({
          contact_id: contact.contact_id,
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          email: contact.primary_email || contact.email || ''
        }))

        setContacts(transformedContacts)
      } else {
        throw new Error('No contacts data received')
      }
    } catch (err) {
      console.error('Error loading contacts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load contacts')
      
      // Don't use fallback data - show the actual error
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  const handleListCreated = (list: any) => {
    console.log('List created:', list)
    // You can add navigation or notification logic here
    alert(`Email list "${list.name}" created successfully with ${list.members_count} contacts!`)
  }

  const handleGoBack = () => {
    window.history.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-matrix-black flex items-center justify-center">
        <div className="flex items-center space-x-3 text-matrix-green">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-matrix">Loading contacts...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-matrix-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={handleGoBack}
            className="text-matrix-green hover:text-matrix-green"
          >
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-matrix-green tracking-wider font-matrix">
              Create Email List
            </h1>
            <p className="text-matrix-text-dim font-matrix mt-1">
              Select contacts and create email marketing lists
            </p>
          </div>
          
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <div className="text-red-400 font-matrix">
              <strong>Error loading contacts:</strong> {error}
            </div>
            <div className="text-red-300 text-sm mt-2 font-matrix">
              Please check your database connection and Edge Function deployment.
            </div>
            <button 
              onClick={loadContacts}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Retry Loading Contacts
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-matrix-gray p-4 rounded-lg border border-matrix-green">
            <div className="text-2xl font-bold text-matrix-green font-matrix">
              {contacts.length}
            </div>
            <div className="text-matrix-text-dim font-matrix">
              Total Contacts
            </div>
          </div>
          
          <div className="bg-matrix-gray p-4 rounded-lg border border-matrix-green">
            <div className="text-2xl font-bold text-matrix-green font-matrix">
              {contacts.filter(c => c.email).length}
            </div>
            <div className="text-matrix-text-dim font-matrix">
              With Email
            </div>
          </div>
          
          <div className="bg-matrix-gray p-4 rounded-lg border border-matrix-green">
            <div className="text-2xl font-bold text-matrix-green font-matrix">
              {((contacts.filter(c => c.email).length / contacts.length) * 100).toFixed(0)}%
            </div>
            <div className="text-matrix-text-dim font-matrix">
              Email Coverage
            </div>
          </div>
        </div>

        {/* Main Form */}
        <CreateEmailListForm
          availableContacts={contacts}
          onListCreated={handleListCreated}
        />

        {/* Instructions */}
        <div className="mt-8 p-6 bg-matrix-gray border border-matrix-green rounded-lg">
          <h3 className="text-lg font-medium text-matrix-green mb-3 font-matrix">
            How to Create Email Lists
          </h3>
          <div className="space-y-2 text-matrix-text-dim font-matrix">
            <div className="flex items-start">
              <span className="text-matrix-green mr-2">1.</span>
              <span>Enter a descriptive name for your email list</span>
            </div>
            <div className="flex items-start">
              <span className="text-matrix-green mr-2">2.</span>
              <span>Choose between Static (fixed contacts) or Dynamic (rule-based) lists</span>
            </div>
            <div className="flex items-start">
              <span className="text-matrix-green mr-2">3.</span>
              <span>For static lists, search and select the contacts you want to include</span>
            </div>
            <div className="flex items-start">
              <span className="text-matrix-green mr-2">4.</span>
              <span>Add an optional description to help you remember the list's purpose</span>
            </div>
            <div className="flex items-start">
              <span className="text-matrix-green mr-2">5.</span>
              <span>Click "Create List" to save your email list</span>
            </div>
          </div>
        </div>

        {/* API Info */}
        <div className="mt-6 p-4 bg-matrix-black border border-matrix-green rounded-lg">
          <h4 className="text-sm font-medium text-matrix-green mb-2 font-matrix">
            Edge Function Details
          </h4>
          <div className="text-xs text-matrix-text-dim font-matrix space-y-1">
            <div>Endpoint: <code className="text-matrix-green">create-email-list</code></div>
            <div>Method: <code className="text-matrix-green">POST</code></div>
            <div>Parameters: name, description, listType, contactIds</div>
          </div>
        </div>
      </div>
    </div>
  )
} 