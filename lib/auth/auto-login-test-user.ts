'use client'

import { supabase } from '@/lib/supabase/client'

/** Matches login page “Test Environment” admin row */
const TEST_EMAIL = 'testuser3@gmail.com'
const TEST_PASSWORD = 'testuser3'

function autoLoginEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_AUTO_LOGIN_TESTUSER3
  if (v === 'false') return false
  if (v === 'true') return true
  return process.env.NODE_ENV === 'development'
}

let inFlight: Promise<void> | null = null

/**
 * Signs in as testuser3 when there is no session (dev by default, or when
 * NEXT_PUBLIC_AUTO_LOGIN_TESTUSER3=true). Safe to call on every app load.
 */
export function tryAutoLoginAsTestUser3(): Promise<void> {
  if (typeof window === 'undefined' || !autoLoginEnabled()) {
    return Promise.resolve()
  }
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) return

      const { error } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      if (error) {
        console.warn('[Communify] Auto-login (testuser3) failed:', error.message)
      }
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}
