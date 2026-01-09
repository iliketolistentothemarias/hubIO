'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, User as UserIcon } from 'lucide-react'
import ConversationList from '@/components/messaging/ConversationList'
import ChatWindow from '@/components/messaging/ChatWindow'
import { messagingService, Conversation } from '@/lib/messaging/MessagingService'
import { supabase } from '@/lib/supabase/client'
import AuthRequired from '@/components/auth/AuthRequired'

function MessagesContent() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [searchUsers, setSearchUsers] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [blockUserId, setBlockUserId] = useState<string>('')
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (selectedConversation) {
      setMobileView('chat')
    }
  }, [selectedConversation])

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id)
        // Update presence to online
        messagingService.updatePresence('online')
      }
    })

    // Update presence on visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        messagingService.updatePresence('away')
      } else {
        messagingService.updatePresence('online')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Update presence to offline on unload
    const handleUnload = () => {
      messagingService.updatePresence('offline')
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleUnload)
      messagingService.updatePresence('offline')
      messagingService.cleanup()
    }
  }, [])

  useEffect(() => {
    if (showNewConversation) {
      searchForUsers()
    }
  }, [searchUsers, showNewConversation])

  const searchForUsers = async () => {
    try {
      setLoadingUsers(true)
      let query = supabase
        .from('users')
        .select('id, name, email, avatar')
        .neq('id', currentUserId)

      if (searchUsers.trim()) {
        query = query.ilike('name', `%${searchUsers}%`)
      }

      const { data, error } = await query.limit(10)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleStartConversation = async (userId: string) => {
    console.log('Starting conversation with user:', userId)
    try {
      const conversation = await messagingService.getOrCreateDirectConversation(userId)
      console.log('Conversation obtained:', conversation)
      setSelectedConversation(conversation)
      setShowNewConversation(false)
      setSearchUsers('')
      setUsers([])
      setRefreshKey(prev => prev + 1)
    } catch (error: any) {
      console.error('Error starting conversation:', error)
      const message = error.message || error.details || (typeof error === 'object' ? JSON.stringify(error) : String(error))
      alert('Failed to start conversation: ' + message)
    }
  }

  const handleBlockUser = (userId: string) => {
    setBlockUserId(userId)
    setShowBlockDialog(true)
  }

  const confirmBlockUser = async () => {
    try {
      await messagingService.blockUser(blockUserId)
      setShowBlockDialog(false)
      setBlockUserId('')
      // Update selected conversation state if it's the blocked user
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error blocking user:', error)
    }
  }

  const handleUnblockUser = (userId: string) => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0A0F] pt-20">
      <div className="container-custom h-[calc(100vh-5rem)]">
        <div className="flex h-full rounded-lg overflow-hidden shadow-lg border border-[#E8E0D6] dark:border-[#2c2c3e]">
          {/* Conversation List */}
          <div className={`w-full md:w-96 flex-shrink-0 ${mobileView === 'chat' ? 'hidden md:block' : 'block'}`}>
            <ConversationList
              key={refreshKey}
              onSelectConversation={setSelectedConversation}
              selectedConversationId={selectedConversation?.id}
              onNewConversation={() => setShowNewConversation(true)}
              currentUserId={currentUserId}
            />
          </div>

          {/* Chat Window */}
          <div className={`flex-1 ${mobileView === 'list' ? 'hidden md:block' : 'block'}`}>
            {selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                currentUserId={currentUserId}
                onBlock={handleBlockUser}
                onUnblock={handleUnblockUser}
                onBack={() => {
                  setMobileView('list')
                  setSelectedConversation(null)
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-[#0B0A0F]">
                <div className="w-24 h-24 rounded-full bg-[#f5ede1] dark:bg-[#1F1B28] flex items-center justify-center mb-6">
                  <UserIcon className="w-12 h-12 text-[#B8A584]" />
                </div>
                <h3 className="text-2xl font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-2">
                  Select a conversation
                </h3>
                <p className="text-[#6B5D47] dark:text-[#B8A584] text-center max-w-md">
                  Choose a conversation from the list or start a new one to begin messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      <AnimatePresence>
        {showNewConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewConversation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1F1B28] rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#E8E0D6] dark:border-[#2c2c3e]">
                <h3 className="text-xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                  New Conversation
                </h3>
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="p-2 rounded-lg hover:bg-[#f5ede1] dark:hover:bg-[#2c2c3e] transition-colors"
                >
                  <X className="w-5 h-5 text-[#6B5D47] dark:text-[#B8A584]" />
                </button>
              </div>

              {/* Search */}
              <div className="p-6 border-b border-[#E8E0D6] dark:border-[#2c2c3e]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B8A584]" />
                  <input
                    type="text"
                    placeholder="Search users by name..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E8E0D6] dark:border-[#2c2c3e] 
                             bg-[#FAF9F6] dark:bg-[#0B0A0F] text-[#2C2416] dark:text-[#F5F3F0]
                             focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                    autoFocus
                  />
                </div>
              </div>

              {/* User List */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingUsers && users.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4A574]"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#6B5D47] dark:text-[#B8A584]">
                      {searchUsers.trim() ? 'No users found' : 'No other users found in the community'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <motion.button
                        key={user.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStartConversation(user.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#f5ede1] dark:hover:bg-[#2c2c3e] transition-colors"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B6F47] 
                                        flex items-center justify-center text-white font-semibold">
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-[#2C2416] dark:text-[#F5F3F0]">{user.name || 'Anonymous'}</p>
                          <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">{user.email}</p>
                        </div>
                      </motion.button>
                    ))}
                    {loadingUsers && (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#D4A574]"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block User Dialog */}
      <AnimatePresence>
        {showBlockDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBlockDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1F1B28] rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-4">
                Block User
              </h3>
              <p className="text-[#6B5D47] dark:text-[#B8A584] mb-6">
                Are you sure you want to block this user? They won't be able to send you messages or see your profile.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBlockDialog(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[#E8E0D6] dark:border-[#2c2c3e] 
                           text-[#6B5D47] dark:text-[#B8A584] hover:bg-[#f5ede1] dark:hover:bg-[#2c2c3e] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBlockUser}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Block User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <AuthRequired
      featureName="private messages"
      description="Direct messaging is available to members only so conversations stay safe. Create an account to start connecting."
    >
      <MessagesContent />
    </AuthRequired>
  )
}

