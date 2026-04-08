/**
 * Yellow gradient + white heart only for specific directory org names (see list below).
 * All other resources use normal logo URLs and the default tan placeholder when needed.
 */

function norm(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/'/g, "'")
}

/** Empty: real org logos load from website (Clearbit/favicon); tan heart is the default placeholder. */
const YELLOW_HEART_RESOURCE_NAMES = new Set<string>()

export function shouldUseYellowBrandResourceLogo(name: string): boolean {
  const n = norm(name)
  return Boolean(n && YELLOW_HEART_RESOURCE_NAMES.has(n))
}
