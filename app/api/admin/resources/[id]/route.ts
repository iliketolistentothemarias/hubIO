import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ensureAdmin } from '@/lib/admin/access'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureAdmin(request)

    const { id } = params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resource id is required' },
        { status: 400 }
      )
    }

    const payload = await request.json().catch(() => ({}))
    const allowedKeys: Array<'featured' | 'verified' | 'status'> = ['featured', 'verified', 'status']
    const updates = allowedKeys.reduce((acc, key) => {
      if (payload[key] !== undefined) {
        acc[key] = payload[key]
      }
      return acc
    }, {} as Record<string, any>)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid update fields provided' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('resources')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      console.error('Failed to update resource:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { resource: data },
    })
  } catch (error) {
    console.error('Admin resource update error:', error)
    const status = (error as any)?.status || 500
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureAdmin(request)

    const { id } = params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resource id is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.from('resources').delete().eq('id', id)

    if (error) {
      console.error('Failed to delete resource:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Resource deleted',
    })
  } catch (error) {
    console.error('Admin resource delete error:', error)
    const status = (error as any)?.status || 500
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status }
    )
  }
}

