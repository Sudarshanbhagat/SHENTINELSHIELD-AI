# Request/Response Examples - SentinelShield AI Authentication

Use this file for testing authentication endpoints with tools like Postman, Insomnia, or curl.

## 1. Register User (Signup)

### Request

```http
POST http://localhost:8000/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

### cURL Command

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "full_name": "John Doe"
  }'
```

### PowerShell

```powershell
$body = @{
    email = "john@example.com"
    password = "SecurePass123!"
    full_name = "John Doe"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Expected Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTZlMmY2NjczN2YzZDM2MzQ2ZjY0NjU2YzI2MzU1NCIsImV4cCI6MTcwMzEwMzIwMH0.Z5X9mK2pL8qW3nZ8vF5gH6jK1lM9oP0qR2sT3uV4wX5",
  "token_type": "bearer",
  "user": {
    "id": "456e2f667337f3d3636f646e6c265554",
    "email": "john@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "created_at": "2024-01-29T10:00:00"
  }
}
```

### Error Response (400 - Email Already Exists)

```json
{
  "detail": "Email already registered"
}
```

---

## 2. Login User

### Request (FormData)

```http
POST http://localhost:8000/auth/token
Content-Type: application/x-www-form-urlencoded

username=john@example.com&password=SecurePass123!
```

### cURL Command

```bash
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john@example.com&password=SecurePass123!"
```

### PowerShell

```powershell
$body = "username=john@example.com&password=SecurePass123!"

Invoke-WebRequest -Uri "http://localhost:8000/auth/token" `
  -Method POST `
  -ContentType "application/x-www-form-urlencoded" `
  -Body $body
```

### JavaScript/Fetch (Frontend Example)

```javascript
const formData = new FormData();
formData.append('username', 'john@example.com');
formData.append('password', 'SecurePass123!');

const response = await fetch('http://localhost:8000/auth/token', {
  method: 'POST',
  body: formData, // Automatically becomes application/x-www-form-urlencoded
});

const data = await response.json();
console.log(data.access_token);
```

### Expected Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTZlMmY2NjczN2YzZDM2MzY0ZjY0NmM2ZTZkMjY2ZjY0NmM3YyIsImV4cCI6MTcwMzEwMzIwMH0.aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4",
  "token_type": "bearer",
  "user": {
    "id": "456e2f667337f3d3636f646e6c265554",
    "email": "john@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "created_at": "2024-01-29T10:00:00"
  }
}
```

### Error Response (401 - Wrong Credentials)

```json
{
  "detail": "Incorrect email or password"
}
```

---

## 3. Get Current User (Protected Endpoint)

### Request

```http
GET http://localhost:8000/auth/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTZlMmY2NjczN2YzZDM2MzY0ZjY0NmM2ZTZkMjY2ZjY0NmM3YyIsImV4cCI6MTcwMzEwMzIwMH0.aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4
```

### cURL Command

```bash
curl -X GET http://localhost:8000/auth/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTZlMmY2NjczN2YzZDM2MzY0ZjY0NmM2ZTZkMjY2ZjY0NmM3YyIsImV4cCI6MTcwMzEwMzIwMH0.aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4"
```

### PowerShell

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTZlMmY2NjczN2YzZDM2MzY0ZjY0NmM2ZTZkMjY2ZjY0NmM3YyIsImV4cCI6MTcwMzEwMzIwMH0.aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4"

Invoke-WebRequest -Uri "http://localhost:8000/auth/users/me" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### JavaScript/Fetch (Frontend Example)

```javascript
import { getToken } from '@/lib/auth';

const token = getToken();

const response = await fetch('http://localhost:8000/auth/users/me', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const userData = await response.json();
console.log(userData);
```

### Expected Response (200 OK)

```json
{
  "id": "456e2f667337f3d3636f646e6c265554",
  "email": "john@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2024-01-29T10:00:00"
}
```

### Error Response (401 - Missing/Invalid Token)

```json
{
  "detail": "Invalid token"
}
```

```json
{
  "detail": "Missing or invalid authorization header"
}
```

---

## 4. Update User Profile (Protected Endpoint)

### Request

```http
PATCH http://localhost:8000/auth/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTZlMmY2NjczN2YzZDM2MzY0ZjY0NmM2ZTZkMjY2ZjY0NmM3YyIsImV4cCI6MTcwMzEwMzIwMH0.aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4
Content-Type: application/json

{
  "full_name": "John Updated Doe"
}
```

### cURL Command

