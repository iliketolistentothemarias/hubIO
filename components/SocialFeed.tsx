'use client'

/**
 * Social Activity Feed Component
 * 
 * Displays activity feed from followed users and community
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Heart, MessageCircle, Calendar, HandHeart, 
  DollarSign, Award, Bookmark, UserPlus, Users,
  TrendingUp, Filter
} from 'lucide-react'
import { Activity, ActivityType } from '@/lib/types/social'
import { useSocket } from '@/lib/realtime/client'
import LiquidGlass from './LiquidGlass'

const activityIcons: Record<ActivityType, any> = {
  resource_saved: Bookmark,
  resource_rated: Heart,
  event_rsvp: Calendar,
  volunteer_applied: HandHeart,
  donation_made: DollarSign,
  post_created: MessageCircle,
  post_liked: Heart,
  comment_added: MessageCircle,
  user_followed: UserPlus,
  group_joined: Users,
  badge_earned: Award,
  achievement_unlocked: TrendingUp,
}

const activityColors: Record<ActivityType, string> = {
  resource_saved: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  resource_rated: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  event_rsvp: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  volunteer_applied: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  donation_made: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
  post_created: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
  post_liked: 'text-pink-600 bg-pink-100 dark:bg-pink-900/20',
  comment_added: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/20',
  user_followed: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
  group_joined: 'text-teal-600 bg-teal-100 dark:bg-teal-900/20',
  badge_earned: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
  achievement_unlocked: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
}

export default function SocialFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [filter, setFilter] = useState<ActivityType | 'all'>('all')
  const [loading, setLoading] = useState(true)

  // Get user ID for WebSocket
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => {
    const auth = require('@/lib/auth').getAuthService()
    auth.getCurrentUser().then(user => {
      if (user) setUserId(user.id)
    })
  }, [])

  const { socket, isConnected, joinRoom, leaveRoom, on, off } = useSocket({
    userId,
    autoConnect: true,
  })

  useEffect(() => {
    loadActivities()
    
    // Join activity feed room for real-time updates
    if (isConnected) {
      joinRoom('activity-feed')
      
      const handleNewActivity = (data: { activity: Activity }) => {
        setActivities(prev => [data.activity, ...prev])
      }
      
      on('new-activity', handleNewActivity)
      
      return () => {
        leaveRoom('activity-feed')
        off('new-activity', handleNewActivity)
      }
    } else {
      // Fallback to polling
      const interval = setInterval(() => {
        loadActivities()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [filter, isConnected, joinRoom, leaveRoom, on, off])

  const loadActivities = async () => {
    setLoading(true)
    try {
      const url = filter === 'all' 
        ? '/api/social/activity'
        : `/api/social/activity?type=${filter}`
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setActivities(data.data)
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const activityTypes: { type: ActivityType | 'all'; label: string }[] = [
    { type: 'all', label: 'All Activity' },
    { type: 'resource_saved', label: 'Resources' },
    { type: 'event_rsvp', label: 'Events' },
    { type: 'volunteer_applied', label: 'Volunteering' },
    { type: 'donation_made', label: 'Donations' },
    { type: 'post_created', label: 'Posts' },
    { type: 'badge_earned', label: 'Achievements' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading activity feed...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20">
      <div className="container-custom section-padding max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Activity Feed
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            See what's happening in your community
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {activityTypes.map(({ type, label }) => {
            const Icon = type === 'all' ? Filter : activityIcons[type as ActivityType]
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {label}
              </button>
            )
          })}
        </div>

        {/* Activities */}
        <div className="space-y-4">
          {activities.length === 0 ? (
            <LiquidGlass intensity="light">
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No activities to show. Start following users to see their activity!
                </p>
              </div>
            </LiquidGlass>
          ) : (
            activities.map((activity, index) => {
              const Icon = activityIcons[activity.type]
              const colorClass = activityColors[activity.type]

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <LiquidGlass intensity="light">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-primary-200 dark:bg-primary-800 
                                      flex items-center justify-center flex-shrink-0">
                          {activity.userAvatar ? (
                            <img
                              src={activity.userAvatar}
                              alt={activity.userName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-primary-600 dark:text-primary-400 font-semibold">
                              {activity.userName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {activity.userName}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 ml-2">
                                {activity.action}
                              </span>
                              {activity.targetName && (
                                <span className="font-medium text-primary-600 dark:text-primary-400 ml-1">
                                  {activity.targetName}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                              {formatTimeAgo(activity.createdAt)}
                            </span>
                          </div>

                          {/* Metadata */}
                          {activity.metadata && (
                            <div className="mt-2">
                              {activity.metadata.amount && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  ${activity.metadata.amount}
                                </span>
                              )}
                              {activity.metadata.badgeIcon && (
                                <span className="text-2xl ml-2">{activity.metadata.badgeIcon}</span>
                              )}
                            </div>
                          )}

                          {/* Type Badge */}
                          <div className="mt-3 flex items-center gap-2">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                              <Icon className="w-3 h-3" />
                              {activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </LiquidGlass>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

