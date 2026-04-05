import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseUrl, DEFAULT_SUPABASE_ANON_KEY } from './url'

const supabaseUrl = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})
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
      resource_submissions: {
        Row: {
          id: string
          name: string
          category: string
          description: string
          address: string
          phone: string
          email: string
          website: string | null
          tags: string[]
          hours: string | null
          services: string[]
          languages: string[]
          accessibility: string[]
          submitted_by: string | null
          status: string
          rejection_reason: string | null
          admin_notes: string | null
          processed_by: string | null
          processed_at: string | null
          resource_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['resource_submissions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['resource_submissions']['Row']>
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

