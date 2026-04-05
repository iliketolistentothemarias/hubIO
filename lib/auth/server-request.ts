/**
 * Resolve authenticated user for API Route Handlers using cookies or Bearer token.
 * The browser `AuthService` uses the client Supabase instance and does not work on the server.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { resolveSupabaseUrl, DEFAULT_SUPABASE_ANON_KEY } from '@/lib/supabase/url'
import type { User, UserRole } from '@/lib/types'

const supabaseUrl = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

function mapProfileToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    name: String(row.name ?? ''),
    role: (row.role as UserRole) || 'volunteer',
    avatar: row.avatar ? String(row.avatar) : undefined,
    karma: Number(row.karma ?? 0),
    resources_count: Number(row.resources_count ?? 0),
    funds_raised: Number(row.funds_raised ?? 0),
    events_count: Number(row.events_count ?? 0),
    badges: [],
    preferences: {
      theme: 'auto',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: false,
        events: true,
        volunteer: true,
        fundraising: true,
      },
      accessibility: {
        highContrast: false,
        textToSpeech: false,
        dyslexiaFriendly: false,
        fontSize: 'medium',
      },
    },
    createdAt: new Date(String(row.created_at ?? Date.now())),
    lastActiveAt: new Date(String(row.last_active_at ?? Date.now())),
  }
}

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim()
    const client = createClient(supabaseUrl, anonKey)
    const { data, error } = await client.auth.getUser(token)
    if (!error && data.user) return data.user.id
  }

  const serverSupabase = createServerClient({ headers: request.headers })
  const { data, error } = await serverSupabase.auth.getUser()
  if (!error && data.user) return data.user.id
  return null
}

async function loadProfile(userId: string, request: NextRequest): Promise<User | null> {
  const serverSupabase = createServerClient({ headers: request.headers })
  const { data: userProfile, error } = await serverSupabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userProfile && !error) {
    return mapProfileToUser(userProfile as Record<string, unknown>)
  }

  try {
    const admin = createAdminClient()
    const { data: row, error: e2 } = await admin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (row && !e2) {
      return mapProfileToUser(row as Record<string, unknown>)
    }
  } catch {
    // Service role not configured or admin client unavailable
  }

  return null
}

export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return null
  return loadProfile(userId, request)
}

export async function requireUserFromRequest(request: NextRequest): Promise<User> {
  const user = await getUserFromRequest(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireRoleFromRequest(
  request: NextRequest,
  role: UserRole
): Promise<User> {
  const user = await requireUserFromRequest(request)
  if (user.role !== role && user.role !== 'admin') {
    throw new Error(`Role '${role}' required`)
  }
  return user
}
