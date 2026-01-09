'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Globe, Star, Heart, Share2, BarChart3, Clock, Users, Languages } from 'lucide-react'
import { Resource } from '@/lib/types'
import { useFavorites } from '@/contexts/FavoritesContext'
import Link from 'next/link'

interface ResourceCardProps {
  resource: Resource
  index: number
  viewMode?: 'grid' | 'list'
  onCompare?: (id: string) => void
  comparing?: boolean
}

export default function ResourceCard({ resource, index, viewMode = 'grid', onCompare, comparing }: ResourceCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [isHovered, setIsHovered] = useState(false)
  const favorite = isFavorite(resource.id)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource.name,
          text: resource.description,
          url: `${window.location.origin}/directory?q=${encodeURIComponent(resource.name)}`,
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/directory?q=${encodeURIComponent(resource.name)}`)
    }
  }

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.03,
      }}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.99 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group relative bg-white dark:bg-[#2A2824] rounded-xl 
                  shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden 
                  border border-[#E8E0D6] dark:border-[#4A4844]
                  hover:border-[#D4C4B0] dark:hover:border-[#5A5854]
                  ${viewMode === 'list' ? 'flex' : 'flex flex-col'}
                  ${comparing ? 'ring-2 ring-[#8B6F47] dark:ring-[#D4A574]' : ''}`}
    >

      {/* Featured Badge */}
      {resource.featured && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-current" />
            Featured
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(resource.id)
          }}
          className={`p-2.5 rounded-xl transition-all duration-200 active:scale-90 ${
            favorite
              ? 'bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] shadow-md'
              : 'bg-white/90 dark:bg-[#2A2824]/90 backdrop-blur-md text-[#6B5D47] dark:text-[#B8A584] shadow-sm border border-[#E8E0D6] dark:border-[#4A4844]'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleShare()
          }}
          className="p-2.5 rounded-xl bg-white/90 dark:bg-[#2A2824]/90 backdrop-blur-md text-[#6B5D47] dark:text-[#B8A584] 
                     shadow-sm border border-[#E8E0D6] dark:border-[#4A4844]
                     transition-all duration-200 active:scale-90"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className={`relative z-0 p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        {/* Rating */}
        {resource.rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(resource.rating!)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {resource.rating}
            </span>
            {resource.reviewCount && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({resource.reviewCount} reviews)
              </span>
            )}
          </div>
        )}

        {/* Category Badge */}
        <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full mb-3">
          {resource.category}
        </span>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors break-all">
          {resource.name}
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 break-all">
          {resource.description}
        </p>

        {/* Additional Info */}
        <div className="space-y-2 mb-4">
          {resource.hours && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <span>{resource.hours}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
            <span className="break-all">{resource.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <a href={`tel:${resource.phone}`} className="hover:text-primary-600 dark:hover:text-primary-400">
              {resource.phone}
            </a>
          </div>
          {resource.capacity && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <span>Capacity: {resource.capacity}</span>
            </div>
          )}
          {resource.languages && resource.languages.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Languages className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <span>{resource.languages.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {resource.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-[#f5ede1] dark:bg-[#2c2c3e] text-[#6B5D47] dark:text-[#B8A584] text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {resource.tags.length > 3 && (
            <span className="px-2 py-1 bg-[#f5ede1] dark:bg-[#2c2c3e] text-[#6B5D47] dark:text-[#B8A584] text-xs rounded">
              +{resource.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/resources/${resource.id}`}
            className="flex-1 text-center bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] py-2 px-4 rounded-lg text-sm font-medium hover:bg-[#7A5F3A] dark:hover:bg-[#C49A6A] transition-all duration-200 shadow-sm hover:shadow-md"
          >
            View Details
          </Link>
          {resource.website && (
            <a
              href={resource.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium px-3"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
          {onCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCompare(resource.id)
              }}
              className={`ml-auto text-sm px-3 py-1 rounded-lg font-medium transition-colors ${
                comparing
                  ? 'bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#0B0A0F]'
                  : 'bg-[#f5ede1] dark:bg-[#2c2c3e] text-[#6B5D47] dark:text-[#B8A584] hover:bg-[#E8E0D6] dark:hover:bg-[#3a3a4a]'
              }`}
            >
              {comparing ? 'Comparing' : 'Compare'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )

  if (viewMode === 'list') {
    return (
      <div className="block">
        {cardContent}
      </div>
    )
  }
  
  return cardContent
}

