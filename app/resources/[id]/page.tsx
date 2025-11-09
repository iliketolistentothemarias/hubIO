'use client'

/**
 * Individual Resource Detail Page
 * 
 * Comprehensive detail page for each community resource with:
 * - Full resource information
 * - Contact details
 * - Map location
 * - Reviews and ratings
 * - Related resources
 * - Share functionality
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  MapPin, Phone, Mail, Globe, Clock, Star, Heart, Share2, 
  ArrowLeft, Calendar, Users, Award, Languages, CheckCircle,
  Navigation, ExternalLink 
} from 'lucide-react'
import { resources } from '@/data/resources'
import { useFavorites } from '@/contexts/FavoritesContext'
import LiquidGlass from '@/components/LiquidGlass'
import Link from 'next/link'

export default function ResourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { isFavorite, toggleFavorite } = useFavorites()
  
  const resource = resources.find(r => r.id === id)
  const [relatedResources, setRelatedResources] = useState<any[]>([])

  useEffect(() => {
    if (resource) {
      // Find related resources (same category or shared tags)
      const related = resources
        .filter(r => r.id !== resource.id && (
          r.category === resource.category ||
          r.tags.some(tag => resource.tags.includes(tag))
        ))
        .slice(0, 3)
      setRelatedResources(related)
    }
  }, [resource])

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Resource Not Found</h1>
          <Link href="/directory" className="btn-primary">
            Back to Directory
          </Link>
        </div>
      </div>
    )
  }

  const favorite = isFavorite(resource.id)

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20">
      <div className="container-custom section-padding">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <LiquidGlass intensity="medium">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white">
                        {resource.name}
                      </h1>
                      {resource.verified && (
                        <div title="Verified Resource">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                      )}
                      {resource.featured && (
                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                        {resource.category}
                      </span>
                      {resource.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{resource.rating}</span>
                          <span>({resource.reviewCount} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleFavorite(resource.id)}
                      className={`p-3 rounded-2xl transition-all ${
                        favorite
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl"
                    >
                      <Share2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  {resource.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </LiquidGlass>

            {/* Contact Information */}
            <LiquidGlass intensity="light">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">Address</div>
                      <div className="text-gray-600 dark:text-gray-400">{resource.address}</div>
                      {resource.location && (
                        <button className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                          <Navigation className="w-4 h-4" />
                          Get Directions
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">Phone</div>
                      <a href={`tel:${resource.phone}`} className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                        {resource.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">Email</div>
                      <a href={`mailto:${resource.email}`} className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                        {resource.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Globe className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">Website</div>
                      <a 
                        href={resource.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {resource.hours && (
                    <div className="flex items-start gap-4">
                      <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">Hours</div>
                        <div className="text-gray-600 dark:text-gray-400">{resource.hours}</div>
                      </div>
                    </div>
                  )}

                  {resource.languages && resource.languages.length > 0 && (
                    <div className="flex items-start gap-4">
                      <Languages className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">Languages</div>
                        <div className="text-gray-600 dark:text-gray-400">{resource.languages.join(', ')}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </LiquidGlass>

            {/* Services Offered */}
            {resource.services && resource.services.length > 0 && (
              <LiquidGlass intensity="light">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Award className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    Services Offered
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {resource.services.map((service) => (
                      <div key={service} className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-900 dark:text-white">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </LiquidGlass>
            )}

            {/* Events */}
            {resource.events && resource.events.length > 0 && (
              <LiquidGlass intensity="light">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    Upcoming Events
                  </h2>
                  <div className="space-y-4">
                    {resource.events.map((event) => (
                      <div key={event.id} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl">
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">{event.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(event.date).toLocaleDateString()} at {event.time}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </LiquidGlass>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <LiquidGlass intensity="medium">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] py-3 rounded-2xl font-semibold hover:bg-[#7A5F3A] dark:hover:bg-[#C49A6A] hover:shadow-lg transition-all">
                    Contact Organization
                  </button>
                  <button className="w-full bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-2 border-primary-600 dark:border-primary-400 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all">
                    Get Directions
                  </button>
                  <button className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all">
                    Share Resource
                  </button>
                </div>
              </div>
            </LiquidGlass>

            {/* Related Resources */}
            {relatedResources.length > 0 && (
              <LiquidGlass intensity="light">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Related Resources</h3>
                  <div className="space-y-4">
                    {relatedResources.map((related) => (
                      <Link
                        key={related.id}
                        href={`/resources/${related.id}`}
                        className="block p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all"
                      >
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">{related.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{related.description}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              </LiquidGlass>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

