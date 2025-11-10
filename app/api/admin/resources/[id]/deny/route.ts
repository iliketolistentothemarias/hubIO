/**
 * Deny Resource API
 * 
 * Deny a pending resource (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSupabaseDatabase } from '@/lib/supabase/database'
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
    const supabase = createServerClient()
    
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

    if (userError || !user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const resourceId = params.id
    const body = await request.json()
    const reason = body.reason || 'Your resource submission did not meet our guidelines.'

    const db = getSupabaseDatabase()

    // Get the resource
    const resource = await db.getResourceById(resourceId)
    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Delete the resource (or mark as rejected)
    const adminClient = createAdminClient()
    if (adminClient) {
      await adminClient
        .from('resources')
        .delete()
        .eq('id', resourceId)
    }

    // Create notification for the submitter
    if (resource.submittedBy) {
      if (adminClient) {
        await adminClient
          .from('notifications')
          .insert({
            user_id: resource.submittedBy,
            type: 'resource_denied',
            title: 'Resource Submission Denied',
            message: `Your resource submission "${resource.name}" was denied. Reason: ${reason}`,
            read: false,
            created_at: new Date().toISOString(),
          })
      }
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

