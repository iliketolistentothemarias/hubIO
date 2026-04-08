'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Check, X, Loader2, ChevronLeft, Globe, Lock, Plus,
  Save, Settings, Users, MessageSquare, Send, MoreVertical,
  UserMinus, VolumeX, Volume2, ShieldOff, Trash2, AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api/client-fetch'

type ManageTab = 'settings' | 'join-requests' | 'members' | 'chat'

interface OrgResource {
  id: string
  name: string
  category: string
  description: string
  created_at: string
  visibility: 'public' | 'private'
  application_question: string | null
  submitted_by: string
  address?: string
  phone?: string
  email?: string
  website?: string | null
  hours?: string | null
  tags?: string[] | null
  services?: string[] | null
  languages?: string[] | null
  accessibility?: string[] | null
  location?: Record<string, unknown> | null
}

type DetailsFormState = {
  name: string
  category: string
  description: string
  address: string
  phone: string
  email: string
  website: string
  hours: string
  tags: string
  services: string
  languages: string
  accessibility: string
  locationJson: string
}

interface Application {
  id: string
  user_id: string
  status: string
  message: string | null
  application_data: {
    name: string
    email: string
    phone?: string
    skills_answer: string
  } | null
  created_at: string
  users: { id: string; name: string; email: string; avatar: string | null } | null
}

interface Member {
  user_id: string
  name: string
  email: string
  avatar: string | null
  role: string
  muted_from_chat: boolean
  joined_at: string
  signup_id: string | null
  is_owner: boolean
}

interface Announcement {
  id: string
  resource_id?: string
  content: string
  created_at: string
  user_id: string
  users: { id: string; name: string; avatar: string | null } | null
}

