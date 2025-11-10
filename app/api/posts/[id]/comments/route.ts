/**
 * Post Comments API Route
 * 
 * Handles comments on posts.
 * 
 * Endpoints:
 * - GET /api/posts/[id]/comments - Get all comments for a post
 * - POST /api/posts/[id]/comments - Create a new comment (requires authentication)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, Comment } from '@/lib/types'

const supabaseDb = getSupabaseDatabase()

/**
 * GET /api/posts/[id]/comments
 * 
 * Get all comments for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    let comments = await supabaseDb.getCommentsByPostId(postId)

    // If no comments from database, use seed data for this post
    if (comments.length === 0) {
      try {
        const { seedComments } = await import('@/data/seed-data')
        const postComments = seedComments
          .filter(c => c.postId === postId)
          .map(comment => ({
            ...comment,
            createdAt: new Date(),
            updatedAt: new Date(),
          })) as Comment[]
        comments = postComments
      } catch (error) {
        console.warn('Could not load seed comments:', error)
      }
    }

    const response: ApiResponse<Comment[]> = {
      success: true,
      data: comments,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/posts/[id]/comments
 * 
 * Create a new comment (requires authentication)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const postId = params.id
    const body = await request.json()

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Create comment
    const commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'> = {
      postId,
      author: user.name || user.email || 'Anonymous',
      authorId: user.id,
      content: body.content.trim(),
      likes: 0,
      parentId: body.parentId || undefined,
    }

    const created = await supabaseDb.createComment(commentData)

    const response: ApiResponse<Comment> = {
      success: true,
      data: created,
      message: 'Comment created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating comment:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

