'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'

interface AuthRequiredProps {
  featureName: string
  description?: string
  children: ReactNode
}

export default function AuthRequired({
  featureName,
  description,
  children,
}: AuthRequiredProps) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'guest'>('loading')

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!mounted) return
        if (error || !data.user) {
          setStatus('guest')
        } else {
          setStatus('authenticated')
        }
      } catch {
        if (mounted) setStatus('guest')
      }
    }

    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session?.user ? 'authenticated' : 'guest')
    })

    return () => {
      mounted = false
      authListener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (status === 'guest' && typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8B6F47] dark:border-[#D4A574] border-t-transparent" />
      </div>
    )
  }

  if (status === 'guest') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl p-10 rounded-3xl bg-white dark:bg-[#1F1B28] border border-[#E8E0D6] dark:border-[#2c2c3e] shadow-2xl text-center space-y-5"
        >
          <h2 className="text-3xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0]">
            Create an account to access {featureName}
          </h2>
          <p className="text-[#6B5D47] dark:text-[#B8A584]">
            {description ||
              `This feature is available to registered community members. Sign up to start using ${featureName.toLowerCase()}.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] font-semibold hover:bg-[#6B5D47] dark:hover:bg-[#B8A584] transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-[#E8E0D6] dark:border-[#2c2c3e] text-[#6B5D47] dark:text-[#B8A584] font-semibold hover:bg-[#f5ede1] dark:hover:bg-[#2c2c3e] transition-colors"
            >
              Log In
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}

