/**
 * Runs before `npm run dev`. Warns if Supabase env is incomplete so live messaging works for all users.
 * Exit code always 0 — never blocks the dev server.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const envLocal = path.join(root, '.env.local')

function readEnvFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}

function valueForKey(raw, key) {
  const m = new RegExp(`^${key}=(.*)$`, 'm').exec(raw)
  if (!m) return ''
  return m[1].trim().replace(/^["']|["']$/g, '')
}

const raw = readEnvFile(envLocal)
const url = valueForKey(raw, 'NEXT_PUBLIC_SUPABASE_URL')
const anon = valueForKey(raw, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
const service = valueForKey(raw, 'SUPABASE_SERVICE_ROLE_KEY')

const issues = []
if (!fs.existsSync(envLocal)) issues.push('Missing .env.local — copy .env.example to .env.local and fill values.')
if (!url || url.length < 10) issues.push('NEXT_PUBLIC_SUPABASE_URL is empty or invalid.')
if (!anon || anon.length < 20) issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is empty or invalid.')
if (!service || service.length < 20) {
  issues.push(
    'SUPABASE_SERVICE_ROLE_KEY is missing — live chat will not push to every user in real time (copy from Supabase Dashboard → Settings → API).'
  )
}

if (issues.length) {
  console.warn('\n\x1b[33m━━ hubIO env ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m')
  for (const line of issues) console.warn(`\x1b[33m⚠\x1b[0m  ${line}`)
  console.warn('\x1b[33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n')
}
