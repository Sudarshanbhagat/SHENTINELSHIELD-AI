# SentinelShield AI - Complete Authentication Flow

## Overview

This authentication system provides a complete OAuth2-compatible JWT flow for SentinelShield AI v2.0 with persistent login, automatic session restoration, and secure token management.

## Architecture

```
User Login/Signup
       ↓
FastAPI OAuth2 Endpoint (/auth/token, /auth/register)
       ↓
localStorage.setItem('token', access_token)
       ↓
AuthProvider (App Load) → Persistent Session Check
       ↓
Protected Routes (useAuthProtected hook)
       ↓
API Requests with Bearer Token
```

## Files Overview

### 1. **lib/auth.ts** - Core Authentication Utilities

Provides token management functions:

```typescript
// Get token from localStorage
const token = getToken();

// Save token to localStorage
setToken(accessToken);

// Remove token and cleanup
removeToken();

// Check if user is authenticated
const isAuth = isAuthenticated();

// Logout and redirect
await logout(router);
```

### 2. **hooks/useAuth.ts** - React Hooks for Auth State

#### `useAuth()`
Basic hook to get current authentication state:

```typescript
const { token, isAuthenticated, isLoading } = useAuth();
```

#### `useAuthProtected(redirectToLogin = true)`
Hook that protects routes - automatically redirects to `/login` if no token:

```typescript
export default function ProtectedPage() {
  const { token, isLoading } = useAuthProtected();
  
  if (isLoading) return <LoadingSpinner />;
  
  return <Dashboard />;
}
```

### 3. **components/AuthProvider.tsx** - App-Level Auth Check

Wraps your entire app to check for persistent login on app load:

```typescript
// Automatically restores session from localStorage
// Logs auth status to console
```

Integrated in `app/layout.tsx`:

```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### 4. **components/LogoutButton.tsx** - Logout UI Component

Ready-to-use logout button:

```typescript
import { LogoutButton } from '@/components/LogoutButton';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <LogoutButton />
    </div>
  );
}
```

### 5. **app/login/page.tsx** - Login Form

Features:
- Email/password form (sends as `FormData` for OAuth2PasswordRequestForm)
- Saves `data.access_token` to localStorage with key `'token'`
- Redirects to `/dashboard` on success
- Error handling and loading state
- Links to signup page

Technical Details:
```typescript
// Prepare form data for FastAPI OAuth2
const formData = new FormData();
formData.append('username', email); // FastAPI expects 'username'
formData.append('password', password);

// Fetch to backend
const response = await fetch('http://localhost:8000/auth/token', {
  method: 'POST',
  body: formData, // application/x-www-form-urlencoded
});

const data = await response.json();
setToken(data.access_token); // Saves to localStorage
```

### 6. **app/signup/page.tsx** - Registration Form

Features:
- Full name, email, password fields
- Real-time password validation (12+ chars, uppercase, number, special)
- Confirm password matching
- Sends JSON to `/auth/register`
- Auto-login if backend returns token
- Otherwise redirects to `/login`

Request Format:
```typescript
const response = await fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: formData.email,
    password: formData.password,
    full_name: formData.fullName,
  }),
});
```

## localStorage Structure

```javascript
// After successful login/signup:
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIs...'); // JWT access token
localStorage.setItem('tokenType', 'bearer');
localStorage.setItem('user', JSON.stringify({ id: '123', email: 'user@example.com' }));

// After logout:
// All items are removed via removeItem()
```

## Using Auth in API Calls

```typescript
'use client';

import { getToken } from '@/lib/auth';

export default function MyPage() {
  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      
      const response = await fetch('http://localhost:8000/api/endpoint', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
    };
  }, []);
}
```

## Protected Route Example

```typescript
'use client';

import { useAuthProtected } from '@/hooks/useAuth';
import { LogoutButton } from '@/components/LogoutButton';

