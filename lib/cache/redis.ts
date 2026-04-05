/**
 * Redis Cache Service
 * 
 * Provides caching layer for improved performance
 * In production, would use actual Redis client
 */

export class CacheService {
  private cache: Map<string, { value: any; expires: number }> = new Map()

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (cached.expires < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return cached.value as T
  }

  /**
   * Set cached value
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    })
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }
}

// Singleton instance
let cacheService: CacheService | null = null

export function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService()
  }
  return cacheService
}

