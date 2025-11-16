'use client'

/**
 * Dashboard Component - UI Showcase
 * 
 * Static UI demonstration of dashboard layout with no functionality.
 */

import { motion } from 'framer-motion'
import { 
  Search, Calendar, DollarSign, HandHeart, 
  Users, ArrowRight 
} from 'lucide-react'
import LiquidGlass from './LiquidGlass'
import Link from 'next/link'

export default function Dashboard() {
  // Static data for UI showcase
  const user = { name: 'Sarah Johnson' }

  const quickActions = [
    { icon: Search, label: 'Find Resources', href: '/directory', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
    { icon: HandHeart, label: 'Volunteer', href: '/#volunteer', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
    { icon: DollarSign, label: 'Fundraise', href: '/#fundraising', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
    { icon: Calendar, label: 'Events', href: '/#events', color: 'bg-[#8B6F47] dark:bg-[#D4A574]' },
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20">
      <div className="container-custom section-padding">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-lg text-[#6B5D47] dark:text-[#B8A584]">
            Here's what's happening in your community today.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Link href={action.href}>
                  <LiquidGlass intensity="light">
                    <div className="p-6 text-center cursor-pointer">
                      <div className={`inline-flex p-3 rounded-lg ${action.color} mb-3`}>
                        <Icon className="w-6 h-6 text-white dark:text-[#1a1a1a]" />
                      </div>
                      <div className="font-semibold text-[#2C2416] dark:text-[#F5F3F0]">{action.label}</div>
                    </div>
                  </LiquidGlass>
                </Link>
              </motion.div>
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
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <LiquidGlass intensity="light">
                    <div className="p-6 text-center">
                      <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                    </div>
                  </LiquidGlass>
                </motion.div>
              )
            })}
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Your Activity
          </h2>
          <LiquidGlass intensity="light">
            <div className="p-6">
              <div className="text-center text-gray-600 dark:text-gray-400 py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No recent activity yet. Start exploring resources and events!</p>
                <Link href="/directory" className="inline-block mt-4 text-primary-600 dark:text-primary-400 hover:underline">
                  Browse Resources
                </Link>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/directory">
              <LiquidGlass intensity="light">
                <div className="p-6 cursor-pointer hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Explore Resources
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Discover community organizations and services
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </LiquidGlass>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link href="/#community">
              <LiquidGlass intensity="light">
                <div className="p-6 cursor-pointer hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Community Board
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Connect with your neighbors and share updates
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </LiquidGlass>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
