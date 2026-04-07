import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// POST /api/resources/[id]/leave — member cancels their own signup (leave the resource)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const resourceId = params.id

    const { data: signup, error: fetchErr } = await admin
      .from('resource_signups')
      .select('id, status')
      .eq('resource_id', resourceId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchErr) throw fetchErr

    if (!signup) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this resource' },
        { status: 404 }
      )
    }

    if (!['approved', 'pending', 'waitlist'].includes(signup.status)) {
      return NextResponse.json(
        { success: false, error: 'Nothing to leave — you are not an active member' },
        { status: 400 }
      )
    }

    const { error: updateErr } = await admin
      .from('resource_signups')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', signup.id)

    if (updateErr) throw updateErr

    return NextResponse.json({
      success: true,
      message: 'You have left this resource',
    })
  } catch (error) {
    console.error('POST /api/resources/[id]/leave error:', error)
    const msg = (error as Error).message
    if (msg === 'Authentication required') {
      return NextResponse.json({ success: false, error: msg }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
