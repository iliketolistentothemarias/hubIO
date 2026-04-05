import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { broadcastNewMessageAfterInsert } from '@/lib/realtime/server-broadcast'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createServerClient({ headers: request.headers })
    const conversationId = params.conversationId

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users(id, name, avatar)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    const formattedMessages = (messages ?? []).map((msg: any) => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      senderName: msg.sender?.name || 'Unknown',
      senderAvatar: msg.sender?.avatar,
      content: msg.content,
      type: msg.type || 'text',
      createdAt: msg.created_at,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      created_at: msg.created_at,
      updated_at: msg.updated_at ?? msg.created_at,
      sender: msg.sender,
    }))

    return NextResponse.json({ success: true, data: formattedMessages })
  } catch (error) {
    console.error('Error in messages API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createServerClient({ headers: request.headers })
    const conversationId = params.conversationId

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, type = 'text' } = body

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        type,
      })
      .select(`*, sender:users(id, name, avatar)`)
      .single()

    if (error) {
      console.error('Error creating message:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Fire and forget: update conversation timestamp
    supabase.from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .then(() => {})
      .catch((err: any) => console.error('BG update failed:', err))

    // Realtime broadcast to all participants
    const { data: participantRows } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)

    const participantIds = (participantRows ?? []).map((r) => r.user_id).filter(Boolean) as string[]
    void broadcastNewMessageAfterInsert(conversationId, message.id, participantIds)

    const s = message.sender as { id?: string; name?: string; avatar?: string } | null
    const senderName = s?.name || user.email || 'Unknown'
    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        senderName,
        senderAvatar: s?.avatar,
        content: message.content,
        type: message.type,
        createdAt: message.created_at,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        created_at: message.created_at,
        updated_at: message.updated_at ?? message.created_at,
        sender: s
          ? { id: s.id, name: s.name, avatar: s.avatar }
          : { id: user.id, name: senderName, avatar: undefined },
      },
    })
  } catch (error) {
    console.error('Error in send message API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
