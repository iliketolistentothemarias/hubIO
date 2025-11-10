/**
 * GDPR Data Deletion API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGDPRService } from '@/lib/compliance/gdpr'
import { requireAuth } from '@/lib/auth'

const gdprService = getGDPRService()

/**
 * DELETE /api/gdpr/delete
 * 
 * Delete user data (Right to be forgotten)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const deleted = gdprService.deleteUserData(user.id)

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Data deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting data:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete data' },
      { status: 500 }
    )
  }
}

