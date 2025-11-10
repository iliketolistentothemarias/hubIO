'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Settings, 
  Database, 
  DollarSign, 
  Calendar, 
  Users, 
  MapPin,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  TrendingUp,
  BarChart3,
  FileText,
  CheckCircle,
  Shield,
  RefreshCw
} from 'lucide-react'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { getAuthService } from '@/lib/auth'
import { Resource, Event, FundraisingCampaign, VolunteerOpportunity } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('pending') // Default to pending resources tab
  const [resources, setResources] = useState<Resource[]>([])
  const [pendingResources, setPendingResources] = useState<Resource[]>([])
  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [volunteers, setVolunteers] = useState<VolunteerOpportunity[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<any>(null)
  const router = useRouter()

  const db = getSupabaseDatabase()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const auth = getAuthService()
      const user = await auth.getCurrentUser()
      
      if (!user) {
        // Not logged in - redirect to regular login
        router.push('/login?redirect=/admin')
        return
      }

      // Check if user is admin
      if (user.role === 'admin' || user.role === 'moderator') {
        setIsAdmin(true)
        loadAllData()
      } else {
        // Logged in but not admin - redirect to home with message
        router.push('/?error=admin_access_required')
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/login?redirect=/admin')
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [resData, pendingResResponse, usersData, eventsData, campaignsData, volunteersData] = await Promise.all([
        db.getAllResources().catch(() => []),
        fetch('/api/admin/pending-resources', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(async r => {
          const json = await r.json()
          if (!r.ok) {
            console.error('Pending resources API error:', json)
            return []
          }
          return json.data || []
        }).catch(err => {
          console.error('Error fetching pending resources:', err)
          return []
        }),
        fetch('/api/admin/users', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(async r => {
          const json = await r.json()
          if (!r.ok) {
            console.error('Admin users API error:', json)
            return []
          }
          return json.data || []
        }).catch(err => {
          console.error('Error fetching users:', err)
          return []
        }),
        fetch('/api/admin/events', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(async r => {
          const json = await r.json()
          if (!r.ok) {
            console.error('Events API error:', json)
            return []
          }
          return (json.data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            date: new Date(item.date),
            time: item.time,
            location: item.location || { lat: 0, lng: 0, address: '', city: '', state: '', zipCode: '' },
            organizer: item.organizer,
            organizerId: item.organizer_id,
            capacity: item.capacity,
            registered: item.registered,
            rsvpRequired: item.rsvp_required,
            tags: item.tags || [],
            status: item.status,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }))
        }).catch(err => {
          console.error('Error fetching events:', err)
          return []
        }),
        fetch('/api/admin/campaigns', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(async r => {
          const json = await r.json()
          if (!r.ok) {
            console.error('Campaigns API error:', json)
            return []
          }
          return (json.data || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            goal: parseFloat(item.goal) || 0,
            raised: parseFloat(item.raised) || 0,
            donors: item.donors || 0,
            organizer: item.organizer,
            organizerId: item.organizer_id,
            location: item.location,
            deadline: item.deadline ? new Date(item.deadline) : undefined,
            status: item.status,
            tags: item.tags || [],
            createdAt: new Date(item.created_at),
            updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
          }))
        }).catch(err => {
          console.error('Error fetching campaigns:', err)
          return []
        }),
        fetch('/api/admin/volunteers', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(async r => {
          const json = await r.json()
          if (!r.ok) {
            console.error('Volunteers API error:', json)
            return []
          }
          return (json.data || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            organization: item.organization,
            organizationId: item.organization_id,
            category: item.category,
            date: new Date(),
            time: '',
            location: item.location || { lat: 0, lng: 0, address: '', city: '', state: '', zipCode: '' },
            volunteersNeeded: 0,
            volunteersSignedUp: 0,
            skills: item.skills_required || [],
            requirements: [],
            remote: false,
            duration: item.time_commitment || '',
            status: item.status,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }))
        }).catch(err => {
          console.error('Error fetching volunteers:', err)
          return []
        }),
      ])
      setResources(resData.filter((r: Resource) => r.verified))
      setPendingResources(pendingResResponse)
      setEvents(eventsData)
      setCampaigns(campaignsData)
      setVolunteers(volunteersData)
      setUsers(usersData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveResource = async (resourceId: string) => {
    try {
      const response = await fetch(`/api/admin/resources/${resourceId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const result = await response.json()
      
      if (result.success) {
        loadAllData() // Reload data
      } else {
        alert('Failed to approve resource: ' + result.error)
      }
    } catch (error) {
      console.error('Error approving resource:', error)
      alert('Failed to approve resource')
    }
  }

  const handleDenyResource = async (resourceId: string) => {
    const reason = prompt('Please provide a reason for denying this resource:')
    if (!reason) return

    try {
      const response = await fetch(`/api/admin/resources/${resourceId}/deny`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })
      const result = await response.json()
      
      if (result.success) {
        loadAllData() // Reload data
      } else {
        alert('Failed to deny resource: ' + result.error)
      }
    } catch (error) {
      console.error('Error denying resource:', error)
      alert('Failed to deny resource')
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      })
      const result = await response.json()
      
      if (result.success) {
        // Update local state immediately for better UX
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
        alert(`User role updated to ${newRole}`)
        loadAllData() // Reload data to ensure consistency
      } else {
        alert('Failed to update user role: ' + (result.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error updating user role:', error)
      alert('Failed to update user role: ' + (error.message || 'Network error'))
    }
  }

  const handleUpdateCampaign = async (id: string, updates: Partial<FundraisingCampaign>) => {
    try {
      // Try to update via API first, fall back to local DB
      try {
        const response = await fetch(`/api/campaigns/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })
        const result = await response.json()
        if (result.success && result.data) {
          setCampaigns(prev => prev.map(c => c.id === id ? result.data : c))
          setEditing(null)
          return
        }
      } catch (apiError) {
        console.warn('API update failed, trying local DB:', apiError)
      }
      
      // Fall back to local DB
      const updated = await db.updateCampaign(id, updates)
      if (updated) {
        setCampaigns(prev => prev.map(c => c.id === id ? updated : c))
        setEditing(null)
      }
    } catch (error) {
      console.error('Error updating campaign:', error)
      alert('Failed to update campaign')
    }
  }

  const handleUpdateResource = async (id: string, updates: Partial<Resource>) => {
    try {
      // Try to update via API first
      try {
        const response = await fetch(`/api/resources/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })
        const result = await response.json()
        if (result.success && result.data) {
          setResources(prev => prev.map(r => r.id === id ? result.data : r))
          setPendingResources(prev => prev.map(r => r.id === id ? result.data : r))
          setEditing(null)
          return
        }
      } catch (apiError) {
        console.warn('API update failed, trying local DB:', apiError)
      }
      
      // Fall back to local DB
      const updated = await db.updateResource(id, updates)
      if (updated) {
        setResources(prev => prev.map(r => r.id === id ? updated : r))
        setPendingResources(prev => prev.map(r => r.id === id ? updated : r))
        setEditing(null)
      }
    } catch (error) {
      console.error('Error updating resource:', error)
      alert('Failed to update resource')
    }
  }

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      let endpoint = ''
      
      switch (type) {
        case 'campaign':
          endpoint = `/api/admin/campaigns?id=${id}`
          break
        case 'resource':
          endpoint = `/api/resources/${id}`
          break
        case 'event':
          endpoint = `/api/admin/events?id=${id}`
          break
        case 'volunteer':
          endpoint = `/api/admin/volunteers?id=${id}`
          break
        default:
          alert('Unknown item type')
          return
      }
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const result = await response.json()
      
      if (result.success) {
        switch (type) {
          case 'campaign':
            setCampaigns(prev => prev.filter(c => c.id !== id))
            break
          case 'resource':
            setResources(prev => prev.filter(r => r.id !== id))
            setPendingResources(prev => prev.filter(r => r.id !== id))
            break
          case 'event':
            setEvents(prev => prev.filter(e => e.id !== id))
            break
          case 'volunteer':
            setVolunteers(prev => prev.filter(v => v.id !== id))
            break
        }
        alert('Item deleted successfully')
        // Reload data to ensure consistency
        loadAllData()
      } else {
        alert('Failed to delete item: ' + (result.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error deleting:', error)
      alert('Failed to delete item: ' + (error.message || 'Network error'))
    }
  }

  const stats = {
    totalResources: resources.length,
    totalCampaigns: campaigns.length,
    totalEvents: events.length,
    totalVolunteers: volunteers.length,
    totalRaised: campaigns.reduce((sum, c) => sum + c.raised, 0),
    totalGoal: campaigns.reduce((sum, c) => sum + c.goal, 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6F47] dark:border-[#D4A574] mx-auto mb-4"></div>
          <p className="text-[#6B5D47] dark:text-[#B8A584]">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20">
      <div className="container-custom section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-2">
            Admin Dashboard
          </h1>
          <p className="text-lg text-[#6B5D47] dark:text-[#B8A584]">
            Manage all resources, campaigns, events, and volunteer opportunities
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">Resources</p>
                  <p className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">{stats.totalResources}</p>
                </div>
                <Database className="w-8 h-8 text-[#8B6F47] dark:text-[#D4A574]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">Campaigns</p>
                  <p className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">{stats.totalCampaigns}</p>
                </div>
                <DollarSign className="w-8 h-8 text-[#8B6F47] dark:text-[#D4A574]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">Events</p>
                  <p className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">{stats.totalEvents}</p>
                </div>
                <Calendar className="w-8 h-8 text-[#8B6F47] dark:text-[#D4A574]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">Volunteers</p>
                  <p className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">{stats.totalVolunteers}</p>
                </div>
                <Users className="w-8 h-8 text-[#8B6F47] dark:text-[#D4A574]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fundraising Stats */}
        <Card className="mb-8 bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
          <CardHeader>
            <CardTitle className="text-[#2C2416] dark:text-[#F5F3F0] flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Fundraising Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">Total Raised</p>
                <p className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                  ${stats.totalRaised.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">Total Goal</p>
                <p className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                  ${stats.totalGoal.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">Progress</p>
                <p className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                  {stats.totalGoal > 0 ? Math.round((stats.totalRaised / stats.totalGoal) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
            <TabsTrigger value="pending">Pending Resources</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
            <TabsTrigger value="admins">Admin Management</TabsTrigger>
          </TabsList>

          {/* Pending Resources */}
          <TabsContent value="pending" className="mt-6">
            <Card className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#2C2416] dark:text-[#F5F3F0]">
                    Pending Resource Approvals ({pendingResources.length})
                  </CardTitle>
                  <Button
                    onClick={loadAllData}
                    variant="outline"
                    size="sm"
                    className="border-[#E8E0D6] dark:border-[#4A4844]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {pendingResources.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-[#6B5D47] dark:text-[#B8A584]">No pending resources to review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="p-4 border border-[#E8E0D6] dark:border-[#4A4844] rounded-lg bg-[#FAF9F6] dark:bg-[#1C1B18]"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-[#2C2416] dark:text-[#F5F3F0] mb-2">
                              {resource.name}
                            </h3>
                            <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] mb-2">{resource.description}</p>
                            <p className="text-xs text-[#6B5D47] dark:text-[#B8A584]">
                              {resource.category} • {resource.address}
                            </p>
                            <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] mt-1">
                              Phone: {resource.phone} • Email: {resource.email}
                            </p>
                            {resource.website && (
                              <p className="text-xs text-[#6B5D47] dark:text-[#B8A584]">
                                Website: {resource.website}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApproveResource(resource.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleDenyResource(resource.id)}
                            variant="outline"
                            className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Deny
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fundraising Campaigns */}
          <TabsContent value="campaigns" className="mt-6">
            <Card className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
              <CardHeader>
                <CardTitle className="text-[#2C2416] dark:text-[#F5F3F0]">Fundraising Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="p-4 border border-[#E8E0D6] dark:border-[#4A4844] rounded-lg bg-[#FAF9F6] dark:bg-[#1C1B18]"
                    >
                      {editing === campaign.id ? (
                        <CampaignEditForm
                          campaign={campaign}
                          onSave={(updates) => handleUpdateCampaign(campaign.id, updates)}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-[#2C2416] dark:text-[#F5F3F0]">
                                {campaign.title}
                              </h3>
                              <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] mt-1">
                                {campaign.description}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditing(campaign.id)
                                  setEditingData(campaign)
                                }}
                                className="border-[#E8E0D6] dark:border-[#4A4844]"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete('campaign', campaign.id)}
                                className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-[#6B5D47] dark:text-[#B8A584]">Raised</p>
                              <p className="text-lg font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                                ${campaign.raised.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[#6B5D47] dark:text-[#B8A584]">Goal</p>
                              <p className="text-lg font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                                ${campaign.goal.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[#6B5D47] dark:text-[#B8A584]">Donors</p>
                              <p className="text-lg font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                                {campaign.donors}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[#6B5D47] dark:text-[#B8A584]">Progress</p>
                              <p className="text-lg font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                                {Math.round((campaign.raised / campaign.goal) * 100)}%
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-[#E8E0D6] dark:bg-[#4A4844] rounded-full h-2">
                              <div
                                className="bg-[#8B6F47] dark:bg-[#D4A574] h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((campaign.raised / campaign.goal) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources */}
          <TabsContent value="resources" className="mt-6">
            <Card className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#2C2416] dark:text-[#F5F3F0]">Resources</CardTitle>
                  <Button
                    onClick={loadAllData}
                    variant="outline"
                    size="sm"
                    className="border-[#E8E0D6] dark:border-[#4A4844]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="p-4 border border-[#E8E0D6] dark:border-[#4A4844] rounded-lg bg-[#FAF9F6] dark:bg-[#1C1B18]"
                    >
                      {editing === resource.id ? (
                        <ResourceEditForm
                          resource={resource}
                          onSave={(updates) => handleUpdateResource(resource.id, updates)}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg text-[#2C2416] dark:text-[#F5F3F0]">
                                  {resource.name}
                                </h3>
                                {resource.featured && (
                                  <Badge className="bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18]">
                                    Featured
                                  </Badge>
                                )}
                                {resource.verified && (
                                  <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">{resource.description}</p>
                              <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] mt-1">
                                {resource.category} • {resource.address}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditing(resource.id)
                                  setEditingData(resource)
                                }}
                                className="border-[#E8E0D6] dark:border-[#4A4844]"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete('resource', resource.id)}
                                className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events */}
          <TabsContent value="events" className="mt-6">
            <Card className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
              <CardHeader>
                <CardTitle className="text-[#2C2416] dark:text-[#F5F3F0]">Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border border-[#E8E0D6] dark:border-[#4A4844] rounded-lg bg-[#FAF9F6] dark:bg-[#1C1B18]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-[#2C2416] dark:text-[#F5F3F0]">
                            {event.name}
                          </h3>
                          <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] mt-1">{event.description}</p>
                          <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] mt-1">
                            {new Date(event.date).toLocaleDateString()} at {event.time} • {event.organizer}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete('event', event.id)}
                          className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 ml-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Volunteers */}
          <TabsContent value="volunteers" className="mt-6">
            <Card className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
              <CardHeader>
                <CardTitle className="text-[#2C2416] dark:text-[#F5F3F0]">Volunteer Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {volunteers.map((volunteer) => (
                    <div
                      key={volunteer.id}
                      className="p-4 border border-[#E8E0D6] dark:border-[#4A4844] rounded-lg bg-[#FAF9F6] dark:bg-[#1C1B18]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-[#2C2416] dark:text-[#F5F3F0]">
                            {volunteer.title}
                          </h3>
                          <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] mt-1">{volunteer.description}</p>
                          <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] mt-1">
                            {volunteer.organization} • {volunteer.category}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete('volunteer', volunteer.id)}
                          className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 ml-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Management */}
          <TabsContent value="admins" className="mt-6">
            <Card className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]">
              <CardHeader>
                <CardTitle className="text-[#2C2416] dark:text-[#F5F3F0] flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Admin Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 border border-[#E8E0D6] dark:border-[#4A4844] rounded-lg bg-[#FAF9F6] dark:bg-[#1C1B18]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-[#2C2416] dark:text-[#F5F3F0]">
                          {user.name || user.email}
                          </h3>
                          <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] mt-1">{user.email}</p>
                          <Badge className={`mt-2 ${
                            user.role === 'admin' 
                              ? 'bg-[#8B6F47] dark:bg-[#D4A574] text-white' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            {user.role || 'user'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {user.role !== 'admin' ? (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateUserRole(user.id, 'admin')}
                              className="bg-[#8B6F47] dark:bg-[#D4A574] text-white"
                            >
                              Make Admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateUserRole(user.id, 'user')}
                              className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400"
                            >
                              Remove Admin
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Campaign Edit Form Component
function CampaignEditForm({ 
  campaign, 
  onSave, 
  onCancel 
}: { 
  campaign: FundraisingCampaign
  onSave: (updates: Partial<FundraisingCampaign>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: campaign.title,
    description: campaign.description,
    goal: campaign.goal,
    raised: campaign.raised,
    donors: campaign.donors,
    status: campaign.status,
  })

  return (
    <div className="space-y-4">
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]"
      />
      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]"
      />
      <div className="grid grid-cols-3 gap-4">
        <Input
          type="number"
          label="Goal"
          value={formData.goal}
          onChange={(e) => setFormData({ ...formData, goal: Number(e.target.value) })}
          className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]"
        />
        <Input
          type="number"
          label="Raised"
          value={formData.raised}
          onChange={(e) => setFormData({ ...formData, raised: Number(e.target.value) })}
          className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]"
        />
        <Input
          type="number"
          label="Donors"
          value={formData.donors}
          onChange={(e) => setFormData({ ...formData, donors: Number(e.target.value) })}
          className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]"
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onSave(formData)}
          className="bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18]"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-[#E8E0D6] dark:border-[#4A4844]"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  )
}

// Resource Edit Form Component
function ResourceEditForm({ 
  resource, 
  onSave, 
  onCancel 
}: { 
  resource: Resource
  onSave: (updates: Partial<Resource>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: resource.name,
    description: resource.description,
    featured: resource.featured,
    verified: resource.verified,
  })

  return (
    <div className="space-y-4">
      <Input
        label="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]"
      />
      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="bg-white dark:bg-[#2A2824] border-[#E8E0D6] dark:border-[#4A4844]"
      />
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-[#2C2416] dark:text-[#F5F3F0]">Featured</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.verified}
            onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-[#2C2416] dark:text-[#F5F3F0]">Verified</span>
        </label>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onSave(formData)}
          className="bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18]"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-[#E8E0D6] dark:border-[#4A4844]"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  )
}

