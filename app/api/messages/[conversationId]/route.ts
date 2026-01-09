import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createServerClient()
    const conversationId = params.conversationId
    
    // Get authenticated user
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
    const supabase = createServerClient()
    const conversationId = params.conversationId
    
    // Get authenticated user
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

    // 1. Insert new message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        type,
        read: false,
      })
      .select('id, conversation_id, sender_id, content, type, created_at, read')
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
      supabase.from('message_status').insert({ message_id: message.id, user_id: user.id, status: 'sent' })
    ]).catch(err => console.error('Background API message tasks failed:', err))

    // 3. Return immediately
    const formattedMessage = {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      senderName: user.email || 'Unknown',
      senderAvatar: undefined,
      content: message.content,
      type: message.type,
      createdAt: message.created_at,
      read: message.read,
    }

    return NextResponse.json({
      success: true,
      data: formattedMessage,
    })
  } catch (error) {
    console.error('Error in send message API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
