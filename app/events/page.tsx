'use client'

/**
 * Events Page
 * 
 * Comprehensive events calendar and listing page with advanced filtering,
 * calendar view, and event management features.
 */

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Clock, Users, Filter, Grid, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import TabNavigation from '@/components/TabNavigation'
import LiquidGlass from '@/components/LiquidGlass'
import { Event } from '@/lib/types'
import { events as staticEvents } from '@/data/events'

const categories = ['All', 'Community', 'Business', 'Youth', 'Education', 'Health', 'Arts', 'Sports', 'Health & Wellness', 'Volunteering', 'Employment', 'Environment']

export default function EventsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    loadEvents()
  }, [activeTab, selectedCategory])

  const loadEvents = async () => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.set('status', activeTab)
      if (selectedCategory !== 'All') params.set('category', selectedCategory)
      params.set('status', activeTab === 'past' ? 'all' : activeTab)

      const res = await fetch(`/api/events?${params}`)
      const json = await res.json()

      if (json.success) {
        let data = json.data as Array<Record<string, unknown>>
        // Filter past vs upcoming client-side since our DB has upcoming/ongoing/completed
        if (activeTab === 'upcoming') {
          data = data.filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
        } else if (activeTab === 'past') {
          data = data.filter((e) => e.status === 'completed' || e.status === 'cancelled')
        }
        // Map to legacy Event shape expected by the list renderer
        setEvents(
          data.map((e) => ({
            id: String(e.id),
            name: String(e.title),
            title: String(e.title),
            description: String(e.description),
            date: new Date(String(e.date)),
            end_date: e.end_date ? new Date(String(e.end_date)) : undefined,
            location: String(e.location),
            organizer: String(e.organizer),
            organizer_id: e.organizer_id ? String(e.organizer_id) : undefined,
            capacity: e.capacity ? Number(e.capacity) : undefined,
            attendees: Number(e.attendees ?? 0),
            category: String(e.category),
            tags: (e.tags as string[]) || [],
            image: e.image ? String(e.image) : undefined,
            status: String(e.status) as any,
            featured: Boolean(e.featured),
            visibility: (e.visibility as 'public' | 'private') || 'public',
          }))
        )
      } else {
        // Fallback to static events if API unavailable
        let filteredEvents = [...staticEvents]
        if (activeTab === 'upcoming') {
          filteredEvents = filteredEvents.filter(e => e.status === 'upcoming' || e.status === 'ongoing')
        } else if (activeTab === 'past') {
          filteredEvents = filteredEvents.filter(e => e.status === 'completed' || e.status === 'cancelled')
        }
        if (selectedCategory !== 'All') {
          filteredEvents = filteredEvents.filter(e => e.category === selectedCategory)
        }
        setEvents(filteredEvents)
      }
    } catch {
      // Fallback to static events
      let filteredEvents = [...staticEvents]
      if (activeTab === 'upcoming') {
        filteredEvents = filteredEvents.filter(e => e.status === 'upcoming' || e.status === 'ongoing')
      } else if (activeTab === 'past') {
        filteredEvents = filteredEvents.filter(e => e.status === 'completed' || e.status === 'cancelled')
      }
      if (selectedCategory !== 'All') {
        filteredEvents = filteredEvents.filter(e => e.category === selectedCategory)
      }
      setEvents(filteredEvents)
    } finally {
      setLoading(false)
    }
  }

  const [rsvping, setRsvping] = useState<string | null>(null)

  const handleRSVP = async (event: Event) => {
    router.push(`/events/${event.id}`)
  }

  const filteredEvents = useMemo(() => {
    return events.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [events])
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: activeTab === 'upcoming' ? filteredEvents.length : undefined },
    { id: 'past', label: 'Past Events', icon: CalendarIcon, count: activeTab === 'past' ? filteredEvents.length : undefined },
    { id: 'my-events', label: 'My Events', icon: Users },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 
                    dark:from-gray-900 dark:via-gray-800 dark:to-primary-900/10 pt-20">
      <div className="container-custom section-padding">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Community Events
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover and join community events, workshops, and gatherings happening near you.
          </p>
        </motion.div>

        {/* Filters and View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-[#1F1B28]/80 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-white/30 dark:border-[#2c2c3e]/50 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Category Filter */}
              <div className="w-full overflow-x-auto no-scrollbar -mx-2 px-2 flex md:flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95 touch-manipulation min-h-[44px] ${
                      selectedCategory === cat
                        ? 'bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] shadow-lg'
                        : 'bg-white dark:bg-[#2A2824] text-[#6B5D47] dark:text-[#B8A584] border border-[#E8E0D6] dark:border-[#4A4844] hover:shadow-md'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-[#FAF9F6] dark:bg-[#16141D] rounded-2xl p-1 border border-[#E8E0D6] dark:border-[#2c2c3e]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-xl transition-all active:scale-90 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${
                    viewMode === 'grid' ? 'bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] shadow-md' : 'text-[#6B5D47] dark:text-[#B8A584]'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-xl transition-all active:scale-90 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${
                    viewMode === 'list' ? 'bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] shadow-md' : 'text-[#6B5D47] dark:text-[#B8A584]'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-3 rounded-xl transition-all active:scale-90 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${
                    viewMode === 'calendar' ? 'bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] shadow-md' : 'text-[#6B5D47] dark:text-[#B8A584]'
                  }`}
                >
                  <CalendarIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <TabNavigation tabs={tabs} defaultTab="upcoming" onTabChange={(tab) => {
          setActiveTab(tab)
        }}>
          {(tab) => (
            <div>
              {viewMode === 'calendar' ? (
                <CalendarView events={filteredEvents} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} onRSVP={handleRSVP} rsvping={rsvping} />
              ) : viewMode === 'list' ? (
                <ListView events={filteredEvents} onRSVP={handleRSVP} rsvping={rsvping} />
              ) : (
                <GridView events={filteredEvents} onRSVP={handleRSVP} rsvping={rsvping} />
              )}
            </div>
          )}
        </TabNavigation>
      </div>
    </div>
  )
}

function CalendarView({ events, currentMonth, setCurrentMonth, onRSVP, rsvping }: any) {
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const getEventsForDay = (day: number) => {
    return events.filter((e: Event) => {
      const eventDate = new Date(e.date)
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentMonth.getMonth() &&
             eventDate.getFullYear() === currentMonth.getFullYear()
    })
  }

  return (
    <LiquidGlass intensity="medium">
      <div className="p-3 md:p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-1.5 text-xs md:text-sm">
              <span className="md:hidden">{day}</span>
              <span className="hidden md:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
            </div>
          ))}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day)
            return (
              <motion.div
                key={day}
                whileHover={{ scale: 1.05 }}
                className={`aspect-square rounded-lg md:rounded-xl p-0.5 md:p-2 border-2 transition-all ${
                  dayEvents.length > 0
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 cursor-pointer'
                    : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-0.5 text-[10px] md:text-sm leading-tight text-center md:text-left">{day}</div>
                <div className="hidden md:block">
                  {dayEvents.slice(0, 2).map((event: Event) => (
                    <div
                      key={event.id}
                      className="text-xs bg-primary-600 text-white rounded px-1 mb-1 truncate"
                    >
                      {event.name}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-primary-600 dark:text-primary-400">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
                {dayEvents.length > 0 && (
                  <div className="md:hidden w-1.5 h-1.5 rounded-full bg-primary-500 mx-auto mt-0.5" />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </LiquidGlass>
  )
}

function GridView({ events, onRSVP, rsvping }: { events: any[]; onRSVP: (event: any) => void; rsvping: string | null }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => onRSVP(event)}
          className="cursor-pointer bg-white dark:bg-[#1F1B28] rounded-[2rem] border border-[#E8E0D6] dark:border-[#2c2c3e] overflow-hidden shadow-lg"
        >
          {event.image && (
            <img src={event.image} alt={event.title || event.name} className="w-full h-36 object-cover" />
          )}
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-[#8B6F47]/10 text-[#8B6F47] dark:text-[#D4A574] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#8B6F47]/10">
                {event.category}
              </span>
              {event.visibility === 'private' ? (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Private
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Public</span>
              )}
            </div>

            <h3 className="text-xl font-bold text-[#2C2416] dark:text-white mb-2">{event.title || event.name}</h3>
            <p className="text-[#6B5D47] dark:text-[#B8A584] text-sm mb-4 line-clamp-2">{event.description}</p>

            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-[#2C2416] dark:text-[#F5F3F0]">
                <Calendar className="w-4 h-4 text-[#8B6F47] flex-shrink-0" />
                <span suppressHydrationWarning>
                  {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#2C2416] dark:text-[#F5F3F0]">
                <MapPin className="w-4 h-4 text-[#8B6F47] flex-shrink-0" />
                <span className="truncate">{typeof event.location === 'string' ? event.location : event.location?.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#2C2416] dark:text-[#F5F3F0]">
                <Users className="w-4 h-4 text-[#8B6F47] flex-shrink-0" />
                <span>{event.attendees ?? 0}{event.capacity ? ` / ${event.capacity}` : ''} attending</span>
              </div>
            </div>

            <div className="w-full bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] py-3 rounded-2xl font-bold text-center text-sm">
              {event.visibility === 'private' ? 'Apply to Join' : 'View Event'}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function ListView({ events, onRSVP, rsvping }: { events: any[]; onRSVP: (event: any) => void; rsvping: string | null }) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ x: 5 }}
          onClick={() => onRSVP(event)}
          className="cursor-pointer"
        >
          <LiquidGlass intensity="light">
            <div className="p-5 flex flex-col md:flex-row gap-5">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B6F47] to-[#D4A574] flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-lg font-bold text-[#2C2416] dark:text-white">{event.title || event.name}</h3>
                  <span className="px-3 py-1 bg-[#8B6F47]/10 text-[#8B6F47] dark:text-[#D4A574] text-xs rounded-full ml-3 flex-shrink-0">
                    {event.category}
                  </span>
                </div>
                <p className="text-[#6B5D47] dark:text-[#B8A584] text-sm mb-3 line-clamp-2">{event.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-[#6B5D47] dark:text-[#B8A584]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span suppressHydrationWarning>{new Date(event.date).toLocaleDateString()}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {typeof event.location === 'string' ? event.location : event.location?.address}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {event.attendees ?? 0} attending
                  </span>
                  {event.visibility === 'private' && (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                      <Lock className="w-4 h-4" /> Private
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 self-center">
                <span className="px-5 py-2.5 bg-[#8B6F47] dark:bg-[#D4A574] text-white dark:text-[#1C1B18] rounded-xl font-semibold text-sm">
                  View
                </span>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>
      ))}
    </div>
  )
}

function getDaysInMonth(date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth()
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth()
  return new Date(year, month, 1).getDay()
}

