/**
 * Resources API Route
 * 
 * Handles CRUD operations for community resources.
 * 
 * Endpoints:
 * - GET /api/resources - Get all resources (with filtering)
 * - POST /api/resources - Create new resource
 * - GET /api/resources/[id] - Get specific resource
 * - PUT /api/resources/[id] - Update resource
 * - DELETE /api/resources/[id] - Delete resource
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { getSupabaseDatabase } from '@/lib/supabase/database'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthService, requireAuth } from '@/lib/auth'
import { validateResource } from '@/lib/utils/validation'
import { ApiResponse, Resource, PaginatedResponse } from '@/lib/types'

const db = getDatabase()
const supabaseDb = getSupabaseDatabase()

/**
 * GET /api/resources
 * 
 * Get all resources with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const featured = searchParams.get('featured') === 'true'

    let resources: Resource[] = []

    // Get resources by category
    if (category && category !== 'All Categories') {
      resources = db.getResourcesByCategory(category)
    } else {
      // Get all resources
      resources = db.getAllResources()
    }

    // Apply search filter
    if (search) {
      resources = db.searchResources(search)
    }

    // Filter featured
    if (featured) {
      resources = resources.filter(r => r.featured)
    }

    // Pagination
    const total = resources.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const paginatedResources = resources.slice(startIndex, startIndex + pageSize)

    const response: ApiResponse<PaginatedResponse<Resource>> = {
      success: true,
      data: {
        items: paginatedResources,
        total,
        page,
        pageSize,
        totalPages,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/resources
 * 
 * Create a new resource (authentication optional - anonymous submissions allowed)
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get user if authenticated (optional)
    let submittedBy: string | undefined = undefined
    try {
      const supabase = createServerClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single()
        if (userProfile) {
          submittedBy = userProfile.id
        }
      }
    } catch {
      // Not authenticated - that's fine, anonymous submissions allowed
    }
    
    const body = await request.json()
    
    // Validate resource data
    const validation = validateResource(body)
    if (!validation.valid) {
      console.log('Validation errors:', validation.errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed. Please check the form fields.',
          errors: validation.errors 
        },
        { status: 400 }
      )
    }

    // Create resource (pending approval)
    const resourceData: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'> = {
      name: body.name,
      category: body.category,
      description: body.description,
      address: body.address,
      location: body.location || {
        lat: 0,
        lng: 0,
        address: body.address,
        city: body.city || '',
        state: body.state || '',
        zipCode: body.zipCode || '',
      },
      phone: body.phone,
      email: body.email,
      website: body.website || '',
      tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(',').map((t: string) => t.trim()) : []),
      featured: false,
      verified: false, // Requires admin verification
      submittedBy,
    }

    // Create resource directly in Supabase using server client
    let created: Resource
    try {
      const supabase = createServerClient()
      
      const { data, error } = await supabase
        .from('resources')
        .insert({
          name: resourceData.name,
          category: resourceData.category,
          description: resourceData.description,
          address: resourceData.address,
          location: resourceData.location,
          phone: resourceData.phone,
          email: resourceData.email,
          website: resourceData.website || '',
          tags: resourceData.tags || [],
          featured: resourceData.featured || false,
          verified: resourceData.verified || false,
          submitted_by: submittedBy || null,
        })
        .select()
        .single()
      
      if (error) {
        console.error('Supabase insert error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }
      
      if (!data) {
        throw new Error('No data returned from Supabase insert')
      }
      
      // Map Supabase data to Resource type
      created = {
        id: data.id,
        name: data.name,
        category: data.category as any,
        description: data.description,
        address: data.address,
        location: data.location || { lat: 0, lng: 0, address: data.address, city: '', state: '', zipCode: '' },
        phone: data.phone,
        email: data.email,
        website: data.website || '',
        tags: data.tags || [],
        featured: data.featured || false,
        verified: data.verified || false,
        rating: data.rating,
        reviewCount: data.review_count,
        hours: data.hours,
        services: data.services,
        capacity: data.capacity,
        languages: data.languages,
        accessibility: data.accessibility,
        submittedBy: data.submitted_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
      
      console.log('Resource successfully created in Supabase:', created.id)
    } catch (error: any) {
      console.error('Error creating resource in Supabase:', error)
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      
      // Return error instead of falling back to local DB
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Failed to create resource in database',
          details: error.code || 'Unknown error'
        },
        { status: 500 }
      )
    }

    const response: ApiResponse<Resource> = {
      success: true,
      data: created,
      message: 'Your request has been submitted. If approved, you should see your resource up shortly.',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Error creating resource:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create resource' },
      { status: 500 }
    )
  }
}

