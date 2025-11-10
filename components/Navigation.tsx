'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Heart, Moon, Sun, Star, Search, ChevronDown, LogIn, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { getAuthService } from '@/lib/auth'
import Notifications from '@/components/Notifications'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { favorites } = useFavorites()

  useEffect(() => {
    const checkAuth = async () => {
      const auth = getAuthService()
      const authenticated = await auth.isAuthenticated()
      setIsAuthenticated(authenticated)
    }
    checkAuth()
  }, [pathname]) // Re-check when route changes

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems: Array<{
    href: string
    label: string
    submenu?: Array<{ href: string; label: string }>
  }> = [
    { href: '/', label: 'Home' },
    { 
      href: '/directory', 
      label: 'Resources',
      submenu: [
        { href: '/directory', label: 'All Resources' },
        { href: '/highlights', label: 'Featured' },
        { href: '/business', label: 'Businesses' },
        { href: '/grants', label: 'Grants' },
      ]
    },
    { 
      href: '/events', 
      label: 'Events',
      submenu: [
        { href: '/events', label: 'All Events' },
        { href: '/projects', label: 'Projects' },
        { href: '/news', label: 'News' },
      ]
    },
    { href: '/dashboard', label: 'Dashboard' },
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
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Heart className="w-8 h-8 text-[#8B6F47] dark:text-[#D4A574]" />
            </motion.div>
            <span className="text-2xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0]">
              Hub<span className="text-[#8B6F47] dark:text-[#D4A574]">IO</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
                onMouseEnter={() => item.submenu && setOpenDropdown(item.href)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                    <Link
                      href={item.href}
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
                      {item.submenu && (
                        <motion.div
                          animate={{ rotate: openDropdown === item.href ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      )}
                      {pathname === item.href && !item.submenu && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#8B6F47] dark:bg-[#D4A574]"
                          initial={false}
                        />
                      )}
                    </Link>
                    <AnimatePresence>
                      {item.submenu && openDropdown === item.href && (
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

            {/* Auth Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                             hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </motion.button>
                </Link>
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white 
                             bg-[#8B6F47] dark:bg-[#D4A574] rounded-lg hover:bg-[#7A5F3A] dark:hover:bg-[#C49564] 
                             transition-all shadow-sm hover:shadow-md"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </motion.button>
                </Link>
              </div>
            ) : null}

            {/* Notifications */}
            {isAuthenticated && <Notifications />}

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
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-700 dark:text-gray-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-700 dark:text-gray-300"
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
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50"
            style={{
              backdropFilter: 'saturate(180%) blur(20px)',
              WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            }}
          >
            <div className="container-custom px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block py-2 font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    {item.label}
                  </Link>
                  {item.submenu && (
                    <div className="pl-4 space-y-2 mt-2">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setIsOpen(false)}
                          className={`block py-1 text-sm transition-colors ${
                            pathname === subItem.href
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Link
                href="/directory?favorites=true"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 py-2 font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Star className="w-5 h-5" />
                Favorites
                {favorites.length > 0 && (
                  <span className="bg-primary-600 dark:bg-primary-400 text-white text-xs rounded-full px-2 py-0.5">
                    {favorites.length}
                  </span>
                )}
              </Link>
              
              {/* Mobile Auth Buttons */}
              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 py-2 px-4 font-medium text-gray-700 dark:text-gray-300 
                             hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg
                             hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 py-2 px-4 font-medium text-white 
                             bg-[#8B6F47] dark:bg-[#D4A574] rounded-lg hover:bg-[#7A5F3A] dark:hover:bg-[#C49564] 
                             transition-all shadow-sm hover:shadow-md"
                  >
                    <UserPlus className="w-5 h-5" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

