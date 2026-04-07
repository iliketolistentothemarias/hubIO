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
import { validateResource } from '@/lib/utils/validation'
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

function splitStringList(value: unknown): string[] | undefined {
  if (value === undefined) return undefined
  if (Array.isArray(value)) {
    return value.map((s) => String(s).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return undefined
}

/**
 * PATCH /api/resources/[id]
 *
 * Owner or admin: visibility, application_question, and core listing fields (name, location, etc.)
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
      .select('submitted_by')
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
    const allowed: Record<string, any> = {}

    const str = (v: unknown) => (typeof v === 'string' ? v.trim() : v)

    if (body.name !== undefined) {
      const n = str(body.name) as string
      if (!n) return NextResponse.json({ success: false, error: 'name cannot be empty' }, { status: 400 })
      allowed.name = n
    }
    if (body.category !== undefined) {
      const c = str(body.category) as string
      if (!c) return NextResponse.json({ success: false, error: 'category cannot be empty' }, { status: 400 })
      allowed.category = c
    }
    if (body.description !== undefined) {
      const d = str(body.description) as string
      if (!d) return NextResponse.json({ success: false, error: 'description cannot be empty' }, { status: 400 })
      allowed.description = d
    }
    if (body.address !== undefined) {
      const a = str(body.address) as string
      if (!a) return NextResponse.json({ success: false, error: 'address cannot be empty' }, { status: 400 })
      allowed.address = a
    }
    if (body.phone !== undefined) {
      const p = str(body.phone) as string
      if (!p) return NextResponse.json({ success: false, error: 'phone cannot be empty' }, { status: 400 })
      allowed.phone = p
    }
    if (body.email !== undefined) {
      const e = str(body.email) as string
      if (!e) return NextResponse.json({ success: false, error: 'email cannot be empty' }, { status: 400 })
      allowed.email = e
    }
    if (body.website !== undefined) {
      const w = str(body.website) as string
      allowed.website = w || null
    }
    if (body.hours !== undefined) {
      const h = str(body.hours)
      allowed.hours = h === '' ? null : h
    }
    if (body.visibility !== undefined) {
      if (!['public', 'private'].includes(body.visibility)) {
        return NextResponse.json({ success: false, error: 'visibility must be public or private' }, { status: 400 })
      }
      allowed.visibility = body.visibility
    }
    if (body.application_question !== undefined) {
      const q = str(body.application_question) as string
      allowed.application_question = q === '' ? null : q
    }

    const tags = splitStringList(body.tags)
    if (tags !== undefined) allowed.tags = tags
    const services = splitStringList(body.services)
    if (services !== undefined) allowed.services = services
    const languages = splitStringList(body.languages)
    if (languages !== undefined) allowed.languages = languages
    const accessibility = splitStringList(body.accessibility)
    if (accessibility !== undefined) allowed.accessibility = accessibility

    if (body.location !== undefined) {
      if (body.location === null) {
        allowed.location = null
      } else if (typeof body.location === 'object') {
        allowed.location = body.location
      } else if (typeof body.location === 'string') {
        const raw = body.location.trim()
        if (!raw) allowed.location = null
        else {
          try {
            allowed.location = JSON.parse(raw)
          } catch {
            return NextResponse.json(
              { success: false, error: 'location must be valid JSON or an object' },
              { status: 400 }
            )
          }
        }
      }
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 })
    }

    allowed.updated_at = new Date().toISOString()

    const { data: updated, error } = await admin
      .from('resources')
      .update(allowed)
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
 * Submitting organizer or admin — removes the resource from Supabase (cascades signups, etc.)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()

    const { data: resource, error: fetchErr } = await admin
      .from('resources')
      .select('id, submitted_by, name')
      .eq('id', params.id)
      .single()

    if (fetchErr || !resource) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 })
    }

    const isOwner = resource.submitted_by === user.id
    const isAdmin = user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { error: delErr } = await admin.from('resources').delete().eq('id', params.id)

    if (delErr) {
      console.error('DELETE resource error:', delErr)
      return NextResponse.json(
        { success: false, error: delErr.message || 'Failed to delete resource' },
        { status: 500 }
      )
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Resource deleted successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error deleting resource:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete resource' },
      { status: 500 }
    )
  }
}

