'use client'

/**
 * Dashboard Component - UI Showcase
 * 
 * Static UI demonstration of dashboard layout with no functionality.
 * OPTIMIZED: No animations for instant rendering
 */

import { useEffect, useState } from 'react'
import { Search, Calendar, DollarSign, HandHeart, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function Dashboard() {
  const [userName, setUserName] = useState('Community Member')
  const [stats, setStats] = useState([
    { label: 'Resources', value: 0, icon: Users, color: 'text-primary-600' },
    { label: 'Volunteers', value: 0, icon: Users, color: 'text-green-600' },
    { label: 'Events', value: 0, icon: Calendar, color: 'text-purple-600' },
  ])

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
            { label: 'Events', value: profile.events_count || 0, icon: Calendar, color: 'text-purple-600' },
          ])
        }
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const quickActions = [
    { icon: Search, label: 'Find Resources', href: '/directory', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
    { icon: Calendar, label: 'Events', href: '/events', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link key={index} href={action.href} prefetch={true}>
                <div className={`${cardBase} cursor-pointer hover:-translate-y-1`}>
                  <div className={`inline-flex p-3 rounded-lg ${action.color} mb-3`}>
                    <Icon className="w-6 h-6 text-white dark:text-[#1C1B18]" />
                  </div>
                  <div className="font-semibold text-[#2C2416] dark:text-[#F5F3F0]">{action.label}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
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

        {/* Recent Activity */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-6">
            Your Activity
          </h2>
          <div className={`${cardBase}`}>
            <div className="text-center text-[#6B5D47] dark:text-[#B8A584] py-8">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity yet. Start exploring resources and events!</p>
              <Link href="/directory" prefetch={true} className="inline-block mt-4 text-[#8B6F47] dark:text-[#D4A574] hover:underline">
                Browse Resources
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/directory" prefetch={true}>
            <div className={`${cardBase} cursor-pointer hover:bg-gray-50 dark:hover:bg-primary-900/10`}>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-xl font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-2">
                    Explore Resources
                  </h3>
                  <p className="text-[#6B5D47] dark:text-[#B8A584]">
                    Discover community organizations and services
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-[#8B6F47] dark:text-[#D4A574]" />
              </div>
            </div>
          </Link>

          <Link href="/#events" prefetch={true}>
            <div className={`${cardBase} cursor-pointer hover:bg-gray-50 dark:hover:bg-primary-900/10`}>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-xl font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-2">
                    Join Events
                  </h3>
                  <p className="text-[#6B5D47] dark:text-[#B8A584]">
                    Participate in local community gatherings and activities
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-[#8B6F47] dark:text-[#D4A574]" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
