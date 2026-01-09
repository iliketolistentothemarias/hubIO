import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ensureAdmin } from '@/lib/admin/access'

export async function GET(request: NextRequest) {
  try {
    await ensureAdmin(request)

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load resources:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to load resources' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { resources: data || [] },
    })
  } catch (error) {
    console.error('Admin resources list error:', error)
    const status = (error as any)?.status || 403
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status }
    )
  }
}

