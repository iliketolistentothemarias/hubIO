'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Heart, Share2, Clock, User, TrendingUp, Filter } from 'lucide-react'
import LiquidGlass from './LiquidGlass'

interface Post {
  id: string
  author: string
  avatar: string
  title: string
  content: string
  category: string
  likes: number
  comments: number
  timeAgo: string
  isLiked: boolean
}

const posts: Post[] = [
  {
    id: '1',
    author: 'Sarah M.',
    avatar: 'SM',
    title: 'Free Community Garden Workshop This Saturday',
    content: 'Join us this Saturday at 10 AM for a free workshop on starting your own community garden. We\'ll cover soil preparation, seed selection, and sustainable gardening practices. All materials provided!',
    category: 'Events',
    likes: 42,
    comments: 8,
    timeAgo: '2 hours ago',
    isLiked: false,
  },
  {
    id: '2',
    author: 'Mike T.',
    avatar: 'MT',
    title: 'Looking for Volunteers for Food Drive',
    content: 'Our annual food drive is coming up next month and we need volunteers! We\'re looking for help with collection, sorting, and distribution. Even a few hours makes a difference.',
    category: 'Volunteer',
    likes: 67,
    comments: 12,
    timeAgo: '5 hours ago',
    isLiked: true,
  },
  {
    id: '3',
    author: 'Community Center',
    avatar: 'CC',
    title: 'New After-School Program Starting',
    content: 'We\'re excited to announce our new after-school program for middle schoolers! It includes homework help, STEM activities, and sports. Registration opens Monday.',
    category: 'Announcements',
    likes: 89,
    comments: 15,
    timeAgo: '1 day ago',
    isLiked: false,
  },
  {
    id: '4',
    author: 'Local Business',
    avatar: 'LB',
    title: 'Small Business Networking Event',
    content: 'Join us for our monthly small business networking event. Connect with other local entrepreneurs, share resources, and grow together. Free to attend!',
    category: 'Business',
    likes: 34,
    comments: 6,
    timeAgo: '2 days ago',
    isLiked: false,
  },
]

const categories = ['All', 'Events', 'Volunteer', 'Announcements', 'Business', 'Community']

export default function CommunityBoard() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [localPosts, setLocalPosts] = useState(posts)

  const filteredPosts = selectedCategory === 'All'
    ? localPosts
    : localPosts.filter(post => post.category === selectedCategory)

  const handleLike = (id: string) => {
    setLocalPosts(prev => prev.map(post =>
      post.id === id
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ))
  }

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
                          {post.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{post.author}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            {post.timeAgo}
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
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 
                                       text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-medium">{post.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 
                                       text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span className="font-medium">Share</span>
                      </button>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

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
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl 
                     font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <MessageSquare className="w-5 h-5" />
            Create New Post
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

