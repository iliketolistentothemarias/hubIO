/**
 * Yellow gradient + white heart for resources without a custom logo, unverified
 * entries, and specific directory names (always, even if an image URL exists).
 */

function norm(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/'/g, "'")
}

/** Explicit org names that should always use the yellow brand tile */
const ALWAYS_YELLOW_NAMES = new Set(
  [
    'Pittsburgh YMCA',
    'Pittsburgh Legal Aid Society',
    'Pittsburgh Community Services',
    'Pittsburgh Refugee and Immigrant Services',
    'Pittsburgh Senior Centers Network',
    'Pittsburgh Job Corps Center',
    'Pittsburgh Community Health Centers',
    'Pittsburgh Mercy Behavioral Health',
    'Pittsburgh Financial Empowerment Center',
    'Pittsburgh Public Schools - Adult Education',
    'Pittsburgh Animal Care and Control',
    "Pittsburgh Children's Hospital - Community Health",
    'Pittsburgh Urban League',
    'Resolve Crisis Services - Allegheny County',
    'Area Agency on Aging of Southwestern Pennsylvania',
    'Primary Care Health Services - Pittsburgh',
    'CareerLink Pittsburgh - Allegheny County',
    'Early Learning Resource Center - Region 5',
    "Women's Center & Shelter of Greater Pittsburgh",
    'Allegheny County Housing Authority',
  ].map(norm)
)

export function shouldUseYellowBrandResourceLogo(
  name: string,
  opts?: { image?: string | null; verified?: boolean }
): boolean {
  const n = norm(name)
  if (n && ALWAYS_YELLOW_NAMES.has(n)) return true
  if (opts?.verified === false) return true
  const img = opts?.image
  if (img == null || (typeof img === 'string' && !img.trim())) return true
  return false
}
