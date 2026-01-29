# Architecture Documentation - SentinelShield AI v2.0

## System Overview

SentinelShield AI is a multi-tenant, real-time cybersecurity threat detection SaaS platform built on modern cloud-native architecture.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js 14 (React + TypeScript)                         │  │
│  │  - Real-time Dashboard                                   │  │
│  │  - Attack Map Visualization                              │  │
│  │  - Multi-tenant UI (RBAC)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ (HTTPS + WebSocket)
┌────────────────────────▼────────────────────────────────────────┐
│                      API LAYER                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FastAPI (Python) - REST + WebSocket                    │  │
│  │  - Authentication (JWT)                                  │  │
│  │  - Tenant Isolation (RLS)                                │  │
│  │  - Rate Limiting (Redis)                                 │  │
│  │  - API Versioning (v1)                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  PostgreSQL │   │    Redis    │   │  AI Engine  │
│  (RLS)      │   │  (Cache)    │   │ (ML Models) │
└─────────────┘   └─────────────┘   └─────────────┘
       │                 │                 │
       │                 │    ┌────────────┘
       │                 │    │
       ▼                 ▼    ▼
   ┌────────────────────────────────┐
   │   CORE SERVICES LAYER          │
   │  ┌──────────────────────────┐  │
   │  │ Threat Detection Engine  │  │
   │  │ - Isolation Forest       │  │
   │  │ - Anomaly Scoring        │  │
   │  │ - Risk Calculation       │  │
   │  └──────────────────────────┘  │
   │  ┌──────────────────────────┐  │
   │  │ AI Feedback Loop         │  │
   │  │ - Human-in-the-Loop      │  │
   │  │ - Model Retraining       │  │
   │  │ - Confidence Tracking    │  │
   │  └──────────────────────────┘  │
   │  ┌──────────────────────────┐  │
   │  │ Compliance & Audit       │  │
   │  │ - Immutable Logging      │  │
   │  │ - Cryptographic Hashing  │  │
   │  │ - Audit Trails           │  │
   │  └──────────────────────────┘  │
   └────────────────────────────────┘
```

## Multi-Tenant Architecture

### Tenant Isolation Strategy

1. **Database Level (PostgreSQL RLS)**
   - `organization_id` on all tables
   - Row-Level Security policies enforce isolation
   - Each tenant sees only their data

2. **API Level**
   - JWT contains `org_id` claim
   - Middleware sets `app.current_org_id` session variable
   - All queries automatically filtered by RLS

3. **Frontend Level**
   - Organization selection on login
   - UI components respect user's RBAC role
   - API calls include org context

### Data Flow

```
User Login
    ↓
JWT Created (org_id + user_id + role)
    ↓
API Request (JWT in Authorization header)
    ↓
Middleware Validates JWT & Sets RLS Context
    ↓
Database Query (RLS Policy Filters by org_id)
    ↓
