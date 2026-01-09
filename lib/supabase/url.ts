const DEFAULT_SUPABASE_URL = 'https://jciuryxrybjixneyaxea.supabase.co'

export function resolveSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || rawUrl.trim().length === 0) {
    return DEFAULT_SUPABASE_URL
  }

  const trimmed = rawUrl.trim()

  // If it's already a valid Supabase URL, use it
  if (/^https?:\/\/[a-z0-9]{22}\.supabase\.co/i.test(trimmed)) {
    return trimmed
  }

  // If the user only provided the project ref (or typo without supabase domain)
  const refMatch = trimmed.match(/[a-z0-9]{22}/i)
  if (refMatch) {
    return `https://${refMatch[0].toLowerCase()}.supabase.co`
  }

  try {
    // Validate it's at least a proper URL (custom domain)
    const parsed = new URL(trimmed)
    if (!parsed.protocol.startsWith('http')) {
      throw new Error('Invalid protocol')
    }
    return trimmed
  } catch {
    console.warn(
      `[Supabase] Invalid NEXT_PUBLIC_SUPABASE_URL "${trimmed}". Falling back to default project URL.`
    )
    return DEFAULT_SUPABASE_URL
  }
}

export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjaXVyeXhyeWJqaXhuZXlheGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjE4MDAsImV4cCI6MjA4MDE5NzgwMH0.rgnu34jJlhA6IvSocL6tKahVIGSKvYbfQX8wE8n9PvU'

