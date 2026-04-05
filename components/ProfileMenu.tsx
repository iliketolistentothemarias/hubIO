'use client'

/**
 * Floating Profile Menu Component
 * 
 * Social media-style floating profile menu in the corner with:
 * - Avatar with status indicator
 * - Dropdown menu with profile options
 * - Smooth animations
 * - User info and quick actions
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Settings, LogOut, Heart, Calendar, Award, 
  HelpCircle, Sparkles, Shield
} from 'lucide-react'
import { getAuthService } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import type { User as UserType } from '@/lib/types'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function ProfileMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const auth = getAuthService()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await auth.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to load user:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getInitials = (name: string | undefined | null): string => {
    if (!name || typeof name !== 'string') {
      return 'U'
    }
    const parts = name.trim().split(' ').filter(n => n.length > 0)
    if (parts.length === 0) {
      return 'U'
    }
    if (parts.length === 1) {
      return parts[0][0].toUpperCase()
    }
    return parts
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const handleLogout = async () => {
    await auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 left-6 z-50"
      >
        <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </motion.div>
    )
  }
  if (!user) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 left-6 z-50"
      >
        <Button
          onClick={() => router.push('/login')}
          className="h-14 w-14 rounded-full bg-[#333333] dark:bg-[#f5f5f5] 
                   text-white dark:text-[#1a1a1a] shadow-md hover:shadow-lg transition-all duration-200
                   hover:scale-105 active:scale-98"
        >
          <User className="w-6 h-6" />
        </Button>
      </motion.div>
    )
  }

  const menuItems = [
    {
      icon: User,
      label: 'My Profile',
      href: '/profile',
      color: 'text-blue-600',
    },
    {
      icon: Heart,
      label: 'Favorites',
      href: '/directory?favorites=true',
      color: 'text-red-600',
    },
    {
      icon: Calendar,
      label: 'My Events',
      href: '/events',
      color: 'text-green-600',
    },
    {
      icon: Award,
      label: 'Achievements',
      href: '/dashboard',
      color: 'text-yellow-600',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
      color: 'text-gray-600',
    },
  ]

  if (user.role === 'volunteer') {
    menuItems.push({
      icon: Sparkles,
      label: 'Volunteer Dashboard',
      href: '/volunteer/dashboard',
      color: 'text-emerald-600',
    })
  }

  if (user.role === 'admin') {
    menuItems.push({
      icon: Shield,
      label: 'Admin Dashboard',
      href: '/admin',
      color: 'text-purple-600',
    })
  }

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="fixed bottom-6 left-6 z-50"
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="relative h-16 w-16 rounded-full bg-[#8B6F47] dark:bg-[#D4A574] 
                     text-white dark:text-[#1C1B18] shadow-md hover:shadow-lg transition-all duration-200
                     border-2 border-white dark:border-[#1C1B18] cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            <Avatar className="h-full w-full">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] font-bold text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Online Status Indicator */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
            />
            
            {/* Pulse Ring */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-green-500/30"
            />
          </motion.button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-80 p-2 bg-white dark:bg-[#2A2824] 
                   border border-[#E8E0D6] dark:border-[#4A4844] rounded-lg shadow-md
                   ml-4 mb-4"
          sideOffset={10}
        >
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 mb-2"
          >
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-14 w-14 ring-2 ring-primary-500">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 dark:text-white truncate">{user.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {user.role}
                  </Badge>
                  {user.karma > 0 && (
                    <Badge className="bg-[#D4A574] dark:bg-[#8B6F47] text-[#1C1B18] dark:text-white text-xs">
                      {user.karma} karma
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <DropdownMenuSeparator className="my-2" />

          {/* Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DropdownMenuItem
                    onClick={() => {
                      setIsOpen(false)
                      router.push(item.href)
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer
                             hover:bg-[#F5F3F0] dark:hover:bg-[#353330]
                             transition-all duration-200 group"
                  >
                    <div className={`p-2 rounded-md bg-[#F5F3F0] dark:bg-[#353330] 
                               group-hover:bg-[#E8E0D6] dark:group-hover:bg-[#4A4844]
                               transition-all duration-200`}
                    >
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="font-medium text-[#2C2416] dark:text-[#F5F3F0]">{item.label}</span>
                  </DropdownMenuItem>
                </motion.div>
              )
            })}
          </div>

          <DropdownMenuSeparator className="my-2" />

          {/* Footer Actions */}
          <div className="space-y-1">
            <DropdownMenuItem
              onClick={() => {
                setIsOpen(false)
                router.push('/help')
              }}
              className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">Help & Support</span>
            </DropdownMenuItem>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer
                         hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-red-600 dark:text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </DropdownMenuItem>
            </motion.div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}