export default function DashboardPage() {
  const { token, isLoading } = useAuthProtected();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <LogoutButton />
    </div>
  );
}
```

## Backend Expectations

### POST /auth/token (Login)

**Request:**
- Method: `POST`
- Content-Type: `application/x-www-form-urlencoded`
- Body: `username=email@example.com&password=MyPassword123!`

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### POST /auth/register (Signup)

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:
```json
{
  "email": "user@example.com",
  "password": "MyPassword123!",
  "full_name": "John Doe"
}
```

**Response (with auto-login):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

**Response (without auto-login):**
```json
{
  "message": "User created successfully",
  "email": "user@example.com"
}
```

## FastAPI Backend Example

```python
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/auth/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Verify credentials
    user = verify_user(form_data.username, form_data.password)
    
    # Generate JWT token
    token = create_access_token(user.id)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
        }
    }

@app.post("/auth/register")
async def register(email: str, password: str, full_name: str):
    # Create user
    user = create_user(email, password, full_name)
    
    # Optional: Auto-login by returning token
    token = create_access_token(user.id)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
        }
    }

@app.get("/api/protected")
async def protected_endpoint(token: str = Depends(oauth2_scheme)):
    # Verify token
    payload = verify_token(token)
    return {"message": f"Hello {payload.sub}"}
```

## Key Features

✅ **Persistent Login** - Session restored automatically on app load
✅ **OAuth2 Compatible** - Works with FastAPI's OAuth2PasswordRequestForm
✅ **FormData for Login** - Sends `application/x-www-form-urlencoded` format
✅ **JSON for Signup** - Sends `application/json` format
✅ **Bearer Token** - All API calls include `Authorization: Bearer {token}`
✅ **Auto Logout** - `removeItem('token')` + redirect to `/login`
✅ **Loading States** - `useAuthProtected` handles isLoading
✅ **TypeScript Ready** - Full type support for all utilities
✅ **Hydration Safe** - AuthProvider prevents hydration mismatches

## Testing the Flow

### 1. Test Signup
```bash
curl -X POST http://localhost:3000/signup
# Fill form and submit
# Verify: Token appears in localStorage
# Verify: Redirects to /login or /dashboard
```

### 2. Test Login
```bash
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=TestPass123!"

# Frontend will save token and redirect to /dashboard
```

### 3. Test Persistence
```javascript
// In browser console:
localStorage.getItem('token') // Should show JWT
localStorage.getItem('tokenType') // Should be "bearer"

// Refresh page
// User should remain logged in
```

### 4. Test Logout
```typescript
// In any protected page:
import { LogoutButton } from '@/components/LogoutButton';

// Click button
// localStorage cleared
// Redirect to /login
```

## Troubleshooting

**Issue: Redirect to /login on every page load**
- Check: Is `AuthProvider` wrapping your app in `layout.tsx`?
- Check: Is token being saved correctly? `localStorage.getItem('token')`
- Check: Is backend returning `access_token` field?

**Issue: CORS error on login**
- Backend needs: `from fastapi.middleware.cors import CORSMiddleware`
- Add: `app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])`

**Issue: "No token received from server"**
- Verify backend returns JSON with `access_token` field
- Check Network tab in DevTools

**Issue: FormData not working**
- Ensure login sends as FormData, not JSON
- Ensure signup sends as JSON, not FormData
- FastAPI's `OAuth2PasswordRequestForm` requires FormData format

## Security Best Practices

1. **HTTPS in Production** - Never send tokens over HTTP
2. **HttpOnly Cookies** - Consider moving from localStorage to HttpOnly cookies
3. **Token Expiry** - Implement refresh token rotation
4. **CSRF Protection** - Add CSRF tokens if using cookies
5. **XSS Prevention** - Sanitize all user inputs
6. **Rate Limiting** - Implement on login endpoint to prevent brute force

## Next Steps

1. Implement backend endpoints:
   - POST /auth/register
   - POST /auth/token
   - GET /api/protected (verify token)

2. Add refresh token logic:
   - Store refresh_token in localStorage
   - Auto-refresh access_token before expiry

3. Implement email verification:
   - Send verification email on signup
   - Verify email before allowing login

4. Add password reset:
   - POST /auth/forgot-password
   - POST /auth/reset-password

5. Move to secure cookies:
   - Replace localStorage with HttpOnly cookies
   - Implement CSRF protection
