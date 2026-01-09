'use client'

import { motion } from 'framer-motion'
import { Heart, MapPin, Phone, Mail, Globe, ArrowRight, Users, Calendar, Star, Clock, Languages, Award } from 'lucide-react'
import Link from 'next/link'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useData } from '@/contexts/DataContext'

export default function HighlightsPage() {
  const { resources, isLoading } = useData()
  const featuredResources = resources.filter((r) => r.featured)
  const { isFavorite, toggleFavorite } = useFavorites()

  if (isLoading && featuredResources.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20">
        <p className="text-lg text-[#6B5D47] dark:text-[#B8A584]">Loading featured resources...</p>
      </div>
    )
  }

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
      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
    >
      {/* Image/Icon Section */}
      <div className="w-full lg:w-1/3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative aspect-square rounded-[3rem] bg-gradient-to-br from-[#8B6F47] to-[#D4A574] flex items-center justify-center 
                     overflow-hidden shadow-2xl group"
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
            className="absolute inset-0 bg-black/10 opacity-20"
          />
          <Heart className="w-32 h-32 text-white relative z-10 opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-8 shadow-2xl border border-white/20">
              <Users className="w-16 h-16 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="flex-1 w-full">
        <div className="bg-white dark:bg-[#1F1B28] rounded-[2.5rem] shadow-xl p-10 border border-[#E8E0D6] dark:border-[#2c2c3e] relative overflow-hidden">
          {/* Accent Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#8B6F47]/10 dark:bg-[#D4A574]/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 shadow-sm">
                <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 fill-current" />
                <span className="text-yellow-700 dark:text-yellow-400 font-black uppercase tracking-[0.2em] text-[10px]">Featured Resource</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleFavorite}
                className={`p-3 rounded-2xl transition-all shadow-sm ${
                  isFavorite
                    ? 'bg-red-500 text-white shadow-red-200'
                    : 'bg-[#FAF9F6] dark:bg-[#16141D] text-[#6B5D47] border border-[#E8E0D6] dark:border-[#2c2c3e]'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </motion.button>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-bold text-[#2C2416] dark:text-white mb-4 leading-tight break-all">
              {resource.name}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <span className="px-4 py-1 bg-[#8B6F47]/10 text-[#8B6F47] dark:text-[#D4A574] text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-[#8B6F47]/10">
                {resource.category}
              </span>
              {resource.rating && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-400/10 rounded-full border border-yellow-400/10">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold text-[#2C2416] dark:text-white">{resource.rating}</span>
                  <span className="text-xs text-[#6B5D47] opacity-60">({resource.reviewCount} reviews)</span>
                </div>
              )}
            </div>

            <p className="text-[#6B5D47] dark:text-[#B8A584] text-lg leading-relaxed mb-10 break-all whitespace-pre-wrap max-w-2xl">
              {resource.description}
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-[#6B5D47] dark:text-[#B8A584]">
                  <div className="p-2 rounded-lg bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 shrink-0">
                    <MapPin className="w-4 h-4 text-[#8B6F47]" />
                  </div>
                  <span className="text-sm font-medium break-all">{resource.address || 'Pittsburgh, PA'}</span>
                </div>
                <div className="flex items-center gap-4 text-[#6B5D47] dark:text-[#B8A584]">
                  <div className="p-2 rounded-lg bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 shrink-0">
                    <Phone className="w-4 h-4 text-[#8B6F47]" />
                  </div>
                  <a href={`tel:${resource.phone}`} className="text-sm font-medium hover:text-[#8B6F47] transition-colors">{resource.phone}</a>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-[#6B5D47] dark:text-[#B8A584]">
                  <div className="p-2 rounded-lg bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 shrink-0">
                    <Mail className="w-4 h-4 text-[#8B6F47]" />
                  </div>
                  <a href={`mailto:${resource.email}`} className="text-sm font-medium hover:text-[#8B6F47] transition-colors truncate">{resource.email}</a>
                </div>
                {resource.website && (
                  <div className="flex items-center gap-4 text-[#6B5D47] dark:text-[#B8A584]">
                    <div className="p-2 rounded-lg bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 shrink-0">
                      <Globe className="w-4 h-4 text-[#8B6F47]" />
                    </div>
                    <a href={resource.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-[#8B6F47] transition-colors truncate">Visit Website</a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={`/resources/${resource.id}`} className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
                >
                  View Detailed Profile
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="/directory" className="flex-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white dark:bg-[#16141D] text-[#8B6F47] dark:text-[#D4A574] border-2 border-[#8B6F47] dark:border-[#D4A574] py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all"
                >
                  Explore Directory
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

