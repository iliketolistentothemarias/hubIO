/**
 * Approve Resource API
 * 
 * Approve a pending resource (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { ApiResponse } from '@/lib/types'

/**
 * POST /api/admin/resources/[id]/approve
 * 
 * Approve a pending resource
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
    const db = getSupabaseDatabase()

    // Get the resource
    const resource = await db.getResourceById(resourceId)
    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Update resource to verified
    const updated = await db.updateResource(resourceId, { verified: true })
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to approve resource' },
        { status: 500 }
      )
    }

    // Create notification for the submitter
    if (resource.submittedBy) {
      const adminClient = createAdminClient()
      if (adminClient) {
        await adminClient
          .from('notifications')
          .insert({
            user_id: resource.submittedBy,
            type: 'resource_approved',
            title: 'Resource Approved',
            message: `Your resource "${resource.name}" has been approved and is now live on the platform!`,
            read: false,
            created_at: new Date().toISOString(),
          })
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      message: 'Resource approved successfully',
      data: updated,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error approving resource:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to approve resource' },
      { status: 500 }
    )
  }
}
