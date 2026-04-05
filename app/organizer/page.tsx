'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Users, BookOpen, Check, X, Loader2,
  ChevronLeft, Globe, Lock, Plus, Save, Edit3, Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api/client-fetch'

type Tab = 'events' | 'applications' | 'resources'

interface OrgEvent {
  id: string
  title: string
  description: string
  date: string
  end_date?: string
  location: string
  visibility: 'public' | 'private'
  attendees: number
  capacity?: number
  status: string
  category: string
  tags: string[]
  application_question?: string
  organizer_id?: string
}

interface Application {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  approval_status: string
  application_data?: {
    name: string
    email: string
    phone?: string
    skills_answer: string
  }
  registered_at: string
  event_id: string
  event_title?: string
}

interface OrgResource {
  id: string
  name: string
  category: string
  status: string
  created_at: string
}

export default function OrganizerPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('events')
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  const [events, setEvents] = useState<OrgEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<OrgEvent | null>(null)
  const [editForm, setEditForm] = useState<Partial<OrgEvent>>({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const [applications, setApplications] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [resources, setResources] = useState<OrgResource[]>([])
  const [resourcesLoading, setResourcesLoading] = useState(false)

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
    if (tab === 'events') loadEvents()
    else if (tab === 'applications') loadAllApplications()
    else if (tab === 'resources') loadResources()
  }, [tab, userId, checking])

  const loadEvents = async () => {
    setEventsLoading(true)
    try {
      const res = await apiFetch('/api/events?status=all&limit=100')
      const json = await res.json()
      if (json.success) {
        const all: OrgEvent[] = json.data
        setEvents(userRole === 'admin' ? all : all.filter((e: any) => e.organizer_id === userId))
      }
    } catch (e) { console.error(e) }
    finally { setEventsLoading(false) }
  }

  const openEventEdit = (ev: OrgEvent) => {
    setSelectedEvent(ev)
    setEditForm({
      title: ev.title,
      description: ev.description,
      date: ev.date ? ev.date.slice(0, 16) : '',
      end_date: ev.end_date ? ev.end_date.slice(0, 16) : '',
      location: ev.location,
      category: ev.category,
      capacity: ev.capacity,
      visibility: ev.visibility,
      application_question: ev.application_question || '',
      status: ev.status,
    })
    setSaveMsg('')
  }

  const handleSaveEvent = async () => {
    if (!selectedEvent) return
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await apiFetch(`/api/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      // Update local list
      setEvents((prev) => prev.map((e) => e.id === selectedEvent.id ? { ...e, ...editForm } as OrgEvent : e))
      setSelectedEvent((prev) => prev ? { ...prev, ...editForm } as OrgEvent : prev)
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch (e) {
      setSaveMsg('Failed to save: ' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const loadAllApplications = async () => {
    setAppsLoading(true)
    try {
      const res = await apiFetch('/api/events?status=all&limit=100')
      const json = await res.json()
      if (!json.success) return
      const myEvents: OrgEvent[] = (userRole === 'admin'
        ? json.data
        : json.data.filter((e: any) => e.organizer_id === userId)
      ).filter((e: any) => e.visibility === 'private')

      const allApps: Application[] = []
      await Promise.all(
        myEvents.map(async (ev) => {
          const r = await apiFetch(`/api/events/${ev.id}/applications?approval_status=pending`)
          const j = await r.json()
          if (j.success) {
            allApps.push(...(j.data as Application[]).map((a) => ({ ...a, event_id: ev.id, event_title: ev.title })))
          }
        })
      )
      setApplications(allApps)
    } catch (e) { console.error(e) }
    finally { setAppsLoading(false) }
  }

  const loadResources = async () => {
    setResourcesLoading(true)
    try {
      const { data } = await supabase
        .from('resources')
        .select('id, name, category, created_at')
        .eq('submitted_by', userId)
        .order('created_at', { ascending: false })
      setResources((data || []).map((r) => ({ ...r, status: 'published' })))
    } catch (e) { console.error(e) }
    finally { setResourcesLoading(false) }
  }

  const handleApplicationAction = async (eventId: string, applicantUserId: string, action: 'approve' | 'reject') => {
    setActionLoading(`${eventId}-${applicantUserId}-${action}`)
    try {
      const res = await apiFetch(`/api/events/${eventId}/applications/${applicantUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.success) {
        setApplications((prev) => prev.filter((a) => !(a.event_id === eventId && a.user_id === applicantUserId)))
      }
    } catch (e) { console.error(e) }
    finally { setActionLoading(null) }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0A0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B6F47]" />
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'events', label: 'My Events', icon: Calendar },
    { id: 'applications', label: 'Join Requests', icon: Users },
    { id: 'resources', label: 'My Resources', icon: BookOpen },
  ]

  const statusOptions = ['upcoming', 'ongoing', 'completed', 'cancelled']
  const visibilityOptions: ('public' | 'private')[] = ['public', 'private']

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0A0F] pt-20">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">Organizer Panel</h1>
            <p className="text-[#6B5D47] dark:text-[#B8A584] mt-1">Manage your events and community resources</p>
          </div>
          <Link
            href="/submit"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] font-semibold text-sm hover:bg-[#6B5D47] dark:hover:bg-[#B8A584] transition-colors"
          >
            <Plus className="w-4 h-4" /> New Event
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#E8E0D6] dark:border-[#3A3830] mb-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSelectedEvent(null) }}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                tab === id
                  ? 'border-[#8B6F47] text-[#8B6F47] dark:text-[#D4A574] dark:border-[#D4A574]'
                  : 'border-transparent text-[#6B5D47] dark:text-[#B8A584] hover:text-[#2C2416] dark:hover:text-[#F5F3F0]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === 'applications' && applications.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                  {applications.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── My Events ── */}
          {tab === 'events' && !selectedEvent && (
            <motion.div key="events-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {eventsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#8B6F47]" /></div>
              ) : events.length === 0 ? (
                <div className="text-center py-16 text-[#6B5D47] dark:text-[#B8A584]">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold mb-2">No events yet</p>
                  <Link href="/submit" className="text-sm text-[#8B6F47] underline">Submit your first event</Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((ev) => (
                    <motion.button
                      key={ev.id}
                      onClick={() => openEventEdit(ev)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-left bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          ev.visibility === 'private'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}>
                          {ev.visibility === 'private' ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                          {ev.visibility}
                        </span>
                        <span className="p-1.5 rounded-lg bg-[#F5F3F0] dark:bg-[#2A2824] opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit3 className="w-3.5 h-3.5 text-[#8B6F47] dark:text-[#D4A574]" />
                        </span>
                      </div>
                      <h3 className="font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-1 line-clamp-2">{ev.title}</h3>
                      <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] mb-3 line-clamp-2">{ev.description}</p>
                      <div className="space-y-1">
                        <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span suppressHydrationWarning>{new Date(ev.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </p>
                        <p className="text-xs text-[#6B5D47] dark:text-[#B8A584]">
                          {ev.attendees}{ev.capacity ? ` / ${ev.capacity}` : ''} attending · <span className="capitalize">{ev.status}</span>
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Event Edit Panel ── */}
          {tab === 'events' && selectedEvent && (
            <motion.div key="event-edit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Back + view link */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="flex items-center gap-2 text-sm text-[#6B5D47] dark:text-[#B8A584] hover:text-[#2C2416] dark:hover:text-[#F5F3F0] transition-colors font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to events
                </button>
                <Link
                  href={`/events/${selectedEvent.id}`}
                  className="flex items-center gap-1.5 text-sm text-[#8B6F47] dark:text-[#D4A574] hover:underline"
                >
                  <Eye className="w-4 h-4" /> View public page
                </Link>
              </div>

              <div className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] p-6 space-y-5">
                <h2 className="text-xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">Edit Event</h2>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">Title</label>
                  <input
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 resize-none"
                  />
                </div>

                {/* Date + End Date */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={editForm.date || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">End Date & Time (optional)</label>
                    <input
                      type="datetime-local"
                      value={editForm.end_date || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                    />
                  </div>
                </div>

                {/* Location + Capacity */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">Location</label>
                    <input
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">Capacity (optional)</label>
                    <input
                      type="number"
                      value={editForm.capacity || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, capacity: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                    />
                  </div>
                </div>

                {/* Status + Visibility */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">Status</label>
                    <select
                      value={editForm.status || 'upcoming'}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                    >
                      {statusOptions.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">Visibility</label>
                    <select
                      value={editForm.visibility || 'public'}
                      onChange={(e) => setEditForm((f) => ({ ...f, visibility: e.target.value as 'public' | 'private' }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                    >
                      {visibilityOptions.map((v) => <option key={v} value={v} className="capitalize">{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                {/* Application question (shown for private events) */}
                {editForm.visibility === 'private' && (
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">
                      Application question <span className="text-[#8B6F47] text-xs">(shown to applicants)</span>
                    </label>
                    <input
                      value={editForm.application_question || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, application_question: e.target.value }))}
                      placeholder="e.g. What relevant skills do you have?"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                    />
                  </div>
                )}

                {/* Save */}
                <div className="flex items-center gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveEvent}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] font-semibold text-sm disabled:opacity-50 transition-all"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
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

          {/* ── Join Requests ── */}
          {tab === 'applications' && (
            <motion.div key="applications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {appsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#8B6F47]" /></div>
              ) : applications.length === 0 ? (
                <div className="text-center py-16 text-[#6B5D47] dark:text-[#B8A584]">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No pending applications</p>
                  <p className="text-sm mt-1 opacity-70">Applications for your private events will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <motion.div
                      key={`${app.event_id}-${app.user_id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] p-5"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                            {app.application_data?.name || app.name}
                          </p>
                          <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">
                            {app.application_data?.email || app.email}
                            {app.application_data?.phone ? ` · ${app.application_data.phone}` : ''}
                          </p>
                          <p className="text-xs text-[#8B6F47] dark:text-[#D4A574] mt-0.5">
                            For: <Link href={`/events/${app.event_id}`} className="underline">{app.event_title}</Link>
                          </p>
                        </div>
                        <span className="text-xs text-[#6B5D47] dark:text-[#B8A584] flex-shrink-0">
                          {new Date(app.registered_at).toLocaleDateString()}
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
                          onClick={() => handleApplicationAction(app.event_id, app.user_id, 'approve')}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50 transition-all"
                        >
                          {actionLoading === `${app.event_id}-${app.user_id}-approve`
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Check className="w-4 h-4" />}
                          Approve
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleApplicationAction(app.event_id, app.user_id, 'reject')}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold disabled:opacity-50 transition-all"
                        >
                          {actionLoading === `${app.event_id}-${app.user_id}-reject`
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

          {/* ── My Resources ── */}
          {tab === 'resources' && (
            <motion.div key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {resourcesLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#8B6F47]" /></div>
              ) : resources.length === 0 ? (
                <div className="text-center py-16 text-[#6B5D47] dark:text-[#B8A584]">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold mb-2">No resources yet</p>
                  <Link href="/submit" className="text-sm text-[#8B6F47] underline">Submit a resource</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {resources.map((res) => (
                    <motion.div
                      key={res.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h3 className="font-bold text-[#2C2416] dark:text-[#F5F3F0]">{res.name}</h3>
                        <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">
                          {res.category} · {new Date(res.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        Published
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
