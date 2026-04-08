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

const YELLOW_HEART_RESOURCE_NAMES = new Set(
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

export function shouldUseYellowBrandResourceLogo(name: string): boolean {
  const n = norm(name)
  return Boolean(n && YELLOW_HEART_RESOURCE_NAMES.has(n))
}
