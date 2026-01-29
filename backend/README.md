# Backend - SentinelShield AI

FastAPI-based backend service for real-time threat detection and multi-tenant SaaS management.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
cp .env.example .env
```

3. Run migrations (handled by docker-compose or manual):
```bash
alembic upgrade head
```

4. Start the server:
```bash
uvicorn app.main:app --reload
```

Server runs on `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## Structure

- `app/main.py` - FastAPI application entry point
- `app/api/v1/` - API routes (endpoints)
- `app/core/` - Configuration, security, database
- `app/models/` - SQLAlchemy ORM models
- `app/schemas/` - Pydantic request/response schemas
- `app/services/` - Business logic
- `app/middleware/` - Custom middleware
- `tests/` - Unit and integration tests
- `database/` - Database migrations and initialization scripts

## Key Features

- JWT-based authentication
- Row-Level Security (RLS) for multi-tenant isolation
- Real-time threat detection engine
- WebSocket support for live updates
- AI/ML integration (Isolation Forest + PyTorch)
- Comprehensive audit logging
- Redis caching and rate limiting
