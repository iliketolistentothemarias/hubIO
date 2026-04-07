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
import { requireUserFromRequest } from '@/lib/auth/server-request'
import { validateResource, validateResourceListingUpdate } from '@/lib/utils/validation'
import { ApiResponse, Resource } from '@/lib/types'
import { createAdminClient } from '@/lib/supabase/server'

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
    const user = await requireUserFromRequest(request)
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
 * PATCH /api/resources/[id]
 *
 * Update resource settings (visibility, application_question) — requires ownership or admin
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()

    const { data: resource } = await admin
      .from('resources')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!resource) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 })
    }

    const isOwner = resource.submitted_by === user.id
    const isAdmin = user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()

    const listingKeys = [
      'name',
      'category',
      'description',
      'address',
      'phone',
      'email',
      'website',
      'tags',
      'hours',
      'services',
      'languages',
      'accessibility',
      'capacity',
      'location',
    ] as const

    const wantsListingUpdate = listingKeys.some((k) => body[k] !== undefined)

    const allowed: Record<string, any> = {}
    if (body.visibility !== undefined) allowed.visibility = body.visibility
    if (body.application_question !== undefined) allowed.application_question = body.application_question

    if (wantsListingUpdate) {
      const listingPayload: Record<string, any> = {}
      for (const k of listingKeys) {
        if (body[k] !== undefined) listingPayload[k] = body[k]
      }
      const mergedForValidation = { ...resource, ...listingPayload }
      const validation = validateResourceListingUpdate(mergedForValidation)
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', errors: validation.errors },
          { status: 400 }
        )
      }
      Object.assign(allowed, listingPayload)
      if (allowed.website === '') allowed.website = null
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: updated, error } = await admin
      .from('resources')
      .update({ ...allowed, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/resources/[id] error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

/**
 * DELETE /api/resources/[id]
 *
 * Delete resource: submitter (organizer) or admin — Supabase (RLS allows submitter + admin).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()

    const { data: row } = await admin
      .from('resources')
      .select('id, submitted_by')
      .eq('id', params.id)
      .maybeSingle()

    if (!row) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 })
    }

    const isOwner = row.submitted_by === user.id
    const isAdmin = user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await admin.from('resources').delete().eq('id', params.id)
    if (error) throw error

    const response: ApiResponse<null> = {
      success: true,
      message: 'Resource deleted successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error deleting resource:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete resource' },
      { status: 500 }
    )
  }
}

