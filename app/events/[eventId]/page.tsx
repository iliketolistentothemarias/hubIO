'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, MapPin, Users, Tag, Lock, Globe, Send,
  ChevronLeft, Clock, User, CheckCircle, Loader2, X
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api/client-fetch'

interface EventAnnouncement {
  id: string
  event_id: string
  user_id: string
  content: string
  created_at: string
  users: { id: string; name: string; avatar?: string } | null
}

interface EventDetails {
  id: string
  title: string
  description: string
  date: string
  end_date?: string
  location: string
  organizer: string
  organizer_id?: string
  capacity?: number
  attendees: number
  category: string
  tags: string[]
  image?: string
  status: string
  featured: boolean
  visibility: 'public' | 'private'
  application_question?: string
  created_at: string
}

interface Registration {
  id: string
  status: string
  approval_status: 'approved' | 'pending' | 'rejected'
  registered_at: string
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const router = useRouter()

  const [event, setEvent] = useState<EventDetails | null>(null)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'about' | 'announcements'>('about')

  // Application modal state
  const [showModal, setShowModal] = useState(false)
  const [appForm, setAppForm] = useState({ name: '', email: '', phone: '', skills_answer: '' })
  const [submitting, setSubmitting] = useState(false)
  const [joinError, setJoinError] = useState('')

