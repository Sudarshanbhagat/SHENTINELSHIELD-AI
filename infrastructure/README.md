# Infrastructure - SentinelShield AI

Infrastructure-as-Code configurations for deployment on Kubernetes and cloud platforms.

## Directories

- `kubernetes/` - Kubernetes manifests for deployment on EKS/GKE/AKS
- `terraform/` - Terraform modules for AWS/GCP infrastructure provisioning
- `prometheus.yml` - Prometheus monitoring configuration
- `alert_rules.yml` - Alerting rules for monitoring

## Kubernetes Deployment

```bash
# Ensure you have a Kubernetes cluster running
# Update secrets in kubernetes/secrets.yaml

# Deploy
kubectl apply -f kubernetes/

# Check status
kubectl get all -n sentinel
```

## Features

- **High Availability**: Multi-replicas with auto-scaling
- **Load Balancing**: Ingress with automatic certificate management (Let's Encrypt)
- **Monitoring**: Prometheus + Grafana integration
- **Alerting**: Automated alerts for critical metrics
- **Zero-Trust**: Network policies and RBAC
- **Backup**: Persistent volumes with backup strategies

## Monitoring & Observability

### Prometheus
- Collects metrics from all services
- 15-second scrape interval
- Available at: `http://prometheus:9090`

### Grafana
- Dashboard visualization
- Alert management
- Available at: `http://grafana:3001`

### Alert Rules
- Backend high CPU/memory
- Database downtime
- Service failures
- Anomalous threat detection rates

## Zero-Trust Security

- Service-to-service mTLS
- Network policies restrict traffic
- RBAC for Kubernetes resources
- Secret management with encryption at rest
- Audit logging of all API access
