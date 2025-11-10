'use client'

/**
 * Sign Up Page
 * 
 * User registration page with email/password signup.
 */

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import LiquidGlass from '@/components/LiquidGlass'
import Link from 'next/link'

function SignUpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldownSeconds])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Check cooldown
    if (cooldownSeconds > 0) {
      setError(`Please wait ${cooldownSeconds} second${cooldownSeconds !== 1 ? 's' : ''} before trying again.`)
      return
    }

    setIsLoading(true)

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to create account')
        setIsLoading(false)
        
        // If it's a cooldown error (429), set the cooldown timer
        if (response.status === 429) {
          setCooldownSeconds(10)
        }
        return
      }

      // Store session in Supabase client if available
      if (data.data?.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.data.session.access_token,
          refresh_token: data.data.session.refresh_token,
        })

        if (sessionError) {
          console.error('Session error:', sessionError)
          // If session setting fails, redirect to login
          router.push('/login?message=Account created successfully. Please sign in.')
          return
        }
      } else {
        // If no session was created, redirect to login
        router.push('/login?message=Account created successfully. Please sign in.')
        return
      }

      // Check if there's a redirect URL stored
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
      const pendingAction = sessionStorage.getItem('pendingAction')
      
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin')
        sessionStorage.removeItem('pendingAction')
        router.push(redirectUrl)
      } else {
        // Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-white to-primary-50/30 
                    dark:from-[#1C1B18] dark:via-gray-800 dark:to-primary-900/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <LiquidGlass intensity="strong">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                Create Account
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Join your community hub today
              </p>
              {message && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 
                              rounded-2xl text-blue-600 dark:text-blue-400 text-sm">
                  {message}
                </div>
              )}
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                              rounded-2xl text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                             focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                             focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                             focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                             focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading || cooldownSeconds > 0}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-2xl 
                         font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl 
                         transition-all disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Create Account'}
                {!isLoading && cooldownSeconds === 0 && <ArrowRight className="w-4 h-4" />}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </LiquidGlass>
      </motion.div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#1C1B18]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
