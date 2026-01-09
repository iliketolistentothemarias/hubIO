import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ensureAdmin } from '@/lib/admin/access'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { adminId } = await ensureAdmin(request)
    const submissionId = params.submissionId
    const adminClient = createAdminClient()

    const { data: submission, error: fetchError } = await adminClient
      .from('resource_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Submission already processed' },
        { status: 400 }
      )
    }

    const payload = await request.json().catch(() => ({}))
    const { data: resourceData, error: resourceError } = await adminClient
      .from('resources')
      .insert({
        name: submission.name,
        category: submission.category,
        description: submission.description,
        address: submission.address || null,
        phone: submission.phone,
        email: submission.email,
        website: submission.website || null,
        tags: submission.tags || [],
        hours: submission.hours || null,
        services: submission.services || [],
        languages: submission.languages || [],
        accessibility: submission.accessibility || [],
        submitted_by: submission.submitted_by,
        location: submission.location,
        verified: true,
        featured: Boolean(payload.featured),
      })
      .select('id')
      .single()

    if (resourceError || !resourceData) {
      console.error('Failed to create resource:', resourceError)
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to publish resource: ${resourceError?.message || 'Database error'}` 
        },
        { status: 500 }
      )
    }

    const { error: updateError } = await adminClient
      .from('resource_submissions')
      .update({
        status: 'approved',
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        resource_id: resourceData.id,
        admin_notes: payload.adminNotes || null,
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Failed to update submission status:', updateError)
      return NextResponse.json(
        { 
          success: false, 
          error: `Resource created but failed to update submission: ${updateError.message}` 
        },
        { status: 500 }
      )
    }

    // Upgrade the submitter's role to 'organizer' if they are currently a 'volunteer'
    if (submission.submitted_by) {
      const { error: roleError } = await adminClient
        .from('users')
        .update({ role: 'organizer' })
        .eq('id', submission.submitted_by)
        .eq('role', 'volunteer')
      
      if (roleError) {
        console.warn('Failed to upgrade user role:', roleError)
      }
    }

    return NextResponse.json({
      success: true,
      data: { resourceId: resourceData.id },
      message: 'Resource approved and published successfully',
    })
  } catch (error) {
    console.error('Approve submission error:', error)
    const status = (error as any)?.status || 403
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status }
    )
  }
}

