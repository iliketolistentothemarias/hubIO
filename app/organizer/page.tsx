'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Check, X, Loader2, ChevronLeft, Globe, Lock, Plus,
  Save, Settings, Users, MessageSquare, Send, MoreVertical,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api/client-fetch'

type ManageTab = 'settings' | 'members' | 'chat'

interface OrgResource {
  id: string
  name: string
  category: string
  description: string
  created_at: string
  visibility: 'public' | 'private'
  application_question: string | null
  submitted_by: string
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

interface Announcement {
  id: string
  content: string
  created_at: string
  user_id: string
  users: { id: string; name: string; avatar: string | null } | null
}

export default function OrganizerPage() {
  const router = useRouter()
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
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Applications (members tab)
  const [applications, setApplications] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Chat
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const chatChannelRef = useRef<any>(null)

  // Auth gate
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('users').select('role').eq('id', session.user.id).single()
      if (!profile || (profile.role !== 'organizer' && profile.role !== 'admin')) {
        router.push('/')
        return
      }
      setUserId(session.user.id)
      setUserRole(profile.role)
      setChecking(false)
    }
    check()
  }, [router])

  useEffect(() => {
    if (!userId || checking) return
    loadResources()
  }, [userId, checking])

  const loadResources = async () => {
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
  }

  const openResource = (res: OrgResource) => {
    setSelectedResource(res)
    setSettingsForm({
      visibility: res.visibility || 'public',
      application_question: res.application_question || '',
    })
    setSaveMsg('')
    setManageTab('settings')
    setApplications([])
    setAnnouncements([])
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

  const handleSaveSettings = async () => {
    if (!selectedResource) return
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await apiFetch(`/api/resources/${selectedResource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      // Update local lists
      setSelectedResource((prev) => prev ? { ...prev, ...settingsForm } : prev)
      setResources((prev) => prev.map((r) => r.id === selectedResource.id ? { ...r, ...settingsForm } : r))
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch (e) {
      setSaveMsg('Failed to save: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Applications/Members ───────────────────────────────────────────────────

  useEffect(() => {
    if (manageTab === 'members' && selectedResource) {
      loadApplications()
    }
  }, [manageTab, selectedResource])

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
        setAnnouncements((prev) => [...prev, msg])
      })
      .subscribe()

    return () => {
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current)
        chatChannelRef.current = null
      }
    }
  }, [manageTab, selectedResource?.id])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [announcements])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedResource || chatSending) return
    const content = chatInput.trim()
    setChatInput('')
    setChatSending(true)
    try {
      await apiFetch(`/api/resources/${selectedResource.id}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
    } catch (e) {
      console.error('Failed to send chat message:', e)
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
    { id: 'members', label: 'Join Requests', icon: Users },
    { id: 'chat', label: 'Chat & Announcements', icon: MessageSquare },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0A0F] pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">Organizer Panel</h1>
            <p className="text-[#6B5D47] dark:text-[#B8A584] mt-1">Manage your community resources</p>
          </div>
          <Link
            href="/submit"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] font-semibold text-sm hover:bg-[#6B5D47] dark:hover:bg-[#B8A584] transition-colors"
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
                      onClick={() => openResource(res)}
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
                      <h3 className="font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-1 line-clamp-2">{res.name}</h3>
                      <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] mb-2 line-clamp-2">{res.description}</p>
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

              <h2 className="text-xl font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-1">{selectedResource.name}</h2>
              <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] mb-5">{selectedResource.category}</p>

              {/* Sub-tabs */}
              <div className="flex gap-1 border-b border-[#E8E0D6] dark:border-[#3A3830] mb-6">
                {manageTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setManageTab(id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                      manageTab === id
                        ? 'border-[#8B6F47] text-[#8B6F47] dark:text-[#D4A574] dark:border-[#D4A574]'
                        : 'border-transparent text-[#6B5D47] dark:text-[#B8A584] hover:text-[#2C2416] dark:hover:text-[#F5F3F0]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* Settings Tab */}
                {manageTab === 'settings' && (
                  <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] p-6 space-y-5">
                      <h3 className="text-base font-bold text-[#2C2416] dark:text-[#F5F3F0]">Visibility &amp; Access</h3>

                      <div>
                        <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-2">
                          Who can join this resource?
                        </label>
                        <div className="flex gap-3">
                          {(['public', 'private'] as const).map((v) => (
                            <button
                              key={v}
                              onClick={() => setSettingsForm((f) => ({ ...f, visibility: v }))}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                settingsForm.visibility === v
                                  ? 'border-[#8B6F47] bg-[#8B6F47]/10 text-[#8B6F47] dark:border-[#D4A574] dark:bg-[#D4A574]/10 dark:text-[#D4A574]'
                                  : 'border-[#E8E0D6] dark:border-[#3A3830] text-[#6B5D47] dark:text-[#B8A584] hover:border-[#8B6F47]/50'
                              }`}
                            >
                              {v === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              {v === 'public' ? 'Public — anyone can join' : 'Private — I approve members'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {settingsForm.visibility === 'private' && (
                        <div>
                          <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">
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

                      <div className="flex items-center gap-3 pt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSaveSettings}
                          disabled={saving}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] font-semibold text-sm disabled:opacity-50 transition-all"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Settings
                        </motion.button>
                        {saveMsg && (
                          <span className={`text-sm font-semibold ${saveMsg.startsWith('Failed') ? 'text-red-600' : 'text-green-600 dark:text-green-400'}`}>
                            {saveMsg}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Members / Join Requests Tab */}
                {manageTab === 'members' && (
                  <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
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
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold disabled:opacity-50"
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

                {/* Chat Tab */}
                {manageTab === 'chat' && (
                  <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col h-[520px] bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] overflow-hidden"
                  >
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-[#E8E0D6] dark:border-[#3A3830] flex items-end gap-2">
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
