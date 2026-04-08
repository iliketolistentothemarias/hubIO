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
        ['retro', 'identicon', 'monsterid', 'wavatar', 'mp', 'blank', '404', 'mm', 'mystery'].includes(d) ||
        d.includes('retro') ||
        d.includes('identicon')
      ) {
        return true
      }
      if (u.searchParams.get('forcedefault') === 'y' || u.searchParams.get('f') === 'y') return true
    }

    if (host.includes('ui-avatars.com')) return true
    if (host.includes('robohash.org')) return true
    if (host.includes('avatar.vercel.sh')) return true
    if (host.includes('dicebear.com')) return true
    if (t.includes('wp.com/avatar') || t.includes('wordpress.com/avatar')) return true
    if (t.includes('/wp-includes/images/avatar') || t.includes('default-avatar')) return true
    if (t.includes('s.w.org/images/core/emoji')) return true
  } catch {
    /* ignore */
  }

  if (/gravatar\.com\/avatar\/[a-f0-9]{32}\?[^\s]*\bd=retro\b/i.test(t)) return true
  if (/\bd=(retro|identicon|monsterid|wavatar|mp|mm|mystery)\b/i.test(t)) return true

  return false
}

/** Gravatar /avatar URLs often return the pixel “retro” (or similar) default; last-resort if canvas can’t classify */
export function urlSuggestsGravatarDefaultRisk(url: string): boolean {
  const t = url.trim().toLowerCase()
  return t.includes('gravatar.com/avatar')
}

type PlaceholderBitmapMode = 'strict' | 'loose'

/**
 * Heuristic: bitmap that is mostly white / light gray with sparse near-black pixels
 * (pixel “smiley” / default avatar on white or off-white). Returns false on tainted canvas / error.
 */
function bitmapPlaceholderHeuristic(img: HTMLImageElement, mode: PlaceholderBitmapMode): boolean {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w <= 0 || h <= 0) return false
  const maxSide = Math.max(w, h)
  if (mode === 'strict' && maxSide > 256) return false
  if (mode === 'loose' && maxSide > 200) return false

  const sample = mode === 'strict' ? 32 : 48
  let canvas: HTMLCanvasElement | null = null
  try {
    canvas = document.createElement('canvas')
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
    const lightLum = mode === 'strict' ? 0.9 : 0.82
    const darkLum = mode === 'strict' ? 0.22 : 0.32
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 200) continue
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      if (lum > lightLum) light++
      else if (lum < darkLum) dark++
      else mid++
    }
    const lightR = light / px
    const darkR = dark / px
    const midR = mid / px
    if (mode === 'strict') {
      return lightR > 0.62 && darkR > 0.025 && darkR < 0.32 && midR < 0.28
    }
    // loose: light gray bg + pixel face (retro / mystery man style)
    return lightR > 0.48 && darkR > 0.012 && darkR < 0.42 && midR < 0.42
  } catch {
    return false
  } finally {
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}

export function bitmapLooksLikePixelSmileyOnWhite(img: HTMLImageElement): boolean {
  if (bitmapPlaceholderHeuristic(img, 'strict')) return true
  const maxSide = Math.max(img.naturalWidth, img.naturalHeight)
  if (maxSide <= 160) {
    return bitmapPlaceholderHeuristic(img, 'loose')
  }
  return false
}
