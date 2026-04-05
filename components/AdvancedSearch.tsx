'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, X, TrendingUp, Clock, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { allResources } from '@/data/resources'
import { getDatabase } from '@/lib/db/schema'
import Link from 'next/link'
import { Resource } from '@/lib/types'
import { useData } from '@/contexts/DataContext'
interface SearchResult {
  id: string
  name: string
  category: string
  matchType: 'name' | 'tag' | 'category' | 'description'
}

interface AdvancedSearchProps {
  initialQuery?: string
  onQueryChange?: (value: string) => void
  resources?: Resource[]
}

export default function AdvancedSearch({ initialQuery = '', onQueryChange, resources: providedResources }: AdvancedSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularSearches] = useState(['Food Assistance', 'Housing', 'Health Services', 'Education'])
  const searchRef = useRef<HTMLDivElement>(null)
  const { resources: contextResources } = useData()

  const searchPool = useMemo<Resource[]>(() => {
    if (providedResources && providedResources.length > 0) {
      return providedResources
    }
    if (contextResources && contextResources.length > 0) {
      return contextResources
    }

    const db = getDatabase()
    const dbResources = db.getAllResources()
    if (dbResources.length > 0) {
      return [...dbResources] as Resource[]
    }

    return allResources
  }, [providedResources, contextResources])
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const lowerQuery = searchQuery.toLowerCase().trim()
    const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 0)
    const matched: SearchResult[] = []

    searchPool.forEach((resource) => {
      const name = resource.name.toLowerCase()
      const category = resource.category.toLowerCase()
      const tags = (resource.tags || []).map(t => t.toLowerCase())
      const services = (resource.services || []).map(s => s.toLowerCase())
      const description = resource.description.toLowerCase()

      // Determine match type for sorting priority
      let matchType: SearchResult['matchType'] | null = null

      // Check if all query words are present
      const matchesAll = queryWords.every(word => {
        if (name.includes(word)) {
          if (!matchType) matchType = 'name'
          return true
        }
        if (category.includes(word)) {
          if (!matchType || matchType === 'tag' || matchType === 'description') matchType = 'category'
          return true
        }
        if (tags.some(tag => tag.includes(word))) {
          if (!matchType || matchType === 'description') matchType = 'tag'
          return true
        }
        if (services.some(service => service.includes(word))) {
          if (!matchType || matchType === 'description') matchType = 'tag'
          return true
        }
        if (description.includes(word)) {
          if (!matchType) matchType = 'description'
          return true
        }
        return false
      })

      if (matchesAll && matchType) {
        matched.push({ 
          id: resource.id, 
          name: resource.name, 
          category: resource.category, 
          matchType 
        })
      }
    })

    // Sort by relevance (name > category > tag > description)
    matched.sort((a, b) => {
      const order = { name: 0, category: 1, tag: 2, description: 3 }
      
      // Secondary sort: exact name match priority
      if (a.matchType === 'name' && b.matchType === 'name') {
        const aExact = a.name.toLowerCase() === lowerQuery
        const bExact = b.name.toLowerCase() === lowerQuery
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
      }
      
      return order[a.matchType] - order[b.matchType]
    })

    setResults(matched.slice(0, 10))
  }

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery)
      if (initialQuery) {
        handleSearch(initialQuery)
      } else {
        setResults([])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    handleSearch(value)
    onQueryChange?.(value)
    setIsOpen(true)
  }

  const handleSelectResult = (result: SearchResult) => {
    setQuery(result.name)
    setIsOpen(false)
    onQueryChange?.(result.name)
    // Add to recent searches
    const updated = [result.name, ...recentSearches.filter((s) => s !== result.name)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    onQueryChange?.('')
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search resources, services, organizations..."
          className="w-full pl-12 pr-12 py-3.5 md:py-4 rounded-2xl md:rounded-3xl border-2 border-gray-200/50 dark:border-gray-700/50 
                     bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-900 dark:text-white 
                     focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none 
                     focus:ring-4 focus:ring-primary-500/10 dark:focus:ring-primary-400/10 
                     transition-all shadow-lg hover:shadow-xl active:scale-[0.99]"
          style={{
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          }}
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/90 dark:bg-gray-800/90 
                       backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 
                       overflow-hidden z-50"
            style={{
              backdropFilter: 'saturate(180%) blur(20px)',
              WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            }}
          >
            {query && results.length > 0 && (
              <div className="p-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Search Results
                </div>
                {results.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={`/directory?q=${encodeURIComponent(result.name)}`}
                      onClick={() => handleSelectResult(result)}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{result.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{result.category}</div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {query && results.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {!query && (
              <div className="p-4">
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      <Clock className="w-4 h-4" />
                      Recent Searches
                    </div>
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => {
                          setQuery(search)
                          handleSearch(search)
                          onQueryChange?.(search)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-700 dark:text-gray-300"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    <TrendingUp className="w-4 h-4" />
                    Popular Searches
                  </div>
                  {popularSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => {
                        setQuery(search)
                        handleSearch(search)
                        onQueryChange?.(search)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

