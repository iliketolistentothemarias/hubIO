'use client'

/**
 * Admin Login Page
 * 
 * Secure admin login page with:
 * - Enhanced security features
 * - Admin dashboard preview
 * - System status indicators
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, ArrowRight, Settings, BarChart3, Users, AlertTriangle } from 'lucide-react'
import { getAuthService } from '@/lib/auth'
import LiquidGlass from '@/components/LiquidGlass'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSecurityWarning, setShowSecurityWarning] = useState(true)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const auth = getAuthService()
      const session = await auth.signInWithEmail(email, password)
      
      // Check if user has admin role
      if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
        setError('Access denied. Admin privileges required.')
        setIsLoading(false)
        return
      }
      
      router.push('/admin/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 
                    dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
        {/* Left Side - Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex flex-col justify-center"
        >
          <LiquidGlass intensity="medium">
            <div className="p-8">
              <div className="inline-flex p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl mb-6">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
                Admin Portal
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Secure access to HubIO administration and management tools.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Analytics Dashboard</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Monitor platform metrics</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">User Management</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Manage users and permissions</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Content Moderation</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Review and approve submissions</div>
                  </div>
                </div>
              </div>

              {showSecurityWarning && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm mb-1">
                        Security Notice
                      </div>
                      <div className="text-xs text-yellow-700 dark:text-yellow-400">
                        This is a restricted area. All access attempts are logged and monitored.
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSecurityWarning(false)}
                      className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
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
                <div className="inline-flex p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                  Admin Login
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Sign in with admin credentials
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
                    Admin Email
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
                               focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                      placeholder="admin@hubio.org"
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
                               focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-2xl 
                           font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl 
                           transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign In as Admin'}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <Link href="/login" className="text-gray-600 dark:text-gray-400 hover:underline">
                    Regular login
                  </Link>
                  {' • '}
                  <Link href="/login/volunteer" className="text-gray-600 dark:text-gray-400 hover:underline">
                    Volunteer login
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

