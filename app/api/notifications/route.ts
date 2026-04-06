import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

async function deleteOwnedNotifications(
  userId: string,
  userSupabase: SupabaseClient,
  ids: string[]
) {
  const db =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
      ? createAdminClient()
      : userSupabase

  return db.from('notifications').delete().in('id', ids).eq('user_id', userId)
}

async function getUserId(request: NextRequest) {
  const supabase = createServerClient({ headers: request.headers })
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { supabase, userId: null, error: error || new Error('Authentication required') }
  }

  return { supabase, userId: user.id, error: null }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getUserId(request)

    if (error || !userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data, error: queryError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (queryError) {
      const code = (queryError as { code?: string }).code
      const msg = queryError.message || ''
      // Missing table, schema cache, or RLS — don't break the whole app
      const isRecoverable =
        code === '42P01' ||
        code === 'PGRST116' ||
        msg.includes('does not exist') ||
        msg.includes('schema cache') ||
        msg.includes('permission denied')

      if (isRecoverable) {
        return NextResponse.json({ success: true, data: [] })
      }

      console.error('Failed to load notifications:', queryError)
      return NextResponse.json(
        { success: false, error: 'Failed to load notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getUserId(request)

    if (error || !userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = await request.json().catch(() => ({}))
    const ids: string[] = Array.isArray(payload.notificationIds)
      ? payload.notificationIds
      : []

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No notifications provided' },
        { status: 400 }
      )
    }

    // POST delete avoids proxies/clients that drop DELETE request bodies.
    if (payload.action === 'delete') {
      const { error: deleteError } = await deleteOwnedNotifications(
        userId,
        supabase,
        ids
      )

      if (deleteError) {
        const msg = deleteError.message || ''
        if (msg.includes('does not exist') || msg.includes('schema cache')) {
          return NextResponse.json({ success: true, message: 'No notifications table' })
        }
        console.error('Failed to delete notifications:', deleteError)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to delete notifications: ${deleteError.message}`,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Notifications deleted',
      })
    }

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .in('id', ids)
      .eq('user_id', userId)

    if (updateError) {
      const msg = updateError.message || ''
      if (msg.includes('does not exist') || msg.includes('schema cache')) {
        return NextResponse.json({ success: true, message: 'No notifications table' })
      }
      console.error('Failed to update notifications:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
    })
  } catch (error) {
    console.error('Notifications POST error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, userId, error } = await getUserId(request)

    if (error || !userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = await request.json().catch(() => ({}))
    const ids: string[] = Array.isArray(payload.notificationIds)
      ? payload.notificationIds
      : []

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No notifications provided' },
        { status: 400 }
      )
    }

    // Prefer service role so deletes work even if RLS has no DELETE policy yet.
    // Always scope by user_id from the JWT — never delete other users' rows.
    const { error: deleteError } = await deleteOwnedNotifications(
      userId,
      supabase,
      ids
    )

    if (deleteError) {
      const msg = deleteError.message || ''
      if (msg.includes('does not exist') || msg.includes('schema cache')) {
        return NextResponse.json({ success: true, message: 'No notifications table' })
      }
      console.error('Failed to delete notifications:', deleteError)
      return NextResponse.json(
        { success: false, error: `Failed to delete notifications: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications deleted',
    })
  } catch (error) {
    console.error('Notifications DELETE error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}

