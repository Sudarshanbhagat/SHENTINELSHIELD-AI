from fastapi import HTTPException, Request
from functools import wraps
import redis
from app.core.config import settings
import time

# Initialize Redis client
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class RateLimitExceeded(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=429,
            detail="Rate limit exceeded. Please try again later."
        )

def rate_limit(max_requests: int = None, window_seconds: int = None):
    """Rate limiting middleware for endpoints"""
    max_req = max_requests or settings.RATE_LIMIT_REQUESTS
    window = window_seconds or settings.RATE_LIMIT_WINDOW_SECONDS
    
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            if not settings.RATE_LIMIT_ENABLED:
                return await func(request, *args, **kwargs)
            
            # Use IP address as the key
            client_ip = request.client.host if request.client else "unknown"
            key = f"rate_limit:{client_ip}"
            
            try:
                current = redis_client.incr(key)
                
                if current == 1:
                    redis_client.expire(key, window)
                
                if current > max_req:
                    raise RateLimitExceeded()
                
                return await func(request, *args, **kwargs)
            
            except redis.RedisError:
                # If Redis fails, allow the request (graceful degradation)
                return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator

def get_client_ip(request: Request) -> str:
    """Extract client IP from request"""
    if request.client:
        return request.client.host
    
    # Check X-Forwarded-For header (for proxied requests)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    return "unknown"

def cache_result(key: str, ttl: int = 3600):
    """Cache decorator for endpoints"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Check cache first
            try:
                cached = redis_client.get(key)
                if cached:
                    return cached
            except redis.RedisError:
                pass
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            try:
                redis_client.setex(key, ttl, str(result))
            except redis.RedisError:
                pass
            
            return result
        
        return wrapper
    return decorator
