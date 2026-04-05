import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// PATCH /api/admin/users/[userId] — change a user's role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { role } = await request.json()
    const validRoles = ['volunteer', 'organizer', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: `role must be one of: ${validRoles.join(', ')}` }, { status: 400 })
    }

    // Prevent admin from accidentally removing their own admin role
    if (params.userId === user.id && role !== 'admin') {
      return NextResponse.json({ success: false, error: 'You cannot change your own admin role' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('users')
      .update({ role })
      .eq('id', params.userId)
      .select('id, name, email, role')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('PATCH /api/admin/users/[userId] error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
