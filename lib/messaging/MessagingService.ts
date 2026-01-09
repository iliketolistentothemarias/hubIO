/**
 * Messaging Service
 * 
 * Real-time messaging with Supabase Realtime
 * Handles conversations, messages, typing indicators, presence, and more
 */

import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  attachments?: any[]
  created_at: string
  updated_at: string
  status?: 'sent' | 'delivered' | 'read'
  sender?: {
    id: string
    name: string
    avatar?: string
  }
}

export interface Conversation {
  id: string
  type: 'direct' | 'group'
  name?: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  participants: ConversationParticipant[]
  last_message?: Message
  metadata?: ConversationMetadata
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  joined_at: string
  last_read_at?: string
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export interface ConversationMetadata {
  unread_count: number
  last_read_at?: string
  muted: boolean
  archived: boolean
  pinned: boolean
}

export interface TypingIndicator {
  conversation_id: string
  user_id: string
  user_name: string
  started_at: string
}

export interface UserPresence {
  user_id: string
  status: 'online' | 'away' | 'offline'
  last_seen: string
}

class MessagingService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)

      if (participantError) throw participantError

      const conversationIds = participantData.map(p => p.conversation_id)
      if (conversationIds.length === 0) return []

      // Get conversation details
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false })

      if (convError) throw convError

      // Get participants for each conversation
      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          user:users(id, name, email, avatar)
        `)
        .in('conversation_id', conversationIds)

      if (partError) throw partError

      // Get metadata for each conversation
      const { data: metadata, error: metaError } = await supabase
        .from('conversation_metadata')
        .select('*')
        .eq('user_id', user.id)
        .in('conversation_id', conversationIds)

      if (metaError) throw metaError

      // Get last message for each conversation
      const { data: lastMessages, error: msgError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(id, name, avatar)
        `)
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })

      if (msgError) throw msgError

      // Combine all data
      return conversations.map(conv => {
        const convParticipants = participants.filter(p => p.conversation_id === conv.id)
        const convMetadata = metadata.find(m => m.conversation_id === conv.id)
        const lastMsg = lastMessages.find(m => m.conversation_id === conv.id)

        return {
          ...conv,
          participants: convParticipants,
          metadata: convMetadata,
          last_message: lastMsg
        }
      })
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  }

  /**
   * Get or create a direct conversation with another user
   */
  async getOrCreateDirectConversation(otherUserId: string): Promise<Conversation> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if conversation already exists
      const { data: existingParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)

      if (existingParticipants && existingParticipants.length > 0) {
        const conversationIds = existingParticipants.map(p => p.conversation_id)

        // Find conversation with exactly these two participants
        const { data: otherParticipants } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .in('conversation_id', conversationIds)

        if (otherParticipants) {
          const conversationCounts = otherParticipants.reduce((acc, p) => {
            acc[p.conversation_id] = (acc[p.conversation_id] || 0) + 1
            return acc
          }, {} as Record<string, number>)

          for (const convId of conversationIds) {
            if (conversationCounts[convId] === 2) {
              const participants = otherParticipants.filter(p => p.conversation_id === convId)
              if (participants.some(p => p.user_id === otherUserId)) {
                // Found existing conversation
                const { data: conversation } = await supabase
                  .from('conversations')
                  .select('*')
                  .eq('id', convId)
                  .single()

                if (conversation) {
                  const { data: fullParticipants } = await supabase
                    .from('conversation_participants')
                    .select(`
                      *,
                      user:users(id, name, email, avatar)
                    `)
                    .eq('conversation_id', convId)

                  return {
                    ...conversation,
                    participants: fullParticipants || []
                  }
                }
              }
            }
          }
        }
      }

      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: user.id
        })
        .select()
        .single()

      if (convError) throw convError

      // Add participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: user.id },
          { conversation_id: newConversation.id, user_id: otherUserId }
        ])

      if (partError) throw partError

      // Get participants with user data
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          user:users(id, name, email, avatar)
        `)
        .eq('conversation_id', newConversation.id)

      return {
        ...newConversation,
        participants: participants || []
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: string,
    options: { limit?: number; before?: string } = {}
  ): Promise<Message[]> {
    try {
      const { limit = 50, before } = options

      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:users(id, name, avatar)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (before) {
        query = query.lt('created_at', before)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).reverse() // Reverse to show oldest first
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    userId?: string,
    type: 'text' | 'image' | 'file' = 'text'
  ): Promise<Message> {
    try {
      let finalUserId = userId
      if (!finalUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        finalUserId = user.id
      }

      this.stopTyping(conversationId)

      // Use a single rpc or minimal select to speed up delivery
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: finalUserId,
          content,
          type
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          type,
          created_at
        `)
        .single()

      if (error) throw error

      // Fire and forget background maintenance
      Promise.all([
        supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
      ]).catch(err => console.error('BG maintenance failed:', err))

      return data as Message
    } catch (error) {
      console.error('Fast send error:', error)
      throw error
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, messageIds: string[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update message_reads table
      await supabase
        .from('message_reads')
        .upsert(
          messageIds.map(messageId => ({
            message_id: messageId,
            user_id: user.id
          }))
        )

      // Create 'read' status for each message
      await supabase
        .from('message_status')
        .upsert(
          messageIds.map(messageId => ({
            message_id: messageId,
            user_id: user.id,
            status: 'read'
          }))
        )

      // Reset unread count
      await supabase
        .from('conversation_metadata')
        .update({
          unread_count: 0,
          last_read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      // Update participant's last_read_at
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Error marking messages as read:', error)
      throw error
    }
  }

  /**
   * Start typing indicator
   */
  async startTyping(conversationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: user.id,
          started_at: new Date().toISOString()
        })

      // Auto-stop after 5 seconds
      const key = `${conversationId}-${user.id}`
      if (this.typingTimeouts.has(key)) {
        clearTimeout(this.typingTimeouts.get(key)!)
      }

      const timeout = setTimeout(() => {
        this.stopTyping(conversationId)
      }, 5000)

      this.typingTimeouts.set(key, timeout)
    } catch (error) {
      console.error('Error starting typing:', error)
    }
  }

  /**
   * Stop typing indicator
   */
  async stopTyping(conversationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      const key = `${conversationId}-${user.id}`
      if (this.typingTimeouts.has(key)) {
        clearTimeout(this.typingTimeouts.get(key)!)
        this.typingTimeouts.delete(key)
      }
    } catch (error) {
      console.error('Error stopping typing:', error)
    }
  }

  /**
   * Update user presence
   */
  async updatePresence(status: 'online' | 'away' | 'offline'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }

  /**
   * Get user presence
   */
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) return null
      return data
    } catch (error) {
      return null
    }
  }

  /**
   * Check if a user is blocked
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .single()

      return !!data
    } catch (error) {
      return false
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string, reason?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
          reason
        })
    } catch (error) {
      console.error('Error blocking user:', error)
      throw error
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
    } catch (error) {
      console.error('Error unblocking user:', error)
      throw error
    }
  }

  /**
   * Update conversation metadata (pin, mute, archive)
   */
  async updateMetadata(conversationId: string, updates: Partial<ConversationMetadata>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('conversation_metadata')
        .update(updates)
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating conversation metadata:', error)
      throw error
    }
  }

  /**
   * Delete a conversation (for the current user)
   * This typically means archiving it or removing it from the user's list
   * Real deletion is usually reserved for admins or if both participants delete it
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // For a simple implementation, we'll just archive it for the user
      // or we could delete the participant record if we want it completely gone from their list
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      if (error) throw error

      // Also clean up metadata
      await supabase
        .from('conversation_metadata')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw error
    }
  }

  /**
   * Report a user
   */
  async reportUser(
    userId: string,
    reason: string,
    description?: string,
    conversationId?: string,
    messageId?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('user_reports')
        .insert({
          reporter_id: user.id,
          reported_id: userId,
          conversation_id: conversationId,
          message_id: messageId,
          reason,
          description
        })
    } catch (error) {
      console.error('Error reporting user:', error)
      throw error
    }
  }

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void
  ): () => void {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch full message with sender data
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users(id, name, avatar)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            callback(data)
          }
        }
      )
      .subscribe()

    this.channels.set(`messages:${conversationId}`, channel)

    return () => {
      channel.unsubscribe()
      this.channels.delete(`messages:${conversationId}`)
    }
  }

  /**
   * Subscribe to typing indicators in a conversation
   */
  subscribeToTyping(
    conversationId: string,
    callback: (indicators: TypingIndicator[]) => void
  ): () => void {
    const fetchTyping = async () => {
      const { data } = await supabase
        .from('typing_indicators')
        .select(`
          *,
          user:users(name)
        `)
        .eq('conversation_id', conversationId)

      if (data) {
        callback(data.map(t => ({
          conversation_id: t.conversation_id,
          user_id: t.user_id,
          user_name: t.user?.name || 'Someone',
          started_at: t.started_at
        })))
      }
    }

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          fetchTyping()
        }
      )
      .subscribe()

    this.channels.set(`typing:${conversationId}`, channel)

    // Initial fetch
    fetchTyping()

    return () => {
      channel.unsubscribe()
      this.channels.delete(`typing:${conversationId}`)
    }
  }

  /**
   * Subscribe to user presence
   */
  subscribeToPresence(
    userIds: string[],
    callback: (presence: Record<string, UserPresence>) => void
  ): () => void {
    const fetchPresence = async () => {
      const { data } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', userIds)

      if (data) {
        const presenceMap = data.reduce((acc, p) => {
          acc[p.user_id] = p
          return acc
        }, {} as Record<string, UserPresence>)
        callback(presenceMap)
      }
    }

    const channel = supabase
      .channel('presence:users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=in.(${userIds.join(',')})`
        },
        () => {
          fetchPresence()
        }
      )
      .subscribe()

    this.channels.set('presence:users', channel)

    // Initial fetch
    fetchPresence()

    return () => {
      channel.unsubscribe()
      this.channels.delete('presence:users')
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.channels.forEach(channel => channel.unsubscribe())
    this.channels.clear()
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout))
    this.typingTimeouts.clear()
  }
}

export const messagingService = new MessagingService()

