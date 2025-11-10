/**
 * Conversations API Route
 * 
 * Handles conversation management for messaging system
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/types'
import { Conversation } from '@/lib/types/messaging'

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

    const userId = session.user.id

    // Get user's conversations from database
    const { data: participantData, error: participantError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId)

    if (participantError) {
      console.error('Error fetching conversations:', participantError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    if (!participantData || participantData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    const conversationIds = participantData.map(p => p.conversation_id)

    // Get conversations with participants
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    // Get all participants for these conversations
    const { data: allParticipants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id, last_read_at')
      .in('conversation_id', conversationIds)

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
    }

    // Get user profiles for participants
    const participantUserIds = [...new Set(allParticipants?.map(p => p.user_id) || [])]
    const { data: userProfiles, error: profilesError } = await supabase
      .from('users')
      .select('id, name, avatar')
      .in('id', participantUserIds)

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
    }

    const userMap = new Map((userProfiles || []).map(u => [u.id, u]))

    // Get last message for each conversation
    const { data: lastMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    if (messagesError) {
      console.error('Error fetching last messages:', messagesError)
    }

    // Group messages by conversation
    const messagesByConversation = new Map<string, any[]>()
    lastMessages?.forEach(msg => {
      const existing = messagesByConversation.get(msg.conversation_id) || []
      if (existing.length === 0) {
        existing.push(msg)
        messagesByConversation.set(msg.conversation_id, existing)
      }
    })

    // Get unread counts
    const { data: unreadData, error: unreadError } = await supabase
      .from('messages')
      .select('conversation_id, id')
      .in('conversation_id', conversationIds)
      .not('sender_id', 'eq', userId)

    if (unreadError) {
      console.error('Error fetching unread messages:', unreadError)
    }

    // Get read receipts
    const { data: readReceipts, error: readError } = await supabase
      .from('message_reads')
      .select('message_id, user_id')
      .eq('user_id', userId)
      .in('message_id', unreadData?.map(m => m.id) || [])

    if (readError) {
      console.error('Error fetching read receipts:', readError)
    }

    const readMessageIds = new Set(readReceipts?.map(r => r.message_id) || [])
    const unreadCounts = new Map<string, number>()

    unreadData?.forEach(msg => {
      if (!readMessageIds.has(msg.id)) {
        const count = unreadCounts.get(msg.conversation_id) || 0
        unreadCounts.set(msg.conversation_id, count + 1)
      }
    })

    // Build conversations array
    const conversations: Conversation[] = (conversationsData || []).map(conv => {
      const participants = allParticipants?.filter(p => p.conversation_id === conv.id).map(p => p.user_id) || []
      const participantNames: Record<string, string> = {}
      const participantAvatars: Record<string, string> = {}

      participants.forEach(pid => {
        const user = userMap.get(pid)
        participantNames[pid] = pid === userId ? 'You' : (user?.name || 'Unknown')
        if (user?.avatar) {
          participantAvatars[pid] = user.avatar
        }
      })

      const lastMessageData = messagesByConversation.get(conv.id)?.[0]
      const lastMessage = lastMessageData ? {
        id: lastMessageData.id,
        conversationId: lastMessageData.conversation_id,
        senderId: lastMessageData.sender_id,
        senderName: participantNames[lastMessageData.sender_id] || 'Unknown',
        senderAvatar: participantAvatars[lastMessageData.sender_id],
        content: lastMessageData.content,
        type: lastMessageData.type as 'text' | 'image' | 'file' | 'system',
        attachments: lastMessageData.attachments || [],
        read: readMessageIds.has(lastMessageData.id),
        createdAt: new Date(lastMessageData.created_at),
        updatedAt: new Date(lastMessageData.updated_at),
      } : undefined

      return {
        id: conv.id,
        participants,
        participantNames,
        participantAvatars,
        type: conv.type as 'direct' | 'group',
        name: conv.name,
        description: conv.description,
        lastMessage,
        lastMessageAt: lastMessage ? new Date(lastMessage.createdAt) : new Date(conv.updated_at),
        unreadCount: { [userId]: unreadCounts.get(conv.id) || 0 },
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
      }
    })

    const response: ApiResponse<Conversation[]> = {
      success: true,
      data: conversations,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Conversations error:', error)
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
    const { participantIds, type, name, description } = body

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Participant IDs are required' },
        { status: 400 }
      )
    }

    // Validate participant IDs (must be different from current user for direct messages)
    const allParticipants = [session.user.id, ...participantIds.filter((id: string) => id !== session.user.id)]
    
    if (type === 'direct' && allParticipants.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Direct messages must have exactly 2 participants' },
        { status: 400 }
      )
    }

    // Check if direct conversation already exists
    if (type === 'direct' && allParticipants.length === 2) {
      const { data: existingConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', allParticipants[0])
      
      if (existingConvs) {
        const { data: otherConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', allParticipants[1])
          .in('conversation_id', existingConvs.map(c => c.conversation_id))

        if (otherConvs && otherConvs.length > 0) {
          // Check if it's a direct conversation
          const { data: convCheck } = await supabase
            .from('conversations')
            .select('id, type')
            .eq('id', otherConvs[0].conversation_id)
            .eq('type', 'direct')
            .maybeSingle()

          if (convCheck) {
            // Return existing conversation
            const { data: existingConv } = await supabase
              .from('conversations')
              .select('*')
              .eq('id', convCheck.id)
              .single()

            if (existingConv) {
              // Get participants
              const { data: participants } = await supabase
                .from('conversation_participants')
                .select('user_id')
                .eq('conversation_id', existingConv.id)

              const { data: users } = await supabase
                .from('users')
                .select('id, name, avatar')
                .in('id', participants?.map(p => p.user_id) || [])

              const userMap = new Map((users || []).map(u => [u.id, u]))
              const participantNames: Record<string, string> = {}
              const participantAvatars: Record<string, string> = {}

              participants?.forEach(p => {
                const user = userMap.get(p.user_id)
                participantNames[p.user_id] = p.user_id === session.user.id ? 'You' : (user?.name || 'Unknown')
                if (user?.avatar) {
                  participantAvatars[p.user_id] = user.avatar
                }
              })

              const conversation: Conversation = {
                id: existingConv.id,
                participants: participants?.map(p => p.user_id) || [],
                participantNames,
                participantAvatars,
                type: existingConv.type as 'direct' | 'group',
                name: existingConv.name,
                description: existingConv.description,
                unreadCount: { [session.user.id]: 0 },
                createdAt: new Date(existingConv.created_at),
                updatedAt: new Date(existingConv.updated_at),
              }

              return NextResponse.json({
                success: true,
                data: conversation,
              })
            }
          }
        }
      }
    }

    // Create new conversation
    const { data: newConversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: type || 'direct',
        name,
        description,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (convError || !newConversation) {
      console.error('Error creating conversation:', convError)
      return NextResponse.json(
        { success: false, error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    // Add participants
    const participantInserts = allParticipants.map((userId: string) => ({
      conversation_id: newConversation.id,
      user_id: userId,
    }))

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participantInserts)

    if (participantsError) {
      console.error('Error adding participants:', participantsError)
      // Clean up conversation
      await supabase.from('conversations').delete().eq('id', newConversation.id)
      return NextResponse.json(
        { success: false, error: 'Failed to add participants' },
        { status: 500 }
      )
    }

    // Get user profiles
    const { data: users } = await supabase
      .from('users')
      .select('id, name, avatar')
      .in('id', allParticipants)

    const userMap = new Map((users || []).map(u => [u.id, u]))
    const participantNames: Record<string, string> = {}
    const participantAvatars: Record<string, string> = {}

    allParticipants.forEach((pid: string) => {
      const user = userMap.get(pid)
      participantNames[pid] = pid === session.user.id ? 'You' : (user?.name || 'Unknown')
      if (user?.avatar) {
        participantAvatars[pid] = user.avatar
      }
    })

    const conversation: Conversation = {
      id: newConversation.id,
      participants: allParticipants,
      participantNames,
      participantAvatars,
      type: newConversation.type as 'direct' | 'group',
      name: newConversation.name,
      description: newConversation.description,
      unreadCount: { [session.user.id]: 0 },
      createdAt: new Date(newConversation.created_at),
      updatedAt: new Date(newConversation.updated_at),
    }

    const response: ApiResponse<Conversation> = {
      success: true,
      data: conversation,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

