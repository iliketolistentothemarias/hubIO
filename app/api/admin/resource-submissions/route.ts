import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ensureAdmin } from '@/lib/admin/access'

export async function GET(request: NextRequest) {
  try {
    await ensureAdmin(request)

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
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch resource submissions:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to load submissions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { submissions: data || [] },
    })
  } catch (error) {
    console.error('Admin submissions error:', error)
    const status = (error as any)?.status || 403
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status }
    )
  }
}

