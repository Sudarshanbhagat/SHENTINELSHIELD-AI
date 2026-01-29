# SentinelShield AI v2.0 - Installation & Setup Guide

**Last Updated**: January 28, 2026
**Platform**: Windows 10/11

---

## 📦 Installation Checklist

### Option A: Docker Compose (Easiest - Recommended)

#### 1. Install Docker Desktop
```
Step 1: Download Docker Desktop
  → https://www.docker.com/products/docker-desktop

Step 2: Run installer
  → Follow installation wizard
  → Accept all defaults
  → Restart computer when prompted

Step 3: Verify installation
  → Open PowerShell
  → Run: docker --version
  → Run: docker compose version
```

**Expected Output**:
```
Docker version 24.0.0 or higher
Docker Compose version 2.20.0 or higher
```

#### 2. Allocate Resources
Docker Desktop Settings:
- **CPUs**: 4+ cores (recommended)
- **Memory**: 8GB+ (minimum 4GB)
- **Disk**: 50GB+ free space

#### 3. Start Docker Desktop
```powershell
# Docker Desktop should run in background
# Check system tray for Docker icon
```

---

### Option B: Local Development (For Code Changes)

#### 1. Install Python 3.11+
```powershell
# Download: https://www.python.org/downloads/
# Version: 3.11.0 or higher

# Verify installation
python --version

# Install pip packages
cd backend
pip install -r requirements.txt
```

**Requirements**:
- Python 3.11 or 3.12
- pip (included with Python)
- Virtual environment (recommended):
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  ```

#### 2. Install Node.js 18+
```powershell
# Download: https://nodejs.org/
# LTS Version: 18.x or 20.x recommended

# Verify installation
node --version
npm --version

# Install dependencies
cd frontend
npm install
```

**Requirements**:
- Node.js 18.17.0+
- npm 9.0.0+

#### 3. Install PostgreSQL 15
```powershell
# Download: https://www.postgresql.org/download/windows/
# Version: 15.0 or higher

# During installation:
  → Choose default port: 5432
  → Set password: (remember this)
  → Stack Builder: Skip unless needed

# Verify installation
psql --version

# Load database schema
cd backend\database
psql -U postgres -d sentinelshield -f init.sql
```

#### 4. Install Redis 7
```powershell
# Option 1: Windows Subsystem for Linux (WSL2)
# Open PowerShell as Administrator
wsl --install
wsl --install -d Ubuntu

# Then in WSL:
sudo apt update
sudo apt install redis-server
redis-server

# Option 2: Docker (easier)
docker run -d -p 6379:6379 redis:7-alpine
```

---

## 🐳 Docker Compose Setup

### 1. Verify Docker is Running
```powershell
# Open PowerShell and run:
docker ps

# Should show: CONTAINER ID | IMAGE | ... (with no errors)
```

### 2. Navigate to Project Root
```powershell
cd "e:\SentinelShield AI (v2.0)"
```

### 3. Check docker-compose.yml
```powershell
# File should exist at project root
Get-ChildItem docker-compose.yml

# If exists, you're ready!
```

### 4. Start Services
```powershell
# Start in background
docker compose up -d

# Or attach to logs (Ctrl+C to stop)
docker compose up

# Wait 30-60 seconds for all services to start
```

### 5. Verify Services
```powershell
# Check running containers
docker ps

# Expected:
# - sentinelshield-api-1 (Backend)
# - sentinelshield-web-1 (Frontend)
# - sentinelshield-postgres-1 (Database)
# - sentinelshield-redis-1 (Cache)
```

### 6. Check Logs
```powershell
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres
```

---

## ✅ Verification Tests

### Health Checks

#### Backend API
```powershell
# In PowerShell:
curl http://localhost:8000/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-28T..."}
```

#### Frontend
```powershell
# In browser:
http://localhost:3000

# Expected: SentinelShield landing page loads
```

#### Database
```powershell
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d sentinelshield -c "SELECT COUNT(*) FROM organizations;"

# Expected: Displays table row count
```

#### Redis
```powershell
# Check Redis connectivity
docker compose exec redis redis-cli ping

