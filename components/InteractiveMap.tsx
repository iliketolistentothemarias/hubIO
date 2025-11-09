'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X, Navigation, ZoomIn, ZoomOut } from 'lucide-react'
import { Resource } from '@/lib/types'

interface InteractiveMapProps {
  resources: Resource[]
  onResourceClick?: (resource: Resource) => void
}

export default function InteractiveMap({ resources, onResourceClick }: InteractiveMapProps) {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState({ x: 50, y: 50 })

  const resourcesWithCoords = useMemo(
    () => resources.filter((r) => r.coordinates),
    [resources]
  )

  // Calculate relative positions (simplified - in real app, use actual map library)
  const resourcePositions = useMemo(() => {
    if (resourcesWithCoords.length === 0) return []

    const minLat = Math.min(...resourcesWithCoords.map((r) => r.coordinates!.lat))
    const maxLat = Math.max(...resourcesWithCoords.map((r) => r.coordinates!.lat))
    const minLng = Math.min(...resourcesWithCoords.map((r) => r.coordinates!.lng))
    const maxLng = Math.max(...resourcesWithCoords.map((r) => r.coordinates!.lng))

    return resourcesWithCoords.map((resource) => {
      const lat = resource.coordinates!.lat
      const lng = resource.coordinates!.lng

      const x = ((lng - minLng) / (maxLng - minLng)) * 100
      const y = ((lat - minLat) / (maxLat - minLat)) * 100

      return { resource, x, y }
    })
  }, [resourcesWithCoords])

  const handleMarkerClick = (resource: Resource) => {
    setSelectedResource(resource)
    if (onResourceClick) {
      onResourceClick(resource)
    }
  }

  return (
    <div className="relative w-full h-[500px] bg-[#FAF9F6] dark:bg-[#1C1B18] 
                    backdrop-blur-xl rounded-3xl 
                    overflow-hidden shadow-2xl border border-white/30 dark:border-gray-700/30"
          style={{
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          }}
    >
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}
              className="p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl 
                         shadow-xl text-gray-700 dark:text-gray-300 border border-white/30 dark:border-gray-700/30
                         hover:scale-110 transition-transform duration-200"
              style={{
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              }}
            >
          <ZoomIn className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
              className="p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl 
                         shadow-xl text-gray-700 dark:text-gray-300 border border-white/30 dark:border-gray-700/30
                         hover:scale-110 transition-transform duration-200"
              style={{
                backdropFilter: 'saturate(180%) blur(20px)',
                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              }}
            >
          <ZoomOut className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Map Container */}
      <div
        className="relative w-full h-full"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Resource Markers */}
        {resourcePositions.map(({ resource, x, y }) => (
          <motion.button
            key={resource.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2, zIndex: 10 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleMarkerClick(resource)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
              selectedResource?.id === resource.id
                ? 'z-20'
                : resource.featured
                ? 'z-10'
                : 'z-0'
            }`}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className={`p-2 rounded-full shadow-lg ${
                resource.featured
                  ? 'bg-[#8B6F47] dark:bg-[#D4A574]'
                  : 'bg-white dark:bg-[#2A2824]'
              }`}
            >
              <MapPin
                className={`w-6 h-6 ${
                  resource.featured
                    ? 'text-white'
                    : 'text-primary-600 dark:text-primary-400'
                }`}
              />
            </motion.div>
            {resource.featured && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-primary-400 pointer-events-none"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Selected Resource Info */}
      <AnimatePresence>
        {selectedResource && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 z-30"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-4 shadow-2xl 
                            border border-white/30 dark:border-gray-700/30"
                  style={{
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                  }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {selectedResource.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {selectedResource.category}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {selectedResource.address}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl 
                      rounded-2xl p-3 shadow-xl border border-white/30 dark:border-gray-700/30"
            style={{
              backdropFilter: 'saturate(180%) blur(20px)',
              WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            }}
      >
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-600" />
            <span className="text-gray-600 dark:text-gray-400">Featured</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white dark:bg-gray-800 border-2 border-primary-600" />
            <span className="text-gray-600 dark:text-gray-400">Regular</span>
          </div>
        </div>
      </div>
    </div>
  )
}

