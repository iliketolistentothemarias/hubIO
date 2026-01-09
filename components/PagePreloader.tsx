'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ALL routes - prefetch everything immediately
const ALL_ROUTES = [
  '/dashboard',
  '/directory',
  '/events',
  '/social',
  '/highlights',
  '/business',
  '/grants',
  '/projects',
  '/volunteer/dashboard',
  '/analytics',
  '/submit',
  '/about',
  '/news',
  '/lists',
  '/login',
  '/signup',
  '/admin',
]

export default function PagePreloader() {
  const router = useRouter()

  // Prefetch EVERYTHING immediately on mount
  useEffect(() => {
    // Use requestIdleCallback for non-blocking prefetch, fallback to immediate
    const prefetchAll = () => {
      ALL_ROUTES.forEach(route => {
        try { router.prefetch(route) } catch {}
      })
    }

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchAll, { timeout: 100 })
    } else {
      prefetchAll()
    }
  }, [router])

  // Instant prefetch on ANY mouse movement near links
  useEffect(() => {
    let lastPrefetched = ''
    
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link?.href?.startsWith(window.location.origin)) {
        const path = link.href.replace(window.location.origin, '')
        if (path && path !== lastPrefetched && path !== window.location.pathname) {
          lastPrefetched = path
          try { router.prefetch(path) } catch {}
        }
      }
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [router])

  return null
}

