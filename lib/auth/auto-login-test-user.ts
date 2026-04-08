'use client'

import { supabase } from '@/lib/supabase/client'

/** Matches login page “Test Environment” admin row */
const TEST_EMAIL = 'testuser3@gmail.com'
const TEST_PASSWORD = 'testuser3'

/**
 * On by default (local + Vercel) so demo works without env vars.
 * Set NEXT_PUBLIC_DISABLE_AUTO_LOGIN=true to turn off.
 * Set NEXT_PUBLIC_AUTO_LOGIN_TESTUSER3=false to turn off (alias).
 */
function autoLoginEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DISABLE_AUTO_LOGIN === 'true') return false
  if (process.env.NEXT_PUBLIC_AUTO_LOGIN_TESTUSER3 === 'false') return false
  return true
}

let inFlight: Promise<void> | null = null

/**
 * Signs in as testuser3 when there is no session. Retries once after a delay
 * so Vercel / slow Supabase cold starts still get a session.
 */
export function tryAutoLoginAsTestUser3(): Promise<void> {
  if (typeof window === 'undefined' || !autoLoginEnabled()) {
    return Promise.resolve()
  }
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 1200))
        }
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) return

        const { error } = await supabase.auth.signInWithPassword({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        })
        if (!error) return
        console.warn('[Communify] Auto-login (testuser3) attempt failed:', error.message)
      }
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}
