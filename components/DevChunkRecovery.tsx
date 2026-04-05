'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'next_dev_chunk_reload'

function shouldReloadForChunkUrl(url: string): boolean {
  try {
    const u = new URL(url, window.location.origin)
    return u.pathname.includes('/_next/')
  } catch {
    return false
  }
}

function reloadOnceForStaleChunks() {
  if (sessionStorage.getItem(STORAGE_KEY)) return
  sessionStorage.setItem(STORAGE_KEY, '1')
  try {
    const u = new URL(window.location.href)
    u.searchParams.set('_next_reload', String(Date.now()))
    window.location.replace(u.toString())
  } catch {
    window.location.reload()
  }
}

function scanResourceTimingForChunk404() {
  try {
    const entries = performance.getEntriesByType('resource') as (PerformanceResourceTiming & {
      responseStatus?: number
    })[]
    for (const r of entries) {
      if (r.responseStatus !== 404) continue
      if (!shouldReloadForChunkUrl(r.name)) continue
      reloadOnceForStaleChunks()
      return
    }
  } catch {
    /* ignore */
  }
}

/**
 * Dev-only: after `.next` rebuild or `next dev` restart, disk/bfcache can serve stale HTML/RSC
 * that references old chunk URLs → 404 on layout.css / layout.js / main-app.js / page.js.
 * Middleware + next.config no-store + staleTimes(0); this catches stragglers.
 */
export default function DevChunkRecovery() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const clearKeyLater = window.setTimeout(() => {
      sessionStorage.removeItem(STORAGE_KEY)
    }, 20000)

    const onError = (e: Event) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      const url =
        (el as HTMLScriptElement).src || (el as HTMLLinkElement).href || ''
      if (!shouldReloadForChunkUrl(url)) return
      reloadOnceForStaleChunks()
    }

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        reloadOnceForStaleChunks()
      }
    }

    window.addEventListener('error', onError, true)
    window.addEventListener('pageshow', onPageShow)

    let perfObserver: PerformanceObserver | null = null
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        perfObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType !== 'resource') continue
            const r = entry as PerformanceResourceTiming & { responseStatus?: number }
            if (r.responseStatus !== 404) continue
            if (!shouldReloadForChunkUrl(r.name)) continue
            reloadOnceForStaleChunks()
            break
          }
        })
        perfObserver.observe({ type: 'resource', buffered: true } as PerformanceObserverInit)
      } catch {
        /* older browsers */
      }
    }

    const t0 = window.setTimeout(scanResourceTimingForChunk404, 400)
    const t1 = window.setTimeout(scanResourceTimingForChunk404, 2000)

    return () => {
      window.clearTimeout(clearKeyLater)
      window.clearTimeout(t0)
      window.clearTimeout(t1)
      window.removeEventListener('error', onError, true)
      window.removeEventListener('pageshow', onPageShow)
      perfObserver?.disconnect()
    }
  }, [])

  return null
}
