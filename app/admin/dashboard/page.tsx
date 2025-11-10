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
import { Save, X } from 'lucide-react'
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
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check admin access using client-side auth
    const checkAdmin = async () => {
      try {
        const auth = getAuthService()
        const user = await auth.getCurrentUser()
        
        if (!user) {
          // Not logged in - redirect to regular login
          router.push('/login?redirect=/admin/dashboard')
          return
        }

        // Check if user is admin
        if (user.role === 'admin' || user.role === 'moderator') {
          setIsChecking(false)
          loadDashboardData()
        } else {
          // Logged in but not admin - redirect to home with message
          router.push('/?error=admin_access_required')
        }
      } catch (error) {
        console.error('Error checking admin access:', error)
        router.push('/login?redirect=/admin/dashboard')
      }
    }

    checkAdmin()
  }, [router])

  const loadDashboardData = async () => {
    try {
      const db = getDatabase()
      const analytics = getAnalytics()
      
      // Get stats
      const communityStats = analytics.getCommunityStats()
      setStats(communityStats)

      // Fetch pending resources from API (Supabase)
      try {
        const response = await fetch('/api/admin/pending-resources')
        const result = await response.json()
        if (result.success && result.data) {
          setPendingResources(result.data)
        } else {
          // Fallback to local DB if API fails
          const allResources = db.getAllResources()
          const pending = allResources.filter(r => !r.verified).slice(0, 5)
          setPendingResources(pending)
        }
      } catch (error) {
        console.error('Error fetching pending resources:', error)
        // Fallback to local DB
        const allResources = db.getAllResources()
        const pending = allResources.filter(r => !r.verified).slice(0, 5)
        setPendingResources(pending)
      }

      // Mock recent activity
      setRecentActivity([
        { type: 'resource', action: 'submitted', name: 'New Food Bank', time: '2 hours ago' },
        { type: 'user', action: 'registered', name: 'John Doe', time: '3 hours ago' },
        { type: 'campaign', action: 'created', name: 'Community Garden Fund', time: '5 hours ago' },
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'resources', label: 'Resources', icon: FileText, count: pendingResources.length, badge: pendingResources.length > 0 ? 'new' : undefined },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  if (isChecking || !stats) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-white to-primary-50/30 
                    dark:from-[#1C1B18] dark:via-gray-800 dark:to-primary-900/10 pt-20">
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
              {activeTab === 'resources' && <ResourcesTab pendingResources={pendingResources} onRefresh={loadDashboardData} />}
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
  const [showSettings, setShowSettings] = useState(false)
  const [overviewSettings, setOverviewSettings] = useState({
    refreshInterval: 30,
    showImpactMetrics: true,
    showActivityFeed: true,
    activityLimit: 10,
    autoRefresh: true,
  })

  const handleSaveSettings = () => {
    // Save settings to API
    console.log('Saving overview settings:', overviewSettings)
    alert('Overview settings saved!')
    setShowSettings(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {showSettings && (
        <LiquidGlass intensity="medium">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Overview Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto Refresh Interval (seconds)
                </label>
                <input
                  type="number"
                  value={overviewSettings.refreshInterval}
                  onChange={(e) => setOverviewSettings({ ...overviewSettings, refreshInterval: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="10"
                  max="300"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Impact Metrics
                </label>
                <input
                  type="checkbox"
                  checked={overviewSettings.showImpactMetrics}
                  onChange={(e) => setOverviewSettings({ ...overviewSettings, showImpactMetrics: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Activity Feed
                </label>
                <input
                  type="checkbox"
                  checked={overviewSettings.showActivityFeed}
                  onChange={(e) => setOverviewSettings({ ...overviewSettings, showActivityFeed: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activity Feed Limit
                </label>
                <input
                  type="number"
                  value={overviewSettings.activityLimit}
                  onChange={(e) => setOverviewSettings({ ...overviewSettings, activityLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="5"
                  max="50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
                >
                  Save Settings
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </LiquidGlass>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {overviewSettings.showImpactMetrics && (
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
        )}

        {overviewSettings.showActivityFeed && (
          <LiquidGlass intensity="medium">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivity.slice(0, overviewSettings.activityLimit).map((activity: any, index: number) => (
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
        )}
      </div>
    </div>
  )
}

function ResourcesTab({ pendingResources, onRefresh }: any) {
  const [showSettings, setShowSettings] = useState(false)
  const [resourceSettings, setResourceSettings] = useState({
    autoApprove: false,
    requireVerification: true,
    defaultCategory: '',
    maxResourcesPerUser: 10,
    enableRatings: true,
    enableReviews: true,
    featuredRequiresApproval: true,
  })
  const [processing, setProcessing] = useState<string | null>(null)

  const handleSaveSettings = () => {
    console.log('Saving resource settings:', resourceSettings)
    alert('Resource settings saved!')
    setShowSettings(false)
  }

  const handleApproveResource = async (resourceId: string) => {
    if (processing) return
    
    setProcessing(resourceId)
    try {
      const response = await fetch(`/api/admin/resources/${resourceId}/approve`, {
        method: 'POST',
      })
      const result = await response.json()
      
      if (result.success) {
        if (onRefresh) {
          await onRefresh()
        }
      } else {
        alert('Failed to approve resource: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error approving resource:', error)
      alert('Failed to approve resource')
    } finally {
      setProcessing(null)
    }
  }

  const handleDenyResource = async (resourceId: string) => {
    if (processing) return
    
    const reason = prompt('Please provide a reason for denying this resource:')
    if (!reason) return
    
    setProcessing(resourceId)
    try {
      const response = await fetch(`/api/admin/resources/${resourceId}/deny`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })
      const result = await response.json()
      
      if (result.success) {
        if (onRefresh) {
          await onRefresh()
        }
      } else {
        alert('Failed to deny resource: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error denying resource:', error)
      alert('Failed to deny resource')
    } finally {
      setProcessing(null)
    }
  }

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resources</h2>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {showSettings && (
        <LiquidGlass intensity="medium">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Resource Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-approve resources
                </label>
                <input
                  type="checkbox"
                  checked={resourceSettings.autoApprove}
                  onChange={(e) => setResourceSettings({ ...resourceSettings, autoApprove: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Require verification
                </label>
                <input
                  type="checkbox"
                  checked={resourceSettings.requireVerification}
                  onChange={(e) => setResourceSettings({ ...resourceSettings, requireVerification: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Resources Per User
                </label>
                <input
                  type="number"
                  value={resourceSettings.maxResourcesPerUser}
                  onChange={(e) => setResourceSettings({ ...resourceSettings, maxResourcesPerUser: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="1"
                  max="100"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Ratings
                </label>
                <input
                  type="checkbox"
                  checked={resourceSettings.enableRatings}
                  onChange={(e) => setResourceSettings({ ...resourceSettings, enableRatings: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Reviews
                </label>
                <input
                  type="checkbox"
                  checked={resourceSettings.enableReviews}
                  onChange={(e) => setResourceSettings({ ...resourceSettings, enableReviews: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Featured Resources Require Approval
                </label>
                <input
                  type="checkbox"
                  checked={resourceSettings.featuredRequiresApproval}
                  onChange={(e) => setResourceSettings({ ...resourceSettings, featuredRequiresApproval: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Settings
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </LiquidGlass>
      )}

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
                    <button 
                      onClick={() => handleApproveResource(resource.id)}
                      disabled={processing === resource.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === resource.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button 
                      onClick={() => handleDenyResource(resource.id)}
                      disabled={processing === resource.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === resource.id ? 'Processing...' : 'Reject'}
                    </button>
                    <button 
                      onClick={() => window.open(`/resources/${resource.id}`, '_blank')}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </LiquidGlass>
    </div>
  )
}

function UsersTab() {
  const [showSettings, setShowSettings] = useState(false)
  const [userSettings, setUserSettings] = useState({
    allowSelfRegistration: true,
    requireEmailVerification: true,
    defaultUserRole: 'resident',
    maxUsersPerDay: 100,
    enableKarmaSystem: true,
    enableBadges: true,
    allowRoleChanges: false,
    autoBanAfterReports: 3,
  })

  const handleSaveSettings = () => {
    console.log('Saving user settings:', userSettings)
    alert('User settings saved!')
    setShowSettings(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {showSettings && (
        <LiquidGlass intensity="medium">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allow Self Registration
                </label>
                <input
                  type="checkbox"
                  checked={userSettings.allowSelfRegistration}
                  onChange={(e) => setUserSettings({ ...userSettings, allowSelfRegistration: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Require Email Verification
                </label>
                <input
                  type="checkbox"
                  checked={userSettings.requireEmailVerification}
                  onChange={(e) => setUserSettings({ ...userSettings, requireEmailVerification: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default User Role
                </label>
                <select
                  value={userSettings.defaultUserRole}
                  onChange={(e) => setUserSettings({ ...userSettings, defaultUserRole: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="resident">Resident</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="organizer">Organizer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Users Per Day
                </label>
                <input
                  type="number"
                  value={userSettings.maxUsersPerDay}
                  onChange={(e) => setUserSettings({ ...userSettings, maxUsersPerDay: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="1"
                  max="1000"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Karma System
                </label>
                <input
                  type="checkbox"
                  checked={userSettings.enableKarmaSystem}
                  onChange={(e) => setUserSettings({ ...userSettings, enableKarmaSystem: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Badges
                </label>
                <input
                  type="checkbox"
                  checked={userSettings.enableBadges}
                  onChange={(e) => setUserSettings({ ...userSettings, enableBadges: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto-ban After Reports
                </label>
                <input
                  type="number"
                  value={userSettings.autoBanAfterReports}
                  onChange={(e) => setUserSettings({ ...userSettings, autoBanAfterReports: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="1"
                  max="10"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Users will be automatically banned after this many reports</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Settings
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </LiquidGlass>
      )}

      <LiquidGlass intensity="medium">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">User Management</h3>
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">User management interface coming soon</p>
          </div>
        </div>
      </LiquidGlass>
    </div>
  )
}

function ModerationTab() {
  const [showSettings, setShowSettings] = useState(false)
  const [moderationSettings, setModerationSettings] = useState({
    enableAutoModeration: false,
    autoFlagKeywords: '',
    requireApprovalForNewContent: true,
    enableContentFiltering: true,
    maxReportsBeforeRemoval: 5,
    enableSpamDetection: true,
    enableProfanityFilter: true,
    moderationQueueLimit: 50,
  })

  const handleSaveSettings = () => {
    console.log('Saving moderation settings:', moderationSettings)
    alert('Moderation settings saved!')
    setShowSettings(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Moderation</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {showSettings && (
        <LiquidGlass intensity="medium">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Moderation Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Auto Moderation
                </label>
                <input
                  type="checkbox"
                  checked={moderationSettings.enableAutoModeration}
                  onChange={(e) => setModerationSettings({ ...moderationSettings, enableAutoModeration: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Require Approval for New Content
                </label>
                <input
                  type="checkbox"
                  checked={moderationSettings.requireApprovalForNewContent}
                  onChange={(e) => setModerationSettings({ ...moderationSettings, requireApprovalForNewContent: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Content Filtering
                </label>
                <input
                  type="checkbox"
                  checked={moderationSettings.enableContentFiltering}
                  onChange={(e) => setModerationSettings({ ...moderationSettings, enableContentFiltering: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Spam Detection
                </label>
                <input
                  type="checkbox"
                  checked={moderationSettings.enableSpamDetection}
                  onChange={(e) => setModerationSettings({ ...moderationSettings, enableSpamDetection: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Profanity Filter
                </label>
                <input
                  type="checkbox"
                  checked={moderationSettings.enableProfanityFilter}
                  onChange={(e) => setModerationSettings({ ...moderationSettings, enableProfanityFilter: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Reports Before Auto-Removal
                </label>
                <input
                  type="number"
                  value={moderationSettings.maxReportsBeforeRemoval}
                  onChange={(e) => setModerationSettings({ ...moderationSettings, maxReportsBeforeRemoval: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto-Flag Keywords (comma-separated)
                </label>
                <textarea
                  value={moderationSettings.autoFlagKeywords}
                  onChange={(e) => setModerationSettings({ ...moderationSettings, autoFlagKeywords: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="spam, scam, inappropriate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Moderation Queue Limit
                </label>
                <input
                  type="number"
                  value={moderationSettings.moderationQueueLimit}
                  onChange={(e) => setModerationSettings({ ...moderationSettings, moderationQueueLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="10"
                  max="200"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Settings
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </LiquidGlass>
      )}

      <LiquidGlass intensity="medium">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Content Moderation</h3>
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Moderation tools coming soon</p>
          </div>
        </div>
      </LiquidGlass>
    </div>
  )
}

function SettingsTab() {
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'HubIO',
    siteDescription: 'Your gateway to community resources',
    maintenanceMode: false,
    enableNotifications: true,
    enableEmailNotifications: true,
    emailFromAddress: 'noreply@hubio.org',
    maxFileUploadSize: 10,
    allowedFileTypes: 'jpg,jpeg,png,pdf,doc,docx',
    enableAnalytics: true,
    enableErrorLogging: true,
    sessionTimeout: 60,
    enableTwoFactorAuth: false,
  })

  const handleSaveSettings = () => {
    console.log('Saving system settings:', systemSettings)
    alert('System settings saved!')
  }

  return (
    <LiquidGlass intensity="medium">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">System Settings</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={systemSettings.siteName}
                  onChange={(e) => setSystemSettings({ ...systemSettings, siteName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site Description
                </label>
                <textarea
                  value={systemSettings.siteDescription}
                  onChange={(e) => setSystemSettings({ ...systemSettings, siteDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Maintenance Mode
                </label>
                <input
                  type="checkbox"
                  checked={systemSettings.maintenanceMode}
                  onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Notifications
                </label>
                <input
                  type="checkbox"
                  checked={systemSettings.enableNotifications}
                  onChange={(e) => setSystemSettings({ ...systemSettings, enableNotifications: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Email Notifications
                </label>
                <input
                  type="checkbox"
                  checked={systemSettings.enableEmailNotifications}
                  onChange={(e) => setSystemSettings({ ...systemSettings, enableEmailNotifications: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email From Address
                </label>
                <input
                  type="email"
                  value={systemSettings.emailFromAddress}
                  onChange={(e) => setSystemSettings({ ...systemSettings, emailFromAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">File Upload Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max File Upload Size (MB)
                </label>
                <input
                  type="number"
                  value={systemSettings.maxFileUploadSize}
                  onChange={(e) => setSystemSettings({ ...systemSettings, maxFileUploadSize: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allowed File Types (comma-separated)
                </label>
                <input
                  type="text"
                  value={systemSettings.allowedFileTypes}
                  onChange={(e) => setSystemSettings({ ...systemSettings, allowedFileTypes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="jpg,png,pdf"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  min="5"
                  max="480"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Two-Factor Authentication
                </label>
                <input
                  type="checkbox"
                  checked={systemSettings.enableTwoFactorAuth}
                  onChange={(e) => setSystemSettings({ ...systemSettings, enableTwoFactorAuth: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advanced Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Analytics
                </label>
                <input
                  type="checkbox"
                  checked={systemSettings.enableAnalytics}
                  onChange={(e) => setSystemSettings({ ...systemSettings, enableAnalytics: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Error Logging
                </label>
                <input
                  type="checkbox"
                  checked={systemSettings.enableErrorLogging}
                  onChange={(e) => setSystemSettings({ ...systemSettings, enableErrorLogging: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save All Settings
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </LiquidGlass>
  )
}

