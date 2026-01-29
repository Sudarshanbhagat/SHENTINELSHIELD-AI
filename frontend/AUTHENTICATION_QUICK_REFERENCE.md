# Quick Start: SentinelShield AI Authentication

## File Structure Created

```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout with AuthProvider
│   ├── login/
│   │   └── page.tsx                  # Login form
│   ├── signup/
│   │   └── page.tsx                  # Signup form
│   └── dashboard/
│       └── layout.tsx                # Protected dashboard layout
├── lib/
│   └── auth.ts                       # Token management utilities
├── hooks/
│   └── useAuth.ts                    # useAuth & useAuthProtected hooks
├── components/
│   ├── AuthProvider.tsx              # App-level auth check component
│   └── LogoutButton.tsx              # Logout UI component
└── AUTHENTICATION_GUIDE.md           # Complete documentation
```

## Quick Reference

### 1. Check if User is Logged In
```typescript
import { getToken, isAuthenticated } from '@/lib/auth';

// Option A: Get the token
const token = getToken(); // Returns string | null

// Option B: Check auth status
if (isAuthenticated()) {
  // User is logged in
}
```

### 2. Save Token After Login
```typescript
import { setToken } from '@/lib/auth';

// In login handler:
const response = await fetch('/auth/token', { /* ... */ });
const data = await response.json();

setToken(data.access_token); // Saves to localStorage with key 'token'
```

### 3. Use Bearer Token in API Calls
```typescript
import { getToken } from '@/lib/auth';

const token = getToken();
const response = await fetch('http://localhost:8000/api/endpoint', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### 4. Protect a Route
```typescript
'use client';

import { useAuthProtected } from '@/hooks/useAuth';

export default function ProtectedPage() {
  const { token, isLoading } = useAuthProtected();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <h1>Welcome!</h1>;
}
```

### 5. Add Logout Button
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

### 6. Manual Logout
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';

export default function Page() {
  const router = useRouter();
  
  const handleLogout = async () => {
    await logout(router);
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

## LocalStorage Keys

After successful login/signup:

```javascript
localStorage.getItem('token');        // JWT access token
localStorage.getItem('tokenType');    // "bearer"
localStorage.getItem('user');         // User object as JSON
```

After logout, all keys are removed.

## API Request Patterns

### Login (FormData - for OAuth2PasswordRequestForm)
```typescript
const formData = new FormData();
formData.append('username', email);    // FastAPI expects 'username'
formData.append('password', password);

const response = await fetch('http://localhost:8000/auth/token', {
  method: 'POST',
  body: formData,  // Automatically sends as application/x-www-form-urlencoded
});
```

### Signup (JSON)
```typescript
const response = await fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    full_name: 'John Doe',
  }),
});
```

### Protected Endpoints (Bearer Token)
```typescript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:8000/api/protected', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Expected Responses

### POST /auth/token Success
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### POST /auth/register Success (with auto-login)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user-456",
    "email": "newuser@example.com",
    "full_name": "Jane Doe"
  }
}
```

## Pages Overview

### /login
- Email/password form
- Sends: `application/x-www-form-urlencoded`
- Endpoint: `POST http://localhost:8000/auth/token`
- On success: Saves token, redirects to `/dashboard`
- Link to signup page included

### /signup
- Full name, email, password, confirm password
- Password validation: 12+ chars, uppercase, number, special
- Sends: `application/json`
- Endpoint: `POST http://localhost:8000/auth/register`
- On success: Auto-login or redirect to `/login`
- Link to login page included

### /dashboard (Protected)
- Requires valid token in localStorage
- Auto-redirects to `/login` if no token
- All child pages inherit auth protection
- Include `<LogoutButton />` to enable logout

## Testing Checklist

- [ ] Navigate to `/signup` - form loads
- [ ] Enter invalid password - validation errors show
- [ ] Enter valid data - submits to backend
- [ ] Backend returns token - saved to localStorage
- [ ] Redirected to `/dashboard` - page loads
- [ ] Refresh page - still logged in (persistent)
- [ ] Click logout - token cleared, redirected to `/login`
- [ ] Visit `/dashboard` without token - auto-redirects to `/login`
- [ ] Navigate to `/login` - form loads
- [ ] Enter credentials - submits to backend
- [ ] Backend returns token - saved to localStorage
- [ ] Redirected to `/dashboard` - page loads

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Redirect to /login on every page" | AuthProvider not in layout | Add `<AuthProvider>` to root layout |
| "No token received from server" | Backend not returning `access_token` | Check backend response format |
| "CORS error" | Backend doesn't allow localhost:3000 | Add CORS middleware to FastAPI |
| "Login fails with 422" | FormData not being sent | Ensure login uses FormData, not JSON |
| "Signup fails with 422" | JSON not being sent | Ensure signup uses JSON, not FormData |
| "Token not persisting" | localStorage not available | Check browser console for errors |

## Environment Setup

Make sure you have:

```bash
# Node.js 18+
node --version

# npm dependencies installed
cd frontend
npm install

# Next.js dev server running
npm run dev
# Server should be at http://localhost:3000
```

Backend should be running at `http://localhost:8000` with CORS enabled.

## Next: Implement Backend Endpoints

Your frontend is ready! Now implement these endpoints:

1. **POST /auth/token**
   - Accepts: FormData with `username` and `password`
   - Returns: `{access_token, token_type, user}`

2. **POST /auth/register**
   - Accepts: JSON with `email`, `password`, `full_name`
   - Returns: `{access_token, token_type, user}` or `{message, email}`

3. **Any Protected Endpoint**
   - Expects: `Authorization: Bearer {token}` header
   - Validates: JWT token
   - Returns: Protected data or 401 if invalid

See `AUTHENTICATION_GUIDE.md` for complete backend examples.
