type Entry = { value: unknown; expires: number };

const store = new Map<string, Entry>();

export async function memo<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = store.get(key);
  if (entry && entry.expires > now) return entry.value as T;
  const value = await fn();
  store.set(key, { value, expires: now + ttlSeconds * 1000 });
  return value;
}

export function invalidate(prefix: string): void {
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
