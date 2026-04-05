import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// GET /api/resources/joined — fetch all resources the current user has joined or owns
export async function GET(request: NextRequest) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()

    // Resources where user is an approved signup
    const { data: signups } = await admin
      .from('resource_signups')
      .select('resource_id, resources:resource_id (id, name, category, description, visibility, status, submitted_by)')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20)

    // Resources the user submitted/owns (accepted by admin)
    const { data: owned } = await admin
      .from('resources')
      .select('id, name, category, description, visibility, status, submitted_by')
      .eq('submitted_by', user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(20)

    const ownedIds = new Set((owned || []).map((r: any) => r.id))

    const list = [
      ...(owned || []).map((r: any) => ({ ...r, is_owner: true })),
      ...((signups || [])
        .filter((s: any) => s.resources && !ownedIds.has(s.resource_id))
        .map((s: any) => ({ ...s.resources, is_owner: false }))
      ),
    ]

    return NextResponse.json({ success: true, data: list })
  } catch (error) {
    console.error('GET /api/resources/joined error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
