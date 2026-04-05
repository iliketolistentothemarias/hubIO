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

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  MapPin, Phone, Mail, Globe, Clock, Star, Heart, Share2, 
  ArrowLeft, Calendar, Users, Award, Languages, CheckCircle,
  Navigation, ExternalLink 
} from 'lucide-react'
import { resources as fallbackResources } from '@/data/resources'
import { useFavorites } from '@/contexts/FavoritesContext'
import LiquidGlass from '@/components/LiquidGlass'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
export default function ResourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { isFavorite, toggleFavorite } = useFavorites()
  
  const [dbResources, setDbResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResources = async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
      
      if (!error && data) {
        setDbResources(data)
      }
      setLoading(false)
    }

    fetchResources()

    // Realtime subscription for instant updates
    const channel = supabase
      .channel('resource-details-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resources' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDbResources(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setDbResources(prev => prev.map(r => r.id === payload.new.id ? payload.new : r))
          } else if (payload.eventType === 'DELETE') {
            setDbResources(prev => prev.filter(r => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const allResources = useMemo(() => {
    // Merge fallback and DB resources, prioritizing DB by ID
    const merged = [...dbResources]
    fallbackResources.forEach(fallback => {
      if (!merged.find(r => r.id === fallback.id)) {
        merged.push(fallback)
      }
    })
    return merged
  }, [dbResources])

  const resource = useMemo(() => {
    return allResources.find(r => r.id === id)
  }, [allResources, id])

  const [relatedResources, setRelatedResources] = useState<any[]>([])

  useEffect(() => {
    if (resource) {
      // Find related resources (same category or shared tags)
      const related = allResources
        .filter(r => r.id !== resource.id && (
          r.category === resource.category ||
          (r.tags && r.tags.some(tag => resource.tags?.includes(tag)))
        ))
        .slice(0, 3)
      setRelatedResources(related)
    }
  }, [resource, allResources])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-40 flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-[#8B6F47]/20 border-t-[#8B6F47] rounded-full animate-spin mb-4" />
        <p className="text-[#6B5D47] font-medium">Loading details...</p>
      </div>
    )
  }
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
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0A0F] pt-20 md:pt-24 pb-20">
      <div className="container-custom px-4 md:px-6">
        {/* Breadcrumbs / Back */}
        <div className="mb-6 md:mb-8">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-[#6B5D47] dark:text-[#B8A584] hover:text-[#8B6F47] dark:hover:text-[#D4A574] transition-colors"
          >
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#1F1B28] shadow-sm group-hover:shadow-md transition-all border border-[#E8E0D6] dark:border-[#2c2c3e]">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">Back to directory</span>
          </motion.button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column: Main Info */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1F1B28] rounded-2xl md:rounded-[2rem] shadow-xl border border-[#E8E0D6] dark:border-[#2c2c3e] overflow-hidden"
            >
              <div className="p-6 md:p-12">
                <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                  {/* Hero Image/Icon Section */}
                  <div className="w-full md:w-40 shrink-0">
                    <div className="aspect-square w-24 h-24 md:w-40 md:h-40 mx-auto rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#8B6F47] to-[#D4A574] 
                                  flex items-center justify-center shadow-2xl relative group overflow-hidden">
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Heart className="w-10 h-10 md:w-16 md:h-16 text-white" />
                    </div>
                  </div>

                  {/* Core Details */}
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                      {resource.featured && (
                        <span className="px-3 py-1 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-1 border border-yellow-400/20">
                          <Star className="w-3 h-3 fill-current" />
                          Featured
                        </span>
                      )}
                      <span className="px-3 py-1 bg-[#8B6F47]/10 text-[#8B6F47] dark:text-[#D4A574] text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-[#8B6F47]/10">
                        {resource.category}
                      </span>
                      {resource.verified && (
                        <span className="px-3 py-1 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-400/20">
                          Verified
                        </span>
                      )}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-display font-bold text-[#2C2416] dark:text-white mb-6 leading-tight break-all">
                      {resource.name}
                    </h1>

                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      <p className="text-[#6B5D47] dark:text-[#B8A584] leading-relaxed break-all whitespace-pre-wrap text-sm md:text-base">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mt-8 md:mt-12 pt-8 md:pt-12 border-t border-[#E8E0D6] dark:border-[#2c2c3e]">
                  <div className="p-4 md:p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 dark:border-[#2c2c3e]/50 flex gap-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1F1B28] shadow-sm shrink-0 h-fit">
                      <MapPin className="w-5 h-5 text-[#8B6F47]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8B6F47]/60 mb-1">Location</p>
                      <p className="text-[#2C2416] dark:text-white font-medium break-all text-sm md:text-base">{resource.address || 'Location on map only'}</p>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 dark:border-[#2c2c3e]/50 flex gap-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1F1B28] shadow-sm shrink-0 h-fit">
                      <Phone className="w-5 h-5 text-[#8B6F47]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8B6F47]/60 mb-1">Contact</p>
                      <p className="text-[#2C2416] dark:text-white font-medium text-sm md:text-base">{resource.phone}</p>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 dark:border-[#2c2c3e]/50 flex gap-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1F1B28] shadow-sm shrink-0 h-fit">
                      <Mail className="w-5 h-5 text-[#8B6F47]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8B6F47]/60 mb-1">Email</p>
                      <p className="text-[#2C2416] dark:text-white font-medium truncate text-sm md:text-base">{resource.email}</p>
                    </div>
                  </div>

                  {resource.website && (
                    <div className="p-4 md:p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/50 dark:border-[#2c2c3e]/50 flex gap-4">
                      <div className="p-3 rounded-xl bg-white dark:bg-[#1F1B28] shadow-sm shrink-0 h-fit">
                        <Globe className="w-5 h-5 text-[#8B6F47]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8B6F47]/60 mb-1">Website</p>
                        <a href={resource.website} target="_blank" rel="noopener noreferrer" 
                           className="text-[#8B6F47] hover:underline font-medium truncate block text-sm md:text-base">
                          {resource.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Services & Details */}
            {resource.services?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#1F1B28] rounded-2xl md:rounded-[2rem] shadow-xl border border-[#E8E0D6] dark:border-[#2c2c3e] p-6 md:p-12"
              >
                <h2 className="text-xl md:text-2xl font-bold text-[#2C2416] dark:text-white mb-6 md:mb-8 flex items-center gap-3">
                  <Award className="w-6 h-6 text-[#8B6F47]" />
                  Services & Expertise
                </h2>
                <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                  {resource.services.map((service: string) => (
                    <div key={service} className="flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-[#E8E0D6]/30 dark:border-[#2c2c3e]/30">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="text-[#2C2416] dark:text-white font-medium text-sm md:text-base">{service}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#1F1B28] rounded-2xl md:rounded-[2rem] shadow-xl border border-[#E8E0D6] dark:border-[#2c2c3e] p-6 md:p-8"
            >
              <h3 className="text-xl font-bold text-[#2C2416] dark:text-white mb-6">Quick Actions</h3>
              <div className="space-y-4">
                <button className="w-full bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                  <Mail className="w-5 h-5" />
                  Contact Organization
                </button>
                <button className="w-full bg-white dark:bg-[#16141D] text-[#8B6F47] dark:text-[#D4A574] border-2 border-[#8B6F47] dark:border-[#D4A574] py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold hover:bg-[#8B6F47] hover:text-white dark:hover:bg-[#D4A574] dark:hover:text-[#1C1B18] transition-all flex items-center justify-center gap-3">
                  <Navigation className="w-5 h-5" />
                  Get Directions
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => toggleFavorite(resource.id)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl md:rounded-2xl font-bold transition-all border-2 ${
                      favorite 
                        ? 'bg-red-50 text-red-500 border-red-100' 
                        : 'bg-[#FAF9F6] dark:bg-[#16141D] text-[#6B5D47] border-[#E8E0D6] dark:border-[#2c2c3e]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
                    Save
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 rounded-xl md:rounded-2xl font-bold bg-[#FAF9F6] dark:bg-[#16141D] text-[#6B5D47] border-2 border-[#E8E0D6] dark:border-[#2c2c3e]">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </motion.div>

            {relatedResources.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#1F1B28] rounded-2xl md:rounded-[2rem] shadow-xl border border-[#E8E0D6] dark:border-[#2c2c3e] p-6 md:p-8"
              >
                <h3 className="text-xl font-bold text-[#2C2416] dark:text-white mb-6">Similar Resources</h3>
                <div className="space-y-4">
                  {relatedResources.map((related) => (
                    <Link
                      key={related.id}
                      href={`/resources/${related.id}`}
                      className="group block p-4 rounded-xl md:rounded-2xl bg-[#FAF9F6] dark:bg-[#16141D] border border-transparent hover:border-[#8B6F47]/20 transition-all hover:shadow-md"
                    >
                      <div className="font-bold text-sm md:text-base text-[#2C2416] dark:text-white group-hover:text-[#8B6F47] transition-colors line-clamp-1">{related.name}</div>
                      <div className="text-[10px] text-[#6B5D47] dark:text-[#B8A584] mt-1 uppercase tracking-widest font-black opacity-60">{related.category}</div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

