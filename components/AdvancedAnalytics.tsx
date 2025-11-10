'use client'

/**
 * Advanced Analytics Dashboard Component
 * 
 * Beautiful data visualizations and insights for user activity
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, 
  Activity, Target, Award, Users, Calendar, DollarSign,
  ArrowUpRight, ArrowDownRight, Sparkles
} from 'lucide-react'
import LiquidGlass from './LiquidGlass'

interface AnalyticsData {
  engagement: {
    resourcesViewed: number
    resourcesSaved: number
    eventsAttended: number
    volunteerHours: number
    donationsMade: number
    postsCreated: number
  }
  trends: {
    week: { date: string; value: number }[]
    month: { date: string; value: number }[]
    year: { date: string; value: number }[]
  }
  categories: {
    name: string
    count: number
    percentage: number
    color: string
  }[]
  achievements: {
    name: string
    progress: number
    target: number
    icon: string
  }[]
  insights: {
    type: 'positive' | 'negative' | 'neutral'
    message: string
    value: string
  }[]
}

export default function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock data
      const mockData: AnalyticsData = {
        engagement: {
          resourcesViewed: 47,
          resourcesSaved: 12,
          eventsAttended: 8,
          volunteerHours: 24,
          donationsMade: 3,
          postsCreated: 5,
        },
        trends: {
          week: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
            value: Math.floor(Math.random() * 20) + 10,
          })),
          month: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.floor(Math.random() * 30) + 15,
          })),
          year: Array.from({ length: 12 }, (_, i) => ({
            date: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
            value: Math.floor(Math.random() * 100) + 50,
          })),
        },
        categories: [
          { name: 'Food Assistance', count: 15, percentage: 32, color: '#8B6F47' },
          { name: 'Health Services', count: 12, percentage: 26, color: '#D4A574' },
          { name: 'Education', count: 10, percentage: 21, color: '#A0825D' },
          { name: 'Housing', count: 8, percentage: 17, color: '#6B5D47' },
          { name: 'Other', count: 2, percentage: 4, color: '#C4B5A0' },
        ],
        achievements: [
          { name: 'Community Explorer', progress: 47, target: 50, icon: '🎯' },
          { name: 'Volunteer Champion', progress: 24, target: 30, icon: '❤️' },
          { name: 'Resource Contributor', progress: 5, target: 10, icon: '📝' },
          { name: 'Event Enthusiast', progress: 8, target: 10, icon: '🎉' },
        ],
        insights: [
          { type: 'positive', message: 'You\'re in the top 15% of active users this month!', value: '+23%' },
          { type: 'positive', message: 'Your volunteer hours increased significantly', value: '+40%' },
          { type: 'neutral', message: 'Consider exploring Health Services resources', value: '12 available' },
          { type: 'positive', message: 'You\'ve saved 12 resources this month', value: '+5 this week' },
        ],
      }
      
      setData(mockData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const currentTrend = data.trends[timeRange]
  const maxValue = Math.max(...currentTrend.map(t => t.value))

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20">
      <div className="container-custom section-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-2">
                Your Analytics
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Track your community engagement and impact
              </p>
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Resources Viewed', value: data.engagement.resourcesViewed, icon: BarChart3, change: '+12%', positive: true },
            { label: 'Resources Saved', value: data.engagement.resourcesSaved, icon: Target, change: '+8%', positive: true },
            { label: 'Events Attended', value: data.engagement.eventsAttended, icon: Calendar, change: '+5%', positive: true },
            { label: 'Volunteer Hours', value: data.engagement.volunteerHours, icon: Activity, change: '+40%', positive: true },
            { label: 'Donations Made', value: data.engagement.donationsMade, icon: DollarSign, change: '+2', positive: true },
            { label: 'Posts Created', value: data.engagement.postsCreated, icon: Users, change: '+1', positive: true },
          ].map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <LiquidGlass intensity="light">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      {metric.positive ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {metric.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {metric.label}
                    </div>
                    <div className={`text-xs font-medium ${
                      metric.positive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change}
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>
            )
          })}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Activity Trend Chart */}
          <LiquidGlass intensity="medium">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                  Activity Trend
                </h3>
              </div>
              <div className="h-64 flex items-end justify-between gap-1">
                {currentTrend.map((point, index) => {
                  const height = (point.value / maxValue) * 100
                  return (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg 
                               hover:from-primary-700 hover:to-primary-500 transition-colors relative group"
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 
                                    group-hover:opacity-100 transition-opacity bg-gray-900 text-white 
                                    text-xs px-2 py-1 rounded whitespace-nowrap">
                        {point.value}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
                {currentTrend.filter((_, i) => i % Math.ceil(currentTrend.length / 5) === 0).map((point, i) => (
                  <span key={i}>{point.date}</span>
                ))}
              </div>
            </div>
          </LiquidGlass>

          {/* Category Distribution */}
          <LiquidGlass intensity="medium">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary-600" />
                  Category Distribution
                </h3>
              </div>
              <div className="space-y-4">
                {data.categories.map((category, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {category.count} ({category.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${category.percentage}%` }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </LiquidGlass>
        </div>

        {/* Achievements & Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Achievements Progress */}
          <LiquidGlass intensity="medium">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-600" />
                Achievement Progress
              </h3>
              <div className="space-y-4">
                {data.achievements.map((achievement, index) => {
                  const progress = (achievement.progress / achievement.target) * 100
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {achievement.name}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {achievement.progress}/{achievement.target}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </LiquidGlass>

          {/* Insights */}
          <LiquidGlass intensity="medium">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                Insights & Recommendations
              </h3>
              <div className="space-y-4">
                {data.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === 'positive'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                        : insight.type === 'negative'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-900 dark:text-white flex-1">
                        {insight.message}
                      </p>
                      <span className={`text-sm font-bold ml-2 ${
                        insight.type === 'positive'
                          ? 'text-green-600'
                          : insight.type === 'negative'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        {insight.value}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </LiquidGlass>
        </div>
      </div>
    </div>
  )
}

