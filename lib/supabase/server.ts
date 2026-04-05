/**
 * Server-side Supabase Client
 * 
 * Creates a Supabase client for use in API routes and server components.
 * This client uses the service role key for admin operations.
 */

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { resolveSupabaseUrl, DEFAULT_SUPABASE_ANON_KEY } from './url'

const supabaseUrl = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

/**
 * Create a server-side Supabase client
 * This client can read cookies to get the user session
 */
export function createServerClient(request?: { headers: { get: (name: string) => string | null } }) {
  const cookieStore = cookies()
  
  // If request is provided, also check request headers for cookies
  const getCookie = (name: string) => {
    // First try from cookieStore (Next.js cookies())
    const cookieValue = cookieStore.get(name)?.value
    if (cookieValue) return cookieValue
    
    // If request is provided, try parsing from Cookie header
    if (request) {
      const cookieHeader = request.headers.get('cookie') || ''
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        if (key && value) acc[key] = decodeURIComponent(value)
        return acc
      }, {} as Record<string, string>)
      return cookies[name]
    }
    
    return undefined
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
    global: {
      headers: request?.headers 
        ? Object.fromEntries(
            Array.from(['cookie', 'authorization']).map(key => [key, request.headers.get(key) || ''])
          )
        : {},
    },
    cookies: {
      get(name: string) {
        return getCookie(name)
      },
      set() {},
      remove() {},
    },
  })
}

/**
 * Create an admin Supabase client with service role key
 * Use this only in server-side code for admin operations
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    // Fallback to anon key with warning (for development only)
    // Note: Admin operations may be limited without service role key
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is not set. Using anon key as fallback.')
      console.warn('   To get your service role key: Supabase Dashboard > Settings > API > service_role key')
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    }
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Please add it to your .env.local file.')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

