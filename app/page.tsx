'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Search, Heart, Users, Calendar, ArrowRight, Sparkles, Map, BarChart3, Star, Zap } from 'lucide-react'
import Link from 'next/link'
import AdvancedSearch from '@/components/AdvancedSearch'
import ResourceInsights from '@/components/ResourceInsights'
import dynamic from 'next/dynamic'

const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-[#FAF9F6] dark:bg-[#1C1B18] rounded-3xl animate-pulse flex items-center justify-center">
      <Map className="w-12 h-12 text-[#8B6F47]/20" />
    </div>
  )
})

import Testimonials from '@/components/Testimonials'
import { useData } from '@/contexts/DataContext'
export default function Home() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  
  // Use pre-loaded data from context - INSTANT
  const { resources, events, campaigns } = useData()

  // Calculate stats from pre-loaded data - INSTANT
  const stats = [
    { value: `${resources.length}+`, label: 'Resources', icon: Heart, color: 'text-primary-600' },
    { value: `${events.length}+`, label: 'Events', icon: Calendar, color: 'text-green-600' },
    { value: `${campaigns.length}+`, label: 'Campaigns', icon: Users, color: 'text-secondary-600' },
    { value: '4.8', label: 'Avg Rating', icon: Star, color: 'text-yellow-600' },
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18]">
      {/* Hero Section — top-aligned so logo sits clearly below fixed nav (extra pt = breathing room under bar) */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-[#FAF9F6] dark:bg-[#1C1B18]
          pt-[calc(env(safe-area-inset-top,0px)+6.75rem)]
          sm:pt-[calc(env(safe-area-inset-top,0px)+7.5rem)]
          md:pt-[calc(env(safe-area-inset-top,0px)+8.75rem)]
          lg:pt-[calc(env(safe-area-inset-top,0px)+9.5rem)]"
      >
        <motion.div
          style={{ opacity: opacity || 1 }}
          className="container-custom relative z-10 w-full px-4 pb-16 sm:px-6 md:pb-24 lg:px-8"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold text-[#2C2416] dark:text-[#F5F3F0] mb-4 md:mb-6 leading-tight tracking-tight"
                >
                  Communify
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl md:text-3xl text-[#8B6F47] dark:text-[#D4A574] mb-6 font-light italic"
                >
                  /kəˈmjuː.nə.faɪ/
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg md:text-2xl text-[#6B5D47] dark:text-[#B8A584] mb-10 leading-relaxed max-w-xl"
                >
                  Your premier gateway to community resources across <span className="font-semibold text-[#2C2416] dark:text-[#F5F3F0]">South Fayette & Pittsburgh</span>.
                  <br className="hidden md:block mt-2" />
                  <span className="font-medium">Connect. Discover. Thrive Together.</span>
                </motion.p>
              </motion.div>

              {/* Advanced Search */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mb-10 max-w-lg"
              >
                <AdvancedSearch />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 items-center"
              >
                <Link href="/directory" className="w-full sm:w-auto">
                  <button className="btn-primary text-lg px-8 py-4 flex items-center gap-2 justify-center w-full sm:w-auto hover:scale-105 transition-transform shadow-lg shadow-[#8B6F47]/20">
                    Explore Resources
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link href="/highlights" className="w-full sm:w-auto">
                  <button className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto hover:scale-105 transition-transform bg-white dark:bg-[#2A2824]">
                    Featured Resources
                  </button>
                </Link>
              </motion.div>
            </div>

            {/* Right side: Hero Image and Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-[#2A2824] aspect-[4/5] w-full max-w-md mx-auto transform hover:-translate-y-2 transition-transform duration-500 group">
                <div className="absolute inset-0 bg-gradient-to-t from-[#2C2416]/80 via-transparent to-transparent z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1549888834-3ec93abae044?auto=format&fit=crop&q=80&w=1200" 
                  alt="Pittsburgh Cityscape" 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-8 left-8 right-8 z-20 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-sm tracking-wider uppercase">Award Winning Platform</span>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">Built for the community, empowering residents with real-time access to vital resources.</p>
                </div>
              </div>

              {/* Floating Stat Cards */}
              <motion.div 
                animate={{ y: [-5, 5, -5] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-12 top-20 bg-white/90 dark:bg-[#2A2824]/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/20 z-30"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#8B6F47]/10 dark:bg-[#D4A574]/10 rounded-2xl">
                    <Users className="w-8 h-8 text-[#8B6F47] dark:text-[#D4A574]" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">{campaigns.length}+</p>
                    <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] font-medium">Active Campaigns</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [5, -5, 5] }} 
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 bottom-32 bg-white/90 dark:bg-[#2A2824]/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/20 z-30"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-2xl">
                    <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">{events.length}+</p>
                    <p className="text-sm text-[#6B5D47] dark:text-[#B8A584] font-medium">Upcoming Events</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats Section for Mobile/Tablet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-2 gap-4 mt-16 lg:hidden"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6 bg-white/80 dark:bg-[#2A2824]/80 backdrop-blur-xl 
                             rounded-3xl shadow-lg border border-[#E8E0D6]/50 dark:border-[#4A4844]/50"
                >
                  <Icon className={`w-8 h-8 text-[#8B6F47] dark:text-[#D4A574] mx-auto mb-2`} />
                  <div className="text-3xl font-bold text-[#2C2416] dark:text-[#F5F3F0]">{stat.value}</div>
                  <div className="text-sm text-[#6B5D47] dark:text-[#B8A584]">{stat.label}</div>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>

        {/* Scroll indicator with animation */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 bg-white dark:bg-[#2A2824] rounded-full shadow-sm border border-[#E8E0D6] dark:border-[#4A4844]"
          >
            <ArrowRight className="w-6 h-6 text-[#8B6F47] dark:text-[#D4A574] rotate-90" />
          </motion.div>
        </motion.div>
      </section>

      {/* Interactive Map Section */}
      <section id="map" className="section-padding bg-gradient-to-br from-[#FAF9F6] via-white to-primary-50/30 dark:from-[#1C1B18] dark:via-gray-800 dark:to-primary-900/10">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-block mb-4">
              <Map className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Explore Resources on Map
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover community resources geographically. Click on markers to learn more about each organization.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <InteractiveMap resources={resources} />
          </motion.div>
        </div>
      </section>

      {/* Resource Insights Section */}
      <section className="section-padding bg-gradient-to-br from-[#FAF9F6] via-white to-primary-50/30 dark:from-[#1C1B18] dark:via-gray-900 dark:to-primary-900/10">
        <div className="container-custom">
          <ResourceInsights />
        </div>
      </section>

      {/* Features Section with 3D effects */}
      <section id="features" className="section-padding bg-[#FAF9F6] dark:bg-[#1C1B18]">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Communify is your comprehensive community resource platform with advanced features designed to connect residents
              with essential services, support organizations, and local programs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Advanced Search',
                description: 'Intelligent search with autocomplete and recent searches to help you find exactly what you need.',
                color: 'bg-[#D4A574]',
              },
              {
                icon: Map,
                title: 'Interactive Map',
                description: 'Visualize resources on an interactive map. Explore locations, get directions, and discover nearby services.',
                color: 'bg-[#8B6F47]',
              },
              {
                icon: BarChart3,
                title: 'Resource Insights',
                description: 'Get comprehensive analytics and insights about community resources, categories, and trends.',
                color: 'bg-[#D4A574]',
              },
              {
                icon: Star,
                title: 'Favorites & Ratings',
                description: 'Save your favorite resources and rate organizations to help others make informed decisions.',
                color: 'bg-[#8B6F47]',
              },
              {
                icon: Heart,
                title: 'Community First',
                description: 'We prioritize the needs of our community, ensuring every resident has access to vital resources and support services.',
                color: 'bg-[#8B6F47]',
              },
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10, rotateY: 5 }}
                  style={{ perspective: 1000 }}
                  className="relative group"
                >
                      <div className="relative bg-white dark:bg-[#2A2824] backdrop-blur-xl rounded-3xl p-6 
                                      shadow-xl hover:shadow-2xl transition-all duration-300 
                                      border border-[#E8E0D6] dark:border-[#4A4844] h-full
                                      hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]"
                            style={{
                              backdropFilter: 'saturate(180%) blur(20px)',
                              WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                            }}
                      >
                    <motion.div 
                      className={`inline-flex p-3 rounded-2xl ${feature.color} mb-4 shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="section-padding bg-gradient-to-br from-[#FAF9F6] via-white to-primary-50/30 dark:from-[#1C1B18] dark:via-gray-800 dark:to-primary-900/10">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Explore Our Platform
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Discover resources, learn about featured organizations, and contribute to our growing community hub.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/directory">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full"
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" alt="Directory" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <Search className="w-10 h-10 text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Resource Directory</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                    Browse our comprehensive directory of community resources, services, and organizations.
                  </p>
                  <span className="text-primary-600 dark:text-primary-400 font-medium flex items-center gap-2 group-hover:gap-4 transition-all">
                    Explore Directory
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>
            </Link>

            <Link href="/highlights">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full"
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                  <img src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=800" alt="Highlights" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <Sparkles className="w-10 h-10 text-secondary-600 dark:text-secondary-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Featured Resources</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                    Learn about standout organizations making a difference in our community.
                  </p>
                  <span className="text-secondary-600 dark:text-secondary-400 font-medium flex items-center gap-2 group-hover:gap-4 transition-all">
                    View Highlights
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>
            </Link>

            <Link href="/submit">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full"
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                  <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800" alt="Submit" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <Heart className="w-10 h-10 text-primary-600 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Submit Resource</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                    Help us grow! Submit a new resource or organization to add to our community hub.
                  </p>
                  <span className="text-primary-600 dark:text-primary-400 font-medium flex items-center gap-2 group-hover:gap-4 transition-all">
                    Submit Now
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

    </div>
  )
}

