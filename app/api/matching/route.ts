/**
 * Smart Matching API Route
 * 
 * Provides personalized matches for users based on ML algorithms
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'
import { getPersonalizedMatches, MatchingCriteria } from '@/lib/services/matching'
import { getSupabaseDatabase } from '@/lib/supabase/database'

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
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') // 'resource' | 'volunteer' | 'event' | 'all'
    
    // Get user profile
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    if (userError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const supabaseDb = getSupabaseDatabase()

    // Build matching criteria from query params
    const criteria: MatchingCriteria = {}
    if (searchParams.get('lat') && searchParams.get('lng')) {
      criteria.location = {
        lat: parseFloat(searchParams.get('lat')!),
        lng: parseFloat(searchParams.get('lng')!),
        radius: searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 50,
      }
    }
    if (searchParams.get('categories')) {
      criteria.categories = searchParams.get('categories')!.split(',')
    }
    if (searchParams.get('skills')) {
      criteria.skills = searchParams.get('skills')!.split(',')
    }
    if (searchParams.get('interests')) {
      criteria.interests = searchParams.get('interests')!.split(',')
    }

    // Fetch items to match
    const items: any = {}

    if (!type || type === 'resource' || type === 'all') {
      const resources = await supabaseDb.getAllResources()
      items.resources = resources.slice(0, 100)
    }

    if (!type || type === 'volunteer' || type === 'all') {
      const opportunities = await supabaseDb.getAllVolunteerOpportunities()
      items.volunteerOpportunities = opportunities.slice(0, 100)
    }

    if (!type || type === 'event' || type === 'all') {
      const events = await supabaseDb.getAllEvents()
      items.events = events.slice(0, 100)
    }

    // Get matches
    const matches = getPersonalizedMatches(userProfile, items, criteria, limit)

    const response: ApiResponse<any> = {
      success: true,
      data: matches,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Matching error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

