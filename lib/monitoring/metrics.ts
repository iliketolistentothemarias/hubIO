/**
 * Metrics Service
 * 
 * Collects and tracks application metrics
 */

export interface Metric {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, string>
}

export class MetricsService {
  private metrics: Metric[] = []

  /**
   * Record metric
   */
  record(name: string, value: number, unit: string = 'count', tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    }

    this.metrics.push(metric)

    // In production, would send to metrics service (Prometheus, DataDog, etc.)
  }

  /**
   * Increment counter
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.record(name, value, 'count', tags)
  }

  /**
   * Record timing
   */
  timing(name: string, duration: number, tags?: Record<string, string>): void {
    this.record(name, duration, 'ms', tags)
  }

  /**
   * Get metrics
   */
  getMetrics(filters?: { name?: string; startDate?: Date; endDate?: Date }): Metric[] {
    let filtered = [...this.metrics]

    if (filters?.name) {
      filtered = filtered.filter(m => m.name === filters.name)
    }

    if (filters?.startDate) {
      filtered = filtered.filter(m => m.timestamp >= filters.startDate!)
    }

    if (filters?.endDate) {
      filtered = filtered.filter(m => m.timestamp <= filters.endDate!)
    }

    return filtered
  }
}

// Singleton instance
let metricsService: MetricsService | null = null

export function getMetricsService(): MetricsService {
  if (!metricsService) {
    metricsService = new MetricsService()
  }
  return metricsService
}

