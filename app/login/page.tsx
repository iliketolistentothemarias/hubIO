'use client'

/**
 * Login Page
 * 
 * User authentication page with email/password options.
 */

import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, ArrowRight, Eye, EyeOff, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import LiquidGlass from '@/components/LiquidGlass'
import Link from 'next/link'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setError('')
    setIsLoading(true)

    try {
      console.log('Attempting login...')

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Provide more helpful error messages
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          setError('Network error: Unable to connect to the server. Please check your internet connection and try again.')
        } else if (error.message?.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (error.message?.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in. Check your inbox for a confirmation email.')
        } else {
          setError(error.message || 'Failed to sign in. Please try again.')
        }
        setIsLoading(false)
        return
      }

      // Determine redirect URL
      const urlParams = new URLSearchParams(window.location.search)
      const redirectParam = urlParams.get('redirect')
      const redirectUrl = redirectParam || sessionStorage.getItem('redirectAfterLogin')

      if (rememberMe) {
        localStorage.setItem('remember_me', 'true')
      } else {
        localStorage.removeItem('remember_me')
      }

      let finalRedirect = '/'

      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin')
        sessionStorage.removeItem('pendingAction')
        finalRedirect = redirectUrl
      }

      setIsLoading(false)
      router.push(finalRedirect)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-white to-[#f5ede1]/30 
                    dark:from-[#0B0A0F] dark:via-[#1F1B28] dark:to-[#0B0A0F] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <LiquidGlass intensity="strong">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-2">
                Welcome Back
              </h1>
              <p className="text-[#6B5D47] dark:text-[#B8A584]">
                Sign in to access your community hub
              </p>
              {message && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 
                               rounded-2xl text-blue-600 dark:text-blue-400 text-sm">
                  {message}
                </div>
              )}
            </div>

            {/* Test Credentials Section */}
            <div className="mb-8 p-4 rounded-2xl bg-[#F5F3F0]/50 dark:bg-white/5 border border-[#E8E0D6] dark:border-white/10">
              <div className="flex items-center gap-2 mb-3 text-[#8B6F47] dark:text-[#D4A574]">
                <Info className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-display">TSA Judges Demo Start Here</h3>
              </div>

              <div className="space-y-4 text-sm text-[#6B5D47] dark:text-[#B8A584]">
                <div className="text-xs space-y-2 border-b border-[#E8E0D6] dark:border-white/10 pb-3 mb-2 leading-relaxed text-[#6B5D47] dark:text-[#B8A584]">
                  <p>
                    <strong>Communify</strong> is a platform built to empower local communities. It bridges resource gaps by connecting residents with food banks, housing programs, legal aid, and more.
                  </p>
                  <p>
                    Choose a role below to explore the application:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Volunteer (Regular)</strong>: Browse the resource map/directory, message organizers, and join local programs.</li>
                    <li><strong>Organizer</strong>: Create and manage resource listings, manage volunteer applications, and post announcements.</li>
                    <li><strong>Admin</strong>: Access the admin panel dashboard, view system-wide analytics, and audit new resource submissions.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium mb-2 text-xs opacity-80">Click any account below to auto-fill credentials:</p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('testuser1@gmail.com')
                        setPassword('testuser1')
                      }}
                      className="w-full text-left grid grid-cols-[100px_1fr_auto] items-center gap-2 p-2 rounded-xl border border-transparent hover:border-[#8B6F47]/20 hover:bg-[#8B6F47]/5 dark:hover:bg-[#D4A574]/5 transition-all text-[#6B5D47] dark:text-[#B8A584]"
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-center truncate">Volunteer</span>
                      <span className="text-[#2C2416] dark:text-[#F5F3F0] text-xs truncate">testuser1@gmail.com</span>
                      <span className="opacity-60 text-xs font-mono">testuser1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail('testuser2@gmail.com')
                        setPassword('testuser2')
                      }}
                      className="w-full text-left grid grid-cols-[100px_1fr_auto] items-center gap-2 p-2 rounded-xl border border-transparent hover:border-[#8B6F47]/20 hover:bg-[#8B6F47]/5 dark:hover:bg-[#D4A574]/5 transition-all text-[#6B5D47] dark:text-[#B8A584]"
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full text-center truncate">Organizer</span>
                      <span className="text-[#2C2416] dark:text-[#F5F3F0] text-xs truncate">testuser2@gmail.com</span>
                      <span className="opacity-60 text-xs font-mono">testuser2</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail('testuser3@gmail.com')
                        setPassword('testuser3')
                      }}
                      className="w-full text-left grid grid-cols-[100px_1fr_auto] items-center gap-2 p-2 rounded-xl border border-transparent hover:border-[#8B6F47]/20 hover:bg-[#8B6F47]/5 dark:hover:bg-[#D4A574]/5 transition-all font-semibold text-[#6B5D47] dark:text-[#B8A584]"
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full text-center truncate">Admin</span>
                      <span className="text-[#2C2416] dark:text-[#F5F3F0] text-xs truncate">testuser3@gmail.com</span>
                      <span className="opacity-60 text-xs font-mono font-semibold">testuser3</span>
                    </button>
                  </div>
                </div>

                <p className="italic text-xs">
                  The admin panel is in the top-right profile menu. Community Organizers have access to the Organizer Panel from the same menu.
                </p>

                <div className="pt-3 border-t border-[#E8E0D6] dark:border-white/10 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold opacity-50">Team ID</p>
                    <p className="font-mono text-[#2C2416] dark:text-[#F5F3F0]">1825</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold opacity-50">Individual IDs</p>
                    <p className="font-mono text-[#2C2416] dark:text-[#F5F3F0] text-[10px]">1122394, 960942</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                               rounded-2xl text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#6B5D47] dark:text-[#B8A584] mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B8A584]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-[#2c2c3e] 
                             bg-white dark:bg-[#1F1B28] text-[#2C2416] dark:text-[#F5F3F0] 
                             focus:border-[#8B6F47] dark:focus:border-[#D4A574] focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6B5D47] dark:text-[#B8A584] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B8A584]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-2xl border-2 border-gray-200 dark:border-[#2c2c3e] 
                             bg-white dark:bg-[#1F1B28] text-[#2C2416] dark:text-[#F5F3F0] 
                             focus:border-[#8B6F47] dark:focus:border-[#D4A574] focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B8A584] hover:text-[#8B6F47] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-[#D4A574] text-[#8B6F47] focus:ring-[#D4A574]"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span className="ml-2 text-sm text-[#6B5D47] dark:text-[#B8A584]">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-[#8B6F47] dark:text-[#D4A574] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#8B6F47] to-[#D4A574] text-white py-3 rounded-2xl 
                         font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl 
                         transition-all disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-[#6B5D47] dark:text-[#B8A584]">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#8B6F47] dark:text-[#D4A574] font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </LiquidGlass>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#1C1B18]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
