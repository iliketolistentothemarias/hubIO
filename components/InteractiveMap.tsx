'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ZoomIn, ZoomOut, Map as MapIcon, 
  Heart, Home, Stethoscope, Baby, Accessibility, 
  GraduationCap, Briefcase, Scale, LifeBuoy, Users,
  Utensils, MapPin, Phone
} from 'lucide-react'
import { Resource } from '@/lib/types'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'

// Mapping categories to Lucide icons
const categoryIcons: Record<string, any> = {
  'Food Assistance': Utensils,
  'Housing': Home,
  'Health Services': Stethoscope,
  'Youth Services': Baby,
  'Senior Services': Accessibility,
  'Education': GraduationCap,
  'Employment': Briefcase,
  'Legal Services': Scale,
  'Support Services': LifeBuoy,
  'Community Programs': Users,
  'Family Services': Users,
  'Default': Heart
}

// Function to create a custom DivIcon with Lucide icons in a pin shape
const createCustomIcon = (category: string, isFeatured: boolean) => {
  const IconComponent = categoryIcons[category] || categoryIcons['Default']
  
  const iconMarkup = renderToStaticMarkup(
    <div className="relative flex flex-col items-center">
      {/* Pin Body */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        backgroundColor: isFeatured ? '#8B6F47' : '#2563eb',
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        border: '3px solid white',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        color: 'white',
      }}>
        {/* Icon inside (rotated back) */}
        <div style={{ transform: 'rotate(45deg)', display: 'flex' }}>
          <IconComponent size={20} strokeWidth={2.5} />
        </div>
      </div>
      {/* Glow Effect for Featured */}
      {isFeatured && (
        <div className="absolute inset-0 w-full h-full rounded-full animate-ping bg-[#8B6F47] opacity-20" style={{ transform: 'scale(1.5)' }}></div>
      )}
    </div>
  )

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-leaflet-pin',
    iconSize: [44, 44],
    iconAnchor: [22, 44], 
    popupAnchor: [0, -44] 
  })
}
interface InteractiveMapProps {
  resources: Resource[]
  onResourceClick?: (resource: Resource) => void
}

// Component to handle map center and zoom changes
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  map.setView(center, zoom)
  return null
}

