/**
 * Moderation History API
 * 
 * Get moderation action history
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const db = getDatabase()

/**
 * GET /api/admin/moderation/history
 * 
 * Get moderation history
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Check admin access
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const itemType = searchParams.get('type')
    const adminId = searchParams.get('adminId')

    let actions

    if (itemId && itemType) {
      actions = db.getModerationActionsByItem(itemId, itemType)
    } else if (adminId) {
      actions = db.getModerationActionsByAdmin(adminId)
    } else {
      // Get all actions
      const dbInternal = (db as any).db
      actions = dbInternal?.moderationActions 
        ? Array.from(dbInternal.moderationActions.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        : []
    }

    const response: ApiResponse<typeof actions> = {
      success: true,
      data: actions,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching moderation history:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch moderation history' },
      { status: 500 }
    )
  }
}

