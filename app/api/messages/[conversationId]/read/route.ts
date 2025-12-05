import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

/**
 * POST /api/messages/[conversationId]/read
 * Mark messages as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = params
    const body = await request.json()
    const { message_ids } = body

    if (!message_ids || !Array.isArray(message_ids)) {
      return NextResponse.json({ error: 'message_ids array is required' }, { status: 400 })
    }

    // Update message_reads
    const reads = message_ids.map(messageId => ({
      message_id: messageId,
      user_id: user.id
    }))

    const { error: readsError } = await supabase
      .from('message_reads')
      .upsert(reads)

    if (readsError) {
      return NextResponse.json({ error: readsError.message }, { status: 500 })
    }

    // Update conversation metadata
    const { error: metaError } = await supabase
      .from('conversation_metadata')
      .update({
        unread_count: 0,
        last_read_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)

    if (metaError) {
      return NextResponse.json({ error: metaError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

