/**
 * Analytics Export API
 * 
 * Export analytics data in various formats
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'

const db = getDatabase()

/**
 * GET /api/analytics/export
 * 
 * Export analytics report
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
    const format = searchParams.get('format') || 'csv'
    const range = searchParams.get('range') || '30d'

    // Get data
    const users = Array.from(db['users'].values() || [])
    const resources = db.getAllResources()
    const events = db.getUpcomingEvents()

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [
        ['Metric', 'Value'],
        ['Total Users', users.length.toString()],
        ['Total Resources', resources.length.toString()],
        ['Total Events', events.length.toString()],
      ]

      const csv = csvRows.map(row => row.join(',')).join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${range}.csv"`,
        },
      })
    } else if (format === 'pdf') {
      // In production, would use PDF library
      return NextResponse.json(
        { success: false, error: 'PDF export not yet implemented' },
        { status: 501 }
      )
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid format' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error exporting report:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to export report' },
      { status: 500 }
    )
  }
}

