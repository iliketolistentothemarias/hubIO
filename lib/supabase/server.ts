/**
 * Server-side Supabase Client
 * 
 * Creates a Supabase client for use in API routes and server components.
 * This client uses the service role key for admin operations.
 */

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qyiqvodabfsovjjgjdxs.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aXF2b2RhYmZzb3ZqamdqZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzUxMzksImV4cCI6MjA3ODIxMTEzOX0.YQ7tT-q1dk_krROobItrn7sxVmIxut7VGNR7WaonFEg'

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
    cookies: {
      get: getCookie,
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
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
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

