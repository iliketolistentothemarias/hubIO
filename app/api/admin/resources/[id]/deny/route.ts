/**
 * Deny Resource API
 * 
 * Deny a pending resource (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

/**
 * POST /api/admin/resources/[id]/deny
 * 
 * Deny a pending resource
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      .maybeSingle()

    if (userError || !user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const resourceId = params.id
    const body = await request.json()
    const reason = body.reason || 'Your resource submission did not meet our guidelines.'

    // Try to use admin client if available, otherwise use regular client
    let client = supabase
    try {
      const adminClient = createAdminClient()
      client = adminClient
    } catch (error) {
      console.warn('Admin client not available, using regular client')
    }

    // Get the resource first
    const { data: resource, error: getError } = await client
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .maybeSingle()

    if (getError || !resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Delete the resource
    const { error: deleteError } = await client
      .from('resources')
      .delete()
      .eq('id', resourceId)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete resource' },
        { status: 500 }
      )
    }

    // Create notification for the submitter (if notifications table exists)
    if (resource.submitted_by) {
      try {
        await client
          .from('notifications')
          .insert({
            user_id: resource.submitted_by,
            type: 'resource_denied',
            title: 'Resource Submission Denied',
            message: `Your resource submission "${resource.name}" was denied. Reason: ${reason}`,
            read: false,
            created_at: new Date().toISOString(),
          })
      } catch (notifError) {
        // Ignore notification errors - table might not exist
        console.warn('Could not create notification:', notifError)
      }
    }

    // Record moderation action
    try {
      const { getDatabase } = await import('@/lib/db/schema')
      const db = getDatabase()
      const { ModerationAction } = await import('@/lib/types/moderation')
      
      const action: ModerationAction = {
        id: `mod_${Date.now()}`,
        type: 'resource',
        itemId: resourceId,
        action: 'reject',
        adminId: session.user.id,
        adminName: user?.name || 'Admin',
        reason,
        automated: false,
        createdAt: new Date(),
      }
      db.createModerationAction(action)
    } catch (error) {
      console.warn('Could not record moderation action:', error)
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Resource denied successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error denying resource:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to deny resource' },
      { status: 500 }
    )
  }
}

