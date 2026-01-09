'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryImage {
  id: string
  title: string
  description: string
  category: string
}

const galleryImages: GalleryImage[] = [
  { id: '1', title: 'Community Food Distribution', description: 'Volunteers distributing food to families', category: 'Food Assistance' },
  { id: '2', title: 'Youth Mentorship Program', description: 'Mentors working with young people', category: 'Youth Services' },
  { id: '3', title: 'Health Clinic Services', description: 'Community health screening event', category: 'Health Services' },
  { id: '4', title: 'Housing Workshop', description: 'Workshop on housing assistance programs', category: 'Housing' },
  { id: '5', title: 'Educational Support', description: 'Adult education and GED preparation', category: 'Education' },
  { id: '6', title: 'Senior Activities', description: 'Social activities for senior community members', category: 'Senior Services' },
  { id: '7', title: 'Legal Aid Consultation', description: 'Free legal assistance for community members', category: 'Legal Services' },
  { id: '8', title: 'Employment Resources', description: 'Job search and career counseling', category: 'Employment' },
  { id: '9', title: 'Community Garden', description: 'Urban gardening and food security program', category: 'Community Programs' },
]

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openLightbox = (id: string) => {
    const index = galleryImages.findIndex(img => img.id === id)
    setCurrentIndex(index)
    setSelectedImage(id)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  const selectedImg = galleryImages[currentIndex]

  return (
    <section className="section-padding bg-white dark:bg-gray-900">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Community Gallery
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            See our community resources in action. These images showcase the impact of organizations and programs in our community.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => openLightbox(image.id)}
              className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer 
                         bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30
                         shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white font-semibold mb-1">{image.title}</h3>
                <p className="text-white/90 text-sm">{image.category}</p>
              </div>
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">
                  {image.category}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage && selectedImg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full"
              >
                <button
                  onClick={closeLightbox}
                  className="absolute top-4 right-4 z-10 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl 
                             rounded-full text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 
                             transition-colors shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 
                             backdrop-blur-xl rounded-full text-gray-700 dark:text-gray-300 hover:bg-white 
                             dark:hover:bg-gray-800 transition-colors shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 
                             backdrop-blur-xl rounded-full text-gray-700 dark:text-gray-300 hover:bg-white 
                             dark:hover:bg-gray-800 transition-colors shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
                  <div className="aspect-video bg-gradient-to-br from-primary-200 to-secondary-200 dark:from-primary-900/50 dark:to-secondary-900/50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📸</div>
                      <p className="text-gray-600 dark:text-gray-400">Community Resource Image</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedImg.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedImg.description}</p>
                    <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-full">
                      {selectedImg.category}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentIndex(idx)
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex
                          ? 'bg-white w-8'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

