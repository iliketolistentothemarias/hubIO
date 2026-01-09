'use client'

/**
 * Local News & Updates Page
 * 
 * Community news feed with articles, announcements, and updates.
 * Features categories, trending topics, and engagement metrics.
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Newspaper, TrendingUp, Clock, User, Heart, MessageSquare, 
  Share2, BookOpen, Filter, Calendar, Tag 
} from 'lucide-react'
import TabNavigation from '@/components/TabNavigation'
import LiquidGlass from '@/components/LiquidGlass'

interface NewsArticle {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  authorAvatar: string
  category: string
  publishedAt: Date
  image?: string
  views: number
  likes: number
  comments: number
  shares: number
  tags: string[]
  featured: boolean
  trending: boolean
}

const mockArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'New Community Center Opens Downtown',
    excerpt: 'The new community center officially opened its doors, offering programs for all ages and backgrounds.',
    content: 'Full article content...',
    author: 'Community Reporter',
    authorAvatar: 'CR',
    category: 'Community',
    publishedAt: new Date('2026-01-15'),
    views: 1234,
    likes: 89,
    comments: 23,
    shares: 45,
    tags: ['Community', 'Announcement', 'Opening'],
    featured: true,
    trending: true,
  },
  {
    id: '2',
    title: 'Local Businesses See Record Growth',
    excerpt: 'Small businesses in the area report significant growth, thanks to community support and new initiatives.',
    content: 'Full article content...',
    author: 'Business Editor',
    authorAvatar: 'BE',
    category: 'Business',
    publishedAt: new Date('2026-01-12'),
    views: 987,
    likes: 67,
    comments: 18,
    shares: 32,
    tags: ['Business', 'Economy', 'Growth'],
    featured: false,
    trending: true,
  },
  {
    id: '3',
    title: 'Youth Program Receives Major Grant',
    excerpt: 'Local youth program awarded $50,000 grant to expand services and reach more young people.',
    content: 'Full article content...',
    author: 'Education Writer',
    authorAvatar: 'EW',
    category: 'Education',
    publishedAt: new Date('2026-01-10'),
    views: 756,
    likes: 54,
    comments: 12,
    shares: 28,
    tags: ['Education', 'Grants', 'Youth'],
    featured: false,
    trending: false,
  },
]

const categories = ['All', 'Community', 'Business', 'Education', 'Health', 'Events', 'Announcements']

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'popular'>('recent')

  const filteredArticles = useMemo(() => {
    let filtered = mockArticles

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(a => a.category === selectedCategory)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'recent') return b.publishedAt.getTime() - a.publishedAt.getTime()
      if (sortBy === 'trending') {
        if (a.trending && !b.trending) return -1
        if (!a.trending && b.trending) return 1
        return b.views - a.views
      }
      return b.views - a.views
    })

    return filtered
  }, [selectedCategory, sortBy])

  const tabs = [
    { id: 'all', label: 'All News', icon: Newspaper, count: filteredArticles.length },
    { id: 'trending', label: 'Trending', icon: TrendingUp, count: filteredArticles.filter(a => a.trending).length },
    { id: 'featured', label: 'Featured', icon: BookOpen, count: filteredArticles.filter(a => a.featured).length },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 
                    dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/10 pt-20">
      <div className="container-custom section-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Local News & Updates
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Stay informed about what's happening in your community. News, updates, and stories from your neighborhood.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <LiquidGlass intensity="light">
            <div className="p-6">
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

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 
                           bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white"
                >
                  <option value="recent">Most Recent</option>
                  <option value="trending">Trending</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>

        {/* Tab Navigation */}
        <TabNavigation tabs={tabs} defaultTab="all">
          {(activeTab) => {
            let displayArticles = filteredArticles
            if (activeTab === 'trending') {
              displayArticles = displayArticles.filter(a => a.trending)
            } else if (activeTab === 'featured') {
              displayArticles = displayArticles.filter(a => a.featured)
            }

            return (
              <div className="space-y-6">
                {displayArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                  >
                    <LiquidGlass intensity="medium">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Image/Icon */}
                          <div className="flex-shrink-0">
                            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                              <Newspaper className="w-16 h-16 text-white" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{article.title}</h2>
                                  {article.trending && (
                                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      Trending
                                    </span>
                                  )}
                                  {article.featured && (
                                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                                      Featured
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span>{article.author}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{article.publishedAt.toLocaleDateString()}</span>
                                  </div>
                                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                                    {article.category}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 mb-4">{article.excerpt}</p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {article.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full flex items-center gap-1"
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {/* Engagement */}
                            <div className="flex items-center gap-6">
                              <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                                <Heart className="w-4 h-4" />
                                <span>{article.likes}</span>
                              </button>
                              <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                                <MessageSquare className="w-4 h-4" />
                                <span>{article.comments}</span>
                              </button>
                              <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                                <Share2 className="w-4 h-4" />
                                <span>{article.shares}</span>
                              </button>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {article.views} views
                              </span>
                              <button className="ml-auto px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl text-sm font-semibold hover:shadow-lg transition-all">
                                Read More
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </LiquidGlass>
                  </motion.div>
                ))}
              </div>
            )
          }}
        </TabNavigation>
      </div>
    </div>
  )
}

