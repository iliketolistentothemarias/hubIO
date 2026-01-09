'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Heart, Moon, Sun, Star, ChevronDown, User, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { supabase } from '@/lib/supabase/client'
import Notifications from '@/components/Notifications'

// All routes to prefetch for instant navigation
const ALL_ROUTES = [
  '/',
  '/directory',
  '/highlights',
  '/business',
  '/grants',
  '/events',
  '/projects',
  '/volunteer/dashboard',
  '/news',
  '/dashboard',
  '/analytics',
  '/submit',
  '/about',
  '/login',
  '/signup',
]
export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { favorites } = useFavorites()
  const displayName = user?.name ? user.name.replace(/\s+/g, ' ').trim().replace(/\s+/g, ' ') : ''

  // Prefetch all routes on mount for instant navigation
  useEffect(() => {
    // Delay prefetching slightly to not block initial render
    const timer = setTimeout(() => {
      ALL_ROUTES.forEach(route => {
        router.prefetch(route)
      })
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [router])
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        setUser(null)
        return
      }

      const { data: profileData } = await supabase
        .from('users')
        .select('name, role, avatar')
        .eq('id', data.user.id)
        .single()

      setUser({
        id: data.user.id,
        email: data.user.email || '',
        name: profileData?.name || (data.user.user_metadata?.name as string) || data.user.email?.split('@')[0] || 'Member',
        role: profileData?.role || data.user.user_metadata?.role || 'volunteer',
        avatar: profileData?.avatar || data.user.user_metadata?.avatar_url,
      })
    }

    loadUser()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null)
      } else {
        loadUser()
      }
    })

    return () => listener?.subscription.unsubscribe()
  }, [pathname])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('remember_me')
      }
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navItems: Array<{
    href?: string
    label: string
    submenu?: Array<{ href: string; label: string }>
  }> = [
    { href: '/', label: 'Home' },
    { 
      label: 'Resources',
      submenu: [
        { href: '/directory', label: 'All Resources' },
        { href: '/highlights', label: 'Featured' },
        { href: '/business', label: 'Businesses' },
        { href: '/grants', label: 'Grants' },
      ]
    },
    { href: '/events', label: 'Events' },
    { href: '/messages', label: 'Messages' },
    { href: '/dashboard', label: 'Dashboard' },
    { 
      href: '/analytics', 
      label: 'Analytics',
    },
    { href: '/submit', label: 'Submit' },
    { href: '/about', label: 'About' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-[#e0e0e0] dark:border-[#404040] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-6 h-16 md:h-20 mx-auto w-full">
          {/* Logo */}
          <div className="pr-8 flex items-center">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Heart className="w-8 h-8 text-[#8B6F47] dark:text-[#D4A574]" />
              </motion.div>
              <span className="text-2xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                Communify
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-6 justify-center">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href || item.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
                className="relative"
                onMouseEnter={() => item.submenu && setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.submenu ? (
                  <button
                    className={`relative font-medium transition-all duration-200 flex items-center gap-1 ${
                      item.submenu.some(sub => pathname === sub.href)
                        ? 'text-[#2C2416] dark:text-[#F5F3F0]'
                        : 'text-[#6B5D47] dark:text-[#B8A584] hover:text-[#8B6F47] dark:hover:text-[#D4A574]'
                    }`}
                  >
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      {item.label}
                    </motion.span>
                    <motion.div
                      animate={{ rotate: openDropdown === item.label ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={`relative font-medium transition-all duration-200 flex items-center gap-1 ${
                      pathname === item.href
                        ? 'text-[#2C2416] dark:text-[#F5F3F0]'
                        : 'text-[#6B5D47] dark:text-[#B8A584] hover:text-[#8B6F47] dark:hover:text-[#D4A574]'
                    }`}
                  >
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      {item.label}
                    </motion.span>
                    {pathname === item.href && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#8B6F47] dark:bg-[#D4A574]"
                        initial={false}
                      />
                    )}
                  </Link>
                ) : null}
                    <AnimatePresence>
                      {item.submenu && openDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#2A2824] rounded-lg shadow-md border border-[#E8E0D6] dark:border-[#4A4844] overflow-hidden"
                        >
                          {item.submenu.map((subItem, subIndex) => (
                            <motion.div
                              key={subItem.href}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: subIndex * 0.05 }}
                            >
                              <Link
                                href={subItem.href}
                              className={`block px-4 py-3 text-sm transition-all duration-200 ${
                                pathname === subItem.href
                                  ? 'bg-[#F5F3F0] dark:bg-[#353330] text-[#2C2416] dark:text-[#F5F3F0]'
                                  : 'text-[#6B5D47] dark:text-[#B8A584] hover:bg-[#F5F3F0] dark:hover:bg-[#353330]'
                              }`}
                              >
                                <motion.span
                                  whileHover={{ x: 5 }}
                                  className="flex items-center gap-2"
                                >
                                  {subItem.label}
                                  {pathname === subItem.href && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full"
                                    />
                                  )}
                                </motion.span>
                              </Link>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Right Side - Utilities */}
          <div className="hidden md:flex items-center gap-4 justify-end pl-8">
            {/* Favorites Badge */}
            <Link
              href="/directory?favorites=true"
              className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Star className="w-5 h-5" />
              {favorites.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary-600 dark:bg-primary-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {favorites.length}
                </motion.span>
              )}
            </Link>

            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2.5 rounded-lg bg-white dark:bg-[#2A2824] text-[#6B5D47] dark:text-[#B8A584] 
                         hover:bg-[#F5F3F0] dark:hover:bg-[#353330] transition-all duration-200
                         shadow-sm hover:shadow-md border border-[#E8E0D6] dark:border-[#4A4844]"
              aria-label="Toggle theme"
            >
              <motion.div
                animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.div>
            </motion.button>
            <Notifications />

            {/* Auth Buttons */}
            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B6F47] dark:bg-[#D4A574] text-white 
                           hover:bg-[#6B5D47] dark:hover:bg-[#B8A584] transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <User className="w-4 h-4" />
                      <span className="font-medium truncate">{displayName || user.email}</span>
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#2A2824] rounded-lg shadow-lg border border-[#E8E0D6] dark:border-[#4A4844] overflow-hidden"
                    >
                      <div className="p-3 border-b border-[#E8E0D6] dark:border-[#4A4844]">
                        <p className="text-sm font-medium text-[#2C2416] dark:text-[#F5F3F0]">{displayName || user.email}</p>
                        <p className="text-xs text-[#6B5D47] dark:text-[#B8A584]">{user.email}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#f5ede1] text-[#6B5D47] dark:bg-[#3b352c] dark:text-[#D4A574]">
                          Role: {user.role}
                        </span>
                      </div>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm text-[#6B5D47] dark:text-[#B8A584] hover:bg-[#F5F3F0] dark:hover:bg-[#353330] transition-colors"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                      <Link
                        href="/submit"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm text-[#6B5D47] dark:text-[#B8A584] hover:bg-[#F5F3F0] dark:hover:bg-[#353330] transition-colors"
                      >
                        Submit Resource
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          handleLogout()
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-[#F5F3F0] dark:hover:bg-[#353330] transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-lg text-[#6B5D47] dark:text-[#B8A584] hover:bg-[#F5F3F0] dark:hover:bg-[#353330] transition-all duration-200 font-medium"
                  >
                    Login
                  </motion.button>
                </Link>
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                      className="px-5 py-2 rounded-lg bg-[#8B6F47] dark:bg-[#D4A574] text-white hover:bg-[#6B5D47] dark:hover:bg-[#B8A584] transition-all duration-200 shadow-sm hover:shadow-md font-medium whitespace-nowrap flex items-center justify-center min-w-[190px]"
                  >
                          <span className="whitespace-nowrap">Sign Up</span>
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white dark:bg-[#2A2824] text-[#6B5D47] dark:text-[#B8A584] 
                         border border-[#E8E0D6] dark:border-[#4A4844] shadow-sm active:scale-95 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Notifications />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl bg-white dark:bg-[#2A2824] text-[#6B5D47] dark:text-[#B8A584] 
                         border border-[#E8E0D6] dark:border-[#4A4844] shadow-sm active:scale-95 transition-all"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-[#1a1a1a] z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6 space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0]">Menu</span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-[#2A2824] text-[#6B5D47] dark:text-[#B8A584]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-2">
                  {navItems.map((item) => (
                    <div key={item.href || item.label} className="py-1">
                      {item.submenu ? (
                        <div className="space-y-2">
                          <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-[#8B6F47] dark:text-[#D4A574] opacity-60">
                            {item.label}
                          </div>
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
                                pathname === subItem.href
                                  ? 'bg-[#8B6F47]/10 dark:bg-[#D4A574]/10 text-[#8B6F47] dark:text-[#D4A574]'
                                  : 'text-[#6B5D47] dark:text-[#B8A584] active:bg-gray-100 dark:active:bg-[#2c2c3e]'
                              }`}
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      ) : item.href ? (
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
                            pathname === item.href
                              ? 'bg-[#8B6F47]/10 dark:bg-[#D4A574]/10 text-[#8B6F47] dark:text-[#D4A574]'
                              : 'text-[#6B5D47] dark:text-[#B8A584] active:bg-gray-100 dark:active:bg-[#2c2c3e]'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-[#2c2c3e]">
                  <Link
                    href="/directory?favorites=true"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-[#6B5D47] dark:text-[#B8A584]"
                  >
                    <Star className="w-5 h-5" />
                    Favorites
                    {favorites.length > 0 && (
                      <span className="ml-auto bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {favorites.length}
                      </span>
                    )}
                  </Link>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-[#2c2c3e]">
                  {user ? (
                    <div className="space-y-4">
                      <div className="px-4">
                        <p className="font-bold text-[#2C2416] dark:text-[#F5F3F0]">{displayName || user.email}</p>
                        <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-500 bg-red-50 dark:bg-red-500/10 transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 px-2">
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <button className="w-full py-3 rounded-2xl font-bold text-[#8B6F47] dark:text-[#D4A574] border-2 border-[#8B6F47] dark:border-[#D4A574]">
                          Login
                        </button>
                      </Link>
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        <button className="w-full py-3 rounded-2xl font-bold bg-[#8B6F47] dark:bg-[#D4A574] text-white">
                          Join
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}

