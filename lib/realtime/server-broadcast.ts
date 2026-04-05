import { resolveSupabaseUrl } from '@/lib/supabase/url'

const CHAT_EVENT = 'new_message'
const INBOX_EVENT = 'inbox_message'

/**
 * Send Supabase Realtime broadcast messages via the HTTP REST API.
 * This is much faster than the WebSocket approach (no connection handshake needed).
 * Sends all messages in a single request.
 */
async function httpBroadcast(
  supabaseUrl: string,
  serviceRoleKey: string,
  messages: Array<{
    topic: string
    event: string
    payload: Record<string, unknown>
  }>
): Promise<void> {
  const response = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    body: JSON.stringify({ messages }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`HTTP broadcast failed: ${response.status} ${text}`)
  }
}

/**
 * Push Realtime broadcast events after a message row exists.
 * Uses HTTP REST API (instant) instead of WebSocket (slow).
 *
 * - `conversation:{id}` + new_message  → open ChatWindow (subscriber receives new message)
 * - `inbox-live:{userId}` + inbox_message → ConversationList preview for every participant
 *
 * All participant notifications are batched into a single HTTP request.
 */
export async function broadcastNewMessageAfterInsert(
  conversationId: string,
  messageId: string,
  participantUserIds: string[]
): Promise<void> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)

  if (!key) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[realtime] SUPABASE_SERVICE_ROLE_KEY not set — add it so all users receive live message broadcasts.'
      )
    }
    return
  }

  const unique = [...new Set(participantUserIds)]

  // Batch all broadcast messages into one HTTP request
  const messages = [
    // Notify the open ChatWindow for this conversation
    {
      topic: `conversation:${conversationId}`,
      event: CHAT_EVENT,
      payload: { id: messageId },
    },
    // Notify the inbox/ConversationList for each participant
    ...unique.map((userId) => ({
      topic: `inbox-live:${userId}`,
      event: INBOX_EVENT,
      payload: { conversationId, messageId },
    })),
  ]

  try {
    await httpBroadcast(url, key, messages)
  } catch (e) {
    console.warn('[realtime] HTTP broadcast failed:', e)
  }
}
