import { NextRequest, NextResponse } from 'next/server'
import { ensureAdmin } from '@/lib/admin/access'
import { createAdminClient } from '@/lib/supabase/server'

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
    const reason = payload.reason?.trim() || null

    await adminClient
      .from('resource_submissions')
      .update({
        status: 'rejected',
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', submissionId)

    return NextResponse.json({
      success: true,
      message: 'Submission rejected successfully',
    })
  } catch (error) {
    console.error('Reject submission error:', error)
    const status = (error as any)?.status || 403
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status }
    )
  }
}

