'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, MoreVertical, Archive, Pin, Volume2, VolumeX, Trash2, User } from 'lucide-react'
import { messagingService, Conversation } from '@/lib/messaging/MessagingService'

const formatTimeAgo = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hr${hours === 1 ? '' : 's'} ago`
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void
  selectedConversationId?: string
  onNewConversation: () => void
}

export default function ConversationList({
  onSelectConversation,
  selectedConversationId,
  onNewConversation
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conv => {
        const otherParticipant = conv.participants.find(p => p.user?.id !== getCurrentUserId())
        const name = conv.name || otherParticipant?.user?.name || ''
        return name.toLowerCase().includes(searchQuery.toLowerCase())
      })
      setFilteredConversations(filtered)
    } else {
      setFilteredConversations(conversations)
    }
  }, [searchQuery, conversations])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const convs = await messagingService.getConversations()
      setConversations(convs)
      setFilteredConversations(convs)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentUserId = () => {
    // This should come from auth context
    return '' // Placeholder
  }

  const getOtherParticipant = (conversation: Conversation) => {
    const currentUserId = getCurrentUserId()
    return conversation.participants.find(p => p.user?.id !== currentUserId)
  }

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name
    const other = getOtherParticipant(conversation)
    return other?.user?.name || 'Unknown User'
  }

  const getConversationAvatar = (conversation: Conversation) => {
    const other = getOtherParticipant(conversation)
    return other?.user?.avatar
  }

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message) return 'No messages yet'
    
    const msg = conversation.last_message
    if (msg.type === 'image') return '📷 Image'
    if (msg.type === 'file') return '📎 File'
    
    return msg.content || 'Message'
  }

  const getLastMessageTime = (conversation: Conversation) => {
    if (!conversation.last_message) return ''
    return formatTimeAgo(conversation.last_message.created_at)
  }

  const handlePinConversation = async (conversationId: string) => {
    // TODO: Implement pin functionality
    setActiveMenu(null)
  }

  const handleMuteConversation = async (conversationId: string) => {
    // TODO: Implement mute functionality
    setActiveMenu(null)
  }

  const handleArchiveConversation = async (conversationId: string) => {
    // TODO: Implement archive functionality
    setActiveMenu(null)
  }

  const handleDeleteConversation = async (conversationId: string) => {
    // TODO: Implement delete functionality
    setActiveMenu(null)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0B0A0F] border-r border-[#E8E0D6] dark:border-[#2c2c3e]">
      {/* Header */}
      <div className="p-4 border-b border-[#E8E0D6] dark:border-[#2c2c3e]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">Messages</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewConversation}
            className="p-2 rounded-lg bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] hover:bg-[#6B5D47] dark:hover:bg-[#B8A584] transition-colors"
            aria-label="New conversation"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B8A584]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E8E0D6] dark:border-[#2c2c3e] 
                     bg-[#FAF9F6] dark:bg-[#1F1B28] text-[#2C2416] dark:text-[#F5F3F0]
                     focus:outline-none focus:ring-2 focus:ring-[#D4A574] transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4A574]"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-[#f5ede1] dark:bg-[#1F1B28] flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-[#B8A584]" />
            </div>
            <h3 className="text-lg font-semibold text-[#2C2416] dark:text-[#F5F3F0] mb-2">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-[#6B5D47] dark:text-[#B8A584] mb-4">
              {searchQuery ? 'Try a different search term' : 'Start a new conversation to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewConversation}
                className="px-4 py-2 rounded-lg bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F] hover:bg-[#6B5D47] dark:hover:bg-[#B8A584] transition-colors"
              >
                Start Conversation
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredConversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId
              const unreadCount = conversation.metadata?.unread_count || 0
              const isPinned = conversation.metadata?.pinned || false
              const isMuted = conversation.metadata?.muted || false

              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`relative flex items-center gap-3 p-4 cursor-pointer transition-colors
                    ${isSelected 
                      ? 'bg-[#f5ede1] dark:bg-[#1F1B28] border-l-4 border-[#8B6F47] dark:border-[#D4A574]' 
                      : 'hover:bg-[#FAF9F6] dark:hover:bg-[#1F1B28]/50 border-l-4 border-transparent'
                    }`}
                  onClick={() => onSelectConversation(conversation)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {getConversationAvatar(conversation) ? (
                      <img
                        src={getConversationAvatar(conversation)}
                        alt={getConversationName(conversation)}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B6F47] 
                                    flex items-center justify-center text-white font-semibold text-lg">
                        {getConversationName(conversation).charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#0B0A0F]"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold truncate ${
                          unreadCount > 0 ? 'text-[#2C2416] dark:text-[#F5F3F0]' : 'text-[#6B5D47] dark:text-[#B8A584]'
                        }`}>
                          {getConversationName(conversation)}
                        </h3>
                        {isPinned && <Pin className="w-4 h-4 text-[#8B6F47] dark:text-[#D4A574] flex-shrink-0" />}
                        {isMuted && <VolumeX className="w-4 h-4 text-[#B8A584] flex-shrink-0" />}
                      </div>
                      <span className="text-xs text-[#6B5D47]/70 dark:text-[#B8A584]/70 flex-shrink-0">
                        {getLastMessageTime(conversation)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${
                        unreadCount > 0 
                          ? 'text-[#2C2416] dark:text-[#F5F3F0] font-medium' 
                          : 'text-[#6B5D47] dark:text-[#B8A584]'
                      }`}>
                        {getLastMessagePreview(conversation)}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-white bg-[#8B6F47] dark:bg-[#D4A574] dark:text-[#0B0A0F] rounded-full flex-shrink-0">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenu(activeMenu === conversation.id ? null : conversation.id)
                      }}
                      className="p-1 rounded-lg hover:bg-[#f5ede1] dark:hover:bg-[#2c2c3e] transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-[#6B5D47] dark:text-[#B8A584]" />
                    </button>

                    <AnimatePresence>
                      {activeMenu === conversation.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1F1B28] rounded-lg shadow-lg 
                                   border border-[#E8E0D6] dark:border-[#2c2c3e] z-50 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handlePinConversation(conversation.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#6B5D47] dark:text-[#B8A584] 
                                     hover:bg-[#f5ede1] dark:hover:bg-[#2c2c3e] transition-colors"
                          >
                            <Pin className="w-4 h-4" />
                            {isPinned ? 'Unpin' : 'Pin'} Conversation
                          </button>
                          <button
                            onClick={() => handleMuteConversation(conversation.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#6B5D47] dark:text-[#B8A584] 
                                     hover:bg-[#f5ede1] dark:hover:bg-[#2c2c3e] transition-colors"
                          >
                            {isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            {isMuted ? 'Unmute' : 'Mute'} Notifications
                          </button>
                          <button
                            onClick={() => handleArchiveConversation(conversation.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 
                                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Archive className="w-4 h-4" />
                            Archive Conversation
                          </button>
                          <button
                            onClick={() => handleDeleteConversation(conversation.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 
                                     hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Conversation
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

