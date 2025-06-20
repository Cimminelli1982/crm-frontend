import { useState, useEffect } from 'react'
import { ArrowLeft, Check, Mail, Users, Filter } from 'lucide-react'
import { ContactFilters } from './ContactFilters'
import { ContactList } from './ContactList'
import { Button } from './ui/Button'
import { Loading } from './ui/Loading'
import { useEmailLists } from '../hooks/useEmailLists'
import type { FilterOptions } from '../lib/supabase'

type Step = 'filters' | 'selection' | 'details' | 'success'

export function CreateEmailList() {
  const [currentStep, setCurrentStep] = useState<Step>('filters')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [listName, setListName] = useState('')
  const [listDescription, setListDescription] = useState('')
  const [listType, setListType] = useState<'dynamic' | 'static'>('static')
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({})
  const [createdList, setCreatedList] = useState<any>(null)

  const {
    loading,
    contacts,
    filteredCount,
    error,
    loadFilteredContacts,
    createEmailList,
    clearError
  } = useEmailLists()

  // Carica contatti quando cambiano i filtri
  useEffect(() => {
    if (Object.keys(currentFilters).length > 0) {
      loadFilteredContacts(currentFilters)
    }
  }, [currentFilters, loadFilteredContacts])

  const handleFiltersChange = (filters: FilterOptions) => {
    setCurrentFilters(filters)
  }

  const handleNextToSelection = () => {
    if (contacts.length === 0) {
      alert('No contacts found with current filters')
      return
    }
    setCurrentStep('selection')
  }

  const handleCreateList = () => {
    if (selectedContacts.length === 0) {
      alert('Select at least one contact')
      return
    }
    setCurrentStep('details')
  }

  const handleSubmitList = async () => {
    if (!listName.trim()) {
      alert('Enter a name for the list')
      return
    }

    try {
      const result = await createEmailList({
        name: listName,
        description: listDescription,
        listType,
        filters: listType === 'dynamic' ? currentFilters : {},
        selectedContacts: listType === 'static' ? selectedContacts : []
      })

      setCreatedList(result.list)
      setCurrentStep('success')
    } catch (error) {
      console.error('Errore creazione lista:', error)
    }
  }

  const handleStartOver = () => {
    setCurrentStep('filters')
    setSelectedContacts([])
    setListName('')
    setListDescription('')
    setCreatedList(null)
    clearError()
  }

  const stepConfig = {
    filters: {
      title: 'Filter Contacts',
      description: 'Set filters to find contacts you want to include in the list',
      icon: <Filter className="w-5 h-5" />
    },
    selection: {
      title: 'Select Contacts',
      description: 'Choose specifically which contacts to include in the list',
      icon: <Users className="w-5 h-5" />
    },
    details: {
      title: 'List Details',
      description: 'Enter name and description for your email list',
      icon: <Mail className="w-5 h-5" />
    },
    success: {
      title: 'List Created!',
      description: 'Your email list has been created successfully',
      icon: <Check className="w-5 h-5" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-matrix-black font-matrix">
      {/* Header con progress */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          {currentStep !== 'filters' && (
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => {
                if (currentStep === 'selection') setCurrentStep('filters')
                else if (currentStep === 'details') setCurrentStep('selection')
              }}
            >
              Back
            </Button>
          )}
          
          <div>
            <h1 className="text-2xl font-bold text-matrix-green flex items-center space-x-2 font-matrix tracking-wider">
              {stepConfig[currentStep].icon}
              <span>{stepConfig[currentStep].title}</span>
            </h1>
            <p className="text-matrix-text-dim font-matrix">{stepConfig[currentStep].description}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center space-x-2">
          {(['filters', 'selection', 'details', 'success'] as Step[]).map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium font-matrix ${
                currentStep === step ? 'bg-matrix-green text-matrix-black border border-matrix-green shadow-matrix-glow' :
                index < (['filters', 'selection', 'details', 'success'] as Step[]).indexOf(currentStep) ? 'bg-matrix-green-dark text-matrix-black border border-matrix-green-dark' :
                'bg-matrix-gray text-matrix-text-dim border border-matrix-gray'
              }`}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`w-12 h-0.5 ${
                  index < (['filters', 'selection', 'details', 'success'] as Step[]).indexOf(currentStep) ? 'bg-matrix-green' : 'bg-matrix-gray'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-900 border border-red-500 rounded-lg font-matrix">
          <p className="text-red-200 font-matrix">{error}</p>
        </div>
      )}

      {/* Step content */}
      {currentStep === 'filters' && (
        <div className="space-y-6">
          <ContactFilters 
            onFiltersChange={handleFiltersChange}
            filteredCount={filteredCount}
            loading={loading}
          />
          
          {filteredCount > 0 && (
            <div className="text-center">
              <Button onClick={handleNextToSelection} size="lg">
                Continue with {filteredCount} contacts
              </Button>
            </div>
          )}
        </div>
      )}

      {currentStep === 'selection' && (
        <div className="space-y-6">
          <ContactList
            contacts={contacts}
            loading={loading}
            selectedContacts={selectedContacts}
            onSelectionChange={setSelectedContacts}
            onCreateList={selectedContacts.length > 0 ? handleCreateList : undefined}
          />
        </div>
      )}

      {currentStep === 'details' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-matrix-gray p-6 rounded-lg shadow-lg border border-matrix-green">
            <h3 className="text-lg font-medium text-matrix-green mb-4 font-matrix tracking-wider">
              Configure your email list
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-matrix-text-dim mb-2 font-matrix">
                  List Name *
                </label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g. Founders London Q1 2025"
                  className="w-full bg-matrix-black border border-matrix-green rounded-lg px-3 py-2 text-matrix-green placeholder-matrix-text-dim focus:ring-2 focus:ring-matrix-green focus:border-transparent font-matrix"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-matrix-text-dim mb-2 font-matrix">
                  Description
                </label>
                <textarea
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  placeholder="Optional list description..."
                  rows={3}
                  className="w-full bg-matrix-black border border-matrix-green rounded-lg px-3 py-2 text-matrix-green placeholder-matrix-text-dim focus:ring-2 focus:ring-matrix-green focus:border-transparent font-matrix"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-matrix-text-dim mb-2 font-matrix">
                  List Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="listType"
                      value="static"
                      checked={listType === 'static'}
                      onChange={(e) => setListType(e.target.value as 'static')}
                      className="border-matrix-green text-matrix-green focus:ring-matrix-green bg-matrix-black"
                    />
                    <span className="ml-2 text-sm text-matrix-text-dim font-matrix">
                      <strong className="text-matrix-green">Static</strong> - Fixed list with selected contacts
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="listType"
                      value="dynamic"
                      checked={listType === 'dynamic'}
                      onChange={(e) => setListType(e.target.value as 'dynamic')}
                      className="border-matrix-green text-matrix-green focus:ring-matrix-green bg-matrix-black"
                    />
                    <span className="ml-2 text-sm text-matrix-text-dim font-matrix">
                      <strong className="text-matrix-green">Dynamic</strong> - Updates automatically with filters
                    </span>
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-matrix-black p-4 rounded-lg border border-matrix-green">
                <h4 className="font-medium text-matrix-green mb-2 font-matrix">Summary</h4>
                <ul className="text-sm text-matrix-text-dim space-y-1 font-matrix">
                  <li>• {selectedContacts.length} contacts selected</li>
                  <li>• Type: {listType === 'static' ? 'Static' : 'Dynamic'} list</li>
                  {Object.keys(currentFilters).length > 0 && (
                    <li>• Applied filters: {Object.keys(currentFilters).length}</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('selection')}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitList}
                loading={loading}
                disabled={!listName.trim()}
              >
                Create List
              </Button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'success' && createdList && (
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-matrix-gray p-8 rounded-lg shadow-lg border border-matrix-green">
            <div className="w-16 h-16 bg-matrix-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-matrix-glow">
              <Check className="w-8 h-8 text-matrix-black" />
            </div>
            
            <h3 className="text-xl font-medium text-matrix-green mb-2 font-matrix tracking-wider">
              List created successfully!
            </h3>
            
            <div className="text-matrix-text-dim mb-6 font-matrix">
              <p className="mb-2">
                <strong className="text-matrix-green">{createdList.name}</strong> has been created with {createdList.members_count} contacts.
              </p>
              <p className="text-sm">
                You can now use this list to send email campaigns.
              </p>
            </div>

            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={handleStartOver}>
                Create New List
              </Button>
              <Button onClick={() => {/* Navigate to send email */}}>
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <Loading fullScreen text="Processing..." />
      )}
    </div>
  )
} 