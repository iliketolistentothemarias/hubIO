import { Location } from '@/lib/types'

const PITTSBURGH_CENTER = { lat: 40.4406, lng: -79.9961 }

export function parseAddress(address: string, coords?: { lat: number; lng: number }): Location {
  const parts = address.split(',')
  const finalCoords = coords ?? PITTSBURGH_CENTER
  if (parts.length >= 3) {
    const street = parts[0].trim()
    const city = parts[1].trim()
    const stateZip = parts[2].trim().split(/\s+/)
    const state = stateZip[0]
    const zipCode = stateZip[1] || ''
    return {
      lat: finalCoords.lat,
      lng: finalCoords.lng,
      address: street,
      city,
      state,
      zipCode,
    }
  }
  return {
    lat: finalCoords.lat,
    lng: finalCoords.lng,
    address: address.trim(),
    city: '',
    state: 'PA',
    zipCode: '',
  }
}

export function emailFromWebsite(website: string): string {
  try {
    const url = new URL(website.trim().match(/^https?:\/\//i) ? website.trim() : `https://${website.trim()}`)
    const host = url.hostname.replace(/^www\./i, '')
    return host ? `info@${host}` : 'contact@example.org'
  } catch {
    return 'contact@example.org'
  }
}

export function normWebsite(website: string): string {
  const t = website.trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}
