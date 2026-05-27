import asyncio
import time
from typing import Any, Dict, Optional, Tuple

from cache.base_cache import BaseCache


class MemoryCache(BaseCache):
    def __init__(self, cleanup_interval: float = 10.0):
        self._store: Dict[str, Tuple[Any, float]] = {}
        self._lock = asyncio.Lock()
        self._cleanup_interval = cleanup_interval

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    async def set(self, key: str, value: Any, ttl: int) -> None:
        async with self._lock:
            self._store[key] = (value, time.monotonic() + ttl)

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._store.pop(key, None)

    async def cleanup_loop(self) -> None:
        while True:
            await asyncio.sleep(self._cleanup_interval)
            now = time.monotonic()
            async with self._lock:
                expired = [k for k, (_, exp) in self._store.items() if now > exp]
                for k in expired:
                    del self._store[k]
