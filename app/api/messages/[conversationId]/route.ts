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

    // Fetch messages for the conversation
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, email)
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

    // Format the messages
    const formattedMessages = messages?.map((msg: any) => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      senderName: msg.sender?.email || 'Unknown',
      senderAvatar: undefined,
      content: msg.content,
      type: msg.type || 'text',
      createdAt: msg.created_at,
      read: msg.read || false,
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedMessages,
    })
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

    // 1. Insert new message (include sender join for clients)
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        type,
      })
      .select(
        `
        *,
        sender:users(id, name, avatar)
      `
      )
      .single()

    if (error) {
      console.error('Error creating message:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // 2. Fire and forget background updates
    Promise.all([
      supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId),
      supabase.from('message_status').insert({ message_id: message.id, user_id: user.id, status: 'sent' }),
    ]).catch((err) => console.error('Background API message tasks failed:', err))

    // 3. Realtime: server-side broadcast so every participant gets the event (not RLS-filtered like postgres_changes)
    const { data: participantRows } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)

    const participantIds = (participantRows ?? []).map((r) => r.user_id).filter(Boolean) as string[]
    void broadcastNewMessageAfterInsert(conversationId, message.id, participantIds)

    // 4. Response — dual shape: camelCase (Messaging.tsx / GET) + snake_case (ChatWindow)
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
