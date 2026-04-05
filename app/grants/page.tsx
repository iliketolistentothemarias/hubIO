'use client'

/**
 * Grant Opportunities Page
 * 
 * Comprehensive grant listing and application system for:
 * - Small businesses
 * - Non-profits
 * - Community projects
 * - Individual grants
 * - Educational grants
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, Calendar, Target, FileText, Award, TrendingUp, 
  Filter, CheckCircle, Clock, Building2, Users, GraduationCap 
} from 'lucide-react'
import TabNavigation from '@/components/TabNavigation'
import LiquidGlass from '@/components/LiquidGlass'

interface Grant {
  id: string
  title: string
  organization: string
  description: string
  category: string
  amount: string
  deadline: Date
  eligibility: string[]
  requirements: string[]
  status: 'open' | 'closing-soon' | 'closed'
  applications: number
  verified: boolean
}

const mockGrants: Grant[] = [
  {
    id: '1',
    title: 'Small Business Startup Grant',
    organization: 'Local Economic Development',
    description: 'Grants up to $25,000 for new small businesses in the community. Focus on job creation and local economic growth.',
    category: 'Business',
    amount: 'Up to $25,000',
    deadline: new Date('2026-03-15'),
    eligibility: ['New businesses', 'Under 2 years old', 'Local ownership'],
    requirements: ['Business plan', 'Financial projections', 'Community impact statement'],
    status: 'open',
    applications: 45,
    verified: true,
  },
  {
    id: '2',
    title: 'Community Garden Initiative Grant',
    organization: 'Environmental Foundation',
    description: 'Funding for community garden projects that promote food security and environmental education.',
    category: 'Community',
    amount: '$5,000 - $15,000',
    deadline: new Date('2026-02-28'),
    eligibility: ['Non-profits', 'Community groups', 'Schools'],
    requirements: ['Project proposal', 'Budget', 'Community support letters'],
    status: 'closing-soon',
    applications: 23,
    verified: true,
  },
  {
    id: '3',
    title: 'Youth Education Scholarship',
    organization: 'Education Foundation',
    description: 'Scholarships for local students pursuing higher education. Multiple awards available.',
    category: 'Education',
    amount: '$2,000 - $10,000',
    deadline: new Date('2026-04-01'),
    eligibility: ['High school seniors', 'Local residents', 'GPA 3.0+'],
    requirements: ['Transcript', 'Essay', 'Letters of recommendation'],
    status: 'open',
    applications: 78,
    verified: true,
  },
]

const categories = ['All', 'Business', 'Community', 'Education', 'Non-Profit', 'Arts', 'Technology']

export default function GrantsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'closing-soon'>('all')

  const filteredGrants = useMemo(() => {
    let filtered = mockGrants

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(g => g.category === selectedCategory)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(g => g.status === selectedStatus)
    }

    return filtered.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
  }, [selectedCategory, selectedStatus])

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const tabs = [
    { id: 'all', label: 'All Grants', icon: FileText, count: filteredGrants.length },
    { id: 'business', label: 'Business', icon: Building2, count: filteredGrants.filter(g => g.category === 'Business').length },
    { id: 'community', label: 'Community', icon: Users, count: filteredGrants.filter(g => g.category === 'Community').length },
    { id: 'education', label: 'Education', icon: GraduationCap, count: filteredGrants.filter(g => g.category === 'Education').length },
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
            Grant Opportunities
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover funding opportunities for your business, project, or education. Find grants that match your needs.
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

                {/* Status Filter */}
                <div className="flex gap-2">
                  {['all', 'open', 'closing-soon'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status as any)}
                      className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                        selectedStatus === status
                          ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                          : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:shadow-lg'
                      }`}
                    >
                      {status === 'all' ? 'All Status' : status === 'open' ? 'Open' : 'Closing Soon'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>

        {/* Tab Navigation */}
        <TabNavigation tabs={tabs} defaultTab="all">
          {(activeTab) => {
            let displayGrants = filteredGrants
            if (activeTab !== 'all') {
              displayGrants = displayGrants.filter(g => g.category.toLowerCase() === activeTab)
            }

            return (
              <div className="grid md:grid-cols-2 gap-6">
                {displayGrants.map((grant, index) => {
                  const daysLeft = getDaysUntilDeadline(grant.deadline)
                  return (
                    <motion.div
                      key={grant.id}
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
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{grant.title}</h3>
                                {grant.verified && (
                                  <div title="Verified Grant">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{grant.organization}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              grant.status === 'open' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : grant.status === 'closing-soon'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {grant.status === 'closing-soon' ? 'Closing Soon' : grant.status}
                            </span>
                          </div>

                          {/* Amount */}
                          <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{grant.amount}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">available</span>
                          </div>

                          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{grant.description}</p>

                          {/* Deadline */}
                          <div className="flex items-center justify-between mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white" suppressHydrationWarning>
                                Deadline: {grant.deadline.toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                {daysLeft} days left
                              </span>
                            </div>
                          </div>

                          {/* Eligibility */}
                          <div className="mb-4">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4 text-primary-600" />
                              Eligibility
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {grant.eligibility.map((item, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-between mb-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <FileText className="w-4 h-4" />
                              <span>{grant.applications} applications</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Award className="w-4 h-4" />
                              <span>{grant.category}</span>
                            </div>
                          </div>

                          <button className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                            <FileText className="w-4 h-4" />
                            Apply Now
                          </button>
                        </div>
                      </LiquidGlass>
                    </motion.div>
                  )
                })}
              </div>
            )
          }}
        </TabNavigation>
      </div>
    </div>
  )
}

