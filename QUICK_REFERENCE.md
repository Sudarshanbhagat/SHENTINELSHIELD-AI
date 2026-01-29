# Quick Reference Guide - SentinelShield AI

## Getting Started (5 minutes)

### Start Local Development Environment
```bash
cd "SentinelShield AI (v2.0)"
docker-compose up -d
```

Access:
- 🌐 Frontend: http://localhost:3000
- 📚 API Docs: http://localhost:8000/docs
- 📊 Grafana: http://localhost:3001 (admin/admin)
- 🔍 Prometheus: http://localhost:9090

---

## Common Commands

### Docker Compose
```bash
docker-compose up -d              # Start all services
docker-compose logs -f            # View logs
docker-compose down               # Stop all services
docker-compose ps                 # Check status
```

### Backend (Python/FastAPI)
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload

# Run tests
pytest tests/ --cov=app

# Format code
black .

# Type checking
mypy app --ignore-missing-imports
```

### Frontend (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Type checking
npm run type-check
```

### AI Engine (Python)
```bash
cd ai-engine

# Run threat detection
python -c "from src.threat_detector import ThreatDetectionEngine; engine = ThreatDetectionEngine()"

# Train model
python -m pytest tests/test_threat_detector.py
```

### Kubernetes
```bash
# Apply all manifests
kubectl apply -f infrastructure/kubernetes/

# Check deployment status
kubectl get all -n sentinel

# View logs
kubectl logs -f deployment/backend -n sentinel

# Port forward
kubectl port-forward svc/backend 8000:8000 -n sentinel

# Scale deployment
kubectl scale deployment backend --replicas=5 -n sentinel
```

---

## API Endpoints (Quick List)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/auth/login` | POST | User authentication |
| `/api/v1/threat-logs` | GET/POST | Threat events |
| `/api/v1/threat-stats` | GET | Threat statistics |
| `/api/v1/feedback` | POST | Submit analyst feedback |
| `/api/v1/feedback/stats` | GET | Feedback statistics |
| `/api/v1/security-policies` | GET/PUT | Security configuration |
| `/api/v1/audit-trails` | GET | Compliance logs |
| `/health` | GET | Health check |
| `/api/v1/ws/threats` | WS | Real-time threat stream |

---

## File Locations (Cheat Sheet)

### Configuration
- Backend config: `backend/app/core/config.py`
- Frontend config: `frontend/next.config.js`
- Docker compose: `docker-compose.yml`

### Database
- Schema: `backend/database/init.sql`
- Models: `backend/app/models/models.py`
- Migrations: `alembic/versions/` (when added)

### API
- Routes: `backend/app/api/v1/`
- Schemas: `backend/app/schemas/`
- Services: `backend/app/services/`

### Frontend
- Pages: `frontend/app/`
- Components: `frontend/components/`
- Styles: `frontend/styles/`

### Infrastructure
- Kubernetes: `infrastructure/kubernetes/`
- Monitoring: `infrastructure/*.yml`
- Terraform: `infrastructure/terraform/` (to be added)

### Documentation
- Architecture: `docs/ARCHITECTURE.md`
- API Reference: `docs/API.md`
- Deployment: `docs/DEPLOYMENT.md`

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your_secret_key
ENVIRONMENT=development
DEBUG=true
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## Debugging Tips

### Check if services are running
```bash
docker-compose ps
```

### View container logs
```bash
docker-compose logs backend    # Backend logs
docker-compose logs frontend   # Frontend logs
docker-compose logs postgres   # Database logs
```

### Database connectivity
```bash
# Connect to PostgreSQL
PGPASSWORD=sentinel_secure_pass_123 psql -h localhost -U sentinel_user -d sentinel_shield

# List tables
\dt

# Run a query
SELECT COUNT(*) FROM users;
```

### API testing
```bash
# Get health
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"admin_password_123"}'

# Get threats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/threat-logs?limit=10
```

---

## Project Structure at a Glance

```
SentinelShield AI (v2.0)/
├── backend/              # Python/FastAPI
├── frontend/             # Next.js/React
├── ai-engine/            # ML models
├── infrastructure/       # Kubernetes/Docker
├── docs/                 # Documentation
├── docker-compose.yml    # Local development
└── README.md            # Project overview
```

---

## Key Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend | FastAPI | 0.104+ |
| Frontend | Next.js | 14.0+ |
| Database | PostgreSQL | 15+ |
| Cache | Redis | 7+ |
| ML/AI | Scikit-learn | 1.3+ |
| Container | Docker | 24+ |
| Orchestration | Kubernetes | 1.27+ |
| CI/CD | GitHub Actions | - |

---

## Useful Resources

- 📖 API Docs (Auto): http://localhost:8000/docs (when running)
- 🏗️ Architecture: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- 🚀 Deployment: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- 📚 Full API Reference: [docs/API.md](./docs/API.md)

---

## Getting Help

1. **Check logs**: `docker-compose logs -f`
2. **Check status**: `docker-compose ps`
3. **Restart service**: `docker-compose restart backend`
4. **Rebuild image**: `docker-compose build --no-cache backend`
5. **Read docs**: See `docs/` directory

---

## Quick Checklist for New Developers

- [ ] Clone repository
- [ ] Copy `.env.example` to `.env` files
- [ ] Run `docker-compose up -d`
- [ ] Access http://localhost:3000
- [ ] Read [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [ ] Review [API.md](./docs/API.md)
- [ ] Understand [database schema](./backend/database/init.sql)
- [ ] Try creating a threat log entry
- [ ] Check logs in Grafana

---

## Performance Baseline

- **API Response Time**: < 200ms (p95)
- **Threat Detection Latency**: < 1 second
- **Database Queries**: < 100ms (p95)
- **Frontend Build Time**: < 30 seconds
- **Docker Image Sizes**: Backend ~500MB, Frontend ~200MB

---

## Security Reminders

⚠️ **Production Checklist**:
- [ ] Change all default passwords
- [ ] Generate random JWT secret (32+ chars)
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Enable monitoring/alerting
- [ ] Configure RBAC
- [ ] Review RLS policies

---

Last Updated: January 28, 2026
