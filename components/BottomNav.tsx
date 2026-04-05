'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, MessageSquare, LayoutDashboard, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function BottomNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 80) { // Scrolling down
          setIsVisible(false)
        } else { // Scrolling up
          setIsVisible(true)
        }
        setLastScrollY(window.scrollY)
      }
    }

    window.addEventListener('scroll', controlNavbar)
    return () => window.removeEventListener('scroll', controlNavbar)
  }, [lastScrollY])

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/directory', label: 'Explore', icon: Search },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/dashboard', label: 'Profile', icon: LayoutDashboard },
  ]

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
    >
      <div className="bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl border border-[#e0e0e0] dark:border-[#404040] rounded-2xl shadow-2xl flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 p-2 min-w-[64px]"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-[#8B6F47]/10 dark:bg-[#D4A574]/10 rounded-xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon
                className={`w-6 h-6 transition-colors duration-200 ${
                  isActive
                    ? 'text-[#8B6F47] dark:text-[#D4A574]'
                    : 'text-[#6B5D47] dark:text-[#B8A584]'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-[#8B6F47] dark:text-[#D4A574]'
                    : 'text-[#6B5D47] dark:text-[#B8A584]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </motion.div>
  )
}
