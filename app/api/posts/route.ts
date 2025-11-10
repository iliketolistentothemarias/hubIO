/**
 * Posts API Route
 * 
 * Handles CRUD operations for community board posts.
 * 
 * Endpoints:
 * - GET /api/posts - Get all posts (with optional category filter)
 * - POST /api/posts - Create new post (requires authentication)
 */

import { NextRequest } from 'next/server'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { createServerClient } from '@/lib/supabase/server'
import { requireAuthenticatedUser } from '@/lib/api/middleware'
import { Post, PostCategory } from '@/lib/types'
import { successResponse, createdResponse } from '@/lib/api/response'
import { handleApiError, ValidationError } from '@/lib/api/error-handler'

const supabaseDb = getSupabaseDatabase()

/**
 * GET /api/posts
 * 
 * Get all posts with optional category filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    // Get user session to check if posts are liked
    let userId: string | undefined = undefined
    try {
      const supabase = createServerClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        userId = session.user.id
      }
    } catch {
      // Not authenticated - that's fine
    }

    let posts = await supabaseDb.getAllPosts(category || undefined)

    // If no posts from database, use seed data
    if (posts.length === 0) {
      try {
        const { seedPosts } = await import('@/data/seed-data')
        posts = seedPosts.map(post => ({
          ...post,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) as Post[]
      } catch (error) {
        console.warn('Could not load seed posts:', error)
      }
    }

    // If user is authenticated, check which posts they liked
    if (userId) {
      for (const post of posts) {
        try {
          const isLiked = await supabaseDb.checkPostLiked(post.id, userId)
          // Note: We'll add an isLiked property in the response
          ;(post as any).isLiked = isLiked
        } catch (error) {
          // If check fails, assume not liked
          ;(post as any).isLiked = false
        }
      }
    }

    return successResponse(posts)
  } catch (error) {
    return handleApiError(error, 'Failed to fetch posts')
  }
}

/**
 * POST /api/posts
 * 
 * Create a new post (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser()
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.content || !body.category) {
      throw new ValidationError('Title, content, and category are required')
    }

    // Validate category
    const validCategories: PostCategory[] = ['Events', 'Volunteer', 'Announcements', 'Business', 'Community', 'Help', 'Discussion']
    if (!validCategories.includes(body.category)) {
      throw new ValidationError('Invalid category')
    }

    // Create post
    const postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'comments'> = {
      author: user.name || user.email || 'Anonymous',
      authorId: user.id,
      title: body.title,
      content: body.content,
      category: body.category,
      likes: 0,
      tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(',').map((t: string) => t.trim()) : []),
      pinned: false,
      status: 'active',
    }

    const created = await supabaseDb.createPost(postData)

    return createdResponse(created, 'Post created successfully')
  } catch (error) {
    return handleApiError(error, 'Failed to create post')
  }
}

