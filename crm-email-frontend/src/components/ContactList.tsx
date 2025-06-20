import { useState } from 'react'
import { User, Mail, Building, MapPin, Star } from 'lucide-react'
import type { Contact } from '../lib/supabase'
import { Button } from './ui/Button'
import { Loading } from './ui/Loading'

interface ContactListProps {
  contacts: Contact[]
  loading: boolean
  selectedContacts: string[]
  onSelectionChange: (contactIds: string[]) => void
  onCreateList?: () => void
}

export function ContactList({ 
  contacts, 
  loading, 
  selectedContacts, 
  onSelectionChange,
  onCreateList 
}: ContactListProps) {
  const [selectAll, setSelectAll] = useState(false)

  const handleSelectAll = () => {
    if (selectAll) {
      onSelectionChange([])
      setSelectAll(false)
    } else {
      onSelectionChange(contacts.map(c => c.contact_id))
      setSelectAll(true)
    }
  }

  const handleSelectContact = (contactId: string) => {
    const isSelected = selectedContacts.includes(contactId)
    if (isSelected) {
      onSelectionChange(selectedContacts.filter(id => id !== contactId))
    } else {
      onSelectionChange([...selectedContacts, contactId])
    }
  }

  const renderScoreStars = (score: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= score ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8">
        <Loading size="lg" text="Caricamento contatti..." />
      </div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Nessun contatto trovato</h3>
        <p className="text-gray-300">
          Modifica i filtri per trovare i contatti che stai cercando.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      {/* Header con controlli bulk */}
      <div className="px-6 py-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="rounded border-gray-600 text-green-600 focus:ring-green-500 bg-gray-700"
              />
              <span className="ml-2 text-sm font-medium text-gray-300">
                Seleziona tutti ({contacts.length})
              </span>
            </label>
            
            {selectedContacts.length > 0 && (
              <span className="text-sm text-green-400 font-medium">
                {selectedContacts.length} selezionati
              </span>
            )}
          </div>

          {selectedContacts.length > 0 && onCreateList && (
            <Button
              onClick={onCreateList}
              size="sm"
              icon={<Mail className="w-4 h-4" />}
            >
              Crea Lista ({selectedContacts.length})
            </Button>
          )}
        </div>
      </div>

      {/* Lista contatti */}
      <div className="divide-y divide-gray-600 max-h-96 overflow-y-auto">
        {contacts.map((contact) => (
          <div
            key={contact.contact_id}
            className={`px-6 py-4 hover:bg-gray-700 transition-colors ${
              selectedContacts.includes(contact.contact_id) ? 'bg-gray-700 border-l-4 border-green-500' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedContacts.includes(contact.contact_id)}
                onChange={() => handleSelectContact(contact.contact_id)}
                className="rounded border-gray-600 text-green-600 focus:ring-green-500 bg-gray-700"
              />

              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-black font-medium text-sm">
                    {contact.first_name?.charAt(0) || contact.last_name?.charAt(0) || 'C'}
                  </span>
                </div>
              </div>

              {/* Info contatto */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-white truncate">
                    {contact.full_name || 'Nome non disponibile'}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    contact.category === 'Founder' ? 'bg-green-600 text-black' :
                    contact.category === 'Angel Investor' ? 'bg-blue-600 text-white' :
                    contact.category === 'VC' ? 'bg-purple-600 text-white' :
                    'bg-gray-600 text-gray-200'
                  }`}>
                    {contact.category}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  
                  {contact.company && (
                    <div className="flex items-center space-x-1">
                      <Building className="w-3 h-3" />
                      <span className="truncate">{contact.company}</span>
                    </div>
                  )}
                  
                  {contact.city && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{contact.city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Score e azioni */}
              <div className="flex-shrink-0 flex items-center space-x-3">
                {contact.score && (
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Score</div>
                    {renderScoreStars(contact.score)}
                  </div>
                )}
                
                <div className="text-xs text-gray-400">
                  {contact.keep_in_touch_frequency?.replace('_', ' ') || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 