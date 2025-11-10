'use client'

/**
 * Messaging Component
 * 
 * Real-time messaging interface for direct and group conversations
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, Send, X, Search, MoreVertical, 
  Paperclip, Smile, Phone, Video, UserPlus 
} from 'lucide-react'
import { Conversation, Message } from '@/lib/types/messaging'
import { useSocket } from '@/lib/realtime/client'
import LiquidGlass from './LiquidGlass'

interface MessagingProps {
  minimized?: boolean
  onMinimize?: () => void
}

export default function Messaging({ minimized = false, onMinimize }: MessagingProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  // Get user ID for WebSocket
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => {
    // Get current user ID
    const auth = require('@/lib/auth').getAuthService()
    auth.getCurrentUser().then(user => {
      if (user) setUserId(user.id)
    })
  }, [])

  const { socket, isConnected, joinRoom, leaveRoom, on, off } = useSocket({
    userId,
    autoConnect: true,
  })

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id)
      
      // Join conversation room for real-time updates
      if (isConnected) {
        joinRoom(activeConversation.id)
        
        // Listen for new messages
        const handleNewMessage = (data: { message: Message }) => {
          if (data.message.conversationId === activeConversation.id) {
            setMessages(prev => [...prev, data.message])
          }
        }
        
        on('new-message', handleNewMessage)
        on('message-updated', handleNewMessage)
        
        return () => {
          leaveRoom(activeConversation.id)
          off('new-message', handleNewMessage)
          off('message-updated', handleNewMessage)
        }
      } else {
        // Fallback to polling if WebSocket not available
        const interval = setInterval(() => {
          loadMessages(activeConversation.id)
        }, 3000)
        return () => clearInterval(interval)
      }
    }
  }, [activeConversation, isConnected, joinRoom, leaveRoom, on, off])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messaging/conversations')
      const data = await response.json()
      if (data.success) {
        setConversations(data.data)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messaging/messages?conversationId=${conversationId}`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.data)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return

    try {
      // Send typing indicator
      if (isConnected && socket) {
        socket.emit('typing', {
          conversationId: activeConversation.id,
          userId,
        })
      }

      const response = await fetch('/api/messaging/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          content: newMessage,
          type: 'text',
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Message will be added via WebSocket or we add it optimistically
        if (!isConnected) {
          setMessages([...messages, data.data])
        }
        setNewMessage('')
        inputRef.current?.focus()
        
        // Stop typing indicator
        if (isConnected && socket) {
          socket.emit('stop-typing', {
            conversationId: activeConversation.id,
            userId,
          })
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const filteredConversations = conversations.filter(conv =>
    Object.values(conv.participantNames).some(name =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (minimized) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-primary-600 dark:bg-primary-500 
                   text-white shadow-2xl flex items-center justify-center hover:bg-primary-700 
                   dark:hover:bg-primary-400 transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
        {conversations.reduce((sum, conv) => 
          sum + Object.values(conv.unreadCount).reduce((a, b) => a + b, 0), 0
        ) > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs 
                          flex items-center justify-center">
            {conversations.reduce((sum, conv) => 
              sum + Object.values(conv.unreadCount).reduce((a, b) => a + b, 0), 0
            )}
          </span>
        )}
      </motion.button>
    )
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col 
                     bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden
                     border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="bg-primary-600 dark:bg-primary-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-semibold">Messages</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!activeConversation ? (
              /* Conversations List */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg 
                               text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No conversations yet</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => {
                      const unread = Object.values(conv.unreadCount).reduce((a, b) => a + b, 0)
                      return (
                        <motion.div
                          key={conv.id}
                          whileHover={{ backgroundColor: 'rgba(139, 111, 71, 0.1)' }}
                          onClick={() => setActiveConversation(conv)}
                          className="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer 
                                   hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary-200 dark:bg-primary-800 
                                          flex items-center justify-center flex-shrink-0">
                              <MessageCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {conv.type === 'group' ? conv.name : 
                                   Object.values(conv.participantNames).find((_, i, arr) => i !== 0) || 'Unknown'}
                                </h4>
                                {conv.lastMessageAt && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                    {new Date(conv.lastMessageAt).toLocaleTimeString([], { 
                                      hour: '2-digit', minute: '2-digit' 
                                    })}
                                  </span>
                                )}
                              </div>
                              {conv.lastMessage && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {conv.lastMessage.content}
                                </p>
                              )}
                              {unread > 0 && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-primary-600 
                                                text-white text-xs rounded-full">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Chat View */
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {activeConversation.type === 'group' ? activeConversation.name : 
                         Object.values(activeConversation.participantNames).find((_, i, arr) => i !== 0) || 'Unknown'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                  {messages.map((message) => {
                    const isOwn = message.senderId !== 'user2' // In real app, check against current user
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          {!isOwn && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
                              {message.senderName}
                            </p>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-primary-600 text-white'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {new Date(message.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                      <Paperclip className="w-5 h-5 text-gray-500" />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                      <Smile className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-primary-600 dark:bg-primary-500 
                   text-white shadow-2xl flex items-center justify-center hover:bg-primary-700 
                   dark:hover:bg-primary-400 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          {conversations.reduce((sum, conv) => 
            sum + Object.values(conv.unreadCount).reduce((a, b) => a + b, 0), 0
          ) > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs 
                            flex items-center justify-center">
              {conversations.reduce((sum, conv) => 
                sum + Object.values(conv.unreadCount).reduce((a, b) => a + b, 0), 0
              )}
            </span>
          )}
        </motion.button>
      )}
    </>
  )
}

