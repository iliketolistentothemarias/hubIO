'use client'

import { useEffect } from 'react'
import { initializeAdmin } from '@/lib/auth/init-admin'
import { tryAutoLoginAsTestUser3 } from '@/lib/auth/auto-login-test-user'

/**
 * Client-only side effects. Keeps mock DB / demo admin init out of the root layout
 * import graph so the server bundle and dev compiler stay stable.
 */
export default function ClientBootstrap() {
  useEffect(() => {
    void tryAutoLoginAsTestUser3()
    const id = window.setTimeout(() => initializeAdmin(), 1000)
    return () => clearTimeout(id)
  }, [])
  return null
}
