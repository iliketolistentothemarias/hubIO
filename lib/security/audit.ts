/**
 * Security Audit Service
 * 
 * Logs security events and audit trails
 */

export interface AuditLog {
  id: string
  userId?: string
  action: string
  resource: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  success: boolean
  metadata?: Record<string, any>
  timestamp: Date
}

export class AuditService {
  private logs: AuditLog[] = []

  /**
   * Log audit event
   */
  log(event: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const auditLog: AuditLog = {
      ...event,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }

    this.logs.push(auditLog)

    // In production, would persist to database
    console.log('Audit log:', auditLog)
  }

  /**
   * Get audit logs
   */
  getLogs(filters?: {
    userId?: string
    action?: string
    resource?: string
    startDate?: Date
    endDate?: Date
  }): AuditLog[] {
    let filtered = [...this.logs]

    if (filters?.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId)
    }

    if (filters?.action) {
      filtered = filtered.filter(log => log.action === filters.action)
    }

    if (filters?.resource) {
      filtered = filtered.filter(log => log.resource === filters.resource)
    }

    if (filters?.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate!)
    }

    if (filters?.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate!)
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
}

// Singleton instance
let auditService: AuditService | null = null

export function getAuditService(): AuditService {
  if (!auditService) {
    auditService = new AuditService()
  }
  return auditService
}

