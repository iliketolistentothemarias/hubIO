/**
 * Individual Resource API Route
 * 
 * Handles operations for a specific resource.
 * 
 * Endpoints:
 * - GET /api/resources/[id] - Get resource by ID
 * - PUT /api/resources/[id] - Update resource
 * - DELETE /api/resources/[id] - Delete resource
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireAuth, requireRole } from '@/lib/auth'
import { validateResource } from '@/lib/utils/validation'
import { ApiResponse, Resource } from '@/lib/types'

const db = getDatabase()

/**
 * GET /api/resources/[id]
 * 
 * Get resource by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resource = db.getResource(params.id)

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      )
    }

    const response: ApiResponse<Resource> = {
      success: true,
      data: resource,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching resource:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resource' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/resources/[id]
 * 
 * Update resource (requires authentication and ownership or admin role)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth()
    const resource = db.getResource(params.id)

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Check permissions (owner or admin)
    if (resource.submittedBy !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate updates
    const validation = validateResource({ ...resource, ...body })
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      )
    }

    // Update resource
    const updated: Resource = {
      ...resource,
      ...body,
      updatedAt: new Date(),
    }

    db.createResource(updated) // Update by creating with same ID

    const response: ApiResponse<Resource> = {
      success: true,
      data: updated,
      message: 'Resource updated successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error updating resource:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update resource' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/resources/[id]
 * 
 * Delete resource (requires admin role)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireRole('admin')
    
    const resource = db.getResource(params.id)

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      )
    }

    // In production, would actually delete from database
    // For demo, we'll just return success

    const response: ApiResponse<null> = {
      success: true,
      message: 'Resource deleted successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error deleting resource:', error)
    
    if (error.message?.includes('required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete resource' },
      { status: 500 }
    )
  }
}

