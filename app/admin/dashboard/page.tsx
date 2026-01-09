'use client'

/**
 * Admin Dashboard
 * 
 * Comprehensive admin dashboard with:
 * - System analytics
 * - User management
 * - Content moderation
 * - Resource management
 * - System settings
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, Users, FileText, Shield, Settings, AlertCircle, 
  CheckCircle, XCircle, TrendingUp, Activity, Database, Bell 
} from 'lucide-react'
import { getAuthService, requireRole } from '@/lib/auth'
import { getDatabase } from '@/lib/db/schema'
import { getAnalytics } from '@/lib/utils/analytics'
import TabNavigation from '@/components/TabNavigation'
import LiquidGlass from '@/components/LiquidGlass'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [pendingResources, setPendingResources] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    // Check admin access
    try {
      const auth = getAuthService()
      const user = auth.getCurrentUser()
      
      if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        router.push('/login/admin')
        return
      }

      loadDashboardData()
    } catch (error) {
      router.push('/login/admin')
    }
  }, [router])

  const loadDashboardData = () => {
    const db = getDatabase()
    const analytics = getAnalytics()
    
    // Get stats
    const communityStats = analytics.getCommunityStats()
    setStats(communityStats)

    // Get pending resources (not verified)
    const allResources = db.getAllResources()
    const pending = allResources.filter(r => !r.verified).slice(0, 5)
    setPendingResources(pending)

    // Mock recent activity
    setRecentActivity([
      { type: 'resource', action: 'submitted', name: 'New Food Bank', time: '2 hours ago' },
      { type: 'user', action: 'registered', name: 'John Doe', time: '3 hours ago' },
      { type: 'campaign', action: 'created', name: 'Community Garden Fund', time: '5 hours ago' },
    ])
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'resources', label: 'Resources', icon: FileText, count: pendingResources.length, badge: pendingResources.length > 0 ? 'new' : undefined },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 
                    dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/10 pt-20">
      <div className="container-custom section-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Manage and monitor the HubIO platform
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Resources', value: stats.totalResources, icon: FileText, color: 'text-blue-600' },
            { label: 'Active Users', value: stats.activeUsers, icon: Users, color: 'text-green-600' },
            { label: 'Pending Reviews', value: pendingResources.length, icon: AlertCircle, color: 'text-yellow-600' },
            { label: 'Total Events', value: stats.totalEvents, icon: Activity, color: 'text-purple-600' },
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
              {activeTab === 'overview' && <OverviewTab stats={stats} recentActivity={recentActivity} />}
              {activeTab === 'resources' && <ResourcesTab pendingResources={pendingResources} />}
              {activeTab === 'users' && <UsersTab />}
              {activeTab === 'moderation' && <ModerationTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </div>
          )}
        </TabNavigation>
      </div>
    </div>
  )
}

function OverviewTab({ stats, recentActivity }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <LiquidGlass intensity="medium">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            Platform Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Lives Impacted</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.impactMetrics.livesImpacted.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Volunteer Hours</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.impactMetrics.volunteerHours.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Funds Raised</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">${(stats.impactMetrics.fundsRaised / 1000).toFixed(1)}K</span>
            </div>
          </div>
        </div>
      </LiquidGlass>

      <LiquidGlass intensity="medium">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Bell className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{activity.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{activity.action} • {activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </LiquidGlass>
    </div>
  )
}

function ResourcesTab({ pendingResources }: any) {
  return (
    <LiquidGlass intensity="medium">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Pending Resource Reviews</h3>
        {pendingResources.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No pending resources to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingResources.map((resource: any) => (
              <div key={resource.id} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{resource.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{resource.category}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all">
                    Reject
                  </button>
                  <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LiquidGlass>
  )
}

function UsersTab() {
  return (
    <LiquidGlass intensity="medium">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">User Management</h3>
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">User management interface coming soon</p>
        </div>
      </div>
    </LiquidGlass>
  )
}

function ModerationTab() {
  return (
    <LiquidGlass intensity="medium">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Content Moderation</h3>
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Moderation tools coming soon</p>
        </div>
      </div>
    </LiquidGlass>
  )
}

function SettingsTab() {
  return (
    <LiquidGlass intensity="medium">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">System Settings</h3>
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Settings panel coming soon</p>
        </div>
      </div>
    </LiquidGlass>
  )
}

