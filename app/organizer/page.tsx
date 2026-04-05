'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Users, BookOpen, Check, X, Loader2,
  ChevronRight, Globe, Lock, AlertCircle, Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api/client-fetch'

type Tab = 'events' | 'applications' | 'resources'

interface OrgEvent {
  id: string
  title: string
  date: string
  location: string
  visibility: 'public' | 'private'
  attendees: number
  capacity?: number
  status: string
  application_question?: string
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
      const admin = userRole === 'admin'
      // Organizer sees only their events; admin can see all
      const res = await apiFetch(
        admin ? '/api/events?status=all&limit=100' : '/api/events?status=all&limit=100'
      )
      const json = await res.json()
      if (json.success) {
        const all: OrgEvent[] = json.data
        setEvents(admin ? all : all.filter((e) => (e as any).organizer_id === userId))
      }
    } catch (e) { console.error(e) }
    finally { setEventsLoading(false) }
  }

  const loadAllApplications = async () => {
    setAppsLoading(true)
    try {
      // Load events first, then applications for private ones
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
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
            href="/events/create"
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
              onClick={() => setTab(id)}
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
          {/* My Events */}
          {tab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {eventsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#8B6F47]" /></div>
              ) : events.length === 0 ? (
                <div className="text-center py-16 text-[#6B5D47] dark:text-[#B8A584]">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold mb-2">No events yet</p>
                  <Link href="/events/create" className="text-sm text-[#8B6F47] underline">Create your first event</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((ev) => (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] p-5 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#2C2416] dark:text-[#F5F3F0] truncate">{ev.title}</h3>
                          <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            ev.visibility === 'private'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          }`}>
                            {ev.visibility === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                            {ev.visibility}
                          </span>
                        </div>
                        <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">
                          {new Date(ev.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} · {ev.location}
                        </p>
                        <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] mt-0.5">
                          {ev.attendees}{ev.capacity ? ` / ${ev.capacity}` : ''} attending · {ev.status}
                        </p>
                      </div>
                      <Link
                        href={`/events/${ev.id}`}
                        className="flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-xl bg-[#F5F3F0] dark:bg-[#2A2824] text-sm text-[#6B5D47] dark:text-[#B8A584] font-semibold hover:bg-[#E8E0D6] dark:hover:bg-[#353330] transition-colors"
                      >
                        View <ChevronRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Join Requests */}
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

          {/* My Resources */}
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
