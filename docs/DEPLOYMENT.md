# Deployment Guide - SentinelShield AI v2.0

## Prerequisites

- Kubernetes cluster (EKS, GKE, or AKS)
- `kubectl` CLI installed and configured
- Docker & Docker Registry access
- PostgreSQL 14+ (managed or self-hosted)
- Redis 6+ (managed or self-hosted)
- GitHub account with repository access

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/sentinelshield-ai/sentinelshield.git
cd "SentinelShield AI (v2.0)"
```

### 2. Start Development Environment
```bash
# Using docker-compose
docker-compose up -d

# Verify services
docker-compose ps

# Check logs
docker-compose logs -f
```

### 3. Access Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin) |

---

## Production Deployment on Kubernetes

### Step 1: Prepare Kubernetes Cluster

```bash
# Create namespace
kubectl create namespace sentinel

# Verify cluster
kubectl cluster-info
kubectl get nodes
```

### Step 2: Configure Secrets

```bash
# Update secret values
edit infrastructure/kubernetes/secrets.yaml

# Apply secrets
kubectl apply -f infrastructure/kubernetes/secrets.yaml
```

### Step 3: Build and Push Docker Images

```bash
# Build images
docker build -t sentinelshield/backend:latest backend/
docker build -t sentinelshield/frontend:latest frontend/

# Push to registry
docker push sentinelshield/backend:latest
docker push sentinelshield/frontend:latest

# Or use CI/CD (GitHub Actions)
git push main  # Automatically builds and pushes
```

### Step 4: Deploy to Kubernetes

```bash
# Deploy all components
kubectl apply -f infrastructure/kubernetes/

# Verify deployments
kubectl get deployments -n sentinel
kubectl get pods -n sentinel
kubectl get services -n sentinel

# Check rollout status
kubectl rollout status deployment/backend -n sentinel
kubectl rollout status deployment/frontend -n sentinel
```

### Step 5: Configure Ingress

```bash
# Update domain names in infrastructure/kubernetes/ingress.yaml
# Apply ingress
kubectl apply -f infrastructure/kubernetes/ingress.yaml

# Get Ingress IP
kubectl get ingress -n sentinel

# Update DNS records pointing to Ingress IP
```

### Step 6: Set up Monitoring

```bash
# Deploy Prometheus
kubectl apply -f infrastructure/kubernetes/prometheus.yaml

# Deploy Grafana
kubectl apply -f infrastructure/kubernetes/grafana.yaml

# Access Grafana
kubectl port-forward -n sentinel svc/grafana 3001:3000
# Visit http://localhost:3001
```

---

## Database Setup

### PostgreSQL Initialization

```bash
# Connect to PostgreSQL
PGPASSWORD=<your_password> psql -h <postgres_host> -U sentinel_user -d sentinel_shield

# Run initialization script
\i database/init.sql

# Verify tables
\dt

# Check RLS policies
\dP
```

### Database Backups

```bash
# Manual backup
pg_dump -h <host> -U sentinel_user sentinel_shield > backup.sql

# Automated backup (use Kubernetes CronJob)
kubectl apply -f infrastructure/kubernetes/backup-cronjob.yaml
```

### Database Migrations

```bash
# If using Alembic migrations
alembic upgrade head

# Verify migrations
alembic current
```

---

## Environment Configuration

### Development (.env)
```bash
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=postgresql://user:pass@localhost:5432/sentinel_shield
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=dev_secret_key_change_in_production
```

### Staging
```bash
ENVIRONMENT=staging
DEBUG=false
DATABASE_URL=postgresql://user:pass@postgres.staging.rds.amazonaws.com:5432/sentinel_shield
REDIS_URL=redis://redis.staging.cache.amazonaws.com:6379
JWT_SECRET_KEY=$(openssl rand -base64 32)
```

### Production
```bash
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql://user:pass@postgres.prod.rds.amazonaws.com:5432/sentinel_shield
REDIS_URL=redis://redis.prod.cache.amazonaws.com:6379
JWT_SECRET_KEY=$(openssl rand -base64 32)
ENABLE_AUTO_BLOCK=true
```

---

## Scaling & Auto-Scaling

### Horizontal Pod Autoscaling

```bash
# Apply HPA configuration
kubectl apply -f infrastructure/kubernetes/hpa.yaml

# Monitor HPA
kubectl get hpa -n sentinel

