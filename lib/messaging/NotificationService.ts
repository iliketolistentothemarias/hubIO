/**
 * Notification Service for Messaging
 * 
 * Handles in-app and browser notifications for new messages
 */

import { supabase } from '@/lib/supabase/client'

export interface MessageNotification {
  id: string
  type: 'new_message'
  title: string
  body: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_avatar?: string
  timestamp: string
  read: boolean
}

class NotificationService {
  private permissionGranted = false

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications')
      return
    }

    // Request permission if not already granted
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      this.permissionGranted = permission === 'granted'
    } else {
      this.permissionGranted = Notification.permission === 'granted'
    }
  }

  /**
   * Show browser notification for new message
   */
  async showMessageNotification(
    senderName: string,
    messageContent: string,
    conversationId: string,
    senderAvatar?: string
  ): Promise<void> {
    if (!this.permissionGranted) return

    try {
      const notification = new Notification(`New message from ${senderName}`, {
        body: messageContent,
        icon: senderAvatar || '/icon-192.png',
        badge: '/icon-192.png',
        tag: conversationId, // Group notifications by conversation
        renotify: true,
        requireInteraction: false,
        silent: false
      })

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        window.location.href = `/messages?conversation=${conversationId}`
        notification.close()
      }

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000)
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  /**
   * Create in-app notification in database
   */
  async createInAppNotification(
    userId: string,
    senderId: string,
    senderName: string,
    conversationId: string,
    messagePreview: string
  ): Promise<void> {
    try {
      const preview =
        messagePreview.length > 120 ? `${messagePreview.slice(0, 117)}...` : messagePreview
      const safeMessage = `${preview}${conversationId ? ` (Conversation: ${conversationId})` : ''}`

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'new_message',
        title: `New message from ${senderName}`,
        message: safeMessage,
        read: false,
      })
    } catch (error) {
      console.error('Error creating in-app notification:', error)
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return 0

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .eq('type', 'new_message')

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('type', 'new_message')
        .eq('read', false)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  /**
   * Subscribe to new notifications
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: any) => void
  ): () => void {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound(): void {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(err => console.error('Error playing sound:', err))
    } catch (error) {
      console.error('Error playing notification sound:', error)
    }
  }

  /**
   * Check if user has notification permission
   */
  hasPermission(): boolean {
    return this.permissionGranted
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false

    const permission = await Notification.requestPermission()
    this.permissionGranted = permission === 'granted'
    return this.permissionGranted
  }
}

export const notificationService = new NotificationService()

