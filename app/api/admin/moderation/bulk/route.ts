/**
 * Bulk Moderation API
 * 
 * Handle bulk moderation actions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'
import type { ModerationAction } from '@/lib/types/moderation'

const db = getDatabase()

/**
 * POST /api/admin/moderation/bulk
 * 
 * Perform bulk moderation actions
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, itemIds, type, reason } = body

    if (!action || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Action and itemIds array are required' },
        { status: 400 }
      )
    }

    const results: { id: string; success: boolean; error?: string }[] = []

    for (const itemId of itemIds) {
      try {
        if (type === 'resource') {
          if (action === 'approve') {
            const resource = db.getResource(itemId)
            if (resource) {
              const updated = {
                ...resource,
                verified: true,
                updatedAt: new Date(),
              }
              db.createResource(updated)

              // Record action
              const modAction: ModerationAction = {
                id: `mod_${Date.now()}_${itemId}`,
                type: 'resource',
                itemId,
                action: 'approve',
                adminId: user.id,
                adminName: user.name,
                automated: false,
                createdAt: new Date(),
              }
              db.createModerationAction(modAction)

              results.push({ id: itemId, success: true })
            } else {
              results.push({ id: itemId, success: false, error: 'Resource not found' })
            }
          } else if (action === 'reject') {
            const resource = db.getResource(itemId)
            if (resource) {
              // Delete resource (using internal database access)
              const dbInternal = (db as any).db
              if (dbInternal && dbInternal.resources) {
                dbInternal.resources.delete(itemId)
              }

              // Record action
              const modAction: ModerationAction = {
                id: `mod_${Date.now()}_${itemId}`,
                type: 'resource',
                itemId,
                action: 'reject',
                adminId: user.id,
                adminName: user.name,
                reason: reason || 'Bulk rejection',
                automated: false,
                createdAt: new Date(),
              }
              db.createModerationAction(modAction)

              results.push({ id: itemId, success: true })
            } else {
              results.push({ id: itemId, success: false, error: 'Resource not found' })
            }
          }
        }
        // Add other types (post, comment, etc.) as needed
      } catch (error: any) {
        results.push({ id: itemId, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    const response: ApiResponse<{
      results: typeof results
      summary: { total: number; success: number; failed: number }
    }> = {
      success: true,
      data: {
        results,
        summary: {
          total: itemIds.length,
          success: successCount,
          failed: failureCount,
        },
      },
      message: `Bulk action completed: ${successCount} succeeded, ${failureCount} failed`,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error performing bulk action:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}

