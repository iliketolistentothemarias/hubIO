import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ensureAdmin } from '@/lib/admin/access'

export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    await ensureAdmin(request)

    const { submissionId } = params
    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Submission id is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('resource_submissions')
      .select(`
        *,
        submitted_by (
          id,
          name,
          email,
          role
        ),
        processed_by (
          id,
          name,
          email,
          role
        )
      `)
      .eq('id', submissionId)
      .maybeSingle()

    if (error) {
      console.error('Failed to load submission:', error)
      throw new Error('Failed to load submission')
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { submission: data },
    })
  } catch (error) {
    console.error('Submission detail error:', error)
    const status = (error as any)?.status || 500
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status }
    )
  }
}

