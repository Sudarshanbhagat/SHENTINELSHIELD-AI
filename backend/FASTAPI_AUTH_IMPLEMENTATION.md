# FastAPI Backend Implementation Guide

## Complete Example for SentinelShield AI

This guide shows how to implement the authentication endpoints to work with the Next.js frontend.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                       # FastAPI app setup
│   ├── core/
│   │   ├── config.py                 # Settings & database config
│   │   ├── security.py               # JWT token creation/verification
│   │   └── dependencies.py           # Dependency injection
│   ├── models/
│   │   └── models.py                 # SQLAlchemy models (User, etc.)
│   ├── schemas/
│   │   ├── user.py                   # Pydantic schemas
│   │   └── token.py                  # Token response schema
│   ├── crud/
│   │   └── user.py                   # Database operations
│   └── routers/
│       └── auth.py                   # /auth endpoints
├── requirements.txt                  # Dependencies
└── .env                             # Environment variables
```

## Step 1: Install Dependencies

```bash
pip install fastapi uvicorn python-jose[cryptography] passlib[bcrypt] python-multipart pydantic sqlalchemy psycopg[binary]
```

Add to `requirements.txt`:
```
fastapi==0.104.1
uvicorn==0.24.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.2.0
sqlalchemy==2.0.23
psycopg[binary]==3.1.13
```

## Step 2: Setup Core Files

### app/core/config.py

```python
from pydantic_settings import BaseSettings
from datetime import timedelta

class Settings(BaseSettings):
    # App
    app_name: str = "SentinelShield AI"
    debug: bool = True
    
    # Database
    database_url: str = "postgresql+psycopg://user:password@localhost/sentinelshield"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    cors_origins: list = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### app/core/security.py

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class TokenData(BaseModel):
    sub: str  # user ID

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    
    return encoded_jwt

def verify_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return TokenData(sub=user_id)
    except JWTError:
        return None
```

### app/models/models.py

```python
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from app.core.security import get_password_hash

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password: str):
        self.hashed_password = get_password_hash(password)
```

### app/schemas/user.py

```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class User(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### app/schemas/token.py

```python
from pydantic import BaseModel
from typing import Optional
from app.schemas.user import UserResponse

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class SignupResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
```

### app/crud/user.py

```python
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.models import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import verify_password, get_password_hash
import uuid

def get_user_by_email(db: Session, email: str) -> User:
    stmt = select(User).where(User.email == email)
    return db.execute(stmt).scalars().first()

def get_user_by_id(db: Session, user_id: str) -> User:
    stmt = select(User).where(User.id == user_id)
    return db.execute(stmt).scalars().first()

def create_user(db: Session, user_create: UserCreate) -> User:
    db_user = User(
        id=str(uuid.uuid4()),
        email=user_create.email,
        full_name=user_create.full_name or "",
    )
    db_user.set_password(user_create.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def update_user(db: Session, user_id: str, user_update: UserUpdate) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user
```

## Step 3: Create Auth Router

### app/routers/auth.py

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.config import settings
from app.core.security import create_access_token, verify_token
from app.crud.user import (
    authenticate_user,
    create_user,
    get_user_by_id,
    update_user,
    get_user_by_email,
)
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.schemas.token import TokenResponse
from app.models.models import User
from app.core.dependencies import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

# Dependency for getting current user
def get_current_user(token: str, db: Session = Depends(get_db)) -> User:
    """Verify token and return current user"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_id(db, payload.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/token", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token endpoint.
    Receives username (email) and password as form data.
    """
    # Authenticate user
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create JWT token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }

@router.post("/register", response_model=TokenResponse)
async def register(
    user_create: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user.
    Returns access token for immediate login.
    """
    # Check if user already exists
    existing_user = get_user_by_email(db, user_create.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create user
    user = create_user(db, user_create)
    
    # Create JWT token (auto-login)
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }

@router.get("/users/me", response_model=UserResponse)
async def get_current_user_info(
    token: str = Depends(get_token_from_header),
    db: Session = Depends(get_db)
):
    """Get current user info from token"""
    user = get_current_user(token, db)
    return UserResponse.model_validate(user)

@router.patch("/users/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    token: str = Depends(get_token_from_header),
    db: Session = Depends(get_db)
):
    """Update current user info"""
    user = get_current_user(token, db)
    updated_user = update_user(db, user.id, user_update)
    return UserResponse.model_validate(updated_user)

# Helper to extract token from header
def get_token_from_header(request) -> str:
    from fastapi import Header
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth_header.split(" ")[1]
```

Better way using OAuth2PasswordBearer:

```python
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Verify token and return current user"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_id(db, payload.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
```

## Step 4: Setup Main App

### app/main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.models import Base
from app.routers import auth

# Create database engine
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
)

# Create tables
Base.metadata.create_all(bind=engine)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# FastAPI app
app = FastAPI(title=settings.app_name)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
```

### app/core/dependencies.py

```python
from sqlalchemy.orm import Session
from app.main import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## Step 5: Run Backend

```bash
cd backend

# Activate venv (Windows)
.\venv\Scripts\Activate.ps1

# Or Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000

# Visit http://localhost:8000/docs for Swagger UI
```

## Testing with Frontend

Once backend is running:

1. **Frontend at** http://localhost:3000
2. **Backend at** http://localhost:8000

### Test Flow

1. Go to http://localhost:3000/signup
2. Register: `test@example.com` / `TestPassword123!`
3. Should auto-login and redirect to /dashboard
4. Token should be in localStorage

Or:

1. Go to http://localhost:3000/login
2. Login with registered credentials
3. Token saved, redirected to /dashboard

## Common Issues

### Database Not Found
```python
# Check connection string
DATABASE_URL = "postgresql+psycopg://user:password@localhost:5432/sentinelshield"
#                                   ↓              ↓
#                                 host           port
```

### CORS Error
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Token Invalid
```python
# Check algorithm matches
algorithm: str = "HS256"

# Check secret key is consistent
secret_key: str = "your-secret-key"
```

### FormData Not Working
Ensure login endpoint uses `OAuth2PasswordRequestForm`:

```python
@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),  # This is required
    db: Session = Depends(get_db)
):
    pass
```

## Security Reminders

- [ ] Change `secret_key` in production
- [ ] Use HTTPS in production
- [ ] Set appropriate `access_token_expire_minutes`
- [ ] Hash passwords (passlib handles this)
- [ ] Validate email format (Pydantic does this)
- [ ] Implement rate limiting on login endpoint
- [ ] Add email verification for new accounts
- [ ] Add password reset flow
- [ ] Consider refresh tokens for better UX
