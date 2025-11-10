/**
 * Messages API Route
 * 
 * Handles message operations for conversations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'
import { Message } from '@/lib/types/messaging'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(request)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // Message ID to paginate before

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Verify user is a participant
    const { data: participantCheck } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!participantCheck) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get messages
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      // Get the timestamp of the before message
      const { data: beforeMsg } = await supabase
        .from('messages')
        .select('created_at')
        .eq('id', before)
        .single()

      if (beforeMsg) {
        query = query.lt('created_at', beforeMsg.created_at)
      }
    }

    const { data: messagesData, error: messagesError } = await query

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Get read receipts
    const messageIds = messagesData?.map(m => m.id) || []
    const { data: readReceipts } = await supabase
      .from('message_reads')
      .select('message_id')
      .eq('user_id', session.user.id)
      .in('message_id', messageIds)

    const readMessageIds = new Set(readReceipts?.map(r => r.message_id) || [])

    // Get sender profiles
    const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])]
    const { data: senders } = await supabase
      .from('users')
      .select('id, name, avatar')
      .in('id', senderIds)

    const senderMap = new Map((senders || []).map(u => [u.id, u]))

    // Build messages array
    const messages: Message[] = (messagesData || [])
      .reverse() // Reverse to show oldest first
      .map(msg => {
        const sender = senderMap.get(msg.sender_id)
        return {
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          senderName: sender?.name || 'Unknown',
          senderAvatar: sender?.avatar,
          content: msg.content,
          type: msg.type as 'text' | 'image' | 'file' | 'system',
          attachments: msg.attachments || [],
          read: readMessageIds.has(msg.id),
          createdAt: new Date(msg.created_at),
          updatedAt: new Date(msg.updated_at),
        }
      })

    // Mark messages as read
    const unreadMessageIds = messages
      .filter(m => !m.read && m.senderId !== session.user.id)
      .map(m => m.id)

    if (unreadMessageIds.length > 0) {
      const readInserts = unreadMessageIds.map(msgId => ({
        message_id: msgId,
        user_id: session.user.id,
      }))

      await supabase
        .from('message_reads')
        .upsert(readInserts, { onConflict: 'message_id,user_id' })
    }

    const response: ApiResponse<Message[]> = {
      success: true,
      data: messages,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Messages error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(request)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { conversationId, content, type, attachments } = body

    if (!conversationId || !content) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID and content are required' },
        { status: 400 }
      )
    }

    // Verify user is a participant
    const { data: participantCheck } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!participantCheck) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create new message
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        content,
        type: type || 'text',
        attachments: attachments || [],
      })
      .select()
      .single()

    if (messageError || !newMessage) {
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { success: false, error: 'Failed to create message' },
        { status: 500 }
      )
    }

    // Get user profile for sender info
    const { data: userProfile } = await supabase
      .from('users')
      .select('name, avatar')
      .eq('id', session.user.id)
      .maybeSingle()

    // Mark as read for sender
    await supabase
      .from('message_reads')
      .insert({
        message_id: newMessage.id,
        user_id: session.user.id,
      })
      .select()

    const message: Message = {
      id: newMessage.id,
      conversationId: newMessage.conversation_id,
      senderId: newMessage.sender_id,
      senderName: userProfile?.name || 'You',
      senderAvatar: userProfile?.avatar,
      content: newMessage.content,
      type: newMessage.type as 'text' | 'image' | 'file' | 'system',
      attachments: newMessage.attachments || [],
      read: true, // Sender's own message is always read
      createdAt: new Date(newMessage.created_at),
      updatedAt: new Date(newMessage.updated_at),
    }

    const response: ApiResponse<Message> = {
      success: true,
      data: message,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Create message error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

