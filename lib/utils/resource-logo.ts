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
    const enc = encodeURIComponent(host)
    // Clearbit: large primary URL; ResourceHeroLogo adds srcSet 128/256 for DPR
    urls.push(`https://logo.clearbit.com/${host}?size=256`)
    // Unavatar aggregates favicons / logos; often sharper than a single favicon
    urls.push(`https://unavatar.io/${host}`)
    // Google s2: sz=256 is supported in practice for crisper icons than 16–32px favicons
    urls.push(`https://www.google.com/s2/favicons?domain=${enc}&sz=256`)
    urls.push(`https://www.google.com/s2/favicons?domain=${enc}&sz=128`)
    // Site-hosted icons are often high-res when they exist
    urls.push(`https://${host}/apple-touch-icon.png`)
    urls.push(`https://${host}/apple-touch-icon-precomposed.png`)
    urls.push(`https://${host}/favicon.ico`)
    urls.push(`https://icons.duckduckgo.com/ip3/${host}.ico`)
  }
  return urls
}
