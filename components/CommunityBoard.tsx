'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MessageSquare, Heart, Share2, Clock, User, X, Send, Plus } from 'lucide-react'
import LiquidGlass from './LiquidGlass'
import { getAuthService } from '@/lib/auth'
import { Post, Comment, PostCategory } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const categories: (PostCategory | 'All')[] = ['All', 'Events', 'Volunteer', 'Announcements', 'Business', 'Community', 'Help']

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString()
}

function getInitials(name: string): string {
  if (!name) return 'U'
  const parts = name.trim().split(' ').filter(n => n.length > 0)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return parts.slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function CommunityBoard() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'All'>('All')
  const [posts, setPosts] = useState<(Post & { isLiked?: boolean; timeAgo?: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({})
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Community' as PostCategory,
    tags: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [selectedCategory])

  const loadPosts = async () => {
    try {
      setIsLoading(true)
      const categoryParam = selectedCategory === 'All' ? '' : `?category=${selectedCategory}`
      const response = await fetch(`/api/posts${categoryParam}`)
      const result = await response.json()
      
      if (result.success) {
        const postsWithTimeAgo = result.data.map((post: Post & { isLiked?: boolean }) => ({
          ...post,
          timeAgo: formatTimeAgo(new Date(post.createdAt)),
        }))
        setPosts(postsWithTimeAgo)
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadComments = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      const result = await response.json()
      
      if (result.success) {
        setComments(prev => ({ ...prev, [postId]: result.data }))
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleLike = async (id: string) => {
    const auth = getAuthService()
    const authenticated = await auth.isAuthenticated()
    
    if (!authenticated) {
      sessionStorage.setItem('pendingAction', `like_post_${id}`)
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
      router.push('/signup?message=Please create an account to interact with posts')
      return
    }
    
    try {
      const response = await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
      })
      const result = await response.json()
      
      if (result.success) {
        setPosts(prev => prev.map(post =>
          post.id === id
            ? { ...post, isLiked: result.data.liked, likes: result.data.likes }
            : post
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleCreatePost = async () => {
    const auth = getAuthService()
    const authenticated = await auth.isAuthenticated()
    
    if (!authenticated) {
      sessionStorage.setItem('pendingAction', 'create_post')
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
      router.push('/signup?message=Please create an account to create posts')
      return
    }
    
    setIsCreateModalOpen(true)
  }

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in all required fields')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setIsCreateModalOpen(false)
        setFormData({ title: '', content: '', category: 'Community', tags: '' })
        loadPosts()
      } else {
        alert(result.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleComments = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null)
    } else {
      setExpandedPostId(postId)
      if (!comments[postId]) {
        loadComments(postId)
      }
    }
  }

  const handleSubmitComment = async (postId: string) => {
    const commentText = newComment[postId]?.trim()
    if (!commentText) return
    
    const auth = getAuthService()
    const authenticated = await auth.isAuthenticated()
    
    if (!authenticated) {
      sessionStorage.setItem('pendingAction', `comment_post_${postId}`)
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
      router.push('/signup?message=Please create an account to comment on posts')
      return
    }
    
    setIsSubmittingComment(prev => ({ ...prev, [postId]: true }))
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentText }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setNewComment(prev => ({ ...prev, [postId]: '' }))
        loadComments(postId)
        // Update comment count in post
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, comments: [...(post.comments || []), result.data] }
            : post
        ))
      } else {
        alert(result.error || 'Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment. Please try again.')
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [postId]: false }))
    }
  }

  const filteredPosts = selectedCategory === 'All'
    ? posts
    : posts.filter(post => post.category === selectedCategory)

  return (
    <section className="section-padding bg-[#FAF9F6] dark:bg-[#1C1B18]">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block mb-4">
            <MessageSquare className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Community Board
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Connect with neighbors, share updates, and stay informed about what's happening in our community.
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 rounded-2xl font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 border border-white/30 dark:border-gray-700/30 hover:shadow-lg'
              }`}
              style={{
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              }}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">No posts found. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <LiquidGlass intensity="light">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 
                                        flex items-center justify-center text-white font-bold text-lg">
                            {getInitials(post.author)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{post.author}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              {post.timeAgo || formatTimeAgo(new Date(post.createdAt))}
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 
                                       dark:text-primary-300 text-xs font-medium rounded-full">
                          {post.category}
                        </span>
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                        {post.content}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                            post.isLiked
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                          <span className="font-medium">{post.likes}</span>
                        </motion.button>
                        <button
                          onClick={() => handleToggleComments(post.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 
                                     text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="font-medium">{post.comments?.length || 0}</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 
                                         text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                          <Share2 className="w-4 h-4" />
                          <span className="font-medium">Share</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      {expandedPostId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                        >
                          <div className="space-y-4">
                            {/* Existing Comments */}
                            {comments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 
                                              flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                  {getInitials(comment.author)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                      {comment.author}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimeAgo(new Date(comment.createdAt))}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Comment Input */}
                            <div className="flex gap-3 pt-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 
                                            flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Write a comment..."
                                  value={newComment[post.id] || ''}
                                  onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault()
                                      handleSubmitComment(post.id)
                                    }
                                  }}
                                  className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 
                                           text-gray-900 dark:text-white placeholder-gray-500 
                                           focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleSubmitComment(post.id)}
                                  disabled={!newComment[post.id]?.trim() || isSubmittingComment[post.id]}
                                  className="px-4 py-2 bg-primary-600 text-white rounded-xl 
                                           hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
                                           flex items-center gap-2"
                                >
                                  <Send className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </LiquidGlass>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Create Post CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreatePost}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl 
                     font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create New Post
          </motion.button>
        </motion.div>

        {/* Create Post Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Share something with the community
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 
                           text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter post title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as PostCategory }))}
                  className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 
                           text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 
                           text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="What's on your mind?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 
                           text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., community, event, volunteer"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 
                           text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 
                           text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
