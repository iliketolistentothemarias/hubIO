/**
 * Activity Feed API Route
 * 
 * Returns activity feed for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'
import { Activity } from '@/lib/types/social'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(request)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // Filter by activity type

    // Import seed activities
    const { seedActivities } = await import('@/data/seed-data')
    
    // Use seed activities with timestamps relative to now
    const mockActivities: Activity[] = seedActivities.map((activity, index) => ({
      ...activity,
      createdAt: new Date(Date.now() - (index + 1) * 1000 * 60 * 30), // Stagger timestamps
    }))

    let activities = mockActivities
    if (type) {
      activities = activities.filter(a => a.type === type)
    }

    const response: ApiResponse<Activity[]> = {
      success: true,
      data: activities.slice(0, limit),
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Activity feed error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

