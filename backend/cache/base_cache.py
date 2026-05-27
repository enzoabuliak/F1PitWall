from abc import ABC, abstractmethod
from typing import Any, Optional


class BaseCache(ABC):
    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        ...

    @abstractmethod
    async def set(self, key: str, value: Any, ttl: int) -> None:
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        ...
