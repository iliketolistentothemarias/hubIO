/**
 * Accounts removed from the product UI (e.g. deleted from public.users but still in auth.users).
 * Match primarily on display name; optional REMOVED_AUTH_USER_IDS env (server) for UUIDs.
 */

export function normalizeAccountDisplayName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** Normalized full names — keep in sync with intentional removals */
const REMOVED_NAMES = new Set(
  ['aarav shah', 'ameya parnerkar', 'ameya partnerkar'].map((s) => normalizeAccountDisplayName(s))
)

export function isRemovedAccountProfile(profile: {
  name?: string | null
  email?: string | null
}): boolean {
  const n = normalizeAccountDisplayName(profile.name || '')
  if (n && REMOVED_NAMES.has(n)) return true
  return false
}

export function parseRemovedAuthUserIdsFromEnv(): string[] {
  const raw = process.env.REMOVED_AUTH_USER_IDS
  if (!raw?.trim()) return []
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function isRemovedAccountId(userId: string | null | undefined, extraIds: string[]): boolean {
  if (!userId) return false
  return extraIds.includes(userId)
}
