/**
 * API Middleware Utilities
 * 
 * Request validation and authentication middleware for API routes.
 */

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { ValidationError } from './error-handler'
import { ValidationResult } from '@/lib/types'

/**
 * Validate request body
 * 
 * @param request - Next.js request object
 * @returns Parsed JSON body
 * @throws ValidationError if body is invalid
 */
export async function validateRequest<T = any>(
  request: NextRequest
): Promise<T> {
  try {
    const body = await request.json()
    return body as T
  } catch (error) {
    throw new ValidationError('Invalid request body')
  }
}

/**
 * Require authentication and return user
 * Wrapper around requireAuth with better error handling
 * 
 * @returns Authenticated user
 * @throws AuthenticationError if not authenticated
 */
export async function requireAuthenticatedUser() {
  try {
    return await requireAuth()
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw new (await import('./error-handler')).AuthenticationError()
    }
    throw error
  }
}

/**
 * Require specific role
 * 
 * @param allowedRoles - Array of allowed roles
 * @returns Authenticated user with required role
 * @throws AuthorizationError if user doesn't have required role
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<{ id: string; role: string; [key: string]: any }> {
  const user = await requireAuthenticatedUser()
  
  if (!allowedRoles.includes(user.role)) {
    throw new (await import('./error-handler')).AuthorizationError(
      `This action requires one of the following roles: ${allowedRoles.join(', ')}`
    )
  }

  return user
}

/**
 * Require admin role
 * 
 * @returns Authenticated admin user
 * @throws AuthorizationError if user is not admin
 */
export async function requireAdmin() {
  return requireRole(['admin'])
}

/**
 * Validate request with custom validator function
 * 
 * @param request - Next.js request object
 * @param validator - Validation function
 * @returns Validated and parsed body
 * @throws ValidationError if validation fails
 */
export async function validateRequestWith<T>(
  request: NextRequest,
  validator: (data: unknown) => ValidationResult
): Promise<T> {
  const body = await validateRequest<T>(request)
  const validation = validator(body)

  if (!validation.valid) {
    throw new ValidationError(
      'Validation failed',
      validation.errors
    )
  }

  return body
}

/**
 * Get query parameters from request
 * 
 * @param request - Next.js request object
 * @returns URLSearchParams object
 */
export function getQueryParams(request: NextRequest): URLSearchParams {
  return new URL(request.url).searchParams
}

/**
 * Get pagination parameters from query
 * 
 * @param request - Next.js request object
 * @returns Pagination parameters
 */
export function getPaginationParams(request: NextRequest): {
  page: number
  pageSize: number
} {
  const params = getQueryParams(request)
  const page = Math.max(1, parseInt(params.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(params.get('pageSize') || '20', 10)))

  return { page, pageSize }
}

