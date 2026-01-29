# Kubernetes Manifests for SentinelShield AI

This directory contains Kubernetes deployment configurations for multi-tenant SaaS on Kubernetes.

## Files

- `namespace.yaml` - Kubernetes namespace for SentinelShield
- `configmap.yaml` - Application configuration
- `secrets.yaml` - Sensitive credentials
- `backend-deployment.yaml` - FastAPI backend deployment
- `frontend-deployment.yaml` - Next.js frontend deployment
- `database-statefulset.yaml` - PostgreSQL database
- `redis-deployment.yaml` - Redis cache
- `service.yaml` - Kubernetes services
- `ingress.yaml` - Ingress configuration
- `hpa.yaml` - Horizontal Pod Autoscaling

## Deployment

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Create secrets (update values first!)
kubectl apply -f secrets.yaml

# Create configmaps
kubectl apply -f configmap.yaml

# Deploy all resources
kubectl apply -f .

# Check status
kubectl get all -n sentinel
```
