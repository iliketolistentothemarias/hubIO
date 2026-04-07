'use client'

/**
 * Individual Resource Detail Page
 * 
 * Comprehensive detail page for each community resource with:
 * - Full resource information
 * - Contact details
 * - Map location
 * - Reviews and ratings
 * - Related resources
 * - Share functionality
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, Phone, Mail, Globe, Clock, Star, Heart, Share2, 
  ArrowLeft, Calendar, Users, Award, Languages, CheckCircle,
  ExternalLink, Lock, Loader2, UserCheck, X,
  MessageSquare, Send, VolumeX, Volume2, UserMinus,
} from 'lucide-react'
import { resources as fallbackResources } from '@/data/resources'
import { useFavorites } from '@/contexts/FavoritesContext'
import LiquidGlass from '@/components/LiquidGlass'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api/client-fetch'
import ResourceHeroLogo from '@/components/ResourceHeroLogo'
import { websiteHref } from '@/lib/utils/resource-logo'

type CommunityTab = 'chat' | 'members'

export default function ResourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : params.id?.[0]
  const { isFavorite, toggleFavorite } = useFavorites()
  
  const [dbResources, setDbResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResources = async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
      
      if (!error && data) {
        setDbResources(data)
      }
      setLoading(false)
    }

    fetchResources()

    // Realtime subscription for instant updates
    const channel = supabase
      .channel('resource-details-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resources' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDbResources(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setDbResources(prev => prev.map(r => r.id === payload.new.id ? payload.new : r))
          } else if (payload.eventType === 'DELETE') {
            setDbResources(prev => prev.filter(r => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const allResources = useMemo(() => {
    // Merge fallback and DB resources, prioritizing DB by ID
    const merged = [...dbResources]
    fallbackResources.forEach(fallback => {
      if (!merged.find(r => r.id === fallback.id)) {
        merged.push(fallback)
      }
    })
    return merged
  }, [dbResources])

  const resource = useMemo(() => {
    return allResources.find(r => r.id === id)
  }, [allResources, id])

  const [relatedResources, setRelatedResources] = useState<any[]>([])

  // ── Join / Apply state ──────────────────────────────────────────
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [joinStatus, setJoinStatus] = useState<null | 'approved' | 'pending' | 'rejected' | 'owner' | 'cancelled'>(null)
  const [joinLoading, setJoinLoading] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyForm, setApplyForm] = useState({ name: '', email: '', phone: '', skills_answer: '' })
  const [applyError, setApplyError] = useState('')
  const [applySuccess, setApplySuccess] = useState(false)

  // ── Community (chat + members) ─────────────────────────────────
  const [communityTab, setCommunityTab] = useState<CommunityTab>('chat')
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [chatMsg, setChatMsg] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatSending, setChatSending] = useState(false)
  const [communityMembers, setCommunityMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Load community data when user is approved/owner
  useEffect(() => {
    if ((joinStatus === 'approved' || joinStatus === 'owner') && resource?.id) {
      if (communityTab === 'chat') loadAnnouncements()
      else loadCommunityMembers()
    }
  }, [communityTab, joinStatus, resource?.id])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [announcements])

  const loadAnnouncements = async () => {
    if (!resource?.id) return
    setChatLoading(true)
    try {
      const res = await apiFetch(`/api/resources/${resource.id}/announcements?limit=60`)
      const json = await res.json()
      if (json.success) setAnnouncements(json.data || [])
    } catch { /* ignore */ } finally { setChatLoading(false) }
  }

  const loadCommunityMembers = async () => {
    if (!resource?.id) return
    setMembersLoading(true)
    try {
      const res = await apiFetch(`/api/resources/${resource.id}/members`)
      const json = await res.json()
      if (json.success) setCommunityMembers(json.data || [])
    } catch { /* ignore */ } finally { setMembersLoading(false) }
  }

  const sendChatMsg = async () => {
    if (!chatMsg.trim() || chatSending || !resource?.id) return
    const content = chatMsg.trim()
    setChatMsg('')
    setChatSending(true)
    const optimistic = {
      id: `opt-${Date.now()}`,
      content,
      user_id: currentUserId,
      created_at: new Date().toISOString(),
      users: { name: 'You', id: currentUserId },
    }
    setAnnouncements((p) => [...p, optimistic])
    try {
      const res = await apiFetch(`/api/resources/${resource.id}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setAnnouncements((p) => p.map((m) => m.id === optimistic.id ? json.data : m))
      }
    } catch { /* optimistic stays */ } finally { setChatSending(false) }
  }

  // Real-time chat subscription (only when community is visible)
  useEffect(() => {
    if ((joinStatus !== 'approved' && joinStatus !== 'owner') || !resource?.id) return
    const channel = supabase
      .channel(`resource-chat-${resource.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'resource_announcements',
        filter: `resource_id=eq.${resource.id}`,
      }, (payload: any) => {
        setAnnouncements((p) => {
          if (p.some((m) => m.id === payload.new.id)) return p
          return [...p, { ...payload.new, users: { name: '...', id: payload.new.user_id } }]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [joinStatus, resource?.id])

  // Fetch current user + join status when resource loads
  useEffect(() => {
    let cancelled = false
    let rtChannel: ReturnType<typeof supabase.channel> | null = null

    const fetchJoinStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      setCurrentUserId(session.user.id)
      if (!resource?.id) return
      try {
        const res = await apiFetch(`/api/resources/${resource.id}/join`)
        const json = await res.json()
        if (json.success) {
          const { signup, isOwner } = json.data
          if (isOwner) setJoinStatus('owner')
          else if (signup) setJoinStatus(signup.status as any)
        }
      } catch { /* ignore */ }
    }

    const run = async () => {
      await fetchJoinStatus()
      if (cancelled || !resource?.id) return
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id ?? 'guest'
      rtChannel = supabase
        .channel(`join-status-${resource.id}-${uid}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'resource_signups',
            filter: `resource_id=eq.${resource.id}`,
          },
          () => {
            void fetchJoinStatus()
          }
        )
        .subscribe()
    }

    void run()

    return () => {
      cancelled = true
      if (rtChannel) supabase.removeChannel(rtChannel)
    }
  }, [resource?.id])

  useEffect(() => {
    if (resource) {
      // Find related resources (same category or shared tags)
      const related = allResources
        .filter(r => r.id !== resource.id && (
          r.category === resource.category ||
          (r.tags && r.tags.some(tag => resource.tags?.includes(tag)))
        ))
        .slice(0, 3)
      setRelatedResources(related)
    }
  }, [resource, allResources])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-40 flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-[#8B6F47]/20 border-t-[#8B6F47] rounded-full animate-spin mb-4" />
        <p className="text-[#6B5D47] font-medium">Loading details...</p>
      </div>
    )
  }
  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Resource Not Found</h1>
          <Link href="/directory" className="btn-primary">
            Back to Directory
          </Link>
        </div>
      </div>
    )
  }

  const handleDirectJoin = async () => {
    if (!resource?.id || joinLoading) return
    setJoinLoading(true)
    try {
      const res = await apiFetch(`/api/resources/${resource.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (json.success) setJoinStatus('approved')
      else if (json.currentStatus) setJoinStatus(json.currentStatus as any)
    } catch (e) { console.error(e) }
    finally { setJoinLoading(false) }
  }

  const handleLeaveResource = async () => {
    if (!resource?.id || leaveLoading) return
    const msg =
      joinStatus === 'pending'
        ? 'Withdraw your application? You can apply again later.'
        : 'Leave this resource? You will lose access to member chat until you join again.'
    if (!window.confirm(msg)) return
    setLeaveLoading(true)
    try {
      const res = await apiFetch(`/api/resources/${resource.id}/join`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) setJoinStatus('cancelled')
      else window.alert(json.error || 'Could not update membership.')
    } catch {
      window.alert('Network error. Please try again.')
    } finally {
      setLeaveLoading(false)
    }
  }

  const handleApplySubmit = async () => {
    if (!resource?.id) return
    if (!applyForm.name || !applyForm.email || !applyForm.skills_answer) {
      setApplyError('Name, email, and skills answer are required.')
      return
    }
    setApplyError('')
    setJoinLoading(true)
    try {
      const res = await apiFetch(`/api/resources/${resource.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applyForm),
      })
      const json = await res.json()
      if (json.success) {
        setJoinStatus('pending')
        setApplySuccess(true)
        setTimeout(() => { setShowApplyModal(false); setApplySuccess(false) }, 1500)
      } else {
        setApplyError(json.error || 'Failed to submit application.')
      }
    } catch (e) { setApplyError('Network error. Please try again.') }
    finally { setJoinLoading(false) }
  }

  const favorite = isFavorite(resource.id)
  const logoUrlOverride =
    resource.image ?? (resource as { logo_url?: string }).logo_url

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0A0F] pt-20 md:pt-24 pb-20">
      <div className="container-custom px-4 md:px-6">
        {/* Breadcrumbs / Back */}
        <div className="mb-6 md:mb-8">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-[#6B5D47] dark:text-[#B8A584] hover:text-[#8B6F47] dark:hover:text-[#D4A574] transition-colors"
          >
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#1F1B28] shadow-sm group-hover:shadow-md transition-all border border-[#E8E0D6] dark:border-[#2c2c3e]">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">Back to directory</span>
          </motion.button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column: Main Info */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1F1B28] rounded-2xl md:rounded-[2rem] shadow-xl border border-[#E8E0D6] dark:border-[#2c2c3e] overflow-hidden"
            >
              <div className="p-6 md:p-12">
                <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                  {/* Hero Image/Icon Section */}
                  <div className="w-full md:w-40 shrink-0">
                    <ResourceHeroLogo
                      name={resource.name}
                      website={resource.website}
                      image={logoUrlOverride}
                    />
                  </div>

                  {/* Core Details */}
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                      {resource.featured && (
                        <span className="px-3 py-1 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-1 border border-yellow-400/20">
                          <Star className="w-3 h-3 fill-current" />
                          Featured
                        </span>
                      )}
                      <span className="px-3 py-1 bg-[#8B6F47]/10 text-[#8B6F47] dark:text-[#D4A574] text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-[#8B6F47]/10">
                        {resource.category}
                      </span>
                      {resource.verified && (
                        <span className="px-3 py-1 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-400/20">
                          Verified
                        </span>
                      )}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-display font-bold text-[#2C2416] dark:text-white mb-6 leading-tight break-words [overflow-wrap:anywhere]">
                      {resource.name}
                    </h1>

                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      <p className="text-[#6B5D47] dark:text-[#B8A584] leading-relaxed break-words whitespace-pre-wrap text-sm md:text-base [overflow-wrap:anywhere]">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mt-8 md:mt-12 pt-8 md:pt-12 border-t border-[#E8E0D6] dark:border-[#2c2c3e]">
                  <div className="p-4 md:p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 dark:border-[#2c2c3e]/50 flex gap-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1F1B28] shadow-sm shrink-0 h-fit">
                      <MapPin className="w-5 h-5 text-[#8B6F47]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8B6F47]/60 mb-1">Location</p>
                      <p className="text-[#2C2416] dark:text-white font-medium break-words text-sm md:text-base [overflow-wrap:anywhere]">{resource.address || 'Location on map only'}</p>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 dark:border-[#2c2c3e]/50 flex gap-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1F1B28] shadow-sm shrink-0 h-fit">
                      <Phone className="w-5 h-5 text-[#8B6F47]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8B6F47]/60 mb-1">Contact</p>
                      <p className="text-[#2C2416] dark:text-white font-medium text-sm md:text-base">{resource.phone}</p>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 dark:border-[#2c2c3e]/50 flex gap-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1F1B28] shadow-sm shrink-0 h-fit">
                      <Mail className="w-5 h-5 text-[#8B6F47]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8B6F47]/60 mb-1">Email</p>
                      <p className="text-[#2C2416] dark:text-white font-medium break-words text-sm md:text-base [overflow-wrap:anywhere]">{resource.email}</p>
                    </div>
                  </div>

                  {resource.website && (
                    <div className="p-4 md:p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 dark:border-[#2c2c3e]/50 flex gap-4">
                      <div className="p-3 rounded-xl bg-white dark:bg-[#1F1B28] shadow-sm shrink-0 h-fit">
                        <Globe className="w-5 h-5 text-[#8B6F47]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8B6F47]/60 mb-1">Website</p>
                        <a href={websiteHref(resource.website)} target="_blank" rel="noopener noreferrer" 
                           className="text-[#8B6F47] hover:underline font-medium break-words block text-sm md:text-base [overflow-wrap:anywhere]">
                          {resource.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Services & Details */}
            {resource.services?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#1F1B28] rounded-2xl md:rounded-[2rem] shadow-xl border border-[#E8E0D6] dark:border-[#2c2c3e] p-6 md:p-12"
              >
                <h2 className="text-xl md:text-2xl font-bold text-[#2C2416] dark:text-white mb-6 md:mb-8 flex items-center gap-3">
                  <Award className="w-6 h-6 text-[#8B6F47]" />
                  Services & Expertise
                </h2>
                <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                  {resource.services.map((service: string) => (
                    <div key={service} className="flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/30 dark:border-[#2c2c3e]/30">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="text-[#2C2416] dark:text-white font-medium text-sm md:text-base">{service}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#1F1B28] rounded-2xl md:rounded-[2rem] shadow-xl border border-[#E8E0D6] dark:border-[#2c2c3e] p-6 md:p-8"
            >
              <h3 className="text-xl font-bold text-[#2C2416] dark:text-white mb-6">Quick Actions</h3>
              <div className="space-y-4">

                {/* Join / Apply button */}
                {currentUserId && (
                  <>
                    {joinStatus === 'owner' ? (
                      <Link
                        href="/organizer"
                        className="w-full bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] py-3.5 rounded-xl md:rounded-2xl font-bold transition-all flex items-center justify-center gap-3"
                      >
                        <UserCheck className="w-5 h-5" />
                        Manage in Organizer Panel
                      </Link>
                    ) : joinStatus === 'approved' ? (
                      <div className="space-y-3">
                        <div className="w-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-3.5 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-3 text-sm text-center break-words px-3">
                          <CheckCircle className="w-5 h-5 shrink-0" />
                          <span>You&apos;re a member</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleLeaveResource}
                          disabled={leaveLoading}
                          className="w-full py-3 rounded-xl md:rounded-2xl font-semibold text-sm border-2 border-[#E8E0D6] dark:border-[#3A3830] text-[#6B5D47] dark:text-[#B8A584] hover:bg-[#F5F3F0] dark:hover:bg-[#2A2824] transition-all flex items-center justify-center gap-2 disabled:opacity-60 break-words"
                        >
                          {leaveLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <UserMinus className="w-4 h-4 shrink-0" />}
                          Leave resource
                        </button>
                      </div>
                    ) : joinStatus === 'pending' ? (
                      <div className="space-y-3">
                        <div className="w-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 py-3.5 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-3 text-sm text-center break-words px-3">
                          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                          <span>Application pending</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleLeaveResource}
                          disabled={leaveLoading}
                          className="w-full py-3 rounded-xl md:rounded-2xl font-semibold text-sm border-2 border-[#E8E0D6] dark:border-[#3A3830] text-[#6B5D47] dark:text-[#B8A584] hover:bg-[#F5F3F0] dark:hover:bg-[#2A2824] transition-all flex items-center justify-center gap-2 disabled:opacity-60 break-words"
                        >
                          {leaveLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <UserMinus className="w-4 h-4 shrink-0" />}
                          Withdraw application
                        </button>
                      </div>
                    ) : joinStatus === 'rejected' || joinStatus === 'cancelled' ? (
                      // Allow re-applying after rejection/removal
                      resource.visibility === 'private' ? (
                        <button
                          onClick={() => setShowApplyModal(true)}
                          className="w-full bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] py-3.5 rounded-xl md:rounded-2xl font-bold hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                          <Lock className="w-5 h-5" />
                          Apply Again
                        </button>
                      ) : (
                        <button
                          onClick={handleDirectJoin}
                          disabled={joinLoading}
                          className="w-full bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] py-3.5 rounded-xl md:rounded-2xl font-bold hover:shadow-lg active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-3"
                        >
                          {joinLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                          Re-join Resource
                        </button>
                      )
                    ) : resource.visibility === 'private' ? (
                      <button
                        onClick={() => setShowApplyModal(true)}
                        className="w-full bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] py-3.5 rounded-xl md:rounded-2xl font-bold hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                      >
                        <Lock className="w-5 h-5" />
                        Apply to Join
                      </button>
                    ) : (
                      <button
                        onClick={handleDirectJoin}
                        disabled={joinLoading}
                        className="w-full bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] py-3.5 rounded-xl md:rounded-2xl font-bold hover:shadow-lg active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-3"
                      >
                        {joinLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                        Join Resource
                      </button>
                    )}
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => toggleFavorite(resource.id)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl md:rounded-2xl font-bold transition-all border-2 ${
                      favorite 
                        ? 'bg-red-50 text-red-500 border-red-100' 
                        : 'bg-[#FAF9F6] dark:bg-[#16141D] text-[#6B5D47] border-[#E8E0D6] dark:border-[#2c2c3e]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      const btn = document.activeElement as HTMLElement
                      if (btn) { const orig = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = orig }, 1500) }
                    }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl md:rounded-2xl font-bold bg-[#FAF9F6] dark:bg-[#16141D] text-[#6B5D47] border-2 border-[#E8E0D6] dark:border-[#2c2c3e] transition-all active:bg-green-50 dark:active:bg-green-900/20"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </motion.div>

            {relatedResources.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#1F1B28] rounded-2xl md:rounded-[2rem] shadow-xl border border-[#E8E0D6] dark:border-[#2c2c3e] p-6 md:p-8"
              >
                <h3 className="text-xl font-bold text-[#2C2416] dark:text-white mb-6">Similar Resources</h3>
                <div className="space-y-4">
                  {relatedResources.map((related) => (
                    <Link
                      key={related.id}
                      href={`/resources/${related.id}`}
                      className="group block p-4 rounded-xl md:rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-transparent hover:border-[#8B6F47]/20 transition-all hover:shadow-md"
                    >
                      <div className="font-bold text-sm md:text-base text-[#2C2416] dark:text-white group-hover:text-[#8B6F47] transition-colors break-words [overflow-wrap:anywhere]">{related.name}</div>
                      <div className="text-[10px] text-[#6B5D47] dark:text-[#B8A584] mt-1 uppercase tracking-widest font-black opacity-60">{related.category}</div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Community Section — visible to approved members and owners */}
      {(joinStatus === 'approved' || joinStatus === 'owner') && resource && (
        <div className="mt-8 bg-white dark:bg-[#1C1B18] rounded-3xl border border-[#E8E0D6] dark:border-[#3A3830] overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-[#E8E0D6] dark:border-[#3A3830] flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">Community</h2>
              <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] mt-0.5">Chat and connect with other members</p>
            </div>
            <div className="flex bg-[#F5F3F0] dark:bg-[#2A2824] rounded-xl p-1 gap-1">
              {(['chat', 'members'] as CommunityTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setCommunityTab(t)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all touch-manipulation ${
                    communityTab === t
                      ? 'bg-white dark:bg-[#1C1B18] text-[#2C2416] dark:text-[#F5F3F0] shadow-sm'
                      : 'text-[#6B5D47] dark:text-[#B8A584]'
                  }`}
                >
                  {t === 'chat' ? <MessageSquare className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  {t === 'chat' ? 'Chat' : 'Members'}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Tab */}
          {communityTab === 'chat' && (
            <div className="flex flex-col" style={{ height: 'min(500px, calc(100svh - 280px))' }}>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#8B6F47]" /></div>
                ) : announcements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#6B5D47] dark:text-[#B8A584]">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs opacity-60 mt-1">Be the first to start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {announcements.map((msg) => {
                      const isMe = msg.user_id === currentUserId
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${isMe ? 'bg-[#8B6F47]' : 'bg-[#6B5D47]'}`}>
                            {(msg.users?.name || 'U')[0].toUpperCase()}
                          </div>
                          <div className={`max-w-xs lg:max-w-md flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && <p className="text-xs font-semibold text-[#6B5D47] dark:text-[#B8A584] px-1">{msg.users?.name || 'Member'}</p>}
                            <div className={`px-3 py-2 rounded-2xl text-sm break-words [overflow-wrap:anywhere] ${isMe ? 'bg-[#8B6F47] text-white rounded-tr-sm' : 'bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] rounded-tl-sm'}`}>
                              {msg.content}
                            </div>
                            <p className="text-[10px] text-[#6B5D47]/50 px-1">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={chatBottomRef} />
                  </>
                )}
              </div>
              {/* Input */}
              <div className="p-3 border-t border-[#E8E0D6] dark:border-[#3A3830] flex items-end gap-2">
                <textarea
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMsg() } }}
                  placeholder="Say something..."
                  rows={1}
                  style={{ minHeight: '44px', fontSize: '16px' }}
                  className="flex-1 resize-none rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] px-3 py-2 text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 max-h-28 overflow-y-auto"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendChatMsg}
                  disabled={!chatMsg.trim() || chatSending}
                  className="p-3 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] disabled:opacity-40 transition-all touch-manipulation"
                >
                  {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {communityTab === 'members' && (
            <div className="p-4 max-h-[500px] overflow-y-auto space-y-3">
              {membersLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#8B6F47]" /></div>
              ) : communityMembers.length === 0 ? (
                <div className="text-center py-12 text-[#6B5D47] dark:text-[#B8A584]">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No members yet</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] font-medium mb-2">{communityMembers.length} member{communityMembers.length !== 1 ? 's' : ''}</p>
                  {communityMembers.map((m: any) => (
                    <div key={m.user_id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F3F0] dark:bg-[#2A2824]">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B6F47] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {m.name[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-[#2C2416] dark:text-[#F5F3F0] truncate">{m.name}</p>
                          {m.is_owner && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#8B6F47]/10 text-[#8B6F47] dark:text-[#D4A574]">
                              {m.role}
                            </span>
                          )}
                          {m.muted_from_chat && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              <VolumeX className="w-3 h-3" /> muted
                            </span>
                          )}
                        </div>
                      </div>
                      {m.user_id === currentUserId && (
                        <span className="text-xs text-[#8B6F47] dark:text-[#D4A574] font-semibold">You</span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Apply to Join Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowApplyModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-[#1C1B18] rounded-2xl shadow-2xl border border-[#E8E0D6] dark:border-[#3A3830] p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[#2C2416] dark:text-[#F5F3F0]">Apply to Join</h2>
                <button onClick={() => setShowApplyModal(false)} className="p-1.5 rounded-lg hover:bg-[#F5F3F0] dark:hover:bg-[#2A2824] transition-colors">
                  <X className="w-4 h-4 text-[#6B5D47]" />
                </button>
              </div>

              {applySuccess ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="font-bold text-[#2C2416] dark:text-[#F5F3F0]">Application submitted!</p>
                  <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] mt-1">The organizer will review your application.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6B5D47] dark:text-[#B8A584] mb-1">Name *</label>
                    <input
                      value={applyForm.name}
                      onChange={(e) => setApplyForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6B5D47] dark:text-[#B8A584] mb-1">Email *</label>
                    <input
                      type="email"
                      value={applyForm.email}
                      onChange={(e) => setApplyForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6B5D47] dark:text-[#B8A584] mb-1">Phone (optional)</label>
                    <input
                      value={applyForm.phone}
                      onChange={(e) => setApplyForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6B5D47] dark:text-[#B8A584] mb-1">
                      {resource.application_question || 'What relevant skills or experience do you have?'} *
                    </label>
                    <textarea
                      value={applyForm.skills_answer}
                      onChange={(e) => setApplyForm((f) => ({ ...f, skills_answer: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] bg-[#F5F3F0] dark:bg-[#2A2824] text-[#2C2416] dark:text-[#F5F3F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 resize-none"
                      placeholder="Describe your relevant experience..."
                    />
                  </div>

                  {applyError && <p className="text-xs text-red-600 dark:text-red-400">{applyError}</p>}

                  <div className="flex gap-3 pt-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleApplySubmit}
                      disabled={joinLoading}
                      className="flex-1 py-2.5 rounded-xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Submit Application
                    </motion.button>
                    <button
                      onClick={() => setShowApplyModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E8E0D6] dark:border-[#3A3830] text-[#6B5D47] dark:text-[#B8A584] font-semibold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