  // Announcements state
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    loadEvent()
  }, [eventId])

  const loadEvent = async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/events/${eventId}`)
      const json = await res.json()
      if (json.success) {
        setEvent(json.data)
        setRegistration(json.registration ?? null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const isApprovedParticipant =
    registration?.approval_status === 'approved' ||
    (event && currentUserId && event.organizer_id === currentUserId)

  // Load announcements when switching to chat tab (if access allowed)
  useEffect(() => {
    if (activeTab === 'announcements' && isApprovedParticipant) {
      loadAnnouncements()
      subscribeToAnnouncements()
    }
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [activeTab, isApprovedParticipant, eventId])

  const loadAnnouncements = async () => {
    setAnnouncementsLoading(true)
    try {
      const res = await apiFetch(`/api/events/${eventId}/announcements`)
      const json = await res.json()
      if (json.success) setAnnouncements(json.data)
    } catch (e) {
      console.error(e)
    } finally {
      setAnnouncementsLoading(false)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const subscribeToAnnouncements = () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase
      .channel(`event-announcements-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_announcements', filter: `event_id=eq.${eventId}` },
        async (payload) => {
          const newRow = payload.new as EventAnnouncement
          // Fetch sender info
          const { data: profile } = await supabase
            .from('users')
            .select('id, name, avatar')
            .eq('id', newRow.user_id)
            .single()
          const enriched = { ...newRow, users: profile ?? null }
          setAnnouncements((prev) => {
            if (prev.some((m) => m.id === enriched.id)) return prev
            return [...prev, enriched]
          })
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      )
      .subscribe()
    channelRef.current = ch
  }

  const handlePublicJoin = async () => {
    setJoinError('')
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      await loadEvent()
    } catch (e) {
      setJoinError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')
    if (!appForm.name || !appForm.email || !appForm.skills_answer) {
      setJoinError('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appForm),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setShowModal(false)
      await loadEvent()
    } catch (e) {
      setJoinError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    const content = newMessage.trim()
    setNewMessage('')
    setSending(true)
    try {
      await apiFetch(`/api/events/${eventId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
    } catch (e) {
      console.error(e)
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0A0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B6F47]" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0A0F] flex flex-col items-center justify-center gap-4">
        <p className="text-[#6B5D47] dark:text-[#B8A584] text-lg">Event not found.</p>
        <button onClick={() => router.push('/events')} className="text-sm underline text-[#8B6F47]">
          Back to Events
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0A0F]">
      {/* Hero banner */}
      <div className="relative h-56 md:h-72 overflow-hidden bg-gradient-to-br from-[#8B6F47] to-[#D4A574]">
        {event.image && (
          <img src={event.image} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 left-4">
          <button
            onClick={() => router.push('/events')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
              {event.category}
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              event.visibility === 'private'
                ? 'bg-amber-500/80 text-white'
                : 'bg-green-500/80 text-white'
            }`}>
              {event.visibility === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {event.visibility === 'private' ? 'Private' : 'Public'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{event.title}</h1>
        </div>
      </div>

      {/* Metadata strip */}
      <div className="bg-white dark:bg-[#1C1B18] border-b border-[#E8E0D6] dark:border-[#3A3830]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap gap-4 text-sm text-[#6B5D47] dark:text-[#B8A584]">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatDate(event.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {formatTime(event.date)}{event.end_date ? ` – ${formatTime(event.end_date)}` : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {event.location}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {event.organizer}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {event.attendees}{event.capacity ? ` / ${event.capacity}` : ''} attendees
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex gap-1 mt-6 border-b border-[#E8E0D6] dark:border-[#3A3830]">
          {(['about', 'announcements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#8B6F47] text-[#8B6F47] dark:text-[#D4A574] dark:border-[#D4A574]'
                  : 'border-transparent text-[#6B5D47] dark:text-[#B8A584] hover:text-[#2C2416] dark:hover:text-[#F5F3F0]'
              }`}
            >
              {tab === 'announcements' ? 'Chat & Announcements' : 'About'}
            </button>
          ))}
        </div>

        {/* About tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="py-8 space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-3">About this event</h2>
                <p className="text-[#6B5D47] dark:text-[#B8A584] leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>

              {event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[#F5F3F0] dark:bg-[#2A2824] text-[#6B5D47] dark:text-[#B8A584]"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Private event question preview */}
              {event.visibility === 'private' && event.application_question && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                    Application required
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">{event.application_question}</p>
                </div>
              )}

              {/* Join / status area */}
              <div className="pt-2">
                {!currentUserId ? (
                  <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">
                    <a href="/login" className="text-[#8B6F47] underline">Sign in</a> to join this event.
                  </p>
                ) : event.organizer_id === currentUserId ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F5F3F0] dark:bg-[#2A2824] text-sm text-[#6B5D47] dark:text-[#B8A584]">
                    <User className="w-4 h-4" /> You are the organizer of this event
                  </span>
                ) : registration?.approval_status === 'approved' ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-sm text-green-700 dark:text-green-400 font-semibold">
                    <CheckCircle className="w-4 h-4" /> You are joined — check the Chat tab
                  </span>
                ) : registration?.approval_status === 'pending' ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Application pending organizer review
                  </span>
                ) : registration?.approval_status === 'rejected' ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-400">
                    Your application was not accepted
                  </span>
                ) : event.status === 'cancelled' ? (
                  <span className="px-4 py-2 rounded-lg bg-red-50 text-sm text-red-600 font-medium">
                    This event has been cancelled
                  </span>
                ) : event.visibility === 'public' ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePublicJoin}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] font-semibold disabled:opacity-50 transition-all"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin inline" /> : 'Join Event'}
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setShowModal(true); setJoinError('') }}
                    className="px-6 py-2.5 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] font-semibold transition-all"
                  >
                    Apply to Join
                  </motion.button>
                )}
                {joinError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{joinError}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Announcements / Chat tab */}
          {activeTab === 'announcements' && (
            <motion.div
              key="announcements"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="py-6"
            >
              {!isApprovedParticipant ? (
                <div className="text-center py-16 text-[#6B5D47] dark:text-[#B8A584]">
                  <Lock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold mb-1">
                    {registration?.approval_status === 'pending'
                      ? 'Your application is pending review'
                      : 'Join this event to access announcements'}
                  </p>
                  <p className="text-sm opacity-70">The organizer uses this channel for updates and chat.</p>
                </div>
              ) : (
                <div className="flex flex-col h-[60vh]">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                    {announcementsLoading ? (
                      <div className="flex justify-center pt-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[#8B6F47]" />
                      </div>
                    ) : announcements.length === 0 ? (
                      <div className="text-center pt-12 text-[#6B5D47] dark:text-[#B8A584] opacity-60">
                        <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No messages yet — start the conversation!</p>
                      </div>
                    ) : (
                      announcements.map((msg) => {
                        const isOwn = msg.user_id === currentUserId
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B6F47] to-[#D4A574] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {msg.users?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                              {!isOwn && (
                                <span className="text-xs font-semibold text-[#6B5D47] dark:text-[#B8A584] mb-1 px-1">
                                  {msg.users?.name || 'Unknown'}
                                </span>
                              )}
                              <div className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                                isOwn
                                  ? 'bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] rounded-br-sm'
                                  : 'bg-white dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] rounded-bl-sm shadow-sm'
                              }`}>
                                {msg.content}
                              </div>
                              <span className="text-[10px] text-[#8B6F47]/60 dark:text-[#D4A574]/60 mt-1 px-1">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="flex items-end gap-2 pt-3 border-t border-[#E8E0D6] dark:border-[#3A3830]">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Send a message..."
                      rows={1}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#1C1B18] text-[#2C2416] dark:text-[#F5F3F0] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 max-h-28 overflow-y-auto"
                      style={{ minHeight: '40px' }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-2.5 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] disabled:opacity-40"
                    >
                      <Send className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Application Modal (private events) */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-[#1C1B18] rounded-2xl shadow-2xl border border-[#E8E0D6] dark:border-[#3A3830] w-full max-w-md pointer-events-auto max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-[#E8E0D6] dark:border-[#3A3830]">
                  <div>
                    <h2 className="font-bold text-[#2C2416] dark:text-[#F5F3F0]">Apply to Join</h2>
                    <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] mt-0.5">{event.title}</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1.5 rounded-lg hover:bg-[#F5F3F0] dark:hover:bg-[#2A2824] transition-colors"
                  >
                    <X className="w-5 h-5 text-[#6B5D47] dark:text-[#B8A584]" />
                  </button>
                </div>

                <form onSubmit={handleApplicationSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={appForm.name}
                      onChange={(e) => setAppForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={appForm.email}
                      onChange={(e) => setAppForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={appForm.phone}
                      onChange={(e) => setAppForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0] mb-1">
                      {event.application_question || 'Tell us about your relevant skills/experience'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={appForm.skills_answer}
                      onChange={(e) => setAppForm((f) => ({ ...f, skills_answer: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 resize-none"
                      required
                    />
                  </div>

                  {joinError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{joinError}</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] text-sm font-semibold text-[#6B5D47] dark:text-[#B8A584] hover:bg-[#F5F3F0] dark:hover:bg-[#2A2824] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] text-sm font-semibold disabled:opacity-50 transition-all"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
