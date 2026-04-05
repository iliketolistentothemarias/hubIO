/**
 * Server-side Supabase Client
 *
 * Creates a Supabase client for use in API routes.
 * Reads the JWT from the Authorization header sent by apiFetch on the client.
 */

import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseUrl, DEFAULT_SUPABASE_ANON_KEY } from './url'

const supabaseUrl = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

/**
 * Create a server-side Supabase client authenticated via the request's
 * Authorization header (Bearer JWT). RLS policies apply as that user.
 */
export function createServerClient(request?: { headers: { get: (name: string) => string | null } }) {
  const authHeader = request?.headers?.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  })
}

/**
 * Create an admin Supabase client with service role key.
 * Bypasses RLS — use only for trusted server-side operations.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Using anon key as fallback.')
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
