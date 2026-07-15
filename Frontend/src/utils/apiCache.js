/**
 * API Response Cache Utility
 * Supports Stale-While-Revalidate (SWR) pattern:
 *   - getStale()  → returns data even if TTL expired (for instant display)
 *   - isExpired() → checks if entry exists but is past TTL
 *   - Services use these to show stale data instantly + background refresh silently
 */

class ApiCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached data only if still valid (within TTL)
   * Returns null if missing or expired
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      // Don't delete — keep for getStale()
      return null;
    }

    return entry.data;
  }

  /**
   * Get cached data even if TTL has expired (for SWR instant display)
   * Returns null only if key was never set
   */
  getStale(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return entry.data;
  }

  /**
   * Check if a cache entry exists but its TTL has expired
   * Used by SWR to decide if background refresh is needed
   */
  isExpired(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() > entry.expiry;
  }

  /**
   * Store data in cache
   */
  set(key, data, ttlSeconds = 60) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries with a given prefix
   */
  invalidatePrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate only list-type cache entries (avoids deleting detail keys)
   * e.g. invalidateListKeys('user:bookings:') won't delete 'user:booking:abc123'
   */
  invalidateListKeys(exactPrefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(exactPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
  }
}

// Export singleton instance
export const apiCache = new ApiCache();
export default apiCache;
