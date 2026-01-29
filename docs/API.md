# API Reference - SentinelShield AI v2.0

## Base URL
- **Development**: `http://localhost:8000`
- **Staging**: `https://api-staging.sentinelshield.ai`
- **Production**: `https://api.sentinelshield.ai`

## Authentication

All API requests require JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Login Endpoint

**POST** `/api/v1/auth/login`

Request:
```json
{
  "email": "admin@company.com",
  "password": "SecurePassword123!"
}
```

Response (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@company.com",
    "full_name": "Admin User",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-28T10:00:00Z"
  }
}
```

### Logout Endpoint

**POST** `/api/v1/auth/logout`

Response (200 OK):
```json
{
  "message": "Successfully logged out"
}
```

---

## Threat Detection Endpoints

### Submit Threat Log

**POST** `/api/v1/threat-logs`

Request:
```json
{
  "source_ip": "192.168.1.100",
  "destination_ip": "10.0.0.1",
  "user_id": "user123",
  "action": "LOGIN_ATTEMPT",
  "resource": "/api/users",
  "method": "POST",
  "status_code": 401,
  "response_time_ms": 250,
  "user_agent": "Mozilla/5.0..."
}
```

Response (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-28T15:30:45Z",
  "source_ip": "192.168.1.100",
  "action": "LOGIN_ATTEMPT",
  "anomaly_score": 0.7234,
  "risk_score": 0.6349,
  "severity": "high",
  "is_blocked": false,
  "ai_flagged": true,
  "created_at": "2024-01-28T15:30:45Z"
}
```

### List Threat Logs

**GET** `/api/v1/threat-logs?skip=0&limit=10&severity=high`

Query Parameters:
- `skip`: Number of items to skip (default: 0)
- `limit`: Number of items to return (default: 10)
- `severity`: Filter by severity (low, medium, high, critical)
- `start_date`: Filter by start date (ISO 8601)
- `end_date`: Filter by end date (ISO 8601)

Response (200 OK):
```json
{
  "total": 1542,
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2024-01-28T15:30:45Z",
      "source_ip": "192.168.1.100",
      "action": "LOGIN_ATTEMPT",
      "anomaly_score": 0.7234,
      "risk_score": 0.6349,
      "severity": "high",
      "is_blocked": false,
      "ai_flagged": true,
      "created_at": "2024-01-28T15:30:45Z"
    }
  ]
}
```

### Get Threat Statistics

**GET** `/api/v1/threat-stats`

Response (200 OK):
```json
{
  "total_threats": 1542,
  "critical_threats": 23,
  "high_threats": 156,
  "medium_threats": 489,
  "low_threats": 874,
  "blocked_count": 45,
  "blocked_percentage": 2.92
}
```

---

## AI Feedback Endpoints

### Submit Feedback

**POST** `/api/v1/feedback`

Request:
```json
{
  "threat_log_id": "550e8400-e29b-41d4-a716-446655440000",
  "original_classification": "threat",
  "corrected_classification": "normal",
  "confidence_score": 0.95,
  "reason": "False positive - legitimate admin access"
}
```

Response (201 Created):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440111",
  "threat_log_id": "550e8400-e29b-41d4-a716-446655440000",
  "original_classification": "threat",
  "corrected_classification": "normal",
  "confidence_score": 0.95,
  "is_processed": false,
  "created_at": "2024-01-28T15:35:22Z"
}
```

### Get Feedback Statistics

**GET** `/api/v1/feedback/stats`

Response (200 OK):
```json
{
  "total_feedback": 234,
  "processed": 134,
  "unprocessed": 100,
  "correction_rate": 0.2564,
  "feedback_until_retrain": 0,
  "retraining_triggered": true
}
```

---

## Security Policy Endpoints

### Get Organization Security Policy

**GET** `/api/v1/security-policies`

Response (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440222",
  "risk_score_threshold_alert": 0.6,
  "risk_score_threshold_block": 0.8,
  "velocity_threshold": 5,
  "anomaly_sensitivity": "medium",
  "enable_auto_block": false,
  "enable_geo_blocking": false,
  "enable_ip_reputation_check": true
}
```

### Update Security Policy

**PUT** `/api/v1/security-policies`

Request:
```json
{
  "risk_score_threshold_alert": 0.55,
  "enable_auto_block": true,
  "anomaly_sensitivity": "high"
}
```

Response (200 OK):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440222",
  "risk_score_threshold_alert": 0.55,
  "enable_auto_block": true,
  "anomaly_sensitivity": "high"
}
```

---

## Audit Trail Endpoints

### List Audit Trails

**GET** `/api/v1/audit-trails?skip=0&limit=10`

Response (200 OK):
```json
{
  "total": 5432,
  "items": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440333",
      "action_type": "policy_change",
      "resource_type": "security_policy",
      "resource_id": "770e8400-e29b-41d4-a716-446655440222",
      "old_values": {
        "enable_auto_block": false
      },
      "new_values": {
        "enable_auto_block": true
      },
      "status": "success",
      "created_at": "2024-01-28T15:40:00Z"
    }
  ]
}
```

### Export Audit Trail

**GET** `/api/v1/audit-trails/export?format=csv`

Response: CSV file download

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request parameters",
  "error_code": "VALIDATION_ERROR"
}
```

### 401 Unauthorized
```json
{
  "detail": "Token has expired",
  "error_code": "TOKEN_EXPIRED"
}
```

### 403 Forbidden
```json
{
  "detail": "Only administrators can access this resource",
  "error_code": "INSUFFICIENT_PERMISSIONS"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found",
  "error_code": "NOT_FOUND"
}
```

### 429 Too Many Requests
```json
{
  "detail": "Rate limit exceeded. Please try again later.",
  "error_code": "RATE_LIMIT_EXCEEDED"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error",
  "error_code": "INTERNAL_ERROR"
}
```

---

## WebSocket Endpoints

### Real-Time Threat Stream

**WS** `/api/v1/ws/threats`

Message Format (Server → Client):
```json
{
  "type": "threat_detected",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "source_ip": "192.168.1.100",
    "risk_score": 0.85,
    "severity": "critical",
    "timestamp": "2024-01-28T15:30:45Z"
  }
}
```

---

## Rate Limiting

- **Limit**: 100 requests per 60 seconds per IP
- **Header**: `X-RateLimit-Remaining`
- **Reset**: `X-RateLimit-Reset`

---

## Versioning

API follows semantic versioning:
- Current: `v1`
- Next: `v2` (planned Q3 2025)

Breaking changes will be announced 3 months in advance.

---

## SDK Examples

### Python
```python
import requests

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

response = requests.get(
    "https://api.sentinelshield.ai/api/v1/threat-logs",
    headers=headers,
    params={"limit": 10}
)

threats = response.json()
```

### JavaScript/TypeScript
```typescript
const response = await fetch(
  'https://api.sentinelshield.ai/api/v1/threat-logs?limit=10',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const threats = await response.json();
```

### cURL
```bash
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  https://api.sentinelshield.ai/api/v1/threat-logs?limit=10
```
