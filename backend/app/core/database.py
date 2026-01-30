import os
from sqlalchemy import create_engine, text, event, String, TypeDecorator
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from sqlalchemy.pool import NullPool
import json

# Custom JSON type for SQLite compatibility
class JSON(TypeDecorator):
    """JSON type that works with both SQLite and PostgreSQL"""
    impl = String
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return json.dumps(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return json.loads(value)

# Monkey patch for SQLite JSON/JSONB support
import sqlalchemy.dialects.postgresql as postgresql
from sqlalchemy.dialects.postgresql import JSONB

# Make JSONB use our custom JSON type
original_jsonb = JSONB

class CompatibleJSONB(original_jsonb):
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'sqlite':
            return dialect.type_descriptor(JSON())
        return super().load_dialect_impl(dialect)

# Replace JSONB in the postgresql module
postgresql.JSONB = CompatibleJSONB

# Also fix UUID for SQLite
from sqlalchemy.dialects.postgresql import UUID
original_uuid = UUID

class CompatibleUUID(original_uuid):
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'sqlite':
            return dialect.type_descriptor(String(36))
        return super().load_dialect_impl(dialect)

postgresql.UUID = CompatibleUUID

# 1. FIX: Render/Heroku/Neon sometimes provide "postgres://" 
# SQLAlchemy 1.4+ requires "postgresql://"
database_url = settings.DATABASE_URL
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# 2. OPTIMIZATION: Use NullPool for Neon Serverless
# Neon has its own pooler (pgBouncer). Using SQLAlchemy's internal pool 
# can cause "Too many connections" errors on free tiers.
is_sqlite = database_url.startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        database_url,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
else:
    engine = create_engine(
        database_url,
        echo=settings.DEBUG,
        poolclass=NullPool, # Let Neon handle the pooling
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def set_tenant_context(db_session, organization_id: str):
    """
    Set the tenant context for RLS (Row Level Security) policies.
    SECURITY FIX: Uses bind parameters to prevent SQL Injection.
    """
    # Use text() with parameters instead of f-string concatenation
    db_session.execute(
        text("SELECT set_config('app.current_org_id', :org_id, false)"),
        {"org_id": organization_id}
    )