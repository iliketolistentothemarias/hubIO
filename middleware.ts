import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * In development, prevent the browser from caching HTML, RSC payloads, and webpack chunks.
 * Cached documents that reference old chunk hashes cause 404s on layout.css / main-app.js / page.js
 * after `next dev` restarts or `.next` rebuilds.
 */
export function middleware(_request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')
  res.headers.set('Surrogate-Control', 'no-store')
  res.headers.set('Vary', '*')
  return res
}

export const config = {
  matcher: [
    // Run on document + all Next chunks; exclude image optimizer only (unchanged binary responses)
    '/((?!_next/image|favicon.ico).*)',
  ],
}
