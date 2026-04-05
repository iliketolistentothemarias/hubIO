'use client'

/**
 * Volunteer Login Page
 * 
 * Specialized login page for volunteers with:
 * - Volunteer-specific branding
 * - Quick access to volunteer opportunities
 * - Impact tracking preview
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { HandHeart, Mail, Lock, ArrowRight, Award, TrendingUp, Users } from 'lucide-react'
import { getAuthService } from '@/lib/auth'
import LiquidGlass from '@/components/LiquidGlass'
import Link from 'next/link'

export default function VolunteerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const auth = getAuthService()
      const session = await auth.signInWithEmail(email, password)
      
      // Set user role to volunteer
      if (session.user.role === 'resident') {
        // In production, would update role in database
        session.user.role = 'volunteer'
      }
      
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 
                    dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        {/* Left Side - Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex flex-col justify-center"
        >
          <LiquidGlass intensity="medium">
            <div className="p-8">
              <div className="inline-flex p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl mb-6">
                <HandHeart className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
                Volunteer Portal
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Join our community of volunteers making a difference in South Fayette and Pittsburgh.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Track Your Impact</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Monitor hours and achievements</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Find Opportunities</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Discover volunteer roles near you</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Connect with Community</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Network with other volunteers</div>
                  </div>
                </div>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center"
        >
          <LiquidGlass intensity="strong">
            <div className="p-8 w-full">
              <div className="text-center mb-8">
                <div className="inline-flex p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-4">
                  <HandHeart className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                  Volunteer Login
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Sign in to access your volunteer dashboard
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                                rounded-2xl text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                               focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                      placeholder="volunteer@example.com"
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                               focus:border-green-500 dark:focus:border-green-400 focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-green-600 dark:text-green-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-2xl 
                           font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl 
                           transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign In as Volunteer'}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Not a volunteer yet?{' '}
                  <Link href="/volunteer/signup" className="text-green-600 dark:text-green-400 font-medium hover:underline">
                    Sign up
                  </Link>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:underline">
                    Regular login
                  </Link>
                  {' • '}
                  <Link href="/login/admin" className="text-gray-600 dark:text-gray-400 hover:underline">
                    Admin login
                  </Link>
                </p>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>
      </div>
    </div>
  )
}

