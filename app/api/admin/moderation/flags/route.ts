/**
 * Content Flags API
 * 
 * Handle content flagging and review
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'
import type { ContentFlag } from '@/lib/types/moderation'

const db = getDatabase()

/**
 * POST /api/admin/moderation/flags
 * 
 * Flag content for moderation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { type, itemId, reason, priority } = body

    if (!type || !itemId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Type, itemId, and reason are required' },
        { status: 400 }
      )
    }

    // Check if already flagged
    const existingFlags = db.getContentFlags('pending')
    const alreadyFlagged = existingFlags.some(
      flag => flag.type === type && flag.itemId === itemId && flag.reportedBy === user.id
    )

    if (alreadyFlagged) {
      return NextResponse.json(
        { success: false, error: 'Content already flagged by you' },
        { status: 400 }
      )
    }

    const flag: ContentFlag = {
      id: `flag_${Date.now()}_${user.id}`,
      type,
      itemId,
      reportedBy: user.id,
      reportedByName: user.name,
      reason,
      status: 'pending',
      priority: priority || 'medium',
      createdAt: new Date(),
    }

    db.createContentFlag(flag)

    // Check automated moderation rules
    const rules = db.getAllModerationRules()
    for (const rule of rules) {
      if (rule.type === 'keyword' && reason.toLowerCase().includes(rule.pattern.toLowerCase())) {
        // Auto-flag based on rule
        if (rule.action === 'auto-reject') {
          // Auto-reject logic would go here
        }
      }
    }

    const response: ApiResponse<ContentFlag> = {
      success: true,
      data: flag,
      message: 'Content flagged successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error flagging content:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to flag content' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/moderation/flags
 * 
 * Get content flags (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const flags = db.getContentFlags(status || undefined)

    const response: ApiResponse<ContentFlag[]> = {
      success: true,
      data: flags,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching flags:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch flags' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/moderation/flags/[id]
 * 
 * Update flag status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status } = body

    const updated = db.updateContentFlag(params.id, {
      status: status as 'pending' | 'reviewed' | 'resolved' | 'dismissed',
      reviewedAt: new Date(),
      reviewedBy: user.id,
    })

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Flag not found' },
        { status: 404 }
      )
    }

    const response: ApiResponse<ContentFlag> = {
      success: true,
      data: updated,
      message: 'Flag updated successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error updating flag:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update flag' },
      { status: 500 }
    )
  }
}

