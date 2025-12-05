'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Paperclip, Image as ImageIcon, Smile, MoreVertical,
  Phone, Video, Info, ChevronDown, Check, CheckCheck, AlertCircle, Ban, Flag
} from 'lucide-react'
import { messagingService, Message, Conversation, TypingIndicator } from '@/lib/messaging/MessagingService'
// Lightweight date helpers (avoid extra dependencies)
const isToday = (date: Date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const isYesterday = (date: Date) => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

const formatLong = (date: Date) =>
  date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

interface ChatWindowProps {
  conversation: Conversation
  currentUserId: string
  onBlock?: (userId: string) => void
  onReport?: (userId: string) => void
}

export default function ChatWindow({
  conversation,
  currentUserId,
  onBlock,
  onReport
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const lastScrollTop = useRef(0)
  const isUserScrolling = useRef(false)
  const shouldAutoScroll = useRef(true)

  // Load initial messages
  useEffect(() => {
    loadMessages()
  }, [conversation.id])

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeMessages = messagingService.subscribeToMessages(
      conversation.id,
      (message) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id)) return prev
          return [...prev, message]
        })

        // Auto-scroll if at bottom
        if (shouldAutoScroll.current) {
          setTimeout(() => scrollToBottom(true), 100)
        } else {
          setUnreadCount(prev => prev + 1)
        }

        // Mark as read if message is from other user and user is at bottom
        if (message.sender_id !== currentUserId && shouldAutoScroll.current) {
          markMessagesAsRead([message.id])
        }
      }
    )

    const unsubscribeTyping = messagingService.subscribeToTyping(
      conversation.id,
      (indicators) => {
        // Filter out current user
        setTypingUsers(indicators.filter(t => t.user_id !== currentUserId))
      }
    )

    return () => {
      unsubscribeMessages()
      unsubscribeTyping()
    }
  }, [conversation.id, currentUserId])

  // Handle scroll events
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      
      shouldAutoScroll.current = isAtBottom
      setShowScrollButton(!isAtBottom && messages.length > 0)

      // Load more messages when scrolling to top
      if (scrollTop < 100 && !loadingMore && hasMore) {
        loadMoreMessages()
      }

      // Mark messages as read when scrolling
      if (isAtBottom && unreadCount > 0) {
        const unreadMessages = messages.filter(m => 
          m.sender_id !== currentUserId && !m.status?.includes('read')
        )
        if (unreadMessages.length > 0) {
          markMessagesAsRead(unreadMessages.map(m => m.id))
        }
        setUnreadCount(0)
      }

      lastScrollTop.current = scrollTop
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [messages, loadingMore, hasMore, unreadCount, currentUserId])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const msgs = await messagingService.getMessages(conversation.id, { limit: 50 })
      setMessages(msgs)
      setHasMore(msgs.length === 50)
      
      // Scroll to bottom after loading
      setTimeout(() => scrollToBottom(false), 100)

      // Mark visible messages as read
      const unreadMessages = msgs.filter(m => m.sender_id !== currentUserId)
      if (unreadMessages.length > 0) {
        markMessagesAsRead(unreadMessages.map(m => m.id))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const oldestMessage = messages[0]
      if (!oldestMessage) return

      const container = messagesContainerRef.current
      const oldScrollHeight = container?.scrollHeight || 0

      const olderMessages = await messagingService.getMessages(conversation.id, {
        limit: 50,
        before: oldestMessage.created_at
      })

      if (olderMessages.length === 0) {
        setHasMore(false)
        return
      }

      setMessages(prev => [...olderMessages, ...prev])
      setHasMore(olderMessages.length === 50)

      // Maintain scroll position
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight
          container.scrollTop = newScrollHeight - oldScrollHeight
        }
      }, 0)
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  const markMessagesAsRead = async (messageIds: string[]) => {
    try {
      await messagingService.markAsRead(conversation.id, messageIds)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const content = newMessage.trim()
      setNewMessage('')

      await messagingService.sendMessage(conversation.id, content)
      
      // Auto-scroll to show new message
      shouldAutoScroll.current = true
      setTimeout(() => scrollToBottom(true), 100)
    } catch (error) {
      console.error('Error sending message:', error)
      // Restore message on error
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  const handleTyping = () => {
    messagingService.startTyping(conversation.id)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      messagingService.stopTyping(conversation.id)
    }, 3000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getOtherParticipant = () => {
    return conversation.participants.find(p => p.user?.id !== currentUserId)
  }

  const otherUser = getOtherParticipant()?.user

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isToday(date)) {
      return formatTime(date)
    } else if (isYesterday(date)) {
      return `Yesterday ${formatTime(date)}`
    } else {
      return formatLong(date)
    }
  }

  const formatDateDivider = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const shouldShowDateDivider = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true
    return !isSameDay(new Date(currentMsg.created_at), new Date(prevMsg.created_at))
  }

  const shouldGroupMessage = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return false
    if (currentMsg.sender_id !== prevMsg.sender_id) return false
    
    const timeDiff = new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime()
    return timeDiff < 60000 // Group if less than 1 minute apart
  }

  const getMessageStatus = (message: Message) => {
    if (message.sender_id !== currentUserId) return null
    
    // This would come from message_status table
    if (message.status === 'read') {
      return <CheckCheck className="w-4 h-4 text-blue-500" />
    } else if (message.status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-gray-400" />
    } else {
      return <Check className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {otherUser?.avatar ? (
            <img
              src={otherUser.avatar}
              alt={otherUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 
                          flex items-center justify-center text-white font-semibold">
              {otherUser?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}

          {/* User info */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {otherUser?.name || 'Unknown User'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {typingUsers.length > 0 ? (
                <span className="text-primary-600 dark:text-primary-400">typing...</span>
              ) : (
                <span>Online</span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Voice call"
          >
            <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Video call"
          >
            <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Conversation info"
          >
            <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>

          {/* Menu */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg 
                           border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      onBlock?.(otherUser?.id || '')
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 
                             hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Block User
                  </button>
                  <button
                    onClick={() => {
                      onReport?.(otherUser?.id || '')
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 
                             hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Report User
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No messages yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start the conversation by sending a message
            </p>
          </div>
        ) : (
          <>
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            )}

            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : undefined
              const showDate = shouldShowDateDivider(message, prevMessage)
              const isGrouped = shouldGroupMessage(message, prevMessage)
              const isOwn = message.sender_id === currentUserId

              return (
                <div key={message.id}>
                  {/* Date divider */}
                  {showDate && (
                    <div className="flex items-center justify-center my-6">
                      <div className="px-4 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {formatDateDivider(message.created_at)}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${
                      isGrouped ? 'mt-1' : 'mt-4'
                    }`}
                  >
                    {/* Avatar */}
                    {!isOwn && !isGrouped && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 
                                    flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {message.sender?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    {!isOwn && isGrouped && <div className="w-8" />}

                    {/* Message bubble */}
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      {!isGrouped && !isOwn && (
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 px-3">
                          {message.sender?.name}
                        </span>
                      )}

                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-primary-600 text-white rounded-br-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                        } ${isGrouped ? (isOwn ? 'rounded-br-2xl' : 'rounded-bl-2xl') : ''}`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>

                      {/* Time and status */}
                      <div className={`flex items-center gap-1 mt-1 px-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatMessageTime(message.created_at)}
                        </span>
                        {getMessageStatus(message)}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-end gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 
                              flex items-center justify-center text-white text-sm font-semibold">
                  {typingUsers[0].user_name.charAt(0).toUpperCase()}
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-gray-800">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              shouldAutoScroll.current = true
              scrollToBottom(true)
              setUnreadCount(0)
            }}
            className="absolute bottom-24 right-8 p-3 rounded-full bg-primary-600 text-white shadow-lg 
                     hover:bg-primary-700 transition-colors z-10"
          >
            <ChevronDown className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-2 py-0.5 text-xs font-semibold bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-end gap-2">
          {/* Attachments */}
          <div className="flex gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Attach image"
            >
              <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Add emoji"
            >
              <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>

          {/* Text input */}
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                     bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none
                     max-h-32 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />

          {/* Send button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