export default function OrganizerPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // Resource list
  const [resources, setResources] = useState<OrgResource[]>([])
  const [resourcesLoading, setResourcesLoading] = useState(false)

  // Selected resource management
  const [selectedResource, setSelectedResource] = useState<OrgResource | null>(null)
  const [manageTab, setManageTab] = useState<ManageTab>('settings')

  // Settings
  const [settingsForm, setSettingsForm] = useState<{ visibility: 'public' | 'private'; application_question: string }>({
    visibility: 'public',
    application_question: '',
  })
  const [detailsForm, setDetailsForm] = useState<DetailsFormState>({
    name: '',
    category: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    hours: '',
    tags: '',
    services: '',
    languages: '',
    accessibility: '',
    locationJson: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Applications (members tab)
  const [applications, setApplications] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Members tab
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  // Chat
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatChannelRef = useRef<any>(null)

  // Resolve user for organizer tools (guests can still view the page)
  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        setUserId(null)
        setUserRole(null)
        setChecking(false)
        return
      }
      const { data: profile } = await supabase.from('users').select('role').eq('id', session.user.id).single()
      setUserId(session.user.id)
      setUserRole(profile?.role ?? null)
      setChecking(false)
    }
    check()
  }, [])

  const loadResources = useCallback(async () => {
    if (!userId) return
    setResourcesLoading(true)
    try {
      const { data } = await supabase
        .from('resources')
        .select('id, name, category, description, created_at, visibility, application_question, submitted_by')
        .eq('submitted_by', userId)
        .order('created_at', { ascending: false })
      setResources((data || []) as OrgResource[])
    } catch (e) { console.error(e) }
    finally { setResourcesLoading(false) }
  }, [userId])

  useEffect(() => {
    if (!userId || checking) return
    loadResources()
  }, [userId, checking, loadResources])

  // When an admin deletes a resource from the dashboard, keep this list in sync (no full page refresh needed).
  // DELETE uses an unfiltered listener + client check — Realtime filters are unreliable for DELETE on some setups.
  useEffect(() => {
    if (!userId || checking) return

    const channel = supabase
      .channel(`organizer-resources-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'resources' },
        (payload) => {
          const old = payload.old as { id?: string; submitted_by?: string }
          const id = old?.id
          if (!id) return
          // If Realtime includes submitted_by, ignore other users' rows
          if (old.submitted_by !== undefined && old.submitted_by !== userId) return

          setResources((prev) => {
            if (!prev.some((r) => r.id === id)) return prev
            return prev.filter((r) => r.id !== id)
          })
          setSelectedResource((prev) => (prev?.id === id ? null : prev))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'resources',
          filter: `submitted_by=eq.${userId}`,
        },
        () => loadResources()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'resources',
          filter: `submitted_by=eq.${userId}`,
        },
        () => loadResources()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, checking, loadResources])

  // Fallback if realtime is delayed: refetch when the user returns to this tab
  useEffect(() => {
    if (!userId || checking) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadResources()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [userId, checking, loadResources])

  const openResource = async (res: OrgResource) => {
    setSelectedResource(res)
    setSaveMsg('')
    setManageTab('settings')
    setApplications([])
    setAnnouncements([])

    const { data: full } = await supabase.from('resources').select('*').eq('id', res.id).maybeSingle()
    const row = { ...res, ...(full || {}) } as OrgResource
    setSelectedResource(row)

    setSettingsForm({
      visibility: row.visibility || 'public',
      application_question: row.application_question || '',
    })

    const joinList = (v: string[] | null | undefined) =>
      Array.isArray(v) ? v.join(', ') : ''

    setDetailsForm({
      name: row.name || '',
      category: row.category || '',
      description: row.description || '',
      address: row.address || '',
      phone: row.phone || '',
      email: row.email || '',
      website: row.website || '',
      hours: row.hours || '',
      tags: joinList(row.tags),
      services: joinList(row.services),
      languages: joinList(row.languages),
      accessibility: joinList(row.accessibility),
      locationJson: row.location ? JSON.stringify(row.location, null, 2) : '',
    })
  }

  const handleBack = () => {
    setSelectedResource(null)
    // Cleanup realtime channel
    if (chatChannelRef.current) {
      supabase.removeChannel(chatChannelRef.current)
      chatChannelRef.current = null
    }
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  const handleSaveResource = async () => {
    if (!selectedResource) return
    setSaving(true)
    setSaveMsg('')
    try {
      const rawLoc = detailsForm.locationJson.trim()
      const body: Record<string, unknown> = {
        name: detailsForm.name.trim(),
        category: detailsForm.category.trim(),
        description: detailsForm.description.trim(),
        address: detailsForm.address.trim(),
        phone: detailsForm.phone.trim(),
        email: detailsForm.email.trim(),
        website: detailsForm.website.trim() || null,
        hours: detailsForm.hours.trim() || null,
        tags: detailsForm.tags,
        services: detailsForm.services,
        languages: detailsForm.languages,
        accessibility: detailsForm.accessibility,
        visibility: settingsForm.visibility,
        application_question:
          settingsForm.visibility === 'private' ? settingsForm.application_question.trim() || null : null,
      }

      if (rawLoc) {
        try {
          body.location = JSON.parse(rawLoc) as Record<string, unknown>
        } catch {
          setSaveMsg('Location must be valid JSON (or clear the field).')
          setSaving(false)
          return
        }
      }

      const res = await apiFetch(`/api/resources/${selectedResource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      const updated = json.data as OrgResource
      setSelectedResource((prev) => (prev ? { ...prev, ...updated } : prev))
      setResources((prev) =>
        prev.map((r) => (r.id === selectedResource.id ? { ...r, ...updated } : r))
      )
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2500)
    } catch (e) {
      setSaveMsg('Failed to save: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteResource = async () => {
    if (!selectedResource) return
    const ok = window.confirm(
      `Delete "${selectedResource.name}" permanently? This cannot be undone.`
    )
    if (!ok) return
    setDeleting(true)
    setSaveMsg('')
    try {
      const res = await apiFetch(`/api/resources/${selectedResource.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Delete failed')
      setResources((prev) => prev.filter((r) => r.id !== selectedResource.id))
      handleBack()
    } catch (e) {
      setSaveMsg('Delete failed: ' + (e as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Applications/Members ───────────────────────────────────────────────────

  const signupsChannelRef = useRef<any>(null)

  useEffect(() => {
    if (!selectedResource) return

    if (manageTab === 'join-requests') loadApplications()
    else if (manageTab === 'members') loadMembers()

    // Real-time subscription for resource_signups changes
    if (signupsChannelRef.current) supabase.removeChannel(signupsChannelRef.current)
    signupsChannelRef.current = supabase
      .channel(`org-signups-${selectedResource.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'resource_signups',
        filter: `resource_id=eq.${selectedResource.id}`,
      }, () => {
        // Re-fetch whichever tab is active
        if (manageTab === 'join-requests') loadApplications()
        else if (manageTab === 'members') loadMembers()
      })
      .subscribe()

    return () => {
      if (signupsChannelRef.current) {
        supabase.removeChannel(signupsChannelRef.current)
        signupsChannelRef.current = null
      }
    }
  }, [manageTab, selectedResource?.id])

  const loadApplications = async () => {
    if (!selectedResource) return
    setAppsLoading(true)
    try {
      const res = await apiFetch(`/api/resources/${selectedResource.id}/applications?status=pending`)
      const json = await res.json()
      if (json.success) setApplications(json.data || [])
    } catch (e) { console.error(e) }
    finally { setAppsLoading(false) }
  }

  const loadMembers = async () => {
    if (!selectedResource) return
    setMembersLoading(true)
    try {
      const res = await apiFetch(`/api/resources/${selectedResource.id}/members`)
      const json = await res.json()
      if (json.success) setMembers(json.data || [])
    } catch (e) { console.error(e) }
    finally { setMembersLoading(false) }
  }

  const handleApplicationAction = async (applicantUserId: string, action: 'approve' | 'reject') => {
    if (!selectedResource) return
    setActionLoading(`${applicantUserId}-${action}`)
    try {
      const res = await apiFetch(`/api/resources/${selectedResource.id}/applications/${applicantUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.success) {
        setApplications((prev) => prev.filter((a) => a.user_id !== applicantUserId))
      }
    } catch (e) { console.error(e) }
    finally { setActionLoading(null) }
  }

  const handleMemberAction = async (memberUserId: string, action: 'mute' | 'unmute' | 'remove') => {
    if (!selectedResource) return
    setActionLoading(`${memberUserId}-${action}`)
    try {
      const res = await apiFetch(`/api/resources/${selectedResource.id}/applications/${memberUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.success) {
        if (action === 'remove') {
          setMembers((prev) => prev.filter((m) => m.user_id !== memberUserId))
        } else {
          setMembers((prev) => prev.map((m) =>
            m.user_id === memberUserId ? { ...m, muted_from_chat: action === 'mute' } : m
          ))
        }
      }
    } catch (e) { console.error(e) }
    finally { setActionLoading(null) }
  }

  // ─── Chat / Announcements ───────────────────────────────────────────────────

  useEffect(() => {
    if (manageTab !== 'chat' || !selectedResource) return

    const loadChat = async () => {
      setChatLoading(true)
      try {
        const res = await apiFetch(`/api/resources/${selectedResource.id}/announcements?limit=80`)
        const json = await res.json()
        if (json.success) setAnnouncements(json.data || [])
      } catch (e) { console.error(e) }
      finally { setChatLoading(false) }
    }
    loadChat()

    // Subscribe to real-time messages
    if (chatChannelRef.current) {
      supabase.removeChannel(chatChannelRef.current)
    }
    chatChannelRef.current = supabase
      .channel(`resource-chat-${selectedResource.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'resource_announcements',
        filter: `resource_id=eq.${selectedResource.id}`,
      }, async (payload) => {
        // Fetch the user profile for the new message
        const { data: profile } = await supabase
          .from('users')
          .select('id, name, avatar')
          .eq('id', payload.new.user_id)
          .single()
        const msg: Announcement = {
          ...(payload.new as Announcement),
          users: profile || null,
        }
        setAnnouncements((prev) => {
          // Don't add if already exists (optimistic update already placed it)
          if (prev.some((m) => m.id === msg.id)) return prev
          // Remove any optimistic placeholder with same content/user
          const withoutOptimistic = prev.filter(
            (m) => !(m.id.startsWith('opt-') && m.content === msg.content && m.user_id === msg.user_id)
          )
          return [...withoutOptimistic, msg]
        })
      })
      .subscribe()

    return () => {
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current)
        chatChannelRef.current = null
      }
    }
  }, [manageTab, selectedResource?.id])

  // Scroll to bottom when new messages arrive (scroll the chat container, not the page)
  useEffect(() => {
    const container = chatContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [announcements])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedResource || chatSending) return
    const content = chatInput.trim()
    setChatInput('')
    setChatSending(true)
    setChatError(null)

    // Optimistic update — show immediately
    const optimisticId = `opt-${Date.now()}`
    const optimistic: Announcement = {
      id: optimisticId,
      resource_id: selectedResource.id,
      user_id: userId || '',
      content,
      created_at: new Date().toISOString(),
      users: null,
    }
    setAnnouncements((prev) => [...prev, optimistic])

    try {
      const res = await apiFetch(`/api/resources/${selectedResource.id}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        // Replace optimistic with real message
        setAnnouncements((prev) => prev.map((m) => m.id === optimisticId ? json.data : m))
      } else {
        // Roll back on failure
        setAnnouncements((prev) => prev.filter((m) => m.id !== optimisticId))
        setChatInput(content)
        setChatError(json.error || 'Failed to send message')
      }
    } catch (e) {
      setAnnouncements((prev) => prev.filter((m) => m.id !== optimisticId))
      setChatInput(content)
      setChatError('Failed to send — check your connection')
    } finally {
      setChatSending(false)
    }
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0A0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B6F47]" />
      </div>
    )
  }

  const manageTabs: { id: ManageTab; label: string; icon: React.ElementType }[] = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'join-requests', label: 'Join Requests', icon: Users },
    { id: 'members', label: 'Members', icon: ShieldOff },
    { id: 'chat', label: 'Chat & Announcements', icon: MessageSquare },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0A0F] pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">Organizer Panel</h1>
            <p className="text-[#6B5D47] dark:text-[#B8A584] mt-1 text-sm md:text-base">Manage your community resources</p>
          </div>
          <Link
            href="/submit"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] font-semibold text-sm hover:bg-[#6B5D47] dark:hover:bg-[#B8A584] transition-colors touch-manipulation w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> New Resource
          </Link>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Resource List ── */}
          {!selectedResource && (
            <motion.div key="resource-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {resourcesLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#8B6F47]" /></div>
              ) : resources.length === 0 ? (
                <div className="text-center py-16 text-[#6B5D47] dark:text-[#B8A584]">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold mb-2">No resources yet</p>
                  <p className="text-sm opacity-70 mb-4">Submit a resource — once approved it appears here to manage.</p>
                  <Link href="/submit" className="text-sm text-[#8B6F47] underline">Submit a resource</Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((res) => (
                    <motion.button
                      key={res.id}
                      onClick={() => void openResource(res)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-left bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          res.visibility === 'private'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}>
                          {res.visibility === 'private' ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                          {res.visibility === 'private' ? 'Private' : 'Public'}
                        </span>
                        <span className="p-1.5 rounded-lg bg-[#F5F3F0] dark:bg-[#2A2824] opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-3.5 h-3.5 text-[#8B6F47] dark:text-[#D4A574]" />
                        </span>
                      </div>
                      <h3 className="font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words text-left">{res.name}</h3>
                      <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] mb-2 break-words text-left">{res.description}</p>
                      <p className="text-xs text-[#6B5D47] dark:text-[#B8A584]">{res.category}</p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Resource Management Panel ── */}
          {selectedResource && (
            <motion.div key="resource-manage" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Back */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-sm text-[#6B5D47] dark:text-[#B8A584] hover:text-[#2C2416] dark:hover:text-[#F5F3F0] transition-colors font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to resources
                </button>
                <Link
                  href={`/resources/${selectedResource.id}`}
                  className="text-sm text-[#8B6F47] dark:text-[#D4A574] hover:underline"
                >
                  View public page →
                </Link>
              </div>

              <h2 className="text-xl font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words [overflow-wrap:anywhere]">{selectedResource.name}</h2>
              <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] mb-5 break-words">{selectedResource.category}</p>

              {/* Sub-tabs */}
              <div className="flex gap-0.5 border-b border-[#E8E0D6] dark:border-[#3A3830] mb-6 overflow-x-auto scrollbar-none -mx-1 px-1">
                {manageTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setManageTab(id)}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-3 text-xs md:text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap flex-shrink-0 touch-manipulation ${
                      manageTab === id
                        ? 'border-[#8B6F47] text-[#8B6F47] dark:text-[#D4A574] dark:border-[#D4A574]'
                        : 'border-transparent text-[#6B5D47] dark:text-[#B8A584] hover:text-[#2C2416] dark:hover:text-[#F5F3F0]'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* Settings Tab */}
                {manageTab === 'settings' && (
                  <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                    <div className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] p-6 space-y-4">
                      <h3 className="text-base font-bold text-[#2C2416] dark:text-[#F5F3F0] break-words">Resource information</h3>
                      <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] break-words">
                        Update how your resource appears in the directory (address, contact, services, map data as JSON).
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Name</label>
                          <input
                            value={detailsForm.name}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Category</label>
                          <input
                            value={detailsForm.category}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, category: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Phone</label>
                          <input
                            value={detailsForm.phone}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, phone: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Description</label>
                          <textarea
                            rows={4}
                            value={detailsForm.description}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, description: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 resize-y min-h-[100px]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Street address</label>
                          <input
                            value={detailsForm.address}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, address: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Email</label>
                          <input
                            type="email"
                            value={detailsForm.email}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, email: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Website</label>
                          <input
                            value={detailsForm.website}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, website: e.target.value }))}
                            placeholder="https://"
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Hours</label>
                          <input
                            value={detailsForm.hours}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, hours: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Tags (comma-separated)</label>
                          <input
                            value={detailsForm.tags}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, tags: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Services (comma-separated)</label>
                          <input
                            value={detailsForm.services}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, services: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Languages (comma-separated)</label>
                          <input
                            value={detailsForm.languages}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, languages: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">Accessibility (comma-separated)</label>
                          <input
                            value={detailsForm.accessibility}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, accessibility: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">
                            Location (JSON for maps — optional)
                          </label>
                          <textarea
                            rows={3}
                            value={detailsForm.locationJson}
                            onChange={(e) => setDetailsForm((f) => ({ ...f, locationJson: e.target.value }))}
                            placeholder='{"lat":40.44,"lng":-79.99}'
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 resize-y"
                          />
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-[#2C2416] dark:text-[#F5F3F0] pt-2 break-words">Visibility &amp; access</h3>
                      <div>
                        <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-2 break-words">
                          Who can join this resource?
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          {(['public', 'private'] as const).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setSettingsForm((f) => ({ ...f, visibility: v }))}
                              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all touch-manipulation text-left break-words ${
                                settingsForm.visibility === v
                                  ? 'border-[#8B6F47] bg-[#8B6F47]/10 text-[#8B6F47] dark:border-[#D4A574] dark:bg-[#D4A574]/10 dark:text-[#D4A574]'
                                  : 'border-[#E8E0D6] dark:border-[#3A3830] text-[#6B5D47] dark:text-[#B8A584] hover:border-[#8B6F47]/50'
                              }`}
                            >
                              {v === 'public' ? <Globe className="w-4 h-4 shrink-0" /> : <Lock className="w-4 h-4 shrink-0" />}
                              <span className="break-words">{v === 'public' ? 'Public — anyone can join' : 'Private — I approve members'}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {settingsForm.visibility === 'private' && (
                        <div>
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1 break-words">
                            Application question <span className="text-[#8B6F47] text-xs">(shown to applicants)</span>
                          </label>
                          <input
                            value={settingsForm.application_question}
                            onChange={(e) => setSettingsForm((f) => ({ ...f, application_question: e.target.value }))}
                            placeholder="e.g. What relevant skills or experience do you have?"
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSaveResource}
                          disabled={saving}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] font-semibold text-sm disabled:opacity-50 transition-all"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save changes
                        </motion.button>
                        {saveMsg && (
                          <span
                            className={`text-sm font-semibold break-words max-w-full ${
                              saveMsg.startsWith('Saved!')
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {saveMsg}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/50 p-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-red-900 dark:text-red-200 break-words">Delete resource</h3>
                          <p className="text-sm text-red-800/90 dark:text-red-300/90 mt-1 break-words">
                            Permanently remove this listing, all members, and chat history tied to it.
                          </p>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleDeleteResource}
                            disabled={deleting}
                            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                          >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Delete this resource
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Join Requests Tab */}
                {manageTab === 'join-requests' && (
                  <motion.div key="join-requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {appsLoading ? (
                      <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#8B6F47]" /></div>
                    ) : applications.length === 0 ? (
                      <div className="text-center py-16 text-[#6B5D47] dark:text-[#B8A584]">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold">No pending join requests</p>
                        <p className="text-sm mt-1 opacity-70">
                          {selectedResource.visibility === 'public'
                            ? 'This resource is public — members join automatically.'
                            : 'Requests from applicants will appear here.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {applications.map((app) => (
                          <motion.div
                            key={app.user_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] p-5"
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <p className="font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                                  {app.application_data?.name || app.users?.name || 'Unknown'}
                                </p>
                                <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">
                                  {app.application_data?.email || app.users?.email || ''}
                                  {app.application_data?.phone ? ` · ${app.application_data.phone}` : ''}
                                </p>
                              </div>
                              <span className="text-xs text-[#6B5D47] dark:text-[#B8A584] flex-shrink-0">
                                {new Date(app.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {app.application_data?.skills_answer && (
                              <div className="mb-4 p-3 rounded-xl bg-[#F5F3F0] dark:bg-[#2A2824] text-sm text-[#2C2416] dark:text-[#F5F3F0]">
                                <p className="text-xs font-semibold text-[#8B6F47] dark:text-[#D4A574] mb-1">Skills / Experience</p>
                                <p>{app.application_data.skills_answer}</p>
                              </div>
                            )}

                            <div className="flex gap-3">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleApplicationAction(app.user_id, 'approve')}
                                disabled={actionLoading !== null}
                                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50 touch-manipulation"
                              >
                                {actionLoading === `${app.user_id}-approve`
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Check className="w-4 h-4" />}
                                Approve
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleApplicationAction(app.user_id, 'reject')}
                                disabled={actionLoading !== null}
                                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold disabled:opacity-50 touch-manipulation"
                              >
                                {actionLoading === `${app.user_id}-reject`
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <X className="w-4 h-4" />}
                                Reject
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Members Tab */}
                {manageTab === 'members' && (
                  <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {membersLoading ? (
                      <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#8B6F47]" /></div>
                    ) : members.length === 0 ? (
                      <div className="text-center py-16 text-[#6B5D47] dark:text-[#B8A584]">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold">No members yet</p>
                        <p className="text-sm mt-1 opacity-70">Approved members will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] font-medium mb-2">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                        {members.map((member) => (
                          <motion.div
                            key={member.user_id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white dark:bg-[#1C1B18] rounded-2xl border p-4 flex items-center gap-4 ${
                              member.muted_from_chat
                                ? 'border-amber-200 dark:border-amber-900/40'
                                : 'border-[#E8E0D6] dark:border-[#3A3830]'
                            }`}
                          >
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B6F47] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {member.name[0]?.toUpperCase() || '?'}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-[#2C2416] dark:text-[#F5F3F0] text-sm truncate">{member.name}</p>
                                {member.is_owner && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#8B6F47]/10 text-[#8B6F47] dark:text-[#D4A574]">
                                    {member.role}
                                  </span>
                                )}
                                {member.muted_from_chat && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                    <VolumeX className="w-3 h-3" /> Muted
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] truncate">{member.email}</p>
                              <p className="text-[10px] text-[#6B5D47]/60 dark:text-[#B8A584]/60 mt-0.5">
                                Joined {new Date(member.joined_at).toLocaleDateString()}
                              </p>
                            </div>

                            {/* Actions (only for non-owners) */}
                            {!member.is_owner && (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleMemberAction(member.user_id, member.muted_from_chat ? 'unmute' : 'mute')}
                                  disabled={actionLoading !== null}
                                  title={member.muted_from_chat ? 'Unmute from chat' : 'Mute from chat'}
                                  className={`p-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all touch-manipulation ${
                                    member.muted_from_chat
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                  }`}
                                >
                                  {actionLoading === `${member.user_id}-mute` || actionLoading === `${member.user_id}-unmute`
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : member.muted_from_chat ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleMemberAction(member.user_id, 'remove')}
                                  disabled={actionLoading !== null}
                                  title="Remove from resource"
                                  className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold disabled:opacity-50 transition-all touch-manipulation"
                                >
                                  {actionLoading === `${member.user_id}-remove`
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <UserMinus className="w-4 h-4" />}
                                </motion.button>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Chat Tab */}
                {manageTab === 'chat' && (
                  <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] overflow-hidden"
                    style={{ height: 'min(520px, calc(100svh - 300px))' }}
                  >
                    {/* Messages */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#8B6F47]" /></div>
                      ) : announcements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[#6B5D47] dark:text-[#B8A584]">
                          <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                          <p className="text-sm font-medium">No messages yet</p>
                          <p className="text-xs opacity-60 mt-1">Start the conversation with your community</p>
                        </div>
                      ) : announcements.map((msg) => {
                        const isMe = msg.user_id === userId
                        return (
                          <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${isMe ? 'bg-[#8B6F47]' : 'bg-[#6B5D47]'}`}>
                              {(msg.users?.name || 'U')[0].toUpperCase()}
                            </div>
                            <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                              {!isMe && <p className="text-xs font-semibold text-[#6B5D47] dark:text-[#B8A584] px-1">{msg.users?.name || 'Unknown'}</p>}
                              <div className={`px-3 py-2 rounded-2xl text-sm ${
                                isMe
                                  ? 'bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] rounded-br-sm'
                                  : 'bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] rounded-bl-sm'
                              }`}>
                                {msg.content}
                              </div>
                              <p className="text-[10px] text-[#6B5D47]/60 dark:text-[#B8A584]/60 px-1">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Input */}
                    <div className="border-t border-[#E8E0D6] dark:border-[#3A3830]">
                      {chatError && (
                        <div className="px-3 pt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                          <span className="flex-1">⚠ {chatError}</span>
                          <button onClick={() => setChatError(null)} className="font-bold hover:opacity-70">×</button>
                        </div>
                      )}
                      <div className="p-3 flex items-end gap-2">
                        <textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={handleChatKeyDown}
                          placeholder="Send an announcement or message… (Enter to send)"
                          rows={1}
                          className="flex-1 resize-none px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                          style={{ maxHeight: 100 }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSendMessage}
                          disabled={!chatInput.trim() || chatSending}
                          className="p-2.5 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] disabled:opacity-40 transition-all"
                        >
                          {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
