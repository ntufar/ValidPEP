// A simple in-memory cache for development purposes.
// This is a placeholder for a real cache implementation.

type CacheEntry = {
  value: unknown;
  expiresAt?: number;
};

const cache = new Map<string, CacheEntry>();

export interface CacheSetOptions {
  ttlSeconds?: number;
}

export const kv = {
  async get<T>(key: string): Promise<T | null> {
    const entry = cache.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      cache.delete(key);
      return null;
    }

    return entry.value as T;
  },

  async set<T>(key: string, value: T, options: CacheSetOptions = {}): Promise<void> {
    const expiresAt = options.ttlSeconds ? Date.now() + options.ttlSeconds * 1000 : undefined;
    cache.set(key, { value, expiresAt });
  },

  async delete(key: string): Promise<void> {
    cache.delete(key);
  },
};