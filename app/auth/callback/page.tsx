'use client'

/**
 * OAuth Callback Page
 * 
 * Handles OAuth redirects from providers (Google, etc.)
 * Creates user profile if it doesn't exist and redirects to dashboard
 */

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')
        
        if (errorParam) {
          setError('Authentication failed. Please try again.')
          setTimeout(() => router.push('/login?error=oauth_failed'), 2000)
          return
        }
        
        if (!code) {
          // Check if we already have a session (Supabase might have handled it)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (session && session.user) {
            await ensureUserProfile(session.user.id, session.user)
            router.push('/dashboard')
            return
          }
          
          setError('No authorization code received')
          setTimeout(() => router.push('/login?error=no_code'), 2000)
          return
        }

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('OAuth callback error:', exchangeError)
          setError(exchangeError.message)
          setTimeout(() => router.push('/login?error=oauth_failed'), 2000)
          return
        }

        if (data?.user) {
          await ensureUserProfile(data.user.id, data.user)
          // Redirect to dashboard
          router.push('/dashboard')
        } else {
          setError('No user data received')
          setTimeout(() => router.push('/login?error=no_user'), 2000)
        }
      } catch (err: any) {
        console.error('Callback error:', err)
        setError(err.message || 'An unexpected error occurred')
        setTimeout(() => router.push('/login?error=callback_error'), 2000)
      }
    }

    const ensureUserProfile = async (userId: string, user: any) => {
      // Check if user profile exists
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // Create user profile if it doesn't exist
      if (profileError || !userProfile) {
        // Create profile if it doesn't exist (the trigger should have done this, but we fallback)
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: user.email!,
            name: user.user_metadata?.full_name || 
                  user.user_metadata?.name || 
                  user.email!.split('@')[0],
            role: 'volunteer',
            karma: 0,
            resources_count: 0,
            volunteer_hours: 0,
            funds_raised: 0,
            events_count: 0,
            created_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          console.error('Failed to ensure user profile:', insertError)
        }
      } else {
        // Update last_active_at
        await supabase
          .from('users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', userId)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#1C1B18]">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-600 dark:text-red-400 mb-4">Error: {error}</div>
            <div className="text-gray-600 dark:text-gray-400">Redirecting to login...</div>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">Completing sign in...</div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#1C1B18]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

