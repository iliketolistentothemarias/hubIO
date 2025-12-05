import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient()

    // Get user from Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization') || ''
    let userId: string | null = null
    let userRole: string | null = null

    if (authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7).trim()
      const { data, error } = await adminClient.auth.getUser(token)

      if (error || !data.user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      userId = data.user.id

      // Get user's current role
      const { data: userData } = await adminClient
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      userRole = userData?.role || 'volunteer'
    } else {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const {
      name,
      category,
      description,
      address,
      phone,
      email,
      website,
      tags,
      hours,
      services,
      languages,
      accessibility,
    } = await request.json()

    if (!name || !category || !description || !address || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await adminClient
      .from('resource_submissions')
      .insert({
        name,
        category,
        description,
        address,
        phone,
        email,
        website: website || null,
        tags: tags || [],
        hours: hours || null,
        services: services || [],
        languages: languages || [],
        accessibility: accessibility || [],
        submitted_by: userId,
        status: 'pending',
      })
      .select('id, created_at')
      .single()

    if (error || !data) {
      console.error('Resource submission error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to submit resource' },
        { status: 500 }
      )
    }

    // Upgrade volunteer to organizer (but keep admin as admin)
    if (userId && userRole === 'volunteer') {
      await adminClient
        .from('users')
        .update({ role: 'organizer' })
        .eq('id', userId)
    }

    return NextResponse.json({
      success: true,
      data: { submission: data },
      message: 'Resource submitted successfully and is awaiting admin approval.',
    })
  } catch (error) {
    console.error('Resource submission error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
