/**
 * API Error Handler
 * 
 * Centralized error handling utilities for consistent error processing
 * across all API routes.
 */

import { errorResponse, authErrorResponse } from './response'

/**
 * Error types for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 401, 'AUTH_REQUIRED', details)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super(message, 403, 'FORBIDDEN', details)
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public errors?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR', errors)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

/**
 * Check if error is authentication-related
 * 
 * @param error - Error to check
 * @returns boolean
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AuthenticationError) return true
  if (error instanceof Error) {
    return (
      error.message === 'Authentication required' ||
      error.message.includes('auth') ||
      error.message.includes('session')
    )
  }
  return false
}

/**
 * Check if error is validation-related
 * 
 * @param error - Error to check
 * @returns boolean
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof ValidationError
}

/**
 * Handle API errors with proper response formatting
 * 
 * @param error - Error to handle
 * @param defaultMessage - Default error message if error is unknown
 * @returns NextResponse with error
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = 'An error occurred'
) {
  console.error('API Error:', error)

  // Handle custom API errors
  if (error instanceof ApiError) {
    return errorResponse(
      error.message,
      error.statusCode,
      error.details
    )
  }

  // Handle authentication errors
  if (isAuthError(error)) {
    return authErrorResponse(
      error instanceof Error ? error.message : 'Authentication required'
    )
  }

  // Handle validation errors
  if (isValidationError(error)) {
    const validationError = error as ValidationError
    return errorResponse(
      validationError.message,
      400,
      validationError.errors
    )
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return errorResponse(
      error.message || defaultMessage,
      500
    )
  }

  // Handle unknown errors
  return errorResponse(
    defaultMessage,
    500
  )
}

/**
 * Wrap async API handler with error handling
 * 
 * @param handler - Async API handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<any>
) {
  return async (...args: T) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

