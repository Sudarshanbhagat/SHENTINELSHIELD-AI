"""
Authentication Router for SentinelShield AI
Handles user registration, login, and token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import uuid
from passlib.context import CryptContext

from app.core.database import get_db
from app.models.models import User
from app.core.security import create_access_token, verify_password, get_password_hash

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
    responses={404: {"description": "Not found"}},
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_user_by_email(db: Session, email: str):
    """Get user by email from database"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: str):
    """Get user by ID from database"""
    return db.query(User).filter(User.id == user_id).first()

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return get_password_hash(password)

def verify_user_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return verify_password(plain_password, hashed_password)

# ============================================================================
# POST /auth/register - SIGNUP ENDPOINT
# ============================================================================

@router.post("/register", tags=["Authentication"])
async def register(
    email: str,
    password: str,
    full_name: str,
    db: Session = Depends(get_db)
):
    """
    Register a new user
    
    - **email**: User email address (must be unique)
    - **password**: User password (minimum 8 characters)
    - **full_name**: User's full name
    
    Returns JWT access_token on success
    """
    # Validate input
    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    if not password or len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    if not full_name or len(full_name.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required"
        )
    
    # Check if user already exists
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        # Create new user
        new_user = User(
            id=str(uuid.uuid4()),
            email=email,
            full_name=full_name.strip(),
            hashed_password=hash_password(password),
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create JWT token for auto-login
        access_token = create_access_token(
            data={"sub": new_user.id},
            expires_delta=timedelta(minutes=30)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "full_name": new_user.full_name,
            }
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

# ============================================================================
# POST /auth/token - LOGIN ENDPOINT
# ============================================================================

@router.post("/token", tags=["Authentication"])
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with email and password
    
    Requires form data:
    - **username**: Email address (FastAPI uses 'username' for OAuth2)
    - **password**: Password
    
    Returns JWT access_token on success
    """
    # Find user by email (username field contains email)
    user = get_user_by_email(db, form_data.username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_user_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create JWT token
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=30)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
        }
    }

# ============================================================================
# GET /auth/users/me - GET CURRENT USER
# ============================================================================

@router.get("/users/me", tags=["Authentication"])
async def get_current_user(
    db: Session = Depends(get_db),
    token: str = None
):
    """
    Get current user information (requires authentication token)
    
    Pass token in Authorization header:
    Authorization: Bearer {token}
    """
    # This is a simplified version - in production, verify the token
    # For now, it's a placeholder that requires client to send user ID
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "message": "Authenticated",
        "token": token
    }

# ============================================================================
# LOGOUT ENDPOINT (client-side only)
# ============================================================================

@router.post("/logout", tags=["Authentication"])
async def logout():
    """
    Logout endpoint (token is managed client-side)
    
    Client should:
    1. Remove token from localStorage
    2. Redirect to login page
    """
    return {
        "message": "Successfully logged out",
        "action": "Clear localStorage and redirect to /login"
    }
