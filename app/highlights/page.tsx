'use client'

import { motion } from 'framer-motion'
import { Heart, MapPin, Phone, Mail, Globe, ArrowRight, Users, Calendar, Star, Clock, Languages, Award } from 'lucide-react'
import { resources } from '@/data/resources'
import Link from 'next/link'
import { useFavorites } from '@/contexts/FavoritesContext'

export default function HighlightsPage() {
  const featuredResources = resources.filter((r) => r.featured)
  const { isFavorite, toggleFavorite } = useFavorites()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-white to-primary-50/30 dark:from-[#1C1B18] dark:via-gray-900 dark:to-primary-900/10 pt-20">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary-50 via-white to-secondary-50 
                          dark:from-[#1C1B18] dark:via-gray-800 dark:to-primary-900/20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block mb-4"
            >
              <Star className="w-12 h-12 text-primary-600 dark:text-primary-400 fill-primary-600 dark:fill-primary-400" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Featured Resources
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Discover the standout organizations making a significant impact in our community.
              These featured resources represent excellence in service and commitment to community well-being.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="section-padding bg-gradient-to-br from-[#FAF9F6] via-white to-primary-50/30 dark:from-[#1C1B18] dark:via-gray-900 dark:to-primary-900/10">
        <div className="container-custom">
          <div className="space-y-16">
            {featuredResources.map((resource, index) => (
              <FeaturedResourceCard 
                key={resource.id} 
                resource={resource} 
                index={index}
                isFavorite={isFavorite(resource.id)}
                onToggleFavorite={() => toggleFavorite(resource.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-gradient-to-br from-primary-600 to-secondary-600">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-white"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Explore More Resources
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Browse our complete directory to discover all available community resources and services.
            </p>
            <Link href="/directory">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-medium hover:bg-gray-100 
                           transition-all duration-200 flex items-center gap-2 mx-auto shadow-xl"
              >
                View Full Directory
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

interface FeaturedResourceCardProps {
  resource: any
  index: number
  isFavorite: boolean
  onToggleFavorite: () => void
}

function FeaturedResourceCard({ resource, index, isFavorite, onToggleFavorite }: FeaturedResourceCardProps) {
  const isEven = index % 2 === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-center`}
    >
      {/* Image/Icon Section */}
      <div className={`flex-1 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative h-64 md:h-96 rounded-3xl bg-gradient-to-br from-primary-100 to-secondary-100 
                     dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center 
                     overflow-hidden shadow-2xl"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 bg-gradient-to-br from-primary-200/50 to-secondary-200/50 
                       dark:from-primary-800/30 dark:to-secondary-800/30"
          />
          <Heart className="w-32 h-32 text-primary-600 dark:text-primary-400 relative z-10 opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full p-8 shadow-2xl 
                         border border-white/30 dark:border-gray-700/30"
              style={{
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              }}
            >
              <Users className="w-16 h-16 text-primary-600 dark:text-primary-400" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Content Section */}
      <div className={`flex-1 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 
                        border border-white/30 dark:border-gray-700/30"
              style={{
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <span className="text-primary-600 dark:text-primary-400 font-semibold">Featured Resource</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleFavorite}
              className={`p-2 rounded-2xl transition-all ${
                isFavorite
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </motion.button>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
            {resource.name}
          </h2>
          
          {resource.rating && (
            <div className="flex items-center gap-2 mb-4">
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
                {resource.rating} ({resource.reviewCount} reviews)
              </span>
            </div>
          )}
          
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 
                           dark:text-primary-300 text-sm font-medium rounded-full">
              {resource.category}
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">
            {resource.description}
          </p>

          <div className="space-y-3 mb-6">
            {resource.hours && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{resource.hours}</span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">{resource.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <a href={`tel:${resource.phone}`} className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                {resource.phone}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <a href={`mailto:${resource.email}`} className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                {resource.email}
              </a>
            </div>
            {resource.languages && resource.languages.length > 0 && (
              <div className="flex items-center gap-3">
                <Languages className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{resource.languages.join(', ')}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
              <a
                href={resource.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              >
                Visit Website
              </a>
            </div>
          </div>

          {resource.services && resource.services.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Services Offered
              </h3>
              <div className="flex flex-wrap gap-2">
                {resource.services.map((service: string) => (
                  <span
                    key={service}
                    className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 
                             text-sm rounded-full border border-primary-200 dark:border-primary-800"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {resource.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <Link href="/directory">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center gap-2 w-full justify-center"
            >
              View in Directory
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

