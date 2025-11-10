/**
 * Post Moderation API Route
 * 
 * Handles moderation actions for posts.
 * 
 * Endpoints:
 * - POST /api/admin/moderate/post/[id] - Approve, reject, or flag a post
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { createServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

const supabaseDb = getSupabaseDatabase()

/**
 * POST /api/admin/moderate/post/[id]
 * 
 * Moderate a post (approve, reject, or flag)
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

    const postId = params.id
    const body = await request.json()
    const { action, reason } = body // action: 'approve', 'reject', 'flag'

    if (!action || !['approve', 'reject', 'flag'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be approve, reject, or flag' },
        { status: 400 }
      )
    }

    // Get the post first
    const post = await supabaseDb.getPostById(postId)
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Update post status based on action
    let newStatus: 'active' | 'archived' | 'flagged' = post.status
    if (action === 'approve') {
      newStatus = 'active'
    } else if (action === 'reject') {
      newStatus = 'archived'
    } else if (action === 'flag') {
      newStatus = 'flagged'
    }

    // Update post
    const updated = await supabaseDb.updatePost(postId, {
      status: newStatus,
    })

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update post' },
        { status: 500 }
      )
    }

    const response: ApiResponse<any> = {
      success: true,
      data: updated,
      message: `Post ${action}ed successfully`,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error moderating post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to moderate post' },
      { status: 500 }
    )
  }
}

