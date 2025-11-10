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
import { Calendar, MapPin, Clock, Users, Filter, Grid, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import TabNavigation from '@/components/TabNavigation'
import LiquidGlass from '@/components/LiquidGlass'
import { Event } from '@/lib/types'
import { getAuthService } from '@/lib/auth'

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
    try {
      setLoading(true)
      
      // If "My Events" tab, fetch from my-events endpoint
      if (activeTab === 'my-events') {
        const response = await fetch('/api/events/my-events')
        const result = await response.json()
        
        if (result.success && result.data) {
          setEvents(result.data.items || result.data || [])
        } else {
          setEvents([])
        }
        return
      }
      
      // Otherwise, fetch from regular events endpoint
      const status = activeTab === 'upcoming' ? 'upcoming' : activeTab === 'past' ? 'past' : 'upcoming'
      const categoryParam = selectedCategory !== 'All' ? `&category=${selectedCategory}` : ''
      const response = await fetch(`/api/events?status=${status}${categoryParam}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setEvents(result.data.items || result.data || [])
      } else {
        setEvents([])
      }
    } catch (error) {
      console.error('Error loading events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const [rsvping, setRsvping] = useState<string | null>(null)

  const handleRSVP = async (event: Event) => {
    const auth = getAuthService()
    const authenticated = await auth.isAuthenticated()
    
    if (!authenticated) {
      sessionStorage.setItem('pendingAction', `rsvp_event_${event.id}`)
      sessionStorage.setItem('redirectAfterLogin', `/events`)
      router.push('/signup?message=Please create an account to RSVP for events')
      return
    }
    
    try {
      setRsvping(event.id)
      
      // Determine if event requires RSVP or just registration
      const endpoint = event.rsvpRequired 
        ? `/api/events/${event.id}/rsvp`
        : `/api/events/${event.id}/register`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Show success toast
        if (typeof window !== 'undefined') {
          const { showToast } = await import('@/components/Toast')
          showToast(`Successfully ${event.rsvpRequired ? 'RSVPed' : 'registered'} for ${event.name}!`, 'success')
        }
        
        // Reload events to update registration count
        loadEvents()
      } else {
        // Show error toast
        if (typeof window !== 'undefined') {
          const { showToast } = await import('@/components/Toast')
          showToast(result.error || 'Failed to RSVP', 'error')
        }
      }
    } catch (error) {
      console.error('Error RSVPing to event:', error)
      if (typeof window !== 'undefined') {
        const { showToast } = await import('@/components/Toast')
        showToast('An error occurred. Please try again.', 'error')
      }
    } finally {
      setRsvping(null)
    }
  }

  const filteredEvents = useMemo(() => {
    let filtered = events

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(e => e.category === selectedCategory)
    }

    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [events, selectedCategory])

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
          <LiquidGlass intensity="light">
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                          : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:shadow-lg'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2 bg-white/80 dark:bg-gray-700/80 rounded-2xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </LiquidGlass>
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
      <div className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2">
              {day}
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
                className={`aspect-square rounded-xl p-2 border-2 transition-all ${
                  dayEvents.length > 0
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 cursor-pointer'
                    : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-1">{day}</div>
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
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </LiquidGlass>
  )
}

function GridView({ events, onRSVP, rsvping }: { events: Event[]; onRSVP: (event: Event) => void; rsvping: string | null }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <LiquidGlass intensity="medium">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                  {event.category}
                </span>
                {event.ticketPrice ? (
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ${event.ticketPrice}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Free</span>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{event.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  {event.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  {event.location.address}
                </div>
                {event.capacity && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    {event.registered} / {event.capacity} registered
                  </div>
                )}
              </div>

              <button 
                onClick={() => (event.rsvpRequired || !event.rsvpRequired) ? onRSVP(event) : undefined}
                disabled={rsvping === event.id}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2 rounded-2xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {rsvping === event.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {event.rsvpRequired ? 'RSVPing...' : 'Registering...'}
                  </>
                ) : (
                  event.rsvpRequired ? 'RSVP Now' : 'Register Now'
                )}
              </button>
            </div>
          </LiquidGlass>
        </motion.div>
      ))}
    </div>
  )
}

function ListView({ events, onRSVP, rsvping }: { events: Event[]; onRSVP: (event: Event) => void; rsvping: string | null }) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ x: 5 }}
        >
          <LiquidGlass intensity="light">
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{event.name}</h3>
                  <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                    {event.category}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{event.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    <span>{event.date.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-600" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <span className="truncate">{event.location.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-600" />
                    <span>{event.registered} registered</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button 
                  onClick={() => onRSVP(event)}
                  disabled={rsvping === event.id}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {rsvping === event.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {event.rsvpRequired ? 'RSVPing...' : 'Registering...'}
                    </>
                  ) : (
                    event.rsvpRequired ? 'RSVP Now' : 'Register Now'
                  )}
                </button>
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

