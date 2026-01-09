/**
 * Validation Utilities
 * 
 * Provides validation functions for forms, data, and user input.
 * Ensures data integrity and security throughout the application.
 */

import { FormErrors, ValidationResult } from '@/lib/types'

/**
 * Email Validation
 * 
 * @param email - Email address to validate
 * @returns boolean
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Phone Number Validation
 * 
 * @param phone - Phone number to validate
 * @returns boolean
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  // Check if it's 10 or 11 digits
  return digits.length === 10 || digits.length === 11
}

/**
 * URL Validation
 * 
 * @param url - URL to validate
 * @returns boolean
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Required Field Validation
 * 
 * @param value - Value to check
 * @param fieldName - Name of the field (for error message)
 * @returns ValidationResult
 */
export function validateRequired(value: any, fieldName: string): ValidationResult {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      valid: false,
      errors: { [fieldName]: `${fieldName} is required` },
    }
  }
  return { valid: true, errors: {} }
}

/**
 * Validate Resource Submission
 * 
 * @param data - Resource data to validate
 * @returns ValidationResult
 */
export function validateResource(data: any): ValidationResult {
  const errors: FormErrors = {}

  // Name validation
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Organization name is required'
  }

  // Category validation
  if (!data.category) {
    errors.category = 'Category is required'
  }

  // Description validation
  if (!data.description || data.description.trim() === '') {
    errors.description = 'Description is required'
  } else if (data.description.length < 50) {
    errors.description = 'Description must be at least 50 characters'
  }

  // Address validation
  if (!data.address || data.address.trim() === '') {
    errors.address = 'Address is required'
  }

  // Phone validation
  if (!data.phone) {
    errors.phone = 'Phone number is required'
  } else if (!isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number'
  }

  // Email validation
  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  // Website validation (optional but must be valid if provided)
  if (data.website && !isValidUrl(data.website)) {
    errors.website = 'Please enter a valid website URL'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate Fundraising Campaign
 * 
 * @param data - Campaign data to validate
 * @returns ValidationResult
 */
export function validateCampaign(data: any): ValidationResult {
  const errors: FormErrors = {}

  // Title validation
  if (!data.title || data.title.trim() === '') {
    errors.title = 'Campaign title is required'
  }

  // Description validation
  if (!data.description || data.description.trim() === '') {
    errors.description = 'Description is required'
  } else if (data.description.length < 100) {
    errors.description = 'Description must be at least 100 characters'
  }

  // Goal validation
  if (!data.goal || data.goal <= 0) {
    errors.goal = 'Fundraising goal must be greater than 0'
  } else if (data.goal < 100) {
    errors.goal = 'Minimum fundraising goal is $100'
  }

  // End date validation
  if (!data.endDate) {
    errors.endDate = 'End date is required'
  } else {
    const endDate = new Date(data.endDate)
    const today = new Date()
    if (endDate <= today) {
      errors.endDate = 'End date must be in the future'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate Event Submission
 * 
 * @param data - Event data to validate
 * @returns ValidationResult
 */
export function validateEvent(data: any): ValidationResult {
  const errors: FormErrors = {}

  // Name validation
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Event name is required'
  }

  // Description validation
  if (!data.description || data.description.trim() === '') {
    errors.description = 'Description is required'
  }

  // Date validation
  if (!data.date) {
    errors.date = 'Event date is required'
  } else {
    const eventDate = new Date(data.date)
    const today = new Date()
    if (eventDate < today) {
      errors.date = 'Event date cannot be in the past'
    }
  }

  // Location validation
  if (!data.location || !data.location.address) {
    errors.location = 'Event location is required'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Sanitize User Input
 * 
 * Removes potentially dangerous characters and scripts
 * 
 * @param input - User input to sanitize
 * @returns string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
}

/**
 * Validate Password Strength
 * 
 * @param password - Password to validate
 * @returns ValidationResult
 */
export function validatePassword(password: string): ValidationResult {
  const errors: FormErrors = {}

  if (!password) {
    errors.password = 'Password is required'
    return { valid: false, errors }
  }

  if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  if (!/[A-Z]/.test(password)) {
    errors.password = 'Password must contain at least one uppercase letter'
  }

  if (!/[a-z]/.test(password)) {
    errors.password = 'Password must contain at least one lowercase letter'
  }

  if (!/[0-9]/.test(password)) {
    errors.password = 'Password must contain at least one number'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