Response (Only User's Org Data)
```

## Threat Detection Pipeline

```
Incoming Log Entry
    ↓
Feature Extraction
  - Response time
  - HTTP status
  - Time of day
  - Day of week
  - User agent length
  - IP reputation
    ↓
Anomaly Detection (Isolation Forest)
  - Anomaly Score (0-1)
    ↓
Velocity Analysis
  - Actions per minute
  - IP-based grouping
  - Time window analysis
    ↓
Risk Score Calculation
  Risk = (AnomalyScore × 0.6) + (VelocityWeight × 0.4)
    ↓
Severity Classification
  - Critical: Risk > 0.8
  - High: Risk > 0.6
  - Medium: Risk > 0.4
  - Low: Risk ≤ 0.4
    ↓
Action Trigger
  - Alert (all severities)
  - Auto-Block (if enabled + severity high)
  - Log Storage
```

## AI Feedback Loop (HITL)

```
AI Prediction
    ↓
Analyst Review
    ↓
Correction Submitted
    ↓
Stored in ai_feedback_buffer
    ↓
Threshold Check (100+ samples)
    ↓
Training Job Triggered
  - Extract features from threat logs
  - Use corrected labels
  - Retrain Isolation Forest
    ↓
Model Evaluation
  - Accuracy
  - Precision
  - Recall
  - F1 Score
    ↓
Deployment Decision
  - If metrics improved → Deploy
  - If metrics degraded → Keep current model
```

## Database Schema (10 Tables)

| Table | Purpose | Rows |
|-------|---------|------|
| `organizations` | Tenant metadata | 1-100K |
| `users` | User accounts with RBAC | 10-1M |
| `threat_logs` | Raw security events | 1M-100M+ |
| `audit_trails` | Immutable compliance logs | 100K-10M |
| `ai_feedback_buffer` | Analyst corrections | 1K-100K |
| `security_policies` | Tenant security settings | 1-100K |
| `api_keys` | API authentication | 100-10K |
| `settings` | Tenant custom settings | 1-100K |
| `model_retraining_jobs` | ML pipeline tracking | 100-10K |

## Security Architecture

### Authentication
- JWT tokens (HS256)
- 24-hour expiration
- Refresh token rotation

### Authorization
- RBAC: Admin, Analyst, Viewer
- Organization-based isolation
- Resource-level permissions

### Encryption
- TLS 1.3 for transport
- AES-256 for sensitive data at rest
- SHA-256 hashing for audit integrity

### Rate Limiting
- Redis-backed
- 100 requests per 60 seconds per IP
- Configurable per endpoint

## Scalability

### Horizontal Scaling
- **Backend**: Stateless FastAPI servers (auto-scale 3-10 replicas)
- **Frontend**: Static Next.js builds behind CDN
- **Database**: Read replicas for analytics queries

### Vertical Scaling
- Kubernetes resource limits/requests
- Container resource management
- Performance optimization

### Caching Strategy
- Redis for session caching
- Model artifact caching
- API response caching (configurable TTL)

## Performance Targets

- **API Response Time**: < 200ms (p95)
- **Threat Detection Latency**: < 1 second
- **Database Query Time**: < 100ms (p95)
- **Availability**: 99.9% uptime SLA

## Disaster Recovery

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Backup Strategy**: Daily snapshots + continuous WAL archiving
- **Failover**: Automatic to warm standby

## Deployment Strategy

### Environments
1. **Development**: Local docker-compose
2. **Staging**: Kubernetes cluster (us-east-1)
3. **Production**: Multi-AZ Kubernetes (us-east-1, us-west-2)

### CI/CD Pipeline
```
Push to Main
  ↓
Lint & Type Check
  ↓
Unit Tests
  ↓
Security Scan (Snyk)
  ↓
Build Docker Images
  ↓
Push to Registry
  ↓
Deploy to Staging
  ↓
Smoke Tests
  ↓
Deploy to Production
```

### Monitoring & Alerting
- Prometheus: Metrics collection (15s interval)
- Grafana: Dashboard visualization
- Alert Manager: Alert routing and suppression
- Custom metrics for threat detection

## API Versioning

Current: **v1**

Planned: v2 (Q3 2025)
- Additional ML models
- Enhanced visualization APIs
- Performance improvements

## Compliance

- **SOC 2 Type II** ready
- **GDPR** compliant
- **HIPAA** optional add-on
- Audit logging for all user actions
- Data retention policies configurable per tenant

## Future Roadmap

### Phase 2 (Q2 2025)
- PyTorch neural network models
- Geographic threat mapping
- IP reputation integration
- Webhook event notifications

### Phase 3 (Q3 2025)
- Advanced ML pipeline orchestration
- Customer-specific model training
- Threat intelligence feeds integration
- Mobile application

### Phase 4 (Q4 2025)
- Federated learning for privacy
- Blockchain-based audit trails
- Zero-Knowledge proofs for compliance
