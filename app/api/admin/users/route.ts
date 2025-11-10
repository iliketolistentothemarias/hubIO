/**
 * Admin Users API
 * 
 * Manage admin users (add/remove admins)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

/**
 * GET /api/admin/users
 * 
 * Get all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(request)
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: 'Admin client not configured' },
        { status: 500 }
      )
    }

    // Get all users
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    const response: ApiResponse<any> = {
      success: true,
      data: users || [],
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users
 * 
 * Update user role (make admin or remove admin)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(request)
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    // Prevent removing your own admin status
    if (userId === session.user.id && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'You cannot remove your own admin status' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { success: false, error: 'Admin client not configured' },
        { status: 500 }
      )
    }

    // Update user role
    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    const response: ApiResponse<any> = {
      success: true,
      message: `User role updated to ${role}`,
      data: updatedUser,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}