# Expected: PONG
```

### API Documentation
```
Open: http://localhost:8000/docs
- Lists all API endpoints
- Allows testing endpoints
- Shows request/response examples
```

---

## 🔐 Environment Configuration

### Backend (.env)
```bash
# Located: backend/.env

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/sentinelshield
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DEBUG=False
```

### Frontend (.env.local)
```bash
# Located: frontend/.env.local

NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=localhost:8000
```

---

## 🧑‍💻 Development Workflow

### Making Backend Changes
```powershell
# Option 1: Edit in container (hot reload)
# Changes auto-reload due to volume mount

# Option 2: Run locally
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Making Frontend Changes
```powershell
# Option 1: Edit in container (hot reload)
# Changes auto-reload via Next.js hot module replacement

# Option 2: Run locally
cd frontend
npm install
npm run dev
# Opens: http://localhost:3000
```

### Database Changes
```powershell
# Connect to database
docker compose exec postgres psql -U postgres -d sentinelshield

# Or use VS Code extension:
# Install: PostgreSQL (Chris Kolkman)
# Connect to: localhost:5432
```

---

## 🛑 Stopping Services

### Stop Without Removing Containers
```powershell
docker compose stop
```

### Stop and Remove Everything
```powershell
docker compose down
```

### Stop Specific Service
```powershell
docker compose stop api
docker compose stop web
```

---

## 🔄 Restarting Services

### Restart All
```powershell
docker compose restart
```

### Rebuild and Restart
```powershell
docker compose down
docker compose up -d --build
```

### View Logs While Running
```powershell
docker compose logs -f
# Press Ctrl+C to exit
```

---

## 📊 Resource Usage

### Check Container Stats
```powershell
docker stats

# Shows: CPU%, Memory%, Network I/O
# Press Ctrl+C to exit
```

### Cleanup Unused Resources
```powershell
# Remove unused images
docker image prune

# Remove stopped containers
docker container prune

# Remove all unused (careful!)
docker system prune
```

---

## 🐛 Troubleshooting

### Issue: Docker Not Found
**Solution**:
```powershell
# Install Docker Desktop from:
https://www.docker.com/products/docker-desktop

# Ensure it's running (check system tray)
```

### Issue: Port Already in Use
**Solution**:
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
# Change: "8000:8000" to "8001:8000"
```

### Issue: Database Connection Failed
**Solution**:
```powershell
# Check if postgres is running
docker compose ps

# Restart database
docker compose restart postgres

# Check logs
docker compose logs postgres
```

### Issue: Frontend Shows Blank Page
**Solution**:
```powershell
# Clear browser cache
# Hard refresh: Ctrl+Shift+R

# Check frontend logs
docker compose logs web

# Rebuild frontend
docker compose down
docker compose up -d --build web
```

### Issue: "Cannot connect to Docker daemon"
**Solution**:
```powershell
# Start Docker Desktop (click icon in Start menu)
# Wait 30 seconds for it to fully start
# Try command again
```

---

## 🎯 First Login

### Default Credentials
```
Email: admin@test.com
Password: TestPassword123!
```

**Note**: If not set, use onboarding wizard at `/onboarding`

### Create Organization
1. Go to: http://localhost:3000/onboarding
2. Fill in organization details
3. Create admin user
4. Verify domain (use provided DNS record)
5. Complete setup
6. Login with admin credentials

---

## 📚 Documentation

**Read These First**:
1. FINAL_IMPLEMENTATION_GUIDE.md - Integration details
2. docs/ARCHITECTURE.md - System design
3. docs/API.md - API endpoints
4. QUICK_REFERENCE.md - Commands cheat sheet

---

## 🚀 Next Steps

1. ✅ Install Docker Desktop
2. ✅ Run `docker compose up -d`
3. ✅ Verify services at http://localhost:3000
4. ✅ Create organization via onboarding
5. ✅ Login and test dashboard
6. ✅ Read FINAL_IMPLEMENTATION_GUIDE.md

---

## 📞 Quick Commands Reference

```powershell
# Start project
docker compose up -d

# Stop project
docker compose stop

# View logs
docker compose logs -f

# Restart specific service
docker compose restart api

# Execute command in container
docker compose exec api bash

# Remove everything (start fresh)
docker compose down

# Check resource usage
docker stats

# View running containers
docker compose ps
```

---

## ✨ You're Ready!

Once Docker is installed and `docker compose up -d` runs successfully:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

Enjoy SentinelShield AI v2.0! 🚀
