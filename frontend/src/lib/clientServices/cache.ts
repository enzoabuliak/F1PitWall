type Entry = { value: unknown; expires: number };

const store = new Map<string, Entry>();

interface MemoOptions<T> {
  /** Return false to skip caching an empty/failed result so the next call retries. */
  shouldCache?: (value: T) => boolean;
}

export async function memo<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
  options?: MemoOptions<T>,
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key);
  if (entry && entry.expires > now) return entry.value as T;
  const value = await fn();
  const shouldCache = options?.shouldCache ?? (() => true);
  if (shouldCache(value)) {
    store.set(key, { value, expires: now + ttlSeconds * 1000 });
  }
  return value;
}

export function invalidate(prefix: string): void {
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function nonEmptyArray<T>(arr: T[]): boolean {
  return Array.isArray(arr) && arr.length > 0;
}
