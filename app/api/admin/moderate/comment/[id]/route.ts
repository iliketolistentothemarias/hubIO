/**
 * Comment Moderation API Route
 * 
 * Handles moderation actions for comments.
 * 
 * Endpoints:
 * - POST /api/admin/moderate/comment/[id] - Approve, reject, or flag a comment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { createServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

const supabaseDb = getSupabaseDatabase()

/**
 * POST /api/admin/moderate/comment/[id]
 * 
 * Moderate a comment (approve, reject, or flag)
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

    // Check if user is admin or moderator
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (userError || !user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return NextResponse.json(
        { success: false, error: 'Admin or moderator access required' },
        { status: 403 }
      )
    }

    const commentId = params.id
    const body = await request.json()
    const { action, reason } = body // action: 'approve', 'reject', 'delete'

    if (!action || !['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be approve, reject, or delete' },
        { status: 400 }
      )
    }

    // Get the comment first
    const { data: comment, error: getError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (getError || !comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (action === 'delete') {
      // Delete the comment
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (deleteError) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete comment' },
          { status: 500 }
        )
      }

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Comment deleted successfully',
      }

      return NextResponse.json(response)
    } else {
      // For approve/reject, we can add a status field or just delete rejected comments
      // For now, we'll delete rejected comments
      if (action === 'reject') {
        const { error: deleteError } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId)

        if (deleteError) {
          return NextResponse.json(
            { success: false, error: 'Failed to reject comment' },
            { status: 500 }
          )
        }

        const response: ApiResponse<null> = {
          success: true,
          data: null,
          message: 'Comment rejected and removed',
        }

        return NextResponse.json(response)
      } else {
        // Approve - comment stays as is
        const response: ApiResponse<any> = {
          success: true,
          data: comment,
          message: 'Comment approved',
        }

        return NextResponse.json(response)
      }
    }
  } catch (error: any) {
    console.error('Error moderating comment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to moderate comment' },
      { status: 500 }
    )
  }
}

