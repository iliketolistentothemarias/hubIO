/**
 * Build logo image URLs for a resource: optional stored image, then website-derived brand assets.
 * Uses Clearbit Logo API (by domain) with Google favicon as fallback — no scraping required.
 */
export function hostnameFromWebsite(website: unknown): string | null {
  if (website == null || typeof website !== 'string') return null
  const trimmed = website.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return url.hostname.replace(/^www\./i, '')
  } catch {
    return null
  }
}

/** Use in <a href> so values without a scheme still open correctly */
export function websiteHref(website: string | null | undefined): string {
  if (website == null || typeof website !== 'string') return '#'
  const t = website.trim()
  if (!t) return '#'
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

export function resourceLogoUrlCandidates(image: unknown, website: unknown): string[] {
  const urls: string[] = []
  if (typeof image === 'string' && image.trim()) {
    urls.push(image.trim())
  }
  const host = hostnameFromWebsite(website)
  if (host) {
    urls.push(`https://logo.clearbit.com/${host}`)
    urls.push(`https://icons.duckduckgo.com/ip3/${host}.ico`)
    urls.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`)
  }
  return urls
}
