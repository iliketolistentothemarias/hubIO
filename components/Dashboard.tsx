'use client'

import { useEffect, useState, useRef } from 'react'
import { Search, Calendar, Users, ArrowRight, Lock, Globe, Loader2, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api/client-fetch'

interface JoinedResource {
  id: string
  name: string
  category: string
  description: string
  visibility: 'public' | 'private'
  status: string
  is_owner: boolean
}

export default function Dashboard() {
  const [userName, setUserName] = useState('Community Member')
  const [stats, setStats] = useState([
    { label: 'Resources', value: 0, icon: Users, color: 'text-primary-600' },
    { label: 'Community', value: 0, icon: Calendar, color: 'text-purple-600' },
  ])
  const [joinedResources, setJoinedResources] = useState<JoinedResource[]>([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const signupsChannelRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('name, resources_count, events_count')
          .eq('id', data.user.id)
          .single()

        if (profile) {
          setUserName(profile.name || data.user.user_metadata?.name || data.user.email || 'Community Member')
          setStats([
            { label: 'Resources', value: profile.resources_count || 0, icon: Users, color: 'text-primary-600' },
            { label: 'Community', value: profile.events_count || 0, icon: Calendar, color: 'text-purple-600' },
          ])
        }

        loadJoinedResources()

        // Real-time: when user's signups change, reload
        if (signupsChannelRef.current) supabase.removeChannel(signupsChannelRef.current)
        signupsChannelRef.current = supabase
          .channel(`dashboard-signups-${data.user.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'resource_signups',
            filter: `user_id=eq.${data.user.id}`,
          }, () => { loadJoinedResources() })
          .subscribe()
      }
    })
    return () => {
      mounted = false
      if (signupsChannelRef.current) supabase.removeChannel(signupsChannelRef.current)
    }
  }, [])

  const loadJoinedResources = async () => {
    setResourcesLoading(true)
    try {
      const res = await apiFetch('/api/resources/joined')
      const json = await res.json()
      if (json.success) setJoinedResources(json.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setResourcesLoading(false)
    }
  }

  const quickActions = [
    { icon: Search, label: 'Browse Resources', href: '/directory', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
  ]

  const cardBase =
    'bg-white/80 dark:bg-[#1f1b28]/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-[#2c2c3e] p-4 md:p-6 text-center hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-150'

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-16 md:pt-20 transition-colors duration-300">
      <div className="container-custom px-4 py-8 md:py-24">
        {/* Welcome Section */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-2">
            Hello, {userName}!
          </h1>
          <p className="text-base md:text-lg text-[#6B5D47] dark:text-[#B8A584]">
            Here's what's happening in your community today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="max-w-md mb-12">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link key={index} href={action.href} prefetch={true}>
                <div className={`${cardBase} cursor-pointer hover:-translate-y-1 min-h-[80px] flex flex-col items-center justify-center`}>
                  <div className={`inline-flex p-3 rounded-lg ${action.color} mb-3`}>
                    <Icon className="w-6 h-6 text-white dark:text-[#1C1B18]" />
                  </div>
                  <div className="font-semibold text-[#2C2416] dark:text-[#F5F3F0] text-sm md:text-base">{action.label}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className={`${cardBase}`}>
                <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">{stat.value}</div>
                <div className="text-sm text-[#6B5D47] dark:text-[#B8A584]">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Your Community (joined resources / events) */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">Your Community</h2>
            <Link href="/directory" className="text-sm text-[#8B6F47] dark:text-[#D4A574] hover:underline flex items-center gap-1">
              Browse all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {resourcesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#8B6F47]" />
            </div>
          ) : joinedResources.length === 0 ? (
            <div className={`${cardBase}`}>
              <div className="text-center text-[#6B5D47] dark:text-[#B8A584] py-6">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold mb-2">You haven't joined any resources yet</p>
                <Link href="/directory" className="text-sm text-[#8B6F47] dark:text-[#D4A574] hover:underline">
                  Explore the directory
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {joinedResources.map((res, i) => (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/resources/${res.id}`}>
                    <div className="bg-white dark:bg-[#1C1B18] rounded-2xl border border-[#E8E0D6] dark:border-[#3A3830] p-4 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#8B6F47]/10 text-[#8B6F47] dark:text-[#D4A574]">
                          {res.category}
                        </span>
                        <span className={`flex items-center gap-1 text-xs font-semibold ${
                          res.visibility === 'private'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {res.visibility === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          {res.visibility}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-2 break-words [overflow-wrap:anywhere]">{res.name}</h3>
                      <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] mb-3 break-words [overflow-wrap:anywhere]">{res.description}</p>
                      <div className="flex items-center gap-2">
                        {res.is_owner ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#8B6F47]/10 text-[#8B6F47] dark:text-[#D4A574] font-semibold">
                            Owner
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">
                            Member
                          </span>
                        )}
                        <span className="text-xs text-[#6B5D47]/60 dark:text-[#B8A584]/60 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Community →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
