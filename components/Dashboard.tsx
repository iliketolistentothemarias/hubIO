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

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return
      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('name')
          .eq('id', data.user.id)
          .single()
        setUserName(profile?.name || data.user.user_metadata?.name || data.user.email || 'Community Member')
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const quickActions = [
    { icon: Search, label: 'Find Resources', href: '/directory', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
    { icon: HandHeart, label: 'Volunteer', href: '/#volunteer', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
    { icon: DollarSign, label: 'Fundraise', href: '/#fundraising', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
    { icon: Calendar, label: 'Events', href: '/#events', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
  ]

  const sectionClass = 'bg-[#0B0A0F] text-white'
  const cardBase =
    'backdrop-blur-sm rounded-2xl border border-[#2c2c3e] p-6 text-center hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-150'

  return (
    <div className="min-h-screen bg-[#0B0A0F] pt-20 text-white">
      <div className="container-custom section-padding">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
            Hello, {userName}!
          </h1>
          <p className="text-lg text-white/70">
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
                    <Icon className="w-6 h-6 text-white dark:text-[#1a1a1a]" />
                  </div>
                  <div className="font-semibold text-white">{action.label}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Resources', value: 250, icon: Users, color: 'text-primary-600' },
            { label: 'Volunteers', value: 150, icon: Users, color: 'text-green-600' },
            { label: 'Funds Raised', value: '$50K', icon: DollarSign, color: 'text-yellow-600' },
            { label: 'Events', value: 30, icon: Calendar, color: 'text-purple-600' },
          ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className={`${cardBase}`}>
                  <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              )
            })}
        </div>

        {/* Recent Activity */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            Your Activity
          </h2>
          <div className={`${cardBase}`}>
            <div className="text-center text-white/70 py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No recent activity yet. Start exploring resources and events!</p>
              <Link href="/directory" prefetch={true} className="inline-block mt-4 text-primary-600 hover:underline">
                Browse Resources
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/directory" prefetch={true}>
            <div className={`${cardBase} cursor-pointer hover:bg-primary-900/10`}>
              <div className="flex items-center justify-between">
                <div>
                <h3 className="text-xl font-bold text-white mb-2">
                    Explore Resources
                  </h3>
                <p className="text-white/70">
                    Discover community organizations and services
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Link>

          <Link href="/#community" prefetch={true}>
            <div className={`${cardBase} cursor-pointer hover:bg-primary-900/10`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Community Board
                  </h3>
                  <p className="text-white/70">
                    Connect with your neighbors and share updates
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
