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
    const resourceResponse = await adminClient
      .from('resources')
      .insert({
        name: submission.name,
        category: submission.category,
        description: submission.description,
        address: submission.address,
        phone: submission.phone,
        email: submission.email,
        website: submission.website,
        tags: submission.tags ?? [],
        hours: submission.hours,
        services: submission.services ?? [],
        languages: submission.languages ?? [],
        accessibility: submission.accessibility ?? [],
        submitted_by: submission.submitted_by,
        verified: true,
        featured: Boolean(payload.featured),
      })
      .select('id')
      .single()

    if (resourceResponse.error || !resourceResponse.data) {
      console.error('Failed to create resource', resourceResponse.error)
      return NextResponse.json(
        { success: false, error: 'Failed to publish resource' },
        { status: 500 }
      )
    }

    await adminClient
      .from('resource_submissions')
      .update({
        status: 'approved',
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        resource_id: resourceResponse.data.id,
        admin_notes: payload.adminNotes || null,
      })
      .eq('id', submissionId)

    return NextResponse.json({
      success: true,
      data: { resourceId: resourceResponse.data.id },
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