# Check scaling activity
kubectl describe hpa backend -n sentinel
```

### Manual Scaling

```bash
# Scale backend to 5 replicas
kubectl scale deployment/backend --replicas=5 -n sentinel

# Scale frontend to 3 replicas
kubectl scale deployment/frontend --replicas=3 -n sentinel
```

---

## Monitoring & Logging

### View Application Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n sentinel

# Frontend logs
kubectl logs -f deployment/frontend -n sentinel

# All pod logs
kubectl logs -f -l app=backend -n sentinel
```

### Access Monitoring Dashboard

```bash
# Port forward to Grafana
kubectl port-forward -n sentinel svc/grafana 3001:3000

# Port forward to Prometheus
kubectl port-forward -n sentinel svc/prometheus 9090:9090
```

### Custom Alerts

Edit `infrastructure/alert_rules.yml` to customize alert thresholds:

```yaml
- alert: BackendHighCPU
  expr: cpu_usage > 0.8
  for: 5m
```

---

## Health Checks & Monitoring

### API Health Check

```bash
curl https://api.sentinelshield.ai/health
```

Expected Response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "environment": "production"
}
```

### Database Connectivity

```bash
kubectl exec -it deployment/backend -n sentinel -- \
  python -c "import sqlalchemy; print('DB OK')"
```

### Redis Connectivity

```bash
kubectl exec -it deployment/backend -n sentinel -- \
  redis-cli -h redis ping
```

---

## Disaster Recovery

### Backup Strategy

1. **Database Backups**: Daily snapshots + hourly WAL archiving
2. **Configuration Backups**: Version controlled in Git
3. **Secret Backups**: Encrypted backups of JWT secrets

### Restore Procedure

```bash
# Restore from backup
PGPASSWORD=<pass> psql -h <host> -U sentinel_user sentinel_shield < backup.sql

# Verify restore
SELECT COUNT(*) FROM organizations;

# Redeploy application
kubectl rollout restart deployment/backend -n sentinel
```

---

## Zero-Trust Security Configuration

### Network Policies

```bash
# Apply network policies
kubectl apply -f infrastructure/kubernetes/network-policies.yaml

# Verify policies
kubectl get networkpolicies -n sentinel
```

### RBAC Configuration

```bash
# Apply RBAC rules
kubectl apply -f infrastructure/kubernetes/rbac.yaml

# Check roles
kubectl get roles,rolebindings -n sentinel
```

---

## SSL/TLS Certificates

### Using Let's Encrypt with cert-manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f infrastructure/kubernetes/cert-issuer.yaml

# Ingress automatically provisions certificates (see ingress.yaml)
```

### Verify Certificates

```bash
kubectl get certificate -n sentinel
kubectl describe certificate sentinel-tls-secret -n sentinel
```

---

## Performance Tuning

### PostgreSQL Connection Pool

```
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
```

### Application Settings

```env
SQLALCHEMY_POOL_SIZE=20
SQLALCHEMY_MAX_OVERFLOW=40
REDIS_POOL_SIZE=50
```

### Resource Requests/Limits

Adjust in `deployments.yaml` based on load testing:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

---

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod_name> -n sentinel

# Check events
kubectl get events -n sentinel --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod_name> -n sentinel
```

### Database Connection Issues

```bash
# Test PostgreSQL from pod
kubectl exec -it <pod_name> -n sentinel -- \
  psql -h postgres -U sentinel_user -d sentinel_shield -c "SELECT 1"
```

### Performance Issues

```bash
# Check CPU/Memory usage
kubectl top pods -n sentinel

# Check HPA status
kubectl get hpa -n sentinel
kubectl describe hpa backend -n sentinel
```

---

## Maintenance Windows

### Schedule Maintenance

```bash
# Create maintenance window
kubectl patch ingress sentinel-ingress -n sentinel \
  --type merge -p '{"spec":{"rules":[{"http":{"paths":[{"path":"/maintenance","backend":{"serviceName":"maintenance-page","servicePort":"80"}}]}}]}}'
```

### Drain Node (for updates)

```bash
# Cordon node (prevent new pods)
kubectl cordon <node-name>

# Drain workloads
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Perform maintenance...

# Uncordon node
kubectl uncordon <node-name>
```

---

## Support & Documentation

- API Documentation: https://api.sentinelshield.ai/docs
- Architecture Docs: [ARCHITECTURE.md](./ARCHITECTURE.md)
- GitHub Issues: https://github.com/sentinelshield-ai/sentinelshield/issues
- Email Support: support@sentinelshield.ai
