'use client'

/**
 * Local Business Directory Page
 * 
 * Comprehensive directory of local businesses with advanced features:
 * - Business listings with detailed info
 * - Business categories and tags
 * - Reviews and ratings
 * - Business hours
 * - Contact information
 * - Special offers
 * - Business verification badges
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Store, Star, MapPin, Phone, Globe, Clock, Award, TrendingUp, 
  Filter, Search, Grid, List, CheckCircle, DollarSign 
} from 'lucide-react'
import TabNavigation from '@/components/TabNavigation'
import LiquidGlass from '@/components/LiquidGlass'

interface Business {
  id: string
  name: string
  category: string
  description: string
  address: string
  phone: string
  website: string
  email: string
  rating: number
  reviewCount: number
  hours: string
  verified: boolean
  featured: boolean
  tags: string[]
  offers?: string[]
  image?: string
}

const mockBusinesses: Business[] = [
  {
    id: '1',
    name: 'Downtown Coffee Co.',
    category: 'Food & Beverage',
    description: 'Local coffee shop serving artisanal coffee and fresh pastries. Family-owned since 2010.',
    address: '123 Main Street',
    phone: '(555) 123-4567',
    website: 'https://downtowncoffee.com',
    email: 'info@downtowncoffee.com',
    rating: 4.8,
    reviewCount: 234,
    hours: 'Mon-Fri: 6am-8pm, Sat-Sun: 7am-9pm',
    verified: true,
    featured: true,
    tags: ['Coffee', 'Pastries', 'WiFi', 'Pet Friendly'],
    offers: ['10% off for students', 'Free coffee on your birthday'],
  },
  {
    id: '2',
    name: 'Green Thumb Garden Center',
    category: 'Retail',
    description: 'Full-service garden center with plants, tools, and expert gardening advice.',
    address: '456 Garden Way',
    phone: '(555) 234-5678',
    website: 'https://greenthumb.com',
    email: 'info@greenthumb.com',
    rating: 4.9,
    reviewCount: 189,
    hours: 'Daily: 8am-6pm',
    verified: true,
    featured: false,
    tags: ['Plants', 'Garden Supplies', 'Expert Advice'],
    offers: ['Spring sale: 20% off all plants'],
  },
  {
    id: '3',
    name: 'Tech Repair Pro',
    category: 'Services',
    description: 'Expert phone, tablet, and computer repair. Fast turnaround, warranty included.',
    address: '789 Tech Plaza',
    phone: '(555) 345-6789',
    website: 'https://techrepairpro.com',
    email: 'repair@techrepairpro.com',
    rating: 4.7,
    reviewCount: 156,
    hours: 'Mon-Sat: 9am-6pm',
    verified: true,
    featured: false,
    tags: ['Phone Repair', 'Computer Repair', 'Warranty'],
  },
]

const categories = ['All', 'Food & Beverage', 'Retail', 'Services', 'Professional', 'Entertainment', 'Health & Beauty']

export default function BusinessPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating')

  const filteredBusinesses = useMemo(() => {
    let filtered = mockBusinesses

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

    // Sort
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
              {/* Search Bar */}
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
                {/* Category Filter */}
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

                {/* Sort and View */}
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
              <BusinessListView businesses={displayBusinesses} />
            ) : (
              <BusinessGridView businesses={displayBusinesses} />
            )
          }}
        </TabNavigation>
      </div>
    </div>
  )
}

function BusinessGridView({ businesses }: { businesses: Business[] }) {
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
              {/* Header */}
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

              {/* Rating */}
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

              {/* Info */}
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

              {/* Offers */}
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

              {/* Tags */}
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

              <button className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2 rounded-2xl font-semibold hover:shadow-lg transition-all">
                View Details
              </button>
            </div>
          </LiquidGlass>
        </motion.div>
      ))}
    </div>
  )
}

function BusinessListView({ businesses }: { businesses: Business[] }) {
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
                <button className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all">
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

