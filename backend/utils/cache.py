"""
Cache utility for Vercel KV (Redis)
Note: Vercel KV Python SDK usage
"""

import os
import json
from typing import Any, Optional, Dict

# Vercel KV Python client
# Note: Vercel KV access via environment variables or SDK
# For now, using in-memory cache as fallback
KV_AVAILABLE = False

# Try to use Vercel KV if available
try:
    # Vercel KV is accessed via @vercel/kv package in Node.js
    # For Python, we might need to use Redis directly or wait for Python SDK
    # For now, use in-memory cache
    pass
except Exception:
    pass

# In-memory cache fallback
_memory_cache: Dict[str, tuple] = {}  # key -> (value, expiry_timestamp)


def get_cache(key: str) -> Optional[Any]:
    """
    Get value from cache
    
    Args:
        key: Cache key
    
    Returns:
        Cached value or None
    """
    if KV_AVAILABLE:
        try:
            value = kv.get(key)
            return json.loads(value) if value else None
        except Exception:
            return None
    else:
        # In-memory fallback
        import time
        if key in _memory_cache:
            value, expiry = _memory_cache[key]
            if expiry is None or time.time() < expiry:
                return value
            else:
                del _memory_cache[key]
        return None


def set_cache(key: str, value: Any, ttl_seconds: Optional[int] = None):
    """
    Set value in cache
    
    Args:
        key: Cache key
        value: Value to cache
        ttl_seconds: Time to live in seconds (None for no expiry)
    """
    if KV_AVAILABLE:
        try:
            kv.set(key, json.dumps(value), ex=ttl_seconds)
        except Exception as e:
            print(f'Warning: Failed to set cache: {e}')
    else:
        # In-memory fallback
        import time
        expiry = time.time() + ttl_seconds if ttl_seconds else None
        _memory_cache[key] = (value, expiry)

