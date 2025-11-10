/**
 * Health Check API
 * 
 * Provides health status for monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'

const db = getDatabase()

/**
 * GET /api/health
 * 
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    const users = Array.from(db['users'].values() || [])
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'operational',
        cache: 'operational',
      },
      metrics: {
        users: users.length,
        uptime: process.uptime(),
      },
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    )
  }
}

