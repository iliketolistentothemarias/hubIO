/**
 * GDPR Data Export API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGDPRService } from '@/lib/compliance/gdpr'
import { requireAuth } from '@/lib/auth'

const gdprService = getGDPRService()

/**
 * GET /api/gdpr/export
 * 
 * Export user data
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const data = gdprService.exportUserData(user.id)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('Error exporting data:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

