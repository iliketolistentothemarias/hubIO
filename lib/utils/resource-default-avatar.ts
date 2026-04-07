/**
 * Detect generic “default” avatars (pixel smiley, gravatar defaults, etc.) for resource logos
 * so we can show a branded placeholder instead.
 */

/** Skip loading these URLs entirely — they’re almost always generic faces / placeholders */
export function shouldSkipDefaultAvatarUrl(url: string): boolean {
  const t = url.trim().toLowerCase()
  if (!t) return false
  try {
    const u = new URL(t)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'gravatar.com' || host.endsWith('.gravatar.com')) {
      const d = (u.searchParams.get('d') || u.searchParams.get('default') || '').toLowerCase()
      if (
        ['retro', 'identicon', 'monsterid', 'wavatar', 'mp', 'blank', '404'].includes(d) ||
        d.includes('retro') ||
        d.includes('identicon')
      ) {
        return true
      }
    }

    if (host.includes('ui-avatars.com')) return true
    if (host.includes('robohash.org')) return true
    if (host.includes('avatar.vercel.sh')) return true
    if (host.includes('dicebear.com')) return true
  } catch {
    /* ignore */
  }

  if (/gravatar\.com\/avatar\/[a-f0-9]{32}\?[^\s]*\bd=retro\b/i.test(t)) return true
  if (/\bd=(retro|identicon|monsterid|wavatar|mp)\b/i.test(t)) return true

  return false
}

/**
 * Heuristic: small-ish bitmap that is mostly white/light with a small amount of near-black
 * (classic embedded “smiley” / default avatar tile). Avoids tainted canvas — returns false on error.
 */
export function bitmapLooksLikePixelSmileyOnWhite(img: HTMLImageElement): boolean {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w <= 0 || h <= 0) return false
  if (Math.max(w, h) > 256) return false

  let canvas: HTMLCanvasElement | null = null
  try {
    canvas = document.createElement('canvas')
    const sample = 32
    canvas.width = sample
    canvas.height = sample
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return false
    ctx.drawImage(img, 0, 0, sample, sample)
    const { data } = ctx.getImageData(0, 0, sample, sample)
    let light = 0
    let dark = 0
    let mid = 0
    const px = sample * sample
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 200) continue
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      if (lum > 0.9) light++
      else if (lum < 0.22) dark++
      else mid++
    }
    const lightR = light / px
    const darkR = dark / px
    const midR = mid / px
    return lightR > 0.62 && darkR > 0.025 && darkR < 0.32 && midR < 0.28
  } catch {
    return false
  } finally {
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}
