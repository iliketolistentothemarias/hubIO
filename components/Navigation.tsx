'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Heart, Moon, Sun, Star, ChevronDown, User, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { supabase } from '@/lib/supabase/client'
import Notifications from '@/components/Notifications'
import { oauthProfileImageUrl } from '@/lib/utils/auth-avatar'

export default function Navigation() {
  const [portalReady, setPortalReady] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMenuEnter = (label: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setOpenDropdown(label)
  }

  const handleMenuLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 120)
  }

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    setPortalReady(true)
  }, [])
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { favorites } = useFavorites()
  const displayName = user?.name ? user.name.replace(/\s+/g, ' ').trim().replace(/\s+/g, ' ') : ''

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open to prevent background scrolling glitch
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isOpen])

  // Close dropdown on click-outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
    setMobileExpanded(null)
  }, [pathname])

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
        avatar:
          (typeof profileData?.avatar === 'string' && profileData.avatar.trim()) ||
          oauthProfileImageUrl(data.user.user_metadata),
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
      { href: '/messages', label: 'Messages' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/analytics', label: 'Analytics' },
      {
        label: 'Submit',
        submenu: [
          { href: '/submit', label: 'Resource' },
          { href: '/submit/business', label: 'Business' },
          { href: '/submit/grant', label: 'Grant' },
        ]
      },
      { href: '/about', label: 'About' },
      { href: '/references', label: 'References' },
    ]

  return (
    <>
    <nav
      className={`fixed top-0 left-0 right-0 z-[50002] overflow-visible transition-all duration-200 [padding-top:env(safe-area-inset-top,0px)] md:-translate-y-1 ${scrolled
          ? 'bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-[#e0e0e0] dark:border-[#404040] shadow-sm'
          : 'bg-transparent'
        }`}
    >
      <div className="mx-auto w-full max-w-[100rem] px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
        <div className="flex min-h-[3.5rem] md:min-h-[4.25rem] w-full box-border items-center justify-between gap-2 py-0.5 md:py-1 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:justify-items-stretch md:gap-x-1 lg:gap-x-2">
          {/* Logo — nudged toward viewport left */}
          <div className="flex shrink-0 items-center md:-ml-1 lg:-ml-2">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group w-fit py-0.5 pr-0.5 md:pr-1">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="flex shrink-0"
              >
                <Heart className="h-7 w-7 text-[#8B6F47] dark:text-[#D4A574] md:h-8 md:w-8" />
              </motion.div>
              <span className="font-display text-xl font-bold leading-tight text-[#2C2416] dark:text-[#F5F3F0] whitespace-nowrap md:text-2xl">
                Communify
              </span>
            </Link>
          </div>

          {/* Desktop nav — modest gap + horizontal padding on each item */}
          <div className="hidden min-w-0 w-full md:flex md:justify-center md:px-0.5 lg:px-1">
            <div
              className="flex w-auto max-w-full min-w-0 flex-nowrap items-center justify-center gap-1.5 py-1 md:gap-2 lg:gap-2.5 xl:gap-3"
              ref={dropdownRef}
            >
            {navItems.map((item, index) => (
              <motion.div
                key={item.href || item.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
                className="relative shrink-0"
                onMouseLeave={item.submenu ? handleMenuLeave : undefined}
              >
                {item.submenu ? (
                  <button
                    onMouseEnter={() => handleMenuEnter(item.label)}
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                    className={`relative flex items-center gap-0.5 rounded-md px-1 py-1.5 text-sm font-medium tracking-tight whitespace-nowrap transition-all duration-200 md:px-1.5 md:py-2 lg:px-2 lg:text-base hover:bg-[#2C2416]/5 dark:hover:bg-[#F5F3F0]/10 ${item.submenu.some(sub => pathname === sub.href)
                        ? 'text-[#2C2416] dark:text-[#F5F3F0]'
                        : 'text-[#6B5D47] dark:text-[#B8A584] hover:text-[#8B6F47] dark:hover:text-[#D4A574]'
                      }`}
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      {item.label}
                    </motion.span>
                    <motion.div
                      animate={{ rotate: openDropdown === item.label ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4 shrink-0 lg:h-[1.125rem] lg:w-[1.125rem]" />
                    </motion.div>
                  </button>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={`relative flex items-center gap-0.5 rounded-md px-1 py-1.5 text-sm font-medium tracking-tight whitespace-nowrap transition-all duration-200 md:px-1.5 md:py-2 lg:px-2 lg:text-base hover:bg-[#2C2416]/5 dark:hover:bg-[#F5F3F0]/10 ${pathname === item.href
                        ? 'text-[#2C2416] dark:text-[#F5F3F0]'
                        : 'text-[#6B5D47] dark:text-[#B8A584] hover:text-[#8B6F47] dark:hover:text-[#D4A574]'
                      }`}
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      {item.label}
                    </motion.span>
                    {pathname === item.href && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-[#8B6F47] dark:bg-[#D4A574] md:left-1.5 md:right-1.5 lg:left-2 lg:right-2"
                        initial={false}
                      />
                    )}
                  </Link>
                ) : null}
                <AnimatePresence>
                  {item.submenu && openDropdown === item.label && (
                    <div className="absolute top-full left-0 w-48 pt-2">
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.15, type: 'spring', stiffness: 300 }}
                        className="bg-white dark:bg-[#2A2824] rounded-lg shadow-md border border-[#E8E0D6] dark:border-[#4A4844] overflow-hidden"
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
                              onClick={() => setOpenDropdown(null)}
                              className={`block px-4 py-3 text-sm transition-all duration-200 ${pathname === subItem.href
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
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
            </div>
          </div>

          {/* Right — nudged toward viewport edge */}
          <div className="hidden shrink-0 items-center justify-end gap-1.5 md:flex md:gap-2 md:pl-1 lg:gap-2 lg:pl-2 md:-mr-1 lg:-mr-2">
            {/* Favorites Badge */}
            <Link
              href="/directory?favorites=true"
              className="relative shrink-0 p-1.5 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors md:p-2"
            >
              <Star className="h-4 w-4 md:h-5 md:w-5" />
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
              className="rounded-lg border border-[#E8E0D6] bg-white p-2 text-[#6B5D47] shadow-sm transition-all duration-200 hover:bg-[#F5F3F0] hover:shadow-md dark:border-[#4A4844] dark:bg-[#2A2824] dark:text-[#B8A584] dark:hover:bg-[#353330] md:p-2.5"
              aria-label="Toggle theme"
            >
              <motion.div
                animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 md:h-5 md:w-5" />
                ) : (
                  <Moon className="h-4 w-4 md:h-5 md:w-5" />
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
                  className="flex min-w-0 max-w-[11rem] items-center gap-2 rounded-lg bg-[#8B6F47] px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-[#6B5D47] hover:shadow-md dark:bg-[#D4A574] dark:hover:bg-[#B8A584] sm:max-w-[13rem] lg:max-w-[15rem] lg:px-4 lg:text-base"
                >
                  <User className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" />
                  <span className="min-w-0 flex-1 truncate text-left">{displayName || user.email}</span>
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
                          {user.role === 'organizer' ? 'Community Organizer' : user.role === 'admin' ? 'Admin' : 'Volunteer'}
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
                      {(user.role === 'organizer' || user.role === 'admin') && (
                        <Link
                          href="/organizer"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-3 text-sm text-[#6B5D47] dark:text-[#B8A584] hover:bg-[#F5F3F0] dark:hover:bg-[#353330] transition-colors"
                        >
                          Organizer Panel
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
                    className="rounded-lg px-3 py-2 text-sm font-medium text-[#6B5D47] transition-all duration-200 hover:bg-[#F5F3F0] dark:text-[#B8A584] dark:hover:bg-[#353330] md:px-3.5 lg:px-4 lg:text-base"
                  >
                    Login
                  </motion.button>
                </Link>
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center rounded-lg bg-[#8B6F47] px-3 py-2 text-sm font-medium whitespace-nowrap text-white shadow-sm transition-all duration-200 hover:bg-[#6B5D47] hover:shadow-md dark:bg-[#D4A574] dark:hover:bg-[#B8A584] md:px-3.5 lg:px-4 lg:text-base"
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

    </nav>

      {/* Mobile menu: portal to body so it is never trapped under page stacking contexts (e.g. motion transforms) */}
      {portalReady &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  key="mobile-menu-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="md:hidden fixed inset-0 bg-black/50 dark:bg-black/60 z-[50000]"
                  style={{ touchAction: 'none' }}
                />
                <motion.div
                  key="mobile-menu-panel"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="md:hidden fixed right-0 bottom-0 w-[280px] max-w-[85vw] bg-white dark:bg-[#1a1a1a] z-[50001] shadow-2xl overflow-y-auto overscroll-contain [top:calc(env(safe-area-inset-top,0px)+3.5rem)]"
                >
              <div className="p-6 space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0]">Menu</span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-3 rounded-xl bg-gray-100 dark:bg-[#2A2824] text-[#6B5D47] dark:text-[#B8A584]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const key = item.href || item.label
                    const isExpanded = mobileExpanded === key
                    if (item.submenu) {
                      const anyActive = item.submenu.some(s => pathname === s.href)
                      return (
                        <div key={key}>
                          <button
                            onClick={() => setMobileExpanded(isExpanded ? null : key)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium transition-all ${
                              anyActive
                                ? 'bg-[#8B6F47]/10 dark:bg-[#D4A574]/10 text-[#8B6F47] dark:text-[#D4A574]'
                                : 'text-[#6B5D47] dark:text-[#B8A584] active:bg-gray-100 dark:active:bg-[#2c2c3e]'
                            }`}
                          >
                            <span>{item.label}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                key="submenu"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 pt-1 pb-1 space-y-0.5">
                                  {item.submenu.map((subItem) => (
                                    <Link
                                      key={subItem.href}
                                      href={subItem.href}
                                      onClick={() => { setIsOpen(false); setMobileExpanded(null) }}
                                      className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${pathname === subItem.href
                                        ? 'bg-[#8B6F47]/10 dark:bg-[#D4A574]/10 text-[#8B6F47] dark:text-[#D4A574]'
                                        : 'text-[#6B5D47] dark:text-[#B8A584] active:bg-gray-100 dark:active:bg-[#2c2c3e]'
                                      }`}
                                    >
                                      {subItem.label}
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    }
                    return item.href ? (
                      <Link
                        key={key}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${pathname === item.href
                          ? 'bg-[#8B6F47]/10 dark:bg-[#D4A574]/10 text-[#8B6F47] dark:text-[#D4A574]'
                          : 'text-[#6B5D47] dark:text-[#B8A584] active:bg-gray-100 dark:active:bg-[#2c2c3e]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ) : null
                  })}
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#f5ede1] text-[#6B5D47] dark:bg-[#3b352c] dark:text-[#D4A574] mt-1">
                          {user.role === 'organizer' ? 'Community Organizer' : user.role === 'admin' ? 'Admin' : 'Volunteer'}
                        </span>
                      </div>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-[#6B5D47] dark:text-[#B8A584]"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      {(user.role === 'organizer' || user.role === 'admin') && (
                        <Link
                          href="/organizer"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-[#6B5D47] dark:text-[#B8A584]"
                        >
                          Organizer Panel
                        </Link>
                      )}
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
          </AnimatePresence>,
          document.body
        )}

    </>
  )
}

