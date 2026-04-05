/**
 * Logger Service
 * 
 * Centralized logging with different levels
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  metadata?: Record<string, any>
  error?: Error
}

export class Logger {
  /**
   * Log message
   */
  log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      metadata,
      error,
    }

    // In production, would send to logging service (Sentry, DataDog, etc.)
    if (level === LogLevel.ERROR) {
      console.error(message, metadata, error)
    } else if (level === LogLevel.WARN) {
      console.warn(message, metadata)
    } else {
      console.log(`[${level.toUpperCase()}]`, message, metadata)
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata)
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata)
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata)
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata, error)
  }
}

// Singleton instance
let logger: Logger | null = null

export function getLogger(): Logger {
  if (!logger) {
    logger = new Logger()
  }
  return logger
}

