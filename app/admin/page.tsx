'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthRequired from '@/components/auth/AuthRequired'
import { supabase } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api/client-fetch'
import { RefreshCw, Check, Users, Search, ChevronDown, Loader2, FileText, Trash2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { mockBusinesses } from '@/data/mockBusinesses'
import { mockGrants } from '@/data/mockGrants'

type AdminTab = 'submissions' | 'resources' | 'users' | 'grant-applications' | 'biz-submissions' | 'grant-listings' | 'live-businesses' | 'live-grants'

interface GrantApplication {
  id: string
  grantId: string
  grantTitle: string
  grantOrganization: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  organization: string
  reason: string
  projectDescription: string
  submittedAt: string
}

interface BizSubmission {
  id: string
  businessName: string
  category: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  hours: string
  contactName: string
  submittedAt: string
}

interface GrantListing {
  id: string
  title: string
  organization: string
  description: string
  category: string
  amount: string
  eligibility: string
  requirements: string
  contactName: string
  contactEmail: string
  submittedAt: string
}

const ROLES = ['volunteer', 'organizer', 'admin'] as const
type UserRole = typeof ROLES[number]

interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
  avatar: string | null
}

interface PendingSubmission {
  id: string
  name: string
  category: string
  description: string
  address: string
  phone: string
  email: string
  website: string | null
  tags: string[]
  hours: string | null
  services: string[]
  languages: string[]
  accessibility: string[]
  status: string
  created_at: string
  updated_at: string
  submitted_by: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [featuredSelections, setFeaturedSelections] = useState<Record<string, boolean>>({})
  const [publishedResources, setPublishedResources] = useState<any[]>([])
  const [resourcesLoading, setResourcesLoading] = useState(true)
  const [resourceError, setResourceError] = useState<string | null>(null)
  const [resourceActionLoading, setResourceActionLoading] = useState<string | null>(null)
  const { theme } = useTheme()
  const themeMode = theme === 'dark' ? 'dark' : 'light'
  const [isAdminVerified, setIsAdminVerified] = useState(false)
  const [adminCheckLoading, setAdminCheckLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AdminTab>('submissions')

  // Users tab state
  const [appUsers, setAppUsers] = useState<AppUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [roleChanging, setRoleChanging] = useState<string | null>(null)
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null)
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null)
  const roleDropdownRef = useRef<HTMLDivElement>(null)

  // Grant applications tab state
  const [grantApplications, setGrantApplications] = useState<GrantApplication[]>([])
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())

  // Business & grant listing submissions state
  const [bizSubmissions, setBizSubmissions] = useState<BizSubmission[]>([])
  const [grantListings, setGrantListings] = useState<GrantListing[]>([])

  // Live (approved) businesses and grants shown on site
  const [liveBusinesses, setLiveBusinesses] = useState<BizSubmission[]>([])
  const [liveGrants, setLiveGrants] = useState<GrantListing[]>([])

  const backgroundClasses = useMemo(() => {
    return themeMode === 'light'
      ? 'bg-[#FAF9F6] text-[#1C1B18]'
      : 'bg-[#1C1B18] text-white'
  }, [themeMode])

  const cardClasses = useMemo(() => {
    return themeMode === 'light'
      ? 'bg-white/90 text-[#2C2416] border border-[#E8E0D6] shadow-xl'
      : 'bg-[#1F1B26]/70 text-white border border-white/10 shadow-lg'
  }, [themeMode])

  const accentColor = themeMode === 'dark' ? '#94f9ff' : '#8B6F47'
  const headerTextColor = themeMode === 'dark' ? 'text-white/80' : 'text-[#6B5D47]'

  const fetchSubmissions = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await apiFetch('/api/admin/resource-submissions')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load submissions')
      }

      setSubmissions(data.data.submissions || [])
    } catch (error: any) {
      console.error('Failed to load admin submissions', error)
      setErrorMessage(error.message || 'Unable to load submissions right now')
    } finally {
      setLoading(false)
    }
  }

  const fetchPublishedResources = async () => {
    setResourcesLoading(true)
    setResourceError(null)

    try {
      const response = await apiFetch('/api/admin/resources')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load resources')
      }

      setPublishedResources(data.data.resources || [])
    } catch (error: any) {
      console.error('Failed to load published resources', error)
      setResourceError(error.message || 'Unable to load resources right now')
    } finally {
      setResourcesLoading(false)
    }
  }

  const fetchUsers = async (q = '') => {
    setUsersLoading(true)
    try {
      const res = await apiFetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      const json = await res.json()
      if (json.success) setAppUsers(json.data || [])
    } catch (e) {
      console.error('Failed to load users', e)
    } finally {
      setUsersLoading(false)
    }
  }

  const loadGrantApplications = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('grantApplications') || '[]') as GrantApplication[]
      setGrantApplications(stored.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()))
    } catch {
      setGrantApplications([])
    }
  }

  const deleteGrantApplication = (id: string) => {
    try {
      const updated = grantApplications.filter(a => a.id !== id)
      localStorage.setItem('grantApplications', JSON.stringify(updated))
      setGrantApplications(updated)
      setApprovedIds(prev => { const s = new Set(prev); s.delete(id); return s })
    } catch { /* ignore */ }
  }

  const approveGrantApplication = (id: string) => {
    setApprovedIds(prev => new Set(prev).add(id))
    setTimeout(() => deleteGrantApplication(id), 1200)
  }

  const loadBizSubmissions = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('businessSubmissions') || '[]') as BizSubmission[]
      setBizSubmissions(stored.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()))
    } catch { setBizSubmissions([]) }
  }

  const deleteBizSubmission = (id: string) => {
    try {
      const updated = bizSubmissions.filter(s => s.id !== id)
      localStorage.setItem('businessSubmissions', JSON.stringify(updated))
      setBizSubmissions(updated)
    } catch { /* ignore */ }
  }

  const approveBizSubmission = (id: string) => {
    const item = bizSubmissions.find(s => s.id === id)
    if (!item) return
    try {
      const live = JSON.parse(localStorage.getItem('approvedBusinesses') || '[]') as BizSubmission[]
      live.push(item)
      localStorage.setItem('approvedBusinesses', JSON.stringify(live))
      deleteBizSubmission(id)
    } catch { /* ignore */ }
  }

  const loadGrantListings = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('grantListingSubmissions') || '[]') as GrantListing[]
      setGrantListings(stored.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()))
    } catch { setGrantListings([]) }
  }

  const deleteGrantListing = (id: string) => {
    try {
      const updated = grantListings.filter(s => s.id !== id)
      localStorage.setItem('grantListingSubmissions', JSON.stringify(updated))
      setGrantListings(updated)
    } catch { /* ignore */ }
  }

  const approveGrantListing = (id: string) => {
    const item = grantListings.find(s => s.id === id)
    if (!item) return
    try {
      const live = JSON.parse(localStorage.getItem('approvedGrants') || '[]') as GrantListing[]
      live.push(item)
      localStorage.setItem('approvedGrants', JSON.stringify(live))
      deleteGrantListing(id)
    } catch { /* ignore */ }
  }

  const loadLiveBusinesses = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('approvedBusinesses') || '[]') as BizSubmission[]
      setLiveBusinesses(stored)
    } catch { setLiveBusinesses([]) }
  }

  const removeLiveBusiness = (id: string) => {
    try {
      const updated = liveBusinesses.filter(b => b.id !== id)
      localStorage.setItem('approvedBusinesses', JSON.stringify(updated))
      setLiveBusinesses(updated)
    } catch { /* ignore */ }
  }

  const loadLiveGrants = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('approvedGrants') || '[]') as GrantListing[]
      setLiveGrants(stored)
    } catch { setLiveGrants([]) }
  }

  const removeLiveGrant = (id: string) => {
    try {
      const updated = liveGrants.filter(g => g.id !== id)
      localStorage.setItem('approvedGrants', JSON.stringify(updated))
      setLiveGrants(updated)
    } catch { /* ignore */ }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setRoleChanging(userId)
    setOpenRoleDropdown(null)
    setRoleChangeError(null)
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const json = await res.json()
      if (json.success) {
        setAppUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
      } else {
        setRoleChangeError(json.error || 'Failed to change role')
      }
    } catch (e) {
      console.error('Failed to change role', e)
      setRoleChangeError('Failed to change role — check your connection')
    } finally {
      setRoleChanging(null)
    }
  }

  const handlePublishedToggle = async (
    resourceId: string,
    updates: { featured?: boolean; verified?: boolean; status?: string }
  ) => {
    setResourceActionLoading(resourceId)
    try {
      const response = await apiFetch(`/api/admin/resources/${resourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update resource')
      }

      setPublishedResources((prev) =>
        prev.map((resource) => (resource.id === resourceId ? data.data.resource : resource))
      )
    } catch (error: any) {
      console.error('Failed to update resource', error)
      setResourceError(error.message || 'Unable to update resource right now')
    } finally {
      setResourceActionLoading(null)
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Delete this resource permanently?')) {
      return
    }

    setResourceActionLoading(resourceId)
    try {
      const response = await apiFetch(`/api/admin/resources/${resourceId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete resource')
      }

      setPublishedResources((prev) => prev.filter((resource) => resource.id !== resourceId))
    } catch (error: any) {
      console.error('Failed to delete resource', error)
      setResourceError(error.message || 'Unable to delete resource right now')
    } finally {
      setResourceActionLoading(null)
    }
  }

  const toggleFeaturedSelection = (submissionId: string) => {
    setFeaturedSelections((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId],
    }))
  }

  useEffect(() => {
    let mounted = true

    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (!mounted) return

        if (error || !data.user) {
          router.replace('/')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError || !profile || profile.role !== 'admin') {
          router.replace('/')
          return
        }

        setIsAdminVerified(true)
      } catch (error) {
        console.error('Admin verification failed', error)
        router.replace('/')
      } finally {
        if (mounted) {
          setAdminCheckLoading(false)
        }
      }
    }

    checkAdmin()

    return () => {
      mounted = false
    }
  }, [router])

  useEffect(() => {
    if (!isAdminVerified) {
      return
    }

    fetchSubmissions()
    fetchPublishedResources()

    // Subscribe to realtime changes for submissions and resources
    const submissionsChannel = supabase
      .channel('admin-submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resource_submissions',
        },
        () => {
          console.log('Submission change detected')
          fetchSubmissions()
        }
      )
      .subscribe()

    const resourcesChannel = supabase
      .channel('admin-resources-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resources',
        },
        () => {
          console.log('Resource change detected')
          fetchPublishedResources()
        }
      )
      .subscribe()

    const usersChannel = supabase
      .channel('admin-users-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => fetchUsers(userSearch)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(submissionsChannel)
      supabase.removeChannel(resourcesChannel)
      supabase.removeChannel(usersChannel)
    }
  }, [isAdminVerified])

  // Load users when tab switches to 'users'
  useEffect(() => {
    if (isAdminVerified && activeTab === 'users') {
      fetchUsers(userSearch)
    }
  }, [activeTab, isAdminVerified])

  useEffect(() => {
    if (!isAdminVerified) return
    if (activeTab === 'grant-applications') loadGrantApplications()
    if (activeTab === 'biz-submissions') loadBizSubmissions()
    if (activeTab === 'grant-listings') loadGrantListings()
    if (activeTab === 'live-businesses') loadLiveBusinesses()
    if (activeTab === 'live-grants') loadLiveGrants()
  }, [activeTab, isAdminVerified])

  // Close role dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setOpenRoleDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleApprove = async (id: string, options?: { featured?: boolean }) => {
    setErrorMessage(null)
    setActionLoading(id)
    try {
      const response = await apiFetch(`/api/admin/resource-submissions/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featured: Boolean(options?.featured),
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Approval failed')
      }

      setSubmissions((prev) => prev.filter((submission) => submission.id !== id))
      setFeaturedSelections((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      fetchPublishedResources()
      fetchSubmissions()
    } catch (error: any) {
      console.error('Approve error', error)
      setErrorMessage(error.message || 'Could not approve submission')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Why are you rejecting this submission?')
    if (!reason) return
    setErrorMessage(null)
    setActionLoading(id)
    try {
      const response = await apiFetch(`/api/admin/resource-submissions/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Rejection failed')
      }

      setSubmissions((prev) => prev.filter((submission) => submission.id !== id))
    } catch (error: any) {
      console.error('Reject error', error)
      setErrorMessage(error.message || 'Could not reject submission')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AuthRequired featureName="Admin Dashboard">
      <div className={`min-h-screen ${backgroundClasses} pt-[6.5rem] pb-10 px-4`}>
        {adminCheckLoading ? (
          <div className="max-w-2xl mx-auto py-32 text-center space-y-3">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-transparent" />
            <p className="text-xl font-semibold">
              Verifying admin access...
            </p>
            <p className="text-sm opacity-80">
              We are checking your permissions before showing the resource queue.
            </p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className={`text-sm uppercase tracking-[0.3em] ${themeMode === 'dark' ? 'text-white/70' : 'text-[#6B5D47]/70'}`}>
                  Communify Admin
                </p>
                <h1 className="text-4xl font-bold tracking-tight">
                  {{
                    'submissions': 'Resource Approvals',
                    'biz-submissions': 'Business Submissions',
                    'grant-listings': 'Grant Listing Submissions',
                    'resources': 'Published Resources',
                    'live-businesses': 'Live Businesses',
                    'live-grants': 'Live Grants',
                    'users': 'User Roles',
                    'grant-applications': 'Grant Applications',
                  }[activeTab]}
                </h1>
              <p className={`text-base ${headerTextColor} max-w-2xl`}>
                  {{
                    'submissions': 'Review and approve community resource submissions before they go live.',
                    'biz-submissions': 'Business listings submitted for review. Approve to publish them on the site.',
                    'grant-listings': 'Grant opportunities submitted for review. Approve to list them in the Grants directory.',
                    'resources': 'All published resources in the directory. Toggle featured/verified or remove.',
                    'live-businesses': 'Businesses currently visible on the Business page. Remove to unpublish.',
                    'live-grants': 'Grants currently visible on the Grants page. Remove to unpublish.',
                    'users': 'View and change every user\'s role in real time.',
                    'grant-applications': 'Applications submitted through the Grants page "Apply Now" button.',
                  }[activeTab]}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const map: Record<AdminTab, () => void> = {
                      submissions: fetchSubmissions,
                      resources: fetchPublishedResources,
                      users: () => fetchUsers(userSearch),
                      'grant-applications': loadGrantApplications,
                      'biz-submissions': loadBizSubmissions,
                      'grant-listings': loadGrantListings,
                      'live-businesses': loadLiveBusinesses,
                      'live-grants': loadLiveGrants,
                    }
                    map[activeTab]?.()
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 transition"
                >
                  <RefreshCw size={18} />
                  Refresh
                </button>
              </div>
            </header>

            {/* ── Grouped Tab Navigation ── */}
            <div className="space-y-3">
              {/* Pending Review group */}
              <div>
                <p className={`text-[10px] uppercase tracking-[0.25em] font-bold mb-1.5 pl-1 ${themeMode === 'dark' ? 'text-white/40' : 'text-[#8B6F47]/60'}`}>
                  Pending Review
                </p>
                <div className={`flex flex-wrap gap-1 p-1 rounded-2xl ${themeMode === 'dark' ? 'bg-white/10' : 'bg-black/5'}`}>
                  {([
                    { id: 'submissions' as AdminTab, label: 'Resources', badge: submissions.length },
                    { id: 'biz-submissions' as AdminTab, label: 'Businesses', badge: bizSubmissions.length },
                    { id: 'grant-listings' as AdminTab, label: 'Grant Listings', badge: grantListings.length },
                  ]).map(({ id, label, badge }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === id ? 'bg-white text-[#2C2416] shadow' : themeMode === 'dark' ? 'text-white/70 hover:text-white' : 'text-[#6B5D47]/70 hover:text-[#2C2416]'
                      }`}>
                      {label}
                      {badge > 0 && <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">{badge}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Published group */}
              <div>
                <p className={`text-[10px] uppercase tracking-[0.25em] font-bold mb-1.5 pl-1 ${themeMode === 'dark' ? 'text-white/40' : 'text-[#8B6F47]/60'}`}>
                  Published / Live
                </p>
                <div className={`flex flex-wrap gap-1 p-1 rounded-2xl ${themeMode === 'dark' ? 'bg-white/10' : 'bg-black/5'}`}>
                  {([
                    { id: 'resources' as AdminTab, label: 'Resources' },
                    { id: 'live-businesses' as AdminTab, label: 'Businesses' },
                    { id: 'live-grants' as AdminTab, label: 'Grants' },
                  ]).map(({ id, label }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                        activeTab === id ? 'bg-white text-[#2C2416] shadow' : themeMode === 'dark' ? 'text-white/70 hover:text-white' : 'text-[#6B5D47]/70 hover:text-[#2C2416]'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Management group */}
              <div>
                <p className={`text-[10px] uppercase tracking-[0.25em] font-bold mb-1.5 pl-1 ${themeMode === 'dark' ? 'text-white/40' : 'text-[#8B6F47]/60'}`}>
                  Management
                </p>
                <div className={`flex flex-wrap gap-1 p-1 rounded-2xl ${themeMode === 'dark' ? 'bg-white/10' : 'bg-black/5'}`}>
                  {([
                    { id: 'users' as AdminTab, label: 'Users' },
                    { id: 'grant-applications' as AdminTab, label: 'Grant Applications', badge: grantApplications.length },
                  ]).map(({ id, label, badge }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === id ? 'bg-white text-[#2C2416] shadow' : themeMode === 'dark' ? 'text-white/70 hover:text-white' : 'text-[#6B5D47]/70 hover:text-[#2C2416]'
                      }`}>
                      {label}
                      {(badge ?? 0) > 0 && <span className="px-1.5 py-0.5 rounded-full bg-[#8B6F47] text-white text-[10px] font-bold leading-none">{badge}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600">
                <strong>Error:</strong> {errorMessage}
              </div>
            )}

            {/* ── Submissions tab ── */}
            {activeTab === 'submissions' && (<>
            {loading ? (
              <div className="grid gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className={`${cardClasses} animate-pulse h-40 rounded-3xl`}
                  />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <div className={`${cardClasses} rounded-3xl p-10 text-center`}>
                <Check size={48} className="mx-auto text-emerald-400" />
                <p className="text-xl font-semibold mt-4">All caught up</p>
                <p className="text-sm opacity-80">
                  There are no pending submissions right now. Sit back and relax.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {submissions.map((submission) => (
                  <article
                    key={submission.id}
                    className={`${cardClasses} rounded-[30px] p-7 space-y-6`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.4em]" style={{ color: accentColor }}>
                          Pending
                        </p>
                        <h2 className="text-2xl font-bold">{submission.name}</h2>
                        <p className="text-sm opacity-80">{submission.category}</p>
                      </div>
                  <div className="flex items-center justify-end">
                        <span className="px-3 py-1 rounded-full border border-white/30 text-xs uppercase tracking-[0.2em]">
                          Submitted {new Date(submission.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm opacity-70">Description</p>
                        <p className="text-base leading-relaxed">
                          {submission.description}
                        </p>
                      </div>
                      <div className="space-y-3 text-sm opacity-90">
                        <p>
                          <strong>Contact:</strong> {submission.phone} · {submission.email}
                        </p>
                        {submission.website && (
                          <p>
                            <strong>Website:</strong>{' '}
                            <a
                              href={submission.website}
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              {submission.website}
                            </a>
                          </p>
                        )}
                        <p>
                          <strong>Address:</strong> {submission.address}
                        </p>
                      </div>
                    </div>

                    {submission.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-sm">
                        {submission.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-full bg-white/10 border border-white/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] opacity-70">
                            Submitted By
                          </p>
                          <p className="text-sm opacity-90">
                            {submission.submitted_by?.name || 'Community Member'} ·{' '}
                            {submission.submitted_by?.email || 'No email'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            onClick={() => toggleFeaturedSelection(submission.id)}
                            className={`px-3 py-1 rounded-full border text-sm transition ${
                              featuredSelections[submission.id]
                                ? 'bg-[#8B6F47] dark:bg-[#8B6F47] text-white border-transparent'
                                : 'bg-transparent dark:bg-transparent text-[#6B5D47] dark:text-white border-[#8B6F47]/40 dark:border-white/40 hover:border-[#8B6F47] dark:hover:border-white'
                            }`}
                          >
                            {featuredSelections[submission.id]
                              ? 'Featured in Highlights'
                              : 'Feature in Highlights'}
                          </button>
                          <span className="text-xs text-[#6B5D47] dark:text-[#B8A584]">
                            Will publish to All Resources once approved.
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={actionLoading === submission.id}
                          onClick={() => handleReject(submission.id)}
                          className="px-5 py-2 rounded-full bg-red-500/90 text-white disabled:opacity-40 transition"
                        >
                          {actionLoading === submission.id ? 'Rejecting...' : 'Reject'}
                        </button>
                        <button
                          disabled={actionLoading === submission.id}
                          onClick={() =>
                            handleApprove(submission.id, {
                              featured: !!featuredSelections[submission.id],
                            })
                          }
                          className="px-5 py-2 rounded-full bg-emerald-500/90 text-white disabled:opacity-40 transition"
                        >
                          {actionLoading === submission.id ? 'Approving...' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            </>)}

            {/* ── Resources tab ── */}
            {activeTab === 'resources' && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.4em] text-[#6B5D47] dark:text-[#B8A584]"
                    style={{ letterSpacing: '0.4em' }}
                  >
                    Live Inventory
                  </p>
                  <h2 className="text-3xl font-bold tracking-tight text-[#2C2416] dark:text-white">
                    Published Resources
                  </h2>
                </div>
                <button
                  onClick={fetchPublishedResources}
                  disabled={resourcesLoading}
                  className="px-4 py-2 rounded-full border border-white/30 bg-white/10 text-sm font-semibold text-white hover:bg-white/20 transition disabled:opacity-50"
                >
                  Refresh list
                </button>
              </div>

              {resourcesLoading ? (
                <div className="grid gap-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`resource-skeleton-${index}`}
                      className={`${cardClasses} h-40 rounded-3xl animate-pulse`}
                    />
                  ))}
                </div>
              ) : resourceError ? (
                <div className={`${cardClasses} rounded-3xl p-6 text-sm text-red-500`}>
                  {resourceError}
                </div>
              ) : publishedResources.length === 0 ? (
                <div className={`${cardClasses} rounded-3xl p-6 text-center`}>
                  <p className="text-lg font-semibold text-[#2C2416] dark:text-white">No published resources yet</p>
                  <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">
                    Approve submissions to grow the directory.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedResources.map((resource) => (
                    <div key={resource.id} className={`${cardClasses} rounded-3xl p-6 space-y-3`}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-[#6B5D47] dark:text-[#B8A584]">
                            {resource.category || 'Uncategorized'}
                          </p>
                          <h3 className="text-2xl font-semibold text-[#2C2416] dark:text-white">
                            {resource.name}
                          </h3>
                        </div>
                        <span className="text-xs uppercase tracking-[0.3em] text-[#4E4E4E] dark:text-[#B8A584]">
                          {resource.status || (resource.verified ? 'approved' : 'draft')}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-[#6B5D47] dark:text-[#B8A584]">
                        {resource.description}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          disabled={resourceActionLoading === resource.id}
                          onClick={() =>
                            handlePublishedToggle(resource.id, { featured: !resource.featured })
                          }
                          className={`px-4 py-2 rounded-full border transition text-sm font-semibold ${
                            resource.featured
                              ? 'bg-[#8B6F47] dark:bg-[#8B6F47] border-transparent text-white'
                              : 'bg-transparent dark:bg-transparent border-[#8B6F47]/30 dark:border-white/30 text-[#6B5D47] dark:text-white hover:border-[#8B6F47] dark:hover:border-white'
                          } ${resourceActionLoading === resource.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {resource.featured ? 'Featured in Highlights' : 'Mark as Featured'}
                        </button>
                        <button
                          disabled={resourceActionLoading === resource.id}
                          onClick={() =>
                            handlePublishedToggle(resource.id, { verified: !resource.verified })
                          }
                          className={`px-4 py-2 rounded-full border transition text-sm font-semibold ${
                            resource.verified
                              ? 'bg-emerald-500/90 border-transparent text-white'
                              : 'bg-transparent border-white/30 text-white hover:border-white'
                          } ${resourceActionLoading === resource.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {resource.verified ? 'Verified' : 'Set Verified'}
                        </button>
                        <button
                          disabled={resourceActionLoading === resource.id}
                          onClick={() => handleDeleteResource(resource.id)}
                          className={`px-4 py-2 rounded-full border transition text-sm font-semibold text-red-500 ${
                            resourceActionLoading === resource.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          Delete Resource
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            )}

            {/* ── Users tab ── */}
            {activeTab === 'users' && (
              <div className="space-y-5">
                {roleChangeError && (
                  <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 text-sm flex items-center justify-between gap-3">
                    <span><strong>Role change failed:</strong> {roleChangeError}</span>
                    <button onClick={() => setRoleChangeError(null)} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
                  </div>
                )}
                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value)
                      fetchUsers(e.target.value)
                    }}
                    placeholder="Search by name or email…"
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/40 ${
                      themeMode === 'dark'
                        ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
                        : 'bg-white border-[#E8E0D6] text-[#2C2416] placeholder:text-[#9A8A7A]'
                    }`}
                  />
                </div>

                {usersLoading ? (
                  <div className="grid gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`${cardClasses} animate-pulse h-16 rounded-2xl`} />
                    ))}
                  </div>
                ) : appUsers.length === 0 ? (
                  <div className={`${cardClasses} rounded-3xl p-10 text-center`}>
                    <Users size={40} className="mx-auto opacity-40 mb-3" />
                    <p className="text-lg font-semibold">No users found</p>
                  </div>
                ) : (
                  <div ref={roleDropdownRef} className="space-y-3">
                    {appUsers.map((u) => (
                      <div
                        key={u.id}
                        className={`${cardClasses} rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#8B6F47]/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#8B6F47]">
                              {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{u.name || '(no name)'}</p>
                            <p className="text-xs opacity-60 truncate">{u.email}</p>
                          </div>
                        </div>

                        {/* Role picker */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenRoleDropdown(openRoleDropdown === u.id ? null : u.id)}
                            disabled={roleChanging === u.id}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition ${
                              u.role === 'admin'
                                ? 'border-purple-400/50 text-purple-400 bg-purple-400/10'
                                : u.role === 'organizer'
                                ? 'border-emerald-400/50 text-emerald-400 bg-emerald-400/10'
                                : themeMode === 'dark'
                                ? 'border-white/20 text-white/70 bg-white/5'
                                : 'border-[#8B6F47]/30 text-[#6B5D47] bg-[#8B6F47]/5'
                            } ${roleChanging === u.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}
                          >
                            {roleChanging === u.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : null}
                            <span className="capitalize">{u.role}</span>
                            <ChevronDown size={14} />
                          </button>
                          {openRoleDropdown === u.id && (
                            <div className={`absolute right-0 mt-1 z-50 rounded-2xl shadow-xl border overflow-hidden min-w-[140px] ${
                              themeMode === 'dark' ? 'bg-[#1F1B26] border-white/10' : 'bg-white border-[#E8E0D6]'
                            }`}>
                              {ROLES.map((r) => (
                                <button
                                  key={r}
                                  onClick={() => handleRoleChange(u.id, r)}
                                  className={`w-full text-left px-4 py-2.5 text-sm capitalize transition ${
                                    u.role === r
                                      ? themeMode === 'dark' ? 'bg-white/10 font-semibold' : 'bg-[#F5F0E8] font-semibold'
                                      : themeMode === 'dark' ? 'hover:bg-white/5' : 'hover:bg-[#FAF9F6]'
                                  }`}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Grant Applications tab ── */}
            {activeTab === 'grant-applications' && (
              <div className="space-y-5">
                {grantApplications.length === 0 ? (
                  <div className={`${cardClasses} rounded-3xl p-10 text-center`}>
                    <FileText size={48} className="mx-auto opacity-30 mb-3" />
                    <p className="text-lg font-semibold">No grant applications yet</p>
                    <p className="text-sm opacity-70 mt-1">Applications submitted via the Grants page will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {grantApplications.map((app) => (
                      <div key={app.id} className={`${cardClasses} rounded-[28px] p-6 space-y-4`}>
                        {approvedIds.has(app.id) && (
                          <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
                            <Check size={16} /> Application Accepted
                          </div>
                        )}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] opacity-60">Grant Application</p>
                            <h3 className="text-xl font-bold">{app.grantTitle}</h3>
                            <p className="text-sm opacity-70">{app.grantOrganization}</p>
                          </div>
                          <span className="text-xs opacity-60 whitespace-nowrap">
                            {new Date(app.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1.5">
                            <p><span className="opacity-60">Applicant:</span> <strong>{app.applicantName}</strong></p>
                            <p><span className="opacity-60">Email:</span> {app.applicantEmail}</p>
                            {app.applicantPhone && <p><span className="opacity-60">Phone:</span> {app.applicantPhone}</p>}
                            {app.organization && <p><span className="opacity-60">Organization:</span> {app.organization}</p>}
                          </div>
                          <div>
                            <p className="opacity-60 text-xs uppercase tracking-wider mb-0.5">Why applying</p>
                            <p className="leading-relaxed">{app.reason}</p>
                          </div>
                        </div>

                        <div>
                          <p className="opacity-60 text-xs uppercase tracking-wider mb-0.5">Project / Use Description</p>
                          <p className="text-sm leading-relaxed">{app.projectDescription}</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => approveGrantApplication(app.id)}
                            disabled={approvedIds.has(app.id)}
                            className="px-5 py-2 rounded-full bg-emerald-500/90 text-white text-sm font-semibold disabled:opacity-40 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => deleteGrantApplication(app.id)}
                            className="px-5 py-2 rounded-full border border-red-400/50 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Business Submissions tab ── */}
            {activeTab === 'biz-submissions' && (
              <div className="space-y-5">
                {bizSubmissions.length === 0 ? (
                  <div className={`${cardClasses} rounded-3xl p-10 text-center`}>
                    <FileText size={48} className="mx-auto opacity-30 mb-3" />
                    <p className="text-lg font-semibold">No business submissions yet</p>
                    <p className="text-sm opacity-70 mt-1">Submissions from the Submit → Business form will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bizSubmissions.map((biz) => (
                      <div key={biz.id} className={`${cardClasses} rounded-[28px] p-6 space-y-4`}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] opacity-60">Business Submission</p>
                            <h3 className="text-xl font-bold">{biz.businessName}</h3>
                            <p className="text-sm opacity-70">{biz.category}</p>
                          </div>
                          <span className="text-xs opacity-60 whitespace-nowrap">
                            {new Date(biz.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed opacity-80">{biz.description}</p>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            {biz.address && <p><span className="opacity-60">Address:</span> {biz.address}</p>}
                            {biz.phone && <p><span className="opacity-60">Phone:</span> {biz.phone}</p>}
                            {biz.email && <p><span className="opacity-60">Email:</span> {biz.email}</p>}
                          </div>
                          <div className="space-y-1">
                            <p><span className="opacity-60">Website:</span>{' '}
                              <a href={biz.website} target="_blank" rel="noreferrer" className="underline text-blue-400">{biz.website}</a>
                            </p>
                            {biz.hours && <p><span className="opacity-60">Hours:</span> {biz.hours}</p>}
                            {biz.contactName && <p><span className="opacity-60">Contact:</span> {biz.contactName}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => approveBizSubmission(biz.id)}
                            className="px-5 py-2 rounded-full bg-emerald-500/90 text-white text-sm font-semibold transition"
                          >
                            Approve &amp; Publish
                          </button>
                          <button
                            onClick={() => deleteBizSubmission(biz.id)}
                            className="px-5 py-2 rounded-full border border-red-400/50 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Grant Listing Submissions tab ── */}
            {activeTab === 'grant-listings' && (
              <div className="space-y-5">
                {grantListings.length === 0 ? (
                  <div className={`${cardClasses} rounded-3xl p-10 text-center`}>
                    <FileText size={48} className="mx-auto opacity-30 mb-3" />
                    <p className="text-lg font-semibold">No grant listings submitted yet</p>
                    <p className="text-sm opacity-70 mt-1">Submissions from the Submit → Grant form will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {grantListings.map((gl) => (
                      <div key={gl.id} className={`${cardClasses} rounded-[28px] p-6 space-y-4`}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] opacity-60">Grant Listing</p>
                            <h3 className="text-xl font-bold">{gl.title}</h3>
                            <p className="text-sm opacity-70">{gl.organization} · {gl.category}</p>
                          </div>
                          <span className="text-xs opacity-60 whitespace-nowrap">
                            {new Date(gl.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed opacity-80">{gl.description}</p>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <p><span className="opacity-60">Amount:</span> {gl.amount}</p>
                            <p><span className="opacity-60">Eligibility:</span> {gl.eligibility}</p>
                          </div>
                          <div className="space-y-1">
                            <p><span className="opacity-60">Requirements:</span> {gl.requirements}</p>
                            {gl.contactEmail && <p><span className="opacity-60">Contact:</span> {gl.contactName} · {gl.contactEmail}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => approveGrantListing(gl.id)}
                            className="px-5 py-2 rounded-full bg-emerald-500/90 text-white text-sm font-semibold transition"
                          >
                            Approve &amp; Publish
                          </button>
                          <button
                            onClick={() => deleteGrantListing(gl.id)}
                            className="px-5 py-2 rounded-full border border-red-400/50 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* ── Live Businesses tab ── */}
            {activeTab === 'live-businesses' && (
              <div className="space-y-5">
                {/* Default (built-in) businesses */}
                <div>
                  <p className={`text-[10px] uppercase tracking-[0.25em] font-bold mb-2 pl-1 ${themeMode === 'dark' ? 'text-white/40' : 'text-[#8B6F47]/60'}`}>
                    Default Listings
                  </p>
                  <div className="space-y-4">
                    {mockBusinesses.map((biz) => (
                      <div key={biz.id} className={`${cardClasses} rounded-[28px] p-6 space-y-3`}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] opacity-60">Built-in Listing</p>
                            <h3 className="text-xl font-bold">{biz.name}</h3>
                            <p className="text-sm opacity-70">{biz.category}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">Default</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            {biz.address && <p><span className="opacity-60">Address:</span> {biz.address}</p>}
                            {biz.phone && <p><span className="opacity-60">Phone:</span> {biz.phone}</p>}
                          </div>
                          <div className="space-y-1">
                            {biz.website && (
                              <p><span className="opacity-60">Website:</span>{' '}
                                <a href={biz.website} target="_blank" rel="noreferrer" className="underline text-blue-400 break-all">{biz.website}</a>
                              </p>
                            )}
                            {biz.hours && <p><span className="opacity-60">Hours:</span> {biz.hours}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Community-approved businesses */}
                <div>
                  <p className={`text-[10px] uppercase tracking-[0.25em] font-bold mb-2 pl-1 ${themeMode === 'dark' ? 'text-white/40' : 'text-[#8B6F47]/60'}`}>
                    Community Submissions ({liveBusinesses.length})
                  </p>
                  {liveBusinesses.length === 0 ? (
                    <div className={`${cardClasses} rounded-3xl p-8 text-center`}>
                      <p className="text-sm opacity-60">No community businesses approved yet. Approve a submission to publish it here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {liveBusinesses.map((biz) => (
                        <div key={biz.id} className={`${cardClasses} rounded-[28px] p-6 space-y-3`}>
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em] opacity-60">Live on Site</p>
                              <h3 className="text-xl font-bold">{biz.businessName}</h3>
                              <p className="text-sm opacity-70">{biz.category}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-semibold">Published</span>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              {biz.address && <p><span className="opacity-60">Address:</span> {biz.address}</p>}
                              {biz.phone && <p><span className="opacity-60">Phone:</span> {biz.phone}</p>}
                            </div>
                            <div className="space-y-1">
                              <p><span className="opacity-60">Website:</span>{' '}
                                <a href={biz.website} target="_blank" rel="noreferrer" className="underline text-blue-400 break-all">{biz.website}</a>
                              </p>
                              {biz.hours && <p><span className="opacity-60">Hours:</span> {biz.hours}</p>}
                            </div>
                          </div>
                          <button
                            onClick={() => removeLiveBusiness(biz.id)}
                            className="px-5 py-2 rounded-full border border-red-400/50 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition"
                          >
                            Remove from Site
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Live Grants tab ── */}
            {activeTab === 'live-grants' && (
              <div className="space-y-5">
                {/* Default (built-in) grants */}
                <div>
                  <p className={`text-[10px] uppercase tracking-[0.25em] font-bold mb-2 pl-1 ${themeMode === 'dark' ? 'text-white/40' : 'text-[#8B6F47]/60'}`}>
                    Default Listings
                  </p>
                  <div className="space-y-4">
                    {mockGrants.map((gl) => (
                      <div key={gl.id} className={`${cardClasses} rounded-[28px] p-6 space-y-3`}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] opacity-60">Built-in Listing</p>
                            <h3 className="text-xl font-bold">{gl.title}</h3>
                            <p className="text-sm opacity-70">{gl.organization} · {gl.category}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">Default</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <p><span className="opacity-60">Amount:</span> {gl.amount}</p>
                          <p><span className="opacity-60">Eligibility:</span> {gl.eligibility.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Community-approved grants */}
                <div>
                  <p className={`text-[10px] uppercase tracking-[0.25em] font-bold mb-2 pl-1 ${themeMode === 'dark' ? 'text-white/40' : 'text-[#8B6F47]/60'}`}>
                    Community Submissions ({liveGrants.length})
                  </p>
                  {liveGrants.length === 0 ? (
                    <div className={`${cardClasses} rounded-3xl p-8 text-center`}>
                      <p className="text-sm opacity-60">No community grants approved yet. Approve a submission to publish it here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {liveGrants.map((gl) => (
                        <div key={gl.id} className={`${cardClasses} rounded-[28px] p-6 space-y-3`}>
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em] opacity-60">Live on Site</p>
                              <h3 className="text-xl font-bold">{gl.title}</h3>
                              <p className="text-sm opacity-70">{gl.organization} · {gl.category}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-semibold">Published</span>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <p><span className="opacity-60">Amount:</span> {gl.amount}</p>
                            <p><span className="opacity-60">Eligibility:</span> {gl.eligibility}</p>
                          </div>
                          <button
                            onClick={() => removeLiveGrant(gl.id)}
                            className="px-5 py-2 rounded-full border border-red-400/50 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition"
                          >
                            Remove from Site
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthRequired>
  )
}

