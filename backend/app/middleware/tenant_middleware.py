"""
Tenant Middleware for Multi-Tenant Isolation
Validates tenant_id on every request and sets PostgreSQL RLS context
"""

import logging
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Callable

from backend.app.core.database import SessionLocal
from backend.app.models.models import User, Organization

logger = logging.getLogger(__name__)


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce tenant isolation.
    
    Responsibilities:
    1. Extract tenant_id from request context (JWT claim or header)
    2. Validate tenant_id against user's organization
    3. Set PostgreSQL RLS context for automatic row filtering
    4. Attach tenant info to request state for downstream use
    
    Security:
    - Prevents users from accessing other organization's data
    - Database-level RLS ensures no SQL injection bypasses
    - Works with JWT authentication for defense-in-depth
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> any:
        """
        Process request and enforce tenant isolation.
        
        Args:
            request: Incoming HTTP request
            call_next: Next middleware/route handler
            
        Returns:
            Response after processing
        """
        
        # Skip middleware for public endpoints
        if self._is_public_endpoint(request.url.path):
            return await call_next(request)
        
        db = SessionLocal()
        
        try:
            # Extract user from JWT (assumes JWT middleware runs before this)
            user_id = request.headers.get("X-User-ID")
            org_id = request.headers.get("X-Organization-ID")
            
            if not user_id or not org_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Missing authentication context"
                )
            
            # Validate user exists and belongs to organization
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                logger.warning(f"Tenant middleware: user {user_id} not found")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            
            # Verify organization matches
            if str(user.organization_id) != org_id:
                logger.warning(
                    f"Tenant middleware: user {user_id} attempted to access org {org_id} "
                    f"but belongs to {user.organization_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User does not belong to this organization"
                )
            
            # Verify organization is active
            org = db.query(Organization).filter(Organization.id == org_id).first()
            
            if not org or not org.is_active:
                logger.warning(f"Tenant middleware: organization {org_id} is inactive")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Organization is inactive"
                )
            
            # Set PostgreSQL RLS context for this connection
            await self._set_rls_context(db, org_id, user_id)
            
            # Attach tenant info to request state
            request.state.user_id = user_id
            request.state.organization_id = org_id
            request.state.organization = org
            request.state.user = user
            request.state.db = db
            
            # Log successful tenant validation
            logger.debug(
                f"Tenant middleware: validated user {user_id} for org {org_id}"
            )
            
        except HTTPException:
            db.close()
            raise
        except Exception as e:
            logger.error(f"Tenant middleware error: {e}")
            db.close()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
        
        # Process request
        response = await call_next(request)
        
        # Cleanup
        db.close()
        
        return response
    
    @staticmethod
    async def _set_rls_context(db: Session, org_id: str, user_id: str) -> None:
        """
        Set PostgreSQL Row-Level Security context.
        
        Executes: SET app.current_org_id = '{org_id}'
        
        This allows the database to automatically filter rows based on organization.
        Every SELECT, UPDATE, DELETE will include implicit organization_id filtering.
        
        Args:
            db: Database session
            org_id: Organization identifier
            user_id: User identifier
        """
        try:
            # Set RLS context in PostgreSQL session
            db.execute(text(f"SET app.current_org_id = '{org_id}'"))
            db.execute(text(f"SET app.current_user_id = '{user_id}'"))
            
            logger.debug(f"RLS context set: org_id={org_id}, user_id={user_id}")
        
        except Exception as e:
            logger.error(f"Failed to set RLS context: {e}")
            # Don't fail the request, but log the error
    
    @staticmethod
    def _is_public_endpoint(path: str) -> bool:
        """
        Check if endpoint is public (no tenant validation needed).
        
        Public endpoints:
        - /health - Health check
        - /auth/login - Login (no user yet)
        - /auth/signup - Signup (no user yet)
        - /docs - Swagger UI
        - /openapi.json - OpenAPI schema
        
        Args:
            path: Request path
            
        Returns:
            True if endpoint is public
        """
        public_paths = [
            "/health",
            "/api/v1/auth/login",
            "/api/v1/auth/signup",
            "/api/v1/auth/refresh",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/.well-known",  # ACME/SSL
        ]
        
        return any(path.startswith(p) for p in public_paths)


class RLSContextManager:
    """
    Helper class to manage RLS context for database operations.
    
    Usage:
        async with RLSContextManager(db, org_id) as ctx:
            # All queries use org_id filtering
            users = db.query(User).all()
    """
    
    def __init__(self, db: Session, org_id: str, user_id: str = None):
        self.db = db
        self.org_id = org_id
        self.user_id = user_id
    
    async def __aenter__(self):
        """Enter context and set RLS"""
        await TenantMiddleware._set_rls_context(self.db, self.org_id, self.user_id)
        return self.db
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit context (RLS context persists until connection closes)"""
        pass


class OrganizationValidator:
    """
    Utility class for validating organization access.
    
    Usage in endpoints:
        validator = OrganizationValidator()
        await validator.validate_org_access(user, requested_org_id, db)
    """
    
    @staticmethod
    async def validate_org_access(
        user: User,
        requested_org_id: str,
        db: Session
    ) -> Organization:
        """
        Validate that user has access to organization.
        
        Args:
            user: Current user
            requested_org_id: Requested organization ID
            db: Database session
            
        Returns:
            Organization object
            
        Raises:
            HTTPException: If access denied
        """
        # User must belong to requested org
        if str(user.organization_id) != requested_org_id:
            logger.warning(
                f"Access denied: user {user.id} tried to access org {requested_org_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this organization"
            )
        
        # Org must exist and be active
        org = db.query(Organization).filter(Organization.id == requested_org_id).first()
        
        if not org or not org.is_active:
            logger.warning(f"Access denied: organization {requested_org_id} inactive")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Organization is inactive"
            )
        
        return org
    
    @staticmethod
    async def validate_cross_org_access(
        user: User,
        target_user_id: str,
        db: Session
    ) -> User:
        """
        Validate access to another user in same organization.
        
        Args:
            user: Current user
            target_user_id: Target user ID
            db: Database session
            
        Returns:
            Target user object
            
        Raises:
            HTTPException: If access denied
        """
        target_user = db.query(User).filter(User.id == target_user_id).first()
        
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Both users must belong to same org
        if target_user.organization_id != user.organization_id:
            logger.warning(
                f"Cross-org access denied: user {user.id} tried to access user {target_user_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access users from other organizations"
            )
        
        return target_user


def inject_tenant_middleware(app) -> None:
    """
    Convenience function to add TenantMiddleware to FastAPI app.
    
    Usage in main.py:
        from fastapi import FastAPI
        from backend.app.middleware.tenant_middleware import inject_tenant_middleware
        
        app = FastAPI()
        inject_tenant_middleware(app)
    """
    app.add_middleware(TenantMiddleware)
