'use client'

/**
 * Collaborative Lists Component
 * 
 * Create and share resource lists with others
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  List, Plus, Share2, Users, Lock, Globe, 
  Edit, Trash2, Check, X, UserPlus, Search
} from 'lucide-react'
import LiquidGlass from './LiquidGlass'

interface ListItem {
  id: string
  resourceId: string
  resourceName: string
  resourceCategory: string
  addedBy: string
  addedAt: Date
  notes?: string
}

interface CollaborativeList {
  id: string
  name: string
  description?: string
  ownerId: string
  ownerName: string
  collaborators: string[]
  isPublic: boolean
  items: ListItem[]
  createdAt: Date
  updatedAt: Date
}

export default function CollaborativeLists() {
  const [lists, setLists] = useState<CollaborativeList[]>([])
  const [selectedList, setSelectedList] = useState<CollaborativeList | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDescription, setNewListDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    setLoading(true)
    try {
      // Mock data
      const mockLists: CollaborativeList[] = [
        {
          id: '1',
          name: 'Food Assistance Resources',
          description: 'Resources for food assistance in Pittsburgh',
          ownerId: 'user1',
          ownerName: 'You',
          collaborators: ['user2', 'user3'],
          isPublic: true,
          items: [
            {
              id: 'item1',
              resourceId: 'res1',
              resourceName: 'Pittsburgh Food Bank',
              resourceCategory: 'Food Assistance',
              addedBy: 'user1',
              addedAt: new Date(),
            },
            {
              id: 'item2',
              resourceId: 'res2',
              resourceName: 'Community Kitchen',
              resourceCategory: 'Food Assistance',
              addedBy: 'user2',
              addedAt: new Date(),
            },
          ],
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Health Services',
          description: 'Local health services and clinics',
          ownerId: 'user2',
          ownerName: 'Sarah Johnson',
          collaborators: ['user1'],
          isPublic: false,
          items: [
            {
              id: 'item3',
              resourceId: 'res3',
              resourceName: 'Free Health Clinic',
              resourceCategory: 'Health Services',
              addedBy: 'user2',
              addedAt: new Date(),
            },
          ],
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          updatedAt: new Date(),
        },
      ]
      setLists(mockLists)
    } catch (error) {
      console.error('Error loading lists:', error)
    } finally {
      setLoading(false)
    }
  }

  const createList = () => {
    if (!newListName.trim()) return

    const newList: CollaborativeList = {
      id: `list_${Date.now()}`,
      name: newListName,
      description: newListDescription,
      ownerId: 'user1',
      ownerName: 'You',
      collaborators: [],
      isPublic,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setLists([newList, ...lists])
    setSelectedList(newList)
    setShowCreateModal(false)
    setNewListName('')
    setNewListDescription('')
    setIsPublic(false)
  }

  const shareList = async (listId: string) => {
    // In production, this would generate a shareable link
    const link = `${window.location.origin}/lists/${listId}`
    await navigator.clipboard.writeText(link)
    alert('Link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading lists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20">
      <div className="container-custom section-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-2">
              Collaborative Lists
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Create and share resource lists with your community
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create List
          </button>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Lists Sidebar */}
          <div className="md:col-span-1">
            <LiquidGlass intensity="medium">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Your Lists
                </h2>
                <div className="space-y-2">
                  {lists.map((list) => (
                    <motion.button
                      key={list.id}
                      whileHover={{ x: 4 }}
                      onClick={() => setSelectedList(list)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedList?.id === list.id
                          ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {list.name}
                        </h3>
                        {list.isPublic ? (
                          <Globe className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>{list.collaborators.length + 1} members</span>
                        <span>•</span>
                        <span>{list.items.length} items</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </LiquidGlass>
          </div>

          {/* List Details */}
          <div className="md:col-span-2">
            {selectedList ? (
              <LiquidGlass intensity="medium">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedList.name}
                        </h2>
                        {selectedList.isPublic ? (
                          <Globe className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Lock className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      {selectedList.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {selectedList.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Owner: {selectedList.ownerName}</span>
                        <span>•</span>
                        <span>{selectedList.collaborators.length} collaborators</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => shareList(selectedList.id)}
                        className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="Share List"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button
                        className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="Add Collaborator"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Resources ({selectedList.items.length})
                    </h3>
                    {selectedList.items.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No items in this list yet</p>
                      </div>
                    ) : (
                      selectedList.items.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {item.resourceName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.resourceCategory}
                            </p>
                          </div>
                          <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </LiquidGlass>
            ) : (
              <LiquidGlass intensity="light">
                <div className="p-12 text-center">
                  <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a list to view details or create a new one
                  </p>
                </div>
              </LiquidGlass>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Create New List
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    List Name
                  </label>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., Food Assistance Resources"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="Describe what this list is for..."
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                    Make this list public
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={createList}
                    className="flex-1 btn-primary"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewListName('')
                      setNewListDescription('')
                      setIsPublic(false)
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

