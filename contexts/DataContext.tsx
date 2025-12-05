'use client'

import { createContext, useContext, ReactNode, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Resource, Event } from '@/lib/types'
import { allResources as fallbackResources } from '@/data/resources'

interface DataContextType {
  resources: Resource[]
  events: any[]
  campaigns: any[]
  volunteers: any[]
  posts: any[]
  isLoading: boolean
}

const DataContext = createContext<DataContextType>({
  resources: [],
  events: [],
  campaigns: [],
  volunteers: [],
  posts: [],
  isLoading: true,
})

export function DataProvider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState<Resource[]>(fallbackResources)
  const [events, setEvents] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const mapResources = useCallback((rows: any[]) => {
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name || '',
      category: r.category || '',
      description: r.description || '',
      address: r.address || '',
      location: r.location || { lat: 40.4406, lng: -79.9961, address: r.address || '', city: '', state: 'PA', zipCode: '' },
      phone: r.phone || '',
      email: r.email || '',
      website: r.website || undefined,
      tags: r.tags || [],
      featured: r.featured || false,
      verified: r.verified || false,
      rating: r.rating ? Number(r.rating) : undefined,
      reviewCount: r.review_count || 0,
      hours: r.hours || undefined,
      services: r.services || [],
      capacity: r.capacity || undefined,
      languages: r.languages || [],
      accessibility: r.accessibility || [],
      createdAt: r.created_at ? new Date(r.created_at) : new Date(),
      updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
    }))
  }, [])

  const fetchResources = useCallback(async () => {
    try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('verified', true)
      .order('created_at', { ascending: false })

      if (data && !error) {
        if (data.length > 0) {
          setResources(mapResources(data))
        } else {
          setResources((prev) => (prev.length > 0 ? prev : fallbackResources))
        }
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    }
  }, [mapResources])

  useEffect(() => {
    // Fetch ALL data immediately and in parallel
    const fetchAllData = async () => {
      try {
        const [eventsRes, campaignsRes, volunteersRes, postsRes] = await Promise.allSettled([
          supabase.from('events').select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from('fundraising_campaigns').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(50),
          supabase.from('volunteer_opportunities').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(50),
          supabase.from('posts').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(50),
        ])

        await fetchResources()

        // Process events
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data) {
          setEvents(eventsRes.value.data)
        }

        // Process campaigns
        if (campaignsRes.status === 'fulfilled' && campaignsRes.value.data) {
          setCampaigns(campaignsRes.value.data)
        }

        // Process volunteers
        if (volunteersRes.status === 'fulfilled' && volunteersRes.value.data) {
          setVolunteers(volunteersRes.value.data)
        }

        // Process posts
        if (postsRes.status === 'fulfilled' && postsRes.value.data) {
          setPosts(postsRes.value.data)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllData()
  }, [fetchResources])

  useEffect(() => {
    const channel = supabase
      .channel('resources-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resources',
        },
        (payload) => {
          console.log('Resource change detected:', payload)
          fetchResources()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchResources])

  return (
    <DataContext.Provider value={{ resources, events, campaigns, volunteers, posts, isLoading }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)

