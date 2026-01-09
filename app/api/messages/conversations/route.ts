import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch conversations for the user
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_participants!inner(user_id, joined_at),
        messages(
          id,
          content,
          sender_id,
          created_at
        )
      `)
      .eq('conversation_participants.user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    // Format the conversations
    const formattedConversations = conversations?.map((conv: any) => {
      const lastMessage = conv.messages?.[0] || null
      const participants = conv.conversation_participants || []
      
      return {
        id: conv.id,
        type: conv.type || 'direct',
        name: conv.name || 'Conversation',
        participantNames: participants.reduce((acc: any, p: any) => {
          acc[p.user_id] = 'User' // In a real app, fetch user names
          return acc
        }, {}),
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          senderId: lastMessage.sender_id,
          createdAt: lastMessage.created_at,
        } : null,
        lastMessageAt: conv.updated_at,
        unreadCount: { [user.id]: 0 }, // Simplified unread count
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: formattedConversations,
    })
  } catch (error) {
    console.error('Error in conversations API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
