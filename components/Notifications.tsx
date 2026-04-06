'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, CheckCircle, XCircle, Info, MessageSquare, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api/client-fetch'
import Link from 'next/link'

interface Notification {
  id: string
  user_id?: string
  type:
    | 'resource_approved'
    | 'resource_denied'
    | 'info'
    | 'success'
    | 'error'
    | 'message'
    | 'new_message'
  title: string
  message: string
  read: boolean
  created_at: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiFetch('/api/notifications')
      const result = await response.json()

      if (result.success) {
        setNotifications(result.data || [])
        setUnreadCount(result.data?.filter((n: Notification) => !n.read).length || 0)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const removeChannel = () => {
      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }
    }

    const subscribeForUser = (userId: string) => {
      removeChannel()
      void loadNotifications()

      const userFilter = `user_id=eq.${userId}`

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: userFilter,
          },
          (payload) => {
            const row = payload.new as Notification & { user_id?: string }
            if (row.user_id && row.user_id !== userId) return

            setNotifications((prev) => {
              if (prev.some((n) => n.id === row.id)) return prev
              return [row as Notification, ...prev]
            })
            if (!row.read) {
              setUnreadCount((prev) => prev + 1)
            }

            const isMsg =
              row.type === 'message' ||
              row.type === 'new_message'
            if (
              isMsg &&
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted' &&
              document.hidden
            ) {
              const n = new window.Notification(row.title, {
                body: row.message,
                icon: '/icon-192.png',
                tag: 'msg-notif',
              })
              n.onclick = () => {
                window.focus()
                window.location.href = '/messages'
                n.close()
              }
              setTimeout(() => n.close(), 6000)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: userFilter,
          },
          () => {
            loadNotifications()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: userFilter,
          },
          () => {
            loadNotifications()
          }
        )
        .subscribe()
    }

    const applySession = (session: { user: { id: string } } | null) => {
      if (cancelled) return
      removeChannel()
      if (!session?.user) {
        setNotifications([])
        setUnreadCount(0)
        return
      }
      subscribeForUser(session.user.id)
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      cancelled = true
      removeChannel()
      subscription.unsubscribe()
    }
  }, [loadNotifications])

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await apiFetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      })
      
      if (response.ok) {
        loadNotifications()
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      // POST + action avoids clients/proxies that omit DELETE bodies.
      const response = await apiFetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          notificationIds,
        }),
      })

      const result = await response.json().catch(() => ({}))
      if (response.ok && result.success !== false) {
        loadNotifications()
      } else {
        console.error(
          'Delete notifications failed:',
          result.error || response.statusText || response.status
        )
      }
    } catch (error) {
      console.error('Error deleting notifications:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'resource_approved':
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'resource_denied':
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'message':
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read)

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const isMessage =
      notification.type === 'message' || notification.type === 'new_message'

    const deleteBtn = (
      <button
        type="button"
        title="Delete notification"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          deleteNotifications([notification.id])
        }}
        className="p-1.5 rounded-lg text-[#6B5D47] dark:text-[#B8A584] hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    )

    const markReadBtn = !notification.read ? (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          markAsRead([notification.id])
        }}
        className="text-xs text-[#8B6F47] dark:text-[#D4A574] font-bold hover:underline"
      >
        Mark read
      </button>
    ) : null

    const textBlock = (
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-[#2C2416] dark:text-[#F5F3F0]">
          {notification.title}
        </h4>
        <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] mt-1 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-[#8B6F47] dark:text-[#D4A574] mt-1 font-medium">
          {new Date(notification.created_at).toLocaleString()}
        </p>
      </div>
    )

    const rowTint = !notification.read ? 'bg-[#f5ede1] dark:bg-[#3b352c]' : ''
    const rowHover = 'hover:bg-[#F5F3F0] dark:hover:bg-[#353330]'

    if (isMessage) {
      return (
        <div className={`flex items-stretch transition-colors ${rowTint} ${rowHover}`}>
          <Link
            href="/messages"
            className="flex flex-1 min-w-0 items-start gap-3 p-4 pr-2"
            onClick={() => {
              if (!notification.read) markAsRead([notification.id])
              setIsOpen(false)
            }}
          >
            {getNotificationIcon(notification.type)}
            {textBlock}
            <div className="flex flex-col items-end gap-1 shrink-0">{markReadBtn}</div>
          </Link>
          <div className="flex items-start p-4 pl-0">{deleteBtn}</div>
        </div>
      )
    }

    return (
      <div
        className={`flex items-start gap-3 p-4 transition-colors ${rowTint} ${rowHover}`}
      >
        {getNotificationIcon(notification.type)}
        {textBlock}
        <div className="flex flex-col items-end gap-1 shrink-0 ml-auto">
          {markReadBtn}
          {deleteBtn}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-lg bg-white dark:bg-[#2A2824] text-[#6B5D47] dark:text-[#B8A584] 
                 hover:bg-[#F5F3F0] dark:hover:bg-[#353330] transition-all duration-200
                 shadow-sm hover:shadow-md border border-[#E8E0D6] dark:border-[#4A4844]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#2A2824] rounded-2xl shadow-xl border border-[#E8E0D6] dark:border-[#4A4844] z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-4 border-b border-[#E8E0D6] dark:border-[#4A4844] flex items-center justify-between bg-[#F5F3F0] dark:bg-[#353330]">
              <h3 className="font-bold text-[#2C2416] dark:text-[#F5F3F0]">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#E8E0D6] dark:hover:bg-[#4A4844] transition-colors"
              >
                <X className="w-4 h-4 text-[#6B5D47] dark:text-[#B8A584]" />
              </button>
            </div>

            <div className="divide-y divide-[#E8E0D6] dark:divide-[#4A4844]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#6B5D47] dark:text-[#B8A584]">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <NotificationItem notification={notification} />
                  </motion.div>
                ))
              )}
            </div>

            {unreadNotifications.length > 0 && (
              <div className="p-3 border-t border-[#E8E0D6] dark:border-[#4A4844] bg-[#F5F3F0]/50 dark:bg-[#353330]/50">
                <button
                  onClick={() => markAsRead(unreadNotifications.map(n => n.id))}
                  className="w-full py-2 text-xs font-bold text-[#8B6F47] dark:text-[#D4A574] hover:bg-white dark:hover:bg-[#2A2824] rounded-lg border border-[#8B6F47]/20 dark:border-[#D4A574]/20 transition-all"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

