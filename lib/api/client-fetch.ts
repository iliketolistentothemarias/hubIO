import { supabase } from '@/lib/supabase/client'

/**
 * Browser fetch to Next API routes with the Supabase JWT attached.
 * Session is stored in localStorage, so server routes cannot read it from cookies alone.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = new Headers(init?.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? 'same-origin',
  })
}
