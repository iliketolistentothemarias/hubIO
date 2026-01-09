'use client'

/**
 * Sign Up Page
 * 
 * User registration page with email/password signup.
 */

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, ArrowRight, ArrowLeft, Chrome, Eye, EyeOff } from 'lucide-react'
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
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
    setSuccessMessage('')
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

  const handleGoogleSignup = async () => {
    setError('')
    setIsLoading(true)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      console.error('Google OAuth error:', error)
      // Check if provider is not enabled
      if (error.message?.includes('not enabled') || error.message?.includes('Unsupported provider')) {
        setError('Google OAuth is not enabled. Please enable it in your Supabase dashboard under Authentication > Providers.')
      } else {
        setError(error.message || 'Failed to sign in with Google')
      }
      setIsLoading(false)
    }
    // OAuth will redirect on success, so we don't need to handle it here
  }

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
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: 'volunteer',
          },
        },
      })

      if (error) {
        // Provide more helpful error messages
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          setError('Network error: Unable to connect to the server. Please check your internet connection and try again.')
        } else if (error.message?.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.')
        } else {
          setError(error.message || 'Failed to create account. Please try again.')
        }
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setError('Failed to create account. Please try again.')
        setIsLoading(false)
        return
      }

      // Since we added an auto-confirm trigger in the DB, 
      // the user will be confirmed instantly. We can proceed directly.
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin')
        sessionStorage.removeItem('pendingAction')
        router.push(redirectUrl)
      } else {
        router.push('/dashboard')
      }
      setIsLoading(false)
      return
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'An unexpected error occurred')
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
                Create Account
              </h1>
              <p className="text-[#6B5D47] dark:text-[#B8A584]">
                Join your community hub today
              </p>
              {message && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 
                              rounded-2xl text-blue-600 dark:text-blue-400 text-sm">
                  {message}
                </div>
              )}
            </div>

            {/* Google OAuth Button */}
            <div className="mb-6">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl 
                         bg-white dark:bg-[#1F1B28] border-2 border-gray-200 dark:border-[#2c2c3e] 
                         text-[#6B5D47] dark:text-[#B8A584] hover:border-[#8B6F47] dark:hover:border-[#D4A574] 
                         transition-all font-medium disabled:opacity-50"
              >
                <Chrome className="w-5 h-5" />
                Continue with Google
              </motion.button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-[#2c2c3e]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-[#1F1B28] text-[#6B5D47] dark:text-[#B8A584]">Or sign up with email</span>
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                              rounded-2xl text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 
                              rounded-2xl text-green-600 dark:text-green-400 text-sm">
                  {successMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#6B5D47] dark:text-[#B8A584] mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B8A584]" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-[#2c2c3e] 
                             bg-white dark:bg-[#1F1B28] text-[#2C2416] dark:text-[#F5F3F0] 
                             focus:border-[#8B6F47] dark:focus:border-[#D4A574] focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6B5D47] dark:text-[#B8A584] mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B8A584]" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
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
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
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
                <p className="mt-1 text-xs text-[#6B5D47]/70 dark:text-[#B8A584]/70">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6B5D47] dark:text-[#B8A584] mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B8A584]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 rounded-2xl border-2 border-gray-200 dark:border-[#2c2c3e] 
                             bg-white dark:bg-[#1F1B28] text-[#2C2416] dark:text-[#F5F3F0] 
                             focus:border-[#8B6F47] dark:focus:border-[#D4A574] focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B8A584] hover:text-[#8B6F47] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading || cooldownSeconds > 0}
                  className="w-full bg-gradient-to-r from-[#8B6F47] to-[#D4A574] text-white py-3 rounded-2xl 
                           font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl 
                           transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Create Account'}
                  {!isLoading && cooldownSeconds === 0 && <ArrowRight className="w-4 h-4" />}
                </motion.button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-[#6B5D47] dark:text-[#B8A584]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#8B6F47] dark:text-[#D4A574] font-medium hover:underline">
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
