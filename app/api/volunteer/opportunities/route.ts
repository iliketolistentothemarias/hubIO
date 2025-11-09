/**
 * Volunteer Opportunities API
 * 
 * Handles volunteer opportunity operations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { ApiResponse, VolunteerOpportunity, PaginatedResponse } from '@/lib/types'

const db = getDatabase()

/**
 * GET /api/volunteer/opportunities
 * 
 * Get volunteer opportunities (with optional filtering)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'active'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    let opportunities = db.getAllVolunteerOpportunities()

    // Filter by status
    if (status !== 'all') {
      opportunities = opportunities.filter(opp => opp.status === status)
    }

    // Filter by category
    if (category && category !== 'All') {
      opportunities = opportunities.filter(opp => opp.category === category)
    }

    // Sort by date
    opportunities.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Pagination
    const total = opportunities.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const paginated = opportunities.slice(startIndex, startIndex + pageSize)

    const response: ApiResponse<PaginatedResponse<VolunteerOpportunity>> = {
      success: true,
      data: {
        items: paginated,
        total,
        page,
        pageSize,
        totalPages,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching volunteer opportunities:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch opportunities' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/volunteer/opportunities
 * 
 * Create a new volunteer opportunity (requires organizer/admin role)
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth()
    
    if (user.role !== 'organizer' && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Organizer or admin role required.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const opportunity: VolunteerOpportunity = {
      id: `vol_${Date.now()}`,
      title: body.title,
      organization: body.organization,
      organizationId: body.organizationId || '',
      description: body.description,
      category: body.category,
      date: new Date(body.date),
      time: body.time,
      location: body.location,
      volunteersNeeded: body.volunteersNeeded || 10,
      volunteersSignedUp: 0,
      skills: body.skills || [],
      requirements: body.requirements || [],
      remote: body.remote || false,
      duration: body.duration || '2-4 hours',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const created = db.createVolunteerOpportunity(opportunity)

    const response: ApiResponse<VolunteerOpportunity> = {
      success: true,
      data: created,
      message: 'Volunteer opportunity created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating volunteer opportunity:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create opportunity' },
      { status: 500 }
    )
  }
}

