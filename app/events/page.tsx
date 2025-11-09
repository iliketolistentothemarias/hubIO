'use client'

/**
 * Events Page
 * 
 * Comprehensive events calendar and listing page with advanced filtering,
 * calendar view, and event management features.
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, Users, Filter, Grid, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import TabNavigation from '@/components/TabNavigation'
import LiquidGlass from '@/components/LiquidGlass'
import { Event } from '@/lib/types'

// Mock events data
const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Community Food Drive',
    description: 'Annual community food drive to support local families. Bring non-perishable items.',
    category: 'Community',
    date: new Date('2026-02-15'),
    time: '10:00 AM - 2:00 PM',
    location: {
      lat: 47.6097,
      lng: -122.3331,
      address: '123 Main Street',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
    },
    organizer: 'Community Food Bank',
    organizerId: 'org_1',
    registered: 45,
    rsvpRequired: true,
    tags: ['Food', 'Community', 'Volunteer'],
    status: 'upcoming',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: '2',
    name: 'Small Business Networking',
    description: 'Monthly networking event for local business owners. Connect, share resources, and grow together.',
    category: 'Business',
    date: new Date('2026-02-20'),
    time: '6:00 PM - 8:00 PM',
    location: {
      lat: 47.6145,
      lng: -122.3415,
      address: '456 Business Center',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98102',
    },
    organizer: 'Local Business Association',
    organizerId: 'org_2',
    registered: 23,
    rsvpRequired: true,
    ticketPrice: 15,
    tags: ['Business', 'Networking', 'Professional'],
    status: 'upcoming',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-05'),
  },
  {
    id: '3',
    name: 'Youth Art Workshop',
    description: 'Free art workshop for youth ages 12-18. All materials provided. No experience necessary.',
    category: 'Youth',
    date: new Date('2026-02-18'),
    time: '3:00 PM - 5:00 PM',
    location: {
      lat: 47.6062,
      lng: -122.3321,
      address: '789 Community Center',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98103',
    },
    organizer: 'Youth Empowerment Center',
    organizerId: 'org_3',
    registered: 18,
    capacity: 25,
    rsvpRequired: true,
    tags: ['Youth', 'Arts', 'Education'],
    status: 'upcoming',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-10'),
  },
]

const categories = ['All', 'Community', 'Business', 'Youth', 'Education', 'Health', 'Arts', 'Sports']

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const filteredEvents = useMemo(() => {
    let filtered = mockEvents

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(e => e.category === selectedCategory)
    }

    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [selectedCategory])

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
    { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: filteredEvents.length },
    { id: 'past', label: 'Past Events', icon: CalendarIcon },
    { id: 'my-events', label: 'My Events', icon: Users },
  ]

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
        <TabNavigation tabs={tabs} defaultTab="upcoming">
          {(activeTab) => (
            <div>
              {viewMode === 'calendar' ? (
                <CalendarView events={filteredEvents} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
              ) : viewMode === 'list' ? (
                <ListView events={filteredEvents} />
              ) : (
                <GridView events={filteredEvents} />
              )}
            </div>
          )}
        </TabNavigation>
      </div>
    </div>
  )
}

function CalendarView({ events, currentMonth, setCurrentMonth }: any) {
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

function GridView({ events }: { events: Event[] }) {
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

              <button className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2 rounded-2xl font-semibold hover:shadow-lg transition-all">
                {event.rsvpRequired ? 'RSVP Now' : 'Learn More'}
              </button>
            </div>
          </LiquidGlass>
        </motion.div>
      ))}
    </div>
  )
}

function ListView({ events }: { events: Event[] }) {
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
                <button className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all">
                  {event.rsvpRequired ? 'RSVP' : 'View'}
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

