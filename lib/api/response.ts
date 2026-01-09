/**
 * API Response Utilities
 * 
 * Standardized response helpers for consistent API responses across all routes.
 * Ensures uniform error handling and success response formats.
 */

import { NextResponse } from 'next/server'
import { ApiResponse, ValidationResult } from '@/lib/types'

/**
 * Create a success response
 * 
 * @param data - Response data
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success format
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  }

  return NextResponse.json(response, { status })
}

/**
 * Create an error response
 * 
 * @param error - Error message
 * @param status - HTTP status code (default: 500)
 * @param details - Optional error details
 * @returns NextResponse with error format
 */
export function errorResponse(
  error: string,
  status: number = 500,
  details?: any
): NextResponse<ApiResponse<never>> {
  const response: ApiResponse<never> = {
    success: false,
    error,
    ...(details && { details }),
  }

  return NextResponse.json(response, { status })
}

/**
 * Create a validation error response
 * 
 * @param validation - Validation result with errors
 * @param message - Optional custom message
 * @returns NextResponse with validation errors
 */
export function validationErrorResponse(
  validation: ValidationResult,
  message?: string
): NextResponse<ApiResponse<never>> {
  const response: ApiResponse<never> = {
    success: false,
    error: message || 'Validation failed. Please check the form fields.',
    errors: validation.errors,
  }

  return NextResponse.json(response, { status: 400 })
}

/**
 * Create an authentication error response
 * 
 * @param message - Optional custom message
 * @returns NextResponse with auth error
 */
export function authErrorResponse(
  message: string = 'Authentication required'
): NextResponse<ApiResponse<never>> {
  return errorResponse(message, 401)
}

/**
 * Create a forbidden error response
 * 
 * @param message - Optional custom message
 * @returns NextResponse with forbidden error
 */
export function forbiddenResponse(
  message: string = 'Insufficient permissions'
): NextResponse<ApiResponse<never>> {
  return errorResponse(message, 403)
}

/**
 * Create a not found error response
 * 
 * @param message - Optional custom message
 * @returns NextResponse with not found error
 */
export function notFoundResponse(
  message: string = 'Resource not found'
): NextResponse<ApiResponse<never>> {
  return errorResponse(message, 404)
}

/**
 * Create a created response (for POST requests)
 * 
 * @param data - Created resource data
 * @param message - Optional success message
 * @returns NextResponse with created status
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return successResponse(data, message, 201)
}

