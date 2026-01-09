'use client'

import { createContext, useContext, ReactNode, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Resource, Event } from '@/lib/types'
import { allResources as fallbackResources } from '@/data/resources'
import { fundraisingCampaigns as fallbackCampaigns } from '@/data/fundraising-campaigns'
import { events as fallbackEvents } from '@/data/events'

interface DataContextType {
  resources: Resource[]
  events: any[]
  campaigns: any[]
  isLoading: boolean
}

const DataContext = createContext<DataContextType>({
  resources: [],
  events: [],
  campaigns: [],
  isLoading: true,
})

export function DataProvider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState<Resource[]>(fallbackResources)
  const [events, setEvents] = useState<any[]>(fallbackEvents)
  const [campaigns, setCampaigns] = useState<any[]>(fallbackCampaigns)
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
        const [eventsRes, campaignsRes] = await Promise.allSettled([
          supabase.from('events').select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from('fundraising_campaigns').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(50),
        ])

        await fetchResources()

        // Process events
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data && eventsRes.value.data.length > 0) {
          setEvents(eventsRes.value.data)
        } else {
          setEvents(fallbackEvents)
        }

        // Process campaigns
        if (campaignsRes.status === 'fulfilled' && campaignsRes.value.data && campaignsRes.value.data.length > 0) {
          setCampaigns(campaignsRes.value.data)
        } else {
          setCampaigns(fallbackCampaigns)
        }

        // Process volunteers
        if (volunteersRes.status === 'fulfilled' && volunteersRes.value.data && volunteersRes.value.data.length > 0) {
          setVolunteers(volunteersRes.value.data)
        } else {
          setVolunteers(fallbackVolunteers)
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
    <DataContext.Provider value={{ resources, events, campaigns, isLoading }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)

