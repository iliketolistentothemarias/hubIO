'use client'

/**
 * Personalized Dashboard Component
 * 
 * Displays personalized content based on user type and preferences.
 * Shows quick actions, recommendations, and community stats.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Heart, Calendar, DollarSign, HandHeart, TrendingUp, 
  Star, Users, Target, ArrowRight, Sparkles 
} from 'lucide-react'
import { getAuthService } from '@/lib/auth'
import { User } from '@/lib/types'
import LiquidGlass from './LiquidGlass'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const auth = getAuthService()
    const currentUser = auth.getCurrentUser()
    setUser(currentUser)

    if (currentUser) {
      loadRecommendations(currentUser.id)
      loadStats()
    }
  }, [])

  const loadRecommendations = async (userId: string) => {
    try {
      const response = await fetch(`/api/ai/recommendations?limit=6`)
      const data = await response.json()
      if (data.success) {
        setRecommendations(data.data)
      }
    } catch (error) {
      console.error('Error loading recommendations:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/analytics/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to view your dashboard</p>
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const quickActions = [
    { icon: Search, label: 'Find Resources', href: '/directory', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
    { icon: HandHeart, label: 'Volunteer', href: '/#volunteer', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
    { icon: DollarSign, label: 'Fundraise', href: '/#fundraising', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
    { icon: Calendar, label: 'Events', href: '/#events', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20">
      <div className="container-custom section-padding">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-lg text-[#6B5D47] dark:text-[#B8A584]">
            Here's what's happening in your community today.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Link href={action.href}>
                  <LiquidGlass intensity="light">
                    <div className="p-6 text-center">
                      <div className={`inline-flex p-3 rounded-lg ${action.color} mb-3`}>
                        <Icon className="w-6 h-6 text-white dark:text-[#1a1a1a]" />
                      </div>
                      <div className="font-semibold text-[#2C2416] dark:text-[#F5F3F0]">{action.label}</div>
                    </div>
                  </LiquidGlass>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Resources', value: stats.totalResources, icon: Heart, color: 'text-primary-600' },
              { label: 'Volunteers', value: stats.totalVolunteers, icon: Users, color: 'text-green-600' },
              { label: 'Funds Raised', value: `$${(stats.impactMetrics.fundsRaised / 1000).toFixed(1)}K`, icon: DollarSign, color: 'text-yellow-600' },
              { label: 'Events', value: stats.totalEvents, icon: Calendar, color: 'text-purple-600' },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <LiquidGlass intensity="light">
                    <div className="p-6 text-center">
                      <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                    </div>
                  </LiquidGlass>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                Recommended for You
              </h2>
              <Link href="/directory" className="text-primary-600 dark:text-primary-400 hover:underline">
                View All
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {recommendations.slice(0, 3).map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <LiquidGlass intensity="medium">
                    <div className="p-6">
                      <div className="text-sm text-primary-600 dark:text-primary-400 mb-2">
                        {rec.reason}
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-2">
                        {rec.type === 'resource' ? 'Resource' : 
                         rec.type === 'event' ? 'Event' :
                         rec.type === 'volunteer' ? 'Volunteer Opportunity' : 'Campaign'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <TrendingUp className="w-4 h-4" />
                        Score: {rec.score}
                      </div>
                    </div>
                  </LiquidGlass>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* User Stats */}
        <LiquidGlass intensity="medium">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Impact</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{user.karma}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Karma Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary-600 dark:text-secondary-400">{user.badges.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Badges Earned</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {user.role === 'volunteer' ? 'Active' : 'Member'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
              </div>
            </div>
          </div>
        </LiquidGlass>
      </div>
    </div>
  )
}

