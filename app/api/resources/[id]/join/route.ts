import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// POST /api/resources/[id]/join — join or apply for a resource
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { id: resourceId } = params

    // Fetch resource to check visibility
    const { data: resource } = await admin
      .from('resources')
      .select('id, name, visibility, application_question, submitted_by')
      .eq('id', resourceId)
      .single()

    if (!resource) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 })
    }

    // Check if already signed up
    const { data: existing } = await admin
      .from('resource_signups')
      .select('id, status')
      .eq('resource_id', resourceId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Block active/pending statuses — but allow re-applying after removal or rejection
    if (existing && !['cancelled', 'rejected'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Already joined or applied', currentStatus: existing.status },
        { status: 409 }
      )
    }

    let status: string
    let application_data: any = null

    if (resource.visibility === 'public') {
      status = 'approved'
    } else {
      const body = await request.json().catch(() => ({}))
      const { name, email, phone, skills_answer } = body
      if (!name || !email || !skills_answer) {
        return NextResponse.json(
          { success: false, error: 'name, email, and skills_answer are required for private resources' },
          { status: 400 }
        )
      }
      status = 'pending'
      application_data = { name, email, phone: phone || null, skills_answer }
    }

    let signup: any
    if (existing) {
      // Re-join: update the existing record
      const { data: updated, error } = await admin
        .from('resource_signups')
        .update({ status, application_data, muted_from_chat: false, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('id, status')
        .single()
      if (error) throw error
      signup = updated
    } else {
      const { data: inserted, error } = await admin
        .from('resource_signups')
        .insert({ resource_id: resourceId, user_id: user.id, status, slots: 1, application_data })
        .select('id, status')
        .single()
      if (error) throw error
      signup = inserted
    }

    // If private, notify the resource owner about new application
    if (status === 'pending' && resource.submitted_by) {
      try {
        const { data: applicantProfile } = await admin
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single()
        await admin.from('notifications').insert({
          user_id: resource.submitted_by,
          type: 'message',
          title: `New application for "${resource.name}"`,
          message: `${applicantProfile?.name || 'Someone'} has applied to join your resource. Check the Organizer Panel to review.`,
          read: false,
        })
      } catch (notifErr) {
        console.error('Failed to notify owner of new application:', notifErr)
      }
    }

    return NextResponse.json({
      success: true,
      data: signup,
      message: status === 'approved' ? 'Joined successfully' : 'Application submitted — awaiting approval',
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/resources/[id]/join error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// GET /api/resources/[id]/join — check current user's join status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { id: resourceId } = params

    const { data: signup } = await admin
      .from('resource_signups')
      .select('id, status')
      .eq('resource_id', resourceId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Also check if they're an owner via resource_members
    const { data: member } = await admin
      .from('resource_members')
      .select('role')
      .eq('resource_id', resourceId)
      .eq('user_id', user.id)
      .eq('invitation_status', 'accepted')
      .maybeSingle()

    return NextResponse.json({
      success: true,
      data: {
        signup: signup || null,
        member: member || null,
        isOwner: !!member && ['owner', 'manager'].includes(member.role),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
