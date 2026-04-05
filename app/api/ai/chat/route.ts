/**
 * AI Assistant Chat API Route
 * 
 * Handles conversational AI queries from users.
 * 
 * Endpoints:
 * - POST /api/ai/chat - Process user query and get AI response
 * 
 * In production, this would integrate with:
 * - OpenAI GPT API
 * - Anthropic Claude API
 * - Custom fine-tuned models
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAIAssistant } from '@/lib/ai/assistant'
import { getUserFromRequest } from '@/lib/auth/server-request'
import { ApiResponse, AIResponse } from '@/lib/types'

/**
 * POST /api/ai/chat
 * 
 * Process user query and return AI assistant response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }

    const user = await getUserFromRequest(request)

    const assistant = getAIAssistant()
    const response = await assistant.processQuery(query, user?.id)

    const apiResponse: ApiResponse<AIResponse> = {
      success: true,
      data: response,
    }

    return NextResponse.json(apiResponse)
  } catch (error) {
    console.error('Error processing AI query:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process query' },
      { status: 500 }
    )
  }
}

