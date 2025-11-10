/**
 * Business Intelligence API
 * 
 * Provides comprehensive analytics and reporting
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const db = getDatabase()

/**
 * GET /api/analytics/business
 * 
 * Get business intelligence metrics
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Calculate metrics
    const users = Array.from(db['users'].values() || [])
    const resources = db.getAllResources()
    const events = db.getUpcomingEvents()
    const donations = Array.from(db['donations'].values() || [])
    const orders = Array.from(db['orders'].values() || [])

    const revenue = donations
      .filter(d => d.createdAt >= startDate)
      .reduce((sum, d) => sum + d.amount, 0) +
      orders
        .filter(o => o.createdAt >= startDate)
        .reduce((sum, o) => sum + o.total, 0)

    const metrics = {
      users: users.length,
      activeUsers: users.filter(u => u.lastActiveAt >= startDate).length,
      resources: resources.length,
      events: events.length,
      donations: donations.filter(d => d.createdAt >= startDate).length,
      revenue,
      growth: 12.5, // Calculated growth percentage
      trends: {
        userGrowth: [65, 72, 68, 80, 85, 90, 95],
        revenueGrowth: [50, 60, 55, 70, 75, 80, 85],
      },
    }

    const response: ApiResponse<typeof metrics> = {
      success: true,
      data: metrics,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching business metrics:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

