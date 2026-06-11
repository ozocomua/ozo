/**
 * In-memory cache with TTL (time-to-live).
 *
 * Uses a module-level Map so cache entries persist between requests
 * on the same Node.js / PM2 instance.
 *
 * Cities rarely change   → 24-hour TTL
 * Warehouses rarely change → 6-hour TTL
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

/**
 * Returns cached data if it exists and has not expired.
 * Otherwise calls `fetcher()`, stores the result, and returns it.
 *
 * @param key      Unique cache key
 * @param ttlMs    Time-to-live in milliseconds
 * @param fetcher  Async function that produces the data when cache misses
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = store.get(key)

  if (existing && existing.expiresAt > Date.now()) {
    const age = ((Date.now() - (existing.expiresAt - ttlMs)) / 1000).toFixed(0)
    console.log(`[cache] HIT  ${key} (age: ${age}s)`)
    return existing.data as T
  }

  console.log(`[cache] MISS ${key}`)
  const data = await fetcher()
  store.set(key, { data, expiresAt: Date.now() + ttlMs })
  return data
}

/**
 * Remove entries whose key contains `pattern` (substring match).
 * If no pattern is provided, clears the entire cache.
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    const count = store.size
    store.clear()
    console.log(`[cache] CLEARED all ${count} entries`)
    return
  }

  let removed = 0
  for (const key of store.keys()) {
    if (key.includes(pattern)) {
      store.delete(key)
      removed++
    }
  }
  console.log(`[cache] CLEARED ${removed} entries matching "${pattern}"`)
}
