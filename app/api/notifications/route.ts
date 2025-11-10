/**
 * Notifications API
 * 
 * Get and manage user notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

/**
 * GET /api/notifications
 * 
 * Get all notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get notifications for the user
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    const response: ApiResponse<any> = {
      success: true,
      data: notifications || [],
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * 
 * Mark notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationIds } = body

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { success: false, error: 'Notification IDs array is required' },
        { status: 400 }
      )
    }

    // Mark notifications as read
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', notificationIds)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error updating notifications:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update notifications' },
        { status: 500 }
      )
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Notifications marked as read',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

