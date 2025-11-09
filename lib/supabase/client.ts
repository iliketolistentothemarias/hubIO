import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qyiqvodabfsovjjgjdxs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aXF2b2RhYmZzb3ZqamdqZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzUxMzksImV4cCI6MjA3ODIxMTEzOX0.YQ7tT-q1dk_krROobItrn7sxVmIxut7VGNR7WaonFEg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table types
export interface Database {
  public: {
    Tables: {
      resources: {
        Row: {
          id: string
          name: string
          category: string
          description: string
          address: string
          location: any
          phone: string
          email: string
          website: string
          tags: string[]
          featured: boolean
          verified: boolean
          rating?: number
          review_count?: number
          hours?: string
          services?: string[]
          capacity?: number
          languages?: string[]
          accessibility?: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['resources']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['resources']['Row']>
      }
      events: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          date: string
          time: string
          location: any
          organizer: string
          organizer_id: string
          capacity?: number
          registered: number
          rsvp_required: boolean
          tags: string[]
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['events']['Row']>
      }
      fundraising_campaigns: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          goal: number
          raised: number
          donors: number
          organizer?: string
          organizer_id?: string
          location?: any
          deadline?: string
          status: string
          tags?: string[]
          created_at: string
          updated_at?: string
        }
        Insert: Omit<Database['public']['Tables']['fundraising_campaigns']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['fundraising_campaigns']['Row']>
      }
      volunteer_opportunities: {
        Row: {
          id: string
          title: string
          description: string
          organization: string
          organization_id: string
          category: string
          location?: any
          skills_required?: string[]
          time_commitment?: string
          age_requirement?: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['volunteer_opportunities']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['volunteer_opportunities']['Row']>
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          avatar?: string
          karma: number
          created_at: string
          last_active_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'last_active_at'>
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
    }
  }
}

