'use client'

import { useEffect } from 'react'

/**
 * This component aggressively preloads ALL data at the start
 * No UI - just loads everything in the background
 */
export default function InitialDataLoader() {
  useEffect(() => {
    // Start loading ALL data immediately
    const preloadEverything = async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        
        // Fire all requests in parallel - don't wait for responses
        Promise.allSettled([
          supabase.from('resources').select('*').eq('verified', true),
          supabase.from('events').select('*').limit(100),
          supabase.from('fundraising_campaigns').select('*').eq('status', 'active').limit(100),
          supabase.from('volunteer_opportunities').select('*').eq('status', 'active').limit(100),
          supabase.from('posts').select('*').eq('status', 'active').limit(100),
          supabase.from('users').select('id, name, email').limit(100),
        ]).then(() => {
          console.log('✅ All data preloaded')
        })
      } catch (e) {
        console.error('Preload error:', e)
      }
    }

    preloadEverything()
  }, [])

  return null
}

