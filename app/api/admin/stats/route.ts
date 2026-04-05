/**
 * Admin Statistics API
 * 
 * Provides system statistics for admin dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminService } from '@/lib/services/admin'
import { ApiResponse } from '@/lib/types'

/**
 * GET /api/admin/stats
 * 
 * Get system statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const adminService = getAdminService()
    const stats = adminService.getSystemStats()

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

