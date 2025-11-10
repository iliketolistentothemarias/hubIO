/**
 * Follow/Unfollow API Route
 * 
 * Handles following and unfollowing users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(request)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, action } = body // action: 'follow' | 'unfollow'

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // In production, this would interact with a follows table
    // For now, return success
    const response: ApiResponse<{ following: boolean }> = {
      success: true,
      data: {
        following: action === 'follow',
      },
      message: action === 'follow' ? 'Successfully followed user' : 'Successfully unfollowed user',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Follow error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

