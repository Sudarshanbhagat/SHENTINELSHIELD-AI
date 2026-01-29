# 🚀 SentinelShield AI v2.0 - Project Startup Guide

**Date**: January 28, 2026
**Status**: Ready to Run (3 options available)

---

## ⚡ Quick Start Options

### Option 1: Local Development (No Docker)
**Easiest for development & testing**

#### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15 (local or cloud)
- Redis 7 (local or cloud, optional)

#### Step-by-Step

**1. Set Up Python Backend**
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

**2. Configure Backend Environment**
```bash
# Copy example file
cp .env.example .env

# Edit .env with your values:
# DATABASE_URL=postgresql://user:password@localhost:5432/sentinel_shield
# REDIS_URL=redis://localhost:6379
# JWT_SECRET_KEY=your-secret-key-here
# ENVIRONMENT=development
```

**3. Set Up Database**
```bash
# Make sure PostgreSQL is running locally, then:
psql -U postgres -d sentinel_shield -f database/init.sql

# Or using connection string:
psql postgresql://user:password@localhost:5432/sentinel_shield -f database/init.sql
```

**4. Start Backend Server**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at**: `http://localhost:8000`
**API Docs**: `http://localhost:8000/docs`

**5. Set Up Node.js Frontend** (in new terminal)
```bash
cd frontend
npm install
# or
yarn install
```

**6. Configure Frontend Environment**
```bash
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_WS_URL=localhost:8000" >> .env.local
```

**7. Start Frontend Server**
```bash
cd frontend
npm run dev
# or
yarn dev
```

**Frontend will be available at**: `http://localhost:3000`

---

### Option 2: Docker (If Installed)
**Best for consistent environments**

#### Prerequisites
- Docker 24.0+
- Docker Compose V2

#### Quick Start
```bash
cd "SentinelShield AI (v2.0)"
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

#### Services will be available at:
- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

#### Stop Services
```bash
docker compose down
```

#### Rebuild Images
```bash
docker compose up -d --build
```

---

### Option 3: Cloud Deployment
**For production deployment**

#### Kubernetes
```bash
# Apply manifests
kubectl apply -f infrastructure/kubernetes/

# Check deployment
kubectl get all -n sentinelshield

# View logs
kubectl logs -n sentinelshield deployment/api -f
```

#### AWS/GCP/Azure
1. Create PostgreSQL managed database
2. Create Redis cache
3. Deploy Docker images to container service
4. Configure environment variables
5. Set up TLS certificates

---

## 🔐 First Login

### Default Credentials
After setup, you'll need to create an admin user. Use the onboarding flow:

**Option A: Web Onboarding**
1. Go to `http://localhost:3000/onboarding`
2. Fill in organization details
3. Create admin account
4. Verify domain (or skip for local testing)
5. Login with created credentials

**Option B: Database Seeding** (Development only)
```sql
-- Connect to PostgreSQL
psql postgresql://sentinel_user:sentinel_secure_pass_123@localhost:5432/sentinel_shield

-- Insert test organization
INSERT INTO organizations (id, name, domain, subscription_tier, is_active, created_at)
VALUES ('org-test-123', 'Test Organization', 'test.local', 'starter', true, NOW());

-- Insert test admin user (password: TestPass123!)
INSERT INTO users (id, organization_id, email, full_name, password_hash, role, is_active, created_at)
VALUES (
  'user-admin-123',
  'org-test-123',
  'admin@test.local',
  'Test Admin',
  '$2b$12$...',  -- bcrypt hash of TestPass123!
  'admin',
  true,
  NOW()
);
```

---

## 🧪 Testing the System

### Test Health Endpoints
```bash
# Backend health
curl http://localhost:8000/health

# Frontend (should return HTML)
curl http://localhost:3000
```

### Test WebSocket Connection
```bash
# From frontend (browser console):
const socket = new WebSocket('ws://localhost:8000/api/v1/ws/org-123/user-456?token=YOUR_JWT');
socket.onopen = () => console.log('Connected!');
socket.onmessage = (e) => console.log('Message:', e.data);
```

### Test API Endpoints
```bash
# List threats
curl -H "Authorization: Bearer YOUR_JWT" \
     -H "X-Organization-ID: org-test-123" \
     http://localhost:8000/api/v1/threats

# Get stats
curl -H "Authorization: Bearer YOUR_JWT" \
     -H "X-Organization-ID: org-test-123" \
     http://localhost:8000/api/v1/threats/stats/summary
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────┐
│     Next.js Frontend (Port 3000)    │
│  - Dashboard                        │
│  - WebSocket real-time updates      │
│  - Onboarding flow                  │
└────────────────┬────────────────────┘
                 │ HTTP/WebSocket
┌────────────────▼────────────────────┐
│    FastAPI Backend (Port 8000)      │
│  - Threat API                       │
│  - WebSocket Manager                │
│  - Organizations API                │
│  - Middleware & Auth                │
└────────────────┬────────────────────┘
                 │ SQL/Commands
        ┌────────┴──────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────┐
│ PostgreSQL     │  │   Redis     │
│ Port 5432      │  │ Port 6379   │
│                │  │             │
│ - Organizations│  │ - Sessions  │
│ - Users        │  │ - Rate Limits
│ - Threats      │  │ - Cache     │
│ - Audit Logs   │  │             │
└────────────────┘  └─────────────┘
```

