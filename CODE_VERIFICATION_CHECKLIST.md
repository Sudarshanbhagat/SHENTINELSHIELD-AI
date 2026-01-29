# 🔍 Code Verification - What You Should See

## Verify Signup Page (`frontend/app/signup/page.tsx`)

**At the top, should have:**
```typescript
import { API_ENDPOINTS } from '@/config/api';
```

**In handleSubmit function, should have:**
```typescript
const response = await fetch(API_ENDPOINTS.auth.register, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: formData.email,
    password: formData.password,
    full_name: formData.fullName,
  }),
});

const data = await response.json();

if (!response.ok) {
  const errorMessage = data.detail || data.message || data.error || 'Signup failed';
  setError(errorMessage);
  return;
}

if (data.access_token) {
  setToken(data.access_token);
  localStorage.setItem('tokenType', data.token_type || 'bearer');
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  router.push('/dashboard');  // ← Redirect on success
}
```

✅ **Check:**
- [ ] Imports `API_ENDPOINTS`
- [ ] Uses `API_ENDPOINTS.auth.register` (not hardcoded URL)
- [ ] Has `if (!response.ok)` error handling
- [ ] Shows error message from `data.detail`
- [ ] Calls `setToken(data.access_token)`
- [ ] Calls `router.push('/dashboard')` on success

---

## Verify Login Page (`frontend/app/login/page.tsx`)

**At the top, should have:**
```typescript
import { API_ENDPOINTS } from '@/config/api';
```

**In handleSubmit function, should have:**
```typescript
const formData = new FormData();
formData.append('username', email);
formData.append('password', password);

const response = await fetch(API_ENDPOINTS.auth.login, {
  method: 'POST',
  body: formData,
});

const data = await response.json();

if (!response.ok) {
  setError(data.detail || 'Login failed');
  return;
}

const token = data.access_token;
if (!token) {
  setError('No token received');
  return;
}

setToken(token);
localStorage.setItem('tokenType', data.token_type || 'bearer');
if (data.user) {
  localStorage.setItem('user', JSON.stringify(data.user));
}

router.push('/dashboard');  // ← Redirect on success
```

✅ **Check:**
- [ ] Imports `API_ENDPOINTS`
- [ ] Uses `API_ENDPOINTS.auth.login` (not hardcoded URL)
- [ ] Uses FormData (not JSON)
- [ ] Uses 'username' field (not 'email')
- [ ] Has error handling
- [ ] Calls `setToken(token)`
- [ ] Calls `router.push('/dashboard')` on success

---

## Verify API Config (`frontend/config/api.ts`)

**Should look like:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/token`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/users/me`,
  },
  health: `${API_BASE_URL}/health`,
};
```

✅ **Check:**
- [ ] File exists at `frontend/config/api.ts`
- [ ] Defines `API_BASE_URL`
- [ ] Uses `process.env.NEXT_PUBLIC_API_URL` for production
- [ ] Falls back to `http://localhost:8000` for development
- [ ] Exports `API_ENDPOINTS` object
- [ ] Has `auth.register` endpoint
- [ ] Has `auth.login` endpoint

---

## Verify Auth Provider (`frontend/components/AuthProvider.tsx`)

**Should look like:**
```typescript
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const token = getToken();
    
    if (token) {
      console.log('✅ User session restored from localStorage');
    } else {
      console.log('❌ No active session found - user not authenticated');
    }

    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return <>{children}</>;
  }

  return <>{children}</>;
};
```

✅ **Check:**
- [ ] Is a 'use client' component
- [ ] Imports `getToken` from `@/lib/auth`
- [ ] Has `useEffect` hook
- [ ] Calls `getToken()` to check localStorage
- [ ] Logs appropriate message
- [ ] Sets `isHydrated` state
- [ ] Prevents hydration mismatch

---

## Verify Layout (`frontend/app/layout.tsx`)

**Should look like:**
```typescript
import './styles/globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'SentinelShield AI - Threat Detection',
  description: 'Real-time cybersecurity threat detection using behavioral AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-slate-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

✅ **Check:**
- [ ] Imports `AuthProvider`
- [ ] Wraps children with `<AuthProvider>`
- [ ] AuthProvider wraps around all pages

---

## Verify Backend Router (`backend/app/routers/auth.py`)

**Top of file should have:**
```python
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)
```

**Should have register endpoint:**
```python
@router.post("/register")
async def register(
    email: str,
    password: str,
    full_name: str,
    db: Session = Depends(get_db)
):
    # Implementation...
```

**Should have login endpoint:**
```python
@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Implementation...
```

✅ **Check:**
- [ ] Router has `prefix="/auth"`
- [ ] Has `@router.post("/register")` endpoint
- [ ] Has `@router.post("/token")` endpoint
- [ ] Both endpoints return `access_token`

---

## Verify Backend Main (`backend/app/main.py`)

**Around line 90, should have:**
```python
from app.routers import auth_router

app.include_router(auth_router)
```

✅ **Check:**
- [ ] Imports `auth_router` from `app.routers`
- [ ] Calls `app.include_router(auth_router)`
- [ ] No syntax errors

---

## Quick Endpoint Verification

### Test From Browser Console (F12)

**Test 1: Check if backend is running**
```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(d => console.log('Backend OK:', d))
  .catch(e => console.error('Backend offline:', e))
```

**Expected output:**
```
Backend OK: {status: 'healthy', version: '2.0.0', ...}
```

**Test 2: Check if signup endpoint exists**
```javascript
fetch('http://localhost:8000/auth/register')
  .catch(e => console.log('Testing auth/register endpoint - should fail with POST:', e))
```

**Test 3: Try a real signup**
```javascript
fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'TestPass123!',
    full_name: 'Test User'
  })
})
  .then(r => r.json())
  .then(d => {
    console.log('Response:', d);
    if (d.access_token) {
      console.log('✅ SUCCESS! Token:', d.access_token.substring(0, 20) + '...');
    } else {
      console.log('❌ Error:', d.detail);
    }
  })
  .catch(e => console.error('Network error:', e))
```

---

## Summary Checklist

**Files that should exist:**
- [ ] `frontend/config/api.ts` ← API configuration
- [ ] `frontend/app/signup/page.tsx` ← Updated signup
- [ ] `frontend/app/login/page.tsx` ← Updated login
- [ ] `frontend/components/AuthProvider.tsx` ← Session persistence
- [ ] `frontend/app/layout.tsx` ← Uses AuthProvider
- [ ] `frontend/lib/auth.ts` ← Token utilities
- [ ] `backend/app/routers/auth.py` ← Auth endpoints
- [ ] `backend/app/routers/__init__.py` ← Exports router
- [ ] `backend/app/main.py` ← Imports router

**Code that should exist in each file:**
- [ ] Signup imports `API_ENDPOINTS`
- [ ] Login imports `API_ENDPOINTS`
- [ ] Both use `API_ENDPOINTS` not hardcoded URLs
- [ ] Both have error handling
- [ ] Both call `setToken()` on success
- [ ] Both call `router.push()` on success
- [ ] AuthProvider checks localStorage
- [ ] AuthProvider prevents hydration mismatch
- [ ] Backend has `/auth` prefix
- [ ] Backend has `/auth/register` endpoint
- [ ] Backend has `/auth/token` endpoint
- [ ] Main.py imports and includes auth_router

---

✅ **If all checks pass, you're ready to test!**
