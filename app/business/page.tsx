'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Store, Star, MapPin, Phone, Globe, Clock, Award, TrendingUp, 
  Filter, Search, Grid, List, CheckCircle, DollarSign, X, Mail
} from 'lucide-react'
import TabNavigation from '@/components/TabNavigation'
import LiquidGlass from '@/components/LiquidGlass'
import { mockBusinesses, type Business } from '@/data/mockBusinesses'

const categories = ['All', 'Food & Beverage', 'Retail', 'Services', 'Professional', 'Entertainment', 'Health & Beauty']

export default function BusinessPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating')
  const [detailBusiness, setDetailBusiness] = useState<Business | null>(null)
  const [communityBusinesses, setCommunityBusinesses] = useState<Business[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('approvedBusinesses') || '[]')
      const mapped: Business[] = stored.map((b: any) => ({
        id: b.id,
        name: b.businessName,
        category: b.category,
        description: b.description,
        address: b.address || '',
        phone: b.phone || '',
        website: b.website || '',
        email: b.email || '',
        rating: 0,
        reviewCount: 0,
        hours: b.hours || '',
        verified: false,
        featured: false,
        tags: [],
      }))
      setCommunityBusinesses(mapped)
    } catch { /* ignore */ }
  }, [])

  const allBusinesses = useMemo(() => [...mockBusinesses, ...communityBusinesses], [communityBusinesses])

  const filteredBusinesses = useMemo(() => {
    let filtered = allBusinesses

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(b => b.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(query) ||
        b.description.toLowerCase().includes(query) ||
        b.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    filtered.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount
      return a.name.localeCompare(b.name)
    })

    return filtered
  }, [selectedCategory, searchQuery, sortBy])

  const tabs = [
    { id: 'all', label: 'All Businesses', icon: Store, count: filteredBusinesses.length },
    { id: 'featured', label: 'Featured', icon: Award, count: filteredBusinesses.filter(b => b.featured).length },
    { id: 'verified', label: 'Verified', icon: CheckCircle, count: filteredBusinesses.filter(b => b.verified).length },
    { id: 'new', label: 'New Businesses', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-secondary-50/30 
                    dark:from-gray-900 dark:via-gray-800 dark:to-secondary-900/10 pt-20">
      <div className="container-custom section-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Local Business Directory
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover and support local businesses in your community. Shop local, support local.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <LiquidGlass intensity="medium">
            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search businesses..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 
                           bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-900 dark:text-white 
                           focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                          : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:shadow-lg'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 
                             bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white"
                  >
                    <option value="rating">Sort by Rating</option>
                    <option value="reviews">Sort by Reviews</option>
                    <option value="name">Sort by Name</option>
                  </select>
                  <div className="flex gap-1 bg-white/80 dark:bg-gray-700/80 rounded-2xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-xl ${viewMode === 'grid' ? 'bg-primary-600 text-white' : ''}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-xl ${viewMode === 'list' ? 'bg-primary-600 text-white' : ''}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>

        {/* Tab Navigation */}
        <TabNavigation tabs={tabs} defaultTab="all">
          {(activeTab) => {
            let displayBusinesses = filteredBusinesses
            if (activeTab === 'featured') {
              displayBusinesses = displayBusinesses.filter(b => b.featured)
            } else if (activeTab === 'verified') {
              displayBusinesses = displayBusinesses.filter(b => b.verified)
            }

            return viewMode === 'list' ? (
              <BusinessListView businesses={displayBusinesses} onViewDetails={setDetailBusiness} />
            ) : (
              <BusinessGridView businesses={displayBusinesses} onViewDetails={setDetailBusiness} />
            )
          }}
        </TabNavigation>
      </div>

      {/* Business Details Modal */}
      <AnimatePresence>
        {detailBusiness && (
          <>
            <motion.div
              key="biz-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailBusiness(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60000]"
            />
            <motion.div
              key="biz-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[60001] flex items-center justify-center p-4"
              onClick={() => setDetailBusiness(null)}
            >
              <div
                className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{detailBusiness.name}</h2>
                      {detailBusiness.verified && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                      {detailBusiness.featured && <Award className="w-5 h-5 text-yellow-500 shrink-0" />}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{detailBusiness.category}</span>
                  </div>
                  <button
                    onClick={() => setDetailBusiness(null)}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(detailBusiness.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      />
                    ))}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {detailBusiness.rating} ({detailBusiness.reviewCount} reviews)
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{detailBusiness.description}</p>

                  {/* Contact details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                      <MapPin className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                      <span>{detailBusiness.address}</span>
                    </div>
                    <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                      <Clock className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                      <span>{detailBusiness.hours}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                      <a href={`tel:${detailBusiness.phone}`} className="text-primary-600 hover:underline">
                        {detailBusiness.phone}
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                      <a href={`mailto:${detailBusiness.email}`} className="text-primary-600 hover:underline">
                        {detailBusiness.email}
                      </a>
                    </div>
                    {detailBusiness.website && (
                      <div className="flex items-start gap-3">
                        <Globe className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                        <a href={detailBusiness.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">
                          {detailBusiness.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Special offers */}
                  {detailBusiness.offers && detailBusiness.offers.length > 0 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Special Offers</span>
                      </div>
                      <ul className="space-y-1">
                        {detailBusiness.offers.map((offer, i) => (
                          <li key={i} className="text-sm text-yellow-700 dark:text-yellow-400">• {offer}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {detailBusiness.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <a
                    href={detailBusiness.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all"
                  >
                    Visit Website
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function BusinessGridView({ businesses, onViewDetails }: { businesses: Business[]; onViewDetails: (b: Business) => void }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map((business, index) => (
        <motion.div
          key={business.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <LiquidGlass intensity="medium">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{business.name}</h3>
                    {business.verified && (
                      <div title="Verified Business">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                    {business.featured && (
                      <div title="Featured Business">
                        <Award className="w-5 h-5 text-yellow-500" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{business.category}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(business.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {business.rating} ({business.reviewCount} reviews)
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{business.description}</p>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  <span>{business.address}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4 text-primary-600" />
                  <span>{business.hours}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4 text-primary-600" />
                  <a href={`tel:${business.phone}`} className="hover:text-primary-600">{business.phone}</a>
                </div>
              </div>

              {business.offers && business.offers.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Special Offers</span>
                  </div>
                  {business.offers.map((offer, i) => (
                    <div key={i} className="text-xs text-yellow-700 dark:text-yellow-400">{offer}</div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {business.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onViewDetails(business)}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2 rounded-2xl font-semibold hover:shadow-lg transition-all"
              >
                View Details
              </button>
            </div>
          </LiquidGlass>
        </motion.div>
      ))}
    </div>
  )
}

function BusinessListView({ businesses, onViewDetails }: { businesses: Business[]; onViewDetails: (b: Business) => void }) {
  return (
    <div className="space-y-4">
      {businesses.map((business, index) => (
        <motion.div
          key={business.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ x: 5 }}
        >
          <LiquidGlass intensity="light">
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                  <Store className="w-16 h-16 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{business.name}</h3>
                      {business.verified && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {business.featured && <Award className="w-5 h-5 text-yellow-500" />}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{business.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-gray-900 dark:text-white">{business.rating}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{business.reviewCount} reviews</span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{business.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <span>{business.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary-600" />
                    <span>{business.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-600" />
                    <span className="truncate">{business.hours}</span>
                  </div>
                  {business.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary-600" />
                      <a href={business.website} target="_blank" rel="noopener" className="hover:text-primary-600">
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => onViewDetails(business)}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>
      ))}
    </div>
  )
}
