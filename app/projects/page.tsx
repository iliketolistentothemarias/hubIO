'use client'

/**
 * Community Projects Page
 * 
 * Showcase of community projects, initiatives, and collaborative efforts.
 * Features project tracking, progress updates, and community involvement.
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Lightbulb, Users, Target, TrendingUp, Calendar, MapPin, 
  CheckCircle, Clock, Heart, Share2, Filter, Grid, List 
} from 'lucide-react'
import TabNavigation from '@/components/TabNavigation'
import LiquidGlass from '@/components/LiquidGlass'

interface Project {
  id: string
  name: string
  description: string
  category: string
  organizer: string
  status: 'planning' | 'active' | 'completed'
  progress: number
  supporters: number
  goal: string
  startDate: Date
  endDate?: Date
  location?: string
  tags: string[]
  updates: number
  verified: boolean
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Community Garden Expansion',
    description: 'Expanding our community garden to serve 200+ more families. Adding new plots, irrigation, and educational programs.',
    category: 'Environment',
    organizer: 'Green Spaces Initiative',
    status: 'active',
    progress: 65,
    supporters: 234,
    goal: '200 new garden plots by spring 2026',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-04-30'),
    location: 'Community Garden, Main Street',
    tags: ['Environment', 'Food Security', 'Education'],
    updates: 12,
    verified: true,
  },
  {
    id: '2',
    name: 'Youth Tech Center',
    description: 'Creating a technology center for youth to learn coding, robotics, and digital skills. Free programs for ages 12-18.',
    category: 'Education',
    organizer: 'Tech for Youth',
    status: 'active',
    progress: 45,
    supporters: 189,
    goal: 'Open center by fall 2026',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-09-01'),
    location: '789 Tech Plaza',
    tags: ['Education', 'Technology', 'Youth'],
    updates: 8,
    verified: true,
  },
  {
    id: '3',
    name: 'Senior Transportation Network',
    description: 'Establishing a volunteer-based transportation service for seniors to access medical appointments and essential services.',
    category: 'Senior Services',
    organizer: 'Senior Care Network',
    status: 'planning',
    progress: 25,
    supporters: 156,
    goal: 'Launch service by summer 2026',
    startDate: new Date('2026-03-01'),
    tags: ['Senior Services', 'Transportation', 'Volunteer'],
    updates: 5,
    verified: true,
  },
]

const categories = ['All', 'Environment', 'Education', 'Senior Services', 'Health', 'Housing', 'Community']

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'planning' | 'active' | 'completed'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredProjects = useMemo(() => {
    let filtered = mockProjects

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.status === selectedStatus)
    }

    return filtered.sort((a, b) => b.supporters - a.supporters)
  }, [selectedCategory, selectedStatus])

  const tabs = [
    { id: 'all', label: 'All Projects', icon: Lightbulb, count: filteredProjects.length },
    { id: 'active', label: 'Active', icon: TrendingUp, count: filteredProjects.filter(p => p.status === 'active').length },
    { id: 'planning', label: 'Planning', icon: Clock, count: filteredProjects.filter(p => p.status === 'planning').length },
    { id: 'completed', label: 'Completed', icon: CheckCircle, count: filteredProjects.filter(p => p.status === 'completed').length },
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
            Community Projects
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover and support community projects making a difference. Get involved and help build a better community.
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

                {/* Status and View */}
                <div className="flex gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="px-4 py-2 rounded-2xl border-2 border-gray-200/50 dark:border-gray-700/50 
                             bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
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
            let displayProjects = filteredProjects
            if (activeTab !== 'all') {
              displayProjects = displayProjects.filter(p => p.status === activeTab)
            }

            return viewMode === 'list' ? (
              <ProjectListView projects={displayProjects} />
            ) : (
              <ProjectGridView projects={displayProjects} />
            )
          }}
        </TabNavigation>
      </div>
    </div>
  )
}

function ProjectGridView({ projects }: { projects: Project[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
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
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h3>
                    {project.verified && (
                      <div title="Verified Project">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{project.organizer}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  project.status === 'active' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : project.status === 'planning'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {project.status}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Progress</span>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{project.progress}%</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                    className="h-full bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full"
                  />
                </div>
              </div>

              {/* Goal */}
              <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Goal</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{project.goal}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{project.supporters}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Supporters</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{project.updates}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Updates</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{project.tags.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Tags</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2 rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4" />
                  Support
                </button>
                <button className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-2xl hover:shadow-lg transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>
      ))}
    </div>
  )
}

function ProjectListView({ projects }: { projects: Project[] }) {
  return (
    <div className="space-y-4">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ x: 5 }}
        >
          <LiquidGlass intensity="light">
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                  <Lightbulb className="w-16 h-16 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h3>
                      {project.verified && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{project.organizer}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === 'active' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
                
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Progress: {project.progress}%</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{project.supporters} supporters</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary-600" />
                    <span>{project.goal}</span>
                  </div>
                  {project.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-600" />
                      <span>{project.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col gap-2">
                <button className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all">
                  Support Project
                </button>
                <button className="px-6 py-3 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-2xl hover:shadow-lg transition-all">
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

