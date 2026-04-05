/**
 * Messaging System Types
 * 
 * Types for real-time messaging between users
 */

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  attachments?: MessageAttachment[]
  read: boolean
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface MessageAttachment {
  id: string
  type: 'image' | 'file' | 'link'
  url: string
  name: string
  size?: number
  mimeType?: string
}

export interface Conversation {
  id: string
  participants: string[] // User IDs
  participantNames: Record<string, string>
  participantAvatars: Record<string, string>
  type: 'direct' | 'group'
  name?: string // For group chats
  description?: string // For group chats
  lastMessage?: Message
  lastMessageAt?: Date
  unreadCount: Record<string, number> // User ID -> unread count
  createdAt: Date
  updatedAt: Date
}

export interface TypingIndicator {
  conversationId: string
  userId: string
  userName: string
  isTyping: boolean
}

