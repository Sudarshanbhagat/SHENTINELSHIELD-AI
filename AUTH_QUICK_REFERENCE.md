# 🎯 Quick Reference Card

## Backend Endpoints

| Method | Path | What It Does |
|--------|------|-------------|
| POST | `/auth/register` | Create account (signup) |
| POST | `/auth/token` | Login with email & password |
| GET | `/health` | Check if backend is running |
| GET | `/` | Welcome message |

**Base URL:** `http://localhost:8000`

---

## Frontend Pages

| Path | What It Does |
|------|-------------|
| `/signup` | Create new account |
| `/login` | Sign in to existing account |
| `/dashboard` | Main app (requires login) |

**Base URL:** `http://localhost:3000`

---

## How to Sign Up

**What frontend sends:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**What backend returns:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "...", "email": "...", "full_name": "..." }
}
```

**What frontend does:**
1. Saves token to localStorage
2. Redirects to `/dashboard`
3. AuthProvider keeps you logged in after refresh

---

## How to Login

**What frontend sends (FormData):**
```
username=user@example.com
password=SecurePass123!
```

**What backend returns:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "...", "email": "...", "full_name": "..." }
}
```

**What frontend does:**
1. Saves token to localStorage
2. Redirects to `/dashboard`

---

## localStorage After Login

```javascript
localStorage.getItem('token')     // "eyJ..." (JWT token)
localStorage.getItem('tokenType') // "bearer"
localStorage.getItem('user')      // "{\"id\":\"...\",\"email\":\"...\",\"full_name\":\"...\"}"
```

---

## Session Persistence

**On page load:**
- AuthProvider checks localStorage for 'token'
- If token exists → User stays logged in
- If token missing → User sees login page

**On page refresh:**
- Token is restored from localStorage
- No need to login again

**On logout:**
- Token is removed from localStorage
- User is redirected to `/login`

---

## Test Commands

### Check Backend Health
```bash
curl http://localhost:8000/health
```

### Test Signup
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "full_name": "Test User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=TestPass123!"
```

---

## Troubleshooting Map

| Problem | First Check | Second Check | Fix |
|---------|-----------|-------------|-----|
| 404 on signup | Backend running? | auth_router imported? | Restart backend |
| CORS error | CORSMiddleware in main.py? | Allows localhost:3000? | Add to allow_origins |
| Failed to fetch | Backend on 8000? | Frontend on 3000? | Start both servers |
| Token not saving | Response has access_token? | setToken() called? | Check for JS errors |
| Won't redirect | Response status 200? | router.push() in code? | Check browser console |
| Stays logged out | Token in localStorage? | AuthProvider working? | Refresh page |

---

## Files You Need

**Backend:**
- ✅ `backend/app/main.py` (imports auth_router)
- ✅ `backend/app/routers/auth.py` (endpoints)
- ✅ `backend/app/routers/__init__.py` (exports)

**Frontend:**
- ✅ `app/signup/page.tsx` (signup form)
- ✅ `app/login/page.tsx` (login form)
- ✅ `components/AuthProvider.tsx` (persistence)
- ✅ `lib/auth.ts` (token utilities)

---

## Success Checklist

- [ ] Both servers running
- [ ] Can signup without 404
- [ ] Token in localStorage
- [ ] Redirects to dashboard
- [ ] Refresh keeps you logged in
- [ ] Can login with credentials
- [ ] Logout clears token

---

## Key Code Patterns

### In Signup Page
```typescript
import { setToken } from '@/lib/auth';

const response = await fetch('http://localhost:8000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, full_name })
});

if (response.ok) {
  const data = await response.json();
  setToken(data.access_token);
  router.push('/dashboard');
}
```

### In Login Page
```typescript
import { setToken } from '@/lib/auth';

const formData = new FormData();
formData.append('username', email);
formData.append('password', password);

const response = await fetch('http://localhost:8000/auth/token', {
  method: 'POST',
  body: formData
});

if (response.ok) {
  const data = await response.json();
  setToken(data.access_token);
  router.push('/dashboard');
}
```

### In AuthProvider
```typescript
import { getToken } from '@/lib/auth';

useEffect(() => {
  const token = getToken();
  if (token) {
    // User is logged in - stay on dashboard
  } else {
    // User is not logged in - can see public pages
  }
  setIsHydrated(true);
}, []);
```

---

## Common Errors & What They Mean

| Error | Cause |
|-------|-------|
| `GET 404 /auth/register` | Endpoint doesn't exist - backend issue |
| `TypeError: Failed to fetch` | Backend not running or connection refused |
| `CORS error: blocked` | Browser blocking cross-origin request - CORS not configured |
| `400 Email already registered` | User exists - use different email |
| `401 Incorrect email or password` | Wrong credentials - check password |
| `422 Unprocessable Entity` | Validation failed - check input format |

---

## Next Steps

1. ✅ Verify both servers running
2. ✅ Test `/health` endpoint
3. ✅ Try signup form
4. ✅ Check token in localStorage
5. ✅ Refresh page (test persistence)
6. ✅ Test login form
7. ✅ Test logout

**That's it! You're done.** 🚀
