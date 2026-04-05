/**
 * Authentication Guard Hook
 * 
 * Redirects users to signup/login if they're not authenticated
 * when trying to perform actions that require authentication.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthService } from '@/lib/auth'

export function useAuthGuard(redirectTo: string = '/signup', action?: string) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = getAuthService()
        const authenticated = await auth.isAuthenticated()
        setIsAuthenticated(authenticated)
        
        if (!authenticated) {
          // Store the intended action/URL for after login
          if (action) {
            sessionStorage.setItem('pendingAction', action)
          }
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
          }
          router.push(redirectTo)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
        router.push(redirectTo)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router, redirectTo, action])

  return { isAuthenticated, isChecking }
}

/**
 * Check if user is authenticated before performing an action
 * Redirects to signup if not authenticated
 */
export async function requireAuthForAction(
  action: () => void | Promise<void>,
  redirectTo: string = '/signup',
  actionName?: string
): Promise<void> {
  const auth = getAuthService()
  const authenticated = await auth.isAuthenticated()

  if (!authenticated) {
    // Store the intended action
    if (actionName && typeof window !== 'undefined') {
      sessionStorage.setItem('pendingAction', actionName)
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
    }
    
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo
    }
    return
  }

  // User is authenticated, proceed with action
  await action()
}

