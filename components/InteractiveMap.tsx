'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X, Navigation, ZoomIn, ZoomOut } from 'lucide-react'
import { Resource } from '@/lib/types'

interface InteractiveMapProps {
  resources: Resource[]
  onResourceClick?: (resource: Resource) => void
}

export default function InteractiveMap({ resources, onResourceClick }: InteractiveMapProps) {
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState({ x: 50, y: 50 })
  const mapRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<any[]>([])
  const [map, setMap] = useState<any>(null)

  // Load Google Maps if API key is provided
  useEffect(() => {
    if (googleMapsApiKey && typeof window !== 'undefined') {
      // Check if Google Maps is already loaded
      if ((window as any).google) {
        setGoogleMapsLoaded(true)
        return
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener('load', () => setGoogleMapsLoaded(true))
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setGoogleMapsLoaded(true)
      script.onerror = () => {
        console.warn('Failed to load Google Maps API. Using fallback map view.')
        setGoogleMapsLoaded(false)
      }
      document.head.appendChild(script)

      return () => {
        // Cleanup script on unmount
        const scriptToRemove = document.querySelector(`script[src*="maps.googleapis.com"]`)
        if (scriptToRemove) {
          scriptToRemove.remove()
        }
      }
    }
  }, [googleMapsApiKey])

  const resourcesWithCoords = useMemo(
    () => resources.filter((r) => r.coordinates),
    [resources]
  )

  const handleMarkerClick = useCallback((resource: Resource) => {
    setSelectedResource(resource)
    if (onResourceClick) {
      onResourceClick(resource)
    }
  }, [onResourceClick])

  // Initialize Google Map when loaded
  useEffect(() => {
    if (googleMapsLoaded && googleMapsApiKey && mapRef.current && resourcesWithCoords.length > 0 && !map) {
      const google = (window as any).google
      if (!google) return

      // Calculate center from resources
      const avgLat = resourcesWithCoords.reduce((sum, r) => sum + r.coordinates!.lat, 0) / resourcesWithCoords.length
      const avgLng = resourcesWithCoords.reduce((sum, r) => sum + r.coordinates!.lng, 0) / resourcesWithCoords.length

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: avgLat, lng: avgLng },
        zoom: 12,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#c9c9c9' }]
          }
        ],
        disableDefaultUI: false,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      setMap(mapInstance)

      // Create markers
      const newMarkers = resourcesWithCoords.map((resource) => {
        const marker = new google.maps.Marker({
          position: { lat: resource.coordinates!.lat, lng: resource.coordinates!.lng },
          map: mapInstance,
          title: resource.name,
          icon: resource.featured
            ? {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#8B6F47',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }
            : {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: '#0284c7',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
        })

        marker.addListener('click', () => {
          handleMarkerClick(resource)
        })

        return marker
      })

      markersRef.current = newMarkers
    }

    return () => {
      // Cleanup markers on unmount
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => {
          if (marker && marker.setMap) {
            marker.setMap(null)
          }
        })
        markersRef.current = []
      }
    }
  }, [googleMapsLoaded, googleMapsApiKey, resourcesWithCoords.length, map, handleMarkerClick])

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

  // Show message if no resources with coordinates
  if (resourcesWithCoords.length === 0) {
    return (
      <div className="relative w-full h-[500px] bg-[#FAF9F6] dark:bg-[#1C1B18] 
                      backdrop-blur-xl rounded-3xl 
                      overflow-hidden shadow-2xl border border-white/30 dark:border-gray-700/30
                      flex items-center justify-center"
            style={{
              backdropFilter: 'saturate(180%) blur(20px)',
              WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            }}
      >
        <div className="text-center p-8">
          <MapPin className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No resources with location data available to display on the map.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            {resources.length} resource(s) total, {resourcesWithCoords.length} with coordinates
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full min-h-[500px] h-[500px] bg-[#FAF9F6] dark:bg-[#1C1B18] 
                    backdrop-blur-xl rounded-3xl 
                    overflow-hidden shadow-2xl border border-white/30 dark:border-gray-700/30"
          style={{
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            minHeight: '500px',
            height: '500px',
          }}
    >
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (map) {
              const currentZoom = map.getZoom() || 12
              map.setZoom(Math.min(currentZoom + 1, 20))
            } else {
              setZoom((z) => Math.min(z + 0.1, 2))
            }
          }}
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
          onClick={() => {
            if (map) {
              const currentZoom = map.getZoom() || 12
              map.setZoom(Math.max(currentZoom - 1, 1))
            } else {
              setZoom((z) => Math.max(z - 0.1, 0.5))
            }
          }}
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
      <div className="relative w-full h-full">
        {/* Google Maps Container */}
        {googleMapsLoaded && googleMapsApiKey ? (
          <div ref={mapRef} className="w-full h-full" />
        ) : (
          <>
            {/* Fallback Map with Grid Pattern */}
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

              {/* Resource Markers (Fallback) */}
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
          </>
        )}
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