---

## 🔧 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://sentinel_user:sentinel_secure_pass_123@localhost:5432/sentinel_shield
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=localhost:8000
```

---

## 📈 Database Seeding (Optional)

Generate test data:
```bash
cd backend
python -c "
from app.core.database import SessionLocal
from app.models.models import Organization, User
from app.core.security import get_password_hash
from datetime import datetime
import uuid

db = SessionLocal()

# Create org
org = Organization(
    id=str(uuid.uuid4()),
    name='Test Corp',
    domain='test.local',
    is_active=True
)
db.add(org)
db.flush()

# Create user
user = User(
    id=str(uuid.uuid4()),
    organization_id=org.id,
    email='admin@test.local',
    full_name='Test Admin',
    password_hash=get_password_hash('TestPass123!'),
    role='admin',
    is_active=True
)
db.add(user)
db.commit()

print(f'✅ Created org: {org.id}')
print(f'✅ Created user: {user.id}')
print(f'Email: {user.email}')
print(f'Password: TestPass123!')
"
```

---

## 🔍 Troubleshooting

### Backend Issues

**Port 8000 already in use**
```bash
# Find process using port
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or use different port
python -m uvicorn app.main:app --port 8001
```

**Database connection failed**
```bash
# Test PostgreSQL connection
psql postgresql://sentinel_user:sentinel_secure_pass_123@localhost:5432/sentinel_shield

# Check if PostgreSQL is running
pg_isready -h localhost -U sentinel_user
```

**Redis connection failed**
```bash
# Test Redis
redis-cli ping

# Should return: PONG
```

### Frontend Issues

**Port 3000 already in use**
```bash
# Use different port
npm run dev -- -p 3001
```

**Node modules issue**
```bash
# Clean install
rm -r node_modules package-lock.json
npm install
```

### WebSocket Connection Failed

**In browser console:**
```javascript
// Check WebSocket URL
console.log('WS URL:', `ws://localhost:8000/api/v1/ws/org-123/user-456`);

// Try connecting
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/org-123/user-456?token=JWT_TOKEN');
ws.onerror = (e) => console.error('WS Error:', e);
```

---

## 📊 Monitoring

### View Backend Logs
```bash
# Docker
docker compose logs -f backend

# Local (terminal where backend is running)
# Should show: "Uvicorn running on http://0.0.0.0:8000"
```

### View Frontend Build
```bash
# Check for errors
npm run build

# Start in production mode
npm run start
```

### Database Activity
```bash
# Connect to PostgreSQL
psql postgresql://sentinel_user:sentinel_secure_pass_123@localhost:5432/sentinel_shield

# Check tables
\dt

# Count threats
SELECT COUNT(*) FROM threat_logs;

# View recent events
SELECT action_type, timestamp FROM audit_trails 
ORDER BY timestamp DESC LIMIT 10;
```

### Redis Activity
```bash
# Connect to Redis
redis-cli

# Check memory
INFO memory

# List all keys
KEYS *

# Check WebSocket sessions
KEYS "ws:*"
```

---

## ✅ Verification Checklist

After starting services, verify:

- [ ] Backend running: `curl http://localhost:8000/health`
- [ ] Frontend running: `curl http://localhost:3000`
- [ ] Database connected: `psql ... -c "SELECT 1"`
- [ ] Redis available: `redis-cli ping`
- [ ] API docs at: `http://localhost:8000/docs`
- [ ] Dashboard at: `http://localhost:3000/dashboard`
- [ ] WebSocket connects: Check browser console
- [ ] Can login with credentials

---

## 🚀 Next Steps

1. **Explore API Documentation**
   - Visit `http://localhost:8000/docs`
   - Try out endpoints

2. **Access Dashboard**
   - Go to `http://localhost:3000`
   - Create organization via onboarding
   - Login and explore features

3. **Test Threat Detection**
   - Generate sample threats via API
   - Monitor in real-time dashboard
   - Test false positive flagging

4. **Review Code**
   - Backend: `backend/app/`
   - Frontend: `frontend/app/` and `frontend/components/`
   - Documentation: `docs/`

5. **Customize**
   - Update environment variables
   - Modify dashboard styling
   - Add custom threat rules
   - Configure security policies

---

## 📚 Additional Resources

- **API Docs**: `docs/API.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Deployment**: `docs/DEPLOYMENT.md`
- **Quick Reference**: `QUICK_REFERENCE.md`

---

**Ready to launch? Start with Option 1 (Local Development) if you don't have Docker installed!** 🎉