export default function InteractiveMap({ resources, onResourceClick }: InteractiveMapProps) {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [zoom, setZoom] = useState(11)

  const resourcesWithCoords = useMemo(
    () => resources.filter((r) => {
      const coords = r.coordinates || (r.location as any);
      return coords && coords.lat && coords.lng;
    }).map(r => ({
      ...r,
      displayCoords: r.coordinates || (r.location as any)
    })),
    [resources]
  )

  const defaultCenter: [number, number] = useMemo(() => {
    // Always default to Pittsburgh as the primary view
    return [40.4406, -79.9959]
  }, [])

  const handleMarkerClick = (resource: any) => {
    setSelectedResource(resource)
    if (onResourceClick) {
      onResourceClick(resource)
    }
  }

  if (typeof window === 'undefined') {
    return (
      <div className="w-full h-[500px] bg-[#FAF9F6] dark:bg-[#1C1B18] rounded-3xl animate-pulse flex items-center justify-center">
        <MapIcon className="w-12 h-12 text-[#8B6F47]/20" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-[500px] bg-[#FAF9F6] dark:bg-[#1C1B18] 
                    backdrop-blur-xl rounded-3xl 
                    overflow-hidden shadow-2xl border border-[#E8E0D6] dark:border-white/10"
    >
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setZoom((z) => Math.min(z + 1, 18))}
          className="p-2.5 bg-white/90 dark:bg-[#2A2824]/90 backdrop-blur-xl rounded-2xl 
                     shadow-xl text-[#2C2416] dark:text-[#F5F3F0] border border-[#E8E0D6] dark:border-white/10
                     hover:scale-110 transition-all duration-200"
        >
          <ZoomIn className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setZoom((z) => Math.max(z - 1, 1))}
          className="p-2.5 bg-white/90 dark:bg-[#2A2824]/90 backdrop-blur-xl rounded-2xl 
                     shadow-xl text-[#2C2416] dark:text-[#F5F3F0] border border-[#E8E0D6] dark:border-white/10
                     hover:scale-110 transition-all duration-200"
        >
          <ZoomOut className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Leaflet Map */}
      <div className="w-full h-full z-0">
        <MapContainer 
          center={defaultCenter} 
          zoom={zoom} 
          scrollWheelZoom={false}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={defaultCenter} zoom={zoom} />
          
          {/* Pittsburgh City Center Marker */}
          <Marker position={defaultCenter} icon={L.divIcon({
            html: renderToStaticMarkup(
              <div className="p-2 bg-red-500 rounded-full border-2 border-white shadow-lg text-white">
                <MapPin size={16} />
              </div>
            ),
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })}>
            <Popup>
              <div className="font-bold text-center">Pittsburgh</div>
            </Popup>
          </Marker>

          {resourcesWithCoords.map((resource) => (
            <Marker 
              key={resource.id} 
              position={[resource.displayCoords.lat, resource.displayCoords.lng]}
              icon={createCustomIcon(resource.category, resource.featured)}
              eventHandlers={{
                click: () => handleMarkerClick(resource)
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1">
                  <h3 className="font-bold text-[#2C2416] text-sm">{resource.name}</h3>
                  <p className="text-[#6B5D47] text-xs mb-1">{resource.category}</p>
                  <p className="text-[#8B6F47] text-[10px]">{resource.address}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Selected Resource Overlay (Mobile Friendly) */}
      <AnimatePresence>
        {selectedResource && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-6 right-6 z-[1001]"
          >
            <div className="bg-white/95 dark:bg-[#1F1B28]/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl 
                            border border-[#E8E0D6] dark:border-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#2C2416] dark:text-[#F5F3F0]">
                      {selectedResource.name}
                    </h3>
                    {selectedResource.featured && (
                      <span className="px-2 py-0.5 bg-[#8B6F47] text-white text-[10px] rounded-full font-bold uppercase tracking-wider">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#8B6F47] dark:text-[#D4A574] mb-2 font-medium">
                    {selectedResource.category}
                  </p>
                  <p className="text-xs text-[#6B5D47] dark:text-[#B8A584] leading-relaxed line-clamp-2 mb-3">
                    {selectedResource.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedResource.phone && (
                      <span className="flex items-center gap-1 text-[10px] text-[#8B6F47] dark:text-[#D4A574] bg-[#f5ede1] dark:bg-[#3b352c] px-2 py-1 rounded-full font-medium">
                        <Phone size={10} /> {selectedResource.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-[#6B5D47] dark:text-[#B8A584] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full font-medium">
                      <MapPin size={10} /> {selectedResource.address}
                    </span>
                  </div>
                  <button 
                    onClick={() => window.location.href = `/directory?id=${selectedResource.id}`}
                    className="text-xs font-bold text-white bg-[#8B6F47] dark:bg-[#D4A574] px-4 py-2 rounded-xl hover:opacity-90 transition-all shadow-md"
                  >
                    View Full Details
                  </button>
                </div>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="p-2 rounded-xl bg-[#F5F3F0] dark:bg-[#2A2824] hover:bg-[#E8E0D6] dark:hover:bg-[#353330] transition-colors"
                >
                  <X className="w-4 h-4 text-[#6B5D47] dark:text-[#B8A584]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 dark:bg-[#2A2824]/90 backdrop-blur-xl 
                      rounded-2xl p-3 shadow-xl border border-[#E8E0D6] dark:border-white/10"
      >
        <div className="text-[10px] font-bold text-[#6B5D47] dark:text-[#B8A584] uppercase tracking-widest mb-2 opacity-50">Map Legend</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8B6F47]" />
            <span className="text-[11px] font-medium text-[#2C2416] dark:text-[#F5F3F0]">Featured Service</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
            <span className="text-[11px] font-medium text-[#2C2416] dark:text-[#F5F3F0]">Regular Resource</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-[11px] font-medium text-[#2C2416] dark:text-[#F5F3F0]">City Center</span>
          </div>
        </div>
      </div>
    </div>
  )
}
