/**
 * Admin Resource Approval API
 * 
 * Allows admins to approve or reject resource submissions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth'
import { ApiResponse } from '@/lib/types'

const db = getDatabase()

/**
 * POST /api/admin/resources/[id]/approve
 * 
 * Approve a resource submission
 */
export async function POST(
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

    // Update resource to verified
    const updated = {
      ...resource,
      verified: true,
      updatedAt: new Date(),
    }

    db.createResource(updated)

    const response: ApiResponse<any> = {
      success: true,
      message: 'Resource approved successfully',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error approving resource:', error)
    
    if (error.message?.includes('required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to approve resource' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/resources/[id]/approve
 * 
 * Reject a resource submission
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

    // In production, would mark as rejected or delete
    // For demo, we'll just return success

    const response: ApiResponse<null> = {
      success: true,
      message: 'Resource rejected',
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error rejecting resource:', error)
    
    if (error.message?.includes('required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to reject resource' },
      { status: 500 }
    )
  }
}

