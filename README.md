# SentinelShield AI (v2.0)

A production-grade, multi-tenant SaaS for real-time cybersecurity threat detection using behavioral AI and Zero Trust principles.

## Mission

Prevents credential theft and 'Shadow AI' usage through automated anomaly detection and instant incident response.

## Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Icons**: Lucide Icons
- **Visualization**: Recharts

### Backend
- **Runtime**: Python (FastAPI) or Go (Gin/Fiber)
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Caching**: Redis
- **Rate Limiting**: Redis

### AI Engine
- **Model**: Scikit-learn (Isolation Forest) & PyTorch
- **Architecture**: Human-in-the-loop (HITL) feedback loop for model retraining

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Cloud**: AWS/GCP (Serverless/RDS)
- **Monitoring**: Prometheus & Grafana

## Project Structure

```
SentinelShield AI (v2.0)/
├── frontend/              # Next.js 14 application
├── backend/               # FastAPI/Go backend service
├── ai-engine/             # Machine learning models and threat detection
├── infrastructure/        # Docker, Kubernetes, Terraform configs
├── docs/                  # Documentation
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose
- kubectl (for Kubernetes)

### Setup Instructions

1. **Clone and Navigate**
```bash
cd "SentinelShield AI (v2.0)"
```

2. **Backend Setup** (see `backend/README.md`)
3. **Frontend Setup** (see `frontend/README.md`)
4. **AI Engine Setup** (see `ai-engine/README.md`)
5. **Infrastructure** (see `infrastructure/README.md`)

## Core Features

### 1. Tenant Onboarding
Automated workflow for organization creation, domain verification, and default security policy provisioning.

### 2. Real-Time Threat Detection Engine
- Log ingestion → AI Risk Scoring → Automated Action (Block/Alert)
- Risk Score: R = (AnomalyScore × 0.6) + (VelocityWeight × 0.4)

### 3. Compliance Audit System
Append-only logging with cryptographic hashing for integrity and compliance.

### 4. AI Feedback Loop
Interface for analysts to correct AI classifications; triggers retraining when feedback buffer reaches threshold.

### 5. Real-Time Attack Map
WebSocket-powered live threat visualization with geographic mapping.

## Database Architecture

### Isolation Strategy
Multi-tenant logic using `tenant_id` on all tables with PostgreSQL RLS policies.

### Core Tables
- **organizations**: Tenant metadata, subscription tier, security policies
- **users**: RBAC-enabled user management (Admin, Analyst, Viewer)
- **threat_logs**: Raw event data (Timestamp, IP, User-Agent, Action, Resource)
- **audit_trails**: Immutable records of system changes
- **ai_feedback_buffer**: Flagged false-positives for model retraining

## Deployment Strategy

### CI/CD Pipeline
1. Build
2. Lint
3. Security Scan (Snyk)
4. Test
5. Deploy to Staging
6. Deploy to Production

### Monitoring
- Prometheus for metrics
- Grafana for system health dashboards

## Documentation

- [Backend Documentation](./docs/BACKEND.md)
- [Frontend Documentation](./docs/FRONTEND.md)
- [Database Schema](./docs/DATABASE.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Architecture](./docs/ARCHITECTURE.md)

## Development Roles

### For Frontend Developers
Focus on the real-time 'Attack Map' (WebSockets) and tenant dashboard UI responsiveness.

### For Backend Developers
Focus on RLS implementation, API performance, and asynchronous event processing queue.

### For DevOps Engineers
Focus on Zero-Trust network policy, Infrastructure-as-Code (Terraform), and CI/CD security scanning.

## License

Proprietary - SentinelShield AI Inc.

## Support

For issues and questions, contact the development team.