```bash
curl -X PATCH http://localhost:8000/auth/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTZlMmY2NjczN2YzZDM2MzY0ZjY0NmM2ZTZkMjY2ZjY0NmM3YyIsImV4cCI6MTcwMzEwMzIwMH0.aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "John Updated Doe"}'
```

### PowerShell

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTZlMmY2NjczN2YzZDM2MzY0ZjY0NmM2ZTZkMjY2ZjY0NmM3YyIsImV4cCI6MTcwMzEwMzIwMH0.aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4"
$body = @{ full_name = "John Updated Doe" } | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/auth/users/me" `
  -Method PATCH `
  -ContentType "application/json" `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -Body $body
```

### JavaScript/Fetch (Frontend Example)

```javascript
import { getToken } from '@/lib/auth';

const token = getToken();

const response = await fetch('http://localhost:8000/auth/users/me', {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    full_name: 'John Updated Doe',
  }),
});

const updatedUser = await response.json();
console.log(updatedUser);
```

### Expected Response (200 OK)

```json
{
  "id": "456e2f667337f3d3636f646e6c265554",
  "email": "john@example.com",
  "full_name": "John Updated Doe",
  "is_active": true,
  "created_at": "2024-01-29T10:00:00"
}
```

---

## Testing Workflow

### Step 1: Register a User
```bash
# PowerShell
$body = @{
    email = "testuser@example.com"
    password = "TestPassword123!"
    full_name = "Test User"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$data = $response.Content | ConvertFrom-Json
$token = $data.access_token
Write-Host "Token: $token"
```

### Step 2: Use Token to Call Protected Endpoint
```bash
# PowerShell
$token = "YOUR_TOKEN_HERE"

Invoke-WebRequest -Uri "http://localhost:8000/auth/users/me" `
  -Method GET `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### Step 3: Verify Token is in Browser
```javascript
// In browser console after login
localStorage.getItem('token')
// Should output: "eyJhbGciOiJIUzI1NiIs..."
```

---

## Token Decoding (JWT)

To decode and view token contents, use https://jwt.io

Paste the token you get from login/register response.

You'll see:
```json
{
  "sub": "456e2f667337f3d3636f646e6c265554",  // user ID
  "exp": 1703103200                            // expiration time
}
```

---

## Common Testing Scenarios

### Scenario 1: New User Registration
```
1. POST /auth/register with new email
2. Get access_token in response
3. Save token to localStorage
4. Use token for subsequent requests
```

### Scenario 2: Login with Existing User
```
1. POST /auth/token with email and password (FormData)
2. Get access_token in response
3. Save token to localStorage
4. Use token for subsequent requests
```

### Scenario 3: Update User Profile
```
1. Get current token from localStorage
2. PATCH /auth/users/me with updated fields
3. Get updated user object in response
4. Verify changes reflected
```

### Scenario 4: Unauthorized Access
```
1. Try GET /auth/users/me without Authorization header
2. Get 401 Unauthorized response
3. Frontend redirects to /login
```

### Scenario 5: Invalid Token
```
1. Try GET /auth/users/me with invalid/expired token
2. Get 401 Unauthorized response
3. Frontend should re-authenticate
```

---

## Notes for Backend Implementation

When building the backend:

### For /auth/register:
- Validate email format (unique + valid)
- Validate password strength (12+ chars, uppercase, number, special)
- Hash password with bcrypt before storing
- Return access_token (JWT) with auto-login
- Include user object in response

### For /auth/token:
- Accept FormData with `username` (email) and `password`
- Query user by email
- Verify password against hash
- Return access_token (JWT)
- Include user object in response
- Use OAuth2PasswordRequestForm from FastAPI

### For Protected Endpoints:
- Accept Authorization header: `Bearer {token}`
- Decode JWT and verify signature
- Extract user_id from token
- Query user from database
- Return 401 if token invalid/expired
- Return user data or protected resource

---

## Security Reminders

✅ **Always Hash Passwords**
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"])
hashed = pwd_context.hash(password)
```

✅ **Use HTTPS in Production**
- Never send tokens over HTTP
- Always use SSL/TLS certificates

✅ **Set Appropriate Token Expiry**
```python
access_token_expire_minutes = 30  # 30 minutes
```

✅ **Validate All Inputs**
- Email format
- Password strength
- Length limits

✅ **Use Secure Secret Key**
```python
secret_key = "your-very-long-random-secret-key-minimum-32-chars"
```

✅ **Enable CORS Only for Your Frontend**
```python
allow_origins=["http://localhost:3000"]  # Not "*"
```

✅ **Log Authentication Events**
- Track failed login attempts
- Monitor for brute force attacks
- Log user actions for audit trail
