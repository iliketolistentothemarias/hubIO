/**
 * Post Like API Route
 * 
 * Handles liking/unliking posts.
 * 
 * Endpoints:
 * - POST /api/posts/[id]/like - Toggle like on a post (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const supabaseDb = getSupabaseDatabase()

/**
 * POST /api/posts/[id]/like
 * 
 * Toggle like on a post (requires authentication)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const postId = params.id

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const result = await supabaseDb.togglePostLike(postId, user.id)

    const response: ApiResponse<{ liked: boolean; likes: number }> = {
      success: true,
      data: result,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error toggling post like:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}

