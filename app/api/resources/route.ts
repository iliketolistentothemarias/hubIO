import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient({ headers: request.headers })
    const adminClient = createAdminClient()

    // Get user from session (optional for anyone to submit)
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    // Get user's current role if they exist
    let userRole = 'volunteer'
    if (userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()
      userRole = userData?.role || 'volunteer'
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
      location,
    } = await request.json()

    if (!name || !category || !description || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert into resource_submissions
    // Note: We use the server-side supabase client to respect the session if possible
    const { data, error } = await supabase
      .from('resource_submissions')
      .insert({
        name,
        category,
        description,
        address: address || '', // Address is NOT NULL in staging table
        phone,
        email,
        website: website || null,
        tags: tags || [],
        hours: hours || null,
        services: services || [],
        languages: languages || [],
        accessibility: accessibility || [],
        // Removed location as it's not in the resource_submissions staging table schema
        submitted_by: userId,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Resource submission database error:', error)
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Failed to create submission record' },
        { status: 500 }
      )
    }

    // Upgrade volunteer to organizer (but keep admin as admin)
    if (userId && userRole === 'volunteer') {
      try {
        await adminClient
          .from('users')
          .update({ role: 'organizer' })
          .eq('id', userId)
      } catch (roleErr) {
        console.warn('Failed to upgrade user role:', roleErr)
        // We don't fail the whole request just because role upgrade failed
      }
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
