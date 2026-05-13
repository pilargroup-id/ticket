/**
 * Simple in-memory cache for page data to improve user experience
 * during navigation between pages.
 */

const cacheStore = new Map()

/**
 * Save data to cache
 * @param {string} key - Unique key for the data (e.g., 'my-tickets', 'tickets-overview')
 * @param {any} data - The data to cache
 */
export function setCache(key, data) {
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
  })
}

/**
 * Get data from cache
 * @param {string} key - Unique key for the data
 * @param {number} maxAge - Maximum age of cache in milliseconds (default 5 minutes)
 * @returns {any|null} - Cached data or null if not found or expired
 */
export function getCache(key, maxAge = 300000) {
  const cached = cacheStore.get(key)
  if (!cached) return null

  const isExpired = Date.now() - cached.timestamp > maxAge
  if (isExpired) {
    cacheStore.delete(key)
    return null
  }

  return cached.data
}

/**
 * Remove specific cache or clear all
 * @param {string} [key] - Key to remove. If omitted, clears all cache.
 */
export function clearCache(key) {
  if (key) {
    cacheStore.delete(key)
  } else {
    cacheStore.clear()
  }
}
