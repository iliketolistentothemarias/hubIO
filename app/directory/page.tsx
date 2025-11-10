'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X, Grid3x3, List, Map as MapIcon, GitCompare, Star } from 'lucide-react'
import { allResources, categories } from '@/data/resources'
import { getDatabase } from '@/lib/db/schema'
import ResourceCard from '@/components/ResourceCard'
import AdvancedSearch from '@/components/AdvancedSearch'
import ResourceComparison from '@/components/ResourceComparison'
import InteractiveMap from '@/components/InteractiveMap'
import { useFavorites } from '@/contexts/FavoritesContext'

function DirectoryContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const favoritesOnly = searchParams.get('favorites') === 'true'
  const { favorites, isFavorite } = useFavorites()
  
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [compareMode, setCompareMode] = useState(false)
  const [comparingIds, setComparingIds] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [resources, setResources] = useState(allResources)

  useEffect(() => {
    // Load resources from database
    const db = getDatabase()
    const dbResources = db.getAllResources()
    if (dbResources.length > 0) {
      setResources(dbResources as typeof allResources)
    }
    
    // Get tags from current resources
    const currentResources = dbResources.length > 0 ? dbResources : allResources
    const uniqueTags = Array.from(new Set(currentResources.flatMap((r) => r.tags))).sort() as string[]
    setAllTags(uniqueTags)
  }, [])

  useEffect(() => {
    if (favoritesOnly) {
      setSearchQuery('')
    }
  }, [favoritesOnly])

  const filteredResources = useMemo(() => {
    let filtered = resources

    // Filter by favorites if requested
    if (favoritesOnly) {
      filtered = filtered.filter((resource) => isFavorite(resource.id))
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (resource) =>
          resource.name.toLowerCase().includes(query) ||
          resource.description.toLowerCase().includes(query) ||
          resource.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          resource.category.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter((resource) => resource.category === selectedCategory)
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((resource) =>
        selectedTags.some((tag) => resource.tags.includes(tag))
      )
    }

    return filtered
  }, [searchQuery, selectedCategory, selectedTags, favoritesOnly, isFavorite])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('All Categories')
    setSelectedTags([])
  }

  const handleCompare = (id: string) => {
    if (comparingIds.includes(id)) {
      setComparingIds(comparingIds.filter((i) => i !== id))
    } else if (comparingIds.length < 3) {
      setComparingIds([...comparingIds, id])
      setCompareMode(true)
    }
  }

  const removeFromCompare = (id: string) => {
    setComparingIds(comparingIds.filter((i) => i !== id))
    if (comparingIds.length === 1) {
      setCompareMode(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20">
      <div className="section-padding">
        <div className="container-custom">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
              {favoritesOnly ? 'Favorite Resources' : 'Resource Directory'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore our comprehensive directory of community resources, services, and organizations.
              Use the search and filters to find exactly what you need.
            </p>
          </motion.div>

          {/* Advanced Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <AdvancedSearch />
          </motion.div>

          {/* Quick Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'Total Resources', value: resources.length },
              { label: 'Categories', value: categories.length - 1 },
              { label: 'Featured', value: resources.filter(r => r.featured).length },
              { label: 'Your Favorites', value: favorites.length },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/30 dark:border-gray-700/30 text-center"
                style={{
                  backdropFilter: 'saturate(180%) blur(20px)',
                  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                }}
              >
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stat.value}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Filters and View Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 
                            border border-white/30 dark:border-gray-700/30"
                  style={{
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                  }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Category Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 
                               bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-900 dark:text-white 
                               focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none
                               transition-all shadow-lg hover:shadow-xl"
                    style={{
                      backdropFilter: 'saturate(180%) blur(20px)',
                      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                    }}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
                  <div className="flex bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl rounded-2xl p-1 
                                  shadow-lg border border-white/30 dark:border-gray-700/30"
                        style={{
                          backdropFilter: 'saturate(180%) blur(20px)',
                          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                        }}
                  >
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-xl transition-all duration-200 active:scale-95 ${
                        viewMode === 'grid'
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                      }`}
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-xl transition-all duration-200 active:scale-95 ${
                        viewMode === 'list'
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`p-2 rounded-xl transition-all duration-200 active:scale-95 ${
                        viewMode === 'map'
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                      }`}
                    >
                      <MapIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags Filter */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tags
                  </label>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    <Filter className="w-4 h-4" />
                    {showFilters ? 'Hide' : 'Show'} Tags
                  </button>
                </div>
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2 mt-2"
                    >
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-2xl text-sm font-medium transition-all duration-200 flex items-center gap-2 active:scale-95 ${
                            selectedTags.includes(tag)
                              ? 'bg-primary-600 text-white shadow-lg'
                              : 'bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 shadow-md border border-white/30 dark:border-gray-700/30'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => toggleTag(tag)}
                          className="hover:text-primary-900 dark:hover:text-primary-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {(searchQuery || selectedCategory !== 'All Categories' || selectedTags.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Clear all filters
                </button>
              )}

              {/* Compare Mode Toggle */}
              {comparingIds.length > 0 && (
                <div className="mt-4 flex items-center justify-between p-4 bg-primary-50/80 dark:bg-primary-900/20 
                                backdrop-blur-xl rounded-2xl border border-primary-200/50 dark:border-primary-800/30
                                shadow-lg"
                      style={{
                        backdropFilter: 'saturate(180%) blur(20px)',
                        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                      }}
                >
                  <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
                    Comparing {comparingIds.length} resources
                  </span>
                  <button
                    onClick={() => setCompareMode(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 
                               active:scale-95 transition-all duration-200 text-sm font-medium flex items-center gap-2
                               shadow-lg hover:shadow-xl"
                  >
                    <GitCompare className="w-4 h-4" />
                    Compare
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredResources.length}</span> of{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{resources.length}</span> resources
            </p>
            {!compareMode && comparingIds.length < 3 && (
              <button
                onClick={() => setCompareMode(true)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 
                           flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl
                           shadow-lg hover:shadow-xl border border-white/30 dark:border-gray-700/30
                           active:scale-95 transition-all duration-200"
                style={{
                  backdropFilter: 'saturate(180%) blur(20px)',
                  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                }}
              >
                <GitCompare className="w-4 h-4" />
                Compare Resources
              </button>
            )}
          </div>

          {/* Resources Display */}
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <InteractiveMap resources={filteredResources} />
              </motion.div>
            )}
            {viewMode !== 'map' && filteredResources.length > 0 && (
              <motion.div
                key="resources"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={
                  viewMode === 'grid'
                    ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredResources.map((resource, index) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    index={index}
                    viewMode={viewMode}
                    onCompare={handleCompare}
                    comparing={comparingIds.includes(resource.id)}
                  />
                ))}
              </motion.div>
            )}
            {viewMode !== 'map' && filteredResources.length === 0 && (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">No resources found</p>
                <p className="text-gray-500 dark:text-gray-500 mb-6">Try adjusting your search or filters</p>
                <button onClick={clearFilters} className="btn-primary rounded-2xl">
                  Clear Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Comparison Modal */}
      {compareMode && comparingIds.length > 0 && (
        <ResourceComparison
          selectedIds={comparingIds}
          onClose={() => {
            setCompareMode(false)
            setComparingIds([])
          }}
          onRemove={removeFromCompare}
        />
      )}
    </div>
  )
}

export default function DirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading directory...</p>
          </div>
        </div>
      }
    >
      <DirectoryContent />
    </Suspense>
  )
}
