import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireUserFromRequest } from '@/lib/auth/server-request'

// GET /api/resources/[id]/applications — list signups for organizer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserFromRequest(request)
    const admin = createAdminClient()
    const { id: resourceId } = params

    // Only owner/manager or admin can see applications
    const { data: resource } = await admin
      .from('resources')
      .select('submitted_by')
      .eq('id', resourceId)
      .single()

    if (!resource) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 })
    }

    const isOwner = resource.submitted_by === user.id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      // Also allow resource_members with manager role
      const { data: member } = await admin
        .from('resource_members')
        .select('role')
        .eq('resource_id', resourceId)
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted')
        .in('role', ['owner', 'manager', 'moderator'])
        .maybeSingle()
      if (!member) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'pending'

    const { data, error } = await admin
      .from('resource_signups')
      .select('id, user_id, status, message, application_data, created_at, users:user_id (id, name, email, avatar)')
      .eq('resource_id', resourceId)
      .eq('status', statusFilter)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('GET /api/resources/[id]/applications error:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
