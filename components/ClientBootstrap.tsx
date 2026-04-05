'use client'

import { useEffect } from 'react'
import { initializeAdmin } from '@/lib/auth/init-admin'

/**
 * Client-only side effects. Keeps mock DB / demo admin init out of the root layout
 * import graph so the server bundle and dev compiler stay stable.
 */
export default function ClientBootstrap() {
  useEffect(() => {
    const id = window.setTimeout(() => initializeAdmin(), 1000)
    return () => clearTimeout(id)
  }, [])
  return null
}
