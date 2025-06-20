import { useState, useEffect } from 'react'
import type { FilterOptions } from '../lib/supabase'
import { Search, Filter, X } from 'lucide-react'
import { Button } from './ui/Button'

interface ContactFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void
  filteredCount: number
  loading: boolean
}

export function ContactFilters({ onFiltersChange, filteredCount, loading }: ContactFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    category: [],
    score: [],
    keepInTouchFrequency: [],
    searchText: ''
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  // Available options (matching your database)
  const categoryOptions = [
    { value: 'Inbox', label: 'Inbox' },
    { value: 'Rockstars', label: 'Rockstars' },
    { value: 'Founder', label: 'Founders' },
    { value: 'Professional Investor', label: 'Professional Investors' },
    { value: 'Manager', label: 'Managers' },
    { value: 'Friend and Family', label: 'People I Care' }
  ]
  
  const scoreOptions = [1, 2, 3, 4, 5]
  
  const frequencyOptions = [
    'Weekly', 'Monthly', 'Quarterly', 'Once per Year', 'Not Set'
  ]

  // Update filters when they change
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange(filters)
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [filters, onFiltersChange])

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = (key: 'category' | 'score' | 'keepInTouchFrequency', value: string | number) => {
    setFilters(prev => {
      const currentArray = (prev[key] || []) as (string | number)[]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
      
      return { ...prev, [key]: newArray }
    })
  }

  const clearFilters = () => {
    setFilters({
      category: [],
      score: [],
      keepInTouchFrequency: [],
      searchText: ''
    })
  }

  const hasActiveFilters = filters.category?.length || filters.score?.length || 
                          filters.keepInTouchFrequency?.length || filters.searchText

  return (
    <div className="bg-matrix-gray p-6 rounded-lg shadow-lg border border-matrix-green font-matrix">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-matrix-green tracking-wider">Filter Contacts</h3>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-matrix-text-dim font-matrix">
            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <span className="font-medium text-matrix-green">{filteredCount} contacts found</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<Filter className="w-4 h-4" />}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Advanced'}
          </Button>
        </div>
      </div>

      {/* Text search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-matrix-text-dim w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.searchText || ''}
            onChange={(e) => updateFilter('searchText', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-matrix-black border border-matrix-green rounded-lg text-matrix-green placeholder-matrix-text-dim focus:ring-2 focus:ring-matrix-green focus:border-transparent font-matrix"
          />
        </div>
      </div>

      {/* Quick filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-matrix-text-dim mb-2 font-matrix">Category</label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {categoryOptions.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.category?.includes(option.value) || false}
                  onChange={() => toggleArrayFilter('category', option.value)}
                  className="rounded border-matrix-green text-matrix-green focus:ring-matrix-green bg-matrix-black"
                />
                <span className="ml-2 text-sm text-matrix-text-dim font-matrix">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Score */}
        <div>
          <label className="block text-sm font-medium text-matrix-text-dim mb-2 font-matrix">Score</label>
          <div className="flex flex-wrap gap-2">
            {scoreOptions.map(score => (
              <button
                key={score}
                onClick={() => toggleArrayFilter('score', score)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors font-matrix ${
                  filters.score?.includes(score)
                    ? 'bg-matrix-green text-matrix-black shadow-matrix-glow'
                    : 'bg-matrix-black text-matrix-text-dim hover:bg-matrix-gray border border-matrix-green'
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>

        {/* Keep in Touch */}
        <div>
          <label className="block text-sm font-medium text-matrix-text-dim mb-2 font-matrix">Frequency</label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {frequencyOptions.map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.keepInTouchFrequency?.includes(option) || false}
                  onChange={() => toggleArrayFilter('keepInTouchFrequency', option)}
                  className="rounded border-matrix-green text-matrix-green focus:ring-matrix-green bg-matrix-black"
                />
                <span className="ml-2 text-sm text-matrix-text-dim font-matrix">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="border-t border-matrix-green pt-4 animate-slide-in">
          <div className="text-sm text-matrix-text-dim font-matrix">
            Advanced filtering options will be available here in future updates.
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-matrix-green">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="w-4 h-4" />}
            onClick={clearFilters}
          >
            Clear All Filters
          </Button>
          {hasActiveFilters && (
            <div className="text-sm text-matrix-text-dim font-matrix">
              {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : v).length} active filter(s)
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 