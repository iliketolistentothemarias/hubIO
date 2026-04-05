'use client'

/**
 * Volunteer Dashboard
 * 
 * Personalized dashboard for volunteers with:
 * - Impact tracking
 * - Volunteer hours
 * - Upcoming opportunities
 * - Achievements and badges
 * - Volunteer history
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  HandHeart, Clock, Award, TrendingUp, Calendar, Target, 
  Star, Users, MapPin, CheckCircle, Heart 
} from 'lucide-react'
import { getAuthService } from '@/lib/auth'
import TabNavigation from '@/components/TabNavigation'
import LiquidGlass from '@/components/LiquidGlass'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VolunteerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [volunteerStats, setVolunteerStats] = useState({
    totalHours: 0,
    opportunitiesCompleted: 0,
    currentOpportunities: 0,
    badges: 0,
  })
  const [upcomingOpportunities, setUpcomingOpportunities] = useState<any[]>([])

  useEffect(() => {
    const auth = getAuthService()
    const currentUser = auth.getCurrentUser()
    
    if (!currentUser) {
      router.push('/login/volunteer')
      return
    }

    setUser(currentUser)
    loadVolunteerData()
  }, [router])

  const loadVolunteerData = () => {
    // Mock volunteer data
    setVolunteerStats({
      totalHours: 127,
      opportunitiesCompleted: 23,
      currentOpportunities: 3,
      badges: 5,
    })

    setUpcomingOpportunities([
      {
        id: '1',
        title: 'Community Food Distribution',
        date: '2026-02-15',
        time: '10:00 AM',
        location: 'South Fayette Community Center',
        hours: 4,
      },
      {
        id: '2',
        title: 'Youth Mentoring Session',
        date: '2026-02-18',
        time: '3:00 PM',
        location: 'Boys & Girls Club',
        hours: 2,
      },
    ])
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HandHeart },
    { id: 'opportunities', label: 'Opportunities', icon: Calendar, count: volunteerStats.currentOpportunities },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'achievements', label: 'Achievements', icon: Award },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 
                    dark:from-gray-900 dark:via-gray-800 dark:to-green-900/10 pt-20">
      <div className="container-custom section-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Volunteer Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Welcome back, {user.name}! Track your impact and find new opportunities.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Hours', value: volunteerStats.totalHours, icon: Clock, color: 'text-green-600' },
            { label: 'Completed', value: volunteerStats.opportunitiesCompleted, icon: CheckCircle, color: 'text-blue-600' },
            { label: 'Active', value: volunteerStats.currentOpportunities, icon: Calendar, color: 'text-purple-600' },
            { label: 'Badges', value: volunteerStats.badges, icon: Award, color: 'text-yellow-600' },
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
                  <div className="p-6">
                    <Icon className={`w-8 h-8 ${stat.color} mb-3`} />
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                </LiquidGlass>
              </motion.div>
            )
          })}
        </div>

        {/* Tab Navigation */}
        <TabNavigation tabs={tabs} defaultTab="overview">
          {(activeTab) => (
            <div>
              {activeTab === 'overview' && <VolunteerOverviewTab stats={volunteerStats} upcoming={upcomingOpportunities} />}
              {activeTab === 'opportunities' && <OpportunitiesTab opportunities={upcomingOpportunities} />}
              {activeTab === 'history' && <HistoryTab />}
              {activeTab === 'achievements' && <AchievementsTab />}
            </div>
          )}
        </TabNavigation>
      </div>
    </div>
  )
}

function VolunteerOverviewTab({ stats, upcoming }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <LiquidGlass intensity="medium">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Your Impact
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Hours This Month</span>
                <span className="font-bold text-gray-900 dark:text-white">24 hours</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalHours}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.opportunitiesCompleted}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Opportunities</div>
              </div>
            </div>
          </div>
        </div>
      </LiquidGlass>

      <LiquidGlass intensity="medium">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Upcoming Opportunities
          </h3>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">No upcoming opportunities</p>
            ) : (
              upcoming.map((opp: any) => (
                <div key={opp.id} className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">{opp.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {opp.date} at {opp.time}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3" />
                    {opp.location}
                  </div>
                </div>
              ))
            )}
            <Link href="/#volunteer" className="block text-center text-green-600 dark:text-green-400 hover:underline mt-4">
              Find More Opportunities →
            </Link>
          </div>
        </div>
      </LiquidGlass>
    </div>
  )
}

function OpportunitiesTab({ opportunities }: any) {
  return (
    <LiquidGlass intensity="medium">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Opportunities</h3>
        <div className="space-y-4">
          {opportunities.map((opp: any) => (
            <div key={opp.id} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{opp.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{opp.date} at {opp.time}</div>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </LiquidGlass>
  )
}

function HistoryTab() {
  return (
    <LiquidGlass intensity="medium">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Volunteer History</h3>
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Your volunteer history will appear here</p>
        </div>
      </div>
    </LiquidGlass>
  )
}

function AchievementsTab() {
  return (
    <LiquidGlass intensity="medium">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Achievements & Badges</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: 'First Steps', description: 'Completed first volunteer opportunity', icon: Star, earned: true },
            { name: 'Community Hero', description: '100+ volunteer hours', icon: Award, earned: true },
            { name: 'Dedicated Volunteer', description: '25+ opportunities completed', icon: Heart, earned: false },
          ].map((badge, index) => {
            const Icon = badge.icon
            return (
              <div key={index} className={`p-6 rounded-2xl ${badge.earned ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Icon className={`w-8 h-8 mb-3 ${badge.earned ? 'text-green-600' : 'text-gray-400'}`} />
                <div className={`font-semibold mb-1 ${badge.earned ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                  {badge.name}
                </div>
                <div className={`text-sm ${badge.earned ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'}`}>
                  {badge.description}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </LiquidGlass>
  )
}

