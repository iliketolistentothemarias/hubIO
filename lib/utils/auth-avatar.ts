/**
 * Profile image URL from Supabase Auth user_metadata (Google, GitHub, etc.).
 * Not persisted to public.users unless we copy it on signup / callback.
 */
export function oauthProfileImageUrl(meta: unknown): string | undefined {
  if (!meta || typeof meta !== 'object') return undefined
  const m = meta as Record<string, unknown>
  for (const key of ['avatar_url', 'picture', 'image'] as const) {
    const v = m[key]
    if (typeof v === 'string') {
      const t = v.trim()
      if (t) return t
    }
  }
  return undefined
}
